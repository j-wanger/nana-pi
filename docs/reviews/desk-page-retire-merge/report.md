# Merge verification

Branch: `feat/desk-page-retire`.
Parents: lane `7fc30bfc498e37054da9a21d59ff0e7ad6339d16`; main `ae1f14f9216516e64165264e142831d567eb7222`.

## Conflict resolutions

- `REQUIREMENTS.md`: one conflict, originally lines 3053–3087. Keep lane's retired R-949 and main's retired R-1230–R-1244. All remaining new and changed rows merged automatically. `row-preservation.txt` proves every changed/new parent row survived byte-identically, with the union of parent IDs and no dropped IDs.
- `docs/code-map.md`: two conflicts, recorded in `map-conflicts.txt`. Hunk 1 disagreed on the module total; hunk 2 disagreed on process helper callers. Regenerated the entire map with `npm run map`, preserving main's removed modules and the lane's added caller.
- `docs/requirements-tree.md`: regenerated with `npm run req:tree`, not hand-merged.
- Main's deletions stand. No extra source edits, row edits, test edits, or deletions beyond the merge resolutions. The shared test changes in `code-map-launch.test.mjs` and `templates-render.test.mjs` merged automatically and passed.

## Commands and results

All paths below are relative to this evidence folder.

| Command | Exit | Evidence |
| --- | --- | --- |
| `git merge --no-commit --no-ff main` | 1 | Expected conflicts above |
| `npm run map` | 0 | Generated `docs/code-map.md` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `npm run req:tree` | 0 | `requirements-tree.log` |
| `node scripts/component-audit.mjs --check` | 0 | `component-audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `requirements-trace.log` |
| `npm test -- <all paths in test-paths.txt>` | 0 | `tests.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| `git diff --check` | 0 | No whitespace errors |

Touched tests were identified from both parents' diffs against their common ancestor. All 27 surviving changed/added test files ran: 27 PASS, 0 FAIL, 0 SKIP, 0 WARN; 887 checks passed, 0 failed, 5 skipped. Deleted tests remain deleted; helper modules run through their callers.

No new tests or sealed tunables were added; mutation pairs are not applicable to this merge-only task. No Precedent departures or known-bug fixes. CI covers the full suite under AGENTS.md; the local full suite was not run. No push, CI read, model launch, issue operation, or credential access occurred. Native Windows verification remains for CI.

After committing, rerun the five named checks and the same filtered tests on the exact tip; their output stays under $TMPDIR to avoid changing that tip.
