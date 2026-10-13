# CI failure attribution: pi-codemode 1.2.0 drift (2026-10-12T23:00:01Z)

Read-only research, 2026-10-13. Sources: `gh run view <id> --json jobs`, `gh api repos/j-wanger/nana-pi/actions/jobs/<job>/logs`; parsed from the suite runner lines `FAIL  <file>` and the `| FAIL <title>` lines under them. Raw logs and parse: `attr/` beside this file (`attr.json`, `*.txt`).

Classes: **a** = failed before the drift too (pre-existing); **b** = newly failing after 2026-10-12T23:00Z, caused by the `MCP_TYPESCRIPT_PREAMBLE` SyntaxError; **c** = newly failing for another reason.

## Runs

| run | code under test | started (UTC) | drift | macOS FAIL files | Ubuntu FAIL files | Windows FAIL files | macOS checks | run conclusion |
|---|---|---|---|---|---|---|---|---|
| 38262900510 | 7e6ce39 (main push) | 14:26Z 10-12 | pre | 0 | 1 | 68 | checks: 6851 pass, 0 fail, 8 skip | success |
| 38313718241 | 5143063 lane, merge 3a3ad89 | 21:56Z 10-12 | pre | 0 | 1 | 67 | checks: 6955 pass, 0 fail, 8 skip | success (ubuntu+windows non-blocking) |
| 38333416292 | 6abc2e8 lane, merge f1bf047 | 01:42Z 10-13 | post | 18 | 19 | 69 | checks: 5126 pass, 6 fail, 8 skip | failure (macOS) |
| 38339959569 | e5095f9 lane, merge 01a85d3 | 03:04Z 10-13 | post | 18 | 19 | 69 | checks: 5140 pass, 6 fail, 8 skip | failure (macOS) |
| 38347800159 | 79888d5 lane, merge 12184dd | 04:43Z 10-13 | post | 18 | 19 | 69 | checks: 5156 pass, 6 fail, 8 skip | failure (macOS) |

All four lane runs check out `pull/3/merge` (lane head merged into main 7e6ce39), so every run tests main 7e6ce39 plus lane code. Lane diff 5143063..79888d5 outside docs touches only `HANDOFF.md`, `REQUIREMENTS.md`, `packages/nana-pack/lib/pipe-guard.mjs` (+test), `packages/nana-setup/{README.md,lib/settings.mjs}` and five nana-setup tests. None of the 18 newly failing files or `apps/` changed (`git diff --stat 5143063 79888d5 -- apps/ packages/nana-pack/extensions <the 18 tests> package.json scripts/ .github/` is empty).

## Counts per leg per class (failing test files)

| leg | run | a pre-existing | b drift | c other new | total |
|---|---|---|---|---|---|
| macos | main 38262900510 | 0 | 0 | 0 | 0 |
| macos | r1 38313718241 | 0 | 0 | 0 | 0 |
| macos | r2 38333416292 | 0 | 18 | 0 | 18 |
| macos | r3 38339959569 | 0 | 18 | 0 | 18 |
| macos | r4 38347800159 | 0 | 18 | 0 | 18 |
| ubuntu | main 38262900510 | 1 | 0 | 0 | 1 |
| ubuntu | r1 38313718241 | 1 | 0 | 0 | 1 |
| ubuntu | r2 38333416292 | 1 | 18 | 0 | 19 |
| ubuntu | r3 38339959569 | 1 | 18 | 0 | 19 |
| ubuntu | r4 38347800159 | 1 | 18 | 0 | 19 |
| windows | main 38262900510 | 68 | 0 | 0 | 68 |
| windows | r1 38313718241 | 67 | 0 | 0 | 67 |
| windows | r2 38333416292 | 67 | 2 | 0 | 69 |
| windows | r3 38339959569 | 67 | 2 | 0 | 69 |
| windows | r4 38347800159 | 67 | 2 | 0 | 69 |

