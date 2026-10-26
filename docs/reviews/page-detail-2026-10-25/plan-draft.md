# page-detail · planner's draft (2026-10-25)

Feature: FEAT-039 · See the product and its decisions in one report

Planner's draft for the seat and one adversary. Code and lines verified at ccf3ad60 (page lane one's build tip, under review; main is e4d29927). Lane two builds on main after lane one lands, so the seat re-checks every cited line on that tip before brief 1.

The owner's decision, 2026-10-25 page discussion, from the readability brief (`<scratch>/readability/brief.md`, option 2 detail in `<scratch>/readability/options.txt:56-93`): option 2, "Restructure", in two lanes; this is lane two. He also ruled: the stage-to-stage flow lines retire; 30 days is the stale age (sealed in lane one, R-2924); known bugs and each platform's CI on the overview come later, not here.

Spend line: the current priority since 2026-10-23, the artifact work, whose test is "is each deliverable made by code, read by someone, and how old". The page is R-1014's deliverable and the owner is its only reader (`REQUIREMENTS.md:2226`). After this lane, each Product card answers that test in one line per deliverable, and the full claim and artifact detail sits once, on the feature that owns it. The tree checker's line stays `deliverables: 21 of 21 made and read by code, 21 more parked` (run read-only on a scratch clone at ccf3ad60); this lane changes no checker code.

Stakes: medium blast, reversible. The locked suite writes the page at every land (R-2740); a refusal prints one note and keeps the suite's exit code (R-2742), so a page bug cannot stop a land. The real harm is a fact lost in the move: a claim, an age or a card that no view renders any more, or a Product line that no longer answers the priority's test. Every moved fact keeps its existing test, pointed at its new view. Other projects get the change at once through the shared script path (`packages/nana-pack/skills/requirements/SKILL.md:140`). A revert restores everything.

Threat model: honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out: a hand-planted runtime or record store, a forged commit date, a ledger crafted to break the parser. A finding outside this model is a residual. The honest variations:

- a deliverable homed in a feature's subgroup; a feature that homes several deliverables; a feature that shares a deliverable row through `Also applies:`; a feature that homes none;
- a deliverable with no claims; a `Read by:` claim with no detail (`Read by: R-nnn · code`), an unknown kind, two claims of one kind, kinds in mixed order, the `runtime` kind;
- a `Parked:` line on a row code makes and reads (R-2641, not parked); a `Parked:` line with no date or reason (not accepted, so not parked);
- named artifacts: one tracked entry, several with different ages, a user-home or other-project entry (never aged, R-2791), a tracked entry at a path not at HEAD, a dead ID, a plain path, built-from entries only, none; clone stores at age-table keys; a shallow clone;
- an entry whose maker feature homes no deliverable; a retired entry (no card); a proposed or frozen maker feature; no registry at all; CRLF ledgers;
- hostile text in names, claims, reasons and subjects;
- old bookmarks to `#artifacts` and unknown hashes (R-1019);
- exactly 1 day and 0 days of age.

## Seat decisions

- **One feature, ordinary class, larger builder.** Every row sits in FEAT-039 (`REQUIREMENTS.md:2764`); new rows go after R-2927 (`:2850`). Class ordinary: no install, uninstall or doctor code, no hook or extension, no gate policy, no land or review tool. No file under `packages/nana-pack/bin/` imports `scripts/product-report.mjs` or `scripts/deliverables.mjs` (grep at ccf3ad60). The land's page writer `scripts/test-locked.mjs:192` stays untouched. Builder: `pi-worker --lane-size larger`, since a previous build stopped on one missed assertion and this lane edits about 40 test sites.
- **One line per deliverable on the Product card.** The item keeps its `deliverable[ gap]` class, its ID, status, gap mark and one home link, so R-2452 holds unchanged. Its form is `<id> · <status>[ · gap] · Home: <link>[ · not made by code][ · not read by code] · <reader part>[ · parked] · <age part>`. It holds no claim list, mark paragraph or artifact paragraph.
  - Marks: the existing NOT_MADE_BY_CODE and NOT_READ_BY_CODE from `deliverableCodeState` (`scripts/deliverables.mjs:345-351`), as today (`scripts/product-report.mjs:833`).
  - Reader part: `read by ` plus the distinct kinds, in claim order, of the row's `Read by:` claims the tree checker reads without a note: claim text with no further ` · `, a known kind and a non-empty detail, through `readerClaim` (`scripts/deliverables.mjs:80-91`, the checker's own test at `:650-660`). None gives `no readable reader`.
  - Parked: `parked` when the row is neither made and read by code nor in its capability's `check.byCapability` `gapRows` (`scripts/deliverables.mjs:692-696`). This is the checker's parked set, the one lane one's Gaps block reads (`scripts/product-report.mjs:956-957`). It fixes known bug "the view has no parked mark" (`docs/known-bugs/FEAT-039.md:42`).
  - Age part: the largest whole-day count in `ageDays` (`scripts/product-report.mjs:736`) among the live entries (`registry:<id>`, artifact kind only) and plain paths (`path:<p>`) its `Made by:` claims name directly, as `plural(days, "day")` (`:190`). With none measured but some named: `age not measured` when every named one's age text starts with AGE_NOT_MEASURED_PREFIX, else `age unknown` (a dead ID counts as unknown). With none named: `output only` when it names built-from entries, else NO_ARTIFACT_NAMED.
  - The largest count, because a stale part makes the deliverable stale. A measured part hides an unmeasured one; that is a known limit.
  - Finished segments in the model, like lane one's overview lines; `renderInto` only calls `renderSegments`.
