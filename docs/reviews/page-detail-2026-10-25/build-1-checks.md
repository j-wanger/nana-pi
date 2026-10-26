# Product detail build evidence

Feature: FEAT-039. Lane: page-detail. macOS, build sessions 1, 2 and 3.

VERDICT: DONE. Session 3 closes the R-2740 model-consumer mismatch through the newly authorized ageFor-only change. The focused run, locked whole suite, final checks, seat titles and real-page validation pass. The commit containing this record includes all three sessions' lane work.

The sections through Scope, known bugs and departures preserve sessions 1 and 2's historical evidence. Session 2 stopped as instructed when its focused run failed R-2740, without changing that test. Session 3's completion evidence follows those sections.

Session 2 preserves session 1's requirement-first implementation and wrong-code-first evidence. The seat corrected one contradictory clause in session 2's brief. R-2542 now excludes only deliverable blocks whose h3 starts with `R-5000 ` or `R-5001 ` on FEAT-052. Its title, every other clause, fixture, requirement text and evidence remain unchanged. This check says nothing about R-5100's block; R-2932 owns homed blocks.

## Rows and implementation

Session 1 added R-2930 through R-2933 after R-2927 as untested, wrote their tagged checks, implemented the change, then marked them implemented after their checks passed. Reworded R-2542, R-2642, R-2790, R-2799, R-2801, R-2922, R-2923 and R-2924 with the must-meet texts. R-2800 is retired with unchanged requirement text and the prescribed evidence. R-2934 through R-2949 remain unused. No new sealed tunable enters.

The model uses `feature.detailSections`: `{ heading, blocks }` for Deliverables and `{ heading, cards }` for Registered artifacts. Blocks carry `{ heading, claims, artifactLines }`; artifact lines are segment lists. Cards keep `{ heading, lines }`, with each line carrying segments. Product deliverables retain only their identity, gap, home and finished segments. The Artifacts model retains its registry state, empty text and two segmented lists. No block or card is copied between model views. The renderer reads section headings from the model, not module scope.

Moved helpers: feature, stage, code, manual, park, page and commitCode from product-overview.test.mjs, and artifactFlowLedger from product-report.test.mjs, into report-fixtures.mjs. The file-writing helpers receive their temporary folder. The overview keeps local page and commitCode wrappers. No other private helper moved or was copied. Product code adds no imports. Label words match the must-meet without refinement.

Session 2 also applies the exact step 10 requirements-skill paragraph replacements and step 11 pack README replacements. The map and tree outline were regenerated in this build; all changed module headers describe their current outputs.

## Existing-test edits in sessions 1 and 2

Only steps 8 and 9 changed existing tests in those sessions:

- 8a: artifactFlowLedger moves to the shared fixtures and is imported.
- 8b: renderedHomes joins feature-detail nodes in model order; renderedProduct stays.
- 8c: cardFor selects only requirement-card articles; R-1511, R-1513 and R-1515 assertions stay unchanged.
- 8d: R-1041 counts only unclassed assessment lists.
- 8e: R-1019 records attributes and tests hostile block headings and card lines through text nodes.
- 8f: R-2542 reads claims on FEAT-050; session 2's corrected clause excludes only R-5000/R-5001 blocks on FEAT-052.
- 8g: R-2642 reads home-feature blocks and takes the prescribed title.
- 8h: R-2790 adds the other-maker fixture and block maker-link clauses.
- 8i: R-2791 renders FEAT-091.
- 8j: R-2792 reads renderedHomes.
- 8k: R-2799 reads maker-feature cards and block ages, excludes cards elsewhere, removes the self-link expectation and takes the prescribed title.
- 8l: only the named retired R-2800 check is deleted.
- 8m: R-2801 pins the two-list-only shape and maker links; manual reasons and exclusions stay.
- 8n: the 23 specified age-check call sites use renderedHomes, with no assertion changes.
- 9: overview helper imports and local wrappers; R-2923/R-2924 fixture ownership, maker-link assertions and detail route change exactly as briefed.

No other existing assertion was edited. Test-literal escape sequences remain intact.

## Wrong-code-first evidence retained from session 1

Before implementing the view moves, session 1 exported the two required label objects so the new module could load against the old implementation. `node packages/nana-pack/tests/product-detail.test.mjs` exited 1: R-2930, R-2931 and R-2932 failed on nested claims/artifact text and absent detail sections. R-2933 passed on unchanged checker behavior.

Session 1 then changed only the checker's deliverable-line emission from console.log to console.error. The same command exited 1, including R-2933's stderr failure. The checker line was restored immediately. Session 2 read those retained logs and reran the checker mutation below against both R-2933 and R-2543.

The new R-2930 fixture covers CRLF, trailing spaces and tabs, and no final newline within its named case. Each new async check is awaited under withinCaseLimit.

## Hand red cases

Each case below independently changed CODE, ran the real test file(s) directly through Node on macOS with ambient NANA variables removed, saw exit 1 and the named failure, and restored the code in a finally block before the next case. No assertion was inverted. Each child had a 300-second process limit and heartbeat; the tests retain their per-case limits. No test ran, imported or copied a seat script. Full mutation logs stayed in OS temporary files.

| Case | Wrong code | Named failures required and seen |
|---|---|---|
| 01 | Product item nests ul.deliverable-claims | R-2930 |
| 02 | Reader kinds sorted | R-2930 |
| 03 | Page reparses readerClaim(claim.text) instead of readerKind | R-2930 |
| 04 | readerKind lacks the non-empty-detail guard | R-2930, R-2542 |
| 05 | Parked from any Parked line | R-2930 |
| 06 | Parked from any Parked line unless code makes and reads | R-2930 |
| 07 | Smallest day count | R-2931 |
| 08 | Built-from entries included in the named set | R-2931 |
| 09 | Unmeasured named artifact overrides measured days with unknown | R-2931 |
| 10 | Day test uses truthiness | R-2931 |
| 11 | Dead IDs omitted from named set | R-2931 |
| 12 | Blocks sorted in row-table order | R-2932 |
| 13 | Deliverables heading drawn for blocks or cards | R-2932 |
| 14 | Home from the row's own heading, not its feature ancestor | R-2932 |
| 15 | Blocks also placed on sharing features | R-2932, R-2542 |
| 16 | Claims gathered from all capability spans | R-2542 |
| 17 | Block line maker link removed | R-2790 |
| 18 | Cards still rendered on Artifacts | R-2799, R-2801 |
| 19 | Card retains Made in self link | R-2799 |
| 20 | Artifacts list maker links removed | R-2801 |
| 21 | Old flow groups restored to model and renderer | R-2801 |
| 22 | Overview gap IDs lose maker links | R-2923 |
| 23 | Overview stale items lose maker links | R-2924 |
| 24 | Renderer reads module-scope DETAIL_HEADINGS | R-2932, ReferenceError |
| 25 | Block heading assigned through innerHTML | R-1019 text-node check |
| 26 | Checker emits deliverable lines through console.error | R-2933, R-2543 |

All 26 cases completed with the named failures and were restored. The checker has no diff. No mutation is retained or committed.

## Commands and exit codes

- Session 1's initial map impact command: exit 0 before implementation.
- Session 2 `npm run map:impact -- scripts/product-report.mjs scripts/deliverables.mjs packages/nana-pack/tests/product-report.test.mjs`: exit 0 before its test edit.
- `npm run map`: exit 0, 446 modules.
- `npm run req:tree`: exit 0, 2062 rows, 39 features, 0 problems.
- Initial restored `npm test --` for product-detail, product-overview and product-report: exit 0; 4 checks in 1.7s, 9 in 3.7s, 91 in 63.4s; 104 checks passed in 69.4s.

The final focused command was `npm test --` followed by these 12 explicit test paths: packages/nana-pack/tests/product-detail.test.mjs, packages/nana-pack/tests/product-overview.test.mjs, packages/nana-pack/tests/product-report.test.mjs, packages/nana-pack/tests/requirements-deliverables.test.mjs, packages/nana-pack/tests/requirements-tree.test.mjs, packages/nana-pack/tests/requirements-moved.test.mjs, packages/nana-pack/tests/runtime-land.test.mjs, packages/nana-pack/tests/runtime-map.test.mjs, packages/nana-pack/tests/linked-launch.test.mjs, packages/nana-pack/tests/templates-render.test.mjs, packages/nana-pack/tests/skill-claims.test.mjs and packages/nana-pack/tests/test-runner.test.mjs. Exit 1, with this output:

```text
PASS  packages/nana-pack/tests/linked-launch.test.mjs              5 pass  1.1s
PASS  packages/nana-pack/tests/product-detail.test.mjs             4 pass  1.7s
PASS  packages/nana-pack/tests/product-overview.test.mjs           9 pass  3.8s
PASS  packages/nana-pack/tests/product-report.test.mjs             91 pass  61.4s
PASS  packages/nana-pack/tests/requirements-deliverables.test.mjs  21 pass  0.7s
PASS  packages/nana-pack/tests/requirements-moved.test.mjs         10 pass  0.5s
PASS  packages/nana-pack/tests/requirements-tree.test.mjs          98 pass  2.9s
FAIL  packages/nana-pack/tests/runtime-land.test.mjs               10 pass, 1 fail  19.0s  — exit 1
      | FAIL R-2740: a passing land writes the product report for HEAD under the git common directory after its suite record and runtime data, and names it in one land note TypeError: Cannot read properties of undefined (reading '0')
PASS  packages/nana-pack/tests/runtime-map.test.mjs                15 pass  12.7s
PASS  packages/nana-pack/tests/skill-claims.test.mjs               30 pass  0.1s
PASS  packages/nana-pack/tests/templates-render.test.mjs           172 pass  75.3s
PASS  packages/nana-pack/tests/test-runner.test.mjs                52 pass  30.5s

12 files: 11 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 517 pass, 1 fail, 0 skip · 210.4s
failed: packages/nana-pack/tests/runtime-land.test.mjs
```

This is the exact check title and failure output the canonical runner printed. runtime-land.test.mjs has no diff. No assertion outside the permitted list was changed, and no rerun or speculative fix followed this failure.

## Session 2: not done after the required stop

The verifier stopped at the focused run's exit 1. It did not start npm run test:locked, map:check, readme:check, requirements-trace, requirements-tree --check, requirements-tree --root ., known-bugs or seat-titles. There is no green full-suite summary or 0-missing seat result for this session. The map/tree regeneration above did print `deliverables: 21 of 21 made and read by code, 21 more parked`, but that does not substitute for the remaining final checks.

The real-page after-render, Product/Artifacts/FEAT-013 line counts and after-size measurement were not run. Session 1's preserved before-page file is 2,242,158 bytes; no before/after comparison is claimed. No rendered-view output is included because the required stop preceded that command.

No commit was made; the lane intentionally remains dirty with all session 1 work, the corrected clause, exact README/skill replacements, regenerated map/tree and this evidence. No clean post-commit status is claimed. Full focused and mutation logs remain outside the worktree; their summary and named failure are preserved here.

## Scope, known bugs and departures

Known-bug context touched: the absent parked mark; Product's repeated full claims; the Artifacts cards and flow lines waiting for lane two; flow lines omitting deliverable Read by paths and stage-order marks (the flow view retires, rather than gaining them); a flagged Reads line no longer draws flow but still excludes the entry from list one; the malformed empty-run card's presentation changes from Made in to Made by; Overview's parked count now leads to marked Product lines and their home claims. Maker links also close the must-meet's Overview stale/gap route gap. No unrelated known bug was fixed. No known-bug file was changed.

Precedent departures: only the seat-authorized correction of step 8f's overbroad absence clause. The fixture homes R-5100 on FEAT-052, so a whole-page absence would contradict R-2932. No additional import, copy or helper move departs from the named precedent. The old flow code was read from the base solely for a temporary mutation and was restored out of the lane.

No HANDOFF, session archive, template, setup, review tool or seat-tool change. The only retained checker change is readerKind in deliverables.mjs. No CI, push or install check was run, as briefed.

## Session 3: closure and final commands

Session 3 changes only ageFor's body in runtime-land.test.mjs. It finds the block whose heading starts with the row ID and a space among model.features[].detailSections[].blocks, reads artifactLines[0], and joins its segment texts before the unchanged age regular expression. A missing block or line gives an empty string. R-2740's title, assertions, pageModel and every other helper remain byte-identical. No requirement text or evidence changes in this session; R-2740 already specifies the unchanged land guarantee.

The initial `npm run map:impact -- packages/nana-pack/tests/runtime-land.test.mjs` exited 0. Before changing ageFor, `npm test -- packages/nana-pack/tests/runtime-land.test.mjs` exited 1 with the original R-2740 TypeError. After the authorized change, that command exited 0: 11 checks passed in 19.8s (file time 19.1s).

Hand red case 27 changed only the code's artifactLines index from 0 to 1. The same npm command exited 1: 10 pass, 1 fail, with `FAIL R-2740: a passing land writes the product report for HEAD under the git common directory after its suite record and runtime data, and names it in one land note AssertionError [ERR_ASSERTION]: report-measured-pass`. Index 0 was restored immediately. The subsequent focused and locked full runs both passed R-2740. No assertion was inverted; no mutation remains.

The final focused command used the same 12 explicit paths listed above, after restoring case 27. Exit 0:

```text
PASS  packages/nana-pack/tests/linked-launch.test.mjs              5 pass  1.1s
PASS  packages/nana-pack/tests/product-detail.test.mjs             4 pass  1.6s
PASS  packages/nana-pack/tests/product-overview.test.mjs           9 pass  4.2s
PASS  packages/nana-pack/tests/product-report.test.mjs             91 pass  62.4s
PASS  packages/nana-pack/tests/requirements-deliverables.test.mjs  21 pass  0.7s
PASS  packages/nana-pack/tests/requirements-moved.test.mjs         10 pass  0.5s
PASS  packages/nana-pack/tests/requirements-tree.test.mjs          98 pass  2.8s
PASS  packages/nana-pack/tests/runtime-land.test.mjs               11 pass  18.5s
PASS  packages/nana-pack/tests/runtime-map.test.mjs                15 pass  12.6s
PASS  packages/nana-pack/tests/skill-claims.test.mjs               30 pass  0.1s
PASS  packages/nana-pack/tests/templates-render.test.mjs           172 pass  74.5s
PASS  packages/nana-pack/tests/test-runner.test.mjs                52 pass  30.4s

12 files: 12 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 518 pass, 0 fail, 0 skip · 210.1s
```

`npm run test:locked` then ran the whole suite with its machine-wide lock, a heartbeat and failure watcher. Its full output stayed in the OS temporary directory, outside the worktree. Exit 0:

```text
226 files: 224 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8572 pass, 0 fail, 44 skip · 641.9s
suite record: baseline 3010a7ef age 0h coverage yes wall 626.9s -> 641.9s; slower: none
suite record: 224 PASS, 0 FAIL; failed: none; passed only without coverage: none; this lane: 1 full runs, 10.7 min
```

Final checks, each read independently before continuing:

| Command | Exit | Result |
|---|---|---|
| npm run map:check | 0 | 446 modules; 0 without a usable contract header; 0 problems |
| npm run readme:check | 0 | 775 claims; 0 problems |
| node scripts/requirements-trace.mjs | 0 | 2062 rows; 1820 implemented and traced; 0 rows off form |
| node scripts/requirements-tree.mjs --check | 0 | 2062 rows; 39 features; 0 problems |
| node scripts/requirements-tree.mjs --root . | 0 | deliverables: 21 of 21 made and read by code, 21 more parked |
| node scripts/known-bugs.mjs --root . | 0 | summary names=0 sizes=0 |
| node docs/reviews/page-detail-2026-10-25/seat-titles.mjs all | 0 | 0 missing (pre-commit; repeated on the resulting commit) |
| git diff --check | 0 | No whitespace errors |

No further existing assertion broke. There are no new helper moves, imports, copied helpers, label refinements, checker changes or Precedent departures in session 3. The sole additional existing-test edit is ageFor, authorized by build brief 3 because the deliverable artifact lines now live in feature detail blocks. The only earlier departure remains session 2's seat-authorized step 8f correction, explained above. All 26 earlier hand red cases remain preserved and restored; case 27 closes this session's mutation requirement.

## Session 3: real-page measurement

`node scripts/product-report.mjs --out <OS-temp>/page-detail-real.html` exited 0. The page was rendered once through renderHtmlAt at #product, #artifacts and #FEAT-013. A temporary validation driver exited 0 after checking all 42 Product deliverables have exactly one element child (their home link) and end with an age part; Artifacts has exactly h3, p, ul, h3, ul after its title, with every list item ending in its maker link; FEAT-013 has Deliverables, then Registered artifacts with 11 cards, then Requirements.

Content line counts use h3, p and li blocks, excluding the global header, commit paragraph, navigation and view title: Product 188; Artifacts 60; FEAT-013 1392. This matches the planner's content-block convention, rather than estimating display wrapping. Before size retained from session 1: 2,242,158 bytes. After: 2,245,173 bytes, 3,015 bytes larger. No size reduction is claimed. The after-page includes this lane's new requirement rows and the same clone's runtime and record-store data.

The generated view text follows in full, with trailing spaces omitted from empty label lines. It contains no absolute user-folder path. The commit records this long render output here, not in a second review-folder file. Suite and mutation logs remain outside the worktree as required. Session 3 does not run CI, install checks, model sessions or subagents, and does not push. The seat's review and land remain outside this builder brief.

## Generated real-page view text


## #product: 188 content lines (h3/p/li; global chrome excluded)

