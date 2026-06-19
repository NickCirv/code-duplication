<div align="center">

# code-duplication

**Spot duplicate and near-duplicate code blocks across your codebase — before they become tech debt.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?labelColor=0B0A09)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
npx github:NickCirv/code-duplication <dir>
```

Or clone and link globally:

```bash
git clone https://github.com/NickCirv/code-duplication.git
cd code-duplication && npm link
```

## Usage

```bash
code-duplication <dir> [options]
dup <dir> [options]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--min-lines <n>` | `6` | Minimum block size (lines) to report |
| `--threshold <0-100>` | `100` | Similarity — 100 = exact only, 80 = near-dupes |
| `--lang <js,ts,py,rb>` | all | Filter by language extension(s) |
| `--exclude <list>` | `node_modules,.git,dist,build` | Comma-separated dirs to skip |
| `--json` | — | Output results as JSON |
| `--summary` | — | Show counts only, no duplicate details |
| `-h, --help` | — | Show help |
| `-v, --version` | — | Show version |

```bash
# Scan src for exact duplicates (default)
code-duplication ./src

# Near-duplicates in JS/TS files only, 10+ lines
code-duplication ./src --threshold 80 --lang js,ts --min-lines 10

# CI gate — fail if any duplicates found
code-duplication ./src --min-lines 8 || exit 1

# Export to JSON
code-duplication ./src --json > duplicates.json
```

## What it does

Walks a directory recursively, normalizes code (strips comments, collapses whitespace, generalizes literals), then uses a sliding-window SHA-256 hash to find exact and near-duplicate blocks across files. Results show file paths, line ranges, and a preview of the repeated code. Supports 12 languages including JS, TS, Python, Ruby, Go, Rust, and Java.

Exit code `0` = clean, `1` = duplicates found, `2` = error — suitable for CI pipelines.

---
<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
