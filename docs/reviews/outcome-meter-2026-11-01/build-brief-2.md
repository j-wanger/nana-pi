Feature: FEAT-043 · Measure memory outcomes

Lane outcome-meter. Class: ordinary. Builder: pi-worker (larger lane). Build session 2, on main 8c665dcd. Build 1 stopped on one unauthorized helper change; it is authorized below.

The owner: memory work is judged by its outcome, fewer corrections given twice and fewer decisions asked twice, with context no larger than baseline. On 2026-11-01 the owner ruled: count by a set number of interactions, not by week; build this meter now; the replay test is the next lane and judges the first memory delivery. This meter is the long-run gauge, not the delivery verdict.

Build the plan of record, `docs/reviews/outcome-meter-2026-11-01/plan.md` (revised after `plan-attack.md` and the two owner rulings). Build every must-meet test (1 to 8) and the seal tests it lists. Follow its Purpose, Assumptions, Threat model and Precedent. IDs: FEAT-043 under CAP-01, rows R-3310 to R-3336, artifact A-095. Lanes builder-anatomy (FEAT-042, R-3270 to R-3278, A-092) and making-trigger (SUB-024, R-3290 onward, A-093) are building in parallel; do not use their IDs. Do not build the findings count (lane outcome-findings) or the replay test.

## Precedent

The plan's Precedent section, by path:

- `packages/nana-pack/lib/memory-shaping.mjs`
- `scripts/memory-shape-runners.mjs`
- `packages/nana-pack/lib/memory-making.mjs`
- `packages/nana-pack/lib/memory-making-config.mjs`
- `packages/nana-pack/lib/claude-transcript.mjs`
- `packages/nana-pack/lib/pi-usage.mjs`
- `packages/nana-pack/lib/memory-score.mjs`
- `scripts/memory-score.mjs`
- `packages/nana-pack/lib/context-load-log.mjs`
- `packages/nana-pack/lib/agent-dir.mjs`
- `packages/nana-pack/lib/record-ledger.mjs`
- `apps/bench/lib/catch-judge.mjs` (follow only; a pack module may not import an app)

Report each departure.

## Build

Helper moves authorized: only the plan's one, `claudeRunner` and `createRunner` in `scripts/memory-shape-runners.mjs` gain optional model, effort, budget, timeout and buffer options defaulting to the shaping config, and `createRunner` throws when any is given with runner `pi`. The shaper's behaviour and its tests stay unchanged. Also authorized (build 1 asked): add an optional entry observer to `transcriptUnits` and the private `unitsIn` in `packages/nana-pack/lib/memory-making.mjs`, called once per entry in the same pass, so the meter reads entry instants and session-start entries in one pass. Existing callers and their output stay unchanged; the memory-making tests stay green unedited. Lane making-trigger, building in parallel, exports `unitsIn`; keep your change small so the later merge stays simple. No other private helper moves; ask in your report if you need one.

Privacy: transcripts quote the owner. Never read real transcripts, the snapshot under the home folder or the real load log. Never write owner text into the repo, a test, a log or your report. Every test uses synthetic fixtures and a fake runner or injected spawn; no test spends or calls a model. Do not run `memory:meter`, `memory:meter-score` or `memory:meter-compare` against real data; the seat does that after the build. Counts from real data never go in the lane folder. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Show your work

The locked full suite in the foreground (`npm run test:locked`). One run of each new command over the synthetic fixtures, counts only.

## Done when

Rows `implemented` with backticked evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
