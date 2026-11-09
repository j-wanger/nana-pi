# Test retirement — build record

Feature: FEAT-031. Branch: `feat/test-retire`. Base: `0d60883f6aa9a497f2de2851ce4fee0d7376325e`.

## Parts and departures

1. `44cf620e`: six Lane A deletions, requirement/evidence cascade, anatomy and stale-copy case moves, gate marker fold, stage README, generated map.
2. `c64f8bbe`: 20 runnable files from retire to module; two listed helpers follow their importers without membership entries. Update the committed-inventory assertion for lane retirements.
3. `55130b2b`: move the three live audit/report/deliverable cases and two capture cases; delete the remaining two Lane A files.
4. `e189fbea`: `Repository checks` in the blocking macOS suite leg, once per nonduplicate workflow on feature pushes, PRs and main.
5. Sweep: remove three redundant cases, retire R-3795, retain behavioral checker cases, move two checker test files to main, and commit this evidence. All named seat checks also passed on the committed code tip before this evidence-only amendment.

Departures and reasons:

- Defer preview-retirement and memory-cut-checks deletions to part 3. Deleting them in part 1 would lose implemented markers between commits.
- The list's 15 Lane A rows include R-3777, R-3782 and R-3864, which the plan explicitly keeps. Actual Lane A retirement is 12 rows, not 15.
- The list's 22 survivors include two helpers, not 22 runnable files. All 20 runnable survivors move to module; none moves to main.
- Source has 52 case calls in the eight deleted files, not the list's 51: 24 collected checks and 28 manual browser checks. Seven collected cases move; 17 collected and 28 manual cases retire. The sweep retires three more collected cases: **48 cases removed net**, including 28 never collected by CI.
- The retained trace-output case had no finite child limit to raise. It now uses the existing shared 20-second case limit, against a measured 0.200-second checker run. The unclaimed-output case already has 240 seconds, so its existing limit needs no increase.
- Fixture checker tests, search/impact modes, and a checker's own in-process tests remain. They do not repeat the positive whole-repository validation covered by CI.
- No new tests, new requirement IDs, new sealed tunables, or production API changes. Wrong-code mutation pairs: not applicable; only existing cases move or retire.

## Every file deletion and its covering check

`pack/` below means `packages/nana-pack/tests/`; `setup/` means `packages/nana-setup/tests/`.

| Deleted file | Calls before | Cases kept elsewhere | Cases retired | Covering check / deliberately retired assertion |
|---|---:|---|---:|---|
| `apps/bench/test/retire.test.mjs` | 8 | R-3786 in anatomy | 7 | anatomy, anatomy-labels, memory-shaping, requirements-tree/regroup, product-report/deliverables and first-look own tests; CI Repository checks replaces nested validation. Fixed-base byte parity and frozen-study byte guards deliberately retire; study paths have no diff from the base. |
| `pack/preview-retirement.test.mjs` | 8 | R-3777 component-audit; R-3779/R-3781 first-look; R-3782 product-report | 4 | pages-workflow R-2980/R-2985; CI Repository checks replaces R-3778. One-time removed-path scan retires. |
| `apps/desk/test/stage-chain-edge.e2e.mjs` | 18 | none | 18 | stage blocks tests cover carrier stripping. Real-browser RPC proof deliberately retires; it was never collected by CI. |
| `apps/desk/test/stage-page-edge.e2e.mjs` | 10 | none | 10 | stage blocks and retained stage-page/stage-chain manual checks; edge-specific browser assertions deliberately retire, never collected by CI. |
| `pack/gate-config-robustness.test.mjs` | 4 | R-070/R-774 markers folded onto existing malformed-handler checks | 4 | config-handlers-malformed null gate variant; no new case. |
| `setup/stale-copies-slow.test.mjs` | 2 | R-2483 in stale-copies | 1 | stale-copies retains the 20-second R-2482 seal; the six-second slow-install proof is deliberately lost and its Evidence cell says so. |
| `pack/experiment-cut.test.mjs` | 1 | none | 1 | CI map/README/trace checks cover live graph integrity; the one-time experiment absence scan deliberately retires. |
| `pack/memory-cut-checks.test.mjs` | 1 | R-3864 in requirements-deliverables | 0 | Same report/artifact/no-notes assertions remain. |

## Rows

Retired in Lane A: R-3775, R-3776, R-3778, R-3780, R-3783, R-3784, R-3785, R-3787, R-3788, R-3789, R-3790, R-3863.

Retired in sweep: R-3795. No other status flips.

Implemented markers moved or folded: R-070, R-774, R-2483, R-3777, R-3779, R-3781, R-3782, R-3786, R-3864. R-2482 remains implemented with its reduced evidence explicitly recorded. R-283 loses only its deleted browser-evidence clause. R-3855 now names direct CI checks alongside land guards, matching the trace pack move.

