# Pre-commit check output

Paths are normalized to repository-relative, ~ and $TMPDIR. Final-tip rechecks are reported separately.

## M1 wrong producer — exit 1

```text
FAIL R-3860: prompts have no knowledge producer and explicit query retains pointers AssertionError [ERR_ASSERTION]: package.json: knowledge prompt producer
    at file://packages/nana-knowledge/tests/pull-cut.test.mjs:37:13
    at async check (file://packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://packages/nana-knowledge/tests/pull-cut.test.mjs:18:1
FAIL  packages/nana-knowledge/tests/pull-cut.test.mjs  0 pass, 1 fail  0.2s  — exit 1

1 files: 0 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 0 pass, 1 fail, 0 skip · 0.6s
failed: packages/nana-knowledge/tests/pull-cut.test.mjs
```

## M1 green and runner — exit 0

```text
PASS  packages/nana-knowledge/tests/pull-cut.test.mjs         1 pass  0.2s
PASS  packages/nana-pack/tests/test-runner-parallel.test.mjs  11 pass  33.0s
PASS  packages/nana-pack/tests/test-runner.test.mjs           53 pass  30.1s

3 files: 3 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 65 pass, 0 fail, 0 skip · 63.6s
```

## M2/M3/M6/M7 wrong implementation — exit 1

```text
FAIL  packages/nana-pack/tests/memory-run.test.mjs      7 pass, 1 fail  30.3s  — exit 1
      | FAIL R-3861: land never starts memory and the manual command still runs AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
FAIL  packages/nana-setup/tests/memory-pause.test.mjs   0 pass, 2 fail  0.4s  — exit 1
      | FAIL R-3862: install retires memory dispatch and doctor names the repair AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
      | FAIL R-3865: uninstall directly retires pre-cut memory hooks and preserves foreign entries AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
FAIL  packages/nana-setup/tests/pull-cut-turn.test.mjs  0 pass, 1 fail  0.7s  — exit 1
      | FAIL R-3866: real offline turn needs no knowledge and retains four independent judges AssertionError [ERR_ASSERTION]: {"passed":false,"code":"missing-knowledge","detail":"no [nana:knowledge] user message names install-check.md"}

3 files: 0 PASS, 3 FAIL, 0 SKIP, 0 WARN · checks: 7 pass, 4 fail, 0 skip · 31.8s
failed: packages/nana-pack/tests/memory-run.test.mjs, packages/nana-setup/tests/memory-pause.test.mjs, packages/nana-setup/tests/pull-cut-turn.test.mjs
```

## M2/M3/M6/M7 green — exit 0

```text
PASS  packages/nana-pack/tests/memory-run.test.mjs       8 pass  41.1s
PASS  packages/nana-setup/tests/install-check.test.mjs   142 pass  1.2s
PASS  packages/nana-setup/tests/memory-pause.test.mjs    2 pass  0.5s
PASS  packages/nana-setup/tests/pull-cut-turn.test.mjs   1 pass  0.8s
PASS  packages/nana-setup/tests/state-manifest.test.mjs  21 pass  1.0s
PASS  packages/nana-setup/tests/uninstall.test.mjs       31 pass  2.3s

6 files: 6 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 205 pass, 0 fail, 0 skip · 47.4s
```

## M4 old commands — exit 1

```text
FAIL R-3863: finished experiments and their live references are gone AssertionError [ERR_ASSERTION]: memory:replay
    at file://packages/nana-pack/tests/experiment-cut.test.mjs:46:42
    at async check (file://packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://packages/nana-pack/tests/experiment-cut.test.mjs:24:1
FAIL  packages/nana-pack/tests/experiment-cut.test.mjs  0 pass, 1 fail  0.3s  — exit 1

1 files: 0 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 0 pass, 1 fail, 0 skip · 0.7s
failed: packages/nana-pack/tests/experiment-cut.test.mjs
```

## M4 green — exit 0

```text
PASS R-3863: finished experiments and their live references are gone
PASS  packages/nana-pack/tests/experiment-cut.test.mjs  1 pass  0.3s

1 files: 1 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 1 pass, 0 fail, 0 skip · 0.7s
```

## M5 stale map and M8 old guidance — exit 1

