# Review — feature-first (the working rules say feature-first development), 2026-10-17 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 43072d8..HEAD` on `feat/feature-first` (main is `43072d8`). The owner ruled on 2026-10-17 that nana moves
to feature-first development. This lane writes that ruling into the rules a seat, a builder and a reviewer read: the
review standard pi-review appends, the shared working pattern (and nana-pi's `AGENTS.md` region and nana-soul's copy of
one bullet), the seat guide, the builder preamble, the coding standards, the requirements skill, the root README and the
OBJECTIVE seed, plus a carried one-line fix in the pack README. The plan of record, with every new sentence verbatim, is
`docs/reviews/feature-first-2026-10-17/must-meet.md`; the adversary's pass is `adversary.md` beside it.

**The bar for this round.** This is the first review under the ruling it writes, so apply the new text as the bar: send
back only for a must-meet check (FF1 to FF6 in `must-meet.md`) that is missing or still passes with its text removed,
for new text that does not match the plan's verbatim sentence, for a live rule the lane leaves contradicting the new
text so a session cannot follow both, or for a harm on the list (data lost, a test or seat script writing outside the
lane worktree or the temp folder, a broken install or hook, something main does today no longer working). Every other
finding is a SHOULD or NOTE the seat records. Threat model: honest variation in our tools' output in scope; deliberate
forgery out. Lane class: ordinary (one final reviewer).

Records in the same folder: the plan, the adversary's pass, the title check, two build briefs (the small-lane builder
stopped after five minutes; a Claude Sonnet 5 builder finished), and the seat's check record `seat-verify-d8a19bd.md`
(the full suite and the install check on the tip). Also `HANDOFF.md` and the session entry.

Check: (1) each new sentence matches `must-meet.md`; (2) FF1 to FF6 each fail with their text removed; (3) no live rule
in the repo still states the old process as a standing rule (plan review rounds, clause-by-clause pinning, fix the
class, a mutation rerun on every lane); (4) HANDOFF and the session entry are true; (5) any send-back item under the bar
above.