## Class b: newly failing after the drift (identical set in r2, r3, r4)

Local A/B on this Mac: a scratch-prefix install of pi 1.0.2 today resolved codemode 1.2.0 and every sibling at 1.2.0. Then only codemode was swapped to 1.1.0. The 18 files ran through the canonical runner (`node scripts/test.mjs <files>`, fresh temp HOME per file, PI_CODING_AGENT_DIR scrubbed). The tree was a `git archive` of main 7e6ce39 with npm_config_prefix and PATH pointing at the scratch pi. Totals: codemode 1.2.0 gave 18 FAIL, 87 checks pass, 6 fail. Codemode 1.1.0 gave 18 PASS, 1932 checks pass, 0 fail. (An earlier direct-run A/B with PI_CODING_AGENT_DIR exported left 8 files red under 1.1.0. The fixture checks named the agent-dir override, so that was my harness, not pi. I discarded it.)

| file | macOS r2–r4 | Ubuntu r2–r4 | Windows r2–r4 | CI evidence (macOS r2) | local codemode 1.2.0 | local codemode 1.1.0 |
|---|---|---|---|---|---|---|
| `apps/desk/test/app-listener.test.mjs` | F F F | F F F | F (a, masked) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 76 pass |
| `apps/desk/test/buffer-caps.test.mjs` | F F F | F F F | F (a, masked) | 2 pass, 1 fail; desk "cannot start" (reason truncated); `harness error: Error: desk server never came up: nana code: ` | FAIL 2 pass, 1 fail | PASS 30 pass |
| `apps/desk/test/changes-endpoint.test.mjs` | F F F | F F F | F (a, masked) | 75 pass, 1 fail; desk "cannot start" (reason truncated); `harness: server never came up: nana code: cannot start.` | FAIL 75 pass, 1 fail | PASS 88 pass |
| `apps/desk/test/crash-paths.test.mjs` | F F F | F F F | F (a, masked) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 42 pass |
| `apps/desk/test/host-rule.test.mjs` | F F F | F F F | F (a, masked) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 30 pass |
| `apps/desk/test/origin-rule.test.mjs` | F F F | F F F | F (a, masked) | 0 pass; desk never came up (no reason printed) | FAIL 0 pass | PASS 11 pass |
| `apps/desk/test/pi-087-entries.test.mjs` | F F F | F F F | F (a, masked) | 0 pass, 1 fail; PREAMBLE SyntaxError; `harness Error: @earendil-works/pi-coding-agent was found at ` | FAIL 0 pass, 1 fail | PASS 11 pass |
| `apps/desk/test/pi-session-parity.test.mjs` | F F F | F F F | F (a, masked) | 0 pass, 1 fail; PREAMBLE SyntaxError; `harness Error: @earendil-works/pi-coding-agent was found at ` | FAIL 0 pass, 1 fail | PASS 42 pass |
| `apps/desk/test/prompt-detach.test.mjs` | F F F | F F F | F (a, masked) | 0 pass, 1 fail; desk "cannot start" (reason truncated); `harness: server never came up: nana code: cannot start.` | FAIL 0 pass, 1 fail | PASS 24 pass |
| `apps/desk/test/spawn-and-persist.test.mjs` | F F F | F F F | F (a, masked) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 122 pass |
| `apps/desk/test/stage-key-persistence.test.mjs` | F F F | F F F | F (a, masked) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 82 pass |
| `apps/desk/test/teardown-invariants.test.mjs` | F F F | F F F | F (a, masked) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 18 pass |
| `apps/desk/test/usage-line.test.mjs` | F F F | F F F | F (a, masked) | 0 pass, 1 fail; desk "cannot start" (reason truncated); `usage line fixture Error: listeners did not bind:  / nana co` | FAIL 0 pass, 1 fail | PASS 6 pass |
| `packages/nana-pack/tests/agent-dir-parity.test.mjs` | F F F | F F F | F (a, masked) | 5 pass; PREAMBLE SyntaxError | FAIL 5 pass | PASS 55 pass |
| `packages/nana-pack/tests/config-project-gate-fallback.test.mjs` | F F F | F F F | F (b) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 27 pass |
| `packages/nana-pack/tests/config-trust.test.mjs` | F F F | F F F | F (b) | 5 pass; PREAMBLE SyntaxError | FAIL 5 pass | PASS 27 pass |
| `packages/nana-pack/tests/objective-golden.test.mjs` | F F F | F F F | F (a, now PREAMBLE) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 1236 pass |
| `packages/nana-pack/tests/post-edit-file-queue.test.mjs` | F F F | F F F | F (a, now PREAMBLE) | 0 pass; PREAMBLE SyntaxError | FAIL 0 pass | PASS 5 pass |

