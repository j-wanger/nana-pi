# Merge-only build evidence

## Scope

Merged origin/main at 7c4e7e195bdbfcf284ab2636b41c93748c30dc77 into the lane at 62986c841cd774a15fa8593b14f63df543090494. Git merged without conflicts. No behavior, requirement, test or README edits were made beyond the merge. Existing lane rows R-3520–R-3525 and R-1123/R-1140 remain unchanged.

The 13 lane package files match the pre-merge lane tip byte for byte. Every tracked difference from origin/main belongs to the original lane file list. Main's anatomy-label-check changes, deleted lines and review folder survive. Removing the complete November 2 lane entry from the archive yields origin/main's archive byte for byte. Entries remain newest first. The archive precedent required no departure. No private helper was copied or moved.

Both generated documents were regenerated with `npm run map` and `npm run req:tree` (exit 0 each), not hand-merged. Their output is in merge-map-write.log and merge-tree-write.log.

## Green checks before the merge commit

Each command exited 0. Full output is retained in the adjacent merge-*.log files, with home and checkout prefixes redacted.

- `node --experimental-strip-types packages/nana-pack/tests/nana-roster.test.mjs`
- `node --experimental-strip-types packages/nana-pack/tests/nana-roster-set.test.mjs`
- `node --experimental-strip-types packages/nana-pack/tests/roster-notice.test.mjs`
- `node --experimental-strip-types packages/nana-pack/tests/rulings.test.mjs`
- `node --experimental-strip-types packages/nana-setup/tests/seat-rule.test.mjs`
- `node --experimental-strip-types packages/nana-setup/tests/roster-notice-hook.test.mjs`
- `node --experimental-strip-types packages/nana-setup/tests/rulings-install.test.mjs`
- `node --experimental-strip-types packages/nana-pack/tests/requirements-trace.test.mjs`
- `npm run map:check`: 584 modules, 0 problems.
- `npm run readme:check`: 1064 claims, 0 problems.
- `node --experimental-strip-types scripts/requirements-trace.mjs`
- `node scripts/requirements-tree.mjs --check`: 2427 rows, 43 features, 0 problems.
- `node scripts/known-bugs.mjs --root .`
- `node scripts/identity-scan.mjs --root .`: 0 findings.
- `node packages/nana-setup/bin/install-check.mjs`: all checks pass, with NANA_WORKTREE_ROOT, NANA_ROLE, NANA_HANDOFF and PI_SESSION_ID removed from the child environment, following the prior builder evidence.
- `git diff --check` (unstaged comparison).

The additional `git diff --cached --check` exited 2 on trailing spaces in imported main evidence and captured PASS lines. These bytes were preserved; main-only files must remain identical to origin/main.

Two command-entry mistakes were corrected without editing code: the hook test was first addressed under nana-pack rather than nana-setup (exit 1, retained in merge-roster-notice-hook.test.log); tree checking first combined mutually exclusive --root and --check options (exit 2), then passed with --check alone.

## Mutations, known bugs and omissions

No new tests, test edits, tunables or wrong-code pairs: this is a merge-only build. The prior 12/12 red pairs remain in seat-mutate.log; no seat script was run or imported.

The complete FEAT-006 known-bug file was read. Its four machine-lane-limits review lines are preserved unchanged: advisory compliance, widget-only visibility, default/stale Windows copies, and warning order. No known bug was fixed by this merge. The earlier lane's FEAT-040 ruling-order closure remains unchanged.

No full suite was run: AGENTS assigns it to CI. No CI run was read. No model sessions, subagents or issue operations were started. No machine lane value or installed rules were changed. Windows evidence remains for CI and the seat's laptop setup.
