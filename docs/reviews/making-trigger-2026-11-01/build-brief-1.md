Feature: FEAT-040 · Make and keep memory

Lane making-trigger. Class: gate (`packages/nana-pack/bin/nana-land.mjs — land tool`). Builder: pi-worker (larger lane). Build session 1, on main 8c665dcd.

The owner: the model extractor is the maker; making runs at the end of each seat session and as part of each land, never nightly. The owner answered both plan questions on 2026-11-01 with the defaults: making reads only repositories enabled per machine (starting with nana-pi), and project memory lives in a `projects/` folder inside the existing private profile clone.

Build the plan of record, `docs/reviews/making-trigger-2026-11-01/plan.md` (revision 2, after `plan-attack.md`). Build every must-meet test (1 to 8) and the seal test for each sealed tunable it lists. Follow its Purpose decisions, Assumptions, Threat model and Precedent. IDs: SUB-024 under FEAT-040, rows from R-3290, artifact A-093. Do not build the second lane (making-session-end): no Claude Code hook, no nana-setup install wiring, no doctor row.

## Precedent

The plan's Precedent section, by path:

- `packages/nana-pack/lib/memory-shaping.mjs`
- `scripts/memory-shape-runners.mjs`
- `packages/nana-pack/lib/memory-making.mjs`
- `packages/nana-pack/lib/memory-making-config.mjs`
- `packages/nana-pack/lib/profile-store.mjs`
- `packages/nana-pack/lib/profile-sync.mjs`
- `packages/nana-pack/bin/nana-profile.mjs`
- `packages/nana-pack/lib/profile-config.mjs`
- `packages/nana-knowledge/lib/hook.ts`
- `packages/nana-pack/bin/nana-land.mjs`
- `packages/nana-pack/lib/lane-lock.mjs`
- `packages/nana-pack/lib/suite-records.mjs`
- `packages/nana-pack/lib/land-config.mjs`

Report each departure.

## Build


Helper moves authorized (exactly the plan's list): export `exclusiveJson` from `profile-store.mjs`; move `profileGuard`, `seatGuard` and `dailyCounter` from `nana-profile.mjs` into a profile lib module (compute or inject the checkout path); export `unitsIn` and `sourceFiles` from `memory-making.mjs`; move `LANE_NAME_PATTERN` from `nana-land.mjs` to `land-config.mjs`. No other private helper moves; ask in your report if you need one.

Privacy: real transcripts and the real profile clone quote the owner. Never read them, and never write owner text into the repo, a test, a log or your report. Every test uses synthetic transcripts, a temporary home, a temporary profile clone with a local bare remote, and injected runner, clock and spawner. No test spends, calls a model or starts a real run. Do not run `nana-memory make`, `enable` or `memory:shape` against the real machine. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

Gate lane extras: add wrong-code pairs for the land trigger's isolation (must-meet 8), the failed-versus-malformed split (2), the unknown-usage charge (3) and the start instant (4) to the lane's mutation runner, and report the run. Run `node packages/nana-setup/bin/install-check.mjs` once and report its exit; if it fails only on `pi post-edit` `write-error`, say so and move on (a known builder-environment failure).

## Show your work

The locked full suite in the foreground (`npm run test:locked`). The mutation runner's result. A synthetic end-to-end run of `nana-memory enable`, `make` and `status` against a temporary profile clone, counts only.

## Done when

Rows `implemented` with backticked evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
