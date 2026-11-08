# ci-packs: merge current main

Feature: FEAT-031. Branch: `feat/ci-packs`.

Merge inputs: lane `243d79ab`; main `19cb9c940c0034616dc4586b4f01aaccbfdb8994`.
The merge retains both histories; no rebase. No new requirement IDs or authored test files.

## Conflict resolutions

The original combined diff is `conflicts.diff`. All 18 conflict blocks follow.

| File / block | Resolution |
|---|---|
| REQUIREMENTS.md / 1 | Keep the lane's R-020 objective-smoke evidence and main's R-641 handoff retirement. |
| REQUIREMENTS.md / 2 | Keep main's R-3872–R-3879 fixes-red rows and the lane's macOS-only R-3824 PR policy. Main's R-3826 exception also survives. |
| packages/nana-pack/README.md / 1 | Keep main's fixes-red option and explanation, and the lane's complete-pack/shard proof contract. |
| packages/nana-pack/tests/templates-render.test.mjs / 1 | Keep the extracted working-region guards in templates-working, importing its public markerBlock. Move main's R-3895/R-3896 assertions there unchanged; retain main's rendered R-3899 assertion and retirement updates in templates-render. |
| packages/nana-setup/tests/doctor-detail.test.mjs / 1 | Main's obsolete subagent checks stay deleted. Node-floor checks remain exclusively in the lane's extracted doctor-floor file. All other main doctor changes survive. |
| docs/code-map.md / 1 (old lane line 10) | Regenerate coverage count. |
| docs/code-map.md / 2 (472) | Regenerate code-map callers. |
| docs/code-map.md / 3 (794) | Regenerate trace callers. |
| docs/code-map.md / 4 (846, first) | Regenerate locked-runner callers. |
| docs/code-map.md / 5 (846, second) | Regenerate test-runner callers and callees. |
| docs/code-map.md / 6 (1520) | Regenerate agent-dir callers. |
| docs/code-map.md / 7 (2183) | Regenerate objective callers. |
| docs/code-map.md / 8 (2543) | Regenerate runner-config callers. |
| docs/code-map.md / 9 (3831) | Regenerate pi-install helper callers. |
| docs/code-map.md / 10 (4530) | Regenerate temporary-directory helper callers. |
| docs/code-map.md / 11 (4836) | Regenerate setup project callers. |
| docs/code-map.md / 12 (4911) | Regenerate install-check callers. |
| docs/code-map.md / 13 (5836) | Regenerate setup temporary-directory helper callers. |

`docs/requirements-tree.md` was also regenerated, not hand-merged.
`preservation.log` proves zero missing IDs from either parent: 2,659 lane rows and 2,685 main rows; merged total 2,695.
Main's nana-land and main-ci modules remain byte-identical to main.
HANDOFF.md came only from main's automatic merge; no authored edit.

## Membership

All seven files main added receive exactly one pack:

| File | Pack | Category |
|---|---|---|
| packages/nana-knowledge/tests/pull-cut.test.mjs | module | Knowledge package's explicit-search behavior. |
| packages/nana-pack/tests/experiment-cut.test.mjs | retire | Finished-experiment removal guard. |
| packages/nana-pack/tests/memory-cut-checks.test.mjs | retire | Retired memory-artifact guard. |
| packages/nana-pack/tests/memory-cut-guidance.test.mjs | release | Copier/scaffold/adoption rehearsal. |
| packages/nana-pack/tests/setup-retire.test.mjs | module | Adoption discovery and legacy configuration compatibility. |
| packages/nana-setup/tests/memory-pause.test.mjs | module | Setup memory-hook behavior. |
| packages/nana-setup/tests/pull-cut-turn.test.mjs | module | Setup explicit-search turn behavior. |

Main's land-fix-red cases were added to the existing `win-main-only.test.mjs`; it remains in `main` (landing machinery, not a new core-contract land guard).
The 21 test files main deleted stay deleted and leave TEST_PACKS; `deleted-tests.txt` lists them.
No extra test file was deleted. Existing land extraction files remain.

## Requirement and test adjustments

No new behavior rows or IDs. R-3857 now permits every explicit main deletion, rather than only the earlier review-paperwork retirement. Its existing M8 test compares historical collection with main's committed inventory, while still asserting deletions stay absent and all surviving nonrelease tests run.
R-020 retains the extracted evidence path; R-3895 and R-3896 cite their retained assertions' new home. Both sides' other rows remain, including main's retirements and fixes-red rows.

Existing test edits beyond accepting main:

