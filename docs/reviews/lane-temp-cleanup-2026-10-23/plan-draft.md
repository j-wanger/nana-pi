# lane-temp-cleanup · plan draft (planner, 2026-10-23, main 00617983)

Feature: FEAT-006 · Launch builders with execution limits

Why this feature: every part of the lane is pi-worker's lane launch and its test. The temp folder, the carried Claude settings and the review-option refusal all live in FEAT-006's rows (R-733, R-2647, R-2655, R-2664, R-2665), and both known-bug lines this lane closes sit in `docs/known-bugs/FEAT-006.md` (lines 84 and 89). `docs/requirements-tree.md` places FEAT-006 under CAP-02 (measured, read). New rows go in FEAT-006's table directly after R-2665, before R-1212. No heading is added.

Spend line: the owner's 2026-10-23 pick, "Small gate lane. In lane mode, a review-only option leaves the carried Claude settings file in the temp folder; that file is owner-only and may hold a key. The lane also keeps the test away from a global CLAUDE_CONFIG_DIR." It serves the current priority: nana working consistently in terminal mode for both seats on macOS and Windows.

Stakes: medium blast, reversible. Every lane build runs pi-worker's lane mode, so a wrong argument check could refuse every build, and a wrong signal listener could leave a pi-worker that only SIGKILL stops. No stored format changes. A revert restores main.

Main moved to 8c24e357 (objective-hook-win landed) while I planned. That range touches none of this lane's files: pi-worker.mjs is byte-identical, and FEAT-006's known-bug lines 84 and 89 are unchanged (measured). No unmerged `feat/*` branch touches pi-worker.mjs, worker-claude.test.mjs, build-records.test.mjs or FEAT-006's known bugs (measured, `git diff main...<branch>` over every unmerged branch).

Every claim below is marked measured or inferred. Probes and data are in the scratchpad `ltc-plan/`: `probe1.mjs`, `probe1b.mjs`, `probe2.mjs`, `probe8.mjs` with their `*-results.json`, `taskstop/` (`trap.mjs`, `trap2.mjs`, `signals*.log`), `taskstop-run.sh`, the decoy run `p3/with-decoy.txt`, and a prototype in a scratch clone (`clone/`, diff in `prototype.diff`). Every probe ran with a temp HOME, USERPROFILE and TMPDIR under the scratchpad, a fake `claude` and `pi`, and no model call. The checkout's `git status --porcelain --ignored` showed only its usual ignored folders afterwards (measured).

## What I measured

**Exit paths after the temp folder exists.** pi-worker makes `<os.tmpdir()>/nana-lane-preamble-XXXXXX/` at `pi-worker.mjs:150`, inside the lane block, after the brief check, roster and builder line. For a Claude builder it writes `preamble.md`, `builder-prompt.md` and `builder-settings.json` there (`:151-166`). Probe 1 and probe 2 ran each exit with a Claude roster and user settings holding `ANTHROPIC_API_KEY=sk-ant-PROBE-SECRET` (all measured, macOS, node 22.22.2):

| Exit | Where | Exit code | Temp folder after |
|---|---|---|---|
| Each review option: `--item x`, `--role r`, `--revision HEAD`, `--over-cap why`, `--worker` | `:344-348`, plain `process.exit(1)` | 1 | **Left**, 5 of 5. Folder mode 0700; `preamble.md` 0644, `builder-prompt.md` 0644, `builder-settings.json` 0600 holding the secret. The carry line was printed first, so the user settings were read. No lock. |
| Review option `--item`, pi roster, small lane | same | 1 | **Left**: `preamble.md` only |
| Invalid `--stall-secs abc` | `:342`, removes the folder | 1 | empty (carry line printed first) |
| No `--out` (usage) | `:342` | 1 | empty |
| Held lane lock | `acquireLaneLock` → `laneFailure` `:69` | 1 | empty |
| `--out` in a missing folder | runWatchdog `finally` `:360`, then the write fails | 1 | empty |
| Success | `finally` `:360` | 0 | empty |
| Wall-clock ceiling (`--max-secs 1`) | `finally` | 1 | empty |
| SIGTERM or SIGINT while claude runs | runWatchdog's handlers, then `finally` | 143 or 130 | empty, claude gone |
| SIGKILL while claude runs | none | killed | **Left**, with the secret; the lane lock left; the fake claude still running |

