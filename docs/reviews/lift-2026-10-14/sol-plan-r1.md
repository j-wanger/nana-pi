### MUST

1. **The proof does not independently verify default placement.** In `CHANGE.md` §3.5, check 8 verifies order, not the parent chosen for each section. On trading-zone’s realistic post-general-section shape, a builder regression could place sections 5–11 under CAP-90 while preserving all lines and order. The tree checker would pass, and the owner would act on a materially wrong tree. The proof must independently derive and verify every default section’s expected node and parent.

2. **The proof intentionally permits lost blank lines in re-laid leaves.** Section 3.5 and residual 1 exclude those blanks from accounting. A normal regroup that moves rows can therefore lose a paragraph-separating blank line while still receiving a passing proof and being written. Every input physical line needs an independently verified fate, including blanks in re-laid leaves.

3. **The unterminated-row exception breaks the byte-identical guarantee.** Section 3.5 allows an unterminated final row to gain a line ending, contradicting R-1163 and T5. The tool could then report that every row stayed byte-identical and write bytes it did not preserve. It must retain the unterminated segment or refuse mappings that require content after it.

### SHOULD

1. **The write gate retains a check-to-rename race.** Another session can edit the current ledger after the final re-read and before rename, causing its edit to be overwritten. The plan should use a stronger replace protocol or explicitly narrow the guarantee and preserve recoverable bytes.

2. **The final mutation inventory does not match Seat revision 2.** The revision promises wrong-version, invalid-JSON, and repeated-input-ID mutations, but the displayed 49-pair table does not name them. Update the table and count so each claimed pair has a named red.

VERDICT: SEND-BACK