```text
deliverables: 21 of 21 made and read by code, 21 more parked
CAP-01 · Maintain direction and useful context
Purpose: Keep the agent aligned with the project and carry useful knowledge between work sessions.
Outcome: A developer can start or resume work with the relevant goal, decisions, history and knowledge available.
Kind: product
Deliverables:
R-001 · implemented · Home: FEAT-001 · Keep goals and priorities in view · read by prompt · output only
R-108 · implemented · Home: FEAT-002 · Resume decisions and next actions · read by prompt, code · age not measured
R-873 · implemented · Home: FEAT-002 · Resume decisions and next actions · read by prompt · output only
R-201 · implemented · Home: FEAT-003 · Index and connect existing knowledge sources · read by code · age not measured
R-217 · implemented · Home: FEAT-004 · Retrieve relevant context with provenance · read by prompt · output only
R-749 · implemented · Home: FEAT-005 · Communicate decisions clearly · not made by code · not read by code · read by rule · parked · artifact not written down
Features with no deliverable: none
Feature: FEAT-001 · Keep goals and priorities in view
Counts: implemented 50 · untested 0 · planned 0 · violated 0 · retired 0
Feature: FEAT-002 · Resume decisions and next actions
Counts: implemented 88 · untested 0 · planned 0 · violated 0 · retired 0
Feature: FEAT-003 · Index and connect existing knowledge sources
Counts: implemented 64 · untested 6 · planned 0 · violated 0 · retired 0
Feature: FEAT-004 · Retrieve relevant context with provenance
Counts: implemented 28 · untested 8 · planned 0 · violated 0 · retired 2
Feature: FEAT-005 · Communicate decisions clearly
Counts: implemented 21 · untested 0 · planned 0 · violated 0 · retired 0
CAP-02 · Deliver controlled changes
Purpose: Give builders, reviewers and the integration step separate responsibilities and concrete records.
Outcome: A developer can accept a bounded change with understandable review evidence and a controlled integration step.
Kind: product
Deliverables:
R-1400 · implemented · Home: FEAT-006 · Launch builders with execution limits · not made by code · read by code, prompt, rule · parked · age not measured
R-1008 · implemented · Home: FEAT-007 · Review a specific revision independently · read by code · age not measured
R-1560 · implemented · Home: FEAT-007 · Review a specific revision independently · not made by code · not read by code · read by person · parked · output only
R-977 · implemented · Home: FEAT-008 · Integrate and clean up reviewed changes · read by person, code · age not measured
R-2597 · implemented · Home: FEAT-006 · Launch builders with execution limits · read by code · 0 days
R-2811 · implemented · Home: FEAT-008 · Integrate and clean up reviewed changes · read by code · age not measured
Features with no deliverable: none
Feature: FEAT-006 · Launch builders with execution limits
Counts: implemented 98 · untested 5 · planned 0 · violated 0 · retired 2
Feature: FEAT-007 · Review a specific revision independently
Counts: implemented 143 · untested 21 · planned 0 · violated 0 · retired 4
Feature: FEAT-008 · Integrate and clean up reviewed changes
Counts: implemented 43 · untested 0 · planned 0 · violated 0 · retired 1
CAP-04 · Bring nana to each project and maintain it
Purpose: Install the toolkit, adopt projects, diagnose its environment and manage its lifecycle.
Outcome: A developer can adopt the same controlled workflow in a new or existing project and maintain or remove it without losing unrelated state.
Kind: product
Deliverables:
R-301 · implemented · Home: FEAT-013 · Install and connect harness runtimes · read by code · age not measured
R-327 · implemented · Home: FEAT-014 · Create or adopt a project workspace · not made by code · read by prompt, code · parked · age not measured
R-1150 · implemented · Home: FEAT-014 · Create or adopt a project workspace · read by code, rule · age not measured
R-341 · implemented · Home: FEAT-015 · Diagnose the active environment · read by code, person · age not measured
R-1070 · implemented · Home: FEAT-015 · Diagnose the active environment · read by code · 2 days
R-596 · implemented · Home: FEAT-019 · Release usable templates and report support · read by code, rule · age not measured
Features with no deliverable:
FEAT-016 · Start the local development desk: A-016 · desk launch agent, A-017 · desk log
FEAT-017 · Inspect durable state and follow restoration steps: A-018 · durable state archive
FEAT-018 · Update or remove managed components safely: A-019 · win32 copy record, A-020 · retired Claude artifact backups
Feature: FEAT-013 · Install and connect harness runtimes
Counts: implemented 205 · untested 3 · planned 0 · violated 0 · retired 10
Feature: FEAT-014 · Create or adopt a project workspace
Counts: implemented 119 · untested 6 · planned 0 · violated 0 · retired 3
Feature: FEAT-015 · Diagnose the active environment
Counts: implemented 176 · untested 0 · planned 0 · violated 0 · retired 2
Feature: FEAT-016 · Start the local development desk
Counts: implemented 15 · untested 9 · planned 0 · violated 0 · retired 0
Feature: FEAT-017 · Inspect durable state and follow restoration steps
Counts: implemented 9 · untested 0 · planned 0 · violated 0 · retired 0
Feature: FEAT-018 · Update or remove managed components safely
Counts: implemented 35 · untested 0 · planned 0 · violated 0 · retired 0
Feature: FEAT-019 · Release usable templates and report support
Counts: implemented 28 · untested 2 · planned 0 · violated 0 · retired 1
CAP-05 · Follow and steer development
Purpose: Let the developer understand ongoing and historical work and interact with the correct live session.
Outcome: A developer can see what agents are doing, inspect their changes and direct the intended session without losing context.
Kind: product
Deliverables:
R-406 · implemented · Home: FEAT-020 · Find and read previous sessions · not made by code · not read by code · read by person · parked · output only
R-422 · implemented · Home: FEAT-023 · Inspect changes and receive useful notices · not made by code · not read by code · read by person · parked · artifact not written down
R-159 · implemented · Home: FEAT-023 · Inspect changes and receive useful notices · read by prompt, person · age not measured
R-1194 · implemented · Home: FEAT-023 · Inspect changes and receive useful notices · read by prompt, person · output only
R-457 · implemented · Home: FEAT-024 · Edit session and project settings safely · not made by code · not read by code · read by person · parked · age not measured
Features with no deliverable:
FEAT-021 · Choose and start an agent session: A-024 · desk runtime matrix
FEAT-022 · Steer and recover live sessions: makes no registered artifact
Feature: FEAT-020 · Find and read previous sessions
Counts: implemented 11 · untested 6 · planned 0 · violated 0 · retired 0
Feature: FEAT-021 · Choose and start an agent session
Counts: implemented 8 · untested 6 · planned 0 · violated 0 · retired 0
Feature: FEAT-022 · Steer and recover live sessions
Counts: implemented 12 · untested 14 · planned 0 · violated 3 · retired 0
Feature: FEAT-023 · Inspect changes and receive useful notices
Counts: implemented 46 · untested 8 · planned 0 · violated 0 · retired 0
Feature: FEAT-024 · Edit session and project settings safely
Counts: implemented 7 · untested 2 · planned 0 · violated 0 · retired 0
CAP-06 · Use attributable tool outputs and focused apps
Purpose: Give tools a consistent presentation contract and connect apps without confusing their origin or authority.
Outcome: A developer can use focused app surfaces and inspect tool output whose producer and session history remain attributable.
Kind: product
Deliverables:
R-260 · implemented · Home: FEAT-025 · Use consistent structured tool output · not made by code · not read by code · read by person · parked · age not measured
R-256 · implemented · Home: FEAT-026 · Verify output provenance across session history · not made by code · not read by code · read by person · parked · age not measured
R-257 · untested · gap · Home: FEAT-026 · Verify output provenance across session history · not made by code · not read by code · read by person · parked · age not measured
R-437 · implemented · Home: FEAT-026 · Verify output provenance across session history · not made by code · read by code · parked · age not measured
R-264 · untested · gap · Home: FEAT-026 · Verify output provenance across session history · not made by code · not read by code · read by person · parked · output only
Features with no deliverable:
FEAT-027 · Connect and isolate focused app surfaces: A-029 · app session pointer
Feature: FEAT-025 · Use consistent structured tool output
Counts: implemented 10 · untested 15 · planned 0 · violated 0 · retired 2
Feature: FEAT-026 · Verify output provenance across session history
Counts: implemented 18 · untested 6 · planned 0 · violated 2 · retired 0
Feature: FEAT-027 · Connect and isolate focused app surfaces
Counts: implemented 12 · untested 11 · planned 0 · violated 0 · retired 0
CAP-07 · Keep code and promises checkable
Purpose: Make requirements, code structure, checks and engineering rules inspectable with explicit limits.
Outcome: A developer can see which promises a change affects and what evidence supports its behavior and engineering quality.
Kind: product
Deliverables:
R-291 · implemented · Home: FEAT-028 · Maintain requirement identity and trace links · not made by code · not read by code · read by person · parked · 0 days
R-1460 · implemented · Home: FEAT-028 · Maintain requirement identity and trace links · read by prompt, person · output only
R-1014 · implemented · Home: FEAT-039 · See the product and its decisions in one report · not read by code · read by person · parked · age not measured
R-1272 · implemented · Home: FEAT-029 · Navigate code and investigate impact · read by rule, code · 0 days
R-616 · implemented · Home: FEAT-031 · Run checks reliably and without contaminating work · read by code, person · age not measured
R-1239 · implemented · Home: FEAT-031 · Run checks reliably and without contaminating work · not made by code · not read by code · read by person · parked · 0 days
R-2547 · implemented · Home: FEAT-031 · Run checks reliably and without contaminating work · read by code · 0 days
R-2632 · implemented · Home: FEAT-031 · Run checks reliably and without contaminating work · read by code · age not measured
Features with no deliverable:
FEAT-030 · Get trustworthy feedback after edits: makes no registered artifact
FEAT-032 · Keep instructions and documentation accurate: A-036 · requirements skill
FEAT-033 · Adopt explicit engineering standards: A-037 · standards rule, A-038 · shared general rows, A-072 · code map
Feature: FEAT-028 · Maintain requirement identity and trace links
Counts: implemented 102 · untested 0 · planned 0 · violated 0 · retired 0
Feature: FEAT-029 · Navigate code and investigate impact
Counts: implemented 43 · untested 2 · planned 0 · violated 0 · retired 3
Feature: FEAT-030 · Get trustworthy feedback after edits
Counts: implemented 53 · untested 0 · planned 0 · violated 0 · retired 12
Feature: FEAT-031 · Run checks reliably and without contaminating work
Counts: implemented 124 · untested 8 · planned 0 · violated 0 · retired 0
Feature: FEAT-032 · Keep instructions and documentation accurate
Counts: implemented 25 · untested 2 · planned 0 · violated 0 · retired 0
Feature: FEAT-033 · Adopt explicit engineering standards
Counts: implemented 20 · untested 14 · planned 0 · violated 0 · retired 0
Feature: FEAT-039 · See the product and its decisions in one report
Counts: implemented 80 · untested 1 · planned 0 · violated 0 · retired 2
CAP-08 · Evaluate agent choices with credible evidence
Purpose: Run controlled studies and interpret results without confusing missing measurement with success.
Outcome: A developer can judge whether an agent, prompt or workflow change improves relevant outcomes at an understood cost.
Kind: product
Deliverables:
R-509 · implemented · Home: FEAT-034 · Define reproducible comparisons · not made by code · read by code · parked · 46 days
R-532 · implemented · Home: FEAT-034 · Define reproducible comparisons · not made by code · not read by code · read by person · parked · artifact not written down
R-507 · implemented · Home: FEAT-037 · Grade behavior with trustworthy checks · not made by code · read by code · parked · 46 days
R-535 · implemented · Home: FEAT-035 · Account for cost and uncertainty · not made by code · not read by code · read by person · parked · 46 days
R-536 · implemented · Home: FEAT-038 · Interpret workflow experiments and their limits · not made by code · not read by code · read by person · parked · 4 days
R-694 · implemented · Home: FEAT-038 · Interpret workflow experiments and their limits · not made by code · not read by code · read by person · parked · 4 days
Features with no deliverable:
FEAT-036 · Bound study execution and paid work: A-041 · probe ledger
Feature: FEAT-034 · Define reproducible comparisons
Counts: implemented 16 · untested 5 · planned 0 · violated 0 · retired 0
Feature: FEAT-035 · Account for cost and uncertainty
Counts: implemented 5 · untested 6 · planned 0 · violated 0 · retired 0
Feature: FEAT-036 · Bound study execution and paid work
Counts: implemented 13 · untested 8 · planned 0 · violated 0 · retired 0
Feature: FEAT-037 · Grade behavior with trustworthy checks
Counts: implemented 11 · untested 13 · planned 0 · violated 0 · retired 0
Feature: FEAT-038 · Interpret workflow experiments and their limits
Counts: implemented 13 · untested 6 · planned 1 · violated 0 · retired 0
CAP-03 · Control trust and tool actions
Purpose: Make trust decisions, action restrictions and policy changes visible and predictable.
Outcome: A developer can understand which sources and actions are allowed and can recover from a refusal without silently weakening controls.
Kind: constraint
Binds:
CAP-01 · Maintain direction and useful context · R-021, R-022, R-079, R-634, R-781, R-819, R-185
CAP-02 · Deliver controlled changes · gap
CAP-04 · Bring nana to each project and maintain it · R-193
CAP-05 · Follow and steer development · R-781
CAP-07 · Keep code and promises checkable · R-079, R-781, R-186
Artifacts of this constraint's features:
FEAT-009 · Decide which project content is trusted: A-010 · project trust store
FEAT-010 · Guard risky commands and protected resources: makes no registered artifact
FEAT-011 · Keep policy changes safe and recoverable: makes no registered artifact
FEAT-012 · Render paths and provenance clearly: makes no registered artifact
Feature: FEAT-009 · Decide which project content is trusted
Counts: implemented 33 · untested 2 · planned 0 · violated 0 · retired 0
Feature: FEAT-010 · Guard risky commands and protected resources
Counts: implemented 91 · untested 6 · planned 0 · violated 0 · retired 3
Feature: FEAT-011 · Keep policy changes safe and recoverable
Counts: implemented 47 · untested 0 · planned 0 · violated 0 · retired 0
Feature: FEAT-012 · Render paths and provenance clearly
Counts: implemented 21 · untested 1 · planned 0 · violated 0 · retired 0
```

Confirmed: all 42 Product deliverables have one line and an age part.

## #artifacts: 60 content lines (h3/p/li; global chrome excluded)

```text
Artifacts no other feature reads and no deliverable names
Its maker or a person may still read it.
A-017 · desk log · made in FEAT-016
A-018 · durable state archive · made in FEAT-017
A-019 · win32 copy record · made in FEAT-018
A-020 · retired Claude artifact backups · made in FEAT-018
A-029 · app session pointer · made in FEAT-027
A-041 · probe ledger · made in FEAT-036
A-056 · review audit log · made in FEAT-007
A-057 · lane copies of kept review texts · made in FEAT-007
A-059 · CI run records · made in FEAT-008
A-067 · project working region · made in FEAT-014
A-068 · project Claude import · made in FEAT-014
A-070 · not-a-project marker · made in FEAT-014
A-072 · code map · made in FEAT-033
A-073 · feature assessment store · made in FEAT-039
A-074 · fixture manifest · made in FEAT-034
A-075 · oracle keys · made in FEAT-037
A-076 · catch-ledger judge labels · made in FEAT-038
A-077 · catch-ledger judge matches · made in FEAT-038
A-078 · catch-ledger results · made in FEAT-038
A-081 · soul rule · made in FEAT-013
Read by code, made by no nana run
A-001 · user objective file · user-home store · manual: the owner writes the program objective by hand at objective.path, whose default is this location; nana-setup install, run by hand, seeds a missing copy · made in FEAT-001
A-003 · handoff frontier · tracked · manual: the seat edits it by hand in each lane's reviewed change · made in FEAT-002
A-005 · writing rule · tracked · manual: the owner's adopted rule, edited by hand in reviewed lanes · made in FEAT-005
A-010 · project trust store · user-home store · manual: the owner runs nana-setup trust or pi's /trust by hand; pi's own trust module writes the file · made in FEAT-009
A-011 · user pack config · user-home store · manual: the owner edits it by hand or in the desk's settings form, runs nana-roster set, or runs nana-setup install, which seeds a missing copy, all by hand · made in FEAT-013
A-012 · Claude hook links · user-home store · manual: the owner runs nana-setup install by hand · made in FEAT-013
A-013 · Claude rule links · user-home store · manual: the owner runs nana-setup install by hand · made in FEAT-013
A-014 · project objective seed · other project · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill, and the owner ratifies its DRAFT lines · made in FEAT-014
A-015 · rendered project ledger · other project · manual: an agent renders a project with copier through the scaffold or adopt skill, by hand · made in FEAT-014
A-016 · desk launch agent · user-home store · manual: the owner runs nana-setup install --desk by hand on macOS · made in FEAT-016
A-023 · pi session store · user-home store · manual: pi itself writes every session; nana adds entries only through the desk, frozen since 2026-10-10, where nana-stage.ts appends block entries and patched tool results in app sessions and apps/desk/server.mjs appends renames · made in FEAT-020
A-024 · desk runtime matrix · tracked · manual: desk frozen since 2026-10-10; edited by hand · made in FEAT-021
A-028 · stage keys · user-home store · manual: desk frozen since 2026-10-10; apps/desk/stage-keys.mjs writes it while the desk runs · made in FEAT-026
A-030 · requirements ledger · tracked · manual: builders and the seat edit it by hand, and run the lift's --write by hand · made in FEAT-028
A-036 · requirements skill · tracked · manual: edited by hand in reviewed lanes · made in FEAT-032
A-037 · standards rule · tracked · manual: edited by hand in reviewed lanes · made in FEAT-033
A-038 · shared general rows · tracked · manual: edited by hand in reviewed lanes · made in FEAT-033
A-039 · study schedule · tracked · manual: someone runs node apps/bench/run.mjs by hand, paid or as a free dry run · made in FEAT-034
A-042 · study results · tracked · manual: someone starts a paid study with node apps/bench/run.mjs by hand · made in FEAT-037
A-046 · project handoff seed · other project · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill · made in FEAT-014
A-047 · project session log seeds · other project · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill · made in FEAT-014
A-048 · local install-check records · tracked · manual: the seat runs the install check locally on macOS before a setup or hook lane's land and commits its output to the lane's review folder · made in FEAT-015
A-049 · rulings file · tracked · manual: the seat adds each ruling by hand in the reviewed change of the lane that records it · made in FEAT-001
A-050 · pi rulings link · user-home store · manual: the owner runs nana-setup install by hand, which links it, or copies it on Windows · made in FEAT-001
A-051 · known-bug files · tracked · manual: the seat writes each known bug by hand as one line in its feature's file · made in FEAT-002
A-058 · review standard · tracked · manual: edited by hand in reviewed lanes · made in FEAT-007
A-060 · Claude skill links · user-home store · manual: the owner runs nana-setup install by hand · made in FEAT-013
A-061 · Claude settings · user-home store · manual: the owner runs nana-setup install or uninstall by hand, which adds or removes only nana's hook entries; Claude Code and the owner write the rest · made in FEAT-013
A-062 · shared memory store · user-home store · manual: the owner runs nana-setup install by hand, which seeds a missing index; Claude Code sessions write the memory entries · made in FEAT-013
A-063 · PATH command links · user-home store · manual: the owner runs nana-setup install by hand, which links each nana command there, or writes sh and .cmd shims on Windows · made in FEAT-013
A-064 · pi settings · user-home store · manual: the owner runs nana-setup install by hand, which runs pi install for each nana package and pi writes the entries; the owner edits the rest by hand, and the desk's settings form did while it ran, frozen since 2026-10-10 · made in FEAT-013
A-065 · pi subagent config · user-home store · manual: the owner runs nana-setup install by hand, which seeds a missing copy and never rewrites it · made in FEAT-013
A-066 · pi agent definitions · user-home store · manual: the owner runs nana-setup install by hand, which seeds a missing reviewer.md; the owner edits agents by hand, and the desk's settings form did while it ran, frozen since 2026-10-10 · made in FEAT-013
A-069 · project pack config · other project · manual: someone seeds it by hand with nana-setup project, a copier template or the adopt-structure skill; the owner edits it by hand · made in FEAT-014
A-071 · pi MCP config · user-home store · manual: the owner edits it by hand; desk frozen since 2026-10-10, whose settings form rewrote its server list while it ran · made in FEAT-024
A-079 · builder preamble · tracked · manual: edited by hand in reviewed lanes · made in FEAT-006
A-080 · seat rule · tracked · manual: edited by hand in reviewed lanes · made in FEAT-006
```

Confirmed: two headings, one note, two lists; all items link their maker.

## #FEAT-013: 1392 content lines (h3/p/li; global chrome excluded)

