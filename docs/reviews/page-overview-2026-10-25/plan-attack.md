# page-overview · adversary pass on the plan draft (main e4d29927)

Counts: 1 MUST, 5 SHOULD, 9 NOTE. Evidence paths are repo-relative. `pd:` is `<scratch>/lanes/page-overview-plan-draft.md`. The page model numbers come from `<scratch>/page-overview/page-e4d29927.html` (its report-data JSON), from `node scripts/requirements-tree.mjs --root .`, and from a read-only `checkDeliverables` call. Everything below was read at e4d29927. Nothing in a repository was written.

## Checked and clean

- **File:line claims that hold.** I opened each of these, and each says what pd says:
  - product-report.mjs:32-33, :44-46, :64-65, :115-116, :123-143, :173, :174, :200-212, :233-342, :358, :359, :368-371, :401, :404, :441-445, :450-468, :490, :494-495, :699, :704, :705-722, :745, :805-811, :817-831, :898, :901 and :905;
  - deliverables.mjs:359-500, :490-498, :504-704, :532, :541, :546, :687-688, :703, :707-733 and :728;
  - handoff-asks.mjs:11-28; frontier-check.mjs:88; scripts/test.mjs:89 (300 s); test-locked.mjs:192-198;
  - REQUIREMENTS.md:267, :269, :2224-2227, :2286, :2781, :2796, :2801, :2816, :2825, :2836, :2839, :2843 and :3029-3037;
  - HANDOFF.md:16, :17, :23 and :29; SKILL.md:129 and :140; README.md:271;
  - product-report.test.mjs:59-68, :69, :74-82, :83-88, :102-108, :161-171, :172-185, :218-237, :268-282, :346, :370, :374, :396-401, :1097-1129, :1117, :1141, :1148, :1284, :1328, :1340-1366 and :1478-1500;
  - requirements-tree.test.mjs:523, :532 and :534; requirements-deliverables.test.mjs:719; review-movement.test.mjs:31-40; ledger-repo.mjs:1-12; land-fixtures.mjs:1-8.
  The slips are in item 15.
- **The numbers.**
  - The checker prints `deliverables: 21 of 21 made and read by code, 21 parked` with no notes. `checkDeliverables` gives 42 listed and 21 parked.
  - The per-stage figures in pd's Page effect add up to 21 made and read and 21 parked, over 6+6+6+5+5+8+6 = 42 listed.
  - The artifact consumer join gives 80 live entries, 0 gaps and 2 parked. The 2 parked are A-057 and A-059.
  - Asks are 29: 1 blocking, 26 optional, 2 parked. Open questions are 26, and exactly 5 carry `(closed` (2, 3, 4, 5, 9). The part-closed ones (6b, 14, 18, 22) and the "RULED" one (7) have no `(closed`.
  - 5 rows are violated and 6 did not pass. 34 assessments are out of date and 1 is unassessed (FEAT-039 itself).
  - 33 of 80 artifact ages are measured and 47 are "not measured". None reads "unknown" today. 6 entries are older than 30 days: A-039 to A-042, A-074 and A-075, each at 46 days.
  - The Windows CI record for e4d29927 gives product-report.test.mjs 142.8 s.
- **IDs.** R-2920 to R-2926 are free on main, in every worktree under ~/nana-pi-wt, and in the scratch lane drafts. No worktree branch touches product-report.mjs, deliverables.mjs or requirements-tree.mjs.
- **Readers of the count line and the page.**
  - No code parses the count line. Its readers are the three test literals pd names, the two prefix regexes pd names, R-2639's text, FEAT-028's known-bug line, and SKILL.md:127 (item 6).
  - No template, bin script, extension, desk code or nana-land code reads the line or the page.
  - test-locked.mjs imports the page inside try/catch (R-2742). A page bug writes a note and cannot stop a land.
- **Asks.** `TAG` accepts only blocking, optional and parked, and lowercases the kind. buildReport refuses an ask whose tag and title disagree (:623-627). So the three kind counts always sum to the ask total.
  - Several `Open for <name>` sections flatten into one list (`isNamed`).
  - `scanListSections` splits on `\r\n|\r|\n`, so a HANDOFF with CRLF line ends parses the same.
- **Detached HEAD and Windows.** Every age and the commit date come from `HEAD` (`rev-parse`, `log -1`, `show -s`). No branch name is read, so a land on a detached HEAD builds the same page. A Windows build differs only in the runtime labels, which pd already lists as a known limit.
- **Size and render time.**
  - The model is 2,206,048 bytes, and the `features` key takes 2,001,093 of them.
  - The overview adds about 25 lines, roughly 3 to 6 KB. Dropping Shared removes only renderer code, because the Shared view had no data of its own.
  - The first paint still parses the whole JSON. No change.