```text
FAIL R-3864: memory retirement leaves structural checks green AssertionError [ERR_ASSERTION]: scripts/code-map.mjs --check
code map: 542 modules over scripts, apps/desk, apps/bench, packages/nana-pack/lib, packages/nana-pack/bin, packages/nana-pack/extensions, packages/nana-knowledge/lib, packages/nana-knowledge/bin, packages/nana-knowledge/extensions, packages/nana-stage/lib, packages/nana-stage/extensions, packages/nana-setup/lib, packages/nana-setup/bin, packages/nana-setup/claude/hooks, packages/nana-pack/tests, packages/nana-knowledge/tests, packages/nana-stage/tests, packages/nana-setup/tests, apps/desk/test, apps/bench/test; 0 without a usable contract header; 3 problem(s)
  packages/nana-pack/tests/memory-cut-checks.test.mjs has no entry in docs/code-map.md; run 'npm run map'
  packages/nana-pack/tests/memory-cut-guidance.test.mjs has no entry in docs/code-map.md; run 'npm run map'
  docs/code-map.md is stale against the code; run 'npm run map'



1 !== 0

    at file://packages/nana-pack/tests/memory-cut-checks.test.mjs:18:10
    at async check (file://packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://packages/nana-pack/tests/memory-cut-checks.test.mjs:15:1
FAIL  packages/nana-pack/tests/memory-cut-checks.test.mjs    0 pass, 1 fail  1.2s  — exit 1
FAIL R-3867: scaffold and adoption guidance changes only explicit knowledge search AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ '`nana-knowledge` extension (`before_agent_start`)'
- 'Search only: `nana-knowledge query`'

    at judge (file://packages/nana-pack/tests/memory-cut-guidance.test.mjs:26:38)
    at file://packages/nana-pack/tests/memory-cut-guidance.test.mjs:40:4
    at async check (file://packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://packages/nana-pack/tests/memory-cut-guidance.test.mjs:30:1
FAIL  packages/nana-pack/tests/memory-cut-guidance.test.mjs  0 pass, 1 fail  3.3s  — exit 1

2 files: 0 PASS, 2 FAIL, 0 SKIP, 0 WARN · checks: 0 pass, 2 fail, 0 skip · 5.0s
failed: packages/nana-pack/tests/memory-cut-checks.test.mjs, packages/nana-pack/tests/memory-cut-guidance.test.mjs
```

## M5/M8 green — exit 0

```text
PASS R-3864: memory retirement leaves structural checks green
(node:71063) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file://templates/typescript/template/tests/requirements-trace.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
PASS  packages/nana-pack/tests/memory-cut-checks.test.mjs    1 pass  6.3s
PASS R-3867: scaffold and adoption guidance changes only explicit knowledge search
PASS  packages/nana-pack/tests/memory-cut-guidance.test.mjs  1 pass  5.7s
PASS R-3862: install retires memory dispatch and doctor names the repair
PASS R-3865: uninstall directly retires pre-cut memory hooks and preserves foreign entries
(node:77085) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
PASS  packages/nana-setup/tests/memory-pause.test.mjs        2 pass  0.6s

3 files: 3 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 4 pass, 0 fail, 0 skip · 13.2s
```

## Custom-home old matching — exit 1

```text
FAIL R-3862: install retires memory dispatch and doctor names the repair AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

  [
    {
      hooks: [
        {
+         command: "node '$TMPDIR/nana-test-29439-6RxDbO/memory-pause-2KKv8B/custom claude/hooks/nana-memory-end.mjs'",
+         statusMessage: 'nana: memory',
+         timeout: 1.5,
+         type: 'command'
+       },
+       {
          command: 'echo foreign',
          timeout: 7,
          type: 'command'
        }
      ]

    at file://packages/nana-setup/tests/memory-pause.test.mjs:49:10
    at fixture (file://packages/nana-setup/tests/memory-pause.test.mjs:37:3)
    at file://packages/nana-setup/tests/memory-pause.test.mjs:43:2
    at async check (file://packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://packages/nana-setup/tests/memory-pause.test.mjs:42:1
FAIL R-3865: uninstall directly retires pre-cut memory hooks and preserves foreign entries AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

  [
    {
      hooks: [
        {
+         command: "node '$TMPDIR/nana-test-29439-6RxDbO/memory-pause-pJzvWm/custom claude/hooks/nana-memory-end.mjs'",
+         statusMessage: 'nana: memory',
+         timeout: 1.5,
+         type: 'command'
+       },
+       {
          command: 'echo foreign',
          timeout: 7,
          type: 'command'
        }
      ]

    at file://packages/nana-setup/tests/memory-pause.test.mjs:59:10
    at fixture (file://packages/nana-setup/tests/memory-pause.test.mjs:37:3)
    at file://packages/nana-setup/tests/memory-pause.test.mjs:56:2
    at async check (file://packages/nana-pack/tests/profile-fixture.mjs:62:8)
    at async file://packages/nana-setup/tests/memory-pause.test.mjs:55:1
(node:29591) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
FAIL  packages/nana-setup/tests/memory-pause.test.mjs  0 pass, 2 fail  0.6s  — exit 1

1 files: 0 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 0 pass, 2 fail, 0 skip · 1.0s
failed: packages/nana-setup/tests/memory-pause.test.mjs
```

## Touched tests broad run, before repairs — exit 1

