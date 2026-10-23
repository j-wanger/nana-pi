Feature: FEAT-006 · Launch builders with execution limits. Lane claude-code-builder-parity. Class: gate. Builder: pi-worker (larger lane). Build session 2: the Windows `.cmd` launch.

Work in the lane worktree on feat/claude-code-builder-parity (main is merged in at c4076461). The spec is still `docs/reviews/claude-code-builder-parity-2026-10-22/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

The seat ran `worker-claude.test.mjs` on GitHub's windows-latest runner from a scratch branch of build 1's tip, ef39406b (runs 39906008050, 39906430739, 39906974743 and 39907301230).

Finding F1 (Windows, measured): every Claude Code case failed. The fake `claude.cmd` ran and recorded its argv correctly, but pi-worker printed `[pi-worker] attempt 1 did not succeed`. A debug line the seat added before `runOnce`'s final return printed `exit=0 signal=null len=0 cmd="C:\Windows\system32\cmd.exe" opts={"windowsVerbatimArguments":true} args0=["/d","/v:off","/s","/c"] text=""`: the child exited 0 and the captured output was empty. The seat then changed only the `spawn` call's `detached: true` to `detached: !launch.options?.windowsVerbatimArguments`. With that, R-2646, R-2648, R-2649, R-2650, R-2651 (ceiling case), R-2654, R-2655, R-2664, R-2665 and the seal passed on Windows, and the fake's report was captured (`len=27 text="fake Claude builder report\n"`). Inferred cause: a detached `cmd.exe` has no console, so the console program it starts gets a new hidden console and writes there, not to the captured file. pi's own launch on Windows starts node directly, never through `cmd.exe`, so it is not affected.

Finding F2 (Windows, measured after F1's change): R-2647 still failed, with the launch working (`promptStatus: 0`, report captured). Its detail does not say which sub-assertion failed. Inferred cause, from this repo's Windows record: the expected prompt renders the preamble's worktree path from the test's temp path, which is the 8.3 short form (`C:\Users\RUNNER~1\…`) on the runner, while pi-worker renders `fsReal(process.cwd())`, the native real path. Build the expected values the way pi-worker does (`fs.realpathSync.native` on win32), and put each sub-assertion's own result in the check's detail so a Windows failure names itself.

Precedent:
- packages/nana-pack/bin/pi-watchdog.mjs — `runOnce`'s `spawn` call, where the launch's options already spread; the default stays `detached: true` for every launch that does not ask otherwise, so pi-review's path does not change.
- packages/nana-pack/bin/review-launch.mjs — its `.cmd` route, which returns `windowsVerbatimArguments: true`; the signal that a launch goes through `cmd.exe`.
- packages/nana-pack/bin/pi-worker.mjs — `claudeLaunch`, the place to mark a `cmd.exe` launch as not detached, so the change stays inside the Claude route.
- packages/nana-pack/tests/build-records.test.mjs — a win32 expected path built from `fs.realpathSync.native` (R-2599, build 5 of build-records).
- packages/nana-pack/tests/worker-claude.test.mjs — R-2647's check and its `expectedPrompt` helper.

1. Make a Claude Code launch that goes through `cmd.exe` start not detached, and keep every other launch detached as today. Keep the change inside the Claude route (pi-worker's launch wrapper and the watchdog honouring a launch's own `detached` option); pi-review and pi's own launch must not change. The ceiling and signals must still stop the build: on Windows the watchdog's kill is `taskkill /T /F`, which needs no process group.
2. Add one Windows-only check to `worker-claude.test.mjs` under R-2650's marker, or extend R-2650's own check, so that a `.cmd` launch's report reaching `--out` is asserted on the Windows leg. Keep every existing title.
3. Fix R-2647's Windows expectation as F2 describes, and make its detail name the failing sub-assertion.
4. Checks before your one commit: worker-claude, worker-lane, win32-launch, review-ledger, claude-review, watchdog-exit and watchdog-cpu test files; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows here; reason about the win32 paths from the code and say what you could not run.

Seat check: `node docs/reviews/claude-code-builder-parity-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: a `.cmd` Claude launch on Windows is not detached and its report reaches `--out`; every other launch is unchanged; R-2647's Windows expectation uses the native real path; the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; what changed in each file; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
