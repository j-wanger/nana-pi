# page-detail · adversary pass on the plan draft (lane one at ccf3ad60; main e4d29927)

Counts: 1 MUST, 4 SHOULD, 10 NOTE.

`pd:` is `<scratch>/lanes/page-detail-plan-draft.md`. Code was read at ccf3ad60 in `<scratch>/po2-src`; paths below are repo-relative. Page numbers come from the report-data JSON in the planner's render, `<scratch>/pd2/page-ccf3ad60.html`, read by throwaway scripts under `<scratch>/pd2-attack/`. Lane one's later commits were read with `git -C ~/nana-pi diff ccf3ad60 47c3419d`. No test or npm script ran, and nothing in a repository was written.

## Checked and clean

- **File:line claims that hold.** I opened each of these, and each says what pd says:
  - scripts/product-report.mjs:6, :43-83, :190-192, :254-367, :395-396, :457-467, :486-505, :489-493, :507-525, :523-524, :736, :742, :743-760, :755, :761-787, :790-796, :797-814, :826-835, :833, :855-869, :870-934, :872, :875-902, :905, :908, :928, :945-985, :955-957 and :1030;
  - scripts/deliverables.mjs:319-343, :345-356 and :692-696;
  - product-report.test.mjs:82-111, :112-114, :115-125, :139-143, :144-152, :246-261, :279, :1163-1217, :1189, :1212, :1218-1246, :1234, :1243, :1286-1317, :1304-1308, :1313, :1357, :1384, :1387, :1406, :1411, :1420-1446, :1433, :1442, :1444, :1447-1460, :1461-1476 and :1472, plus all 23 age-check rename sites from :1513 to :1770;
  - product-overview.test.mjs:16, :27-34, :49-51, :124 and :174; report-fixtures.mjs:1-8, :27-38 and :62-97;
  - REQUIREMENTS.md:2217, :2224-2227, :2764, :2781, :2795, :2796, :2801, :2814, :2821, :2824-2826, :2832, :2835, :2839-2843 and :2850;
  - SKILL.md:129 and :140; packages/nana-pack/README.md:30; README.md:271; scripts/test-locked.mjs:192; docs/known-bugs/FEAT-039.md:42, :67, :68, :70 and :71 (at ccf3ad60; see item 8).
  The slips are in item 13.
- **The numbers.** I re-derived them from the page model, and they match pd:
  - 80 live cards; lists of 20 and 37 items; 42 deliverables over 25 home features.
  - 38 direct artifact lines, 31 of them naming an entry the home feature registers itself. FEAT-013 has 11 cards.
  - Reader parts: 15 person only, 11 code only, 16 other. One-line lengths run 106 to 165 characters.
  - Flow model 12,292 bytes; list-two reasons 3,731 bytes; card `Made in` feature segments about 7,962 bytes.
- **Facts that move rather than vanish (attack 1).**
  - Every live entry has a maker feature. An `Artifact:` line outside a `FEAT-` heading's own span becomes a note, never an entry (deliverables.mjs:175-177). That covers a line under a subgroup or a capability heading.
  - An entry under a constraint capability keeps its card: A-010 is registered in FEAT-009 under CAP-03.
  - A deliverable cannot be homed outside the capability that lists it, and no row can be listed twice. Either one is an R-2442 tree problem (REQUIREMENTS.md:2272), and buildReport refuses on tree problems (product-report.mjs:641-642). So each deliverable gets exactly one block.
  - A retired home feature still has a detail view, because `features` maps every FEAT heading (:761).
  - A parked deliverable keeps its `Parked:` claim in its block and gains `parked` on its line.
- **pd's "claim most likely wrong" holds.** All 25 renamed sites run on single-feature fixtures: historyFixture's productLedger homes everything in FEAT-085, and R-2792's first repo homes everything in FEAT-092. So `onlyArtifactAge` can safely read the first block line across all detail pages.
- **Existing checks that stay green.**
  - product-overview.test.mjs:124 moving to `#FEAT-001` works: that fixture's five entries are registered in FEAT-001, and their card lines carry both age prefixes.
  - R-2802 reads only `feature-artifact-line` nodes (:1484-1485), so cards must keep their lines unclassed.
  - R-1015's order check (:283) reads first occurrences from the header and the last `Requirements`, so sections after `Shared rows` keep it green.
  - R-1041: FEAT-039 gains one classed `ul` for R-1014's four claims, and the three assessment lists carry no class (:394). pd's narrowing keeps the invariant.
  - R-2542's existing clauses hold on the new line. R-5000's plain-path third part gives it a day count, so the not-written-down text stays off its line. R-5001 to R-5008 name nothing, so their age part is NO_ARTIFACT_NAMED.
