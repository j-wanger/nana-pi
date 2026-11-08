# ci-packs build 3 — review 1 repair

Feature: FEAT-031. Branch: `feat/ci-packs`. No new requirement IDs: this revision extends existing R-3851 and R-3853 within the brief's R-3850–R-3859 allocation.

## Closures

- Review MUST 1: every changed collected nonmanual test now supplements pack selection, with `changed test` reasons in `selection.changedTests`. This survives module fail-safe selection. The runner prints those entries; the shared CI reader checks their presence in the final record or shard union.
- Release selection uses the existing `impact` graph walk for release-pack callers, alongside release-path watches and edited release tests. Graph uncertainty also adds release for lane runs. Explicit single-pack and main runs retain their pack behavior.
- One-line SHOULD repair in the selector: an unmapped changed path without a watch hit selects all module tests rather than silently selecting nothing.
- README's already-touched CI description now says event-selected packs rather than a full suite. The pack README describes the reader's changed-test requirement.

## Files and rows

- `REQUIREMENTS.md`: R-3851 records changed-test proof; R-3853 includes release-test and graph dependency changes. Evidence names the two new cases.
- `packages/nana-pack/tests/test-packs-runner.test.mjs`: exactly two new must-meets, M11 and M12, tagged to those existing rows. M11 replays the frozen name-only diff of acceptance-win-cmd `59e7d598` through the real selector and graph, plus release-test-only, template-release and release-status changes. M12 replays the review's ci-wait module/test pair and verifies reader acceptance, missing-file refusal and failed-test refusal.
- `scripts/test-packs.mjs`: independent changed-test selection, release graph selection, unmapped-path fallback.
- `scripts/test.mjs`: prints changed-test paths and reasons; the existing pack record already carries the complete selection.
- `packages/nana-pack/lib/land-ci.mjs`: validates changed-test metadata and checks its paths together with selected module paths. Historical full-suite records without pack metadata remain valid. Earlier pack records lacking the new changed-test list refuse instead of silently qualifying.
- `README.md`, `packages/nana-pack/README.md`: producer and consumer contracts.
- `docs/code-map.md`: regenerated. `npm run req:tree` needs no output change.

No old test assertion, title or marker was edited. No test was deleted. The two new cases reuse the existing awaited, per-case-bounded `check` harness. They read repository files but write fixtures only through existing OS-temp helpers. This revision adds no line-by-line text reader, sealed tunable or dependency.

## Mutation pairs

All paths in this section are relative to this directory.

| Wrong code | Red evidence | Restored green |
|---|---|---|
| Original selector selects changed tests only in module | `current-selector-red.log`, exit 1: M11 omits template-acceptance; M12 omits ci-wait | `selector-green.log`, exit 0, 12 checks |
| Remove release selection from graph callers | `release-reader-mutations-red.log`, exit 1: M11 rejects missing release for scripts/template-release.mjs | `touched-green.log`, exit 0 |
| Reader checks only selected module paths | Same mutation log, exit 1: M12 rejects acceptance of an omitted edited main test | `touched-green.log`, exit 0 |

Mutations changed product code, never assertions. The last two independent mutations ran together; their separate cases each failed for the intended cause.

## Verification before commit

| Command | Exit | Evidence/result |
|---|---:|---|
| `npm run map` | 0 | `map.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run readme:check` | 0 | `readme.log` |
| `node scripts/component-audit.mjs --check` | 0 | `components.log`; report-only existing notes remain |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| Title check through `checkRepo` | 0 | `titles.log`: **0 missing** |
| `node scripts/test.mjs --jobs=4 test-packs test-runner land-ci ci-records main-ci win-shards ci-wait win-main-only` | 0 | `touched-green.log`: 15 files, 124 passing checks |
| `npm test -- --pack=land --jobs=4` | 0 | `land-four.log`: 71 PASS, 2,447 passing checks, 52.6 s runner wall |
| `npm test -- --pack=land,module --changed-from=main --jobs=4` | 0 | `selected-four.log`: 188 PASS, 2 platform SKIP, 6,089 passing checks, 517.3 s runner wall; all selection output retained |
| Literal sentence/path grep over every tracked test | 0 | `test-text-grep.log`: 45 needles |
| Caller search | 0 | `callers.log`: selector, shared reader and scripts callers inspected |

Four-job land's ten slowest files: land 29.4 s; brief-check 29.4 s; identity-tree 16.1 s; win-shards 14.4 s; test-packs-ci 10.2 s; test-packs-runner 10.1 s; setup/install 9.6 s; gate-corpus 9.1 s; issue-watch 8.5 s; setup/pi-registration 5.8 s. Names are `.test.mjs` files beneath `packages/nana-pack/tests/`, except the two setup files beneath `packages/nana-setup/tests/`. No new pack move is needed; both files above 20 s are core guards. The run remains below the 90 s target.

The final response lists postcommit checks on the full tip. AGENTS.md delegates the full suite to CI; selected-pack runs are not represented as full suites. The root has no separate lint or type command.

## Precedent and callers

Both named precedent files were read completely before design. The selector imports existing public graph functions and uses its existing release-watch and fail-safe conventions. The shared record reader remains the single implementation for land and main CI, including shard aggregation. No product helper was copied, renamed, or moved. No precedent departure was needed. `scripts/test.mjs` is the changed selector caller; existing `ciSuiteLegs`, `proveCiSuite`, main-CI and land callers keep their return contracts and receive the stricter shared proof check. Existing tests pass without caller-fixture changes.

## Remaining review observations for the seat

These are residuals, not closures:

- Release tests still have no Windows run; the Ubuntu release job remains blocking. This requires a workflow policy change, not a one-line change in a touched file.
- `SUITE_FALLBACK_PATHS` still omits selector/config files. `FAIL_SAFE_PATHS` still omits the graph, launch and glob implementations. Their config files were not otherwise touched by this repair.
- AGENTS.md still uses the old suite wording; the ci-workflow test title still says full suite. Neither file was otherwise touched by this repair.
- The review's NOTE items remain: conservative-selection cost, partial local timing baselines, joined Linux advisory reasons, release ref versus working-tree tests, committed-only local diffs, manual assignment policy and the first-ten-lanes measurement.
- HANDOFF and session archives are deliberately unchanged under the lane restriction.

The complete `docs/known-bugs/FEAT-031.md` was read. This repair touches only the CI-record merge-ref limitation: selection still follows the PR merge diff, and the record still names the event rather than a tree hash. It does not fix that limitation. Timing, lock, retention, Windows flakes and install-check builder-session behavior are unchanged.

No push, CI read, credential lookup, GitHub mutation, model session or subagent ran. Native Windows execution and the seat's push/CI verification remain for the seat. No owner decision was introduced.
