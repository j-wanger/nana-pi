# Plan: ask-stakes

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-pack/prompts/planner.md,packages/nana-pack/tests/planner-prompt.test.mjs,packages/nana-pack/lib/ask-shape.mjs,packages/nana-pack/tests/ask-shape.test.mjs,scripts/product-report.mjs,packages/nana-pack/tests/product-overview.test.mjs,packages/nana-pack/tests/product-report.test.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-039.md,HANDOFF.md`):

    ordinary

Attack taken (plan-attack.md): 1 MUST, 3 SHOULD, 5 NOTE, all by the seat.

Ordinary lane: one final reviewer, light checks. The lane changes the product page, so the seat's first-look step applies.

## Purpose

The owner, 2026-10-29: "keep the revertability cost, add the reader suggestion". The outside reader's suggestion: "State the expected benefit and missed problems for each choice, alongside the cost of changing it."

So planner questions keep `Cost of a wrong guess:` (starting `easy to undo` / `hard to undo`) and gain one new labelled line: one concrete gain of the default and one problem it may miss that the main alternative would catch. The ask parser reads that line, and the product page shows it in Decisions and Needs you. Older asks without the line render exactly as today.

## Assumptions

- A1. The four existing labels keep their exact words. The seat guide's blocking rule (`hard to undo`) and the Needs you cost tier read `Cost of a wrong guess:` unchanged, so neither needs an edit. May be wrong if the owner wanted the cost line reworded; he said "keep".
- A2. The new line sits between `Default:` and `Cost of a wrong guess:`, so a reader meets the default, then what it gains and misses, then the cost of being wrong. Rendering follows the same order.
- A3. The seat does not re-post the older open asks; they lack the line and render as today. The seat posts this lane's own ask in the five-line form below, before first-look, so the new line shows on the page in Decisions and Needs you at land (attack M1).
- A6. Unverified: that planners write a useful gains line. R-3070 pins only that the prompt requests it, in a set shape; the lane measures no planner output.
- A4. R-3010 is retired as superseded by R-3070, following the R-2920 to R-3050 precedent, rather than amended in place, because its "four labelled lines" text becomes false.
- A5. The new rows for the planner prompt live in FEAT-006 beside R-3010; the parser and page rows live in FEAT-039 beside R-3052 to R-3055.

## Open choices

- O1. One new label versus rewording an existing one. Chosen: one new label. Rewording `Cost of a wrong guess:` would break the seat guide's blocking rule, the Needs you tier, the pinned prompt sentence and 25-plus open issue bodies. A new line breaks none of them; absent lines degrade to today's view.
- O2. Group shape. Default: every group gains a `gains` key, null when absent, mirroring `cost` and `otherwise`. The builder updates the existing `deepEqual` expectations in `ask-shape.test.mjs` (forecast: four assertions). Omitting the key when absent is acceptable if the builder reports it.
- O3. Carried bug (1) is fixed here, since the lane edits the same function. Corrected diagnosis (attack N1): issue 255 has no separate body-level `Default:`. `inlineValue`'s `^` with the `m` flag matches the group's own `Default:` line and cuts it at the first ". ". Fix: the recommendation takes an inline `Recommendation:` first, then the default of the first group that has one (today's `groups.find` rule, unchanged), then the body-level inline `Default:`. Only issues 255 and 256 change; both get their full default (attack N1). The builder may choose another fix with the same result, and reports it.
- O4. Needs you shows only the first group's new line, as it shows only the first group's cost. Decisions shows every group's.
- O5. A value placed on lines below the label (for example indented `Gains:` and `Misses:` lines) is not joined; the parser reads one line, so the group's `gains` is null and the page shows nothing. Chosen: the prompt says "on one line", R-3071 pins the null result, and the builder adds a known-bug line for it. Joining continuation lines is a later fix if real asks hit it.

## Questions for the owner

Question: Is `What the default gains and misses:` the right wording for the new line?
Default: yes. It names the default's trade against the main alternative, which is what the outside reader asked for.
What the default gains and misses: it keeps one meaning per line, so planners write one gain and one miss; it misses a second alternative, which `What each choice gains and misses:` would catch.
Cost of a wrong guess: easy to undo; one label constant, one prompt sentence and their two pins change.
If answered otherwise: the builder swaps the words in `ASK_LABELS` and the planner prompt; every other test imports the name, not the literal.

## Feature

Feature: FEAT-006 · Launch builders with execution limits

Row R-3070 lives in FEAT-006 (beside R-3010). Rows R-3071 to R-3074 live in FEAT-039 · See the product and its decisions in one report.

## Threat model

Honest variation in seat- and planner-written issue bodies is in scope: bold labels, numbered and indented lines, missing new line, CRLF, a body-level `Default:` beside group defaults. Deliberate forgery of issue bodies is out; a finding outside the model is a residual. Residual (attack N3): the body-level `Default:` fallback is not anchored after ": ", so a gains value holding "Default: x" could be read as the recommendation in a body with no group default.

## Precedent

- `packages/nana-pack/lib/ask-shape.mjs` — `ASK_LABELS` and the `cost`/`otherwise` arms of `parseAskBody`; the new label is one more constant and one more arm, read through `valueAfterLabel`. Map search (parse ask issue body labels) named this file first.
- `scripts/product-report.mjs` — the Decisions card loop (`if (group.cost) paragraph(...)`) and the Needs you line list (`...(first?.cost ? [line(...)] : [])`); the new line copies those conditional arms. `OVERVIEW_LABELS` (`cost: ASK_LABELS.cost`) gets a matching `gains` entry. Map search (product report needs you decisions ask card) named this file.
- `packages/nana-pack/tests/planner-prompt.test.mjs` — the R-3010 sentence check; R-3070 replaces it with the same `prompt.includes` form.
- `packages/nana-pack/tests/ask-shape.test.mjs`, `packages/nana-pack/tests/product-overview.test.mjs`, `packages/nana-pack/tests/product-report.test.mjs` — the R-3052, R-3054 and R-3055 tests; the new tests copy their fixtures and line-list assertions.
- `REQUIREMENTS.md` — R-2920 retired as "Superseded by R-3050, 2026-10-29."; R-3010 retires the same way.
- `docs/known-bugs/FEAT-039.md` — the carried lines are appended in its existing one-line form.

Map search (planner prompt owner questions) offered the objective producer files; they do not apply.

Literal search: "four labelled lines" appears only in `planner.md`, its test and R-3010. "Cost of a wrong guess" appears only in `ask-shape.mjs`, its consumers above and their tests; no template or nana-setup file carries it.

## Outside precedent

MADR (Markdown Architectural Decision Records), MIT or CC0-1.0, borrow: its "Pros and Cons of the Options" section states for each option what is good and what is bad, beside the decision. This lane borrows the idea as one labelled line, not the section format.

## Must-meet

1. R-3070 (supersedes R-3010, in FEAT-006) — `planner-prompt.test.mjs`. Proves the planner prompt requests the new line in place, in its set shape, and keeps the cost line. It does not prove planners write the line well (A6). Pins this sentence word for word:
   "Then write **Questions for the owner**. Write each question as five labelled lines: `Question:`, `Default:`, `What the default gains and misses:` (one concrete gain of the default and one problem it may miss that the main alternative would catch, on one line), `Cost of a wrong guess:` (starting `easy to undo` or `hard to undo`), and `If answered otherwise:`. Order them from the costliest wrong guess down. Keep the top one to three; make every other question a marked assumption. With no open question, write `None.`"
   R-3010's check is removed with the row's retirement; R-3012's seat-guide check stays unchanged and green.
2. R-3071 — `ask-shape.test.mjs`. Proves `ASK_LABELS.gains` equals `What the default gains and misses` and that `parseAskBody` puts the value in each group's `gains` for plain, numbered-indented and bold forms; a group without the line has `gains: null`; a label with an empty value and the value on indented lines below gives `gains: null` and leaves the next label's value intact (O5). Pins the label literal once; other tests import the name.
3. R-3072 — `product-report.test.mjs`. Proves a Decisions card draws `What the default gains and misses: <value>` between the recommendation and the cost line for a group that has it, and omits it for a group without it. The existing R-3055 and R-2983 assertions stay byte-identical.
4. R-3073 — `product-overview.test.mjs`. Proves Needs you shows the first group's gains line after `Seat recommends:` and before `Cost of a wrong guess:` when present. The existing R-3054 line list for an ask without it stays exactly as today.
5. R-3074 — `ask-shape.test.mjs`. Proves the recommendation is an inline `Recommendation:` when present, else the default of the first group that has a `Default:` line, read whole, else a body-level inline `Default:`. Pins issue 255's body giving "yes. What it does first, then Needs you, then a closed Records section holding Broken, Gaps and Stale." Pins a body whose first group has no default and whose second does, giving the second group's default. The issue 237, 225 and 242 cases keep today's results.

## Carried known bugs

Append these lines word for word (the third is the builder's own, from O5) to `docs/known-bugs/FEAT-039.md`:

- Records summary (page-needs-you, final review): each count reads its block's first-line text, so a renamed label silently shows 0.
- Ask parser (page-needs-you, final review): `inlineValue` names a variable `escaped` that does no escaping; harmless with fixed labels.
- Ask parser (ask-stakes, plan O5): a gains value written on lines below its label is not read, so the page shows no gains line for that question.

This lane fixes carried bug (1) under R-3074, so it gets no known-bug line. Its carried wording misnames the cause (see O3): "Needs you (page-needs-you, final review): a body-level `Default:` takes priority over the first group's fuller default and stops at the first \". \", so issue 255 shows only \"yes\"."

## Expected test changes (forecast)

- `planner-prompt.test.mjs`: R-3010 check replaced by R-3070.
- `ask-shape.test.mjs`: `ASK_LABELS` and group `deepEqual` expectations gain `gains` (O2).
- `ask-shape.test.mjs`: the issue 256 recommendation expectation becomes its full two-sentence default (attack N1).
- `product-overview.test.mjs` line 118 and `product-report.test.mjs`: unchanged except new cases.
