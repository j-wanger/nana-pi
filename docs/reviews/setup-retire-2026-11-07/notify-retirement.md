# setup-retire build 2: notifier cut only

VERDICT: PARTIAL

Feature: FEAT-013 · Install and connect harness runtimes
Branch: `feat/setup-retire`

## Scope and unfinished work

This revision removes only the notify portion of M2 and its obsolete tests.
It does **not** complete the requested M1–M9 lane.
R-3799–R-3807 remain planned; R-3800's evidence now names this partial progress.
There is no external blocking question: implementation stopped short of the brief.
An initial broader draft was discarded before this revision's final checks.
No hook, seed, adoption producer, gate predicate or config implementation changed.

Still required:

- M1: verifier hook/library retirement, settings cleanup and doctor repair rows.
- M2: handoff and post-edit removal, adoption extraction, and the complete discovery/startup test.
- M3: real-discovery adoption/SessionStart regression and wrong-code proof.
- M4: the lane's tagged preservation test and mutation proof; existing gate code is unchanged.
- M5: seed retirement, doctor cleanup and removal of the install-check vendor retry.
- M6: legacy postEdit/handoff compatibility and its tagged test.
- M7: the remaining documentation, requirement/artifact retirement and setup status restoration.
- M8–M9: edited-seed preservation, direct uninstall and historical hook-form regressions.
- Extend `retired-artifacts.test.mjs` when the hook and seeds actually retire.
- Native Windows execution and the full M1–M9 wrong-code pairs.

The component audit remains partial for setup because its nine planned rows remain unimplemented.
The earlier groundwork's test-retirement question is answered by build brief 2; it is not a blocker.

## Files and rows

Deleted with `git rm -q --`:

- `packages/nana-pack/extensions/nana-notify.ts`.
- `packages/nana-pack/tests/notify-dispatch.test.mjs` (all 5 checks).
- `packages/nana-pack/tests/notify-fallback.test.mjs` (all 32 checks).

Both deleted test files exclusively exercised the removed notifier.
Neither contained a pipe-guard predicate check or an adoption-journal check to relocate.
No cases were removed from a mixed file.
No historical study fixture, session archive, HANDOFF or known-bug file changed.

Retired rows: R-166–R-173, R-642–R-643, R-815–R-818.
No row was deleted or renumbered, and no new ID was allocated.
R-658 now names the surviving seven functions rather than requiring notify in front-door descriptions.
The notifier's A-011/A-069 reader references were removed; the other readers remain.

Updated documentation and discovery metadata:

- `AGENTS.md` and `templates/_shared/working-under-nana-pi.md`: remove notify from both pi runtime rows and describe journal-only behavior.
- `README.md`, `package.json`, `packages/nana-pack/package.json`: remove notify from descriptions and change ten extensions to nine.
- `packages/nana-pack/README.md`: remove notify's extension row, configuration example and notification promises.
- `code-map.config.json`: remove the deleted extension's launch declaration.
- `docs/code-map.md`: regenerate after removing three modules.

Existing test edits, each required because this cut made the old expectation false:

1. `config-handlers-malformed.test.mjs`: remove the deleted notifier from the extension import list; keep every case and assertion.
2. `templates-render.test.mjs`: remove the notifier's inventory key and replace its two expected runtime-table cells; keep every case.
3. `readme-check.test.mjs`: remove notify from the required function list and rename that case to match R-658; keep checks for every surviving function and both runtimes.
4. `code-map-launch.test.mjs`: add named historical-edge loss reasons for the three deleted sources, following its existing retiredSources pattern.

## Deleted check inventory

Markers below are the original `req:` declarations; “unmarked” means no declaration on that check.

### `packages/nana-pack/tests/notify-dispatch.test.mjs`

| Check title | Rows |
|---|---|
| settle: with a UI, macOS starts osascript once with the Ready for input notification | R-166 |
| settle: with a UI, Windows starts powershell.exe once with a Ready for input toast | R-166 |
| settle: on Linux, the TUI gets one OSC 777 Ready for input sequence and no process starts | R-166 |
| headless: a run without a UI starts the notifier only when notify.headless is true | R-173 |
| headless: a run without a UI writes no escape code, even when the notifier fails | R-818 |

### `packages/nana-pack/tests/notify-fallback.test.mjs`

