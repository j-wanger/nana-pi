# Design critique: mutate-runner (parallel-seat CHANGE.md, seat draft 1)

*Adversarial plan review of `CHANGE.md` in this folder, against main at `2dbc817`. Citation forms: `file:line at 2dbc817` (read, not run);
"Ran: <command>" (run on the seat machine, macOS, Node 22.22.2, git 2.50.1, in a scratch folder or a scratch extract of `2dbc817`);
INFERRED (neither read nor run). Line citations with no file name are `docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs` at
`2dbc817`, as in the plan.*

**Verdict: not ready. 5 MUST, 17 SHOULD, 6 NIT.**

**Stakes read:** medium and reversible, as the plan says. But the plan makes split runs the default, so a misjudged pair is now more
likely than in the serial copies. Most MUSTs below sit on that path.

---

## MUST

**MUST-1. The lane order puts the request's own change last.**
- The request asks for one thing in this half: the seat weighs running work at the same time, by default. Lane 2, the seat-guide
  bullet, delivers that. The plan puts it behind lane 1 (27 rows, 38 checks, 68 pairs, the larger builder) and behind D1.
- The stated reason is weak. Only one clause of lane 2's bullet ("a split mutation run") needs lane 1. The lost-pair risk that clause
  carries is one line in a seat copy: `PAIRS.filter((p) => only.includes(p.n))` (`:281`). The seat can make its next copy refuse an
  unknown id without a lane.
- Three of the four kinds of work in the bullet need no runner: another lane's build, separate research and separate checks. The
  research says the seat's checks after builds could have run beside the mutation run (`research.md` §1.3).
- Most of lane 1 ports existing behaviour into product code. 6 of its 27 rows are about parts (R-1253 to R-1258). The other 21
  rows port behaviour the copies already have, or fix Windows gaps no seat run has hit.
- **Fix.** Put lane 2 in the first free slot. Its bullet leaves out the split-run clause. Until lane 1 lands, the seat's own copy
  refuses an unknown id. Lane 1 follows, and the split-run clause joins the guide once the runner exists. Ask D1 now. If D1 has no
  ruling by lane 2's build, bullet 7 stays as it is.

**MUST-2. "Lane 1 needs no owner call" is false.**
- §1 ("It needs no owner call") and §6 ("lane 1 needs none") both claim it. D2 then asks the owner to place lane 1 in the next
  free slot, ahead of the rulings file, and says "it reorders your queue". Lane 1 cannot start until D2 is answered.
- D2 also misstates the queue. At `HANDOFF.md:82-85` at 2dbc817 the order is: the regroup, then feature-oriented development, then
  the 2026-10-16 feedback items, then the parallel test runner. D2 leaves out feature-oriented development. The new request is not
  in the queue at all.
- **Fix.** Say lane 1 waits on D2. Quote the queue in full, by item. Mark D2 as a blocking ask.

**MUST-3. The row IDs collide with the sibling runtime-map plan.**
- This plan says the runtime-map plan "drafted R-1220 to R-1233 and nothing from R-1240 (Ran: grep of its research notes)". The
  sibling's `CHANGE.md` holds R-1220 to R-1238 (`../runtime-map/CHANGE.md:43`, `:66-73`). Its S1 also says it moves to R-1240 to
  R-1258 if the seat queues the mutation runner first (`../runtime-map/CHANGE.md:362-363`). Ran:
  `grep -nE 'R-12(19|3[4-9]|40|58)' ../runtime-map/CHANGE.md`.
- So both plans claim R-1240 to R-1258 when the mutation runner goes first. This plan's other branch ("subtract 20 from every ID")
  puts it at R-1220 to R-1246. That overlaps the sibling's move to R-1240 to R-1258 at R-1240 to R-1246.
- The repo has already logged this risk as a lesson: "Parallel lanes need reserved ID ranges in each brief" (`docs/sessions/2026-10.md:139`).
- **Fix.** Use one fixed split in both files. Runtime-map keeps R-1220 to R-1238, which it already uses. This plan keeps R-1240 to
  R-1266 inside a reservation of R-1240 to R-1279. Delete the sibling's conditional move and this plan's "subtract 20" branch. Grep
  the sibling's `CHANGE.md`, not only its notes.

