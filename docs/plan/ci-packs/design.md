## 1. The packs

| Pack | Definition | Runs on | Command | Files | Cases |
|---|---|---|---|---|---|
| land | Fast checks of a core contract, or a regression of one. Every core capability has at least one. | Every PR push (the lane's CI), macOS + Windows blocking, Linux advisory; also every main push | `npm test -- --pack=land --jobs=4` | 62 (48 tests + 14 helpers or rails) | 1,208 |
| module | Real behaviour, but only breakable by a change to the files it covers. | PR: impact-selected from the lane's diff (section 4). Main: whole pack nightly (cron) | `npm test -- --pack=module --changed-from=origin/main --jobs=4`; nightly `--pack=module` | 105 | 1,801 |
| main | Platform, integration and slow core checks. Change rarely, catch real drift (Windows, pi version, git). | Push to main after each land, all three OS; Windows leg blocks the next land (existing red-main rule) | `npm test -- --pack=main --jobs=4` (CI runs land+main on main) | 62 | 947 |
| release | Template renders, copier update, release CLI, install docs. | `npm run release` (acceptance), and PRs touching `templates/**`, `copier.yml`, `packages/nana-setup/**` | `npm test -- --pack=release --jobs=4` | 14 (3 manual/template-side) | 129 |
| retire | Delete. | never | none | 63 | 1,655 |

Case total 5,740 (matches `tests.json`). Splits moved 602 cases between packs (in: retire 372, module 144, main 54, land 27, release 5).

### CI seconds per pack (serial / wall@4)

| Pack | macOS | Windows | Linux |
|---|---|---|---|
| land | 152 / 38 | 304 / 76 | 120 / 30 |
| main | 1,044 / 261 | 1,984 / 497 | 692 / 173 |
| module (whole) | 1,382 / 346 | 2,179 / 545 | 1,013 / 253 |
| release | 91 / 56 | 407 / 330 | 67 / 47 |
| retire (removed) | 408 / 102 | 634 / 159 | 356 / 89 |
| **today, every run** | 3,073 / 768 | 5,504 / 1,376 | 2,245 / 561 |

Land wall time is bounded by `land.test.mjs` (38 s mac, 73 s win). Release wall time on Windows is bounded by `templates-update.test.mjs` (330 s).

### Before vs after

| Event | Before (serial min, mac / win / linux) | After (serial min) | After wall@4 |
|---|---|---|---|
| Lane PR, no module hit | 51.2 / 91.7 / 37.4 | 2.5 / 5.1 / 2.0 | 38 s / 76 s / 30 s |
| Lane PR, worst case (all module selected) | same | 25.5 / 41.3 / 18.8 | 383 s / 620 s / 283 s |
| Main push (land + main) | 51.2 / 91.7 / 37.4 | 19.9 / 38.1 / 13.5 | 299 s / 572 s / 203 s |
| Nightly (land + main + module) | — | 43.0 / 74.4 / 30.4 | 644 s / 1,117 s / 456 s |

The usual lane touches one feature. Its module hit is most likely a few files, so a typical lane sits near the first row (inferred; measure after the first ten lanes).

### CI shape (`.github/workflows/ci.yml`)

- `suite` job keeps its name and matrix (nana-land's `CI_ADVISORY_JOB = "suite (ubuntu-latest)"` and its stanza regex read it). Its step becomes `npm test -- --pack=${{ github.event_name == 'push' && 'land,main' || 'land,module' }} --changed-from=origin/main --jobs=4`.
- New `nightly` job on `schedule:` runs `--pack=module` whole, with `--post` through the main CI check on red.
- `release` step: `template-acceptance` and `npm run release` call `--pack=release`. A PR whose diff hits a release `watch` path adds `release` to the pack list.
- `install-check` job is unchanged here (it is a separate rehearsal, not a pack).

## 2. Land pack guards every core capability

| Core capability | Land-pack files (cases moved by split marked *) |
|---|---|
| Setup: install | install, settings-merge, fsops, paths, agent-dir-consumers, pi-registration (matcher part), project-key, project-working-region |
| Setup: uninstall | uninstall (core cases) |
| Setup: doctor | doctor-runtime (pi and pi-review PATH rows), doctor-detail* (Node floor seals) |
| Claude Code hooks | hook-producers (fail-open), shared-memory-hook, shared-memory-input, roster-notice-hook |
| Claude Code rules | install (rule links), rulings (injection) |
| Windows | win32-launch* (forced-win32 resolution), win-shims* (sh shim R-1611/R-1617); the whole land pack also runs on the blocking Windows leg |
| Gate | gate-corpus, gate-self-protection, gate-policy-paths, gate-rm-inside, credential-gate, lane-write-guard, pipe-guard (composition), bounded-read, config-gate-fallback, config-handlers-malformed, config-trust, agent-dir-config, agent-dir-var-spellings, agent-dir-hostile* (A, A-default, B), agent-dir-parity* (single resolver) |
| Objective | objective-injection, config-normalize, objective-golden* (golden 1-5, 18, 19 as a smoke file) |
| Writing | writing-check, writing-injection* (enabled / inject / compose) |
| Rulings | rulings |
| Roster notice | roster-notice, roster-notice-hook, nana-roster |
| Frontier summary | frontier-summary |
| Adoption | adoption-producer |
| Lane loop: builder (pi-worker) | worker-lane* (refuse-before-spawn), brief-check* (R-3716..R-3718), nana-roster |
| Lane loop: reviewer (pi-review / claude-review) | review-standard |
| Lane loop: nana-land with CI | land (preflight and review authorization), ci-workflow |
| Leak scan | leak-scan* (M6: CLI blocks a hit) |
| Identity scan | identity-scan* (R-2511 tree scan + seal), main-ci |
| Requirement rows + req markers | requirements-tree, requirements-trace, `templates/typescript/template/tests/requirements-trace.ts` (the rail itself) |
| map:check | code-map* ("map is current", "--check exits 0") |
| README check | readme-check, skill-claims |
| Project templates | templates-render* (R-859 AGENTS section byte-identical), requirements-trace (template rails) |
| Page readers | first-look, outside-reader, visual-reader |
| Main CI check | main-ci |
| Issue watch | issue-watch |
| Desk app host | host-rule (skipped on Windows, as all desk tests are) |
| Data pack | none yet. Its first must-meet tests go straight into land. |

Gap until the splits are extracted: the * rows need their cases moved into small new files (e.g. `leak-scan-cli.test.mjs`, `objective-smoke.test.mjs`, `worker-lane-refusal.test.mjs`). Until that extraction lane lands, leak scan, identity scan, builder launch, objective hook parity and the template AGENTS section are guarded only on main. That is one land of exposure each, caught before the next land by the red-main rule.

## 4. Module-pack selection

Rule: a module file runs on a PR when the lane's diff can reach it.

1. Changed set: `git diff --name-only <merge-base origin/main>...HEAD`.
2. Graph: reuse `buildGraph`, `impact` and `untracedTests` exported by `scripts/code-map.mjs`, with launch links from `scripts/code-map-launch.mjs` (`addLaunchLinks`). Test modules are already mapped (six test roots, layerExempt), so `impact(graph, changed).callers` already lists the test files that import or launch a changed module.
3. Select = (callers ∩ module pack) ∪ (changed test files) ∪ (`untracedTests`, the blind-reach tests that launch something the map cannot trace) ∪ (watch-glob hits).
4. Watch globs cover inputs that are not modules: `.github/workflows/*.yml`, `packages/nana-pack/prompts/*.md`, `packages/nana-pack/rules/*.md`, `packages/nana-setup/claude/rules/*.md`, `templates/**`, `copier.yml`, `code-map.config.json`, `REQUIREMENTS.md`. Matching reuses `scripts/glob-match.mjs`.
5. Fail-safe: run the whole module pack when the graph throws, the diff cannot be read, or the diff touches `scripts/test.mjs`, the pack config, `package.json` or `code-map.config.json`. This mirrors `SUITE_FALLBACK_PATHS` in `packages/nana-pack/lib/land-config.mjs`.

Files:
- New `packages/nana-pack/lib/test-packs-config.mjs`: pack per path, watch globs, provenance per entry (sealed by one test). Precedent: `packages/nana-pack/lib/test-runner-config.mjs` (`RUN_ALONE`) and `packages/nana-pack/lib/windows-skips-config.mjs` (path → reason, frozen).
- `scripts/test.mjs`: `--pack=<list>` and `--changed-from=<ref>`; prints the selected module files and why (caller of X / watch glob / blind reach / fail-safe) so a reviewer sees the selection.
- A pack check (land): every collected test file appears in exactly one pack. A new file without a pack fails the land, so nothing silently drops out of CI.

Contracts that still speak the old "every lane runs everything" shape, and must change in the same lane:
- `packages/nana-pack/lib/land-ci.mjs` `proveCiSuite` refuses any suite record whose `filters` is non-empty ("does not prove an unfiltered run"). A pack run is filtered, so nana-land would refuse every land. It must accept a record that names its packs and selection.
- `ci-workflow.test.mjs` pins the current ci.yml shape; `CI_ADVISORY_RULE` regex in `land-config.mjs` pins the `suite:` stanza.
- `scripts/test-locked.mjs` and its records assume a whole run; the local fallback should take `--pack` too.
- `RUN_ALONE` names hook-deadlines and adoption-reader (both now main); the runner must honour it inside a pack.

