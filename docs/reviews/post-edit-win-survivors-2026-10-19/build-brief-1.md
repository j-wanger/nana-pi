# Build brief: post-edit-win-survivors

Feature: FEAT-030 · Get trustworthy feedback after edits. Class: ordinary. Worktree `~/nana-pi-wt/post-edit-win-survivors`, branch `feat/post-edit-win-survivors` from main. Follow the builder preamble. Run single test files only. Never edit HANDOFF.md or docs/sessions/. Plan: the lane's must-meet.md.

## Change
1. REQUIREMENTS.md, FEAT-030:
   - Add R-1820 after R-096 as `planned`, text exactly as in must-meet. Flip it to `implemented`, citing (c)'s new title, once that check passes.
   - R-093 becomes `retired`. Evidence: "superseded by R-787, <date>: its promise is R-787's checker gone; SIGTERM then SIGKILL is the POSIX mechanism; check a now finds the checker by pid on every platform".
   - R-787 keeps its text. Append `packages/nana-pack/tests/post-edit-hardening.test.mjs::a: the checker is gone, not just abandoned` to its evidence.
   - R-096 becomes `retired`. Evidence: "superseded by R-1820 (the kill, restated for every platform) and R-788 (the skipped chip), <date>".
2. `packages/nana-pack/tests/post-edit-status.test.mjs`: `// req: R-788 R-096` becomes `// req: R-788`. No other change.
3. `packages/nana-pack/tests/post-edit-hardening.test.mjs`:
   - `writeTreeFixture(td, { ignoreSigterm = false, child = true } = {})`. With ignoreSigterm, `process.on("SIGTERM", () => {})` runs before any pid file is written. With child false, level A spawns nothing. The defaults leave the tree and win32 checks unchanged.
   - (a): `setup([])`, then write USER_CFG as the tree check does. Command `"<process.execPath>" "<tree.cjs>" "<td>"`, one level, ignoreSigterm, timeoutMs 300. Keep the three R-787 and timeout checks and their titles. After settle, read `level-a.pid` and poll `!pidAlive(pid)` within POST_KILL_POLL_MS. Keep the title "a: the checker is gone, not just abandoned"; its marker becomes `// req: R-787`.
   - (c): two levels, ignoreSigterm, timeoutMs 0, the AbortController in setup's ctx. Wait up to TREE_DEADLINE_MS for both pids alive (the tree check's predicate), then abort whether or not they were seen. Call settle after the abort. Poll both gone within POST_KILL_POLL_MS. Keep the two settle checks and titles. New check under `// req: R-1820`: "c: an aborted turn ends the check's process and that process's still-running child", true only when built-alive and ended.
   - (a) and (c): try/finally. In the finally, abort ((c) only), `reapTree(pids)`, then `removeTreeFixture(td)` when reaped. Record which pids were alive before the reap; on a FAIL, print one line naming them. Checks print after the finally.
   - Delete `ignoresSigterm`. In `survivors()`, replace `if (!POSIX) return "";` with a throw that names pgrep as POSIX-only. (b) and (f) are unchanged.
   - (a) and (c) get no fixed sleeps and no 200 ms timer. Add no new constant and no inline tunable. Keep `check("title", …` on the line directly under its marker.
   - Restate the header `@purpose` ("ends a timed-out or aborted command's process tree on every platform"). Also restate the (a) and (c) lines of the opening comment, the pgrep comment above the constants (now (b) and (f) only), and the comments above (a) and (c).
4. `packages/nana-pack/README.md`, the CI Windows-leg sentence of the post-edit timeout paragraph: "a timed-out or aborted check's process and its child are ended through `taskkill /T /F`".
5. Run `npm run map` and `npm run req:tree`; commit docs/code-map.md and docs/requirements-tree.md. After any merge of main, rerun both, because every in-flight lane edits them.
6. Do not touch `scripts/test.mjs` or the extension.

## Wrong code to try (a temp copy of the extension, never committed)
- killTree always sends SIGTERM and never escalates: (a)'s gone check and (c)'s new check FAIL by name, and the file prints through j.
- onAbort settles without killing: (c)'s new check FAILs.
- `process.kill(-pid, signal)` replaced by `direct()`: (c)'s new check and the tree check FAIL.
- Test-side: abort before the wait. (c)'s new check must FAIL.
- Restore the extension. Main must give 22 PASS and 1 SKIP, with no `tree.cjs` process left.

## Done
- Hardening file: 22 PASS and 1 SKIP on macOS. Status file: 32 PASS and 1 SKIP.
- `node scripts/requirements-trace.mjs` exits 0 with `ears: 0`. `npm run map:check` and `npm run readme:check` pass. `node packages/nana-pack/tests/requirements-tree.test.mjs` passes.
- Every wrong-code pair above is red by name.

## Report (at most 10 lines)
Verdict; the commit; PASS/SKIP counts; each wrong-code pair and its FAIL lines; rows changed; whether the map and tree were regenerated; anything the brief got wrong.