```text
PASS  packages/nana-knowledge/tests/build-busy.test.mjs             15 pass  13.3s
PASS  packages/nana-knowledge/tests/discovery.test.mjs              37 pass  0.4s
PASS  packages/nana-knowledge/tests/hook.test.mjs                   98 pass  4.8s
PASS  packages/nana-knowledge/tests/incremental-build.test.mjs      30 pass  0.1s
PASS  packages/nana-knowledge/tests/ledger-parse.test.mjs           21 pass, 1 skip  0.1s
PASS  packages/nana-knowledge/tests/pull-cut.test.mjs               1 pass  0.2s
PASS  packages/nana-knowledge/tests/recover.test.mjs                11 pass  7.1s
PASS  packages/nana-knowledge/tests/render.test.mjs                 69 pass  0.1s
PASS  packages/nana-knowledge/tests/sources-file.test.mjs           10 pass  3.2s
PASS  packages/nana-knowledge/tests/tokenize.test.mjs               18 pass  0.1s
PASS  packages/nana-knowledge/tests/unreadable-root.test.mjs        7 pass  0.3s
FAIL  packages/nana-pack/tests/code-map-launch.test.mjs             11 pass, 1 fail  1.8s  — exit 1
      | FAIL R-3156: every fixed-base callee survives or has a named loss reason lost edge: scripts/blast-radius.mjs -> packages/nana-pack/lib/blast-radius-config.mjs
PASS  packages/nana-pack/tests/component-audit.test.mjs             11 pass  58.0s
PASS  packages/nana-pack/tests/context-anatomy.test.mjs             23 pass  63.7s
PASS  packages/nana-pack/tests/experiment-cut.test.mjs              1 pass  0.3s
PASS  packages/nana-pack/tests/land-ci-edge.test.mjs                2 pass  21.9s
PASS  packages/nana-pack/tests/land-ci-read.test.mjs                6 pass  15.8s
PASS  packages/nana-pack/tests/land-ci-records.test.mjs             7 pass  13.2s
PASS  packages/nana-pack/tests/land-ci-suite.test.mjs               6 pass  28.2s
PASS  packages/nana-pack/tests/land-clean-merge-race.test.mjs       2 pass  15.0s
PASS  packages/nana-pack/tests/land-clean-merge.test.mjs            12 pass  40.5s
PASS  packages/nana-pack/tests/land-merge.test.mjs                  27 pass  27.1s
PASS  packages/nana-pack/tests/land-records.test.mjs                7 pass  17.9s
PASS  packages/nana-pack/tests/land-regenerate.test.mjs             8 pass  72.4s
PASS  packages/nana-pack/tests/land.test.mjs                        31 pass  25.2s
PASS  packages/nana-pack/tests/linked-launch.test.mjs               4 pass  0.9s
PASS  packages/nana-pack/tests/memory-cut-checks.test.mjs           1 pass  6.9s
PASS  packages/nana-pack/tests/memory-cut-guidance.test.mjs         1 pass  6.1s
PASS  packages/nana-pack/tests/memory-making.test.mjs               24 pass  0.2s
PASS  packages/nana-pack/tests/memory-run-recovery.test.mjs         7 pass  22.1s
PASS  packages/nana-pack/tests/memory-run-seals.test.mjs            16 pass  1.1s
PASS  packages/nana-pack/tests/memory-run.test.mjs                  8 pass  37.5s
PASS  packages/nana-pack/tests/memory-session-end.test.mjs          5 pass  7.3s
PASS  packages/nana-pack/tests/memory-shaping.test.mjs              21 pass  0.3s
PASS  packages/nana-pack/tests/process-tree.test.mjs                4 pass, 1 skip  0.0s
FAIL  packages/nana-pack/tests/readme-check.test.mjs                10 pass, 1 fail  0.2s  — exit 1
      | FAIL front-door descriptions name both runtimes and all eight extensions 
PASS  packages/nana-pack/tests/requirements-cap-kinds.test.mjs      9 pass  0.6s
FAIL  packages/nana-pack/tests/requirements-deliverables.test.mjs   20 pass, 1 fail  0.6s  — exit 1
      | FAIL R-2730: this repository's ledger gets no deliverable note against its tracked and untracked files deliverables: 20 of 23 made and read by code, 11 more parked
PASS  packages/nana-pack/tests/requirements-lift.test.mjs           65 pass  38.0s
PASS  packages/nana-pack/tests/requirements-moved.test.mjs          10 pass  0.4s
PASS  packages/nana-pack/tests/requirements-regroup.test.mjs        63 pass  26.1s
PASS  packages/nana-pack/tests/requirements-trace.test.mjs          61 pass  4.6s
PASS  packages/nana-pack/tests/requirements-tree.test.mjs           98 pass  2.5s
PASS  packages/nana-pack/tests/requirements-unclaimed.test.mjs      6 pass  2.7s
PASS  packages/nana-pack/tests/runtime-land.test.mjs                11 pass  15.0s
PASS  packages/nana-pack/tests/runtime-map.test.mjs                 15 pass  23.6s
PASS  packages/nana-pack/tests/test-runner-parallel.test.mjs        11 pass  32.7s
PASS  packages/nana-pack/tests/test-runner.test.mjs                 53 pass  30.4s
PASS  packages/nana-setup/tests/agent-dir-consumers.test.mjs        13 pass  0.7s
PASS  packages/nana-setup/tests/checkout-converge.test.mjs          6 pass  3.2s
PASS  packages/nana-setup/tests/checkout-spelling.test.mjs          6 pass  5.4s
PASS  packages/nana-setup/tests/claude-config-dir.test.mjs          7 pass  2.1s
PASS  packages/nana-setup/tests/copy-record.test.mjs                8 pass  2.2s
PASS  packages/nana-setup/tests/desk-service.test.mjs               46 pass  8.8s
PASS  packages/nana-setup/tests/doctor-detail.test.mjs              72 pass  11.7s
PASS  packages/nana-setup/tests/doctor-fix-line.test.mjs            15 pass  3.6s
PASS  packages/nana-setup/tests/doctor-knowledge.test.mjs           5 pass  0.7s
PASS  packages/nana-setup/tests/doctor-memory-links.test.mjs        12 pass  1.6s
PASS  packages/nana-setup/tests/doctor-package-source.test.mjs      10 pass  1.5s
PASS  packages/nana-setup/tests/doctor-pi-dependencies.test.mjs     3 pass  1.4s
PASS  packages/nana-setup/tests/doctor-quiet.test.mjs               7 pass  1.3s
PASS  packages/nana-setup/tests/doctor-release.test.mjs             2 pass  0.9s
PASS  packages/nana-setup/tests/doctor-runtime.test.mjs             21 pass  2.8s
PASS  packages/nana-setup/tests/doctor-trust.test.mjs               1 pass  0.4s
PASS  packages/nana-setup/tests/entry-guidance.test.mjs             17 pass  0.3s
PASS  packages/nana-setup/tests/fresh-machine.test.mjs              9 pass  0.1s
PASS  packages/nana-setup/tests/frontier-hook.test.mjs              1 pass  1.6s
PASS  packages/nana-setup/tests/fsops.test.mjs                      17 pass  0.0s
PASS  packages/nana-setup/tests/hook-deadlines.test.mjs             7 pass  34.0s
PASS  packages/nana-setup/tests/hook-producers.test.mjs             13 pass  0.1s
PASS  packages/nana-setup/tests/hooks-closed-output.test.mjs        7 pass  1.0s
SKIP  packages/nana-setup/tests/hooks-win32-exec.test.mjs           runs only on the Windows leg (process.platform !== "win32")
PASS  packages/nana-setup/tests/install-check-builder-env.test.mjs  3 pass  0.8s
PASS  packages/nana-setup/tests/install-check.test.mjs              142 pass  1.1s
PASS  packages/nana-setup/tests/install-overlap.test.mjs            4 pass  0.2s
PASS  packages/nana-setup/tests/install.test.mjs                    109 pass  8.2s
PASS  packages/nana-setup/tests/linked-claude-folder.test.mjs       10 pass  8.7s
PASS  packages/nana-setup/tests/memory-pause.test.mjs               2 pass  0.6s
PASS  packages/nana-setup/tests/objective-path-shapes.test.mjs      5 pass, 1 skip  4.3s
PASS  packages/nana-setup/tests/paths.test.mjs                      5 pass  0.0s
PASS  packages/nana-setup/tests/pi-install-pin.test.mjs             10 pass  0.0s
PASS  packages/nana-setup/tests/pi-launch-limits.test.mjs           24 pass, 2 skip  66.2s
PASS  packages/nana-setup/tests/pi-registration.test.mjs            72 pass, 3 skip  4.4s
PASS  packages/nana-setup/tests/project-dismiss.test.mjs            14 pass  0.5s
PASS  packages/nana-setup/tests/project-key.test.mjs                13 pass, 1 skip  0.0s
PASS  packages/nana-setup/tests/project-odd-seeds.test.mjs          8 pass  3.6s
PASS  packages/nana-setup/tests/project-stale.test.mjs              11 pass  4.5s
PASS  packages/nana-setup/tests/project-working-region.test.mjs     28 pass  0.2s
PASS  packages/nana-setup/tests/project.test.mjs                    124 pass  34.4s
PASS  packages/nana-setup/tests/pull-cut-turn.test.mjs              1 pass  0.8s
PASS  packages/nana-setup/tests/readme-rehearsal.test.mjs           8 pass  0.1s
PASS  packages/nana-setup/tests/realpath-fallback.test.mjs          3 pass  3.5s
PASS  packages/nana-setup/tests/relative-agent-dir.test.mjs         31 pass  1.9s
PASS  packages/nana-setup/tests/restore.test.mjs                    17 pass  1.6s
PASS  packages/nana-setup/tests/retired-artifacts.test.mjs          47 pass  3.6s
PASS  packages/nana-setup/tests/roster-notice-hook.test.mjs         4 pass  0.6s
PASS  packages/nana-setup/tests/rulings-install.test.mjs            12 pass  3.3s
PASS  packages/nana-setup/tests/seat-pull-off.test.mjs              8 pass  1.1s
PASS  packages/nana-setup/tests/seat-rule.test.mjs                  21 pass  0.0s
PASS  packages/nana-setup/tests/settings-lock.test.mjs              6 pass, 2 skip  3.4s
PASS  packages/nana-setup/tests/settings-merge.test.mjs             219 pass  4.4s
PASS  packages/nana-setup/tests/shared-link-state.test.mjs          7 pass  0.0s
PASS  packages/nana-setup/tests/shared-memory-budget.test.mjs       7 pass  0.4s
PASS  packages/nana-setup/tests/shared-memory-hook.test.mjs         43 pass  0.7s
PASS  packages/nana-setup/tests/shared-memory-input.test.mjs        3 pass  0.1s
PASS  packages/nana-setup/tests/skills-and-standards.test.mjs       88 pass  6.6s
PASS  packages/nana-setup/tests/stale-copies-slow.test.mjs          2 pass  38.2s
PASS  packages/nana-setup/tests/stale-copies.test.mjs               14 pass  7.2s
PASS  packages/nana-setup/tests/state-manifest.test.mjs             21 pass  1.0s
PASS  packages/nana-setup/tests/trust.test.mjs                      13 pass  1.3s
PASS  packages/nana-setup/tests/uninstall.test.mjs                  31 pass  2.3s
PASS  packages/nana-setup/tests/verifier-pipe.test.mjs              31 pass  2.6s
PASS  packages/nana-setup/tests/win-shims.test.mjs                  2 pass, 6 skip  0.4s
PASS  packages/nana-setup/tests/win32-degrade.test.mjs              81 pass  6.4s
PASS  packages/nana-setup/tests/win32-hook-repair.test.mjs          14 pass  2.8s
PASS  packages/nana-setup/tests/writing-rule.test.mjs               4 pass  0.0s
PASS  apps/bench/test/anatomy-labels.test.mjs                       30 pass  1.2s
PASS  apps/bench/test/anatomy-seat.test.mjs                         17 pass  0.4s
PASS  apps/bench/test/anatomy.test.mjs                              9 pass  1.1s

119 files: 115 PASS, 3 FAIL, 1 SKIP, 0 WARN · checks: 2677 pass, 3 fail, 17 skip · 1012.4s
failed: packages/nana-pack/tests/code-map-launch.test.mjs, packages/nana-pack/tests/readme-check.test.mjs, packages/nana-pack/tests/requirements-deliverables.test.mjs
```

