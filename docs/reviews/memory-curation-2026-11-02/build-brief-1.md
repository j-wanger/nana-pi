Feature: FEAT-040 · Make and keep memory

Lane memory-curation. Class: ordinary. Builder: pi-worker (larger lane). Build session 1, on main 7c4e7e19. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`). Build it as written: its Design, Assumptions and Open choices (take its defaults), the must-meets and the forecast of changed tests. The owner's words and answers are quoted in the plan.

Threat model: honest variation in our tools' output is in scope (malformed or partial store, shared quotes, a model that returns junk or nothing, an owner who rejects everything, records from both machines); deliberate forgery is out.

IDs: subgroup SUB-027, artifact A-100, rows from R-3560 to R-3579 in must-meet order, then the seal rows.

## Precedent

- `packages/nana-pack/lib/memory-run.mjs`
- `packages/nana-pack/lib/memory-store.mjs`
- `packages/nana-pack/lib/profile-sync.mjs`
- `packages/nana-pack/bin/nana-profile.mjs`
- `packages/nana-pack/lib/profile-store.mjs`
- `packages/nana-pack/lib/profile-guards.mjs`
- `packages/nana-pack/lib/memory-shaping.mjs`
- `packages/nana-pack/lib/memory-shaping-config.mjs`
- `packages/nana-pack/lib/memory-making.mjs`
- `scripts/memory-shape-runners.mjs`
- `scripts/memory-run.mjs`
- `packages/nana-pack/bin/nana-memory.mjs`
- `packages/nana-pack/lib/outcome-meter.mjs`
- `scripts/requirements-regroup.mjs`
- `packages/nana-pack/tests/profile-fixture.mjs`
- `packages/nana-pack/tests/memory-run-fixture.mjs`
- `packages/nana-pack/tests/profile-sync.test.mjs`

Report each departure.

## Build

Requirement rows first, then the tagged tests (wrong code first: each new test red against main's code, recorded in this folder), then code and README. Grep every test and checker for literals this change breaks before limiting edits. Every test uses synthetic stores under the OS temp folder and a stub proposer; never read, write or send the real profile or store, and never call a paid model. No record text in any log, test output or repo file. Add one session entry to `docs/sessions/2026-10.md`, newest first.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every touched test file, `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, `nana-writing` on the session entry, and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