- **The full block moves to the home feature's detail view, once.** The R-2442 checker rule homes every deliverable under the one capability that lists it, so each deliverable gets exactly one block. The block is an `article` of class `deliverable-block`: an `h3` reading `<id> · <status>[ · gap]`, then the existing `ul.deliverable-claims` (R-2542, R-2642), then the existing `p.deliverable-artifact` lines (R-2790), all built as today (`:797-814`, `:834`). Same classes, so the claim and age helpers keep working on the new view. A feature that only shares the row gets no block.
- **Sections go after `Shared rows:` and before `Requirements`** (`:523-524`). Order: an `h3` `Deliverables` over the blocks in Product view order, then an `h3` `Registered artifacts` over the cards, then `Requirements`. A heading with nothing under it is left out. Why there, and not between the `Reads:` line and the badge: the header stays one screen, and R-1015's order check (`packages/nana-pack/tests/product-report.test.mjs:282-283`) keeps reading first occurrences from the header. The `Registers:` and `Reads:` lines stay as the header's index (R-2802 unchanged).
- **Cards move under their maker feature, once.** Each live entry's card renders only on its maker feature's detail view, in A-ID order, built as today (`:906-927`). The `Made in: <self link> · <run>: …` line becomes `Made by: <run>: <writers or manual reason>`, since the page is the maker. Class, Age, Read in and Deliverable lines stay. The Artifacts view shows no card. With no registry the Artifacts view still says `no artifact registry` (`:872`) and no detail view shows a card.
- **The Artifacts view keeps only its two lists (R-2801).** Each item becomes `<id> · <name> · <class> · made in ` plus a link to the maker feature (`FEAT-nnn · label`), one click from its card. The second list drops the manual reason, which the card already shows (`:905` copies `entry.reason`, as the card does at `:908`). The note under the first list stays.
- **No third "aged or not measured" list (subtraction).** The Overview's Stale block already names each stale entry with its days and counts the not-measured and unknown entries beside it (R-2924, `:968-971`). A third list would repeat it, and the 47 not-measured entries are unaged by class rule (R-2791), so listing them asks for no action.
- **The flow lines retire (R-2800).** Status `retired`, text kept, evidence `Retired: the owner retired the stage-to-stage flow lines in the 2026-10-25 page discussion.`, as R-2743 records its retirement (`REQUIREMENTS.md:2832`). Delete the check (`product-report.test.mjs:1447-1460`), `flowEntries` and `flowGroups` (`scripts/product-report.mjs:875-902`), the model's `flowGroups` (`:872`, `:928`) and the renderer loop (`:489-493`). `capabilityOrder` and `featureOrder` go too if nothing else reads them. The template has no flow CSS.
- **Each fact once, as far as this lane goes.** A reader now shows twice, as the two ends of one link: the card's `Read in:` on the maker's page and `Reads:` on the reader's page. The flow line and the Product `Read by:` claims leave the Product and Artifacts views. The manual reason leaves the second list. Left as known limits: the age text, which the block and the card both show by R-2799 (31 of today's 38 direct artifact lines name an entry the home feature itself registers, so both sit on one page); the `Registers:` index beside the card headings; the R-2794 lists; the Product count line beside the Overview's first What it does line.
- **Rows the brief named that stay.** R-2543: the Product view keeps the checker's line and its notes, the detail behind the Overview's counts; its four-ledger test is unchanged. R-2794: its lists are the Product view's only trace of features that make artifacts but home no deliverable. R-1014: the feature lines and bars stay; dropping the bars is a separate question. R-2802 as above. R-2452 unchanged.
- **Labels are exported contract messages, read from the model.** One frozen `DELIVERABLE_LINE_LABELS` (`readBy`, `noReader`, `parked`, `notMeasured`, `unknown`, `outputOnly`) and one frozen `DETAIL_HEADINGS` (`deliverables`, `artifacts`), beside the contract constants (`:43-83`). The model carries each section's heading; `renderInto` never names a module-scope constant (`:91`, `:131`, `:529-531`). The builder may refine words through the constants, never the parts, their order or the counts, and reports each change.
- **Tests: a new file and one helper move.** The new checks go in `packages/nana-pack/tests/product-detail.test.mjs`, since `product-report.test.mjs` took 142.8 s on CI's Windows leg against the 300 s per-file limit (lane one's plan). By the 2026-10-22 ruling, the ledger builders it shares with `product-overview.test.mjs` move to `report-fixtures.mjs`: `feature`, `stage`, `code`, `manual`, `park` (`product-overview.test.mjs:27-28`, `:49-51`) and `page` with its folder passed in (`:30-34`). Both files import them. `product-report.test.mjs` gains one local helper, `renderedHomes(repo, name, gitRunner)`, beside `renderedProduct` (`:139-143`). It writes the page once and renders every feature's detail view from the page's own model into one node list, so the claim and age helpers (`:144-152`) run unchanged.
- **Headers.** product-report.mjs's `@outputs` (`:6`) drops the Artifacts flow and names the one-line deliverables, the feature detail blocks and cards, and the two lists. report-fixtures.mjs's `@outputs` (`:5`) names the ledger builders. product-detail.test.mjs carries the six tags, as `product-overview.test.mjs:1-8` does.
- **Docs that describe the moved views change in the same commit.** `packages/nana-pack/skills/requirements/SKILL.md:129` and `packages/nana-pack/README.md:30` both describe the flows and the Artifacts cards. The root README (`README.md:271`) names neither and stays.
- **Not in this lane.** The Overview's lines and links, including stale artifact items linking to their maker; known bugs and CI on the page; R-2543's line; R-2794's lists; Product feature bars; the land's page writer; the tree checker; templates (no template copies the page).