**MUST-4. The baseline does not run what the pair phase runs, so the parallel default can fake red pairs.**
- The plan's safety case for splitting is this subtraction-table row: "Baseline at the parts count: a file that fails under load
  shows before it can fake a red pair" (§3.9). As designed, the claim does not hold, for two reasons.
- First, the baseline runs each distinct file once, up to N files at a time (§3.2 step 4). The pair phase runs N copies of the
  same file at once, because a lane's pairs mostly name one or two files. In the regroup table, 172 of 187 pairs name `RG_T`; in
  the regroup-shares table, 35 of 36 name `LIFT_T` (Ran: `grep -oE 'tests: …' | sort | uniq -c` on each table).
- So a file that fails when two copies run at once passes the baseline and then reds pairs at random. One such file is on main
  today: the desk origin-rule test binds fixed port 4391 (`apps/desk/test/origin-rule.test.mjs:17` at 2dbc817). The baseline's load
  is also lower than the pair phase's load: one or two files against N heavy copies.
- Second, `BASELINE_RETRIES` = 1 re-runs a red file, and the plan logs both attempts. A file that failed once under load and then
  passed is exactly the flaky file that fakes reds. The retry hides it. The retry's own reason was "re-run once alone"
  (`regroup-runner.mjs:547`). At N parts the retry does not run alone.
- **Fix.** Above one part, the baseline runs each named file as N copies at once, one in each part's worktree. A red copy refuses
  the run with exit 2, names the file, and says to re-run with `--parts 1`. There is no baseline retry above one part; keep the
  retry for one part only. Wall time stays near today's baseline, because each file's N copies run together.
- Add one check for this ("at two parts, a baseline file that fails when two copies run at once refuses the run with exit 2").
  Add one wrong-code pair for it ("the baseline runs each file once at any parts count").
- Rewrite the subtraction row and residual 2 to match.

**MUST-5. Moving helper children to async calls adds a hang with no limit.**
- §3.2 says "Every git call, `node --check` and run edit is awaited through an async child process". It gives these calls no time
  limit and no stdin setting. The copies use `spawnSync` (`:113`, `:260`), which gives a child an empty stdin.
- Async `execFile` and `spawn` leave the child's stdin open. Ran (a scratch probe): under `spawnSync`, a child that reads
  stdin got end of input and exited 0. Under async `execFile`, the same child was still waiting when the 3 s limit killed it. With
  no limit, it never ends.
- A run edit that calls one of this repo's stdin-reading commands would hang the run for good. The hook commands are an example
  (INFERRED: no current table calls one).
- **Fix.** Start every helper child with `stdio: ["ignore", "pipe", "pipe"]`, `windowsHide`, and a time limit from config. A run
  edit past its limit is ANCHOR-MISS (R-1245 already covers a run edit that exits non-zero). A git call past its limit is ERROR
  (R-1257).
- Add one wrong-code pair ("a run edit's stdin left open") and one check that a run edit reading stdin finishes.

---

## SHOULD

**S-1. A cleanup failure can lose the RESULT line.**
- §3.2 does cleanup (step 8) before RESULT (step 9). Two failures are in the threat model: an antivirus lock past `RM_RETRIES`, and
  a descendant that outlives the drain and keeps a worktree as its working folder (Windows refuses to delete such a folder,
  INFERRED). Either can make `git worktree remove` or `rmSync` throw before RESULT is printed.
- **Fix.** Write RESULT before cleanup. Each cleanup step catches its own error and prints one line naming the path it left. A
  cleanup failure never changes the verdict's exit code.

**S-2. Stopping a run now orphans up to N test trees, and residual 6 says they end on their own.**
- Every test child runs in its own process group (`detached`). Ctrl-C and a background-task stop reach only the runner (INFERRED
  from POSIX process-group rules).
- A hung test file, the kind the time limit exists for, then runs forever. The timer that would have killed it died with the
  runner. The serial copies leave at most one such tree. At the default of five parts, up to five can be left.
- The suite runner already handles this in about ten lines (`scripts/test.mjs:107-114` at 2dbc817).
- **Fix.** Add a SIGINT and SIGTERM handler that kills every live test tree and exits. Leave worktree removal to
  `git worktree prune`, as residual 6 says. Or keep the cut, but correct residual 6 and give the kill command.

