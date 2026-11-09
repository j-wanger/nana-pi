# Merge current main into review-paperwork

## Scope

- Branch: `feat/review-paperwork`.
- Lane parent: `4f7ecdeaebe858ff6b0995367cdf6b169dd55807`.
- Main parent: `0b0c46466889111422f1b06ea3ad64aba786a6d6`.
- Merge base: `860785c23163edaf8805f0c9ce86772e81cd61b7`.
- Objective served: maintain the shared toolkit's review workflow while integrating current main.
- Merge only; no new behavior, rows, tests, tunables, helper copies or caller-contract changes.

## Conflicts and resolution

`git merge --no-commit --no-ff main` exited 1 with three conflicting files. `conflicts.diff` preserves all original conflict hunks.

1. `docs/code-map.md`, line 10: conflicting generated module counts. Regenerated the entire file with `npm run map`; no hand merge.
2. `docs/requirements-tree.md`, line 93: conflicting FEAT-007 shared-row lists. Regenerated the entire outline with `npm run req:tree`; no hand merge. The additional combined-diff context at line 129 is not another conflict.
3. `packages/nana-pack/tests/code-map-launch.test.mjs`, line 140: this lane's two movement-fixture lost-edge reasons versus main's desk-page retirement and parser-edge reasons. Kept both blocks, removing only conflict markers. All existing retired-source and retired-target entries remain. This is the only manually resolved test edit; no assertion or test title changed.

`REQUIREMENTS.md` merged automatically. `rows.log` proves all 78 changed/new lane rows and all 103 changed/new main rows survived byte-for-byte, with zero missing IDs and 2621 distinct rows. No row was renumbered or dropped.

`code-map.config.json` required no edit. Compared both parents' launch declarations with the merged configuration: zero lost surviving declarations, zero declarations naming missing files. Historical lost-edge and retired-source reasons remain in the test because they explain the fixed historical baseline, including deleted sources.

Main's desk-page deletions stand. `merged-paths.txt` records inherited paths. Main's known-bug changes are inherited unchanged; no manual edits were made to known-bug files, HANDOFF or session archives.

## Checks before commit

All requested checks below exited 0; long output is committed beside this report.

| Command | Evidence |
| --- | --- |
| `npm run map` | `map.log` |
| `npm run map:check` | `map-check.log` |
| `npm run readme:check` | `readme-check.log` |
| `npm run req:tree` | `tree.log` |
| `node scripts/component-audit.mjs --check` | `audit.log` |
| `node scripts/requirements-trace.mjs` | `trace.log` |
| `node scripts/test.mjs test-runner` | `test-runner.log` |
| `node scripts/test.mjs <explicit paths in test-files.txt>` | `tests.log` |
| `node packages/nana-setup/bin/install-check.mjs` | `install-check.log` |
| `npm run map:impact -- packages/nana-pack/tests/code-map-launch.test.mjs` | `impact.log` |
| `git diff --check` | Exit 0 before staging |
| `git diff --cached --check` | Exit 2: inherited main evidence has trailing whitespace; raw combined conflict evidence retains diff indentation. Preserved those records unchanged. |

Runner checks: 2 files: 2 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 64 pass, 0 fail, 0 skip.

Touched tests: 40 files: 40 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 1182 pass, 0 fail, 16 skip.

Selection is the union of both sides' changed `.test.mjs` paths since the merge base, filtered to surviving files. `test-files.txt` records 40 files; `deleted-tests.txt` records retired tests not run. The canonical runner awaits each file under its existing per-file limit. An initial combined tool invocation timed out at 600 seconds during the touched run, after the runner checks passed; the complete touched run was repeated and passed in 707.8 seconds.

Trace: 2621 total rows, 2174 traced by tests, zero rows off EARS form. Tree: zero problems. Component audit's existing coverage/staleness notes remain report-only. Existing Node module-type warnings remain. Evidence normalizes local paths to repo-relative paths, `~` or `$TMPDIR`.

## Limits

No new tests or sealed tunables were needed; new wrong-code mutation pairs do not apply to this merge-only task. The fix brief names no Precedent, so there is no precedent departure. The impact command ran after conflict resolution rather than before it; the resolution only combined the existing reason lists.

Read the full FEAT-007 known-bug file. This merge fixes none of those bugs and makes no additional behavior change affecting them; existing lane retirements remain unchanged.

AGENTS.md delegates the full suite to CI. No local full suite, native Windows run, push, CI lookup, credential access, issue operation or model/subagent launch was performed. Post-commit checks run against the final merge tip and are reported separately, with logs in `$TMPDIR` to avoid another commit.