| Check title | Rows |
|---|---|
| prompt: ui_prompt_start emits one fixed-body notification | R-642, R-643 |
| prompt: RPC, JSON and print modes write no OSC stdout | R-643 |
| prompt: disabled and headless without opt-in emit nothing | R-642 |
| prompt: headless opt-in attempts the fixed-body notification | R-642 |
| a: spawn failure (no notifier binary) is a failure | R-169 |
| a: non-zero exit is a failure (execFile reports it through err.code) | R-169 |
| a: the deadline is a failure, and names the kill signal | unmarked |
| a: exit 0 with a PowerShell error record on stderr is a failure | R-169 |
| a: exit 0 with a failed WinRT member call is a failure | R-169 |
| a: a clean run is not a failure | unmarked |
| a: benign stderr chatter is not a failure | R-170 |
| a: a benign path containing 'Exception' is not a failure | R-170 |
| a: 'exception' in prose without a record shape is not a failure | R-170 |
| a: the reason is bounded (it lands in a journal line) | R-168 |
| b: a failed OS notifier falls back to the in-app notification | R-168 |
| b: the fallback is journalled as notify_fallback | unmarked |
| b: the journal line carries the platform that failed | R-168 |
| b: the journal line carries a reason | unmarked |
| b: the reason names the missing notifier | unmarked |
| c: headless failure is still journalled | R-817 |
| c: a missing ctx.ui raises nothing into the agent process | R-172 |
| d: notify.enabled false raises no notification | R-167 |
| d: notify.enabled false writes no fallback line | R-167 |
| e: a non-zero notifier exit falls back | unmarked |
| e: the non-zero exit is journalled | unmarked |
| f: exit 0 with an error record still falls back | unmarked |
| f: the exit-0 failure is journalled | unmarked |
| f: a working notifier raises no fallback notification | R-815 |
| f: a working notifier writes no fallback line | R-815 |
| g: a hung notifier still falls back | R-816 |
| g: the hang is journalled with the kill signal | R-816 |
| g: the fallback is bounded by the deadline, not by the hung child | R-171, R-816 |

## Precedent and known bugs

Read every precedent named in the brief and plan before designing: seat-pull-off, steps, uninstall, nana-handoff and pipe-guard.
This notifier-only deletion requires no new helper, so it copies no precedent implementation.
Hook retirement, unchanged-seed comparison and adoption extraction are deferred, not alternative implementations.
The only scope departure is stopping after the notifier cut rather than completing M1–M9.
The historical-edge exception follows `code-map-launch.test.mjs`'s existing retired-source convention.
Read all 216 lines of `docs/known-bugs/FEAT-013.md`; this committed notifier cut touches none of its listed bugs.

## Tests, mutations and checks

No new test or sealed tunable lands in this partial revision.
No completed must-meet or mutation pair is claimed.
The complete M1–M9 tests and their wrong-code proofs remain undone.
The deleted notifier tests are retired, not inverted or replaced with vacuous assertions.

| Command / operation | Exit / result |
|---|---|
| `npm run map:impact -- packages/nana-pack/extensions/nana-notify.ts` | 0 |
| `node scripts/test.mjs test-runner` immediately after test deletion | 0 |
| Remaining-test grep for both deleted test names, before historical loss reasons were added | 1: no matches |
| Removed documentation line/sentence/path scan against tracked test files | 0: only the generic numbered-comment fragment and the three explicit historical loss reasons remain |
| `npm run map` | 0; 557 modules |
| `npm run map:check` | 0; 0 problems |
| `npm run req:tree` | 0; 2625 rows, 43 features, 0 problems |
| `npm run readme:check` | 0; 872 claims, 0 problems |
| `node scripts/component-audit.mjs --check` | 0; existing staleness/unclaimed notes remain |
| `node scripts/test.mjs` with the ten explicit files in `notify-tests.log` | 0; 536 checks pass, 0 fail |
| `node scripts/test.mjs test-runner` final precommit run | 0; 64 checks pass, 0 fail |
| `node packages/nana-setup/bin/install-check.mjs` on macOS, pi 1.4.0 | 0; all 18 measured items PASS, including pi session and pi turn |
| `git diff --check` | 0 |

The first broad check invocation hit its 120-second outer limit before completion.
Its completed code-map-launch case failed until the three named loss reasons were added.
The next run failed only R-658's obsolete notifier-description expectation.
After correcting that expectation and its row, the final ten-file run passed completely.

Evidence: `notify-checks.log`, `notify-tests.log`, `notify-test-runner.log`, `notify-install-check.log`, `notify-impact.log`, `notify-deleted-readers.log` and `notify-removed-text-scan.log` beside this report.
The full suite is delegated to CI under AGENTS.md's explicit override; no full local run, push, CI read or real model call occurred.
The install check uses its existing offline scripted provider fixtures.
The final reply records the full committed tip and checks repeated on that tip.
