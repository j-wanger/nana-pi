# page-detail · must-meet of record (seat, 2026-10-25)

Feature: FEAT-039 · See the product and its decisions in one report

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 1 MUST, 4 SHOULD, 10 NOTE). The draft and the attack were written at ccf3ad60; every file:line below was re-checked at 3010a7ef, page lane one's reviewed tip, which lands on main by fast-forward. Lane one's later commits changed only R-2921's fixture, HANDOFF, known bugs, sessions and its review folder, so the draft's code lines hold, with the slips the attack named (item 13) corrected here. The seat took the draft's scope and rows and every finding, in the form the seat decisions below give. MUST 1 narrows `cardFor` and names R-1511, R-1513 and R-1515. SHOULD 2 takes both parts: a maker link on a block's line for another feature's entry (R-2790), and a maker link on each Overview stale item and artifact gap ID (R-2923, R-2924). SHOULD 3 moves the reader-kind rule into `deliverableClaims` as `readerKind`. SHOULD 4 adds all four fixtures. SHOULD 5 strengthens the R-1019 predicate. NOTE 6 keeps both age texts and puts the repeat to the owner. NOTE 7 keeps the not-read-by-code mark, the `Registers:` index and list two's reason. NOTE 8 rebases the notes on lane one's tip. NOTE 9 regenerates the map and tree outline in build 1. NOTE 10 keeps one definition per label. NOTE 11 adds R-2933. NOTE 12 to 15 are taken as written. The seat also narrows R-2922's text, from lane one's final review. Plans get no review round. Where this file and the draft or the attack differ, this file holds.

The owner's decision, 2026-10-25 page discussion, from the readability brief (`<scratch>/readability/brief.md`): option 2, "Restructure", in two lanes, and this is lane two of two; the stage-to-stage flow lines retire; 30 days makes an artifact stale (sealed in lane one, R-2924); known bugs and each platform's CI on the overview come later. The brief's option 2 says: "stage cards keep one line per deliverable. The full deliverable and artifact detail moves to the owning feature's page. The artifact tab keeps only its two action lists. The flow lines retire."

Spend line: the current priority, the product report showing each deliverable's age and real reader. The page is R-1014's deliverable and the owner is its only reader (`REQUIREMENTS.md:2226`). After this lane each Product card answers the priority's test, made by code, read by whom, how old, in one line per deliverable, and the full claims, artifact lines and cards sit once, on the feature that owns them. The tree checker's line stays `deliverables: 21 of 21 made and read by code, 21 more parked`; the one checker change adds a field, `readerKind`, and changes no checker output.

Stakes: medium blast, reversible. The locked suite writes the page at every land (R-2740), and a refusal prints one note and keeps the suite's exit code (R-2742), so a page bug cannot stop a land. The real harm is a fact lost in the move: a claim, an age, a card or a link route that no view renders any more, or a Product line that no longer answers the priority's test. Every moved fact keeps its existing test, pointed at its new view, and every entry keeps a link route to its card. Other projects get the change at once through the shared script path (`packages/nana-pack/skills/requirements/SKILL.md:140`). A revert restores everything.

Threat model: honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out: a hand-planted runtime or record store, a forged commit date, a ledger crafted to break the parser. A finding outside this model is a residual. The honest variations:

- a deliverable homed in a feature's subgroup; a feature that homes several deliverables; a feature that shares a deliverable row through `Also applies:`; a feature that homes none; a feature that registers entries and homes no deliverable;
- a deliverable with no claims; a `Read by:` claim with no detail (`Read by: R-nnn · code`), an unknown kind, a missing space before its part (`Read by: R-nnn ·code: x`), two claims of one kind, kinds in mixed order, the `runtime` kind;
- a `Parked:` line on a row code makes and reads (R-2641, not parked); a `Parked:` line with no date or reason (not accepted, so not parked);
- named artifacts: one tracked entry, several with different ages, an entry another feature registers, a user-home or other-project entry (never aged, R-2791), a tracked entry at a path not at HEAD, a dead ID, a plain path, built-from entries only, none; clone stores at age-table keys; a shallow clone;
- exactly 1 day and 0 days of age (two of today's eight measured lines read 0 days);
- an entry whose maker feature homes no deliverable; a retired entry (no card); a proposed or frozen maker feature; no registry at all; CRLF ledgers;
- hostile text in names, claims, reasons, subjects, block headings and card lines;
- old bookmarks to `#artifacts` and unknown hashes (R-1019).

## Seat decisions

- **One feature, ordinary class, larger builder.** Every row sits in FEAT-039 (`REQUIREMENTS.md:2764`); new rows go after R-2927 (`:2850`). Class ordinary: no install, uninstall or doctor code, no hook or extension, no gate policy, no land or review tool. Outside tests, `scripts/product-report.mjs` and `scripts/deliverables.mjs` are imported only by `scripts/test-locked.mjs:192`, `scripts/requirements-moved.mjs:14`, `scripts/requirements-tree.mjs:13` and `scripts/code-map.mjs` (grep at 3010a7ef). The review tools run requirements-moved.mjs as a child; it imports `artifactConsumers`, `artifactReads`, `artifactRegistry` and `deliverableFieldLinesByRow`, none of which this lane changes. The land's page writer stays untouched. Builder: `pi-worker --lane-size larger`, since the lane edits about 45 test sites and moves facts between three views. Main at 3010a7ef. Review folder `docs/reviews/page-detail-2026-10-25/`.
- **One line per deliverable on the Product card (R-2930, R-2931).** The item keeps its `deliverable[ gap]` class, its ID, status, gap mark and one home link, so R-2452 holds unchanged. Its form is `<id> · <status>[ · gap] · Home: <link>[ · not made by code][ · not read by code] · <reader part>[ · parked] · <age part>`. It holds no claim list, mark paragraph or artifact paragraph.
  - Marks: the existing NOT_MADE_BY_CODE and NOT_READ_BY_CODE from `deliverableCodeState` (`scripts/deliverables.mjs:345-350`), as today (`scripts/product-report.mjs:833`).
  - Reader part: `read by ` plus the distinct non-null `readerKind` values of the row's claims, in claim order, joined by `, `; none gives `no readable reader`.
  - Parked: `parked` when the row is neither made and read by code nor in its capability's `check.byCapability` `gapRows` (`scripts/deliverables.mjs:692-697`). That is the checker's `parkedRows` set (`:558-585`), the one lane one's Gaps block counts (`scripts/product-report.mjs:956-957`). It fixes known bug "the view has no parked mark" (`docs/known-bugs/FEAT-039.md:41`).
  - Age part: the largest whole-day count in `ageDays` (`scripts/product-report.mjs:736`) among the live entries its `Made by:` claims name directly (`registry:<id>`) and the plain paths they name (`path:<p>`), as `plural(days, "day")` (`:190`). The test is "has a day count", never truthiness, so 0 days prints `0 days`. With none measured but some named: `age not measured` when every named one's age text starts with AGE_NOT_MEASURED_PREFIX, else `age unknown`; a dead ID has no age text, so it counts as unknown. With none named: `output only` when the claims name built-from entries, else NO_ARTIFACT_NAMED.
  - The largest count, because one stale part makes the deliverable stale. A measured part hides an unmeasured one; that is a known limit.
  - Finished segments in the model, like lane one's overview lines; `renderInto` only calls `renderSegments`.
- **The reader-kind rule lives in one place (SHOULD 3).** `deliverableClaims` (`scripts/deliverables.mjs:319-342`) adds `readerKind` to each claim where `readByCode` is decided (`:336`): the kind when the label is `Read by`, the ` · ` split has exactly two parts, the kind is known and the detail is not empty; otherwise null (always null on a `Parked:` claim, `:332`). `readByCode` then derives from it: `readerKind !== null && !REASON_SET.has(readerKind)`. The page reads `claim.readerKind` and never re-parses claim text. This changes no checker output, so the tree checker's line and notes stay byte for byte.
- **The full block moves to the home feature's detail view, once (R-2932).** The R-2442 checker rule homes every deliverable under the one capability that lists it, and buildReport refuses on tree problems (`scripts/product-report.mjs:641-642`), so each deliverable gets exactly one block. The block is an `article` of class `deliverable-block`: an `h3` reading `<id> · <status>[ · gap]`, then the existing `ul.deliverable-claims` (R-2542, R-2642), then the existing `p.deliverable-artifact` lines (R-2790), built as today (`:797-814`, `:834`). A feature that only shares the row gets no block. The block carries no marks; they sit on the Product line.
- **Maker links on block lines (SHOULD 2a).** A block's `artifact A-nnn · <name> · <age>` line for an entry another feature registers ends ` · made in ` plus a link to the maker feature, in `featureArtifactLines`' segment form (`:755-756`). Seven of today's 38 direct lines name another feature's entry (R-1400, R-301, R-1150, R-457, R-260, R-256, R-257; measured on the ccf3ad60 model). Built-from parts carry no maker link: the checker notes a built-from entry the home feature neither registers nor reads (`scripts/deliverables.mjs:678-691`), so the home's `Reads:` line already links its maker (R-2802). Block lines become segment lists; their text is unchanged where no link is added, so the age checks read them as before.
- **Sections go after `Shared rows:` and before `Requirements`** (`scripts/product-report.mjs:523-524`). Order: an `h3` `Deliverables` over the blocks in Product view order, then an `h3` `Registered artifacts` over the cards, then `Requirements`. A heading with nothing under it is left out. Why there: the header stays one screen, and R-1015's order check (`packages/nana-pack/tests/product-report.test.mjs:283`) keeps reading first occurrences from the header. The `Registers:` and `Reads:` lines stay as the header's index (R-2802 unchanged).
- **Cards move under their maker feature, once (R-2799).** Each live entry's card renders only on its maker feature's detail view, in A-ID order, built as today (`:906-924`). The `Made in: <self link> · <run>: …` line becomes `Made by: <run>: <writers or manual reason>`, since the page is the maker's own. The Class, Age, Read in and Deliverable lines stay. The Artifacts view shows no card. With no registry the Artifacts view still says `no artifact registry` (`:872`) and no detail view shows a card.
- **One copy of each block and card in the model (NOTE 14).** Blocks and cards live once, on the feature whose detail view shows them, with each section's heading; capability deliverables keep only their one-line segments, and `artifacts` keeps no cards and no flow groups. Any lookup the renderer does runs inside the detail branch: the hand-built model at `product-report.test.mjs:366` has no `capabilities` and no `artifacts`, so a lookup at the top of `renderInto` would throw there. The builder names the model shape in the report.
- **The Artifacts view keeps only its two lists (R-2801).** Each item keeps today's text and ends ` · made in ` plus the maker feature link, one click from its card. List two keeps its class and manual reason (NOTE 7): once the cards leave the tab, the reason repeats nothing there, and it is the fact the owner decides on for that list. The note under the first list stays.
- **No third "aged or not measured" list (subtraction).** The Overview's Stale block already names each stale entry with its days and counts the not-measured and unknown entries beside it (R-2924, `:967-970`, rendered at `:980-982`). A third list would repeat it, and the 47 not-measured entries are unaged by class rule (R-2791), so listing them asks for no action.
- **Overview maker links (SHOULD 2b).** Each Overview stale artifact item ends ` · made in ` plus its maker link, and each artifact gap ID on the Gaps item line reads `A-nnn · made in ` plus its maker link, the IDs joined by `, `. This narrows R-2923 and R-2924. It closes the route gap the attack found: A-040 is in neither list and no `Reads:` line names it, and the Stale block named it with no link. It also answers lane one's final reviewer: the Gaps and Stale headings link to views that show only part of what they count. With per-ID maker links, the headings keep their hrefs (Gaps → `#product`, Stale → `#features`), and every counted entry is one click from its card.
- **The flow lines retire (R-2800).** Status `retired`, text kept, evidence `Retired: the owner retired the stage-to-stage flow lines in the 2026-10-25 page discussion; R-2933 carries its tree-checker clause.`, as R-2743 records its retirement (`REQUIREMENTS.md:2832`). Delete the check (`product-report.test.mjs:1447-1460`), `capabilityOrder`, `featureOrder`, `flowEntries` and `flowGroups` (`scripts/product-report.mjs:875-902`; nothing else reads them), the model's `flowGroups` (`:872`, `:928`) and the renderer loop (`:489-493`). The template has no flow CSS.
- **R-2933 keeps the one guarantee R-2800 held that the owner did not retire (NOTE 11):** the tree checker accepts a read toward an earlier capability. Its test is the deleted check's CLI half (`product-report.test.mjs:1454`, status 0 and empty stderr) on `artifactFlowLedger`, whose CAP-10 features read CAP-12's entries.
- **R-2922's text narrows (lane one's final review).** Its no-recorded-run count names "implemented rows that cite at least one test file and none of whose cited files has a recorded run", which is what the code counts (`scripts/product-report.mjs:950-954`), as R-1650 does. No code change; its test and title stay.
- **Repeats kept, each with its reason (NOTE 6, NOTE 7).**
  - The age text shows in the block line and on the card, by R-2799, and both sit on one page for 31 of 38 direct lines. The Product line adds the day count. Cutting the block's copy changes seven age rows' checks, so the land report asks the owner (see Notes).
  - `not read by code` beside the reader kinds: the mark is the checker's count rule (R-2542) and says "the tree checker does not count this row read by code" in words the Overview's Gaps block shares; the kinds say who reads it.
  - The `Registers:` index beside the card headings: it is the header's one-screen index and R-2802's contract; the cards sit below the rows' counts and shares.
  - A read shows on both ends of one link: the card's `Read in:` on the maker's page and `Reads:` on the reader's page.
