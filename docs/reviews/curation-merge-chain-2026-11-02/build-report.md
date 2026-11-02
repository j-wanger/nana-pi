VERDICT: DONE

Commit: `5861fef9d7a1302d29d21e708e11837d65cef3da`  
Branch: `feat/curation-merge-chain`. Commit exit: 0. Worktree clean.

- R-3698–R-3702 implemented; SUB-027 moved unchanged under FEAT-040.
- Shared liveness now preserves merge chains. Transitive `absorbed` stops at retractions.
- Retirement, `sizeLine` and `renderQueue` use `absorbed`; `show` retains direct `supersedes`.
- Existing-test edits: none. R-3233 unchanged. Private-helper exports: none.
- Main-code failures covered newest keep, absorbed count, predecessor absorption, synced survivor and stale keep.
- Both required mutations failed. Wrong-code runs exited 1; fixed runs exited 0.
- All eight required test commands and seven repository checks passed on the committed tip, exit 0.
- Lane class: `ordinary`.

Departures: component DFS replaces alternating DFS; manifests include curation history; read-side liveness replaces extra merge writes.

Files, named assertions and complete command evidence: `docs/reviews/curation-merge-chain-2026-11-02/build-1.md`.

Not done: push, full local suite or CI observation. The brief forbids pushing; AGENTS delegates the suite to CI.

Writing-check verdict and path findings remain because the brief requires this technical report format.
