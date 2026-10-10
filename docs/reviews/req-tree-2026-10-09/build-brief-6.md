# Lane req-tree — continuation 5: close astra land review r4 (SEND-BACK 7/10)   (2026-10-09 · feat/req-tree)

Contract unchanged, plus Amendment A1 (`amendment-A1.md`, `amendment-A1.json`; seat-written, frozen).
Read `astra-land-r4.md`. astra ruled the tree faithful and the reader result sound; two named
verification holes and one bookkeeping note remain. Change nothing else.

1. **`prove.mjs` placeholder bypass** (astra MUST 1). The equality shortcut (`if (a[i] === b[i])
   continue;`) runs before the new-row validation, so a new row left as `| untested | — |` equals the
   placeholder and passes. Validate R-287–R-291 lines first (the canonical four-cell, `implemented`,
   evidence-citing rule), and only then the equality shortcut for other lines. Mutation runs on
   scratch copies: each of the five new rows set to `| untested | — |` → exit 1; real ledger → 0.
2. **The suite ignores real-ledger structure problems** (astra MUST 2). Add an R-288-marked check
   (or strengthen the real-ledger checks) so the suite asserts `checkTree(real ledger).problems` is
   EMPTY, not filtered by problem type; keep the per-row diagnostics. Mutation: on a scratch copy,
   move FEAT-001's `Purpose:` line below its table → the suite's real-ledger check fails (run the
   test against the scratch copy by breaking the code path that loads the ledger, or by a test-only
   loader parameter — never by editing the real ledger); restore → green.
3. **Amendment A1** (astra NOTE 3). Apply exactly the `from` → `to` edit in `amendment-A1.json` to
   `REQUIREMENTS.md` line 11 (the ID-blocks paragraph). Extend `prove.mjs` with `--amendment <sha>`:
   it reads `docs/reviews/req-tree-2026-10-09/amendment-A1.json` at that commit and applies it to the
   expected intro after the frozen `intro_edit`; any other intro difference still fails. Mutation:
   a different edit to line 11 → exit 1.
4. `npm run req:tree` (no diff expected), `npm run map:check`, the proof with both `--approved
   6b9202a501a7fe03dfc834ab34cdfc212f6d92ce` and `--amendment <the commit that added amendment-A1.json>`
   (exit 0; save its output over `prove-output.txt`), then `npm run test:locked`.

Same NOT, allowlist (now including the line-11 edit) and frozen inputs; `amendment-A1.*` and this
brief are frozen too. Report ≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`, with each
mutation's red/green, the exact proof command and summary line, the suite summary line, and the one
claim most likely wrong.
