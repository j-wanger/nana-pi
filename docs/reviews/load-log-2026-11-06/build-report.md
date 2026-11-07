# Load-log build record

Branch: `feat/load-log`. The final reply names the committed tip.

## Implemented scope

- `REQUIREMENTS.md`: added FEAT-041 rows R-3726–R-3732 before tests and code. No new shares or sealed tunables.
- `packages/nana-pack/lib/pi-package.mjs`: moved the Windows npm package-directory lookup out of pi-watchdog; added POSIX executable-realpath ascent with the same package-name check.
- `packages/nana-pack/bin/pi-watchdog.mjs`: imports the shared locator; retains bin containment, file checks, launch arguments and Windows refusals.
- `packages/nana-pack/lib/pi-context-load.mjs`: imports pi's public `dist/index.js` at runtime and delegates to `loadProjectContextFiles`; constructs all parts through `contextPart`.
- `packages/nana-pack/lib/agent-dir.mjs`: adds optional child env/cwd/home inputs to the existing resolver rather than duplicating normalization.
- `packages/nana-pack/bin/pi-worker.mjs`: records lane slot, piVersion and measured context for pi lane and role children using the actual child environment.
- `packages/nana-pack/bin/pi-review.mjs`: records the temporary checkout cwd, its measured context, piVersion, and land/reviewer slot.
- `packages/nana-pack/README.md`: updates load-line fields, parts, runtime dependency resolution and the old context-file exclusion statement.
- `packages/nana-setup/claude/rules/nana-seat.md`: adds the requested land-role instruction.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerated.

## Tests and mutation pairs

Seven new tagged cases live in `packages/nana-pack/tests/context-anatomy.test.mjs`. Every case is awaited under the existing per-case limit. Fixtures use OS temp directories. Text fixtures include CRLF, trailing spaces/tabs and no final newline. Real pi 1.4.0 ran R-3727 without a skip. No model session was started.

Initial pre-implementation runs of all seven cases exited 1 (`wrong-R-*.log`). Three helper-facing cases initially failed because their modules did not yet exist. The behavioral wrong-code pairs below subsequently failed on assertions, not missing imports. Mutations changed isolated temporary copies of production code, never assertions.

| Row | Broken production behavior | Wrong exit | Restored exit |
|---|---|---|---|
| R-3726 | Discard the exported loader results | 1 | 0 |
| R-3727 | Discard real pi's context results | 1 | 0 |
| R-3728 | Resolve the parent's agent dir | 1 | 0 |
| R-3729 | Log sourceRoot instead of checkout cwd | 1 | 0 |
| R-3730 | Always log builder, including larger lanes | 1 | 0 |
| R-3731 | Ignore both disabled-context flags | 1 | 0 |
| R-3732 | Silently omit the missing export | 1 | 0 |

`mutation-R-*.log` and `mutations.log` carry the behavioral pairs. The temporary runner was `/tmp/load-log-mutations.mjs`.

Two existing assertions became false and were edited:

- `packages/nana-pack/tests/worker-claude.test.mjs`, MM5: pi role fixtures now have a second, unavailable-context part; Claude fixtures still have two original parts.
- `packages/nana-setup/tests/seat-rule.test.mjs`, original-rules allowlist: accepts the exact newly required land-review line.

No existing test was removed. Worker tests inject sealed child-env/argument variations only in temporary copies, without adding launcher delivery options.

## Commands and exits

All commands run from the lane worktree. Each exit was read separately.

- `pi --version`: 0; 1.4.0.
- `node scripts/code-map.mjs --impact packages/nana-pack/bin/pi-worker.mjs packages/nana-pack/bin/pi-review.mjs packages/nana-pack/bin/pi-watchdog.mjs packages/nana-pack/lib/agent-dir.mjs`: 0 before implementation.
- `CONTEXT_CASE=R-<id> node packages/nana-pack/tests/context-anatomy.test.mjs`: initial 1 for each new row; corrected 0 for each row.
- `node /tmp/load-log-mutations.mjs`: 0; seven assertion-failure/restored-success pairs, no real-pi skip.
- `node scripts/test.mjs context-anatomy worker-lane worker-claude win32-launch watchdog-exit watchdog-cpu agent-dir- immutable-review review-ledger-launch seat-rule`: 0. `14 files: 14 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 457 pass, 0 fail, 12 skip`. Skips are existing platform-specific cases.
- `node scripts/code-map.mjs --write`: 0.
- `node scripts/code-map.mjs --check`: 0; 615 modules, 0 unusable headers, 0 problems.
- `node scripts/readme-check.mjs`: 0; 1091 claims, 0 problems.
- `node --experimental-strip-types scripts/requirements-trace.mjs`: 0; 2541 rows, 2284 traced, 0 EARS violations.
- `node scripts/requirements-tree.mjs --write`: 0; 2541 rows, 43 features, 0 problems.
- `git diff --check`: 0.

Early broader runs exposed only the two obsolete assertions listed above and a stale generated map. The final runs passed after those changes.

The final reply reports checks rerun on the committed tip. Full-suite execution is deferred to CI under AGENTS.md; no CI was read or awaited.

## Precedent and departures

All six named precedent files were read before designing the implementation. The code follows their part construction, append lifecycle, selected-slot, runtime-import and fixture patterns. The Windows package-directory code moved rather than being copied. Its POSIX caller adds no npm-global-root lookup. The upstream loader is called directly through the public package entry; its walk was not mirrored.

The child-env resolver needed explicit inputs, so the existing exported agent-dir resolver gained optional inputs. This preserves the one shared normalization implementation; no private helper was copied.

The brief's known-bug edit conflicts with the builder's explicit prohibition on editing `docs/known-bugs/`. That file remains untouched. The seat should add the requested FEAT-041 residual:

> Claude Code children (claude-review, the Claude Code builder) log no context-file parts.

This change closes the pi context-file omission and missing lane/review slot measurements described in the brief. It fixes none of the supplied existing known bugs. Concurrent-writer, Claude memory-exclusion, effort-carry and relative-log-path limits remain unchanged.

## Not done

- No protected known-bug file, HANDOFF or session archive was edited.
- No push, GitHub issue action, credential lookup, model session, subagent or CI operation occurred.
- Native Windows execution remains for CI/the seat; the existing injected Windows locator/launcher checks passed locally.
- The macOS install rehearsal was not run. It creates real pi sessions, which the builder's no-model-sessions rule forbids. The seat must run `node packages/nana-setup/bin/install-check.mjs` before land because this change touches setup guidance.
- Initial helper-facing red runs were module-absence failures; the later behavioral mutation pairs provide the assertion-level proof.