## Must-meet rows (FEAT-039)

Three new rows, R-2930 to R-2932, `untested` until each check passes, then `implemented`. Five rows change text: R-2542, R-2642, R-2790, R-2799, R-2801. R-2800 retires. R-2933 to R-2949 stay free. New checks live in `packages/nana-pack/tests/product-detail.test.mjs`. Every check renders through `renderHtmlAt` on a page `generateReport` wrote, so a module-scope read inside `renderInto` throws. Assertions import DELIVERABLE_LINE_LABELS, DETAIL_HEADINGS, NOT_MADE_BY_CODE, NOT_READ_BY_CODE, NO_ARTIFACT_NAMED and AGE_NOT_MEASURED_PREFIX by name.

- **R-2930 (new).** Each deliverable on a live `Kind: product` card in the Product view shall be one line holding no claim or artifact line, and after its ID, status, gap mark and home feature link, its code marks, `read by` with the distinct kinds in claim order of its `Read by:` claims the tree checker reads, or `no readable reader`, and `parked` when the tree checker counts it parked.
  - Test: `packages/nana-pack/tests/product-detail.test.mjs::R-2930: a Product view deliverable is one line with its code marks, its readable reader kinds in claim order and its parked state, and no claim or artifact line`.
  - Fixture: `CAP-01` product, `Deliverables: R-001, R-002, R-003, R-004`, all homed in `FEAT-001`, code paths committed. R-001: suite-made, `Read by: R-001 · code: read.mjs` and `Read by: R-001 · code: other.mjs`. R-002: manual, `Read by: R-002 · rule: a rule reads it`, then `Read by: R-002 · person: owner reads it`, then a dated `Parked:` line. R-003: code-made, code-read, with a `Parked:` line (R-2641). R-004: manual, `Read by: R-004 · code` and `Read by: R-004 · bogus: x`.
  - Expect, in that order: R-001 `… · read by code · …`, no mark, no `parked`; R-002 both marks, `read by rule, person`, `parked`; R-003 `read by code`, no `parked`; R-004 both marks and `no readable reader`. Each item has exactly one element child, the home link, and its text holds no `Made by:` or `Read by:`.
  - Red: the claim list still nested; kinds sorted (`person, rule`); kinds repeated (`code, code`); R-004's empty `code` counted; R-003 marked parked from its `Parked:` line alone; `parked` dropped from R-002; artifact paragraphs still under the item.
