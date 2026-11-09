Feature: FEAT-001 · Keep goals and priorities in view

# Review brief 1: t1

Review only this lane's commits: `git diff 27e7c68a HEAD` on feat/t1 (five commits; the plan is `docs/plan/t1.md`, committed at 27e7c68a, and its "Adversary amendments" section wins over the rest). The branch is stacked on the Cut A lane at dbe250c0, which has its own review; after Cut A lands, this branch merges main.

What it does (roadmap step 3, owner D4 and D7 of 2026-11-09):
- Part 1 `71fc672f`: validation first in the builder preamble, planner, requirements skill, AGENTS.md and the objective seeds; pi-worker refuses a non-`Card: fix` brief with no `Validation:` line (R-3986).
- Part 2 `06c43f49`: rulings split — 33 start bullets stay, 11 move word for word to `docs/decisions.md` with a `Home:` each, one stale ruling deleted; seat guide and soul trimmed.
- Part 3 `643dc4ab`: the seat's start block — the shared-memory hook holds back feedback and reference entries (R-3987), the frontier block shows owner asks as a count line (R-3988), the objective block drops the program lines (R-009 retired).
- `b027e05b` regenerated files; the seat's `HANDOFF.md` sentence fix.

Builder's validation on b027e05b: the refusal fires on a brief without `Validation:` and passes the lane's own brief; one preventive-test demand left (the review standard, unchanged by design); start sizes — rulings 5,591, seat guide 6,987, soul 5,321 characters; memory block 734, frontier 703, objective 377 characters. 129 reader tests run alone: 127 pass; the two failures (code-map-launch R-3156, requirements-deliverables A-056) are inherited from dbe250c0 and fixed in Cut A's later commits.

Questions:
- Does any moved or deleted ruling, held-back memory entry or trimmed seat-guide line leave a safety line (privacy, credentials, rm, identity, Windows paths, review coverage) with no home that is read at the moment it matters?
- Does the refusal stop a real lane launch that should go through (a `Card: fix` brief, a slot brief for scout, planner or adversary, a pi-review launch)?
- Does any test edit weaken a check beyond the wording it pinned?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
