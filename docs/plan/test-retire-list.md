# Test-retire list, refreshed against main 93936386 (2026-11-08)

Source design: `testpacks/PACKS.md` §3 + Critic, `testpacks/packs.json` (`pack == "retire"`, 63 files), written at 860785c2 (ancestor of 93936386; 144 commits since).
Method: `git ls-files` per path; `git log --diff-filter=D 860785c2..HEAD` for deletions; `req:` markers parsed with the rail's own `scanSource` over every `*.test.mjs` under `TEST_ROOTS` (scripts/requirements-trace.mjs), so "only-pinned" means exactly what the trace sees. Case counts and CI seconds are from `testpacks/tests.json` (measured at 860785c2) unless marked.

## Summary

| | Files | Cases (tests.json) | CI s serial mac / win / linux |
|---|---|---|---|
| Design retire list (860785c2) | 63 | 1,655 | 408 / 634 / 356 |
| Already deleted on main by landed lanes | 35 | — | — |
| Still on main | 28 | 506 at 860785c2 (several shrank since) | — |
| Of those: must NOT retire (live pin / regression / deliberately retained by a landed lane) | 22 | — | — |
| Of those: still retire | 6 | 49 | 94.7 / 86.0 / 116.0 |
| Added: ci-packs config marks retire, not in the 63 list | 2 | 2 (counted from source) | unmeasured |
| **Current file retire list** | **8** | **51** | **~95 / ~86 / ~116** |

Retire-splits inside kept files: of the 72 split entries, 12 named sets are already gone; ~30 sets confirmed present (list in Lane B, lower confidence).

### Deleted since 860785c2 (35, drop from list)

| Commit | Lane | Files |
|---|---|---|
| 44814256 | desk-page retire | apps/desk/test/{changes-endpoint.test, changes-ui.e2e, double-msg.e2e, live-feel.e2e, live-feel.test, pi-087-entries.test, pi-session-parity.test, rail-collapse.e2e, reload.e2e, session-races.e2e, spawn-and-persist.test, spawn-tools.e2e, subagent-render.e2e, title-live.e2e}.mjs (14) |
| 9904272a | knowledge pull cut | packages/nana-knowledge/tests/extension.test.mjs (1) |
| ee401fc8 | experiments retire (memory-cuts) | packages/nana-pack/tests/{blast-radius, memory-replay, outcome-meter, writing-trial-extractor}.test.mjs (4) |
| 9f1bde13 | setup-retire | packages/nana-pack/tests/handoff-{artifact, staleness, store, symlink, trust}.test.mjs (5) |
| ae5a39d6 | setup-retire | packages/nana-pack/tests/notify-{dispatch, fallback}.test.mjs (2) |
| 7eb8aa53 | setup-retire | packages/nana-pack/tests/post-edit-{default-timeout, file-queue, hardening, status, utf8, values-named}.test.mjs (6) |
| 9689fe0d | review-paperwork | packages/nana-pack/tests/{keep-movement, requirements-moved, review-movement}.test.mjs (3) |

Side effect: critic B8's `windows-skip-lines` R-1954 cascade (reads post-edit-hardening) and C3 are moot on main now that the file is gone (setup-retire handled it; unverified beyond the file being absent).

### Survivors that must NOT retire (22) → target pack

Packs are ci-packs names. Every one of these is mapped `"retire"` in ci-packs' `packages/nana-pack/lib/test-packs-config.mjs` (worktree ~/nana-pi-wt/ci-packs, tip 0f7ff87f). ci.yml there runs `retire` only on main push, so after ci-packs lands these 22 stop running on PRs. Reassigning them is the first edit of Lane A.

