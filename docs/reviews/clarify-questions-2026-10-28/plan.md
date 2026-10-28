# clarify-questions · plan (seat, 2026-10-28)

Feature: FEAT-006 · Launch builders with execution limits

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. One adversary attacked it (`plan-attack.md` beside it: 3 MUST, 4 SHOULD, 3 NOTE); the seat took all of them. Plans get no review round.

## Purpose

The owner picked reading 1 of three for his top idea "Ranked clarify questions and pre-build analysis": "Reading 1 but keep reading 2 in mind" (2026-10-28). Reading 1: before a plan is final, the planner lists its open questions ranked by the cost of a wrong guess. The top one to three go to the owner as one issue, each with a default. The rest become the plan's marked assumptions. Reading 2, kept in mind, is a page per lane that the owner comments on. So this lane writes each question in one fixed form a later page can show without rework.

## Assumptions (any may be wrong)

- A1. The planner prompt is where planners learn the plan's sections (R-2951), so one new section there reaches every planner, seat or pi.
- A2. The seat already knows how to post an ask safely: the carry rule's labels, the name check and the hand check. This lane adds when to post, not how, in the seat guide; the planner prompt stays planner-only.
- A3. The issue watch (lane issue-watch) delivers the owner's reply while the seat runs; until it lands, the seat reads replies before acting, as the rule says.

## Open choices

- O1, decided: a question's cost starts with `easy to undo` or `hard to undo`, then names what breaks, so blocking versus optional is read off one phrase.
- Open choices are the builder's to decide; questions are the owner's.

## Questions for the owner

None.

## Threat model

In scope is honest variation: a lane with no open question, a lane with many, a question whose wrong guess is cheap and one whose wrong guess is costly, a seat and a pi planner. Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `packages/nana-pack/prompts/planner.md`: the plan's sections and their order.
- `packages/nana-pack/tests/planner-prompt.test.mjs`: the R-2950 to R-2956 sentence pins.
- `packages/nana-setup/claude/rules/nana-soul.md`: the carry rule's labels and the default form of a blocking ask's title.

## Must-meet

Rows from R-3010. Each check carries its `// req:` marker directly above it and pins the exact sentences below. A sentence check cannot prove a planner ranks well; that is a residual.

1. **The planner prompt asks for the section.** `planner.md` carries, after the Open choices paragraph: "Then write **Questions for the owner**. Write each question as four labelled lines: `Question:`, `Default:`, `Cost of a wrong guess:` (starting `easy to undo` or `hard to undo`), and `If answered otherwise:`. Order them from the costliest wrong guess down. Keep the top one to three; make every other question a marked assumption. With no open question, write `None.`" R-2951's row and check name the new section in its order.
2. **Readings carry the questions.** `planner.md` carries: "When you return readings instead of a plan, put the top questions for each reading in the same message." So one request still costs the owner one ask.
3. **The seat posts one issue per plan.** `nana-seat.md` carries: "Post a plan's questions as one `ask` issue before the build. This is the one exception to one issue per question. Label it `blocking` when any question is `hard to undo`, else `optional`. A blocking issue's title ends with "(default: go)", meaning build on the listed defaults."
4. **The build waits only when it must.** `nana-seat.md` carries: "A blocking build waits for the owner's answer; meanwhile the seat reports YOUR CALL and starts other lanes. An optional build starts on the defaults, and a differing answer goes in the next brief. A plan whose questions read `None.` posts nothing."

## Class and size

- Class: ordinary. `node scripts/lane-class.mjs --root . --files` on the planner prompt, its test, the seat guide and REQUIREMENTS.md prints `ordinary`.
- Size: small.