**S-3. A named title that is the start of another title is misjudged.**
- A title matches when `t === title || t.startsWith(title + " ")` (`:242`; §3.3). Suppose a pair names title A, and another
  title "A ..." fails while A passes. The pair is then judged RED on A, and a survivor is hidden.
- Ran: a scan of `check("…")` titles at 2dbc817 found 4 such pairs within one file. Examples: `apps/desk/test/changes-endpoint.test.mjs`
  "route: an unknown session is 404" against "… on the file route too", and `packages/nana-knowledge/tests/tokenize.test.mjs`
  "skip: slash command" against "… after trim".
- **Fix.** The baseline refuses, with exit 2, a named title that matches more than one PASS line in its files, naming both. Add
  one check and one wrong-code pair for this.

**S-4. A syntax-broken `.ts` mutation is judged RED.**
- R-1246 checks `.mjs` and `.js` only (`:333` does the same). Ran: on Node 22.22.2, `node --check bad.ts` and
  `node --experimental-strip-types --check bad.ts` both exit 0 for a broken TypeScript file.
- The repo has 23 `.ts` sources, for example under `packages/nana-knowledge/lib/` (Ran: `find packages apps scripts -name '*.ts'`).
- A broken `.ts` mutant crashes its test file. A crash counts as RED (§3.3), so a SYNTAX error reads as a pinned test.
- **Fix.** Report a pair as SYNTAX when a test file crashes with a `SyntaxError` that names a file the pair edited. State in R-1246
  that `.ts` edits are checked this way.

**S-5. The rendezvous checks can pass without proving anything, and can slow the suite.**
- M22 runs at one, two and five parts, and pair 1's test waits for pair 2's finish mark (§5). At one part, pair 2 cannot finish
  first, so every green run pays the full fixture limit.
- At two or five parts on a busy machine, the wait can time out. Pair 1 then finishes first, and the order check passes without
  any out-of-order finish. Wrong-code pair 47 then survives.
- The marks live in one folder that a `NANA_TEST_` variable names. Marks left by the baseline phase can satisfy the pair phase,
  so M18 meets even at one part.
- These checks run in the land gate on a machine the parallel default keeps loaded.
- **Fix.**
  - Key each mark by phase and by a value the pair's edit sets.
  - A timed-out wait prints FAIL; no wait passes on time alone.
  - At two and five parts, M22 asserts from stdout that pair 2 finished before pair 1. It sets no rendezvous at one part.
  - No green check waits out a limit.
  - Name the fixture limit in the test's config with its provenance.
  - Give the two files a measured time budget in the build brief. Ran (a scratch probe, macOS): `git worktree add` 24 ms,
    reset plus clean 31 ms, `node --check` 26 ms, one tiny test file 30 ms. So the fixture work is cheap, and the waits decide
    the suite cost.

**S-6. Two rows carry more than one behaviour.**
- R-1243 holds four: the run form and folder, a fresh home and temp folder, the variable scrub, and gc.auto. The suite holds the
  same four as four rows: R-603, R-604, R-618 and R-648 (`REQUIREMENTS.md:1482`, `:1483`, `:1504`, `:1490` at 2dbc817).
- R-1240 holds isolation, a clean checkout between pairs, and hooks off. Hooks off already has its own check (M2) and its own
  wrong-code pair (17).
- **Fix.** Split R-1243 into four rows and R-1240 into two (isolation with a clean checkout; hooks off). Re-point C1, C2, M1, M2
  and M6.

**S-7. Some clauses have no check, and one row breaks on honest input.**
- R-1256's "each as soon as every earlier pair's line is written" is not pinned. A runner that writes the record only at the end
  passes M22. Fix: in M22, pair 2's test reads the record and requires pair 1's line, or drop the clause.
- R-1260 names the output drain and kill grace, but M26 exercises neither. Fix: add them to M26, or take them out of the row.
- M5 checks that "its path [is] printed", but R-1242 says nothing about printing. Fix: add the clause to the row, or drop it from
  the title.
- R-1255 "held between 1 and the number of runnable pairs" has no answer when nothing is runnable, for example a selection of only
  skipped pairs. Fix: when nothing is runnable, make no worktree and print SKIPPED lines and RESULT.

