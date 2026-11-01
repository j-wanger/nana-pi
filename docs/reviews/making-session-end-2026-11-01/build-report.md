VERDICT: PARTIAL

The implementation and local suite pass. The required local install check still fails on the brief's documented builder-environment `pi post-edit` write-error. Its memory hook row passes. The finished CI result for the pushed final tip belongs in the builder's final response; this record precedes that run.

## Commits and scope

- `57a5adac`: implementation, requirements, eight must-meets, five seals, fixtures, generated maps and initial evidence. Followed the green 245-check touched run in `touched-final.log`.
- `6889db9f`: evidence-only follow-up fixes the lane mutation table's `self` URL and exit-code propagation, adds verification records, removes local machine paths from early logs and records the green locked suite.
- Cleanup follow-up: Windows CI passed all seven hook assertions but encountered `EBUSY` removing the detached fixture's home. Its cleanup now imports the existing sealed test-runner retry count and delay; no assertion, runtime code, new test, row or tunable changes. No runtime code changes after `57a5adac`.
- Draft pull request: #295, opened at build 1. Branch: `feat/making-session-end`. No land performed.

## Items, files, rows and mutation pairs

| Item | Files | Rows | Wrong-code pairs |
|---|---|---|---|
| Quiet SessionEnd handoff | `packages/nana-setup/claude/hooks/nana-memory-end.mjs`, `packages/nana-setup/lib/memory-end-config.mjs`, `packages/nana-pack/lib/memory-start.mjs`, `packages/nana-pack/lib/memory-run.mjs`; new `memory-end-hook.test.mjs` | R-3350–R-3352, R-3355, R-3358–R-3360 | `1-hidden`, `1-cwd`, `2-role`, `2-empty-role`, `2-ci`, `2-transcript`, `2-deadline`, `2-exit`, `3-import`, `4-timeout`, `6-wait`, `seal-deadline`, `seal-entry` |
| Setup lifecycle | `packages/nana-setup/lib/{settings,steps,state-manifest,install-check-config,install-check}.mjs`; new `memory-end-wiring.test.mjs`; setup README | R-3353 | `4-repair`, `4-check-ci` |
| Honest transport and tracking | `packages/nana-pack/lib/{profile-sync,memory-run,memory-run-config}.mjs`, `packages/nana-pack/bin/nana-memory.mjs`; new `memory-session-end.test.mjs` | R-3354, R-3361 | `5-cas`, `5-push-failure`, `5-ref-result`, `5-result`, `seal-push` |
| Machine-local count-only health | `packages/nana-setup/lib/doctor.mjs`, `packages/nana-pack/lib/{memory-run,profile-sync}.mjs`, memory CLI; new memory test above | R-3356, R-3362 | `7-local`, `7-note`, `seal-note` |
| Empty runs | `packages/nana-pack/lib/memory-run.mjs`; new memory test above | R-3357 | `8-empty` |
| Contract and navigation | `REQUIREMENTS.md`, `packages/nana-pack/README.md`, `packages/nana-setup/README.md`, `docs/code-map.md`, `docs/requirements-tree.md` | R-3350–R-3362 implemented, with backticked test evidence; R-3363–R-3369 unused | Covered by the above |

SUB-024 remains under FEAT-040. A-093 gains the hook maker; no new artifact.

## Test order and evidence

Requirements changed first, then tagged tests, then runtime code. `wrong-first-hook.log`, `wrong-first-wiring.log` and `wrong-first-memory.log` record exit 1 against the absent hook/config or the old implementation. Their machine paths and repeated Node stack frames are omitted. The later mutation campaign breaks runtime code, never assertions.

The three new suite files contain exactly eight must-meet cases and five seal cases. Every async case is awaited under its own ceiling. Fixtures use temporary homes and synthetic transcripts. Push tests use a temporary profile clone and local bare remote. No real profile, transcript or Claude settings were read. No test calls a model or imports/copies a seat script.

`seat-mutate.mjs` is lane-only and uses the existing shared mutation runner. The first attempted invocation exposed a table `self` type error; the table now passes `import.meta.url` and propagates the runner's returned exit code. The actual campaign succeeded:

```
RESULT: 24/24 red (24 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, across 3 shards
```

Baseline titles: 0 missing. See `mutation-result.txt` and `mutation-run.log`.

## Existing test edits

Only expectations made false by this change were edited:

- `packages/nana-setup/tests/settings-merge.test.mjs`: seventh entry, SessionEnd fixture, removal inventory.
- `packages/nana-setup/tests/install-check.test.mjs`: SessionEnd row, its 1.5-second timeout, seventh hook inventory and informational doctor label.
- `packages/nana-setup/tests/uninstall.test.mjs`: added hook increases the dry-run inventory by one.
- `packages/nana-setup/tests/win32-degrade.test.mjs`: new hook name in output exclusions; stale-entry fixtures use each wanted timeout rather than 5.
- `packages/nana-setup/tests/win32-hook-repair.test.mjs`: repair advice includes the new stale SessionEnd entry.
- `packages/nana-pack/tests/memory-run-recovery.test.mjs`: status now ends in `unpushed 0`.
- `packages/nana-pack/tests/templates-render.test.mjs`: the in-session runtime inventory excludes SessionEnd; the table has no memory-making column (plan A4).

