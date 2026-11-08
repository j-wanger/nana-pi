# Merge current main into review-paperwork

## Scope and parents

- Branch: `feat/review-paperwork`.
- First parent: `9616c0f522a2b2cce08d47d13518994b072ad0ea`.
- Merged main: `b0ca3b98047b24a66468f32d0a8ae3bcc4bad0af`.
- Merge base: `ae1f14f9216516e64165264e142831d567eb7222`.
- Objective served: maintain the shared toolkit's review workflow alongside the retired study runner.

## Conflict resolutions

Git reported four conflicted files, not the three anticipated by the brief.

1. `docs/code-map.md`: regenerated with `npm run map`, never hand-merged. Every generated conflict hunk is retained in `generated-conflicts.diff`. The hunks concern the coverage summary, component-audit edges, deliverables edges, the git-runner/glob-match entries, product-report edges, requirements-tree edges, and test graph edges. Generation includes both new helper modules and excludes both lanes' retired modules.
2. `packages/nana-pack/tests/code-map-launch.test.mjs`: one hunk in the R-3156 fixed-base edge check. Kept main's retired-study loss reasons and this lane's retired-target and retired-source allowances. Neither side's loss inventory was dropped.
3. `packages/nana-pack/tests/requirements-tree.test.mjs`: one hunk in the temporary CLI fixture's copied module list. Copy both `git-runner.mjs` and `glob-match.mjs`; omit the deleted `requirements-moved.mjs` and obsolete bench directory setup. The fixture must mirror the merged imports.
4. `scripts/deliverables.mjs`: one import hunk. Import `globMatch` from main's `scripts/glob-match.mjs` and `MAX_GIT_BUFFER` from this lane's `scripts/git-runner.mjs`. Both old source modules remain deleted. No helper implementation was copied.

`code-map.config.json` merged automatically: main's retired bench launch entries stay removed, and this lane's `review-run.mjs` entry remains. `REQUIREMENTS.md` also merged automatically. `docs/requirements-tree.md` was regenerated with `npm run req:tree` rather than hand-merged. All main deletions stand.

## Rows and tests

`row-preservation.log` verifies both parents' changed rows byte-for-byte: this lane's 78 new/changed rows and main's 95 new/changed rows all survive. The merged ledger has 2591 distinct requirement IDs. No parent row was dropped or renumbered. No additional requirement was authored.

Test selection is the union of both parents' changed `.test.mjs` paths since their merge base, filtered to paths still present. `test-files.txt` lists all 35 selected files; `deleted-tests.txt` lists 17 deleted files excluded from execution. The runner awaits its files under the existing per-file limits.

Only two tests needed manual conflict resolution, listed above. Other test edits are the existing parent changes merged by git. No new tests, tunables or behavior were added. New mutation pairs are therefore not applicable: this is integration of already-tested parent implementations, not a new feature implementation.

## Commands and results before commit

All commands ran from the lane root. Each exit code was read independently.

| Command | Exit | Evidence |
|---|---:|---|
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:impact -- scripts/deliverables.mjs` | 0 | `impact.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `component-audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `npm test -- <35 explicit paths from test-files.txt>` | 0 | `touched-tests.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| `git diff --check` | 0 | no whitespace errors |

Touched-test summary: 35 files: 35 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 1065 pass, 0 fail, 14 skip.

Component-audit staleness and unclaimed-module lines are report-only; the audit exits 0. The requirements trace reports 2591 rows, 2202 traced by tests, and zero rows off EARS form. Node emitted an existing module-type warning. Evidence paths were normalized to `~` and `$TMPDIR`.

## Limits

CI covers the full suite under `AGENTS.md`; no local full suite was run. Native Windows checks remain for the seat's hosted CI; this local run is macOS. No push, CI lookup, issue operation, model session or reviewer session was performed. No precedent departure: this fix brief names none.

The complete `docs/known-bugs/FEAT-007.md` was read. This merge fixes none of its known bugs. In particular, movement/keep retirement remains this lane's existing change; the merge only retains its shared git helper while incorporating main's glob helper migration. No known-bug file, HANDOFF or session archive was edited.

The final response records the merge commit's full tip and checks rerun on that commit.