## Repairs green — exit 0

```text
PASS  packages/nana-knowledge/tests/pull-cut.test.mjs              1 pass  0.2s
PASS  packages/nana-pack/tests/code-map-launch.test.mjs            12 pass  1.7s
PASS  packages/nana-pack/tests/experiment-cut.test.mjs             1 pass  0.3s
PASS  packages/nana-pack/tests/memory-cut-checks.test.mjs          1 pass  6.4s
PASS  packages/nana-pack/tests/memory-cut-guidance.test.mjs        1 pass  5.5s
PASS  packages/nana-pack/tests/readme-check.test.mjs               11 pass  0.2s
PASS  packages/nana-pack/tests/requirements-deliverables.test.mjs  21 pass  0.6s
PASS  packages/nana-setup/tests/memory-pause.test.mjs              2 pass  0.6s
PASS  packages/nana-setup/tests/pull-cut-turn.test.mjs             1 pass  0.8s
PASS  packages/nana-setup/tests/win32-hook-repair.test.mjs         14 pass  2.6s

10 files: 10 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 65 pass, 0 fail, 0 skip · 19.5s
```

## Runner after deletions — exit 0

```text
PASS  packages/nana-pack/tests/test-runner-parallel.test.mjs  11 pass  32.7s
PASS  packages/nana-pack/tests/test-runner.test.mjs           53 pass  30.2s

2 files: 2 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 64 pass, 0 fail, 0 skip · 63.3s
```

