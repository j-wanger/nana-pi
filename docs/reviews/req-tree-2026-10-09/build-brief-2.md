# Lane req-tree — continuation 1: make the proof pass, strengthen R-291, run the mutation pairs   (2026-10-09 · feat/req-tree)

The contract is unchanged: `docs/reviews/req-tree-2026-10-09/CHANGE.md` and `build-brief.md`
(approved commit `6b9202a501a7fe03dfc834ab34cdfc212f6d92ce`). Your first run committed `5c6080a`
and reported PARTIAL: the proof failed and no mutation pair ran. The seat diagnosed the proof
failure; both causes are small and both are yours to fix.

## Seat diagnosis (verified by the seat on a scratch copy outside the repo)
1. **`move.mjs` does not trim the intro's trailing blank line.** The base intro (title through the
   line before `# Part A`) ends with a blank line; CHANGE §4 says a copied block has its leading and
   trailing blank lines trimmed, then exactly one blank line separates blocks. The ledger therefore
   has two blank lines before `## How this file is organized` (lines 14–15); every later line is
   off by one, which is why the proof printed ~1,540 failures. Deleting that one line on a scratch
   copy leaves only cause 2.
2. **`prove.mjs` compares the five new rows' whole line.** It expects `| untested | — |`. CHANGE §4
   step 3 says only the ID and Requirement cells of R-287–R-291 must equal `tree.json` → `new_rows`;
   Status and Evidence are yours. With both fixes the proof reports no other failure and the
   section map passes.

## Work
1. Fix `move.mjs` (trim the copied intro's trailing blank lines). Re-run it so the ledger is its
   output again, then restore R-287–R-291's Status and Evidence cells as you had them. The
   ledger must be exactly what the fixed `move.mjs` writes, except those five rows' last two cells.
2. Fix `prove.mjs` (ID and Requirement cells only for R-287–R-291). Do not loosen anything else.
3. Run the proof; save its full output to `docs/reviews/req-tree-2026-10-09/prove-output.txt`
   (it must hold the one summary line).
4. **Strengthen R-291's field evidence.** Today's fixtures prove a changed ledger changes the
   render; two of them do not isolate their field: "parent" also changes a capability ID, and
   "row count" also changes the row IDs. Add a field check — a function that, for every heading in
   the parsed ledger, confirms the outline states its ID, label, purpose, parent, row count and
   row-ID ranges — and pin R-291 with it: the real outline passes, and an outline with each field
   deleted or altered in turn fails, naming the field. Keep the freshness check (committed outline
   equals a fresh render).
5. **Run every CHANGE §5 mutation pair** and record each red then green in the report:
   - code mutations in `scripts/requirements-tree.mjs`: disable each of the four structure checks
     in turn (R-287, R-288, R-289, R-290 tests go red), and drop one field from the renderer (R-291
     goes red); restore and re-run green;
   - one hand-edited line in `docs/requirements-tree.md` (R-291 red), restored;
   - `prove.mjs` on scratch copies of the ledger in the OS temp dir (never the repo): one altered
     prose byte in place, one extra prose line, one swapped pair of note lines, one deleted blank
     line, one inserted blank line — each must exit 1; the unaltered ledger exits 0.
   Mutation breaks the code or a scratch copy, never an assertion.
6. `npm run req:tree`, `npm run map`, `npm run map:check`, then `npm run test:locked`.

## doneWhen, NOT, allowlist, constraints, report
As in `build-brief.md`. Same allowlist; the frozen inputs stay frozen (this brief included). Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`, with the prove summary line, each
mutation pair's red and green, the suite summary line, and the one claim most likely wrong.