- **No third list (attack 5).** I agree with the subtraction. The brief's option 2 says the tab keeps "only its two action lists". The Overview's Stale block already counts the not-measured and unknown entries.
- **Class and ladder.** Ordinary holds.
  - No file under packages/nana-pack/bin, lib or extensions imports either module, and neither does packages/nana-setup. The only hit is a frozen skill-copy fixture.
  - The roster prints builder openai-codex gpt-6-luna high, largerBuilder openai-codex gpt-6.1-sol high and reviewer claude-code opus. The builder and the reviewer come from different model lineages.
- **R-1012 and size.**
  - Every new list has a fixed order and reads no new input.
  - With one copy of each model part, the page shrinks by about 10 to 18 KB net. The `features` key holds 2.0 MB of the 2.17 MB model, so the change is under 1%.
  - The render cost is unchanged in kind.

## Findings

1. **MUST: the deliverable block collides with `cardFor`. Two existing checks go red and one stops covering its row. pd's test list misses all three.**
   - `cardFor(view, rowId)` (product-report.test.mjs:155-157) returns the first `article` whose `h3` text starts with `${rowId} `.
   - pd's block is an `article` whose `h3` reads `<id> · <status>[ · gap]`, so it also starts with `R-1014 `. It renders before the Requirements rows, so `find` returns the block.
   - FEAT-039 homes R-1014, a CAP-07 deliverable (REQUIREMENTS.md:2217). Three checks call `cardFor(view, "R-1014")` on `#FEAT-039`, each on a copy of the real ledger:
     - **R-1511** (:684-716). `renderCard` takes the first `ol.row-tests` item, and the block has none. Every spelling result is false, so the check goes red.
     - **R-1513** (:795-799). `changedSince(itemFor("R-1014"))` gets undefined, so the check goes red.
     - **R-1515** (:838-842). `!citedCard.textContent.includes(noneText)` is true on the block, so the cited half passes without reading the row card. Coverage is lost silently.
   - pd's grep (:104) searched class names and labels, not this generic selector. Its pass list does not name these three checks.
   - Fix: narrow `cardFor` to the row card, `node.tag === "article" && node.attrs?.class === "requirement-card" && …`. `row()` sets that class (product-report.mjs:403).
     - This is one helper line, and no assertion is loosened.
     - Name R-1511, R-1513 and R-1515 in "Expected existing-test changes". The count goes from 15 changed checks to 18.
     - Add `cardFor`, `testItemsOf`, `tag === "article"` and ``startsWith(`${rowId} `)`` to the brief's grep list.
   - Alternative: give the block a heading that does not start with the row ID and a space. That rewrites R-2932's expected text instead.

2. **SHOULD: the move removes the page's only index from an A-ID to its card, and leaves some cards with no link route.**
   - Today the Artifacts view holds all 80 cards in A-ID order. After the move, the only routes to a card are:
     - a list item (57 entries);
     - a reader feature's `Reads:` line;
     - the home feature of a deliverable that names the entry.
   - Cases on today's page that lose their link route:
     - **A-040.** The Overview's Stale block lists `A-040 · study summary · 46 days` with no link (product-report.mjs:982). A-040 is in neither list, no `Reads:` line names it, and its card moves to FEAT-035.
     - **A-022 and A-021.** R-301's block on FEAT-013 names A-022, which FEAT-015 makes. R-1150's block on FEAT-014 names A-021, which FEAT-019 makes. Neither home feature has a `Reads:` line for its entry, and neither entry is in a list. Each block line names the artifact with no way to its card.
     - **A-023.** R-260's block on FEAT-025 names A-023, which FEAT-020 makes. Only the second list reaches it.
   - Fix, cheapest first:
     - (a) When another feature registers an entry, its block artifact line ends ` · made in ` plus the maker link. This is the segment form `featureArtifactLines` already uses (:755-756), and it touches three lines today.
       - R-2790 gains the clause.
       - Its fixture registers every entry in FEAT-090, so add one entry registered in a second feature.
       - Pair: "the block line drops the maker link" → R-2790.
     - (b) Each Overview stale item and artifact-gap ID links to its maker the same way.
       - This touches lane one's R-2923 and R-2924 and their exact-line assertions (product-overview.test.mjs:106, :121).
       - pd puts it out of scope, but this lane is the one that removes the index, so the fix belongs here.
   - If the seat takes only (a), keep pd's known limit for the overview and name A-040 in it.

