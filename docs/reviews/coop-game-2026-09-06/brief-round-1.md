# Review brief — cooperative perspective-puzzle game design, round 1

You are an independent design reviewer. The seat (Claude) wrote a design for a new browser
puzzle game in which a human plays and an LLM agent edits world properties within a budget
and reports what the player cannot see. The ENGINE CORE (§3) was ratified by the owner in
discussion; the rest is open. Nothing is built. Be adversarial; pushback is wanted. Judge the
rules as rules: find inputs where they give no answer, two answers, or an absurd one.

## Read first (absolute paths)
1. /Users/jwang/nana-pi/docs/coop-perspective-game-design-2026-09-06.md — THE DESIGN under review
2. /Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md — the kit it sits on: §2 (the reframe), §3.1 (block contract), §3.3 (refresh rule, mutating actions), §5 (transferability + failure rule)
3. /Users/jwang/nana-pi/apps/desk/public/stage/stage.js — lines 1-60 and grep `show`, `produced_by`, `agent:changed` (how hidden blocks and refresh actually work)
4. /Users/jwang/toy-battle/packages/core/src/config.ts — the zod + pure-sim pattern the design says it reuses (skim)

## Dimensions (one section each)

A. **Projection + re-embedding rules (§3.3, §3.5, §3.6).** Construct concrete worlds that break
   them: push-out with no empty cell along the collapsed axis; two entities whose frozen
   coordinates put them in the same true cell after re-embedding; an entity that is "inside
   solid" only under the projected collision but not the true world (or vice versa); the
   1D-nested-in-2D double front-most order; the "no-move round trip is identity" invariant —
   is it actually implied by the rules or must it be forced? Say what rule text is missing.
B. **Physics-in-visible-dimensions (§3.4).** Cases where dropping a component yields absurd
   play or an unresolvable state (fluids in top view; a falling entity when the mode flips
   mid-fall; gravity into the screen). Is "magnitude on/off" enough for v1?
C. **Solver + generator (§3.7, §6).** Is the state space bound stated correctly once elements
   exist? Are the non-triviality rejections gameable (trivially satisfied) or too strict?
   What does the generator need that the design does not say?
D. **The agent boundary (§5).** Can the agent author world state outside schema + budget via
   any path (tool args, preview/commit split, the hint role in §6)? Is the preview/commit
   split consistent with the kit's mutating-action rule? Is the audit claim honest?
E. **The menu test (§2, §10.2).** Given ONLY the v1 systems (gravity + modes + material
   table, no elements, no light), write the interaction table yourself in a few lines and
   rule: is the change space combinatorial enough that a menu could not replace the agent?
   If not, say what minimum addition makes it so.
F. **Kit fit + subtraction (§7, §8, §4).** Does the slice need kit changes beyond a block
   type? Is anything in v1 that should wait, or missing that cannot be added later?

## Output
For each dimension: `PASS` or one or more `FINDING (severity: blocker|major|minor): <one
paragraph, with the concrete counterexample>`. End with exactly one line:
`VERDICT: LAND | FIX-FIRST | BLOCK` and a one-sentence reason.