| File | Verdict / reason | → pack | Only-pinned rows (stay implemented) |
|---|---|---|---|
| packages/nana-knowledge/tests/build-busy.test.mjs | keep: R-3590/3593/3594 pin the live build and query busy timeouts; c675411e (2026-11-08) just edited it to keep these. Hook cases R-3592/3595/3596 pin the unwired `hook` CLI (see hook.test) | module | R-3590, R-3592..R-3596 |
| packages/nana-knowledge/tests/hook.test.mjs | keep: `nana-knowledge hook` CLI is deliberately kept "unwired for compatibility" (9904272a; packages/nana-knowledge/README.md:47). Retiring it means cutting the subcommand, which also breaks sources-file, hooks-closed-output, hooks-win32-exec (R-1330/1713/3540), skill-claims.mjs, templates-render, recover R-2402..2404. Feature cut, owner call, not this lane | module | R-225, R-227..R-232, R-238, R-285, R-891..R-893, R-973, R-1710, R-1711 |
| packages/nana-setup/tests/knowledge-state.mjs (helper) | keep: imported by hooks-win32-exec.test.mjs:26 (B8) | main (follows importer) | — |
| packages/nana-pack/tests/build-report.test.mjs | keep: `bin/build-report.mjs` is a README-named command (packages/nana-pack/README.md:612). Retire only with the command (owner call) | module | R-2600, R-2601, R-2667, R-2725, R-2815 |
| packages/nana-pack/tests/claude-launch.test.mjs | keep: only test of `lib/claude-launch.mjs` (Windows Claude resolver), used by `scripts/memory-shape-runners.mjs` → `npm run memory:shape` (README.md:53) | module | R-3470..R-3473 |
| packages/nana-pack/tests/code-search.test.mjs | keep: planner prompt instructs `npm run map:search` (prompts/planner.md:29); R-3000 pins map:check launch links. Critic missed this | module | R-3000..R-3008 |
| packages/nana-pack/tests/gate-status.test.mjs | keep (B5): R-776 gate fail-safe; nana-gate.ts:276 setStatus live | module | R-071, R-072, R-775, R-776 |
| packages/nana-pack/tests/handoff-asks.test.mjs | keep: `lib/handoff-asks.mjs` is imported by frontier-check.mjs and frontier-summary.mjs; not setup-retire scope | module | none (0 markers) |
| packages/nana-pack/tests/handoff-writer-role.test.mjs | keep: cut to one check by 9f1bde13; pins pi-review sets NANA_HANDOFF=off, read live by extensions/nana-adoption.ts:28; R-1683 is the win32 npm path | main | R-139, R-1683 |
| packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs | keep (B1): gate calls `verifierPipeReason(..., "powershell")` (nana-gate.ts:385) | main | R-1730..R-1739 |
| packages/nana-pack/tests/pwsh-oracle.mjs (helper) | keep with its importer (B1) | main | — |
| packages/nana-pack/tests/review-ledger.test.mjs | keep (B4 resolved): review-paperwork 9689fe0d retained the store suites; nana-land.mjs:16 imports `withReviewLedgerLock`; 14 fix commits; RUN_ALONE entry | main | R-623, R-714, R-837 |
| packages/nana-pack/tests/review-ledger-launch.test.mjs | keep: same lane retention; watchdog R-700 | main | R-733, R-854, R-919, R-992, R-1720, R-1721, R-2603 |
| packages/nana-pack/tests/review-ledger-state.test.mjs | keep: same | main | 30 rows (R-621, R-622, R-705, R-708..R-712, R-721, R-722, R-725, R-734, R-735, R-835, R-836, R-843, R-845, R-852, R-853, R-855, R-1370, R-1371, R-1373, R-1375..R-1378, R-1840..R-1842) |
| packages/nana-pack/tests/review-ledger-verdicts.test.mjs | keep: same | main | R-620, R-1621..R-1623, R-2568, R-2569, R-2575, R-2660 |
| packages/nana-pack/tests/review-timeline.test.mjs | keep: review-paperwork "retain timeline texts"; `bin/review-timeline.mjs` README-named (pack README:487) | module | R-1560..R-1565, R-2570 |
| packages/nana-pack/tests/runtime-land.test.mjs | keep: nana-land.mjs:348 still runs the local suite with NANA_LAND_TIP when CI cannot stand in; test-locked reads it. Live fallback, not dormant | module | R-2523..R-2527, R-2532, R-2533, R-2740..R-2742 |
| packages/nana-pack/tests/suite-records.test.mjs | keep: land-ci.mjs:10 and land-ci-records.mjs:17 import suite-records.mjs; test-locked writes records | module | R-2547..R-2555 |
| packages/nana-pack/tests/ts-syntax-check.test.mjs | keep: `scripts/ts-syntax-check.mjs` README-named by-hand command (README.md:107); 2.4 s | module | R-993, R-994 |
| packages/nana-setup/tests/project-dismiss.test.mjs | keep (B3): `--not-a-project` live (lib/project.mjs, nana-adoption.mjs) | module | R-340 |
| packages/nana-setup/tests/retired-artifacts.test.mjs | keep (B2): grew +130 lines in setup-retire (R-3799/3803/3806/3807); retired.mjs used by steps and uninstall | module | R-661..R-664, R-666..R-669, R-804, R-1593, R-1901, R-1902, R-3799, R-3803, R-3806, R-3807 |
| packages/nana-setup/tests/verifier-pipe.test.mjs | keep: rewritten by 5fe728ec to "preserve retired-bash doctor checks and live pi predicate documentation" | module | R-2356 |

