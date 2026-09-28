# Lane U — pi upgrade 0.84.4 → 0.87.1 (compatibility first)   2026-09-28 · nana-pi · worktree `~/nana-pi-wt/u`, branch `lane/pi-upgrade-0.87`

## Goal
The nana-pi pack, desk and bench work unchanged in behavior on the globally installed pi 0.87.1, and every place that documents or pins a pi version says 0.87.1. Ruling 5 (Jake 2026-09-28): the settle-gate trial follows this lane; this lane does NOT build the settle gate.

## Appetite
`--max-budget-usd 20` · advisory ceiling ≤12 files / ≤300 LOC. If the upgrade needs more than that (an API removal with no drop-in), STOP with the list of breaks and what each would take. Never expand into new features.

## doneWhen
From the worktree root: `npm test` (the L4 runner; merge `lane/l4-test-path` into your worktree first if it is not on main yet) exits 0 with the same files PASS as before the upgrade; `apps/desk` no-model e2e (`*.e2e.mjs` that need no model — the ones sol ran: 11 files) pass; `pi --version` prints 0.87.1; `nana-setup doctor` says all good.

## NOT
- No settle gate / `agent_before_settle` handler (next lane).
- No changes to gate, handoff, config or objective semantics (tranche-1 lanes own them).
- No desk UX changes. No bench study re-runs (spend).
- Do not touch `research/`, `HANDOFF.md`, `docs/sessions/`.

## Facts you must read first (installed pi after upgrade: `$(npm root -g)/@earendil-works/pi-coding-agent/docs/` and `CHANGELOG`; releases 0.85.0, 0.85.1, 0.86.0, 0.86.1, 0.87.0, 0.87.1 on github.com/earendil-works/pi)
- 0.86: cache warming during tool runs/idle; per-model compaction budgets; **`TranscriptContext` breaking change**.
- 0.87: `turn_end` and new `agent_before_settle` became actionable (`continue: true`); **`shouldStopAfterTurn` removed** (replacement `finishTurn` → `{action:"end"}`); `ContextEditEntry` added to the SessionEntry union; `SessionManager` canonical; `context_edit` entries.
- Where nana-pi touches these: `packages/nana-pack/extensions/nana-notify.ts:106` (`agent_settled`), `nana-post-edit.ts:314` (dynamic `import("@earendil-works/pi-coding-agent")` for the file queue), `apps/desk/pi-session.mjs:11-56,355` (`parseSessionEntries`/`migrateSessionEntries` from pi's public index; the desk README "Dependencies" row pins ≥ 0.84.4), `apps/desk/server.mjs:942-957` (entry parsing), `apps/bench/lib/usage.mjs` + `run.mjs` (rpc `agent_settled` terminal marker), `research/pi-landscape-2026-09-01.md` (verified capability map — append a dated addendum, do not rewrite).

## Allowlist
`packages/nana-pack/extensions/*.ts` (compat only) · `packages/nana-pack/README.md` (version row) · `apps/desk/pi-session.mjs`, `apps/desk/server.mjs` (compat only), `apps/desk/README.md` (Dependencies row + Contract notes if the entry union changed) · `apps/bench/lib/usage.mjs`, `apps/bench/run.mjs` (compat only), `apps/bench/README.md` · `packages/nana-setup/**` only if doctor pins a version · `research/pi-landscape-2026-09-01.md` (dated addendum at the end) · new/updated tests for any compat shim.
Must not touch: test assertions that pin behavior (a changed pi contract that breaks a test is a FINDING to report with the replacement contract, not an assertion edit unless the brief's compat item requires it and you say so).

## Procedure
1. Baseline on 0.84.4: `npm test`, desk no-model e2e, `nana-setup doctor`; record.
2. `npm i -g @earendil-works/pi-coding-agent@0.87.1` (this is the ONE global mutation you are allowed; note the exact command and prior version in the report so the seat can roll back with `@0.84.4`).
3. Re-run the baseline set; for each break: read the changelog entry, apply the smallest compat change, add a test that pins the new contract.
4. Read the 0.87 docs for `agent_before_settle` and `context_edit` and write ≤15 lines in the report on what the settle-gate lane can rely on (events, return shape, loop guard) — read-only research for the next lane.
5. Live smoke: one `pi -p --provider openai-codex --model gpt-5.6-sol -t read "say ok"` from a temp dir to confirm the pack loads without error on 0.87.1 (check `~/.pi/agent/nana-journal.jsonl` for the session_start + objective_pickup lines).

## Roles
builder: Opus 5.5 (you) · reviewers: **compatibility** (sol: every documented pi contract nana-pi relies on, what changed, README rows) + **adversarial** (sol: run the suites yourself, try the desk against a real 0.87.1 session file, break the parser) · land: Opus 5.5 (seat verifies doneWhen on the merged tree).

## Rules
Foreground commands only; never end your turn with a command running. Kill only PIDs you started. The live desk service (`com.nana.pi-desk`) is running on this machine: do NOT restart it, do not bind its ports (7317/7320/7321); use the e2e suites' own ports only. Commit on the branch; no push. Smallest change that passes.

## Report (≤40 lines)
Commits · baseline vs after for each suite (files/checks/exit) · the global upgrade command + prior version · every break found and its compat change + pinning test · the settle-gate facts (≤15 lines) · live smoke result · `git diff --stat` · residuals · the one claim most likely wrong · `VERDICT: DONE`.