No existing test was deleted. New setup tests use their existing `tmpDir` helper after the full suite exposed the repository's direct-temp-allocation source rule. The new hook test's explicit cleanup also uses the test runner's existing sealed retry values, to tolerate the Windows fixture process briefly holding its cwd after writing its marker.

## Commands and exit codes

Environment for Node/toolchain-dependent runs: the existing global npm prefix was supplied through `npm_config_prefix`. It changed no repository configuration.

| Command | Exit | Record |
|---|---:|---|
| `node scripts/test.mjs --jobs=4 memory-end- memory-session-end memory-run-recovery templates-render test-runner.test` | 0 | `touched-final.log`: 245 pass |
| `npm run test:locked -- --jobs=4` | 0 | `full-suite.log` |
| `SEAT_MUTATE_SHARDS=3 SEAT_MUTATE_OUT=<record> node docs/reviews/making-session-end-2026-11-01/seat-mutate.mjs` | 0 | `mutation-result.txt`, `mutation-run.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 1 | `install-check.log`; only `pi post-edit` fails with the documented write-error |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme.log` |
| `node scripts/requirements-trace.mjs --root .` | 0 | `trace.log` |
| `node scripts/requirements-tree.mjs --check` | 0 | `tree-check.log`; includes deliverables check |
| `node scripts/known-bugs.mjs --root .` | 0 | `known-bugs-check.log` |
| `node scripts/identity-scan.mjs --root .` | 0 | `identity-check.log` |
| `node scripts/lane-class.mjs --root . --base main` | 0 | `hook: packages/nana-setup/claude/hooks/nana-memory-end.mjs — Claude Code hook` |
| `git push -u origin feat/making-session-end` | 0 | Draft PR #295 opened at build 1 |

The trace and known-bug records suppress Node's unrelated module-type warning, which otherwise exposes the local checkout's absolute path. Installation evidence replaces machine-specific executable paths with placeholders.

```
255 files: 253 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8931 pass, 0 fail, 44 skip · 728.3s
requirements tree: 0 problems; rows 2363; features 43
deliverables: 21 of 22 made and read by code, 21 more parked
FAIL pi post-edit — write-error: write tool result is marked as an error
PASS hook memory making
```

Earlier full runs exposed stale fixture expectations, raw machine paths in logs, and a tracked-output mistake: streaming the suite into its already tracked evidence file trips the suite's repository-write detector. The successful full run wrote to OS temp; its output was copied into the evidence file only after the suite exited. No test wrote this worktree.

## Precedent and departures

- Followed roster-notice's exported hook boundary, built-in-only static imports, dynamic nana imports inside `try`, real-path CLI guard and explicit zero exit. Reused `readHookInput`; no copied stdin reader.
- Moved only the plan-authorized land spawn part into `memory-start.mjs`. Both callers import it. Preserved the existing land line and last-run lookup. Reused `PROFILE_WORDS.notPushed`, existing reason words, `healthWords`, profile pointer/config readers and existing git helpers.
- Followed lane-watcher/knowledge detached spawning; added the plan's hidden window and home cwd. Survival test follows the knowledge hook teardown test and adds the specified descendant kill.
- Followed setup's desired hook, link, rebuild and install-check inventories. Existing health/stale-copy/uninstall producers pick up the new rows; no duplicate implementations.
- Used a built-ins-only setup config module for the new seals (plan O1), `rev-list --count` for the local count (O3), and a per-row env-removal list for install-check (O4).
- Test-harness departure from roster-notice: new tests import the existing profile `check` helper, wrap it with per-case deadlines, and use existing temp helpers. Reason: await every async case and enforce the brief's per-case limits without copying a harness. Windows CI additionally required cleanup retries; these import the existing `TEMP_REMOVE_RETRIES` and `TEMP_REMOVE_RETRY_DELAY_MS` seals, not new tuning values.
- Inventory-test adjustment described above is required by A4; neither AGENTS nor its canonical shared table changes. No other private helper moves or precedent departures.

## Known bugs touched and what remains

Read the whole FEAT-040 known-bug file. The detached-survival residual gains automated POSIX and Windows-normal-exit coverage; it is not closed without the owner's real Windows Claude Code check. Empty-run skipping narrows the already recorded clone-lock/fetch contention exposure but does not fix it. The existing land-line opt-in/prefix bug remains unchanged. No known-bug file was edited.

The plan's `refs/heads/main` limitation, listing-failure pending count, review-folder process cost, Windows startup-stall cancellation, default-refspec assumption and hidden downstream git-window caveat remain. No real owner-machine Windows check, land, model run, reviewer session, issue operation, HANDOFF edit or session-archive edit was performed.

Initial CI run 41318232363 completed with identity-log failures on every suite leg and the documented Windows R-3104 timeout. All four install-check legs passed. The failed Windows job was rerun once as requested. The evidence-only follow-up removed the identity-log failures. Its completed run 41321615578 passed both POSIX suites and all four install-check legs. The sole Windows failure was the new hook fixture cleanup (`EBUSY` after all seven assertions passed), fixed by the cleanup follow-up. The final response reports that follow-up tip's finished CI run and any retry.
