# Review brief 1: builder-context

Feature: FEAT-041 · Shape each agent's context by role

Lane class: ordinary. Threat model: honest variation in scope (a fix brief with or without a Precedent section, a malformed section, feature briefs, pi and Claude Code builder entries); deliberate forgery out.

Review the branch `feat/builder-context` from main `2c0a3e4a` to its tip. The plan is `docs/reviews/builder-context-2026-11-06/plan.md`, with briefs 2 and 3 beside it. The build reports are in the same folder.

Intent: the owner's 2026-11-06 picks on #338, #339 and #340, plus two measured planner rules.
- Builders get the four curated lessons lines as a fixed footer.
- A `Card: fix` brief may omit its Precedent section; every other brief still needs one.
- A reused helper's precedent says "call it", and a private helper is made public in the same change.
- Plans list each caller of a changed function, found by a fresh read, with its observable contract.

Question: does the change do that for its users (builders and planners reading these prompts, seats launching lanes), and does it cause a harm the review standard lists? Check in particular:
- no brief without the marker can now launch without a Precedent section;
- the preamble's private-helper rule and the ruling on helper moves don't contradict each other;
- R-3733 to R-3738 and R-3747 match their tests.