- `test-packs-ci.test.mjs`: M8's obsolete three-file retirement assumption now uses main's committed inventory.
- `win-main-only.test.mjs`: its existing injected artifact fixture now emits complete pack metadata, identical across Windows shards with the complete selected-file union. All existing fixes-red and ordinary-gate assertions remain.
- `templates-working.test.mjs`: receives main's two new assertions without altering historical extracted bytes.
- `templates-render.test.mjs`: imports the existing public markerBlock and omits only the moved block; retains main's other changes.
- `doctor-detail.test.mjs`: omits retired checks and the already-extracted floor assertions. `doctor-floor.test.mjs` is unchanged.

No new tunable, helper, private cross-module import or shared-module move. Card: fix names no Precedent section; existing lane patterns are retained without departure.

## Mutation pairs

- Membership: unchanged config with main's new files fails existing M1 (exit 1, `membership-wrong.log`); refreshed membership passes (`resolution-tests.log`, exit 0).
- Pack integration: break production `suiteScopeProblem` to refuse every pack record, never change an assertion. Existing fixes-red M1 and six other cases fail (`fixes-red-pack-wrong.log`, exit 1). Restore production code; all fixes-red and land-ci cases pass (`fixes-red-pack-green.log`, exit 0). The mutation is not committed.

## Precommit checks

| Command | Exit | Evidence / result |
|---|---:|---|
| npm run map | 0 | map.log; 543 modules, zero problems. |
| npm run req:tree | 0 | tree.log. |
| node scripts/test.mjs test-packs templates-working doctor-floor doctor-detail win-main-only land-ci | 0 | resolution-tests.log; 12 files, 105 checks. |
| node scripts/test.mjs templates-render | 0 | templates-render.log. |
| node scripts/test.mjs test-runner | 0 | test-runner.log. |
| npm test -- --pack=land --jobs=4 | 0 | land-green.log; 71 files, 2,413 checks, 49.5 runner seconds. |
| npm test -- --pack=land,module --changed-from=main --jobs=4 | 0 | selected-precommit.log; 192 files, 5,999 checks, 465.1 runner seconds. Prints policy-path fail-safe and all selection reasons. This precommit diff uses the old merge base; final-tip checks re-evaluate it. |
| npm run map:check | 0 | map-check.log. |
| npm run readme:check | 0 | readme-check.log. |
| node scripts/requirements-trace.mjs | 0 | trace.log; 2,695 rows. |
| node scripts/component-audit.mjs --check | 0 | component-audit.log; report-only stale and unclaimed notes remain. |
| node packages/nana-setup/bin/install-check.mjs | 1 | install-check.log; all local instrumentation passes, README rehearsal fails at cloned checkout's doctor step. Rehearsal clones committed HEAD, which predates this merge. Repeat after committing. |
| node scripts/test.mjs experiment-cut memory-cut setup-retire pull-cut memory-pause | 1 | new-main-tests.log; six pass, memory-cut-checks sees adoption.ts absent from premerge HEAD. memory-cut-detail.log names only three HEAD-tracking notes. Repeat after committing. |
| git diff --check (unstaged resolution) | 0 | No whitespace errors in the tracked unstaged resolution. |
| git diff --check --cached | 2 | staged-whitespace.log; inherited main evidence and literal conflict diffs contain whitespace. Preserved rather than rewriting historical evidence. |

An initial land check failed because R-3899's main assertion had not yet been retained; the final templates-render resolution restores it. Trace and land are green afterwards.
`removed-text-test-grep.log` searches tests for removed lines and deleted paths before reporting.
Long output stays in this evidence directory. Logs normalize home paths to `~` and temporary paths to `$TMPDIR`.

The repository delegates the full suite to CI in AGENTS.md. No redundant local full suite, CI read, push, GitHub write, credential lookup or live model call. Install checks use the repository's instrumented fixture provider.
No known-bug line was edited. The complete FEAT-031 known-bug file was read; no listed bug is claimed fixed. Pack integration preserves the main-CI and record limitations already recorded there.

## Main moved during verification: setup-tail

Main advanced to `08b8c5f2684c02ee9bb324cb69e95f80dadf5984` during the first merge's seat checks. A second merge commit retains it too. The first merge is `cffbc8d800f16072eda161624f5de9722fac314e`.

Checks on that first merge all passed: land 71 files / 2,413 checks / 81.74 seconds real; selected 192 files / 5,999 checks / 460.28 seconds real; runner 64 checks; fixes-red plus land-ci 34 checks; map, tree, README, trace, audit and install all exit 0. The first merge's memory-cut checks also pass (12 checks across all seven new files). Evidence: `*-committed.log`. These close the precommit HEAD-dependent failures without a code change.

The second merge has only generated-map conflicts. `conflicts-setup-tail.diff` records all six blocks, resolved by the generator:

| docs/code-map.md block | Resolution |
|---|---|
| 1, old lane line 10 | Regenerate coverage count. |
| 2, line 755 | Regenerate template-acceptance callers. |
| 3, line 3548 | Regenerate pi-install helper callers. |
| 4, line 4404 | Regenerate setup paths callers. |
| 5, line 4473 | Regenerate setup project callers and callees. |
| 6, line 5460 | Regenerate setup temporary-directory helper callers. |

`packages/nana-setup/tests/setup-tail.test.mjs` is the eighth new file; pack **release**, because it renders both templates, updates copier projects and runs their installed manual toolchains. No land guard or helper was copied. All setup-tail requirement rows survive, with zero missing IDs from either parent (`preservation-setup-tail.log`); merged total 2,704. No extra requirement change or authored test change was needed for this merge.

Before assigning this file, M1 fails (exit 1, `setup-tail-membership-wrong.log`). After assignment, all pack, runner, setup-tail and writing-injection tests pass (exit 0, `setup-tail-resolution-green.log`; 8 files, 115 checks).

Second-merge precommit checks:

| Command | Exit | Evidence / result |
|---|---:|---|
| npm run map | 0 | map-setup-tail.log. |
| npm run req:tree | 0 | tree-setup-tail.log. |
| npm test -- --pack=land --jobs=4 | 0 | land-setup-tail.log; 71 files, 2,413 checks, 49.06 seconds real. |
| npm test -- --pack=land,module --changed-from=main --jobs=4 | 1 | selected-setup-tail.log; 193 files, 6,009 passing checks, 3 failures only from component-audit's HEAD ancestry/tracking prerequisites. |
| node scripts/test.mjs win-main-only land-ci | 0 | land-ci-setup-tail.log. |
| npm run map:check | 0 | map-check-setup-tail.log. |
| npm run readme:check | 0 | readme-setup-tail.log. |
| node scripts/requirements-trace.mjs | 0 | trace-setup-tail.log; 2,704 rows. |
| node scripts/component-audit.mjs --check | 1 | component-setup-tail.log; setup's main audit commit is not yet an ancestor of premerge HEAD and its new test is not tracked there. Repeat after merge commit. |
| node packages/nana-setup/bin/install-check.mjs | 0 | install-setup-tail.log. |

The component-audit and page-retire test failures name only those same HEAD prerequisites. No assertion is weakened. `removed-text-setup-tail-grep.log` covers the second merge's removed text and paths.

## Final merged-code verification

On `12d613e3f703e8928019b92e44846a7a8ca84848`, every requested seat command passed (exit 0). Full sanitized output is `final-seat-checks.log`:

- Land: 71 files, 2,413 checks, **49.40 seconds wall**.
- Changed selection: 193 files, 191 PASS / 2 platform SKIP, 6,012 passing checks, **519.58 seconds wall**. Selection prints `[packs] fail-safe: policy path changed: code-map.config.json`, complete module reasons and changed-test reasons; release is included for release inputs.
- Runner: 2 files, 64 checks.
- Existing land-fix-red cases (`win-main-only`) and all land-ci files: 5 files, 34 checks.
- Map, tree, README, trace, component audit and install: all exit 0. Trace has 2,704 rows. The audit's remaining stale/unclaimed notes are report-only.

The precommit component/page-retire failures disappear once the merged main ancestry and new tracked file reach HEAD. No further code or assertion change was made.

Evidence-only commit `68adb0acb6d5ed360734b47a48fb428fd1effb3a` records these successful runs. Every requested command also passed on that exact tip: land 49.29 seconds wall, selected 492.77 seconds wall, 6,012 passing selected checks, runner 64 checks and fixes-red/land-ci 34 checks. Its output is preserved in `evidence-tip-checks.log`.

## Main moved again: setup-tail Windows test fixes

Main advanced to `f34ad00b9a9a0f7e3e3555a764964a4e914427c1` during the evidence tip's checks. A third merge retains its fixture canonicalization and run-alone credential timing probes. No new test file or pack assignment; all eight assignments above remain unchanged. Both parents' requirement IDs survive (`preservation-setup-tail-win.log`).

There is exactly one additional conflict block: `docs/code-map.md`, old lane line 2351, runner-config callers. The map generator resolves it; `conflicts-setup-tail-win.diff` records the original block. The requirements tree is regenerated too. Total across all three merges: 25 conflict blocks, all accounted for here.

`node scripts/test.mjs credential-strip setup-tail test-packs.test test-runner` passes before the third merge commit: exit 0, 5 files, 81 checks (`setup-tail-win-green.log`). This includes the new main fixes and membership, with no authored assertion edit. Map and tree generators exit 0. `removed-text-setup-tail-win-grep.log` searches the latest removed text against tests.

The third merge's exact tip is rechecked with every requested seat command and reported in the final response. Windows execution and CI remain the seat's responsibility. No push was performed.
