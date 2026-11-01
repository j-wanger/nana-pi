# Build 5 technical record

Feature: FEAT-041 · Shape each agent's context by role

## Closures

- Restored settings-only cloud credentials, endpoints and authentication helpers for both Claude Code roles. The new launcher test and four code-breaking pairs pin carry and value-free diagnostics.
- Closed the Windows home escape in the TTY hook fixture. Audited hook and launcher fixtures and supplied both home variables and explicit temporary agent directories where missing.

## Files and rows

- `REQUIREMENTS.md`: expanded existing R-3211 before writing its new tagged test. No new ID, tree movement, share or artifact was introduced. R-2655 still describes the builder's allowlisted carry; its existing exact-oracle test changed with the allowlist.
- `packages/nana-pack/bin/worker-config.mjs`: added ten missing env names and two missing helper keys. AWS_PROFILE, ANTHROPIC_VERTEX_PROJECT_ID, CLOUD_ML_REGION and awsCredentialExport were already sealed and remain present. All sixteen requested names were verified against installed Claude Code 2.1.310; none was dropped as unread. `cloud-carry-provenance.log` records the binary hash and embedded reader excerpts, not user settings.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: added only `R-3211: cloud carry preserves settings-only logins without exposing values`. Four temporary fixtures exercise reviewer/builder × Bedrock/Vertex. They remove inherited carry env, compare every settings value and helper, reject hooks/permissions and inspect stdout, stderr and the load log for synthetic private values. The existing awaited per-case timeout harness bounds the new test.
- `packages/nana-pack/README.md`: documents five helper keys and the expanded cloud carry. `docs/code-map.md` was regenerated; outline generation made no diff.
- `docs/reviews/context-anatomy-2026-10-31/pairs.mjs`: adds four temporary-code mutations, with no suite import or execution of this seat runner.

## Home audit and existing test edits

The audit searched every test source for the shared-memory hook and all three launcher names, then inspected child environment construction. The following existing fixture edits are the brief's requested isolation repair, not assertion changes:

- `packages/nana-setup/tests/shared-memory-input.test.mjs`: added USERPROFILE and an explicit temporary PI_CODING_AGENT_DIR to the explicit TTY child environment.
- `packages/nana-setup/tests/shared-memory-hook.test.mjs`: added an explicit temporary agent directory to its shared helper and both direct child spawns.
- `packages/nana-setup/tests/shared-memory-budget.test.mjs`: added an explicit temporary agent directory.
- `packages/nana-setup/tests/hooks-win32-exec.test.mjs`: overrides inherited PI_CODING_AGENT_DIR with its temporary home's agent directory.
- `packages/nana-setup/tests/install.test.mjs`: both SessionStart shell spawns now set USERPROFILE and an explicit temporary agent directory.
- `packages/nana-pack/tests/worker-lane.test.mjs`: both worker environment constructors now set USERPROFILE as well as HOME and the existing temporary agent directory.
- `packages/nana-pack/tests/brief-check.test.mjs`: added USERPROFILE beside HOME and the existing temporary agent directory.
- `packages/nana-pack/tests/handoff-writer-role.test.mjs`: reviewer child now overrides inherited PI_CODING_AGENT_DIR with its temporary agent directory.
- `packages/nana-pack/tests/roster-notice.test.mjs`: both explicit hook child environments now set USERPROFILE. The deliberately relative agent-directory case stays relative under a temporary cwd.
- `packages/nana-pack/tests/watchdog-cpu.test.mjs`: non-lane worker children now explicitly set both home variables and a temporary agent directory instead of inheriting the caller's home.

The already-isolated context-anatomy, claude-review, build-records, build-report, review-standard, review-ledger, linked-launch, immutable-review, path-spelling, lane-class, watchdog-exit and win32-launch fixtures needed no change. hooks-closed-output already sets all three variables. review-test-waits runs the isolated immutable-review fixture; it does not directly launch a role child. install-check's environment intentionally tests an unset agent override while explicitly setting both temporary home variables. Other search hits name files, render fake shims, inspect source, or exercise setup commands rather than launch these role children or the shared-memory hook.

Only existing assertions made false by the new carry were edited: `packages/nana-pack/tests/worker-claude.test.mjs`, R-2655's exact top-level inventory and carry diagnostic now include awsAuthRefresh; its seal test includes the expanded key and env lists. No other existing assertion changed. No test was removed. The context test header now counts eleven cases.

## Wrong-code proof

- `cloud-wrong-first.log`: the new test ran before implementation, exit 1 on the missing bearer-token carry seal.
- `pairs-build-5.log`: 38 pairs; 0 failed pairs. Each mutation runs against an OS-temp copy, exits 1, then passes unchanged after restoring code, exit 0.
- New pairs drop cloud credentials, drop cloud endpoints, drop cloud authentication helpers, and print private settings through the carry diagnostic. The last pair proves the value-leak assertion fails when code leaks; assertions are never inverted.
- Existing 34 pairs remain green. No model session, reviewer or subagent was started.

## Commands and exit codes

- `node scripts/test.mjs context-anatomy shared-memory-input shared-memory-hook shared-memory-budget worker-claude worker-lane brief-check handoff-writer-role install.test hooks-win32-exec roster-notice`: exit 0; `build-5-targeted.log`, 345 passing checks. The later watchdog-cpu fixture repair is covered by the locked full suite.
- `node docs/reviews/context-anatomy-2026-10-31/pairs.mjs`: exit 0, 38 pairs and zero failed pairs.
- `npm run map`: exit 0. `node scripts/requirements-tree.mjs --write`: exit 0. The initial unsupported combined `--root . --write` invocation exited 2 before the corrected command; `generate-build-5.log` retains it.
- `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs`: exit 0; all local macOS probes passed, including both launchers and shared memory. See `install-build-5.log`.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --root .`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs`: exit 0 each; `validation-build-5.log`.
- Shared-parser title audit: exit 0; `titles-build-5.log`: one row, two titles, 0 missing. An initial inline invocation passed `-` as argv[1] and failed the imported CLI's entry-point check before auditing; the corrected stdin invocation passed.
- `npm run test:locked`: foreground, declared machine lock, exit 0; `full-suite-build-5.log`.

**247 files: 245 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8840 pass, 0 fail, 44 skip · 645.2s**

The final message reports the commit, checks repeated on that commit and the finished pushed-tip CI run, including Windows. This record does not predeclare a CI result.

## Precedent and known bugs

All four named precedent files were read before design. The implementation uses the existing sealed configuration and shared settings carry without copying, moving or changing the helper. The new test follows the existing fake-launcher fixture and bounded harness. No precedent departure was needed.

No listed known bug was fixed or edited. Expanded credential names pass through the existing case-insensitive carry matching; the recorded exact-name sealed-override residual remains unchanged. Settings cleanup after hard kills, Windows special-character paths, concurrent logging, effort fallback/model aliases and digest limits remain unchanged.

## Not done

Optional builder effort parity was not implemented; this fix stays confined to the two MUSTs. No new live-cloud or real-model request was made. The seat retains confirmation reviews and land. HANDOFF, known-bug files and session archives were not edited. No GitHub issue was created or changed.
