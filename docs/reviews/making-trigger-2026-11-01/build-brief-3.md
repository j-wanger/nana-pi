Feature: FEAT-040 · Make and keep memory

Lane making-trigger. Class: gate (`packages/nana-pack/bin/nana-land.mjs — land tool`). Builder: pi-worker (larger lane). Build session 3, on branch tip 2234d39a. Build 2 stopped on an ID clash the seat caused; it is resolved below. Main has moved to b10761b1: lane outcome-meter landed (FEAT-043, R-3310 to R-3336, A-095).

## Precedent

- `packages/nana-pack/lib/memory-making.mjs`
- `scripts/memory-shape-runners.mjs`
- `REQUIREMENTS.md`

Report each departure.

## Build

1. Merge `origin/main` into `feat/making-trigger`. outcome-meter changed `packages/nana-pack/lib/memory-making.mjs` (an optional entry observer in `transcriptUnits` and `unitsIn`) and `scripts/memory-shape-runners.mjs` (sealed runner options, pi refused with them), plus `REQUIREMENTS.md`, the tree and map files, `HANDOFF.md`, `docs/sessions/2026-10.md` and the pack README. Keep both lanes' behaviour: your `unitsIn` and `sourceFiles` exports and the observer must both survive, and both lanes' tests stay green. Keep every landed ID on main as it is (FEAT-043, R-3310 to R-3336, A-095); this lane keeps SUB-024, R-3290 onward and A-093. This lane has not landed, so its own R-3310, R-3311 and R-3312 clash with main's landed rows. Renumber only those three of this lane's rows to R-3340, R-3341 and R-3342 (R-3337 to R-3339 stay free as a gap), updating every `req:` marker, seal test, evidence line and reference in this lane. Keep R-3290 to R-3309 as they are. Do not renumber anything on main. Regenerate maps and update heading counts only as the merge requires.
2. The seat's ruling on build 1's open question: keep your design. A land run makes its own lane and the earlier lands it remembers; the broad sweep of landed review folders runs only for commands without a lane. Make sure the pack README contract note says this in one sentence, and that must-meet 2's test still shows a land run draining another source's pending units through the remembered-lands path.
3. Re-run the lane's mutation runner after the merge and report it.

Privacy and limits: unchanged from build brief 1. Synthetic fixtures only; no real transcripts, profile clone or model calls. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Do not edit `HANDOFF.md`'s lanes line, the session notes or known-bug files beyond what the merge itself requires.

## Show your work

The locked full suite in the foreground (`npm run test:locked`), the mutation runner and `node packages/nana-setup/bin/install-check.mjs` (report its exit; a `pi post-edit` `write-error` is the known builder-environment failure).

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
