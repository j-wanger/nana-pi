# Design critique: runtime-map, CHANGE.md seat draft 1

*Adversarial plan review of `CHANGE.md` in this folder. Cites are at `2dbc817`. "Read" means read at `2dbc817` and not run. "Ran" means
run on macOS (Node v22.22.2) in a scratch copy made with `git archive 2dbc817`, or in a scratch probe folder. INFERRED means neither.
The owner is "the owner". This file contains no name and no word-for-word quote. Stakes: medium and reversible. One lane edits the
land-gate runner behind a knob that does nothing while unset.*

**Verdict: SEND-BACK.** One MUST stands. It is cheap to close. The core of the design is sound: per-file `NODE_V8_COVERAGE` set by the
runner, a record per folder, a tracked-file filter, data kept out of the map check, and data in the git common folder. Most of the
weight below is subtraction and honest-failure rules.

## Scope: what the owner asked

The plan delivers two things: which repo files each test file ran, and the seconds each test file took. Both appear under `map:impact`.
The map file and `map:check` stay static. Under the seat's reading this is inside the ask. The exceptions are the per-line disk work (S3),
the HANDOFF volume (S10) and the D3 recommendation (S7). The reading itself is never put to the owner (S1).

## MUST

**M1. The plan asks the owner five blocking questions while a ruling allows three.** §6 puts D1 to D5 under "ask before the build"
(`CHANGE.md:348`). The attention-limit trial runs from 2026-10-06 to 2026-10-20. It allows at most three blocking asks in "Open for" the
owner at once (Read: `HANDOFF.md:79`). The plan is dated 2026-10-16, inside the trial. If the seat follows the plan as written, it breaks
a standing owner ruling. The plan itself says D2 and D5 decide later lanes d and a, not lane 1 (`CHANGE.md:353-354`, `:359-360`). D3 has a
default and changes no lane-1 code. D4 asks for the queue order, and the sibling plan asks the same thing as its D2
(`../parallel-seat/CHANGE.md:416-418`).
*Fix:* Mark each ask blocking, optional or parked, as HANDOFF does. Make three asks blocking: D0, the reading (S1, new); D1, where the
data lives; and one queue ask merged with the sibling's D2. Make D3 optional with its default. Park D2 and D5 in the plans for their lanes.

## SHOULD

**S1. Put the reading to the owner as D0.** The request's wording supports three readings:
- (a) which code runs: the plan's coverage-based reading.
- (b) how long code takes to run, per module. That needs a CPU profile, not coverage.
- (c) timing only.

The runner already prints seconds per file (Read: `scripts/test.mjs:369`, `:384`). So reading (c) needs no runner change, no coverage
and no gate class. INFERRED: about four rows, against nineteen. The plan also keeps the map file static and puts runtime lines only in
`map:impact`. The owner may expect the map itself to show them.
*Fix:* Add D0 as a blocking ask, within M1's three. State what each reading costs. Name where the output appears: impact lines only,
never the map file.

**S2. The S1 ID fallback is out of date and now collides.** The sibling now takes R-1240 to R-1266 and reserves R-1240 to R-1279,
because this plan holds R-1220 and up (Read: `../parallel-seat/CHANGE.md:5`, `:58-60`, `:424-425`). This plan's S1 still cites the
sibling's older research notes, which gave it R-1220 to R-1239. S1 also says to move to R-1240 to R-1258 if the sibling queues first
(`CHANGE.md:44-45`, `:362-364`). The sibling does recommend going first. Following S1 would then duplicate R-1240 to R-1258.
Ran: `git grep -cE '\bR-12[2-5][0-9]\b' <ref> -- REQUIREMENTS.md` on main, feat/regroup and feat/roster-notice gave 0 hits on each.
*Fix:* Delete the fallback. Fix R-1220 to R-1238, reserve up to R-1239, and cite the sibling's CHANGE.md.

**S3. Cut R-1228, the per-line read-and-delete, until the disk total has been measured.** R-1228 saves disk against a total that is
INFERRED ("hundreds of MB to over 1 GB"). It adds a timing-based check (M8) and pair 20. It also opens three honest failure paths that
the plan gives no rule for:
- (a) A record or coverage file can be read while it is still being written. Late writers exist in the suite. Examples are the detached
  child in `post-edit-hardening.test.mjs:201`, normally reaped by SIGKILL at `:219`, and the self-test hang fixture at
  `scripts/test.mjs:192`. A `JSON.parse` that throws in the line handler kills the measurement partway through the suite (S4 covers what
  that leaves running).
