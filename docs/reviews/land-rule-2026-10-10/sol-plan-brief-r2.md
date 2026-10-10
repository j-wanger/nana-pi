# Plan review brief — the land rule, round 2, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + requirements)

Your round 1 (`sol-plan-r1.md`, SEND-BACK 4/10) found seven MUSTs and two SHOULDs. The seat took
every one; `sol-plan-r1-response.md` maps each to its change in `CHANGE.md`. Re-review the whole
declaration against the code (`packages/nana-pack/bin/nana-land.mjs`, `review-round.mjs`,
`review-ledger.mjs`, their tests, the pack README, the shared working section, `REQUIREMENTS.md`).

## Attack
1. **Each round-1 finding closed** — at the plan's line, and sound against the code (the ledger
   lock's 15-second wait and orphan rule; what `complete()` does when it cannot take the lock; how
   an exported lock call can expose records and live reservations without reaching into internals).
2. **New holes** the revisions opened: the lock held during git operations; `null` versus absent
   verdicts; SHA resolution before the common-directory check; R-1010's "more than one word"
   against real review endings (`VERDICT: LAND-WITH-FIXES`, `VERDICT: LAND (9/10)`).
3. **Rows**: one `shall` each; homes and shares under the governance text; every clause the cited
   tests pin today survives a rewording.
4. **Anything still landable that a reviewer rejected**, beyond the §5 residuals.

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
