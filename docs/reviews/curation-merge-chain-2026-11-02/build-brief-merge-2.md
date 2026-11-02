Feature: FEAT-040 · Make and keep memory

Lane curation-merge-chain. Class: ordinary. Builder: pi-worker (small lane). Merge build 2, resuming merge build 1 (`build-brief-merge-1.md` in this folder; its rules all still apply). The laptop ran out of memory at about 10:40 and the previous builder was stopped mid-run. It had committed a merge of origin/main (965d62f0). It then started a second merge of a newer origin/main, and git reports "All conflicts fixed but you are still merging", with the result staged but not committed. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

## Precedent

- `docs/reviews/memory-curation-2026-11-02/build-brief-merge-1.md`: the merge-build shape.
- `docs/reviews/curation-merge-chain-2026-11-02/build-brief-merge-1.md`: what this lane keeps.

Report each departure.

## Build

1. Inspect the in-progress merge before committing anything: `git status`, `git diff --cached --stat`, and `git log -1 MERGE_HEAD`. Check the staged result against merge brief 1's rules: every file this lane did not set out to change equals that MERGE_HEAD, and the lane's own changes are kept. If the staged result is wrong, fix it. If it cannot be trusted, run `git merge --abort` and merge the newest `origin/main` again (`git fetch origin` first).
2. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`), then commit the merge with explicit paths.
3. Keep memory low: run the test files below one at a time, never in parallel. Do not run the full suite.

## Done when

- `git diff origin/main HEAD --stat` lists only this lane's files. Save it as `merge-2-diff-stat.txt` in this folder.
- Green, run one at a time:
  - the seven test files merge brief 1 names;
  - `npm run map:check` and `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check` and `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- Report the merge commits, each conflict and how it was resolved, what you found in the staged merge, and each departure.

Commit, do not push, and stop. Report the full tip.
