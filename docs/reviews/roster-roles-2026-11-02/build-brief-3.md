Feature: FEAT-041 · Shape each agent's context by role

Lane roster-roles. Class: hook. Builder: pi-worker (small lane). Build session 3. Round 2's final reviewer found one MUST (kept as `r2-reviewer-*.md`): this lane's `pi-worker.mjs` refactor removed the line `promptParts.push(Buffer.from('\n\n'), Buffer.from(digest.text))`, so `packages/nana-pack/tests/hive-city.test.mjs` R-3187's flow table no longer finds exactly one evidence line for the `ledger/bay-1` flow and fails on every platform. The product still delivers the digest (now at `pi-worker.mjs`'s `promptBytes: [...]`).

Authorization: update only R-3187's `ledger/bay-1` evidence pattern in `hive-city.test.mjs` so it matches exactly one line, the new digest-delivery line, keeping the check as strict as before (one match, same flow). Do not change product code. Run the requirements-trace and tree checks in case the evidence cell names the pattern.

## Precedent

- `packages/nana-pack/tests/hive-city.test.mjs`
- `packages/nana-pack/bin/pi-worker.mjs`

Report each departure.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node scripts/test.mjs hive-city.test.mjs`, every test file this lane touched, the seat pairs (`seat-mutate.mjs`, still all red), `npm run map:check`, the requirements trace, the tree check, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Push and stop.
