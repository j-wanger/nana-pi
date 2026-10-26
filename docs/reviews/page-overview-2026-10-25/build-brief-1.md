Feature: FEAT-039 · See the product and its decisions in one report. Lane page-overview. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/page-overview. The spec is `docs/reviews/page-overview-2026-10-25/must-meet.md`; read it whole before designing. `plan-draft.md` and `plan-attack.md` beside it are its inputs; the must-meet dropped the draft's closed-question filter (R-2926, CLOSED_QUESTION_MARK, the R-1570 narrowing) and added R-2927, so where they differ, the must-meet holds. Do not edit: HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, `packages/nana-pack/bin/nana-land.mjs`, the review tools (`packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/claude-review.mjs`, `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/bin/review-ledger.mjs`, `packages/nana-pack/prompts/review-standard.md`), `scripts/test-locked.mjs`, `scripts/requirements-moved.mjs`, the frontier checker and block (`packages/nana-pack/lib/frontier-*.mjs`, `packages/nana-pack/lib/handoff-asks.mjs`), any file under `templates/` or `packages/nana-setup/`, the checkers `scripts/requirements-trace.mjs`, `scripts/readme-check.mjs`, `scripts/known-bugs.mjs` and `packages/nana-pack/tests/skill-claims.mjs`, or any file in a review folder.

What the lane does, in one sentence: the product page opens on a one-screen Overview of what needs the owner, what is broken, the maker and reader gaps, stale or unmeasured ages and each stage's deliverable count, built from the same checker run the tree checker prints, with the Shared view gone, empty card lists reading `none`, the count line's suffix reading `, <n> more parked`, and the ledger's closed questions moved under their own heading.

Precedent:
- scripts/product-report.mjs:356-513 — `renderInto`: views and fallback at `:358-359`, helpers at `:368-371`, title map `:401`, nav `:404`, Decisions branch `:406-414`, empty-list renderer `:441-445`, Artifacts view from segment lines `:450-468`, Shared branch `:490`, Issues branch with the String() comment `:491-501`.
- scripts/product-report.mjs:43-65 — contract constants and their exports; SECONDS_PER_DAY at `:64-65`; the tunable form LAND_REPORT_SUBPATH at `:32-33`; the String() rule comment at `:112-114`.
- scripts/product-report.mjs:72-92 — PASS and FAIL labels, `uniqueFilesOf`, `didNotPass`; `runStateOf` at `:661-667`; `violated` and `notPassed` at `:898-901`; the legend with the runtime reason at `:904`; the model at `:905`.
- scripts/product-report.mjs:123-143 — `parseOpenQuestions`, its break at `:131`.
- scripts/product-report.mjs:233-342 — `artifactAges`: `wholeDays` at `:174`, formatters `:200-212`, RUNTIME_AGE_KEY `:227`, not-measured branch `:240-244`, runtime branch `:321-340`; descriptors and the ages call in `buildReport` at `:686-699`.
- scripts/product-report.mjs:621-627 — the ask parse; assessment state `:744-745`; `liveFeature` `:777`; product cards `:783-816` with the empty-list model `:805-811`; `featureSegment` `:704`; the Artifacts model `:832-897`, its emptyText `:834` and ID sort `:836`.
- scripts/deliverables.mjs:504-704 — `checkDeliverables`: the per-capability loop from `:532`, `listed` `:541`, `parkedRows` `:546`, the park decision `:572-579`, counters `:687-688`, return `:703`; `deliverableReport` at `:707-734` with the count line at `:728`; `deliverableReportLines` at `:736-738`; `artifactConsumers` at `:359-500`, park and gap at `:490-498`; ARTIFACT_AGE_TABLE `:39-43`.
- packages/nana-pack/lib/handoff-asks.mjs:11-28 — `TAG`, `splitOpenSection`, kinds lowercased (read only).
- packages/nana-pack/tests/product-report.test.mjs:31-48 — `check`, CASE_LIMIT_MS and `withinCaseLimit`; `treeFixture` `:59-68`; `table` `:69`; `makeAssessment` `:74-82`; `writeStore` `:83-88`; `writeRuntimeFile` `:102-108`; `historyFixture` `:161-171`; `commitAt` `:172-185`; `renderHtmlAt` `:218-237`; `renderPageAt` `:268-282`.
- packages/nana-pack/tests/product-report.test.mjs:336-401 — the shared-model renders and R-1019's prototype-hash check; the hand-built renderer check `:446-452`; R-1570 `:1097-1129`; R-1571 `:1131-1157`; R-2642 `:1327-1329`; R-2543's checker CLI comparison and the `product-no-lines` ledger `:1331-1369`; R-2794 `:1477-1503`; R-2545's runtime fixture `:1689-1709`.
- packages/nana-pack/tests/requirements-tree.test.mjs:518-534 — R-2639's literals at `:523` and `:532`.
- packages/nana-pack/tests/review-movement.test.mjs:31-39 — the seal form.
- packages/nana-pack/tests/ledger-repo.mjs:1-8 — the six-tag header of a shared test-helper module; `packages/nana-pack/tests/land-fixtures.mjs:1-8` is the second.
- packages/nana-pack/tests/test-runner.test.mjs:653-662 — R-917's scan: no `mkdtempSync`, and `tmpDir` only with its exact import line.
- REQUIREMENTS.md:2843 — R-2802, after which the new rows go; R-2794 at `:2839`; R-1019 at `:2801`; R-2639 at `:2286`; the open questions at `:3023-3075`, `## Deliberate omissions` at `:3077`.
- packages/nana-pack/skills/requirements/SKILL.md:127 — the count-line sentence; the open-questions sentence at `:125`; the Product view paragraph at `:129`.
- README.md:271 — the Product report paragraph.
- docs/reviews/keep-movement-2026-10-25/must-meet.md — widening a row in place (R-2905).