- (b) A delete can fail, for example on a file held open on Windows (INFERRED). Either the delete throws, or the folder stays. A folder
  that stays is read again on the next line, which doubles the record count. R-1230 then refuses the whole run.
- (c) The record must be written before the file's label line (`:384`), or the line can arrive first. R-1221 does not say so.

The acceptance step's `du` peak cannot justify the cut either way. With per-line deletion the peak is small whatever the total is.
*Fix:* Read every record folder once, after the suite exits. The acceptance `du` peak then equals the total; record it. Reopen per-file
reduction only if the total exceeds a stated budget. If R-1228 stays:
- Track processed folders by name.
- Skip an unreadable file with a counted warning.
- Retry deletes with `rmSync` `maxRetries`.
- Never throw from the line handler.
- Add "before it prints the file's line" to R-1221.

**S4. Forward signals to the suite and wait before removing the folder.** §3.2 says the coverage folder is removed "on every exit path,
signals included". But the plan gives the measure command no step to stop its suite. A SIGTERM sent to the measure process alone, for
example to stop a background task, leaves test-locked, npm and the runner running.

Ran a probe: a parent pipes a child, the child starts a detached Node grandchild that inherits the pipe, and the parent exits on SIGTERM.
The grandchild died with EPIPE at its next stdout write (exit 1 after 5 lines). By the same mechanism, an orphaned suite keeps running to
the end of its current test file. That can take up to the 5-minute per-file limit (`scripts/test.mjs:57`). For that time it holds the
machine-wide lock. Node also recreates the deleted per-file coverage folder (Ran in `research.md` §3). That leaks up to one file's
coverage, 65 MB for the lift test. R-1232 and M13 never test a signal.
*Fix:*
- On SIGINT, SIGTERM and SIGHUP, signal the test-locked child. It already forwards the signal to npm's group and frees the lock (Read:
  `scripts/test-locked.mjs:156-164`).
- Wait for its exit, with a bound from the config. Then remove the folder.
- Add a check that signals the measure command during a fake suite and finds the suite stopped and the folder gone.
- Record Windows as a residual. There, test-locked's `kill` ends only npm (Read: `scripts/test-locked.mjs:132-133`).

**S5. Some wrong-code pairs cannot fail the checks they name.**
- **Pair 1 survives.** Ran: `node -e` set `process.env.NODE_V8_COVERAGE` in a running process and then exited; no coverage folder
  appeared. A child spawned with its own value wrote only there (c1: 0 files, c2: 1). Node reads the variable only at start, and the
  per-file env sets its own value (`CHANGE.md:79`). So pair 1 changes nothing. C1's "no folder holds the runner's" clause then has no
  pair that can make it fail.
- **Pair 39 likely survives (INFERRED from the I6 title).** I6's "valid data" is exact, so a warning "when stale" never fires.
- **Pair 23 depends on folder listing order** unless M9 checks both the test file's own path and the child's module.

*Fix:* Drop pair 1. Say in C1 that the clause holds because Node reads the variable at start, or aim pair 1 at an edit that takes
effect. Give I6 a fourth state with a stale entry, or reword pair 39 to "warns when any runtime data exists". Make M9 check both paths.

**S6. The README sentence about where the data lives can make the README check pass or fail by machine state.** The README checker
treats any backticked token with a slash as a repo path that must exist (Read:
`templates/typescript/template/scripts/readme-check.mjs:305-320`, `:490-495`). Suppose the README writes `.git/nana/runtime-map.json`
in backticks. The path exists only in a main checkout after a measurement. In a linked worktree `.git` is a file, and CI has no data. The
§5.2 census row for the README check misses this.
*Fix:* Name the location in prose, for example "a file in the clone's git folder". Or declare it in `externalPaths` with a reason. Add the
case to §5.2.

