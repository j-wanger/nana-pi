# Worker brief — T2a fix round 5 (Opus 5.5). Astra land MUSTs 1 and 2; astra re-rules next.

Worktree `~/nana-pi-wt/t2a`, branch `lane/t2a-objective` (HEAD `6191c66` — the seat merged main and already handled MUST 3, the HANDOFF reconciliation). Read `t2a-astra-land.md`.

## MUST 1 — consumer declarations are incomplete, and one runtime promise is now wrong
Astra: pack README and the `config.ts` objective comment describe the change, but these do not:
- `~/nana-pi/AGENTS.md` — no objective contract. Add a short section: the nearest `OBJECTIVE.md` governs (no opt-in), `projectFile` renames only, both program lines are shown with a precedence sentence, and only marker-bearing lines are emitted (never raw file content).
- `templates/_shared/working-under-nana-pi.md` — same omission; every scaffolded project emits this file, so it is the widest-read surface. One short bullet.
- `templates/_shared/OBJECTIVE.md` (the shared seed) — it omits the displayed umbrella priority and the precedence sentence, so a seeded project's author cannot tell what a session will actually see. Bring it in line.
- **Node version promise.** The hook now invokes a CLI that imports `.ts` without a strip-types flag; the CLI header requires Node ≥22.18, while `packages/nana-setup/README.md` still promises Node ≥22. Reconcile: state the real floor wherever a runtime requirement is published (setup README, the CLI header, any doctor check), and make the failure mode legible if Node is older.

## MUST 2 — doctor calls a rejected setting a successful rename
`packages/nana-setup/lib/doctor.mjs:95-98` reports `projectFile: "../OBJECTIVE.md"` as a successful rename, although the producer now rejects any value that is not a bare filename. Doctor must distinguish: a bare filename different from `OBJECTIVE.md` is a rename; `OBJECTIVE.md` is the default; anything with a separator, `.` or `..` is INVALID and must be reported as ✗ with the reason and the effective fallback. Add a regression test covering all four cases.

## Also (astra CARRY, cheap and in-lane)
- Astra notes the advisory size ceiling was crossed after r1 with no checkpoint in any report. Note it in your report this round: state the current size against the ceiling, and whether the remainder was mechanical. This is process compliance, not code.
- Do NOT touch the inherited post-edit and handoff sanitization surfaces; astra ruled those a separate cross-cutting lane.
- Do NOT implement or reword the provenance label; Jake's decision is pending and the seat has recorded it as open.

## NOT
Nothing else. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; the four declaration surfaces state the contract; doctor reports invalid, default and renamed distinctly with a test for each.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push.

## Report (≤20 lines)
Commit · each declaration surface with the text added · doctor's four cases before/after · the Node floor as published and the failure mode when older · the size-against-ceiling statement · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
