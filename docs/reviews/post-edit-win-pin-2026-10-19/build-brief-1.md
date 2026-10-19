# Lane post-edit-win-pin: build brief 1 (feat/post-edit-win-pin, tip after the seat's plan commit)

Feature: FEAT-030 · Get trustworthy feedback after edits. Class: ordinary (tests only). Read `must-meet.md` here first.

**Builder: pi gpt-5.6-sol through pi-worker, in `<worktrees>/post-edit-win-pin`.**
- Run single test files only.
- Do not push and do not run the full suite. The seat does both, and CI.
- Do not edit `HANDOFF.md`, `docs/sessions/` or `packages/nana-pack/extensions/nana-post-edit.ts`.
- If a new check fails because of extension code, stop and report.

**Rows first.**
- In FEAT-030 of `REQUIREMENTS.md`, add R-1700 and R-1701 after R-107, R-1702 after R-097 and R-1703 after R-243. Status `planned`, text from `must-meet.md`.
- Retire three rows:
  - R-107: "superseded by R-1700, <date>: restated for every platform; the Windows fallback is the new R-1701"
  - R-097: "superseded by R-1702, <date>: restated with its subject"
  - R-243: "superseded by R-1703, <date>: restated with its subject and the printed-output case"
- Take no other ID. Run `npm run req:tree`.
- If the R-291 leaf-total literal still exists in `packages/nana-pack/tests/requirements-tree.test.mjs`, set its three spots to the total that `node scripts/requirements-trace.mjs` prints.

**Tests.** Each `// req: R-17xx` sits directly above a `check("<title>", …` line with a plain-string title:
- hardening, R-1700, every platform: `tree: a timed-out check's process and that process's still-running child are both ended`
- hardening, R-1701, win32 only, else one `SKIP` line with the reason: `win32: with taskkill off PATH the timed-out check's shell is killed and the run settles`
- status, R-1702: `timeoutMs 0 arms no deadline and a slow check passes`
- status, R-1703: `an all-pass run whose checks print output appends nothing to the tool result`

Shapes (`must-meet.md` has the detail):
- The checker runs `"<process.execPath>" "<tree.cjs>" "<dir>"`, never bare `node`.
- Level A writes its pid and `process.ppid`, then spawns level B, which writes its pid. Both self-exit after FIXTURE_EXIT_MS.
- Check liveness only through pid files and `process.kill(pid, 0)`. No pgrep, wmic or PowerShell.
- Non-vacuity: both pids are alive, seen less than TREE_DEADLINE_MS after the fire.
- R-1701 non-vacuity: the shell pid differs from `process.pid` and is alive. Under the reduced PATH, `spawnSync("taskkill", ["/?"]).error?.code === "ENOENT"`; otherwise FAIL and name the cause.
- Every new run awaits under the hardening file's `settle`. Restore PATH and `globalThis.setTimeout` in `finally`.
- R-1702 is one check. The recorder records each delay and calls the real setTimeout. Control: timeoutMs 300 on PASS_CMD records exactly [300]. Case: timeoutMs 0 on the existing SLOW_PASS_CMD records none and shows `✓ 1 check`.
- Reap survivors by pid and wait until they are gone before removing a fixture folder. On Windows, wrap that removal in try/catch.
- New constants (TREE_DEADLINE_MS 2500, POST_KILL_POLL_MS 2000) carry `chosen:` and the reason.
- Restate the hardening header's "NOT covered here (darwin)" note and its `@effects`. Run `npm run map` if a header changes.
- In `packages/nana-pack/README.md`, replace "The win32 tree-kill branch has not been exercised on real Windows." with: "CI's Windows leg runs the win32 branch: a timed-out check's process and its child are ended through `taskkill /T /F`; with `taskkill` off PATH only the shell is killed, and the check's own processes keep running."
- Flip each row to `implemented`, with its test as evidence, once the test passes. R-1701 flips too, because the trace rejects a traced `planned` row. Report R-1701 as unverified until the seat's Windows CI run passes it.

**Wrong code to try.** Break the extension in a scratch copy, never the assertion. Restore it and record each result.
- (a) Change the POSIX `process.kill(-pid, signal)` to `direct()`. R-1700 FAILs on macOS: the command's child survives.
- (b) Change `c.timeoutMs ?? 30_000` to `||`. R-1702 FAILs (it records 30000). Changing `if (timeoutMs > 0) deadline` to `>= 0` also FAILs, and so does dropping the `timeoutMs > 0 &&` timedOut guard.
- (c) Change `else if (code !== 0)` to `code !== 0 || out.trim() !== ""`. R-1703 FAILs.
- The Windows pairs run on the seat's mutant CI run. Making only the `error` handler a no-op does not fail R-1701, because Node also emits `close` after ENOENT.

## Done
- `node packages/nana-pack/tests/post-edit-hardening.test.mjs`: 22 PASS, 1 SKIP, 0 FAIL on macOS.
- `node packages/nana-pack/tests/post-edit-status.test.mjs`: 32 PASS, 1 SKIP, 0 FAIL.
- Every existing title and pass count is unchanged.
- The `requirements-tree` test passes. `node scripts/requirements-trace.mjs` exits 0 with `ears: 0`. `npm run map:check` and `npm run readme:check` are clean.

## Report (at most 10 lines; first line `VERDICT: DONE | PARTIAL | BLOCKED`)
Give commit SHAs; PASS/FAIL/SKIP counts for both files; wrong-code results (a) to (c); the leaf total set (or "literal gone"); the rows flipped; and anything not done.