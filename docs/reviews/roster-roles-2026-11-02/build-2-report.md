# Roster roles — build 2 technical report

VERDICT: DONE

## Commits and scope

- Merge: `f0f4c87391762a6f99cf09482299bb49d6e9d6d6`.
- Parents: `a66f49c2a24bd5adf0e613dc03def395cb26dc29` and `ac764bcf0d8aecbef9b53599ccfb0bb0bfbe82bf`.
- A follow-up keeps the mutation record, this report and the exact normalized-roster oracle.
- Branch: `feat/roster-roles`. No push: the build brief assigns that step to the seat.
- Spend serves discovery through the assigned roster integration.

## Nine conflicts

| File | Resolution |
|---|---|
| `REQUIREMENTS.md` | Keep role-capable schema, role defaults and notice rows; keep main's lane-limit rows and dynamic seat cap. Combine the plain-output contract. |
| `docs/code-map.md` | Regenerate from both features and main's split land tests with `npm run map`. |
| `docs/sessions/2026-10.md` | Keep both entries. The later-landed machine-limit entry comes first, followed by the role entry. No other archive prose changes. |
| `packages/nana-pack/README.md` | Combine the role-slot output paragraph with lanes before source; retain main's separate lanes paragraphs and this lane's role paragraphs. |
| `packages/nana-pack/lib/roster-notice.mjs` | Combine resolver inputs/imports; retain role resolution and lineage warnings, then append the lane limit before the change pointer. |
| `packages/nana-pack/tests/nana-roster-set.test.mjs` | Retain MM2/MM3 and main's R-3524 test; expect all three normalized null role keys in the latter's exact object comparison. |
| `packages/nana-pack/tests/nana-roster.test.mjs` | Retain both test groups; exact stdout oracles include all slots, lanes, then source. |
| `packages/nana-pack/tests/roster-notice.test.mjs` | Retain role, lineage and lane-limit tests; parity removes only lineage diagnostics, never the lane segment. |
| `packages/nana-setup/tests/seat-rule.test.mjs` | Keep role-child scheduling and the role-guidance test; retain main's machine-local build-cap rule and test. |

`nana-roster.mjs`, `worker-config.mjs`, `roster-set.mjs`, notice config, rulings and the seat guide merged without conflicts.
Their merged behavior passed the selected tests.
`docs/requirements-tree.md` was regenerated with its writer.

## Rows

- Lane MM3: `R-3524` becomes `R-3534`.
- Lane MM4: `R-3525` becomes `R-3535`.
- Main keeps `R-3524` and `R-3525`; its earlier block reservation ended at R-3523, but its final implementation used both IDs.
- Active markers move in `nana-roster-set.test.mjs` and `worker-claude.test.mjs`.
- Historical build evidence stays unchanged.
- Audit: 2,429 main rows and 2,431 lane rows retained after renumbering; 2,439 merged unique rows; 0 missing; 0 duplicate IDs.
- Combined contracts: `R-1121`, `R-1122`, `R-1123`, `R-1192`, `R-1140`, `R-1194`.
- Existing role rows `R-3526` through `R-3533` and main lane rows `R-3520` through `R-3525` remain.

## Existing-test edits

No new suite test, test deletion or sealed tunable was added.

- Plain roster exact-output test: retain role lines and add the default lane line before source.
- MM1 exact output: add lanes after checker; retain old-five and JSON order assertions.
- R-3520 exact suffix: retain default/source assertions and insert the three fallback role lines.
- R-3521 exact stdout: retain written-limit, stderr, JSON and set assertions and insert those role lines.
- R-3524 set test: compare the entire resolved roster against the written roster plus three null role keys.
- Notice parity: strip only comma-delimited lineage diagnostics so lanes still participates in equality.
- MM7 seat parity: also require lanes after checker.
- Seat rule: retain both role-child scheduling and the machine-local cap expectation.
- MM3/MM4 markers: renumber only; assertions unchanged.

## Tests and wrong-code evidence

`merge-touched-tests.log` records the canonical runner selection:

```text
node scripts/test.mjs nana-roster.test.mjs nana-roster-set.test.mjs roster-notice.test.mjs worker-claude.test.mjs seat-rule.test.mjs land-ci-edge.test.mjs land-ci-read.test.mjs land-merge.test.mjs land.test.mjs rulings.test.mjs roster-notice-hook.test.mjs rulings-install.test.mjs worker-lane.test.mjs context-anatomy.test.mjs templates-render.test.mjs requirements-trace.test.mjs
17 files: 17 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 360 pass, 0 fail, 33 skip
exit 0
```

