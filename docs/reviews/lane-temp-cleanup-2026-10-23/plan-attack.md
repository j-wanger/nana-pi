# lane-temp-cleanup · plan attack (adversary, 2026-10-23, main 8c24e357)

Read-only pass over `plan-draft.md`. Scratch work: `scratchpad/ltc-attack/`. `fix/` is `git archive 8c24e357` with the planner's `prototype.diff` applied. Beside it: `pw-main.mjs`, `pw-fixed.mjs`, the wrong variants `pw-v1.mjs` to `pw-v3.mjs` (made by `mkvariants.mjs`) and `pw-epfix.mjs`; `probe.mjs` (modes `piabort`, `epipe`, `order`, `early`) with its `probe-*.json` outputs and `pf-*` run folders; the test runs `run-v1.txt` to `run-v3.txt`; `monitor.mjs` and `mon.log`. Every probe set HOME, USERPROFILE and TMPDIR inside `scratchpad/ltc-attack/`, cleared `CLAUDE_CONFIG_DIR` and `NANA_*`, and used a fake claude. No probe made a model call. I read one CI log (run 39980863580, main 8c24e357) and the installed pi 1.0.2 package. The checkout's `git status --porcelain` was empty before and after. Each claim is marked measured or inferred.

## Summary

The three parts work as drafted. In the scratch copy the prototype's 14 checks passed and its temp folder stayed empty (measured). Every listed pair turns its named test red for a fixed reason, by reading. The R-2693 pairs rest on a window of about 80 ms against a 1 ms poll, which holds.

One part must change. The plan files SIGKILL under deliberate forgery and says the seat's normal stop cleans up. That holds only for the Claude Code seat. pi 1.0.2's bash tool runs the pi seat's foreground build, and it SIGKILLs the command's whole group on Esc, on its own SIGTERM or SIGHUP, on terminal loss and on a timeout. Simulated, that leaves the key file, the capture folder, the lane lock and a claude builder that keeps running, on main and on the fix (M-1). Open question 2 then asks the owner to decide hard kills on a false premise.

Four parts should change. A closed stderr is an uncaught exit the inventory misses, and one measured line closes it (S-1). The lane-mode "before anything else" claim is unpinned (S-2). R-2693 is wider than its test (S-3). Open question 3's removal needs a rule that cannot hit a live build (S-4).

## Findings

### M-1 · A pi seat's normal stop is a process-group SIGKILL, and the plan calls SIGKILL forgery

- Measured, by reading the installed pi 1.0.2 package:
  - The bash tool spawns its shell with `detached: true` off Windows (`dist/core/tools/bash.js:63-69`).
  - On abort (Esc, `app.interrupt`) and on its timeout it calls `killProcessTree` (`:78-89`, `:94-100`).
  - `killProcessTree` is `process.kill(-pid, "SIGKILL")` off Windows and `taskkill /F /T /PID` on Windows (`dist/utils/shell.js:157-187`).
  - The TUI's SIGTERM and SIGHUP handlers, its terminal-loss exit and its crash handler all call `killTrackedDetachedChildren` (`dist/modes/interactive/interactive-mode.js:3516-3530`, `:3462-3465`, `:3481-3492`). So do print mode and RPC mode, which the desk drives (`dist/modes/print-mode.js:35-40`, `dist/modes/rpc/rpc-mode.js:279-284`).
- So the ordinary ways to stop a pi seat's foreground build reach pi-worker as SIGKILL: Esc, closing its terminal, stopping a desk session, a bash timeout. nana-seat.md tells a pi seat to run the builder as one foreground command. AGENTS.md lists the pi TUI and desk sessions as seats, and the spend line names both seats.
- Measured, probe `piabort` (`probe-abort-main.json`, `probe-abort-fixed.json`). pi-worker ran under `bash -c` in its own group and was killed with `kill(-pid, SIGKILL)` 300 ms after the fake claude started. On main and on the fix, 2 of 2 each:
  - the `nana-lane-preamble-*` folder stayed, and its `builder-settings.json` held the fixture key;
  - a `pi-review-*` folder stayed with `out.txt`;
  - the lane lock stayed;
  - the fake claude was alive and still writing 1 s later.
