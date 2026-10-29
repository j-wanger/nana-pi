# Plan — page-needs-you (2026-10-29)

Revised after the adversary's attack in `plan-attack.md`. The seat took all points (1 MUST, 5 SHOULD, 5 NOTE).

Lane class (`node scripts/lane-class.mjs --root . --files scripts/product-report.mjs,packages/nana-pack/lib/handoff-issues.mjs,packages/nana-pack/lib/ask-shape.mjs,packages/nana-pack/tests/product-overview.test.mjs,packages/nana-pack/tests/product-report.test.mjs,packages/nana-pack/tests/handoff-issues.test.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-039.md`):

```
ordinary
also reaches: packages/nana-pack/lib/handoff-issues.mjs — also reaches packages/nana-pack/bin/nana-frontier-summary.mjs
also reaches: packages/nana-pack/lib/handoff-issues.mjs — also reaches packages/nana-pack/extensions/nana-frontier-summary.ts
```

The reader change is opt-in, and the default call stays the same, so the session-start producer and the pi extension see no change (must-meet 2 pins that). The body field goes into the `--json` list only under the flag (attack N3).

## Purpose

The owner, 2026-10-29: "Lane first." He picked a lane over a readability talk to fix two weaknesses an outside reader found on the public product page:

1. "Needs you" does not say what needs him. It shows counts and leads to bare issue titles such as "Backups". The reader asked for "the few consequential choices, the seat's recommendation, and why his judgment matters."
2. The product comes after the bookkeeping. Broken, Gaps and Stale, with a 35-ID list of stale assessments, sit above What it does at phone and laptop width. The reader asked to "lead with useful tasks, current limits, and what changed, then tuck the records underneath."

The owner's answer lifts the page's layout freeze for these two points only. The reader's points 3 (zero versus no data) and 4 (machinery counts versus results) are out of this lane.

## Assumptions

