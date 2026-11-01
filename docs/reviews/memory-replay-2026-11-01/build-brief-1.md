Feature: FEAT-043 · Measure memory outcomes

Lane memory-replay. Class: ordinary. Builder: pi-worker (larger lane). Build session 1, on main ad9612dd.

The owner ruled on 2026-11-01 that the replay test is the next lane and judges the first memory delivery, because the outcome meter's first baseline found repeated corrections too rare to measure in the field. The plan's three owner questions are posted as optional issue 293; build on their defaults (historical control, ceiling arm on, 150-dollar run cap).

Build the plan of record, `docs/reviews/memory-replay-2026-11-01/plan.md` (revised after `plan-attack.md`). Build every must-meet test (1 to 8) and the seal test for each sealed value it lists. Follow its decisions, Assumptions, Threat model and Precedent. IDs: SUB-025 under FEAT-043, rows R-3370 to R-3389 only, artifact A-097. Lane making-session-end builds in parallel with rows R-3350 to R-3369; do not use them.

## Precedent

- `apps/bench/lib/anatomy.mjs`
- `apps/bench/lib/anatomy-measures.mjs`
- `packages/nana-pack/lib/claude-transcript.mjs`
- `packages/nana-pack/lib/memory-making.mjs`
- `packages/nana-pack/lib/memory-making-config.mjs`
- `packages/nana-pack/lib/memory-store.mjs`
- `packages/nana-pack/lib/outcome-meter.mjs`
- `packages/nana-pack/lib/outcome-meter-config.mjs`
- `packages/nana-pack/lib/outcome-score.mjs`
- `packages/nana-pack/lib/pi-usage.mjs`
- `packages/nana-pack/tests/outcome-meter.test.mjs`
- `scripts/memory-shape-runners.mjs`
- `scripts/outcome-meter.mjs`
- `scripts/outcome-score.mjs`
- `scripts/outcome-compare.mjs`

Report each departure.

## Build

Helper moves authorized: exactly the plan's list (outcome-score's private `readRows` becomes an export; its callers stay unchanged), plus any other move the plan's Precedent section names by function. No other private helper moves; ask in your report if you need one. A pack module may not import an app: follow `apps/bench` code as precedent, do not import it into `packages/`.

Privacy: transcripts, labels, candidates and the profile store quote the owner. Never read them; tests use synthetic fixtures only; no test calls a model or spends. Only the sealed Claude runner may receive owner text, and a test pins that. Do not run `plan`, `run` or `decide` against real data; the seat does that after the build. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Show your work

The locked full suite in the foreground (`npm run test:locked`). One run of `plan` and `decide` over synthetic fixtures, counts only.

## Done when

Rows `implemented` with backticked evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
