VERDICT: PARTIAL

**Commit:** `0fd25d37` — added the component audit and checked model.

- **Files:** `README.md`, `REQUIREMENTS.md`, `docs/code-map.md`, `docs/known-bugs/FEAT-039.md`, `docs/requirements-tree.md`, `docs/components/{contract,fixture,nana-pi}.json`, `scripts/component-audit{,-config}.mjs`, `scripts/component-contract.mjs`, `packages/nana-pack/lib/ask-shape.mjs`, and `packages/nana-pack/tests/component-audit.test.mjs`.
- **Rows:** R-3100–R-3110 are implemented. Test titles: “check passes tracked source and names each missing component path”; “unknown feature and evidence IDs are named”; “frozen contract accepts fixture and names schema-rule violations”; “derived feature values come from ledger and hand source cannot prefill them”; “activity counts recent first-parent changes and unmerged feature refs”; “tracked audit has workflow and governance homes”; “asks round-trip through planner labels and identity scan”; “sealed audit values retain provenance”; “status and anchor rules name the component, rule and anchor”; “stale age is report-only, limit is inclusive, non-ancestor fails”; “mapped module coverage names unclaimed paths and never fails.”
- **Mutation pairs:** none completed. The component test and ask-parser test passed before the commit.
- **Checks:** `npm run map:check`, `npm run readme:check`, requirements trace, requirements tree, known-bugs check, and the component test passed. `node scripts/identity-scan.mjs` exited 1 on `docs/reviews/component-audit-2026-10-29/plan.md`; the same finding exists at `HEAD^`. The working tree is clean.
- **Full suite:** `npm run test:locked` exited 1: **236 files; 233 PASS, 1 FAIL, 2 SKIP; 8,701 checks pass, 1 fails, 44 skip.** The failure is the same identity-scan finding.
- **Sealed values:** contract SHA-256 `ea48a6136c4fc7b77d1a1d949d08cf8a23795560f4623e9a0318a253dd2de39e`; fixture SHA-256 `09d305725ce77b4d6e1aa2cb035bce06bd4c7274fa571bfb5b51714278363ebd`. Both match the plan’s frozen values. Provenance is the shared data contract’s §Files. The activity window is 14 days, chosen for a two-week snapshot ending at HEAD’s commit time. The stale limit is 20 commits, chosen as about three typical lanes. The hand-source and contract paths come from the shared data contract.
- **Departures:** no exported product-report status-count helper existed, so counts use the required `readRequirementRows` data. Release-status queries were not reused because they do not measure branch diffs touching component parts. I did not edit `HANDOFF.md` or session archives, despite the plan listing them, because the lane instructions prohibit those edits. No existing test was changed.
- **Not done:** a green locked full suite and green repository identity scan. The builder did not post asks; the seat owns posting.

