# Response to sol plan review r3 (SEND-BACK, 6/10) — seat, 2026-10-10

Both MUSTs and the SHOULD were checked against the code and taken. `CHANGE.md` now reads:

| Finding | Change |
|---|---|
| MUST old completion hides a rejection after a marked LAND | The marker is now tally version 2 (`v: 2`). New `readTally` accepts versions 1 and 2; the old one accepts only `v === 1` and throws on anything else (`review-round.mjs:361-365`). Once a version-2 record exists, old review code (admission, completion) and an old land helper refuse the tally — they fail closed rather than skip a record or land on a mixed tally. R-1008 and R-1011 name the version. Test: the pre-change module, taken from git history into a temp folder, refuses a tally holding a version-2 record for both completion and reading rounds. Note: lanes use the commands linked from the main checkout, so only old code run directly from an older worktree's files is affected. |
| MUST verdict grammar | Defined from the corpus: a seat scan of every final `VERDICT:` line in nana-pi, nana-agent-loop and aml-desk review records found LAND endings `LAND`, `# VERDICT: LAND`, `LAND — n/m`, `LAND — n/m.`, the bold `LAND — 9/10.` form, and two with prose after the dash. The grammar accepts one score as `(n/m)` or a dash and `n/m` (`n/m` = `\d+(?:\.\d+)?/\d+`), trailing punctuation and whitespace; prose after the verdict word records an empty verdict (fail closed; every brief asks for the bare line). Corpus-derived test cases are listed, including hard-break spaces and `LAND (fixes pending)`. |
| SHOULD R-1005 omits R-1011 | R-1005 now applies R-976, R-1004, R-1006 and R-1011 to the locked reading; the version-1 LAND test runs at both readings. |

This is the plan's fourth round, over the cap with the standard reason: a confirmation round on the
final tip after fixes to named findings.
