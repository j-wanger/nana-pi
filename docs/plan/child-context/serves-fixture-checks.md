# Serves fixture fix checks

Baseline exit 1; fixed child-context exit 0; land/module exit 1 (data-pack timeout); trace, map and README exit 0.

## before

```text
PASS M1: launcher roles omit rulings and no-role sessions retain exact text
PASS M2: launcher roles omit writing while seats retain the rule and live disable
FAIL M3: real lane argv delivers the committed-file privacy rule AssertionError [ERR_ASSERTION]: pi-worker: lane refused: Serves: name roadmap step <N> plus this lane's contribution, or owner YYYY-MM-DD plus the owner's words


1 !== 0

    at launch (file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:73:10)
    at file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:102:26
    at async file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:154:139
FAIL M4: every pi child path keeps extensions and credential refusal AssertionError [ERR_ASSERTION]: pi-worker: lane refused: Serves: name roadmap step <N> plus this lane's contribution, or owner YYYY-MM-DD plus the owner's words


1 !== 0

    at launch (file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:73:10)
    at file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:111:15
    at async file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:154:139
FAIL M5: pi logs composed sections including zero skips and unavailable measurements AssertionError [ERR_ASSERTION]: pi-worker: lane refused: Serves: name roadmap step <N> plus this lane's contribution, or owner YYYY-MM-DD plus the owner's words


1 !== 0

    at launch (file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:73:10)
    at file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:123:14
    at async file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:154:139
FAIL M6: both Claude launchers log all instruction surfaces imports and unreadable files AssertionError [ERR_ASSERTION]: pi-worker: lane refused: Serves: name roadmap step <N> plus this lane's contribution, or owner YYYY-MM-DD plus the owner's words


1 !== 0

    at launch (file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:73:10)
    at file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:147:3
    at async file://$WORKTREE/packages/nana-pack/tests/child-context.test.mjs:154:139
(node:25181) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file://$WORKTREE/packages/nana-pack/extensions/nana-rulings.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to $WORKTREE/packages/nana-pack/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
```

## after

```text
PASS M1: launcher roles omit rulings and no-role sessions retain exact text
PASS M2: launcher roles omit writing while seats retain the rule and live disable
PASS M3: real lane argv delivers the committed-file privacy rule
PASS M4: every pi child path keeps extensions and credential refusal
DELIVERED builder [{"name":"preamble","fullChars":4909,"deliveredChars":4909},{"name":"brief","fullChars":93,"deliveredChars":93},{"name":"nana-objective","fullChars":1631,"deliveredChars":1631},{"name":"nana-rulings","fullChars":0,"deliveredChars":0},{"name":"nana-writing","fullChars":0,"deliveredChars":0},{"name":"nana-install-stale","fullChars":0,"deliveredChars":0},{"name":"nana-project-stale","fullChars":0,"deliveredChars":0}]
PASS M5: pi logs composed sections including zero skips and unavailable measurements
PASS M6: both Claude launchers log all instruction surfaces imports and unreadable files
(node:35557) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file://$WORKTREE/packages/nana-pack/extensions/nana-rulings.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to $WORKTREE/packages/nana-pack/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
```

## pack

