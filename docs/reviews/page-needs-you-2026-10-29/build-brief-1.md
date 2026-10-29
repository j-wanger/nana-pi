Feature: FEAT-039 · See the product and its decisions in one report

Lane page-needs-you. Class: ordinary (`node scripts/lane-class.mjs` prints `ordinary`). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/page-needs-you, based on main. The plan of record is `docs/reviews/page-needs-you-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it; the plan already takes every attack point. The plan has no list of allowed edits.

What the lane does, in one sentence: the product page's Overview leads with What it does, then shows each ask the owner should answer with its question, the seat's recommendation and the cost of a wrong guess, and tucks Broken, Gaps and Stale into a closed Records section.

Build every must-meet in the plan, rows R-3050 to R-3055, and retire R-2920 and R-2921 as the plan says. The owner's questions are posted as issue 255; build on the defaults.

Numbers that must not move: the session-start block and the pi frontier extension's output, byte for byte, when the issue reader is called without the new body flag; the Overview's existing block contents other than their order and the Records wrapper.

Also add these known-bug lines, carried from the first-look review, to `docs/known-bugs/FEAT-039.md`, exactly as written:

- First look (first-look, final review): the seat guide's command has no `--out`, so as written it prints usage and exits 2; `--page desk` also needs `--before` and `--after`.
- First look (first-look, final review): R-3040 is wider than its test; the test injects the report runner, so the worktree add, child build and cleanup are not run by any test.
- First look (first-look, final review): the view list comes from the before build only, so a feature the lane adds gets no diff.
- First look (first-look, final review): the page-shaping list covers only the report's direct imports; a lane that changes a deeper module gets "nothing to show".
- First look (first-look, final review): the date filter drops every line holding a date, not just the provenance lines.
- First look (first-look, final review): an interrupted run skips cleanup and leaves a temporary worktree; `git worktree prune` clears it.
- First look (first-look, final review): `ACCESSIBILITY_DIFF_MAX_LINES` limits nothing at run time; only the test reads it.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; the Overview's headings in order as the built page shows them; the three asks the Overview lists today and what each shows; each departure from the Precedent below; every existing test you changed.

## Precedent

- `scripts/product-report.mjs` — `OVERVIEW_BLOCKS` and `OVERVIEW_LABELS` (sealed headings and labels), `overviewLines` in `buildReport` (block content), and the overview and decisions branches of the renderer. The new order, the Records wrapper and the ask lines extend these structures; they do not get a parallel set.
- `packages/nana-pack/lib/handoff-issues.mjs` — `readHandoffIssues`, its row validation and its item shape. The opt-in body field follows the existing `--json` list and validation style.
- `packages/nana-pack/lib/handoff-asks.mjs` — `splitOpenSection`, the source of list-ask title and body for the legacy path. Import it; do not re-split HANDOFF.
- `packages/nana-pack/prompts/planner.md` — the ask labels, already pinned word for word by `packages/nana-pack/tests/planner-prompt.test.mjs`. The parser's label constants carry that contract as their provenance.
- `apps/desk/public/app.js` — `el("details", …)` for collapsed notes and thinking cards. Borrow the pattern only; the report renderer stays self-contained.
- `packages/nana-pack/tests/product-overview.test.mjs` — the R-2920 and R-2921 tests and their fake-DOM `blocks(view)` helper. The new tests extend this file.
- `packages/nana-pack/tests/handoff-issues.test.mjs` — the injected `runGh` fixtures. Must-meet 2 extends these.
- From `map:search`: "product report overview blocks order" and "collapsed details section html report" named `scripts/product-report.mjs` and `handoff-asks.mjs` (both already listed). "read github issue body labels" named `issue-watch.mjs` and `nana-frontier-summary.ts`; neither reads bodies, so neither is precedent. "parse labelled lines from text" found no labelled-line parser, so `ask-shape.mjs` is new code with no in-repo precedent beyond the label contract.

