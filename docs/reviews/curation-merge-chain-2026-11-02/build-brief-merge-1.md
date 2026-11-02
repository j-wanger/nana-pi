Feature: FEAT-040 · Make and keep memory

Lane curation-merge-chain. Class: ordinary. Builder: pi-worker (small lane). Merge build, on branch tip 33b72899. Main has moved to a66c0602 or newer, including the memory-curation land, since this lane branched at 497c5891. This build merges main before the PR, so CI runs once on the merged tip. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

## Precedent

- `docs/reviews/memory-curation-2026-11-02/build-brief-merge-1.md`: the merge-build shape this follows.
- `docs/reviews/curation-merge-chain-2026-11-02/plan.md`: Revision 2 names what this lane changes.

Report each departure.

## Build

Run `git fetch origin`, then merge `origin/main` into `feat/curation-merge-chain`.

Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes:
- rows R-3698 to R-3702;
- the SUB-027 section moved from under FEAT-043 to under FEAT-040, with its rows unchanged. If main changed any SUB-027 row, keep main's row text at the new location;
- the one FEAT-040 known-bug line "a skip covers only one owner turn";
- the code in `profile-store.mjs`, `nana-curate.mjs` and `memory-curation.mjs`;
- the tests in `memory-curation.test.mjs` and `profile-store-guards.test.mjs`;
- the README paragraph;
- this review folder.

If main changed the same lines this lane changed, keep main's change and re-apply the lane's intent on top. Report each such case.

Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators, `npm run map` and `node scripts/requirements-tree.mjs --write`, rather than hand-merging them. Change no behaviour.

Never read a real owner profile or memory store. Never read, print or use a stored credential. No GitHub API calls. No committed text names a person or a machine path.

## Done when

- `git diff origin/main HEAD --stat` lists only this lane's files. Save it as `merge-1-diff-stat.txt` in this folder.
- Green, run locally:
  - `memory-curation.test.mjs`, `profile-store-guards.test.mjs`, `profile-store.test.mjs`, `profile-sync.test.mjs`, `memory-shaping.test.mjs`, `test-runner.test.mjs` and `requirements-tree.test.mjs`, all in `packages/nana-pack/tests/`;
  - `npm run map:check` and `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check` and `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- Do not run the locked full suite; CI is the suite.
- Commit the merge with explicit paths.

Report the merge commit, each conflict and how it was resolved, and each departure. Commit, do not push, and stop. Report the full tip.
