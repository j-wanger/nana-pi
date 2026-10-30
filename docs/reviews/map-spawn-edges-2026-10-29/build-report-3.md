# map-spawn-edges — build 3 technical record

Feature: FEAT-029 · Navigate code and investigate impact

Base: `f998bd52`. Lane: `feat/map-spawn-edges`. Class: `ordinary`.

## Closures

1. **MUST 1 closed:** `launchSites` reads inline flags only in node's option prefix. An unknown script argument ends that prefix, so a child's trailing `-- -p review` cannot erase its launch. Variable and template inline code remain unresolved, even when a variable evaluates to a literal without import text. Only lexically plain string code can earn `inline-no-repo`. Separate `--input-type` values are consumed as options, not code; fork's arguments are never node's inline options.
2. **SHOULD 2 closed:** `callsIn` distinguishes an unmatched ternary question mark from a signature context before accepting a call followed by a colon. It skips balanced groups, pairs nested ternary colons, and stops at expression boundaries. Object methods and TypeScript signatures remain excluded. The built reader finds eight more sites; static edges remain unchanged.

## Files, row and test

Requirement diff preceded the fixture change, which preceded implementation. Only R-3152 changed; it now states option-position flags, plain literal inline code and ternary/signature handling. All thirteen build-2 rows remain `implemented`, with their existing backticked `file::title` evidence. The title check reports **13 rows, 15 citations, 0 missing**. No IDs, tunables, declarations, tree placement or test titles changed.

- `scripts/code-map-launch.mjs`: only `callsIn` and `launchSites` changed. Both use the existing token slices, balanced groups, `parts`, `literal`, evaluator and graph mutation pattern. No helper was copied or moved.
- `packages/nana-pack/tests/code-map-launch.test.mjs`: extended only the brief-named R-3152 case, `R-3152: unresolved sites are numbered without guessing and stale lists fail check`. It adds an unknown temp-copy script with child `-- -p review`, variable inline code, template inline code, a ternary first-branch launch, a TypeScript method signature, a declared function signature and an object method. It pins seven exact unresolved lines and excludes the signatures, method and literal no-repo code. It also checks the fixture's blind impact listing. The same fixture runs with LF and CRLF/trailing spaces or tabs/no final newline. The existing harness awaits each case under its imported deadline; child commands retain their bounds. All fixture writes remain in OS temporary folders.
- `docs/code-map.md`: regenerated unresolved lists. In particular, `packages/nana-pack/tests/review-standard.test.mjs` now lists **line 101: spawnSync** as unresolved. That test is in the always-run block of `--impact packages/nana-pack/bin/pi-review.mjs`, recorded in `impact-review-built-3.txt`. No guessed temporary-copy edge was added.
- `scan-built.txt`, `replay-built.txt`, `replay-built-since.txt`: rewritten by the unchanged seat scripts with `MAP_EDGES=built`.
- `wrong-code-3.txt`, `touched-tests-3.txt`, `full-suite-3.txt`, `final-checks-3.txt`: complete wrong-code, touched-suite, locked-suite and check output.

No new test was introduced. No other existing test was edited or deleted. The R-3152 count and line assertions changed because its fixture now includes the additional launches the brief requires.

## Wrong-code pairs

Command for every fixture run: `NODE_NO_WARNINGS=1 node packages/nana-pack/tests/code-map-launch.test.mjs`.

| Code under test | Result | Restored implementation |
|---|---|---|
| Build-2 implementation, extended fixture | exit 1; R-3152 sees 3 rather than 7 unresolved sites | exit 0; all 12 cases pass |
| Scan past a script argument (`continue` instead of `break`) | exit 1; 6 rather than 7, missing child-flag site line 18 | exit 0; line 18 remains unresolved |
| Assume opaque inline code is empty (`code = ""` instead of `null`) | exit 1; 5 rather than 7, missing variable/template lines 20 and 21 | exit 0; both sites remain unresolved |
| Reject every call followed by a colon | exit 1; 6 rather than 7, missing ternary line 22 | exit 0; line 22 remains unresolved |

Each mutation changed code, never an assertion. The first red run preceded implementation. After all three isolated mutations were restored, the fixture exited 0 and the touched suite passed. Complete failures are in `wrong-code-3.txt`; the green 12-case file is included in `touched-tests-3.txt`.

## Measurements beside build 2

Both scans read the same runtime map at `85e51381`, covering 240 measured files. The full foreground suite below was plain, not a new runtime measurement.

