Feature: FEAT-040 · Make and keep memory

Lane seat-memory-push-a. Class: ordinary. Builder: pi-worker (small lane). Build session 1, on main b757e4d0. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`); this lane is its "Lane A": must-meets A1 and A2 only. Lane B (the seat push in the shared-memory hook) is a later lane and out of scope here. The plan's ask went out as issue #299; with no reply, its defaults stand.

Threat model: honest variation in our tools' output is in scope (launcher roles set or empty, short, unknown or ambiguous ids, records in either area); deliberate forgery, such as a planted store or a hand-made event, is out.

## Precedent

- `packages/nana-pack/bin/nana-profile.mjs` (`resolveProfile`, the existing role refusal, and the confirm, retract and supersede commands)
- `packages/nana-pack/lib/profile-store.mjs`
- `packages/nana-pack/lib/memory-store.mjs` (`readMemoryStore`, `writeMemoryFile` for project-area events)
- `packages/nana-pack/tests/profile-store.test.mjs` and `packages/nana-pack/tests/profile-fixture.mjs`
- `packages/nana-pack/tests/memory-run-fixture.mjs`

Report each departure.

## Build

Rows: R-3410 and R-3411 only, under FEAT-040 · SUB-023, beside R-3231. Requirement rows first, then the two must-meet tests with their `req:` markers, then code.

1. A1 (R-3410): every profile command refuses under a launcher role. With `NANA_ROLE=worker`, and again with `NANA_ROLE=""` (set but empty), `show`, `sync`, `save`, `confirm`, `retract`, `supersede` and `init` each exit 1 with `profile refused: NANA_ROLE is set`, before reading the pointer; a canary in the store never prints. Move the role refusal above every command.
2. A2 (R-3411): `retract`, `confirm` and `supersede` accept a unique 12-hex id prefix across the whole store (profile and project areas). A project-record retract event is written under `projects/<folder>/events/` through `writeMemoryFile`, so `readMemoryStore` shows the record not live; a profile record retracts as today. An unknown prefix, an ambiguous prefix and a prefix under 12 characters each refuse with a fixed line and write nothing.
3. Update the pack README's profile section to match. In `docs/known-bugs/FEAT-040.md`, remove the line "show and sync skip the role refusal…" (fixed here) and add: "Memory push (seat-memory-push plan, attack N2): a reworded re-extraction of a retracted claim gets a new id and returns on the next push."

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Use only synthetic fixtures; never read the real profile or memory store.

## Done when

Wrong code first: both new tests red against main's code, then green. Green, run locally: the touched test files, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