- **R-2931 (new).** WHEN the Product view draws a deliverable's line, it shall end with the largest whole-day age among the live entries and plain paths its `Made by:` claims name directly, or with `age not measured` when every named one is never aged, `age unknown` when another named one has no day count, `output only` when it names only built-from entries, and `artifact not written down` when it names none.
  - Test: `packages/nana-pack/tests/product-detail.test.mjs::R-2931: a Product view deliverable line ends with the largest day count of the artifacts it names, or why it has none`.
  - Fixture: first commit 2020-01-01; `b.txt` at 2020-01-22, `a.txt` at 2020-01-29, `c.txt` at 2020-01-31, HEAD at 2020-02-01. `FEAT-001` registers A-001 tracked `a.txt`, A-002 tracked `b.txt`, A-003 user-home, A-004 tracked `absent.txt`. Deliverables, each code-read: R-101 names `A-001, A-002`; R-102 `A-003`; R-103 `A-004`; R-104 `built from: A-001`; R-105 no third part; R-106 the plain path `c.txt`; R-107 `A-003, A-001`.
  - Expect line ends: R-101 `10 days`; R-102 `age not measured`; R-103 `age unknown`; R-104 `output only`; R-105 `artifact not written down`; R-106 `1 day`; R-107 `3 days`. R-101's 10 equals the day count in its block's A-002 artifact line on `#FEAT-001`.
  - Red: the smallest count (R-101 `3 days`); built-from entries counted as named (R-104 `3 days`); `1 days`; not measured and unknown swapped; plain paths ignored (R-106 not written down); a mixed pair read as unknown (R-107); days from `Date.now()`.
- **R-2932 (new).** A feature's detail view shall show, after its `Shared rows:` line and before its `Requirements` heading, a `Deliverables` heading over one block per listed deliverable homed in the feature or its subgroups, in Product view order, each headed by the row's ID, status and gap mark, then a `Registered artifacts` heading over its entry cards, leaving out a heading with nothing under it.
  - Test: `packages/nana-pack/tests/product-detail.test.mjs::R-2932: a feature's detail view shows a Deliverables block per deliverable it homes in Product view order, then its Registered artifacts, before its requirement rows`.
  - Fixture: `CAP-01` product, `Deliverables: R-003, R-001, R-002`, each with code claims. `FEAT-001` homes R-001 (implemented) and R-003 (untested) and registers `A-002` then `A-001`. `FEAT-002` homes R-002 under `### SUB-001 · Group`. `FEAT-003` has `Also applies: R-001`, homes R-004 (no deliverable) and registers nothing.
  - Expect: on `#FEAT-001` the root children after `Shared rows: None` are `h3` Deliverables, block `R-003 · untested · gap`, block `R-001 · implemented`, `h3` Registered artifacts, card A-001, card A-002, `h3` Requirements. On `#FEAT-002`: Deliverables, block R-002, Requirements. On `#FEAT-003`: `Shared rows:` directly followed by Requirements.
  - Red: blocks in table order (R-001 first); sections before the badge; an empty heading on `#FEAT-003`; R-002 missing (home found from the row's own heading only); an R-001 block on `#FEAT-003`; cards before the blocks; cards in registration order.
- **R-2542 (changed text, same title).** New text: "WHEN a live `Kind: product` capability lists a deliverable, the product report shall show each `Made by:` and `Read by:` claim for that row from that capability's own span in that deliverable's block on its home feature's detail view, in ledger order as written after the row ID, in place of the features that share the row, and on the deliverable's Product view line the marks "not made by code" and "not read by code" as the tree checker counts them and "artifact not written down" when no maker claim names one."
  - Test edit (`product-report.test.mjs:1163-1217`): `claims(id)` (`:1189`) reads the blocks on `#FEAT-050`; items, marks, home links and the count line still come from the Product card. No clause dropped.
  - Red: claims from every capability's span (CAP-51's stray `Made by: R-5000` line shows); marks dropped from the Product line.
- **R-2642 (changed text and title).** New text: "WHEN a live product capability lists a deliverable that carries a `Parked:` line, the product report shall list that line among the claims in that deliverable's block on its home feature's detail view, in ledger order."
  - New title: `packages/nana-pack/tests/product-report.test.mjs::R-2642: a deliverable's block on its home feature's detail view lists its Parked line among its claims in ledger order`. The evidence cell follows.
  - Test edit (`:1218-1246`): `claims(id)` (`:1234`) reads the blocks on `#FEAT-060`; the marks and count-line clauses stay on the Product view.
  - Red: the `Parked:` claim dropped from the block.