- The builder survives because runOnce starts it in its own group (`pi-watchdog.mjs:190`), which pi's group kill does not reach (measured above; cause by reading).
- The plan says otherwise in three places:
  - Threat model: "a user who SIGKILLs pi-worker on purpose" is forgery, while "a terminal Ctrl-C, a closed terminal" are in scope as handled.
  - What I measured: "So the seat's normal stop path cleans up on macOS."
  - Open question 2 treats a hard kill as the rare case, default no.
- Consequence: the known-bug line, the README sentence and the owner's answer to Open question 2 would all rest on a premise that is false for one of the two seats. On a pi seat the leftover is not only a 0600 file. An unwatched Claude builder with write tools keeps editing the worktree with no ceiling. FEAT-006:52 already says this for a pi builder ("pi may still be working and spending").
- Change:
  - Threat model: move the pi seat's stop into honest variation, marked not closed. Name Esc, a closed terminal, a desk stop and a bash timeout, each a group SIGKILL off Windows and `taskkill /F /T` on Windows. Keep only a deliberate `kill -9` by hand under forgery.
  - What I measured: say the Claude Code seat's stop cleans up and the pi seat's stop does not.
  - Known limits and README `:299`: name the pi seat's stop as the common hard kill, and say the builder keeps running. Extend FEAT-006:52's line to the Claude Code builder.
  - Open question 2: restate it with these facts, and name the fix and its cost. A detached reaper, started after the lock, polls pi-worker's pid, as `packages/nana-setup/lib/bounded-spawn-child.mjs` polls its parent (`RELAY_PARENT_POLL_MS`). When pi-worker dies it removes the temp folder, kills the builder's group, and removes the lock only if the lock still names the dead pid. Off Windows it must sit in its own group to outlive pi's group kill. On Windows `taskkill /T` ends it with the tree, so it closes nothing there (inferred). The call stays the owner's, and the default may stay no, but on these facts.
  - Seat step 5: add the pi-seat stop probe (`bash -c`, group SIGKILL) beside the Claude Code stop, and keep its output in the lane folder as the known limit's evidence.

### S-1 · A closed stderr crashes pi-worker mid-build and leaves the key, the lock and a running builder

- Measured, probe `epipe` on the fix (`probe-epipe-fixed.json`, 2 of 2). Once claude had started, the probe closed pi-worker's stderr pipe. pi-worker exited 1 within 0.5 to 0.7 s. It left the temp folder with the key, the capture folder and the lane lock, and the fake claude kept running.
- Measured cause (`mon.log`, an `uncaughtExceptionMonitor` preload): an uncaught `write EPIPE`. The failing write is the watchdog's `cpu=` line, which it prints every poll for a Claude builder too (`pi-watchdog.mjs:249`).
- The plan's exit inventory has no uncaught throw after the folder exists. Realistic inputs, all inferred: a pi process that dies hard, so its group kill never runs and pi-worker outlives it; a pi quit that exits without aborting the tool; a `| head` on the seat's command; a desk that drops a session's pipe.
- Measured fix (`pw-epfix.mjs`, 2 of 2): one line, `process.stderr.on('error', () => {})`, beside part 2's listeners. pi-worker kept watching, the build ended with exit 0 after about 6.4 s, and nothing was left. It changes no message while the pipe works.
- Change: add the line to part 2, in lane mode. Either add one EPIPE case to R-2692 off Windows (close the stderr pipe once the pid file exists, wait for the close, assert exit 0 and an empty temp folder), or record the line as unpinned. pi-review has the same exit. That needs a review-tool lane, so it gets a known-bug line in its own feature.

