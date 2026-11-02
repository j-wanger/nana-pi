# Builder report — build 1 stopped draft

Superseded by `build-2-record.md`; retained as the first build's stop record.

VERDICT: BLOCKED

## Stop condition

The required error baseline must group by build number, not session attempt.
`apps/bench/lib/anatomy-sessions.mjs:76` already owns `buildNumber`, but keeps it private.
The brief authorizes moving only the suite-lock path, not this helper.
The draft's session-name regex in `apps/bench/lib/replay.mjs` is a departure, not an accepted replacement.
The builder stopped under the brief's private-helper rule.

Open question: authorize exporting the existing build-number parser and supplying its brief provenance to the error reader, or revise that reader's input contract.
No GitHub issue was opened.

## Revision and files

No commits, push or PR. HEAD remains `36b49f40cecaa3781ce45bf4564a756851a16e1d` on `feat/builder-drop`.
All changes remain uncommitted and are not ready to land.

Changed existing files:
- `REQUIREMENTS.md`: planned R-3600–R-3607, FEAT-045 and A-101; CAP-08 deliverable/maker/reader declarations.
- `apps/bench/run.mjs`: optional public child hooks and opt-in descendant reaping, to reuse rather than copy the bench child runner.
- `scripts/test-locked.mjs`: export the existing default lock path.

New draft files:
- `apps/bench/replay.mjs`
- `apps/bench/lib/replay.mjs`
- `apps/bench/lib/replay-config.mjs`
- `apps/bench/lib/replay-isolation.mjs`
- `apps/bench/lib/replay-context.mjs`
- `apps/bench/lib/replay-grade.mjs`
- `apps/bench/lib/replay-journal.mjs`
- `apps/bench/lib/replay-errors.mjs`
- `apps/bench/ext/replay-context.ts`
- `apps/bench/test/replay.test.mjs`
- `docs/reviews/builder-drop-2026-11-02/wrong-code-first.txt`
- this report.

## Tests and commands

Requirement diff preceded eight tagged draft tests; implementation followed their baseline red run.
No existing test changed. Corrections to new fixtures fixed duplicate span ids, sandbox marker placement and an expected diagnostic count.

| Command | Exit | Evidence |
|---|---|---|
| `npm run map:impact -- scripts/test-locked.mjs` | 0 | Read before editing the mapped module. |
| `pi --version` | 0 | 1.4.0; version query only, no model session. |
| `node apps/bench/test/replay.test.mjs` against the absent harness | 1 | 0/8; eight tagged failures in `wrong-code-first.txt`. |
| `REPLAY_TEST_DEBUG=1 node apps/bench/test/replay.test.mjs` on the draft | 1 | Last run: 7/8; R-3605 refused resume because a previously absent path acquired an OS ancestor alias. |
| Synthetic Seatbelt probes | mixed | Narrow profiles initially aborted; permitting a literal root-directory read allowed echo and Node to start. |
| Repository/test/checker literal search | 0 | Searched Layout, CAP-08, DEFAULT_LOCK_DIR and the bench extension name before edits. |

Baseline/current pairs: R-3600, R-3601, R-3602, R-3603, R-3604, R-3606 and R-3607 went from red to group-level green.
R-3605 stayed red in the last run.
An unverified path-canonicalization edit followed that run.
There is no final green run or completed mutation proof.
The draft tests do not yet establish every must-meet subclause.

## Precedent departures

- The private build-number parser is the blocking departure described above. The draft regex must not land.
- The renderer consumes existing stored spans instead of invoking `extractContexts` and rescanning session history.
- pi 1.4.0 rejects `sections.preamble`; the draft extension uses the supported `forceSystemPrompt` field for exact opaque system content. This differs from the plan's named fallback and needs a direct extension test.
- The shared public child runner gained optional hooks and opt-in reaping; the draft avoids copying its private signal helper.
- Start-tree materialization uses git archive and system tar. The README must declare tar if retained.
- Exact dry-run argv stays in private output; stdout gives counts and profile hashes, following the privacy contract instead of printing prompts.

## Known bugs touched

The new replay renderer addresses the empty-heading and table-header cases named in the FEAT-042 context.
It does not change anatomy's `assembleParts` or any known-bug record.
No other known bug was fixed.

## Not done

- Complete implementation or subclause coverage, especially the real optional-review path, baseline grouping, interrupted-row measures and every isolation case.
- A final touched-test run, including existing child-runner and suite-lock tests.
- README, code-map/runtime-map/tree regeneration, final requirement statuses or session entry.
- Map/README checks, requirement trace, tree checks, known-bugs check, session writing check or repository identity scan.
- Seat-only real-session baseline or live-pi startup probe.
- Commit, push, draft PR or CI request.

No paid call, real builder, subagent, real transcript read/copy, private-store copy or protected-folder write occurred.
No full suite ran; the brief assigns it to CI.
