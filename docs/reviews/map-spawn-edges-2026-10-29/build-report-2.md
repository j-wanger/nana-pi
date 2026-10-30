# map-spawn-edges — build 2 technical record

Feature: FEAT-029 · Navigate code and investigate impact

Code commit: `85e51381`. The final evidence commit changes only this lane's records. Lane class: `ordinary`.

## Contract and files

Requirements changed before tests, then implementation: new R-3149, R-3150 and R-3152–R-3160; amended R-1272 and R-2822. All thirteen rows are implemented with backticked `file::title` evidence. R-3151 remains unused. No feature, capability, artifact or shared-row placement changed; `docs/requirements-tree.md` updates the outline counts.

- `scripts/code-map-launch.mjs`: lexical launch discovery, balanced arguments, local/imported anchored constants, exact literal paths, helper-call bindings and explicit unresolved/repo-code sites; reciprocal sorted edges under every mapped root.
- `scripts/code-map-launch-config.mjs`: sealed launch names, path-preserving calls, repo-code programs, inline flags and impact labels, with provenance.
- `scripts/code-map.mjs`: enriched written map/check/static impact, marked launch-only callers, blind-reach closure, reasoned declaration validation, and an explicit import-only artifact-radius note. `repoGraph()` and the shipped template remain import-only.
- `code-map.config.json`: 57 reasoned `launchAlwaysRun` declarations. These do not resolve or exempt sites; they keep dynamic and repo-code programs visibly always-run.
- `docs/code-map.md`: regenerated, 497 modules, including the shared git fixture module.
- `README.md`: consumer-facing contract, unresolved behavior and unchanged graph readers.
- `packages/nana-pack/tests/git-fixtures.mjs`: only `gitShow` moved, with the required six-tag header and named export. Its body, bounds, root and missing-history assertion text are unchanged.
- `packages/nana-pack/tests/code-search.test.mjs`: imports `gitShow`; no test assertion or title changed. The fixed-history quality behavior (R-3002, with the R-3007 floor) stays unchanged.
- `packages/nana-pack/tests/code-map-launch.test.mjs`: only the seven must-meet cases, four vocabulary seals and one new impact-label seal. Temporary fixture writes use the OS temp directory. Each async case is awaited under the imported `withinCaseLimit`; child runs have a finite timeout. R-3149 runs LF and CRLF/trailing-space-or-tab/no-final-newline sources.
- `packages/nana-pack/tests/code-map.test.mjs`: existing untraced-line assertion now counts actual `*.test.*` files using enriched callees and the shim's label; its title and R-861 marker remain unchanged. Template scaffold assertions remain unchanged.
- `packages/nana-pack/tests/runtime-map.test.mjs`: R-1272 and R-2822 titles reflect the launch-aware shim block. R-2822 now requires the real untraced/blind labels to exist and precede artifacts; the former missing-string comparison was vacuous. Its existing MM9 copied-shim fixture also copies the new config dependency. No other assertion changed.
- Lane `scan.mjs` and `replay.mjs`: built mode really uses the built linker; the old-linker baseline is loaded from `57167e92` rather than accidentally using the current implementation on both sides. `scan.mjs` now gets built site lists and prints the union blind-reach share.

## Every new test and its row

In `packages/nana-pack/tests/code-map-launch.test.mjs`:

| Row | Exact title |
|---|---|
| R-3149 | R-3149: anchors and exact launch literals link reciprocally without temporary-anchor guesses |
| R-3150 | R-3150: helper bindings resolve per site and non-launching references add no edge |
| R-3152 | R-3152: unresolved sites are numbered without guessing and stale lists fail check |
| R-3153 | R-3153: impact marks launch-only callers and reports enriched blind reach |
| R-3154 | R-3154: launch-only tests count as traced with one untraced of three |
| R-3155 | R-3155: repo-code programs require reasoned declarations and remain in blind reach |
| R-3156 | R-3156: every fixed-base callee survives or has a named loss reason |
| R-3157 | seal: R-3157 launch names |
| R-3158 | seal: R-3158 path-preserving calls |
| R-3159 | seal: R-3159 repo-code programs |
| R-3160 | seal: R-3160 inline-code flags |
| R-3153, R-3154 | seal: launch impact labels |

