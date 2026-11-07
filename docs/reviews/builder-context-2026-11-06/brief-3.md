# Brief 3: builder-context, where callers come from

Feature: FEAT-041 · Shape each agent's context by role

R-3747's sentence says "each known caller", which leaves the caller list to the planner's memory. Our measurements (#3, #22) show that misses callers. Change the sentence so the callers come from a fresh read at plan time: list each caller found by searching the repo for the function's name and by the project's map impact command. Keep the rest of the sentence and its example unchanged. Update R-3747's row text and its test so the test also asserts the fresh-read source (the search and the impact command).

## Precedent
- `packages/nana-pack/prompts/planner.md` — the R-3747 sentence added in 47baef52, and line 30's impact-command sentence.
- `packages/nana-pack/tests/builder-context.test.mjs` — the R-3747 test.

Report: the tip, the test run, and the sentence as written.
