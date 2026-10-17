# Research: parallel work as the seat's default (2026-10-16, main 2dbc817)

Stakes read: the seat-guide text is low-blast and reversible (one rule file, one test file). The shared mutation
runner is medium-blast: it is the seat's evidence that tests pin code, so a runner bug that loses or misjudges a pair
hides a survivor (fails open in the seat's verification, not in the land gate). The parallel suite runner is
high-blast: its exit code is the land and release gate.

Citation forms: `file:line at 2dbc817`; `Ran: <command>`; INFERRED for anything not read or run.
Everything below was gathered read-only. The only writes were this file and a throwaway git repo in this folder's
`probe/` subfolder (removed).

---

## 1. Key facts

### 1.1 The seat guide and its rows

- The guide holds eight bullets; bullet 7 is "Keep at most two lanes in flight, a nana default. While one runs, work
  the other or end your turn." (`packages/nana-setup/claude/rules/nana-seat.md:5-12` at 2dbc817).
- R-1140 pins exactly eight rules and no other bullet; R-1141 the scope sentence; both sit in FEAT-006
  (`REQUIREMENTS.md:354-355` at 2dbc817). R-1142 pins the one pointer bullet in the shared working pattern
  (`REQUIREMENTS.md:893`; `templates/_shared/working-under-nana-pi.md:32` at 2dbc817).
- The test checks each bullet by exact text and the count (`packages/nana-setup/tests/seat-rule.test.mjs:26-48` at
  2dbc817), so a ninth bullet means rewording R-1140 and renaming one test title.
- Other consumers of the guide file: install links it (`packages/nana-setup/lib/steps.mjs:48`), state manifest
  (`packages/nana-setup/lib/state-manifest.mjs:59`), Windows installs a copy (`packages/nana-setup/tests/win32-degrade.test.mjs:82-86`),
  the setup README describes its content in prose (`packages/nana-setup/README.md:40`), all at 2dbc817.
- The two-lane cap is also the queue rule: "at most two lanes at once" (`HANDOFF.md:81` at 2dbc817), from the
  owner's 2026-10-11 queue. Changing it is the owner's call.
- The lesson "Parallel lanes need reserved ID ranges in each brief" (`docs/sessions/2026-10.md:139` at 2dbc817).
  The runtime-map plan was probably given the same start ID (R-1220); see owner/seat calls (INFERRED).

### 1.2 The per-lane mutation runners

- Nine JavaScript runners on main, 3,878 lines in total; one per lane in `docs/reviews/<lane>/seat-mutate.mjs`
  (Ran: `wc -l docs/reviews/*/seat-mutate.mjs`). Five earlier lanes have Python runners (`seat-mutate.py`).
- Each is a copy of the previous one ("Form copied from …", e.g. `docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs:5`,
  `docs/reviews/tree-2026-10-14/seat-mutate.mjs:4` at 2dbc817).
- The plumbing (everything after the pair table) is 195 to 224 lines per copy. Successive copies drift by 22 to 138
  changed lines (Ran: extracted each runner's plumbing section and diffed tree→lift 22, lift→regroup-shares 59,
  regroup-shares→regroup 70, seat-guide→tree 110, roster→seat-guide 138).
- Byte-identical across the five newest copies (seat-guide, tree, lift, regroup-shares, and the in-flight regroup
  runner read from the `feat/regroup` branch object): `addWorktree`, `removeWorktree`, `resetWorktree`, `runTest`;
  the hermetic `BASE_ENV` is identical in tree, lift, regroup-shares and regroup (Ran: hashed each function body).
  `applyEdits` differs in every copy (new edit kinds each lane).
- What every copy does (`docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs` at 2dbc817):
  - one detached scratch worktree under `os.tmpdir()` (`:43`), reset hard and cleaned before each pair, with a
    refusal when the worktree is not its own root (`:201-212`);
  - anchors must occur the stated number of times, else ANCHOR-MISS and exit 3 (`:257-277`, `:392`);
  - `node --check` on each mutated module (`:332-337`);
  - test files run as the suite runner runs them: package-folder cwd, fresh HOME/USERPROFILE/TMPDIR/TEMP/TMP,
    NANA_* except NANA_TEST_* and PI_CODING_AGENT_DIR scrubbed, gc.auto=0, plus npm's three config values
    (`:171-190`, `:215-240`);
  - a baseline of every named file before any pair, refusing to judge when red (`:298-318`);
  - RED / GREEN (SURVIVED) lines that list named titles still green and unnamed reds, then one RESULT line
    (`:351-391`).
- Pairs run strictly one at a time: `for (const p of pairs) { … await runTest(rel) … }` (`:320-379`).
- A pair id given on the command line that is not in the table is dropped without a word:
  `PAIRS.filter((p) => only.includes(p.n))` (`:281`; the same line in all nine copies, e.g.
  `docs/reviews/lift-2026-10-14/seat-mutate.mjs:379`). A hand split with a typo loses a pair silently; only the
  header's pair count shows it.
- POSIX-only process handling: `detached: true` and `process.kill(-child.pid, "SIGKILL")` (`:226-234`). On Windows
  the group kill throws inside `try {}`, so a timed-out test tree stays alive (INFERRED from the code; not run on
  Windows). The suite runner already does it right: `taskkill /T /F` on win32 (`scripts/test.mjs:77-83` at 2dbc817).
- `core.hooksPath=/dev/null` (`:114`) is a POSIX path; on Windows git would look under a folder that does not exist,
  which also means no hooks, but by accident (INFERRED).
- The npm config read runs `spawnSync("npm", …)` with no shell (`:185`). On Windows `npm` is a `.cmd` file, which
  Node refuses to spawn without a shell, so the three values are silently skipped there (INFERRED; the pack already
  has a launcher for `.cmd` files: `packages/nana-pack/lib/win-command.mjs:50` at 2dbc817).
- Lane-specific features seen across the nine copies (Ran: tallied pair-table field names per runner):

| Feature | Lanes | Share of copies |
|---|---|---|
| `expectRed`, `tests`, anchor edits | all nine | core |
| `regex` edits with a count, `run` edits (run a script after the edit) | tree, lift, regroup-shares, fresh-install, install-check | common |
| `expectGreen` (must stay green) | fresh-install, seat-guide | two |
| `expectWhy` (case labels inside an aggregate title's FAIL detail; needs a lane label parser) | lift, regroup-shares | two |
| `alsoRed` (declared extra reds) | regroup (branch) | one |
| `skip` with a reason | regroup-shares | one |
| Windows-only titles recorded, never judged | cc-hooks-windows, roster | two |
| scratch commit before the run | seat-guide | one |
| acceptance script, probes, attribution re-run | install-check | one |

### 1.3 Measured run times (seat records in this session's scratchpad, regroup lane, 2026-10-16)

Start from each record's header (UTC), end from the record file's last write (local, UTC-4):

| Record | Pairs | Start (local) | End | Minutes | Pairs per minute |
|---|---|---|---|---|---|
| `regroup-mutate2/…-228f37c.txt` | 104 | 09:00:21 | 09:32:03 | 31.7 | 3.3 |
| `regroup-mutate3/…-656dc86.txt` | 148 | 11:26:34 | 12:21:27 | 54.9 | 2.7 |
| `regroup-mutate4/…-8c7ed24.txt` | 195 | 14:47:25 | 16:25:19 | 97.9 | 2.0 |
| `regroup-mutate5/…-cd8991b.txt` | 209 | 17:26:56 | 19:03:34 | 96.6 | 2.2 |
| `regroup-mutate7/shard0-4.log` (five parts by hand) | 217 | 20:19:57 | 20:45:10 | 25.2 | 8.6 |

- These match the brief's 32, 55, 98 and 97 minutes. The serial runs total about 281 minutes in one day.
- The hand split: `all.ids` holds 217 ids, split round-robin into five files of 44, 44, 43, 43 and 43 ids
  (Ran: `wc -w all.ids shard*.ids`). Five processes started 6 seconds apart (headers 00:19:57, :20:03, :20:09,
  :20:15, :20:21 UTC). Each part made its own scratch worktree and re-ran the full baseline (about 95 s each,
  concurrently; every `shard*.log` holds its own BASELINE lines). Nothing merges the five RESULT lines.
- Final: the five RESULT lines add up to 216 of 217 red and one survivor (pair 5/3), 25.2 minutes against 96.6 for
  209 pairs serially, about 3.9 times faster (Ran: read each `shard*.log` RESULT line at 20:45). The seat has to add
  the five lines up by hand.
- Mid-run reading: 146 pairs done at 17 minutes, 184 at 21.4 minutes (Ran: counted RED/GREEN lines per shard at
  20:37 and 20:41). After the baseline that is about 9 pairs per minute, about four times the serial rate. The
  brief's "74 pairs in about 10 minutes" fits this rate (INFERRED; that reading was taken earlier by the seat).
- Load average 9.0 to 10.8 on 10 cores during the split run (Ran: `uptime`, `sysctl -n hw.ncpu`). Five parts
  roughly fill this machine; per pair, a part was about 15% slower than a serial run (INFERRED from the rates).
- Per-pair cost is dominated by the named test file: requirements-lift.test.mjs 38 to 50 s, templates-render 19 to
  26 s, review-ledger 155 s in another lane's baseline (BASELINE lines in `docs/reviews/*/seat-mutate-output*.txt`
  at 2dbc817).
- The seat also ran large independent checks after builds (`regroup-check2/3/4/verify-*` folders in the
  scratchpad); those are independent of the mutation run and could have run beside it.

### 1.4 Concurrency probe (Ran, throwaway repo)

- Ran: 40 `git worktree add --detach` calls against one repository, eight at a time with the same basename `wt`,
  then 40 concurrent `git worktree remove --force` (git 2.50.1, macOS). All succeeded; git named them `wt`, `wt1`
  … `wt39` and the list returned to one entry. So parallel parts do not need a stagger for git's sake on this
  machine. Windows git was not probed.

### 1.5 The suite runner and the queued parallel suite

- `scripts/test.mjs` runs one file at a time (`scripts/test.mjs:349-399` at 2dbc817); it has no named exports, so
  nothing can import its env or process code today. Its `runFile` is stronger than the lane runners' copy: a
  bounded stdio drain after exit and a kill grace (`:58-59`, `:204-263`).
- Its exit code gates land and release (`docs/reviews/process-2026-10-13/research-runner-preamble.md:3-5` at 2dbc817).
- The parallel suite runner is lane `test-jobs`, a gate lane with two plan rounds, split out of the process lane
  (`docs/reviews/process-2026-10-13/CHANGE.md:153-156` at 2dbc817); it sits after the 10-16 feedback items in the
  owner's queue (`HANDOFF.md:85` at 2dbc817).
- Prior measurements: 580 to 880 s serial, CPU about half a core per wall second, four workers simulated at 181 to
  260 s, floor set by review-ledger at 137 to 200 s (`research-runner-preamble.md` §1.2 and §1.4 at 2dbc817).
- Preconditions it named are all still on main (Ran: grep at 2dbc817): the fixed desk test port 4391
  (`apps/desk/test/origin-rule.test.mjs:17`); wall-clock bounds (`packages/nana-knowledge/tests/hook.test.mjs:200`,
  `:339`; `packages/nana-pack/tests/test-locked.test.mjs:103`; `packages/nana-pack/tests/bounded-read.test.mjs:37`;
  `packages/nana-pack/tests/review-ledger.test.mjs:614`); `--poll 1` stall windows (`review-ledger.test.mjs:82`).
- 144 test files now (Ran: `ls packages/*/tests/*.test.mjs apps/desk/test/*.test.mjs apps/bench/test/*.test.mjs | wc -l`),
  up from 133 on 10-10; the suite keeps growing, so the 10-13 timings are stale.

### 1.6 Where a shared module can live

- The code map has two layers: apps and `scripts/` on top, `packages/` below; a package may not import a script or
  an app (`code-map.config.json` `layers` at 2dbc817). `docs/reviews/` is not a map root.
- So a shared module placed in `scripts/` could never be imported by a package module; one placed in
  `packages/nana-pack/lib/` can be imported by `scripts/test.mjs` later and by any lane table. That decides the home.
- The pack's `bin/` holds seat commands (pi-review, pi-worker, nana-land, nana-roster); every bin has a README
  section (`packages/nana-pack/README.md:81-309` at 2dbc817). A lane table that imports the library and is run with
  node needs no new command, no PATH link and no install change.
- Builder rule: "No suite test runs, imports or copies a seat script" (`packages/nana-pack/prompts/builder-preamble.md:22`
  at 2dbc817). The shared runner becomes product code with its own fixture tests; lane tables stay seat scripts.

---

## 2. Options

### (a) The seat-guide rule

- A1. Add a ninth bullet; keep bullet 7. Proposed text (sentences under 25 words):
  "- Run independent work at the same time, a nana default. At each step, start what waits on nothing else:
  another lane's build, a split mutation run, separate research. Keep each lane's own steps in order."
- A2. A1 plus a changed bullet 7 (owner call; see section 5).
- A3. No rule; the runner's split option alone. Rejected: the idle second lane and the serial independent checks
  are seat choices no tool fixes.

The rule fits the existing bullets: bullets 2 and 3 still forbid reading a running builder's partial work, and bullet
4's "verify once" still holds; the new bullet only says the seat's own independent steps run side by side.

### (b) The shared runner

- B1. In-process pool (recommended). One process creates N scratch worktrees one after another, runs the baseline
  once across them, then hands the next pair to whichever worktree is free. Merging and exactly-once accounting are
  in memory. Uneven pairs balance themselves.
- B2. Child processes, one per part (what the seat did by hand). Each part re-runs the baseline unless the parent
  passes it in; the parent parses N records and merges them; a static split balances worse. Less new code in the
  judging path, more in the merge.
- B3. Keep copying runners, add only a `--parts` wrapper script. Rejected: the copies keep drifting (22 to 138 lines
  per copy) and each copy keeps the POSIX-only kill and the silent id drop.

Home: `packages/nana-pack/lib/` (section 1.6). Three modules, one purpose each:
- `lib/test-child.mjs`: run one test file the way the suite runner does (env, cwd, process tree, drain) and return
  exit, output and seconds. The parallel suite lane can later move `scripts/test.mjs` onto it.
- `lib/mutation-runner.mjs`: apply a pair table in scratch worktrees, judge and merge.
- `lib/mutation-runner-config.mjs`: every tunable with provenance.

A lane's `docs/reviews/<lane>/seat-mutate.mjs` shrinks to constants, titles, DECLARED lines, the pair table and one
call: `await runMutations({ lane, repo, branch, tip, declared, titles, pairs })`, importing by relative path. Usage
stays `node seat-mutate.mjs [--parts N] [pair-id ...]` with the same `SEAT_MUTATE_*` variables.

Old lane records stay valid: nothing edits or runs the nine old runners or their outputs; the new runner prints the
same line words (BASELINE, RED, GREEN … SURVIVED, ANCHOR-MISS, SYNTAX, SKIPPED, DRY ok, RESULT), so old and new
records read the same way; the header adds the parts count and the runner file's content hash so a record names the
runner that judged it. The two in-flight lanes keep their own runners to the end.

Core features only (subtraction test): anchor, regex and run edits with counts; `expectRed`, `expectGreen`, `alsoRed`,
`skip`; `expectWhy` through an optional lane-supplied label parser; dry, keep, log folder, tip and output options.
Left out: scratch commits, acceptance scripts, probes, attribution re-runs and Windows-only title lists. A lane that
needs them keeps a lane-local runner (one lane each so far).

### (c) The parallel suite

- C1. Start `test-jobs` now. Rejected: it is a gate lane, its preconditions are unfixed, its timings are three days
  and 11 files stale, and the queue order is the owner's.
- C2. Fix the preconditions now in a small non-gate lane (port 0 for the origin-rule test, the five time bounds
  widened with provenance or put in a declared serial list, `--poll 0.1` in review-ledger tests), then run
  `test-jobs` after the runtime-map lane lands. Recommended. The runtime map gives current per-file timings for a
  longest-first order and a captured baseline to measure against. The preconditions do not need those timings.
- C3. Wait on everything until runtime-map lands. Wastes the precondition fixes, which also cut false reds in split
  mutation runs that name those files.

---

## 3. Recommended first lane and later lanes

Recommended first lane: `mutate-runner`, the shared runner with the built-in split. It needs no owner call, it hits
the measured cost (about 281 serial runner minutes on 10-16 alone, about four times faster split), and it closes the
silent-drop and Windows kill holes before splitting becomes the default. Class: neither gate nor format, so one plan
round; the larger-lane builder per the roster.

The smallest lane is the seat-guide bullet, but it is not the first useful one: making a hand split the default before
the tool exists makes a silently dropped pair more likely. It is lane 2, and it waits on the owner's cap call so the
guide changes once.

Later lanes, in order:
1. `seat-parallel` (small, text): the ninth bullet, R-1140 reworded, the setup README line, and bullet 7 as the owner
   rules. Touches `packages/nana-setup/`, so the macOS install check runs before land. Can run beside lane 1 if the
   cap allows.
2. `test-jobs-prep` (small, not a gate change): the precondition fixes in section 2(c).
3. `test-jobs` (gate, two plan rounds): after runtime-map lands; moves `scripts/test.mjs` onto `lib/test-child.mjs`
   and schedules longest-first from recorded timings.
4. Later: a machine-wide slot for split mutation runs if two lanes' runs collide (residual R5), and the left-out
   lane features if a second lane needs one.

---

## 4. Plan for lane 1, `mutate-runner`

### 4.1 Threat model

In scope (honest variation in our tools' output): test output lines with CRLF endings or title suffixes; a test file
that leaves a descendant holding its pipe; timing-bound tests that go red under load; concurrent git worktree
operations; Windows 8.3 short temp paths against git's long paths (lesson 2, `docs/sessions/2026-10.md:25` at
2dbc817); an antivirus lock on Windows when removing a scratch folder; a mistyped pair id; a crash inside one part.
Out of scope: a forged pair table, a test file written to print fake PASS or FAIL lines, tampering with the scratch
worktree from outside the run. Findings outside the model are residuals.

### 4.2 Requirement rows (FEAT-031, IDs R-1220 to R-1232; reserve R-1220 to R-1239 for this plan)

| ID | Row (one shall each) |
|---|---|
| R-1220 | The shared mutation runner shall apply a pair's edits only inside a detached scratch worktree it creates under the OS temp folder, and shall remove every scratch worktree and folder it created when the run ends unless the keep option is set. |
| R-1221 | The runner shall run each named test file from its package folder with a fresh home and temp folder, with every ambient NANA_ variable except NANA_TEST_ ones and PI_CODING_AGENT_DIR removed, and with gc.auto set to 0. |
| R-1222 | WHEN an edit's anchor or pattern does not occur exactly its stated number of times, the runner shall report that pair as ANCHOR-MISS, run none of its tests, and exit 3 at the end. |
| R-1223 | The runner shall run every named test file unmutated, at the run's parts count, before any pair, and shall judge no pair and exit 2 when a baseline file fails after its retries or a named title is not a PASS line there. |
| R-1224 | The runner shall print RED for a pair whose named title fails, listing named titles that stayed green and unnamed failing titles, and GREEN (SURVIVED) for a pair with no failing title, and end with one RESULT line counting each kind. |
| R-1225 | WHEN the parts option is N above 1, the runner shall run up to N pairs at the same time, each in its own scratch worktree, starting each part the configured interval after the one before. |
| R-1226 | The runner shall report every selected pair exactly once in table order, whatever order the pairs finish in, and shall exit non-zero naming each selected pair it did not report. |
| R-1227 | WHEN a pair id on the command line is not in the table, or the table repeats an id, the runner shall refuse before creating any worktree, naming the id. |
| R-1228 | The runner shall read its parts divisor, part start interval, per-file time limit and baseline retry count by name from its config module, each with its provenance. |
| R-1229 | WHEN a test file runs past the per-file time limit, the runner shall kill its whole process tree, by process group on POSIX and by `taskkill /T /F` on Windows, and count the file as crashed. |
| R-1230 | The runner shall begin its record with one line naming the lane, the tip commit, the merge base, the parts count, the platform, the Node version and the runner file's content hash. |
| R-1231 | WHEN the dry option is set, the runner shall apply and syntax-check every selected pair's edits and run no test file. |
| R-1232 | WHEN a log folder is given, the runner shall save each pair's output for each test file under the pair's id. |

### 4.3 Tests (new file `packages/nana-pack/tests/mutation-runner.test.mjs`; fixtures: a throwaway git repo in the OS temp folder with one package, one tiny module and one tiny test file; nothing reads a lane table)

```
// req: R-1220
check("a pair's edit lands only in a scratch worktree under the temp root, and after the run the source checkout is unchanged and no scratch folder or worktree entry is left")
// req: R-1220
check("with the keep option the scratch worktree is left and its path is printed")
// req: R-1221
check("a pair's test file runs from its package folder with a fresh home and temp folder, without ambient NANA_ variables or PI_CODING_AGENT_DIR, keeps NANA_TEST_ variables, and sees gc.auto 0")
// req: R-1222
check("an anchor that occurs twice or not at all is ANCHOR-MISS, runs no test for that pair, and the run exits 3")
// req: R-1223
check("a baseline file that fails twice stops the run before any pair is judged, with exit 2")
// req: R-1223
check("a named title that is not a PASS line in the baseline stops the run with exit 2")
// req: R-1224
check("a mutation that reds its named title prints RED naming it, and a mutation that reds nothing prints GREEN (SURVIVED) and is named in RESULT")
// req: R-1224
check("a RED line lists a named title that stayed green and an unnamed failing title")
// req: R-1225
check("with two parts, two pairs run at the same time in different worktrees")
// req: R-1225
check("each part starts the configured interval after the one before")
// req: R-1226
check("every selected pair is reported exactly once and in table order at one, two and five parts")
// req: R-1226
check("a pair whose run throws makes the run exit non-zero naming that pair as not reported")
// req: R-1227
check("an unknown pair id on the command line refuses before any worktree is created, naming it")
// req: R-1227
check("a repeated pair id in the table refuses before any worktree is created, naming it")
// req: R-1228
check("R-1228: the parts divisor, part start interval, per-file time limit and baseline retry count are read from the config module")
// req: R-1229
check("a test file past the per-file limit has its whole process tree killed and counts as crashed")
// req: R-1229
check("Windows: a test file past the per-file limit has its tree killed with taskkill")
// req: R-1230
check("the record's first line names the lane, tip, merge base, parts count, platform, Node version and runner hash")
// req: R-1231
check("the dry option applies and syntax-checks every pair and runs no test file")
// req: R-1232
check("the log folder option saves each pair's output for each test file under the pair's id")
```

Determinism notes: "at the same time" is proved with a rendezvous, not timing. Pair X's test writes a start file in a
folder named by a NANA_TEST_ variable and waits for pair Y's start file; a one-part run times out there, a two-part
run passes. The same test checks X's worktree holds X's edit and not Y's. The stagger is proved with an injected
sleep function that records its calls. The Windows title prints SKIP off Windows, as the suite's other
Windows-leg checks do.

### 4.4 Config module (`packages/nana-pack/lib/mutation-runner-config.mjs`)

| Name | Value | Provenance |
|---|---|---|
| `CORES_PER_PART` | 2 (parts default = max(1, floor(available cores / 2))) | measured 2026-10-16: five parts on a 10-core seat machine ran 217 pairs at about 9 per minute against 2 to 3 serial, load average 9 to 11 |
| `PART_START_INTERVAL_MS` | 6000 | chosen: the 2026-10-16 hand split started parts 6 s apart; git needs no stagger (probe 1.4), so this only spreads the first heavy test starts |
| `FILE_TIMEOUT_MS` | 600000 | chosen: every lane runner since 2026-10-12 used 10 minutes |
| `BASELINE_RETRIES` | 1 | chosen: the regroup runner re-runs a red baseline file once because other heavy jobs share the machine |
| `DRAIN_MS` | 2000 | contract: matches `scripts/test.mjs:58` so a pipe-holding descendant cannot hang a run |
| `SCRATCH_PREFIX` | `seat-mutate-` | chosen |
| `ENV_NAMES` | `SEAT_MUTATE_OUT`, `_TIP`, `_DRY`, `_KEEP`, `_LOGDIR`, `_PARTS` | contract: the names the lane runners already read |

### 4.5 Cross-platform

- Process tree: process group on POSIX, `taskkill /T /F` on win32, `windowsHide`, `detached` only on POSIX (as
  `scripts/test.mjs:77-83`, `:206-212`).
- Hooks off with an empty folder inside the scratch folder, not `/dev/null`.
- Compare paths with `fs.realpathSync.native` on both sides (8.3 short names on Windows).
- Remove scratch folders with `fs.rmSync(…, { maxRetries })` for antivirus locks.
- npm's config values read through the pack's Windows launcher, or a printed line saying they were not read.
- Split output on `\r?\n`.

### 4.6 Subtraction test per part

| Part | Earns it? |
|---|---|
| Shared runner instead of copies | Yes: 195 to 224 plumbing lines copied per lane, 22 to 138 lines of drift per copy, the same two holes in every copy. |
| Built-in split | Yes: about four times faster on the measured run. |
| In-process pool over child processes | Yes: one baseline, in-memory exactly-once accounting, self-balancing. |
| Baseline at the run's parts count | Yes: a file that goes red only under load shows in the baseline, before it can fake a red pair. |
| Stagger | Weak: git does not need it. Kept as one config value because the measured run used it; drop it if the plan review prefers. |
| Table-order record plus completion-order stdout | Yes: records stay diffable; stdout gives the seat's monitor a line per finished pair, so no separate heartbeat timer. |
| Runner hash in the header | Yes: old and new records each name the runner that judged them. |
| `test-child.mjs` as its own module | Yes: one purpose; the parallel suite lane reuses it. Until then it duplicates the suite runner's env code (residual R1). |
| Unknown-id refusal | Yes: closes a silent pair loss present in all nine copies. |
| A new bin or PATH link | No: the lane table is the entry point. Cut. |
| Scratch commits, acceptance, probes, Windows-only titles | No: one lane each. Cut; such a lane keeps a local runner. |
| A load-aware parts count | No: `os.loadavg()` reads zeros on Windows and makes runs vary. Cut. |

### 4.7 Wrong code first (each must turn the named test red)

| Wrong code | Test that goes red |
|---|---|
| The pool's queue skips its last pair | every selected pair is reported exactly once and in table order … |
| Two parts take the same pair | same title |
| Lines printed in finish order in the record | same title |
| Unknown ids filtered out silently (today's line) | an unknown pair id on the command line refuses … |
| Every part shares one worktree | with two parts, two pairs run at the same time in different worktrees |
| Pairs awaited one by one whatever the parts count | same title (rendezvous times out) |
| Stagger ignored | each part starts the configured interval after the one before |
| A thrown pair swallowed, run exits 0 | a pair whose run throws makes the run exit non-zero … |
| Baseline red ignored | a baseline file that fails twice stops the run … |
| Baseline retry count read inline as 3 | R-1228 sealed test |
| Survivor counted as red | a mutation that reds its named title prints RED … GREEN (SURVIVED) … |
| Anchor counted with `includes` instead of a count | an anchor that occurs twice or not at all is ANCHOR-MISS … |
| Scratch made under the source checkout | a pair's edit lands only in a scratch worktree under the temp root … |
| Cleanup skips `git worktree remove` | same title (worktree entry left) |
| NANA_ variables passed through | a pair's test file runs from its package folder … |
| Timeout kills only the child, not its group | a test file past the per-file limit has its whole process tree killed … |
| Header omits the parts count | the record's first line names … |
| Dry option still runs tests | the dry option applies and syntax-checks … |

### 4.8 The seat's own check for this lane

The runner judges its own lane's pairs, which is circular. The seat runs lane 1's pairs with the last hand-copied
runner form instead, and once with the new runner at parts 1 and parts 5 on a finished lane's table (for example
regroup-shares, 36 pairs) to show the same RED and GREEN lines in the same order.

---

## 5. Owner calls

1. The lane cap (bullet 7, from the 2026-10-11 queue rule). Options: keep two lanes in flight; two building and one
   more in planning (research, drafts, plan review); or a lane parked on an owner choice does not count. The
   recommendation is two building and one planning. It is the owner's call because the cap is the owner's ruling, and a
   third lane adds owner asks while the attention-limit trial (at most three blocking asks, to 2026-10-20) runs.
2. Queue order: putting `mutate-runner` and `seat-parallel` ahead of the 10-16 feedback items (fleet line, rulings
   file) changes the owner's queue.
3. Whether `test-jobs-prep` may edit a desk test (`apps/desk/test/origin-rule.test.mjs`) while the desk is frozen; the
   process-lane plan already flagged this question (`docs/reviews/process-2026-10-13/CHANGE.md:156` at 2dbc817).

Seat calls (not the owner's): reserve R-1220 to R-1239 for this plan and give the runtime-map plan a different range;
switch the two in-flight lanes to the new runner only after they land, never mid-lane.

---

## 6. Residuals and the claim most likely wrong

- R1. Until `test-jobs`, `lib/test-child.mjs` and `scripts/test.mjs` hold two copies of the hermetic env; a change to
  one is not checked against the other.
- R2. A pair whose named title is a wall-clock bound can go red from load, not from the mutation, hiding a survivor.
  The baseline at the same parts count catches files that fail under load, not ones that fail only sometimes.
  Re-run such pairs with `--parts 1`.
- R3. Lanes needing scratch commits, acceptance scripts, probes or Windows-only titles keep local runners.
- R4. A rule line cannot prove the seat obeys it (the existing seat-guide residual, `HANDOFF.md:63` at 2dbc817).
- R5. Two lanes' split runs at once oversubscribe the machine (about 18 busy cores of demand on 10), and the suite
  lock does not cover mutation runs.
- R6. Windows git was not probed for concurrent worktree adds; Windows CI legs are non-blocking.

Claim most likely wrong: the parts default. One measurement on one machine set "cores divided by two". A machine
with fewer cores, or tables whose test files spawn many children, may need fewer parts. The plan keeps it a config
value with provenance so a re-measure changes no code.