Helper move, named (the 2026-10-22 second-caller ruling): each test helper product-overview.test.mjs uses moves from product-report.test.mjs to a new `packages/nana-pack/tests/report-fixtures.mjs`, with its temp folder passed in, and both test files import it; name each moved helper in your report. `check` stays per file. In product code nothing private moves: `deliverableCountText` is a module-private extraction inside deliverables.mjs, and product-report.mjs gains no new import. Report any other import or copy as a departure.

The task:
1. REQUIREMENTS.md, FEAT-039: rows R-2920, R-2921, R-2922, R-2923, R-2924, R-2925 and R-2927 after R-2802 (`:2843`), in that order, each with the exact text the must-meet gives, `untested` until its check passes, then `implemented` with backticked `file::title` evidence. R-2926 stays unused. R-2794's text gains ", and a list with no item shows its label followed by `none` and no list" before its final full stop; its evidence gains the new test after its existing one. R-2639's `, <n> parked` becomes `, <n> more parked`; its title and evidence stay. R-1019's evidence cell follows the renamed prototype-hash test (step 9).
2. REQUIREMENTS.md, open questions: move entries 2, 3, 4, 5 and 9, each whole with its number and note and in that order, under a new `## Closed questions` heading placed after entry 23 and before `## Deliberate omissions`, with one blank line around the heading. Change no other entry. Confirm that the real page's Decisions view lists 21 open questions (step "Render the real page once" below), and that `node scripts/requirements-tree.mjs --check` stays clean.
3. `scripts/deliverables.mjs`:
   a. A module-private `deliverableCountText(madeAndRead, total, parked)` returning `` `${madeAndRead} of ${total} made and read by code${parked ? `, ${parked} more parked` : ""}` ``. The count line at `:728` becomes `` `deliverables: ${deliverableCountText(...)}` `` with today's arguments.
   b. `checkDeliverables` returns `byCapability`: for each live product capability in ledger order, `{ id, listed, parked, madeAndRead, gapRows, countText }`, taken from that capability's own `listed`, `parkedRows` and `isMadeAndReadByCode` in the loop. `gapRows` are listed rows, in `Deliverables:` line order, that are neither in `parkedRows` nor made and read by code. `listed` and `parked` are counts (`listed.length`, `parkedRows.size`), and `countText` is `deliverableCountText(madeAndRead, listed - parked, parked)`.
   c. `deliverableReport` also returns `check`, the `checkDeliverables` result it printed from. `deliverableReportLines` is unchanged.
   d. `@outputs` names the per-capability counts and the check result `deliverableReport` returns. Not exported: `deliverableCountText`.
