### MUST

- **The schema cannot represent an honest move rejection and accepted share for the same row and target.** `R-1175` permits exactly one verdict and one outcome per row-target pair. `R-1187` then requires that an added share use a `share` verdict. For a row whose move to `FEAT-B` is refuted but whose share to `FEAT-B` is accepted, a `move` verdict fails `R-1187`; a `share` verdict plus the refutation has both `carried` and `refuted` outcomes and fails `R-1175`. Dropping the refutation makes the review record and owner page incomplete. This is realistic under the brief’s explicit mixed-move-and-share input and either wrongly refuses the proposal or loses a reviewed decision. Split move and share judgments, or allow typed outcomes for the same row-target pair. (`docs/reviews/regroup-2026-10-15/CHANGE.md:284-291`)

### SHOULD

- **The mutation plan does not pin every new page clause.** `R-1178` adds node labels and feature status, but the wrong-code pairs only cover reserved-node text. `R-1179` adds asked-question numbers, but neither its stated T16 additions nor the wrong-code pairs pin that number. Add mutations for omitted labels, omitted feature status, and omitted question numbers. (`docs/reviews/regroup-2026-10-15/CHANGE.md:285-303`)

The leaf total of 1,152 and the verbatim T10 handoff are correct. Each amended row contains exactly one “shall.”

VERDICT: SEND-BACK
