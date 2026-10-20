# review-test-waits — build brief 1

Feature: FEAT-031 · Run checks reliably and without contaminating work
Class: ordinary. Rows R-1920–R-1924; must-meet.md holds the row text and the Design.
Base: main after win-watchdog-cpu-read lands. Follow packages/nana-pack/prompts/builder-preamble.md. Work in the lane worktree on feat/review-test-waits. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change
1. REQUIREMENTS.md: add R-1920–R-1924 under FEAT-031 as untested. Flip each row to implemented, with its evidence, once its check passes. Then run `npm run req:tree`.
2. New packages/nana-pack/tests/launch-wait.mjs, with the six-tag header.
   - Export LAUNCH_RECORD_WAIT_MS = 60000 and LAUNCH_RECORD_POLL_MS = 25, each with its chosen reason.
   - Export awaitLaunchRecord(file, { closed, isComplete = () => true, limitMs = LAUNCH_RECORD_WAIT_MS, pollMs = LAUNCH_RECORD_POLL_MS }).
   - Each round reads first: ENOENT means not yet, and any other error throws. It returns the text once isComplete holds. Only after that read does it return null, if closed has settled or the limit has passed.
3. immutable-review.test.mjs:
   - One Node fake body: today's win32 body plus win-watchdog-cpu-read's stall values. win32 keeps writeFakePi.
   - On POSIX, write the body to fakeBin/pi-body.cjs. Then write an executable `pi`: `#!/bin/sh` and `exec '<process.execPath>' '<body file>' "$@"`. Delete the sh twin.
   - The body writes the pid file first, as today. It then writes cwd, NANA_REVIEW_ROOT, NANA_ROLE and the argv to `${OBSERVE}.part` in one write, and renames that onto OBSERVE.
   - Dirty-state, signal and reclaim: await awaitLaunchRecord(file, { closed }) with the close promise each check already makes. Take the record from the return value, and delete OBSERVE_WAIT_ITERATIONS.
   - Final rmSync: maxRetries and retryDelay come from two chosen constants, 5 and 100 ms. On a throw, call `check("the test's temporary folder is removed at the end", false, `${e.code} ${e.path ?? root}`)`. That line is FAIL-only and carries no marker.
   - Reword the stale W7c comments to today's state. Do not touch the stall check.
4. review-ledger.test.mjs section 7:
   - Make `exited` from k.once("exit") right after the spawn.
   - Wait with awaitLaunchRecord(childPidFile, { closed: exited, isComplete: (t) => /^\d+\n$/.test(t) }).
   - Send the signal only while k still runs, then await `exited` for the code.
   - A null record sets signalsCleaned to false and adds `${launcher} ${sig}: no pid record` to the check's detail.
5. New packages/nana-pack/tests/review-test-waits.test.mjs, with the six-tag header.
   - Constants, each chosen with its reason beside it: LATE_LAUNCH_MS 10000, RECORD_GAP_MS 1000, META_RUN_LIMIT_MS 270000 (below the runner's 300 s file limit) and HELPER_RACE_MS 5000.
   - R-1923: write an empty file and start the wait. At 200 ms, assert it has not settled. Write "123\n", then assert it returns "123\n".
   - R-1924, case (a): an empty file and an already-resolved closed return null. Case (b): no file, a closed that never settles, and limitMs 200 return null. Race each case against HELPER_RACE_MS.
   - Then write the CommonJS preload from the Design into a tmpDir root. Match pi-review by `path.basename(process.argv[1])`, and sleep with Atomics.wait.
   - Run immutable-review.test.mjs once with spawnSync from the package folder. Give it its own TMPDIR, TMP and TEMP under that root.
   - Set NODE_OPTIONS to any existing value plus ` --require="<preload, backslashes turned to />"`. Inside quotes Node drops backslashes, and an unquoted path breaks on a space.
   - R-1920 asserts PASS lines for dirty-state, review standard, provider and model, source commit, removed after success, reclaim, and signal off win32.
   - R-1921 asserts PASS lines for dirty-state and review standard.
   - R-1922 asserts one `FAIL the test's temporary folder is removed at the end EBUSY <folder>` line, where the folder is an immutable-review-test- folder under the child's TMPDIR. It also asserts no `^\s+at ` line, and an exit status equal to the FAIL-line count.
   - On every new check, put `// req: R-19nn` directly above it, with `check("R-19nn: …", …` on the very next line.
6. Run `npm run map`, then `npm run map:check` and `npm run readme:check`.

## Tests (one file at a time)
review-test-waits, immutable-review, review-ledger, code-map, requirements-trace.

## Wrong code to try (each must turn its check red; revert it afterwards)
- The fake writes the header, then appends the argv: R-1921 fails (dirty-state and review standard FAIL).
- The waits go back to a fixed 200×25 ms: R-1920 fails.
- The final rmSync has no try/catch: R-1922 fails (uncaught EBUSY).
- The helper returns as soon as the file exists: R-1923 fails. The helper ignores closed and limitMs: R-1924 fails.

## Done
- All five checks pass.
- A plain immutable-review run gives 18/18 on macOS.
- review-ledger passes.
- The map, readme and trace checks are green.
- Each wrong code above turned its check red.

## Report (10 lines at most)
Verdict. One line per row: its check's result and the wrong code's red line. The plain and meta-run times for immutable-review. The review-ledger result. The files touched. Anything left untested.