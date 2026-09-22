# code-duplication — documentation research

Reviewed 21 September 2026. Public GitHub source only.

## Revision and scope

- Commit: [`8b30c39dc17b5f4af7d364f6bad7b286b87d49e1`](https://github.com/NickCirv/code-duplication/commit/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1).
- Tree: `b34271d3fd8c9c920748adc20c8e716573a73914`; truncated: `false`.
- Capture: 6 of 6 eligible text files; all eligible text files.
- Method: package and entrypoint inspection, implementation-interface review, targeted behavior/limitation inspection, and test-source review. This is not an exhaustive correctness or security audit.
- Commands run against repository code: **none**. External services, deployment and npm publication were not verified.

## Claim and evidence map

| Documentation claim | Pinned evidence | Assessment |
| --- | --- | --- |
| Runtime, executable and development commands | [package.json](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/package.json) | Source declaration inspected; runtime unverified |
| Finds repeated and similar normalized code blocks across a directory. | [index.js](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/index.js) | Implementation interfaces inspected; behavior not executed |
| Language/exclusion controls; exact and partial block hashes; grouped occurrences; duplication statistics. | [index.js](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/index.js) | Source-backed scope, not a test result |
| Normalization and sliding windows compare text, not semantics. Similar generated code and short common patterns can be false positives; review before refactoring. | [index.js](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/index.js) | Material limits documented; service compatibility remains open |
| Existing checks | [test/smoke.test.js](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/test/smoke.test.js) | Test source read; no passing-run claim |

## Documentation inventory and disposition

| Existing document | Decision |
| --- | --- |
| [README.md](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/README.md) | Rewritten with source-specific purpose, direct checkout setup, limitations and verification status. Old section fragments retained where practical. |

Added `docs/REFERENCE.md` for the observed implementation and command surface, and this research record. Protected license and attribution files remain in their original locations without edits. No source or product UI was changed.

## Quality dimensions

| Dimension | Status | Evidence / next step |
| --- | --- | --- |
| Pinned provenance | Verified | Captured commit, tree and per-file hashes recorded below |
| Interface documentation | Partially verified | Source inspection only; run clean-checkout quickstart |
| Runtime behavior | Unverified | No repository execution in this review |
| Test results | Unverified | Existing tests were not run |
| Deployment / package availability | Unverified | No remote publish or live-service check |
| Visual / link checks | Unverified | Portfolio renderer and independent QA are separate from this authoring step |

## Unresolved issues

Normalization and sliding windows compare text, not semantics. Similar generated code and short common patterns can be false positives; review before refactoring.

## Captured source inventory

This lists captured provenance, not a claim that every line received a full audit. Binary/generated/excluded files are outside the eligible text capture.

| File | SHA-256 | Bytes |
| --- | --- | --- |
| [LICENSE](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/LICENSE) | `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d` | 1072 |
| [README.md](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/README.md) | `d8669b70aa0d9e29ee641dac05219498e0c2aa4d12998f920b170613e19b29e2` | 2214 |
| [package.json](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/package.json) | `d390736c205e55290905dc79f6e27f62b5a85780d6bf8dee5b12ea260c5cb453` | 614 |
| [.github/workflows/ci.yml](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/.github/workflows/ci.yml) | `e818f4e6bd805f798665dbbf04964d02f12fc59dd7f18903ad63d26d374ae3f0` | 380 |
| [index.js](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/index.js) | `ee3bdc02f50664262d654c0e1874f844a3b7269874a80705fb93adcd383c0478` | 20745 |
| [test/smoke.test.js](https://github.com/NickCirv/code-duplication/blob/8b30c39dc17b5f4af7d364f6bad7b286b87d49e1/test/smoke.test.js) | `31178f9e769b3cc662acbdb5a9984a51a26132adb2f1a6ecf1b6d94cc9470c1f` | 338 |
