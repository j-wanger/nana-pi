Feature: FEAT-006 · Launch builders with execution limits

Lane ask-stakes. Class: ordinary (`node scripts/lane-class.mjs` prints `ordinary` on the planned files). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/ask-stakes, based on the reviewed page-needs-you tip. The plan of record is `docs/reviews/ask-stakes-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it; the plan already takes every attack point. The plan has no list of allowed edits.

What the lane does, in one sentence: each planner question gains one line saying what the default gains and what it may miss against the main alternative, the parser reads it, and the product page shows it in Needs you and Decisions.

Build every must-meet in the plan, rows R-3070 to R-3074, and append the plan's carried known-bug lines word for word. The owner's question is posted as issue 259 in the new five-line form; build on the default.

Numbers that must not move: the `Cost of a wrong guess:` label and its `easy to undo` / `hard to undo` starts; what every open ask other than issues 255 and 256 shows on the page.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; what issues 255, 256 and 259 show in Needs you after the build; each departure from the Precedent below; every existing test you changed.

## Precedent

- `packages/nana-pack/lib/ask-shape.mjs` — `ASK_LABELS` and the `cost`/`otherwise` arms of `parseAskBody`; the new label is one more constant and one more arm, read through `valueAfterLabel`. Map search (parse ask issue body labels) named this file first.
- `scripts/product-report.mjs` — the Decisions card loop (`if (group.cost) paragraph(...)`) and the Needs you line list (`...(first?.cost ? [line(...)] : [])`); the new line copies those conditional arms. `OVERVIEW_LABELS` (`cost: ASK_LABELS.cost`) gets a matching `gains` entry. Map search (product report needs you decisions ask card) named this file.
- `packages/nana-pack/tests/planner-prompt.test.mjs` — the R-3010 sentence check; R-3070 replaces it with the same `prompt.includes` form.
- `packages/nana-pack/tests/ask-shape.test.mjs`, `packages/nana-pack/tests/product-overview.test.mjs`, `packages/nana-pack/tests/product-report.test.mjs` — the R-3052, R-3054 and R-3055 tests; the new tests copy their fixtures and line-list assertions.
- `REQUIREMENTS.md` — R-2920 retired as "Superseded by R-3050, 2026-10-29."; R-3010 retires the same way.
- `docs/known-bugs/FEAT-039.md` — the carried lines are appended in its existing one-line form.



