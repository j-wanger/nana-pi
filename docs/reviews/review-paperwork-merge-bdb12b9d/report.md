# Merge current main into review-paperwork

Branch: `feat/review-paperwork`.
Parents: lane `a05f4c0c3df87593a401a3ff62fa66e2bdd486c2`, main `bdb12b9dbd885ab162a4e9d7452479e1c8818adb`.
Operation: `git merge --no-commit --no-ff main` (exit 1, expected conflicts), followed by a merge commit.

## Conflict resolutions

The captured combined diff is `conflicts.diff` in this folder. Evidence paths are normalized to repository-relative paths, `~` and `$TMPDIR`; log line-end whitespace is trimmed.

- `AGENTS.md`, shared Land checklist hunk: retained the lane's removal of `review-ledger keep` and the over-cap confirmation reason. Added main's Windows-on-main-only sentence and advisory Linux sentence. Retained the automatically combined removal of the corpus rule and three-round cap. Restored main's cleanly merged Support line and install-check wording after selecting the lane version for the conflict.
- `templates/_shared/working-under-nana-pi.md`, shared Land checklist hunk: the same resolution. Verified the complete marker region equals this file byte for byte.
- `docs/code-map.md`, coverage/module-count hunk: regenerated with `npm run map`, not a side selection.
- `docs/code-map.md`, ledger-repo callers hunk: regenerated, retaining both the lane's paperwork test and main's Windows tests.
- `docs/code-map.md`, tmp-dir callers hunk: regenerated from the combined graph; removed movement tests stay removed and Windows shard tests enter the graph.
- `docs/requirements-tree.md`, CAP-02 row-list hunk: regenerated with `npm run req:tree` from the combined ledger, retaining both sets of rows. Its adjacent FEAT-008 count/read changes were also regenerated.

No other file conflicted. No main deletion since the merge base required manual resolution; earlier deletions remain absent. No HANDOFF, known-bug file or session archive changed.

## Files and rows

`merged-paths.txt` lists incoming staged paths; `requirements.diff` records the automatic ledger merge relative to the lane parent. Manual resolutions changed only the four conflicted files. This evidence folder is new.

Main adds R-3815–R-3827 and R-3835–R-3839. It updates R-3431, R-684, R-1078, R-2711 and R-3183. The lane's existing rows and retirements remain. `rows.log` verifies all 2621 lane IDs and 2629 main IDs survive, with zero missing; the merged ledger holds 2639 IDs. The verifier imports `requirementRowId` from the existing trace shim.

No new requirement allocation, new test implementation, test deletion, assertion edit, helper change or mutation pair belongs to this merge task. Incoming main test edits are unmodified. No Precedent section is required for this fix card; no departures. The full FEAT-007 known-bug file was read; this merge fixes no additional known bug and preserves the lane's prior paperwork removals.

## Check commands and exit codes

All logs below are in this folder. Every exit code was read separately.

| Command | Exit | Evidence |
|---|---:|---|
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `node scripts/test.mjs test-runner` | 0 | `test-runner.log` |
| `node scripts/test.mjs <test-files.txt paths>` | 1 | `tests.log` |
| `node scripts/test.mjs --verbose packages/nana-setup/tests/project.test.mjs` | 1 | `project-rerun.log` |
| `npm_config_prefix=~/.local node scripts/test.mjs packages/nana-setup/tests/project.test.mjs` | 0 | `project-prefix.log` |
| `npm_config_prefix=~/.local node scripts/test.mjs --jobs=3 <test-files.txt paths>` | 0 | `tests-green.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| parent row-ID preservation and shared-byte verification | 0 | `rows.log` |
| `git diff --check` before staging evidence | 0 | no source whitespace errors |
| `git diff --cached --check` | 2 | incoming main's historical logs contain trailing whitespace; preserved unchanged |

The initial selected run and its verbose rerun failed because npm's default global prefix named a pi installation without `dist/core/trust-manager.js`. Selecting the existing installed prefix fixed the environment without any source or test changes.

Green selected summary: 41 files: 41 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 1211 pass, 0 fail, 2 skip. Runner check: 2 files, 64 passing checks. Install check: all cases passed.

`test-selection.txt` records the grep for changed sentences and both guidance paths. `test-files.txt` contains its deduplicated matches plus all incoming changed test files. This intentionally includes fixture-only path matches as well as real text pins. The canonical harness awaits file completion with its timeout; no new harness was added.

## Not done

The full suite is delegated to CI under AGENTS.md. No push, CI read, model launch or GitHub operation occurred. Native Windows checks remain for main CI; the two selected platform skips are reported honestly. No standalone root lint/type command is declared by the README or package scripts. Required checks will run again on the resulting merge tip; the final report records their results.
