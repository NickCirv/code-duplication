# code-duplication

Find duplicate and near-duplicate code blocks across files. DRY enforcement tool. Zero external dependencies — built-in Node.js modules only.

## Install

```bash
npm install -g code-duplication
```

Or run directly with npx:

```bash
npx code-duplication ./src
```

## Usage

```
code-duplication <dir> [options]
dup <dir> [options]
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--min-lines <n>` | `6` | Minimum block size (lines) to report |
| `--threshold <0-100>` | `100` | Similarity threshold — 100 = exact only, 80 = include near-dupes |
| `--lang <js,ts,py,rb>` | all | Filter by language extension(s) |
| `--exclude <list>` | `node_modules,.git,dist,build` | Comma-separated dirs/files to exclude |
| `--json` | — | Output results as JSON |
| `--summary` | — | Show counts only, not duplicate details |
| `-h, --help` | — | Show help |
| `-v, --version` | — | Show version |

## Examples

```bash
# Scan src directory for exact duplicates (default)
code-duplication ./src

# Find 10+ line duplicates in JS/TS files only
code-duplication ./src --min-lines 10 --lang js,ts

# Find near-duplicates (80%+ similar)
code-duplication ./src --threshold 80

# Export results to JSON
code-duplication ./src --json > duplicates.json

# Quick summary without details
code-duplication ./src --summary

# Custom excludes
code-duplication . --exclude node_modules,dist,__tests__,coverage

# Use as dup alias
dup ./src --threshold 85 --lang py
```

## Output

### Text output (default)

```
#1 EXACT DUPLICATE — 3 copies
  src/auth/login.js lines 12–18
  src/auth/register.js lines 45–51
  src/auth/reset.js lines 8–14
  Preview:
  │ function validateInput(data) {
  │ if (!data.email) throw new Error('Email required');
  │ if (!data.password) throw new Error('Password required');

─── Summary ───────────────────────────────────────────────────────────
  Files scanned:        47
  Duplicate groups:     3 (2 exact, 1 near)
  Files with dupes:     5
  Duplicate lines:      42
```

Color coding:
- **Red** — exact duplicate (100% match)
- **Yellow** — near-duplicate (below 100% threshold)
- **Green** — summary line when clean

### JSON output (`--json`)

```json
{
  "version": "1.0.0",
  "directory": "/path/to/src",
  "stats": {
    "totalFiles": 47,
    "totalGroups": 3,
    "exactGroups": 2,
    "nearGroups": 1,
    "duplicatedFiles": 5,
    "totalDupLines": 42
  },
  "groups": [
    {
      "type": "exact",
      "similarity": 100,
      "count": 3,
      "occurrences": [
        { "file": "auth/login.js", "startLine": 12, "endLine": 18, "preview": ["..."] }
      ]
    }
  ]
}
```

## Algorithm

1. **Collect** — Walk directory recursively, filter by extension
2. **Normalize** — Strip comments, normalize string literals and numbers, collapse whitespace
3. **Hash** — Sliding window of N lines, SHA-256 hash per window
4. **Index** — Group windows by hash across all files
5. **Exact dupes** — Groups with 2+ matching hashes, deduplicate overlapping windows
6. **Near-dupes** — Line-level hash comparison with Jaccard-like similarity scoring
7. **Report** — Sort by count/similarity, display with file paths and line ranges

Normalization ensures these are detected as duplicates:
```js
// Original
const user = getUserById(123);
if (!user) throw new Error("User not found");

// Duplicate (different variable name, different ID)
const admin = getUserById(456);
if (!admin) throw new Error("User not found");
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No duplicates found |
| `1` | Duplicates found |
| `2` | Error (bad arguments, directory not found) |

Useful in CI pipelines:

```bash
# Fail CI if any duplicates found in src
code-duplication ./src --min-lines 8 || exit 1
```

## Supported Languages

| Language | Extensions |
|----------|-----------|
| JavaScript | `.js`, `.mjs`, `.cjs` |
| TypeScript | `.ts`, `.tsx`, `.mts`, `.cts` |
| Python | `.py`, `.pyw` |
| Ruby | `.rb` |
| Go | `.go` |
| Rust | `.rs` |
| PHP | `.php` |
| Java | `.java` |
| C# | `.cs` |
| C/C++ | `.c`, `.cpp`, `.cc`, `.h`, `.hpp` |
| Swift | `.swift` |
| Kotlin | `.kt`, `.kts` |

## Security

- Zero external npm dependencies — built-in modules only (`fs`, `path`, `crypto`, `child_process`)
- Uses `crypto.createHash()` for all hashing — no `Math.random()`
- Uses `execFileSync`/`spawnSync` only — never `exec`/`execSync`
- No network access — runs entirely locally

## License

MIT
