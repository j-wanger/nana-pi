# Roster roles — merge build 5 continuation

## Scope and preservation

Merged `origin/main` at `7d0fdb02b9d558fdf2084c9ca4c24ef622abf74e` into lane tip `134c09b0`. Fetch exited 0; merge exited 1 only for the generated requirements outline conflict. Regenerating the outline resolved that conflict. Both generators ran, rather than hand-merging generated files.

`merge-5b-preservation.log` proves zero unrelated tracked differences from main, byte-identical existing lane files except the combined requirements and generated documents, and main's session archive plus exactly the unchanged whole lane entry. Entries remain newest first. Main's deleted lines stay deleted. The final diff contains only the original lane paths and this lane's review folder.

Precedent: `docs/sessions/2026-10.md`; no departure. No session entry was rewritten or added. No helper was added, copied or moved. No behavior changed relative to the two merged branches.

## Files, rows, tests and mutation pairs

- `REQUIREMENTS.md`: retained all lane rows unchanged and incorporated main's R-3650, R-3680 and R-3681 unchanged. No new or renumbered rows.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated with `npm run map` and `npm run req:tree`.
- Main's incoming instructions, tests, known-bug lines and review folders merged unchanged. No manual edit to `HANDOFF.md`, known-bug files or session archives.
- Lane product code, README, six touched tests, shared instructions and previous review records remain byte-identical to the pre-merge tip.
- No test assertion or title was edited, and no test was added or deleted. The two incoming test-file changes are main's exact versions.
- No new wrong-code or mutation pair: this is a behavior-preserving merge. Earlier red/green evidence remains unchanged in this folder.
- The four roster-roles round-1 known bugs remain unchanged: checker lineage, missing output usage, dash-prefixed brief handling and older-checkout compatibility. None was fixed. Main's FEAT-002 known-bug lines were incorporated unchanged; no other known bug was changed.

## Commands and exits

Logs use the `merge-5b-` prefix in this folder. Local checkout paths in diagnostics are replaced with `<worktree>`.

| Command | Exit | Result |
| --- | --- | --- |
| `git fetch origin` | 0 | Main remains at the named SHA |
| `git merge --no-commit --no-ff origin/main` | 1 | Generated outline conflict; resolved by generator |
| `npm run map` | 0 | Regenerated code map |
| `npm run req:tree` | 0 | Regenerated outline |
| `node scripts/test.mjs nana-roster.test.mjs nana-roster-set.test.mjs roster-notice.test.mjs worker-claude.test.mjs seat-rule.test.mjs hive-city.test.mjs` | 0 | 6 files PASS; 120 checks pass, 0 fail, 3 Windows-only skips |
| `node scripts/test.mjs requirements-tree.test.mjs worker-lane.test.mjs` | 0 | 2 files PASS; 166 checks pass, 0 fail |
| Read-only preservation comparison | 0 | No unrelated differences; whole entries conserved |
| `npm run map:check` | 0 | Current map |
| `npm run readme:check` | 0 | README contract passes |
| `node scripts/requirements-trace.mjs` | 0 | 2446 rows; 2189 implemented and traced; 0 off form |
| `node scripts/requirements-tree.mjs --check` | 0 | 0 problems; 43 features |
| `node scripts/known-bugs.mjs --root .` | 0 | 0 name findings; existing FEAT-013 size notice |

All required checks, including `node scripts/identity-scan.mjs --root .`, run on the final merge commit before push. The final response reports their exits, commit SHA and push result. Post-commit output is not committed again.

## Not done

CI covers the full suite: no locked full suite, CI wait or CI read. Windows-only cases remain for CI. No new install check: setup and hook files are unchanged from the reviewed lane tip; prior install evidence remains in this folder. No seat script, mutation runner, model session, subagent, issue operation or land was started. No stored credential was read or used. Neither prohibited temporary folder was written.
