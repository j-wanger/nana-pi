# ci-packs implementation record

Branch: `feat/ci-packs`. Feature: FEAT-031. Rows: R-3850–R-3859, in M1–M10 order.

## Commits and verification

| Part | Commit | Files and rows | Wrong-code → green evidence |
|---|---|---|---|
| 1 | `00eb760e` | REQUIREMENTS.md; test-packs-config.mjs; test-packs.test.mjs; generated map/tree. Adds all ten rows; implements R-3850/R-3856. | `evidence/part1-red.log` (1): empty validator and empty policy fail M1/M7. `evidence/part1-green.log` (0): membership, seal and trace pass. |
| 2 | `4238b3e0` | scripts/test.mjs, test-locked.mjs, test-packs.mjs, code-map.mjs; pack configuration; pack-fixtures.mjs and test-packs-runner.test.mjs; README/map/tree. R-3851/R-3852/R-3858. | `evidence/part2-red.log` (1): ignored packs, absent selection and argument-as-filter locking fail M2/M3/M9. `evidence/part2-green.log` (0): nine files, 216 checks. |
| 3 | `4029f142` | Twelve source test files and twelve extracted land files listed in moves.json; test-packs-core.test.mjs; config, runner native-only skips, map/tree and requirement citations. R-3855. | `evidence/part3-red.log` (1): missing core land guards. `evidence/part3-green.log` (0): all 29 touched files pass or have named platform skips. |
| 4 | This implementation commit | CI workflow; shared land/main record reader; release command; README contracts; runner flag seals; test-packs-ci.test.mjs; existing CI-shape fixtures; generated map/tree. R-3853/R-3854/R-3857/R-3859; clarifies R-3824/R-2548. | `evidence/part4-red.log` (1): all four must-meets fail against the old shape. `evidence/part4-release-red.log` (1): release command lacks its pack. `evidence/final-green.log` (0): 18 files, 230 checks. |

Paths above are relative to this folder unless they name source files. Source test paths are under `packages/nana-pack/tests/` or `packages/nana-setup/tests/`; production pack libraries are under `packages/nana-pack/lib/`.

Additional code mutations, never assertion inversions:

- M3: omit the full-module fallback in scripts/test-packs.mjs. `evidence/mutation-failsafe-red.log`: exit 1; restored code passes.
- M8: remove retire from both main CI pack arguments. `evidence/mutation-retire-red.log`: exit 1; restored code passes.
- M7: leave the new argument prefixes undeclared. `evidence/mutation-prefix-red.log`: exit 1; declared prefixes pass.
- M5/M10: the old reader ignores pack metadata. The red baseline accepts a landless newest pack shard; the fixed reader refuses it.

The runner's `collect` now returns the complete unfiltered collection; its only caller applies packs, substrings and shards in that order. `linkRepo` gained a public export without changing its return or existing callers. The selector imports it rather than copying launch-policy assembly. `templates-render.test.mjs` imports the public `markerBlock` from the guarded `templates-working.test.mjs` instead of copying it. `mainCi` already calls `ciSuiteLegs`; changing that shared reader updates both consumers without a separate main-CI implementation.

## Design choices and departures

- Config uses an explicit frozen path-to-pack table, following RUN_ALONE and WINDOWS_SKIPS. Browser e2e files are manual; helpers are not runnable membership entries.
- The seat inventory missed page-retire, data-pack, win-main-only and win-shards. They now have explicit assignments. Data-pack's first must-meets and both CI policy guards run in land; page-retire stays module. Removed desk files were omitted, not deleted by this lane.
- All six critic A3 extractions landed before the workflow switch. Additional Windows, resolver and doctor guards were extracted too. Sixteen regions remain byte-identical to their historical source; moves.json records their boundaries and hashes. Forty-one requirement evidence citations follow their moved cases.
- Brief-check and writing-injection stay whole in land rather than splitting their setup-dependent checks. Frontier, known-bugs and handoff-issues also stay whole, taking the critic's explicit small-file option. This preserves every core guard but costs more time than the estimate.
- Extracted tests retain independent fixture setup for their isolated processes. No product helper was copied. No unauthorized shared-module move was introduced.
- Text watches conservatively select all module tests. The test-source wildcard covers the eight windows-skip-lines inputs and future text readers, rather than pretending imports describe text reads.
- Graph loading is lazy and inside the fail-safe boundary. A bad diff also selects release, so an unreadable release-path decision cannot drop release checks.
- Pack records keep substring filters separate. `packRun` names packs, completeness, changed paths, module reasons and the fail-safe cause before sharding. Readers require land plus module, consistent shard selection and a union containing every selected module file. Historical full-suite records remain accepted.
- Complete locked packs keep records but do not generate misleading partial runtime coverage. Ordinary substring runs retain their unlocked behavior.
- Outside precedent: read Jest's CLI documentation at https://jestjs.io/docs/cli (`--changedSince`). Borrowed merge-base-based committed change selection; added this repository's launch links, blind reach, text watches and fail-safe behavior. Did not adopt watch mode or dependency-only selection.
- The plan's newer assumptions override the design's obsolete nightly, PR-Linux and retire-never text. No nightly was added; retire still runs on main.