| Measure | Build 2 | Build 3 |
|---|---:|---:|
| mapped test files | 240 | 240 |
| runtime gap: files / entry points / distinct modules | 18 / 43 / 23 | 18 / 43 / 23 |
| always-run blind reach | 165/240 (68.8%) | 169/240 (70.4%) |
| blind holding modules | 97 | 107 |
| launch sites | 795 | 803 |
| inline-no-repo sites | 25 | 9 |
| non-import edges / lost old edges | 321 / 11 | 321 / 11 |

The unchanged gap measures missing graph edges, not always-run coverage. The fix makes opaque inline launches conservative without inventing edges. The named temporary-copy loss for review-standard is now explicitly blind.

| Replay measure | Build 2 | Build 3 |
|---|---:|---:|
| failed runs listed / PR runs replayed | 182 / 154 | 184 / 156 |
| failing (run, leg, file) pairs | 4363 | 4365 |
| edge-selected pairs (including changed tests) | 533 | 533 |
| always-run pairs | 1736 | 1760 |
| missed: outside map | 399 | 381 |
| missed: unreached | 217 | 213 |
| **total misses** | **616** | **594** |
| red-on-base / not-mapped / unknown-base exclusions | 1477 / 1 / 0 | 1477 / 1 / 0 |
| since 2026-10-24: PR runs / pairs | 22 / 37 | 24 / 39 |
| since 2026-10-24: always-run / misses | 7 / 0 | 9 / 0 |

The live history window gained two failing PR pairs; both are always-run. Among build 2's original pairs, 22 former misses move to always-run. Raw replay records retain the existing six fields only: run, short SHA, branch, leg, file and classification. No replay script or baseline was changed.

## Commands and exit codes

- Fixture against build 2 and each of the three isolated code mutations: exit 1; fixed fixture: exit 0.
- `npm run map`: exit 0.
- `NODE_NO_WARNINGS=1 npm test -- code-map code-search runtime-map blast-radius component-audit requirement-rows test-runner.test`: exit 0; **8 files: 8 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 160 pass, 0 fail, 0 skip**.
- `MAP_EDGES=built NODE_NO_WARNINGS=1 node docs/reviews/map-spawn-edges-2026-10-29/scan.mjs`: exit 0.
- `MAP_EDGES=built NODE_NO_WARNINGS=1 node docs/reviews/map-spawn-edges-2026-10-29/replay.mjs --rows`: exit 0; same command with `--since 2026-10-24`: exit 0.
- `NODE_NO_WARNINGS=1 node scripts/code-map.mjs --impact packages/nana-pack/bin/pi-review.mjs`: exit 0; review-standard is in the always-run block.
- `NODE_NO_WARNINGS=1 npm run test:locked`: foreground, one machine-wide lock, exit 0; **240 files: 238 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8740 pass, 0 fail, 44 skip · 585.2s**. Full output is in `full-suite-3.txt`.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --root .`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs`, and the 13-row exact title check: each exit 0, recorded in `final-checks-3.txt`.
- `node scripts/lane-class.mjs --root . --files REQUIREMENTS.md,scripts/code-map-launch.mjs,packages/nana-pack/tests/code-map-launch.test.mjs,docs/code-map.md,docs/reviews/map-spawn-edges-2026-10-29`: exit 0, `ordinary`.
- `git diff --check`: exit 0.

The final chat report supplies the fix commit, post-commit checks, push result and finished CI run for that exact tip. Those cannot be committed into the same tip after its CI has finished.

## Precedent and limits

Read every brief-named Precedent file before designing. Followed the existing launch reader and R-3152 fixture patterns; no design departure or private-helper move was needed. The review-standard test was read but not edited or run as a new fixture. The full suite naturally runs its existing stubbed test; no model session or subagent was started.

Known-bug context touched: FEAT-029's build-2 runtime gap remains 18 files, and its seat-check always-run count changes from 165 to 169. The seat must update that historical limit if it wants a current count; builder edits to known-bug files are forbidden. The import-only page and other graph readers stay import-only. SHOULDs 3–5, dynamic-import gaps, injected/renamed runners, module-wide text-path links and the advisory Linux SIGKILL remain outside this fix. No such item is claimed as a closure.

No HANDOFF, known-bug file or session archive was edited. No issue was created, edited, commented on or closed. No package install, selector policy, template, setup/hook implementation, review tool or frozen desk change was made. This build does not merge or land. No open design question remains for these two fixes.
