# Review brief — pi 1.0 adoption lane, ROUND 2 (reviewer: gpt-6-astra)

Same lane, same worktree `~/nana-pi-wt/pi-1.0`, branch `feat/pi-1.0`, base `main` (`c0a7849`). Round 1 (BLOCK 7/10) is
`/Users/jwang/nana-pi/docs/reviews/pi-1.0-2026-10-04/astra-r1.md`; the original brief is `astra-brief.md` beside it.
The fix commit is `1c4a369` (on top of `53bcbf1`, `0ba4a2e`). Third-party ground truth is unchanged (pi-subagents 0.75.0 and pi 1.0.2, unpacked under the scratchpad path named in astra-brief.md).

## Do this
1. For each round-1 finding (MUST 1–3, SHOULD 4, NOTE 5), re-derive closure from the artifact by executing or reading it. Do not trust the commit message. Repeat your round-1 executed probes: a `{ bad` config through diagnose() and then install; null, array and scalar configs; the same shapes for mcp.json `mcpServers` and its server entries.
2. Review `git diff 0ba4a2e..1c4a369` as NEW code. The fix may introduce defects of its own: the new type guards, the absent-versus-invalid remedy text, the split rows R-366 upward, and the trimmed reviewer seed (it must still parse, shadow the builtin, and carry the marker as its first body line).
3. Re-audit every row R-360 upward: one `shall`, and each cited test pins the clause it claims.
4. Check that the narrowed README prose and the Known-limits lines are true against upstream source.

Same verdict format: ranked findings with severity, file:line, evidence and the smallest fix, then `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
