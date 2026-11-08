# Merge main into review-paperwork

## Scope and parents

- Branch: `feat/review-paperwork`.
- Lane parent: `53a477e3568f7f7a1400e55cb9e53c110154b32a`.
- Main parent: `860785c23163edaf8805f0c9ce86772e81cd61b7`.
- Merge base: `c1aca063ef642c90acd18b7258dc92f2f88eadee`.
- Objective served: maintain the shared toolkit's review workflow while integrating current main.
- Merge only: no new behavior, requirement rows, tests, tunables, helper copies or caller-contract changes.

## Conflict hunks and preservation

`git merge --no-commit --no-ff main` exited 0. There were **no conflict hunks** and no unmerged paths. The brief's expected conflicts did not occur against these exact parents. Earlier lane merges already combined the retired-source and lost-edge allowances; this merge retains them without manual edits.

- `code-map.config.json`: unchanged by this merge; both parents' prior retirement allowances remain.
- `packages/nana-pack/tests/code-map-launch.test.mjs`: unchanged by this merge; existing combined allowances remain.
- `REQUIREMENTS.md`: automatic merge keeps all 78 changed/new lane rows and all seven changed/new main rows byte-for-byte against the merge base. `rows.log` confirms zero missing IDs and zero lost/altered row changes. Total: 2606 distinct rows. No row renumbered or dropped. Main adds R-3808 through R-3814; all earlier lane and main retirements remain.
- `docs/code-map.md`: regenerated with `npm run map`, not hand-merged.
- `docs/requirements-tree.md`: regenerated with `npm run req:tree`, not hand-merged.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: automatic merge retains main's delay/deadline checks and this lane's review-run fixture wiring. No manual test edit.

`merged-paths.txt` lists the inherited merge paths. No main deletion was reversed. HANDOFF, known-bug files and session archives were not edited.

## Checks

All commands below exited 0 before the merge commit. Logs live beside this report.

| Command | Evidence |
|---|---|
| `git merge --no-commit --no-ff main` | No conflicts; parents above |
| `npm run map` | `map.log` |
| `npm run req:tree` | `tree.log` |
| `npm run map:check` | `map-check.log` |
| `npm run readme:check` | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | `audit.log` |
| `node scripts/requirements-trace.mjs` | `trace.log` |
| `npm test -- <explicit paths from test-files.txt>` | `tests.log` |
| `node packages/nana-setup/bin/install-check.mjs` | `install-check.log` |
| `git diff --check` | No whitespace errors |

Test selection is the union of changed `.test.mjs` paths on either side since the merge base, filtered to existing files. `test-files.txt` records all 29 selected files. `deleted-tests.txt` records three retired paths not run. The existing canonical runner awaits every file under its per-file limit.

29 files: 29 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 942 pass, 0 fail, 14 skip.

Requirements trace: 2606 total rows, 2195 traced by tests, zero rows off EARS form. Tree: zero problems. Existing component coverage/staleness notes remain report-only. Audit and trace emit the existing Node module-type warning. Logs normalize local paths to repo-relative paths, `~` or `$TMPDIR`.

## Limits and departures

No manual code or test edits, new tests or sealed tunables were needed; wrong-code mutation pairs do not apply to this merge-only integration. All test edits are inherited parent changes. The fix brief has no Precedent section, so there is no precedent departure.

The full FEAT-007 known-bug file was read. This merge fixes none of its known bugs and adds no behavior affecting them. The lane's already-committed movement/keep retirement remains unchanged.

CI covers the full suite under AGENTS.md; no local full suite was run. Native Windows execution remains for CI. No push, CI lookup, credential access, issue operation or model/subagent launch occurred. Post-commit checks and full merge tip are recorded in the final response; post-commit logs go to `$TMPDIR` to avoid another commit.