- A1. "Lead with what it does" means moving the existing What it does block to the top. This lane adds no new "What changed" or "Current limits" block. What it does keeps its content (point 4 is out of scope). Broken holds today's current limits, and it stays one click away under Records. This may be wrong if the owner wanted new content.
- A2. The page fetches issue bodies through the existing issue reader with one opt-in flag, not through a second gh call. The ruling on second callers says import the helper, not copy it.
- A3. None of today's 27 open asks has the four-line shape (measured 2026-10-29: 0 of 27). Each migrated body opens with a one-paragraph question, then a boilerplate paragraph ("An optional question for the owner, open since … Moved from HANDOFF.md on 2026-10-28."). 13 of the 25 listable asks carry an inline `Default:` or `Recommendation:` (measured 2026-10-29 with the must-meet 3 rule: 242, 237, 230, 225, 224, 223, 222, 220, 219, 218, 217, 216, 215). The parser lifts that value into `Seat recommends:`, so the seat does not re-post old asks in this lane (Q3).
- A4. Bodies now reach the public page. On 2026-10-29, `identity-scan --stdin` over all 27 raw titles and bodies exited 0. The Pages workflow's scan reads the page's escaped JSON, though, and FEAT-039 already records that a word fused to an escape is not counted. Every body paragraph after the first starts right after a `\n`, so a name opening such a paragraph would slip past the Pages scan. The page would then deploy with it. **Residual:** the issues are already public and seat posts pass the scan before posting, so the exposure is small. The builder records it as one known-bug line; this lane adds no new scan step.
- A5. A body is owner-authored (the reader already filters by author) and renders as plain text through the report's existing `createTextNode` path. Markdown such as backticks or `**` shows literally. Known bugs already record that limit for subjects.
- A6. R-2920 and R-2921 are retired as `superseded by R-3050, 2026-10-29` and `superseded by R-3053, 2026-10-29`. R-3050 restates R-2920's landing and tab clauses word for word. R-3053 restates R-2921's count clauses. Only the block order and the "Must decide" title lines change. This follows the ledger's existing retire wording.
- A7. A HANDOFF that uses list asks (the legacy path, no issue pointer) gets the same Needs you listing from each entry's title and body. Its Decisions drawing stays exactly as R-2983 pins it.
- A8. A plan's ask issue may hold several questions (nana-seat.md: one ask issue per plan). The planner orders them costliest first, so the Overview shows the first question and a count of the rest.
- A9. The reason line in an older body ("Your call, because …", only #242 today) is not parsed. The full text stays one click away in the issue. The builder records this as one known-bug line.
- A10. Labels match case-sensitively, as the planner writes them. #231's lowercase `default: it leaves` is not lifted. The builder records this as one known-bug line.
- A11. Decisions keeps each issue ask's creation date as its Since (R-2981 unchanged). The Overview's `since` text and its order use the body's `open since` date when present (attack N1). For a migrated ask, the two views then show different dates. The builder records this as one known-bug line.

## Open choices

- O1. Where the ask-body parser lives. The default is a new pure module, `packages/nana-pack/lib/ask-shape.mjs`, because `product-report.mjs` is 1,068 lines and has one purpose already. The builder may instead place it in `handoff-asks.mjs` if one purpose still holds, and must report that departure.
- O2. The internal model shape for parsed asks, and how the renderer draws a `details` element in the fake DOM the tests use.
- O3. The known-bug lines this lane makes false get removed or rewritten. The builder edits only lines whose claim the change makes false. Those lines are:
  - "Overview (page-overview, plan): the six stale entries … stay on the first screen and grow older each day."
  - "Overview (page-overview, plan): the overview has no line cap. …" Rewrite it, since Records still has no cap.
  - "Public product page (page-on-pages, seat check): an issue ask draws no Ask line, and the issue body never reaches the page."
  - "Public product page (page-on-pages, seat check): every ask moved from HANDOFF shows the migration day …". Rewrite it to say that only Decisions still does.
  "Blocking asks are not listed first in Decisions" stays true; leave it.

## Questions for the owner

Question: Should What it does lead the Overview, with Needs you second?
Default: yes. What it does first, then Needs you, then a closed Records section holding Broken, Gaps and Stale.
Cost of a wrong guess: easy to undo; one sealed order list and its pin test change.
If answered otherwise: Needs you comes first and What it does second; Records stays last and closed.

Question: Which asks should the Overview list under Needs you?
Default: every blocking ask, then fill to three in total. Fill first with optional asks whose cost line starts `hard to undo`, then other optional asks, newest first by the body's `open since` date. Parked asks are never listed. A line then links to the rest in Decisions.
Cost of a wrong guess: easy to undo; one chosen cap and one ordering rule.
If answered otherwise: the builder changes the cap or the tier order; the rows and tests name the tunable, not the literal.

Question: Should the seat re-post the 25 older asks in the four-line shape?
Default: no. The parser now lifts a recommendation from 13 of the 25, and the rest show `Seat recommends: none recorded`.
Cost of a wrong guess: easy to undo; it is seat work on GitHub, not code.
If answered otherwise: the seat closes and re-posts them after this lane lands, as separate carry. The rule says delete a wrong post, never edit it.

Feature: FEAT-039 · See the product and its decisions in one report

## Threat model

Honest variation in our own tools' output is in scope. That covers:
- bodies with or without the four labels, and labels written as bullets or in bold
- an inline `Default:` or `Recommendation:` in a body without labels
- several questions in one body, empty bodies, and the migration boilerplate paragraph
- a failed issue read, and the legacy list-ask path

Deliberate forgery is out of scope: a crafted body meant to break the page, or an issue by another author (the reader drops those already). A finding outside this model is a residual, like A4's escape blind spot.

## Precedent

- `scripts/product-report.mjs` — `OVERVIEW_BLOCKS` and `OVERVIEW_LABELS` (sealed headings and labels), `overviewLines` in `buildReport` (block content), and the overview and decisions branches of the renderer. The new order, the Records wrapper and the ask lines extend these structures; they do not get a parallel set.
- `packages/nana-pack/lib/handoff-issues.mjs` — `readHandoffIssues`, its row validation and its item shape. The opt-in body field follows the existing `--json` list and validation style.
- `packages/nana-pack/lib/handoff-asks.mjs` — `splitOpenSection`, the source of list-ask title and body for the legacy path. Import it; do not re-split HANDOFF.
- `packages/nana-pack/prompts/planner.md` — the ask labels, already pinned word for word by `packages/nana-pack/tests/planner-prompt.test.mjs`. The parser's label constants carry that contract as their provenance.
- `apps/desk/public/app.js` — `el("details", …)` for collapsed notes and thinking cards. Borrow the pattern only; the report renderer stays self-contained.
- `packages/nana-pack/tests/product-overview.test.mjs` — the R-2920 and R-2921 tests and their fake-DOM `blocks(view)` helper. The new tests extend this file.
- `packages/nana-pack/tests/handoff-issues.test.mjs` — the injected `runGh` fixtures. Must-meet 2 extends these.
- From `map:search`: "product report overview blocks order" and "collapsed details section html report" named `scripts/product-report.mjs` and `handoff-asks.mjs` (both already listed). "read github issue body labels" named `issue-watch.mjs` and `nana-frontier-summary.ts`; neither reads bodies, so neither is precedent. "parse labelled lines from text" found no labelled-line parser, so `ask-shape.mjs` is new code with no in-repo precedent beyond the label contract.

Forecast from `map:impact`: `handoff-issues.mjs` has 18 transitive callers, including the frontier summary producer, `issue-watch`, `frontier-golden.test.mjs` and `hook-deadlines.test.mjs`. The default call stays the same, so these tests should not move. Expected test edits:
- the R-2920 test (`OVERVIEW_BLOCKS` literal at line 47) and the R-2921 test
- possibly the overview check in `product-report.test.mjs` (around line 293), whose `h3` headings stay inside Records
- the R-2981 fixtures, if they assert the exact gh arguments

This forecast is not a limit on the builder.

## Outside precedent

- MADR (Markdown Architectural Decision Records), MIT/CC0 — skip. Its Context, Options and Outcome layout is a fuller decision record; our ask shape is already fixed by the planner prompt.
- Public reference: the WHATWG HTML `details` and `summary` elements, which collapse content by default with no script.

## Must-meet

One label set serves both views (attack S1, S2). It is one sealed constant beside the parser: `Question`, `Seat recommends`, `Cost of a wrong guess`, `If answered otherwise`, plus the fallback `none recorded`. Its provenance: the planner prompt's labels for three of them. `Seat recommends` is the seat's 2026-10-29 ruling on attack M1, shown for the planner's `Default:` value. Every assertion imports the constant.

1. **R-3050 — Overview order with records tucked underneath** (`product-overview.test.mjs`). Row text: "The product report shall render its Overview view for an empty hash, `#overview` and every hash that names no other view and no feature, list its tabs as Overview, Decisions, Product, Artifacts, Features, Issues and Requirements in that order, and show the blocks What it does and Needs you in that order, then one closed section whose summary reads `Records: Broken, Gaps and Stale` holding the blocks Broken, Gaps and Stale in that order, each heading linking to its full view." The test keeps R-2920's hash cases, `#shared` included. `OVERVIEW_BLOCKS` equals `[["What it does", "#product"], ["Needs you", "#decisions"], ["Broken", "#issues"], ["Gaps", "#product"], ["Stale", "#features"]]`. The rendered `details` element has no `open` attribute. Proves: the product leads and the bookkeeping sits closed underneath. Retires R-2920.
2. **R-3051 — the issue reader returns bodies only when asked** (`handoff-issues.test.mjs`). With `withBody: true`, the gh `--json` field list is `number,title,labels,author,createdAt,body`, and each item carries `body` as a string. A row whose body is not a string gives the `unreadable output` failure. Without the flag, the gh arguments and the returned items are byte-identical to today's. Proves: the page gets bodies, and the session-start producer and pi extension see no change.
3. **R-3052 — the ask body parses into questions, a recommendation and a date** (new `ask-shape` tests).
   - A body with `Question:` lines returns one group per `Question:` line. Each group holds the default, cost and otherwise values that follow it. A label matches plain, after `- ` or `* `, or wrapped in `**`.
   - A body with no `Question:` line returns its first paragraph (the text before the first blank line, trimmed) as its one question.
   - Its recommendation is the value of an inline `Recommendation:`, else of an inline `Default:`. A label counts at a line start or after `.`, `?`, `!`, `:` or `;` and a space. Its value runs to the first `.` followed by a space or the end, or to the line end.
   - An `open since YYYY-MM-DD` in the body gives the ask's date; otherwise the date is the creation date.
   - An empty body returns no question and no recommendation.
   - Fixtures, word for word from the issues: #237 gives recommendation `wait for you` and date `2026-10-09`. #225 gives question `Should new commits use a different git author? Default: leave it.`, recommendation `leave it` and date `2026-10-21`. #242 gives recommendation `keep the narrow rule`, its first paragraph as its question, and its creation date. Two more fixtures cover a two-question shaped body and a body with no recommendation.
   Proves: shaped and older asks both yield a question, and 13 of today's 25 yield a recommendation.
4. **R-3053 — which asks Needs you lists** (`product-overview.test.mjs`). The block keeps R-2921's count line, `Asks: <n> · blocking (must decide): <b> · optional: <o> · parked: <p>`, and the open-questions line counting the questions the Decisions view lists. It lists every blocking ask, then fills up to `NEEDS_YOU_ASK_CAP` asks in total. The fill takes optional asks whose first group's cost starts `hard to undo` first, then other optional asks. Within a tier, the order is newest first by the parsed date, then by higher issue number. Parked asks are never listed. When asks remain unlisted, a last line reads `<r> more in Decisions` and links to `#decisions`. A failed issue read keeps today's unknown line and lists nothing (R-2984 unchanged). Proves: the few asks shown are chosen by a stated rule. Retires R-2921.
   A separate pin test, naming R-3053, asserts `NEEDS_YOU_ASK_CAP === 3` with provenance `chosen`. Every other assertion imports the name.
5. **R-3054 — what each listed ask shows in Needs you** (`product-overview.test.mjs`). Each listed ask shows these lines, in order:
   - `<title> · <kind> · since <date>`, with the title linked to its issue when it has one, and the parsed date
   - `Question: <first question>`
   - `Seat recommends: <recommendation>`, or `Seat recommends: none recorded` when the parser found none
   - `Cost of a wrong guess: <cost>`, only when the first group has one
   - `<k> more questions in the issue`, only when the body holds more than one group
   Fixtures #242, #225 and one with no recommendation pin the exact lines. Proves: each ask says what is asked and what the seat recommends, or shows that no recommendation was recorded.
6. **R-3055 — Decisions shows each issue ask's parsed text** (`product-report.test.mjs`). Each issue-ask card keeps its linked title, Kind and Since lines (R-2981 unchanged). Then each group follows with the same label set: `Question:`, `Seat recommends:` (`none recorded` when absent), `Cost of a wrong guess:` and `If answered otherwise:`. A cost or otherwise line the body lacks is skipped. A body holding `<b>x</b>` renders those characters as text. The list-ask drawing still matches main's captured text (R-2983 unchanged). Proves: the full view carries every choice in the same words as the Overview, and bodies cannot inject markup.

Expected first-look result (the seat runs `npm run first-look -- --page product` after build 1): at 390 px, What it does and Needs you form the first screen. No FEAT-ID list shows until Records is opened. At least one listed ask shows a `Seat recommends:` line with a value; by the measured data, the Overview lists #242, #215 and #230, and all three carry one.
