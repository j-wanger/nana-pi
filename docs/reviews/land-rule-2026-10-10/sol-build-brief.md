# Review brief — the land rule, build, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + requirements)

You reviewed this lane's plan five times (`sol-plan-r1..r5.md`; LAND-WITH-FIXES 9/10 at r5). A pi luna
builder built it in seven rounds (`build-brief*.md`, `builder-report-*.md`): round 1 got the
behaviour right but deleted 36 land tests and made one suite test run the seat's acceptance script;
rounds 2–6 restored every test (title map `test-title-map.json`; `seat-verify-tests.mjs`), pinned each
row with its own tests and exact evidence, and round 7 ran the CHANGE §6 mutation pairs. The owner's
checkpoint 1 (the R-1008 share with FEAT-008; FEAT-008's purpose) was applied by the seat. The seat
wrote `HANDOFF.md` and the session entry for the merged state before this round.

Review `git diff 1836fa3..HEAD`. Your verdict covers all of it, and nothing is written to main after
the land.

## Attack
1. **The rule.** Using the lane's own `review-ledger run` and `nana-land merge` against scratch repos
   with `HOME` pointed at a scratch folder (never your real ledger), try to land a commit no reviewer
   accepted, or a revision any reviewer rejected — any item, a snapshot, during the suite, in flight,
   a version-1 record, a clone, a crafted verdict line. Beyond the CHANGE §5 residuals.
2. **Wrongly refused lands**: LAND+LAND, scores, CRLF, legacy rows, canonical names.
3. **Rows and evidence.** Each row's cited tests pin its clause (R-1002–R-1011; the reworded R-969,
   R-970, R-976, R-977, R-588, R-731, R-992; R-978 retired); markers present; nothing overclaims.
4. **Coverage.** No test lost (`node docs/reviews/land-rule-2026-10-10/seat-verify-tests.mjs`); the
   suite count against main (a worktree skips 95 bench checks the main checkout runs).
5. **Docs.** The pack README (usage, Trust model, §5 residuals, R-981's patterns), the shared working
   section and `AGENTS.md` byte-identical (R-859), `HANDOFF.md` and the session entry true for the
   merged state.
6. **Acceptance.** `node docs/reviews/land-rule-2026-10-10/seat-verify-land.mjs` exits 0.

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
