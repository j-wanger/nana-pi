Feature: FEAT-042 · Measure what a builder's context is for

Lane anatomy-labeller (Part 1 of the plan's split). Class: ordinary. Builder: pi-worker (larger lane). Build session 1, on main ad9612dd.

The builder-anatomy seat measurement found the keyword rules fail the reliability bar (κ 0.36 against two model labellers that agree at 0.86), so the pre-registered next step is a model labeller. The plan's one owner question is posted as optional issue 297; build on its default (sonnet).

Build Part 1 of the plan of record, `docs/reviews/anatomy-labeller-2026-11-01/plan.md` (revised after `plan-attack.md`): the `label` subcommand and its must-meets and seals, rows R-3390 to R-3398 only. Do not build Part 2 (`anatomy-label-check`, rows R-3399 to R-3404): no `report --labels`, `agree --model`, `sample --heavy` or `sample --labels`. Follow the plan's decisions, Assumptions, Threat model and Precedent. Lanes in parallel use R-3350 to R-3389 and R-3410 onward; do not use them.

## Precedent

- `apps/bench/anatomy.mjs`
- `apps/bench/lib/anatomy-config.mjs`
- `apps/bench/lib/anatomy-measures.mjs`
- `apps/bench/lib/anatomy.mjs`
- `apps/bench/lib/catch-judge.mjs`
- `apps/bench/lib/plan.mjs`
- `apps/bench/test/anatomy.test.mjs`
- `packages/nana-pack/lib/memory-shaping-config.mjs`
- `packages/nana-pack/lib/memory-shaping.mjs`
- `packages/nana-pack/tests/memory-shaping.test.mjs`
- `scripts/memory-shape-runners.mjs`
- `scripts/memory-shape.mjs`

Report each departure.

## Build

Helper moves authorized: exactly the plan's list (the report's `normalize` becomes an export and is imported, not copied; any other move the plan's Precedent names). No other private helper moves; ask in your report if you need one.

Privacy: the private segmented store holds brief text. Never read it; tests use synthetic fixtures and a fake runner only; no test calls a model or spends. Do not run `label` against the real store; the seat does that after the build. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Show your work

The locked full suite in the foreground (`npm run test:locked`). One `label` run over a synthetic store with a fake runner, including a capped run and its `--resume`, counts only.

## Done when

Rows R-3390 to R-3398 `implemented` with backticked evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