```text

> nana-pi@0.5.0 test
> node scripts/test.mjs --pack=land,module --changed-from=main --jobs=4

[packs] fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] test packages/nana-pack/tests/child-context.test.mjs: changed test
[packs] test packages/nana-pack/tests/claude-review.test.mjs: changed test
[packs] test packages/nana-pack/tests/context-anatomy.test.mjs: changed test
[packs] test packages/nana-pack/tests/one-reviewer.test.mjs: changed test
[packs] test packages/nana-pack/tests/review-standard.test.mjs: changed test
[packs] test packages/nana-pack/tests/rulings.test.mjs: changed test
[packs] test packages/nana-pack/tests/worker-claude.test.mjs: changed test
[packs] test packages/nana-setup/tests/install-check.test.mjs: changed test
[packs] module apps/bench/test/anatomy-labels.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/bench/test/anatomy-seat.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/bench/test/anatomy.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/desk/test/app-listener.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/desk/test/buffer-caps.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/desk/test/origin-rule.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/desk/test/page-retire.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/desk/test/pi-resolution.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/desk/test/stage-key-persistence.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module apps/desk/test/usage-line.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/discovery.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/incremental-build.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/ledger-parse.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/pull-cut.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/recover.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/render.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/sources-file.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/tokenize.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-knowledge/tests/unreadable-root.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/ask-shape.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/build-records.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/builder-context.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/ci-records.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/code-map-launch.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/code-map.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/component-audit.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/config-display-text.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/config-project-gate-fallback.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/display-surfaces.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/env-path.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/land-ci-records.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/land-records.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/land-regenerate.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/lane-watcher.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/lifecycle-journal.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/lifecycle-reload.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/linked-launch.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/memory-curation.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/memory-making.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/memory-run-recovery.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/memory-run-seals.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/memory-run.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/memory-session-end.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/memory-shaping.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/nana-roster-set.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/one-reviewer.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/pages-workflow.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/pi-install.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/planner-prompt.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/product-detail.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/product-overview.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/product-report.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/profile-store-guards.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/profile-store.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/profile-sync.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/real-path.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/records-move.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/requirements-cap-kinds.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/requirements-deliverables.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/requirements-lift.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/requirements-regroup.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/review-ledger-lock.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/review-paperwork.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/review-round.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/review-test-waits.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/runtime-map.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/setup-retire.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/test-locked.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/test-runner-parallel.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/test-runner.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-pack/tests/windows-skip-lines.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/checkout-converge.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/checkout-spelling.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/claude-config-dir.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/desk-service.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/doctor-detail.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/doctor-fix-line.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/doctor-knowledge.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/doctor-memory-links.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/doctor-package-source.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/doctor-pi-dependencies.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/doctor-quiet.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/doctor-trust.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/install-check.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/install-overlap.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/memory-pause.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/objective-path-shapes.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/pi-install-pin.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/project-odd-seeds.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/project-stale.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/pull-cut-turn.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/readme-rehearsal.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/relative-agent-dir.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/rulings-install.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/seat-pull-off.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/seat-rule.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/shared-link-state.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/shared-memory-budget.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-setup/tests/writing-rule.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] module packages/nana-stage/tests/blocks.test.mjs: fail-safe: policy path changed: packages/nana-pack/lib/test-packs-config.mjs
[packs] land,module,release: 189 selected files
PASS  packages/nana-knowledge/tests/ledger-parse.test.mjs             21 pass, 1 skip  0.1s
PASS  packages/nana-knowledge/tests/incremental-build.test.mjs        30 pass  0.1s
PASS  packages/nana-knowledge/tests/render.test.mjs                   69 pass  0.1s
PASS  packages/nana-knowledge/tests/pull-cut.test.mjs                 1 pass  0.3s
PASS  packages/nana-knowledge/tests/tokenize.test.mjs                 18 pass  0.1s
PASS  packages/nana-knowledge/tests/discovery.test.mjs                37 pass  0.4s
PASS  packages/nana-knowledge/tests/unreadable-root.test.mjs          7 pass  0.4s
PASS  packages/nana-pack/tests/adoption-producer.test.mjs             59 pass  0.4s
PASS  packages/nana-pack/tests/agent-dir-policy.test.mjs              18 pass  0.1s
PASS  packages/nana-pack/tests/agent-dir-config.test.mjs              100 pass  0.3s
PASS  packages/nana-pack/tests/agent-dir-resolver.test.mjs            1 pass  0.1s
PASS  packages/nana-pack/tests/ask-shape.test.mjs                     4 pass  0.0s
PASS  packages/nana-pack/tests/agent-dir-var-spellings.test.mjs       60 pass  0.2s
PASS  packages/nana-knowledge/tests/sources-file.test.mjs             10 pass  3.8s
PASS  packages/nana-knowledge/tests/recover.test.mjs                  11 pass  7.4s
PASS  packages/nana-pack/tests/builder-context.test.mjs               7 pass  5.2s
PASS  packages/nana-pack/tests/ci-records.test.mjs                    6 pass  4.0s
PASS  packages/nana-pack/tests/ci-workflow.test.mjs                   25 pass  0.0s
PASS  packages/nana-pack/tests/claude-review-launch.test.mjs          2 pass  1.0s
PASS  packages/nana-pack/tests/build-records.test.mjs                 7 pass  15.6s
PASS  packages/nana-pack/tests/claude-review.test.mjs                 3 pass, 1 skip  3.2s
PASS  packages/nana-pack/tests/code-map-land.test.mjs                 2 pass  2.6s
PASS  packages/nana-pack/tests/code-map-launch.test.mjs               12 pass  2.0s
PASS  packages/nana-pack/tests/child-context.test.mjs                 6 pass  13.5s
PASS  packages/nana-pack/tests/config-display-text.test.mjs           38 pass  0.1s
PASS  packages/nana-pack/tests/code-map.test.mjs                      46 pass  2.0s
PASS  packages/nana-pack/tests/config-handlers-malformed.test.mjs     91 pass  0.3s
PASS  packages/nana-pack/tests/config-gate-fallback.test.mjs          42 pass  1.1s
PASS  packages/nana-pack/tests/config-normalize.test.mjs              18 pass  0.5s
PASS  packages/nana-pack/tests/config-trust.test.mjs                  25 pass  0.6s
PASS  packages/nana-pack/tests/config-project-gate-fallback.test.mjs  28 pass  9.2s
PASS  packages/nana-pack/tests/credential-gate.test.mjs               4 pass  4.3s
PASS  packages/nana-pack/tests/data-pack-land.test.mjs                1 pass  0.8s
PASS  packages/nana-pack/tests/brief-check.test.mjs                   10 pass  45.2s
PASS  packages/nana-pack/tests/display-surfaces.test.mjs              151 pass  0.2s
PASS  packages/nana-pack/tests/env-path.test.mjs                      4 pass  0.0s
PASS  packages/nana-pack/tests/first-look.test.mjs                    7 pass  0.1s
PASS  packages/nana-pack/tests/frontier-summary.test.mjs              8 pass  1.0s
PASS  packages/nana-pack/tests/frontier.test.mjs                      53 pass  1.9s
PASS  packages/nana-pack/tests/gate-corpus.test.mjs                   227 pass  8.5s
PASS  packages/nana-pack/tests/gate-policy-paths.test.mjs             93 pass  1.0s
PASS  packages/nana-pack/tests/gate-rm-inside.test.mjs                11 pass  2.2s
PASS  packages/nana-pack/tests/gate-self-protection.test.mjs          101 pass  0.2s
PASS  packages/nana-pack/tests/handoff-issues.test.mjs                12 pass  3.3s
PASS  packages/nana-pack/tests/identity-tree.test.mjs                 2 pass  4.9s
PASS  packages/nana-pack/tests/issue-watch.test.mjs                   29 pass  8.5s
PASS  packages/nana-pack/tests/known-bugs.test.mjs                    4 pass  0.1s
PASS  packages/nana-pack/tests/component-audit.test.mjs               11 pass  71.9s
PASS  packages/nana-pack/tests/context-anatomy.test.mjs               23 pass  68.8s
PASS  packages/nana-pack/tests/land-ci-records.test.mjs               7 pass  21.8s
PASS  packages/nana-pack/tests/land-records.test.mjs                  7 pass  29.1s
PASS  packages/nana-pack/tests/land.test.mjs                          31 pass  40.4s
PASS  packages/nana-pack/tests/lane-watcher.test.mjs                  2 pass  0.1s
PASS  packages/nana-pack/tests/lane-write-guard.test.mjs              16 pass, 2 skip  0.2s
PASS  packages/nana-pack/tests/leak-scan-cli.test.mjs                 1 pass  1.1s
PASS  packages/nana-pack/tests/lifecycle-journal.test.mjs             6 pass  0.1s
PASS  packages/nana-pack/tests/lifecycle-reload.test.mjs              12 pass  0.1s
PASS  packages/nana-pack/tests/linked-launch.test.mjs                 3 pass  0.4s
PASS  packages/nana-pack/tests/main-ci.test.mjs                       1 pass  0.1s
PASS  packages/nana-pack/tests/lane-push-ci.test.mjs                  10 pass  80.3s
PASS  packages/nana-pack/tests/memory-cut-guidance.test.mjs           1 pass  8.3s
PASS  packages/nana-pack/tests/memory-making.test.mjs                 24 pass  0.4s
PASS  packages/nana-pack/tests/land-regenerate.test.mjs               8 pass  118.6s
PASS  packages/nana-pack/tests/memory-run-seals.test.mjs              16 pass  2.0s
PASS  packages/nana-pack/tests/memory-run-recovery.test.mjs           7 pass  34.9s
PASS  packages/nana-pack/tests/memory-curation.test.mjs               21 pass  108.2s
PASS  packages/nana-pack/tests/memory-shaping.test.mjs                21 pass  0.4s
PASS  packages/nana-pack/tests/nana-roster-set.test.mjs               11 pass  2.4s
PASS  packages/nana-pack/tests/nana-roster.test.mjs                   27 pass  1.6s
PASS  packages/nana-pack/tests/objective-injection.test.mjs           69 pass  0.1s
PASS  packages/nana-pack/tests/objective-smoke.test.mjs               37 pass  1.9s
PASS  packages/nana-pack/tests/memory-session-end.test.mjs            5 pass  12.9s
PASS  packages/nana-pack/tests/outside-reader.test.mjs                8 pass  0.2s
PASS  packages/nana-pack/tests/pages-workflow.test.mjs                2 pass  0.0s
PASS  packages/nana-pack/tests/pi-install.test.mjs                    7 pass  0.3s
PASS  packages/nana-pack/tests/pipe-guard.test.mjs                    230 pass  0.3s
PASS  packages/nana-pack/tests/planner-prompt.test.mjs                9 pass  0.0s
PASS  packages/nana-pack/tests/one-reviewer.test.mjs                  8 pass  3.6s
PASS  packages/nana-pack/tests/product-detail.test.mjs                4 pass  2.3s
PASS  packages/nana-pack/tests/product-overview.test.mjs              15 pass  7.4s
PASS  packages/nana-pack/tests/memory-run.test.mjs                    9 pass  66.7s
FAIL  packages/nana-pack/tests/data-pack.test.mjs                     6 pass  300.0s  — timed out after 300s
      | PASS M1 optional Python scaffold ships exactly the opt-in pack
      | PASS M3 unsafe normalizer never changes project bytes
      | PASS M4 pytest prints errors and warnings and skips absent settings
      | PASS M5 real-run false-positive patterns stay clean without suppressions
      | PASS M6 adoption preserves pack files and previous release updates cleanly
      | PASS M7 live WAL cannot produce a clean keys verdict
PASS  packages/nana-pack/tests/product-report.test.mjs                97 pass  85.1s
PASS  packages/nana-pack/tests/readme-check.test.mjs                  11 pass  0.4s
PASS  packages/nana-pack/tests/real-path.test.mjs                     2 pass  0.0s
PASS  packages/nana-pack/tests/records-move.test.mjs                  6 pass  2.8s
PASS  packages/nana-pack/tests/release-status.test.mjs                7 pass  3.5s
PASS  packages/nana-pack/tests/requirements-cap-kinds.test.mjs        9 pass  0.7s
PASS  packages/nana-pack/tests/requirements-deliverables.test.mjs     21 pass  0.8s
PASS  packages/nana-pack/tests/profile-store-guards.test.mjs          7 pass  99.7s
PASS  packages/nana-pack/tests/profile-store.test.mjs                 14 pass  89.7s
PASS  packages/nana-pack/tests/requirements-trace.test.mjs            61 pass  5.4s
PASS  packages/nana-pack/tests/requirements-tree.test.mjs             98 pass  2.9s
PASS  packages/nana-pack/tests/profile-sync.test.mjs                  2 pass  38.3s
PASS  packages/nana-pack/tests/review-ledger-lock.test.mjs            3 pass  0.0s
PASS  packages/nana-pack/tests/requirements-unclaimed.test.mjs        6 pass  2.6s
PASS  packages/nana-pack/tests/review-round.test.mjs                  27 pass  0.0s
PASS  packages/nana-pack/tests/review-standard.test.mjs               7 pass  1.6s
PASS  packages/nana-pack/tests/requirements-regroup.test.mjs          63 pass  29.5s
PASS  packages/nana-pack/tests/roster-notice.test.mjs                 21 pass  0.4s
PASS  packages/nana-pack/tests/rulings.test.mjs                       23 pass  0.2s
PASS  packages/nana-pack/tests/requirements-lift.test.mjs             65 pass  46.8s
PASS  packages/nana-pack/tests/setup-retire.test.mjs                  5 pass  1.4s
PASS  packages/nana-pack/tests/skill-claims.test.mjs                  30 pass  0.1s
PASS  packages/nana-pack/tests/review-paperwork.test.mjs              10 pass  29.3s
PASS  packages/nana-pack/tests/template-release.test.mjs              5 pass  4.8s
PASS  packages/nana-pack/tests/template-acceptance.test.mjs           14 pass  13.7s
PASS  packages/nana-pack/tests/templates-working.test.mjs             7 pass  0.0s
PASS  packages/nana-pack/tests/runtime-map.test.mjs                   15 pass  23.0s
PASS  packages/nana-pack/tests/test-packs-core.test.mjs               1 pass  0.4s
PASS  packages/nana-pack/tests/test-packs-ci.test.mjs                 4 pass  11.0s
PASS  packages/nana-pack/tests/test-packs.test.mjs                    2 pass  0.0s
PASS  packages/nana-pack/tests/test-packs-runner.test.mjs             5 pass  10.6s
PASS  packages/nana-pack/tests/review-test-waits.test.mjs             5 pass  51.4s
PASS  packages/nana-pack/tests/visual-reader.test.mjs                 5 pass  0.1s
PASS  packages/nana-pack/tests/win-shards.test.mjs                    9 pass  14.7s
PASS  packages/nana-pack/tests/win32-forced.test.mjs                  5 pass  0.1s
PASS  packages/nana-pack/tests/windows-skip-lines.test.mjs            7 pass  0.0s
PASS  packages/nana-pack/tests/test-runner-parallel.test.mjs          11 pass  32.7s
PASS  packages/nana-pack/tests/worker-refusal.test.mjs                8 pass  2.0s
PASS  packages/nana-pack/tests/test-runner.test.mjs                   53 pass  30.7s
PASS  packages/nana-pack/tests/writing-check.test.mjs                 47 pass  0.5s
PASS  packages/nana-setup/tests/agent-dir-consumers.test.mjs          13 pass  0.8s
PASS  packages/nana-pack/tests/writing-injection.test.mjs             30 pass  1.8s
PASS  packages/nana-setup/tests/checkout-converge.test.mjs            6 pass  3.7s
PASS  packages/nana-setup/tests/claude-config-dir.test.mjs            7 pass  2.3s
PASS  packages/nana-setup/tests/checkout-spelling.test.mjs            6 pass  6.1s
PASS  packages/nana-setup/tests/desk-service.test.mjs                 46 pass  9.5s
PASS  packages/nana-pack/tests/worker-claude.test.mjs                 24 pass, 3 skip  34.0s
PASS  packages/nana-setup/tests/doctor-floor.test.mjs                 3 pass  0.1s
PASS  packages/nana-setup/tests/doctor-detail.test.mjs                49 pass  11.7s
PASS  packages/nana-setup/tests/doctor-knowledge.test.mjs             5 pass  0.8s
PASS  packages/nana-setup/tests/doctor-fix-line.test.mjs              15 pass  4.9s
PASS  packages/nana-setup/tests/doctor-memory-links.test.mjs          12 pass  2.2s
PASS  packages/nana-setup/tests/doctor-package-source.test.mjs        10 pass  2.5s
PASS  packages/nana-setup/tests/doctor-quiet.test.mjs                 7 pass  1.8s
PASS  packages/nana-setup/tests/doctor-release.test.mjs               2 pass  1.5s
PASS  packages/nana-setup/tests/doctor-pi-dependencies.test.mjs       3 pass  2.7s
PASS  packages/nana-setup/tests/entry-guidance.test.mjs               17 pass  0.4s
PASS  packages/nana-setup/tests/doctor-trust.test.mjs                 1 pass  0.7s
PASS  packages/nana-setup/tests/fsops.test.mjs                        17 pass  0.0s
PASS  packages/nana-setup/tests/fresh-machine.test.mjs                9 pass  0.1s
PASS  packages/nana-setup/tests/hook-producers.test.mjs               12 pass  0.1s
PASS  packages/nana-setup/tests/install-check-builder-env.test.mjs    3 pass  1.0s
PASS  packages/nana-setup/tests/install-overlap.test.mjs              4 pass  0.2s
PASS  packages/nana-setup/tests/install-check.test.mjs                125 pass  1.7s
PASS  packages/nana-setup/tests/memory-pause.test.mjs                 2 pass  0.9s
PASS  packages/nana-setup/tests/doctor-runtime.test.mjs               21 pass  4.3s
PASS  packages/nana-setup/tests/paths.test.mjs                        5 pass  0.0s
PASS  packages/nana-setup/tests/pi-install-pin.test.mjs               10 pass  0.1s
PASS  packages/nana-setup/tests/pi-registration.test.mjs              72 pass, 3 skip  5.8s
PASS  packages/nana-setup/tests/project-key.test.mjs                  13 pass, 1 skip  0.0s
PASS  packages/nana-setup/tests/objective-path-shapes.test.mjs        5 pass, 1 skip  6.5s
PASS  packages/nana-setup/tests/project-odd-seeds.test.mjs            8 pass  3.8s
PASS  packages/nana-setup/tests/project-working-region.test.mjs       28 pass  0.2s
PASS  packages/nana-setup/tests/install.test.mjs                      102 pass  11.9s
PASS  packages/nana-setup/tests/readme-rehearsal.test.mjs             8 pass  0.1s
PASS  packages/nana-setup/tests/pull-cut-turn.test.mjs                1 pass  0.9s
PASS  packages/nana-setup/tests/project-stale.test.mjs                11 pass  5.3s
PASS  packages/nana-setup/tests/roster-notice-hook.test.mjs           4 pass  0.7s
PASS  packages/nana-setup/tests/relative-agent-dir.test.mjs           31 pass  2.5s
PASS  packages/nana-setup/tests/restore.test.mjs                      17 pass  2.1s
PASS  packages/nana-setup/tests/seat-rule.test.mjs                    4 pass  0.0s
PASS  packages/nana-setup/tests/seat-pull-off.test.mjs                8 pass  1.8s
PASS  packages/nana-setup/tests/rulings-install.test.mjs              13 pass  4.9s
PASS  packages/nana-setup/tests/shared-link-state.test.mjs            7 pass  0.1s
PASS  packages/nana-setup/tests/shared-memory-budget.test.mjs         7 pass  0.6s
PASS  packages/nana-setup/tests/settings-merge.test.mjs               213 pass  5.5s
PASS  packages/nana-setup/tests/shared-memory-hook.test.mjs           43 pass  1.0s
PASS  packages/nana-setup/tests/shared-memory-input.test.mjs          3 pass  0.1s
PASS  packages/nana-setup/tests/win-shims-sh.test.mjs                 2 pass  0.5s
PASS  packages/nana-setup/tests/writing-rule.test.mjs                 4 pass  0.1s
PASS  packages/nana-stage/tests/blocks.test.mjs                       116 pass  0.1s
PASS  packages/nana-setup/tests/uninstall.test.mjs                    31 pass  3.1s
PASS  apps/desk/test/buffer-caps.test.mjs                             1 pass  0.3s
PASS  apps/desk/test/host-rule.test.mjs                               30 pass  0.8s
PASS  apps/desk/test/origin-rule.test.mjs                             11 pass  0.4s
PASS  apps/desk/test/app-listener.test.mjs                            76 pass  6.4s
PASS  apps/desk/test/pi-resolution.test.mjs                           43 pass  1.4s
PASS  apps/desk/test/stage-key-persistence.test.mjs                   2 pass  1.3s
PASS  apps/desk/test/usage-line.test.mjs                              6 pass  2.8s
PASS  apps/desk/test/page-retire.test.mjs                             4 pass, 2 skip  9.0s
PASS  apps/bench/test/anatomy-labels.test.mjs                         30 pass  1.5s
PASS  apps/bench/test/anatomy-seat.test.mjs                           17 pass  0.7s
PASS  apps/bench/test/anatomy.test.mjs                                9 pass  1.4s
PASS  packages/nana-setup/tests/setup-tail.test.mjs                   9 pass  59.4s
PASS  packages/nana-pack/tests/templates-update.test.mjs              35 pass  152.9s
PASS  packages/nana-pack/tests/bounded-read.test.mjs                  4 pass  0.1s
PASS  packages/nana-pack/tests/test-locked.test.mjs                   17 pass  5.0s

189 files: 188 PASS, 1 FAIL, 0 SKIP, 0 WARN · checks: 4503 pass, 0 fail, 14 skip · 571.7s
failed: packages/nana-pack/tests/data-pack.test.mjs
```

## trace

```text
requirements: 2742 total (2022 implemented · 8 planned · 569 retired · 140 untested · 3 violated); 2035 traced by tests
ears: 0 rows off form (allowance 0)
(node:90039) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file://$WORKTREE/templates/typescript/template/tests/requirements-trace.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to $WORKTREE/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
```

## map

```text
code map: 549 modules over scripts, apps/desk, apps/bench, packages/nana-pack/lib, packages/nana-pack/bin, packages/nana-pack/extensions, packages/nana-knowledge/lib, packages/nana-knowledge/bin, packages/nana-knowledge/extensions, packages/nana-stage/lib, packages/nana-stage/extensions, packages/nana-setup/lib, packages/nana-setup/bin, packages/nana-setup/claude/hooks, packages/nana-pack/tests, packages/nana-knowledge/tests, packages/nana-stage/tests, packages/nana-setup/tests, apps/desk/test, apps/bench/test; 0 without a usable contract header; 0 problem(s)
```

## readme

```text
readme: 790 claims checked; 0 problem(s)
review archive: 0 problems
```