**S-8. The sealed set leaves out literals that the rows state.**
- The row texts state exit 3 (R-1245, R-1246, R-1257, R-1258), exit 2 (R-1247, R-1259), `--experimental-strip-types` (R-1243) and
  the three npm keys (R-1244).
- M27 seals only the variable names and `--parts`. Every other check imports the name. A changed `EXIT_TABLE_FAULT` would pass
  every check while R-1245 still says 3.
- **Fix.** M27 also seals `EXIT_REFUSED`, `EXIT_TABLE_FAULT`, `CHILD_NODE_ARGS` and `NPM_KEYS`, naming their rows.

**S-9. The runner hash names less than the plan says.**
- R-1263 hashes `mutation-runner.mjs` alone. A change to `test-child.mjs` or to the config module, or a caller's replaced config,
  leaves the header unchanged. So "a record names the runner that judged it" overstates.
- **Fix.** Hash the three modules in a fixed order. Print `config injected` when a caller replaces the config. Wrong-code pair 62
  should then also cover "hashes one module only".

**S-10. Two parts fail the plan's own subtraction test.**
- The plan rates the stagger "weak: git needs none", and §1.4 of the research confirms git needs none. At the default it adds 24 s
  to each phase for the last part. Fix: cut R-1254, M20, pairs 42 and 43, and `PART_START_INTERVAL_MS`.
- S9 says "lane features one lane used stay out". `skip` (regroup-shares only) and `alsoRed` (regroup only) are both in
  (`research.md` §1.2 table). Fix: restate S9 as "features in the newest copy stay in", or cut `skip` and port a table that needs
  none.

**S-11. A pair that lists case labels with no label reader is judged silently.**
- R-1250 applies only "WHERE … the lane supplies a label reader". A table copied without `labelsOf` judges `expectWhy` pairs with
  no labels and no warning.
- **Fix.** Refuse before any worktree, with exit 2, naming the pair (the R-1259 family).

