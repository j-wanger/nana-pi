# Builder-context build record

## Scope and rows

Implemented R-3733–R-3738 under FEAT-041. Updated R-2578 and R-2618 to qualify absent-section refusals by the fix-card marker. Updated R-2662 and its existing test to replace the obsolete stop-on-private rule.

Files: `REQUIREMENTS.md`, generated `docs/requirements-tree.md` and `docs/code-map.md`; `packages/nana-pack/README.md`; `packages/nana-pack/lib/brief-config.mjs` and `brief-precedent.mjs`; `packages/nana-pack/prompts/builder-preamble.md` and `planner.md`; `packages/nana-pack/rules/nana-rulings.md`; new `packages/nana-pack/tests/builder-context.test.mjs`; existing `packages/nana-pack/tests/worker-lane.test.mjs`.

The new suite has exactly six must-meet tests. R-3735 also pins the new sealed marker. Fixtures and fake children use OS-temp folders, not this worktree. Each case has a timeout; each child command has its own timeout. Real model sessions never run.

## Precedent and departures

Read all six named precedent files completely before designing. Reused `readBrief`'s BOM removal, line endings and trailing whitespace parsing, and imported `checkBriefForLaunch` and the existing public `writeFakePi` fixture helper.

- No lane-size plumbing or worker source change: A1 and R-3735 make the explicit marker the only exception criterion at every lane size. The existing shared launch checker serves both runtimes and brief-check unchanged. This departs from the stale small-lane wording in the Precedent list and its request to pass lane size.
- Used a dedicated six-case test module rather than adding cases to the large Claude worker suite. It follows that suite's isolated linked-worktree and fake-command pattern and proves both runtimes' delivery.
- The supplied hash prefix is the memory heading plus four bullets, not the four bullets alone. The test pins the full supplied prefix and the complete SHA-256 of the four bullet lines, each with its final LF. Both match the frozen text exactly.

No private helper was copied, imported or moved. No known bug listed in the brief was changed.

## Return-shape callers

`readBrief` adds `fixCard`; its existing `precedent` and first `feature` values remain unchanged. Searched all callers: anatomy sessions, pi-review, known-bug digest, component audit, deliverables, launch checking and existing tests. Only `checkBriefForLaunch` consumes the new field; the others need no edits. `checkBriefForLaunch` keeps its result shape and changes only the allowed-omission launch line.

## Existing test edit

`worker-lane.test.mjs` R-2662: replaced the old exact private-helper rule and its title with the new public-helper clause. No other existing test changed or was deleted.

## Red/green and mutations

Requirement diff preceded tagged tests and code. Initial tests against the old implementation failed R-3733, R-3734, R-3735, R-3737 and R-3738 (exit 1). R-3736 already matched old behavior; an unconditional-accept code mutation made it fail (exit 1).

A subsequent combined code-only mutation run failed all six tests (exit 1):

| Row | Wrong code | Restored result |
|---|---|---|
| R-3733 | Renamed lessons heading | PASS |
| R-3734 | Kept the leading underscore | PASS |
| R-3735 | Retuned marker to Card: feature | PASS |
| R-3736 | Returned success for every brief | PASS |
| R-3737 | Replaced rather-than instruction with permission to reimplement | PASS |
| R-3738 | Removed owner/date/issue attribution | PASS |

No assertion was inverted. Corrected two fixture/oracle errors after the first run: Claude's fake model must be an allowed alias (`fable`), and the supplied hash includes the heading. The final restored run passes 6/6 (exit 0).

## Commands and exits

All paths below are relative to the worktree. Full relevant output is in `build-output.txt` beside this file.

| Command | Exit |
|---|---|
| `npm run map:impact -- packages/nana-pack/lib/brief-precedent.mjs packages/nana-pack/bin/pi-worker.mjs` | 0 |
| `node --test packages/nana-pack/tests/builder-context.test.mjs` (restored) | 0 |
| `node packages/nana-pack/tests/worker-lane.test.mjs` (after R-2662 update) | 0 |
| `node packages/nana-pack/tests/worker-claude.test.mjs` | 0 |
| `node packages/nana-pack/tests/planner-prompt.test.mjs` | 0 |
| `node packages/nana-pack/tests/brief-check.test.mjs` | 0 |
| `node packages/nana-pack/tests/context-anatomy.test.mjs` | 0 |
| `node packages/nana-pack/tests/build-records.test.mjs` | 0 |
| `node packages/nana-setup/tests/rulings-install.test.mjs` | 0 |
| `npm run map` | 0 |
| `npm run req:tree` | 0 |
| `npm run map:check` | 0 |
| `npm run readme:check` | 0 |
| `node scripts/requirements-trace.mjs` | 0 |
| `git diff --check` | 0 |

The initial existing worker-lane run exited 1 solely because R-2662 still expected the superseded rule; the updated run exits 0.

## Not done

No full-suite run: AGENTS.md explicitly delegates the suite to CI. No push, CI access, issue action, model session, install check or protected-file edit. Native Windows execution remains for CI. The brief names no separate seat-check command. The seat closes #338, #339 and #340 in its land report. The footer recommendation is reversible; its Claude Code application remains inferred from the pi-only measurement, as the plan states.
