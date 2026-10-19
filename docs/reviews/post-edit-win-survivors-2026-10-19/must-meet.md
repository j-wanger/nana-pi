# post-edit-win-survivors: the kill checks see survivors on Windows

Feature: FEAT-030 · Get trustworthy feedback after edits

**Feature sentence.** On every platform, the hardening file finds a timed-out checker that ignores SIGTERM, and an aborted check's process and its child, by the pids they recorded. Broken kill code then fails a named check on the Windows leg. It no longer passes unseen or crashes the file in cleanup.

**Class: ordinary.** Tests, rows, one README clause and two generated docs. `extensions/nana-post-edit.ts` does not change (precedent post-edit-win-pin). If a new check fails on the Windows leg because of extension code, the builder stops and reports. The fix is then a separate hook-class lane. Ladder: one final reviewer.

**Threat model.** In scope: honest variation in platform, process start-up time and process tables. On POSIX, sh execs a simple command and the kill goes to the process group. On Windows, cmd.exe stays the parent and the kill goes through taskkill. Out of scope: deliberate forgery, and a checker that escapes on purpose (R-094's case f).

## Today (main 22ccd849, probed on a temp clone, macOS, Node 22)
- `survivors()` returns "" off POSIX. (a) "the checker is gone" (R-093) and (c) "the aborted checker is killed" (R-096) call it, so on Windows both pass without looking. (b) is POSIX-gated, so two checks are vacuous, not three.
- Windows run 39317131316 (taskkill without /T, no-op fallbacks): (a) and (c) PASS, then (c)'s cleanup threw EBUSY. Run 39314443000 crashed in (a)'s cleanup.
- macOS: hardening 22 PASS and 1 SKIP, about 12 s; status 32 PASS and 1 SKIP. Windows leg: hardening 17 PASS. There (a) settled in 391 ms, and (c) 74 ms after its abort.
- A "timed-out SIGTERM-ignoring check is ended" row would repeat R-787's "with the checker gone". It is also one case of R-1700. On Windows, taskkill /F has no SIGTERM, so its Windows half catches nothing R-1700 misses. It is folded into R-787 below.

## Design
- One new row: R-1820 (the abort row), `planned`, after R-096. R-1821 to R-1829 stay unused.
- R-093 is retired, superseded by R-787. Its promise is R-787's "checker gone"; SIGTERM then SIGKILL is the POSIX mechanism. (a)'s survivor check keeps its title, finds the checker by pid on every platform, and carries `// req: R-787`. R-787's evidence gains it.
- R-096 is retired, superseded by R-1820 (the kill) and R-788 (the chip). The status file's marker `R-788 R-096` becomes `R-788`.
- `writeTreeFixture(td, { ignoreSigterm = false, child = true } = {})`. The defaults leave the tree and win32 checks unchanged. The SIGTERM listener is installed before any pid file is written.
- **(a)** One level, SIGTERM ignored. The command is `"<process.execPath>" "<tree.cjs>" "<dir>"`, and timeoutMs stays 300. After the run settles, the test reads the pid and polls `!pidAlive` within POST_KILL_POLL_MS.
- **(c)** Two levels, SIGTERM ignored, timeoutMs 0. The test waits up to TREE_DEADLINE_MS for both pids alive, then aborts in every case. Settle's clock starts at the abort. Pass needs built-alive, settled, and both gone within POST_KILL_POLL_MS. The fixed 200 ms abort timer goes.
- (a) and (c) use try/finally: `reapTree(pids)`, then `removeTreeFixture(td)`. Survivors are named before the reap, and the checks print after the finally.
- `ignoresSigterm` goes. `survivors()` throws off POSIX. (b), (f) and the runner's pgrep SKIP stay, because R-607's runner test keys off that SKIP.
- No new tunable; existing constants are used by name.
- Restate the header `@purpose` ("timed-out or aborted"), the (a) and (c) comments, and the pgrep note. README: "a timed-out or aborted check's process and its child are ended". Run `npm run map` and `npm run req:tree`.

## Must-meet
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1820 (new) | WHEN a turn is aborted while a post-edit check that ignores SIGTERM is running, the pack shall end the process the check's command started and that process's still-running child, on Windows as on macOS and Linux. | `packages/nana-pack/tests/post-edit-hardening.test.mjs::c: an aborted turn ends the check's process and that process's still-running child` | Not on main: the draft passed 3 of 3 runs. Wrong code, probed on the draft: never escalate FAIL; onAbort settles without a kill FAIL; group kill replaced by `direct()` FAIL (tree FAILs too); test aborts before the tree is built FAIL. Windows half: the seat's mutant run. |
| R-787 (existing, evidence added) | WHEN a checker ignores SIGTERM, the run shall settle within deadline plus grace with the checker gone. | `packages/nana-pack/tests/post-edit-hardening.test.mjs::a: the checker is gone, not just abandoned` (title kept; found by pid; was R-093) | Not on main. Wrong code, probed: never escalate FAIL. The tree check stays PASS there, so only this check and (b) catch a missing escalation. Windows half: the seat's mutant run. |

## Verification (seat)
- Probed on the amended draft: hardening 22 PASS and 1 SKIP (3 runs); status 32 PASS and 1 SKIP. The trace exits 0 with `ears: 0`. map:check, readme:check and the requirements-tree test pass after regeneration. No tree.cjs process was left.
- Draft pull request, Windows leg: hardening 17 PASS.
- One mutant run from a scratch branch, closed afterwards. killTree's win32 branch runs taskkill `/F /PID` without `/T`, and both fallbacks are no-ops. Windows must read 13 PASS and 4 FAIL: (a)'s gone check, tree, win32 and (c)'s new check. The file must print through j with no EBUSY throw.
- HANDOFF (seat): close the post-edit-win-pin residual line, which said three checks were vacuous; there were two.

## Known limits
- (a) has no started-before-the-kill guard, so an absent pid reads as gone. A false green needs the shell to die before it creates the checker; the Windows kill lands about 390 ms in. A guard at 300 ms would flake on Windows.
- (b) and (f) stay POSIX-only, with no SKIP line on Windows. (b)'s comment says its spawner exits immediately; it does not. Not changed here.
- A taskkill that starts and fails (access denied) stays untested.
- A reused pid or an unreaped dead process reads as alive: a false red, never a false green.
- Only the seat's Windows mutant run proves the cleanup no longer crashes.