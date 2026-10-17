# Plan review round 3 — regroup, seat amendment 2 only (gpt-5.6-sol, 2026-10-16)

Review ONLY the section "Seat amendment 2 (2026-10-16): shares in the review record, now that regroup-shares has landed"
at the end of `docs/reviews/regroup-2026-10-15/CHANGE.md` on `feat/regroup`. The rest of the plan was frozen after round 2
and is not reopened. The amendment exists because the seat's independent check of build 2 (`seat-verify-228f37c.md`, M6)
found a fail-open gap once main `2dbc817` (share support in the lift) is merged: a proposal can add or drop a share with no
share verdict, and the owner's review page never shows it.

Threat model: honest variation in our tools' output and users' files in scope (an agent-drafted proposal that declares
shares the way main's lift requires, omits a verdict, or mixes a move and a share for one row); deliberate forgery out.
Lane class: format. The review standard pi-review appends governs the bar and the verdict line.

Check: (1) R-1187, with R-1175's exactly-one-outcome rule, closes the gap: no added or dropped share can pass unreviewed or
off the page, and no honest proposal is wrongly refused (an unchanged carried share, an identity proposal, a share added
to a feature that a move also targets); (2) each reworded or new row has one "shall" and a testable clause, and its tests
and wrong-code pairs pin it; (3) the leaf total and the T10 handoff from the shares plan are right; (4) any MUST.