### S-2 · Nothing pins "before anything else" in lane mode, though the plan says R-733 and the README now promise it

- Measured (`pw-v2.mjs`, `run-v2.txt`): a variant that keeps the non-lane check early, and refuses a lane-mode review option only just before the temp folder, passed all 14 checks, R-2691 included.
- Measured (`probe-order-*.json`): with `--item x` and a missing brief, the variant and main print `lane refused: brief file does not exist`. Run outside a linked worktree, both print `lane refused: main checkout is not a linked worktree`. The fix prints the review-option line in both cases.
- So three claims rest on nothing: R-733's "before running anything" in lane mode, README `:384`'s "refuses both, before running anything", and the new README `:282` sentence "before it reads a brief, the roster or the Claude settings". R-2691's row ("before it reads the user Claude settings file or writes any file") is satisfied by a check placed late in the lane block.
- Change: fold one run into R-2691's test, with no new title. `--item x` with a brief path that does not exist asserts exit 1 and the review-option line. List the variant as a pair against R-2691.

### S-3 · R-2693's row covers every builder, but its test starts only the Claude one

- Measured (`pw-v3.mjs`, `run-v3.txt`): start-up listeners registered only `if (isClaudeBuilder)` passed all 14 checks.
- R-2693's row covers any lane build. A pi build has the same window. On main that window once left the lane lock (planner, measured, one 75 ms run), and a pi build's folder holds `preamble.md` (planner, measured). So the variant keeps both for pi builds (inferred).
- Change: add one pi-roster run to R-2693's test. The fixture already has a fake `pi`, and `--lane-size small` starts it. Send SIGTERM at the folder's first entry, then assert exit 143, the abort line, an empty temp folder and no lock. List the variant as a pair. Or narrow the row to the Claude Code builder and say why.

### S-4 · Open question 3's "remove" must not be a pattern at removal time

- At most two lanes build on this machine. A live build's folder carries the same `nana-lane-preamble-` prefix as the 33 leftovers. Deleting it takes a running pi builder's preamble file or a running claude's `--settings` file away. Whether either is read again mid-build is unmeasured (inferred risk).
- Change: the default reads "remove the 33 folders recorded at planning, by name, after re-reading that each `preamble.md` names a test fixture worktree". Never remove by pattern.

### N-1 · Add pi-review's listener removal, misplaced, as a pair: it silently drops the signal

- Measured (`pw-v1.mjs`): listeners registered before the folder and removed at the end of the lane setup, before `runWatchdog`, as a builder following pi-review's precedent might write. R-2693 went red (`run-v1.txt`).
- Measured, probe mode `early`: one SIGTERM sent at the folder's first entry was swallowed, and the build ran on to `SUCCESS` with exit 0. That is worse than main, where the signal at least stops pi-worker.
- Change: list it as a pair against R-2693. It is the likeliest wrong build, because pi-review is the named precedent.

### N-2 · R-919 is the nearest precedent for the empty-temp check, and it already passes on Windows

- `packages/nana-pack/tests/review-ledger.test.mjs:162-172` sets TMPDIR, TEMP and TMP to one folder, runs a success, a failure and a stall kill, and asserts the folder is empty. It is not platform-gated (measured, by reading). With `--poll 1 --stall-secs 1`, its stall case runs the PowerShell sampler twice on Windows (inferred from `pi-watchdog.mjs:212-251`).
- Measured from the CI log of run 39980863580 (suite, windows-latest): `PASS pi-watchdog removes capture directories after success, child failure and stall`. worker-claude passed there with 11 pass and 1 skip in 25.9 s.
- Change: cite R-919 as the precedent for the temp-folder helper. It moves the planner's riskiest assumption, PowerShell writing into TEMP, from unknown to "already passing in a kill case". Keep the seat's read of R-2692's Windows detail.

### N-3 · The install check now runs pi-worker lane mode in CI, and it cites pi-worker line numbers

