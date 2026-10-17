# Fact-check round 2: parallel-seat/CHANGE.md (lane `mutate-runner`, seat revision 2) against 2dbc817

Scope: every file:line, row ID, count, title, command and API claim in `CHANGE.md`; a recount of rows, checks and
pairs; a search for existing checks the change turns red that the §5.2 census misses.

Citation forms. "Read at 2dbc817" means read in a scratch copy made with `git archive 2dbc817`. "Ran: <command>"
means run on the seat machine (macOS, 10 cores, Node v22.22.2, git 2.50.1) in that scratch copy or in this folder,
with HOME and TMPDIR set to scratch folders. INFERRED means neither. Nothing outside this folder was written.

**State change during the check.** Main moved from 2dbc817 to c514964 while this check ran. The regroup lane
landed by fast-forward, and `feat/regroup` and its worktree are gone (Ran: `git log -3 main`, `git worktree list`).
`feat/roster-notice` moved from 59db91d to ccd8f76; 59db91d is still its ancestor, and it is not yet rebased on
the new main. The plan's citations at 2dbc817 stay true for 2dbc817. The lane will build on c514964 or later, and
each place where that matters is named below.

Verdict counts: 4 MUST, 11 SHOULD, 2 census misses (inside MUST-4). Everything else checked is VERIFIED.

## 1. MUST (wrong facts that change the plan)

### MUST-1. R-1249 and R-1250 rest on a false premise: many PASS lines carry text after the title

- **Plan.** §3.3 says test files print `PASS <title>` with nothing after it, citing `requirements-lift.test.mjs:20`
  and `apps/desk/test/changes-endpoint.test.mjs:34-35`. R-1249 needs each named title to be "a PASS line". R-1250
  reads a FAIL line as the longest unmutated PASS title that the line equals or begins with plus a space.
- **Fact.** The plan's second citation prints the detail on PASS lines too:
  `console.log(ok ? "PASS" : "FAIL", n, extra)` (`apps/desk/test/changes-endpoint.test.mjs:35`, Read at 2dbc817).
  34 collected test files use that form. 46 use `ok ? "" : why`, as the lift test does (Ran: `grep -lE` for each
  form over the three test roots).