**S7. D3's recommendation adds time to every lane the owner already finds slow.** "Always before a mutation run" costs 12 to 16 minutes
per mutation run (INFERRED). In lane 1 nothing reads the data before later lane c.
*Fix:* Recommend measuring on demand until a reader exists. Add an option that costs no extra time: the seat's full run before a land is
the measuring run, since R-1231 already exits with the suite's code. The trade is that the gate run then carries `NODE_V8_COVERAGE`,
which the plan names as the claim most likely wrong.

**S8. Missing files have no hash rule.** Three honest states have no rule:
- a tracked file deleted in a dirty tree at the pre-run hash pass;
- a recorded file deleted before an impact call;
- a test file that git did not track at measure time. R-1229 hashes only files on the pre-run tracked list, so it has no recorded hash.

The runner's own snapshot turns a read failure into `<missing>` (Read: `scripts/test.mjs:307-313`).
*Fix:* Use one rule. A missing file hashes to a fixed "missing" value, and a file with no recorded hash reads as changed. Add cases to
M9 and I3.

**S9. Some rows and titles carry more than one behaviour, or a clause no check pins.**
- **R-1223** joins two commands with two behaviours: the default path and the override. M1 tests only `dataPath`. Reword it as "the
  runtime data path shall be …", and let M9 and I2 pin each command's use.
- **R-1226** has three behaviours: query and fragment; the root as given and as resolved through links; the platform's path rules. Split
  it into three rows, one per check (M4, M5, M6).
- **R-1232** cannot be tested as written for a signal or a late writer. Narrow it to the paths M13 tests, and add the signal row from S4.
- **R-1235** says "that test file's line", which is unclear when the named file changed. Say "every line under that named file".
- **M8's title** promises the folder goes "before the next test file starts". The measure command cannot control that, because the runner
  does not wait. The check pins only that the folder goes after a line. This is moot if S3 is taken.

**S10. §6 would put 32 lines into HANDOFF.** It says each decision, residual and later lane "becomes one HANDOFF line": 5 + 9 + 11 + 7
lines. HANDOFF says "one line per live decision … rewrite, don't accumulate" (Read: `HANDOFF.md:3`).
*Fix:* Put the asks in "Open for" the owner. Keep seat decisions and later lanes in the review folder. Add one HANDOFF residual line that
points at the README's known-limits sentence.

**S11. A zero line reads as "no test".** The acceptance step expects `measured tests for scripts/test.mjs (0): —` (residual 2). Yet
`test-runner.test.mjs` runs a byte-identical copy of that file in every case (Read: `packages/nana-pack/tests/test-runner.test.mjs:47-56`).
A builder reading the block would conclude the runner has no test.
*Fix:* Have the closing line say, once, that copies run from a temp folder and children stopped by a signal are not counted. Carry a rule
into later lane a: a file with no static test and no measured test means "unknown", and the full suite runs.

**S12. The residual list and D1 omit that worktrees overwrite each other's data.** Every worktree of the clone shares one data file, and
the last measurement wins. A lane tip's measurement replaces main's. Stale marks show this, but D1's trade does not mention it.
*Fix:* Add a residual and one clause to D1.

**S13. The acceptance step's seconds comparison has no pass rule.** It says "compare each file's seconds" but gives no threshold, and the
plan bans thresholds.
*Fix:* Labels must match. Record seconds side by side, report the largest ratio, and pass or fail nothing on seconds.

## NOTE

- **N1.** `TOTALS_LINE` defines R-616's printed line a second time: the runner prints it inline at `scripts/test.mjs:413-415`. Any rewording
  makes every measurement refuse; the sibling's test-jobs lane rewrites this output path. Option: the runner writes a completion record
  with the file count under the knob. The measure command then parses no output and can spawn with `stdio: "inherit"`. The trade is one
  more inert runner line.
- **N2.** A `NANA_COVERAGE_DIR` left set in a shell makes every suite run, including land runs, write coverage silently. The threat model
  lists an ambient `NODE_V8_COVERAGE` but not this knob. Have the runner print one line when the knob is set.
- **N3.** R-618's text and the runner header call `NANA_TEST_*` "the runner knobs" (`scripts/test.mjs:12`, `:24`). The coverage knob is a
  runner knob outside that prefix on purpose. Say so in the header and in R-618's evidence cell, so that nobody "fixes" the name. C4 would
  catch a rename.
