# outside-precedent · plan (seat, 2026-10-29)

Feature: FEAT-006 · Launch builders with execution limits

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. One adversary attacked it (`plan-attack.md` beside it: no MUST, 3 SHOULD, 3 NOTE); the seat took all of them. Plans get no review round.

## Purpose

The owner picked reading 1 for his top idea "Outside precedent in every plan, plus UAT door" (2026-10-29: "A 1"). The idea began with his question "why are we building what an open community already solved?". Today the planner prompt mentions an optional "any Outside precedent" section, and nothing makes a planner look outside the repo. With this lane, every plan names one outside project for the lane's main part, with its licence and an adopt, borrow or skip call, or says why none applies. The user-test step (reading 2) is not in this lane.

## Assumptions (any may be wrong)

- A1. One project per plan is enough to make the planner ask the question; a list would turn into padding.
- A2. The licence matters only for adopt or borrow; skip still names the licence so the owner can overrule the call.
- A3. Planners can find candidates without network tools in a builder; the planner is the seat, which has web search.

## Open choices

- O1. Whether a plan with `none:` must say what was searched. Default: yes, one phrase naming where the planner looked.

## Questions for the owner

None.

## Threat model

In scope is honest variation: a lane with an obvious outside project, a lane with none, a project under a licence we cannot use, a seat and a pi planner. Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `packages/nana-pack/prompts/planner.md`: where the Outside precedent section is named today.
- `packages/nana-pack/tests/planner-prompt.test.mjs`: the R-2950 to R-2954 and R-3010 sentence pins.

## Outside precedent

- Rust RFC template, MIT/Apache-2.0, `borrow`: its Prior art section asks the same question; we take the idea, not the text. MADR (MIT) and its Considered Options section is a second public reference.

## Must-meet

Rows from R-3030. Each check carries its `// req:` marker directly above it and pins the exact sentence.

1. **Every plan has the section.** `planner.md`'s section-order sentence drops "any": "Then write the **Feature** line, **Threat model**, **Precedent**, **Outside precedent**, and **Must-meet** tests." The sentence "Put public references under **Outside precedent**." is replaced by: "Under **Outside precedent**, name one open-source project for the lane's main part, with its licence and one of `adopt`, `borrow` or `skip` and a reason; put any other public reference after it. When none applies, write `none:` with where you looked." A licence of `unknown` is an honest answer.
2. **The old rows stay true.** R-2951's section order still holds, and R-2954's row text is updated to the new sentence; the check pins both.

## Class and size

- Class: ordinary. `node scripts/lane-class.mjs --root . --files` on the planner prompt, its test and REQUIREMENTS.md prints `ordinary`.
- Size: small.
