# Worker brief — T2c fix round 2 (Opus 5.5), after sol r1 BLOCK (1 HIGH, 2 MED)

Worktree `~/nana-pi-wt/t2c`, branch `lane/t2c-provenance-label` (HEAD `a33c77a`). Read `t2c-sol-r1.md`.

## MUST 1 (HIGH) — the label names a remedy that does not work
`lib/objective.ts:313`. sol executed it against pi's real store: with `OBJECTIVE.md` at `/repo` and the session cwd at `/repo/src/deep`, pi's `/trust` records **`/repo/src/deep`**. `ownerVouched("/repo")` searches `/repo` and its ancestors, so a descendant record never matches and the label persists after restart. The label currently says "run /trust in pi for that folder, then restart" — the owner does exactly that, from where they are, and nothing changes.

**Required:** the remediation text must name the action that actually works, unambiguously and with the folder in it — start pi **in the objective file's own folder** (name it, via `displayPath()`) and run `/trust` there, then restart. Do NOT widen the predicate to accept descendant records: trusting a subfolder is not vouching for a parent's file, and pi does not treat it as such. Pin it with a test that mirrors sol's shape (governing file at the root, cwd in a nested folder, `/trust` recorded for the nested folder) asserting the label persists AND that the emitted text names the root folder as the place to act.

**Carry, do not build:** a one-command way to record the vouch from anywhere (e.g. `nana-setup trust <dir>` writing pi's store with a canonical key) would remove the friction entirely. Note it in the report as a follow-up for Jake; it is a new mechanism and out of this lane's scope.

## MUST 2 (MED) — the wording is false for the fail-closed cases
`lib/objective.ts:312`. A valid, canonical, affirmative store that is merely larger than 1 MiB is rejected by `ownerVouched()` while pi's own `ProjectTrustStore.get()` returns `true`; the output still asserts the owner "has not recorded trust". Same epistemic problem for foreign-owned or transiently unreadable stores. Fail-closed labelling is correct — the claim is what is wrong. Reword to what we actually know, matching the README's own phrasing: **no usable affirmative trust record could be confirmed**. Keep it to two lines total.

## MUST 3 (MED) — the consumer declarations T2a synchronized are stale again
These are the same surfaces T2a deliberately brought in line; the label now makes them wrong. Within the ≤8-file appetite:
- `AGENTS.md:15-24` — the objective contract omits the provenance label.
- `templates/_shared/working-under-nana-pi.md:28-33` — omits it from every generated project's guidance.
- `templates/_shared/OBJECTIVE.md:8-12` — claims the two lines are followed directly by the program lines, which is no longer always true.
- `packages/nana-setup/lib/project.mjs:309` — calls `OBJECTIVE.md` "the two lines the session-start hook prints".
Do NOT touch `HANDOFF.md` (the seat owns it and will flip the "not implemented" entry when this lands).

## NOT
No trust gating. No predicate widening. No new mechanism. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; sol's nested-cwd case is pinned and the emitted text names the right folder; no fail-closed case asserts more than we know; the four declaration surfaces describe the label.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce sol's nested-cwd case before fixing it.

## Report (≤20 lines)
Commit · the nested-cwd case reproduced then the new text (quote both label lines) · the fail-closed wording · the four surfaces · `npm test` summary · the follow-up note on a one-command vouch · residuals · the one claim most likely wrong · `VERDICT: DONE`.
