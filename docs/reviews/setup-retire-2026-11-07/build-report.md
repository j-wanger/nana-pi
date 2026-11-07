# setup-retire: requirement groundwork; implementation blocked

Feature: FEAT-013 · Install and connect harness runtimes

## Revision scope

Added R-3799 through R-3807, one planned row per M1 through M9.
No production file, test, skill, runtime table or existing requirement changed.
Updated `docs/components/nana-pi.json` to mark setup partial while these requirements remain planned.
No removal occurred, so no existing row or artifact claim was retired.
All nine must-meets remain unimplemented by this change.

## Open question for the seat

The builder instructions forbid deleting a test the brief does not name.
The plan names no obsolete test for deletion or retirement.
Several tests exclusively demand the behavior this lane must remove.
For example:

- `packages/nana-pack/tests/handoff-artifact.test.mjs` requires compaction writes and subsequent prompt injection.
- `packages/nana-pack/tests/notify-dispatch.test.mjs` requires OS notification dispatch.
- `packages/nana-pack/tests/post-edit-default-timeout.test.mjs` copies the removed extension and requires a checker deadline.

These are not surviving contracts with a changed expected value.
Their entire tested behavior is retired by M2.
Removing those cases, replacing them with absence checks, or skipping them would retire the tests without express authority.
Keeping their behavior would contradict M2 and the reduction's purpose.

Please name the obsolete test files or cases this lane may retire.
Mixed suites must retain their surviving cases, especially adoption and gate coverage.
No assertion was weakened and no retired implementation was retained just to satisfy an obsolete test.

## Reader inventory gathered before production edits

Read the complete plan and all named precedent files, including uninstall's unchanged-seed comparison.
Ran the code-map impact command on steps, settings, config and the handoff extension.
Searched tracked readers of the hook, hook library, three extensions and two seed sources.

Verified production seams:

| Proposed removal | Real readers to update together |
|---|---|
| Claude verifier hook | `packages/nana-setup/lib/steps.mjs` HOOKS; `packages/nana-setup/lib/settings.mjs` desiredHooks and matcher migration; `packages/nana-setup/lib/doctor.mjs`; `packages/nana-setup/lib/state-manifest.mjs`; install-check hook table and samples |
| Verifier hook library | `packages/nana-setup/tests/verifier-pipe.test.mjs` imports runHook; `packages/nana-setup/tests/hook-producers.test.mjs` probes its import |
| Handoff extension | pi discovers its extension directory; adoption journaling currently runs inside its session_start handler; adoption-producer, display-surfaces and writing-injection mix surviving contracts with handoff checks |
| Post-edit extension | pi directory discovery; config's PostEditCommand schema and normalization; install-check post-edit fixture and judgment; dedicated post-edit suites and mixed display/config suites |
| Notify extension | pi directory discovery; config notify block; code-map launch declaration; dedicated dispatch/fallback suites |
| Subagent config and reviewer seeds | steps seeds them; doctor reads their live paths; state-manifest imports both source paths; uninstall compares seed bytes through stateRows; install-check installs pi-subagents using doctor's exported floor |

The shared predicate `packages/nana-pack/lib/pipe-guard.mjs` remains a live dependency of the pi gate.
It must stay unchanged.
The adoption library, adoption CLI and SessionStart hook remain live consumers of adoption events.
They must stay.
The four Claude skills remain untouched.

No choice between a new adoption-only extension and a trimmed extension was implemented.
No precedent departure occurred because implementation stopped before tests or code.

## Known bugs

Read all of `docs/known-bugs/FEAT-013.md`.
No known-bug line was edited, removed or fixed.
No behavior changed, so this revision touches none of those bugs.

## Evidence

Check output is retained beside this report in `checks.log` and `tests.log`.
The first component audit exited 1 because sound setup cannot cite planned feature rows.
The first three-file test run exited 1: two component-audit checks failed for that same reason.
The next audit also exited 1 because partial status needs requirement anchors.
The component now says partial and anchors all nine planned rows.
The final component audit exited 0.
The final filtered run exited 0: 3 files passed; 170 checks passed; no checks failed or skipped.
No checker or assertion was changed to bypass that rule.
New tests: none. Existing test edits: none. Mutation pairs: none.
The full suite is left to CI under AGENTS.md; no CI was pushed, awaited or read.
The macOS install check, Windows runtime check and M1–M9 wrong-code proofs remain undone.
The new-test-file runner check does not apply: no test file was added or removed.

Pre-commit checks:

| Command | Exit |
|---|---|
| `npm run map:impact -- packages/nana-setup/lib/steps.mjs packages/nana-setup/lib/settings.mjs packages/nana-pack/lib/config.ts packages/nana-pack/extensions/nana-handoff.ts` | 0 |
| `npm run map` | 0 |
| `npm run map:check` | 0 |
| `npm run req:tree` | 0 |
| `npm run readme:check` | 0 |
| `node scripts/component-audit.mjs --check` (final) | 0 |
| `node scripts/test.mjs requirements-trace requirements-tree component-audit` (final) | 0 |

The final reply records checks repeated on the committed tip.
There are no removed sentences or paths to check for stale test pins in this revision.
