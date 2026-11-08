# Merge current main into win-shards

## Operation and conflicts

- Branch: `feat/win-shards`; main parent: `860785c2` (full merge parents are recorded by git).
- Common base: `c1aca063ef642c90acd18b7258dc92f2f88eadee`.
- `git merge --no-commit --no-ff main`: exit 0. No rebase.
- Actual conflict hunks: zero. The earlier lane merge already included hive-retire and the combined lost-edge/retired-source entries.
- `code-map.config.json` and `packages/nana-pack/tests/code-map-launch.test.mjs` remain identical to main. No hand resolution was needed.
- `REQUIREMENTS.md` merged automatically. A three-way comparison verified 2,609 unique rows, all changed parent rows preserved byte-identically, no missing IDs, and no competing row edits. See `rows.log` for each changed row. Main's R-3808–R-3814 and the lane's additions and retirements remain intact.
- Regenerated `docs/code-map.md` with `npm run map` and `docs/requirements-tree.md` with `npm run req:tree`, even though both merged automatically.
- Main has no additional deletions since this merge base. The previous merge's retirement deletions were not restored.

## Files, rows, tests and mutation pairs

Incoming changes are the ci-flakes requirement rows, context loader, three test files, plan, generated files and review evidence. No manual code, test, or requirement edits were made. This evidence directory is the only new authored content.

No new tests, tunables, rows or mutation pairs apply to this merge-only fix. No existing test was manually edited or deleted. `test-files.txt` lists all 13 surviving test files changed by either side since the common base. No API or callers were changed beyond inheriting main. Card: fix names no Precedent; no departures apply.

## Commands before commit

| Command | Exit | Evidence |
| --- | --- | --- |
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node --experimental-strip-types scripts/requirements-trace.mjs` | 0 | `trace.log` |
| Three-way row and combined-entry preservation probe | 0 | `rows.log` |
| `npm test -- <paths in test-files.txt>` | 0 | `tests.log` |

`13 files: 13 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 373 pass, 0 fail, 0 skip`

Unstaged `git diff --check` passed. The staged check reports inherited trailing spaces in main's ci-flakes review logs; kept those records unchanged. No separate root lint or type command exists. All requested checks will run again on the merge commit; post-commit output stays under `$TMPDIR`.

## Limits and omissions

Read the whole FEAT-008 known-bug file. No known bug was changed or fixed. This manual merge integration path does not change the land tool or its recorded clean-merge and post-land CI limitations.

CI covers the full suite per AGENTS.md; ran only the touched tests locally. Native Windows and hosted CI remain for the seat. No setup or hook change arrived in this merge, so no install check was needed. No push, CI read, issue operation, credential access, model session or subagent. No HANDOFF, known-bug or session-archive edits.
