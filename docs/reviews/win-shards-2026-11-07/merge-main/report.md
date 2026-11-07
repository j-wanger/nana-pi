# Merge current main into win-shards

## Revision and scope

- Branch: `feat/win-shards`.
- Main parent: `c1aca063ef642c90acd18b7258dc92f2f88eadee`.
- Merge base: `ae1f14f9216516e64165264e142831d567eb7222`.
- `git merge --no-commit --no-ff main`: exit 1; resolved generated-map conflicts below. No rebase.
- All 60 main deletions stand. No deleted test was restored or run.

## Conflict hunks

Only `docs/code-map.md` conflicted in this checkout. Regenerated the complete file with `npm run map`, rather than selecting either parent's generated text.

| Initial merged lines | Conflict | Resolution |
| --- | --- | --- |
| 13–17 | Covered roots and module count | Generator removed retired preview root and counted surviving modules, including lane tests. |
| 944–952 | `scripts/test.mjs` callers, callees and launch line numbers | Generator kept shard-test caller, removed deleted study-task callee and recalculated launch lines. |
| 1328–1338 | `nana-land.mjs` callers, callees and launch line numbers | Generator removed deleted preview-test caller, kept main-CI callee and recalculated launch lines. |

`code-map.config.json` and `packages/nana-pack/tests/code-map-launch.test.mjs` did not conflict: main already combined both retirement lanes. Kept all main exemptions and lost-edge allowances unchanged. `REQUIREMENTS.md` merged automatically. `rows.log` proves 2,602 unique rows, all 18 lane-changed rows and 125 main-changed rows byte-identical to their respective parent, zero missing IDs and zero altered changed rows. No row was authored, renumbered or dropped. This includes R-3775–R-3790 and R-3815–R-3827 and both parents' retirements. Regenerated `docs/requirements-tree.md` with `npm run req:tree` despite its automatic clean merge.

## Semantic integration correction

The first component audit exited 1: `land-gate` still claimed `sound`, but the lane adds planned R-3820. This also failed the two retirement tests that require a green audit. Kept that requirement planned and corrected only `docs/components/nana-pi.json`: mark the component `partial`, explain the pending main-push timing and anchor R-3820. No audit rule or assertion changed. Red/green evidence: `audit-before.log` → `audit.log`, `tests-before.log` → `tests.log`. This is a stale-data correction, not a new behavior or mutation pair.

## Checks before the merge commit

All logs in this directory use repository-relative paths, `~` or `$TMPDIR`.

| Command | Exit | Evidence |
| --- | --- | --- |
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `npm test -- <24 paths in test-files.txt>` | 0 | `tests.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| `git diff --check` | 0 | No output |

`24 files: 24 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 662 pass, 0 fail, 0 skip · 353.3s`

A staged whitespace check initially reported a trailing blank line in `rows.log`; removed it and repeated all seven verification commands successfully before amending the merge commit. No product change resulted.

Test paths are the union of added or modified surviving `*.test.mjs` files in both merge-base-to-parent diffs. Existing audit staleness and 21 unclaimed-module notes remain report-only. No separate lint or type command is declared in root package scripts. The final response records the last commit's SHA and repeated checks on that commit.

## Omissions and limits

- No new tests or test edits; no new functions, sealed tunables, requirement rows or mutation pairs. Wrong-code-first does not apply to this merge-only fix.
- Card: fix names no Precedent. No helper was copied or public API changed.
- Read the entire FEAT-008 known-bug file. No known bug was fixed. The post-land main push timing/record limitations remain: PR CI has no Windows legs, and CI records retained at land normally omit the subsequent main push run.
- M6/R-3820 remains planned. The seat measures each Windows shard's wall time on main's push run after land, not this branch's PR run.
- CI covers the full suite under AGENTS.md; ran path-filtered tests locally, not the locked full suite. Native Windows and hosted CI remain for the seat after push/land.
- No manual HANDOFF, known-bug or session-archive edits. Main's existing known-bug change was inherited unchanged.
- No push, CI read, issue operation, credential use, install, model session or subagent launch.
