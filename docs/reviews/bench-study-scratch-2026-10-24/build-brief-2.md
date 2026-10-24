Feature: FEAT-034 · Define reproducible comparisons. Lane bench-study-scratch. Class: ordinary. Builder: pi-worker (small lane). Build session 2: one Windows CI failure at aecc5ca5 (run 40102229483).

Work in the lane worktree on feat/bench-study-scratch. The spec is still `docs/reviews/bench-study-scratch-2026-10-24/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder. Test code only.

Precedent:
- apps/bench/test/orchestration-paths.test.mjs — the R-2770 check in section 11.
- apps/bench/run.mjs — `rec.evidence`, built with `path.relative`, so it uses the platform's separator; unchanged.

The failure on Windows: `FAIL R-2770: the shipped-study case runs in a scratch study folder and its evidence files exist there raw\code-bugfix\research\rep0`. The check compares `rec.evidence` with the string `"raw/code-bugfix/research/rep0"`, and on Windows `rec.evidence` reads `raw\code-bugfix\research\rep0`. macOS and Linux pass.

Fix the comparison so it holds on every platform (for example against `path.join("raw", "code-bugfix", "research", "rep0")`), keeping the check's title and its evidence-files-on-disk test. Change nothing else.

You cannot run Windows here. Do not claim the Windows leg passes; the seat pushes and reads it.

Checks before your one commit: `node apps/bench/test/orchestration-paths.test.mjs` alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked` (it may wait for another run's machine lock; let it wait).

Seat check: `node docs/reviews/bench-study-scratch-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: R-2770 compares the evidence path in a form that holds on Windows, the full suite is green on macOS, the seat check prints `0 missing`, and the work is committed.

Report (at most 6 lines after the VERDICT line): the commit sha; the change; the full suite's summary line; map, readme, trace, tree and seat-check status; the Windows leg as unverified.
