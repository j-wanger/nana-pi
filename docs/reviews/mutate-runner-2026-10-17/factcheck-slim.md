# Fact-check: mutate-runner seat draft 4 (the slim rewrite)

Checked against `afd74de`, the base the plan cites. Main has since moved to `61c5748`, the seat-rule land, and the
items that move with it are rechecked there. "Ran" means run here, in a scratch copy made with `git archive` under
`fcs/` beside this file. "Read" means read at `afd74de`.

**Verdict: 3 MUST, 13 SHOULD, 10 NOTE.** Every file:line citation into the landed runner, `scripts/test.mjs`, the
rail, the census tests, the pack README, the session file and the ledger holds as cited. The recount holds. The
census misses one red check, the code map, and the rail has a matching hazard. Two rows say things the design does
not do.

Process note: one probe step copied a README into `/tmp/x` by mistake. `/tmp/x` was a folder that already existed,
and the copy created a new file there. I removed it at once; the folder's other two files were not touched. Nothing
else was written outside this folder.

## MUST

**M1. The code map reads fixture strings as imports. The census does not list this, and regenerating the map does
not fix it.** The census (CHANGE.md:280) says `map:check` is red only until `npm run map` regenerates the map. But the
test file writes fixture test files and tables "from strings" (:234-236). The generator's scanner reads source text
as raw text: "a fake specifier sitting in a string, a template literal or a comment reads the same as a real one"
(`templates/typescript/template/scripts/code-map.mjs:399-403`). A relative specifier that resolves to no mapped
module is a problem (`:545-548`).
- Ran: I added a test file holding `'import { one } from "../src/one.mjs";'` inside a string. `map:check` then exits
  1 with "relative import '../src/one.mjs' resolves to packages/nana-pack/src/one.mjs, which is not a mapped module".
  An absolute URL built at run time with `JSON.stringify` was not flagged.
- Precedent: `test-runner.test.mjs:108` has the same shape (`"../ts-probe.ts"`). It needed an `ignore` entry,
  `packages/nana-pack/ts-probe.ts`, in `code-map.config.json`. That file is not in this plan's scope.
- The rail has the same hazard. Ran: a `// req: R-1230` line inside a template-literal fixture is counted as a real
  marker ("R-1230 is marked on 1 test(s) but is not in REQUIREMENTS.md").
- Fix: add build-brief rule 5. Fixture sources hold no quoted relative specifier: no `from "./…"`, no `from "../…"`,
  no `import("./…")`, and no `new URL("./…", import.meta.url)`. They also hold no line that starts with `// req:`.
  The test builds such specifiers at run time from a computed URL. The other fix is an `ignore` entry with its
  reason, which brings `code-map.config.json` into scope. Either way, add a census row for this.

**M2. R-1236 contradicts R-1241 in a dry run.** R-1236 (:64) says that when a shard starts, the runner "shall run
each test file its pairs name once unmutated". R-1241 (:69) says that with `SEAT_MUTATE_DRY=1` it runs "no test
file". The landed code skips the baseline in a dry run (`if (!DRY)`, runner `:415`). As written, the code would
break R-1236 on every dry run. Fix: "WHEN a shard starts a run that is not dry, …".

**M3. R-1239 is false on the one-shard path.** At one shard the run happens in-process (step 3, :92). The merge that
writes `MISSING` lines (step 7, :102) runs only above one shard, as in the landed runner (`:586-594` against
`:507-572`).
- With a red baseline at one shard, the landed runner prints its refusal at `:438` and then a RESULT at `:495`. The
  record has no pair line and no `MISSING` line.
- Residual 6 (:433-434) admits that a throw at one shard leaves "no RESULT line".
- R-1239 (:67) says the record holds "each selected pair's line exactly once … with a MISSING line for a pair no
  shard printed, and one RESULT line".
- Fix, option one: scope R-1239 to a run above one shard, and state what a one-shard run writes.
- Fix, option two, simpler: always run shards as child processes, N=1 included. The parent's merge then always
  writes `MISSING` and `RESULT`, the code keeps one path, and residual 6's one-shard gap closes.

