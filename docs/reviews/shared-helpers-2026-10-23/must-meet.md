# shared-helpers · must-meet of record (seat, 2026-10-23)

Feature: FEAT-033 · Adopt explicit engineering standards

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

Spend line: the owner's 2026-10-22 power-mode pick, "One shared rename-retry and one process-kill helper replace 3 and 8 copies, plus a rule to reuse helpers." The lane replaces 2 of 3 rename copies and 6 of 8 kill copies. The third rename "copy" is the mutation runner's lock-wait classifier, which shares only a code list and keeps its own limits. The two kill copies left are runtime-measure's snapshot walk, a different method guarded by R-1277 and R-2527, and the desk's, frozen by the owner since 2026-10-10.

Stakes: medium-high blast, reversible. The kill helper runs in every suite run, every pair run, every pi-review and pi-worker stop, the post-edit hook in every pi session, and install's pi launch relay. No stored format changes; a revert restores main.

Order: cut `feat/shared-helpers` from main after claude-code-builder-parity lands. Both edit `pi-watchdog.mjs` and `worker-lane.test.mjs`.

## Seat decisions

- **One lane, gate class.** It changes a pi extension (post-edit), a review tool (review-round), the launcher core behind pi-review and pi-worker (pi-watchdog) and install's pi launch relay. Ladder: Opus final reviewer, astra land reviewer, the seat's wrong-code pairs, one independent check, the macOS install check, the Windows CI leg. The split buys little (attack N13).
- **D1: unify the rename codes.** EPERM, EBUSY and EACCES on every platform. A1 gains EACCES and A2 gains macOS and Linux, each at most 40 ms more before the same failure; in return the retry runs on every CI leg.
- **pid-alive checks stay out** (9 sites, 3 meanings): a FEAT-033 known bug.
- **S1 adopted.** Five fixture copy sites must gain the new module: test-runner `mkRoot`, suite-records `runnerFixture`, runtime-map MM2 and MM9, review-standard's lib list, and R-2568's check. `scripts/test.mjs` imports the helper as `from "../packages/nana-pack/lib/process-tree.mjs"`, double-quoted, because test-runner-parallel builds its list from that form. The builder adds to copy lists; it never deletes a fixture check.
- **S2 adopted.** An adapter holds no taskkill and no group signal. Four pieces stay by name: bounded-spawn-child's `passSignal` win32 early return, pi-watchdog's off-Windows `child.kill(signal)` after the group signal, and the `child.kill` fallback closures of bounded-spawn-child's `killTree` and post-edit. No test pins the two marked in Known limits; the brief names them.
- **S3 adopted.** The scan is a function. Its test runs it first on a planted temp tree, then on the repository.
- **S4 adopted.** The new preamble rule line carries the `- ` bullet prefix; pair 21 expects R-2662 alone.
- **S5 adopted.** Pairs run with main's mutation runner (see Seat steps).
- **S6 adopted.** The reuse line does not let a builder move a helper the brief does not name; moving a helper is a planning decision, so the lane class is chosen with it.
- **S7 adopted.** R-2023 is the relay's Windows taskkill pin; R-2300 and R-2303 pin the job object; R-963 goes red at 15 s on a broken watchdog kill.
- **S8 adopted.** The pid guard requires a whole number above 1: `kill(-1)` signals every process the user owns.
- **S9 adopted.** Both forms wrap every fallback call, listeners included; nothing escapes.
- **S10 adopted.** R-2656 runs both forms; R-2657's real case asserts both pids were alive first and adds a throwing fallback; R-2659 passes an explicit `delay: undefined`.
- **S11, S12 adopted.** R-644's per-consumer source check joins the Precedent list; the brief gives line ranges for the README entry and the R-2568 block.
- **N9 adopted.** `TASKKILL_ARGS` keeps its one pin, R-1244's check through the re-export; the new seal does not re-pin it. `TREE_KILL_EXCEPTIONS` lives beside the scan, as identity-scan keeps its allowlist, not in the runtime kill module.
- **R-2663 kept.** The owner asked for a rule.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2656 (FEAT-033) | WHERE the platform is not win32, WHEN either form of the shared tree kill receives a whole-number pid above 1, it shall send the given signal, SIGKILL when none is given, to that pid's process group once, start no taskkill, and call the caller's fallback with that signal only when the group signal throws. | `packages/nana-pack/tests/process-tree.test.mjs::R-2656: off Windows both forms of the shared tree kill signal the pid's process group once, SIGKILL by default, and call the fallback only when that signal throws` |
| R-2657 (FEAT-033) | WHERE the platform is win32, both forms of the shared tree kill shall start `taskkill /T /F /PID <pid>` once without a shell, signal no process group, and call the caller's fallback once when taskkill cannot start or exits non-zero, and no error a fallback throws shall escape. | `packages/nana-pack/tests/process-tree.test.mjs::R-2657: on Windows both forms start taskkill /T /F /PID once without a shell, signal no group, call the fallback once when taskkill cannot start or exits non-zero, and contain a throwing fallback` |
| R-2658 (FEAT-033) | IF the shared tree kill receives a pid that is not a whole number above 1, THEN it shall signal nothing, start no taskkill and call no fallback. | `packages/nana-pack/tests/process-tree.test.mjs::R-2658: a pid of 0, 1, -1, 1.5, NaN, null or undefined signals nothing, starts no taskkill and calls no fallback` |
| R-2659 (FEAT-033) | WHEN a rename through the shared rename retry fails, it shall wait the configured delay (the default when the caller passes none), run the caller's recheck and try again only when the error's code is EPERM, EBUSY or EACCES, on every platform, making at most RENAME_RETRY_ATTEMPTS attempts before it throws the last error. | `packages/nana-pack/tests/rename-retry.test.mjs::R-2659: the shared rename retry waits, rechecks and retries only EPERM, EBUSY and EACCES, on every platform, up to the configured attempts, then throws the last error` |
| R-2660 (FEAT-007, in FEAT-033's Also applies) | IF the rename that stores a kept review text fails once with EPERM, EBUSY or EACCES, THEN the review ledger shall keep that text and record the round, on every platform. | `packages/nana-pack/tests/review-ledger.test.mjs::R-2660: a kept review text whose first rename fails with EPERM, EBUSY or EACCES is still kept and its round recorded, on every platform` |
| R-2661 (FEAT-033) | WHEN a mapped non-test module outside the declared tree-kill exceptions holds a code line that starts taskkill or signals a negative pid, the scan shall name that file and line, and the suite shall fail. | `packages/nana-pack/tests/process-tree.test.mjs::R-2661: the tree-kill scan names each planted taskkill or negative-pid line outside the exceptions, and finds none in the repository` |
| R-2662 (FEAT-006, in FEAT-033's Also applies) | The builder preamble shall carry once, as its own bullet, the rule that a builder imports a function its change needs from the file that has it and never copies it, and reports a departure and stops when that function is private and the brief does not name its move to a shared module. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2662: the builder preamble tells the builder to import a needed function, never copy it, and stop on a private helper the brief does not move` |
| R-2663 (FEAT-033) | The shipped rulings file shall carry exactly one dated ruling that a helper's second caller imports it rather than copying it, and that the plan's Precedent section names any move of a private helper to a shared module. | `packages/nana-pack/tests/rulings.test.mjs::R-2663: the rulings file carries one dated ruling that a helper's second caller imports it and the plan names any move` |

Seal tests:
- `process-tree.test.mjs::seal: taskkill, SIGKILL by default, and the four declared tree-kill exceptions` names R-2656, R-2657 and R-2661. It does not re-pin `TASKKILL_ARGS`; R-1244's check keeps that pin.
- `rename-retry.test.mjs::seal: three attempts 20 ms apart on EPERM, EBUSY and EACCES` names R-2659.

Existing rows that stay green with no new test: as the draft lists them (post-edit R-787, R-1700, R-1701, R-1820, R-2210, R-2215; test runner R-609, R-912, R-915, R-1475; mutation runner R-1231, R-1233, R-1234, R-1244; pi-watchdog R-700, R-623, R-963, R-1390 to R-1395; install relay R-2023, R-2026, R-2027, R-2130, R-2131, R-2133, R-2300, R-2303; bench timeout; untouched R-1277, R-2527; rename R-986, R-2568).

Existing test the change makes false (a listed edit): R-2568's check drops its `REVIEW_TEXT_RENAME_*` comparison; the rename-retry seal now pins those values.

## What each test does

As the draft's "What each test does", with these changes:
- **R-2656** runs the waiting and the no-wait form.
- **R-2657** adds: a fallback that throws on the `close` path of the no-wait form and in the waiting form gives no uncaught exception and no throw; the Windows-only real case asserts both pids answer `kill(pid, 0)` before the kill and neither does after, within the case's limit, children started with `cwd: os.tmpdir()`.
- **R-2658** adds pid 1.
- **R-2659** adds a call with `delay: undefined` that waits the default delay and does not throw a TypeError.
- **R-2661** calls the exported scan function on a planted temp git tree first: a `spawn("taskkill"` line, a template line starting `` `taskkill ``, a `kill(-pid` line, a `.ts` file, comment lines that must be skipped, a CRLF file, a file with no final newline, and an exception path that must not be named. Every planted hit is named with its line; nothing else is. Then it runs on the repository and expects no hit, and requires each exception file to exist.

## Tunables

As the draft's Tunables, except: `TREE_KILL_EXCEPTIONS` lives beside the scan, with each path's reason, following identity-scan's allowlist. `TASKKILL_ARGS` moves into `process-tree.mjs`; `mutation-runner-config.mjs` re-exports it, so R-1244's seal is its one pin.

## Wrong-code pairs (the seat runs each; each must turn its test red)

Pairs 1 to 20, 22 and 23 as the draft lists them, with: pair 2 → R-2656 and the seal; pair 5 → R-2657 (and R-1700 on the Windows leg), not the seal; pair 21 → R-2662 alone. New pairs:
24. The scan's patterns match nothing → R-2661 (planted tree).
25. The pid guard accepts 1 → R-2658.
26. A fallback throw escapes the no-wait form's `close` listener → R-2657.
27. The helper treats an explicit `delay: undefined` as a function → R-2659.

## Known limits (the seat writes them to FEAT-033's file before the final round)

- The pid-alive checks keep 9 copies with 3 meanings.
- mutation-runner keeps its own transient code list for lock waits.
- The desk keeps its own kill, not a group kill off Windows, and its own `pidGone`, until the owner reopens it.
- The scan does not cover rename copies; a trailing comment naming taskkill trips it; a group liveness probe written `process.kill(-pid, 0)` trips it; a kill through another tool (PowerShell's Stop-Process) escapes it.
- Eleven rename sites still have no retry.
- No test pins pi-watchdog's extra off-Windows signal or bounded-spawn-child's direct-child fallback; the brief names both, and review checks them by reading.
- On Windows, the new ruling reaches a seat only at its next install.
- FEAT-029: runtime-measure's walk stays its own primitive.

## Docs that change

As the draft's list. Unchanged: the AGENTS marker region, the shared template, the review standard, nana-standards, the desk, runtime-measure and test-locked.

## Seat steps

1. Cut `feat/shared-helpers` from main after claude-code-builder-parity lands. Re-confirm R-2656 to R-2663 are free.
2. Commit this file, the draft, the attack and build brief 1. The brief carries the Precedent list with R-644's check added and line ranges for the README entry and the R-2568 block. Run brief-check.
3. Build with the roster's larger builder.
4. Seat checks: the draft's test list plus suite-records, runtime-map and review-standard; `npm run test:locked`, map, readme, trace; the macOS install check; `requirements-moved --base main`.
5. Pairs on main's runner: make a detached worktree of main under the scratchpad, put an untracked copy of the lane's pair table at the same relative path, and run it with `SEAT_MUTATE_TIP=<lane tip>`. Record the judging runner's commit in the table header. Pair 23 runs on a Windows scratch CI branch.
6. Draft PR CI. Independent check as the draft lists it.
7. Notes before the final round; Opus final review and astra land review on the exact tip.
