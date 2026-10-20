# mutation-runner-lock-overlap — must-meet

Feature: FEAT-031 · Run checks reliably and without contaminating work
Sentence: the lock contention check reports an overlap only when two workers were inside the lock's critical section at the same time, never because its own starting gate raced the workers.
Class: ordinary (tests only, in the seat's mutation-runner test; no product, install, hook, gate or land/review-tool code). Complexity: simple (Claude Sonnet subagent).
Threat model: honest variation is in scope: scheduler stalls on loaded hosted runners, the parent pausing between two file operations, platform timing. Deliberate forgery is out.

## What failed and why
The macOS suite leg of CI run 39386603117 (attempt 1) failed the contention check (R-1776, R-1777) with overlapText "5:0". Every other field was green. Attempt 2 passed.
The check starts with an unreadable gate lock plus a gate exclusivity marker. It lifts the lock first and removes the marker second. A worker that takes the lock between the two finds the marker and records an overlap the lock did not cause.

## Design (one test file, no new row)
The gate marker is redundant. Any worker that gets in while the gate lock exists appends to the acquired file, and `enteredFreshUnreadable` already fails the check on that. So:
1. Delete the gate marker write and its removal after the lift. With nothing left to race, no lift order needs a pause.
2. On EEXIST, each worker's overlap line names what it found in the marker: `a:b found c:d` (a real overlap) or `a:b found ?` (the holder had already left).
3. Add one comment above the `enteredFreshUnreadable` read saying why no marker exists during the gate.
No pause, no new tunable, no product change. The title and the R-1776 and R-1777 markers stay as they are.

## Must-meet tests
| Row | Requirement (existing, implemented, unchanged) | Test | Evidence |
|---|---|---|---|
| R-1776 | WHEN child processes contend for one worktree-operation lock, the mutation runner shall publish complete ownership atomically, run no critical sections at the same time, and remove the lock only while its content still names that owner. | `packages/nana-pack/tests/mutation-runner.test.mjs::mutation runner: contending child processes observe complete lock ownership and never overlap their critical sections` | Passes with the change (39 PASS, 0 FAIL). W3 (1 in 100 contended publications steal the lock) turns it red with `2:49 found 1:25`. |
| R-1777 | IF a worktree-operation lock has unreadable content and is no more than 30000 milliseconds old, THEN the mutation runner shall treat it as held. | same check | W2 (a fresh unreadable lock is not treated as held) turns it red with enteredFreshUnreadable true and no gate marker present. |

New rows: none. The change adds no behaviour. It removes a self-race from an existing check, so the R-2120 block stays unused.

Evidence for the fix, from a temp-clone probe of a standalone copy of the check's gate and worker phase, run 8 copies at a time beside 12 busy loops on a 10-core Mac:
- Today's order: 2 of 40 runs overlapped. The lines were `5:0 found gate`, the CI signature, and `2:0 found gate` plus `2:1 found gate`, where the parent stalled across two critical sections. No line named another worker.
- No gate marker: 0 of 200 runs overlapped. All 200 reached 2,400 acquisitions and none entered the fresh unreadable lock.
- The plan's lift-then-pause-then-marker order is red on every run with `n:i found gate`, which confirms the mechanism.
- code-map --check, requirements-trace and readme-check are green with the change.

## Known limits
- No test pins the fix itself. No harness order is left to pin, and the only way back is re-adding a gate marker. If that happens, the diagnostic names it as `found gate`. The load reproduction is the evidence, and it is too heavy to rerun beside other lanes on a shared machine.
- The CI "5:0" attribution is inferred, because that record has no marker content. The diagnostic makes the next failure prove the cause either way.
- A separate, real product gap exists and did not cause this failure. When two waiters take over the same dead owner's lock, the takeover reads the lock and then unlinks it. The slower waiter can unlink the faster waiter's fresh lock, and then both enter. Reaching it needs a shard killed while it holds the lock, plus two live waiters. The seat records it as a HANDOFF residual against R-1776, and a fix (serialized breaking) is a lane of its own.
- The lock path is per run, so separate pairs runs never share a lock (R-1775). Concurrent pairs runs are outside today's contract.
- The diagnostic prints only on a red run. W3 shows it.
- Under extreme local load the planner once saw a different check in this file fail ("run1 never reached its rendezvous"). It passed unloaded. This is noted only.