The macOS r1 run (5143063, 21:56Z, before the publish) passed all 18; r2 (6abc2e8, 01:42Z) failed all 18 on code that does not touch them. 13 of 18 print the PREAMBLE error in the CI log (4 nana-pack tests directly; 9 through the desk message "entry point .../dist/index.js would not import: ... MCP_TYPESCRIPT_PREAMBLE"). The other 5 desk files print only "nana code: cannot start." or "desk server never came up"; `apps/desk/server.mjs:129` is the only "cannot start" path and it fires only when `loadPiSession` fails. The local A/B pins all 18.

## Windows: is the drift visible?

Yes, by +2 files: Windows FAIL files main 68 → r1 67 (lane fixed `packages/nana-setup/tests/hook-producers.test.mjs`) → r2/r3/r4 69.

- New on Windows (b): `packages/nana-pack/tests/config-trust.test.mjs`, `packages/nana-pack/tests/config-project-gate-fallback.test.mjs` (both passed in r1: 27 pass each; both crash at the PREAMBLE import in r2–r4).
- Pre-existing on Windows, failure mode changed to the drift (a, masked by b): `objective-golden.test.mjs` (r1: 94 pass, 17 fail portability titles; r2: 0 pass, PREAMBLE) and `post-edit-file-queue.test.mjs` (r1: 2 pass, 1 fail; r2: 0 pass, PREAMBLE). Their Windows portability failures are now hidden behind the import crash.
- The 13 desk files and `agent-dir-parity` fail on Windows in r1 and in r2–r4 with identical failing-title sets (title diff r1→r2 is empty for all of them). Their logs show pre-existing reasons. One is "cannot tie a @earendil-works/pi-coding-agent installation": the desk looks in `C:\npm\prefix\lib\node_modules`, but npm on Windows installs to `C:\npm\prefix\node_modules`. Another is a doubled drive path, `D:\D:\a\...\server.mjs`, from `new URL(...).pathname`. They never reach the pi import, so the drift is masked there.

## Class a: pre-existing

Ubuntu (all five runs): `packages/nana-pack/tests/lane-write-guard.test.mjs` — `symlink escape outside lane is blocked`.

Windows (r1 baseline, 67 files; same 67 in r2–r4 plus the 2 class-b files). Pattern of each row: runs main r1 r2 r3 r4 (F = fail, . = pass); r1 status; first FAIL titles.

