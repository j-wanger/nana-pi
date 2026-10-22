# Land review — req-tree, 2026-10-09 (reviewer: gpt-6-astra; role: land ruler)

**Round 5 (second land round, over the cap).** Your r4 review is `astra-land-r4.md` (SEND-BACK 7/10:
the tree faithful; two verification holes; a stale reserve sentence). Fix runs: `build-brief-6.md`
and `build-brief-7.md` (report 6 claimed the placeholder bypass closed; the seat's re-run refuted it,
`seat-verify-r4-output-before-fix.txt`; run 7 closed it). The reserve sentence is corrected under the
seat's Amendment A1 (`amendment-A1.md`/`.json`): `prove.mjs` now takes `--amendment
48c92146f5c57be7d666cc9d90034b7196b39377` and accepts exactly that second intro edit. Seat re-run
after the fix: `seat-verify-r4-output.txt` (every line as wanted). Verify r4's findings are closed,
judge Amendment A1, then give the land ruling. The proof command is now
`node docs/reviews/req-tree-2026-10-09/prove.mjs --approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce --amendment 48c92146f5c57be7d666cc9d90034b7196b39377 REQUIREMENTS.md docs/requirements-sections-2026-10-09.md`.

You drafted this tree in a separate session with the owner (8 capabilities, 38 features, 21 subgroups;
`docs/reviews/req-tree-2026-10-09/mapping-astra.json` is your draft, unedited). The owner decided to
implement it and agreed the plan at checkpoint 1 (`CHANGE.md` §7a; approved commit
`6b9202a501a7fe03dfc834ab34cdfc212f6d92ce`). A pi luna builder built it in five runs; sol reviewed the
plan three times (item `req-tree-plan`) and the build three times (item `req-tree`, all SEND-BACK, every
finding closed in turn; `sol-build-r1..r3.md`). The last fix run (`build-brief-5.md`) closed sol r3's
two named holes. This review is a fourth round on item `req-tree`, taken over the cap for those two
named fixes and the land ruling.

Read `CHANGE.md`, `tree.json` (with `mapping-astra.json`), `fixed-text.md`, the sol reviews and the
seat's responses, `seat-attacks-output.txt`, then `git diff 6b9202a..HEAD` (judge the ledger move
through `prove.mjs` and sampling, not line by line).

## Rule on
1. **Does the result match the tree you drafted?** Every row in the feature you placed it in, except
   the declared deviations (all 22 G rows kept whole in FEAT-033; R-285/R-286 in FEAT-006; flat
   SUB-001..SUB-021 numbering; R-287–R-291 in FEAT-028). Are the deviations sound? Any undeclared one?
2. **The two r3 fixes.** The R-291 equality check is back in the suite; `prove.mjs` now requires the
   five new rows to be exactly four canonical cells. Try to defeat each (scratch copies only).
3. **The reader's result.** Read the top of `REQUIREMENTS.md` and `docs/requirements-tree.md` as the owner
   will at checkpoint 2. Does it let him understand what the requirements enable and why? Anything
   misleading in the purposes, the counts or the section map?
4. **Integration.** Consumers of the ledger (trace rail, `req:rows`, R-756, README check, code map,
   startup guidance) — anything broken or silently weakened? Run what you need (`npm run map:check`,
   `npm run readme:check`, the rail test; avoid the full suite — the seat runs it before the land).
5. **Residuals.** Price each declared residual by cost of error: HTML blocks/comments, link reference
   definitions and indented code are not modeled by the tree checker; regroups are visible, not
   pinned (Owner's ruling, decision 4); a row in the wrong feature is the owner's judgement, not a test.

## Output
Answer with the full review as your final message; do not write it to a file. Findings MUST / SHOULD
/ NOTE with file:line, evidence and the smallest fix; then the residuals you accept and their price;
a score out of 10; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