Amended existing titles in `packages/nana-pack/tests/runtime-map.test.mjs`:

- `R-1272: with runtime data, impact prints the launch-aware shim block, then artifacts, then measured tests longest first with seconds and FAIL labels, a zero line and the not-counted closing line`
- `R-2822: impact prints the launch-aware shim block, then the artifact block with its closing note, then the runtime block`

## Wrong-code pairs and closures

The first run of the new file against the original linker exited 1: R-3149, R-3150 and R-3152–R-3155 failed, as did the missing configuration seals. R-3156 correctly passed against the original linker.

Before writing the replacement implementation, the code was then broken with an immediate `return graph` in `addLaunchLinks`, plus empty exported configuration arrays/labels. All twelve checks failed (exit 1), including R-3156 naming `scripts/first-look.mjs -> scripts/product-report.mjs`. Assertions were not inverted. `wrong-code.txt` records that run. Restoring the implemented code gives all twelve PASS (exit 0), recorded in `touched-tests.txt`.

Mutation pairs:

- No launch inference -> anchored, helper, unresolved, impact, untraced and declaration cases red -> exact inference and shim output green (R-3149, R-3150, R-3152–R-3155).
- Import-only early return -> fixed-history edge preservation red -> retained edges plus explicit reasoned losses green (R-3156).
- Empty vocabulary/labels -> each of five independent seal checks red -> sealed settings green (R-3157–R-3160, R-3153/R-3154 label seal).

Closed build failures:

- The shared `gitShow` move resolves build 1's private-helper blocker without copying the function.
- The inline-import fixture declares its nonexistent raw-parser path ignored, following the existing fixture-ignore precedent; its launch still has no graph edge.
- A named-import fixture uses the existing placeholder convention so the unchanged import parser does not fabricate a real-checkout import.
- The draft final-check log captured Node diagnostics containing machine paths, making its identity scan exit 1. Rerunning those checks with `NODE_NO_WARNINGS=1` removes only those diagnostics; the clean final log and tracked-file identity scan exit 0.
- The first locked full run found the inert fixture text spelling a direct temp allocator. Assembling that fixture spelling fixes the source audit without changing `test-runner.test.mjs` or weakening its assertion. The targeted rerun passes 52 runner checks.

## Built measurements beside the prototype

`measure-built.txt` records `npm run map:measure` at code tip `85e51381`, exit 0, 240 measured files. `scan-built.txt` is the required subsequent built scan; `scan-fixed-runtime.txt` preserves the comparison against the original `57167e92` runtime data. Both runtime datasets give the same gap counts below.

| Measure | Prototype | Built |
|---|---:|---:|
| mapped test files | 239 | 240 |
| tests holding an actual launch | 156 | 156 |
| import edges | 1326 | 1336 |
| old-linker non-import edges | 127 | 127 |
| new non-import edges | 325 | 321 |
| lost old-linker edges | 7 | 11 |
| runtime gap: files / entry points / distinct modules | 12 / 30 / 22 | 18 / 43 / 23 |
| always-run blind reach | 170/239 (71%) | 165/240 (68.8%) |

The built source reader does not count definitions, comments, quoted fixture programs or regex literals as executable launch calls. This removes prototype noise but also reveals four extra losses from a function definition the old linker mistook for a call.

Every lost edge (full paths in `scan-built.txt` and the R-3156 test):