## Template tests in same-content temporary checkout — exit 0

```text
PASS nana-pi Part G mirrors templates/_shared/requirements-general.md 
PASS seal: the known-bugs folder is docs/known-bugs 
PASS AGENTS.md marker-owned section is byte-identical to the shared file 
PASS AGENTS.md shared section follows a complete paragraph 
PASS working pattern names lane launcher and keeps local overrides after marker region 
PASS pack README documents lane preamble, write gap, ceiling, and trust notice 
PASS …and a one-byte drift is caught, not silently passed (mutation) 
PASS shared runtime matrix declares four runtime surfaces, ten capabilities, and the discovered source inventory 
PASS startup guidance scopes every requirements read to row lookup 
PASS soul continuity rule records carry before reports and session boundaries 
PASS shared working pattern names generic defaults and local overrides 
PASS three front doors carry one identical scoped platform claim 
PASS shared working pattern makes the pattern the default with the machine roster 
PASS the shared working pattern omits the retired seat land review 
PASS nana-soul carries the shared default-pattern and review-ladder bullets 
PASS shared working pattern carries one seat-guide bullet 
PASS seat-guide bullet names a guide file present in this checkout 
PASS R-2652: the shared working pattern starts the larger-lane builder, pi or Claude Code, through pi-worker --lane-size larger and a small lane through --lane-size small 
PASS shared working pattern says a seat that cannot start the larger-lane builder stops and asks the user 
PASS shared working pattern says the builder builds every lane when the roster sets no larger-lane builder 
PASS app host matrix states manifest-only resources and the terminal trust step 
PASS shared working pattern requires a threat model per plan 
PASS R-2584: the shared working pattern's Plans bullet requires every plan to name its precedent 
PASS R-2955: shared and project Plans bullets point planners to the prompt with the request and grounding 
PASS R-1300: the shared working pattern gives every lane one reviewer plus CI and says plans get no review round 
PASS shared working pattern freezes edits after an all-LAND review 
PASS shared working pattern ships urgent fixes alone 
PASS shared working pattern states the review bar for seats 
PASS R-2509: the shared working pattern records a non-blocking finding in its feature's known-bug file, not HANDOFF 
PASS AGENTS.md carries the macOS install check outside the shared region 
PASS requirements skill directs every row into the feature it serves, keeps a flat ledger's sections and names the owner 
PASS scaffold and adopt skills direct rows into the feature each serves, keep a flat ledger's sections and name no Part G 
PASS requirements skill names the tree check and the product report with a project root 
PASS requirements skill names the lift's dry run, the owner's yes before --write, a clean ledger in every worktree, never discarding another session's lines, and only flags the lift has 
PASS requirements skill's regroup paragraph names the regroup check, what the agent reads, a review of every placement and every purpose, outcome and section reason, the owner's yes before --write, --verify with --mapping and gaps as proposed features, and only flags the regroup has 
PASS typescript: copier renders the template 
PASS typescript scaffold: all declared skill claims resolve independently for scaffold-ts 
PASS scaffold-ts: an unknown package script is rejected 
PASS scaffold-ts: an inline pnpm separator mutation is rejected 
PASS typescript scaffold: all declared skill claims resolve independently for spec 
PASS typescript scaffold: all declared skill claims resolve independently for requirements 
STALE exemption templates/_shared/working-under-nana-pi.md path 'nana-knowledge.ts'
STALE exemption templates/_shared/working-under-nana-pi.md path 'nana-knowledge.ts hook'
STALE exemption templates/_shared/working-under-nana-pi.md path 'nana-knowledge'
PASS typescript scaffold: all declared skill claims resolve independently for templates/_shared/working-under-nana-pi.md 
PASS typescript scaffold: a removed shared HANDOFF path is rejected 
PASS typescript scaffold: all declared skill paths resolve independently 
PASS typescript scaffold: all declared package-script commands resolve independently 
PASS typescript scaffold: all declared flags and subcommands resolve independently 
PASS typescript: rendered AGENTS.md marker region matches shared bytes and follows a paragraph 
PASS typescript: the requirements-first files all land 
PASS typescript scaffold: Part G ships G-001..G-022 unrenumbered 
PASS typescript scaffold: no jinja survives into REQUIREMENTS.md 
PASS typescript scaffold: REQUIREMENTS.md's organization section comes from the one shared source 
PASS typescript scaffold: REQUIREMENTS.md passes the requirements tree checker 
PASS typescript scaffold: every G row is homed in FEAT-900 under CAP-90 with no R row 
PASS typescript scaffold: REQUIREMENTS.md says how rows are grouped, where a new row goes, who decides and how to check 
PASS typescript: the example product row is implemented 
PASS typescript: rendered policy config has the protected filename 
PASS typescript: the smoke test carries the trace marker 
PASS typescript: the rail self-test carries real req: markers 
PASS typescript: the code map checks clean with no deps installed 
PASS typescript: the check covers src, scripts and tests 
PASS typescript: --impact prints the untraced-test count for a fresh scaffold 
PASS typescript: a fresh scaffold passes biome check with no edits 
PASS typescript: the scaffolded README passes readme-check with no deps installed 
PASS typescript: readme-check --list prints its claims 
PASS typescript: readme-check catches a command that is not a script 
PASS typescript: readme-check catches a path that does not exist 
PASS typescript: readme-check catches a missing test section 
PASS typescript: readme-check catches an undocumented script 
PASS typescript: a header dropped in tests/ fails the check 
PASS typescript adopt: copier renders the template 
PASS typescript adopt: all declared skill claims resolve independently for adopt-ts 
PASS adopt-ts: a removed code-map test path is rejected 
PASS typescript adopt: all declared skill claims resolve independently for adopt-structure 
PASS typescript adopt: all declared skill claims resolve independently for templates/_shared/working-under-nana-pi.md 
PASS typescript adopt: all declared skill paths resolve independently 
PASS typescript adopt: all declared package-script commands resolve independently 
PASS typescript adopt: all declared flags and subcommands resolve independently 
PASS typescript adopt: skill file list exactly matches emitted files 
PASS typescript adopt: all copier-preserved files are marked written only when absent 
PASS typescript adopt: every rendered package script is named in adopt-ts 
PASS typescript adopt: workspace build permission is valid YAML 
PASS typescript adopt: the rail and the generator land too 
PASS typescript adopt: no scaffold starters are written 
PASS typescript adopt: Part G ships G-001..G-022 unrenumbered 
PASS typescript adopt: no jinja survives into REQUIREMENTS.md 
PASS typescript adopt: REQUIREMENTS.md's organization section comes from the one shared source 
PASS typescript adopt: REQUIREMENTS.md passes the requirements tree checker 
PASS typescript adopt: every G row is homed in FEAT-900 under CAP-90 with no R row 
PASS typescript adopt: the product feature is proposed and holds no row 
PASS typescript adopt: REQUIREMENTS.md says how rows are grouped, where a new row goes, who decides and how to check 
PASS typescript adopt: no row claims implemented 
PASS typescript adopt: every Part G row starts untested 
PASS typescript adopt: no product row is invented 
PASS typescript adopt: the confirm-the-statuses blockquote is gone 
PASS typescript adopt: the rail self-test carries req-candidate, not req: 
PASS typescript adopt: no jinja survives into the rail self-test 
PASS typescript adopt: the first --check fails and names the regenerate command 
PASS typescript adopt: the documented command generates the map 
PASS typescript adopt: --check is green after that ONE command 
PASS python: copier renders the template 
PASS python scaffold: requirements-trace, code-map and readme-check tests pass under a cp1252 Python environment 
PASS requirements: a misspelled code-map flag is rejected 
PASS python scaffold: all declared skill claims resolve independently for scaffold-py 
PASS scaffold-py: a removed code-map path is rejected 
PASS python scaffold: all declared skill claims resolve independently for py-lint 
PASS python scaffold: all declared skill claims resolve independently for py-test 
PASS python scaffold: all declared skill claims resolve independently for py-review 
PASS python scaffold: all declared skill claims resolve independently for spec 
PASS python scaffold: all declared skill claims resolve independently for requirements 
STALE exemption templates/_shared/working-under-nana-pi.md path 'nana-knowledge.ts'
STALE exemption templates/_shared/working-under-nana-pi.md path 'nana-knowledge.ts hook'
STALE exemption templates/_shared/working-under-nana-pi.md path 'nana-knowledge'
PASS python scaffold: all declared skill claims resolve independently for templates/_shared/working-under-nana-pi.md 
PASS python scaffold: a removed shared HANDOFF path is rejected 
PASS python scaffold: all declared skill paths resolve independently 
PASS python scaffold: all declared package-script commands resolve independently 
PASS python scaffold: all declared flags and subcommands resolve independently 
PASS python: rendered AGENTS.md marker region matches shared bytes and follows a paragraph 
PASS python: the requirements-first files all land 
PASS python scaffold: Part G ships G-001..G-022 unrenumbered 
PASS python scaffold: no jinja survives into REQUIREMENTS.md 
PASS python scaffold: REQUIREMENTS.md's organization section comes from the one shared source 
PASS python scaffold: REQUIREMENTS.md passes the requirements tree checker 
PASS python scaffold: every G row is homed in FEAT-900 under CAP-90 with no R row 
PASS python scaffold: REQUIREMENTS.md says how rows are grouped, where a new row goes, who decides and how to check 
PASS python: the example product row is implemented 
PASS python: rendered policy config has the protected filename 
PASS python: the smoke test carries the trace marker 
PASS python: the rail self-test carries real req: markers 
PASS python: the code map checks clean with no deps installed 
PASS python: the check covers src, scripts and tests 
PASS python: --impact prints the untraced-test count for a fresh scaffold 
PASS python: a fresh scaffold passes ruff check with no edits 
PASS python: a fresh scaffold is ruff-format clean with no edits 
PASS python: the scaffolded README passes readme-check with no deps installed 
PASS python: readme-check --list prints its claims 
PASS python: readme-check catches a command naming a file that is gone 
PASS python: readme-check catches a path that does not exist 
PASS python: readme-check catches a missing test section 
PASS python: readme-check catches an undocumented script 
PASS python: a header dropped in tests/ fails the check 
PASS python adopt: copier renders the template 
PASS python adopt: requirements-trace, code-map and readme-check tests pass under a cp1252 Python environment 
PASS python adopt: all declared skill claims resolve independently for adopt-py 
PASS python adopt: all declared skill claims resolve independently for adopt-structure 
PASS python adopt: all declared skill claims resolve independently for templates/_shared/working-under-nana-pi.md 
PASS python adopt: all declared skill paths resolve independently 
PASS python adopt: all declared package-script commands resolve independently 
PASS python adopt: all declared flags and subcommands resolve independently 
PASS python adopt: skill file list exactly matches emitted files 
PASS python adopt: all copier-preserved files are marked written only when absent 
PASS python adopt: the rail and the generator land too 
PASS python adopt: no scaffold starters are written 
PASS python adopt: Part G ships G-001..G-022 unrenumbered 
PASS python adopt: no jinja survives into REQUIREMENTS.md 
PASS python adopt: REQUIREMENTS.md's organization section comes from the one shared source 
PASS python adopt: REQUIREMENTS.md passes the requirements tree checker 
PASS python adopt: every G row is homed in FEAT-900 under CAP-90 with no R row 
PASS python adopt: the product feature is proposed and holds no row 
PASS python adopt: REQUIREMENTS.md says how rows are grouped, where a new row goes, who decides and how to check 
PASS python adopt: no row claims implemented 
PASS python adopt: every Part G row starts untested 
PASS python adopt: no product row is invented 
PASS python adopt: the confirm-the-statuses blockquote is gone 
PASS python adopt: the rail self-test carries req-candidate, not req: 
PASS python adopt: no jinja survives into the rail self-test 
PASS python adopt: the first --check fails and names the regenerate command 
PASS python adopt: the documented command generates the map 
PASS python adopt: --check is green after that ONE command 
PASS R-1321: each template's code-map, readme-check and trace scripts pass on a rendered project rewritten to CRLF 
PASS R-2559: a fresh TypeScript scaffold pins Biome to the sealed exact version 2.5.15 
PASS python: the readme check prints every line under ASCII and cp1252 output 
PASS python: the code map check prints every line under ASCII and cp1252 output 
PASS python: the code map impact view prints every line under ASCII and cp1252 output 
PASS python: the readme check and code map print a non-ASCII path unescaped under UTF-8 output 
PASS generated project update guidance is generic with adopted-project qualification 
claims: 459 extracted, 121 command claims not judged (heads: scripts/code-map.mjs, uvx, pnpm, @module, @purpose, @inputs, @outputs, @effects, @errors, uv, node, scripts/readme-check.mjs, npx, yarn, NANA_PROJECT_NAME='<the, scripts/code_map.py, python, [FAIL], npm, scripts/readme_check.py, scripts/data_checks.py)
all passed
PASS  packages/nana-pack/tests/templates-render.test.mjs  173 pass  52.0s

1 files: 1 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 173 pass, 0 fail, 0 skip · 52.5s

EXIT:0
```