## SHOULD

1. **Inline tunables carried over unchanged.** "Everything else is the landed code moved" (:112). That brings along
   `maxBuffer: 64 * 1024 * 1024` (runner `:272`, a cap on git output) and the display widths and line counts:
   - widths at `:304`, `:377`, `:427`, `:457-458`, `:468` and `:474`;
   - line counts at `:387` and `:427`.

   None of these is in §3.5. Add them with their provenance, or declare the display widths as display-only.
2. **The design does not destroy the child's output streams after the drain.** §3.2 (:106-108) says the runner waits
   for `close` up to `DRAIN_MS`, kills the group, then "resolves". The suite runner also destroys `stdout` and
   `stderr` at that point (`scripts/test.mjs:233-234`). Without that step, a descendant that holds the pipe keeps
   the shard process alive after its result. The parent's merge then still waits for that descendant, and on
   Windows nothing ends it. M9 probably catches this, but the design text should say it.
3. **"Follows the suite runner" (:106) is only partly true.**
   - The suite runner kills the group only when the drain runs out (`scripts/test.mjs:256-259`). It does not kill
     the group after a normal `close` (`:261`). This plan kills after every exit (R-1234, S13).
   - The plan also drops `KILL_GRACE_MS` (`:59`, `:242-245`). So a timeout kill that is denied leaves the file
     waiting forever.
   - Name both differences. Residual 1's later shared module has to pick one behaviour. Add the missing grace to
     residual 4.
4. **Pair 1 can survive.** The fixture repository already sits under the temp folder (:234). So a scratch folder made
   "beside the lane repository" is also under the temp folder. M1 must set the fixture runner's TMPDIR, TEMP and TMP
   to a folder that does not contain the fixture repository, and assert that the scratch path is under that folder.
5. **Three §3.3 changes have no pair or check.**
   - `git clean -fdxq` (:118): no pair puts back the landed `-fdq`.
   - Part and tally files removed after the merge (:126, S14): no row text says this (R-1239 does not), and M3 names
     only "scratch folder".
   - The shard count in the header at one shard (:125): nothing asserts it.
6. **M20's title leaves out four values §3.5 calls contract values.** They are `SIGNAL_EXITS` (R-1231),
   `NPM_COMMAND` (R-1232), `MAIN_BRANCH` (R-1240) and `LOG_NAME` (R-1241). Seal them in M20, or mark them chosen.
7. **One R-1240 clause has no check.** No check covers "its merge base with main does not resolve". M19 (:261) names
   only "a tip that names no commit".
8. **R-1241 drops `.log`.** The landed log name is `${p.n}--${path.basename(rel)}.log` (`:454`). The row ends the
   name at "the file's base name". Say `.log`, or the old evidence format changes.
9. **M6 goes red on the Windows leg.** `NPM_COMMAND` is a single string (:167), and M6 needs "a fake NPM_COMMAND run
   by node" (:248). Without a shell, Windows cannot start a `.mjs` file, and M6 is not marked SKIP there. Make
   `NPM_COMMAND` an argument list, so M6 can pass `[process.execPath, fake.mjs]`.
10. **A blank `SEAT_MUTATE_STAGGER_SECS` reads as 0.** `Number("")` is 0 (`:581`), but R-1240 refuses "not a number".
    Say that a blank value means the default, or refuse it.
11. **Facts that went stale when the seat-rule lane landed.** Main is now `61c5748`, fast-forward from `afd74de`. The
    local `feat/seat-rule` branch is gone, so the refs count 39, not 40 (:50).
    - Main now holds the R-1230 range in prose (`docs/reviews/seat-rule-2026-10-16/factcheck-r2.md:77`). It is not a
      ledger row.
    - At `61c5748`, the highest ID is still R-1215, the leaf total is still 1,178 and the heading count is still 68.
    - Update "landing now" at :16, and the landing wording at :227 and :395.