## Existing test edits

No moved assertion or requirement marker changed. Native-only source files gained runner-level non-Windows skip reasons after their portable cases moved.

- `ci-workflow.test.mjs`: R-597 release command pin now invokes npm's release pack plus acceptance; R-1313 Windows command pin includes packs; the final R-597 expected command list includes event-selected packs and the PR merge-base argument.
- `win-main-only.test.mjs`: M10's expected PR matrix and shard list now contain only macOS. Main expectations remain unchanged. R-3824 changed before these assertions.
- `ci-records.test.mjs`: R-2633's copied-runner fixture now uses the real dependency-closure helper and declares its four fixture packs. Its command expansion evaluates the workflow's event expressions. Its assertions remain unchanged.
- `test-packs.test.mjs`: M7 also seals pack names and argument prefixes, with the R-3856 requirement diff first.
- The twelve original files in moves.json lose only the extracted cases (and the now-imported template helper). No file was deleted. No retire-lane B1–B8 change was made.

## Seat-check evidence

| Command | Exit | Result |
|---|---:|---|
| `npm run map` | 0 | `evidence/seat-map.log` |
| `npm run map:check` | 0 | `evidence/seat-map-check.log` |
| `npm run req:tree` | 0 | `evidence/seat-tree.log` |
| `npm run readme:check` | 0 | `evidence/seat-readme.log` |
| `node scripts/component-audit.mjs --check` | 0 | `evidence/seat-components.log`; six report-only stale component notes retained |
| `node scripts/requirements-trace.mjs` | 0 | 2,647 rows; `evidence/seat-trace.log` |
| `node scripts/test.mjs test-runner` | 0 | `evidence/seat-test-runner.log` |
| `npm test -- --pack=land` | 0 | 72 files, 2,457 passing checks; 442.5 s runner / 443.06 s real; `evidence/seat-land.log` |
| `npm test -- --pack=land,module --changed-from=main` | 0 | land,module,release; 178 files, 4,538 passing checks; 1,511.7 s runner / 1,512.25 s real; `evidence/seat-selected.log` retains every module reason |
| Every touched test, path-filtered | 0 | 38 files: 36 PASS, 2 platform SKIP; 1,956 passing checks; `evidence/seat-touched.log`; exact argv in `evidence/touched-command.txt` |
| Install check | 0 | All instrumented checks pass; sanitized output in `evidence/install-check.log` |
| Literal test-text audit | 0 | 753 sentence/path needles across 320 test files; `evidence/test-text-grep.log` |

The changed-from run correctly reports `fail-safe: policy path changed: code-map.config.json`. It also includes release because this lane touches setup test paths. Both measured pack commands used their requested default of one job. The land run's slowest file was data-pack.test.mjs, 221.6 s; it did not exist in the seat inventory. The 38-second estimate is not this run's measured result.

Logs above record precommit runs of the final implementation. The final response reports postcommit checks and the full tip. The repository delegates its full suite to CI in AGENTS.md; no redundant local full suite ran. The selected run is not represented as a full suite. No separate root lint or type command exists; map, README, trace and the touched test suites provide the documented checks.

## Known-bug scope and limits

The complete FEAT-031 known-bug file was read. This change touches the argument-as-filter lock bug only for complete pack invocations, and extends record retention to those invocations. Bare flags without packs retain their old lock/record behavior. Windows timing, pid and stall bugs were not fixed. The Windows-skip-lines predicate's existing limitations remain; its text inputs now trigger conservative module selection.

No GitHub operation, credential lookup, push, live model call, subagent or CI read was performed. Native Windows execution remains for the seat's CI. Later retire lanes still own deletions and critic B1–B8. The first-ten-lanes timing measurement remains a seat follow-up. No open owner decision was introduced.