3. **SHOULD: the reader part restates the checker's reader rule from claim text, and the two can disagree on one line.**
   - pd:29 builds the reader part from `readerClaim(claim.text)` plus "no further ` · `". But the claim text is not what the checker splits.
     - `deliverableClaims` builds `text` by stripping the row ID and a leading `·` with any spacing (deliverables.mjs:326).
     - It decides `readByCode` from `field.body.split(" · ")` with `parts.length === 2` (:336).
   - Take `Read by: R-006 ·code: read.mjs`, with one space dropped:
     - The text is `code: read.mjs`, so pd's rule prints `read by code`.
     - The split gives one part, so `readByCode` is false, and the same line also prints `not read by code`.
     - The checker notes `cannot read Read by: … expected " · "`.
   - The rule would then be decided in two places: the checker (deliverables.mjs:650-662) and the page.
   - Fix: decide the kind where `readByCode` is decided.
     - `deliverableClaims` adds `readerKind`: the kind when the label is `Read by`, the split has two parts, the kind is known and the detail is not empty; otherwise null.
     - The page lists the distinct non-null kinds in claim order. `readByCode` can derive from `readerKind` too.
     - This is a few lines in deliverables.mjs, so pd's "no change in scripts/deliverables.mjs" needs one line.
     - The class stays ordinary. requirements-moved.mjs imports other exports, and lane one's attack recorded that a load error there only prints `tree movement: not computed:`.
   - Red case: add R-006 `Read by: R-006 ·code: read.mjs` to R-2930's fixture. Expect `not read by code` and `no readable reader`. Pair: "reader kinds read from claim text".

4. **SHOULD: pd's threat model names four variations that no fixture covers, and plausible wrong code passes each one.**
   - **0 days.** R-2931's fixture gives 10, 3 and 1 days, but never 0.
     - On the planner's render, two of the eight measured lines read 0 days: R-291 (A-031, the tree outline) and R-1239. Every land commit touches REQUIREMENTS.md and the generated docs.
     - A builder's `if (largest)` would print a not-measured or unknown part there, and the fixture would stay green.
     - Add R-108, naming an entry whose file HEAD's own commit changes. Expect `0 days`. Pair: "0 days read as no day count".
   - **An unaccepted `Parked:` line.** Take the obvious implementation `!isMadeAndReadByCode(claims) && claims.some((c) => c.label === "Parked")`. It passes R-2930's fixture: R-002 is parked, R-003 is made and read, and R-001 and R-004 carry no park line.
     - On a real page, that line would say `parked` while the Overview's Gaps block lists the same row.
     - Add R-005: manual, a person reader, and `Parked: R-005 · owner holds it` with no date. Expect no `parked`.
     - Pair: "parked from any Parked: line on a row code does not make and read".
   - **A dead ID.** pd:31 counts an ID with no live entry as unknown, but no fixture names one.
     - Code that skips dead IDs prints `artifact not written down`, while the block says `artifact A-999 · no live entry`.
     - Add R-109 naming `A-999`. Expect `age unknown`. The checker notes the dead ID, and the page still builds. Pair: "a dead ID is not named".
   - **A feature with cards and no deliverable.** Code that draws `Deliverables` whenever a feature has blocks or cards passes R-2932's fixture. FEAT-001 has both, FEAT-002 has blocks only, and FEAT-003 has neither.
     - Add FEAT-004, registering A-003 with no deliverable. Expect `Shared rows`, then `Registered artifacts`, card A-003 and `Requirements`.
     - Pair 16 then becomes "the Deliverables heading drawn over cards only".

5. **SHOULD: the extended R-1019 check can pass without rendering a block.**
   - pd:92 says the predicate covers all three calls and requires the hostile text.
   - Today's predicate (:368) is weaker than that:
     - It requires `made.some(...)` once, and the first call already meets that.
     - It requires `root.children.length > 0`, which any render meets.
   - So a third call whose hand-built model misses a key the block code reads, behind a `?? []` guard, renders no block. Pair 33 then survives. Lane one's attack (item 3) found the same gap.
   - Fix: record `const before = made.length` before the third call. Then require among `made.slice(before)` a hostile text node, an `article` of class `deliverable-block` and one card `article`.

6. **NOTE: the age now shows three times, and two of them sit on one page. The brief listed this exact repeat as a finding.**
   - The brief's evidence (brief.md:93) reads "Age repeats: the deliverable block and the card show the same age text, by R-2799".
   - After the move, the full text sits twice on one detail page for 31 of 38 direct lines. The Product line adds the day count as a third copy.
   - pd's land-report question ("Default: later") is the right handling, because the cut changes seven age rows' checks.
   - Word the question as a repeat the brief said option 2 would cut, not as a new limit.

7. **NOTE: three repeats a subtraction pass would question. Each is the seat's call. Record the reason for each.**
   - **`not read by code` repeats the reader kinds.** The mark appears exactly when the kinds hold neither code nor prompt, so one line reads `not read by code · read by person`. Dropping the mark from the line changes R-2542 and its exact-mark assertion.
   - **The `Registers:` index repeats the card headings below it on the same page** (R-2802).
   - **List two's reason.** The brief cut it as a repeat of the card on the same tab. Once the cards leave the tab, it repeats nothing there. It is also the fact the owner decides on for that list.