## Lane A — file retirements (one builder)

8 files, 51 cases, ~95 / 86 / 116 s serial removed (mac / win / linux; e2e files never ran in CI, 0 s). Rows flipped to `retired`: 15. Markers moved: 7.

| File | Still present | Verdict | Only-pinned rows | Cascade edits |
|---|---|---|---|---|
| apps/bench/test/retire.test.mjs (8 cases, 41.4/63.3/57 s) | yes | retire (one-time study-runner retirement pin, ecc2ad85) | R-3783, R-3784, R-3785, R-3787, R-3788, R-3789, R-3790 → retired; R-3786 → move its case into apps/bench/test/anatomy.test.mjs (anatomy CLI output, live) | REQUIREMENTS.md rows; anatomy.test.mjs gains R-3786 case; test-packs-config entry removed |
| packages/nana-pack/tests/preview-retirement.test.mjs (8, 12.1/11.1/13.1 s) | yes (edited by ba224470, 2026-11-08, a fix to the scan: upkeep cost) | retire | R-3775, R-3776, R-3777, R-3778, R-3780, R-3782 → retired (Pages shape stays pinned by pages-workflow R-2980/R-2985); R-3779, R-3781 → move cases into packages/nana-pack/tests/first-look.test.mjs | REQUIREMENTS.md; first-look.test.mjs gains 2 cases; config entry |
| apps/desk/test/stage-chain-edge.e2e.mjs (18, never collected) | yes | retire (C1: e2e never runs; edge app owner call) | none (trace ignores `.e2e.mjs`) | **packages/nana-stage/README.md:48 names this file (readme check fails)**; REQUIREMENTS.md R-283 evidence prose "also exercised live ... stage-chain-edge.e2e.mjs" (drop clause); config entry (`manual`). Leave apps/bench/studies/tool-profiles-2026-09-08 fixture copies (frozen history) |
| apps/desk/test/stage-page-edge.e2e.mjs (10, never collected) | yes | retire (same) | none | config entry (`manual`). Study task/fixture references are history |
| packages/nana-pack/tests/gate-config-robustness.test.mjs (4, 0.1/0.3/0.3 s) | yes | retire (B6 fold) | R-070, R-774 → move markers onto config-handlers-malformed.test.mjs's null-gate-array / "still blocks rm -rf headless" cases; rewrite both Evidence cells | config-handlers-malformed.test.mjs; REQUIREMENTS.md evidence cells |
| packages/nana-setup/tests/stale-copies-slow.test.mjs (2 checks, 41.1/11.3/45.6 s) | yes | retire | R-2483 → move case into packages/nana-setup/tests/stale-copies.test.mjs. R-2482 keeps its seal marker in stale-copies.test.mjs:269, so no flip, but its slow-install proof is lost (say so in the row or flip it) | stale-copies.test.mjs; R-2482/R-2483 Evidence cells |
| packages/nana-pack/tests/experiment-cut.test.mjs (1, unmeasured) | yes (added ee401fc8) | retire (ci-packs config already says retire; one-time removal guard) | R-3863 → retired | config entry |
| packages/nana-pack/tests/memory-cut-checks.test.mjs (1, unmeasured) | yes (added a9eceb1a) | retire, lower confidence: R-3864 also says the deliverables report "emits no check notes", partly live | R-3864 → retired (or move to requirements-deliverables.test) | config entry |