- **R-2790 (changed text, same title).** New text: R-2790's sentence with "WHEN a product card lists a deliverable, the report shall show, after its claims," replaced by "WHEN a live product capability lists a deliverable, its block on its home feature's detail view shall show, after its claims,". The rest stays word for word.
  - Test edit (`:1286-1317`): render `#FEAT-090` in place of the Product card (`:1304-1308`); `lines(id)` reads each block's `p.deliverable-artifact`; `renderedClaims` runs over the detail view.
  - Red: artifact lines left on the Product item; ages dropped from block lines.
- **R-2799 (changed text and title).** New text: "WHEN the ledger has a registry, each feature's detail view shall show one card per live entry it registers, in A-ID order, with its class and location, the same age text the deliverable block shows, its run with its writers or manual reason, one `Read in:` line per `Reads:` line naming it with that line's reader paths, and one `Deliverable:` line per deliverable that names it directly or through `built from:`, and the Artifacts view shall show no card; with no registry the Artifacts view says `no artifact registry`."
  - New title: `packages/nana-pack/tests/product-report.test.mjs::R-2799: each maker feature's detail view shows a card per live entry it registers with its class, location, age, run, reading features and deliverables, and the Artifacts view shows none`. The evidence cell follows.
  - Test edit (`:1420-1446`): cards from `#FEAT-120` (A-001, A-002, A-005 to A-011, in that order) and `#FEAT-121` (A-003); none on `#FEAT-100` or `#artifacts`. The `Made in: FEAT-120 · Maker feature · build: REQUIREMENTS.md` clause (`:1444`) becomes `Made by: build: REQUIREMENTS.md`, with no `FEAT-120` link in the card. A-001's card age equals the age in R-1200's block on `#FEAT-120` (`:1433`). The no-registry clauses check `#artifacts` and `#FEAT-130`. The nav clause stays.
  - Red: cards still on the Artifacts view; a card on every feature's page; the self link kept; cards sorted by name.
- **R-2801 (changed text, same title).** New text: "The Artifacts view shall show only two lists: under `Artifacts no other feature reads and no deliverable names` each live entry that no `Reads:` line names and no deliverable names directly or through `built from:`, and under `Read by code, made by no nana run` each live manual entry that a `Reads:` line names or that a deliverable with a code or prompt reader names directly or through `built from:`, each item giving the entry's ID, name and class and linking to its maker feature's detail view."
  - Test edit (`:1461-1476`): the root children after the `h2` are exactly `h3`, `p`, `ul`, `h3`, `ul`. First list: `["A-008 · orphan record · tracked · made in FEAT-120 · Maker feature"]`. Second list: the same four entries as today (A-002, A-006, A-007, A-011), each `<id> · <name> · <class> · made in FEAT-120 · Maker feature`, with no `manual: `. Every item holds one link to `#FEAT-120`.
  - Red: the reason kept; the maker link missing; the flow headings still drawn.
- **R-2800 (retired).** Status `retired`; text unchanged; evidence as in the seat decisions. Its check and code go.

## Expected existing-test changes (each named in the build report; no assertion loosened)

In `packages/nana-pack/tests/product-report.test.mjs`:

- `:139-143`: keep `renderedProduct` (R-2794 uses it at `:1406` and `:1411`); add `renderedHomes` beside it.
- `:279` (R-1041): `detail.nodes.filter((node) => node.tag === "ul").length === 3` counts only `ul` nodes with no class attribute. FEAT-039 homes R-1014 (`REQUIREMENTS.md:2217`, `:2224-2227`), so its detail view gains a classed `ul.deliverable-claims`; the three assessment lists carry no class. Row and title stay.
- `:363-368` (R-1019): add a third `renderInto` call at a feature hash on a hand-built model whose deliverable block heading and one card line are `<img onerror=alert(1)>`, in the model shape the builder chose. The predicate covers all three calls' nodes and requires the hostile text as a text node, as lane one extended it.
- `:1163-1217` R-2542, `:1218-1246` R-2642 (with title `:1243`), `:1286-1317` R-2790, `:1420-1446` R-2799 (with title `:1442`), `:1461-1476` R-2801: as in the rows above.
- `:1357` (R-2791): `renderHtmlAt(…, "#product")` becomes `"#FEAT-091"`.
- `:1384`, `:1387` (R-2792): `renderedProduct` becomes `renderedHomes`.
- `:1447-1460` (R-2800): deleted.
- `renderedProduct` becomes `renderedHomes`, with no other change, at R-2544's `:1513`, `:1529`, `:1541`, `:1547`, `:1554`, `:1560`, `:1570`, `:1575`, `:1579`, `:1588`, `:1594`; R-2545's `:1615`; R-2744's `:1693`, `:1697`, `:1702`, `:1710`; R-2745's `:1740`, `:1744`, `:1747`, `:1750`, `:1755`, `:1761`, `:1770`. Those rows say "on its artifact line"; the line keeps its class in the block, so their text stays.