The `land.test.mjs` substring also selected `runtime-land.test.mjs`.
Every test file changed by either branch ran, including main's four land files.
Additional notice, installer, launcher, context and template regressions ran too.
The final exact-object oracle also passed in `merge-set-final-green.log`.

Before adding the merged notice's lane segment, the amended MM7 and retained R-3523 tests failed.
`merge-red-notice.log` records exit 1, with both named failures.
The combined notice then passed.

## Seat mutation pairs

Command:

```text
SEAT_MUTATE_SHARDS=2 SEAT_MUTATE_OUT=docs/reviews/roster-roles-2026-11-02/seat-mutate-win32.txt node docs/reviews/roster-roles-2026-11-02/seat-mutate.mjs
exit 0
```

| Pair | Broken code | Named red |
|---|---|---|
| MM1 | planner fallback becomes none | 1/1 |
| MM2 | Claude scout rejected | 1/1 |
| MM3 | normalized unnamed slots persisted | 1/1 |
| MM4 | scout research tools removed | 1/1 |
| MM5 | load logged before spawn | 1/1 |
| MM6 | Windows cleanup watcher omitted | 1/1 |
| MM7 | set scout omitted from notice | 1/1 |
| MM8 | lineage diagnostics dropped | 2/2 |
| MM9 | guide's slot command removed | 1/1 |

Result: 9/9 red, 0 survived, 0 named titles green, 0 missing named titles.
MM1 also kills main's new R-3520 and R-3521 exact-output checks; these are additional reds, not missing titles.
All five baseline files pass.
No mutation anchor moved, so the seat script remains unchanged.
The committed record covers the code-bearing merge; the final evidence tip receives the same seat checks again.

## Roster demonstration

`merge-roster-output.log` comes from a fresh OS-temp agent directory holding all eight slots and lanes.
Only the temporary directory prefix is redacted.
The actual roster command exits 0.

```text
scout: claude-code sonnet
builder: openai-codex fixture-builder high
largerBuilder: claude-code opus
reviewer: claude-code opus
land: openai fixture-land default
planner: anthropic fixture-planner medium
adversary: openai fixture-adversary high
checker: openai fixture-checker high
lanes: 2
source: <temp-agent-dir>\nana-pack.json
```

The notice in that log includes all resolved roles before `lanes 2`, followed by its change pointer.

## Generators and gates

| Command | Exit / result |
|---|---|
| `git merge origin/main` | 1 for the expected nine conflicts; merge commit succeeds, exit 0 |
| `npm run map` | 0; 589 mapped modules |
| `node scripts/requirements-tree.mjs --write` | 0 |
| `npm run map:check` | 0 |
| `npm run readme:check` | 0 |
| `node scripts/requirements-trace.mjs` | 0; 2,182 implemented rows traced |
| `node scripts/requirements-tree.mjs --check` | 0; 0 problems, 2,439 rows, 43 features |
| `node scripts/known-bugs.mjs --root .` | 0; names=0, sizes=0 |
| `nana-writing` on just the two merged session entries | 0; 17 sentences, 245 words, over=0, passive=0, banned=0 |
| `node scripts/identity-scan.mjs --root .` | 0; findings=0 |
| `node packages/nana-setup/bin/install-check.mjs` | 1 with inherited lane-root environment; only pi post-edit failed |
| Same install check with `NANA_WORKTREE_ROOT` unset | 0; all 24 items pass |

The first install run inherited the builder's write boundary while the rehearsal writes its own temp project.
Clearing only that inherited variable makes the isolated rehearsal pass; no product or assertion changed for this result.
The initial and isolated logs are both retained.

A staged whitespace check returns 2 for inherited main evidence and the imported land helper's extra final blank line.
Those imported bytes remain unchanged; the diagnostic is retained in `merge-inherited-whitespace.log`.

## Precedent and limits

- Followed the existing roster schema, format helper, notice formatter and mutation runner; no helper was copied or made public.
- Kept plan revision 2 A8/MM1's slot order: old five slots, then planner, adversary and checker, then lanes and source.
- The build brief's parenthetical enumerates the role slots before reviewer and land, unlike the plan and its required assertions.
- Interpreted “in this lane's order” and “do not weaken any assertion” as preserving the plan's established order.
- This is the only ordering interpretation departure; no other Precedent departure.
- No supplied FEAT-041 known bug was fixed or changed by this merge.
- Main's known-bug files arrive through the merge only; this session edits none of them.
- No real agent configuration, stored credential or GitHub API was read or changed by this work.
- No issue action or independent model session was started.
- Local full suite not run: AGENTS assigns it to CI. This brief explicitly leaves the push to the seat.
- No CI run was read. No macOS install check ran in this Windows build.
- The technical report retains required paths, IDs and verdict syntax despite report-mode writing findings; the writing rule excludes technical records.
