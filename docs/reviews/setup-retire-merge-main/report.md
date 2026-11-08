# Merge current main into setup-retire

## Scope and parents

- Branch: `feat/setup-retire`.
- Lane parent: `7e4603821ae1ec70f6f96d63c58ac96b6cfa4421`.
- Main parent: `2896328aaf3ad74b22b6723edab439dec05bd25c`.
- Base: `95d084669002d05ff6f2d8ec04ab864ce76ba1cb`.
- This is a merge-only fix, not a new behavior change. No new rows, tests, sealed tunables, mutation pairs, or helper copies were introduced. No Precedent section was required by this fix brief.

## Conflict resolutions

Original conflict hunks are in `conflicts.diff`.

1. `code-map.config.json`, launchAlwaysRun: retain main's `lib/review-run.mjs`; omit the old `bin/review-ledger.mjs` deleted by main and `extensions/nana-notify.ts` deleted by the lane. Keep all other auto-merged entries.
2. `packages/nana-pack/tests/code-map-launch.test.mjs`, R-3156: retain the lane's explicit lost-edge explanations and main's retiredTargets map. Neither set replaces the other. No assertions or cases changed beyond resolving this conflicting adjacency.
3. `packages/nana-pack/README.md`, Claude reviewer paragraph: retain main's removal of tree movement and its recording-failure wording; retain the lane's removal of the retired verifier hook from that paragraph.
4. `packages/nana-pack/README.md`, compaction block: retain the lane's retirement text instead of restoring the removed store, injection, configuration and symlink behavior. Main's unrelated README changes remain.
5. `docs/code-map.md`: regenerate with `npm run map`, not hand resolution.
6. `docs/requirements-tree.md`: regenerate with `npm run req:tree`, not hand resolution.

`REQUIREMENTS.md` auto-merged. `preservation.log` proves both parents' IDs survive, changed rows survive byte-identically, both parents' deletions remain absent, and the AGENTS marker content equals the shared template.

## Checks before the merge commit

| Command | Exit | Evidence |
| --- | --- | --- |
| `git merge --no-ff --no-commit main` | 1, expected conflicts | `conflicts.diff` |
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 1 before HEAD contains main's new files | `component-audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `node scripts/test.mjs <67 paths in test-files.txt>` | 1 | `touched-tests.log` |
| `npm_config_prefix="$HOME/.local" node scripts/test.mjs packages/nana-setup/tests/restore.test.mjs` | 0 | `restore-rerun.log` |
| `node scripts/test.mjs test-runner` | 0 | `test-runner.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| `node scripts/test.mjs code-map-launch readme-check templates-render` | 0 | `resolution-tests.log` |

Initial touched run: 67 files, 64 PASS, 2 FAIL, 1 SKIP; checks: 2091 pass, 1 fail, 14 skip. The restore failure was the documented global npm-prefix mismatch; the explicit prefix rerun passes without changing code. The setup-retire M7 failure is the component audit's HEAD-only tracked-path check: the pending merge introduces review-run.mjs and git-runner.mjs, which the pre-merge HEAD cannot contain. The conflict-resolution tests pass before commit. This HEAD-dependent check requires a post-commit rerun; that is the sole precommit-green exception.

## Limits and unchanged context

- Full-suite execution is delegated to CI by AGENTS.md. No CI was read, no push occurred, and no model session was started.
- Windows-only checks skip on this macOS machine; the seat must obtain Windows coverage through its normal process.
- No existing known bug is fixed. The restore rerun touches the documented npm-prefix test-run limitation only; its implementation is unchanged.
- No HANDOFF, known-bug file or session archive was edited.
- Main's imported historical evidence retains its existing whitespace. `git diff --cached --check` reports those pre-existing imported log/diff lines; they were not rewritten.

## Green post-merge evidence

Merge commit: `8c5ebc331eaff555bf4f7c19ec5de446c02e0b42` (two parents; no rebase).

- `node scripts/component-audit.mjs --check`: exit 0, `component-audit-green.log`. Its stale/unclaimed notes remain report-only.
- `npm_config_prefix="$HOME/.local" node scripts/test.mjs setup-retire restore`: exit 0, `recovery-green.log`.
- `npm_config_prefix="$HOME/.local" node scripts/test.mjs <67 paths in test-files.txt>`: exit 0, `touched-tests-green.log`.
- Green touched summary: **67 files: 66 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 2109 pass, 0 fail, 14 skip**.
- Runner self-tests: **2 files: 2 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 64 pass, 0 fail, 0 skip**.
- The evidence-only follow-up commit changes no production code or tests. The same required checks are rerun on that final tip; their final outputs go under `$TMPDIR` without another repository edit.

The attempted redundant explicit staging of already-staged merge deletions returned 128 because those paths were already absent from the index. Git had already staged the merge contents; the merge commit succeeded. Evidence files are added by explicit paths in the follow-up commit.