## Native template acceptance in temporary checkout — exit 0

```text

EXIT:0
```

## macOS install check — exit 0

```text
pi: ~/.local/lib/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js
node: ~/.hermes/node/bin/node
PASS install
PASS pi-subagents
PASS pi list nana-pack
PASS pi session
PASS pi turn
PASS pi post-edit
PASS pi-review
PASS hook set
PASS hook roster notice
PASS hook shared memory
PASS hook verifier pipe (Bash)
PASS hook adoption
PASS hook objective
PASS doctor
PASS pi-worker
PASS readme checklist
```

## Map generation — exit 0

```text

> nana-pi@0.5.0 map
> node scripts/code-map.mjs --write

docs/code-map.md: 542 modules
```

## Map check — exit 0

```text

> nana-pi@0.5.0 map:check
> node scripts/code-map.mjs --check

code map: 542 modules over scripts, apps/desk, apps/bench, packages/nana-pack/lib, packages/nana-pack/bin, packages/nana-pack/extensions, packages/nana-knowledge/lib, packages/nana-knowledge/bin, packages/nana-knowledge/extensions, packages/nana-stage/lib, packages/nana-stage/extensions, packages/nana-setup/lib, packages/nana-setup/bin, packages/nana-setup/claude/hooks, packages/nana-pack/tests, packages/nana-knowledge/tests, packages/nana-stage/tests, packages/nana-setup/tests, apps/desk/test, apps/bench/test; 0 without a usable contract header; 0 problem(s)
```

