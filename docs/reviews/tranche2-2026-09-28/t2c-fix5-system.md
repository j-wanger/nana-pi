You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Reproduce a reported defect before fixing it. Never end your turn while a command you started is still running.

# Worker brief — T2c fix round 5 (Opus 5.5), final. Your own declared disagreement; astra rules next.

Worktree `~/nana-pi-wt/t2c`, branch `lane/t2c-provenance-label` (HEAD `20a8694`).

You named this and correctly declined it as out of scope: *"with an affirmative store in a folder that is not writable, we clear the label, but pi's `get()` takes a lock in that folder and would throw. pi would then treat the project as untrusted, so the two disagree."*

That is the same fail-open class round 4 just closed — we say vouched, pi says untrusted, and the label that should warn the owner is absent. Carrying a known fail-open into a land ruling is exactly what astra blocked another lane for today. Close it.

## MUST
When the trust store's folder is not writable — the condition your round-4 remediation already detects and names — `trustRecord()` must report **not confirmed** (label shown), regardless of what the store contains, because pi itself cannot read it without throwing. Reuse the writability check you just added; do not add a second one. The emitted remediation for this case is already correct (make that folder writable first, this may need rights you do not have) — verify it is what appears.

Pin it: an **affirmative** record in an unwritable folder → LABELLED, with the folder-not-writable remediation; the same record once the folder is writable → not labelled. If you can, assert alongside it that pi's own `get()` throws for the unwritable case, so the test records WHY we agree with pi rather than just asserting our own behaviour.

## Also
Your other residual — `objectivePath()` still resolves `nana-objective.md` under the default `~/.pi/agent` while everything else now uses the active dir — is the same inconsistency in a second place. Fix it with the shared `piAgentDir()` and note any behaviour change in the report.

## NOT
Nothing else. No `nana-setup trust <dir>`. `--max-budget-usd 10`.

## doneWhen
`npm test` exits 0; an affirmative record in an unwritable folder is labelled; `nana-objective.md` resolves through the shared agent-dir helper.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce the disagreement with pi before fixing it.

## Report (≤15 lines)
Commit · the disagreement reproduced (our verdict vs pi's) then fixed · the emitted remediation for that case · the `objectivePath()` change and any behaviour difference · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
