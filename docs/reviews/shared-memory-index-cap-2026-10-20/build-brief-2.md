# shared-memory-index-cap — build brief 2

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/shared-memory-index-cap`, on top of the current tip (the seat committed its pairs record after build 1). Rules: the builder preamble, but single test files only, never the full suite (other builders share this machine). No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits.

## Why
The seat's pairs on build 1 (`seat-mutate-output-e5b95409.txt`): 20 of 23 red. H7, H16 and H22 survive, and each prints more than the 9,000-character budget:
- H16 (the drop loop reserves no room for the fold line): a fixture like B with 103 long titles prints 9,224 characters.
- H7 (the fit-at-zero test reserves no fold room): 60-character titles at 103 and 104 entries print 9,049 and 9,131 characters, in the roughly 200-character gap between "titles fit without the fold line" and "titles fit with it".
- H22 (the self-heal note printed outside the budget): an over-budget index with the "self-heal skipped: symlinked path component" note prints 9,062 characters.
R-2340 ("shall write at most the output budget") is checked only on fixture A, which takes the description-cut path with no note.

## Do, nothing else
1. In `tests/shared-memory-budget.test.mjs`, widen R-2340's check (title unchanged, row unchanged) so it also requires stdout length ≤ `SHARED_MEMORY_OUTPUT_BUDGET` on: fixture B (the drop path); a boundary fixture whose titles fit at length 0 without the fold line but not with it (60-character titles, entry count chosen from the budget and the measured header, so it holds if the budget is retuned); and an over-budget index run where the self-heal note prints (a symlinked path component in the home, as `shared-memory-hook.test.mjs` sets one up). Import the budget by name; no literal 9000.
2. Each new case must fail under its pair's wrong code in `docs/reviews/shared-memory-index-cap-2026-10-20/seat-mutate.mjs` (H16, H7, H22; read the table, do not edit it). Show each red, then green on the tip.
3. No product change is expected. If a new case fails on the tip, stop and report it instead of changing the hook.
4. Run alone: `npm test -- packages/nana-setup/tests/shared-memory-budget.test.mjs`, `shared-memory-hook.test.mjs`, `hooks-closed-output.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`. In the new test code keep `import { tmpDir } from "./tmp-dir.mjs";` on its own line (R-917).
5. Commit with explicit paths.

**Report** (6 lines or fewer, VERDICT first): commit; each command's result; the three red-under-wrong-code results.