4. `scripts/product-report.mjs`, constants:
   a. After SECONDS_PER_DAY, exactly:
      `// contract (R-2924): the owner's 2026-10-25 page discussion picked 30 days as the age that makes an artifact stale.`
      `export const STALE_AGE_DAYS = 30;`
   b. With the contract constants (`:43-63`), a `// Contract (R-2920 to R-2925, R-2927): ...` comment and two frozen exports: OVERVIEW_BLOCKS, the five `[heading, href]` pairs (Needs you `#decisions`, Broken `#issues`, Gaps `#product`, Stale `#features`, What it does `#product`), and OVERVIEW_LABELS, every line label the must-meet's line forms name, including `no deliverable lines` and the no-recorded-run prefix. The stale label is built from STALE_AGE_DAYS, never a literal 30.
5. `scripts/product-report.mjs`, `buildReport` builds `model.overview` as finished segment lines, in the must-meet's line forms ("Line forms" under Seat decisions), with the counts, beside parts, item lines and orders the rows give:
   a. Needs you from `asks` and `parseOpenQuestions(ledgerText).length`.
   b. Broken from `violated` and `notPassed`; the failed or skipped-only split from each listed row's cited files' labels; the no-recorded-run count from implemented rows that cite at least one test file and none of whose cited files has a run state; the runtime age text from one extra descriptor passed to the existing `artifactAges` call (class clone store, location RUNTIME_AGE_KEY, that key's run and one writer from ARTIFACT_AGE_TABLE, under a key that does not start `registry:`). With no runtime data, the line reads its label, `: `, the no-recorded-run prefix and `runtimeReason`.
   c. Gaps from `deliverableResult.check`: deliverable gaps from `byCapability` (Product view order), parked from `byCapability`, notes from `check.notes.length`; artifact gaps and parks from `check.artifactConsumers`, in A-ID order. With no artifact registry, the artifact line reads `<label>: ` plus `artifacts.emptyText`; with `check.deliverableFieldLineCount === 0`, the deliverable line reads `<label>: no deliverable lines`.
   d. Stale: `artifactAges` records the whole days each measured formatter already computes (tracked, runtime map, record stores); name your shape (second map or `{ text, days }`) in the report. Counted: live features (`liveFeature`) whose `assessmentState` is out of date or unassessed, then one line of their IDs as feature segments in ledger order; live registry entries with days above STALE_AGE_DAYS, one line each in A-ID order, `A-nnn · <name> · <d> days`; beside them the live registry entries with no days, split by AGE_NOT_MEASURED_PREFIX into not measured and the rest into unknown. With no artifact registry, the artifact line reads `<label>: no artifact registry` from `artifacts.emptyText`.
   e. What it does: when `check.deliverableFieldLineCount > 0`, the count line (the first of `deliverableResult.lines`), then one line per `byCapability` entry, `<CAP-nn> · <label>: <countText>`; otherwise the one line `no deliverable lines` and no stage line.
   f. `@outputs` names the Overview.
6. `scripts/product-report.mjs`, `renderInto`: `views[""]` and the fallback become `"overview"`; add `"#overview": "overview"`; remove `"#shared"`, the Shared title, tab and branch (`:490`); the title map and nav gain Overview first. The overview branch prints each block as an `h3` holding one `a` with the block's `href` and heading, then one `li` per line through `renderSegments`, reading only `model.overview`. An empty `artifactFeatures` list renders `paragraph(card, label, "none")` and no list.
7. A new `packages/nana-pack/tests/report-fixtures.mjs` with the six-tag header, holding the moved helpers with their temp folder passed in. The moved `treeFixture` takes an options-passing git runner and an optional first-commit date, in `historyFixture`'s form, so `commitAt`'s dates hold. It calls no `tmpDir`.
8. A new `packages/nana-pack/tests/product-overview.test.mjs` with the six-tag header. It imports `tmpDir` with its exact line, its helpers from `./report-fixtures.mjs`, and the module's constants by name. Tests, each with its `// req:` marker directly above and exactly the title and fixture the must-meet gives:
   - `R-2920: the overview is the landing view and first tab, unknown and #shared hashes render it, and its five blocks come in order with links to their views` — `// req: R-2920`
   - `R-2921: Needs you counts asks as blocking, optional and parked, lists each blocking ask's title in file order, and counts the open questions the Decisions view lists` — `// req: R-2921`
   - `R-2922: Broken names the violated rows and the implemented rows that did not pass, split into failed and skipped only, beside the rows with no recorded run and the runtime data's tip` — `// req: R-2922`
   - `R-2923: Gaps names the unparked deliverables code does not make and read and the artifacts with no declared reader, each beside its parked count, and counts the checker's notes` — `// req: R-2923`
   - `R-2924: Stale counts live features' out-of-date and unassessed assessments, and artifacts older than the stale age before HEAD's commit time, beside the not-measured and unknown counts` — `// req: R-2924` (both repositories in one check)
   - `R-2925: What it does shows the checker's count line and one line per live product stage whose counts add up to it` — `// req: R-2925`
   - `R-2927: with no runtime data, no artifact registry or no deliverable lines, each overview line that reads it names the missing input in place of a count` — `// req: R-2927` (both fixtures in one check)
   - `R-2794: a capability card whose list has no item shows its label with none and no empty list` — `// req: R-2794`
   - `seal: the overview's stale age is 30 days` — `// req: R-2924`; only this check writes the literal 30.
   R-2923 and R-2925 compare against the tree checker CLI run on the fixture, as R-2543's check runs it (`product-report.test.mjs:1345-1346`).
9. `packages/nana-pack/tests/product-report.test.mjs`, exactly the must-meet's "Expected existing-test changes" and no other edit: `:346` `render("#decisions")`; `:370` `render("#overview")` with the title `feature IDs link to their detail views in product, features, overview and detail views`; `:374` `render("#overview")`; `:396-401` the Overview `h2` and all five OVERVIEW_BLOCKS headings in place of the ask-body clause, titled `unknown prototype hashes render the Overview`; `:450` `{ hash: "#decisions" }` plus a second no-hash call on a model holding one Needs you line with the hostile title `<img onerror=alert(1)>`, both inside the same check, which also requires that title as text; `:1117`, `:1141`, `:1148` gain `"#decisions"`; `:1328` takes `, 1 more parked`; moved helpers imported from `./report-fixtures.mjs`.
10. `packages/nana-pack/tests/requirements-tree.test.mjs:523` and `:532`: `, 2 parked` and `, 1 parked` become `, 2 more parked` and `, 1 more parked`. No other change to that file.
11. `packages/nana-pack/skills/requirements/SKILL.md`: at `:127`, "ends with `, <n> parked`" becomes "ends with `, <n> more parked`". At `:125`, after "Keep the `## Open questions` heading for unresolved owner decisions.", add: "Move a closed question, with its number and note, under a `## Closed questions` heading below the open ones; the product report lists only the open ones." At `:129`, add one sentence first: "The product report opens on an Overview: what needs the owner, what is broken, maker and reader gaps, stale or unmeasured ages and each stage's deliverable count." Write no backticked file name in a new sentence.
12. `README.md:271`: say that the page opens on the Overview and name its five blocks; that an artifact counts as stale past 30 days, counted to HEAD's commit time; that closed questions under `## Closed questions` stay off the page; and drop any Shared view mention. Fix the README, never the checker.
13. `npm run map` and `npm run req:tree` regenerated; every new or changed module header current.

Keep every escape sequence in test literals intact: a `\n` inside a string passed to a child, or a `\\n` inside generated source, stays as written; an unescaped one passes on macOS and breaks the Windows leg. Build fixtures in linear time: no quadratic string building or per-line rescans over large ledgers. Write no home path and no absolute user-folder path into any committed file; tests build paths from their temp folder. Do not run the install check; this lane has none. Do not push.

Try each red case by hand on macOS, see the named check turn red, restore, and say so in your report; do not commit them:
- `views[""]` back to `"decisions"` → R-2920.
- a `"#shared": "shared"` entry put back in `views` → R-2920.
- the renderer reading OVERVIEW_BLOCKS from module scope → R-2920.
- Needs you listing every ask's title → R-2921.
- blocking asks sorted by since-date → R-2921.
- `parseOpenQuestions` breaking only on `# ` → R-2921, R-1570.
- the overview's not-passed list keeping only FAIL rows → R-2922.
- the split counting every row as skipped only → R-2922.
- the runtime age text left off the not-passed line → R-2922.
- deliverable gaps ignoring `parkedRows` → R-2923.
- artifact gaps from the page's `readIds` and `referencesFor` join → R-2923.
- the deliverable note count dropped → R-2923.
- Stale comparing with `>=` → R-2924.
- days recorded only in the tracked formatter → R-2924.
- the not-measured and unknown counts merged → R-2924.
- the `liveFeature` filter dropped → R-2924.
- a constraint capability given a stage line → R-2925.
- the registry guard dropped from the artifact gap line → R-2927.
- What it does taking `deliverableLines[0]` without the field-line guard → R-2927.
- an empty list rendering its label over an empty list → the new R-2794 test.
- the suffix back to `, <n> parked` → R-2639, R-2642.
- STALE_AGE_DAYS set to 31 → the seal and R-2924.

Checks before your one commit: `npm test --` with each of product-overview.test.mjs, product-report.test.mjs, requirements-tree.test.mjs, requirements-deliverables.test.mjs, requirements-moved.test.mjs, runtime-land.test.mjs, linked-launch.test.mjs, templates-render.test.mjs and test-runner.test.mjs; then `npm run test:locked` whole, with its output kept out of the worktree; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`, and `node scripts/requirements-tree.mjs --root .` must print `deliverables: 21 of 21 made and read by code, 21 more parked`; `node scripts/known-bugs.mjs --root .`; then `git status --short` must print nothing after the commit.

Seat check: `node docs/reviews/page-overview-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Render the real page once: `node scripts/product-report.mjs --out <a file outside the worktree>`, then render its empty hash through `renderHtmlAt` from `report-fixtures.mjs` and print the Overview's text lines. Confirm the first screen holds the five blocks in order with the counts the rows give. Measure the page's size, and the size of a page written the same way from main's e4d29927 checkout or from the worktree before your change.

Commit once, at the end, with explicit paths (`git add <path> ...`, never `git add -A` or `.`).

Done: the seven rows, their tests, the R-2794 test and the seal exist and pass; R-2794, R-2639 and R-1019's evidence read as the must-meet says; the five closed questions sit under `## Closed questions` and the page lists 21; the page opens on the Overview with no Shared view; the tree checker prints `21 of 21 made and read by code, 21 more parked`; every red case fails by hand; the map, readme, trace, tree and known-bugs checks are green; the full suite is green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 20 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; product-overview.test.mjs's and product-report.test.mjs's run times on macOS; the full suite's summary line; the tree checker's deliverables line; the rendered Overview's text lines; the page's size before and after; each moved helper; your ages shape; any word you changed in a line label; map, readme, trace, tree, known-bugs and seat-check status; any departure from the Precedent files or the must-meet, with its reason.
