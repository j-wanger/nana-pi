You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Trace the host tool's real code before relying on its behaviour. Never end your turn while a command you started is still running.

# Worker brief — T2c fix round 7 (Opus 5.5). Astra's single remaining MUST; astra re-rules next.

Worktree `~/nana-pi-wt/t2c`, branch `lane/t2c-provenance-label` (HEAD `c6e7d7d`). Read `t2c-astra-r2.md`. Three of four MUSTs are confirmed fixed; MUST 2 is PARTIAL and astra ruled the remainder a **blocker, not an accepted residual** — which was your own most-doubted claim, so you called it correctly.

## MUST — an empty lock directory is not evidence the lock is usable
`objective.ts:312` equates empty with usable. Per your own trace and astra's read of `proper-lockfile/lib/lockfile.js:65-85`, pi can only take over a lock it judges **stale**; a freshly created empty lock directory outlasts pi's ~180 ms retry window, and a future mtime extends the failure until that timestamp plus the stale interval. So today, with a recorded `true` and a fresh empty lock, we suppress the label while pi's lookup throws. Our verdict is startup-only, so one transient obstruction misclassifies the whole session.

**Required:** an occupied lock path means **not confirmed** (label) unless usability is positively established by pi's own staleness rule — i.e. the lock directory is stale by the same interval and comparison pi uses, in which case pi would reclaim it and we may treat it as usable. Take the rule from pi's source, not from an assumption, and cite it. A future-dated lock is never usable.

**Remediation wording for this case:** do NOT tell the owner to delete or move the lock — it may belong to a live pi. Say that the store is locked by another pi process, that the label will clear on its own once that finishes, and that they should re-run after it completes; only mention removal for a lock that is demonstrably stale, with the same care as the store-removal advice.

**Tests:** extend T17 with fresh-empty, future-dated-empty and stale-empty lock directories, each asserting (a) our verdict, (b) that pi's `get()`/`set()` throw or succeed correspondingly, and (c) both runtimes' emitted text. Astra notes T17 currently covers only the stale-empty success case.

**Docs:** the README and `AGENTS.md` currently imply an empty lock is fine; correct them with the rest.

## NOT
Nothing else. The `config.ts:276` deny-policy inconsistency stays a separate urgent item (astra confirmed). No new mechanisms. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; a fresh or future-dated empty lock labels even with a recorded `true`, a stale one does not, and each case agrees with pi's own behaviour in the test.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce the fresh-empty-lock suppression before fixing it. **Checkpoint rule applies** — the lane is already past its ceiling; if this needs more than the remaining scope, write the checkpoint and stop.

## Report (≤15 lines)
Commit · the suppression reproduced then fixed · pi's staleness rule with `file:line` · the three lock cases with our verdict and pi's · the remediation text for a live lock · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
