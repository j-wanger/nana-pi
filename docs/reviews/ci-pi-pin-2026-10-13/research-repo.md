# CI pin research: repo surface (read-only, 2026-10-13)

Refs read: main 7e6ce39; feat/install-check 68328cd (worktree ~/nana-pi-wt/install-check, clean; origin/feat/install-check is behind at 1d638d2);
feat/cc-hooks-windows 3f5151f (local; origin 79888d5). cc-hooks-windows does NOT touch ci.yml or ci-workflow.test.mjs (empty diff vs main).

## 1. pi install lines in .github/workflows/ci.yml

### main (7e6ce39)
- ci.yml:10-12  workflow-level `env:` block. Line 11 comment `# 1.0.2: installed and verified version, pi 1.0 adoption 2026-10-04`; line 12 `PI_VERSION: 1.0.2`.
- ci.yml:38  suite job: `- run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}` (no --ignore-scripts)
- ci.yml:39-40 suite: `Verify pi version` -> `test "$(pi --version)" = "${PI_VERSION}"`
- ci.yml:41  suite: `- run: npm test`
- ci.yml:63  release job: `- run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}`
- ci.yml:64-65 release: `Verify pi version`
- No lockfile, shrinkwrap, .npmrc or overrides anywhere (repo root has no package-lock.json; the installed pi 1.0.2 package ships no npm-shrinkwrap.json).

### feat/install-check (68328cd)
- ci.yml:10-12  same env block, same PI_VERSION 1.0.2 and comment.
- ci.yml:15-37  new `install-check` job (macos-latest, windows-latest; timeout-minutes 20; bash; no continue-on-error; no uv/pnpm; checkout without fetch-depth).
- ci.yml:30  install-check: `- run: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION}`
- ci.yml:31-32 install-check: `Verify pi version`
- ci.yml:62  suite: `- run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}`
- ci.yml:63-64 suite: `Verify pi version`
- ci.yml:87  release: `- run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}`
- ci.yml:88-89 release: `Verify pi version`
- ci.yml:68  `release: needs: [suite, install-check]`

Note: three install spellings once install-check lands (suite and release without `--ignore-scripts`; install-check, README step 2 and `PI_INSTALL_HINT` with it).

## 2. Assertions pinning those lines or PI_VERSION

### packages/nana-pack/tests/ci-workflow.test.mjs on main
- :16 reads `.github/workflows/ci.yml` as one string.
- :17-48 `// req: R-597` check "root CI runs the suite on macOS, Linux, and Windows and gates tag release":
  - :30 `assert(workflow.indexOf("pi --version") < workflow.indexOf("npm test"))` (first occurrences)
  - :31 `assert.match(workflow, /PI_VERSION: 1\.0\.2/)`  <- the only literal pin of the version (sealed-value style)
  - :32-33 slices suite (`^  suite:` .. `^  release:`) and release bodies
  - :34-47 for suite AND release: ordered substrings checkout@v4, setup-node@v4, node-version: 22, setup-uv@v5, pnpm/action-setup@v4, version: 11, and :42 `"run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}"` (substring indexOf, so a suffix after `${PI_VERSION}` still matches; a prefix flag such as `--ignore-scripts` between `-g` and the package does NOT)
- :56-76 `// req: R-1031` "suite runs on Windows with bash and the pinned toolchain": ordered substrings incl. :69 `"run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}"`, :70 `"pi --version"`, :71 `"run: npm test"`.
- :77-81 `// req: R-1032` release `needs: suite` (main) .
- :82-86 `// req: R-686` suite checkout fetch-depth 0.
- :49-55 `// req: R-996` NANA_TEST_REQUIRE_COPIER on suite only.

### same file on feat/install-check (line numbers identical through :81)
- :25 and :80 change `needs: suite` -> `needs: \[suite, install-check\]`.
- :82-92 `// req: R-1078` "install check is a blocking macOS and Windows job before suite":
  - :84 slices `^  install-check:` .. `^  suite:`
  - :91 `assert.match(job, /npm i -g --ignore-scripts @earendil-works\/pi-coding-agent@\$\{PI_VERSION\}/)` (unanchored regex; suffix allowed)
- :93-97 R-686 moves down.