- **Rows the brief named that stay.** R-2543: the Product view keeps the checker's line and its notes; its four-ledger test is unchanged. R-2794: its lists are the Product view's only trace of features that make artifacts but home no deliverable. R-1014: the feature lines and bars stay. R-2802 and R-2452 unchanged.
- **Labels are exported contract messages, read from the model (NOTE 10).** One definition per label. New: one frozen `DELIVERABLE_LINE_LABELS` with `readBy` (`read by`), `noReader` (`no readable reader`) and `outputOnly` (`output only`), and one frozen `DETAIL_HEADINGS` with `deliverables` (`Deliverables`) and `artifacts` (`Registered artifacts`), beside the contract constants (`scripts/product-report.mjs:43-83`). The line's `parked`, `age not measured` and `age unknown` read OVERVIEW_LABELS' `parked`, `notMeasured` and `unknown` (`:74`, `:82`). The inline `"output only, "` at `:810` reads `DELIVERABLE_LINE_LABELS.outputOnly`. The ` · made in ` text and maker link come from one helper beside `featureSegment` (`:742`), used by the block lines, the Artifacts lists and the Overview items; `featureArtifactLines` (`:755-756`) may adopt it with its output unchanged. `renderInto` never names a module-scope constant (`:90-91`, `:130-132`, `:529-531`). The builder may refine words through the constants, never the parts, their order or the counts, and reports each change.
- **Tests: a new file and helper moves.** The new checks go in `packages/nana-pack/tests/product-detail.test.mjs`, since `product-report.test.mjs` took 142.8 s on CI's Windows leg against the 300 s per-file limit (`scripts/test.mjs:89`). By the 2026-10-22 ruling, each helper the new file shares with another test file moves to `report-fixtures.mjs` with its folder passed in, and both files import it. Candidates: `feature`, `stage`, `code`, `manual`, `park`, `page` and `commitCode` (`product-overview.test.mjs:27-28`, `:30-34`, `:49-52`), and `artifactFlowLedger` (`product-report.test.mjs:82-111`). product-overview.test.mjs keeps a local wrapper for `page` and `commitCode`, as `product-report.test.mjs:19-20` does for `treeFixture` and `commitAt` (NOTE 15), so its edit stays on the import lines. `product-report.test.mjs` gains one local helper, `renderedHomes(repo, name, gitRunner)`, beside `renderedProduct` (`:139-143`): it writes the page once and returns `{ out, view }` where `view.nodes` concatenates every feature's detail render in model order, so the claim and age helpers (`:144-152`) run unchanged.
- **Headers.** product-report.mjs's `@outputs` (`:6`) drops the Artifacts flow and names the one-line deliverables, the feature detail blocks and cards, the two lists with maker links, and the Overview maker links. deliverables.mjs's `@outputs` (`:6`) names each claim's reader kind. report-fixtures.mjs's `@outputs` (`:5`) names the ledger builders, the page writer and the artifact-flow ledger. product-detail.test.mjs carries the six tags, as `product-overview.test.mjs:1-8` does.
- **Docs that describe the moved views change in the same commit.** `packages/nana-pack/skills/requirements/SKILL.md:129` and `packages/nana-pack/README.md:30` both describe the claims on the Product view, the flows and the Artifacts cards. The root README (`README.md:271`) names neither and stays.
- **Not in this lane.** Known bugs and CI on the page; R-2543's line; R-2794's lists; Product feature bars; the land's page writer; the tree checker's output; templates (no template copies the page).

## Must-meet rows (FEAT-039)

Four new rows, R-2930 to R-2933, `untested` until each check passes, then `implemented` with backticked `file::title` evidence. Eight rows change text: R-2542, R-2642, R-2790, R-2799, R-2801, R-2922, R-2923, R-2924. R-2800 retires. R-2934 to R-2949 stay free. New checks live in `packages/nana-pack/tests/product-detail.test.mjs`. Every check renders through `renderHtmlAt` on a page `generateReport` wrote, so a module-scope read inside `renderInto` throws. Assertions import DELIVERABLE_LINE_LABELS, DETAIL_HEADINGS, OVERVIEW_LABELS, NOT_MADE_BY_CODE, NOT_READ_BY_CODE, NO_ARTIFACT_NAMED and AGE_NOT_MEASURED_PREFIX by name.

- **R-2930 (new).** Each deliverable on a live `Kind: product` capability's card in the Product view shall be one line, holding no claim or artifact line, that gives after its ID, status, gap mark and home feature link its code marks, then `read by` with the distinct kinds, in claim order, of its `Read by:` claims that have exactly one part after the row ID, a known kind and a non-empty detail, or `no readable reader` when none has, then `parked` when the tree checker counts it parked.
  - Test: `packages/nana-pack/tests/product-detail.test.mjs::R-2930: a Product view deliverable is one line with its code marks, its readable reader kinds in claim order and its parked state, and no claim or artifact line`.
  - Fixture: `CAP-01` product, `Deliverables: R-001, R-002, R-003, R-004, R-005, R-006`, all homed in `FEAT-001` (label `FEAT-001`), no registry, with `make.mjs`, `read.mjs` and `other.mjs` committed. R-001: `Made by: R-001 · suite: make.mjs`, `Read by: R-001 · code: read.mjs`, `Read by: R-001 · code: other.mjs`. R-002: manual, `Read by: R-002 · rule: a rule reads it`, then `Read by: R-002 · person: owner reads it`, then `Parked: R-002 · since 2026-01-01: owner holds it`. R-003: suite-made, code-read, with a dated `Parked:` line (R-2641). R-004: manual, `Read by: R-004 · code` and `Read by: R-004 · bogus: x`. R-005: manual, `Read by: R-005 · person: owner reads it`, `Parked: R-005 · owner holds it` (no date). R-006: suite-made, `Read by: R-006 ·code: read.mjs`.
  - Expect these exact item texts, built from the constants (`Home: FEAT-001 · FEAT-001` is the link; `<none>` is NO_ARTIFACT_NAMED):
    - `R-001 · implemented · Home: FEAT-001 · FEAT-001 · read by code · <none>`
    - `R-002 · implemented · Home: FEAT-001 · FEAT-001 · not made by code · not read by code · read by rule, person · parked · <none>`
    - `R-003 · implemented · Home: FEAT-001 · FEAT-001 · read by code · <none>`
    - `R-004 · implemented · Home: FEAT-001 · FEAT-001 · not made by code · not read by code · no readable reader · <none>`
    - `R-005 · implemented · Home: FEAT-001 · FEAT-001 · not made by code · not read by code · read by person · <none>`
    - `R-006 · implemented · Home: FEAT-001 · FEAT-001 · not read by code · no readable reader · <none>`
  - Also: each item has exactly one element child, the home link to `#FEAT-001`; no item holds a `ul`, a `p` or the text `Made by:` or `Read by:`.
  - Red: the claim list still nested; artifact paragraphs still under the item; kinds sorted (`person, rule`); kinds repeated (`code, code`); R-004's empty `code` counted; R-006 read as `read by code` from its claim text; R-003 marked parked from its `Parked:` line; R-005 marked parked from an undated line; `parked` dropped from R-002; marks dropped.
