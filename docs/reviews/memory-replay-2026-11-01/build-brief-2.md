Feature: FEAT-043 · Measure memory outcomes

Lane memory-replay. Class: ordinary. Builder: pi-worker (larger lane). Build session 2, on branch tip c5931f51 (main ad9612dd).

The final review (round 1) sent the lane back for one MUST. Fix it and the two SHOULDs, plus one NOTE. The seat keeps the review text in this folder before the next round.

## Precedent

- `packages/nana-pack/lib/memory-replay-config.mjs`
- `packages/nana-pack/lib/memory-replay-context.mjs`
- `packages/nana-pack/lib/memory-replay.mjs`
- `packages/nana-pack/tests/memory-replay.test.mjs`
- `packages/nana-setup/lib/settings.mjs`

Report each departure.

## Build

1. MUST: the shared-memory hook output never lands in the memory slot on real transcripts. The slot rule matches a recorded SessionStart `command` containing `nana-shared-memory.mjs` or `nana-shared-memory`, but Claude Code 2.1.310 records the hook's `statusMessage` in that field, which nana-setup sets to `nana: shared memory index` (`packages/nana-setup/lib/settings.mjs`). So control holds only AutoMem, and every arm keeps the historical index in the shared prefix. Match the recorded label as well (import it from where nana-setup defines it, or seal it beside the other markers with its source), use a realistic record shape in the R-3371 fixture, re-pin R-3385, and show the fixture test red on c5931f51, then green.
2. SHOULD: keep only SessionStart outputs after the last compaction boundary (`SessionStart:compact`) in the standing text, as the seat saw at the replay point. Pin it.
3. SHOULD: the per-case difference compares counts after dropped draws, so an arm that loses more draws (unclear or failed calls) looks better. Compare per-arm rates over judged draws, and print failed draws per arm beside the unclear line. Update the hand-computed fixture for `decide` accordingly and keep its p-values checked by hand.
4. NOTE: when the cap stops `screen`, mark the cases it never screened as `unrun` in the screened plan.

Privacy and limits: unchanged from build brief 1. Synthetic fixtures only; no real transcripts, labels or candidates; no model calls. Do not edit `HANDOFF.md`, `docs/sessions/` or `docs/known-bugs/`. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Show your work

The red-then-green runs and the locked full suite in the foreground (`npm run test:locked`).

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
