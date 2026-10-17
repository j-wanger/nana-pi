# runtime-map — the adversary's pass on the seat's seven-test draft (2026-10-17)

*A read-only agent attacked the draft under the feature-first ruling; `must-meet.md` records the disposition.*

**Verdict: the seven tests leave three ways the feature can fail its user.** Most important: every test can pass while `npm run map:measure` writes nothing on the owner's real setup, a linked worktree. I read the draft, CHANGE.md and the code only. I ran no probes.

**1. Feature-blocking gaps**
1. **Real launch path and default data location are never exercised.** MM2 can pass with the injected `start` and the `NANA_RUNTIME_MAP_FILE` override, which the design says every check uses. So the real run through test-locked and the runner is never driven, and the default path (git common dir plus `nana/`) is never written. One realistic slip: a build writes the temp file beside a `.git/nana/` folder that does not exist yet, or joins `<root>/.git` where `.git` is a file in a linked worktree. The first real 15-minute measurement then dies at the end with ENOENT or ENOTDIR and writes nothing, while all seven tests stay green.
2. **One Ctrl-C delivers SIGINT twice, and MM7 sends it once.** Amendment 1 puts the suite in its own process group, so the terminal's Ctrl-C reaches only npm and the measure command. The measure command's handler is now the only way the suite stops. npm forwards SIGINT and SIGTERM to its script child (I read the installed `@npmcli/run-script/lib/signal-manager.js`), so the measure command gets the signal from the terminal and again from npm. A handler registered with `once`, or one that is not idempotent, can die on the second delivery before it forwards. The suite then runs on for up to 16 minutes holding the machine-wide lock. The leftover coverage folder in temp is inferred at hundreds of MB to over 1 GB.
3. **A zero result reads as "no test runs this", and nothing pins the disclaimer.** The runner's only test runs a copy of `scripts/test.mjs` in a temp folder (`packages/nana-pack/tests/test-runner.test.mjs:47-58`). Temp copies are dropped by design, so `map:impact scripts/test.mjs` shows zero measured tests, and the static map has no edge either. No draft test pins the zero line or the closing line's not-counted clause. A build that drops them tells a developer that nothing tests the land gate's own runner. Fix: fold into MM3 that "a file no measured test ran prints a `(0)` line, and the closing line carries `NOT_COUNTED`".

**2. Not must-meet (move to known limits)**
1. **MM1's empty or relative knob refusal.** Only someone setting `NANA_COVERAGE_DIR` by hand reaches it, because the measure command always passes an absolute temp path. A relative knob scatters folders inside the repo, which is not on the harm list. The refusal itself adds a new exit-1 path to the land-gate runner.
2. **MM3's "unreadable data" and "another schema version" notes.** No schema 2 exists. The data is written by an atomic rename, so honest unreadable data needs a hand edit, which the threat model excludes. Keep the no-data note: that is every user's first run.
3. **MM7's Windows clause.** `taskkill /T` on the suite's own pid cannot reach the caller, so the harm MM7 guards does not arise on Windows. What is left is function on a platform whose CI leg does not block, and darwin can only check the call shape.

**3. Untestable as written**
1. **MM1, "prints exactly what it prints today".** "Today" has no fixed meaning once the lane lands, and the output carries seconds. Rewrite: with the knob unset, the existing runner test passes with no assertion edited (the fixture setup only also copies the config). No output line starts with `KNOB_LINE`, and no record or completion file is created.
2. **MM7 has three problems.** It races "while the suite runs", it puts no time bound on "ends the tree", and it mixes two platforms. Rewrite as a POSIX-only check with a fake three-level suite that writes a ready file, and a fake caller that shares the measure command's process group:
   - After the ready file appears, send SIGINT twice, 10 ms apart (separately, SIGTERM twice).
   - Within `STOP_WAIT_MS` plus a margin you name, no tree pid answers `kill(pid, 0)` and the caller's pid does.
   - The coverage folder is gone, and the measure command exits non-zero.
   - The check is skipped on a win32 host, with the reason printed.

**New tests (one): MM8, the default data location in a linked worktree.**
- Build a fixture clone with one linked worktree and leave `NANA_RUNTIME_MAP_FILE` unset.
- Run the real `scripts/runtime-measure.mjs` process in the worktree. Point test-locked at the copied runner with `NANA_SUITE_TEST_COMMAND`, give `npm_execpath` a dummy value, and put the lock folder in temp.
- Assert exactly one data file appears at `<git-common-dir>/nana/runtime-map.json`, with `nana/` created on the first run.
- Assert the reader's `dataPath`, resolved from the main checkout, names that same file.

**Insist on:** MM8 — the real measure process, with no override, from a linked worktree, writes the shared data file and the main checkout's reader finds it.
