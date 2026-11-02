# Roster roles — merge build 4

## Scope

Merged `origin/main` at `5bb488728ba22d496406a7c79aa489e09dadd6eb` into lane tip `8e2b47a4`. Git merged cleanly. No behavior changes, requirement edits, test edits, new tests or new mutation pairs. Earlier mutation evidence remains unchanged.

The code-map and requirements-tree generators both ran successfully; their output was already current. All pre-existing lane files remain byte-identical to the previous lane tip. Every unrelated tracked file equals main, including main's deletions. `merge-4-preservation.log` records the comparisons. The session archive equals main plus exactly the existing whole lane entry, in newest-first order. No session entry was edited. No departure from the named session precedent.

The four existing roster-roles review-round-1 known-bug lines remain unchanged: checker lineage, missing output usage, dash-prefixed brief handling, and older-checkout compatibility. No known bug was fixed or otherwise edited.

## Commands

Each command exited 0. Logs use the `merge-4-` prefix in this folder.

- `git fetch origin`
- `git merge --no-commit --no-ff origin/main`
- `npm run map`
- `npm run req:tree`
- `node scripts/test.mjs nana-roster.test.mjs nana-roster-set.test.mjs roster-notice.test.mjs worker-claude.test.mjs seat-rule.test.mjs hive-city.test.mjs`: 6 files PASS; 120 checks pass, 0 fail, 3 skip.
- `npm run map:check`
- `npm run readme:check`
- `node scripts/requirements-trace.mjs`: 2443 rows, 2186 implemented and traced; 0 off-form.
- `node scripts/requirements-tree.mjs --check`
- `node scripts/known-bugs.mjs --root .`
- `node scripts/identity-scan.mjs --root .`
- Read-only preservation comparison: 0 unrelated tracked differences.

The trace log's local checkout paths were replaced with `<worktree>`. All required checks will run again on the final merge commit before push; the final response records their exit codes and pushed SHA.

## Not done

No locked full suite: CI covers it. No CI run will be awaited or read. The three Windows-only cases skip locally on macOS. No new model session, subagent, issue operation, seat mutation runner, install check or land operation was started. This merge changes no setup or hook file relative to the previous lane tip; the earlier install evidence remains in this folder. No writes to either prohibited temporary folder. No edits to HANDOFF, known-bug files or session archives beyond Git's merge of main.
