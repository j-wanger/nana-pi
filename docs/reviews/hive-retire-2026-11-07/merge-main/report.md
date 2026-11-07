# Merge current main into hive-retire

## Scope and resolution

- Branch: `feat/hive-retire`.
- Lane parent: `e96655af2b1428acdca72c0a498d5a8c2a26f7fa`.
- Main parent: `ae1f14f9216516e64165264e142831d567eb7222`.
- Common base: `89afbe5598bd0ded716df1fe8c57515122f4fda6`.
- `git merge --no-commit --no-ff main` exited 1 with two conflicting files.
- Contrary to the brief's forecast, `REQUIREMENTS.md` merged automatically without a conflict hunk.
- Verified every row against both parents and the base: 2,581 merged rows, no lost or renumbered row, no divergent overlapping row edit.
- Kept lane additions R-3775–R-3782 and main additions R-3757–R-3764, plus both sides' retirements and edits. `rows.log` lists every affected ID.
- All main deletions stand. No additional deletion was made.

### Conflict hunks (line numbers in the initial conflicted file)

| File | Hunk | Resolution |
| --- | --- | --- |
| `docs/code-map.md` | 13–17: covered roots | Regenerated with `npm run map`; retired preview root stays absent. |
| `docs/code-map.md` | 1259–1263: knowledge hook callers | Regenerated; both deleted test callers disappear. |
| `docs/code-map.md` | 1556–1560: land callers | Regenerated; both deleted test callers disappear. |
| `docs/code-map.md` | 1653–1661: worker callers, callees and launch positions | Regenerated from combined sources, retaining both retirements. |
| `packages/nana-pack/tests/code-map-launch.test.mjs` | R-3156 fixed-base lost-edge assertion | Kept the lane's preview-retirement condition and main's explicitly retired-source condition in the same assertion. |

`docs/requirements-tree.md` also merged automatically but was regenerated with `npm run req:tree`, as requested.

## Tests and implementation

- Only manual source edit: the existing R-3156 assertion in `packages/nana-pack/tests/code-map-launch.test.mjs` now recognizes both sides' intentional edge removals.
- No new requirement, test, sealed tunable, function, or behavior was authored.
- Mutation pairs / wrong-code runs: not applicable to this merge-only brief; no must-meet tests were requested.
- Precedent: omitted by the Card: fix brief; no departure.
- Known bugs: read all of `docs/known-bugs/FEAT-039.md`; this merge fixes no additional known bug. Existing first-look and component-audit limitations remain unchanged.

## Pre-commit checks

Each exit code was read independently. Outputs are in this folder.

| Command | Exit | Evidence |
| --- | --- | --- |
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `npm test -- <all paths in touched-tests.txt>` | 0 | `tests.log` |
| `git diff --check` | 0 | No output for manual resolution edits. |
| `git diff --cached --check` | 2 | Two pre-existing trailing spaces in main's `docs/reviews/one-reviewer-2026-11-07/build3-checks.log`, lines 3 and 12; preserved imported evidence unchanged. |

Tests were identified from both base-to-parent diffs, filtering added/modified test paths to surviving files. All 20 identified files ran. Deleted tests were not restored or run.

`20 files: 20 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 592 pass, 0 fail, 3 skip · 263.5s`

The audit reports six stale components and 20 unclaimed modules; those are report-only notes, not failures. Node prints its existing module-type warning in audit and trace output. Absolute checkout paths in those warnings were replaced with repo-relative paths before committing evidence.

## Remaining work

- Re-run the brief's checks on the merge commit; report results with its full SHA in the final builder report.
- Full suite and native Windows run are deferred to CI under `AGENTS.md`. No push, CI read, model session, issue operation, install, or land was performed.
