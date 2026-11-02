Feature: FEAT-040 · Make and keep memory

Lane seat-memory-push-a. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on branch tip 7291c92e. Build 2 stopped PARTIAL: `profile-store.test.mjs` fails four cases with `profile refused: git failed`. The same file passes 20 of 20 on main.

## Precedent

- `packages/nana-pack/bin/nana-profile.mjs` (line 93, the prefix filter build 2 changed)
- `packages/nana-pack/tests/profile-store.test.mjs`

Report each departure.

## Build

The seat's reading of the cause: build 2 changed the filter to `r.id.startsWith(p.id.toLowerCase())`, but `save` has no `p.id`, so every save throws before the store is touched and the catch reports it as a git failure. Confirm the cause, then fix it so `save` never reads an id and the uppercase-prefix behaviour from build 2 stays. Do not weaken any test.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Use only synthetic fixtures.

## Done when

`node packages/nana-pack/tests/profile-store.test.mjs` passes every case, the new uppercase case included. Also green: `node packages/nana-pack/tests/requirements-tree.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push the branch and stop.