12. **The README's cleanup advice is wrong while the folder exists.** §3.7 (:183) says the leftovers are worktrees
    "that `git worktree prune` clears". `prune` removes an entry only after its folder is gone. Residual 5 (:432) says
    "removing the printed folder", but a shard that was killed outright printed no folder. Print each scratch path
    when its shard starts, or tell the reader to remove `<temp>/seat-mutate-*` first and then run `prune`.
13. **"Nothing imports either, so both are new leaves"** (:80-81) is wrong. The runner imports the config, and the new
    test imports both modules. The map will show those edges.

## NOTE

1. FEAT-031's stored assessment is stamped with 37 rows at `c4332ec` (`docs/product-report/assessments.json`). Twelve
   new rows make the product report show it as stale. No test reads the real store, and earlier lanes left stale
   assessments too.
2. HANDOFF is 4,409 words on main against the frontier checker's budget of 1,200. That checker only reports; Ran on
   main. Ten residual lines add to it, so consider one line that points at §7.
3. §1 (:34): the landed runner waits until the time limit only when the holder is in the file's process group. A
   holder outside the group is never killed, so the landed runner waits forever. The new drain bounds both cases.
4. The `/dev/null` reason (:117) is INFERRED. A hooks path that does not exist also runs no hooks. The empty folder
   does no harm, but mark the reason INFERRED.
5. The INFERRED claim "the README section passes the README check" (:442) can become Ran.
   - A draft section with placeholder paths passed: 677 claims, 0 problems.
   - A bare `seat-mutate.mjs` failed, and so did `node seat-mutate.mjs 3`, as the plan expects.
6. "No existing code changes" (:7) is not quite true. The lane edits a literal and a title in
   `requirements-tree.test.mjs`.
7. The builder preamble says "No suite test runs, imports or copies a seat script" (`worker-lane.test.mjs:100`).
   Fixture tables that the test writes are not seat scripts, but the brief should say so.
8. `lib/win-command.mjs` already exports `findOnPath` and `winCommand`, and setup and doctor use them. Deferring is
   fine, but the subtraction row (:202) could name that helper as the one ready to use.
9. The `.ts` checker lives in `scripts/`, which is the apps layer, and the runner starts it from the table's
   checkout. A table in another repository has no checker, so every `.ts` pair there reads SYNTAX. The README
   section should say the runner serves this repository's lanes.
10. Residual 6 (:433) gives "a failed worktree add" as an example of a throw. The landed runner logs that failure and
    returns exit 2 (`:406-407`). Only a failed reset throws.

## Census additions (§5.2)

| Check | Effect |
|---|---|
| `code-map.test.mjs:39` and `map:check` | Red on any fixture string that holds a relative import specifier, and regenerating does not fix it (M1). |
| `requirements-trace.test.mjs:61` (the rail) | Red on a `// req:` line inside a fixture string (M1). |
| `ts-syntax-check.test.mjs:71` ("every TypeScript file under packages passes syntax checking") | Green only while the fixture `.ts` module lives under the temp folder and never under `packages/`. |

Checks I read that stay green:
- `catch-ledger.test.mjs` counts reports only in the `tranche*` folders.
- The pack README assertions only test for included text: `land.test.mjs:500`, `verifier-pipe.test.mjs:152` and
  `templates-render.test.mjs:283`.
- `RELEASE_SURFACE` is only `templates` and `copier.yml`.
- `R-288` counts 68 headings, and the plan adds none.
- `ci-workflow`, `requirement-rows` and `immutable-review` scan nothing the lane adds.
- No test scans pack source for `windowsHide`, `kill(-`, `/dev/null`, npm spawns, `NANA_` names or provenance.

## Confirmed as cited

- **The landed runner** has 594 lines. Its plumbing runs from `:271` to the end, which is 324 lines.
- **Cited runner lines that hold:** `:18-23`, `:30-31`, `:41-42`, `:50-51`, `:53`, `:56`, `:59`, `:289-295`, `:292`,
  `:305`, `:306`, `:313`, `:335`, `:355`, `:361`, `:362-365`, `:384`, `:399`, `:416-421`, `:438`, `:457-459`, `:496`,
  `:507-572`, `:527`, `:547`, `:561`, `:569-570` and `:577`.
