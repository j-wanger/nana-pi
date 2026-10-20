# Confirmation round 3 — pwsh-lexer-oracle, 2026-10-19 (Opus, the final reviewer)

Round 2 accepted `6e4090c8` (Opus LAND, Fable LAND), each with SHOULDs about records and unrecorded neighbours of round 1's shapes. This confirmation round on the final tip after fixes to named findings reviews only `git diff 6e4090c8..HEAD` on `feat/pwsh-lexer-oracle`: commit `3d3e4dc7` changes records and one row's text, no code and no test.

- HANDOFF: the Landed line says the third build fixed "those four shapes" and that rarer neighbours stay known bugs, and reads 168 files (round 2's N1); the member-access residual adds that an index after a closed `( … )` still misses (S3); new residuals: other assignment targets, operators and uneven spacing before `=` (Opus S1, Fable S1); a quoted value glued to an assignment then a glued hash sign with an odd quote (Fable S2); a command-argument `$m=@'` opening a here-string where PowerShell opens none, main silent too (Opus N2); one corpus command per new class (Fable NOTE).
- REQUIREMENTS: R-1737 narrowed to "glued to `=` or `+=` directly after a plain or braced variable name" (Opus S2, Fable S5); the tree regenerated.
- The session entry gains a paragraph for round 1, build 3 and round 2 (S4).

Check: (1) every round-2 finding is either fixed or recorded truthfully; (2) R-1737's new text matches its checks and the code; (3) nothing else changed; (4) any MUST. This is round 3 of 3 for this item.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
