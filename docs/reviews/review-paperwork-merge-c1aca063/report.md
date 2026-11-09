# Merge current main: review-paperwork

## Parents and scope

- Branch: `feat/review-paperwork`.
- First parent: `2db50942ee6db75f9c00b1b43a2682924f330c37`.
- Main parent: `c1aca063ef642c90acd18b7258dc92f2f88eadee`.
- Merge base: `b0ca3b98047b24a66468f32d0a8ae3bcc4bad0af`.
- Objective served: keep the shared toolkit's review workflow current with main's preview retirement.
- Main's deletions stand. No rebase, behavioral additions, new requirements or new tests.

## Conflict hunks

Git reported two conflicted files. `conflicts.diff` preserves the combined diff before resolution.

1. `docs/code-map.md`, coverage hunk: regenerated with `npm run map`; main's preview root disappears and this lane's live modules remain.
2. `docs/code-map.md`, component-audit callers/callees hunk: regenerated; main's preview-retirement test replaces deleted preview consumers, and this lane's git-runner replaces requirements-moved.
3. `docs/code-map.md`, product-report callers/callees hunk: regenerated; retain preview-retirement caller and git-runner callee, not retired requirements-moved. The nearby first-look and git-runner combined-diff context also comes from generation.
4. `packages/nana-pack/tests/code-map-launch.test.mjs`, R-3156 assertion hunk: retain main's retiredPreview predicate, this lane's retiredTargets allowance, and both parents' retiredSources and losses. This is the only manually resolved test edit. No assertions were inverted.

`code-map.config.json` merged automatically, contrary to the expected conflict: keep main's removed preview root/vendor exemption and this lane's review-run declaration. `REQUIREMENTS.md` also merged automatically. `rows.log` verifies every changed/new row from each parent byte-for-byte: 78 from this lane and 30 from main, with zero lost; all parent IDs survive. The ledger has 2599 distinct rows. No row was renumbered. `docs/requirements-tree.md` was regenerated with `npm run req:tree`, not hand-merged.

`merged-paths.txt` lists inherited and resolved merge paths. Main's existing known-bug-file removal is inherited without manual edits. HANDOFF and session archives remain untouched.

## Tests and evidence

Selection: union of changed `.test.mjs` files on both sides since the merge base, filtered to existing files. `test-files.txt` lists 30 selected files; `deleted-tests.txt` lists retired test paths not run. Existing runner limits bound each awaited file.

No new tests or tunables: wrong-code mutation pairs are not applicable to this merge-only integration. The sole manual test edit unions existing retirement allowances because either parent's assertion alone rejects the other parent's intentional deletions. All other test changes are inherited parent changes. No helper was authored or copied; no caller contract changed.

| Command | Exit | Evidence |
|---|---:|---|
| `git merge --no-commit --no-ff main` | 1 | Expected conflicts, captured in `conflicts.diff` |
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `npm test -- <30 explicit paths in test-files.txt>` | 0 | `tests.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| `npm run map:impact -- packages/nana-pack/tests/code-map-launch.test.mjs` | 0 | `impact.log` |
| `git diff --check` | 0 | No whitespace errors |

Touched-test summary: 30 files: 30 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 859 pass, 0 fail, 14 skip.

Requirements trace: 2599 rows, 2188 traced by tests; zero rows off EARS form. Component-audit staleness/coverage lines are report-only. The trace's existing Node module-type warning remains. New evidence normalizes machine paths to `~` and `$TMPDIR`.

## Limits and departures

CI covers the full suite under AGENTS.md; no local full suite was run. Native Windows execution and CI remain for the seat. No push, CI lookup, credentials, issue operation, reviewer or model session occurred. The fix brief names no Precedent; no precedent departure applies. Impact was inspected after resolution rather than before the test edit; the edit only combines existing allowances.

The complete FEAT-007 known-bug file was read. This integration fixes none of those bugs. The parent lane's movement and keep retirement remains intact, but this merge adds no changes to those behaviors. No known-bug lines were manually changed.

The final response records the full merge tip and the required checks rerun on that tip. Post-commit logs go to `$TMPDIR` to avoid another commit.
