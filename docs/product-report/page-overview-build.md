# Product Overview build evidence

Feature: FEAT-039. Lane: page-overview. macOS, build session 2.

This session preserved session 1's requirement-first work and its wrong-code-first evidence. It changed only the newly permitted R-2799 tab-order clause, regenerated the map and tree, and completed verification. R-2799's title, remaining clauses, row text and evidence are unchanged.

## Rows and implementation

New implemented rows: R-2920, R-2921, R-2922, R-2923, R-2924, R-2925 and R-2927. R-2926 remains unused. R-2794 widens with an empty-list clause and additional evidence; R-2639 gains `more`; R-1019's evidence follows its renamed routing check.

Ages use a second `ageDays` map keyed like the existing text map. All three measured formatters return `{ text, days }`; `artifactAges` keeps the original text map and records measured days separately. No line-label words depart from the must-meet.

The named helper moves from product-report.test.mjs into report-fixtures.mjs are CASE_LIMIT_MS, withinCaseLimit, treeFixture, table, hashRow, makeAssessment, writeStore, writeRuntimeFile, commitAt and renderHtmlAt. renderPageAt remains private in the original test file because the new tests do not call it. No additional private helper moved or was copied; product code adds no imports.

## Existing-test edits

All session 1 edits match build brief 1: explicit Decisions routes for existing ask/question checks; Overview in the feature-link and raw-key checks; renamed prototype-hash check requiring Overview and all five block headings; explicit Decisions and hostile-text Overview renders in the text-node check; the R-2642 count suffix; and shared helper imports replacing their private definitions. The two R-2639 literals in requirements-tree.test.mjs gain `more`. This session changes R-2799's first-three-tabs assertion to the first four: Overview, Decisions, Product, Artifacts. No test title or other R-2799 clause changes.

## Hand red cases

Each mutation below changed code, not assertions, ran independently on macOS, produced exit 1 and the named FAIL, and was restored before the next case. Every new row has a hand red case; these are all 22 cases required by build brief 1.

| Case | Wrong code | Named failures seen |
|---|---|---|
| 01 | Empty hash routes to Decisions | R-2920 |
| 02 | Restore the Shared route entry | R-2920 |
| 03 | Renderer reads module-scope OVERVIEW_BLOCKS | R-2920 (ReferenceError) |
| 04 | Needs you lists every ask title | R-2921 |
| 05 | Blocking asks sorted by since-date | R-2921 |
| 06 | Question parser stops only at level-one headings | R-2921, R-1570 |
| 07 | Not-passed list keeps only FAIL rows | R-2922 |
| 08 | Split counts all not-passed rows as skipped only | R-2922 |
| 09 | Runtime age omitted from the not-passed line | R-2922 |
| 10 | Deliverable gaps ignore parkedRows | R-2923 |
| 11 | Artifact gaps use the page's Reads/reference join | R-2923 |
| 12 | Deliverable note count omitted | R-2923 |
| 13 | Stale comparison uses >= | R-2924 |
| 14 | Record days for tracked ages only | R-2924 |
| 15 | Merge unknown and not-measured counts | R-2924 |
| 16 | Drop the liveFeature filter | R-2924 |
| 17 | Add a constraint stage line | R-2925 |
| 18 | Drop artifact-gap registry guard | R-2927 |
| 19 | What it does reads first deliverable line without field guard | R-2927 |
| 20 | Empty list renders its label above an empty list | R-2794 (new test) |
| 21 | Restore the old parked suffix | R-2639, R-2642 |
| 22 | Set STALE_AGE_DAYS to 31 | R-2924, seal |

The hand runs invoked the actual test files through Node, with ambient NANA variables removed, a 300-second process limit, and each test's existing per-case limits. They neither ran nor imported a seat script. Full mutation output stayed in OS temporary files; the table records its named failures without fixture paths.

## Commands

- `npm run map:impact -- scripts/product-report.mjs scripts/deliverables.mjs packages/nana-pack/tests/product-report.test.mjs`: exit 0, before this session's code/test edit.
- `npm run map`: exit 0, 445 modules.
- `npm run req:tree`: exit 0, 2058 rows, 39 features, 0 problems.
- Initial `npm test --` for product-report.test.mjs, product-overview.test.mjs and requirements-tree.test.mjs: exit 0; 199 checks passed.
- Restored `npm test --` for all nine files named in build brief 1: exit 0.

```text
PASS  packages/nana-pack/tests/linked-launch.test.mjs              5 pass  1.2s
PASS  packages/nana-pack/tests/product-overview.test.mjs           9 pass  3.8s
PASS  packages/nana-pack/tests/product-report.test.mjs             92 pass  62.3s
PASS  packages/nana-pack/tests/requirements-deliverables.test.mjs  21 pass  0.7s
PASS  packages/nana-pack/tests/requirements-moved.test.mjs         10 pass  0.5s
PASS  packages/nana-pack/tests/requirements-tree.test.mjs          98 pass  2.7s
PASS  packages/nana-pack/tests/runtime-land.test.mjs               11 pass  18.8s
PASS  packages/nana-pack/tests/templates-render.test.mjs           172 pass  77.2s
PASS  packages/nana-pack/tests/test-runner.test.mjs                52 pass  30.3s
9 files: 9 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 470 pass, 0 fail, 0 skip · 198.2s
```