- **The critique's own example breaks.** `check("route: an unknown session is 404", r.status === 404,
  String(r.status))` (`changes-endpoint.test.mjs:718`) prints `PASS route: an unknown session is 404 404`. Its
  longer partner at `:720` prints `PASS route: an unknown session is 404 on the file route too 404`.
- **Run values.** Ran `node --experimental-strip-types tests/agent-dir-config.test.mjs` in the scratch copy: 98
  PASS lines, and 42 of them end with the run's own temp path. So the text changes on every run, and it differs
  between the N copies that R-1247 runs at once. Titles can hold run values too: `packages/nana-knowledge/tests/hook.test.mjs:200`
  and `:339` put measured milliseconds inside the title.
- **Effect.** Suppose R-1249 compares whole lines. Then every pair that names such a title stops the run with
  exit 2. Under R-1250, a FAIL line with detail matches no PASS line, so the runner reads it as its own text.
  A pair that reds exactly its named title then reads "named but not reached" plus an unnamed red, and RESULT
  miscounts it. The copies do not have this fault, because they match by prefix (`:242`, and `:314` for the
  baseline title check).
- **Acceptance cannot catch it.** Acceptance 2 runs only the lift and tree test files. Both print nothing after a
  PASS title (`requirements-lift.test.mjs:20`, `requirements-tree.test.mjs:19`, Read).
- **Prior art.** The roster-notice copy names one title by RegExp, because that title holds the run's temp home
  path (`docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs:143`, `:292` at ccd8f76; DECLARED (d)).
- **Change.** Keep the copies' prefix test for R-1249. Settle the prefix clash among the titles the table names,
  not among raw PASS lines. Restate §3.3. Add a fixture file that prints detail on PASS lines, a check, and a pair.

### MUST-2. The seat-rule plan gives this lane a guide change that this plan refuses

- **This plan.** S13 says no seat-guide edit. §3.8 forbids an edit to the seat guide. §6 queue item 2 says the
  seat-rule lane "needs no split-run clause". The header says the lane touches no `packages/nana-setup/` file, so
  no install check runs.
- **The seat-rule plan** (`../seat-rule/CHANGE.md`, draft 1, the lane that lands first) adds this sentence to the
  guide: "Split a long mutation run into parts by hand while its runner cannot split it. Check that the parts
  report every pair once." (its §3.1 and `nana-seat.proposed.md`). It pins the sentence with a new R-1140 title,
  "seat guide carries: start what waits on nothing else, keep lane steps in order, check a hand split" (its line
  146). Its carry 1 (line 226) says that this lane rewords R-1140's hand-split clause and the guide sentence, and
  that this lane's pairs red the parallel check.
- **Effect.** The two plans contradict, and one of them must change before plan review. Suppose this lane takes
  carry 1. Then it edits `packages/nana-setup/claude/rules/nana-seat.md`, rewords R-1140, and renames a seat-rule
  test title. Because it then touches `packages/nana-setup/`, the install check runs before land
  (`AGENTS.md:147`). That changes the header, §3.8, §4, S13 and the census. Otherwise the seat-rule plan drops
  carry 1, and its sentence lapses under its own "while" condition.

### MUST-3. A runner with a built-in split already exists on the roster-notice branch, which lands first

- **Fact.** Commit ea09ebe on `feat/roster-notice` (still present at ccd8f76) adds
  `docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs`. Its line 4 reads "Form copied from
  docs/reviews/regroup-2026-10-15/seat-mutate.mjs, plus a built-in split into parallel shards". Line numbers are
  at ccd8f76, and the file is the same as at ea09ebe (Ran: `git diff --stat`):
  - It runs N child processes of itself: 5 by default (`:56`), with a 4 s stagger (`:59`).
  - It merges the part files into one record in table order, with one summed RESULT, and prints a MISSING line
    for a pair that no part printed (`:497-560`).
  - It refuses an unknown pair id with exit 2 (`:566-567`).
  - It handles signals (`:383`) and removes `SEAT_MUTATE_` variables from test children (`:271`).
  - It accepts RegExp titles (`:292`).
- **Measured.** Ran `git show` of its record `seat-mutate-output-59db91d.txt`: 68 pairs in 5 parts, 66/68 red,
  header at 01:46:57Z. The merged file in the seat scratchpad was last written 2 min 15 s later (Ran `stat`). That
  is a second measured split run.
- **What it changes in this plan.**
  - §1 says nothing merges the parts' records and every copy drops an unknown pair id. Both are true at 2dbc817.
    Neither is true of the copy that lands before this lane.
  - §3.2 weighs B1 (one process) against B2 as "what the seat did by hand". A built-in B2 with merging and
    MISSING lines now exists, so B1 needs arguing against it.
  - S12 is already done in that copy. Acceptance 1 copies regroup-shares and splits by hand. Copying the
    roster-notice runner instead gives the split and the refusal with no hand work.
  - Residual 9 and the "claim most likely wrong" in §5.4 rest on "one run at five parts". There are now two.
  - Its `.ts` check runs `--experimental-strip-types --check` (`:374`). This plan's probe shows that command exits
    0 for a broken `.ts` file (Ran `probe-ts/probe.mjs` again: both forms exit 0, and the importing test exits 1
    with `SyntaxError [ERR_INVALID_TYPESCRIPT_SYNTAX]`). So that copy reads a broken `.ts` mutant as RED. That is
    worth one line in this plan and a note to the roster-notice lane.
- **Copy count.** Since the regroup landed, main holds ten hand copies, not nine (Ran: `git ls-tree main
  docs/reviews/`, filtered to folders holding `seat-mutate.mjs`). The tenth also reads npm and uses `/dev/null`
  for hooks, so §1's counts of five npm readers and four `/dev/null` users are six and five at the new base.

### MUST-4. The census says test-runner.test.mjs stays green with no edit; that holds only under a condition, and a second scan is missing

- **R-917 source scan.** `packages/nana-pack/tests/test-runner.test.mjs:422-438` (Read at 2dbc817) is titled "the
  source check detects direct mkdtemp calls while ignoring only generated leak fixtures". It reads every `.mjs` in
  every test root and fails on any direct `mkdtempSync(` call. It also fails on a `tmpDir(` call without
  `import { tmpDir } from "./tmp-dir.mjs"`.
  - The two new test files build throwaway repositories, mark folders and fixture files in the temp folder (§5).
    A direct `fs.mkdtempSync` in either file turns this check red.
  - 62 pack test files already use `tmpDir` (Ran: grep).
  - §5.2 lists `test-runner.test.mjs` as "green with no edit".
- **R-190 scan, not in the census.** `packages/nana-pack/tests/agent-dir-parity.test.mjs:184-189` (Read at
  2dbc817) is titled "PI_CODING_AGENT_DIR is resolved only by agent-dir.mjs". It runs `git grep` over every
  tracked `.ts`, `.mjs` and `.js` outside `tests/` and `test/`, including `docs/reviews/`. It looks for
  `PI_CODING_AGENT_DIR;?$` or `process.env.PI_CODING_AGENT_DIR`.
  - R-1237 makes `lib/test-child.mjs` remove that variable.
  - Ran the regex over sample lines. `k === "PI_CODING_AGENT_DIR";` passes. `delete env.PI_CODING_AGENT_DIR;`
    fails, and so does a header or comment line that ends in the bare name.
  - The roster-notice lane hit this scan; its ea09ebe message names R-190.
- **Change.** Add both checks to §5.2. Put both rules in the build brief:
  - Test files take temp folders only through `tmpDir` from `./tmp-dir.mjs`.
  - Source code names the variable only as a quoted string and never reads `process.env.PI_CODING_AGENT_DIR`.

## 2. SHOULD

- **S1. `SEAT_MUTATE_` variables leak into test children (INFERRED, not run).**
  - The old-form copy that the seat runs for acceptance 1 passes its whole environment to each test file, less
    `NANA_` and `PI_CODING_AGENT_DIR` (`:172-174`). So `mutation-runner.test.mjs` runs with the seat's own
    `SEAT_MUTATE_OUT`, `_TIP` and `_PARTS` set.
  - §3.1 makes `deps.env` default to the real environment. A check that omits it would read the seat's values. So
    would M8, if it starts the runner with `{ ...process.env }`. Such a check can write into the seat's own
    record.
  - The roster-notice copy removes `SEAT_MUTATE_` from its children for this reason (`:271`).
  - Add that removal to R-1237 with a pair, or require every check to build the runner's environment from empty.
- **S2. Clauses that no pair pins.**
  - R-1263: the helper time limit and the scratch prefix. Pairs 57 and 58 cover the per-file limit and the
    retries, and pair 44 covers cores per part.
  - R-1264's "use": M33 compares the config values with the suite runner's text. No check shows that the runner
    passes those values to `runTestFile`.
  - R-1243's git-call clause: M9 covers script edits only.
  - R-1265's lane, tip, pair count, platform, Node version, DECLARED and TITLE fields. Pairs cover only the parts
    count, the hash, the config mark and `none`.
  - Flip those rows only for the clauses a pair pins, or add pairs.
- **S3. R-1239 and R-1240 hold a Windows clause that no pair has seen red.** Pairs 9 and 11 run nowhere. The
  standards make a row the weakest of its clauses, and say to split rather than overclaim. Split each Windows
  clause into its own row, or keep these two rows below `implemented`.
- **S4. Zero runnable pairs.** §3.2 step 2 prints `parts 0`. R-1257 holds the count between 1 and a cap, and R-1265
  names the count. Say `parts 0` in R-1258 or R-1265, and let M27 pin it.
- **S5. §4 says all three earlier lanes change the leaf total.** The seat-rule lane adds no row
  (`../seat-rule/CHANGE.md` line 50 and its residual 8), so only two do.
  - Main's leaf total is now 1,152 (Ran: `git show main:packages/nana-pack/tests/requirements-tree.test.mjs`).
  - It becomes 1,178 after roster-notice and 1,217 after this lane (INFERRED: 1,152 + 26 + 39).
- **S6. §3.2 step 6 says "172 of 187 regroup pairs name one file, 35 of 36 regroup-shares pairs".** The recount
  is higher. Ran a grep of each pair's `tests:` field in `regroup-runner.mjs` and in the regroup-shares table:
  - Regroup: 173 of 187 pairs name one file (172 the regroup test, 1 the tree test). 9 pairs name two files and 5
    name three.
  - Regroup-shares: all 36 runnable pairs name one file (35 the lift test, 1 the tree test).
  - The conclusion is stronger, not weaker.
- **S7. §3.3 says "the lift's reader is `:247`".** `:247` is `labelsOf` in the regroup-shares copy, the only copy
  with that function (Ran: grep `function labelsOf`). The lift copy reads expected cases inline with
  `whyText.includes(`${l}: `)` (`docs/reviews/lift-2026-10-14/seat-mutate.mjs:448-452`).
- **S8. §3.3 counts 23 `.ts` sources.** The command its source names, `find packages apps scripts -name '*.ts'`,
  prints 32 (Ran). Nine of them sit under `apps/bench/studies/.../fixture`. The figure 23 leaves the study fixture
  out, so say so.
- **S9. §1 says the serial runs took 281 minutes "that day".** The four runs in the table do sum to 281 (Ran:
  header time to last write gives 31.7, 54.8, 97.9 and 96.6). A fifth serial run fell on the same local day: tip
  f9ed550, 81 pairs, header at 05:01Z (`git show c514964:docs/reviews/regroup-2026-10-15/seat-mutate-output-f9ed550.txt`).
- **S10. Stale tips.**
  - §2 and §4 cite `feat/roster-notice` at 59db91d; it is now ccd8f76. Its rows are unchanged: R-1190 to R-1215,
    leaf total 1,165 (Ran).
  - FEAT-031 now starts at `REQUIREMENTS.md:1485` on main; it was `:1473` at 2dbc817.
  - The plan places rows by ID, which covers both.
- **S11. The runner skips none of the suite's declared skips** (`scripts/test.mjs:155-168`, R-607).
  - A scratch worktree lacks the ignored `apps/bench/.ext/` (Ran: `git check-ignore`). So a pair that names
    `apps/bench/test/study-tasks.test.mjs` fails its baseline there.
  - On macOS, `hooks-win32-exec.test.mjs` fails "for the wrong reason", in its own comment's words.
  - The baseline then refuses with exit 2, so this fails closed. Name it in residual 4 or the README limits.

## 3. Census (§5.2)

Verified, all Read at 2dbc817:

| Check | Fact |
|---|---|
| `requirements-tree.test.mjs` | `:36` and `:38` (R-291), and `:40`, `:54` and `:55` (literal 1,139) |
| `requirements-trace.test.mjs` | `:56` (G-014), `:61` (the markers agree), `:86` (nested test files) |
| `scripts/requirements-trace.mjs` | `:52`: `EARS_ALLOWANCE = 0` |
| `code-map.test.mjs` | `:39` (G-004, G-009, G-010) |
| `readme-check.test.mjs` | `:36` (G-012) |
| `product-report.test.mjs` | `:31-35` copies the real HANDOFF; `:227-242` (R-1030) refuses a malformed ask |
| `apps/desk/test/knowledge-home-isolation.test.mjs` | `:27` scans `docs/reviews/**/*.mjs` |
| `readme-check.mjs` | `:305-318`: a `<…>` placeholder reads as prose, and a bare `.mjs` name reads as a path |

Misses: the two scans in MUST-4.

Checked and not affected:
- `frontier.test.mjs:55` checks only that the pack README holds the text "nana-frontier".
- `skill-claims.test.mjs:138` checks the README's unchecked-claims list.
- `catch-ledger.test.mjs` reads only `tranche*` folders (`apps/bench/lib/catch-extract.mjs:29`).
- The tree check accepts `planned` rows under FEAT-031's `Status: active` (`scripts/requirements-tree.mjs:186-191`).
- `discovery.test.mjs` uses a fixture `docs/reviews` of its own.

## 4. Recounts

- **Rows.** 39 rows, R-1230 to R-1268, with no gap.
  - Each row holds exactly one `shall` under the rail's regex (`requirements-trace.ts:148`), code spans masked.
  - Each row opens with The, IF, WHEN, WHILE or WHERE, and has three cells.
  - Ran: node over §2's table.
- **IDs.**
  - Ran `git grep -E 'R-12(3[0-9]|4[0-9]|5[0-9]|6[0-9])([^0-9]|$)'` over every local and remote ref: 0 hits on 38
    refs. There were 39 before the `feat/regroup` branch was deleted. A control grep finds R-1183 on 7 refs.
  - Ran `grep -rIl` over the main checkout and the remaining worktrees: 0 files.
  - Main's highest ID is R-1183, now part of main with the regroup's R-1170 to R-1180, R-1184 and R-1187.
  - `feat/roster-notice` adds R-1190 to R-1215.
  - `../runtime-map/CHANGE.md` still drafts R-1220 to R-1238, so carry 1 stands.
- **Checks.** 47 checks: C1 to C9 and M1 to M38, with no repeated title. The §5.1 coverage list matches the
  markers row for row.
- **Pairs.** 91 pairs, numbered 1 to 91 with no gap.
  - The group sums are 15 + 12 + 7 + 6 + 11 + 12 + 11 + 7 + 10 = 91.
  - Pairs 9 and 11 run on Windows only, which leaves 89 on macOS.
  - Every check has a pair, and every row has a pair through its checks. Only C7 lacks a macOS pair.
  - Ran: a node parse of §5.1 and §5.4.
- **Leaf total.** 1,139 at 2dbc817, 1,152 on main now, and 1,165 on `feat/roster-notice`.

## 5. Verified (grouped)

**§1 Why.**
- Copy line references: `:320-343` (the one-at-a-time loop), `:281` (the silent filter), `:231` and `:234` (the
  group kill), `:185` (the bare npm spawn), `:114` (`/dev/null`), `:310` (the red baseline written beside the
  table) and `:113`.
- Counts over the nine copies (Ran: `wc -l`, `grep -c`, `grep -l`):
  - 3,878 lines in total.
  - The silent filter once in each copy.
  - Four lineage lines: tree `:4`, seat-guide `:3`, lift `:5` and regroup-shares `:5`.
  - No copy calls `taskkill`.
  - Five copies read npm, and four use `/dev/null` and write beside the table.
- Plumbing runs 161 to 238 lines per copy. Successive diffs along the roster, seat-guide, tree, lift,
  regroup-shares, regroup chain are 138, 110, 22, 59 and 70 lines (Ran).
- `scripts/test.mjs:76-83` matches the claim.
- The timings in the table reproduce from the records (Ran; 656dc86 gives 54.8, not 54.9).
- Unnamed reds: 44 of 217 in the split run (9 + 8 + 5 + 12 + 10) against 40 of 209 in the last serial run. The
  split record ends with a hand-written `RESULT (all shards)` line.
- The parts started 6 s apart and re-ran 6, 5, 5, 5 and 5 baseline files (Ran on the shard logs).
- `nana-seat.md:9` and lesson 2 at `docs/sessions/2026-10.md:25` say what the plan says.

**§2.**
- FEAT-031 starts at `:1473` and holds 37 rows. The rows that are not the suite runner's are R-898, R-899, R-544,
  R-601, R-948, R-949, R-626 and R-627.
- The texts of R-603, R-604, R-917, R-618, R-648, R-912, R-610 and R-915 match the clauses that R-1235 to R-1238
  and R-1240 to R-1242 repeat.
- R-611 is `untested` at `:1495`.
- R-291 sits at `:1333`, and no evidence cell cites "leaf counts total".
- `REQUIREMENTS.md:23-24` holds the subgroup-home rule.
- `templates/typescript/template/tests/requirements-trace.ts:279-290` is the EARS check.
- Ran `git diff --numstat` on the regroup lane: REQUIREMENTS.md `13 0`, the tree `3 3`.

**§3.**
- `code-map.config.json` puts apps and `scripts/` above packages, and `docs/reviews/` is not a root.
- `win-command.mjs` exports `findOnPath` (`:29`) and `winCommand` (`:50`). Ran `--impact`: 41 transitive callers.
- `builder-preamble.md:22` says what the plan says.
- Line references in `regroup-runner.mjs`:
  - `:582-620` (judging), `:585` (`alsoRed`), `:546-551` (the retry) and `:29` (a home path).
  - The file is byte-identical to `c514964:docs/reviews/regroup-2026-10-15/seat-mutate.mjs`.
- Line references in the seat-guide copy: `:346-356` (stay-green) and `:173-176` (the npm note).
- Line references in the regroup-shares copy:
  - `:241` and `:242` (title parsing and matching), `:245` and `:347-349` (crash rules), `:321-325` (the skip).
  - `:357-367` (expected case labels), `:27` (the keep note), `:30` (usage) and `:37` (a home path).
  - `:50` (10 minutes, as in every copy), `:182-188` (four npm values), `:318` and `:392` (exits 2 and 3), `:344`
    (log names).
- `scripts/test.mjs` line references:
  - `:57` (5 min), `:58` (2000), `:59` (5000).
  - `:107-114` and `:109` (130 and 143), `:206-212` (spawn with `detached` and `windowsHide`).
- Root `package.json` has no dependencies. Its only `node_modules` entries are links used by the e2e suites.
- The longest tracked path is 145 characters (Ran).
- The pack README's writing checker section starts at `:309`.
- The example's anchor occurs once in `scripts/requirements-lift.mjs` at f6bb0bd, and title T1 exists in the
  table.
- `os.availableParallelism()` is 10 (Ran).
- Probes (Ran again):
  - `probe-reset/probe.mjs`: 0 git errors, 0 dirty worktrees, 1 entry left, 1.6 s.
  - `probe-ts/probe.mjs`: as MUST-3 reports.
  - A stdin probe: under `spawnSync` the child gets end of input and exits 0. Under `execFile` it waits until a
    3 s limit kills it. With `stdio: ["ignore", …]` it gets end of input.

**§5 and §6.**
- Acceptance 2 setup:
  - `origin/feat/regroup-shares` is 2dbc817, and no local branch of that name exists.
  - f6bb0bd is in main's history.
  - `scripts/requirements-regroup.mjs` is absent at f6bb0bd, so the conditional skip still holds.
  - The committed record was made at tip f6bb0bd. Its RESULT reads 36/36 red: 28 exact, 2 with a named title or
    case green, 6 with an unnamed red, 0 survived, 2 skipped.
  - The lift baseline took 38.8 s.
- HANDOFF lines: `:72` (desk frozen 2026-10-10) and `:81-86` (the queue).
- `apps/desk/test/origin-rule.test.mjs:17` (port 4391 with a `DESK_TEST_PORT` override) and
  `docs/reviews/process-2026-10-13/CHANGE.md:156` say what the plan says.
- `AGENTS.md:95` gives one plan round to a small lane and two to a gate or format lane. It names no count for a
  larger lane that is neither.
- The five wall-clock bounds sit at `hook.test.mjs:200` and `:339`, `test-locked.test.mjs:103`,
  `bounded-read.test.mjs:37` and `review-ledger.test.mjs:614`. `--poll 1` sits at `review-ledger.test.mjs:82`.
- 144 test files (Ran).
- The `npm run` scripts that acceptance 4 names all exist.
- Node documentation: `fs.rmSync` reads `maxRetries` only with `recursive: true`; `os.loadavg()` returns zeros on
  Windows; `fs.realpathSync.native` exists; a `.cmd` file needs a shell to start.

## 6. Not re-run or unverifiable

- The load average of 9.0 to 10.8 was a reading of the moment.
- Critique S-3's count of "4 such title pairs" was not re-scanned. MUST-1 makes the count less important than the
  PASS-line form.
- The critique's helper timings (24, 31, 26 and 30 ms) were not re-run.
- The 133 test files on 2026-10-10 were not re-checked.
- Every Windows claim is INFERRED: the npm shim, Ctrl-C as SIGINT, the path-length margin, and concurrent git work.
- Acceptance 2's run times (about 25 and 6 minutes) are INFERRED. The arithmetic fits: 36 pairs at 38.8 s each.