- **Class and ladder.** Ordinary holds. nana-land, pi-review, claude-review and review-round import neither changed module.
  - One adjacency: scripts/requirements-moved.mjs:14 imports `artifactConsumers`, `artifactReads`, `artifactRegistry` and `deliverableFieldLinesByRow` from deliverables.mjs. Both review launchers run it at every review. pd changes none of those four. A load error would only make the launchers print `tree movement: not computed:`, never refuse.
  - The builder (openai-codex) and the reviewer (claude-code opus) come from different model lineages.
- **The String() rule.** The plan puts finished text in `model.overview` and renders through `renderHtmlAt` (vm). A module-scope read inside `renderInto` therefore throws in every overview check, as pair 4 needs.

## Findings

1. **MUST: on a missing input, the overview prints zeros that read as healthy. Every other nana project hits this today. The Broken block also has no unmeasured count beside it, which breaks pd's own stakes rule.**
   - pd's stakes line says "every count therefore carries its parked or unmeasured count beside it". The not-passed count has no such count. The plan's threat model says that with no runtime data "the legend says so". But that legend appears only on Issues, Requirements and detail (:492, :507, :488), and no overview block carries it.
   - The overview lines with nothing defined for a missing input:
     - **No runtime data.** Broken prints `Did not pass …: 0`. Other projects have no runtime map, because only nana-pi's locked suite writes one. So every other project's first screen says nothing failed.
     - **No artifact registry.** `artifactConsumers` returns an empty map. Gaps then prints `Artifacts with no declared reader: 0 · parked: 0`, and Stale prints `Artifacts older than 30 days …: 0 · age not measured or unknown: 0`.
     - **No deliverable lines.** The checker prints no count line when `deliverableFieldLineCount` is 0 (deliverables.mjs:728). That holds for kindless ledgers, and for a product capability with a `Deliverables:` list but no claims (product-report.test.mjs:1334, `product-no-lines`). R-2925 is scoped `WHEN the ledger has deliverable lines`, so the What it does block is undefined there. A builder that prints `deliverableLines[0]` would show a note as "the count line". In `product-no-lines` a stage line `0 of 1` would also sum to a count line that does not exist.
   - HANDOFF.md:19 says other projects gain capability lines in place, one session each. Until they do, three of the five blocks read as clean in each of them, and pd's stakes line says they get the overview at once.
   - Fix: add one row and one test.
     - Proposed row R-2927: "IF the product report has no runtime data, no artifact registry, or no deliverable lines, THEN each Overview line that reads that input shall say which input is missing in place of its count."
     - Wording: `no recorded run: <runtimeReason>`, `no artifact registry` (reuse the existing text at :706 and :834), and `no deliverable lines`.
     - With runtime data, add a beside count to the not-passed line: `· implemented rows with no recorded run: <n>`, computed by `uniqueFilesOf` and `runStateOf`, the helpers `notPassed` already uses. Add the runtime map's measured tip and commits before HEAD, which A-032's age text already holds.
     - Fixtures: a kindless `treeFixture` with no runtime file, plus the `product-no-lines` ledger.
     - Red: any of these lines printing `0`; a note printed as the count line; a stage line printed with no count line.
     - Add the case to the known limits only if the seat rejects the row.

2. **SHOULD: five listed red cases cannot go red with the fixtures pd gives.**
   - **R-2921, "blocking titles sorted by date or title".** The fixture's blocking asks are B then D. B already sorts before D, and pd gives no dates. Fix: give the first blocking ask the later date and the later title, for example "Zeta" since 2026-02-01 before "Alpha" since 2026-01-01.
   - **R-2924, "the beside count missing when it is the only nonzero number".** The fixture has one stale entry, so a build that prints the beside count only when something is stale still passes. Fix: add a second history whose HEAD sits within 30 days of every tracked commit. Assert the not-measured and unknown counts still print.
   - **R-2922, "the same rows the Issues view lists".** The fixture has only a FAIL row. A build that lists only FAIL rows still passes, yet today's six real rows are all SKIP-only. Fix: add an implemented row whose only cited file is SKIP (listed), and one whose file has no recorded run (not listed). Pair: "Broken lists only rows with a FAIL label".
   - **R-2924, measured classes other than tracked.** pd records days from three formatters (:200-212), but the fixture has only tracked entries. A build that records days only in `formatArtifactAge` still passes. It would move the runtime map and both record stores into "not measured or unknown". Fix: add a runtime-map entry whose `measuredAt` is more than 30 days before HEAD with its tip in history (`writeRuntimeFile`), and assert it is listed. Pair: "days recorded for tracked entries only".
   - **R-2925, two cases that cannot fail.**
     - "Document order in place of Product view order" cannot fail. The sort at :813-816 is stable and puts live product capabilities in group 0, so their Product view order is their document order. Drop the case, or reword the row as document order.
     - "A stage line formatted apart from `deliverableCountText`" is a code-shape property that no output test can see. Drop it from the red list. The sum check already catches a different format.