"Empty" means the whole temp folder held nothing, including runOnce's `pi-review-*` capture folder (measured, probe 2).

**A start-up window with no signal handler.** Between `mkdtempSync` (`:150`) and runWatchdog installing its SIGINT, SIGTERM and SIGHUP handlers (`pi-watchdog.mjs:277-278`), pi-worker has no listener, so a signal kills it at once. Probe 1b sent SIGTERM at set delays after the folder appeared, three runs each (measured):
- 0, 25, 50 and 75 ms: killed by the signal, folder left, 12 of 12. One 75 ms run also left the lane lock.
- 100 ms and later: handled, exit 143, folder removed, 24 of 24.
- The folder appeared 113 to 143 ms after spawn. So the window is roughly 80 to 100 ms per launch on this Mac. It spans the trust check's node spawn (`:194`), the lock and the start record (inferred from code order).

**What a seat's stop sends.** Claude Code 2.1.299's background-task stop sent SIGTERM, seen twice by the process, and the process was gone about 1.45 s later (measured with `taskstop/trap2.mjs`; that a hard kill follows is inferred). Stopping a background pi-worker running a fake Claude build the same way gave exit 143, `aborted by SIGTERM`, a `stopped` build record, an empty temp folder, no lock and no claude (measured, `taskstop-run.sh`). So the seat's normal stop path cleans up on macOS. On Windows the stop path was not measured.

**Leftovers on this machine.** This Mac's real TMPDIR holds 33 `nana-lane-preamble-*` folders from 2026-10-22 and 2026-10-23 (measured; I listed names and modes and read only key names, never values). Every one names a test fixture worktree in its `preamble.md`, not a real lane:
- 16 come from build-report test fixtures and 1 from a build-records fixture, each holding `preamble.md` only. build-report's hard-kill case SIGKILLs pi-worker on purpose (`build-report.test.mjs:104-109`), so each direct run leaves one folder in the caller's TMPDIR (inferred from code; one leftover per fixture folder fits).
- 16 come from one `worker-claude-5mFs81` run at 00:59 to 01:00 on 2026-10-23, every build of that run, each with `builder-settings.json`. Their carried names match the test's fixture sets exactly, so the values are the fixture's fake ones (inferred). Why every build in that run leaked is unknown; a pi-worker draft without the `finally` would do it (inferred).
- The suite runner gives each test file its own TMPDIR and removes what it leaves (R-917, `scripts/test.mjs:478`). So suite runs leak nothing; direct `node <test>` runs do.

**How the test reads `CLAUDE_CONFIG_DIR` today.** `worker-claude.test.mjs:123-135` builds every child env as `{ ...process.env, HOME, USERPROFILE, … }` and never clears `CLAUDE_CONFIG_DIR`. pi-worker reads the source settings from `CLAUDE_CONFIG_DIR` when it is set and not empty (`pi-worker.mjs:213-214`). Measured with a decoy folder exported:
- A direct run (`node packages/nana-pack/tests/worker-claude.test.mjs`) fails 3 checks: R-2655, R-2664 and R-2665. The known-bug line names only R-2655.
- The earlier builds (R-2646 to R-2654) pass while reading the decoy file. Its key and helper went into each builder settings file and into the test's own settings copy (measured: the decoy values appear in the output).
- Through the suite runner (`node scripts/test.mjs packages/nana-pack/tests/worker-claude.test.mjs`) the file passes, because the runner scrubs `CLAUDE_CONFIG_DIR` (R-2396, `scripts/test.mjs:334`).
- The mutation runner's scrub does not include `CLAUDE_CONFIG_DIR` (`packages/nana-pack/lib/mutation-runner.mjs:412`, read, not run). So a seat's pairs run exposed, like a direct run (inferred).
- This shell has no `CLAUDE_CONFIG_DIR` set (measured). The bug bites only on a machine that exports it.
- `build-records.test.mjs:125-130` has the same spread. It deletes only `PI_CODING_AGENT_SESSION_DIR` and `BR_SWAP_LEDGER`, so its R-2653 Claude build reads an exported folder too. No check there reads the carry source, so it stays green (inferred from code).

