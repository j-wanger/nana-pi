Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-regenerate-generated. Class: gate (land tool). Builder: pi-worker (small lane). Build session 3, on branch tip 7bb02fd8 after build 2. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node and Git for Windows are on PATH. The laptop is memory-limited: run test files one at a time.

The plan of record is unchanged (`plan.md` in this folder, Revision 2 overriding). The seat verified build 2 and ran its wrong-code pairs (`seat-mutate.mjs`, `seat-mutate.txt` in this folder): 6 of 7 red. One finding.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Build

1. MUST: pair G3 survived. Skipping the non-contract tree comparison in `regenerateTree` (`if (treeChanges.length) throw`) leaves every check green.
   - Cause: M4's `index` case runs `git update-index --force-remove base.txt`. That leaves `base.txt` on disk, so `git ls-files --others` reports it as untracked, and the working-copy scope check refuses first.
   - Fix M4 so one case reaches only the tree comparison: the fixture generator changes a tracked non-contract file and stages that same content in the private index. For example, write new content to `base.txt`, then `git add base.txt`. The working copy then matches the index, nothing is untracked, and only the final tree differs from the merge result.
   - The refusal must name `base.txt` with `generatorScope`.
   - Keep the existing `index` case, since it still covers removal, and add this one beside it.
2. Re-run `node docs/reviews/land-regenerate-generated-2026-11-02/seat-mutate.mjs` with `SEAT_MUTATE_SHARDS=1` and `SEAT_MUTATE_OUT=docs/reviews/land-regenerate-generated-2026-11-02/seat-mutate-3.txt`. All 7 pairs must be red.

Change nothing else. Code changes are not expected; if one is needed, report why.

## Done when

- Green, run one at a time: `land-regenerate.test.mjs`, `land-clean-merge.test.mjs`, `land-clean-merge-race.test.mjs` and `test-runner.test.mjs`, all in `packages/nana-pack/tests/`; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/known-bugs.mjs --root .`; and `node scripts/identity-scan.mjs --root .` after `git add`.
- `seat-mutate-3.txt` shows 7/7 red.
- Commit explicit paths on `feat/land-regenerate-generated`.

Report the fixture change, the pair result and each departure. Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/tests/land-regenerate.test.mjs`: M4 (83-103) and its `injected`, `regenerateFixture` and `refuse` helpers.
- `packages/nana-pack/bin/nana-land.mjs`: `regenerateTree`, the scope checks and the tree comparison.
