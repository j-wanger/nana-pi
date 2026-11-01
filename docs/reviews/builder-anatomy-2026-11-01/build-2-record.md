# FEAT-042 build 2 — seeded tier fills and attempt metadata

Base: `6b02bbb7`. Lane: `feat/builder-anatomy`. Class: ordinary.

## Closures

- MUST: tier fills now request seed order from the imported `seededSample`; default callers still receive alphabetically sorted selected ids. The `drawSample` comment now distinguishes selection order from blind-sheet presentation order.
- SHOULD: assembly propagates each stored part's zero-based attempt into `parts.json`, keeping repeated part names attributable to their attempts.

## Files and rows

- `REQUIREMENTS.md`: strengthen R-3276 for seeded tier fills and R-3274 for attempt-bearing manifests. Both remain in FEAT-042; no new rows, shares or tunables.
- `apps/bench/lib/catch-stats.mjs`: optional `{ seedOrder: true }` bypasses only the final presentation sort.
- `apps/bench/lib/anatomy-measures.mjs`: request that option for tier fills; retain attempts in assembled parts.
- `apps/bench/lib/anatomy.mjs`: write attempts in manifest rows.
- `apps/bench/README.md`: describe selection order and manifest attempts at the consumer surface.
- `apps/bench/test/anatomy.test.mjs`: strengthen the two existing cases named in the brief, R-3276 and R-3274. No existing assertion was made false by the change; none was removed or weakened. No new cases were added.

R-3276 uses 60 synthetic builds with 20 neutral units each, all in one tier. It excludes the union of both seeds' minimum picks before comparing fills. Each sample must span at least half the fixture's builds (`ceil(builds.length / 2)`, 30), equal the imported helper's seeded selection over all ids, and survive reversed input order. R-3274 exercises the actual writer with repeated part names across attempts 0 and 1, CRLF, trailing space/tab and no final newline, checking both manifest and exact replay bytes. Existing cases remain awaited under their per-case limit. All fixtures stay in OS temp directories.

## Wrong-code / fixed-code pairs

Command for both: `node apps/bench/test/anatomy.test.mjs`.

- Old tier fill without the seed-order option: strengthened R-3276 fails at the beyond-minimum comparison, line 201. Fixed tier fill: R-3276 passes.
- Old assembly without attempt metadata: strengthened R-3274 fails at the manifest comparison, line 177. Fixed assembly: R-3274 passes.

The old implementations themselves were the wrong-code mutations; assertions were never inverted. `build-2-red.txt` records exit 1 and 7/9 passing cases before production edits. `build-2-green.txt` records exit 0 and 9/9 after the edits.

## Commands and exit codes

- `npm run map:impact -- apps/bench/lib/anatomy-measures.mjs apps/bench/lib/catch-stats.mjs apps/bench/lib/anatomy.mjs`: 0, before production edits.
- `node scripts/lane-class.mjs --root . --files REQUIREMENTS.md,apps/bench/lib/anatomy-measures.mjs,apps/bench/lib/catch-stats.mjs,apps/bench/lib/anatomy.mjs,apps/bench/test/anatomy.test.mjs`: 0, ordinary.
- `node apps/bench/test/anatomy.test.mjs`: 1 old, then 0 fixed; paired logs above.
- `node apps/bench/test/catch-ledger.test.mjs`: 0, tests unedited; `build-2-catch-ledger.txt`.
- `npm run test:locked`: 0, foreground, repository machine lock; `build-2-full-suite.txt`.
- `npm run map:check`: 0, 543 modules, 0 problems.
- `npm run readme:check`: 0, 993 claims, 0 problems.
- `node scripts/requirements-trace.mjs`: 0, 2046 implemented rows traced, 0 off-form rows.
- `node scripts/requirements-tree.mjs --root .`: 0, 2300 rows, 42 features, 0 problems.
- `node scripts/identity-scan.mjs --root .`: 0, 0 findings.
- `git diff --check`: 0.

Checks are recorded in `build-2-checks.txt`. The map needed no regeneration: imports and module headers retain their graph and contracts. Post-commit checks and the finished CI run for the pushed tip are reported in the builder's final response.

Suite summary:

`248 files: 246 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8849 pass, 0 fail, 44 skip · 671.1s`

## Precedent and scope

All three named precedent files were read completely before design. No departures: reuse the existing seeded ordering, preserve its default, extend the existing bounded synthetic test cases, and carry metadata through the existing assembly boundary. No helper was copied or privately imported.

No known-bug line was fixed or altered. The three measurement known bugs and three assembly NOTEs remain outside this fix. No real sessions or private store were read; no measurement or counts file was regenerated. The seat owns resampling and labelling. No GitHub issue or session archive was touched. The pre-existing untracked `build-brief-2.md` is left untouched and outside this commit.