- **R-2931 (new).** WHEN the Product view draws a deliverable's line, it shall end with `<n> day` or `<n> days`, the largest whole-day age among the live entries and plain paths its `Made by:` claims name directly; when none of those has a day count, with `age not measured` if every one is never aged and `age unknown` otherwise, an ID with no live entry counting as unknown; with `output only` when its claims name only built-from entries; and with `artifact not written down` when they name none.
  - Test: `packages/nana-pack/tests/product-detail.test.mjs::R-2931: a Product view deliverable line ends with the largest day count of the artifacts it names, or why it has none`.
  - Fixture: first commit dated 2020-01-01 (the moved `treeFixture`'s date argument); `b.txt` committed at 2020-01-22, `a.txt` at 2020-01-29, `c.txt` at 2020-01-31, and HEAD at 2020-02-01 committing `h.txt`. `FEAT-001` registers A-001 tracked `a.txt`, A-002 tracked `b.txt`, A-003 user-home store, A-004 tracked `absent.txt`, A-005 tracked `h.txt`. Deliverables, each suite-made and code-read: R-101 names `A-001, A-002`; R-102 `A-003`; R-103 `A-004`; R-104 `built from: A-001`; R-105 no third part; R-106 the plain path `c.txt`; R-107 `A-003, A-001`; R-108 `A-005`; R-109 `A-999`.
  - Expect line ends: R-101 `10 days`; R-102 `age not measured`; R-103 `age unknown`; R-104 `output only`; R-105 `artifact not written down`; R-106 `1 day`; R-107 `3 days`; R-108 `0 days`; R-109 `age unknown`. R-101's 10 equals the day count in the A-002 line of R-101's block on `#FEAT-001`. The page builds although the checker notes A-999.
  - Red: the smallest count (R-101 `3 days`); built-from entries counted as named (R-104 `3 days`); `1 days`; not measured and unknown swapped; plain paths ignored (R-106 not written down); a mixed pair read as unknown (R-107); 0 days read as no day count (R-108 `age unknown`); a dead ID skipped (R-109 not written down).
- **R-2932 (new).** A feature's detail view shall show, after its `Shared rows:` line and before its `Requirements` heading, a `Deliverables` heading over one block for each row a live `Kind: product` capability lists that is homed in the feature or its subgroups, in Product view order, each block headed by the row's ID, status and gap mark, then a `Registered artifacts` heading over the cards of the live entries the feature registers, leaving out a heading with nothing under it.
  - Test: `packages/nana-pack/tests/product-detail.test.mjs::R-2932: a feature's detail view shows a Deliverables block per deliverable it homes in Product view order, then its Registered artifacts, before its requirement rows`.
  - Fixture: `CAP-01` product, `Deliverables: R-003, R-001, R-002`, each with code claims. `FEAT-001` homes R-001 (implemented) and R-003 (untested) and registers `A-002` then `A-001`. `FEAT-002` homes R-002 under `### SUB-001 · Group`. `FEAT-003` has `Also applies: R-001`, homes R-004 (no deliverable) and registers nothing. `FEAT-004` homes R-005 (no deliverable) and registers `A-003`. Entries are user-home stores, so no age needs a commit.
  - Expect the root children after the `Shared rows:` paragraph, as tag and text: on `#FEAT-001`, `h3` Deliverables, block `R-003 · untested · gap`, block `R-001 · implemented`, `h3` Registered artifacts, card A-001, card A-002, `h3` Requirements; on `#FEAT-002`, Deliverables, block R-002, Requirements; on `#FEAT-003`, Requirements directly; on `#FEAT-004`, Registered artifacts, card A-003, Requirements. Blocks are `article` of class `deliverable-block`; cards are `article` of class `artifact-entry-card`. Headings come from DETAIL_HEADINGS.
  - Red: blocks in table order (R-001 first); sections before the badge; the Deliverables heading drawn on `#FEAT-003` or `#FEAT-004`; the Registered artifacts heading drawn with no card; R-002 missing (home from the row's own heading only); an R-001 block on `#FEAT-003`; cards before the blocks; cards in registration order.
- **R-2933 (new).** The tree checker shall exit 0 and print nothing on standard error for a ledger in which a feature's `Reads:` line names a live entry that a feature under a later capability registers.
  - Test: `packages/nana-pack/tests/product-detail.test.mjs::R-2933: the tree checker accepts a Reads line that names an entry a later capability registers`.
  - Fixture: `artifactFlowLedger` (moved to `report-fixtures.mjs`) in a `treeFixture`; CAP-10's FEAT-100 reads A-001, which CAP-12's FEAT-120 registers. Run `scripts/requirements-tree.mjs --root <fixture>` as the deleted check did (`product-report.test.mjs:1454`).
  - Expect: status 0 and stderr `""`.
  - Red: any stage-order problem or stderr line for that read.
- **R-2542 (changed text, same title).** New text: "WHEN a live `Kind: product` capability lists a deliverable, the product report shall show each `Made by:` and `Read by:` claim for that row from that capability's own span in that deliverable's block on its home feature's detail view, in ledger order as written after the row ID, in place of the features that share the row, and on the deliverable's Product view line the marks "not made by code" and "not read by code" as the tree checker counts them and "artifact not written down" when no maker claim names an entry, a built-from list or a path."
  - Test edit (`product-report.test.mjs:1163-1217`): `claims(id)` (`:1189`) reads the block whose `h3` starts `<id> · ` on `#FEAT-050`; items, marks, home links and the count line still come from the Product card. New clause: `#FEAT-052`, which shares R-5000 and R-5001, has no `deliverable-block`. No clause dropped.
  - Red: claims from every capability's span (CAP-51's stray `Made by: R-5000` line shows); marks dropped from the Product line; blocks drawn on a sharing feature.
- **R-2642 (changed text and title).** New text: "WHEN a live product capability lists a deliverable that carries a `Parked:` line, the product report shall list that line among the claims in that deliverable's block on its home feature's detail view, in ledger order."
  - New title: `packages/nana-pack/tests/product-report.test.mjs::R-2642: a deliverable's block on its home feature's detail view lists its Parked line among its claims in ledger order`. The evidence cell follows.
  - Test edit (`:1218-1246`): `claims(id)` (`:1234`) reads the blocks on `#FEAT-060`; the marks and count-line clauses stay on the Product view; title at `:1243`.
  - Red: the `Parked:` claim dropped from the block.
- **R-2790 (changed text, same title).** New text: "WHEN a live product capability lists a deliverable, its block on its home feature's detail view shall show, after its claims, one `artifact A-nnn · <name> · <age>` line for each distinct entry its `Made by:` claims name, in claim order and then ID order, ending ` · made in ` and a link to the entry's maker feature when another feature registers it; one `built from A-nnn · <name> · <age>[, …]` line naming each distinct built-from entry not already shown, starting `output only, ` when no claim names an entry; `artifact not written down` when neither exists; `artifact A-nnn · no live entry` for an ID with no live entry; and `artifact <path> · <age>` for a plain-path third part."
  - Test edit (`:1286-1317`): the fixture's `Deliverables:` line gains R-9006, with `Made by: R-9006 · build: REQUIREMENTS.md · A-004` and `Read by: R-9006 · code: REQUIREMENTS.md`, homed in FEAT-090; a new `## FEAT-093 · Second maker` under CAP-90 registers `Artifact: A-004 · other output · user-home store: ~/other-output · build: REQUIREMENTS.md` and homes R-9010. Render `#FEAT-090` in place of the Product card (`:1304-1308`); `lines(id)` reads each block's `p.deliverable-artifact`; `renderedClaims` runs over the detail view. New clauses: `lines("R-9006")` equals `["artifact A-004 · other output · age not measured: user-home store · made in FEAT-093"]` and that line holds one link, to `#FEAT-093`; no R-9000 line holds a link. Every existing clause stays.
  - Red: artifact lines left on the Product item; ages dropped from block lines; the maker link dropped; a maker link on an entry the home feature registers.
- **R-2799 (changed text and title).** New text: "WHEN the ledger has a registry, the report shall show one card per live entry only on its maker feature's detail view, in A-ID order, with its class and location, the same age text the deliverable block shows, its run with its writers or manual reason, one `Read in:` line per `Reads:` line naming it with that line's reader paths, and one `Deliverable:` line per deliverable that names it directly or through `built from:`, and with no registry its Artifacts view says `no artifact registry`."
  - New title: `packages/nana-pack/tests/product-report.test.mjs::R-2799: each maker feature's detail view shows a card per live entry it registers with its class, location, age, run, reading features and deliverables, and the Artifacts view shows none`. The evidence cell follows.
  - Test edit (`:1420-1446`): cards read from `#FEAT-120` (headings A-001, A-002, A-005 to A-011, in that order) and `#FEAT-121` (A-003); none on `#FEAT-100` or `#artifacts`. The `Made in: FEAT-120 · Maker feature · build: REQUIREMENTS.md` clause (`:1444`) becomes `Made by: build: REQUIREMENTS.md`, and A-001's card holds no `#FEAT-120` link. A-001's card age equals the age in the A-001 line of R-1200's block on `#FEAT-120` (`:1433`). The no-registry clauses check `#artifacts` (`no artifact registry`) and `#FEAT-130` (no card). The nav clause stays. Title at `:1442`.
  - Red: cards still on the Artifacts view; a card on every feature's page; the self link kept; cards sorted by name.
- **R-2801 (changed text, same title).** New text: "The Artifacts view shall show only two lists: under `Artifacts no other feature reads and no deliverable names` each live entry that no `Reads:` line names and no deliverable names directly or through `built from:`, and under `Read by code, made by no nana run`, each with its class and manual reason, each live manual entry that a `Reads:` line names or that a deliverable with a code or prompt reader names directly or through `built from:`, each item ending ` · made in ` and a link to its entry's maker feature."
  - Test edit (`:1461-1476`): the root children after the `h2` are exactly `h3`, `p`, `ul`, `h3`, `ul`. First list: `["A-008 · orphan record · made in FEAT-120"]`. Second list: today's four items (`:1474`), each followed by ` · made in FEAT-120`. Every item holds one link, to `#FEAT-120`. The `manual: ` and excluded-ID clauses stay.
  - Red: the maker link missing; the link to a reading feature; the flow headings still drawn; the cards still drawn; the reason dropped.
- **R-2922 (changed text, same title and test).** New text: "WHEN the product report renders the Overview with runtime data, its Broken block shall name by ID the violated rows and the implemented rows that did not pass that the Issues view lists, counting the latter as failed when any cited file's label is FAIL and as skipped only otherwise, beside the count of implemented rows that cite at least one test file and none of whose cited files has a recorded run, and the runtime data's measured tip and age." No code or test change.
- **R-2923 (changed text, same title).** New text: "WHEN the product report renders the Overview, its Gaps block shall name by ID each unparked listed deliverable of a live product capability that code does not both make and read, beside the parked deliverable count and the tree checker's note count, and each live artifact entry with no declared reader and no accepted park, in A-ID order and each followed by ` · made in ` and a link to its maker feature's detail view, beside the parked entry count."
  - Test edit (`product-overview.test.mjs:97-107`): A-002's `Artifact:` line moves from FEAT-001's lines to FEAT-002's, before its `Reads:` line (`:99-100`), so the two gaps have different makers and registry order still differs from A-ID order. The expected artifact item line (`:106`) becomes `A-002 · made in FEAT-002, A-005 · made in FEAT-001`. New clause: that line's link hrefs are `["#FEAT-002", "#FEAT-001"]`.
  - Red: the maker links dropped; the entry's capability linked in place of its maker.
- **R-2924 (changed text, same title).** New text: "WHEN the product report renders the Overview, its Stale block shall count and link by ID each active or frozen feature whose assessment is out of date or missing, and name by ID, name and whole days, in A-ID order, each live artifact entry measured more than STALE_AGE_DAYS whole days before HEAD's commit time, each followed by ` · made in ` and a link to its maker feature's detail view, beside the counts of live entries whose age is not measured and whose age is unknown."
  - Test edit (`product-overview.test.mjs:109-132`): A-005's `Artifact:` line moves to FEAT-002 (`:111-112`). The stale items (`:121`) become `` `A-001 · first · ${STALE_AGE_DAYS + 1} days · made in FEAT-001` `` and `` `A-005 · runtime · ${STALE_AGE_DAYS + 32} days · made in FEAT-002` ``. New clause: those two items' link hrefs are `#FEAT-001` and `#FEAT-002`. `:124` renders `#FEAT-001` in place of `#artifacts`, where A-003's and A-004's cards now sit. Repository two is unchanged.
  - Red: the maker links dropped; the entry's capability linked in place of its maker.
- **R-2800 (retired).** Status `retired`; text unchanged; evidence `Retired: the owner retired the stage-to-stage flow lines in the 2026-10-25 page discussion; R-2933 carries its tree-checker clause.` Its check and code go.

## Expected existing-test changes (each named in the build report; no assertion loosened)

In `packages/nana-pack/tests/product-report.test.mjs`:

- `:18-20`: import the moved `artifactFlowLedger`; `:82-111`: its definition moves to `report-fixtures.mjs`.
- `:139-143`: keep `renderedProduct` (R-2794 uses it at `:1406` and `:1411`); add `renderedHomes` beside it.
- `:155-157` (MUST 1): `cardFor` narrows to the row card: `node.tag === "article" && node.attrs?.class === "requirement-card" && …`. `row()` sets that class (`scripts/product-report.mjs:403`). FEAT-039 homes R-1014, a CAP-07 deliverable (`REQUIREMENTS.md:2217`), whose block would otherwise match first on `#FEAT-039`. Without the edit, R-1511 (`:678-718`, `R-1511: cited test files link in a new tab to their GitHub page at the report's commit for each GitHub origin spelling, and nothing links otherwise`) and R-1513 (`:755-801`, `R-1513: a recorded label is marked changed when the test file or a file it ran changed or is gone since the run, and unmarked otherwise`) go red, and R-1515 (`:829-844`, `R-1515: a row citing no test in this repository says so, and a row citing one does not`) silently stops reading R-1014's row card. Their assertions do not change. R-1510 (`:672-676`), R-1512 (`:745`), R-1514 (`:813`) and R-1654 (`:929`) read through the same helper on rows FEAT-039 does not list as deliverables and pass unchanged.
- `:279` (R-1041, `assessment lists render separate text-only list items`): `detail.nodes.filter((node) => node.tag === "ul").length === 3` counts only `ul` nodes with no class attribute. FEAT-039's detail view gains R-1014's classed `ul.deliverable-claims`; the three assessment lists carry no class (`scripts/product-report.mjs:394`). Row and title stay.
- `:361-369` (R-1019, `renderer inserts all dynamic strings only through text nodes`, SHOULD 5): the hand-built document's `setAttribute` (`:364`) records its attribute in `attrs`. Record `const before = made.length` after the second call, then add a third `renderInto` call at `#FEAT-001` on a hand-built model whose one feature has one deliverable block headed `<img onerror=alert(1)>` and one card whose one line is `<img onerror=alert(2)>`, in the model shape the builder chose. The predicate keeps every existing clause and adds: `made.slice(before)` holds a text node `<img onerror=alert(1)>`, an `article` whose class is `deliverable-block`, and an `article` whose class is `artifact-entry-card` holding a text node `<img onerror=alert(2)>`.
- `:1163-1217` R-2542, `:1218-1246` R-2642 (title `:1243`), `:1286-1317` R-2790, `:1420-1446` R-2799 (title `:1442`), `:1461-1476` R-2801: as in the rows above.
- `:1357` (R-2791, `R-2791: an unageable entry shows age not measured with its class, and the page is the same whatever the stores and refs hold`): `renderHtmlAt(…, "#product")` becomes `"#FEAT-091"`.
- `:1384`, `:1387` (R-2792, `R-2792: a tracked entry shows the age of the last commit that changed a file it matches`): `renderedProduct` becomes `renderedHomes`.
- `:1447-1460` (R-2800): deleted.
- `renderedProduct` becomes `renderedHomes`, with no other change, at R-2544's (`R-2544: an artifact shows the commits, days, short hash and subject of its last change as git counts them, or why its age is unknown`) `:1513`, `:1529`, `:1541`, `:1547`, `:1554`, `:1560`, `:1570`, `:1575`, `:1579`, `:1588`, `:1594`; R-2545's (`R-2545: the runtime map shows its own tip, time and uncommitted files with commits and days to HEAD, or says why it cannot`) `:1615`; R-2744's (`R-2744: suite-runs shows the newest suite record in HEAD's history with its tip, time, commits and days to HEAD, or says why it cannot`) `:1693`, `:1697`, `:1702`, `:1710`; R-2745's (`R-2745: build-records shows the newest ended build in HEAD's history with its tip, end time, commits and days to HEAD, or says why it cannot`) `:1740`, `:1744`, `:1747`, `:1750`, `:1755`, `:1761`, `:1770`. Those rows say "on its artifact line"; the line keeps its class in the block, so their text stays.

In `packages/nana-pack/tests/product-overview.test.mjs`:

- `:16`, `:27-34`, `:49-52`: import the moved builders from `report-fixtures.mjs`, with local wrappers for `page` and `commitCode`; no assertion changes.
- `:97-107` (R-2923) and `:109-132` (R-2924): as in the rows above.

Totals: 19 existing checks change, one of them deleted; 25 of the edits are one-word helper renames; three checks change only through the narrowed `cardFor`. The seat grepped the three report test files at 3010a7ef for `deliverable-claims`, `deliverable-artifact`, `deliverable-mark`, `artifact-entry-card`, `artifact-flow`, `artifact-list`, `Made in`, `Read in`, `#artifacts`, `#product`, `cardFor`, `testItemsOf`, `tag === "article"`, `` startsWith(`${rowId} `) `` and every `tag === "h3"` finder. The other generic finders over `article` or `h3` read the Product, Features, Requirements, Issues or Decisions views (`capabilityCard` `:49-51`, `:265`, `:267`, `:270`, `:297-309`, `:921-935`, `:1089-1100`, `:1264`), or the Overview (`product-overview.test.mjs:35-43`, `:166`), none of which gains a block or card. R-1014 (`:264-267`), R-1015 (`:268-289`), R-1040 (`:274-276`), R-2450 to R-2454, R-2543, R-2794 and R-2802 keep passing unchanged (inferred from their selectors, not run; the builder confirms). No other test file reads these views: `runtime-land`, `requirements-deliverables`, `templates-render`, `linked-launch`, `runtime-map` and `requirements-regroup` only import constants or other exports, or run the CLI. `requirements-deliverables.test.mjs` reads claim fields by name, never a whole claim object, so `readerKind` breaks none of its checks.

The seat's title check also reads these existing checks, whose titles and markers stay: R-1041, R-1019's text-node check, R-1511, R-1513, R-1515, R-2542 (`:1212`), R-2790 (`:1313`), R-2791 (`:1359`), R-2792 (`:1389`), R-2801 (`:1472`), R-2544 (`:1601`), R-2545 (`:1668`), R-2744 (`:1714`), R-2745 (`:1774`), and in `product-overview.test.mjs` R-2922 (`:79`), R-2923 (`:97`) and R-2924 (`:109`).

## Seal

None new. No tunable enters: the lane adds contract messages and a rule. STALE_AGE_DAYS keeps its lane-one seal (`product-overview.test.mjs:174`).

## Tunables

| Name | Where | Value | Provenance |
|---|---|---|---|
| DELIVERABLE_LINE_LABELS | `scripts/product-report.mjs`, with the contract constants (`:43-83`) | `readBy` `read by`, `noReader` `no readable reader`, `outputOnly` `output only` | contract (R-2930, R-2931, R-2790). Messages, not tunables; tests import them. |
| DETAIL_HEADINGS | same place | `deliverables` `Deliverables`, `artifacts` `Registered artifacts` | contract (R-2932). Messages; the model carries them to `renderInto`. |

The line's `parked`, `age not measured` and `age unknown` reuse OVERVIEW_LABELS. The card's `Made by:` label is a literal, as its `Made in:` label is today (`:912`); the ` · made in ` text has one definition, in the helper beside `featureSegment`.

## Seat wrong-code pairs

Each is a one-place edit in the built tree and must turn its rows red on macOS. None is Windows-only.

1. The Product item still nests `ul.deliverable-claims` → R-2930.
2. The Product item keeps its artifact paragraphs → R-2930.
3. Reader kinds sorted → R-2930.
4. Reader kinds not deduplicated → R-2930.
5. The page builds reader kinds with `readerClaim(claim.text)` in place of `claim.readerKind` → R-2930 (R-006).
6. `readerKind` set without the non-empty detail test → R-2930 (R-004), R-2542 (R-5007).
7. `readerKind` set without the two-part test → R-2930 (R-006).
8. `parked` from the presence of a `Parked:` line → R-2930 (R-003).
9. `parked` from any `Parked:` line on a row code does not make and read → R-2930 (R-005).
10. `parked` never printed → R-2930.
11. Marks dropped from the Product line → R-2930, R-2542.
12. The smallest day count in place of the largest → R-2931.
13. Built-from entries counted as named → R-2931.
14. `plural` replaced by `${days} days` → R-2931.
15. `age not measured` and `age unknown` swapped → R-2931.
16. Plain paths left out of the named set → R-2931.
17. Any unmeasured named artifact gives `age unknown` even with days → R-2931.
18. The day test written as truthiness, so 0 days reads as no day count → R-2931 (R-108).
19. Dead IDs skipped from the named set → R-2931 (R-109).
20. Blocks in row-table order → R-2932.
21. The sections rendered right after the `Reads:` line → R-2932.
22. The `Deliverables` heading always drawn → R-2932.
23. The `Deliverables` heading drawn when the feature has blocks or cards → R-2932 (FEAT-004).
24. The `Registered artifacts` heading always drawn → R-2932.
25. Home taken from the row's own heading, not its feature ancestor → R-2932.
26. Blocks also drawn on features that share the row → R-2932, R-2542.
27. Cards rendered before the blocks → R-2932.
28. Cards in registration order → R-2932, R-2799.
29. Claims gathered from every capability span → R-2542.
30. `Parked:` claims dropped from the block → R-2642.
31. Block artifact lines dropped → R-2790, R-2799, R-2931, R-2544, R-2545, R-2744, R-2745, R-2791, R-2792.
32. Block artifact lines drop their age → R-2790, R-2799, R-2931 and the age rows.
33. The block line drops the maker link → R-2790.
34. The maker link added to every direct block line, own entries included → R-2790.
35. Cards still drawn on the Artifacts view → R-2799, R-2801.
36. Cards drawn on every feature's page → R-2799, R-2932.
37. The card keeps its `Made in` self link → R-2799.
38. Cards sorted by name → R-2799.
39. Artifacts list items without the maker link → R-2801.
40. Artifacts list items link the first reading feature in place of the maker → R-2801.
41. Flow groups kept in the model and drawn → R-2801.
42. The second list drops the manual reason → R-2801.
43. Overview artifact gap IDs without the maker link → R-2923.
44. Overview stale items without the maker link → R-2924.
45. Overview items link the entry's capability in place of its maker feature → R-2923, R-2924.
46. `renderInto` reads DETAIL_HEADINGS from module scope → R-2932 and every detail check (the vm render throws).
47. A block heading drawn with `innerHTML` → R-1019 (`:361-369`).
48. A card line drawn with `innerHTML` → R-1019.
49. The tree checker prints its deliverable lines with `console.error` (`scripts/requirements-tree.mjs:619`) → R-2933, R-2543.

R-2922 changes text only; lane one's pairs cover its code. No one-place product edit makes R-2933 fail more directly: its guarantee is an absence, and a stage-order problem would need a new rule. The seat re-runs the pairs after any change of its own to code or tests.

## Precedent (verified at 3010a7ef)

- Product deliverable item: renderer `scripts/product-report.mjs:457-467`; model `:826-835`; `orderedIds` `:790-796`; `artifactLinesFor` `:797-814` (`output only, ` at `:810`); marks `:833`.
- Artifacts view: renderer `:486-505` (flow loop `:489-493`, lists `:494-499`, cards `:500-503`); model `:870-935` (empty `:872`, flow `:875-902`, `readIds` `:903`, lists `:904-905` and `:929-932`, cards `:906-924`); `deliverableReferences` and `referencesFor` `:855-869`.
- Detail view: renderer `:507-525` (header lines `:509`, `Shared rows` `:523`, `Requirements` `:524`); `featureSegment` `:742`; `featureArtifactLines` `:743-760` (its `made in` segments `:755-756` are the maker-link precedent); features model `:761-787`.
- Segment rendering: `featureLink` and `renderSegments` `:395-396`; lane one's overview lines `:944-985`, the stale items `:982`, the artifact gap items `:979`.
- Ages: `plural`, `unknownAge`, `wholeDays` `:190-192`; `artifactAges` `:254-367`, its `ageDays` writes `:256-259`; `ageDays` and the ages call `:736-737`.
- Parked set and checker reads: `check` `:955`; `deliverableGaps` and `parked` `:956-957`; `byCapability` and `gapRows` `scripts/deliverables.mjs:692-697`; the park decision `:558-585`; `readerClaim` `:80-92`; the checker's reader acceptance `:650-670`; `deliverableClaims` `:319-342` (`readByCode` at `:336`, Parked claims at `:332`); `deliverableCodeState` and `isMadeAndReadByCode` `:345-356`; the built-from home rule `:678-691`.
- The String() rule: `scripts/product-report.mjs:90-91`, `:130-132`, `:529-531`, and `generateReport` `:1027-1030`.
- Contract constants: `:43-83`; OVERVIEW_LABELS `:73-83`.
- Tests: `renderedProduct`, `renderedClaims`, `renderedArtifactLines`, `onlyArtifactAge`, `cardFor`, `testItemsOf` `packages/nana-pack/tests/product-report.test.mjs:139-160`; local wrappers `:19-20`; `artifactFlowLedger` `:82-111`; `noArtifactRegistryLedger` `:112-114`; `historyFixture` `:115-125`; the shared-model renders `:245-327`; R-1041 `:279`; R-1019 `:361-369`; the checks above; R-2802 `:1477-1496`. New-file form and helpers: `product-overview.test.mjs:1-53`. Shared helpers: `report-fixtures.mjs:1-97`. R-917's scan: `test-runner.test.mjs:653-662`.
- Retired-row bookkeeping: R-2743 at `REQUIREMENTS.md:2832`.
- Changed-row bookkeeping and title changes: lane one's R-2794 widening and R-1019 retitle (`docs/reviews/page-overview-2026-10-25/must-meet.md`).
- Evidence file form: `docs/reviews/page-overview-2026-10-25/build-2-checks.md`.
- Ledger rows: R-1012 `:2781`, R-1014 `:2795`, R-1015 `:2796`, R-1019 `:2801`, R-1041 `:2814`, R-2452 `:2821`, R-2542 `:2824`, R-2543 `:2825`, R-2642 `:2826`, R-2790 `:2835`, R-2794 `:2839`, R-2799 `:2840`, R-2800 `:2841`, R-2801 `:2842`, R-2802 `:2843`, R-2922 `:2846`, R-2923 `:2847`, R-2924 `:2848`, R-2927 `:2850`.
- Rule text: `packages/nana-pack/skills/requirements/SKILL.md:129`; `packages/nana-pack/README.md:30`.
- Code map and outline: `docs/code-map.md:663` (product-report.mjs's entry); `docs/requirements-tree.md:324` (FEAT-039's IDs).

Helper moves: `feature`, `stage`, `code`, `manual`, `park`, `page` and `commitCode` from `product-overview.test.mjs`, and `artifactFlowLedger` from `product-report.test.mjs`, to `report-fixtures.mjs`, only those the new file uses, each named in the report. In product code nothing private moves between modules: `readerKind` is a new field of an exported function's result, the age part reads the existing `ageDays` map, and the maker-link helper is local to `buildReport`.

## R-1012, R-1019 and the self-contained renderer

- R-1012: every new list has a fixed order (Product view order, A-ID order, claim order); no new input is read. The same commit still gives the same bytes.
- R-1019: no view is added or removed. `#artifacts` still routes, and unknown hashes still fall to the Overview. Every new string reaches the page through `text` or `renderSegments`; pairs 47 and 48 and the extended check pin it.
- The renderer ships as `String(renderInto)` (`:1030`). The one-line text, the block headings and the section headings arrive finished in the model; pair 46 pins it.

## Class and builder

Ordinary. Ladder: the roster's final reviewer only (`reviewer: claude-code opus`, through claude-review); the larger builder (`largerBuilder: openai-codex gpt-6.1-sol high`) is a different lineage. Builder: `pi-worker --lane-size larger`, one session. No local install check: nothing under `packages/nana-setup/` and no hook changes. The seat pushes the draft pull request at build 1 and reads both report test files' and the new file's Windows times before the review brief; `renderedHomes` adds in-process renders to `product-report.test.mjs`. The seat runs the wrong-code pairs before the final review. Before the final review and the land, it runs `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carries the output in both.

Size: medium. About 100 lines added and 85 removed in `scripts/product-report.mjs`; about 3 lines in `scripts/deliverables.mjs`. About 260 new test lines in one new file, about 60 moved helper lines, about 75 edited and 14 deleted lines in `product-report.test.mjs`, and about 10 edited lines in `product-overview.test.mjs`. Plus 4 new ledger rows, 8 reworded, 1 retired, and 2 doc paragraphs.

## Page effect

Measured by the planner on a scratch clone at ccf3ad60 with no runtime data (`<scratch>/pd2/page-ccf3ad60.html`; counts are `p`, `li` and `h3` blocks, wrapped lines at 125 characters). The page code at 3010a7ef is identical, and lane one's later commits change only HANDOFF and the notes, which feed only the Decisions and Needs you lines, so the Product, Artifacts and detail figures stand (inferred). The after figures are inferred from the same model, not run on a built tree.

| View | Before (measured) | After (estimated) |
|---|---|---|
| Page | 2,198,854 bytes | about 8 to 15 KB smaller: the 12.3 KB flow model goes and the card `Made in` segments shorten; maker links on 57 list items, 7 block lines and the Overview items add about 4 KB; list two keeps its 3.7 KB of reasons |
| Product | 413 lines, 33.9K characters, about 488 wrapped | about 190 lines, about 235 wrapped |
| Artifacts | 691 lines, 51.0K characters, about 834 wrapped (20 pair headings, 51 flow lines, 80 cards of 559 lines, lists of 20 and 37) | about 60 lines: 2 headings, 1 note, 57 items |
| Feature detail, 39 pages | 13,954 lines | about 14,900: 42 blocks and 80 cards arrive; FEAT-013 gains 11 cards |
| Overview | 6 stale items and 0 artifact gap IDs, no links | the same items, each with a maker link |

- One-line age parts with the clone's data: 8 with days, 20 not measured, 6 unknown, 8 output only. On the seat's clone the runtime map and record stores give days for most of the 6 unknown (inferred).
- Reader parts today: 15 person only, 11 code only, 16 mixed or other kinds; 21 carry `parked`. One-line lengths run 106 to 165 characters.

## Known limits (the seat writes them to FEAT-039's file before the final round)

- The age text shows twice on one detail page when the home feature registers the entry it names: 31 of today's 38 direct artifact lines. R-2799 keeps the two equal; the land report asks the owner.
- A read shows on both ends: the card's `Read in:` line on the maker's page and the `Reads:` line on the reader's page.
- The `Registers:` index line repeats the card headings below it.
- `not read by code` repeats the reader kinds whenever they hold neither code nor prompt.
- The one-line age is the largest measured count. A deliverable with one measured and one unmeasured artifact shows only the measured days.
- `no readable reader` covers both no `Read by:` claim and only unreadable ones; the checker's notes say which.
- Built-from parts carry no maker link; the home feature's `Reads:` line links each one's maker.
- The Gaps and Stale headings still link to views that show only part of what they count; each counted artifact links its maker.
- R-2794's lists still name each feature's entries, and Product cards keep their feature bars beside the Features view's.
- The Product count line repeats the first line of the Overview's What it does block.
- Long detail pages grow; FEAT-013's gains 11 cards above its rows.
- A bookmark to `#artifacts` now opens the two lists only.

## Notes the seat writes before the final round

- HANDOFF, Next item 4 becomes: "4. **Product page readability (the owner, 2026-10-25).** Both page lanes are on main."
- HANDOFF, Next item 5: "Page lane two comes next." becomes "The owner's next pick sets it." The seat-work sentence after it stays.
- HANDOFF, Landed: replace the 2026-10-25 overview line with "2026-10-2x: product cards show one line per deliverable; feature pages hold the claims and artifact cards; the flow lines retired." The replaced line moves verbatim into this lane's session entry.
- Word budget: the frontier check reads 1,199 of 1,200 words at 3010a7ef. Item 4 shrinks from 33 words to 13, item 5's sentence grows by 1 and the Landed line stays 21, so the total falls to about 1,180. Item 4 is the shortening.
- Then `nana-writing HANDOFF.md`.
- FEAT-039 known-bug file, at lane one's tip:
  - delete `:82`, "the Product view's repeats, the artifact cards and the flow lines stay until lane two";
  - reword `:80` to "Overview (page-overview, plan): Gaps names parked items by count only; each Product line marks a parked row, and its claims sit on its home feature's page.";
  - reword `:41` to "Product view (park-deliverables, plan): a parked deliverable keeps both code marks; its Product line says parked, and its park line shows as a claim on its home feature's page.";
  - delete `:66` and `:67` (flow lines);
  - cut `:69` to "Artifacts view (artifact-flow, final review): a Reads line the checker flags still keeps the entry off the first list. This ledger has none.";
  - reword `:70` to "Artifacts (artifact-flow, final review): an entry with an empty run renders its card line as "Made by: : …"; the checker already flags it.";
  - add the known limits above, each headed "Feature pages (page-detail, plan):".
- The land report: "Cut the repeated age text on the detail page? Default: later." Word it as the repeat the readability brief listed and said option two would cut (brief section 6, "Age repeats"); this lane moved both copies onto one page instead. A later lane changes R-2545, R-2744, R-2745 and R-2790 and moves the registry-entry age checks onto cards.
- The builder's evidence goes to `docs/reviews/page-detail-2026-10-25/build-1-checks.md`, in `build-2-checks.md`'s form (lane one's folder).
- A session entry in `docs/sessions/`.
- `review-ledger keep` before the final round, which writes the lane folder's tree-movement.md.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated after any merge of main, with a confirmation round.
- After the land: check the land-written page's commit against main, then publish it to the owner's copy.

## The claim most likely wrong

That the allowed list of existing-test edits is complete. The seat grepped every view selector and generic finder, but the passes of R-1014, R-1015, R-1040, R-2450 to R-2454, R-2543, R-2794 and R-2802 on FEAT-039's real detail view, now holding R-1014's block and two cards, are inferred, not run. The 25 renamed age checks pass only if every block line keeps the `deliverable-artifact` class and each age fixture's first block line is the one the check reads; all 25 run on one-feature fixtures today. The brief tells the builder to stop and report any other red assertion rather than change it.