8. **NOTE: lane one has moved on to tip 47c3419d, and pd's notes trail it.**
   - Lane one deleted known-bug line 19. pd's FEAT-039.md lines :42, :67, :68, :70 and :71 are now :41, :66, :67, :69 and :70.
   - Lane one added two lines that this lane makes false:
     - "the Product view's repeats, the artifact cards and the flow lines stay until lane two": delete it.
     - "Gaps names parked items by count only; the Product view still shows them in full": reword it. The Product line now marks each parked row, and its claims sit on the home feature.
   - The parked-mark line (pd's :42) also says "a parked deliverable keeps both code marks", which stays true. Reword it rather than delete it.
   - Lane one moved `docs/product-report/page-overview-build.md` to `docs/reviews/page-overview-2026-10-25/build-2-checks.md`. pd's evidence-file precedent is gone, so put the builder's evidence in this lane's folder.
   - pd's HANDOFF wording already matches lane one's tip, where item 5 reads "Page lane two comes next."

9. **NOTE: regenerate the map and the tree outline in build 1, not only after a merge of main.**
   - docs/code-map.md:667 holds product-report.mjs's `@outputs` text.
   - Test folders are mapped roots in code-map.config.json, so product-detail.test.mjs is a new mapped module. product-overview.test.mjs's imports change too.
   - docs/requirements-tree.md lists each capability's row IDs, and the three new rows change CAP-07's line.
   - code-map.test.mjs and requirements-tree.test.mjs check both files in the suite.

10. **NOTE: some vocabulary would be defined twice.**
    - DELIVERABLE_LINE_LABELS's `parked`, `age not measured` and `age unknown` repeat OVERVIEW_LABELS (:74, :82).
    - `output only` repeats the inline `"output only, "` at :810.
    - Keep one definition of each, and have :810 read the new name.

11. **NOTE: retiring R-2800 also drops a checker guarantee the owner did not retire.**
    - The row ends "with the tree checker reporting no problem for a read toward an earlier capability". pd lists this as a known limit.
    - A cheap way to keep it: R-2933 carries that clause alone, and its test is the deleted check's CLI half (:1454, `cli.status === 0 && cli.stderr === ""`) on artifactFlowLedger. Otherwise keep the residual.

12. **NOTE: row wording.**
    - **R-2930.** "Claims the tree checker reads" is wider than the test, and it is not the checker's set. The checker notes a test-file or untracked reader path but still counts it as code-read. Write the rule out instead: a `Read by:` claim with exactly one part after the row ID, a known kind and a non-empty detail.
    - **R-2931.**
      - State the text form, `<n> day` or `<n> days`.
      - Replace "when another named one has no day count" with "when a named entry or path has no day count and not every one is never aged, an ID with no live entry included".
    - **R-2932.** Say "listed by a live `Kind: product` capability". The Product view does not draw a retired product capability's list, so "Product view order" is undefined for it.
    - **R-2542.**
      - The new text keeps "artifact not written down when no maker claim names one", while R-2931 prints `output only` for a row with only a built-from list. Say "names no entry, built-from list or path".
      - Its edit could also assert that FEAT-052, which shares R-5000 and R-5001, has no block. R-2932 covers this already.

13. **NOTE: file:line slips. The conclusions stand except where item 1 applies.**
    - The cards run :906-924, not :906-927. Lines :925-934 build the artifacts object.
    - The Stale block computes its counts at :967-970 and renders them at :980-982, not :968-971.
    - The checker's reader acceptance runs deliverables.mjs:650-670, and the empty-detail note sits at :662.
      - pd calls :650-660 "the checker's own test", but that range is checker code, not a test.
      - readerClaim runs :79-92.
    - R-1019's block runs :361-369, and R-1040's check is at :276.
    - pd:104 says the greps "found no other hit that the move breaks". Item 1 shows otherwise.

14. **NOTE: name the model shape.**
    - Say where blocks and cards live, and keep one copy of each. Suppose capabilities keep `claims` and `artifactLines` while features gain copies of them. Then the page grows by about 24 KB instead of shrinking.
    - Compute the block and card lookups inside the detail branch.
      - The hand-built model at product-report.test.mjs:366 has no `capabilities` and no `artifacts`.
      - A lookup at the top of `renderInto` would throw there and stop the whole file.

15. **NOTE: the `page` helper move.**
    - product-overview.test.mjs calls `page(repo, name)` ten times.
    - Pass the folder through a local wrapper, as product-report.test.mjs:19-20 does for `treeFixture` and `commitAt`. Then the edit stays on the import lines.