`npm run test:locked`: exit 0, with one machine-wide lock and heartbeat/failure watcher. The complete output stayed in an OS temporary file, outside the worktree.

```text
225 files: 223 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8569 pass, 0 fail, 44 skip · 631.5s
```

Final checks, each read independently with exit 0:

- `npm run map:check`: 445 modules, 0 without a usable contract header, 3 exempt, 0 problems.
- `npm run readme:check`: 775 claims checked, 0 problems.
- `node scripts/requirements-trace.mjs`: 2058 rows, 1817 implemented and traced, 0 off-form rows.
- `node scripts/requirements-tree.mjs --check`: 0 problems; 2058 rows; 39 features.
- `node scripts/requirements-tree.mjs --root .`: 0 problems; `deliverables: 21 of 21 made and read by code, 21 more parked`.
- `node scripts/known-bugs.mjs --root .`: `summary names=0 sizes=0`.
- `node docs/reviews/page-overview-2026-10-25/seat-titles.mjs all`: `0 missing`.

The trace and known-bugs commands emitted the existing Node module-type warning; both exited 0. No checker was changed.

## Real-page render

`node scripts/product-report.mjs --out <OS-temp-file>`: exit 0. Rendered its empty hash with the shared `renderHtmlAt` helper, then rendered Decisions and asserted its open-question list has 21 entries: exit 0. This confirms the first view's five blocks, order and text, not browser viewport geometry. The report still names the page discussion because this builder must not edit HANDOFF.md.

Page size before: 2,231,455 bytes (session brief's baseline). After: 2,241,848 bytes. This snapshot precedes the locked suite's runtime-store update.

```text
Needs you
Asks: 29 · blocking (must decide): 1 · optional: 26 · parked: 2
Must decide: The page discussion · since 2026-10-24
Open questions in the ledger: 21
Broken
Violated: 5
R-433, R-435, R-436, R-445, R-446
Did not pass in this clone's last measured run: 6 · failed: 0 · skipped only: 6 · implemented rows with no recorded run: 7 · measured at tip e4d29927 on 2026-10-26T00:17:50.244Z, 2 commits and 0 days before HEAD
R-1064, R-1058, R-1063, R-1330, R-1713, R-1340
Gaps
Deliverables code does not make and read: 0 · parked: 21 · deliverable notes: 0
Artifacts with no declared reader: 0 · parked: 2
Stale
Feature assessments out of date: 34 · unassessed: 1
FEAT-001, FEAT-002, FEAT-003, FEAT-004, FEAT-005, FEAT-006, FEAT-007, FEAT-008, FEAT-009, FEAT-010, FEAT-011, FEAT-013, FEAT-014, FEAT-015, FEAT-016, FEAT-017, FEAT-018, FEAT-019, FEAT-020, FEAT-021, FEAT-022, FEAT-023, FEAT-024, FEAT-026, FEAT-027, FEAT-028, FEAT-029, FEAT-030, FEAT-031, FEAT-032, FEAT-033, FEAT-039, FEAT-034, FEAT-036, FEAT-038
Artifacts older than 30 days before HEAD's commit: 6 · age not measured: 47 · age unknown: 0
A-039 · study schedule · 46 days
A-040 · study summary · 46 days
A-041 · probe ledger · 46 days
A-042 · study results · 46 days
A-074 · fixture manifest · 46 days
A-075 · oracle keys · 46 days
What it does
deliverables: 21 of 21 made and read by code, 21 more parked
CAP-01 · Maintain direction and useful context: 5 of 5 made and read by code, 1 more parked
CAP-02 · Deliver controlled changes: 4 of 4 made and read by code, 2 more parked
CAP-04 · Bring nana to each project and maintain it: 5 of 5 made and read by code, 1 more parked
CAP-05 · Follow and steer development: 2 of 2 made and read by code, 3 more parked
CAP-06 · Use attributable tool outputs and focused apps: 0 of 0 made and read by code, 5 more parked
CAP-07 · Keep code and promises checkable: 5 of 5 made and read by code, 3 more parked
CAP-08 · Evaluate agent choices with credible evidence: 0 of 0 made and read by code, 6 more parked
```

## Scope, known bugs and departures

The closed-question known bug is touched: ledger entries 2, 3, 4, 5 and 9 moved unchanged to Closed questions. The report's no-runtime-data bare-zero known bug is touched only on Overview: it now names the missing input. Product's existing empty deliverables list is unchanged. The Issues view retains its existing rule and legend. No other listed known bug is fixed; known-bug files remain untouched as instructed.

Precedent departures: none in code or tests beyond the helper moves already reported by session 1 and authorized in this session's brief. This extra evidence document keeps long script output committed as the builder instructions require, outside the forbidden review and session folders. Full locked-suite output remains outside the worktree, as specifically required. No CI, push, install check, HANDOFF change, session archive, checker change or seat-tool edit was performed.