In `packages/nana-pack/tests/product-overview.test.mjs`:

- `:124` (R-2924): `renderHtmlAt(…, "#artifacts")` becomes `"#FEAT-001"`, where that fixture's cards now sit.
- `:16`, `:27-34`, `:49-51`: import the moved builders from `report-fixtures.mjs`; no assertion changes.

Totals: 15 existing checks change, one of them deleted; 25 of the edits are one-word helper renames. Greps at ccf3ad60 for `deliverable-claims`, `deliverable-artifact`, `deliverable-mark`, `artifact-entry-card`, `artifact-flow`, `artifact-list`, `Made in`, `Read in`, `#artifacts` and `#product` across `packages/nana-pack/tests/` found no other hit that the move breaks. R-1014 (`:264-266`), R-1015 (`:268-289`), R-1040 (`:275`), R-2450, R-2451, R-2452, R-2453, R-2454, R-2543, R-2794 and R-2802 keep passing unchanged (inferred from their selectors; the builder confirms). No other test file reads these views: `runtime-land`, `requirements-deliverables`, `templates-render` and `linked-launch` only import constants or run the CLI.

The seat's title check also reads these existing checks, whose titles and markers stay: R-2542 (`:1212`), R-2790 (`:1313`), R-2801 (`:1472`), R-2791, R-2792, R-2544, R-2545, R-2744, R-2745, `assessment lists render separate text-only list items` (R-1041) and `renderer inserts all dynamic strings only through text nodes` (R-1019).

## Seal

None new. No tunable enters: the lane adds contract messages and a rule. STALE_AGE_DAYS keeps its lane-one seal (`product-overview.test.mjs:174`).

## Tunables

| Name | Where | Value | Provenance |
|---|---|---|---|
| DELIVERABLE_LINE_LABELS | `scripts/product-report.mjs`, with the contract constants (`:43-83`) | `read by`, `no readable reader`, `parked`, `age not measured`, `age unknown`, `output only` | contract (R-2930, R-2931). Messages, not tunables; tests import them. |
| DETAIL_HEADINGS | same place | `Deliverables`, `Registered artifacts` | contract (R-2932). Messages; the model carries them to `renderInto`. |

The artifact-list `made in` text and the card's `Made by:` label are literals, as R-2802's `made in` is today (`:755`).

## Seat wrong-code pairs

Each is a one-place edit in the built tree and must turn its rows red on macOS. None is Windows-only.

1. The Product item still nests `ul.deliverable-claims` → R-2930.
2. Reader kinds sorted → R-2930.
3. Reader kinds not deduplicated → R-2930.
4. An empty-detail `Read by:` claim counted as a kind → R-2930.
5. `parked` from the presence of a `Parked:` line → R-2930.
6. `parked` never printed → R-2930.
7. The Product item keeps its artifact paragraphs → R-2930.
8. The smallest day count in place of the largest → R-2931.
9. Built-from entries counted as named → R-2931.
10. `plural` replaced by `${days} days` → R-2931.
11. `age not measured` and `age unknown` swapped → R-2931.
12. Plain paths left out of the named set → R-2931.
13. Any unmeasured named artifact gives `age unknown` even with days → R-2931.
14. Blocks in row-table order → R-2932.
15. The sections rendered right after the `Reads:` line → R-2932.
16. The `Deliverables` heading drawn with no block → R-2932.
17. Home taken from the row's own heading, not its feature ancestor → R-2932.
18. Blocks also drawn on features that share the row → R-2932.
19. Cards rendered before the blocks → R-2932.
20. Claims gathered from every capability span → R-2542.
21. Marks dropped from the Product line → R-2542.
22. `Parked:` claims dropped from the block → R-2642.
23. Block artifact lines dropped (left only on Product) → R-2790, R-2544, R-2545, R-2744, R-2745, R-2791, R-2792.
24. Block artifact lines drop their age → R-2790, R-2799, the age rows.
25. Cards still drawn on the Artifacts view → R-2799, R-2801.
26. Cards drawn on every feature's page → R-2799.
27. The card keeps its `Made in` self link → R-2799.
28. Cards sorted by name → R-2799, R-2932.
29. The second list keeps the manual reason → R-2801.
30. List items without the maker link → R-2801.
31. Flow groups kept in the model and drawn → R-2801.
32. `renderInto` reads DETAIL_HEADINGS from module scope → R-2932 and every detail check (the vm render throws).
33. A block heading drawn with `innerHTML` → R-1019 (`:363-368`).