### packages/nana-setup/tests/fresh-machine.test.mjs (main and install-check, identical)
- :14 imports `PI_INSTALL_HINT` from packages/nana-setup/lib/steps.mjs:815 = `"npm i -g --ignore-scripts @earendil-works/pi-coding-agent"`.
- :26-27 `// req: R-950` step 2 of README "Fresh machine (macOS)" must contain `@earendil-works/pi-coding-agent@`.
- :28 `const ciVersion = read(".github/workflows/ci.yml").match(/^\s*PI_VERSION:\s*(\S+)/m)?.[1];`  <- second reader of ci.yml PI_VERSION
- :30-31 `// req: R-951` step 2 must include `${PI_INSTALL_HINT}@${ciVersion}` -> README.md:121 is coupled to ci.yml:12 and steps.mjs:815.

### packages/nana-pack/tests/requirements-tree.test.mjs (any new row moves this literal)
- :38 and :52 leaf row total: main 1,056; cc-hooks-windows 1,070; install-check 1,071 (both lanes together 1,085 before this fix's rows).

## 3. REQUIREMENTS.md rows (exact text)

FEAT-019 "Release usable templates and report support" (main REQUIREMENTS.md:993-1013):
- R-597 (main :1009): "The root CI workflow shall run the suite on pushes and pull requests and gate the main-branch release job on suite success." implemented, evidence ci-workflow.test.mjs::root CI runs the suite on macOS, Linux, and Windows and gates tag release
  - install-check text: "The root CI workflow shall run the suite on pushes and pull requests and gate the main-branch release job on the success of the suite and install-check jobs."
- R-686 (:1010): "The root CI suite job shall check out full history for tests that compare against historical commits."
- R-996 (:1011): "The root CI suite job shall set NANA_TEST_REQUIRE_COPIER=1 on every leg." (amended 2026-10-09)
- R-1031 (:1012): "The root CI suite job shall run the suite on `windows-latest` in bash, reaching `npm test` after the same toolchain setup as the other legs."
- R-1032 (:1013): "The root CI release job shall not depend on the Windows suite leg's success."
- R-1078 (install-check only, after R-597): "The root CI workflow shall run the install check in an `install-check` job on `macos-latest` and `windows-latest`, in bash, with its pinned pi installation and version check, timeout and no continue-on-error." implemented, evidence ci-workflow.test.mjs::install check is a blocking macOS and Windows job before suite
- R-684 (:1004) Support line (mentions hosted CI legs; not affected by a pin).

Fresh-machine / install rows (SUB-011 "Select the active runtime and home"):
- R-950 (:673): "The root README shall carry one numbered macOS fresh-machine checklist whose steps name Node, the pinned pi install, this repository clone, nana-setup install, ~/.local/bin on PATH, pi-subagents, the machine objective and doctor, in that order."
- R-951 (:674): "Each version named by the fresh-machine checklist shall equal its declared source floor or CI version."

Doctor rows (FEAT-015 "Diagnose the active environment"):
- R-952 (:887): "Doctor shall report pi as OK only when `pi --version` exits 0 and the first stdout line starts with an optional `v` then three dot-separated numbers, ignoring stderr and using the win32 launch rules where applicable."
- R-1037 (:888): "Doctor's missing-pi detail shall use the exported install hint that install's missing-pi detail also uses."

Searches with no further hits: "PI_VERSION", "1.0.2", "codemode" (only R-365, mcp.json exposure, unrelated), "lockfile", "shrinkwrap", "--ignore-scripts". No row pins the transitive dependency set of the pi install. No row names PI_VERSION's provenance (G-001 asks a contract value to name its row; the ci.yml:11 comment names source+date, no row).
General rows: G-001 (:1479) tunables defined once in a declared configuration surface, read by name; G-002 provenance beside definition; G-003 a tunable change changes no code. All three `untested`.

## 4. README lines about installing pi or stating its version

readme:check (`node scripts/readme-check.mjs --check`, main): "646 claims checked; 0 problem(s)". It checks that commands/paths/flags/scripts exist; it does not check that a version-pinned install produces a working pi. READMEs in scope: readme-check.config.json lists README.md, packages/{nana-pack,nana-knowledge,nana-stage,nana-setup}/README.md, apps/{desk,bench}/README.md.

- README.md:77  desk row: "`@earendil-works/pi-coding-agent` ≥ 0.84.4 installed globally (tested on 1.0.2, 2026-10-05) ... imported in-process for session parsing"
- README.md:78  nana-pack row: pi as optional peerDependency `"*"`; "pi-dependent tests FAIL naming the locations tried when pi is absent"; DESK_PI_ROOT/DESK_PI_BIN.
- README.md:83  bench row: "≥ 0.84.4 installed globally (tested on 1.0.2, 2026-10-05) ... imported in-process"
- README.md:121 fresh-machine step 2: "Run `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2`, then `pi --version`. Do not use pi's managed installer or `pi update`; ..." (pinned by R-950/R-951)
- README.md:238 canonical coordinates (npm package name only).
- packages/nana-setup/README.md:19 runtime dependency: globally installed pi package (used for pi's exported project-trust API).
- packages/nana-setup/README.md:70 "Upgrade pi itself with `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@<version>`. Never run targetless `pi update` ..."
- packages/nana-setup/README.md:409 says root CI sets NANA_TEST_REQUIRE_COPIER "on both suite legs" (there are three legs; adjacent stale claim, not part of this fix).
- packages/nana-pack/README.md:6 dependency line (pi itself); :77 "Tested host since 2026-10-05: pi 1.0.2"; :920 "the installed pi 1.0.2 runner".
- apps/desk/README.md:25 "`@earendil-works/pi-coding-agent` 1.0.2, installed globally (`npm i -g @earendil-works/pi-coding-agent@1.0.2`; tested on 1.0.2 since 2026-10-05 ...)" — no --ignore-scripts.
- apps/desk/README.md:89-90 sample startup line "nana code: pi 1.0.2 — ...".
- apps/bench/README.md:11 "**1.0.2** (`npm i -g @earendil-works/pi-coding-agent@1.0.2`; tested 2026-10-05; ...)"; :12-13 "ships inside pi 1.0.2" / "pi 1.0.2"; :26 "Nothing to install beyond ... (`npm i -g @earendil-works/pi-coding-agent`)" (unpinned).
- packages/nana-knowledge/README.md, packages/nana-stage/README.md: no pi install or version line.
- feat/install-check adds: README.md:25 and :177 (CI release gating text), AGENTS.md:39, packages/nana-setup/README.md new "## Install check" section (no version stated).

Claims now untrue for a fresh install (inferred from the CI desk failures "nana code: cannot start" and the import chain below, not run locally): README.md:121, apps/desk/README.md:25 and apps/bench/README.md:11 install pi 1.0.2 that resolves pi-codemode 1.2.0, whose dist/index.js will not import, so the desk refuses to start and the bench's in-process export load fails.

## 5. Where CI tunables live

- The only declared surface for workflow values is the workflow-level `env:` block, ci.yml:10-12 (main and install-check), holding PI_VERSION with a source+date provenance comment. The R-597 test pins its literal (ci-workflow.test.mjs:31); fresh-machine.test.mjs:28 reads it by name.
- Every other workflow value is an inline literal at point of use: node-version 22 (:33, :58), pnpm `version: 11` (:37, :62), action versions, matrix os lists, `timeout-minutes: 20` (install-check :21). These are pinned by ci-workflow.test.mjs substrings, not read by name.
- Related declared constants outside ci.yml: `PI_INSTALL_HINT` packages/nana-setup/lib/steps.mjs:815 (unversioned install command; R-1037); `PI_MIN_VERSION = "0.84.4"` apps/desk/pi-session.mjs:68 and apps/bench/lib/pi-exports.mjs:54; `DESK_NODE_FLOOR = "22.19"` doctor.mjs:134; `PI_SUBAGENTS_FLOOR = "0.75.0"` doctor.mjs:163; install-check's sealed contract module packages/nana-setup/lib/install-check-config.mjs (branch only; SPAWN_TIMEOUT_MS etc., "Chosen 2026-10-12" style provenance).
- Constraint: GitHub Actions `env:` values are strings usable in `run:` and `${{ env.X }}`; a second version value (e.g. a codemode pin) would sit naturally beside PI_VERSION in ci.yml:10-12. fresh-machine.test.mjs:28 matches `^\s*PI_VERSION:` only, so a differently named key does not disturb it.

## 6. Highest requirement IDs

- main: R-1043 (R-1044–R-1049 were offered to the product-report lane for splits, build-brief-11; unused on main — do not reuse without a ruling).
- feat/cc-hooks-windows (landing now): R-1064; block R-1050–R-1069, R-1065–R-1069 reserved for its splits.
- feat/install-check: R-1084; block R-1070–R-1089 (R-1085–R-1089 reserved for its splits).
- origin/feat/pi-cmd-launch (already merged to main via c22bab5): R-1039.
- First free ID for this fix: R-1090. Non-row text in REQUIREMENTS.md mentions no R-1xxx block beyond R-1000/R-1001/R-1008.

## 7. Tests that import pi's module graph (what the drift breaks)

Mechanism (checked on this Mac's pi 1.0.2 install with a static relative-import walk): the `pi` bin is dist/bundle/cli.js, which inlines pi-codemode (MCP_TYPESCRIPT_PREAMBLE lives in dist/bundle/chunks/chunk-SYF2TF6W.js), so `pi --version` and RPC sessions survive. The package main dist/index.js reaches the external module: dist/index.js -> dist/extensions/codemode/index.js -> dist/extensions/codemode/tool.js -> `@earendil-works/pi-codemode/declarations`. Deep imports dist/core/trust-manager.js, dist/core/session-manager.js and dist/core/tools/path-utils.js do not reach it (static walk; inferred safe). Our extensions import pi only as `import type` (erased).

Failed on macOS in run 38347800159 (79888d5, post-drift; 137 files: 117 PASS, 18 FAIL), log saved at scratchpad/ci-pin/macos-79888d5.log:
- packages/nana-pack/tests/config-project-gate-fallback.test.mjs (:34-36 imports dist/index.js via findPiRoot)
- packages/nana-pack/tests/config-trust.test.mjs (:26, :77)
- packages/nana-pack/tests/objective-golden.test.mjs (:18-20)
- packages/nana-pack/tests/post-edit-file-queue.test.mjs (:49 packageIndex dist/index.js through pi's bundled jiti)
- packages/nana-pack/tests/agent-dir-parity.test.mjs (starts apps/desk/server.mjs)
- apps/desk/test/pi-087-entries.test.mjs, pi-session-parity.test.mjs (loadPiSession -> import entryPoint, apps/desk/pi-session.mjs:355-358)
- apps/desk/test/{app-listener, buffer-caps, changes-endpoint, crash-paths, host-rule, origin-rule, prompt-detach, spawn-and-persist, stage-key-persistence, teardown-invariants, usage-line}.test.mjs (spawn apps/desk/server.mjs, whose startup calls loadPiSession at server.mjs:125 -> "nana code: cannot start")
- Not in `npm test` but same path: every apps/desk/test/*.e2e.mjs that starts server.mjs (scripts/test.mjs runs *.test.mjs only).
- Production code on the same path: apps/desk/server.mjs:125 (desk startup), apps/bench/run.mjs:856 -> apps/bench/lib/pi-exports.mjs:132-166 (bench).

Touch pi but passed post-drift: handoff-staleness (path-utils.js deep import), post-edit-status (30 pass, 1 skip), pi-install, nana-setup project/restore/trust (trust-manager.js deep import), desk pi-resolution and pi-rpc-contract, bench usage.test (90 pass; injected importer), desk-service, doctor-detail, code-map.

Run history: 38262900510 main 7e6ce39 macOS success (pre-drift); 38313718241 5143063 started 2026-10-12T21:56Z macOS success; 38333416292 6abc2e8 (01:42Z), 38339959569 e5095f9 (03:04Z), 38347800159 79888d5: macOS failure. Linux/Windows legs fail in all five (non-blocking).

## 8. Files the fix must touch (surface, not a design)

- .github/workflows/ci.yml (main :10-12, :38, :63; install-check :10-12, :30, :62, :87)
- packages/nana-pack/tests/ci-workflow.test.mjs (:31 literal pin; :42, :69 substring pins; install-check :91)
- REQUIREMENTS.md FEAT-019 (R-597/R-1031/R-1078 neighbours; new row from R-1090) and docs/requirements-tree.md via `npm run req:tree`; requirements-tree.test.mjs leaf total literal (:38, :52)
- README.md:121 + packages/nana-setup/tests/fresh-machine.test.mjs:28-31 + steps.mjs:815 if the user-facing install command changes; apps/desk/README.md:25 and apps/bench/README.md:11 (same false-for-fresh-install claim)
- docs/code-map.md if any module header changes (`npm run map`).