**`--check` output, full:**
```text
unclaimed: packages/nana-pack/bin/brief-check.mjs
unclaimed: packages/nana-pack/bin/build-report.mjs
unclaimed: packages/nana-pack/bin/nana-adoption.mjs
unclaimed: packages/nana-pack/bin/nana-frontier.mjs
unclaimed: packages/nana-pack/bin/nana-issue-watch.mjs
unclaimed: packages/nana-pack/bin/nana-roster.mjs
unclaimed: packages/nana-pack/bin/review-launch.mjs
unclaimed: packages/nana-pack/bin/review-ledger.mjs
unclaimed: packages/nana-pack/bin/review-shape.mjs
unclaimed: packages/nana-pack/bin/review-timeline.mjs
unclaimed: packages/nana-pack/bin/worker-config.mjs
unclaimed: packages/nana-pack/tests/adoption-producer.test.mjs
unclaimed: packages/nana-pack/tests/adoption-reader.test.mjs
unclaimed: packages/nana-pack/tests/agent-dir-config.test.mjs
unclaimed: packages/nana-pack/tests/agent-dir-hostile.test.mjs
unclaimed: packages/nana-pack/tests/agent-dir-parity.test.mjs
unclaimed: packages/nana-pack/tests/agent-dir-var-spellings.test.mjs
unclaimed: packages/nana-pack/tests/ask-shape.test.mjs
unclaimed: packages/nana-pack/tests/blast-radius.test.mjs
unclaimed: packages/nana-pack/tests/bounded-read.test.mjs
unclaimed: packages/nana-pack/tests/brief-check.test.mjs
unclaimed: packages/nana-pack/tests/build-records.test.mjs
unclaimed: packages/nana-pack/tests/build-report.test.mjs
unclaimed: packages/nana-pack/tests/ci-records.test.mjs
unclaimed: packages/nana-pack/tests/ci-workflow.test.mjs
unclaimed: packages/nana-pack/tests/claude-review.test.mjs
unclaimed: packages/nana-pack/tests/code-map.test.mjs
unclaimed: packages/nana-pack/tests/code-search.test.mjs
unclaimed: packages/nana-pack/tests/component-audit.test.mjs
unclaimed: packages/nana-pack/tests/config-display-text.test.mjs
unclaimed: packages/nana-pack/tests/config-gate-fallback.test.mjs
unclaimed: packages/nana-pack/tests/config-handlers-malformed.test.mjs
unclaimed: packages/nana-pack/tests/config-normalize.test.mjs
unclaimed: packages/nana-pack/tests/config-project-gate-fallback.test.mjs
unclaimed: packages/nana-pack/tests/config-trust.test.mjs
unclaimed: packages/nana-pack/tests/display-surfaces.test.mjs
unclaimed: packages/nana-pack/tests/fake-pi.mjs
unclaimed: packages/nana-pack/tests/first-look.test.mjs
unclaimed: packages/nana-pack/tests/frontier-golden.test.mjs
unclaimed: packages/nana-pack/tests/frontier-summary.test.mjs
unclaimed: packages/nana-pack/tests/frontier.test.mjs
unclaimed: packages/nana-pack/tests/gate-config-robustness.test.mjs
unclaimed: packages/nana-pack/tests/gate-corpus.test.mjs
unclaimed: packages/nana-pack/tests/gate-policy-paths.test.mjs
unclaimed: packages/nana-pack/tests/gate-rm-inside.test.mjs
unclaimed: packages/nana-pack/tests/gate-rm-outside.test.mjs
unclaimed: packages/nana-pack/tests/gate-self-protection.test.mjs
unclaimed: packages/nana-pack/tests/gate-status.test.mjs
unclaimed: packages/nana-pack/tests/gate-survives-mutation.test.mjs
unclaimed: packages/nana-pack/tests/git-only-path.mjs
unclaimed: packages/nana-pack/tests/handoff-artifact.test.mjs
unclaimed: packages/nana-pack/tests/handoff-asks.test.mjs
unclaimed: packages/nana-pack/tests/handoff-issues.test.mjs
unclaimed: packages/nana-pack/tests/handoff-staleness.test.mjs
unclaimed: packages/nana-pack/tests/handoff-store.test.mjs
unclaimed: packages/nana-pack/tests/handoff-symlink.test.mjs
unclaimed: packages/nana-pack/tests/handoff-trust.test.mjs
unclaimed: packages/nana-pack/tests/handoff-writer-role.test.mjs
unclaimed: packages/nana-pack/tests/identity-scan.test.mjs
unclaimed: packages/nana-pack/tests/immutable-review.test.mjs
unclaimed: packages/nana-pack/tests/issue-watch.test.mjs
unclaimed: packages/nana-pack/tests/keep-movement.test.mjs
unclaimed: packages/nana-pack/tests/known-bugs.test.mjs
unclaimed: packages/nana-pack/tests/land-ci-records.test.mjs
unclaimed: packages/nana-pack/tests/land-fixtures.mjs
unclaimed: packages/nana-pack/tests/land-records.test.mjs
unclaimed: packages/nana-pack/tests/land.test.mjs
unclaimed: packages/nana-pack/tests/lane-class.test.mjs
unclaimed: packages/nana-pack/tests/lane-watcher.test.mjs
unclaimed: packages/nana-pack/tests/lane-write-guard.test.mjs
unclaimed: packages/nana-pack/tests/launch-wait.mjs
unclaimed: packages/nana-pack/tests/ledger-repo.mjs
unclaimed: packages/nana-pack/tests/lifecycle-journal.test.mjs
unclaimed: packages/nana-pack/tests/lifecycle-reload.test.mjs
unclaimed: packages/nana-pack/tests/line-endings.test.mjs
unclaimed: packages/nana-pack/tests/linked-launch.test.mjs
unclaimed: packages/nana-pack/tests/mutation-runner-takeover.test.mjs
unclaimed: packages/nana-pack/tests/mutation-runner.test.mjs
unclaimed: packages/nana-pack/tests/nana-roster-set.test.mjs
unclaimed: packages/nana-pack/tests/nana-roster.test.mjs
unclaimed: packages/nana-pack/tests/notify-dispatch.test.mjs
unclaimed: packages/nana-pack/tests/notify-fallback.test.mjs
unclaimed: packages/nana-pack/tests/objective-golden.test.mjs
unclaimed: packages/nana-pack/tests/objective-injection.test.mjs
unclaimed: packages/nana-pack/tests/outside-reader.test.mjs
unclaimed: packages/nana-pack/tests/pack-config-utf16.test.mjs
unclaimed: packages/nana-pack/tests/pages-workflow.test.mjs
unclaimed: packages/nana-pack/tests/path-spelling.test.mjs
unclaimed: packages/nana-pack/tests/pi-install.mjs
unclaimed: packages/nana-pack/tests/pi-install.test.mjs
unclaimed: packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs
unclaimed: packages/nana-pack/tests/pipe-guard.test.mjs
unclaimed: packages/nana-pack/tests/planner-prompt.test.mjs
unclaimed: packages/nana-pack/tests/post-edit-default-timeout.test.mjs
unclaimed: packages/nana-pack/tests/post-edit-file-queue.test.mjs
unclaimed: packages/nana-pack/tests/post-edit-hardening.test.mjs
unclaimed: packages/nana-pack/tests/post-edit-status.test.mjs
unclaimed: packages/nana-pack/tests/post-edit-utf8.test.mjs
unclaimed: packages/nana-pack/tests/post-edit-values-named.test.mjs
unclaimed: packages/nana-pack/tests/process-tree-helper.test.mjs
unclaimed: packages/nana-pack/tests/process-tree.test.mjs
unclaimed: packages/nana-pack/tests/product-detail.test.mjs
unclaimed: packages/nana-pack/tests/product-overview.test.mjs
unclaimed: packages/nana-pack/tests/product-report.test.mjs
unclaimed: packages/nana-pack/tests/pwsh-oracle.mjs
unclaimed: packages/nana-pack/tests/readme-check.test.mjs
unclaimed: packages/nana-pack/tests/real-path.test.mjs
unclaimed: packages/nana-pack/tests/release-status.test.mjs
unclaimed: packages/nana-pack/tests/rename-retry.test.mjs
unclaimed: packages/nana-pack/tests/report-fixtures.mjs
unclaimed: packages/nana-pack/tests/requirement-rows.test.mjs
unclaimed: packages/nana-pack/tests/requirements-cap-kinds.test.mjs
unclaimed: packages/nana-pack/tests/requirements-deliverables.test.mjs
unclaimed: packages/nana-pack/tests/requirements-lift.test.mjs
unclaimed: packages/nana-pack/tests/requirements-moved.test.mjs
unclaimed: packages/nana-pack/tests/requirements-regroup.test.mjs
unclaimed: packages/nana-pack/tests/requirements-trace.test.mjs
unclaimed: packages/nana-pack/tests/requirements-tree.test.mjs
unclaimed: packages/nana-pack/tests/requirements-unclaimed.test.mjs
unclaimed: packages/nana-pack/tests/review-launch.test.mjs
unclaimed: packages/nana-pack/tests/review-ledger.test.mjs
unclaimed: packages/nana-pack/tests/review-movement.test.mjs
unclaimed: packages/nana-pack/tests/review-round.test.mjs
unclaimed: packages/nana-pack/tests/review-standard.test.mjs
unclaimed: packages/nana-pack/tests/review-test-waits.test.mjs
unclaimed: packages/nana-pack/tests/review-timeline.test.mjs
unclaimed: packages/nana-pack/tests/roster-notice.test.mjs
unclaimed: packages/nana-pack/tests/rulings.test.mjs
unclaimed: packages/nana-pack/tests/runtime-land.test.mjs
unclaimed: packages/nana-pack/tests/runtime-map.test.mjs
unclaimed: packages/nana-pack/tests/skill-claims.mjs
unclaimed: packages/nana-pack/tests/slow-sampler.mjs
unclaimed: packages/nana-pack/tests/suite-records.test.mjs
unclaimed: packages/nana-pack/tests/template-acceptance.test.mjs
unclaimed: packages/nana-pack/tests/template-release.test.mjs
unclaimed: packages/nana-pack/tests/templates-render.test.mjs
unclaimed: packages/nana-pack/tests/templates-update.test.mjs
unclaimed: packages/nana-pack/tests/test-locked.test.mjs
unclaimed: packages/nana-pack/tests/test-runner-parallel.test.mjs
unclaimed: packages/nana-pack/tests/test-runner.test.mjs
unclaimed: packages/nana-pack/tests/tmp-dir.mjs
unclaimed: packages/nana-pack/tests/ts-syntax-check.test.mjs
unclaimed: packages/nana-pack/tests/watchdog-cpu.test.mjs
unclaimed: packages/nana-pack/tests/watchdog-exit.test.mjs
unclaimed: packages/nana-pack/tests/win-command.test.mjs
unclaimed: packages/nana-pack/tests/win32-launch.test.mjs
unclaimed: packages/nana-pack/tests/windows-skip-lines.test.mjs
unclaimed: packages/nana-pack/tests/worker-claude.test.mjs
unclaimed: packages/nana-pack/tests/worker-lane.test.mjs
unclaimed: packages/nana-pack/tests/writing-check.test.mjs
unclaimed: packages/nana-pack/tests/writing-injection.test.mjs
unclaimed: packages/nana-pack/tests/writing-trial-extractor.test.mjs
unclaimed: scripts/blast-radius.mjs
unclaimed: scripts/ci-records.mjs
unclaimed: scripts/code-map-launch.mjs
unclaimed: scripts/code-search-config.mjs
unclaimed: scripts/code-search.mjs
unclaimed: scripts/component-audit-config.mjs
unclaimed: scripts/component-audit.mjs
unclaimed: scripts/component-contract.mjs
unclaimed: scripts/deliverables.mjs
unclaimed: scripts/first-look-config.mjs
unclaimed: scripts/known-bugs.mjs
unclaimed: scripts/outside-reader-config.mjs
unclaimed: scripts/readme-check.mjs
unclaimed: scripts/requirement-rows.mjs
unclaimed: scripts/requirements-lift-proof.mjs
unclaimed: scripts/requirements-lift.mjs
unclaimed: scripts/requirements-moved.mjs
unclaimed: scripts/requirements-regroup.mjs
unclaimed: scripts/runtime-measure.mjs
unclaimed: scripts/test-locked.mjs
unclaimed: scripts/ts-syntax-check.mjs
unclaimed: 175 of 475 mapped modules
```

**`--asks` output, full:**
```text
Redesign Library: Should shared memory move from a printed index to a searched, reviewed store
Question: Should shared memory move from a printed index to a searched, reviewed store?
Seat recommends: keep the printed index
What the default gains and misses: No new moving part; misses the descriptions already cut to stubs and the newest entries beyond the cap.
Cost of a wrong guess: Easy to undo
If answered otherwise: Plan a searched-store lane that can evaluate the machine-local memory MCP tools as prior art.
```