- **N4.** State that the config module imports nothing. `mkRoot` copies that one file.
- **N5.** §3.4 says a path argument becomes a repo path "the way the generator makes one … then `/` separators". The generator does
  `posix.normalize(relative(...))` (Read: `templates/typescript/template/scripts/code-map.mjs:854-859`), which keeps backslashes on Windows.
  On Windows, the static part and the runtime part would then disagree on a backslash argument. Use the generator's rule, or record the
  difference.
- **N6.** M2 and M3 need fixture roots without the real `scripts/test-locked.mjs`. Under pairs 10 and 11 the default start then fails fast
  and never starts a real nested suite.
- **N7.** The seal pairs (40 to 43) cover 4 of the 8 sealed names. S1 checks all 8, so this is a table gap only.
- **N8.** Carry into later lane b: once test-jobs lands, the measuring run must run files one at a time, or the seconds are taken under
  parallel load.
- **N9.** Name the new checks' suite-time budget at the build (INFERRED: +5 to 15 s). Ran: `node scripts/code-map.mjs --check` and
  `--impact` took 0.07 s each, which confirms the plan's figure for I1 to I6.
- **N10.** In "longest first", break ties by path so I2's output is stable.
- **N11.** R-1237 says "exit 0". The generator's `--impact` always returns 0 (Read: `templates/typescript/template/scripts/code-map.mjs:851-862`).
  Say "the generator's exit code" so one rule covers both.
- **N12.** Content hashes repeat the runner's own tracked-file hashing (`scripts/test.mjs:293-324`). A smaller option: refuse to measure
  on a dirty tree, and take staleness from `git diff --name-only <commit>`. That cuts the CRLF folding, M10, pair 21, the clean flag and
  the hash map. The trade is that a dirty tree can no longer be measured. The plan's choice is defensible; weigh it once.

## Subtraction test, part by part

| Part | Verdict |
|---|---|
| Runner knob, per-file folder, record | Earned |
| Knob outside `NANA_TEST_` | Earned: the scrub withholds it from tests with no new code |
| Runner imports the config | Earned under the no-inline-tunables rule; the runner's built-ins-only property ends (accepted) |
| Per-line read and delete (R-1228) | Not earned until the disk total is measured (S3) |
| Totals count check | Earned; a completion record would decouple it (N1) |
| Tracked-file filter | Earned |
| Content hashes, CRLF folded | Earned; a smaller option exists (N12) |
| Commit, clean, platform, Node | Earned (cheap) |
| Data override | Earned |
| `npm_execpath` refusal; exit with the suite's code | Earned |
| R-1222 (passes `NODE_V8_COVERAGE` through while unset) | Earned: it pins that the knob does nothing on the land gate while unset |
| R-1238 (map check ignores the data) | Earned |
| Later lanes a to g as HANDOFF lines | Not earned (S10) |

## Evidence I ran

- Scratch copy: `git -C <repo> archive 2dbc817 | tar -x -C critique-rm/src`.
- `node scripts/code-map.mjs --check` (twice) and `--impact scripts/test.mjs`: 0.07 s each. The impact output for `scripts/test.mjs` shows
  0 callers and 0 callees.
- Coverage start-time probe:
  `node -e 'process.env.NODE_V8_COVERAGE=…'` → no folder;
  a child with its own `NODE_V8_COVERAGE` → only the child's folder written.
- Orphan probe (`critique-rm/probe/top.mjs`, `mid.mjs`, `gc.mjs`): the parent exits on SIGTERM without forwarding. The grandchild dies with
  EPIPE at its next stdout write.
- `git grep -cE '\bR-12[2-5][0-9]\b'` on main, feat/regroup and feat/roster-notice: 0 hits on each.
- Read and not run: `scripts/test.mjs`, `scripts/test-locked.mjs`, `scripts/code-map.mjs`, the generator's `main`, the README checker's path
  rules, `test-runner.test.mjs`'s `mkRoot`, `post-edit-hardening.test.mjs` case f, and the sibling CHANGE.md's IDs and asks.

**The claim here most likely wrong:** that a delete can fail on Windows (S3b). That is INFERRED; no Windows run was made. The runner
already deletes per-file temp folders on Windows CI without retries (`scripts/test.mjs:396-397`), which argues against it.

VERDICT: SEND-BACK
