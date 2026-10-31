Feature: FEAT-040 · Make and keep memory

Lane owner-profile. Class: ordinary. Builder: pi-worker (larger lane). Build session 2, on this branch's tip.

Build 1 is done and green. Lane memory-making has landed on main (a6dcc99a). Its final shape module differs from the copy this branch took.

1. Merge main into this branch. Expected conflicts: `packages/nana-pack/lib/memory-making-config.mjs` (add/add), `packages/nana-pack/tests/requirements-tree.test.mjs` (heading counts), `docs/code-map.md` and `docs/requirements-tree.md` (regenerate both). Take main's `memory-making-config.mjs` whole; this lane defines no field or word there.

2. Adopt main's shape exports instead of local literals: `SOURCE_WORDS` (this lane writes `saved`), the user kind words (`correction`, `decision`, `preference`, `fact`, `thinking`; the store still refuses `decision` and `open-thread`), and the seat evidence form `seat:<runtime>:<session key>:<date>`, which main's `resolveEvidence` resolves to the record's own quote. Every test that asserts one of these imports the name. Keep effective trust and liveness in this lane's single reader, as the plan says.

3. Carried notes from memory-making's final review, for the seat's notes step only; do not change the maker.

No new rows unless a must-meet needs one; any new row takes R-3230 to R-3249.

## Done when

Rows implemented with backticked evidence. Green: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip.

## Precedent

- `packages/nana-pack/lib/memory-making-config.mjs`: the shape module on main.
- `packages/nana-pack/lib/memory-making.mjs`: `resolveEvidence`.