**S-12. The plan says nothing about a merge base that does not resolve.**
- The copies refuse when the tip or merge base fails to resolve (`:292`). R-1259 keeps only the tip.
- A clone with no local `main`, or a fixture repo made under a fresh home, may have no `main` branch. Such a repo's default branch
  is `master` unless `init.defaultBranch` says otherwise (INFERRED from git's default). In that case R-1263's header has no value
  to print.
- **Fix.** Print `merge base none` and go on, since the field is information only. Fixtures use `git init -b main` or inject
  `MAIN_BRANCH`.

**S-13. Lane tables would put home paths in the public corpus.**
- §3.4's table takes `repo: "<lane worktree>"`, which is an absolute path. The copies hard-code a home path (`:37`). §3.8 promises
  that nothing the lane writes adds an absolute home path, but acceptance 2's port must name a repo.
- **Fix.** `repo` defaults to the git root of the folder holding the table, found from the table's `import.meta.url`. Tables then
  carry no path.

**S-14. Ignored files carry over between pairs, in an order that changes from run to run.**
- `git clean -fdq` (`:207`) keeps ignored files. `docs/product-report/out/` is ignored (`.gitignore` at 2dbc817).
- With parts, which pair ran before which in a worktree changes from run to run. A file left in an ignored folder can then change a
  later pair's verdict differently each run. That would also break acceptance 2's comparison of `--parts 1` with the default.
- **Fix.** Use `git clean -fdxq`. Scratch worktrees hold no `node_modules` (the root `package.json` has no dependencies at
  2dbc817). Extend M1 to cover an ignored file.

**S-15. Two Windows pairs run nowhere, and the evidence for two rows overclaims.**
- §5.3 says pairs 9 and 11 "run only on the Windows leg". The Windows leg runs the green suite and no mutation pairs, and it does
  not block. So C5 and the `taskkill` path of C6 have never been seen red.
- **Fix.** The evidence cells for R-1244 and R-1261 name the Windows clause as unverified. Alternatively, the seat runs pairs 9
  and 11 once on a Windows machine and files the record.

**S-16. Pair 67 is likely to survive.**
- The copies read titles with `.slice(...).trim()` after splitting at `\n` (`:241`). The trim already strips a CRLF line's `\r`. A
  mutant that splits at `\n` only still matches, so M12 stays green.
- **Fix.** Define pair 67 as "split at `\n` with no trim", or drop the CRLF clause from M12 and §3.6.

**S-17. Several owner-facing statements need fixing.**
- (a) §1 says the owner "found the seat's lanes slow". The relayed request says nothing about speed. Fix: mark it as the seat's
  reading, or cite where the owner said it.
- (b) The attention-limit trial allows at most three blocking asks at once until 2026-10-20 (`HANDOFF.md:79` at 2dbc817). This
  plan adds D1 to D3, and the sibling plan adds more. Fix: label each ask as blocking, optional or parked. D3 is parked until
  lane 3.
- (c) D1's trade leaves out two real limits on parallel lanes. First, a five-part run beside a builder's suite run puts the
  suite's five wall-clock bounds under load. Second, every lane edits the same files: the leaf-total literal inside a test title
  (`packages/nana-pack/tests/requirements-tree.test.mjs:40` at 2dbc817), the generated tree and map, HANDOFF and the session
  archive. A third lane means more rebases. Fix: name both in D1, and put the first in the README limits.
- (d) `DRAIN_MS` and `KILL_GRACE_MS` are defined twice, which the standards forbid ("defined once"). Fix: declare it as a
  violation that lane 4 closes. Add one check that the two values equal `scripts/test.mjs:58-59`; `test-runner.test.mjs` already
  reads that file.

---

## NIT

- **N-1.** §2 lists the suite rows that R-1243 repeats but leaves out R-604, the fresh home row. `KILL_GRACE_MS` cites R-611 as its
  contract, and R-611 is `untested` in the ledger (`REQUIREMENTS.md:1495` at 2dbc817).
- **N-2.** `CORES_PER_PART` is labelled "measured", but it rests on one run at one setting. Label it "chosen, from one run at five
  parts", as the plan's own "claim most likely wrong" admits.
- **N-3.** R-1265 should state the copies' file-name mapping: a `/` in a pair id becomes `-` (`:344`). It should also refuse an id
  that holds a character Windows does not allow in a file name.
- **N-4.** `--parts` has no upper bound. A typed `50` makes 50 worktrees and runs 50 test files at once. Hold it at the available
  cores and print one line when it is cut.
- **N-5.** S10 cites "part (c) of the request". The request has no part (c); that label comes from the seat's brief. Name the item
  in plain words.
- **N-6.** Windows path length has some margin but is not stated. Ran: the longest tracked path at 2dbc817 is 145 characters
  (`git ls-tree -r --name-only 2dbc817`). A temp prefix of about 65 characters keeps it under 260 (INFERRED for a runner's temp
  path). Name it as a limit.

---

## What holds up

Checked, and no change needed:
- The nine copies hold 3,878 lines. All nine drop an unknown id without a word, and none calls `taskkill`. Four turn hooks off with
  `/dev/null`, and four write a red baseline's output beside the table. Ran: `wc -l` and `grep -l`/`grep -c` over
  `docs/reviews/*/seat-mutate.mjs` at 2dbc817.
- Main's highest row is R-1183. No R-1220 to R-1279 row is on main. FEAT-031 holds 37 rows. Ran: grep over `REQUIREMENTS.md` at
  2dbc817.
- The layer rule puts a shared module in `packages/nana-pack/lib/` (`code-map.config.json` `layers` at 2dbc817). The builder rule
  keeps lane tables out of the suite (`packages/nana-pack/prompts/builder-preamble.md:22` at 2dbc817).
- The suite runner's kill, drain and kill-grace code is as cited (`scripts/test.mjs:57-59`, `:77-83`, `:204-263` at 2dbc817).
- One process for every part (B1) is the right call over one child process per part (B2). It means one baseline, exactly-once
  accounting in memory, and parts that balance themselves.
- The committed regroup-shares record is at tip `f6bb0bd` with the RESULT counts the plan quotes. Ran: `head -1` and `grep ^RESULT`
  on `docs/reviews/regroup-shares-2026-10-15/seat-mutate-output.txt`.

## The claim in this critique most likely wrong

MUST-1 depends on reading the request as a change to how the seat works, not a change to the runner. If the owner meant "make the
seat's mutation runs parallel", lane 1 first is right. MUST-1 would then shrink to the owner-call fix in MUST-2.
