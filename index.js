#!/usr/bin/env node
/**
 * code-duplication — Find duplicate and near-duplicate code blocks across files.
 * Zero external dependencies. Built-in modules only.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const VERSION = '1.0.0';

// ─── ANSI Colors ─────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  white:  '\x1b[97m',
};

const noColor = !process.stdout.isTTY || process.env.NO_COLOR;
const c = (color, str) => noColor ? str : `${color}${str}${C.reset}`;

// ─── Argument Parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    dir: null,
    minLines: 6,
    threshold: 100,
    lang: null,
    exclude: ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'vendor'],
    json: false,
    summary: false,
    help: false,
    version: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--version' || arg === '-v') {
      opts.version = true;
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--summary') {
      opts.summary = true;
    } else if (arg === '--min-lines') {
      opts.minLines = parseInt(args[++i], 10);
      if (isNaN(opts.minLines) || opts.minLines < 1) {
        die('--min-lines must be a positive integer');
      }
    } else if (arg === '--threshold') {
      opts.threshold = parseInt(args[++i], 10);
      if (isNaN(opts.threshold) || opts.threshold < 1 || opts.threshold > 100) {
        die('--threshold must be an integer between 1 and 100');
      }
    } else if (arg === '--lang') {
      opts.lang = args[++i];
      if (!opts.lang) die('--lang requires a value (e.g. js,ts,py,rb)');
    } else if (arg === '--exclude') {
      const val = args[++i];
      if (!val) die('--exclude requires a value');
      opts.exclude = val.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!arg.startsWith('-')) {
      opts.dir = path.resolve(arg);
    } else {
      die(`Unknown option: ${arg}`);
    }
    i++;
  }

  return opts;
}

function die(msg) {
  process.stderr.write(`${c(C.red, 'error')}: ${msg}\n`);
  process.exit(2);
}

// ─── Language Detection ───────────────────────────────────────────────────────

const LANG_EXTENSIONS = {
  js:  ['.js', '.mjs', '.cjs'],
  ts:  ['.ts', '.tsx', '.mts', '.cts'],
  py:  ['.py', '.pyw'],
  rb:  ['.rb'],
  go:  ['.go'],
  rs:  ['.rs'],
  php: ['.php'],
  java:['.java'],
  cs:  ['.cs'],
  cpp: ['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp'],
  swift:['.swift'],
  kt:  ['.kt', '.kts'],
};

const ALL_EXTENSIONS = new Set(Object.values(LANG_EXTENSIONS).flat());

function getLangExtensions(langStr) {
  if (!langStr) return null;
  const langs = langStr.split(',').map(s => s.trim().toLowerCase());
  const exts = new Set();
  for (const lang of langs) {
    const found = LANG_EXTENSIONS[lang];
    if (!found) die(`Unknown language: ${lang}. Valid: ${Object.keys(LANG_EXTENSIONS).join(', ')}`);
    for (const e of found) exts.add(e);
  }
  return exts;
}

function isCodeFile(filePath, allowedExts) {
  const ext = path.extname(filePath).toLowerCase();
  if (allowedExts) return allowedExts.has(ext);
  return ALL_EXTENSIONS.has(ext);
}

// ─── File Collection ──────────────────────────────────────────────────────────

function collectFiles(dir, excludePatterns, allowedExts) {
  const files = [];
  const excludeSet = new Set(excludePatterns);

  function walk(current) {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (excludeSet.has(entry.name)) continue;
      // Also check partial path matches for glob-like excludes
      if (excludePatterns.some(p => entry.name.includes(p) && p.includes('*'))) continue;

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && isCodeFile(fullPath, allowedExts)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// ─── Normalization ────────────────────────────────────────────────────────────

// Remove single-line comments, normalize whitespace and string literals
const COMMENT_PATTERNS = [
  /\/\/.*$/gm,          // JS/TS/Go/Rust line comments
  /\/\*[\s\S]*?\*\//g,  // block comments
  /#.*$/gm,             // Python/Ruby/shell comments
  /--.*$/gm,            // SQL/Lua comments
];

const STRING_PATTERN = /(['"`])(?:(?!\1)[^\\]|\\.)*\1/g;
const NUMBER_PATTERN = /\b\d+(?:\.\d+)?\b/g;
const WHITESPACE_PATTERN = /\s+/g;

function normalizeLine(line) {
  let s = line;
  // Strip inline comments
  s = s.replace(/\/\/.*$/, '');
  s = s.replace(/#.*$/, '');
  s = s.replace(/--.*$/, '');
  // Normalize string literals to a placeholder
  s = s.replace(STRING_PATTERN, '""');
  // Normalize numbers
  s = s.replace(NUMBER_PATTERN, '0');
  // Collapse whitespace
  s = s.replace(WHITESPACE_PATTERN, ' ').trim();
  return s;
}

function normalizeFile(content) {
  // Strip block comments first
  let s = content;
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');

  const lines = s.split('\n');
  const normalized = [];
  const original = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const norm = normalizeLine(lines[i]);
    if (norm.length > 0) {
      normalized.push({ norm, origLine: i + 1, orig: original[i] });
    }
  }
  return normalized;
}

// ─── Hashing ─────────────────────────────────────────────────────────────────

function hashBlock(lines) {
  const h = crypto.createHash('sha256');
  for (const l of lines) h.update(l.norm + '\n');
  return h.digest('hex');
}

function partialHash(lines) {
  // For near-duplicate detection: hash individual lines
  return lines.map(l => {
    const h = crypto.createHash('md5');
    h.update(l.norm);
    return h.digest('hex');
  });
}

// ─── Similarity ───────────────────────────────────────────────────────────────

function similarity(hashesA, hashesB) {
  if (hashesA.length === 0 || hashesB.length === 0) return 0;
  const setA = new Set(hashesA);
  let matches = 0;
  for (const h of hashesB) {
    if (setA.has(h)) matches++;
  }
  return Math.round((matches / Math.max(hashesA.length, hashesB.length)) * 100);
}

// ─── Core Algorithm ──────────────────────────────────────────────────────────

function buildWindowHashes(normalizedLines, windowSize) {
  const windows = [];
  const n = normalizedLines.length;
  if (n < windowSize) return windows;

  for (let i = 0; i <= n - windowSize; i++) {
    const block = normalizedLines.slice(i, i + windowSize);
    const hash = hashBlock(block);
    const lineHashes = partialHash(block);
    windows.push({
      hash,
      lineHashes,
      startNorm: i,
      startOrig: block[0].origLine,
      endOrig: block[block.length - 1].origLine,
      preview: block.slice(0, 3).map(l => l.orig.trim()).filter(Boolean),
    });
  }
  return windows;
}

function findDuplicates(files, opts) {
  const { minLines, threshold } = opts;

  // Step 1: Build hash index for all files
  // Map: hash -> [{file, startOrig, endOrig, preview, lineHashes}]
  const exactIndex = new Map();
  const fileData = new Map();

  process.stderr.write(c(C.dim, `Scanning ${files.length} files...\n`));

  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    // Skip binary-like files
    if (content.includes('\0')) continue;

    const normalizedLines = normalizeFile(content);
    if (normalizedLines.length < minLines) continue;

    const windows = buildWindowHashes(normalizedLines, minLines);
    fileData.set(filePath, { normalizedLines, windows });

    for (const win of windows) {
      if (!exactIndex.has(win.hash)) exactIndex.set(win.hash, []);
      exactIndex.get(win.hash).push({
        file: filePath,
        startOrig: win.startOrig,
        endOrig: win.endOrig,
        preview: win.preview,
        lineHashes: win.lineHashes,
      });
    }
  }

  // Step 2: Collect exact duplicate groups
  const exactGroups = [];
  const usedHashes = new Set();

  for (const [hash, occurrences] of exactIndex) {
    if (occurrences.length < 2) continue;
    if (usedHashes.has(hash)) continue;

    // Deduplicate by file+line (overlapping windows from same file)
    const seen = new Set();
    const deduped = [];
    for (const occ of occurrences) {
      const key = `${occ.file}:${occ.startOrig}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(occ);
      }
    }

    if (deduped.length < 2) continue;

    // Merge occurrences from same file that are adjacent/overlapping
    const merged = mergeAdjacentOccurrences(deduped);
    if (merged.length < 2) continue;

    exactGroups.push({
      type: 'exact',
      similarity: 100,
      count: merged.length,
      occurrences: merged,
    });
    usedHashes.add(hash);
  }

  // Step 3: Near-duplicate detection (if threshold < 100)
  const nearGroups = [];
  if (threshold < 100) {
    // Compare windows across files for similarity
    // Use a sampling approach for performance: bucket by most common line hashes
    const lineHashBuckets = new Map();

    for (const [filePath, data] of fileData) {
      for (const win of data.windows) {
        // Use first line hash as bucket key for efficiency
        const bucketKey = win.lineHashes[0];
        if (!lineHashBuckets.has(bucketKey)) lineHashBuckets.set(bucketKey, []);
        lineHashBuckets.get(bucketKey).push({
          file: filePath,
          startOrig: win.startOrig,
          endOrig: win.endOrig,
          preview: win.preview,
          lineHashes: win.lineHashes,
          hash: win.hash,
        });
      }
    }

    const processedPairs = new Set();
    for (const [, candidates] of lineHashBuckets) {
      if (candidates.length < 2) continue;

      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const a = candidates[i];
          const b = candidates[j];

          // Skip same file + overlapping lines
          if (a.file === b.file && Math.abs(a.startOrig - b.startOrig) < minLines) continue;

          // Skip if already found as exact duplicate
          if (usedHashes.has(a.hash) && a.hash === b.hash) continue;

          const pairKey = [
            `${a.file}:${a.startOrig}`,
            `${b.file}:${b.startOrig}`,
          ].sort().join('|');

          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);

          const sim = similarity(a.lineHashes, b.lineHashes);
          if (sim >= threshold && sim < 100) {
            nearGroups.push({
              type: 'near',
              similarity: sim,
              count: 2,
              occurrences: [
                { file: a.file, startOrig: a.startOrig, endOrig: a.endOrig, preview: a.preview },
                { file: b.file, startOrig: b.startOrig, endOrig: b.endOrig, preview: b.preview },
              ],
            });
          }
        }
      }
    }

    // Sort near-duplicates by similarity descending
    nearGroups.sort((a, b) => b.similarity - a.similarity);
  }

  // Sort exact groups by occurrence count descending
  exactGroups.sort((a, b) => b.count - a.count);

  return [...exactGroups, ...nearGroups];
}

function mergeAdjacentOccurrences(occurrences) {
  // Group by file, merge overlapping windows
  const byFile = new Map();
  for (const occ of occurrences) {
    if (!byFile.has(occ.file)) byFile.set(occ.file, []);
    byFile.get(occ.file).push(occ);
  }

  const result = [];
  for (const [file, occs] of byFile) {
    occs.sort((a, b) => a.startOrig - b.startOrig);
    // Take first occurrence per file (overlapping windows of same block)
    let last = null;
    for (const occ of occs) {
      if (!last || occ.startOrig > last.endOrig) {
        result.push(occ);
        last = occ;
      } else {
        // Extend the last occurrence
        last.endOrig = Math.max(last.endOrig, occ.endOrig);
      }
    }
  }
  return result;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function computeStats(groups, files) {
  const exactCount = groups.filter(g => g.type === 'exact').length;
  const nearCount = groups.filter(g => g.type === 'near').length;

  const duplicatedFiles = new Set();
  for (const g of groups) {
    for (const occ of g.occurrences) duplicatedFiles.add(occ.file);
  }

  const totalDupLines = groups.reduce((acc, g) => {
    const lines = g.occurrences.reduce((s, o) => s + (o.endOrig - o.startOrig + 1), 0);
    return acc + lines;
  }, 0);

  return {
    totalFiles: files.length,
    totalGroups: groups.length,
    exactGroups: exactCount,
    nearGroups: nearCount,
    duplicatedFiles: duplicatedFiles.size,
    totalDupLines,
  };
}

// ─── Output ───────────────────────────────────────────────────────────────────

function renderGroup(group, dir, index) {
  const label = group.type === 'exact'
    ? c(C.red, c(C.bold, `EXACT DUPLICATE`))
    : c(C.yellow, c(C.bold, `NEAR DUPLICATE (${group.similarity}% similar)`));

  const lines = [];
  lines.push('');
  lines.push(`${c(C.bold, `#${index + 1}`)} ${label} — ${group.count} copies`);

  for (const occ of group.occurrences) {
    const relPath = path.relative(dir, occ.file);
    lines.push(`  ${c(C.cyan, relPath)} ${c(C.gray, `lines ${occ.startOrig}–${occ.endOrig}`)}`);
  }

  if (group.occurrences[0].preview && group.occurrences[0].preview.length > 0) {
    lines.push(`  ${c(C.dim, 'Preview:')}`);
    for (const line of group.occurrences[0].preview.slice(0, 3)) {
      if (line) lines.push(`  ${c(C.gray, '│')} ${c(C.dim, line.slice(0, 100))}`);
    }
  }

  return lines.join('\n');
}

function renderSummary(stats, groups, dir) {
  const lines = [];
  lines.push('');
  lines.push(c(C.bold, '─── Summary ───────────────────────────────────────────────────────────'));
  lines.push(`  Files scanned:        ${c(C.white, String(stats.totalFiles))}`);
  lines.push(`  Duplicate groups:     ${c(stats.totalGroups > 0 ? C.red : C.green, String(stats.totalGroups))} (${stats.exactGroups} exact, ${stats.nearGroups} near)`);
  lines.push(`  Files with dupes:     ${c(stats.duplicatedFiles > 0 ? C.yellow : C.green, String(stats.duplicatedFiles))}`);
  lines.push(`  Duplicate lines:      ${c(stats.totalDupLines > 0 ? C.yellow : C.green, String(stats.totalDupLines))}`);

  if (stats.totalGroups === 0) {
    lines.push('');
    lines.push(`  ${c(C.green, c(C.bold, 'Clean! No duplicates found.'))}`);
  }

  // Top files by duplicate occurrences
  if (!stats.summaryOnly && groups.length > 0) {
    const fileCount = new Map();
    for (const g of groups) {
      for (const occ of g.occurrences) {
        fileCount.set(occ.file, (fileCount.get(occ.file) || 0) + 1);
      }
    }
    const topFiles = [...fileCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (topFiles.length > 0) {
      lines.push('');
      lines.push(`  ${c(C.bold, 'Top files with duplicates:')}`);
      for (const [file, count] of topFiles) {
        lines.push(`    ${c(C.cyan, path.relative(dir, file))} — ${count} group(s)`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
${c(C.bold, 'code-duplication')} v${VERSION} — Find duplicate and near-duplicate code blocks

${c(C.bold, 'USAGE')}
  code-duplication <dir> [options]
  dup <dir> [options]

${c(C.bold, 'OPTIONS')}
  --min-lines <n>       Minimum block size to report (default: 6)
  --threshold <0-100>   Similarity threshold; 100=exact only, 80=also near-dupes (default: 100)
  --lang <js,ts,py,rb>  Filter by language extension(s)
  --exclude <list>      Comma-separated dirs/files to exclude
                        (default: node_modules,.git,dist,build)
  --json                Output results as JSON
  --summary             Show counts only, not duplicate details
  -h, --help            Show this help
  -v, --version         Show version

${c(C.bold, 'EXAMPLES')}
  code-duplication ./src
  code-duplication ./src --min-lines 10
  code-duplication ./src --threshold 80 --lang js,ts
  code-duplication ./src --json > dupes.json
  code-duplication ./src --summary
  code-duplication ./src --exclude node_modules,dist,__tests__

${c(C.bold, 'EXIT CODES')}
  0   No duplicates found
  1   Duplicates found
  2   Error (bad arguments, directory not found)

${c(C.bold, 'SUPPORTED LANGUAGES')}
  js, ts, py, rb, go, rs, php, java, cs, cpp, swift, kt
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.version) {
    console.log(VERSION);
    process.exit(0);
  }

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  if (!opts.dir) {
    showHelp();
    process.exit(2);
  }

  // Validate directory
  let stat;
  try {
    stat = fs.statSync(opts.dir);
  } catch {
    die(`Directory not found: ${opts.dir}`);
  }
  if (!stat.isDirectory()) {
    die(`Not a directory: ${opts.dir}`);
  }

  const allowedExts = getLangExtensions(opts.lang);

  // Collect files
  const files = collectFiles(opts.dir, opts.exclude, allowedExts);

  if (files.length === 0) {
    console.log(c(C.yellow, 'No code files found in directory.'));
    process.exit(0);
  }

  // Find duplicates
  const groups = findDuplicates(files, opts);
  const stats = computeStats(groups, files);

  // Output
  if (opts.json) {
    const output = {
      version: VERSION,
      directory: opts.dir,
      options: {
        minLines: opts.minLines,
        threshold: opts.threshold,
        lang: opts.lang,
        exclude: opts.exclude,
      },
      stats,
      groups: groups.map(g => ({
        type: g.type,
        similarity: g.similarity,
        count: g.count,
        occurrences: g.occurrences.map(o => ({
          file: path.relative(opts.dir, o.file),
          startLine: o.startOrig,
          endLine: o.endOrig,
          preview: o.preview,
        })),
      })),
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    if (!opts.summary) {
      for (let i = 0; i < groups.length; i++) {
        console.log(renderGroup(groups[i], opts.dir, i));
      }
    }
    console.log(renderSummary(stats, groups, opts.dir));
  }

  // Exit code: 1 if duplicates found, 0 if clean
  process.exit(groups.length > 0 ? 1 : 0);
}

main().catch(err => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(2);
});
