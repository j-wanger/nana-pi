Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-regenerate-generated. Class: gate (land tool; the seat runs wrong-code pairs after the build). Builder: pi-worker (larger lane). Build session 1, on `feat/land-regenerate-generated`, based on `origin/feat/land-clean-merge` 1af2d93a, not main. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node and Git for Windows are on PATH.

Build to the plan of record, `docs/reviews/land-regenerate-generated-2026-11-02/plan.md`. Its "Revision 2" section, written after the pi adversary's `plan-attack.md`, overrides the sections above it. The seat question in Revision 2 defaults to go: amend the ruling line with the one clause. Build rows R-3706 to R-3712 and amend R-3691 and R-3696, with must-meet M1 to M7 as Revision 2 states them. Requirements first: rows, then tagged tests, then code.

Why this lane exists: land-clean-merge lands a textually clean merge of main without new CI or review. Its measurement found 12 of 44 past merge builds conflicted only in the generated code map and requirements tree. This lane lets those land by regenerating the files with their own generators, under a sealed contract.

Threat model: honest variation is in scope, as the plan lists it. A generator script built to forge its output is out, and so are writes outside the temp folder; both are recorded residuals.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - `packages/nana-pack/bin/nana-land.mjs`;
  - `packages/nana-pack/lib/land-config.mjs`;
  - `packages/nana-pack/tests/land-regenerate.test.mjs` (new);
  - `packages/nana-pack/tests/land-fixtures.mjs`;
  - `packages/nana-pack/tests/land-clean-merge.test.mjs`, the M9 check only;
  - `REQUIREMENTS.md`;
  - `templates/_shared/working-under-nana-pi.md`, and the rendered `AGENTS.md` region through the repository's own render step;
  - `packages/nana-pack/README.md`;
  - `packages/nana-pack/rules/nana-rulings.md`, line 33 only;
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder;
  - an export under the standing authorization only.
- Do not change `scripts/code-map.mjs` or `scripts/requirements-tree.mjs`.
- All git fixtures are throwaway repositories under the OS temp folder. Never run `nana-land` against this repository. Never push. No GitHub API calls.
- Never read, print or use a stored credential.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/land-regenerate-generated-2026-11-02/`:
- `determinism.txt` (Revision 2);
- `wrong-code.txt`: each new check against the branch base's code and against yours;
- `build-1-green.txt`: `land-regenerate.test.mjs`, `land-clean-merge.test.mjs`, `land-clean-merge-race.test.mjs`, `land.test.mjs`, `land-merge.test.mjs`, `land-records.test.mjs` and `test-runner.test.mjs`, all in `packages/nana-pack/tests/`.

## Done when

- M1 to M7 hold. The new rows are `implemented` with backticked `file::title` evidence. R-3691 and R-3696 are amended.
- These are green:
  - the test files above;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- Commit explicit paths on `feat/land-regenerate-generated`.

Report:
- the rows;
- the contract, the temp-directory flow and its cleanup;
- what each generator needed in order to exit 0;
- the configuration guard;
- each existing-test edit with its reason;
- each wrong-code run;
- any export made under the standing authorization;
- each departure from the Precedent.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs`: `cleanMergeTree`, `mergeRefusal`, and `runLandCore`'s merge, proof, CI re-read and lock sequence.
- `packages/nana-pack/lib/land-config.mjs`: the `CLEAN_MERGE_*` values and their provenance comments.
- `packages/nana-pack/tests/land-clean-merge.test.mjs` and `packages/nana-pack/tests/land-fixtures.mjs`: the real-git clean-merge fixtures, and M9.
- `packages/nana-pack/tests/land-clean-merge-race.test.mjs`: the race checks.
- `scripts/code-map.mjs` and `scripts/requirements-tree.mjs`: the `--write` and `--check` modes and the configuration they read. Read only.
- `templates/_shared/working-under-nana-pi.md` and `packages/nana-pack/rules/nana-rulings.md`: the wording to amend.
