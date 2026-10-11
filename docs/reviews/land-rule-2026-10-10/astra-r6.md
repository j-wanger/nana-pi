## MUST

- Clarify the decoration sets in `packages/nana-pack/README.md:177`. The wording permits all six listed marks to “wrap its parts,” but `verdictWord` permits only `*`, `_`, and backticks there.
- Verified: `VERDICT: **LAND**` returns `LAND`; `VERDICT: #LAND#`, `VERDICT: >LAND>`, and `VERDICT: -LAND-` return empty verdicts.
- Separate prefix marks from wrapper marks, as R-969 already does.

## SHOULD

None.

## NOTE

- Confirmation covers `1836fa3..4b57f7ef6d684ffca0fc21811823f4b723942f3d`.
- Since `7db7a53`, changes comprise the three wording edits, round-5 review records, and round-6 brief. No code or tests changed.
- The session entry and CHANGE §5 resolve their named findings.
- `readme:check` passed: 639 claims, zero problems.
- `git diff --check` passed. Direct parser probes confirmed the remaining documentation mismatch.
- This confirmation did not repeat the full suite.

**Score: 9/10.**

VERDICT: LAND-WITH-FIXES
