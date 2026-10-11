# Land review — the land rule, 2026-10-10 (reviewer: gpt-6-astra; role: land ruler)

Jake, 2026-10-10: "anything landed on main should be accepted by an independent reviewer." This lane
builds that into `nana-land` and the review ledger (`CHANGE.md`; plan reviewed by sol five times;
Fable consult; a seat fact-check of the plan against the code). sol reviews the same revision in
parallel. Your verdict covers `git diff 1836fa3..HEAD`; nothing is written to main after the land,
and from this merge on the new rule governs every repo's lands and reviews on this machine.

Rule on: (1) is it what Jake asked and no more — every commit reaching main covered by a revision
every recorded reviewer accepted, no exemptions, no unreviewed follow-ups; (2) the compatibility and
blast radius — every revision reviewed before this merge needs a fresh review; old code in other
worktrees fails closed; the deploy instruction (no land, review or worker running at the merge);
(3) the declared residuals (CHANGE §5) honest and stated where a project author reads them;
(4) Jake's checkpoint-1 tree changes applied as he ruled; (5) `HANDOFF.md` and the session entry true
for the merged state; (6) anything that should block the merge. Run
`node docs/reviews/land-rule-2026-10-10/seat-verify-land.mjs` (it uses a scratch HOME) if you need
evidence; never run the land command against your real ledger.

Answer with the full review as your final message: MUST / SHOULD / NOTE, accepted residuals, score,
last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`, `VERDICT: SEND-BACK`.
