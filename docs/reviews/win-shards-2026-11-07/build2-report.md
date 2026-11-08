# Windows on main only — build 2

Branch: `feat/win-shards`. Base (build 1 retained): `1e030ecd1d8c238d7ab0a8c13cbab948b404bcae`.
The final response records this build's full tip and checks repeated on that commit.

## Result and files

- M10 / R-3824: `.github/workflows/ci.yml` selects PR matrices containing macOS and Linux suites and macOS ceiling/floor install checks. Main pushes additionally select all three Windows shards and both Windows install checks. Matrix selection avoids allocating Windows runners on PRs.
- M11 / R-3825: `packages/nana-pack/lib/land-ci.mjs` exports `requiredCiJobs` and `toolkitCi`. `packages/nana-pack/bin/nana-land.mjs` requires macOS suite/install jobs and accepts a lane without Windows. Windows seats use the macOS suite proof. Linux remains advisory.
- M12 / R-3826: `packages/nana-pack/lib/main-ci.mjs` checks the newest push run, including unfinished and cancelled newest runs instead of hiding them behind an older result. The land imports this existing report implementation and requires its run to cover captured main. Both readers share required-job validation and existing shard aggregation. `packages/nana-pack/lib/land-config.mjs` declares the toolkit identity, proof platform and job vocabulary; the seal test pins them. Adopted projects retain their existing job contract.
- M13 / R-3827: release still depends on suite, install-check and each successful Windows shard output. `packages/nana-pack/rules/nana-rulings.md` records the exact dated ruling. `AGENTS.md`, `README.md`, `packages/nana-setup/README.md`, `packages/nana-pack/README.md` and `templates/_shared/working-under-nana-pi.md` explain the policy. The shared bytes and AGENTS marker region match.
- New tests: `packages/nana-pack/tests/win-main-only.test.mjs` contains only M10–M13 and the policy seal. Every case is awaited with a case limit. Fixtures use the existing land-fixture helpers and their `tmpDir` helper, never the repository. No seat script is run, imported or copied.
- Generated files: `docs/code-map.md`, `docs/requirements-tree.md`.
- Evidence: this folder's `build2-*.log` files. No build-1 file or test was deleted.

Additional reworded rows: R-3817, R-3818, R-3820, R-3431, R-684, R-1078, R-2711 and R-3183. R-3820 remains planned: measurement now concerns main push runs, not PRs. No new IDs outside R-3824–R-3827 were used.

## Existing test edits

- `packages/nana-pack/tests/win-shards.test.mjs`: M3 and M7 read the dynamic JSON matrix instead of the old YAML list. Its shared CI fixture supplies the other platforms and install jobs. M4, M5 and M8 assertions remain intact.
- `packages/nana-pack/tests/ci-workflow.test.mjs`: R-597 (two cases), R-1530, R-2711 and R-1078 inspect main's event-selected matrix. All runner, upload, release and advisory checks remain.
- `packages/nana-pack/tests/main-ci.test.mjs`: R-3183 now requires the newest unfinished/cancelled main run to block instead of selecting an older finished run. Cancelled runs still never post. Its fixture includes install jobs; its requirement evidence follows its renamed title.
- `packages/nana-pack/tests/templates-render.test.mjs`: R-684 pins the new identical Support line.
- `packages/nana-pack/tests/land-clean-merge.test.mjs`: R-3696/R-3712's M9 pins the new stop-on-red policy sentence.

No other existing test was edited.

## Wrong-code / repaired pairs

All mutations change code or rules, never assertions.

| Case | Wrong implementation | Wrong exit | Repaired exit |
|---|---|---:|---:|
| M10 | Original workflow allocates Windows on PRs | 1 | 0 |
| M11 | Original land accepts absent/failed required macOS jobs | 1 | 0 |
| M12 | Original land ignores red main | 1 | 0 |
| M13 | Original rules omit the main-only ruling | 1 | 0 |
| Policy seal | Change `CI_TOOLKIT_NAME` to `wrong-toolkit` | 1 | 0 |
| M11 / platform seal | Existing Windows-seat code falls back locally without a Windows PR record; proof-platform declaration absent | 1 | 0 |

