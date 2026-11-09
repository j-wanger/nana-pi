Feature: FEAT-013 · Install and connect harness runtimes
Serves: roadmap step 3 (trim each helper's starting context): pi helpers stop receiving seat-only rulings and writing text, and every launch logs what it delivers.

# Review brief 1: child-context

Review the whole lane: `git diff main...HEAD`. Plan: `docs/plan/child-context.md` (M1–M6, R-3915–R-3920), including its "Changed after the adversary" paragraph. Builder evidence: `docs/plan/child-context/evidence.md`. The builder measured a controlled builder launch at 12,878 → 6,577 characters with a fake pi. The seat merged current main before this round.

Questions: does any helper lose a guard (gate credential floor, CLI guards) or an instruction it needs, in any launch path (lane builder, slot child, pi reviewer, Claude reviewer, Claude builder)? Does the privacy line really reach the builder's composed prompt? Do the launch logs report what the child actually gets, with `unavailable` where unmeasurable? Threat model: honest variation in roles, runtimes, missing files and settings; a user forging NANA_ROLE is out.
