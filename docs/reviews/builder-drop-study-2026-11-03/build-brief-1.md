Feature: FEAT-045 · Test which builder context changes builds

Lane builder-drop-study. Class: ordinary. Builder: pi-worker (larger lane). Build session 1, after lane builder-drop has landed: merge `origin/main` first and check the harness's real commands and exports against the ones this plan assumes; the harness wins on any difference, and you report each one. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`, which a pi adversary wrote; owner questions decided as its last section says). Take its Design, Assumptions and Open choices.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Rows: R-3610 to R-3618 in must-meet order. Artifacts A-102 and A-103.

## Precedent

- `apps/bench/lib/plan.mjs`
- `apps/bench/lib/catch-stats.mjs`
- `apps/bench/lib/anatomy-measures.mjs`
- `packages/nana-pack/lib/memory-replay.mjs`
- `packages/nana-pack/lib/outcome-meter.mjs`
- `packages/nana-pack/lib/build-records.mjs`
- `templates/typescript/template/tests/requirements-trace.ts`
- `scripts/code-map.mjs`
- `apps/bench/lib/anatomy-sessions.mjs`
- `apps/bench/aggregate.mjs`
- `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md`
- `apps/bench/test/anatomy-labels.test.mjs`
- `plan.mjs`
- `requirements-trace.mjs`
- `build-records.mjs`
- `anatomy-sessions.mjs`

Report each departure.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it to another module) and report each export as a departure.

## Build

Requirement rows first, then the tagged tests (wrong code first: each new test red against main's code, recorded in this folder), then code and README. Grep every test and checker for literals this change breaks before limiting edits. Make no paid model call and start no real builder: tests use stubs and synthetic fixtures. Never read or copy real transcripts, labels or private stores into the repository; the real-data files (draw, manifests, registration, error baseline, audit) are seat steps after the build. Add one session entry to `docs/sessions/2026-10.md`, newest first.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every touched test file, `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, `nana-writing` on the session entry, and `node scripts/identity-scan.mjs --root .` after `git add`. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
