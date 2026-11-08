# setup-tail checkpoint

VERDICT: BLOCKED

The gate refused the part-3 template deletions. No workaround was attempted. The completed rows and project changes remain committed; uncommitted part-3 work was reverted.

## Commits and rows

1. `31906760`: requirement diff. Added R-3885–R-3893 in M order, using the brief's nine-ID allocation rather than the plan's stale seven-ID assumption. Retired R-330, R-592, R-673, R-1582, R-1583 and R-2234. Removed FEAT-014's share of retired R-673. Files: `REQUIREMENTS.md`, `docs/requirements-tree.md`. `npm run req:tree`: 0.
2. Project-check checkpoint: M2/R-3886 and M7/R-3891 implemented. Files: `packages/nana-setup/lib/project.mjs`, `packages/nana-setup/tests/project.test.mjs`, `packages/nana-setup/tests/project-odd-seeds.test.mjs`, new `packages/nana-setup/tests/setup-tail.test.mjs`, and `REQUIREMENTS.md`. This record and `builder-evidence.txt` accompany the checkpoint.

Project setup leaves existing config untouched and writes no new pack config. Project check no longer reads or judges legacy checker commands. Existing config still requires recorded trust. The new M7 case exercises project check, doctor, real pi trust storage and the gate's tool-call handler before and after trust.

## Wrong-code pairs

- M2: the original starter-writing/checker-judging implementation fails the new test; the new implementation passes.
- M7: original code fails readiness with legacy config. A separate code mutation that skips the `pack.ok` trust branch fails M7 alone. Restoring that branch returns the touched run to 133 passing checks.
- No mutation pairs were completed for the seven unfinished must-meets.

## Existing tests changed

`packages/nana-setup/tests/project.test.mjs`:

- Removed the retired PACK_STARTER import and stopped expecting a new pack file in the seeded-file list.
- Replaced the empty-starter assertion with config omission.
- Replaced the empty-checker/trust warnings and warning-summary assertions with healthy defaults and no checker judgement.
- Prior-month and CLAUDE-only readiness now expect exit 0 without project config.
- User-command and BOM-user cases now expect universal omission, not a shadowing reason.
- BOM-project and UTF-16 project/user cases retain presence/encoding comparisons without command counts. Fixtures explicitly create .pi where needed.
- Odd-seed cases still test trust when config exists. Legacy empty, placeholder and malformed commands now assert no checker judgement.
- Replaced the obsolete skill/PACK_STARTER equality assertion with absence of that export.
- Nested-repository and omitted-config cases now accept defaults. An otherwise bare project still fails for missing frontier files, not missing pack config.
- Removed req markers for the six retired rows; no test case was deleted.

`packages/nana-setup/tests/project-odd-seeds.test.mjs`:

- The blocked-docs fixture now expects other frontier seeds but no new pack config. Its odd .pi path checks remain intact.

Only M2 and M7 were added as new tests. The initial runner source check rejected the new helper's import quote style; the import now follows the existing exact convention. Direct-node project testing also hit the existing npm-prefix limitation; the npm path-filtered run passes.

## Precedent and callers

All five brief precedent files were read before design. The install-check test file was read through its final line. Project setup keeps the precedent's seed-entry checks and trust judgement. It drops the unused starter rather than replacing it with a default-only gate block. No helper was copied or moved.

`setupProject` now calls `stepPackConfig(dir)` without obsolete options/layout. Repository searches found no other caller. The sole PACK_STARTER importer was the existing project test; it was updated. No caller of `checkProject` needed its shape or async contract changed.

Departure: the lane stops after part 2 because the gate refused deletion of both `.pi/nana-pack.json.jinja` files. The required template removal has no approved tool path in this session. The plan's remaining changes were not substituted with exclusions or inert copies.

## Checks

Full command output and counts are in `builder-evidence.txt`. The required checks ran on the project checkpoint and were rerun on the amended tip after adding these technical records.

| Check | Exit | Result |
|---|---:|---|
| `npm run map` then `npm run map:check` | 0 / 0 | 544 modules, no map problems |
| `npm run req:tree` | 0 | 2667 rows, 43 features, no tree problems |
| `npm run readme:check` | 0 | 846 claims, no problems |
| `node scripts/component-audit.mjs --check` | 1 | Sound setup component rejects remaining planned FEAT-013 rows |
| `node scripts/requirements-trace.mjs` | 0 | 2057 traced rows, zero EARS problems |
| Path-filtered touched tests | 0 | 3 files, 133 passing checks |
| `node scripts/test.mjs test-runner` | 0 | 2 files, 64 passing checks |
| `npm run template:accept` | 0 | Existing templates pass acceptance; this does not prove M3/M8 |
| Mac `node packages/nana-setup/bin/install-check.mjs` | 0 | All 15 result lines pass |
| Changed-sentence grep across tests | 1 | No literal matches; old checker expectations were updated explicitly |

CI covers the full suite under AGENTS.md. No local full suite, Windows run, push or CI read occurred.

## Not done

- Parts 3–6: M1, M3, M4, M5, M6, M8 and M9; their rows remain planned.
- No template/skill/README text changes, restored matcher cases, dangling-link fix or dead-leftover cleanup.
- No requirement title check was named or run separately; the trace command passes.
- No known-bug file changed. The complete FEAT-013 known-bug file was read. No listed known bug is claimed closed; the existing npm-prefix test limitation was encountered, not fixed.
- No findings beyond the completed M2/M7 closures are claimed.

Open question: provide an approved way to remove the two retired template config files without crossing the gate's policy-file boundary, then resume part 3.
