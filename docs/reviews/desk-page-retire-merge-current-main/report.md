# Current-main merge verification

Branch: `feat/desk-page-retire`.
Merge parents: lane `33ef6228ad07f32ca8b4688cdcfbc5d351b86573`; main `c1aca063ef642c90acd18b7258dc92f2f88eadee`.

## Conflict hunks

Git reported three conflicted files, not the config and test conflicts anticipated by the brief:

- `AGENTS.md`, one hunk at the layout descriptions: retain the lane's manifest-only desk description and main's context-anatomy bench description.
- `README.md`, one hunk at the layout descriptions: retain the lane's manifest-only desk description, main's shared glob matcher entry, and main's retired-study bench description.
- `docs/code-map.md`, three marked hunks: root list/module total; process-tree callers; and agent-dir-parity callees. Regenerate the entire file with `npm run map`. `map-conflicts.txt` records each hunk and the cleanly merged usage-line/hive deletion region.

`code-map.config.json` applied cleanly from main; no lane delta existed against the common ancestor. Main's removed hive root, runner declarations and exemptions stand.
`packages/nana-pack/tests/code-map-launch.test.mjs` merged automatically: retain all 30 lane-added desk lost-edge lines alongside main's retired-study and preview logic. No manual test changes.
`REQUIREMENTS.md` merged automatically. `rows.log` proves all 92 lane and 125 main changed/new rows survive byte-identically. The result has the union of parent IDs, 2597 rows, without duplicates or renumbering.
`docs/requirements-tree.md` was regenerated with `npm run req:tree`, not hand-merged.
All main deletions stand.

## Commands

| Command | Exit | Evidence |
| --- | --- | --- |
| `git merge --no-commit --no-ff main` | 1 | Expected content conflicts described above |
| `npm run map` | 0 | `map.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `node scripts/test.mjs <paths from test-paths.txt>` | 0 | `tests.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | `install-check.log` |
| `git diff --check` | 0 | No source whitespace errors |
| `git diff --cached --check` (initial evidence) | 2 | Raw combined-diff whitespace; replaced with a hunk summary before final verification |

Touched paths are the union of surviving added/modified test files from each parent's diff against `ae1f14f9216516e64165264e142831d567eb7222`. All 25 ran: 25 PASS, 0 FAIL, 0 SKIP, 0 WARN; 856 checks passed, 0 failed, 2 skipped. Helpers run through their callers; deleted tests remain deleted. Component audit reports six stale components and 21 unclaimed modules, but exits 0. Trace reports zero rows off form. Native Windows execution remains for CI.

No requirements, tests or tunables were newly authored. Mutation pairs are not applicable to this merge-only task. No Precedent departures or known-bug fixes. Main's known-bug metadata change was inherited, not authored here. No HANDOFF or session archive edits. CI covers the full suite under AGENTS.md, so the local full suite was not run. No push, CI read, model launch, issue operation, or credential access.

The five named checks, filtered tests, and install check will be repeated on the merge commit. Their output goes under $TMPDIR so the final tip remains unchanged.
