# shared-helpers · plan draft (planner, 2026-10-22, main 3bbb0662)

Feature: FEAT-033 · Adopt explicit engineering standards

Why this feature: its purpose is "keep shared configuration and module-boundary policies in one place". The lane's product is one helper per job plus a rule that keeps it so. FEAT-031 (run checks reliably) also fits the kill helper, since four of its six callers run checks. The preamble row sits in FEAT-006 beside R-2582. The review-store row sits in FEAT-007 beside R-2568. Both go in FEAT-033's Also applies.

Spend line: the owner's 2026-10-22 pick ("one shared rename-retry and one process-kill helper replace 3 and 8 copies, plus a rule to reuse helpers"). HANDOFF Next 3 lists it after Claude Code builder parity. It closes two cases from the seat's precedent audit: the third rename-retry copy and the eight kill copies.

Stakes: medium-high blast, reversible. The kill helper runs in every suite run, every mutation run, every pi-review and pi-worker stop, the post-edit hook in every pi session, and install's pi launch relay. No data format or stored state changes, so a revert restores main. Most kill regressions fail loudly (a hang, a leftover process). One quiet mode exists: a kill that leaves grandchildren. Existing grandchild checks catch it (R-1700, R-1233, R-2023, the bench timeout test).

## What I measured, and what I corrected

Method: grep of every tracked non-test module for `taskkill`, `kill(-`, `SIGKILL`, `renameSync` near `EPERM|EBUSY|EACCES`, and `kill(pid, 0)`, then reading each hit. A prototype of the proposed scan (`shp-plan/scan-proto.mjs`, read-only) reads `code-map.config.json`'s non-test roots and ignore list. It flags exactly the nine files in table B and no comment line.

### A. Rename retry: 2 copies, not 3

