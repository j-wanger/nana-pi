# Worker brief — L4 fix round (Opus 5.5), after sol r1 BLOCK

Same worktree `~/nana-pi-wt/l4`, branch `lane/l4-test-path` (two commits already there: `4bec951`, `83dd7bc`). Today is 2026-09-28. Read `~/nana-pi/docs/reviews/tranche1-2026-09-28/l4-sol-r1.md` (the review), `l4-worker-r1.md` (the prior report), `l4-brief.md` (the original brief; its allowlist and rules still apply).

Fix exactly these, in `scripts/test.mjs` unless stated:
1. **Interrupt handling (MED):** install `SIGINT`/`SIGTERM` handlers that kill the active child's whole tree (POSIX: process-group kill; win32: `taskkill /T /F /PID`), remove the scratch dir, and exit 130/143. Every exit path (no-match selection, self-test failure, normal end) must remove the scratch dir — use try/finally plus a `process.on('exit')` guard.
2. **Timeout that cannot hang (MED):** after the timeout kill, do NOT wait on `close` unboundedly. Resolve on the child's `exit` event, then give the stdio pipes a short bounded drain (≤2 s) and proceed, marking the file FAIL (timeout). Reproduce the hang first with a fixture that spawns a detached grandchild holding stdout (`post-edit-hardening.test.mjs:171-176` shows the shape), show it hangs on the current runner, then show the fix bounds it. Keep that fixture out of the default set (self-test only).
3. **Windows skip predicate (MED):** skip `post-edit-hardening.test.mjs` only when NOT win32 AND `pgrep` is absent. On win32 it runs (the test guards its own POSIX cases).
4. **FAIL-line verdict (LOW):** the file verdict is the exit code. A line starting with `FAIL` from an exit-0 file is reported as `WARN <file>: FAIL line with exit 0` in the summary and does not flip the verdict. The self-test fixture must therefore exit non-zero itself.
5. **Bench tests:** include `apps/bench/test/*.test.mjs` (13 files) in discovery. Never collect anything under `apps/bench/studies/**` or any `fixtures/`/`fixture/` directory. Run them and report their runtime and that no listening ports or model calls happen (bench README says zero model calls; confirm by reading `apps/bench/test/study-tasks.test.mjs` and running with the temp HOME).

Do not touch: existing tests' assertions, extensions, `apps/desk/**`, `apps/bench/**` source (discovery only), the README beyond one line if the Tests paragraph needs the bench mention.

Rules as before: foreground commands only, never end your turn with a command running; kill only what you started; commit on the branch, do not push; do not run e2e/browser suites.

Report (≤40 lines): commits; `npm test` summary (files PASS/FAIL/SKIP/WARN, checks, exit, runtime with bench included); the hang reproduction before/after; the SIGINT test you ran (how you proved cleanup); the win32 predicate change; residuals; the claim you'd most expect to be wrong. End with `VERDICT: DONE`.