```text
Purpose: Install and identify the intended runtime resources, hooks, skills, commands and configuration while preserving foreign content.
Capability: CAP-04 · Bring nana to each project and maintain it · product
Registers: A-011 · user pack config, A-012 · Claude hook links, A-013 · Claude rule links, A-060 · Claude skill links, A-061 · Claude settings, A-062 · shared memory store, A-063 · PATH command links, A-064 · pi settings, A-065 · pi subagent config, A-066 · pi agent definitions, A-081 · soul rule
Reads: A-004 · knowledge index · made in FEAT-003, A-005 · writing rule · made in FEAT-005, A-036 · requirements skill · made in FEAT-032, A-037 · standards rule · made in FEAT-033, A-049 · rulings file · made in FEAT-001, A-080 · seat rule · made in FEAT-006
out of date
What it does: The install command puts hooks, rules, skills, command-line tools and starter configs in place for Claude Code and pi. It merges into existing settings without duplicates and without overwriting the owner's own files.
Maturity: partial — many rows are pinned and none is violated. some untested rows include many file-safety rows. They also include many hook and package matching rows.
Gaps:
No test shows the installer stops before changing anything when the Claude Code settings file fails to parse. No test covers the stop when another run holds the lock.
No test shows a look-alike or hand-written hook command is handled correctly. A look-alike could make the installer skip the real hook.
No test runs an install with an explicit pi home and checks it writes nothing into the ambient agent folder. No test pins that pi's own install is skipped under a home override.
Risks:
One resolver picks the agent folder for gate policy, journal, objective, setup and the desk. Three other features list that resolver row. A change there shifts which gate policy loads.
Windows handling is the least covered area, with many rows untested. An audit found the Windows statements implicit, and some conflict.
Decisions:
Two rows promise the same requirements-skill link but carry different statuses. Retire the untested duplicate? Retire the untested row and point it at the pinned one. The audit rates this low. The duplicate only double-counts and blurs this feature's maturity.
The owner requires Windows testing now. Run Windows tests in the current priority.
Next step: Pin the settings-file parse stop and the held-lock stop with two tests, since both guard the owner's own Claude Code settings.
Written by: build round eleven, through the refresh guide, 2026-10-12 · checked by seat read, 2026-10-12; stamp taken from the refresh packet · 2026-10-12
Added rows: R-1093, R-1094, R-2716, R-2717, R-1111, R-1546, R-1850, R-1851, R-1852, R-2390, R-2391, R-2392, R-2393, R-2394, R-2397, R-2398, R-1054, R-1064, R-1128, R-2282, R-2200, R-2201, R-2498, R-1205, R-1206, R-1207, R-1940, R-1941, R-1942, R-1943, R-1944, R-2010, R-2011, R-2012, R-2013, R-2014, R-2015, R-2671, R-2672, R-2673, R-2674, R-1981, R-1984, R-2202, R-2205, R-1061, R-1033, R-1034, R-1035, R-1036, R-2020, R-2022, R-2023, R-2024, R-2025, R-2026, R-2027, R-2130, R-2131, R-2132, R-2133, R-2300, R-2301, R-2302, R-2303, R-1039, R-1690, R-1208, R-1880, R-1881, R-1882, R-1883, R-1884, R-1885, R-1886, R-1887, R-1888, R-1889, R-1982, R-1870, R-1871, R-1930, R-1931, R-1932, R-2080, R-2081, R-2082, R-2083, R-1590, R-2260, R-2261, R-2262, R-2263, R-1591, R-1592, R-1593, R-2290, R-2291, R-2704, R-1610, R-1611, R-1612, R-1613, R-1614, R-1615, R-2499, R-1616, R-1617, R-1618, R-1050, R-1051, R-1860, R-1861, R-1053, R-1058, R-1063, R-1330, R-1713, R-1340, R-1420, R-1421, R-1422, R-1423, R-1424, R-1425, R-1426, R-1900, R-1901, R-1902, R-1903, R-1904, R-2890, R-2891, R-2892, R-2893, R-2894, R-2895
Changed rows: R-825, R-827, R-951, R-932, R-985, R-739, R-301, R-665, R-589, R-317, R-922, R-318, R-923, R-319, R-927, R-384, R-304, R-381, R-382, R-358, R-391, R-315, R-383, R-320, R-924, R-322, R-926, R-349, R-995, R-936, R-387, R-351, R-938, R-388, R-939, R-359
Counts: implemented 205 · untested 3 · planned 0 · violated 0 · retired 10
Shared by: FEAT-001, FEAT-003, FEAT-009, FEAT-010, FEAT-011, FEAT-014, FEAT-015, FEAT-016, FEAT-018
Shared rows: R-004
Deliverables
R-301 · implemented
Made by: CI: .github/workflows/ci.yml, packages/nana-setup/bin/install-check.mjs · A-022
Made by: manual: the owner runs nana-setup install by hand; the symlinks carry edits to an existing hook or rule, but nothing links a new or renamed one · A-012, A-013
Read by: code: packages/nana-setup/claude/hooks/nana-adoption.mjs, packages/nana-setup/bin/stale-copies.mjs, packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/lib/hook-health.mjs
artifact A-022 · install-check job result · age not measured: CI record · made in FEAT-015
artifact A-012 · Claude hook links · age not measured: user-home store
artifact A-013 · Claude rule links · age not measured: user-home store
Registered artifacts
A-011 · user pack config
Class: user-home store: <pi agent dir>/nana-pack.json
Age: age not measured: user-home store
Made by: manual: the owner edits it by hand or in the desk's settings form, runs nana-roster set, or runs nana-setup install, which seeds a missing copy, all by hand
Read in: FEAT-001 · Keep goals and priorities in view · packages/nana-pack/lib/config.ts
Read in: FEAT-002 · Resume decisions and next actions · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-handoff.ts
Read in: FEAT-005 · Communicate decisions clearly · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-writing.ts
Read in: FEAT-006 · Launch builders with execution limits · packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/bin/pi-worker.mjs
Read in: FEAT-007 · Review a specific revision independently · packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/bin/claude-review.mjs
Read in: FEAT-010 · Guard risky commands and protected resources · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts
Read in: FEAT-011 · Keep policy changes safe and recoverable · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-gate.ts
Read in: FEAT-014 · Create or adopt a project workspace · packages/nana-pack/lib/adoption.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/project.mjs
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/doctor.mjs, packages/nana-pack/lib/adoption.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/install-check.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs
Read in: FEAT-023 · Inspect changes and receive useful notices · packages/nana-pack/lib/config.ts, packages/nana-pack/bin/nana-roster.mjs, packages/nana-pack/extensions/nana-notify.ts, packages/nana-pack/extensions/nana-roster-notice.ts, packages/nana-setup/claude/hooks/nana-roster-notice.mjs
Read in: FEAT-024 · Edit session and project settings safely · apps/desk/server.mjs
Read in: FEAT-030 · Get trustworthy feedback after edits · packages/nana-pack/lib/config.ts, packages/nana-pack/extensions/nana-post-edit.ts
Deliverable: R-1400 · names it
Deliverable: R-341 · built from it
Deliverable: R-1194 · built from it
Deliverable: R-457 · names it
A-012 · Claude hook links
Class: user-home store: ~/.claude/hooks/
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install by hand
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/hook-health.mjs, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/steps.mjs
Deliverable: R-301 · names it
Deliverable: R-341 · built from it
A-013 · Claude rule links
Class: user-home store: ~/.claude/rules/
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install by hand
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/fsops.mjs, packages/nana-setup/lib/steps.mjs
Deliverable: R-301 · names it
Deliverable: R-341 · built from it
A-060 · Claude skill links
Class: user-home store: ~/.claude/skills/
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install by hand
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/fsops.mjs, packages/nana-setup/lib/steps.mjs
Deliverable: none
A-061 · Claude settings
Class: user-home store: ~/.claude/settings.json
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install or uninstall by hand, which adds or removes only nana's hook entries; Claude Code and the owner write the rest
Read in: FEAT-006 · Launch builders with execution limits · packages/nana-pack/bin/pi-worker.mjs
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/bin/stale-copies.mjs, packages/nana-setup/lib/install-check.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs, packages/nana-setup/lib/steps.mjs
Deliverable: none
A-062 · shared memory store
Class: user-home store: ~/.claude/nana-memory/shared/
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install by hand, which seeds a missing index; Claude Code sessions write the memory entries
Read in: FEAT-003 · Index and connect existing knowledge sources · packages/nana-setup/claude/hooks/nana-shared-memory.mjs
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/doctor.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs
Deliverable: none
A-063 · PATH command links
Class: user-home store: ~/.local/bin/
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install by hand, which links each nana command there, or writes sh and .cmd shims on Windows
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/doctor.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs
Deliverable: none
A-064 · pi settings
Class: user-home store: <pi agent dir>/settings.json
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install by hand, which runs pi install for each nana package and pi writes the entries; the owner edits the rest by hand, and the desk's settings form did while it ran, frozen since 2026-10-10
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/doctor.mjs, packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/install-check.mjs
Read in: FEAT-024 · Edit session and project settings safely · apps/desk/server.mjs
Deliverable: none
A-065 · pi subagent config
Class: user-home store: <pi agent dir>/extensions/subagent/config.json
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install by hand, which seeds a missing copy and never rewrites it
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/doctor.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs
Deliverable: none
A-066 · pi agent definitions
Class: user-home store: <pi agent dir>/agents/
Age: age not measured: user-home store
Made by: manual: the owner runs nana-setup install by hand, which seeds a missing reviewer.md; the owner edits agents by hand, and the desk's settings form did while it ran, frozen since 2026-10-10
Read in: FEAT-015 · Diagnose the active environment · packages/nana-setup/lib/doctor.mjs
Read in: FEAT-018 · Update or remove managed components safely · packages/nana-setup/lib/uninstall.mjs
Deliverable: none
A-081 · soul rule
Class: tracked: packages/nana-setup/claude/rules/nana-soul.md
Age: last changed 417 commits and 3 days before HEAD by 158659d5: feat-007: add Claude Code review launcher
Made by: manual: edited by hand in reviewed lanes
Read in: none
Deliverable: none
Requirements
Each file's label is reported once, not per cited test — a run covering a file can hide a skipped check inside it. copies run from a temporary folder and children stopped by a signal are not counted.
R-190 implemented
Row type: own
PI_CODING_AGENT_DIR shall be resolved in exactly one module, matching pi's own resolution, expanding a leading tilde and resolving a relative value against the process cwd.
packages/nana-pack/tests/agent-dir-parity.test.mjs::PI_CODING_AGENT_DIR is resolved only by agent-dir.mjs, packages/nana-pack/tests/agent-dir-parity.test.mjs::[${name}] piAgentDir() is pi's resolution, packages/nana-pack/tests/objective-golden.test.mjs::T12 relative override: resolved against process.cwd() (pi's resolvePath)
PI_CODING_AGENT_DIR is resolved only by agent-dir.mjs — packages/nana-pack/tests/agent-dir-parity.test.mjs — File's last measured run: PASS
[${name}] piAgentDir() is pi's resolution — packages/nana-pack/tests/agent-dir-parity.test.mjs — File's last measured run: PASS
T12 relative override: resolved against process.cwd() (pi's resolvePath) — packages/nana-pack/tests/objective-golden.test.mjs — File's last measured run: PASS
R-191 implemented
Row type: own
The journal and objective defaults shall live in the active agent dir.
packages/nana-pack/tests/agent-dir-config.test.mjs::${T} journal default is in the active dir, packages/nana-pack/tests/agent-dir-parity.test.mjs::[${name}] nana-setup default objective is in the active dir
${T} journal default is in the active dir — packages/nana-pack/tests/agent-dir-config.test.mjs — File's last measured run: PASS
[${name}] nana-setup default objective is in the active dir — packages/nana-pack/tests/agent-dir-parity.test.mjs — File's last measured run: PASS
R-194 implemented
Row type: own
WHEN the active config is absent AND a stranded default config exists, exactly one UI note and one config_agent_dir_mismatch journal line shall name both paths per session.
packages/nana-pack/tests/agent-dir-config.test.mjs::${T} (c) mismatch UI note fires exactly once in the session, packages/nana-pack/tests/agent-dir-config.test.mjs::${T} (c) the note names both paths, packages/nana-pack/tests/agent-dir-config.test.mjs::${T} (c) exactly one config_agent_dir_mismatch journal line
${T} (c) mismatch UI note fires exactly once in the session — packages/nana-pack/tests/agent-dir-config.test.mjs — File's last measured run: PASS
${T} (c) the note names both paths — packages/nana-pack/tests/agent-dir-config.test.mjs — File's last measured run: PASS
${T} (c) exactly one config_agent_dir_mismatch journal line — packages/nana-pack/tests/agent-dir-config.test.mjs — File's last measured run: PASS
R-825 implemented
Row type: own
WHEN the active config is present, or no stranded default config exists, no mismatch note or journal line shall be emitted.
packages/nana-pack/tests/agent-dir-config.test.mjs::no mismatch note or journal line when the active config is present or no default config is stranded
no mismatch note or journal line when the active config is present or no default config is stranded — packages/nana-pack/tests/agent-dir-config.test.mjs — File's last measured run: PASS
R-199 implemented
Row type: own
nana-setup and the desk shall agree with the resolver on every derived path.
packages/nana-pack/tests/agent-dir-parity.test.mjs::[${name}] nana-setup piHome === piAgentDir()
[${name}] nana-setup piHome === piAgentDir() — packages/nana-pack/tests/agent-dir-parity.test.mjs — File's last measured run: PASS
R-827 implemented
Row type: own
--pi-home shall beat --home and the ambient PI_CODING_AGENT_DIR, with no stray write into the ambient agent dir.
packages/nana-pack/tests/agent-dir-parity.test.mjs::R-827: install with --pi-home, --home and an ambient PI_CODING_AGENT_DIR seeds the --pi-home dir only and writes nothing into the ambient dir
R-827: install with --pi-home, --home and an ambient PI_CODING_AGENT_DIR seeds the --pi-home dir only and writes nothing into the ambient dir — packages/nana-pack/tests/agent-dir-parity.test.mjs — File's last measured run: PASS
R-950 implemented
Row type: own
The root README shall carry one numbered macOS fresh-machine checklist whose steps name Node, the pinned pi install, this repository clone, nana-setup install, ~/.local/bin on PATH, pi-subagents, the machine objective and doctor, in that order.
packages/nana-setup/tests/fresh-machine.test.mjs::fresh-machine checklist has eight ordered actions, packages/nana-setup/tests/fresh-machine.test.mjs::checklist objective paths name the resolved pi seed files
fresh-machine checklist has eight ordered actions — packages/nana-setup/tests/fresh-machine.test.mjs — File's last measured run: PASS
checklist objective paths name the resolved pi seed files — packages/nana-setup/tests/fresh-machine.test.mjs — File's last measured run: PASS
R-951 implemented
Row type: own
Each version named by the macOS fresh-machine checklist shall equal its declared source floor or CI version.
packages/nana-setup/tests/fresh-machine.test.mjs::checklist versions match Node, pi CI and pi-subagents sources
checklist versions match Node, pi CI and pi-subagents sources — packages/nana-setup/tests/fresh-machine.test.mjs — File's last measured run: PASS
R-1093 implemented
Row type: own
Every npm i or npm install command for @earendil-works/pi-coding-agent in a README the readme check covers, and the missing-pi hint install and doctor print, shall carry an applicable root CI pair: a README command uses either PI_VERSION with an unquoted --before=<PI_BEFORE> or PI_FLOOR_VERSION with an unquoted --before=<PI_FLOOR_BEFORE>, while the hint uses PI_VERSION and PI_BEFORE.
packages/nana-setup/tests/pi-install-pin.test.mjs::every README pi install command carries CI's ceiling or floor version with that version's unquoted cutoff, packages/nana-setup/tests/pi-install-pin.test.mjs::the missing-pi hint carries CI's PI_VERSION and an unquoted PI_BEFORE, packages/nana-setup/tests/pi-install-pin.test.mjs::pi pin reads PI_VERSION and PI_BEFORE from the workflow env with LF or CRLF line ends, packages/nana-setup/tests/pi-install-pin.test.mjs::the missing-pi hint is built from the checkout's CI workflow by pi-pin, packages/nana-setup/tests/pi-install-pin.test.mjs::pin R-1093: the CI workflow path pi-pin reads, packages/nana-setup/tests/doctor-runtime.test.mjs::missing pi names the shared install hint, packages/nana-setup/tests/doctor-runtime.test.mjs::install missing-pi detail imports the same hint and never reaches install
every README pi install command carries CI's ceiling or floor version with that version's unquoted cutoff — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
the missing-pi hint carries CI's PI_VERSION and an unquoted PI_BEFORE — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
pi pin reads PI_VERSION and PI_BEFORE from the workflow env with LF or CRLF line ends — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
the missing-pi hint is built from the checkout's CI workflow by pi-pin — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
pin R-1093: the CI workflow path pi-pin reads — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
missing pi names the shared install hint — packages/nana-setup/tests/doctor-runtime.test.mjs — File's last measured run: PASS
install missing-pi detail imports the same hint and never reaches install — packages/nana-setup/tests/doctor-runtime.test.mjs — File's last measured run: PASS
R-1094 implemented
Row type: own
IF the root CI workflow cannot be read, or its PI_VERSION or PI_BEFORE value is missing or empty, or PI_BEFORE is not a valid UTC instant in the form YYYY-MM-DDTHH:MM:SSZ, THEN the missing-pi hint shall carry <version> and <cutoff> in their places, never an empty --before=.
packages/nana-setup/tests/pi-install-pin.test.mjs::the missing-pi hint is built from the checkout's CI workflow by pi-pin, packages/nana-setup/tests/pi-install-pin.test.mjs::an unreadable or incomplete workflow gives a placeholder hint, never an empty cutoff, packages/nana-setup/tests/pi-install-pin.test.mjs::a cutoff with a space, a shell metacharacter or a rollover date gives a placeholder hint
the missing-pi hint is built from the checkout's CI workflow by pi-pin — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
an unreadable or incomplete workflow gives a placeholder hint, never an empty cutoff — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
a cutoff with a space, a shell metacharacter or a rollover date gives a placeholder hint — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
R-2716 implemented
Row type: own
The root README shall state the supported pi range as supports pi <PI_FLOOR_VERSION> through <PI_VERSION>, both values read from the root CI workflow.
packages/nana-setup/tests/pi-install-pin.test.mjs::R-2716: the root README names CI's floor and ceiling as the supported pi range
R-2716: the root README names CI's floor and ceiling as the supported pi range — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
R-2717 implemented
Row type: own
packages/nana-setup/README.md shall carry exactly one pi install command at the root CI workflow's PI_FLOOR_VERSION with an unquoted --before=<PI_FLOOR_BEFORE> and the ceiling command's other flags.
packages/nana-setup/tests/pi-install-pin.test.mjs::R-2717: the setup README carries one floor pi install command at CI's floor version and cutoff
R-2717: the setup README carries one floor pi install command at CI's floor version and cutoff — packages/nana-setup/tests/pi-install-pin.test.mjs — File's last measured run: PASS
R-1111 implemented
Row type: own
The macOS fresh-machine checklist's doctor step shall record pi project trust for the clone with nana-setup trust ~/nana-pi before it runs doctor from the clone.
packages/nana-setup/tests/fresh-machine.test.mjs::fresh-machine step 8 trusts the clone before doctor
fresh-machine step 8 trusts the clone before doctor — packages/nana-setup/tests/fresh-machine.test.mjs — File's last measured run: PASS
R-1546 implemented
Row type: own
The macOS fresh-machine checklist's last step shall run cd ~/nana-pi, then the trust command, then nana-setup doctor as rehearsal commands, and expect all good.
packages/nana-setup/tests/fresh-machine.test.mjs::last step runs cd ~/nana-pi, trust and doctor as commands and expects all good
last step runs cd ~/nana-pi, trust and doctor as commands and expects all good — packages/nana-setup/tests/fresh-machine.test.mjs — File's last measured run: PASS
R-1850 implemented
Row type: own
The root README shall carry one numbered Windows fresh-machine checklist, written for Command Prompt, whose steps name Node at the declared Node floor with Git for Windows, the CI-pinned pi install, this repository's clone, nana-setup install, the install's bin folder on the user Path in a step with no rehearsal command, pi-subagents at doctor's floor, the machine objective files, and trust then doctor, in that order.
packages/nana-setup/tests/fresh-machine.test.mjs::Windows checklist has eight ordered actions for Command Prompt at the declared versions, with no command in the user Path step
Windows checklist has eight ordered actions for Command Prompt at the declared versions, with no command in the user Path step — packages/nana-setup/tests/fresh-machine.test.mjs — File's last measured run: PASS
R-1851 implemented
Row type: own
The Windows fresh-machine checklist's last step shall run cd /d "%USERPROFILE%\nana-pi", then nana-setup trust "%USERPROFILE%\nana-pi", then nana-setup doctor as rehearsal commands, and expect all good.
packages/nana-setup/tests/fresh-machine.test.mjs::Windows last step runs cd /d to the clone, trust and doctor as commands and expects all good
Windows last step runs cd /d to the clone, trust and doctor as commands and expects all good — packages/nana-setup/tests/fresh-machine.test.mjs — File's last measured run: PASS
R-1852 implemented
Row type: own
Every rehearsal command in the Windows fresh-machine checklist shall write each path under the user folder as a double-quoted path that starts with %USERPROFILE%.
packages/nana-setup/tests/fresh-machine.test.mjs::every Windows checklist command names user-folder paths only as double-quoted %USERPROFILE% paths, and at least three exist
every Windows checklist command names user-folder paths only as double-quoted %USERPROFILE% paths, and at least three exist — packages/nana-setup/tests/fresh-machine.test.mjs — File's last measured run: PASS
R-345 implemented
Row type: own
IF PI_CODING_AGENT_DIR is an ambient relative path, THEN install, project and project --check shall refuse non-zero naming the resolved dir, the cwd it resolved against and the remedy, writing nothing anywhere.
packages/nana-setup/tests/relative-agent-dir.test.mjs::${args.join(" ")}: names the resolved dir, packages/nana-setup/tests/relative-agent-dir.test.mjs::the refusal wrote no nana-pack.json anywhere, packages/nana-setup/tests/relative-agent-dir.test.mjs::the project refusal created nothing in the target, packages/nana-setup/tests/relative-agent-dir.test.mjs::${args.join(" ")}: ambient relative value exits non-zero, packages/nana-setup/tests/relative-agent-dir.test.mjs::${args.join(" ")}: says it is specific to the current working directory, packages/nana-setup/tests/relative-agent-dir.test.mjs::${args.join(" ")}: gives the remedy, packages/nana-setup/tests/relative-agent-dir.test.mjs::${args.join(" ")}: names the resolved dir and the cwd
${args.join(" ")}: names the resolved dir — packages/nana-setup/tests/relative-agent-dir.test.mjs — File's last measured run: PASS
the refusal wrote no nana-pack.json anywhere — packages/nana-setup/tests/relative-agent-dir.test.mjs — File's last measured run: PASS
the project refusal created nothing in the target — packages/nana-setup/tests/relative-agent-dir.test.mjs — File's last measured run: PASS
${args.join(" ")}: ambient relative value exits non-zero — packages/nana-setup/tests/relative-agent-dir.test.mjs — File's last measured run: PASS
${args.join(" ")}: says it is specific to the current working directory — packages/nana-setup/tests/relative-agent-dir.test.mjs — File's last measured run: PASS
${args.join(" ")}: gives the remedy — packages/nana-setup/tests/relative-agent-dir.test.mjs — File's last measured run: PASS
${args.join(" ")}: names the resolved dir and the cwd — packages/nana-setup/tests/relative-agent-dir.test.mjs — File's last measured run: PASS
R-932 implemented
Row type: own
An explicit --pi-home, relative or not, shall be used as given.
packages/nana-setup/tests/relative-agent-dir.test.mjs::R-932: install uses an explicit --pi-home as given, an absolute one as named and a relative one against the cwd, with no refusal under an ambient relative PI_CODING_AGENT_DIR
R-932: install uses an explicit --pi-home as given, an absolute one as named and a relative one against the cwd, with no refusal under an ambient relative PI_CODING_AGENT_DIR — packages/nana-setup/tests/relative-agent-dir.test.mjs — File's last measured run: PASS
R-2390 implemented
Row type: own
WHERE CLAUDE_CONFIG_DIR is an absolute path and neither --home nor --claude-home is given, install shall put settings.json, rules, skills, the shared-memory index and, off win32, its hook links under that folder and create no <home>/.claude.
packages/nana-setup/tests/claude-config-dir.test.mjs::install with an absolute CLAUDE_CONFIG_DIR writes the Claude files there and nothing under ~/.claude
install with an absolute CLAUDE_CONFIG_DIR writes the Claude files there and nothing under ~/.claude — packages/nana-setup/tests/claude-config-dir.test.mjs — File's last measured run: PASS
R-2391 implemented
Row type: own
WHERE CLAUDE_CONFIG_DIR is an absolute path and neither --home nor --claude-home is given, doctor shall read its rule and shared-memory index rows from that folder, so an empty folder reads ✗ there even when <home>/.claude is fully installed.
packages/nana-setup/tests/claude-config-dir.test.mjs::doctor checks the CLAUDE_CONFIG_DIR folder, not a fully installed ~/.claude
doctor checks the CLAUDE_CONFIG_DIR folder, not a fully installed ~/.claude — packages/nana-setup/tests/claude-config-dir.test.mjs — File's last measured run: PASS
R-2392 implemented
Row type: own
WHEN --claude-home or --home is given, install shall place the Claude Code files where that flag says and write nothing into the CLAUDE_CONFIG_DIR folder.
packages/nana-setup/tests/claude-config-dir.test.mjs::--claude-home and --home win over CLAUDE_CONFIG_DIR
--claude-home and --home win over CLAUDE_CONFIG_DIR — packages/nana-setup/tests/claude-config-dir.test.mjs — File's last measured run: PASS
R-2393 implemented
Row type: own
IF CLAUDE_CONFIG_DIR is a relative path and neither --home nor --claude-home is given, THEN install shall exit 2 with a message naming CLAUDE_CONFIG_DIR and write nothing.
packages/nana-setup/tests/claude-config-dir.test.mjs::a relative CLAUDE_CONFIG_DIR: install exits 2 naming the variable and writes nothing
a relative CLAUDE_CONFIG_DIR: install exits 2 naming the variable and writes nothing — packages/nana-setup/tests/claude-config-dir.test.mjs — File's last measured run: PASS
R-2394 implemented
Row type: own
WHERE CLAUDE_CONFIG_DIR sets the Claude Code folder, the install banner's claude home line shall name that folder and CLAUDE_CONFIG_DIR as its source.
packages/nana-setup/tests/claude-config-dir.test.mjs::the install banner names the CLAUDE_CONFIG_DIR folder and its source
the install banner names the CLAUDE_CONFIG_DIR folder and its source — packages/nana-setup/tests/claude-config-dir.test.mjs — File's last measured run: PASS
R-2397 implemented
Row type: own
WHEN CLAUDE_CONFIG_DIR is set but empty, install shall use <home>/.claude, as the shared-memory hook does.
packages/nana-setup/tests/claude-config-dir.test.mjs::an empty CLAUDE_CONFIG_DIR falls back to ~/.claude
an empty CLAUDE_CONFIG_DIR falls back to ~/.claude — packages/nana-setup/tests/claude-config-dir.test.mjs — File's last measured run: PASS
R-2398 implemented
Row type: own
IF CLAUDE_CONFIG_DIR is a relative path, neither --home nor --claude-home is given and doctor finds a ✗ row, THEN doctor's summary shall say that install will not run and name CLAUDE_CONFIG_DIR.
packages/nana-setup/tests/claude-config-dir.test.mjs::a relative CLAUDE_CONFIG_DIR: doctor's summary names it as install's refusal
a relative CLAUDE_CONFIG_DIR: doctor's summary names it as install's refusal — packages/nana-setup/tests/claude-config-dir.test.mjs — File's last measured run: PASS
R-985 implemented
Row type: own
The setup shall install and doctor-check the user-scope Node PreToolUse verifier hook on every platform.
packages/nana-setup/tests/verifier-pipe.test.mjs::installed hook asks on a verifier-pipe hit, packages/nana-setup/tests/verifier-pipe.test.mjs::doctor accepts the installed Node hook wiring, packages/nana-setup/tests/verifier-pipe.test.mjs::runtime matrix declares verifier-pipe surfaces for pi and Claude Code, packages/nana-setup/tests/verifier-pipe.test.mjs::both READMEs declare the user-scope live verifier-pipe change, packages/nana-setup/tests/verifier-pipe.test.mjs::pack README declares the Claude win32 verifier coverage, packages/nana-setup/tests/settings-merge.test.mjs::PreToolUse preserves the foreign hook and appends the Node verifier hook, packages/nana-pack/tests/templates-render.test.mjs::shared runtime matrix declares four runtime surfaces, ten capabilities, and the discovered source inventory
installed hook asks on a verifier-pipe hit — packages/nana-setup/tests/verifier-pipe.test.mjs — File's last measured run: PASS
doctor accepts the installed Node hook wiring — packages/nana-setup/tests/verifier-pipe.test.mjs — File's last measured run: PASS
runtime matrix declares verifier-pipe surfaces for pi and Claude Code — packages/nana-setup/tests/verifier-pipe.test.mjs — File's last measured run: PASS
both READMEs declare the user-scope live verifier-pipe change — packages/nana-setup/tests/verifier-pipe.test.mjs — File's last measured run: PASS
pack README declares the Claude win32 verifier coverage — packages/nana-setup/tests/verifier-pipe.test.mjs — File's last measured run: PASS
PreToolUse preserves the foreign hook and appends the Node verifier hook — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
shared runtime matrix declares four runtime surfaces, ten capabilities, and the discovered source inventory — packages/nana-pack/tests/templates-render.test.mjs — File's last measured run: PASS · changed since
R-1054 implemented
Row type: own
WHEN the verifier hook receives a PreToolUse event whose tool is PowerShell, it shall judge the command with the pipe guard's PowerShell dialect.
packages/nana-setup/tests/verifier-pipe.test.mjs::decideHook judges a PowerShell event with the PowerShell dialect (bash pipefail syntax stays inactive), packages/nana-setup/tests/verifier-pipe.test.mjs::decideHook keeps the Bash dialect for a Bash event (the same pipefail prefix is exempted there)
decideHook judges a PowerShell event with the PowerShell dialect (bash pipefail syntax stays inactive) — packages/nana-setup/tests/verifier-pipe.test.mjs — File's last measured run: PASS
decideHook keeps the Bash dialect for a Bash event (the same pipefail prefix is exempted there) — packages/nana-setup/tests/verifier-pipe.test.mjs — File's last measured run: PASS
R-1064 implemented
Row type: own
WHERE the platform is win32, the verifier entry spawned in exec form shall print exactly one JSON line whose permissionDecision is ask for a Bash or PowerShell event whose command the shared verifier-pipe predicate asks on, and print nothing for any other command.
Windows-leg-only; commands moved to && 2026-10-20; read green on CI run 39508818938 (job 118924414168, 31 pass) at e45d4656: packages/nana-setup/tests/hooks-win32-exec.test.mjs::verifier: Bash masked pipe gives exactly one ask line (hookEventName PreToolUse), packages/nana-setup/tests/hooks-win32-exec.test.mjs::verifier: PowerShell masked pipe gives exactly one ask line (hookEventName PreToolUse), Bash pipefail syntax stays inactive there, packages/nana-setup/tests/hooks-win32-exec.test.mjs::verifier: a non-matching command gives empty stdout
verifier: Bash masked pipe gives exactly one ask line (hookEventName PreToolUse) — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
verifier: PowerShell masked pipe gives exactly one ask line (hookEventName PreToolUse), Bash pipefail syntax stays inactive there — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
verifier: a non-matching command gives empty stdout — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
R-980 implemented
Row type: own
The installer and doctor shall link nana-land on PATH and report its installation state accurately for present and missing links.
packages/nana-setup/tests/install.test.mjs::land bin is linked, executable, and doctor reports accurate state
land bin is linked, executable, and doctor reports accurate state — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-964 implemented
Row type: own
nana-setup shall link pi-worker from the pack on PATH and include its correct-link result in doctor output, accepting an identical existing link.
packages/nana-setup/tests/install.test.mjs::pi-worker installed as PATH symlink, packages/nana-setup/tests/install.test.mjs::doctor reports the installed pi-worker link, packages/nana-setup/tests/install.test.mjs::doctor reports an incorrect pi-worker link, packages/nana-setup/tests/install.test.mjs::second install keeps the identical pi-worker link
pi-worker installed as PATH symlink — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
doctor reports the installed pi-worker link — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
doctor reports an incorrect pi-worker link — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
second install keeps the identical pi-worker link — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-736 untested
Row type: own
Every skill shall be a single SKILL.md whose frontmatter carries a name matching its directory and a description stating when to use it and what not to use it for.
—
Tests: none cited in this repository
R-739 retired
Row type: own
The requirements skill shall ship in the pack and be installed by nana-setup as ~/.claude/skills/requirements, a symlink to the same directory pi reads.
retired 2026-10-20: duplicate of R-302
Tests: none cited in this repository
R-301 implemented
Row type: own
WHERE the platform is not win32, the five Claude Code Node hooks and the four rules (nana-soul.md, nana-standards.md, nana-writing.md, nana-seat.md) shall be installed into ~/.claude/ as symlinks into their source copies.
packages/nana-setup/tests/install.test.mjs::hook ${h} is a symlink into the repo, packages/nana-setup/tests/install.test.mjs::rule nana-soul.md is a symlink into the repo, packages/nana-setup/tests/install.test.mjs::rule nana-standards.md is a symlink into the repo, packages/nana-setup/tests/install.test.mjs::rule nana-writing.md is a symlink into the repo (sourced from the pack, not nana-setup's own claude/rules), packages/nana-setup/tests/install.test.mjs::rule nana-seat.md is a symlink into the repo
hook ${h} is a symlink into the repo — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
rule nana-soul.md is a symlink into the repo — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
rule nana-standards.md is a symlink into the repo — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
rule nana-writing.md is a symlink into the repo (sourced from the pack, not nana-setup's own claude/rules) — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
rule nana-seat.md is a symlink into the repo — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-1128 implemented
Row type: own
nana-soul shall carry the shared working pattern's default-pattern and seat land review bullets byte for byte, as the Claude Code seat's copy.
packages/nana-pack/tests/templates-render.test.mjs::nana-soul carries the shared default-pattern and seat land review bullets
nana-soul carries the shared default-pattern and seat land review bullets — packages/nana-pack/tests/templates-render.test.mjs — File's last measured run: PASS · changed since
R-357 implemented
Row type: own
The nana-adoption.mjs SessionStart hook shall be installed into ~/.claude/hooks/ as a symlink into the repo's own copy.
packages/nana-setup/tests/install.test.mjs::adoption Node hook is installed as a repo symlink
adoption Node hook is installed as a repo symlink — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-302 implemented
Row type: own
The requirements skill shall be installed at ~/.claude/skills/requirements as a symlink to the pack skill directory pi already reads, so both runtimes get one source.
packages/nana-setup/tests/skills-and-standards.test.mjs::~/.claude/skills/requirements is a symlink to the PACK skill, packages/nana-setup/tests/skills-and-standards.test.mjs::pi reads the same file (the pack's skills dir is the pi skills root), packages/nana-setup/tests/install.test.mjs::skill requirements is a symlink to the pack skill
~/.claude/skills/requirements is a symlink to the PACK skill — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
pi reads the same file (the pack's skills dir is the pi skills root) — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
skill requirements is a symlink to the pack skill — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-303 untested
Row type: own
The shipped skill shall declare the requirements name with every trigger phrase its description must carry.
astra r1 2026-10-04 (EARS form batch B gap audit): no record pins "declare the requirements name"; 6b worklist.
Tests: none cited in this repository
R-306 implemented
Row type: own
nana-personal.md shall be copied from the example only when absent, never touched afterwards, and never live in the repo.
packages/nana-setup/tests/install.test.mjs::private rule is seeded from the example, packages/nana-setup/tests/install.test.mjs::existing nana-personal.md untouched, packages/nana-setup/tests/install.test.mjs::private rule is not in the repo
private rule is seeded from the example — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
existing nana-personal.md untouched — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
private rule is not in the repo — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-308 implemented
Row type: own
The shared auto-memory index shall be created when absent.
packages/nana-setup/tests/install.test.mjs::shared memory index seeded
shared memory index seeded — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-921 implemented
Row type: own
The per-project shared symlink shall have no installer step — the SessionStart hook creates it per project.
packages/nana-setup/tests/install.test.mjs::installer leaves per-project shared-link creation to the SessionStart hook
installer leaves per-project shared-link creation to the SessionStart hook — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-309 implemented
Row type: own
In the pi agent dir, nana-pack.json shall be seeded only when absent and nana-objective.md only when that config was seeded by this run or its objective.path resolves to that file, with the reason reported otherwise.
packages/nana-setup/tests/install.test.mjs::existing nana-pack.json untouched, packages/nana-setup/tests/install.test.mjs::objective seed: not created when nana-pack.json points elsewhere, packages/nana-setup/tests/install.test.mjs::objective seed: created when objective.path resolves to it, packages/nana-setup/tests/install.test.mjs::objective seed: created alongside a freshly seeded nana-pack.json, packages/nana-setup/tests/install.test.mjs::objective seed: the reason is reported
existing nana-pack.json untouched — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
objective seed: not created when nana-pack.json points elsewhere — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
objective seed: created when objective.path resolves to it — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
objective seed: created alongside a freshly seeded nana-pack.json — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
objective seed: the reason is reported — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-2282 implemented
Row type: own
IF the user-scope nana-pack.json gives objective.path a value that is neither a string nor null, THEN install shall run every step without throwing and seed the default objective file when it is absent.
packages/nana-setup/tests/objective-path-shapes.test.mjs::R-2282: install runs every step and seeds the default objective file when objective.path is 5, true or an object
R-2282: install runs every step and seeds the default objective file when objective.path is 5, true or an object — packages/nana-setup/tests/objective-path-shapes.test.mjs — File's last measured run: PASS
R-310 implemented
Row type: own
The knowledge index shall be built when absent under the home the installer chose, agreeing with the knowledge runtime's own default, and never under an ambient PI_CODING_AGENT_DIR.
packages/nana-setup/tests/agent-dir-consumers.test.mjs::MUST 2: installer knowledgeHome == the nana-knowledge runtime default under that override, packages/nana-setup/tests/agent-dir-consumers.test.mjs::MUST 2: with no override the two agree too, packages/nana-setup/tests/install.test.mjs::knowledge index built
MUST 2: installer knowledgeHome == the nana-knowledge runtime default under that override — packages/nana-setup/tests/agent-dir-consumers.test.mjs — File's last measured run: PASS
MUST 2: with no override the two agree too — packages/nana-setup/tests/agent-dir-consumers.test.mjs — File's last measured run: PASS
knowledge index built — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-311 implemented
Row type: own
pi-review shall be symlinked to ~/.local/bin/pi-review, be executable with a node shebang, and be declared as a bin by the pack.
packages/nana-setup/tests/install.test.mjs::pi-review on PATH, packages/nana-setup/tests/install.test.mjs::pi-review is executable with a node shebang, packages/nana-setup/tests/install.test.mjs::nana-pack package.json declares the pi-review bin
pi-review on PATH — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
pi-review is executable with a node shebang — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
nana-pack package.json declares the pi-review bin — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-687 implemented
Row type: own
The objective and adoption Node launchers shall emit producer stdout on success and their exact unavailable marker on producer failure, then exit 0.
packages/nana-setup/tests/hook-producers.test.mjs::objective failure marker is byte exact, packages/nana-setup/tests/hook-producers.test.mjs::adoption failure marker is byte exact, packages/nana-setup/tests/hook-producers.test.mjs::launcher configurations drive missing-CLI output with canonical markers, packages/nana-setup/tests/hook-producers.test.mjs::both launcher configurations fail open when fallback cwd resolution throws, packages/nana-setup/tests/hook-producers.test.mjs::successful producer output collapses trailing newlines to one, packages/nana-setup/tests/hook-producers.test.mjs::signal failure emits the exact marker, packages/nana-setup/tests/hook-producers.test.mjs::spawn failure emits its marker and does not throw
objective failure marker is byte exact — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
adoption failure marker is byte exact — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
launcher configurations drive missing-CLI output with canonical markers — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
both launcher configurations fail open when fallback cwd resolution throws — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
successful producer output collapses trailing newlines to one — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
signal failure emits the exact marker — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
spawn failure emits its marker and does not throw — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
R-688 implemented
Row type: own
Importing hook logic shall never read stdin.
packages/nana-setup/tests/hook-producers.test.mjs::importing verifier logic completes with open stdin and empty stderr
importing verifier logic completes with open stdin and empty stderr — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
R-665 implemented
Row type: own
WHERE the platform is not win32, WHEN installation processes a managed Claude skill, it shall link the canonical pack source, preserve and report foreign links for the four newly managed names, and accept links resolving to the canonical pack directory.
packages/nana-setup/tests/install.test.mjs::skill ${name} is a symlink to the pack skill, packages/nana-setup/tests/retired-artifacts.test.mjs::recognized Claude skill and empty flag move under dated backups, packages/nana-setup/tests/retired-artifacts.test.mjs::foreign newly managed skill link survives end-to-end install, packages/nana-setup/tests/retired-artifacts.test.mjs::newly managed skill canonical realpath link is accepted
skill ${name} is a symlink to the pack skill — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
recognized Claude skill and empty flag move under dated backups — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
foreign newly managed skill link survives end-to-end install — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
newly managed skill canonical realpath link is accepted — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
R-2200 implemented
Row type: own
WHERE the platform is not win32, WHEN install through the checkout's on-disk spelling finds managed skill links written through another spelling of that checkout, THEN it shall exit 0 with no problem row and rewrite every link to the on-disk spelling.
packages/nana-setup/tests/checkout-converge.test.mjs::R-2200: install converges same-checkout skill links to the on-disk spelling
R-2200: install converges same-checkout skill links to the on-disk spelling — packages/nana-setup/tests/checkout-converge.test.mjs — File's last measured run: PASS
R-2201 implemented
Row type: own
WHERE the platform is not win32, WHEN install finds the four newly managed skill links pointing to another checkout copy, THEN it shall exit 1, preserve every link text byte-for-byte and report each name as a foreign link.
packages/nana-setup/tests/checkout-converge.test.mjs::R-2201: install preserves skill links to another checkout copy as foreign
R-2201: install preserves skill links to another checkout copy as foreign — packages/nana-setup/tests/checkout-converge.test.mjs — File's last measured run: PASS
R-589 implemented
Row type: own
WHEN nana-setup install runs, it shall link ~/.local/bin/nana-setup to this checkout's packages/nana-setup/bin/nana-setup.mjs on POSIX and accept an identical existing link, and have doctor report healthy only when the link resolves to that file.
packages/nana-setup/tests/install.test.mjs::nana-setup installed as PATH symlink, packages/nana-setup/tests/install.test.mjs::doctor reports healthy nana-setup link, packages/nana-setup/tests/install.test.mjs::doctor rejects missing nana-setup link, packages/nana-setup/tests/install.test.mjs::doctor rejects wrong nana-setup target, packages/nana-setup/tests/install.test.mjs::second install keeps the identical nana-setup link
nana-setup installed as PATH symlink — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
doctor reports healthy nana-setup link — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
doctor rejects missing nana-setup link — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
doctor rejects wrong nana-setup target — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
second install keeps the identical nana-setup link — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-2498 implemented
Row type: own
WHERE the platform is not win32, nana-setup shall link nana-writing on PATH to this checkout's executable checker, accept an identical link, and mark a missing or misdirected link ✗ in doctor.
packages/nana-setup/tests/install.test.mjs::nana-writing is linked on PATH, runs by bare name, and doctor reads a missing or misdirected link ✗
nana-writing is linked on PATH, runs by bare name, and doctor reads a missing or misdirected link ✗ — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-360 implemented
Row type: own
In the pi agent dir, extensions/subagent/config.json shall be seeded from the nana-setup seed only when absent and never rewritten afterwards.
packages/nana-setup/tests/install.test.mjs::subagent config seeded when absent, packages/nana-setup/tests/install.test.mjs::existing subagent config.json byte-identical after install
subagent config seeded when absent — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
existing subagent config.json byte-identical after install — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-361 implemented
Row type: own
The subagent seed shall set exactly asyncByDefault true, forceTopLevelAsync true and maxSubagentDepth 1 and no other key.
packages/nana-setup/tests/doctor-detail.test.mjs::subagent seed: exactly the three keys and values
subagent seed: exactly the three keys and values — packages/nana-setup/tests/doctor-detail.test.mjs — File's last measured run: PASS
R-363 implemented
Row type: own
In the pi agent dir, agents/reviewer.md shall be seeded from the nana-setup seed only when absent.
packages/nana-setup/tests/install.test.mjs::reviewer agent seeded when absent (full byte match with the seed), packages/nana-setup/tests/install.test.mjs::existing reviewer.md untouched, packages/nana-setup/tests/install.test.mjs::reviewer agent: valid frontmatter independently parsed (byte 0 is ---, name/description/tools incl. bash)
reviewer agent seeded when absent (full byte match with the seed) — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
existing reviewer.md untouched — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
reviewer agent: valid frontmatter independently parsed (byte 0 is ---, name/description/tools incl. bash) — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-1205 implemented
Row type: own
WHEN the roster notice hook has loaded its modules, it shall print exactly one JSON object holding the roster notice as hookSpecificOutput.additionalContext, beside hookEventName SessionStart, whatever source its input holds, if any, and exit 0.
packages/nana-setup/tests/roster-notice-hook.test.mjs::roster notice hook: one JSON object with the notice as SessionStart context on every source and with no source, and exit 0
roster notice hook: one JSON object with the notice as SessionStart context on every source and with no source, and exit 0 — packages/nana-setup/tests/roster-notice-hook.test.mjs — File's last measured run: PASS
R-1206 implemented
Row type: own
WHEN the roster notice hook has loaded its modules, it shall also print the roster notice as systemMessage only when the input's source is startup, resume, clear or fork, or the hook can read no source from its input, an input read error included.
packages/nana-setup/tests/roster-notice-hook.test.mjs::roster notice hook: the notice is a user message for startup, resume, clear and fork, for a missing or unreadable source and for an input that fails on read, and not for compact, packages/nana-pack/tests/roster-notice.test.mjs::roster notice: sealed values — prefix, size labels, Claude Code mark, default mark, refusal head and cut, change pointer, relative-dir text, shown start sources and widget key
roster notice hook: the notice is a user message for startup, resume, clear and fork, for a missing or unreadable source and for an input that fails on read, and not for compact — packages/nana-setup/tests/roster-notice-hook.test.mjs — File's last measured run: PASS
roster notice: sealed values — prefix, size labels, Claude Code mark, default mark, refusal head and cut, change pointer, relative-dir text, shown start sources and widget key — packages/nana-pack/tests/roster-notice.test.mjs — File's last measured run: PASS
R-1207 implemented
Row type: own
IF the roster notice hook cannot load its modules, or throws other than while reading its input, THEN it shall print one JSON object whose systemMessage and hookSpecificOutput.additionalContext read nana active · roster notice unavailable (<error code or name>), holding no path, and exit 0.
packages/nana-setup/tests/roster-notice-hook.test.mjs::roster notice hook: a copy that cannot load its modules prints the unavailable notice in both fields with no path, and exits 0
roster notice hook: a copy that cannot load its modules prints the unavailable notice in both fields with no path, and exits 0 — packages/nana-setup/tests/roster-notice-hook.test.mjs — File's last measured run: PASS
R-1940 implemented
Row type: own
IF stdout raises an error, such as because its reader closed it, THEN the objective hook shall ignore the error and exit 0.
packages/nana-setup/tests/hooks-closed-output.test.mjs::objective hook ignores a closed stdout and exits 0
objective hook ignores a closed stdout and exits 0 — packages/nana-setup/tests/hooks-closed-output.test.mjs — File's last measured run: PASS
R-1941 implemented
Row type: own
IF stdout raises an error, such as because its reader closed it, THEN the adoption hook shall ignore the error and exit 0.
packages/nana-setup/tests/hooks-closed-output.test.mjs::adoption hook ignores a closed stdout and exits 0
adoption hook ignores a closed stdout and exits 0 — packages/nana-setup/tests/hooks-closed-output.test.mjs — File's last measured run: PASS
R-1942 implemented
Row type: own
IF stdout raises an error, such as because its reader closed it, THEN the shared-memory hook shall ignore the error and exit 0.
packages/nana-setup/tests/hooks-closed-output.test.mjs::shared-memory hook ignores a closed stdout and exits 0
shared-memory hook ignores a closed stdout and exits 0 — packages/nana-setup/tests/hooks-closed-output.test.mjs — File's last measured run: PASS
R-1943 implemented
Row type: own
IF stdout raises an error, such as because its reader closed it, THEN the roster-notice hook shall ignore the error and exit 0.
packages/nana-setup/tests/hooks-closed-output.test.mjs::roster-notice hook ignores a closed stdout and exits 0
roster-notice hook ignores a closed stdout and exits 0 — packages/nana-setup/tests/hooks-closed-output.test.mjs — File's last measured run: PASS
R-1944 implemented
Row type: own
IF stdout raises an error, such as because its reader closed it, THEN the verifier hook shall ignore the error and exit 0.
packages/nana-setup/tests/hooks-closed-output.test.mjs::verifier hook ignores a closed stdout and exits 0
verifier hook ignores a closed stdout and exits 0 — packages/nana-setup/tests/hooks-closed-output.test.mjs — File's last measured run: PASS
R-2010 implemented
Row type: own
IF the adoption producer has not exited when the producer time limit passes, THEN the adoption hook shall print the adoption unavailable marker in place of any text that producer wrote, then the stale-copy checker's output while time is left before the hook's deadline, and exit 0.
packages/nana-setup/tests/hook-deadlines.test.mjs::adoption hook prints its marker and the stale-copy output when the adoption producer hangs
adoption hook prints its marker and the stale-copy output when the adoption producer hangs — packages/nana-setup/tests/hook-deadlines.test.mjs — File's last measured run: PASS
R-2011 implemented
Row type: own
IF neither the adoption producer nor the stale-copy checker has exited when its producer time limit passes, THEN the adoption hook shall print the adoption unavailable marker and then the stale-copy unavailable marker, and exit 0 within the time limit the installer writes for that hook.
packages/nana-setup/tests/hook-deadlines.test.mjs::adoption hook prints both markers before its installed limit when both producers hang
adoption hook prints both markers before its installed limit when both producers hang — packages/nana-setup/tests/hook-deadlines.test.mjs — File's last measured run: PASS
R-2012 implemented
Row type: own
IF the objective producer has not exited when the producer time limit passes, THEN the objective hook shall print the objective unavailable marker in place of any text that producer wrote, and exit 0 within the time limit the installer writes for that hook.
packages/nana-setup/tests/hook-deadlines.test.mjs::objective hook prints its marker before its installed limit when its producer hangs
objective hook prints its marker before its installed limit when its producer hangs — packages/nana-setup/tests/hook-deadlines.test.mjs — File's last measured run: PASS
R-2013 retired
Row type: own
The hook producer launcher shall start each of the objective, adoption and stale-copy producers with a 1500 ms time limit.
superseded by R-2674, 2026-10-23
Tests: none cited in this repository
R-2014 implemented
Row type: own
WHEN the verifier hook writes a diagnostic to a stderr whose reader has closed it, the verifier hook shall exit 0.
packages/nana-setup/tests/hooks-closed-output.test.mjs::verifier hook ignores a closed stderr and exits 0
verifier hook ignores a closed stderr and exits 0 — packages/nana-setup/tests/hooks-closed-output.test.mjs — File's last measured run: PASS
R-2015 implemented
Row type: own
WHEN the knowledge pull hook writes its pointer block to a stdout whose reader has closed it, the knowledge pull hook shall exit 0 and write nothing to stderr.
packages/nana-setup/tests/hooks-closed-output.test.mjs::knowledge pull hook ignores a closed stdout and exits 0
knowledge pull hook ignores a closed stdout and exits 0 — packages/nana-setup/tests/hooks-closed-output.test.mjs — File's last measured run: PASS
R-2671 implemented
Row type: own
WHEN a session-start producer exits 0 with output before its producer cap and its hook's deadline, the objective and adoption hooks shall print that output in place of the producer's unavailable marker.
packages/nana-setup/tests/hook-deadlines.test.mjs::R-2671: the objective and adoption hooks print a producer's output when it takes 1.7 seconds, and the next producer's output after it, also when the hook starts 2.5 seconds late
R-2671: the objective and adoption hooks print a producer's output when it takes 1.7 seconds, and the next producer's output after it, also when the hook starts 2.5 seconds late — packages/nana-setup/tests/hook-deadlines.test.mjs — File's last measured run: PASS
R-2672 implemented
Row type: own
IF a session-start hook's first producer would start LATE_START_MS after the hook's process clock starts and neither of its producers exits, THEN the hook shall print both producers' unavailable markers and exit 0 before its installed limit.
packages/nana-setup/tests/hook-deadlines.test.mjs::R-2672: the objective and adoption hooks print both markers before their installed limit when they start 2.5 seconds late and both producers hang
R-2672: the objective and adoption hooks print both markers before their installed limit when they start 2.5 seconds late and both producers hang — packages/nana-setup/tests/hook-deadlines.test.mjs — File's last measured run: PASS
R-2673 implemented
Row type: own
IF no whole millisecond is left before the caller's deadline when the launcher would start a producer, THEN the launcher shall print that producer's unavailable marker without starting it.
packages/nana-setup/tests/hook-producers.test.mjs::R-2673: with no whole millisecond left before the deadline, the launcher prints the marker and starts no producer
R-2673: with no whole millisecond left before the deadline, the launcher prints the marker and starts no producer — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
R-2674 implemented
Row type: own
The hook producer launcher shall start each producer with a time limit of HOOK_PRODUCER_TIMEOUT_MS, or the whole milliseconds left before the caller's deadline when fewer.
packages/nana-setup/tests/hook-producers.test.mjs::R-2674: each producer's limit is the cap, or the whole milliseconds left before the deadline when fewer, and the cap when no deadline is given
R-2674: each producer's limit is the cap, or the whole milliseconds left before the deadline when fewer, and the cap when no deadline is given — packages/nana-setup/tests/hook-producers.test.mjs — File's last measured run: PASS
R-1981 implemented
Row type: own
WHEN install runs through a second spelling of the checkout's folder for a home that install set up through the folder's on-disk spelling, THEN install shall exit 0 with no problem row.
packages/nana-setup/tests/checkout-spelling.test.mjs::R-1981: install through a second spelling of the checkout exits 0 and refuses none of its own links
R-1981: install through a second spelling of the checkout exits 0 and refuses none of its own links — packages/nana-setup/tests/checkout-spelling.test.mjs — File's last measured run: PASS
R-1984 implemented
Row type: own
WHEN a home holds links, hook settings entries and pi package entries that an earlier install wrote through a second spelling of the checkout's folder, THEN doctor and install run through the on-disk spelling shall accept them as this checkout's, doctor giving the rows it gave before and install exiting 0 with no problem row.
packages/nana-setup/tests/checkout-spelling.test.mjs::R-1984: links, hook entries and pi entries written through another spelling of the checkout still read as this checkout's
R-1984: links, hook entries and pi entries written through another spelling of the checkout still read as this checkout's — packages/nana-setup/tests/checkout-spelling.test.mjs — File's last measured run: PASS
R-2202 implemented
Row type: own
WHERE the platform is not win32, WHEN install through the checkout's on-disk spelling finds its knowledge entry written through another spelling of the same checkout, THEN it shall rewrite that entry's command to exactly the on-disk spelling.
packages/nana-setup/tests/checkout-converge.test.mjs::R-2202: install converges the knowledge command to the on-disk spelling
R-2202: install converges the knowledge command to the on-disk spelling — packages/nana-setup/tests/checkout-converge.test.mjs — File's last measured run: PASS
R-2205 implemented
Row type: own
WHERE the platform is not win32, WHEN install through the checkout's on-disk spelling finds a knowledge entry that names the same file through another spelling of the checkout but has another key changed, THEN it shall leave that entry unchanged.
packages/nana-setup/tests/checkout-converge.test.mjs::R-2205: install leaves a customized respelled knowledge entry unchanged
R-2205: install leaves a customized respelled knowledge entry unchanged — packages/nana-setup/tests/checkout-converge.test.mjs — File's last measured run: PASS
R-316 implemented
Row type: own
Only missing hook entries shall be added: foreign hooks keep their position, nana entries append to the same group, matcher-scoped groups are left alone, and unrelated events and top-level keys are untouched.
packages/nana-setup/tests/settings-merge.test.mjs::foreign SessionStart hook still first, packages/nana-setup/tests/settings-merge.test.mjs::a matcher-scoped group is left alone, packages/nana-setup/tests/settings-merge.test.mjs::unrelated top-level keys untouched, packages/nana-setup/tests/settings-merge.test.mjs::nana SessionStart hooks appended to the same group, packages/nana-setup/tests/settings-merge.test.mjs::unrelated events untouched, packages/nana-setup/tests/settings-merge.test.mjs::empty settings: merging again adds nothing; win32 exception: an installer-shaped verifier under Bash moves (R-1881, R-1882)
foreign SessionStart hook still first — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
a matcher-scoped group is left alone — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
unrelated top-level keys untouched — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
nana SessionStart hooks appended to the same group — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
unrelated events untouched — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
empty settings: merging again adds nothing — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-317 implemented
Row type: own
A hook shall count as present only when the command actually executes that script — tokenized with shell-quoting rules, leading VAR=value dropped, argv[0] the interpreter, argv[1] a path ending in that script plus the expected argument.
packages/nana-setup/tests/settings-merge.test.mjs::R-317: a hook counts as present only when its command, read with shell quoting and leading VAR=value words dropped, runs the interpreter on a path ending in the script with the expected argument
R-317: a hook counts as present only when its command, read with shell quoting and leading VAR=value words dropped, runs the interpreter on a path ending in the script with the expected argument — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-922 implemented
Row type: own
A command carrying an unquoted operator, redirection or substitution, or one that cannot be parsed, shall read as not installed.
packages/nana-setup/tests/install.test.mjs::R-922: doctor and install read a nana hook command carrying an operator, a redirection, a substitution or broken quoting as not installed
R-922: doctor and install read a nana hook command carrying an operator, a redirection, a substitution or broken quoting as not installed — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-318 implemented
Row type: own
A look-alike command shall not suppress the real hook.
packages/nana-setup/tests/install.test.mjs::R-318: install beside two look-alike commands of nana hooks keeps both look-alikes and adds each real hook
R-318: install beside two look-alike commands of nana hooks keeps both look-alikes and adds each real hook — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-923 implemented
Row type: own
A hand-written variant of a nana hook that entryInvokes recognizes as invoking the script shall be kept as-is with no duplicate entry added.
Declared limitation: a node.exe interpreter name, a backslash-only script path, or some full interpreter paths read as not invoking the script (CHANGE.md §5 "Declared limits and residuals" — Hand-written exec-form variants on win32), so those spellings are not covered by this row and receive an additional entry. packages/nana-setup/tests/settings-merge.test.mjs::installerTarget rejects an extra args element, packages/nana-setup/tests/settings-merge.test.mjs::installerTarget rejects a relative path, packages/nana-setup/tests/settings-merge.test.mjs::installerTarget on win32 rejects a customized target outside the checkout's own tree, same basename, packages/nana-setup/tests/settings-merge.test.mjs::installerTarget on win32 rejects a customized knowledge target outside the checkout's own tree, same basename, packages/nana-setup/tests/settings-merge.test.mjs::forced win32: a hand-written exec-form variant is kept byte for byte, no twin, packages/nana-setup/tests/settings-merge.test.mjs::a look-alike command does not suppress the real hook, packages/nana-setup/tests/settings-merge.test.mjs::the look-alike is still there, untouched
installerTarget rejects an extra args element — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
installerTarget rejects a relative path — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
installerTarget on win32 rejects a customized target outside the checkout's own tree, same basename — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
installerTarget on win32 rejects a customized knowledge target outside the checkout's own tree, same basename — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
forced win32: a hand-written exec-form variant is kept byte for byte, no twin — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
a look-alike command does not suppress the real hook — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
the look-alike is still there, untouched — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-1061 implemented
Row type: own
WHERE the platform is not win32, install and doctor shall decide whether an entry invokes a nana hook from its command field alone, ignoring any args.
packages/nana-setup/tests/settings-merge.test.mjs::POSIX desiredHooks deep-equals today's fixture, packages/nana-setup/tests/settings-merge.test.mjs::desiredHooks with no platform deep-equals the same fixture, packages/nana-setup/tests/settings-merge.test.mjs::entryInvokes: POSIX reads a copied Windows exec fragment as not installed, packages/nana-setup/tests/settings-merge.test.mjs::entryInvokes: an entry carrying args with a shell-form command reads as commandInvokes reads its command (POSIX), packages/nana-setup/tests/settings-merge.test.mjs::installerTarget on POSIX rejects the two win32-only forms
POSIX desiredHooks deep-equals today's fixture — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
desiredHooks with no platform deep-equals the same fixture — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
entryInvokes: POSIX reads a copied Windows exec fragment as not installed — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
entryInvokes: an entry carrying args with a shell-form command reads as commandInvokes reads its command (POSIX) — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
installerTarget on POSIX rejects the two win32-only forms — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-319 implemented
Row type: own
WHERE the platform is not win32, paths the installer writes into hook commands shall be single-quoted with an embedded quote escaped, so a home or clone containing a space still runs.
packages/nana-setup/tests/settings-merge.test.mjs::Node hook commands single-quote the path, packages/nana-setup/tests/settings-merge.test.mjs::a quote inside a path is escaped, packages/nana-setup/tests/install.test.mjs::space in home: the shared-memory hook printed its index
Node hook commands single-quote the path — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
a quote inside a path is escaped — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
space in home: the shared-memory hook printed its index — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-323 implemented
Row type: own
pi install shall run only for package roots whose manifest extension directories remain uncovered by registered package entries.
packages/nana-setup/tests/pi-registration.test.mjs::registered by relative path is detected as present, packages/nana-setup/tests/pi-registration.test.mjs::install adds only the missing per-package entry, never a root entry
registered by relative path is detected as present — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
install adds only the missing per-package entry, never a root entry — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-927 implemented
Row type: own
WHEN this repo is already registered, the matching entry shall be reported.
packages/nana-setup/tests/pi-registration.test.mjs::R-927: when this repo is already registered, install and doctor both name the matching entry on the pi packages row
R-927: when this repo is already registered, install and doctor both name the matching entry on the pi packages row — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-324 untested
Row type: own
Registration identity shall expand ~, resolve relative paths against the pi home, and compare real paths.
—
Tests: none cited in this repository
R-384 implemented
Row type: own
An entry naming another checkout or a linked worktree of this repository shall count as a match by that same identity.
packages/nana-setup/tests/pi-registration.test.mjs::R-384: install from a linked worktree counts the main checkout's entries as registered, and install from this checkout counts the worktree's entries, adding none
R-384: install from a linked worktree counts the main checkout's entries as registered, and install from this checkout counts the worktree's entries, adding none — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-325 implemented
Row type: own
A remote entry shall count only when it is pi's own spelling of this exact repository, anchored on host, path and scheme, with an optional .git and pinned ref.
packages/nana-setup/tests/pi-registration.test.mjs::remote IS us: ${e}, packages/nana-setup/tests/pi-registration.test.mjs::remote is NOT us: ${e}, packages/nana-setup/tests/pi-registration.test.mjs::someone else's fork is not us
remote IS us: ${e} — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
remote is NOT us: ${e} — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
someone else's fork is not us — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-326 implemented
Row type: own
A non-string entry, an npm package, a prefix-named sibling, a different git repo, an unrelated package list and a missing pi settings.json shall not count as a match.
packages/nana-setup/tests/pi-registration.test.mjs::a non-string entry is not us, packages/nana-setup/tests/pi-registration.test.mjs::a sibling with a prefix name is not us, packages/nana-setup/tests/pi-registration.test.mjs::a missing pi settings.json is not a match, packages/nana-setup/tests/pi-registration.test.mjs::an npm package is not us, packages/nana-setup/tests/pi-registration.test.mjs::a different git repo is NOT a match, packages/nana-setup/tests/pi-registration.test.mjs::an unrelated package list is not a match
a non-string entry is not us — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
a sibling with a prefix name is not us — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
a missing pi settings.json is not a match — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
an npm package is not us — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
a different git repo is NOT a match — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
an unrelated package list is not a match — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-392 implemented
Row type: own
The installer and doctor shall consider pi package registration complete only when the union of extension directories loaded by registered entries covers every extension directory declared by the root manifest.
packages/nana-setup/tests/pi-registration.test.mjs::registered by relative path is detected as present, packages/nana-setup/tests/pi-registration.test.mjs::knowledge-only registration leaves nana-pack's manifest extension directory uncovered, packages/nana-setup/tests/pi-registration.test.mjs::diverging fixture root manifest extension directory remains uncovered
registered by relative path is detected as present — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
knowledge-only registration leaves nana-pack's manifest extension directory uncovered — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
diverging fixture root manifest extension directory remains uncovered — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-1033 implemented
Row type: own
WHERE the platform is win32, generic command lookup shall honor the full PATHEXT by PATH-folder order then extension order, while the installer and doctor locate pi as the first existing non-directory pi<ext> using only .com, .exe, .bat and .cmd case-insensitively and never searching the working directory.
packages/nana-pack/tests/win-command.test.mjs::PATH keys ignore case, quoted and empty entries skip, PATHEXT order applies within folder, packages/nana-pack/tests/win-command.test.mjs::earlier folder beats later extension, packages/nana-pack/tests/win-command.test.mjs::working directory is excluded unless requested, packages/nana-pack/tests/win-command.test.mjs::existing extension and unsupported PATHEXT entries, packages/nana-setup/tests/pi-registration.test.mjs::win32 missing pi is skipped with install hint
PATH keys ignore case, quoted and empty entries skip, PATHEXT order applies within folder — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
earlier folder beats later extension — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
working directory is excluded unless requested — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
existing extension and unsupported PATHEXT entries — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
win32 missing pi is skipped with install hint — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-1034 implemented
Row type: own
WHERE the platform is win32, WHEN the installer or doctor runs a located .cmd or .bat pi through ComSpec that R-1035 does not refuse, it shall pass /d /v:off /s /c and one quoted command line wrapping the pi path and every argument separately.
packages/nana-pack/tests/win-command.test.mjs::cmd launch quotes path and arguments exactly, packages/nana-setup/tests/pi-registration.test.mjs::win32 pi registration uses ComSpec and sets agent dir for install, packages/nana-setup/tests/doctor-runtime.test.mjs::win32 pi executable probe uses injected ComSpec launcher; reworded 2026-10-20 by the win-pi-launch-orphan lane to cover only launches that use ComSpec
cmd launch quotes path and arguments exactly — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
win32 pi registration uses ComSpec and sets agent dir for install — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
win32 pi executable probe uses injected ComSpec launcher — packages/nana-setup/tests/doctor-runtime.test.mjs — File's last measured run: PASS
R-1035 implemented
Row type: own
IF win32 would run a .cmd or .bat pi through ComSpec while its path or an argument contains a double quote, %, !, CR, LF or NUL, or an argument ends in backslash, THEN install and doctor shall refuse launch naming the character, with install PROBLEM and doctor FAIL on real home or NOTE under --home, without spawning pi.
packages/nana-pack/tests/win-command.test.mjs::cmd refusal names ${JSON.stringify(bad)}, packages/nana-pack/tests/win-command.test.mjs::cmd argument refusal names ${JSON.stringify(bad)}, packages/nana-pack/tests/win-command.test.mjs::cmd trailing backslash refused, packages/nana-setup/tests/pi-registration.test.mjs::win32 refused shim is a problem without spawn, packages/nana-setup/tests/doctor-runtime.test.mjs::win32 refused pi shim is fail on real home, packages/nana-setup/tests/doctor-runtime.test.mjs::win32 refused pi shim is note under home override; reworded 2026-10-20 by the win-pi-launch-orphan lane to scope refusal to the ComSpec route
cmd refusal names ${JSON.stringify(bad)} — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
cmd argument refusal names ${JSON.stringify(bad)} — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
cmd trailing backslash refused — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
win32 refused shim is a problem without spawn — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
win32 refused pi shim is fail on real home — packages/nana-setup/tests/doctor-runtime.test.mjs — File's last measured run: PASS
win32 refused pi shim is note under home override — packages/nana-setup/tests/doctor-runtime.test.mjs — File's last measured run: PASS
R-1036 implemented
Row type: own
IF pi is found but its version probe cannot start or exits nonzero, the installer shall report the pi packages step as a problem.
packages/nana-setup/tests/pi-registration.test.mjs::win32 found pi with failing version probe is a problem, packages/nana-setup/tests/pi-registration.test.mjs::win32 found pi with spawn error is a problem, packages/nana-setup/tests/pi-registration.test.mjs::darwin found pi with EACCES is a problem and fails install, packages/nana-setup/tests/pi-registration.test.mjs::darwin found pi with nonzero version probe is a problem
win32 found pi with failing version probe is a problem — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
win32 found pi with spawn error is a problem — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
darwin found pi with EACCES is a problem and fails install — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
darwin found pi with nonzero version probe is a problem — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-2020 implemented
Row type: own
IF pi does not answer pi --version within the pi version limit while an extension directory is unregistered on the real home, THEN install and install --dry-run shall each stop waiting at that limit, report the pi packages step ✗ naming pi --version and the limit in seconds, and exit 1.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2020: a pi that hangs on --version makes install and install --dry-run stop at the limit, report pi packages ✗ naming pi --version and the limit, and exit 1
R-2020: a pi that hangs on --version makes install and install --dry-run stop at the limit, report pi packages ✗ naming pi --version and the limit, and exit 1 — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2022 implemented
Row type: own
IF a pi install that install starts does not finish within the pi install limit, THEN install shall stop waiting at that limit, report the pi packages step ✗ naming pi install, the package folder and the limit in seconds, and exit 1.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1
R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1 — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2023 implemented
Row type: own
WHEN install, install --dry-run or doctor stops waiting for a pi launch at its limit, THEN it shall end every process that launch started.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report
R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2024 implemented
Row type: own
Install, install --dry-run and doctor shall give each pi --version a 30-second limit and each pi install a 120-second limit.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2024: with no limit injected, install, the dry run and doctor give pi --version 30 s and each pi install 120 s
R-2024: with no limit injected, install, the dry run and doctor give pi --version 30 s and each pi install 120 s — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2025 implemented
Row type: own
WHEN install starts pi install under its time limit, install shall pass pi the agent folder it chose as PI_CODING_AGENT_DIR.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2025: pi install started under the limit receives the agent folder install chose as PI_CODING_AGENT_DIR
R-2025: pi install started under the limit receives the agent folder install chose as PI_CODING_AGENT_DIR — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2026 implemented
Row type: own
WHERE the platform is not win32, IF install's process group receives SIGINT, SIGTERM or SIGHUP while install waits on a pi launch, THEN install shall end every process that launch started.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2026: SIGINT, SIGTERM and SIGHUP each sent to install's process group end the pi launch it waits on
R-2026: SIGINT, SIGTERM and SIGHUP each sent to install's process group end the pi launch it waits on — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2027 implemented
Row type: own
WHERE the platform is not win32, IF install's process group receives SIGINT while install waits on a pi launch, THEN install shall pass SIGINT to that launch's processes before it ends them.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2027: SIGINT lets pi install remove its lock before install ends its launch processes, packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2027: the relay gives a signalled pi launch 1000 ms to clean up before ending its process tree
R-2027: SIGINT lets pi install remove its lock before install ends its launch processes — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2027: the relay gives a signalled pi launch 1000 ms to clean up before ending its process tree — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2130 implemented
Row type: own
WHERE the platform is not win32, IF install's process group is killed with SIGKILL while install waits on a pi launch, THEN the pi launch relay shall end every process that launch started within the relay's parent-check interval plus its signal grace.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2130: a SIGKILL of install's whole process group ends the pi launch it waits on within the parent check and the signal grace
R-2130: a SIGKILL of install's whole process group ends the pi launch it waits on within the parent check and the signal grace — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2131 implemented
Row type: own
WHERE the platform is not win32, IF install alone is killed with SIGKILL while it waits on a pi launch, THEN the pi launch relay shall end every process that launch started within the relay's parent-check interval plus its signal grace.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2131: a SIGKILL of install alone ends the pi launch it waits on within the parent check and the signal grace
R-2131: a SIGKILL of install alone ends the pi launch it waits on within the parent check and the signal grace — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2132 implemented
Row type: own
WHEN a pi install that install starts exits after writing up to 1 MiB to each of stdout and stderr, install shall report that step from pi's exit status and the last line of pi's error output.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2132: a pi install that writes just under 1 MiB of control characters to each of stdout and stderr reads created on exit 0 and failed with its last error line on exit 1
R-2132: a pi install that writes just under 1 MiB of control characters to each of stdout and stderr reads created on exit 0 and failed with its last error line on exit 1 — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2133 implemented
Row type: own
WHERE the platform is not win32, IF install's process group receives SIGINT while install waits on a pi launch, THEN the pi launch relay shall wait its signal grace for that launch's processes to end before it kills them.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2133: SIGINT to install's process group, alone or with the relay signalled too, still lets a pi install that cleans up over two parent checks remove its lock before its processes end
R-2133: SIGINT to install's process group, alone or with the relay signalled too, still lets a pi install that cleans up over two parent checks remove its lock before its processes end — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2300 implemented
Row type: own
WHERE the platform is win32, IF install alone is killed while it waits on a pi launch that R-2301 describes, THEN every process that launch started shall end within the relay's parent-check interval plus its signal grace.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2300: on Windows, a kill of install alone ends the npm pi launch it waits on within the parent check and the signal grace; Windows-leg-only
R-2300: on Windows, a kill of install alone ends the npm pi launch it waits on within the parent check and the signal grace — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2301 implemented
Row type: own
WHERE the platform is win32, WHEN install, install --dry-run or doctor launches a located .cmd pi whose npm package resolves as R-1125 describes, it shall start that package's pi bin entry with the Node running it, the pi arguments unchanged and that launch's time limit and environment, without ComSpec.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2301: on win32, install, its dry run and doctor start an npm pi.cmd's package entry with the running Node, its limit, install's agent folder and a checkout path holding % and ! unchanged, never through ComSpec
R-2301: on win32, install, its dry run and doctor start an npm pi.cmd's package entry with the running Node, its limit, install's agent folder and a checkout path holding % and ! unchanged, never through ComSpec — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2302 implemented
Row type: own
WHERE the platform is win32, IF a located .cmd pi has no npm package that resolves as R-1125 describes, THEN install, install --dry-run and doctor shall launch that pi through ComSpec as R-1034 and R-1035 describe.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2302: on win32, a pi.cmd with no npm package beside it, another package there, or the package's entry missing still runs through ComSpec in install, its dry run and doctor
R-2302: on win32, a pi.cmd with no npm package beside it, another package there, or the package's entry missing still runs through ComSpec in install, its dry run and doctor — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2303 implemented
Row type: own
WHERE the platform is win32, IF the pi launch relay alone is killed while it runs a pi that R-2301 starts, THEN that pi and every process it started shall end within the relay's parent-check interval plus its signal grace.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2303: on Windows, a kill of the pi launch relay alone ends the npm pi it runs and pi's child within the parent check and the signal grace; Windows-leg-only
R-2303: on Windows, a kill of the pi launch relay alone ends the npm pi it runs and pi's child within the parent check and the signal grace — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-1039 implemented
Row type: own
WHERE the platform is win32 and a located pi ends in .exe or .com, the installer and doctor shall run it directly with an argument array and without an R-1035 refusal.
packages/nana-pack/tests/win-command.test.mjs::exe with metacharacters launches directly, packages/nana-setup/tests/pi-registration.test.mjs::win32 executable launches direct, packages/nana-setup/tests/doctor-runtime.test.mjs::win32 PI.EXE doctor probe invokes executable directly
exe with metacharacters launches directly — packages/nana-pack/tests/win-command.test.mjs — File's last measured run: PASS
win32 executable launches direct — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
win32 PI.EXE doctor probe invokes executable directly — packages/nana-setup/tests/doctor-runtime.test.mjs — File's last measured run: PASS
R-1690 implemented
Row type: own
WHERE the platform is win32, WHEN the installer registers pi packages for the real home while only the nana-knowledge package is registered in pi's settings and a .cmd pi with no npm package beside it is first on PATH, the installer shall run that pi through cmd.exe exactly twice: --version, then install of the nana-pack package directory.
packages/nana-setup/tests/pi-registration.test.mjs::win32 install runs a pi.cmd through cmd.exe to add only the missing per-package entry, never a root entry; reworded 2026-10-20 by the win-pi-launch-orphan lane to name the fallback fixture's missing npm package
win32 install runs a pi.cmd through cmd.exe to add only the missing per-package entry, never a root entry — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-679 implemented
Row type: own
Pi package coverage shall derive root-entry identity from the injected manifest root.
packages/nana-setup/tests/pi-registration.test.mjs::fixture manifest root checkout identity covers its extension directories
fixture manifest root checkout identity covers its extension directories — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-1208 implemented
Row type: own
The installer shall add the roster notice hook as one SessionStart entry with no matcher and the timeout of the other SessionStart entries.
packages/nana-setup/tests/settings-merge.test.mjs::POSIX desiredHooks deep-equals today's fixture
POSIX desiredHooks deep-equals today's fixture — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-1880 implemented
Row type: own
WHERE the platform is win32, WHEN install finds the four installer-written POSIX shell-form SessionStart hooks under the default Claude hooks folder, it shall replace each in place with this checkout's exec form.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: carried shell-form SessionStart entries become exec form in place
win32 install: carried shell-form SessionStart entries become exec form in place — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1881 implemented
Row type: own
WHERE the platform is win32, WHEN an installer-written POSIX shell-form verifier is under Bash, install shall leave exactly one exec-form verifier under WIN_VERIFIER_MATCHER, reusing an existing installer-shaped verifier there when present.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: a shell-form verifier under Bash ends as one exec-form verifier under WIN_VERIFIER_MATCHER, packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: a Bash verifier beside a WIN_VERIFIER_MATCHER verifier ends as one
win32 install: a shell-form verifier under Bash ends as one exec-form verifier under WIN_VERIFIER_MATCHER — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
win32 install: a Bash verifier beside a WIN_VERIFIER_MATCHER verifier ends as one — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1882 implemented
Row type: own
WHERE the platform is win32, WHEN install moves an installer-written POSIX shell-form verifier out of a Bash group, it shall preserve that group's matcher and every other entry byte-identically and in order.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: the Bash group keeps its matcher and other entries when the verifier moves
win32 install: the Bash group keeps its matcher and other entries when the verifier moves — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1883 implemented
Row type: own
WHERE the platform is win32, WHEN install runs a second time over a home repaired from POSIX hook settings, it shall report all six settings rows unchanged and change no settings bytes.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: a second install over the repaired home reports all six settings rows unchanged
win32 install: a second install over the repaired home reports all six settings rows unchanged — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1884 implemented
Row type: own
WHERE the platform is win32, WHEN doctor runs after one install over a home carrying the six installer-written POSIX hook settings, it shall mark all six settings rows healthy.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 doctor: all six settings rows read ✓ after one install over the carried home
win32 doctor: all six settings rows read ✓ after one install over the carried home — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1885 implemented
Row type: own
WHERE the platform is win32, WHEN install finds the first installer's exact unquoted knowledge hook form, it shall replace that entry in place with this checkout's exec form.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: the first installer's unquoted knowledge entry becomes exec form in place
win32 install: the first installer's unquoted knowledge entry becomes exec form in place — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1886 implemented
Row type: own
WHERE the platform is win32, WHEN install moves a POSIX verifier from Bash, it shall remove a Bash group that move empties and preserve an owner-provided Bash group that was already empty.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: preserves an owner-empty Bash group but drops the group its verifier move empties
win32 install: preserves an owner-empty Bash group but drops the group its verifier move empties — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1887 implemented
Row type: own
WHERE the platform is win32, WHEN all six exec-form entries are present beside a POSIX verifier under Bash, install shall write the move-only repair, leaving one verifier under WIN_VERIFIER_MATCHER and none under Bash.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: a move-only verifier repair is written
win32 install: a move-only verifier repair is written — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1888 implemented
Row type: own
WHERE the platform is win32, WHEN an owner verifier look-alike with its own timeout is under WIN_VERIFIER_MATCHER beside a POSIX verifier under Bash, install shall preserve the look-alike byte-identically and append nana's exec-form verifier.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: an owner verifier look-alike stays before nana's moved verifier with its extra key
win32 install: an owner verifier look-alike stays before nana's moved verifier with its extra key — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1889 implemented
Row type: own
WHERE the platform is win32, WHEN a moved POSIX verifier carries an extra owner key, install shall preserve that key and value on the exec-form verifier.
packages/nana-setup/tests/win32-hook-repair.test.mjs::win32 install: an owner verifier look-alike stays before nana's moved verifier with its extra key
win32 install: an owner verifier look-alike stays before nana's moved verifier with its extra key — packages/nana-setup/tests/win32-hook-repair.test.mjs — File's last measured run: PASS
R-1982 implemented
Row type: own
WHEN install runs through a second spelling of the checkout's folder for a home that install set up through the folder's on-disk spelling, THEN install shall leave every file and link under that home byte-identical.
packages/nana-setup/tests/checkout-spelling.test.mjs::R-1982: install through a second spelling of the checkout leaves the home byte-identical
R-1982: install through a second spelling of the checkout leaves the home byte-identical — packages/nana-setup/tests/checkout-spelling.test.mjs — File's last measured run: PASS
R-300 implemented
Row type: own
The installer shall report nothing to do, print no created or updated line, and leave the tree byte-identical on a second unchanged run.
packages/nana-setup/tests/install.test.mjs::second install reports nothing to do, packages/nana-setup/tests/install.test.mjs::second install left the tree byte-identical, packages/nana-setup/tests/install.test.mjs::second install reports no created/updated line
second install reports nothing to do — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
second install left the tree byte-identical — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
second install reports no created/updated line — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-304 retired
Row type: own
IF a regular directory occupies the skill path, THEN it shall be left untouched and reported ✗ with the fix.
superseded by R-1870, 2026-10-19
Tests: none cited in this repository
R-381 retired
Row type: own
IF a regular directory occupies the skill path, THEN install and --dry-run shall exit 1.
superseded by R-1871, 2026-10-19
Tests: none cited in this repository
R-382 retired
Row type: own
IF a regular directory occupies the skill path, THEN nothing shall be backed up inside the skills directory.
superseded by R-1870, 2026-10-19
Tests: none cited in this repository
R-1870 implemented
Row type: own
IF a directory that nana-setup did not make occupies the requirements skill path, THEN install shall leave that directory untouched, back up nothing in the skills directory and report ✗ with the move-or-remove fix.
packages/nana-setup/tests/skills-and-standards.test.mjs::R-1870: install leaves an owner's folder at the requirements skill path untouched, backs up nothing in the skills directory and reports ✗ with the move-or-remove fix
R-1870: install leaves an owner's folder at the requirements skill path untouched, backs up nothing in the skills directory and reports ✗ with the move-or-remove fix — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1871 implemented
Row type: own
IF a directory that nana-setup did not make occupies the requirements skill path, THEN install and install --dry-run shall exit 1.
packages/nana-setup/tests/skills-and-standards.test.mjs::R-1871: an owner's folder at the requirements skill path makes install and install --dry-run exit 1
R-1871: an owner's folder at the requirements skill path makes install and install --dry-run exit 1 — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-305 implemented
Row type: own
IF the skill symlink points elsewhere, THEN install shall relink it, leaving the previous target byte-identical.
packages/nana-setup/tests/skills-and-standards.test.mjs::stale link: install relinks it, packages/nana-setup/tests/skills-and-standards.test.mjs::posix dir link: the VICTIM tree is byte-identical — nothing was written through, packages/nana-setup/tests/skills-and-standards.test.mjs::stale link: the old target directory still exists
stale link: install relinks it — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
posix dir link: the VICTIM tree is byte-identical — nothing was written through — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
stale link: the old target directory still exists — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-307 implemented
Row type: own
The private rule shall be a regular file: IF it is a symlink THEN install reports ✗ with the fix and exits 1 (dry run too), the summary never claims everything is in place, nothing is written through the link, and doctor reads ✗ and exits 1.
packages/nana-setup/tests/install.test.mjs::private rule symlink: install EXITS 1 — automation must not read this as success, packages/nana-setup/tests/install.test.mjs::private rule symlink: nothing is written through the link, packages/nana-setup/tests/install.test.mjs::private rule symlink: doctor reads ✗ with the same message, packages/nana-setup/tests/install.test.mjs::private rule symlink: install reports ✗ with the fix, packages/nana-setup/tests/install.test.mjs::private rule symlink: the summary never says everything is in place, packages/nana-setup/tests/install.test.mjs::private rule symlink: doctor exits 1
private rule symlink: install EXITS 1 — automation must not read this as success — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
private rule symlink: nothing is written through the link — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
private rule symlink: doctor reads ✗ with the same message — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
private rule symlink: install reports ✗ with the fix — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
private rule symlink: the summary never says everything is in place — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
private rule symlink: doctor exits 1 — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-312 implemented
Row type: own
WHEN a regular file occupies a path where a symlink belongs, it shall be renamed to <name>.bak-<YYYYMMDD> first: exactly one backup, the old content kept, and the backup named in the output.
packages/nana-setup/tests/install.test.mjs::collision: exactly one backup written, packages/nana-setup/tests/install.test.mjs::collision: backup keeps the old content, packages/nana-setup/tests/install.test.mjs::collision: the backup is reported
collision: exactly one backup written — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
collision: backup keeps the old content — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
collision: the backup is reported — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-313 implemented
Row type: own
--dry-run shall report the same decisions and exit codes and create nothing.
packages/nana-setup/tests/install.test.mjs::dry run created nothing, packages/nana-setup/tests/install.test.mjs::dry run says would change, packages/nana-setup/tests/install.test.mjs::private rule symlink: --dry-run exits 1 too, packages/nana-setup/tests/install.test.mjs::objective seed: the dry run does not offer to create it, packages/nana-setup/tests/trust.test.mjs::trust dry run reports intended decision without writing
dry run created nothing — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
dry run says would change — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
private rule symlink: --dry-run exits 1 too — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
objective seed: the dry run does not offer to create it — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
trust dry run reports intended decision without writing — packages/nana-setup/tests/trust.test.mjs — File's last measured run: PASS
R-314 implemented
Row type: own
WHILE --home is in force, the installer shall never call pi install or launchctl.
packages/nana-setup/tests/desk-service.test.mjs::launchctl is NOT called under --home, packages/nana-setup/tests/agent-dir-consumers.test.mjs::MUST 3: launchctl was not called
launchctl is NOT called under --home — packages/nana-setup/tests/desk-service.test.mjs — File's last measured run: PASS
MUST 3: launchctl was not called — packages/nana-setup/tests/agent-dir-consumers.test.mjs — File's last measured run: PASS
R-358 implemented
Row type: own
WHILE --home is in force, pi install shall not be run.
packages/nana-setup/tests/pi-registration.test.mjs::R-358: under --home, install and install --dry-run start no pi install while a working pi is first on PATH
R-358: under --home, install and install --dry-run start no pi install while a working pi is first on PATH — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-391 implemented
Row type: own
WHILE --home is in force and an extension directory is unregistered, the pi packages step shall report skipped (--home override in play).
packages/nana-setup/tests/pi-registration.test.mjs::R-391: under --home with an unregistered extension directory, install and install --dry-run both report the pi packages step skipped (--home override in play)
R-391: under --home with an unregistered extension directory, install and install --dry-run both report the pi packages step skipped (--home override in play) — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-1930 implemented
Row type: own
IF an extension directory is unregistered, no home override is in force and pi is not on PATH, THEN install --dry-run shall report the pi packages step skipped with the pi install hint that install reports.
packages/nana-setup/tests/pi-registration.test.mjs::R-1930: with pi not on PATH, the dry-run pi packages step reports skipped with the pi install hint, as install does, on darwin and win32
R-1930: with pi not on PATH, the dry-run pi packages step reports skipped with the pi install hint, as install does, on darwin and win32 — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-1931 implemented
Row type: own
IF install would report the pi packages step ✗ before it starts any pi install, THEN install --dry-run shall report the same ✗ and exit 1.
packages/nana-setup/tests/pi-registration.test.mjs::R-1931: when install would report the pi packages step ✗ before any pi install, the dry run reports the same ✗ and exits 1
R-1931: when install would report the pi packages step ✗ before any pi install, the dry run reports the same ✗ and exits 1 — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-1932 implemented
Row type: own
WHEN pi on PATH answers its version check and an extension directory is unregistered, install --dry-run shall start no pi install.
packages/nana-setup/tests/pi-registration.test.mjs::R-1932: with a working pi on PATH and an unregistered extension directory, the dry-run pi packages step reports would add and starts no pi install
R-1932: with a working pi on PATH and an unregistered extension directory, the dry-run pi packages step reports would add and starts no pi install — packages/nana-setup/tests/pi-registration.test.mjs — File's last measured run: PASS
R-315 implemented
Row type: own
The installer shall never prompt.
packages/nana-setup/tests/install.test.mjs::R-315: install without --yes, with no terminal and a no answer waiting on stdin, finishes and seeds the home without asking anything
R-315: install without --yes, with no terminal and a no answer waiting on stdin, finishes and seeds the home without asking anything — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-383 implemented
Row type: own
Install and project shall accept --yes and do nothing with it.
packages/nana-setup/tests/install.test.mjs::R-383: install, install --dry-run and project give the same exit, output and home tree with --yes as without it
R-383: install, install --dry-run and project give the same exit, output and home tree with --yes as without it — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-320 implemented
Row type: own
Preflight shall parse and shape-validate settings.json.
packages/nana-setup/tests/settings-merge.test.mjs::R-320: preflight refuses a settings.json that does not parse or breaks any rung of the hooks shape, and accepts a blank file, no hooks key and a foreign group without hooks
R-320: preflight refuses a settings.json that does not parse or breaks any rung of the hooks shape, and accepts a blank file, no hooks key and a foreign group without hooks — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-924 implemented
Row type: own
IF either parse or shape-validation of settings.json by preflight fails THEN the run shall abort naming the file before anything on disk moves — no hooks, no seeds, no PATH entry.
packages/nana-setup/tests/settings-merge.test.mjs::R-924: install over a settings.json that does not parse, or parses to a shape it will not edit, exits 2 naming the file with everything under the home unchanged
R-924: install over a settings.json that does not parse, or parses to a shape it will not edit, exits 2 naming the file with everything under the home unchanged — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-321 implemented
Row type: own
The write shall run under an exclusive lock across read, validate, write-temp, re-compare and rename, preserving mode and the trailing newline, leaving no temp file, releasing the lock even on a throw; IF the file changed after the temp write THEN the write aborts leaving the other writer's bytes intact.
packages/nana-setup/tests/settings-merge.test.mjs::file mode is preserved across the atomic write, packages/nana-setup/tests/settings-merge.test.mjs::lock: released when the body throws, packages/nana-setup/tests/settings-merge.test.mjs::post-write: the external writer's bytes are intact, packages/nana-setup/tests/install.test.mjs::settings.json ends with a newline, packages/nana-setup/tests/settings-merge.test.mjs::lock: a second acquisition is refused, packages/nana-setup/tests/settings-merge.test.mjs::post-write: the temp file was fully written before the compare, packages/nana-setup/tests/settings-merge.test.mjs::post-write: the write aborts, packages/nana-setup/tests/settings-merge.test.mjs::post-write: the temp file was removed
file mode is preserved across the atomic write — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
lock: released when the body throws — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
post-write: the external writer's bytes are intact — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
settings.json ends with a newline — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
lock: a second acquisition is refused — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
post-write: the temp file was fully written before the compare — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
post-write: the write aborts — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
post-write: the temp file was removed — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-322 retired
Row type: own
IF a lock file already exists, THEN the run shall abort printing the lock path, recorded pid, age and the exact rm command.
superseded by R-2080, 2026-10-20
Tests: none cited in this repository
R-2080 implemented
Row type: own
IF the settings lock is held, THEN install shall abort printing the lock path, recorded pid, age and each platform removal command alone on its line under its shell.
packages/nana-setup/tests/settings-merge.test.mjs::R-2080: a held settings lock stops install printing the lock path, the recorded pid, its age and each removal command alone on its line under its shell
R-2080: a held settings lock stops install printing the lock path, the recorded pid, its age and each removal command alone on its line under its shell — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-2081 implemented
Row type: own
WHERE the platform is macOS or Linux, WHEN the rm line install prints for a held settings lock is run by /bin/sh, THEN it shall remove the lock under an awkward home path and change no other file.
packages/nana-setup/tests/settings-lock.test.mjs::R-2081: on macOS and Linux, the rm line install prints for a held lock, run by /bin/sh, removes the lock under an awkward home path and changes no other file
R-2081: on macOS and Linux, the rm line install prints for a held lock, run by /bin/sh, removes the lock under an awkward home path and changes no other file — packages/nana-setup/tests/settings-lock.test.mjs — File's last measured run: PASS
R-2082 implemented
Row type: own
WHERE the platform is win32, WHEN the Command Prompt line install prints for a held settings lock is run by cmd.exe, THEN it shall remove the lock under an awkward home path and change no other file.
packages/nana-setup/tests/settings-lock.test.mjs::R-2082: on Windows, the Command Prompt line install prints for a held lock, run by cmd.exe, removes the lock under an awkward home path and changes no other file; Windows-leg-only; read green on CI run 39388721628
R-2082: on Windows, the Command Prompt line install prints for a held lock, run by cmd.exe, removes the lock under an awkward home path and changes no other file — packages/nana-setup/tests/settings-lock.test.mjs — File's last measured run: PASS
R-2083 implemented
Row type: own
WHERE the platform is win32, WHEN the PowerShell line install prints for a held settings lock is run by Windows PowerShell, THEN it shall remove the lock under an awkward home path and change no other file.
packages/nana-setup/tests/settings-lock.test.mjs::R-2083: on Windows, the PowerShell line install prints for a held lock, run by Windows PowerShell, removes the lock under an awkward home path and changes no other file; Windows-leg-only; read green on CI run 39388721628
R-2083: on Windows, the PowerShell line install prints for a held lock, run by Windows PowerShell, removes the lock under an awkward home path and changes no other file — packages/nana-setup/tests/settings-lock.test.mjs — File's last measured run: PASS
R-925 implemented
Row type: own
The run shall never unlink a lock it did not create.
packages/nana-setup/tests/settings-merge.test.mjs::lock: the other run's lock is left exactly as it was, packages/nana-setup/tests/settings-merge.test.mjs::lock: it was not unlinked, packages/nana-setup/tests/settings-merge.test.mjs::lock: a replacement lock is left alone
lock: the other run's lock is left exactly as it was — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
lock: it was not unlinked — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
lock: a replacement lock is left alone — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-926 implemented
Row type: own
IF a lock file already exists, THEN --dry-run shall not be blocked by it.
packages/nana-setup/tests/settings-merge.test.mjs::lock: --dry-run is not blocked by a lock
lock: --dry-run is not blocked by a lock — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-1590 implemented
Row type: own
IF the settings lock file already exists when install starts, THEN install shall exit 2 without creating, moving, linking, copying or removing anything under the home it was given.
packages/nana-setup/tests/settings-merge.test.mjs::lock: a held lock stops install before its first write
lock: a held lock stops install before its first write — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
R-2260 implemented
Row type: own
WHEN a second install starts while a first install is writing its PATH entries, THEN the second install shall exit 2 naming the settings lock another nana-setup run holds.
packages/nana-setup/tests/install-overlap.test.mjs::R-2260: a second install started at the first install's PATH step exits 2 naming the held settings lock
R-2260: a second install started at the first install's PATH step exits 2 naming the held settings lock — packages/nana-setup/tests/install-overlap.test.mjs — File's last measured run: PASS
R-2261 implemented
Row type: own
WHEN a second install starts while a first install is writing its PATH entries, THEN the first install shall finish without a throw, with no PROBLEM row and all five PATH rows created.
packages/nana-setup/tests/install-overlap.test.mjs::R-2261: the first install finishes with no problem row and all five PATH rows created when a second install starts at its PATH step
R-2261: the first install finishes with no problem row and all five PATH rows created when a second install starts at its PATH step — packages/nana-setup/tests/install-overlap.test.mjs — File's last measured run: PASS
R-2262 implemented
Row type: own
WHILE install checks or writes the shared memory index, the pi config, objective or rulings file, the subagent config, the reviewer agent or a PATH entry, install shall hold its settings lock, taken once per run.
packages/nana-setup/tests/install-overlap.test.mjs::R-2262: the settings lock, taken once, is present at every look of a shared memory, pi config, subagent, reviewer or PATH target
R-2262: the settings lock, taken once, is present at every look of a shared memory, pi config, subagent, reviewer or PATH target — packages/nana-setup/tests/install-overlap.test.mjs — File's last measured run: PASS
R-2263 implemented
Row type: own
WHILE install builds the knowledge index, install shall not hold the settings lock.
packages/nana-setup/tests/install-overlap.test.mjs::R-2263: the settings lock is gone when install starts the knowledge build
R-2263: the settings lock is gone when install starts the knowledge build — packages/nana-setup/tests/install-overlap.test.mjs — File's last measured run: PASS
R-1591 implemented
Row type: own
WHEN install runs again over the Claude skill links it made, it shall print no retired row for those skills.
packages/nana-setup/tests/install.test.mjs::second install prints no retired row for a skill it linked
second install prints no retired row for a skill it linked — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-1592 implemented
Row type: own
WHEN install runs again over a home it set up with nothing changed since, it shall report no more skipped rows than the run that set it up.
packages/nana-setup/tests/install.test.mjs::second install reports no more skipped rows than the first
second install reports no more skipped rows than the first — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-1593 implemented
Row type: own
IF a symbolic link sits at a retired Claude skill name that install does not link, THEN install shall report it as an unrecognized retired artifact and leave the link unchanged.
packages/nana-setup/tests/retired-artifacts.test.mjs::a link at a retired skill name install does not link is still reported unrecognized
a link at a retired skill name install does not link is still reported unrecognized — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
R-2290 implemented
Row type: own
WHEN a Claude home or its skills folder is a link, THEN install shall print no retired row for a retired path that is absent there, nor for a skill link or copy install itself made.
packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2290: install through a linked Claude folder prints no retired row for an absent retired path or a skill link or copy install made
R-2290: install through a linked Claude folder prints no retired row for an absent retired path or a skill link or copy install made — packages/nana-setup/tests/linked-claude-folder.test.mjs — File's last measured run: PASS
R-663 implemented
Row type: own
WHEN installation inspects or modifies a manifest artifact or managed skill, it shall verify every source and destination ancestor from its selected root is a real directory before reading, hashing, moving, unlinking, or mirroring it; unsafe paths remain untouched and are reported.
packages/nana-setup/tests/retired-artifacts.test.mjs::recognized Claude skill and empty flag move under dated backups, packages/nana-setup/tests/retired-artifacts.test.mjs::source symlink ancestors are refused without changing their external target, packages/nana-setup/tests/retired-artifacts.test.mjs::backup symlink ancestors are refused without changing their external target, packages/nana-setup/tests/retired-artifacts.test.mjs::alternate Claude home scopes retirement away from the default home
recognized Claude skill and empty flag move under dated backups — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
source symlink ancestors are refused without changing their external target — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
backup symlink ancestors are refused without changing their external target — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
alternate Claude home scopes retirement away from the default home — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
R-2291 implemented
Row type: own
WHEN a Claude home that is a link holds a present retired artifact, THEN install shall report it ✗ and leave it byte-for-byte untouched, while the same artifact in an unlinked home is moved or unlinked.
packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2291: through a linked Claude folder each present retired artifact is reported ✗ and left byte-for-byte untouched
R-2291: through a linked Claude folder each present retired artifact is reported ✗ and left byte-for-byte untouched — packages/nana-setup/tests/linked-claude-folder.test.mjs — File's last measured run: PASS
R-2704 implemented
Row type: own
IF the Claude home, its rules folder, its shared-memory folder or that folder's parent, or off win32 its hooks folder, is a link whose target cannot be reached, THEN install shall refuse with exit 2, a first error line that starts with that link's path and says to move it, and every file, folder and link in the home unchanged, while an install whose only broken link is the skills folder, or on win32 the hooks folder, does not refuse.
packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2704: a Claude home, or its rules, shared-memory or (off win32) hooks folder, that is a link whose target cannot be reached makes install refuse before any write, naming that link, and a broken skills or win32 hooks link does not
R-2704: a Claude home, or its rules, shared-memory or (off win32) hooks folder, that is a link whose target cannot be reached makes install refuse before any write, naming that link, and a broken skills or win32 hooks link does not — packages/nana-setup/tests/linked-claude-folder.test.mjs — File's last measured run: PASS
R-353 implemented
Row type: own
A rule or hook symlink pointing at a decoy outside the repo shall be relinked with the decoy untouched and no backup written beside it.
packages/nana-setup/tests/skills-and-standards.test.mjs::${spec.tag} rule link ${rule}: the decoy OUTSIDE the repo is untouched, packages/nana-setup/tests/skills-and-standards.test.mjs::${spec.tag} rule link: no .bak was written next to the decoys, packages/nana-setup/tests/skills-and-standards.test.mjs::posix hook link: the decoy outside the repo is untouched, packages/nana-setup/tests/skills-and-standards.test.mjs::${spec.tag} rule link ${rule}: the entry is now the repo's file, not a link to the decoy, packages/nana-setup/tests/skills-and-standards.test.mjs::posix hook link: the hook now points into the repo
${spec.tag} rule link ${rule}: the decoy OUTSIDE the repo is untouched — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
${spec.tag} rule link: no .bak was written next to the decoys — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
posix hook link: the decoy outside the repo is untouched — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
${spec.tag} rule link ${rule}: the entry is now the repo's file, not a link to the decoy — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
posix hook link: the hook now points into the repo — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-378 implemented
Row type: own
WHILE an explicit --home override is in force, isRealHome shall be false even when that override resolves to the same path as the real home directory.
packages/nana-setup/tests/paths.test.mjs::--home set to the home directory's OWN path still forces isRealHome false
--home set to the home directory's OWN path still forces isRealHome false — packages/nana-setup/tests/paths.test.mjs — File's last measured run: PASS
R-379 implemented
Row type: own
WHEN target is a symlink (live or dangling), writeIfChanged shall leave it untouched and report it SKIPPED, making no read whose target is that symlink or its destination and no write through it.
packages/nana-setup/tests/fsops.test.mjs::a live symlink in the way is reported SKIPPED, not written, packages/nana-setup/tests/fsops.test.mjs::the symlink's target is byte-identical — nothing was written through it, packages/nana-setup/tests/fsops.test.mjs::no read targets the live symlink or its destination, packages/nana-setup/tests/fsops.test.mjs::the live symlink's destination path is unchanged, packages/nana-setup/tests/fsops.test.mjs::a dangling symlink is reported SKIPPED, not written, packages/nana-setup/tests/fsops.test.mjs::the dangling link's target was NOT created, packages/nana-setup/tests/fsops.test.mjs::no read targets the dangling symlink or its (missing) destination, packages/nana-setup/tests/fsops.test.mjs::the dangling symlink's destination path is unchanged
a live symlink in the way is reported SKIPPED, not written — packages/nana-setup/tests/fsops.test.mjs — File's last measured run: PASS
the symlink's target is byte-identical — nothing was written through it — packages/nana-setup/tests/fsops.test.mjs — File's last measured run: PASS
no read targets the live symlink or its destination — packages/nana-setup/tests/fsops.test.mjs — File's last measured run: PASS
the live symlink's destination path is unchanged — packages/nana-setup/tests/fsops.test.mjs — File's last measured run: PASS
a dangling symlink is reported SKIPPED, not written — packages/nana-setup/tests/fsops.test.mjs — File's last measured run: PASS
the dangling link's target was NOT created — packages/nana-setup/tests/fsops.test.mjs — File's last measured run: PASS
no read targets the dangling symlink or its (missing) destination — packages/nana-setup/tests/fsops.test.mjs — File's last measured run: PASS
the dangling symlink's destination path is unchanged — packages/nana-setup/tests/fsops.test.mjs — File's last measured run: PASS
R-349 implemented
Row type: own
WHERE the platform is win32, every posix-only step shall create nothing and, except the Claude Code hook-file link step, report skipped (win32).
packages/nana-setup/tests/win32-degrade.test.mjs::R-349: on win32, install --desk and its dry run create no hook folder and no launch agent, and report the desk service skipped (win32)
R-349: on win32, install --desk and its dry run create no hook folder and no launch agent, and report the desk service skipped (win32) — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-995 retired
Row type: own
WHERE the platform is win32, install shall report as skipped (win32) every PATH command row a POSIX install reports, and create nothing in the bin directory.
retired 2026-10-19: win32 install writes shims; R-1610 replaces it.
Tests: none cited in this repository
R-1610 implemented
Row type: own
WHERE the platform is win32, install shall write this checkout's rendered sh and .cmd shims for pi-review, pi-worker, nana-land, nana-setup and nana-writing, leave byte-equal shims unchanged, and back up a differing regular file before replacing it.
packages/nana-setup/tests/win32-degrade.test.mjs::win32 install leaves an sh and a .cmd shim for each PATH command, rewriting only what differs and backing up a hand-written file
win32 install leaves an sh and a .cmd shim for each PATH command, rewriting only what differs and backing up a hand-written file — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-1611 implemented
Row type: own
A rendered sh shim shall hand node every argument unchanged and return the bin's exit status when called by bare name from /bin/sh on POSIX or Git Bash on Windows.
packages/nana-setup/tests/win-shims.test.mjs::sh shim hands node every argument unchanged and returns the bin's exit status
sh shim hands node every argument unchanged and returns the bin's exit status — packages/nana-setup/tests/win-shims.test.mjs — File's last measured run: PASS
R-1612 implemented
Row type: own
WHERE the platform is win32, a rendered .cmd shim shall hand the first node.exe on PATH every supported double-quoted argument unchanged, run this checkout's bin from supported paths, and return its exit status when called by bare name from cmd.exe.
Windows leg only: packages/nana-setup/tests/win-shims.test.mjs::Windows: cmd.exe hands a .cmd shim's bin every double-quoted argument unchanged on the PATH node and returns its exit status
Windows: cmd.exe hands a .cmd shim's bin every double-quoted argument unchanged on the PATH node and returns its exit status — packages/nana-setup/tests/win-shims.test.mjs — File's last measured run: PASS
R-1613 implemented
Row type: own
WHERE the platform is win32, a rendered .cmd shim shall hand node every supported spaced argument unchanged and return the bin's exit status when called by bare name from Windows PowerShell.
Windows leg only: packages/nana-setup/tests/win-shims.test.mjs::Windows: PowerShell hands a .cmd shim's bin every spaced argument unchanged and returns its exit status
Windows: PowerShell hands a .cmd shim's bin every spaced argument unchanged and returns its exit status — packages/nana-setup/tests/win-shims.test.mjs — File's last measured run: PASS
R-1614 implemented
Row type: own
WHERE the platform is win32, a rendered .cmd shim whose bin rewrites that shim while running shall execute none of the replacement text.
Windows leg only: packages/nana-setup/tests/win-shims.test.mjs::Windows: a .cmd shim rewritten by its own bin runs none of the new text
Windows: a .cmd shim rewritten by its own bin runs none of the new text — packages/nana-setup/tests/win-shims.test.mjs — File's last measured run: PASS
R-1615 implemented
Row type: own
WHERE the platform is win32, doctor shall mark pi-review, pi-worker, nana-land, nana-setup and nana-writing ✓ only when both of each command's shims equal this checkout's rendering, and otherwise mark it ✗ and exit nonzero.
packages/nana-setup/tests/win32-degrade.test.mjs::win32 doctor reads each PATH command ✓ only when both its shims are this checkout's
win32 doctor reads each PATH command ✓ only when both its shims are this checkout's — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-2499 implemented
Row type: own
WHERE the platform is win32, WHEN ASCII text is piped by bare name to nana-writing --report from cmd.exe or Windows PowerShell, the installed .cmd shim shall hand that text to the checker unchanged.
packages/nana-setup/tests/win-shims.test.mjs::Windows: text piped by bare name to nana-writing --report reaches the checker from cmd.exe and PowerShell; Windows-leg-only
Windows: text piped by bare name to nana-writing --report reaches the checker from cmd.exe and PowerShell — packages/nana-setup/tests/win-shims.test.mjs — File's last measured run: PASS
R-1616 implemented
Row type: own
WHERE the platform is win32, doctor shall mark PATH resolves pi-review ✓ only when the bin directory's .cmd shim is found first on PATH.
Windows leg only: packages/nana-setup/tests/win-shims.test.mjs::Windows: doctor reads PATH resolves pi-review ✓ only when the bin directory's .cmd shim is found first
Windows: doctor reads PATH resolves pi-review ✓ only when the bin directory's .cmd shim is found first — packages/nana-setup/tests/win-shims.test.mjs — File's last measured run: PASS
R-1617 implemented
Row type: own
A rendered sh shim whose bin rewrites that shim while running shall execute none of the replacement text.
packages/nana-setup/tests/win-shims.test.mjs::an sh shim rewritten by its own bin runs none of the new text
an sh shim rewritten by its own bin runs none of the new text — packages/nana-setup/tests/win-shims.test.mjs — File's last measured run: PASS
R-1618 implemented
Row type: own
WHERE the platform is win32, IF no node.exe is on PATH THEN a rendered .cmd shim shall exit 1 and write the not-found message to stderr, not stdout.
Windows leg only: packages/nana-setup/tests/win-shims.test.mjs::Windows: a .cmd shim without node.exe on PATH exits 1 and writes its not-found message only to stderr
Windows: a .cmd shim without node.exe on PATH exits 1 and writes its not-found message only to stderr — packages/nana-setup/tests/win-shims.test.mjs — File's last measured run: PASS
R-936 retired
Row type: own
WHERE the platform is win32, the knowledge hook shall be wired with no VAR=value prefix.
superseded by R-1050, 2026-10-12: exec form's command is exactly node, so a prefix cannot appear; the rewritten check moved there.
Tests: none cited in this repository
R-387 retired
Row type: own
WHERE the platform is win32, no POSIX Claude Code hook shall enter settings.
superseded by R-1051, 2026-10-12: five entries are now wired on win32, in exec form (R-1050, R-1051); the rewritten checks moved under those rows.
Tests: none cited in this repository
R-1050 implemented
Row type: own
WHERE the platform is win32, the installer shall write each hook entry it owns in exec form: command exactly node, args holding the script's absolute path unquoted and unescaped, then hook for the knowledge pull only, and no shell field.
packages/nana-setup/tests/settings-merge.test.mjs::win32 desiredHooks: every entry is exec form with no shell key, packages/nana-setup/tests/settings-merge.test.mjs::win32 desiredHooks: only the knowledge entry adds hook, packages/nana-setup/tests/settings-merge.test.mjs::win32 desiredHooks: the knowledge target is the checkout's own nana-knowledge CLI, packages/nana-setup/tests/win32-degrade.test.mjs::win32: exactly one ${w.label} entry, exec form (command "node", args array, no shell key)
win32 desiredHooks: every entry is exec form with no shell key — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
win32 desiredHooks: only the knowledge entry adds hook — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
win32 desiredHooks: the knowledge target is the checkout's own nana-knowledge CLI — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
win32: exactly one ${w.label} entry, exec form (command "node", args array, no shell key) — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-1051 implemented
Row type: own
WHERE the platform is win32, the installer shall wire the objective, adoption, shared-memory, roster notice and verifier-pipe settings entries to the checkout's own packages/nana-setup/claude/hooks/<hook>.mjs.
packages/nana-setup/tests/settings-merge.test.mjs::win32 desiredHooks: the five hook entries name packages/nana-setup/claude/hooks/, packages/nana-setup/tests/win32-degrade.test.mjs::win32: ${w.label} args[0] is absolute, exists, and ends with the entry's script
win32 desiredHooks: the five hook entries name packages/nana-setup/claude/hooks/ — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
win32: ${w.label} args[0] is absolute, exists, and ends with the entry's script — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-1860 implemented
Row type: own
WHERE the platform is win32, install shall print no result row whose label contains the file name of the objective, adoption, shared-memory, roster notice or verifier-pipe hook script.
packages/nana-setup/tests/win32-degrade.test.mjs::win32 install prints no row labelled with a Claude Code hook script
win32 install prints no row labelled with a Claude Code hook script — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-1861 implemented
Row type: own
WHERE the platform is win32, doctor shall print no row whose label contains the file name of the objective, adoption, shared-memory, roster notice or verifier-pipe hook script.
packages/nana-setup/tests/win32-degrade.test.mjs::win32 doctor prints no row labelled with a Claude Code hook script
win32 doctor prints no row labelled with a Claude Code hook script — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-1053 implemented
Row type: own
WHERE the platform is win32, the installer shall place the verifier-pipe entry in a PreToolUse group whose matcher is WIN_VERIFIER_MATCHER.
packages/nana-setup/tests/settings-merge.test.mjs::WIN_VERIFIER_MATCHER is Bash-or-PowerShell, packages/nana-setup/tests/settings-merge.test.mjs::win32 desiredHooks: the verifier group's matcher is WIN_VERIFIER_MATCHER, packages/nana-setup/tests/win32-degrade.test.mjs::win32: the verifier group's matcher is Bash-or-PowerShell
WIN_VERIFIER_MATCHER is Bash-or-PowerShell — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
win32 desiredHooks: the verifier group's matcher is WIN_VERIFIER_MATCHER — packages/nana-setup/tests/settings-merge.test.mjs — File's last measured run: PASS
win32: the verifier group's matcher is Bash-or-PowerShell — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-1058 implemented
Row type: own
WHERE the platform is win32, each hook entry the installer writes, spawned as exec form (its command with its args and no shell) from a checkout, a home and a project folder whose paths contain a space, $, a backtick, % and an apostrophe, shall exit 0 within its timeout with no module-resolution error on stderr.
Windows-leg-only; final review r1 build 4 fix (spawned with each entry's own timeout, no added slack, for all five entries); read green on the draft PR's CI run 38347800159 (job 115133128863, 25 pass, 3.7s), the run on the last code commit (be22c5a) (sol SHOULD 2): packages/nana-setup/tests/hooks-win32-exec.test.mjs::objective: exit 0 within its own timeout, no module-resolution error, packages/nana-setup/tests/hooks-win32-exec.test.mjs::adoption: exit 0 within its own timeout, no module-resolution error, packages/nana-setup/tests/hooks-win32-exec.test.mjs::shared memory: exit 0 within its own timeout, no module-resolution error, packages/nana-setup/tests/hooks-win32-exec.test.mjs::verifier: exit 0 within its own timeout, no module-resolution error, packages/nana-setup/tests/hooks-win32-exec.test.mjs::knowledge: exit 0 within its own timeout, no module-resolution error
objective: exit 0 within its own timeout, no module-resolution error — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
adoption: exit 0 within its own timeout, no module-resolution error — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
shared memory: exit 0 within its own timeout, no module-resolution error — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
verifier: exit 0 within its own timeout, no module-resolution error — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
knowledge: exit 0 within its own timeout, no module-resolution error — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
R-1063 implemented
Row type: own
WHERE the platform is win32, when spawned as R-1058 describes with its event's sample stdin, the objective entry shall print a first line starting [nana:objective] and no OBJECTIVE UNAVAILABLE, the adoption entry no ADOPTION UNAVAILABLE, the shared-memory entry its [nana:shared-memory] header and the seeded - [ index line, and the roster notice entry one JSON object whose systemMessage starts nana active · roster.
Windows-leg-only; final review r1 build 4 fix (the shared-memory case now pins the seeded index line itself, not only its description); read green on the draft PR's CI run 38347800159 (job 115133128863, 25 pass, 3.7s), the run on the last code commit (be22c5a) (sol SHOULD 2): packages/nana-setup/tests/hooks-win32-exec.test.mjs::objective: first line starts [nana:objective], no OBJECTIVE UNAVAILABLE, packages/nana-setup/tests/hooks-win32-exec.test.mjs::adoption: exit 0, no ADOPTION UNAVAILABLE, packages/nana-setup/tests/hooks-win32-exec.test.mjs::shared memory: exit 0, header and the seeded "- [" index line, packages/nana-setup/tests/hooks-win32-exec.test.mjs::shared memory: the project's memory/shared is a link to the shared folder, packages/nana-setup/tests/hooks-win32-exec.test.mjs::roster notice: one JSON object whose user message starts with the roster notice prefix
objective: first line starts [nana:objective], no OBJECTIVE UNAVAILABLE — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
adoption: exit 0, no ADOPTION UNAVAILABLE — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
shared memory: exit 0, header and the seeded "- [" index line — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
shared memory: the project's memory/shared is a link to the shared folder — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
roster notice: one JSON object whose user message starts with the roster notice prefix — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
R-1330 implemented
Row type: own
WHERE the platform is Windows, the knowledge hook command install writes shall, run with a prompt that matches a fixture knowledge store, print a pull block naming the matching fixture file.
Windows-leg-only; read green on the draft PR's CI run 39073656911 (28 to 29 passing checks, KH1 the added one): packages/nana-setup/tests/hooks-win32-exec.test.mjs::R-1330: on Windows the installed knowledge hook command prints a pull block naming the fixture file for a matching prompt
R-1330: on Windows the installed knowledge hook command prints a pull block naming the fixture file for a matching prompt — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
R-1713 implemented
Row type: own
WHERE the platform is Windows, WHEN the installed knowledge hook command uses an index older than one hour, it shall print the existing index's matching pull block while a background build rebuilds the index.
packages/nana-setup/tests/hooks-win32-exec.test.mjs::R-1713: on Windows the installed knowledge hook command on an index older than one hour prints the fixture's pull block and the index is rebuilt in the background; Windows-leg-only; the seat records the CI run
R-1713: on Windows the installed knowledge hook command on an index older than one hour prints the fixture's pull block and the index is rebuilt in the background — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
R-1340 implemented
Row type: own
WHERE the platform is Windows, the installed objective and adoption SessionStart hook commands shall, run in a fixture project with an objective and a configured priority, print the objective block naming that priority and the adoption line.
SS1 is written and SKIPs on macOS; verified under a local win32 simulation (env var NANA_SETUP_PLATFORM set to win32), but the file runs for real only on the Windows CI leg — the Windows CI leg's run is SS2's own evidence: packages/nana-setup/tests/hooks-win32-exec.test.mjs::R-1340: on Windows the installed objective and adoption hook commands print the objective block naming the fixture's priority and the adoption line
R-1340: on Windows the installed objective and adoption hook commands print the objective block naming the fixture's priority and the adoption line — packages/nana-setup/tests/hooks-win32-exec.test.mjs — File's last measured run: SKIP
R-350 implemented
Row type: own
WHERE the platform is win32, rules shall be installed as copies matching the repo file, with the same backup guarantee, never writing through a symlink.
packages/nana-setup/tests/win32-degrade.test.mjs::win32: nana-soul.md is installed as a copy, packages/nana-setup/tests/win32-degrade.test.mjs::win32 collision: the backup keeps the old content, packages/nana-setup/tests/win32-degrade.test.mjs::win32 symlink: the link's target is untouched, packages/nana-setup/tests/win32-degrade.test.mjs::win32: the copy matches the repo file, packages/nana-setup/tests/win32-degrade.test.mjs::win32 collision: a backup is written, packages/nana-setup/tests/win32-degrade.test.mjs::win32: nana-seat.md is installed as a copy matching the repo file
win32: nana-soul.md is installed as a copy — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
win32 collision: the backup keeps the old content — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
win32 symlink: the link's target is untouched — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
win32: the copy matches the repo file — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
win32 collision: a backup is written — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
win32: nana-seat.md is installed as a copy matching the repo file — packages/nana-setup/tests/win32-degrade.test.mjs — File's last measured run: PASS
R-351 implemented
Row type: own
WHERE the platform is win32, the skill shall be mirrored file by file as byte-equal copies.
packages/nana-setup/tests/skills-and-standards.test.mjs::R-351: on win32 install mirrors every shipped file of all five Claude Code skills byte-for-byte
R-351: on win32 install mirrors every shipped file of all five Claude Code skills byte-for-byte — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-938 implemented
Row type: own
WHERE the platform is win32, a stale copy shall read ✗ naming the file and be refreshed.
packages/nana-setup/tests/skills-and-standards.test.mjs::R-938: on win32 doctor names every stale SKILL.md and install refreshes all five copies
R-938: on win32 doctor names every stale SKILL.md and install refreshes all five copies — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-388 implemented
Row type: own
WHERE the platform is win32, a hand-written file shall be backed up as a FILE inside the skill dir.
packages/nana-setup/tests/skills-and-standards.test.mjs::R-388: on win32 each overwritten SKILL.md has one regular in-folder backup and no skill-name backup entry
R-388: on win32 each overwritten SKILL.md has one regular in-folder backup and no skill-name backup entry — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-939 retired
Row type: own
WHERE the platform is win32, files the owner added shall be left alone.
retired 2026-10-20: duplicate of R-359
Tests: none cited in this repository
R-359 implemented
Row type: own
WHERE the platform is win32, a file the owner added inside the mirrored skill directory shall be left alone.
packages/nana-setup/tests/skills-and-standards.test.mjs::R-359: on win32 refresh preserves every owner note and every copy marker
R-359: on win32 refresh preserves every owner note and every copy marker — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-352 implemented
Row type: own
IF a directory symlink or a regular file occupies the win32 skill path, THEN install shall exit 1 naming it, leave the victim tree byte-identical and write no backup into it.
packages/nana-setup/tests/skills-and-standards.test.mjs::win32 dir link: ✗ naming the link and refusing to write through it, packages/nana-setup/tests/skills-and-standards.test.mjs::win32 dir link: the VICTIM tree is byte-identical, packages/nana-setup/tests/skills-and-standards.test.mjs::win32 file-at-skill-path: install exits 1 and leaves the file, packages/nana-setup/tests/skills-and-standards.test.mjs::win32 dir link: no .bak was written into the victim
win32 dir link: ✗ naming the link and refusing to write through it — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
win32 dir link: the VICTIM tree is byte-identical — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
win32 file-at-skill-path: install exits 1 and leaves the file — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
win32 dir link: no .bak was written into the victim — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1420 implemented
Row type: own
WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install shall exit 1 with a ✗ line naming that directory and the move-or-remove fix.
packages/nana-setup/tests/skills-and-standards.test.mjs::win32 occupied skill dir: install exits 1 with ✗ naming the directory and the fix
win32 occupied skill dir: install exits 1 with ✗ naming the directory and the fix — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1421 implemented
Row type: own
WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install shall leave that directory's entries and bytes unchanged.
packages/nana-setup/tests/skills-and-standards.test.mjs::win32 occupied skill dir: the owner's folder is byte-identical after install
win32 occupied skill dir: the owner's folder is byte-identical after install — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1422 implemented
Row type: own
WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN install --dry-run shall exit 1 with that directory unchanged.
packages/nana-setup/tests/skills-and-standards.test.mjs::win32 occupied skill dir: --dry-run exits 1 and leaves the folder unchanged
win32 occupied skill dir: --dry-run exits 1 and leaves the folder unchanged — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1423 implemented
Row type: own
WHERE the platform is win32, IF a directory that nana-setup did not make occupies the requirements skill path, THEN doctor shall mark the skill ✗ with a detail saying a directory is there instead of nana-setup's copy and to move it.
packages/nana-setup/tests/skills-and-standards.test.mjs::win32 occupied skill dir: doctor reads ✗ — a directory instead of nana-setup's copy — with the move fix
win32 occupied skill dir: doctor reads ✗ — a directory instead of nana-setup's copy — with the move fix — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1424 implemented
Row type: own
WHERE the platform is win32, IF an unmarked directory at the requirements skill path holds a SKILL.md that, with CRLF read as LF, equals a version the pack shipped before the marker, THEN install shall exit 0 with the pack's current SKILL.md in place.
packages/nana-setup/tests/skills-and-standards.test.mjs::win32 pre-marker copy: install exits 0 and refreshes a shipped older SKILL.md, LF and CRLF
win32 pre-marker copy: install exits 0 and refreshes a shipped older SKILL.md, LF and CRLF — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1425 implemented
Row type: own
WHERE the platform is win32, WHEN install writes the requirements skill mirror, it shall place a regular file named .nana-setup-copy inside it.
packages/nana-setup/tests/skills-and-standards.test.mjs::win32 fresh mirror: install writes the .nana-setup-copy marker
win32 fresh mirror: install writes the .nana-setup-copy marker — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1426 implemented
Row type: own
WHERE the platform is win32, IF the requirements skill directory holds a copy that nana-setup install wrote and its SKILL.md has since changed, THEN install shall exit 0 with the pack's current SKILL.md in place.
packages/nana-setup/tests/skills-and-standards.test.mjs::win32: install refreshes the stale copy
win32: install refreshes the stale copy — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1900 implemented
Row type: own
WHERE the platform is win32, doctor shall mark each installed spec, py-lint, py-review and py-test skill copy ✓ and say it was copied from the pack without a symlink.
packages/nana-setup/tests/skills-and-standards.test.mjs::R-1900: on win32 doctor marks all four newly managed skill copies healthy and names the copy form
R-1900: on win32 doctor marks all four newly managed skill copies healthy and names the copy form — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1901 implemented
Row type: own
WHERE the platform is win32, IF an owner directory occupies any spec, py-lint, py-review or py-test skill path, THEN install and its dry run shall exit 1 naming the directory and leave it byte-identical.
packages/nana-setup/tests/retired-artifacts.test.mjs::R-1901: forced win32 install and dry-run refuse all four owner skill directories without changing them
R-1901: forced win32 install and dry-run refuse all four owner skill directories without changing them — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
R-1902 implemented
Row type: own
WHERE the platform is win32, IF the retired spec fixture occupies the spec skill path, THEN install shall move it to the dated backup and write a byte-equal copy of the pack's spec skill.
packages/nana-setup/tests/retired-artifacts.test.mjs::R-1902: forced win32 install retires the recognized spec fixture and installs the pack copy
R-1902: forced win32 install retires the recognized spec fixture and installs the pack copy — packages/nana-setup/tests/retired-artifacts.test.mjs — File's last measured run: PASS
R-1903 implemented
Row type: own
WHERE the platform is win32, IF a regular file or a symlink or junction occupies a skill path, THEN doctor shall mark it ✗, identify its kind instead of nana-setup's copy, and direct the owner to move it before rerunning install.
packages/nana-setup/tests/skills-and-standards.test.mjs::R-1903: on win32 doctor identifies regular files and a skill link or junction with the move-then-install fix
R-1903: on win32 doctor identifies regular files and a skill link or junction with the move-then-install fix — packages/nana-setup/tests/skills-and-standards.test.mjs — File's last measured run: PASS
R-1904 implemented
Row type: own
WHERE the platform is forced to win32, WHEN install runs twice over one home, the second run shall print no retired row for the marked spec, py-lint, py-review or py-test skill copy the first run wrote.
packages/nana-setup/tests/install.test.mjs::R-1904: forced win32 second install prints no retired row for four marked skill copies
R-1904: forced win32 second install prints no retired row for four marked skill copies — packages/nana-setup/tests/install.test.mjs — File's last measured run: PASS
R-2890 implemented
Row type: own
WHEN the launch-limit judge finds a recorded pid still alive when its wait ends, it shall report that run not ended, name that pid with its probe result, and signal no process.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2890: a recorded pid still alive when the judge's wait ends makes the run read not ended, is named with its probe result, and is left running
R-2890: a recorded pid still alive when the judge's wait ends makes the run read not ended, is named with its probe result, and is left running — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2891 implemented
Row type: own
IF the launch-limit judge first probes a run at or after the earliest start time its records carry plus HANG_MS less SELF_EXIT_MARGIN_MS, or any record carries no start time, THEN it shall report that run not ended, naming the reason.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2891: a run judged after its fixture could have ended by itself, or holding a record with no start time, reads not ended with the reason named
R-2891: a run judged after its fixture could have ended by itself, or holding a record with no start time, reads not ended with the reason named — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2892 implemented
Row type: own
IF the launch-limit judge's probe of a recorded pid fails with an error code other than ESRCH, or a record holds a pid or ppid that is not a positive integer, THEN the judge shall report that run not ended, naming the error code or the record.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2892: a probe error other than ESRCH, or a record without a positive integer pid and ppid, makes the judge report its run not ended and name it
R-2892: a probe error other than ESRCH, or a record without a positive integer pid and ppid, makes the judge report its run not ended and name it — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2893 implemented
Row type: own
Every call to a function named kill in the launch-limit test file shall be the probe's kill(pid, 0), process.kill(-child.pid, …), process.kill(group ? -child.pid : child.pid, …), process.kill(relayPid, …) or child.kill(…); the file imports no tree-kill helper and starts no taskkill or kill command.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2893: the launch-limit test signals only through its allowed kill calls, imports no tree-kill helper and starts no kill command
R-2893: the launch-limit test signals only through its allowed kill calls, imports no tree-kill helper and starts no kill command — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2894 implemented
Row type: own
The launch-limit test shall give a fixture's process tree a sealed 6-second start allowance apart from the parent-kill bound and a sealed 1-second self-exit margin, with the allowance plus the relay settle window plus the stop margin ending at least the self-exit margin before the fixture hang, and the allowance plus the parent-kill bound ending before it.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2894: a fixture tree gets a sealed 6-second start allowance apart from the parent-kill bound and a sealed 1-second self-exit margin, and a stopped launch returns at least that margin before the fixture's hang
R-2894: a fixture tree gets a sealed 6-second start allowance apart from the parent-kill bound and a sealed 1-second self-exit margin, and a stopped launch returns at least that margin before the fixture's hang — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-2895 implemented
Row type: own
WHEN a fixture's pi starts its child later than the default poll but inside the start allowance, the parent-kill check shall count that launch started.
packages/nana-setup/tests/pi-launch-limits.test.mjs::R-2895: the parent-kill check counts a launch whose pi starts its child after the default poll but inside the start allowance as started
R-2895: the parent-kill check counts a launch whose pi starts its child after the default poll but inside the start allowance as started — packages/nana-setup/tests/pi-launch-limits.test.mjs — File's last measured run: PASS
R-004 implemented
Row type: shared
The default objective source shall be nana-objective.md in pi's active agent dir.
packages/nana-pack/tests/objective-golden.test.mjs::T15 objectivePath default: <PI_CODING_AGENT_DIR>/nana-objective.md, packages/nana-pack/tests/objective-golden.test.mjs::T15 both runtimes read the active agent dir's nana-objective.md, packages/nana-pack/tests/objective-golden.test.mjs::T15 unset override: default ~/.pi/agent
T15 objectivePath default: <PI_CODING_AGENT_DIR>/nana-objective.md — packages/nana-pack/tests/objective-golden.test.mjs — File's last measured run: PASS
T15 both runtimes read the active agent dir's nana-objective.md — packages/nana-pack/tests/objective-golden.test.mjs — File's last measured run: PASS
T15 unset override: default ~/.pi/agent — packages/nana-pack/tests/objective-golden.test.mjs — File's last measured run: PASS
```

Confirmed: Deliverables, then Registered artifacts with 11 cards, then Requirements.

Summary: #product 188; #artifacts 60; #FEAT-013 1392; bytes before 2,242,158; after 2,245,173.
