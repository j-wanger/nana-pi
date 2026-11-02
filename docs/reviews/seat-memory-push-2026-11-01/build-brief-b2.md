Feature: FEAT-044 · Deliver memory to each role

Lane seat-memory-push (Lane B). Class: hook. Builder: pi-worker (small lane). Build session 2, on branch tip 0847dabe.

The tip's ubuntu CI failed: `packages/nana-pack/tests/requirements-tree.test.mjs` pins the real ledger's heading count at 76 in two checks (R-288 near line 28 and R-1158 near line 383), and this lane's new FEAT-044 heading makes 77. The independent check (`independent-check-0847dabe.md` in this folder) passed with three SHOULD findings.

## Precedent

- `packages/nana-pack/tests/requirements-tree.test.mjs`
- `docs/known-bugs/FEAT-044.md`
- `docs/known-bugs/FEAT-040.md`

Report each departure.

## Build

1. Update both heading-count literals to 77. Before that, grep every test and checker for other literals this lane's new heading, rows or files break (counts of headings, features, rows, deliverables), and fix each the same way.
2. Add the independent check's three SHOULD findings to `docs/known-bugs/FEAT-044.md` as one line each, in that file's format, naming "(seat-memory-push, independent check)".
3. Add one line to `docs/known-bugs/FEAT-040.md`: project-record retract, confirm and supersede events skip the `PROFILE_LIMITS.quote` cap that `writeProfileEvent` enforces (seat-memory-push-a, review).

Change no product code.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`node packages/nana-pack/tests/requirements-tree.test.mjs` passes, plus every other test file you touched, the known-bugs check, `npm run map:check`, `npm run readme:check` and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