3. **SHOULD: pd does not list two existing checks that change once the landing view moves. One of them silently stops covering R-1019.**
   - product-report.test.mjs:450 calls `renderInto` with no hash, and its model has no `overview`, `questions` or `notPassed`. After the change it renders the Overview.
     - If the renderer guards `model.overview` (the `?? []` style at :410), the hostile ask title and body never render. "Renderer inserts all dynamic strings only through text nodes" then passes on an h1, a paragraph and a nav, and R-1019's renderer check goes almost empty.
     - Without a guard, the check throws.
     - Fix: pass `{ hash: "#decisions" }` there. Add a second call that renders the Overview with a hostile blocking-ask title, because Needs you now prints HANDOFF titles. List :450 in "Expected existing-test changes".
   - :396-401 also requires `model.asks.every((ask) => carries(view.text, ask.body))`, and the Overview prints no ask bodies. pd says only that the check "expects the Overview heading". Fix: name the clause that replaces the ask-body clause, for example all five block headings present, so the edit does not loosen the check.

4. **SHOULD: on every Mac page, Broken shows six Windows-only skips as rows that did not pass.**
   - All 6 of today's not-passed rows (R-1064, R-1058, R-1063, R-1330, R-1713, R-1340) are SKIP-only. They cite the one Windows-only file, whose label is SKIP on this Mac.
   - The brief told the owner "none is a live failure". The first screen's Broken block would still say 6 under a heading that means broken. A block that alarms on every build teaches its reader to skip it.
   - Fix: split the line by the label the model already holds: `Did not pass …: 6 · failed: 0 · skipped only: 6`. A row counts as failed when any cited file's label is FAIL, and as skipped only otherwise. Put the split in R-2922 and its test, using the SKIP-only row from item 2. Pair: "the split counts a FAIL row as skipped".

5. **SHOULD: the beside count merges unmeasured by design with a failed measurement.**
   - `age not measured: <class>` is by design (R-2791), while `age unknown: <reason>` is a failed measurement.
   - In a shallow clone, or when git cannot read history, all 30 tracked ages become unknown (:264-267, :272-273). The overview would then print `0 · age not measured or unknown: 80`. The failure hides inside a count that is normally 47.
   - Fix: print two numbers, `· age not measured: <m> · age unknown: <u>`. The R-2924 fixture already has one of each (A-003, A-004). Assert 1 and 1. Pair: "the two counts merged".

6. **SHOULD: SKILL.md:127 still states the old suffix.**
   - It says "The count line leaves a parked deliverable out of its total and ends with `, <n> parked`."
   - pd edits SKILL.md:129 only. No claim check reads this sentence, so it would stay wrong in the skill every project loads.
   - Fix: change it to `, <n> more parked` in the same change as R-2639.

7. **NOTE: the must-decide mark. Subtraction agrees with the `blocking` tag, but two supports in pd are weaker than stated.**
   - frontier-summary.test.mjs:129 is one cap test's fixture, whose asks happen to be titled "Must decide 0..2". It is not a rule that frontier tests name blocking asks that way.
   - The three-ask cap is a convention. No code enforces it; frontier-check.mjs has no count of blocking asks.
   - What being wrong costs: suppose the owner meant a decision that holds no work. A separate mark then changes the HANDOFF grammar, frontier-check and the frontier hook, which makes it a hook-class lane, not a one-predicate edit.
   - Fix: keep pd's choice, and ask the question with a one-word default in the land report: "Must decide is the blocking tag? Default: yes". pd already plans this; keep it as one sentence.

