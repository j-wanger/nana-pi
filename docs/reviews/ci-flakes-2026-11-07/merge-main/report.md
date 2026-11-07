# ci-flakes: merge current main

## Scope and parents

- Branch: `feat/ci-flakes`.
- Lane parent: `36d5c94a962430bd3e7e788ed2c3102ea0db7000`.
- Main parent: `c1aca063ef642c90acd18b7258dc92f2f88eadee`.
- Common base: `ae1f14f9216516e64165264e142831d567eb7222`.
- Operation: `git merge --no-commit --no-ff main`, exit 1 for a generated-file conflict; resolved before committing.
- `merged-files.txt` lists all incoming files and deletions. This merge adds only generated output and this evidence directory beyond the parents' combined work.

## Conflicts and resolution

The actual merge had one conflict hunk, not the three anticipated by the brief.

- `docs/requirements-tree.md`, combined hunk at line 308: CAP-07's generated row count and ID list disagreed. The lane had 603 rows including R-3808–R-3814; main had 604 including R-3775–R-3782. `npm run req:tree` regenerated the combined outline with 611 rows and both ID ranges. No hand merge.
- `docs/code-map.md`: merged automatically; regenerated with `npm run map` as required.
- `code-map.config.json` and `packages/nana-pack/tests/code-map-launch.test.mjs`: no conflict and no lane-side changes since the common base. Both match main exactly, retaining its lost-edge and retired-source entries. Verification exit 0.
- `REQUIREMENTS.md`: merged automatically. A three-way row comparison verified every row equals its changed parent's version, or its unchanged parent when neither changed it. No competing row edits, missing IDs, or renumbering. The merged ledger has 2,596 rows, the union of both parents. See `rows.log` for every changed row and status.
- Main's 60 deletions remain absent. The lane's context implementation and three changed test files match the lane parent exactly; verification exit 0.
- The original conflicting hunk is in `conflicts.log`.

## Rows, tests, mutation pairs

- Lane additions R-3808–R-3814 and main additions R-3775–R-3790 remain unchanged. All main retirements remain retired; `rows.log` lists them individually.
- No new rows, tests, tunables, or behavior were authored for this merge. No new mutation pairs apply; existing pairs were not rerun.
- No test was manually edited or removed. `incoming-test-edits.txt` lists every test edit and deletion brought from main. `touched-tests.txt` lists the 17 surviving test files changed by either parent since the common base.
- Precedent: omitted by the fix brief; no pattern departures.
- Known bugs: read all of `docs/known-bugs/FEAT-031.md`; no known bug was fixed or changed by this merge. Existing test-runner limitations remain. The main-side known-bug file change was inherited, not manually edited.

## Commands and results

Logs in this directory contain full output with checkout paths made repo-relative.

| Command | Exit | Evidence |
|---|---:|---|
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node --experimental-strip-types scripts/requirements-trace.mjs` | 0 | `trace.log` |
| Three-way row and deletion preservation probe | 0 | `rows.log` |
| `npm test -- $(< docs/reviews/ci-flakes-2026-11-07/merge-main/touched-tests.txt)` | 0 | `tests.log` |
| `git diff --check` | 0 | No whitespace errors |

Test summary: `17 files: 17 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 543 pass, 0 fail, 0 skip`.

The first row-preservation probe exited 1 because Node's default child-output buffer was too small for the ledger. Repeating it with a 16 MiB buffer passed; no repository change was needed.

## Not done

- No local full suite: AGENTS.md assigns it to CI. Only path-filtered tests ran locally.
- No push, CI read, model session, subagent, GitHub issue operation, or credential access.
- No Windows run on this macOS builder. The seat must push for required CI coverage.
- No install check: neither side changes setup or hooks in this merge.
- All requested checks will be repeated on the merge commit; their exit codes and full tip belong in the final report. Post-commit logs go under `$TMPDIR` without another commit.
