# Astra land ruling — lane T2c, round 2 (confirm the MUSTs)

Your r1 (`t2c-astra-land.md`, 6/10 BLOCK) issued four MUSTs and one process finding. Fix commit `c6e7d7d` (`t2c-worker-r7.md`). Worktree `~/nana-pi-wt/t2c`; clean diff vs main `t2c-r6.patch`.

**Your process finding was acted on structurally, not just locally.** You wrote that four specification errors indicate inadequate contract derivation, and that the seat should have traced `/trust` through resolution, lookup, locking and writing before specifying a remedy. The lane template now carries that as a rule (`docs/lane-brief-template-2026-09-28.md` §1b, commit `63b9af2`): a brief specifying user-facing remediation, or a check whose meaning depends on another tool, must first trace that tool's real code path and record it with `file:line`; the cheap test that the trace happened is whether the brief can say what the tool does when its lock path is occupied. This lane was the first run under it, and the worker's report opens with that trace.

**The trace it produced** (installed pi 0.87.1): resolve `config.js:421-428` (`PI_CODING_AGENT_DIR`, `~` expanded, a RELATIVE value stays relative) → `trust-manager.js:173` resolves it against pi's start directory → `/trust` at `interactive-mode.js:2529,4298-4308` records the session cwd; read `trust-manager.js:178-182` under the lock, nearest record wins `:20-33`; lock `:105-142` via `proper-lockfile` creating `<store>.lock` as a DIRECTORY (`lockfile.js:25-97`, stale after 10 s) — only an absent path or an empty folder can be taken; write `:187-200`, `:94-104` in place under the same lock.

**MUST 1 (remedy moved the store) — fixed.** Every remedy now names the store that must receive the decision, and under a relative override it also gives `PI_CODING_AGENT_DIR=<absolute agent dir>` with the reason. Test T16 runs the whole transition in both runtimes using pi's own write: nested session labelled → the OLD advice writes the wrong store and it stays labelled → the NEW advice writes the active store → the original nested session, restarted unchanged, is no longer labelled, and pi's `get()` agrees.
**MUST 2 (lock obstruction) — fixed.** `lockObstruction()` treats a file, a link, or a NON-EMPTY directory at `trust.json.lock` as not-confirmed even with a recorded `true`; an empty folder counts as usable. T17 covers three obstruction kinds × with/without a record and asserts pi's `get()` and `set()` both throw.
**MUST 3 (dangling link) — fixed.** A broken link on the agent-dir path is diagnosed as such and named; T18 asserts pi's `set()` throws `ENOENT`.
**MUST 4 (declarations) — fixed.** `AGENTS.md` states the umbrella default under the ACTIVE agent dir; the README's clearing language is conditional ("only while pi itself can read it"); removal advice says to re-check and back up because removal discards declines too; both remedy and docs now say `/trust` also makes pi load that folder's project resources.
**Negative control:** disabling the lock and dangling-link checks fails 34 checks; disabling the path pin fails T16.
**Checkpoint rule honoured** (first enforcement): the worker declared the lane already past its ceiling at 11 files, added no new files, stopped, and listed what remains.

Seat-verified: `npm test` → 71 files, 4377 checks, exit 0.

Judge only, ≤30 lines:
1. Each MUST FIXED / PARTIAL / NOT FIXED with the line.
2. **The worker's own most-doubted claim, which is the same fail-open class again:** it treats an EMPTY `trust.json.lock` folder as usable, but pi throws `ELOCKED` for ~10 s on a freshly created one and indefinitely on a future-dated one, while we would report vouched. Rule: blocker, or an accepted transient residual? It also lists three narrower gaps (a `trust.json` that is itself a broken link; folder-writability as a pre-check not proof; the Claude hook resolving a relative override against its own cwd).
3. Any NEW defect from this round.
4. Your CARRY list, and your ruling on whether the landed `config.ts:276` deny-policy inconsistency (filed, not fixed) should block this lane or proceed as the separate urgent item you called it.
End with `SCORE: n/10`, MUST (empty if none), CARRY, `VERDICT: LAND` or `VERDICT: BLOCK`.