8. **NOTE: the stale list and the assessment count include items nobody will act on.**
   - The six stale entries are the recorded results of one finished study: tool-profiles-2026-09-08 under CAP-08, where every deliverable is parked. They will stay on the first screen and grow older each day.
   - 7 of the 34 out-of-date assessments belong to frozen desk features.
   - `features` also holds retired and proposed features, and Stale would count them as unassessed. There are none in nana-pi; other projects may have them.
   - Fix: limit the assessment count to live features with `liveFeature` (:777), or say so in R-2924. Add a known limit naming the study records. A parked-beside count for stale entries would need the deliverable join, so leave it out (subtraction).

9. **NOTE: the overview's Gaps block can read 0 while the same page shows something that looks like a gap.**
   - The Artifacts view lists 20 entries under "Artifacts no other feature reads and no deliverable names", while the overview says `Artifacts with no declared reader: 0`. The owner picked option 2 from a brief that promised "21 artifacts no other feature reads" in Gaps, and he will see 0.
   - The Product view marks a deliverable `· gap` when its row is not implemented (:796). R-257 and R-264 carry that mark today. The overview's gap is "not made and read by code", which is a different test. An unparked, untested deliverable that code makes and reads gets a gap mark on its card and is absent from the overview.
   - The overview counts none of the checker's notes. R-2730 pins zero notes for nana-pi, but another project can have many.
   - Fix: one land-report sentence on why 21 became 0 (declared readers, from the artifact-readers lane). Optionally add `· deliverable notes: <n>` to Gaps. Optionally rename the Product view's mark in lane two.

10. **NOTE: defect 3 has a zero-code alternative.**
    - `parseOpenQuestions` stops at the first line starting with `#` (:131). Moving the five closed entries under a new `## Closed questions` heading below the open ones takes them off the page and keeps their numbers and notes.
    - That needs no R-2926, no `CLOSED_QUESTION_MARK` and no R-1570 narrowing.
    - The trade: it asks the writer to move an entry rather than write `(closed`, the habit all five closures already follow. Either way the writer has to do something. This is the seat's call.

11. **NOTE: tunables, exports and headers.**
    - The proposed label `Artifacts older than 30 days before HEAD` must build its number from `STALE_AGE_DAYS`. A literal 30 in the label means a retune changes two places.
    - "`deliverableCountText` … in-module extraction, not a move" does not say how the page's stage lines reach it. Either export it (a named import into product-report.mjs) or have `byCapability` carry finished text. Name the choice in the brief.
    - The `@outputs` lines of product-report.mjs and deliverables.mjs should name the overview, and the result `deliverableReport` now returns. report-fixtures.mjs needs the six-tag header, as ledger-repo.mjs has.

12. **NOTE: fixture mechanics the brief should state.**
    - `treeFixture`'s `git` takes only `args` (:64). `commitAt` passes `{ env }` with the dates (:179-184), so the dates are dropped on a `treeFixture` repo and every commit lands at wall-clock time. R-2924 would then fail in a confusing way, not pass falsely. Move `treeFixture` with an options-passing runner, or build the R-2924 repo from `historyFixture`'s runner.
    - Fix the order of the stale and gap item lists, by ID as the Artifacts view sorts (:836). R-1012's same-output rule holds either way, but the tests should pin the order.
    - Optionally give R-2921's fixture one `[Blocking, …]` tag in capitals and a second `## Open for <name>` section.

13. **NOTE: Needs you counts 21 ledger questions, while HANDOFF.md:45 says about eight wait for the owner.** The rest are reviewer residuals and seat notes. Label the count `open questions in the ledger`, not something that reads as 21 decisions for him.

14. **NOTE: the HANDOFF note drops a blocking ask partly by inference.** pd removes "The page discussion" (HANDOFF.md:23), which also carries "the artifact assessment asks eleven questions", on the inference that the discussion answered them. Check the discussion record for those eleven before removing it. Otherwise one unrecorded open item leaves HANDOFF.

15. **NOTE: some line claims are wrong or loose. The conclusions stand.**
    - The String() comment is at product-report.mjs:112-114, not :111-113 (line 111 is blank).
    - The not-measured branch runs :240-244, not :240-242. The contract constants run :43-63, not :43-62. The ask parse runs :621-627, not :622-628.
    - The Artifacts view model runs :832-897, not :839-884. Flow entries start at :839, the cards end at :886, and the lists sit at :891-894.
    - pd says the frontier checker "refuses an untagged ask" (frontier-check.mjs:88). That checker reports; only the page refuses (R-1030).
    - pd says R-1015's evidence cell "follows" the :370 title change. R-1015's evidence does not cite that check, or the one at :374. Both carry only a `req:` marker, so no cell changes.
    - frontier-summary.test.mjs:129: see item 7.