| Source | Target | Reason |
|---|---|---|
| nana-pack/tests/objective-golden.test.mjs | nana-pack/bin/nana-objective.mjs | Wrong basename guess; the hook is the real target. |
| nana-pack/tests/review-standard.test.mjs | nana-pack/bin/pi-review.mjs | Temporary pack copy. |
| nana-setup/tests/copy-record.test.mjs | nana-setup/bin/nana-setup.mjs | Temporary repository copy. |
| nana-setup/tests/hooks-win32-exec.test.mjs | nana-knowledge/bin/nana-knowledge.ts | Command text for a deleted checkout. |
| nana-setup/tests/hooks-win32-exec.test.mjs | nana-setup/bin/nana-setup.mjs | Temporary worktree copy. |
| nana-setup/tests/pi-registration.test.mjs | nana-setup/bin/nana-setup.mjs | Twice-bound `pkg` does not trace. |
| nana-setup/tests/stale-copies.test.mjs | nana-pack/bin/nana-adoption.mjs | Wrong basename guess; the hook is the real target. |
| nana-setup/lib/hook-producer.mjs | nana-pack/bin/nana-adoption.mjs | No sealed launch call; injected `run` is outside the call vocabulary. |
| nana-setup/lib/hook-producer.mjs | nana-pack/bin/nana-frontier-summary.mjs | Same definition-only false positive. |
| nana-setup/lib/hook-producer.mjs | nana-pack/bin/nana-objective.mjs | Same definition-only false positive. |
| nana-setup/lib/hook-producer.mjs | nana-setup/bin/stale-copies.mjs | Same definition-only false positive. |

The last four extend the plan's seven-entry list; this is an explicit departure permitted by R-3156's reporting clause. The hooks that call `runHookProducer` are declared blind; the builder does not guess their object-shaped configuration. These losses explain the worse runtime gap versus the prototype. The gap's remaining entry points are listed individually in `scan-built.txt`: self-relaunch, pi-loaded extensions, installed hooks, temporary copies and browser/inline-loaded modules remain separate signals, not invented static edges.

Built-map search quality: `0.872143`, versus the unchanged fixed-history mean `0.778810`, floor `0.75`; all ten per-need shares are in `search-built.txt`. No search-edge filtering was needed.

### Failed-CI replay

`replay-built.txt` records all 154 failed PR runs in the same 182-run window, 4363 (run, leg, file) pairs, 1477 red-on-base exclusions, one unmapped-file exclusion, zero unknown bases. Of the 2885 included pairs, edge selection catches 533, blind reach adds 1736, and 616 remain missed. The prototype caught 534 by edges, added 1823 by blind reach and missed 528. The wider missed set is reported, not called a safety improvement.

| Class | Prototype total | Built total | Built macOS | Built Linux | Built Windows |
|---|---:|---:|---:|---:|---:|
| changed test | 199 | 199 | 10 | 11 | 178 |
| imports | 218 | 218 | 35 | 41 | 142 |
| old launch links | 66 | 66 | 8 | 7 | 51 |
| new edges | 51 | 50 | 10 | 9 | 31 |
| always-run blind reach | 1823 | 1736 | 143 | 133 | 1460 |
| missed: outside map | 339 | 399 | 1 | 25 | 373 |
| missed: unreached | 189 | 217 | 3 | 10 | 204 |
| red on base | 1477 | 1477 | 112 | 128 | 1237 |

Since 2026-10-24 (`replay-built-since.txt`): 22 PR runs, 37 pairs, 27 Windows-only. Built: 26 changed tests, one import, one old launch, two new edges, seven always-run, zero missed and zero red-on-base. Prototype: three new-edge pairs and six always-run; the other counts are identical. Raw records retain only run, short SHA, branch, leg, file and classification. The identity scan passed each output; the branch vocabulary and six-field record shape were hand-checked, with no account fields.

## Precedent adherence and departures

