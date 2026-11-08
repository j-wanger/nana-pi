# setup-retire-win2 technical record

Feature: FEAT-013 · Install and connect harness runtimes
Branch: `feat/setup-retire-win2`

## Change

- `REQUIREMENTS.md`: narrow R-3805 to document omissions, retired contracts/artifacts, and setup status sound with no gap. Update its evidence title.
- `packages/nana-pack/tests/setup-retire.test.mjs`: edit only M7, renaming its title and removing its four whole-repository checker launches. Keep every document, row, artifact, and component assertion.
- `docs/code-map.md`: regenerate to remove the deleted unresolved launch.
- No production code, new tests, tunables, or function contracts changed.
- Precedent: omitted by the Card: fix brief; no departures from the existing M7 assertion pattern.

## Mutation pair

`mutation.log`: evaluate the edited M7 body verbatim against OS-temporary copies of its six input files. Reintroduce the retired extension name `nana-notify` in the pack README: M7 fails with an assertion (exit-equivalent 1). Restore the README: M7 passes (exit-equivalent 0). The mutation driver exits 0 after verifying both outcomes. Assertions are unchanged; no repository document is mutated. No new test was added.

## Spawn audit

Grep command: `spawnSync|timeout:` against `packages/nana-pack/tests/setup-retire.test.mjs`.

The deleted M7 loop was the only whole-repository checker launch. The only remaining spawn is M3's real adoption hook at line 83, limited to 10 seconds. Retained deliberately: it is the behavior under test in R-3801, not a nested repository checker. Removing it would discard the brief's real-hook coverage rather than fix checker duplication. This interprets the brief's further-script audit in the stated whole-repository-checker context.

## Commands and results before commit

| Command | Exit | Result / evidence |
| --- | --- | --- |
| `npm run map:impact -- packages/nana-pack/tests/setup-retire.test.mjs` | 0 | No transitive callers; existing helper imports retained |
| Temporary M7 document mutation driver | 0 | `mutation.log`: wrong document 1, restored document 0 |
| `node scripts/test.mjs setup-retire.test` | 0 | `touched-tests.log`: 5 pass, 0 fail |
| `npm run map:check` (first run) | 1 | Generated map stale after launch removal |
| `npm run map` | 0 | `map-generate.log`: generated map refreshed |
| `npm run map:check` (after generation) | 0 | `map-check.log` |
| `npm run req:tree` | 0 | `req-tree.log`: 0 problems |
| `npm run readme:check` | 0 | `readme-check.log` |

## Scope and remaining verification

Read all of `docs/known-bugs/FEAT-013.md`; none of its listed bugs is changed or closed. The reported Windows M7 nested-checker timeout is removed. No known-bug file was edited.

The full suite is delegated to CI under AGENTS.md. No push, CI read, model session, or issue operation was performed. Native Windows execution remains for the seat's CI workflow. The four named seat checks must also run on the final commit; their final-tip results belong in the builder's delivery report.
