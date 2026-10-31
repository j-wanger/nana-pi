Feature: FEAT-040 · Make and keep memory

Lane owner-profile. Class: ordinary. Builder: pi-worker (small lane). Build session 5, on this branch's tip (f4ed3dfb).

Build 4's merge renumbered a landed ID: on main, `SUB-022 · Shape memory candidates with a model` belongs to lane memory-shaper; this branch moved it to SUB-023 and gave SUB-022 to `Keep a private owner profile`. IDs are stable and never renumbered. Swap them back: the landed shaper subgroup keeps SUB-022, and this lane's `Keep a private owner profile` subgroup takes SUB-023. Change every reference to the two subgroup IDs accordingly (REQUIREMENTS.md, tests, docs), regenerate `docs/requirements-tree.md` and `docs/code-map.md`, and confirm with `git diff main -- REQUIREMENTS.md` that no landed ID changed. No behaviour change.

## Done when

Green: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip; rerun a failed Windows job once and say if you did.

## Precedent

- `REQUIREMENTS.md`: the subgroup headings.
- `docs/requirements-tree.md`: regenerated.