## Files moved per pack

| From → to | Runnable files | Names |
|---|---:|---|
| retire → module | 2 knowledge | build-busy, hook |
| retire → module | 15 pack | build-report, claude-launch, code-search, gate-status, handoff-asks, handoff-writer-role, pipe-guard-pwsh-oracle, review-ledger, review-ledger-launch, review-ledger-state, review-ledger-verdicts, review-timeline, runtime-land, suite-records, ts-syntax-check |
| retire → module | 3 setup | project-dismiss, retired-artifacts, verifier-pipe |
| land → main | 1 pack | requirements-trace |
| release → main | 1 pack | requirements-unclaimed |

Unchanged helpers: `packages/nana-setup/tests/knowledge-state.mjs` and `pack/pwsh-oracle.mjs`. RUN_ALONE remains unchanged. Every collected/manual test has a pack; the retire pack is now empty but remains a supported pack name.

## Checker-child sweep

Scope: enumerate checker script names, their assembled basename forms, and helper launch sites across all collected package/app tests. A fixture's `--root` or copied CLI is not validation of this checkout. CI's covering step is **Repository checks**, running map, README, trace, tree (including deliverables), component audit, and records-move directly.

| Test file / case | Checker child / root | Decision and covering check |
|---|---|---|
| bench retire R-3787 | map, README, tree, audit / checkout | Retired with named file; CI Repository checks. |
| preview retirement R-3778 | map, README, tree, audit, trace / checkout, 18 s children | Retired with named file; CI Repository checks. This removes the observed audit-child timeout failure. |
| desk page-retire R-3795 | map, README, tree, audit / checkout, 20 s children | Retire case and row; CI Repository checks. Its one-time row/prose checks retire with it. Other desk cases remain. |
| code-map-land: `scripts/code-map.mjs --check exits 0 on a clean repo` | map / checkout | Retire untagged duplicate case; CI Repository checks. Header/map in-process assertion remains. |
| readme-check: `scripts/readme-check.mjs --check exits 0` | README / checkout | Retire untagged duplicate case; CI Repository checks. G-012 and negative-mode/mutation cases remain. |
| requirements-trace G-014 CLI output ordering | trace / checkout | Keep implemented and move file land → main; measured 0.200 s, shared child limit 20 s. CI does not assert output ordering. |
| requirements-unclaimed R-1663 | trace off/on / checkout | Keep implemented and move file release → main; existing 240 s child limit exceeds measured checker time with headroom. CI does not assert listing deltas or unchanged input bytes. |
| runtime-map R-1272/R-1273/R-2822 and freshness cases | map `--impact` / checkout and fixture runtime data | Keep module: behavioral query, not positive validation. No CI replacement. |
| code-search CLI search | map `--search` / checkout and fixture corpus | Keep module: behavioral query, not positive validation. No CI replacement. |
| code-map-launch R-3152/R-3153/R-3154/R-3155 | map CLI / tiny temporary roots | Keep module: invalid declarations, stale output, blind reach and edge fixtures. |
| code-map mutation and native separator cases | copied map generator / temporary copied modules | Keep module: mutation and platform behavior, not checkout validation. |
| readme-check R-656 and inline-command mutation | README modes / checkout; copied shim / temporary mutated README | Keep land: usage refusals do not walk the repository; mutation intentionally fails in a fixture. |
| linked-launch R-1631 | tree `--root` / temporary flat ledger via real/link paths | Keep module: linked-entry behavior and refusal. |
| product-report R-2543 | tree `--root` / temporary ledgers | Keep module: report/checker output equality, including bad HEAD behavior. |
| product-detail R-3681/R-3682 | tree `--root` / temporary ledgers | Keep module: rendered detail consistency. |
| product-overview checker comparisons | tree `--root` / temporary ledgers | Keep module: overview counts and notes. |
| requirements-deliverables R-2536 | tree `--root` / temporary normal, no-git and unborn roots | Keep module: HEAD path semantics and diagnostic fixtures. R-3864 remains an in-process report case. |
| requirements-lift checker invocations | tree `--root` / temporary lifted/subfolder projects | Keep module: verifies transformed fixture ledgers. |
| requirements-tree CLI modes | tree CLI / temporary or copied roots | Keep land: root, refusal, encoding, output and deliverable modes, not checkout validation. |
| land-regenerate via land-fixtures | copied map/tree / temporary merge repositories | Keep module: actual generator restoration and containment under fixture land. |
| templates-render | generated map/README/trace / temporary rendered Python/TypeScript projects | Keep main: verifies emitted projects and mutations, not this checkout. |
| templates-update | generated map/trace / temporary updated projects | Keep release: verifies emitted projects and deliberate map corruption. |
| template-acceptance | injected checker command results / temporary rendered projects | Keep release: acceptance behavior; no positive checkout checker rerun. |
| component-audit | no checker child | Own in-process tests remain; moved R-3777 uses a tiny temporary component source. |
| records-move | no checker child | Own fixture derivation tests remain; live command runs only in CI Repository checks / seat check. |
| requirements-regroup, requirements-cap-kinds, setup-retire, memory-run, handoff-issues, skill-claims | imports, copied dependencies or text references, not whole-repository checker children | Retain unchanged; no redundant checker-child case found. |