- Since 96214696 the install check runs a real pi-worker lane build. CI runs it on every pull request, on macOS and Windows (`.github/workflows/ci.yml:1-5`, `:20-42`). Measured from the same CI run: `PASS pi-worker (cmd)` and `PASS pi-worker (sh)` on Windows.
- So a part 1 or part 2 change that refused every build would show in CI before the land. The plan's "No install check" holds by the ruling. Name these rows as the Windows lane-mode evidence.
- `packages/nana-setup/lib/install-check-config.mjs:137` and `:148-150` cite `pi-worker.mjs:104`, `:146-147`, `:188` and `:382` as contracts read 2026-10-23. Part 1 shifts those lines. They are dated reads, so leave them. Editing them would touch nana-setup and bring in the install-check ruling.

### N-4 · R-2603's source check bans two words outside column-zero comments

R-2603 (`review-ledger.test.mjs:177`) fails if pi-worker's source holds `admit` or `complete`. It strips only lines whose `//` starts at column 0. So an indented comment in the lane block, such as "until the setup is complete", turns R-2603 red (measured, by reading the regex). Put it in the build brief as a trap.

### N-5 · A Windows console close gives about 10 s, and the sampler can hold a signal longer

Part 2's Windows note says Node delivers SIGHUP when the console closes. Node's documentation says Windows ends the process about 10 s later. FEAT-006:88 measured a SIGTERM handled 25.7 s late while the synchronous CPU sampler ran. So a console close during a sampler run can end pi-worker before its cleanup (inferred). Add it to the known limits beside the hard-kill line.

### N-6 · Two seat stops are not verified

Nobody measured a Claude Code session that exits while a background build runs. Nobody measured a seat that runs pi-worker in a foreground Claude Code Bash call that times out. Add both to "Not verified".

### N-7 · Three of R-2692's six cases add no new pin

Success, the unwritable output and the ceiling all clean up through the same `finally` (`pi-worker.mjs:359-360`). R-2647 (`removed`) and R-2655 (`!fs.existsSync(carryCall.settings)`) already pin it, as pair 7's entry says. The held lock and the bad stall option are the two new pins, plus the SIGTERM subcase's empty folder. The ceiling case also adds the Windows taskkill path through cmd.exe. Keep the cases if they stay cheap, and say in the plan which ones carry the row.

### N-8 · A bad watchdog option still copies the key, the reason part 1 gives against the rmSync fix

- A bad `--stall-secs`, a bad `--poll` and a held lock all refuse after the settings carry. So the fix still copies the key into the temp folder and then deletes it (planner, measured). That is why the plan rejects the `rmSync` fix for review options.
- R-2692's witness for the bad stall option, one carry line, then pins that order. A later lane that checks watchdog options before any effect would turn R-2692 red.
- Change: say in Design why this order stays for watchdog options. Or witness that case by its error line, `pi-worker: --stall-secs and --poll must be positive numbers`, with no carry line required.

### N-9 · Three more exits end pi-worker without its stop path

- SIGQUIT (Ctrl-\ in a terminal) and, on Windows, SIGBREAK (Ctrl-Break) have no listener in pi-worker or pi-watchdog. Either kills pi-worker at once and leaves the folder (inferred, by reading). Name them in the known limits.
- When the builder launch is refused (`pi-watchdog.mjs:179-187`), runWatchdog awaits only settled promises. A signal queued in the start-up window is then never dispatched. pi-worker exits 1 with "FAILED after 1 attempt(s)" instead of the stop code (inferred, by reading). Cleanup still runs, so this is a note only.

### N-10 · Class

By AGENTS.md's letter this lane is ordinary. pi-worker is not a land or review tool, a hook, a pi extension, gate policy or nana-setup. No land or review tool imports pi-worker (measured: grep over `packages/nana-pack/bin` and `lib`). Keeping the gate ladder on the owner's word is fine.