- **The repeated-id loss:** above one shard, the merge keys lines by id. One pair's line prints twice and the other's
  never prints, with no `MISSING` line. Read. Each shard that is given a repeated id also runs both pairs.
- **Runner copies:** 11 JavaScript copies with 5,104 lines on main. Every copy uses a 10-minute file time limit and
  `clean -fdq`.
- **Records:** three five-shard records. Their RESULT lines are 66/68 at `59db91d`, 70/70 at `633d41b`, and 71/71 at
  `f5c2d3c` (55 exact, 4 with a named title green, 15 with an unnamed red, 0 survived). The `f5c2d3c` record has no
  baseline retry.
- **`.ts` pairs:** there are six (19 to 23 and 62). Ran again on a fresh `f5c2d3c` copy: all six pass the checker.
- **Node behaviour:** Ran on Node 22.22.2.
  - `node --experimental-strip-types --check` exits 0 on a broken `.ts` file.
  - The repository's checker exits 1 on that file and 0 on a valid one.
  - A `.ts` import works with no flag, and `process.execArgv` shows the flag when it is passed.
- **`scripts/test.mjs` lines that hold:** `:57`, `:58`, `:76-83`, `:81`, `:108-113`, `:109`, `:115-116` and
  `:206-261`.
- **The TypeScript post-edit command** is at `.pi/nana-pack.json:5`, and its rows R-993 and R-994 exist.
- **The rail:** `requirements-trace.ts:148` is `SHALL`, and `:272-282` is `shallCounts`. Markers that name several
  IDs are allowed (`:12`, `:82`).
- **FEAT-031** is at `REQUIREMENTS.md:1511`, with that label. It has no subgroups, so the S4 rule holds.
- **Row IDs:** the highest is R-1215. R-1230 to R-1269 appear in no ledger on any ref. R-603, R-604, R-648 and R-610
  read as the plan says.
- **Leaf total:** the literal is at `requirements-tree.test.mjs:40`, `:54` and `:55`, and no evidence cell cites
  that title. The ledger holds 1,156 R rows and 22 G rows, which is 1,178.
- **Census rows that hold at their cited lines:** `requirements-tree.test.mjs:36` and `:38`;
  `requirements-trace.test.mjs:56`, `:86` and `:149`; `code-map.test.mjs:39`; `readme-check.test.mjs:36`;
  `product-report.test.mjs:32`; `knowledge-home-isolation.test.mjs:27` and `:43`; `test-runner.test.mjs:430-435` and
  `:438`; and `agent-dir-parity.test.mjs:184` and `:189`. The R-190 grep passes at `afd74de` (Ran).
- **The HANDOFF ask form** matches the parser's `TITLE` pattern (`lib/handoff-asks.mjs:13`). Residuals go under
  "Carried residuals", which the product report does not parse.
- **Other citations:** the pack README's writing checker section is at `:312-369`, and the next heading is at `:370`.
  The 8.3 lesson is at `docs/sessions/2026-10.md:53`. The runtime-map plan holds R-1270 to R-1299
  (`../runtime-map/CHANGE.md:51`).
- **The seat guide on main** names "a long mutation run in parts", never splits beside a full suite, and keeps
  "re-run the lane's mutation runner". The roster sets no larger-lane builder.
- **No names:** the plan contains no owner, provider, model or machine name.

## Recount (Ran `fcs/recount.mjs`)

- **Rows:** 12 rows, R-1230 to R-1241. Each has one `shall` with code spans masked, five cells and a valid EARS
  opening.
- **Titles:** 22 titles, M1 to M22. None begins with another title followed by a space. The coverage list equals the
  markers, row by row.
- **Pairs:** 33 pairs, numbered 1 to 33 with no gap. The group sums are 6, 7, 3, 2, 4, 6, 2 and 3, which make 33. 32
  pairs run on macOS, and every check has at least one macOS pair.
- **Draft 3:** 40 rows and 98 pairs. 28 rows kept plus 12 cut make 40.
