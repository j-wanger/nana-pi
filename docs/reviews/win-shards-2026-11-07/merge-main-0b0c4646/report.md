# Merge main 0b0c4646 into win-shards

## Operation

Branch: `feat/win-shards`. First parent: `71db57823b03df9ad146b91cd5ff6707c4eb3c2c`. Main parent: `0b0c46466889111422f1b06ea3ad64aba786a6d6`. Common base: `860785c23163edaf8805f0c9ce86772e81cd61b7`.

`git merge --no-commit --no-ff main` returned 1 for the generated-file conflicts below. No rebase. Main's desk-page deletions stand. No deleted file was restored.

## Conflict hunks and resolutions

Original combined hunks are in `generated-conflicts.diff`.

| File and parent hunk lines | Conflict | Resolution |
| --- | --- | --- |
| `docs/code-map.md`, 10/10 | 570 versus 560 mapped modules | `npm run map` recomputed 562 combined modules. |
| `docs/code-map.md`, 1316/1236 | land callees and launch line numbers | The generator retained the lane's main-ci edge and recomputed positions from the merged land module. |
| `docs/code-map.md`, 2621/2541 | test-runner-config callers | The generator retained both main's desk tmp-dir caller and the lane's win-shards caller. |
| `docs/requirements-tree.md`, 93/93 | CAP-02 row totals and IDs | `npm run req:tree` recomputed the union from the merged ledger. |
| `docs/requirements-tree.md`, 129/129 | FEAT-008 row totals and IDs | The same generator retained both R-3815–R-3827 and R-3828–R-3834. |

No hand-merged generated content. `REQUIREMENTS.md` merged automatically. `rows.log` proves 2,624 unique rows, both parent ID sets retained, and every changed parent row preserved byte-identically. It lists every affected ID and row. The lane's additions and retirements and main's additions and retirements remain intact.

`code-map.config.json` did not differ between parents. `packages/nana-pack/tests/code-map-launch.test.mjs` took main's desk-retirement entries without conflict and retains all prior loss reasons and retired-source entries. Both files match main byte-for-byte, verified in `rows.log`. No entry was manually removed.

## Files, tests and mutation pairs

Incoming files are git's main-versus-first-parent merge diff, plus the two regenerated documents. This directory is the only new authored material. Main updates the land tool, desk app hosting, shared rules, component audit and their tests. Main deletes the retired desk page and its tests. No manual code, API, caller, test, requirement or tunable changes were made. No extra tests or mutation pairs apply to this integration-only fix. All existing test edits and deletions are inherited unchanged from main. No Precedent section was required for this Card: fix; no departures apply.

`test-files.txt` lists all 23 surviving test files changed by either parent since the common base. Changed test helpers are exercised through these tests. The separate runner filter covers both runner test files.

## Pre-commit commands

All output below is committed alongside this report, with machine paths normalized.

| Command | Exit | Evidence |
| --- | --- | --- |
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node --experimental-strip-types scripts/requirements-trace.mjs` | 0 | `trace.log` |
| Three-way row and combined-entry preservation probe | 0 | `rows.log` |
| `node scripts/test.mjs test-runner` | 0 | `test-runner.log` |
| `node scripts/test.mjs <paths from test-files.txt>` | 0 | `tests.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| `git diff --check` | 0 | No unstaged whitespace problems. |
| `git diff --cached --check` | 2 | Inherited trailing spaces in main's review evidence; preserved unchanged. |

Runner: `2 files: 2 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 64 pass, 0 fail, 0 skip`.

Touched tests: `23 files: 23 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 589 pass, 0 fail, 2 skip`.

Map: 562 modules, zero problems. README: 872 claims, zero problems. Tree: 2,624 rows, 43 features, zero problems. Audit and trace pass; Node emits its existing module-type advisory. No root lint or type scripts exist. The requested checks and install check will run again on the merge commit; those logs stay under `$TMPDIR` to avoid another commit.

## Limits

CI covers the full suite under `AGENTS.md`; no local full suite was run. Native Windows and hosted CI remain for the seat. No push or CI read. No credentials, issue operations, model sessions or subagents. No authored HANDOFF, known-bug or archive changes; incoming main includes its existing known-bug updates.

Read all of `docs/known-bugs/FEAT-008.md`. No known bug was fixed. The incoming generated-file regeneration implementation retains the documented scaffolded-project generatorScope ENOENT residual. The manual merge does not change CI timing, clean-merge race, or proof-policy limitations.