The seat re-runs the pairs after any change of its own to code or tests.

## Precedent (verified at ccf3ad60)

- Product deliverable item and block: renderer `scripts/product-report.mjs:457-467`; model `:826-835`; `orderedIds` `:790-796`; `artifactLinesFor` `:797-814`; marks `:833`.
- Artifacts view: renderer `:486-505`; model `:870-934` (empty `:872`, flow `:875-902` (from `capabilityOrder`), `readIds` `:903`, lists `:904-905`, cards `:906-927`, lists model `:929-932`); `deliverableReferences` and `referencesFor` `:855-869`.
- Detail view: renderer `:507-525` (`Shared rows` `:523`, `Requirements` `:524`); `featureArtifactLines` `:743-760` (its `made in` segments are the list-item precedent); features model `:761-787`; `featureSegment` `:742`.
- Segment rendering: `featureLink` and `renderSegments` `:395-396`; lane one's overview lines `:945-985`.
- Ages: `plural`, `unknownAge`, `wholeDays` `:190-192`; `ageDays` `:736`; `artifactAges` `:254-367`.
- Parked set and checker reads: `check` `:955`; `deliverableGaps` `:956`; `byCapability` and `gapRows` `scripts/deliverables.mjs:692-696`; `readerClaim` `:80-91`; the checker's reader acceptance `:650-660`; `deliverableClaims` `:319-343`; `deliverableCodeState` and `isMadeAndReadByCode` `:345-356`.
- The String() rule: `scripts/product-report.mjs:91`, `:131`, `:529-531`, and `generateReport` `:1030`.
- Contract constants: `:43-83`.
- Tests: `renderedProduct`, `renderedClaims`, `renderedArtifactLines`, `onlyArtifactAge` `packages/nana-pack/tests/product-report.test.mjs:139-152`; `artifactFlowLedger` `:82-111`; `noArtifactRegistryLedger` `:112-114`; `historyFixture` `:115-125`; the shared-model renders `:246-261`; R-1041 `:279`; R-1019 `:363-368`; the checks above. New-file form and helpers: `product-overview.test.mjs:1-53`. Shared helpers: `report-fixtures.mjs:1-8`, `:27-38`, `:62-97`.
- Retired-row bookkeeping: R-2743 at `REQUIREMENTS.md:2832`.
- Changed-row bookkeeping and title changes: lane one's R-2794 widening and R-1019 retitle (`docs/reviews/page-overview-2026-10-25/must-meet.md`).
- Ledger rows: R-1012 `:2781`, R-1014 `:2795`, R-1015 `:2796`, R-1019 `:2801`, R-1041 `:2814`, R-2452 `:2821`, R-2542 `:2824`, R-2543 `:2825`, R-2642 `:2826`, R-2790 `:2835`, R-2794 `:2839`, R-2799 `:2840`, R-2800 `:2841`, R-2801 `:2842`, R-2802 `:2843`, R-2927 `:2850`.
- Rule text: `packages/nana-pack/skills/requirements/SKILL.md:129`; `packages/nana-pack/README.md:30`.

Helper moves: `feature`, `stage`, `code`, `manual`, `park` and `page` from `product-overview.test.mjs` to `report-fixtures.mjs`, each named in the report. In product code nothing private moves between modules: `readerClaim` is already exported, and the age part reads the existing `ageDays` map.

## R-1012, R-1019 and the self-contained renderer

- R-1012: every new list has a fixed order (Product view order, A-ID order, claim order); no new input is read. The same commit still gives the same bytes.
- R-1019: no view is added or removed. `#artifacts` still routes, and unknown hashes still fall to the Overview. Every new string reaches the page through `text` or `renderSegments`; pair 33 and the extended check pin it.
- The renderer ships as `String(renderInto)` (`:1030`). The one-line text, the block headings and the section headings arrive finished in the model; pair 32 pins it.

## Class and builder