Lane A also must (from ci-packs landing):
- In `packages/nana-pack/lib/test-packs-config.mjs`: delete the 8 entries above and the 35 already-deleted paths if ci-packs still lists them (unverified whether its membership check tolerates missing paths). Reassign the 22 keep files from `"retire"` to the packs in the table above.
- `packages/nana-pack/tests/test-packs.test.mjs` may pin membership counts (unverified).
- Regenerate code map (`docs/code-map.md`) and requirements tree. Seat checks: `node scripts/requirements-trace.mjs`, map:check, readme check.
- No basename hits for these 8 files in code-map.config.json, RUN_ALONE, windows-skips-config, docs/components or docs/known-bugs (grepped).

## Lane B — retire-splits inside kept files (lower confidence)

Disjoint test files from Lane A. Both lanes edit REQUIREMENTS.md, so serialize them (seat rule). Every row below is only-pinned in its host file, so each case cut flips that row to `retired`.

Confirmed still present (by marker ID or title match):
- recover.test.mjs: R-2402, R-2403, R-2404 (pull heal). Tied to the kept hook CLI; drop from this lane unless the hook is cut.
- code-map-launch.test.mjs: R-3155, R-3156.
- land-ci-read.test.mjs: R-2592 (README prose). land-merge.test.mjs: R-2531 (runtime data), R-981 (README text).
- leak-scan.test.mjs: R-3748. seat-pull-off.test.mjs: R-3746 (README prose).
- linked-launch.test.mjs: R-1633.
- memory-session-end.test.mjs: R-3361, R-3362. memory-shaping.test.mjs: R-3252, R-3253.
- runtime-map.test.mjs: R-1271, R-1275, R-1277, R-1278. test-runner.test.mjs: R-1270, R-2546, R-2753, R-3433, R-2880. These are run-record cases. Recheck: Lane A keeps runtime-land and suite-records as a live fallback, which argues these stay too.
- test-runner-parallel.test.mjs: R-2885 (run-alone list contents).
- linked-claude-folder.test.mjs: R-2290, R-2291, R-2701..R-2703. pi-launch-limits.test.mjs: R-2484, R-2890..R-2895 (harness self-checks).
- state-manifest.test.mjs: R-2870, R-2871. nana-roster.test.mjs: R-2563.
- install-overlap.test.mjs: R-2263 (knowledge build after release).
- gate-survives-mutation.test.mjs: 5 "tally correct" checks. review-round.test.mjs: 2 roundFromOutPath (deprecated) checks. roster-notice.test.mjs: "a null legacy land is omitted". trust.test.mjs: "README command examples close their code fence". agent-dir-config.test.mjs: 2 "(d) ledger dir" checks.
- win32-degrade.test.mjs: 3 knowledge checks. hooks-closed-output.test.mjs: "knowledge pull hook ignores a closed stdout". install.test.mjs: 4 retired context/knowledge hook checks. These overlap the kept hook CLI and retired-hook cleanup; likely now cleanup pins. Recheck first.
- settings-merge.test.mjs: 26 titles match knowledge/verifier/legacy, but after setup-retire many pin `isRetiredKnowledgeHook`/verifier cleanup matchers (live uninstall). Do not cut without reading each one.
- doctor-detail.test.mjs: 7 `mcp.json` checks match; whether they are retired is unverified.

Gone or not found (drop): crash-paths (file deleted); claude-review R-2566/R-29xx and immutable-review R-2901/2904/2907/2908 (markers gone, rows mostly retired); land-merge R-2571/2572/2576; linked-launch R-1630; memory-making R-3195; display-surfaces handoff (0 matches); hook-producers verifier (0); path-spelling and review-launch ledger (0); frontier legacy/list-item (0 title matches; unverified by content). Also seat-rule.test and shared-link-state.test were not found under packages/nana-pack/tests (location unverified). Also credential-strip M5/M6, land-clean-merge M8/M9, project 17 seed-prose, templates-render ~37, product-report 26, requirements-lift 11, objective-injection 17 and blocks are unchecked.

Count for Lane B is not given: case-level confirmation was by marker or title only.

Claim most likely wrong: runtime-land and suite-records are live because nana-land's local-suite fallback still runs test-locked. If the owner treats that fallback as dead, both return to the retire list (36 s mac / 77 s win, 19 rows), and so do the run-record splits in test-runner and runtime-map.
