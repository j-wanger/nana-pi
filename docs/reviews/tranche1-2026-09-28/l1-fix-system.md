You are a careful senior engineer working headless for Jake Wang's nana program. Plain, terse reporting; every claim backed by a command you ran and its output. Follow the brief exactly; when the brief and the code disagree, say so in the report rather than improvising outside the allowlist. Never end your turn while a command you started is still running. Smallest change that passes; if the contract needs more than the appetite, stop and report.

# Worker brief — L1 fix round (Opus 5.5), after sol r1 BLOCK

Same worktree `~/nana-pi-wt/l1`, branch `lane/l1-config-safety` (your commit `c1bc113` + a merge of main). Read `~/nana-pi/docs/reviews/tranche1-2026-09-28/l1-sol-r1.md` (the review), your `l1-worker-r1.md`, and `l1-brief.md` (its allowlist and rules still apply).

## Seat rulings
1. **HIGH — the persisted snapshot is forgeable → SUBTRACT it.** Remove `~/.pi/agent/nana-pack.gate.validated.json` and every read/write of it. Replacement contract for invariant 2: (a) mid-session corruption of the user gate block → the process-wide in-memory last-good gate policy stays enforced (already built); (b) a FRESH process whose user gate block is malformed → conservative stop: every gated tool class (bash, powershell, edit, write) is blocked with the reason `nana-gate: user nana-pack.json gate block is malformed — repair it (<file>:<problem>)` until a valid policy loads; interactive sessions too (a human edits this file; a typo costs one repair, not an open gate). Missing file = defaults (unchanged). Update `config-gate-fallback` cases a–e accordingly (the "snapshot after restart" case becomes "stop after restart"; add "a planted wider policy file anywhere on disk cannot widen the gate after restart"). Update `gate-config-robustness` (a)'s seeded snapshot to the new contract (a valid user gate block instead). README: say the stop rule plainly and why (a persisted snapshot could be forged by the agent it gates).
2. **MED — diagnostics must not depend on `journal.enabled`.** `config_invalid` and `config_project_ignored` lines are emitted regardless of `journal.enabled` (that flag governs event journaling, not config diagnostics); the UI warning stays. Pin with a test case using sol's exact input `{"journal":{"enabled":false,"path":7}}` → one `config_invalid` line written. If the journal PATH itself is the malformed leaf, write to the default journal path.
3. Keep everything else as reviewed (globalThis state, trust evidence via pi's trust module, notices, fixtures).

## Rules
As before: foreground commands only; never end your turn with a command running; kill only your PIDs; commit on the branch, no push; no assertion weakening (a test that changes because the contract changed is named in the report with the replacement contract); `npm test` must exit 0.

## Report (≤30 lines)
Commits · `npm test` summary · the fresh-process stop demonstrated (command + output) and the "planted wider policy cannot widen after restart" case · the journal-disabled diagnostic case · every test case changed with its replacement contract · `git diff --stat` vs main · residuals · the one claim most likely wrong · `VERDICT: DONE`.