Ordinary. Ladder: the roster's final reviewer only (`reviewer: claude-code opus`, through claude-review); the larger builder (`openai-codex gpt-6.1-sol high`) is a different lineage. Builder: `pi-worker --lane-size larger`, one session. No local install check: nothing under `packages/nana-setup/` and no hook changes. The seat pushes the draft pull request at build 1 and reads both report test files' Windows times before the review brief; `renderedHomes` adds in-process renders to `product-report.test.mjs`. The seat runs the wrong-code pairs before the final review. Before the final review and the land, it runs `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carries the output in both.

Size: medium. About 90 lines added and 80 removed in `scripts/product-report.mjs`; no change in `scripts/deliverables.mjs`. About 220 new test lines in one new file, about 40 moved helper lines, about 60 edited and 15 deleted lines in `product-report.test.mjs`, and 1 edited line in `product-overview.test.mjs`. Plus 9 ledger rows and 2 doc lines.

## Page effect

Measured at ccf3ad60 on a scratch clone with no runtime data (`<scratch>/pd2/page-ccf3ad60.html`; counts are `p`, `li` and `h3` blocks, wrapped lines at 125 characters). The after figures are inferred from the same model, not run on a built tree.

| View | Before | After (inferred) |
|---|---|---|
| Page | 2,198,854 bytes | about 10 to 20 KB smaller: the 12.6 KB flow model and 37 reasons go |
| Product | 413 lines, 33.9K characters, about 488 wrapped | about 189 lines, about 235 wrapped |
| Artifacts | 691 lines, 51.0K characters, about 834 wrapped (20 pair headings, 51 flow lines, 80 cards of 559 lines, lists of 20 and 37) | about 60 lines: 2 headings, 1 note, 57 items |
| Feature detail, 39 pages | 13,954 lines | about 14,900: 42 blocks and 80 cards arrive; FEAT-013 gains 11 cards |

- One-line age parts with today's data on that clone: 8 with days, 20 not measured, 6 unknown, 8 output only. On the seat's clone the runtime map and record stores give days for most of the 6 unknown (inferred).
- Reader parts today: 15 person only, 11 code only, 16 mixed or other kinds; 21 carry `parked`.

## Known limits (the seat writes them to FEAT-039's file before the final round)

- The age text shows twice on one detail page when the home feature registers the entry it names: 31 of today's 38 direct artifact lines. R-2799 keeps the two equal.
- A read shows on both ends: the card's `Read in:` line on the maker's page and the `Reads:` line on the reader's page.
- The `Registers:` index line repeats the card headings below it.
- The one-line age is the largest measured count. A deliverable with one measured and one unmeasured artifact shows only the measured days.
- `no readable reader` covers both no `Read by:` claim and only unreadable ones; the checker's notes say which.
- The Overview's stale artifact items do not link to their maker's page, where the cards now sit.
- R-2794's lists still name each feature's entries, and Product cards keep their feature bars beside the Features view's.
- The Product count line repeats the first line of the Overview's What it does block.
- No check pins that the tree checker accepts a read toward an earlier capability; that clause retired with R-2800.
- Long detail pages grow; FEAT-013's gains 11 cards above its rows.
- A bookmark to `#artifacts` now opens the two lists only.

## Notes the seat writes before the final round

- HANDOFF, Next item 4 (lane one's wording) becomes: "**Product page readability (the owner, 2026-10-25).** Both page lanes are on main. The page opens on the overview, and each feature's page holds its deliverables' claims and its artifact cards. Known bugs and each platform's CI on the overview come later."
- HANDOFF, Next item 5: "Page lane two comes next." becomes "The owner picks the next lane." The seat-work sentence after it stays.
- HANDOFF, Landed: "2026-10-2x: product cards show one line per deliverable; claims and artifact cards moved to each feature's page; the flow lines retired."
- Then `nana-writing HANDOFF.md`.
- FEAT-039 known-bug file: remove the parked-mark line (`docs/known-bugs/FEAT-039.md:42`) and the flow lines (`:67`, `:68`); cut `:70` to its first-list half; reword `:71` for the card's `Made by:` line; add the known limits above.
- The land report: the age repeat, with "Should a deliverable's artifact line drop the age its card shows? Default: later." That later lane changes R-2545, R-2744, R-2745 and R-2790 and moves the registry-entry age checks onto cards.
- The builder's evidence file under `docs/product-report/`, in `page-overview-build.md`'s form.
- A session entry in `docs/sessions/`.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated after any merge of main, with a confirmation round.
- After the land: check the land-written page's commit against main, then publish it to the owner's copy.

## The claim most likely wrong

That the 25 renamed age checks pass unchanged on `renderedHomes`. It holds only if every block keeps the `deliverable-artifact` class and each age fixture's first block line is the one the check reads. `onlyArtifactAge` takes the first line across all detail pages, which today's one-feature fixtures make safe (inferred, not run).
