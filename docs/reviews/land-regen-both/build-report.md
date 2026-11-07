# land-regen-both build evidence

Feature: FEAT-008. Rows R-3828–R-3834 follow M1–M7.

## Change

`packages/nana-pack/bin/nana-land.mjs` now regenerates the union of contract conflicts and contract outputs changed on both sides. O1: rebuild only those selected outputs, following the conflict precedent; retain checks for every contract output. No generator contract, timeout, CI, review or ordinary-file semantics changed.

`regenerateTree` remains private in its existing module; only its existing caller calls it. Its parameter name now describes both merged-tree cases. No return or exception contract changed; no external callers needed updates.

`packages/nana-pack/rules/nana-rulings.md` broadens the 2026-11-02 exemption sentence. Grepping all test files found its literal sentence only in `land-clean-merge.test.mjs`, which now pins the new wording. Existing shared guidance and README conflict wording remains true and unchanged; the brief names only the ruling for rewording.

Precedent departures: none. Reused the existing private checkout, scope guard, generator commands, generator checks, cleanup and refusal flow. Test fixtures import existing public fixture helpers instead of copying generators or seat scripts.

## Requirement and test changes

- R-3828/M1 and R-3834/M7: replaced the obsolete M11 refusal with real-generator success cases for each contract path, exact output bytes, accepted-tip CI queries, no new review, and no suite. Kept the contract-path assertion.
- R-3829/M2: added one test for clean both-sides generator failure, timeout and non-generated writes, unchanged snapshots, no suite and private checkout cleanup.
- R-3830/M3: reused the unchanged ordinary-file M2 and M4 assertions, adding trace tags only.
- R-3831/M4: reused the unchanged generated-conflict M1 assertions, adding a trace tag only. All existing regeneration cases pass.
- R-3832/M5: updated only the literal dated ruling in existing M9 and added its trace tag. Its shared-guidance assertions remain unchanged.
- R-3833/M6: added one mixed conflict/clean-both-sides test asserting both independent generator oracles, identical non-generated tree entries and no suite.
- `land-fixtures.mjs`: added a public helper that commits distant generated decoys from the common base. Tests verify actual merge-tree status before invoking land.
- Corrected existing R-3690 to remove the obsolete both-sides refusal and its old evidence; updated R-3696/R-3712 wording and R-3697 evidence.
- No tests deleted. No new sealed tunables. No direct temporary-directory allocation added; fixtures continue using the existing `tmpDir` import.

## Wrong-code / green pairs

Assertions were never inverted.

1. Original code and original ruling: new M11, generator-failure test, mixed test and updated M9 fail. `wrong-original.log`: exit 1, 16 checks pass / 4 fail. `green-focused.log`: exit 0, all 20 checks pass.
2. Code mutation: return the accepted tip's tree immediately for merge-tree status 1, bypassing conflict refusal and regeneration. M4 ordinary conflict, M1 generated conflicts and the mixed test fail (alongside existing safety cases). `wrong-conflicts.log`: exit 1, 13 checks pass / 7 fail. Mutation removed; `touched.log`: exit 0, 161 checks pass.

## Commands before commit

All exits read independently; no failed command was chained to a commit.

| Command | Exit | Evidence |
|---|---:|---|
| `npm run map:impact -- packages/nana-pack/bin/nana-land.mjs` | 0 | impact.log |
| `node scripts/test.mjs test-runner` after test edits | 0 | test-runner-initial.log |
| `npm run map` | 0 | map.log |
| `npm run map:check` | 0 | map-check.log |
| `npm run req:tree` | 0 | req-tree.log |
| `npm run readme:check` | 0 | readme-check.log |
| `node scripts/test.mjs land- rulings.test requirements-trace.test` | 0 | touched.log: 11 files, 161 checks pass |
| `node scripts/test.mjs test-runner` | 0 | test-runner.log: 2 files, 64 checks pass |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | install-check.log: all 18 checks pass |

Logs replace checkout roots with repo-relative paths, home paths with `~`, and OS temporary roots with `$TMPDIR`.

## Limits and known bugs

Read all of `docs/known-bugs/FEAT-008.md`. The generated-file regeneration scaffold limitation remains: a project missing either generator refuses with generatorScope ENOENT. This lane reuses that boundary for clean both-sides changes too; it does not fix scaffold support. The clean-merge semantic-breakage policy remains, as pinned by the unchanged M8 test. No listed known bug is closed or edited.

Full local suite deferred under AGENTS.md's explicit CI coverage override. No push, CI read, GitHub operation, review launch or model session performed. The seat supplies review and hosted Windows coverage. No owner questions.
