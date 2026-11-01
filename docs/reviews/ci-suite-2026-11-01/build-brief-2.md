Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane ci-suite. Class: gate. Builder: pi-worker (small lane). Build session 2, on branch tip 711e351f. The lane's independent check (`independent-check-711e351f.md` in this folder) found one MUST; this build fixes it and nothing else.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs` (the changed-path diff call, around line 177)
- `packages/nana-pack/tests/land-ci-suite.test.mjs` and `packages/nana-pack/tests/land-fixtures.mjs` (real-repo fixtures)

Report each departure.

## Build

The MUST: `git diff --name-only` detects renames by default and prints only the new name, so renaming `scripts/test.mjs` (with or without an edit) never names a fallback path, and the land accepts CI as the suite. R-3432 says a diff naming `scripts/test.mjs` must fall back.

1. Make the changed-path listing name both sides of a rename (for example `--no-renames`), so a rename or move of any fallback path falls back to the local suite. Keep every other changed-path behaviour.
2. Widen R-3432's test with one case that uses a real git repository with a real rename of `scripts/test.mjs`, not an injected diff, and asserts the local suite runs with the fallback-path reason.
3. Add this case to the lane's mutation runner (`seat-mutate.mjs`) as one pair: restoring rename detection must turn that case red. Re-run the mutation runner and report it.

Change no other behaviour. Do not add `package.json` to the fallback list; the seat records that as a known bug.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: the touched test files, the mutation runner, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. This lane changes `scripts/test.mjs`, so run `npm run test:locked` once in the foreground on the final tip and report its summary. Push the branch and stop.
