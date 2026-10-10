# Land review — four-digit requirement IDs (and the tree's last record), round 2, 2026-10-10 (reviewer: gpt-6-astra; role: land ruler)

Your round 1 (`astra-land-r1.md`) sent the lane back: a MUST (valid row endings rejected) and a
SHOULD (HANDOFF wording). sol's round 1 found the same MUST. Since then: two builder rounds
(`build-brief-2.md`, `build-brief-3.md`, `builder-report-2.md`, `builder-report-3.md`), and a seat
finding fixed before this review — the two rails disagreed about what a line is, and the TypeScript
rail silently dropped a valid row containing U+2028. One definition now holds in both rails: a line
is the text between "\n" characters; only spaces, tabs and "\r" are stripped from its end. sol
reviews the same revision in parallel.

Your verdict covers `git diff eeeca20..HEAD` (Jake's 2026-10-10 rule: nothing reaches main unless an
independent reviewer accepted it). The tree itself lands at `eeeca20` on your earlier LAND.

Rule on: (1) are your round-1 MUST and SHOULD closed, at file:line; (2) is the row-ending and
line-definition behaviour now declared where a project author reads it (template ledgers, plan),
and is the remaining compatibility break (a no-break space or other character after the closing
pipe now fails, naming the line) acceptable; (3) is the change still only what Jake asked
("update the requirements id range to be 4 digits") plus the declared near-miss check — existing
rows unchanged, new IDs from R-1000; (4) anything that should block the merge. Run
`node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` and the rail test if you need evidence.

Answer with the full review as your final message: MUST / SHOULD / NOTE, accepted residuals, score,
last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`, `VERDICT: SEND-BACK`.
