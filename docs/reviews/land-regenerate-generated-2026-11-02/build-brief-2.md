Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-regenerate-generated. Class: gate (land tool). Builder: pi-worker (larger lane). Build session 2, resuming build 1 (`build-brief-1.md` in this folder; every rule there still applies). The laptop ran out of memory at about 10:40 and build 1 was stopped mid-run with nothing committed. Its partial edits are still in the working tree, uncommitted. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node and Git for Windows are on PATH.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Build

1. Start with `git status` and `git diff`. Treat the uncommitted edits as an unreviewed draft from an interrupted run: keep what is correct against the plan's Revision 2, and finish or redo the rest. Report which parts you kept, changed or redid.
2. The seat settled Revision 2's question as go, with this exact clause in the ruling line (`packages/nana-pack/rules/nana-rulings.md`, line 33): "a conflict only in the generated files the land contract names, rebuilt by their own generators, counts as no conflict". Use the same words in the guidance, the rendered AGENTS region, the README and M9.
3. Keep memory low: run the test files one at a time, never in parallel, and run no other heavy process alongside them. Do not run the full suite.
4. Everything else is as `build-brief-1.md` says: rows, must-meets, constraints, "Show your work", "Done when" and report.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs`: `cleanMergeTree` and `runLandCore`.
- `packages/nana-pack/lib/land-config.mjs`: the `CLEAN_MERGE_*` values.
- `packages/nana-pack/tests/land-clean-merge.test.mjs` and `packages/nana-pack/tests/land-fixtures.mjs`.
- `scripts/code-map.mjs` and `scripts/requirements-tree.mjs`. Read only.