Commands: `node packages/nana-pack/tests/win-main-only.test.mjs` for each pair. `build2-wrong-first.log`, `build2-seal-mutant.log` and `build2-platform-wrong.log` retain the wrong runs. `build2-touched-final.log` records the repaired run.

## Checks before commit

All commands ran in the lane worktree on macOS.

| Command | Exit | Result / evidence |
|---|---:|---|
| `npm run map` | 0 | 618 modules; `build2-map.log` |
| `npm run map:check` | 0 | 0 problems; `build2-map-check.log` |
| `npm run req:tree` | 0 | 0 problems, 2586 rows, 43 features; `build2-req-tree.log` |
| `npm run readme:check` | 0 | 1084 claims, 0 problems; `build2-readme-check.log` |
| Touched path-filtered command below | 0 | 19 files, 401 checks passed; `build2-touched-final.log` |
| `node scripts/test.mjs test-runner` | 0 | 2 files, 64 checks passed; `build2-test-runner.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 | All Mac install probes passed; `build2-install-check.log` |

Touched command:

```sh
node scripts/test.mjs packages/nana-pack/tests/land- packages/nana-pack/tests/main-ci.test.mjs packages/nana-pack/tests/ci-workflow.test.mjs packages/nana-pack/tests/win-shards.test.mjs packages/nana-pack/tests/win-main-only.test.mjs packages/nana-pack/tests/ci-records.test.mjs packages/nana-pack/tests/ci-wait.test.mjs packages/nana-pack/tests/templates-render.test.mjs packages/nana-pack/tests/requirements-trace.test.mjs packages/nana-setup/tests/project-working-region.test.mjs packages/nana-setup/tests/rulings-install.test.mjs
```

Earlier touched runs were red: `build2-touched.log` exposed a shared-region install-check wording restriction. Removing the extra shared install-check sentence preserved R-1109 without weakening its test. `build2-touched-green.log` had 401 passing checks but failed the runner's repository-write guard because a concurrent generator changed the tracked map/tree. Generators now run before tests; the sequential final run passed.

The full local suite did not run: AGENTS explicitly delegates it to CI. No push, CI read, issue operation or stored-credential access occurred. Hosted Windows wall times remain for the seat to measure on main. No separate root lint/type command exists for these JavaScript changes.

## Precedent and callers

All four named precedent files were read before design. The changes reuse `mainCi`, `ciSuiteLegs`, `proveCiSuite`, and the existing fixture/tmp-dir helpers rather than copying them. New named-job and manifest predicates live in the existing precedent `land-ci.mjs`, not a new shared module.

Departures: event-selected JSON matrices replace static YAML lists so Windows jobs do not exist on PRs; required-job validation supplements aggregate workflow conclusions to detect missing legs; the main report selects the newest run rather than an older finished non-cancelled run so pending/cancelled main cannot authorize a land. The toolkit manifest scopes nana-pi-specific names away from adopted projects.

Callers checked: `bin/nana-main-ci.mjs` still consumes the report's code without changes. `bin/nana-land.mjs` is the new shared-report caller. Existing main-ci and win-shards fixtures were updated as listed above. Other main-report references construct its command, not its return value.

## Known-bug context touched

The full `docs/known-bugs/FEAT-008.md` was read. The clean-merge A9 exposure allowing stacked lands before main reports is closed for nana-pi's helper: captured main now needs its matching passing push run. Linux remains advisory. The separate A7 snapshot race and the 100-run list limit remain unchanged. The known-bug file was not edited, per the lane rules.

No open owner question remains. Nothing was pushed; the seat owns hosted checks and timing measurement.
