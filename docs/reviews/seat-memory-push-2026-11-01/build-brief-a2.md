Feature: FEAT-040 · Make and keep memory

Lane seat-memory-push-a. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip f410db62. Round 1 (kept in this folder as `r1-*.md`) sent back one MUST and one SHOULD.

## Precedent

- `docs/requirements-tree.md` and `npm run req:tree`
- `packages/nana-pack/tests/profile-store.test.mjs` (the A2 case, lines 120-123)
- `packages/nana-pack/bin/nana-profile.mjs`

Report each departure.

## Build

1. MUST: the requirements tree was not regenerated, so `requirements-tree.test.mjs` fails five R-291 checks on the tip (CI run 41343316046). Run `npm run req:tree` and commit the result.
2. SHOULD: in the A2 test the short prefix (11 characters) also matches a second record, so it is refused as ambiguous and the 12-character minimum is never tested on its own. Use a short prefix that matches exactly one record, so only the length rule can refuse it.
3. NOTE, take it: the README calls the 12-hex id "the claim's SHA-256 prefix"; say that profile ids hash the claim and project ids hash evidence plus claim.
4. NOTE, take it: the prefix check ignores case but the match does not; make the match lower-case the prefix, or make the check case-sensitive, so an uppercase prefix is not refused as unknown.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Use only synthetic fixtures.

## Done when

Green, run locally: `node packages/nana-pack/tests/profile-store.test.mjs`, `node packages/nana-pack/tests/requirements-tree.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push the branch and stop.