**The prototype.** In the scratch clone I applied the design below to pi-worker.mjs (7 lines in, 5 out) and drafted the tests in worker-claude.test.mjs (measured):
- Main's pi-worker with the drafted tests: R-2691 and R-2693 red 5 of 5 runs; R-2692 green (it guards existing behaviour); every old check green.
- Fixed pi-worker: all 13 checks green 5 of 5 runs, direct and through the suite runner, with a decoy `CLAUDE_CONFIG_DIR` exported.
- The decoy line alone, without the clearing, turns R-2655, R-2664 and R-2665 red on any machine.
- worker-lane (65 pass), review-ledger (171 pass, including R-733), build-records, build-report, brief-check and win32-launch stay green on the fixed copy.

## Design

Three parts, each the smallest change that closes its leak.

**Part 1: refuse review options before anything else (R-2691).** Move the review-option check (`pi-worker.mjs:344-348`) unchanged to just before the duplicate-option check at `:89`, reading `own` (the arguments before `--`, `:38`) instead of `w.ownArgs`. In lane mode pi-worker then refuses a review option before it runs the brief check, resolves the roster, reads the user Claude settings, writes the temp folder or spawns the trust check. No folder is made, so nothing needs removing. Today lane mode reads the user settings and copies the key into a temp file for a command it will refuse (measured: carry line printed).
- Behaviour change: a review option now wins over every other refusal, in both modes. For example, a non-lane `pi-worker --item x` with no `--out` now prints the review-option line, not usage; a lane call outside a worktree does too. Both exit 1 either way. No test pins that order (measured, grep for the review-option text: only R-733's test, which still passes).
- This makes R-733 ("refuse review options before running anything") and the pack README's "refuses both, before running anything" (`README.md:384`) true in lane mode too. Today both are false there (measured).
- Rejected: removing the folder on that exit (one `rmSync` line, the `:342` pattern). It still reads the settings and writes the key, then deletes it, and it keeps effects ahead of argument checks. Pair 2 shows R-2691 rejects it.

**Part 2: no signal default in the start-up window (R-2693).** Before `mkdtempSync`, register one no-op listener each for SIGINT, SIGTERM and SIGHUP. Do not remove them.
- How it works: a listener replaces Node's default exit. All lane-mode code up to `await runWatchdog(…)` (`:359`) is synchronous, so a signal in the window queues. runWatchdog adds its own handlers and spawns the builder before its first await (`pi-watchdog.mjs:277-278`, `:190`, `:221`). The queued signal then reaches runWatchdog's `stop`, which kills the builder group. The normal stop path follows: `finally` removes the folder, the lock is released, the `stopped` record is written and the exit is 130, 143 or 129.
- Measured on the prototype (probe 8, 6 runs): SIGTERM as soon as the folder appeared gave exit 143, the abort line, a `stopped` end record, no temp file, no lock, and the fake claude never got as far as writing its pid.
- Why keep them: every line after the last await (`:363-379`) is synchronous and ends in `process.exit`. So a kept listener only means a signal during the output write and end record lets them finish (inferred). pi-review removes its setup listeners in a `finally` (`pi-review.mjs:231`); here removal would add a line and restore a mid-record kill. That is a named departure. The prototype measured both variants green.
- A signal before the folder exists still kills pi-worker at once. Nothing exists to clean then (no folder; the lock comes later).
- Trade: a step in the window that hangs (the trust check's `spawnSync` has no timeout, `:76`) now ignores SIGINT, SIGTERM and SIGHUP until it returns, and SIGKILL still stops it. pi-review's checkout setup already has this property (inferred, same pattern). It goes in the known limits.

**Part 3: keep the tests away from a caller's `CLAUDE_CONFIG_DIR`.** These are fixture edits, not new tests and not new rows.
- `worker-claude.test.mjs` `baseEnv`: build the env object, `delete env.CLAUDE_CONFIG_DIR`, then spread the case's `extra`. R-2655's second build still sets its own folder through `extra`.
- `worker-claude.test.mjs`, near the top, before any build: set `process.env.CLAUDE_CONFIG_DIR` to a decoy folder under the fixture's TEMP. Its `settings.json` holds an `env` with a decoy `HTTPS_PROXY`. Then the clearing runs on every machine and in CI. Without it, R-2655, R-2664 and R-2665 go red (measured). This decoy is the pin.
- `build-records.test.mjs` `baseEnv`: add `delete env.CLAUDE_CONFIG_DIR;` beside its two deletes. This is written, not pinned: no check in that file reads the carry source, and pinning it would widen R-2653's check past its row.

**Not in scope, with reasons.**
- SIGKILL and forced kills on Windows. No handler can run. A sweep of stale `nana-lane-preamble-*` folders at the next launch needs a pid file, pid reuse rules, Windows liveness checks, and a way never to delete a live build's settings file. That is more than the leak is worth: the file is 0600 in a 0700 folder under the per-user TMPDIR, readable only by the same user, who can already read the source. Deleting the settings file once claude has read it is unmeasured, and claude may read it again. Both go in Open questions and the known limits.
- An `exit` listener in pi-worker (the `tests/tmp-dir.mjs:12-17` pattern). After parts 1 and 2 every exit path already removes the folder, so it would add cover for nothing.
- The mutation runner's missing scrub and the build-report fixture leak are FEAT-031 test-tool issues. They get known-bug lines.

## Class

Gate, as the owner named it. AGENTS.md's letter would read ordinary. pi-worker is not a land or review tool, not a pi extension, not a hook, not gate policy and not nana-setup, and pi-review imports pi-watchdog, not pi-worker (measured: `pi-review.mjs:32-36`). The parity lane classed its pi-worker change gate only because it also changed pi-watchdog's `runOnce`. This lane does not touch pi-watchdog.

The plan keeps the gate ladder anyway. The owner said gate; the code handles a key; and the cost is one more reviewer and one independent check. Ladder, from the roster (measured, `nana-roster.mjs`): Opus final reviewer (`claude-review`), astra land reviewer (`pi-review`, so no `seat-land.md`), the seat's wrong-code pairs, one independent check. No install check: no nana-setup, hook or extension file changes. The Windows CI leg is required (ruling 2026-10-10).

A needed change to pi-watchdog, worker-config, review-launch or build-records code stops the build, which reports instead.

## Threat model

Honest variation is in scope:
- platforms: macOS, Linux, native Windows; Windows 8.3 temp spellings; `os.tmpdir()` from TMPDIR on POSIX and TEMP or TMP on Windows;
- each of the five review options, with or without a value, anywhere before `--`, in lane and non-lane mode, with a pi or Claude roster;
- every handled exit after the temp folder exists: refusals, a failed write, the ceiling, success, and SIGINT, SIGTERM or SIGHUP at any moment, including the first 100 ms;
- Claude Code's background-task stop (SIGTERM, then a kill about 1.45 s later), a terminal Ctrl-C, a closed terminal;
- the caller's environment: an exported `CLAUDE_CONFIG_DIR`, set or empty, on a seat machine or in a direct test run, the suite runner or the mutation runner;
- a missing, unreadable or malformed user settings file.

Deliberate forgery is out:
- another process of the same user reading the 0600 settings file while a build runs;
- a user who SIGKILLs pi-worker on purpose;
- a planted folder or link in TMPDIR (mkdtemp makes a fresh 0700 folder anyway);
- an edited pi-worker, roster or test file.

A finding outside the model is a residual.

## Precedent

Precedent:
- packages/nana-pack/bin/pi-worker.mjs — the review-option check that moves (`:344-348`); the `own` slice it will read (`:36-50`); the first lane refusal it moves above (`:89`); the folder and its files (`:150-166`); the cleanups already there: `laneFailure` (`:68-73`), the watchdog-option exit (`:342`) and the `finally` (`:359-360`); the last await (`:359`) and the synchronous tail (`:363-379`).
- packages/nana-pack/bin/pi-review.mjs — setup-phase listeners for SIGINT, SIGTERM and SIGHUP registered before its checkout work (`:70-72`) and removed in its `finally` (`:231`): the pattern part 2 follows. It also refuses bad arguments before any effect (`:40-44`), as part 1 does.
- packages/nana-pack/bin/pi-watchdog.mjs — the handler map and stop path the queued signal reaches (`:266-303`), and the spawn before the first await (`:171-221`).
- packages/nana-pack/tests/review-ledger.test.mjs — R-733's refusal check (`:173-175`), kept unchanged.
- packages/nana-pack/tests/worker-claude.test.mjs — the fixture, `baseEnv` (`:123-135`), `workerArgs` and its skip-a-default pattern (`:137-142`), `runWorker` (`:143-148`), and the POSIX-only SIGTERM subcase with its skip by name (`:285-305`).
- packages/nana-pack/tests/build-records.test.mjs — `baseEnv` deleting names from a spread env (`:125-130`).
- packages/nana-setup/tests/project-stale.test.mjs — `delete env[key]` for `CLAUDE_CONFIG_DIR` in a spawned env (`:65`).
- packages/nana-knowledge/tests/hook.test.mjs — a test setting `process.env` before it spawns (`:24`), the decoy's pattern.
- scripts/test.mjs — the runner's `CLAUDE_CONFIG_DIR` scrub (`:334`) and per-file `TMPDIR`, `TEMP` and `TMP` (`:478`), the env shape the new cases use.
- docs/reviews/claude-code-builder-parity-2026-10-22/must-meet.md — the rows this lane sits beside (R-2655, R-2664, R-2665), the gate class for pi-worker work, and the SIGKILL residual it recorded.
- docs/reviews/claude-code-builder-parity-2026-10-22/independent-check-ef39406b.md — note 1, the finding and both fixes it offered.
- docs/reviews/install-check-builder-2026-10-23/plan-draft.md — the plan shape.

Departures, each named:
- Part 2 keeps its listeners for the life of the process, where pi-review removes its own. The reason is in Design.
- Part 2's listeners do nothing. pi-review's record the signal and check it after each step, because its setup has steps that can stop early. pi-worker's own watchdog handles the queued signal.

## Must-meet rows (FEAT-006)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2691 | IF pi-worker lane mode receives a review option (`--item`, `--role`, `--revision`, `--over-cap` or `--worker`), THEN it shall exit 1 with the review-option line before it reads the user Claude settings file or writes any file in the OS temp folder. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2691: in lane mode each review option exits 1 with the review-option line before the user Claude settings are read or any temp file is written` |
| R-2692 | WHEN pi-worker lane mode ends after writing its temp files, by a finished build, a held-lock refusal, an invalid `--stall-secs`, an output file it cannot write, the wall-clock ceiling or, off win32, a SIGTERM stop, it shall leave no file or folder of its own in the OS temp folder. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2692: a finished build, a held lock, a bad stall option, an unwritable output, the ceiling and, off Windows, SIGTERM each leave the temp folder empty` |
| R-2693 | WHERE the platform is not win32, WHEN pi-worker lane mode receives SIGINT, SIGTERM or SIGHUP after it has written its temp files and before its builder starts, it shall exit with the code and abort line of a stop during the build and leave no temp file and no lane lock. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2693: off Windows, SIGINT, SIGTERM or SIGHUP sent once the temp files exist and before claude starts stops the build with the stop exit code and abort line and leaves no temp file and no lane lock` |

Each row starts `untested`, then becomes `implemented` with its backticked `file::title` evidence when its check passes.

R-2692 is green on main, by design: it guards the exits the independent check measured clean, which nothing pins today. Pairs 5 to 7 and 13 show it turning red. Drop it if a reviewer holds that a must-meet row must be red on main; then those exits stay unpinned.

Part 3 adds no row. Its pin is the decoy, which makes R-2655, R-2664 and R-2665 fail whenever the clearing is missing.

Existing rows unchanged: R-733 keeps its text and test, and now also holds in lane mode. R-2647, R-2655, R-2664, R-2665 and R-2651 keep their text and titles. No seal test: there is no new sealed tunable.

R-2694 to R-2699 stay free, as do R-2688 to R-2690.

### What each test does, and why it is red on main

All three live in `worker-claude.test.mjs` after R-2665's check and before the seal check. They use the existing fixture, Claude roster, fake claude and lock path. Two small helpers:
- a fresh, empty temp folder per case under the fixture's TEMP;
- an env extra that sets `TMPDIR`, `TEMP` and `TMP` all to it, because Windows reads TEMP and TMP (precedent `scripts/test.mjs:478`).

Each case passes that extra through `runWorker`'s `env`. Each case removes the lane lock after it, so one failing case cannot redden the next. `workerArgs` skips its default `--out` when a case passes its own, as it already does for `--poll` and `--stall-secs`.

- **R-2691.** Write the user settings with `apiKeyHelper` and an `ANTHROPIC_API_KEY` marker. For each of the five options (`--item x`, `--role sol`, `--revision HEAD`, `--over-cap why`, `--worker`), run one lane build with a fresh temp folder. Assert:
  - exit 1;
  - stderr holds `pi-worker: <option> is a review option`;
  - stderr holds no `pi-worker: claude settings carry:` line, so the settings were never read;
  - the temp folder is empty;
  - the fake claude recorded no call.

  Red on main on every platform: the carry line is printed and the folder stays (measured 5 of 5).
- **R-2692.** One run per case, each with a fresh temp folder; assert the exit code and an empty temp folder. Each case also needs a witness that the temp files existed before the exit, or a case refused earlier would pass for the wrong reason:
  - finished build: exit 0;
  - held lock (write the lock file first): exit 1;
  - `--stall-secs abc`: exit 1;
  - `--out` inside a folder that does not exist: exit 1, and stderr holds `[pi-worker] FAILED: cannot write`;
  - `--max-secs 1` with a 10 s fake: exit 1;
  - POSIX only: SIGTERM once the fake has written its pid, exit 143, skipped on win32 by name as R-2651's subcase is.

  The witness for every case but SIGTERM is exactly one carry line in stderr, printed right after the settings file is written. For SIGTERM it is the fake's pid file. Green on main (measured). It turns red when any cleanup is lost, and the witness turns it red when a case stops testing its exit (pair 13, measured).
- **R-2693.** POSIX only; SKIP on win32 by name. For SIGINT, SIGTERM and SIGHUP, once each:
  - spawn a lane build with a 10 s fake and a fresh temp folder;
  - poll that folder every 1 ms until it holds an entry;
  - record whether the fake's pid file exists yet;
  - send the signal and wait for the close, with the case limit and a SIGKILL fallback.

  Assert the signal went before claude started, the exit code is 130, 143 or 129, stderr holds `[pi-worker] aborted by <signal>`, the temp folder is empty and there is no lane lock. If the signal lands after claude started, the case did not test the window. Repeat that case up to three times, and fail only if it never lands first. This keeps a slow machine from failing the fixed code. Red on main: pi-worker dies by the signal with the folder left (measured 5 of 5 runs, 3 signals each).

Part 3's fixture edits change no check title.

## Tunables

None new. The review-option list moves unchanged, still inline. The three signal names stay inline as in `pi-review.mjs:71` and `pi-watchdog.mjs:277`; a shared constant would mean changing pi-watchdog, which pi-review runs, for no change in behaviour. The test's exit codes 130, 143 and 129 are the POSIX stop codes `workerExit` maps inline (`pi-worker.mjs:258`); R-2651's check already uses 143 as a literal. No `worker-config.mjs` change.

## Wrong-code pairs (the seat runs each; each must turn its test red every run)

None is Windows-only. Pairs 9 to 12 turn red only off Windows, where R-2693 runs; the mutation runner runs on macOS. "Measured" means I ran it once on the scratch clone.

1. Main's pi-worker: the review check after the temp folder and no start-up listeners → R-2691 and R-2693 (measured, 5 of 5).
2. The review check left after the temp folder, with an `rmSync` of the folder before its exit (the rejected fix) → R-2691, by the carry line (measured).
3. The early review check guarded by `!laneMode` → R-2691 (measured).
4. The early review check's list cut to `--item` only → R-2691, by the other four options (inferred).
5. `laneFailure` without its `rmSync` → R-2692, held lock (measured).
6. The watchdog-option exit (`:342`) without its `rmSync` → R-2692, bad stall option (measured).
7. The runWatchdog `finally` without its `rmSync` → R-2692 every build case, and R-2647 and R-2655 (inferred).
8. The start-up listeners registered after `mkdtempSync`, with the trust check between them → R-2693 (inferred from the measured window; the folder exists before the listener).
9. No start-up listeners → R-2693 (measured).
10. The start-up listeners registered just before `await runWatchdog` → R-2693 (measured).
11. A start-up listener that removes the folder and calls `process.exit(1)` itself → R-2693, and others by cascade (measured).
12. Start-up listeners for SIGTERM only → R-2693, by its SIGINT and SIGHUP cases (inferred).
13. Test helper: `workerArgs` keeps its default `--out` when a case passes its own, so the case is refused as a duplicate before the folder → R-2692, by the witness (measured).
14. Test fixture: `baseEnv` without `delete env.CLAUDE_CONFIG_DIR` → R-2655, R-2664 and R-2665 (measured, with the decoy).

Not pairs, declared: removing the decoy line leaves every check green, because it is the pin's trigger. Removing build-records' delete leaves every check green, because it is unpinned. Removing the listener-keeping (adding pi-review's removal) leaves every check green, because only a signal during the final record write differs.

## Windows notes

- R-2691 runs on Windows unchanged: the refusal happens before any file, process or signal work.
- R-2692 runs on Windows except its SIGTERM subcase, skipped by name. `os.tmpdir()` there reads TEMP, then TMP; the helper sets TMPDIR, TEMP and TMP. The fixture TEMP is already a native real path (`worker-claude.test.mjs:44`), so 8.3 spellings do not arise in the new folder names (inferred).
- The ceiling case on Windows polls CPU through PowerShell every 0.2 s (`pi-watchdog.mjs:150`). Windows PowerShell can create and delete policy-test files in %TEMP% (inferred, not measured). If CI shows a foreign entry, the "empty" check must narrow, so the seat reads R-2692's Windows result before the final round.
- R-2693 is SKIP on win32: this harness has no catchable child signal there. Part 2's listeners still register on Windows. Node delivers SIGINT for Ctrl-C and SIGHUP for a closed console window; SIGTERM never arrives (Node docs, inferred). pi-review already registers the same three on Windows.
- A forced kill on Windows (`taskkill /F`, TerminateProcess, and likely Claude Code's task stop there) runs no handler, so it leaves the folder like SIGKILL does (inferred; not measured).
- The `finally`'s `rmSync` on Windows is unchanged; R-2655's existing "gone after the build" assertion already runs on the Windows leg.

## Known limits (the seat writes them to the known-bug files before the final round)

FEAT-006:
- A hard kill of pi-worker (SIGKILL, a forced kill on Windows, or a seat stop that escalates because pi-worker did not exit in about 1.45 s) leaves its temp folder with the carried settings file (0600 in a 0700 folder), its lane lock, its `pi-review-*` capture folder and a running claude (measured on macOS for SIGKILL). Claude Code's task stop sends SIGTERM first, which cleans up (measured).
- A signal before the temp folder exists still ends pi-worker at once; it leaves nothing, since the folder and the lock do not exist yet (inferred from code order).
- A step between the temp folder and the watchdog that hangs (the trust check's node, a git call, the build record's append) now ignores SIGINT, SIGTERM and SIGHUP until it returns; SIGKILL still stops it (inferred; pi-review's checkout setup does the same).
- A signal in the start-up window starts the builder and kills it at once, because the queued signal reaches the watchdog only after its spawn; the build record says `stopped` with one attempt (measured on the prototype; claude never wrote its pid).
- `build-records.test.mjs` clears `CLAUDE_CONFIG_DIR` but nothing pins it.

FEAT-031:
- The mutation runner's child env keeps `CLAUDE_CONFIG_DIR` (`mutation-runner.mjs:412`), unlike the suite runner (R-2396). The two test files that start a Claude build now clear it themselves.
- build-report's hard-kill case leaves one `nana-lane-preamble-*` and one `pi-review-*` folder in the caller's TMPDIR on each direct run (measured: 16 of the 33 leftovers on the planning Mac came from build-report fixtures). The suite runner's per-file temp folder contains them.

## Not verified

- Anything on Windows or Linux. Every probe ran on this Mac. CI's Windows leg must show R-2691 and R-2692 green and R-2693 SKIP.
- Claude Code's background-task stop on Windows, and so whether a Windows seat's stop leaves the folder.
- That PowerShell leaves nothing in the fixture's TEMP during R-2692's ceiling case on Windows.
- A real claude: every build used the fake.
- The mutation runner exposing worker-claude to a caller's `CLAUDE_CONFIG_DIR` (code read, not run).
- build-records' R-2653 case reading an exported `CLAUDE_CONFIG_DIR` (code read, not run).
- Why one worker-claude run on 2026-10-23 leaked every build's folder.

## Docs that change

- `packages/nana-pack/README.md`:
  - `:282`: pi-worker refuses review options in either mode before it reads a brief, the roster or the Claude settings, and before it writes any temporary file.
  - `:299`, after "The same temporary folder and `finally` cleanup cover the preamble, prompt and settings files.": add that a refusal or a signal after the folder exists removes it too, and that a hard kill (SIGKILL, a forced kill on Windows) leaves it with the settings file, mode 0600 in a 0700 folder.
  - `:384` stays; its "before running anything" becomes true in lane mode.
  - The readme check stays green: no new command, path or flag.
- `packages/nana-pack/bin/pi-worker.mjs` header: `@effects` adds "registers no-op start-up signal listeners in lane mode". Regenerate `docs/code-map.md` if `map:check` asks.
- `REQUIREMENTS.md`: R-2691 to R-2693 in FEAT-006 after R-2665. Regenerate `docs/requirements-tree.md`.
- `docs/known-bugs/FEAT-006.md`:
  - Line 84 closes and is replaced by the hard-kill line above.
  - Line 89 closes.
  - Add the other FEAT-006 known limits above.
- `docs/known-bugs/FEAT-031.md`: the two FEAT-031 lines above.
- HANDOFF, in the reviewed change before the final round: Next item 3 names the lane while it builds; a Landed line; the session entry in `docs/sessions/2026-10.md`. Run `nana-writing HANDOFF.md`.
- Unchanged: pi-watchdog, worker-config, review-launch, build-records code, pi-review, every hook, extension and nana-setup file.

## Seat steps

1. Cut `feat/lane-temp-cleanup` from current main (8c24e357) at `~/nana-pi-wt/lane-temp-cleanup`.
2. Run one adversary pass on this draft. Commit the must-meet of record, this draft, the attack and build brief 1 in `docs/reviews/lane-temp-cleanup-2026-10-23/`. The brief carries `Feature: FEAT-006 · Launch builders with execution limits` and the Precedent list above. Run `node "$HOME/nana-pi/packages/nana-pack/bin/brief-check.mjs" --brief <file> --tree <worktree>`.
3. Build with `pi-worker --lane lane-temp-cleanup --brief … --out … --lane-size small` (roster builder luna). The change is a few lines plus one test block. Choose `--lane-size larger` (sol) if you weight the signal timing as risky. Start a failure watcher and heartbeat at launch.
4. Seat checks on the tip:
   - Diff-check the test file for removed escapes in its template literals: `FAKE_BODY` holds `\\n` (memory note on builder unescapes).
   - Run worker-claude, review-ledger, worker-lane, build-records, build-report, brief-check and win32-launch directly, with a decoy `CLAUDE_CONFIG_DIR` exported and a scratch TMPDIR. Then check that TMPDIR is empty except build-report's known leftovers and `node-compile-cache`.
   - `npm run test:locked`, `map:check`, the readme check and the trace.
   - `node scripts/requirements-moved.mjs --root . --base main`, carried into the review briefs and the land.
5. Probes on the tip, macOS, scratch HOME and TMPDIR, fake claude:
   - each review option leaves nothing;
   - a background-task stop of a running Claude build leaves nothing;
   - SIGKILL leaves the folder, the known limit.
   Keep the outputs in the lane folder.
6. Run pairs 1 to 14 through the mutation runner. The baseline must include the decoy line. Re-run after any seat change to code or tests, before the review.
7. Push a draft PR. CI's Windows leg must show R-2691 and R-2692 PASS and R-2693 SKIP. Read R-2692's Windows detail for foreign temp entries.
8. Write the notes before the final round, and run `review-ledger keep`.
9. Run the Opus final reviewer, the astra land reviewer and the one independent check on the exact tip. Then `nana-land`.

## Open questions to the owner

1. **The start-up signal gap.** This draft closes a gap the owner did not name: a signal in the first tenth of a second leaves the folder and sometimes the lane lock (measured 12 of 12 at 0 to 75 ms). It costs 3 lines with pi-review as precedent and one test. The trade is that a hung start-up step then ignores SIGTERM. Default: **include**.
2. **Hard kills.** A SIGKILL or a Windows forced kill still leaves the key file. A sweep of stale folders at the next launch would close it, at the cost of pid files and the risk of deleting a live build's settings. Default: **no** (known limit).
3. **The 33 leftover fixture folders in this Mac's temp folder.** They hold fixture values only (inferred). They sit outside any working folder, so removing them needs the owner's yes. Default: **remove**.