## Existing tests changed because retirement made them false

- `test-packs-ci` M8: inventory must honor committed lane HEAD deletions as well as main deletions; it still cannot excuse uncommitted disappearance.
- `test-packs-core` M6: direct CI owns trace validation, its behavioral test is main-only, and exactly the retired duplicate map CLI block is exempt from the old move-byte assertion. Every other moved block retains byte comparison.
- `code-map-launch` R-3156: explicitly name Lane A retired test sources as permitted historical edge losses.
- Moved cases use receiving harnesses, paths and shared temporary-folder helpers. The first anatomy run exposed its missing CLI cwd; restoring the original checkout cwd made it pass.

## Validation and evidence

Long output: `build.log` in this folder. Paths in logs are normalized to `~` and `$TMPDIR`.

| Command / run | Exit and result |
|---|---|
| `node scripts/test.mjs test-runner` after each deletion batch | 0 both times |
| Part 1 anatomy/config/stale/stage checks | First run 1 (anatomy cwd); anatomy retry 0; remaining files 0 |
| Part 2 20 moved runnable files plus pack tests | First run 1 (old M8 inventory); all 20 moved files passed; pack retry 0 |
| Part 3 four receiving files | 0 |
| Part 4 workflow, lane-push, pack-CI and Windows policy tests | 0 |
| Part 5 ten touched sweep/pack files | 0; 105 pass, 0 fail, 2 browser skips |
| Trace and tree after every part | 0 |
| Map and README before every commit | 0 |
| All six direct CI checker commands locally | 0 each |
| Test-packs exhaustive check | 0; 261 test/manual files, 0 unassigned, 0 stale paths |
| `npm test -- --pack=land --jobs=4` before final commit | 0; 71 files, 2364 checks passed, 6 skipped checks |
| `npm test -- --pack=land,module --changed-from=main --jobs=4` | First attempt command-window timeout at 600 s; retry exits 1 after 634.2 s: data-pack timed out at 300 s after six passing cases. Final committed-tip run exits **0**, 205 files PASS, 4935 checks pass, 0 fail, 14 skipped checks, 508.4 s. No unrelated code, assertions or limits changed between the red and green runs. |
| All named seat checks on committed code tip | Land 0 (71 files, 2364 passes); selected 0 (205 files, 4935 passes); trace/tree/map/README 0 each; exhaustive packs 0 (261 files, 0 unassigned, 0 stale). Component audit and records-move also 0. |
| `node packages/nana-setup/bin/install-check.mjs` | 0 |
| Removed-reference grep | 141 removed titles/lines/path patterns searched against every suite test directory. Hits are moved cases, explicit historical retirement reasons, unrelated basename matches and retained manual assertions; no dangling active dependency. |
| `git diff --check` | 0 |

Measured direct-check seconds locally: map 1.069, README 0.070, trace 0.200, tree 0.261, audit 4.446, records 51.191. These are local checker measurements, **not CI savings**.

Latest-main serial CI seconds removed: **unavailable**. This builder did not read CI or access credentials. The plan list's approximately 95/86/116 macOS/Windows/Linux seconds are historical at 860785c2, not the requested latest-main record, and must not be presented as that measurement. The seat must supply the latest-main record and verify CI on all applicable legs.

No lint/type scripts are declared in the root package; the README's map/README checks ran. AGENTS says CI covers the full suite, so no unlocked or locked local full suite ran. The selected run is a required filtered seat check, not a replacement full-suite claim.

## Known-bug effects and limits

Read the whole `docs/known-bugs/FEAT-031.md`; edit/delete no known-bug line.

- The known records-move cost is now paid once as a direct CI command, outside test harness timers; locally it took 51.191 s. Its derivation limitations remain.
- The stale-copy slow-install meta-proof deliberately retires; its child-limit seal remains. The R-2483 diagnostic meta-run remains, including its known hook-kill/linked-Claude exposure. A recursion guard prevents it from rerunning itself inside its child.
- The requirements-deliverables 10-second git limit remains unchanged.
- The review-ledger/hook run-alone entries remain unchanged; PR selection now reaches their kept tests.
- The observed preview audit-child timeout path is removed. No claim that unrelated Windows flakes are fixed.

## Not done

No push, issue changes, model sessions, CI reads or credential access. No latest-main CI timing record. The untouched release test timed out on earlier runs, then passed at the unchanged default limit; the cause is not established. Native Windows and this tip's hosted CI remain for the seat.