| file | main r1 r2 r3 r4 | r1 status | first FAIL titles (r1) |
|---|---|---|---|
| `apps/bench/test/agentdir.test.mjs` | F F F F F | 25 pass, 1 fail | the dir is 0700 666 |
| `apps/bench/test/argv.test.mjs` | F F F F F | 31 pass, 1 fail, 1 skip | relative -e path is made absolute against studyDir D:\tmp\nana-bench\. |
| `apps/bench/test/catch-ledger.test.mjs` | F F F F F | 65 pass, 4 fail | judge exit 1 → throws; judge non-JSON → throws |
| `apps/bench/test/orchestration-paths.test.mjs` | F F F F F | 80 pass, 1 fail | shipped c7 through executeRun: the honest one-line fix is graded ok gr |
| `apps/bench/test/usage.test.mjs` | F F F F F | 89 pass, 1 fail | a wrong BENCH_PI_ROOT fails and names the path tried the bench needs t |
| `apps/desk/test/app-listener.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/buffer-caps.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/changes-endpoint.test.mjs` | F F F F F | 70 pass, 2 fail | repo: root is the work tree C:/Users/runneradmin/AppData/Local/Temp/na; the file endpoint refuses an untracked symlink inside the root {"statu |
| `apps/desk/test/crash-paths.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/host-rule.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/knowledge-home-isolation.test.mjs` | F F F F F | 0 pass, 1 fail | real-pi launchers isolate the knowledge home |
| `apps/desk/test/origin-rule.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/pi-087-entries.test.mjs` | F F F F F | 0 pass, 1 fail | harness Error: cannot tie a @earendil-works/pi-coding-agent installati |
| `apps/desk/test/pi-resolution.test.mjs` | F F F F F | 4 pass, 1 fail | harness Error: cannot tie a @earendil-works/pi-coding-agent installati |
| `apps/desk/test/pi-rpc-contract.test.mjs` | F F F F F | 1 pass, 1 fail | installed pi RPC contract completes Error: cannot tie a @earendil-work |
| `apps/desk/test/pi-session-parity.test.mjs` | F F F F F | 0 pass, 1 fail | harness Error: cannot tie a @earendil-works/pi-coding-agent installati |
| `apps/desk/test/prompt-detach.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/spawn-and-persist.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/stage-key-persistence.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/teardown-invariants.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `apps/desk/test/usage-line.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `packages/nana-knowledge/tests/discovery.test.mjs` | F F F F F | 32 pass, 5 fail | status exits 0; status marks discovered roots |
| `packages/nana-knowledge/tests/hook.test.mjs` | F F F F F | 61 pass, 1 fail | CLI hook stays fail-open on a corrupt index |
| `packages/nana-knowledge/tests/render.test.mjs` | F F F F F | 64 pass, 5 fail | hostile filename was indexable on this filesystem; text addressed to the model stays on its own pointer's line, as data |
| `packages/nana-pack/tests/adoption-producer.test.mjs` | F F F F F | 40 pass, 2 fail | journal: relative user journal.path → the event goes to <agent dir>/na; journal: …not to a cwd-relative file |
| `packages/nana-pack/tests/adoption-reader.test.mjs` | F F F F F | 27 pass, 1 fail, 1 skip | c: a root with a store entry now → nothing |
| `packages/nana-pack/tests/agent-dir-hostile.test.mjs` | F F F F F | 18 pass | (crash before checks) |
| `packages/nana-pack/tests/agent-dir-parity.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `packages/nana-pack/tests/ci-workflow.test.mjs` | F F F F F | 0 pass, 5 fail | root CI runs the suite on macOS, Linux, and Windows and gates tag rele; suite job requires copier on every matrix leg The input did not match  |
| `packages/nana-pack/tests/code-map.test.mjs` | F F F F F | 45 pass, 2 fail | the repo's code map is current and every module has a contract header ; scripts/code-map.mjs --check exits 0 on a clean repo code map: 253 mod |
| `packages/nana-pack/tests/config-display-text.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `packages/nana-pack/tests/display-surfaces.test.mjs` | F F F F F | 134 pass | (crash before checks) |
| `packages/nana-pack/tests/frontier.test.mjs` | F F F F F | 42 pass, 3 fail | frontier golden: current output is byte-identical <fixture>\current.md; frontier golden: missing output is byte-identical <fixture>\missing.md |
| `packages/nana-pack/tests/gate-corpus.test.mjs` | F F F F F | 224 pass, 3 fail | deny drop STOPs (extraPatterns, 2 entries): benign ls BLOCKed naming f; deny drop STOPs (protectedPaths, 1 entries): benign ls BLOCKed naming  |
| `packages/nana-pack/tests/gate-policy-paths.test.mjs` | F F F F F | 90 pass, 1 fail | historical gate baseline a3afab28ce136e394bbf6fb89384a169f0a5ee67 is a |
| `packages/nana-pack/tests/handoff-artifact.test.mjs` | F F F F F | 6 pass, 1 fail | custom path: prompt names the configured file |
| `packages/nana-pack/tests/handoff-staleness.test.mjs` | F F F F F | 15 pass, 3 fail | 15d: pointer names the store as ~/.pi/agent/handoffs/<hash>.md (expand; 15d: pointer authority names HANDOFF.md, not DOCTRINE |
| `packages/nana-pack/tests/handoff-store.test.mjs` | F F F F F | 35 pass, 1 fail, 3 skip | missing: handoff_missing journaled with the store path |
| `packages/nana-pack/tests/handoff-trust.test.mjs` | F F F F F | 45 pass, 6 fail | custom legacy (user): journal names the pickup refusal (handoff_legacy; custom legacy (user): handoff_legacy_write_refused journaled with the  |
| `packages/nana-pack/tests/immutable-review.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `packages/nana-pack/tests/land.test.mjs` | F F F F F | 9 pass, 42 fail | tracked main changes refuse before running the suite The input did not; tracked source changes refuse before running the suite The input did n |
| `packages/nana-pack/tests/lane-write-guard.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `packages/nana-pack/tests/objective-golden.test.mjs` | F F F F F | 94 pass, 17 fail | umbrella governs: exact text; product governs: exact text |
| `packages/nana-pack/tests/post-edit-file-queue.test.mjs` | F F F F F | 2 pass, 1 fail | checker ran strictly after the queue was released |
| `packages/nana-pack/tests/product-report.test.mjs` | F F F F F | 24 pass | (crash before checks) |
| `packages/nana-pack/tests/requirements-tree.test.mjs` | F F F F F | 6 pass, 6 fail | R-287: every real requirement row is in a feature or subgroup table li; R-288: all real headings have non-empty purposes 0 headings |
| `packages/nana-pack/tests/review-ledger.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `packages/nana-pack/tests/template-acceptance.test.mjs` | F F F F F | 9 pass, 3 fail | CLI executes from paths with spaces and encoded-looking names and repo; a dirty template edit is excluded from a SHA render Command failed: gi |
| `packages/nana-pack/tests/template-release.test.mjs` | F F F F F | 4 pass, 1 fail | release CLI runs its in-process gate from spaced and percent-looking c |
| `packages/nana-pack/tests/templates-render.test.mjs` | F F F F F | 1 pass, 2 fail | AGENTS.md marker-owned section is byte-identical to the shared file; AGENTS.md shared section follows a complete paragraph |
| `packages/nana-pack/tests/templates-update.test.mjs` | F F F F F | 19 pass, 9 fail, 2 skip | Python rail uses the file Requirement while preserving project-owned f; Python rail flags the two-shall file Requirement when the project has  |
| `packages/nana-pack/tests/test-runner.test.mjs` | F F F F F | 34 pass, 3 fail, 1 skip | a file killed by a signal is FAIL, naming the signal; in non-verbose mode a failing file prints its first 20 failing check l |
| `packages/nana-pack/tests/worker-lane.test.mjs` | F F F F F | 3 pass, 7 fail | non-lane repeated worker options keep the legacy first-occurrence beha; lane mode refuses the main checkout before starting pi |
| `packages/nana-setup/tests/doctor-detail.test.mjs` | F F F F F | 3 pass | (crash before checks) |
| `packages/nana-setup/tests/entry-guidance.test.mjs` | F F F F F | 12 pass, 1 fail | README limits fill-the-date guidance to scaffold and adopt |
| `packages/nana-setup/tests/hook-producers.test.mjs` | F . . . . | 9 pass, 1 fail | launcher configurations drive missing-CLI output with canonical marker |
| `packages/nana-setup/tests/install.test.mjs` | F F F F F | 20 pass, 19 fail | hook nana-objective.mjs is a symlink into the repo; hook nana-adoption.mjs is a symlink into the repo |
| `packages/nana-setup/tests/project-working-region.test.mjs` | F F F F F | 20 pass, 7 fail | refresh changes only the marked bytes and retains CRLF surrounding byt; check accepts the refreshed region |
| `packages/nana-setup/tests/project.test.mjs` | F F F F F | 8 pass | (crash before checks) |
| `packages/nana-setup/tests/restore.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `packages/nana-setup/tests/retired-artifacts.test.mjs` | F F F F F | 32 pass, 15 fail | copied real legacy skill matches its test-only exact manifest; recognized Claude skill and empty flag move under dated backups nana-s |
| `packages/nana-setup/tests/settings-merge.test.mjs` | F F F F F | 185 pass, 3 fail | file mode is preserved across the atomic write; after re-reading: mode preserved |
| `packages/nana-setup/tests/shared-memory-hook.test.mjs` | F F F F F | 42 pass, 1 fail | deleted cwd: self-heal skipped, creates nothing, index still printed n |
| `packages/nana-setup/tests/skills-and-standards.test.mjs` | F F F F F | 12 pass, 4 fail | ~/.claude/skills/requirements is a symlink to the PACK skill null; ~/.claude/rules/nana-standards.md is a symlink into the repo |
| `packages/nana-setup/tests/state-manifest.test.mjs` | F F F F F | 7 pass, 9 fail | every path created by install maps to a nana-setup-owned manifest row ; state prints exact row parity and preserves bytes, modes and mtimes 1  |
| `packages/nana-setup/tests/trust.test.mjs` | F F F F F | 0 pass | (crash before checks) |
| `packages/nana-setup/tests/uninstall.test.mjs` | F F F F F | 1 pass, 1 fail | external inventory link aborts before changing its target or link |
| `packages/nana-setup/tests/verifier-pipe.test.mjs` | F F F F F | 0 pass | (crash before checks) |

Title-level changes inside already-failing Windows files (not new files, not drift): `settings-merge.test.mjs` main 8 fail → r1/r2 3 → r3 4 (one extra title about an existing knowledge hook entry, lane `settings.mjs` change in e5095f9) → r4 3. `install.test.mjs`, `shared-memory-hook.test.mjs`, `code-map.test.mjs`, `requirements-tree.test.mjs` changed titles main → r1 with lane/main code.


## Install-check job (feat/install-check 1d638d2): affected by the drift?

Verdict: its pi steps are **not** affected on macOS (run locally against codemode 1.2.0). Windows is inferred from the same code path and was not run.

What I checked:

1. **Which file the `pi` command runs.** `package.json` `bin.pi` is `dist/bundle/cli.js`. That is an esbuild bundle. It inlines codemode: `MCP_TYPESCRIPT_PREAMBLE` is defined inside `dist/bundle/chunks/chunk-SYF2TF6W.js`. No chunk has a bare `@earendil-works/pi-codemode` import; the only `pi-codemode` string is a temp-file name prefix in `execute-*.js`. The bundle does import `pi-ai`, `pi-agent-core` and `pi-tui` from node_modules, and those are now 1.2.0 too.
2. **How extensions resolve `@earendil-works/pi-coding-agent`.** The bundle sets `isBundledNode=!0`, so `usesEmbeddedModules` is true. jiti then serves host packages from the bundle's `VIRTUAL_MODULES`, not from `dist/index.js`. The unbundled `dist/index.js` and `dist/rpc-entry.js` are what crash: index.js → extensions/codemode/index.js → extensions/codemode/tool.js → `@earendil-works/pi-codemode/declarations`. Our tests import that file through `npm root -g`; so does the desk through `loadPiSession`.
3. **`pi install npm:pi-subagents@0.75.0`.** pi's package manager runs `npm install <spec> --prefix <root> --legacy-peer-deps`, so peers are not installed. pi-subagents 0.75.0 lists pi-coding-agent, pi-ai, pi-tui and pi-agent-core as peers only; its dependencies are jiti, yaml, acorn and undici. Codemode never enters the agent dir. Local run: exit 0, "added 5 packages".
4. **Local isolated run with codemode 1.2.0** (scratch prefix; HOME, PI_CODING_AGENT_DIR, TMPDIR and npm cache all under scratch; nana-pack and nana-knowledge from a `git archive` of main):
   - `pi --version` printed 1.0.2.
   - `pi install <nana-pack>`, `pi install <nana-knowledge>` and `pi install npm:pi-subagents@0.75.0` each exited 0.
   - `pi list` exited 0 and listed all three entries.
   - `printf '{"type":"get_commands"}\n' | pi --mode rpc --no-session` exited 0 with empty stderr. Its output included `reload-runtime`, the subagents commands and the pack skills. The journal recorded `directory_unadopted` for the project cwd, which is the install-check's pass condition.
5. **The other install-check steps.** `nana-setup trust` imports only `dist/core/trust-manager.js`. Its 5-file graph has no `@earendil-works` import. The Claude Code objective hook imports `nana-pack/lib/config.ts`, which runs `import("@earendil-works/pi-coding-agent")`. Run from a checkout with no `node_modules` (none in CI, none here), that import does not resolve, is caught, and gives the same result before and after the drift. install-check runs plain `install`, not `install --desk`, so the desk is never started, and doctor reports "desk service" as a note row. If someone opts into the desk service, it will fail to start for the same reason the desk tests fail.

Residual risk: the bundle's external `pi-ai`/`pi-agent-core`/`pi-tui` are 1.2.0 now. get_commands proves they load, but no model call was made.

## Adjacent findings

- The drift is wider than codemode. `pi-ai`, `pi-agent-core`, `pi-tui`, `pi-mcp` and `chord` all published 1.2.0 between 22:59:50Z and 23:01:40Z on 10-12. A fresh `npm i -g @earendil-works/pi-coding-agent@1.0.2` now resolves every one of them at 1.2.0 (scratch install, today).
- Pre-drift CI did not run the seat's 1.0.2 set either. The 1.1.0 releases came out on 10-07 and `^1.0.2` admits them. CI's install log shows 121 packages added in main and r1 and 119 in r2–r4, so the resolved tree changed at the drift. The claim that CI resolved 1.1.0 before the drift is inferred from publish dates; the install output does not print versions.
- The break is codemode alone. With codemode swapped to 1.1.0 or 1.0.2 and every other sibling left at 1.2.0, `dist/index.js` and `dist/rpc-entry.js` both import cleanly (156 exports). Pinning codemode is enough to make pi's module graph load again. Through the runner, all 18 class-b files pass with codemode 1.1.0 while the other siblings stay at 1.2.0 (see the class-b table). Codemode 1.0.2 and 1.1.0 export `MCP_TYPESCRIPT_PREAMBLE`; 1.2.0 does not (it adds `./portable` and `./cloudflare`).
- Side effect of this research: two accidental `import(dist/rpc-entry.js)` probes (rpc-entry starts an RPC session when imported) ran against the real `~/.pi/agent`. They appended 8 lines to `~/.pi/agent/nana-journal.jsonl` at 2026-10-13T11:43:23–24Z: handoff_missing, session_start, objective_pickup and session_shutdown, each twice, with cwd /Users/jwang/nana-pi. I did not edit or delete them. No session file was written. Everything after that ran with an isolated HOME and agent dir.