1. Kept the launch linker's single enriched-graph pass, balanced argument reader, constant following and reciprocal sorted edges. Replaced character/regex-only launch discovery with token-aware discovery because the brief explicitly excludes comment, regex and definition matches; did not lift the prototype's APPROX helper search. Function ranges and actual helper call sites replace the nearest-preceding-function approximation.
2. The shim still delegates imports, graph validation, impact walking, base formatting and map rendering to named template exports. It augments rather than copies those implementations. Added exported `repoMain` so fixture CLIs exercise the shim's static modes against an injected root. The template remains byte-unchanged.
3. Followed the sealed-search-config pattern: named frozen exports, provenance and independent seal tests. Impact labels are one additional sealed object with its own test.
4. Followed the temporary fixture and fixed-revision comparison pattern. Per the seat's explicit decision, moved only `gitShow` into `git-fixtures.mjs`, with a six-tag header like `report-fixtures.mjs`; both callers import it. Reused the latter's exported async deadline helper rather than copying it.
5. Extended the named-loss list by the four `hook-producer.mjs` edges above. Correctly rejecting a function definition removes those old false-positive launch edges; the actual injected `run` spelling is not a sealed launch name.
6. Repaired the seat measurement scripts' built-mode routing and pinned the old implementation for their baseline. Without this, replay still ran the prototype and scan lost its site data; using the newly rewritten linker for the old side would report zero losses.
7. Kept the real-checkout runtime ordering tests; changed only the false wording/order assertion and MM9's new copied dependency. Kept the template untraced wording checks untouched.

## Commands and exit codes

- Initial new-test run against old code: `node packages/nana-pack/tests/code-map-launch.test.mjs` -> 1.
- Import-only/empty-config wrong-code run of the same command -> 1; all twelve checks red (`wrong-code.txt`).
- Built new-test run -> 0; twelve checks green.
- First touched run -> 1, due solely to the fixture's fabricated named import; corrected as above.
- Final touched command: `npm test -- code-map code-search runtime-map blast-radius component-audit requirement-rows test-runner.test` -> 0; **8 files: 8 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 160 pass, 0 fail, 0 skip**.
- First plain foreground `npm run test:locked` -> 1; 8739 pass, one fixture-source-audit failure, 44 skip. No unrelated test was changed.
- `npm run map:measure` at `85e51381` -> 0; **240 files: 238 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8740 pass, 0 fail, 44 skip** (`measure-built.txt`). It holds the existing machine-wide lock.
- `MAP_EDGES=built node docs/reviews/map-spawn-edges-2026-10-29/scan.mjs` -> 0.
- `MAP_EDGES=built node docs/reviews/map-spawn-edges-2026-10-29/replay.mjs --rows` -> 0; same command with `--since 2026-10-24` -> 0.
- Built ten-need search measurement -> 0; mean 0.872143.
- `npm run map`, `npm run req:tree`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/identity-scan.mjs` and the lane-class command -> 0 during build.
- Final plain foreground `npm run test:locked` -> 0; **240 files: 238 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8740 pass, 0 fail, 44 skip · 581.8s**. It held the machine lock. Summary and Done-when checks are recorded in `final-checks.txt`; the final report supplies the finished CI run after push.

## Known-bug context and work not done

No known-bug file, HANDOFF or session archive was edited. No GitHub issue was created, edited, commented on or closed. The issue-268 defaults were followed without adding resolution heuristics or selection policy.

Touched context retained: the blast-radius page and other graph readers still use imports only; artifact marks retain their import-only radius, now stated in output; map search consumes changed written neighbors, with the built measurement above. The historical search-floor limitation remains a hypothesis, not a general quality claim. The pre-existing older-Node R-1272/R-2822 degradation issue is not fixed by these output-order amendments.

For the seat at land, the plan's residual lines still need recording in the feature's known-bug file (builder edits there are forbidden): unchanged templates; unchanged other graph consumers and artifact radius; module-wide path false positives; no npm-script/bin-name inference; unmapped workflows/config/templates/HTML and no machine-readable selector output; self-relaunch, manifest-loaded extensions, settings-loaded hooks, temporary copies and browser-loaded code. The four extra hook-producer losses also remain a named residual. These are not claimed closures.

This lane does not change CI selection, add a declaration-based resolver, link temporary-copy tails, enrich `repoGraph()`, run a model/reviewer session, merge, land, or touch the frozen desk implementation. Review and land remain the seat's work.
