Feature: FEAT-042 · Measure builder context

Lane anatomy-label-check. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip f5094267.

The seat ran the plan's step 3 (the fixed check set, builder-anatomy's second sheet) on the real store with build 1's readers: the Sonnet labels at low effort miss both overall bars. The owner decided on 2026-11-01 to re-label the store with Claude Opus at medium effort. This build retunes the two sealed values; the seat runs the new labelling into a new private folder.

## Precedent

- `apps/bench/lib/anatomy-config.mjs` (`LABEL_MODEL`, `LABEL_EFFORT` and their provenance comments)
- `apps/bench/test/anatomy-labels.test.mjs` (the R-3397 seals)
- `REQUIREMENTS.md` (R-3397)

Report each departure.

## Build

1. Set `LABEL_MODEL` to `claude-opus-5-5` and `LABEL_EFFORT` to `medium`. Their provenance comments say: chosen by the owner on 2026-11-01, after the Sonnet low-effort labels missed the plan's agreement bars on the fixed check set.
2. Update R-3397's text and its two seal tests to the new values. Every other assertion already imports the names; keep it that way.
3. Update the bench README where it names the label model or effort.
4. A label store made under the old model must still refuse a `--resume` under the new one (the existing fingerprint check); confirm the existing test still covers it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Never read `~/nana-memory-runs`.

## Done when

Green, run locally: `node apps/bench/test/anatomy-labels.test.mjs`, the other anatomy tests, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite. Push the branch and stop.