## Tree — exit 0

```text

> nana-pi@0.5.0 req:tree
> node scripts/requirements-tree.mjs --write

requirements tree: 0 problems; rows 2645; features 43
deliverables: 20 of 23 made and read by code, 11 more parked
```

## README — exit 0

```text

> nana-pi@0.5.0 readme:check
> node scripts/readme-check.mjs

readme: 806 claims checked; 0 problem(s)
```

## Trace — exit 0

```text
requirements: 2645 total (2140 implemented · 8 planned · 366 retired · 128 untested · 3 violated); 2152 traced by tests
ears: 0 rows off form (allowance 0)
```

## Component audit — exit 0

```text
stale: compass 26 commits since a2ad3f21
stale: setup 37 commits since a2ad3f21
stale: key-cabinet 721 commits since a2ad3f21
stale: night-shift 721 commits since a2ad3f21
stale: requirement-contract 204 commits since a2ad3f21
stale: command-gate 90 commits since a2ad3f21
unclaimed: packages/nana-pack/bin/leak-scan.mjs
unclaimed: packages/nana-pack/bin/nana-ci-wait.mjs
unclaimed: packages/nana-pack/bin/nana-curate.mjs
unclaimed: packages/nana-pack/bin/nana-main-ci.mjs
unclaimed: packages/nana-pack/bin/nana-memory.mjs
unclaimed: packages/nana-pack/bin/nana-profile.mjs
unclaimed: scripts/code-map-launch-config.mjs
unclaimed: scripts/glob-match.mjs
unclaimed: scripts/memory-curate.mjs
unclaimed: scripts/memory-make.mjs
unclaimed: scripts/memory-run.mjs
unclaimed: scripts/memory-shape-runners.mjs
unclaimed: scripts/memory-shape.mjs
unclaimed: scripts/reader-common.mjs
unclaimed: scripts/visual-reader-config.mjs
unclaimed: scripts/visual-reader.mjs
unclaimed: 16 of 254 mapped modules
```
