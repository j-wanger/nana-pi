### MUST

1. **A reused feature ID can add an unreviewed share.**  
   `scripts/requirements-regroup.mjs:525-537` exempts every output share already held by the input feature with the same ID. In a tree regroup, an output feature may reuse that ID while sourcing a different old heading and declaring `shares_added`. The lift accepts the addition, but the checker requires no share verdict and the owner’s page omits it. `--write` then adds the share outside the review boundary.

2. **Symlinked evidence can escape the project root.**  
   `scripts/requirements-regroup.mjs:114-121` checks only the lexical path. A repository symlink such as `docs/generated -> ../../shared-docs` makes `docs/generated/plan.md` pass as gap evidence. The owner can approve a feature grounded solely in an outside-root file, contrary to R-1174 and the threat model’s link coverage.

3. **Legal purpose or reason text can disappear from the owner’s rendered page.**  
   `scripts/requirements-regroup.mjs:618,637-638` and the reason renderers insert proposal text into Markdown without escaping angle brackets. An honest purpose such as `<provider>` renders blank, although the checker reviewed the raw text and the lift later writes it. This leaves reviewed ledger content off the owner’s actual page.

### SHOULD

4. **Evidence paths containing spaces are misclassified as text-placed.**  
   `scripts/requirements-regroup.mjs:103-110` truncates every citation at its first space. I confirmed that an existing citation such as `tests/my feature.test.mjs::pins row` makes `isTextPlaced()` return true. The resulting page falsely reports the row as placed from text alone.

### NOTE

5. **The records contain two factual inconsistencies.**  
   `HANDOFF.md` and the session entry say Windows fails 68 files, while the final verification record says both affected CI legs fail 69. The session also says every build received an independent check, but `seat-verify-cd8991b.md` explicitly says build 5 did not.

The dedicated regroup suite passed 56 checks locally.

VERDICT: SEND-BACK
