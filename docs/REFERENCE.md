# code-duplication — implementation reference

Source revision: `8b30c39dc17b5f4af7d364f6bad7b286b87d49e1`. This reference records source declarations; it is not a transcript of a successful run.

## Entrypoint and runtime

[package.json](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/package.json) declares `index.js`. Node.js `>=20` and npm.

Executable mapping: `code-duplication` → `./index.js`, `dup` → `./index.js`.

## Supported workflow

Language/exclusion controls; exact and partial block hashes; grouped occurrences; duplication statistics.

Normalization and sliding windows compare text, not semantics. Similar generated code and short common patterns can be false positives; review before refactoring.

## Command reference

The commands below use the installed executable name. From the pinned checkout, replace it with the `node` entrypoint shown above. Options and command branches were cross-checked against captured source; examples are not execution transcripts.

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

## Package scripts

| Script | Exact command |
| --- | --- |
| `test` | `node --test` |

## Implementation sources

[index.js](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/index.js).

## Verification boundary

No repository code, tests, network operation, hook installer or migration was executed for this review. Source inspection supports the documented interface; runtime correctness and external-service compatibility remain unverified.
