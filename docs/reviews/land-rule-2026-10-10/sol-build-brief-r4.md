# Review brief — the land rule, build round 4 (over the cap), 2026-10-11 (reviewer: gpt-5.6-sol)

Over the round cap for one reason: a confirmation round on the final tip after fixes to named
findings. Your round 3 (`sol-build-r3.md`, SEND-BACK 7/10) found two parser paths: a fenced example
after the final verdict and a look-alike label let an earlier LAND stand, and the ASCII `\w` prefix
check accepted `拒否: VERDICT: LAND`. Build 10 (`build-brief-10.md`, `builder-report-10.md`) reads only
the final non-blank line and matches it against explicit character sets (R-969 and R-1010 reworded;
CHANGE §4 and §5 updated by the seat). The seat added your cases to `seat-verify-land.mjs` and two
mutations to `seat-mutate.py` (17 in all). astra's round 3 was LAND 10/10.

Review `git diff d533b83..HEAD` closely and confirm the whole change `1836fa3..HEAD` holds. Look for
any remaining way a reviewer's final word is misread, or a rejected revision lands. Rare cases outside
the rule's centre may be named as residuals rather than MUSTs. Use a scratch HOME for anything that
touches the ledger.

Answer with the full review as your final message: MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
