# mutation-runner-takeover-race — must-meet

Feature: FEAT-031 · Run checks reliably and without contaminating work
Sentence: when a shard dies holding the run's worktree-operation lock, only one waiter at a time removes that dead lock, so no two waiters both enter, and no takeover leaves anything behind that blocks the next one.
Class: ordinary. The change is to the seat's mutation runner, a test tool. It touches no nana-setup install, uninstall or doctor code, no hook, no pi extension, no gate policy and no land or review tool. Precedent: mutation-runner-win-lock and mutation-runner-win-prune were ordinary. Complexity: complex (pi gpt-5.6-sol builder).
Threat model: honest variation is in scope: a shard or waiter killed mid-hold, scheduler stalls between two file operations, Windows delete-pending, and transient EPERM, EACCES or EBUSY. Deliberate forgery of lock content is out. Pid reuse stays the R-1779 limit.

## The gap (probed on main 773de493, in a temp copy)
`withWorktreeOperationLock` removes a dead owner's lock by reading it, comparing it and then unlinking it. Waiter B reads dead content X and stalls just before its unlink. Meanwhile A removes X, publishes its own lock and enters. B then unlinks A's fresh lock, publishes its own and enters too. Two child waiters, with B paused in the existing `unlinkSync` seam, recorded `B found A` for a dead pid and for an old unreadable lock, 3 runs out of 3. Pausing B after its first read instead stays green today, because today's removal re-reads before it unlinks.

## Design
- **Breaker.** To remove a dead lock, a waiter first publishes a breaker file. Its path is the lock path plus a new suffix from the config module. It uses the lock's temp-plus-link publication, so only one waiter holds it at a time.
- **Re-check under the breaker.** While holding the breaker, the waiter re-reads the lock. It removes the lock only if the content still equals what it judged dead. It then releases the breaker with the lock's bounded release loop (R-1960's limit, unchanged). It releases on every path, the transient ones included, and before any wait or throw.
- **Live breaker holder.** The other waiters wait through the existing wait-or-fail path.
- **Dead breaker** (holder pid dead, or content unreadable and old). It is judged by the lock's rules and removed with the plain compare-then-remove. The waiter then retries at once.
- **Seams.** Every breaker file operation goes through the injected `io`. No new production seam is needed.
- **Unchanged.** R-1775, R-1777, R-1778, R-1779 and R-1960 keep their values and behaviour.
- **Rejected designs.**
  - Rename-to-unique: a stolen fresh lock cannot be put back atomically.
  - Inode compare: it is still two steps.
  - OS file locks: Node has no portable flock.
  - Epoch files: they would rewrite R-1776, R-1960 and their fixtures.
  - Parent-only takeover: R-1777 and R-1778 rely on any waiter taking over.

## Must-meet tests (new file packages/nana-pack/tests/mutation-runner-takeover.test.mjs)
| Row | Requirement | Test | Red today? |
|---|---|---|---|
| R-2170 | WHEN two waiters take over one worktree-operation lock whose owner is dead, or whose content is unreadable and old, and one waiter stalls after reading that lock or just before removing it, the mutation runner shall run no two critical sections at the same time. | `mutation-runner-takeover.test.mjs::R-2170: two waiters taking over one dead or old unreadable lock never overlap when one stalls after its read or before its removal` | RED. Probe: the before-removal schedule gave `B found A` for both kinds, 3 runs out of 3. The after-read schedule is green today. It guards the re-check: W2 turned it red for a dead pid in a breaker prototype. |
| R-2171 | IF a waiter dies just before it removes a dead owner's worktree-operation lock, THEN the mutation runner shall let the next waiter take over that lock before the wait limit. | `…::R-2171: a waiter killed just before it removes a dead owner's lock leaves that lock to the next waiter before the wait limit` | Green today, because today has no breaker to leave behind. It guards the fix. Probe: with W4 the waiter stopped at a fake-clock 30000 ms with the R-1779 line. |
| R-2172 | WHEN a takeover of a worktree-operation lock whose owner is dead, or whose content is unreadable and old, meets no error or one EPERM, EACCES or EBUSY at any one of its file reads, stats, links or removals, the mutation runner shall complete that takeover and a later waiter's takeover of the next dead owner's lock at that path, each before the wait limit. | `…::R-2172: a takeover with no error or one transient error at any file operation still finishes, and so does the next takeover at that path, before the wait limit` | Green today: 45 cases. It guards the fix: W5, W6, W7 and W8 each turned it red in the prototype. The first plan's first-call-per-path faults missed W8 (probe). |

Test shapes:
- **R-2170.** Two child waiters per case. The cases cover two schedules for B: paused after its first read that returns the dead content, or paused before its first unlink of the lock. Each schedule runs with both dead kinds: a pid no process can hold, and unreadable content whose mtime is older than the stale limit.
  - The parent starts B and waits for B's pause signal. It then starts A and waits for A's signal: either A is in its section, or A's injected `wait` has been called (that wait still sleeps). Only then does the parent release B.
  - Each section creates an exclusivity marker with `wx`. On EEXIST it logs `<me> found <holder>`. A holds its section until the parent's go, which the parent sends after B has entered or begun waiting.
  - ok per case: B paused, A signalled before B's release, no overlap line, each waiter entered once, both exit 0, and the lock is absent.
- **R-2171.** A child takes over a dead-pid lock and kills itself (`process.kill(process.pid, "SIGKILL")`) at its first unlink of the lock.
  - After the child ends, a setup check confirms the lock still holds the dead content.
  - An in-process waiter must then enter once, with no report line, before `WORKTREE_LOCK_WAIT_LIMIT_MS` on a fake clock.
  - Do not assert the child's signal name, because Windows reports an exit code.
- **R-2172.** An in-process sweep, run once per dead kind.
  - One fault-free takeover records its `readFileSync`, `statSync`, `linkSync` and `unlinkSync` calls; call their count n.
  - The cases are the fault-free run, plus each code (EPERM, EACCES, EBUSY) at each call i from 1 to n. Each case runs a fresh takeover in which only call i throws. The test then writes the next dead owner's lock and runs a plain takeover.
  - ok: every takeover enters once, with no report line, before the wait limit. The fake clock starts at `Date.now()`, because an old lock's age is read against `now()`. Stop at the first failing case and print it.
  - `writeFileSync` and `rmSync` are not faulted: today's code treats a temp-write error as fatal and ignores temp-removal errors.

Prototype evidence (temp copy, not committed): the breaker passed R-2170 in 5 runs out of 5, passed R-2171, and passed the sweep (63 cases in 0.4 s). Today's code passed R-2171 and the sweep.

## Known limits
- **Dead breaker.** The breaker's own removal is still a plain compare-then-remove. The race can come back with a waiter killed while holding the breaker, a second dead lock, and two live waiters with a stall. This is reasoned, not probed, and no test covers it.
- **Misleading wait-limit line.** A live but stalled breaker holder makes the others wait, and their wait-limit line may name the dead lock's pid rather than the breaker's holder.
- **Release can outlast acquisition.** Breaker release reuses the 300000 ms release limit. On a Windows path that stays delete-pending, a waiter can exceed the 30000 ms acquisition limit. This is the same trade as R-1960.
- **Small user gain.** Today the race fails loudly: git errors, the shard is refused, and its pair is missing. R-1778's check already takes over a dead-pid lock and an old unreadable lock in-process on every leg, Windows included. What is new on Windows is R-2170: two live processes taking over one dead lock. The contention check has never done that there, as the HANDOFF residual records.
- **Windows.** All three rows are provable on macOS, so no req-candidate marker is needed. Windows behaviour is inferred until the seat reads the Windows leg.