| # | path:line | codes | platforms | attempts, delay | seams | recheck |
|---|---|---|---|---|---|---|
| A1 | `packages/nana-setup/lib/project.mjs:229` `renameWithRetry` (private) | EPERM, EBUSY | all | 3, 20 ms (`RENAME_RETRY_*`, exported, unsealed) | `rename`, `delay`, `recheck` | after the delay, before each retry (R-986) |
| A2 | `packages/nana-pack/bin/review-round.mjs:402` `renameReviewText` | EPERM, EBUSY, EACCES | win32 only | 3, 20 ms (`REVIEW_TEXT_RENAME_*`, pinned inside R-2568's check) | none | none |
| — | `packages/nana-pack/lib/mutation-runner.mjs:226` `TRANSIENT_LOCK_CODES` | EPERM, EACCES, EBUSY | all | wait loop to 30 s / 300 s limits | `io`, `wait`, `now` | — |

The third "copy" is not a rename retry. It classifies lock-file read, stat, link and unlink errors for a wait loop with its own limits (R-1778, R-1960, R-2172). Only the code list matches. A2 is untested on every platform: no seam, and no CI leg makes a rename fail.

Correction: the review-outputs-kept attack said nana-pack "must copy, not import" A1 because of the layer rule. The layer rule allows it. `code-map.config.json` has two layers, and within the packages layer imports are free. 14 nana-setup modules already import `packages/nana-pack/lib/*` (`real-path.mjs`, `win-command.mjs`, `json-text.mjs`). The real block was that A1 is private, and G-018 forbids reaching into a private helper. The fix is to move it to a shared module.

### B. Process-tree kill: 8 implementations plus 1 composer

| # | path:line | takes | off Windows | Windows | fallback to the direct child | sync? | signal |
|---|---|---|---|---|---|---|---|
| B1 | `packages/nana-setup/lib/bounded-spawn-child.mjs:54` `killTree()` | module `child` | `kill(-pid, SIGKILL)` | `spawnSync taskkill /T /F /PID` (TASKKILL_ARGS); ended = exit 0 | yes, `child.kill(SIGKILL)` when not ended | sync | SIGKILL |
| B1b | same file `:95` `passSignal(signal)` | module `child` | `kill(-pid, signal)` | does nothing | yes, `child.kill(signal)` | sync | caller's |
| B2 | `packages/nana-pack/extensions/nana-post-edit.ts:115` `killTree(child, escalate)` | ChildProcess | `kill(-pid, sig)` | async `spawn taskkill /T /F /PID`; fallback on `error` or non-zero `close` | yes, on a throw, an error or a non-zero close (can fire twice on a missing taskkill, inferred) | async on Windows | SIGTERM, then SIGKILL after POST_EDIT_KILL_GRACE_MS (caller) |
| B3 | `scripts/test.mjs:119` `killTree(child)` | child | `kill(-pid, SIGKILL)` | `spawnSync taskkill` literal args | none | sync | SIGKILL |
| B4 | `packages/nana-pack/lib/mutation-runner.mjs:213` `killPid(pid)` | raw pid (also from a pid file, `:404`) | `kill(-pid, SIGKILL)` | `spawnSync taskkill` TASKKILL_ARGS | none | sync | SIGKILL |
| B5 | `packages/nana-pack/bin/pi-watchdog.mjs:165` `killGroup(child, signal)` | child | `kill(-pid, sig)` AND always `child.kill(sig)` | `execSync("taskkill /T /F /PID n")` through cmd.exe | none on Windows | sync | SIGKILL default |
| B6 | `apps/bench/run.mjs:124` `signalTree(pid, signal)` | raw pid | `kill(-pid, sig)` | async `spawn taskkill /pid n /t /f`, no `error` listener | none | async on Windows | SIGTERM, then SIGKILL after graceMs (caller) |
| B7 | `scripts/runtime-measure.mjs:148` `killTree(rootPid, {run, kill, signal})` | raw pid | `ps -A` walk; a group only when all its members are in the tree, else single pids; returns the targets | not used (caller sends `kill(pid, SIGKILL)`) | — | sync | SIGKILL default |
| B8 | `apps/desk/server.mjs:634` `killTree(proc, signal)` | proc | `proc.kill(signal)`, not a group | async `execFile taskkill /pid /t /f` | — | async | SIGTERM default |
| (composer) | `scripts/test-locked.mjs:129` `signalChild` | child | composes B7 plus `kill(-pid)` and remembered targets (runtime-map-live F7) | `target.kill(signal)` only | — | sync | caller's, then SIGKILL after KILL_WAIT_MS |

Corrected counts: 8 implementations, as the audit said, plus one composer. This lane replaces 6 (B1–B6). Three stay:
- B7 is a different primitive: a snapshot walk that never signals a group shared with an outsider (R-1277). test-locked reuses it already.
- test-locked composes B7. runtime-map-live builds 5 and 6 broke this exact path by simplifying it, so it stays untouched.
- B8 belongs to the desk, which is frozen.

Every caller does its own waiting and escalation. No copy waits for exit inside the kill.

### C. pid-alive checks: 9 sites, 3 meanings (dropped, see Design)

- "Alive, or EPERM" with a positive-integer guard: `review-round.mjs:487`, `mutation-runner.mjs:221` and `:673` (inline).
- "Dead unless EPERM": `test-locked.mjs:73`, `test-locked.mjs:161`.
- "Dead only on ESRCH": `pi-review.mjs:90`, `nana-knowledge/lib/build.ts:60`, desk `server.mjs:652`.
- Group probe first: bench `run.mjs:109` `treeAlive`.

### Rename sites with no retry (unchanged)

`nana-handoff.ts:228`, `roster-set.mjs:55`, `suite-records.mjs:92`, `nana-setup/lib/fsops.mjs:76,117,124,137`, `steps.mjs:391,595`, `scripts/requirements-lift.mjs:916`, `scripts/runtime-measure.mjs:207`, and the desk's three. Adding a retry there is a behaviour change nobody asked for.

## Design

Two new modules in `packages/nana-pack/lib/`, the conventional home of shared helpers (`win-command.mjs` is imported by an extension, by bins and by nana-setup). Each consumer keeps its local function name as a one-line adapter that binds its signal and fallback. Call sites do not change. An adapter holds no platform branch, no `kill` call and no taskkill.

### Parts, each with its subtraction test

1. **`process-tree.mjs`: two exports, `killProcessTree` (waits for taskkill) and `killProcessTreeNoWait`.**
   - Input: `(pid, { signal = DEFAULT_KILL_SIGNAL, fallback, platform = process.platform, kill = process.kill, run = spawnSync | start = spawn })`.
   - A pid that is not a positive whole number signals nothing, starts nothing and calls no fallback. `kill(-0)` would signal the caller's own group.
   - Off Windows, both forms send `kill(-pid, signal)` once. If that throws, they call `fallback(signal)` when given, and nothing else.
   - On Windows, both forms start `taskkill /T /F /PID <pid>` without a shell. The waiting form returns `true` only on exit 0. Otherwise it calls the fallback once. The other form calls the fallback once on `error` or a non-zero `close`.
   - Neither form arms a timer or waits for the child. FEAT-030's kill-grace check counts timers.
   - Neither form ever throws, because post-edit runs inside pi's tool hook.
   - Subtraction: two forms, because post-edit and the bench must not block their event loop on Windows, while B1, B3, B4 and B5 need the sync exit status. The fallback is caller-supplied. A raw-pid caller (B4's pid file, B6) must never get a direct `kill(pid)`, since that pid may be reused. Node's `child.kill` already does nothing once the child has exited.
2. **Consumers B1–B6 move onto it.**
   - B1 `killTree`: waiting form with SIGKILL and `child.kill` as fallback. Kept exactly.
   - B1b `passSignal`: keeps its win32 early return, then calls the waiting form with the caller's signal and fallback. Kept exactly.
   - B2: the no-wait form with SIGTERM or SIGKILL and `(s) => child.kill(s)`. **C4:** the fallback fires once, not possibly twice, on a missing taskkill. Harmless.
   - B3, B4: the waiting form with SIGKILL and no fallback. Kept exactly.
   - B5: the waiting form with the caller's signal and no fallback, then, off Windows, `child.kill(signal)` as today. **C2:** on Windows, taskkill starts directly, not through cmd.exe.
   - B6: the no-wait form with no fallback. **C5:** taskkill now gets `/T /F /PID n` instead of `/pid n /t /f`, which taskkill treats the same. A missing taskkill no longer crashes the bench with an unhandled `error` event.
   - Subtraction: these are the copies, so this part is the lane.
3. **`TASKKILL_ARGS` moves into `process-tree.mjs`.** `mutation-runner-config.mjs` re-exports it, so R-1244's seal stays green unedited. The config has 28 exports, so its "at least 15 exports" scan still holds. B1 drops its import of the mutation runner's config. Subtraction: leaving it there would make a general helper depend on the mutation runner's config.
4. **`rename-retry.mjs`: `renameWithRetry(src, dest, { rename, delay, recheck })`.**
   - It is A1's loop with A1's seams, retrying `RENAME_RETRY_CODES` on every platform.
   - **D1 (seat decision, default: unify):** the codes are EPERM, EBUSY and EACCES on all platforms. A1 gains EACCES (C1a): at most 40 ms more before the same failure, which the refresh already reports as skipped. A2 gains macOS and Linux (C1b): at most 40 ms more before the same throw on a lasting error.
   - In return, one policy, and the retry runs on every CI leg. Today A2's retry runs on none.
   - The alternative is per-caller `codes` and `platforms` options. They would keep two differences nobody chose on purpose.
   - Subtraction: without it, the next store writer makes copy three.
5. **A1 and A2 move onto it.**
   - project.mjs drops its private loop and the `RENAME_RETRY_*` exports. Nothing else imports them. It passes `rename`, `delay` and `recheck` through. R-986 stays green.
   - review-round drops `renameReviewText` and `REVIEW_TEXT_RENAME_*`. `writeReviewText` calls the helper. `complete(r, out, { …, rename })` passes an optional `rename` down, as `refreshWorkingRegion` does, so R-2660 can inject a failure.
6. **A scan check (R-2661).** It reads `code-map.config.json`'s non-test roots and ignore list. A code line (not a `//`, `/*` or `*` line) that holds a `taskkill` string or a `kill(-` call fails the suite, naming the file. The exceptions are `TREE_KILL_EXCEPTIONS`: process-tree.mjs, runtime-measure.mjs, test-locked.mjs and desk `server.mjs`, each with its reason. Precedent: identity-scan's "no tracked file outside the allowlist". Subtraction: without it the reuse rule is text only. With it, a fourth kill copy fails the suite and names the helper.
7. **The reuse rule: one preamble line and one ruling.**
   - Preamble line (R-2662), new and on its own line after R-2582's: "When your change needs a function a Precedent file already has, import it; if it is private, move it to a shared module that both callers import. Never copy it." Builders wrote the copies, and "follow its pattern" reads as "copy".
   - Ruling (R-2663): "2026-10-22: A helper's second caller imports it. A private helper moves to a shared module first. Nobody copies a helper." The plan-attack that prescribed the copy came from a seat-side planner, and the rulings reach both seats in every project.
8. **Docs.** The pack README's Behavior notes gain one entry beside "One renderer per surface (`lib/display.mjs`)". It names the two helpers, the exceptions and the scan.

### Dropped, with reasons

- **pid-alive helper (table C).** The owner's pick did not include it. The sites mean three different things. Merging "dead only on ESRCH" into "alive or EPERM" changes lock takeover in pi-review, the knowledge build and the desk. Each copy is one line. The seat records it as a FEAT-033 known bug.
- **Moving B7 into process-tree.mjs.** It is already shared and exported, with 22 wrong-code pairs behind R-1277 and R-2527. A move earns a location and risks the path builds 5 and 6 broke.
- **Sharing the code list with mutation-runner's lock retry.** The two policies must be free to differ. A later change to the rename codes would otherwise change a sealed lock behaviour silently.
- **AGENTS Plans bullet.** It would change the shared section. Since project-drift-notice, every adopted project then shows a drift line until it is refreshed. The ruling already reaches the same seats.
- **Review standard.** The 2026-10-13 ruling says a review blocks only on a material problem. A copy is a known-bug line, not a MUST.
- **nana-standards.md.** Its rows must match the requirements skill and the G-rows (R-1480's three-way pattern). G-018 already forbids reaching into a private helper, and the preamble line resolves that tension by moving the helper.
- **A rename scan.** No regex tells a rename retry loop apart reliably. Review catches rename copies, and this is recorded as a known limit.
- **A real-process kill test of the helper on every platform.** Consumer tests already kill real trees on every leg (R-1700, R-1233, R-912, R-2303, bench). Only the Windows leg gets one real case, to pin taskkill without a shell.

## Class and split

**Class: install, hook or gate.**
- nana-post-edit.ts is a pi extension.
- review-round.mjs is a review tool.
- pi-watchdog.mjs is pi-review's and pi-worker's launcher core.
- bounded-spawn-child.mjs is install's and doctor's pi launch relay.
- The ladder: the final reviewer, the land reviewer (or seat-land), the seat's wrong-code pairs, one independent check, the macOS install check (the lane touches `packages/nana-setup/`), and the Windows CI leg.

**Recommendation: one lane, one build, ordered steps.** The brief orders the work:
1. Both helpers with their unit tests and seals.
2. The ordinary consumers B3, B4, B6 and A1, running each one's existing tests.
3. The gate consumers B1, B2, B5 and A2.
4. The scan, then the two rule lines.

The seat sends a second build only on PARTIAL. Cost: one gate ladder over about 14 files.

**Alternative: two lanes.**
- Lane 1, ordinary: the helpers, B3, B4, B6, A1 and the rule.
- Lane 2, gate: B1, B2, B5, A2 and the scan.
- Cost: two plans of record, two final reviews, two CI waits of about 21 minutes each, and two lands.
- Lane 1 would land the fallback mode with no caller until lane 2.
- The owner already priced in gate-class review, so the split buys little.

Order: cut after claude-code-builder-parity lands, or rebase onto it. Both edit `pi-watchdog.mjs` and `worker-lane.test.mjs`.

## Threat model

Honest variation in our tools' output and machine state is in scope:
- a Windows rename that fails with EPERM, EBUSY or EACCES from an antivirus scan, an indexer or a just-closed handle;
- a child that has already exited, so its group signal throws ESRCH;
- a pid reused after the child exited, which no raw-pid caller may signal directly;
- a child or grandchild that ignores SIGTERM (callers' escalation is unchanged);
- a child started through a shell or a `.cmd` shim (taskkill `/T` reaches cmd.exe's tree, and off Windows the shell leads the group);
- taskkill missing from PATH, or denied;
- the post-edit extension loaded by pi on win32 through a relative `.mjs` import;
- Windows 8.3 temp paths, and EBUSY on a temp folder a killed child still holds.

Deliberate forgery is out:
- a process that leaves its group or detaches on Windows (a FEAT-013 known bug already);
- a hostile `taskkill` on PATH;
- a forged pid file;
- hand edits to `TREE_KILL_EXCEPTIONS` (the seal pins the list).

## Precedent

Precedent:
- packages/nana-setup/lib/bounded-spawn-child.mjs — `killTree`'s `ended` result and direct fallback; the waiting form's shape.
- packages/nana-pack/extensions/nana-post-edit.ts — async taskkill with `error` and non-zero `close` fallback; the no-wait form's shape; how an extension imports `../lib/*.mjs`.
- packages/nana-pack/lib/win-command.mjs — a shared nana-pack lib module imported by an extension, bins and nana-setup.
- scripts/runtime-measure.mjs — injected `run` and `kill` seams for a kill helper; stays unchanged.
- packages/nana-setup/lib/project.mjs — `renameWithRetry` with its `rename`, `delay` and `recheck` seams; moves verbatim apart from D1.
- packages/nana-pack/bin/review-round.mjs — `renameReviewText` (the EACCES code) and `complete()`'s options object, where `rename` joins `text`.
- packages/nana-pack/lib/mutation-runner-config.mjs — `TASKKILL_ARGS` with its contract provenance; becomes a re-export.
- packages/nana-pack/tests/win-command.test.mjs — injected-platform unit cases that run on every leg.
- packages/nana-pack/tests/post-edit-hardening.test.mjs — real tree kills, the Windows taskkill case and the taskkill-off-PATH case.
- packages/nana-setup/tests/project-working-region.test.mjs — an injected rename that throws EPERM once, and the delay seam (R-986).
- packages/nana-pack/tests/identity-scan.test.mjs — the scan over `git ls-files` with a sealed allowlist and a frozen-desk entry.
- packages/nana-pack/tests/code-map.test.mjs and code-map.config.json — the mapped roots and ignore list the scan reuses.
- packages/nana-pack/tests/review-ledger.test.mjs — the R-2568 harness (`mod.complete(..., { home, text })`) for R-2660.
- packages/nana-pack/prompts/builder-preamble.md and packages/nana-pack/tests/worker-lane.test.mjs — `RULE_LINE` and `preambleOnce` (R-2582).
- packages/nana-pack/rules/nana-rulings.md and packages/nana-pack/tests/rulings.test.mjs — the dated-bullet shape checks.
- packages/nana-pack/README.md — the Behavior notes entry for `lib/display.mjs`.

## Must-meet rows

IDs R-2656 to R-2663 are proposed. claude-code-builder-parity reserved through R-2655, and park-deliverables used R-2644. The seat confirms the range is free.

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2656 (FEAT-033) | WHERE the platform is not win32, WHEN the shared tree kill receives a positive whole-number pid, it shall send the given signal, SIGKILL when none is given, to that pid's process group once, start no taskkill, and call the caller's fallback with that signal only when the group signal throws. | `packages/nana-pack/tests/process-tree.test.mjs::R-2656: off Windows the shared tree kill signals the pid's process group once, SIGKILL by default, and calls the fallback only when that signal throws` |
| R-2657 (FEAT-033) | WHERE the platform is win32, both forms of the shared tree kill shall start `taskkill /T /F /PID <pid>` once without a shell, signal no process group, and call the caller's fallback once when taskkill cannot start or exits non-zero. | `packages/nana-pack/tests/process-tree.test.mjs::R-2657: on Windows both forms start taskkill /T /F /PID once without a shell, signal no group, and call the fallback once when taskkill cannot start or exits non-zero` |
| R-2658 (FEAT-033) | IF the shared tree kill receives a pid that is not a positive whole number, THEN it shall signal nothing, start no taskkill and call no fallback. | `packages/nana-pack/tests/process-tree.test.mjs::R-2658: a pid of 0, -1, 1.5, NaN, null or undefined signals nothing, starts no taskkill and calls no fallback` |
| R-2659 (FEAT-033) | WHEN a rename through the shared rename retry fails, it shall wait the configured delay, run the caller's recheck and try again only when the error's code is EPERM, EBUSY or EACCES, on every platform, making at most RENAME_RETRY_ATTEMPTS attempts before it throws the last error. | `packages/nana-pack/tests/rename-retry.test.mjs::R-2659: the shared rename retry waits, rechecks and retries only EPERM, EBUSY and EACCES, on every platform, up to the configured attempts, then throws the last error` |
| R-2660 (FEAT-007, in FEAT-033's Also applies) | IF the rename that stores a kept review text fails once with EPERM, EBUSY or EACCES, THEN the review ledger shall keep that text and record the round, on every platform. | `packages/nana-pack/tests/review-ledger.test.mjs::R-2660: a kept review text whose first rename fails with EPERM, EBUSY or EACCES is still kept and its round recorded, on every platform` |
| R-2661 (FEAT-033) | WHEN a mapped non-test module outside the shared tree kill's declared exceptions holds a code line that starts taskkill or signals a negative pid, the suite shall fail naming that file. | `packages/nana-pack/tests/process-tree.test.mjs::R-2661: no mapped module outside the shared tree kill and its declared exceptions starts taskkill or signals a negative pid` |
| R-2662 (FEAT-006, in FEAT-033's Also applies) | The builder preamble shall state once, on its own line, that a builder imports a function its change needs from the Precedent file that has it, moves a private one to a shared module both callers import, and never copies it. | `packages/nana-pack/tests/worker-lane.test.mjs::R-2662: the builder preamble tells the builder to import a needed Precedent function, move a private one to a shared module, and never copy it` |
| R-2663 (FEAT-033, optional: the seat may drop it) | The shipped rulings file shall carry exactly one dated ruling that a helper's second caller imports it, a private helper moving to a shared module first, rather than copying it. | `packages/nana-pack/tests/rulings.test.mjs::R-2663: the rulings file carries one dated ruling that a helper's second caller imports it instead of copying it` |

Seal tests (one per module):
- `process-tree.test.mjs::seal: taskkill /T /F /PID, SIGKILL by default, and the four declared tree-kill exceptions` names R-2656, R-2657 and R-2661.
- `rename-retry.test.mjs::seal: three attempts 20 ms apart on EPERM, EBUSY and EACCES` names R-2659.

Existing rows these copies already satisfy stay green and get no new test:
- Post-edit (FEAT-030): R-787, R-1700, R-1701 (Windows only), R-1820, R-2210 (no timer added), R-2215.
- Test runner (FEAT-031): R-609, R-912, R-915, R-1475.
- Mutation runner (FEAT-031): R-1231, R-1233, R-1234, R-1244 (the TASKKILL_ARGS seal via the re-export).
- pi-watchdog: R-700, R-623 (FEAT-007), R-963 (FEAT-006), R-1390–R-1395.
- Install's pi launch relay (FEAT-013): R-2023, R-2026, R-2027, R-2130, R-2131, R-2133, R-2300 and R-2303 (Windows).
- Bench: `apps/bench/test/timeout.test.mjs` (untraced titles, grandchild case) and R-519's `treeAlive` checks.
- Untouched paths: R-1277 and R-2527.
- Rename: R-986 (recheck after the delay) and R-2568.

### What each test does, and why it is red on main

- **R-2656.** Platform injected as `darwin`, with a recording `kill`. The pid 4321 call records exactly `[-4321, "SIGKILL"]` and no `run`. With `signal: "SIGTERM"` it records SIGTERM. With a `kill` that throws ESRCH and a fallback, the fallback runs once with the signal. With no fallback, `kill` saw one call only. With a `kill` that succeeds, the fallback never runs. Red on main: the module does not exist.
- **R-2657.**
  - Platform `win32`, with a recording `run`/`start` and a `kill` that fails the test if called.
  - Both forms record `("taskkill", ["/T","/F","/PID","4321"])`, with options holding no `shell` and `windowsHide: true`.
  - Waiting form: exit 0 returns `true` with no fallback. Exit 128, a `{ error: ENOENT }` result, or a `run` that throws each return `false` and call the fallback once.
  - No-wait form: a fake process emits `close` 0, giving no fallback. It emits `error` then `close` -4058, giving one fallback. It emits `close` 1, giving one. A `start` that throws gives one.
  - Windows leg only: a real node parent with a node child is killed with the waiting form. Neither pid answers `kill(pid, 0)` within the case's limit. Elsewhere it prints SKIP by name.
  - Red on main: no module.
- **R-2658.** For each bad pid, both forms on both injected platforms record no `kill`, no `run` or `start`, and no fallback call. Red on main: no module.
- **R-2659.**
  - The injected `rename` throws a coded error a set number of times, and `delay` and `recheck` record their order.
  - For each of EPERM, EBUSY and EACCES, failing once gives delay, recheck, success.
  - Failing on every attempt gives exactly RENAME_RETRY_ATTEMPTS calls and two delay-recheck pairs, and the last error is rethrown.
  - ENOENT and EXDEV throw at once with no delay.
  - The case runs with no platform argument, so the macOS and Linux legs prove no win32 gate is left.
  - Red on main: no module.
- **R-2660.** The R-2568 harness, with `complete(res, out, { home, text, rename })`. The rename throws the code once, then performs the real rename. For each code, the store holds the bytes under their sha256, the tally line names them, and the fake rename ran twice. Red on main on every leg: `complete` ignores `rename`, so the fake runs zero times.
- **R-2661.** A scan of `git ls-files` limited to `code-map.config.json`'s non-exempt roots, minus its ignore list. Lines whose first non-blank characters are `//`, `/*` or `*` are skipped. A line matching `/["'`]taskkill(?:\.exe)?\b/i` or `/\bkill\(\s*-/` in a file outside `TREE_KILL_EXCEPTIONS` fails, naming the file and line. The scan also requires each exception file to exist. Red on main: it names bench `run.mjs`, `pi-watchdog.mjs`, `nana-post-edit.ts`, `mutation-runner.mjs`, `bounded-spawn-child.mjs` and `scripts/test.mjs` (prototype output).
- **R-2662.** `preambleOnce(RULE_LINE.reuseNotCopy)`, following R-2582. Red on main: the line is absent.
- **R-2663.** Exactly one bullet in the shipped rulings file matches the ruling text and opens with its date. Red on main: absent.

Existing test the change makes false (a listed edit, not a new test): R-2568's check drops `mod.REVIEW_TEXT_RENAME_ATTEMPTS === 3 && mod.REVIEW_TEXT_RENAME_DELAY_MS === 20`. The rename-retry seal now pins those values.

## Tunables

Named exports at the top of each helper with provenance, as `bounded-spawn.mjs` holds `RELAY_*`.
- `TASKKILL_COMMAND = "taskkill"`. Contract: Windows' taskkill.exe, found on PATH without a shell (R-2657). Sealed.
- `TASKKILL_ARGS = ["/T","/F","/PID"]`. Contract R-1233 and R-1700: the tree and force switches. It moved from `mutation-runner-config.mjs`, which re-exports it. Sealed.
- `DEFAULT_KILL_SIGNAL = "SIGKILL"`. Chosen 2026-10-22: four of six callers pass it (R-2656). Sealed.
- `TREE_KILL_EXCEPTIONS`, four paths each with its reason. Chosen 2026-10-22 (R-2661). Sealed.
- `RENAME_RETRY_ATTEMPTS = 3`, `RENAME_RETRY_DELAY_MS = 20`. Chosen 2026-10-17 in project.mjs's Windows triage (inferred cause) and carried over. Sealed.
- `RENAME_RETRY_CODES = ["EPERM","EBUSY","EACCES"]`. Chosen 2026-10-22: the union of A1 and A2 (D1). Sealed.

Module headers: the two new modules carry the six tags. `process-tree.mjs`'s `@effects` is "process (signals a process group or starts taskkill)" and its `@errors` is "never throws". `rename-retry.mjs`'s `@effects` is "disk" and its `@errors` is "throws the last rename error". Update the headers of project.mjs (`@outputs` loses `RENAME_RETRY_*`), review-round.mjs (`complete`'s `rename` input), bounded-spawn-child.mjs (`@inputs` loses TASKKILL_ARGS) and mutation-runner-config.mjs (the re-export). Regenerate the code map.

## Wrong-code pairs (the seat runs each; each must turn its test red)

1. The POSIX branch signals `pid`, not `-pid` → R-2656. R-1233 and R-912 also turn red, because a grandchild survives.
2. The default signal is SIGTERM → R-2656 and the seal.
3. The helper falls back to `kill(pid, signal)` itself when no fallback is given → R-2656.
4. The fallback runs after a successful group signal → R-2656.
5. `/T` is dropped → R-2657 and the seal. R-1700 also turns red on the Windows leg.
6. The win32 branch runs the POSIX path → R-2657.
7. taskkill runs with `shell: true`, or as one joined string → R-2657.
8. The no-wait form attaches no `error` listener → R-2657, through an unhandled error.
9. The fallback runs on `close` 0 → R-2657.
10. The pid guard is removed → R-2658, which records `kill(-0)`.
11. The guard only checks `== null` → R-2658, through the 0 case.
12. The rename retry keeps a win32-only gate → R-2659 on the macOS and Linux legs.
13. The recheck runs before the delay → R-2659 and R-986.
14. The retry makes four attempts → R-2659 and the seal.
15. ENOENT is retried → R-2659.
16. review-round keeps its own loop, or ignores `rename` → R-2660.
17. `scripts/test.mjs` keeps its taskkill line → R-2661, naming that file.
18. `pi-watchdog.mjs` keeps its `execSync` template literal → R-2661, which proves the scan catches a template string.
19. `nana-post-edit.ts` keeps its own `killTree` → R-2661, which proves the scan covers `.ts`.
20. `TREE_KILL_EXCEPTIONS` gains `nana-post-edit.ts` → the seal.
21. The reuse sentence is merged into R-2582's line → R-2582 and R-2662.
22. The ruling is missing → R-2663.
23. Windows leg only: post-edit passes no fallback → R-1701.

Run pairs 1–22 with **main's** mutation runner, pointing `SEAT_MUTATE_TIP` at the lane tip. The lane changes the runner's own kill (B4), and a seat table run from the lane worktree imports the lane's runner. Pair 23 needs the Windows leg, through a scratch CI branch, as the earlier Windows pairs did.

## Windows

The CI runner is GitHub windows-latest: 8.3 short temp paths, EBUSY when a killed child holds its cwd, and `spawnSync` without a shell finding only `.com` and `.exe`.

New tests on the Windows leg:
- **`process-tree.test.mjs`.**
  - Every injected case runs there as everywhere.
  - Its one Windows-only real case pins that `taskkill` starts without a shell and that `/T` reaches the grandchild.
  - Each child gets `cwd: os.tmpdir()`, not the test's temp folder, so removing that folder after the kill cannot hit EBUSY.
  - Paths are not compared, so 8.3 names do not matter.
  - The R-2661 scan compares git's forward-slash paths with the exception paths and splits lines on `\r?\n`.
- **`rename-retry.test.mjs`.** Injected and run on every leg. The "every platform" clause is proved by the macOS and Linux legs. The Windows leg proves the same code runs there.
- **`review-ledger.test.mjs` R-2660.** Its real second rename lands in the Windows store, as R-2568's does today.
- **`worker-lane.test.mjs` R-2662 and `rulings.test.mjs` R-2663.** Text checks that tolerate CRLF, since the line check uses `includes`.

Existing Windows pins that must stay green:
- R-1700 and R-1820: post-edit's async taskkill.
- R-1701: the fallback with taskkill off PATH, which relies on the no-wait form's `error` path.
- R-1233: the mutation runner's sync taskkill.
- R-912 and R-915: the test runner on Windows, through the IPC trigger.
- R-2300 and R-2303: the relay's taskkill.
- R-963: the watchdog's ceiling kill. A failed kill would hang it, so it pins C2 indirectly (inferred).
- The bench timeout test: a SIGTERM-ignoring child and grandchild are gone.

## Known limits (the seat writes them before the final round)

FEAT-033:
- The pid-alive checks keep 9 copies with 3 meanings.
- mutation-runner keeps its own copy of the transient code list.
- The desk keeps its own kill, which is not a group kill off Windows, and its own `pidGone` until the desk reopens.
- The scan does not cover rename copies. It skips only lines that start with a comment, so a trailing comment naming taskkill trips it. A kill through another tool, such as PowerShell's Stop-Process, escapes it.
- Eleven rename sites still have no retry.
- No test pins pi-watchdog's extra off-Windows signal or bounded-spawn-child's fallback. Both are kept by reading.
- On Windows, the new ruling reaches a seat only at its next install.

FEAT-029: B7 stays its own primitive. The existing ps-failure known bug stands.

## Docs that change

- `packages/nana-pack/README.md`: one Behavior notes entry.
- `REQUIREMENTS.md`: R-2656–R-2659, R-2661 and R-2663 in FEAT-033; R-2660 in FEAT-007; R-2662 in FEAT-006. FEAT-033's Also applies gains R-2660 and R-2662.
- `docs/requirements-tree.md` and `docs/code-map.md` are regenerated.
- Seat notes: the known limits above, the HANDOFF Landed line and the session entry.
- Unchanged: the AGENTS marker region, the shared template, the review standard, nana-standards, the desk, runtime-measure and test-locked.

## Seat steps

1. Cut `feat/shared-helpers` from main after claude-code-builder-parity lands, or rebase onto it. Confirm R-2656–R-2663 are free.
2. Run one adversary pass. Commit the must-meet of record and build brief 1, with `Feature: FEAT-033 · Adopt explicit engineering standards` and the Precedent list above. Run brief-check.
3. Build with `pi-worker --lane shared-helpers --brief … --out … --lane-size larger`.
4. Seat checks on the tip:
   - process-tree, rename-retry, review-ledger, worker-lane, rulings, post-edit-hardening, post-edit-values-named, test-runner, test-runner-parallel, mutation-runner, mutation-runner-takeover, watchdog-exit, watchdog-cpu, pi-launch-limits, project-working-region, and bench's timeout and ops tests;
   - `npm run test:locked`, `map:check`, the readme check and the trace;
   - `node packages/nana-setup/bin/install-check.mjs` on macOS;
   - `requirements-moved.mjs --base main`, carried into the review brief and the land.
5. Run pairs 1–22 through main's runner and pair 23 on a Windows scratch branch. Then run CI on a draft PR.
6. Independent check, all in OS temp:
   - a real pi session whose post-edit checker hangs, with a 1 s limit (expect no leftover process);
   - Ctrl-C during `npm run test:locked` (expect no leftover node test process);
   - install with a hung fake pi (expect the relay to end it);
   - a review recorded with the store's first rename forced to fail.
7. Write the notes before the final round. Then run the final reviewer and the land reviewer on the exact tip.

## Not verified

- I inferred that pi on a real Windows machine loads post-edit's new relative `.mjs` import. The existing imports from `../lib/` suggest it does.
- I inferred libuv's mapping of Windows rename failures to EPERM, EBUSY and EACCES from a test's simulated EACCES and project.mjs's comment.
- I inferred that Node emits both `error` and `close` for a missing taskkill, which makes post-edit's fallback fire twice today.
- I inferred that R-963 runs on the Windows leg and would hang on a failed kill. I read its check, not a Windows log.
- I did not run any consumer test against a prototype helper. The behaviour tables come from reading the code.
- The scan prototype ran at main only. Whether its comment rule misses a new trailing comment depends on the build.
- I did not check that session-start-frontier or ci-timing-records leave R-2656–R-2663 free beyond the branches and plan drafts I grepped.
