# Plan review brief — the land rule, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + requirements)

Review the change declaration `docs/reviews/land-rule-2026-10-10/CHANGE.md` before anything is
built. The owner ruled on 2026-10-10: "anything landed on main should be accepted by an independent
reviewer." Fable challenged the first draft (`fable-consult.md`); a seat workflow of four read-only
checkers and a critic fact-checked the second against the code (`factcheck.md`, critic section
last), and the plan was rewritten from its confirmed items. Read the code yourself; do not trust
either record.

## Attack
1. **Does the planned design enforce the owner's rule** through `nana-land`, given
   `packages/nana-pack/bin/nana-land.mjs` and `packages/nana-pack/bin/review-round.mjs` as they are?
   Find any path by which a commit no reviewer accepted, or a revision some reviewer rejected, still
   lands after the change — beyond the residuals declared in §5.
2. **Wrongly refused lands.** Does any design choice refuse a legitimate land (LAND+LAND, a
   confirmation round on a new tip, several items, legacy records, review-ledger run records)?
3. **Rows.** Each row in §2: one `shall`, testable, in the right home under the governance text in
   `REQUIREMENTS.md` ("How the tree is governed"); rewordings keep every clause the cited tests pin
   today; nothing new is unrowed (the stub removal, the verdict parse, the round number).
4. **Scope and tests.** Is the In list complete — every file, test and README sentence the change
   breaks or must update (check `land.test.mjs`, `review-ledger.test.mjs`, `immutable-review.test.mjs`,
   the README pins, the shared working section and its byte-identity test)? Is anything in it not
   needed (subtraction test)?
5. **Residuals.** Are the §5 residuals honest and complete, and should any of them be fixed here
   instead because it is cheap and central to the rule?

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
