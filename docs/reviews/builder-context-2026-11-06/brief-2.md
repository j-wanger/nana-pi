# Brief 2: builder-context, the caller contract in plans

Feature: FEAT-041 · Shape each agent's context by role

Add one measured rule to the planner prompt. Evidence:
- #22 (bc8): when a card listed callers that had to keep working, builders fixed them; a hint to "check callers" didn't.
- #57 (bc15, 2026-11-07): reviewers told to run callers caught 1 of 8 breaks. Even when they ran the broken caller, they accepted a traceback or a NaN in a report, because the card never stated the caller's observable contract (U7's card even allowed NaN as "undefined").

Change: in `packages/nana-pack/prompts/planner.md`, where must-meet tests are described, add: when a change alters what a function returns or raises, the plan lists each known caller as its own must-meet line that states the caller's observable contract (for example "the report has no NaN; the CLI exits non-zero with a message, never a traceback"), never just "still works".

## Must-meet
1. R-3747: planner.md tells the planner to write one must-meet line per known caller of a function whose return or raise changes, stating the observable contract, and never "still works" alone. One test asserts the sentence, and asserts that the example names a traceback and a NaN.

Requirements first: row R-3747 under FEAT-041, then the test, then the text. No other change.

## Precedent
- `packages/nana-pack/prompts/planner.md` — line 30's map-impact sentence about forecasting callers. The new sentence goes next to the Must-meet guidance.
- `packages/nana-pack/tests/builder-context.test.mjs` — this lane's test module. Add the test there.

Report: the tip, the test run, and the sentence as written.
