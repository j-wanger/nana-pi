# Worker brief — T2c fix round 6 (Opus 5.5). Astra land MUSTs; astra re-rules next.

Worktree `~/nana-pi-wt/t2c`, branch `lane/t2c-provenance-label` (HEAD `3409023`). Read `t2c-astra-land.md`.

**Trace before you fix.** Astra's process finding is that this lane's remedies were specified without tracing pi's `/trust` through resolution → lookup → locking → writing. Before changing any text, read the installed pi's real path for all four steps and write what you found into your report with `file:line`. Every fix below depends on it. (The lane template now requires this; you are the first lane under the rule.)

## MUST 1 (HIGH) — the remedy can change which store is active
`lib/objective.ts:439-440`, `lib/gate-paths.ts:65-72`. With a RELATIVE `PI_CODING_AGENT_DIR` (say `agent`), a session in `/repo/src` has active store `/repo/src/agent/trust.json`. If `/repo/OBJECTIVE.md` governs, the label says "start pi in `/repo`" — and that process resolves the agent dir to `/repo/agent` instead, writes the decision there, and the original nested session still labels. The advice moves the target.
**Required:** the remediation must preserve the ACTIVE agent directory as an absolute path across the cwd change — name it explicitly in the text so the owner can reproduce it (e.g. tell them the store that must receive the decision, and that a relative override resolves per-cwd). Pin the full transition: nested session labelled → follow the advice exactly → the original session is no longer labelled. Astra notes the existing relative-override test only exercises the predicate, never the restart sequence.

## MUST 2 (HIGH) — writable folder ≠ usable lock (fail-open, same class as fix 5)
`lib/objective.ts:296-378` never looks at `trust.json.lock`. Pi locks by `mkdir`; a regular FILE at that path blocks it — `ELOCKED` first, then a failed directory removal. Today an otherwise valid affirmative store still returns `vouched:true` while pi's `get()` throws, and with no affirmative record the label promises ordinary `/trust`, which also throws.
**Required:** detect an obstructed lock path and treat it as not-confirmed (label), with a remedy naming the lock path and the obstruction. Use pi's own lock semantics from your trace, not an assumption. Add a pi-oracle regression: assert pi's `get()` throws in the same fixture where we label, so the test records why we agree.

## MUST 3 (MED) — a dangling agent-dir symlink reads as absence
The `statSync`/ENOENT walk in `writeProblem()` climbs to a writable ancestor and emits ordinary `/trust` advice, but pi cannot create the directory through a dangling link. Diagnose the obstructing link itself and say so.

## MUST 4 — reconcile the declarations with the actual guarantees
- `AGENTS.md:17` still states the old umbrella default unconditionally; fix 5 changed default/relative umbrella resolution under an override.
- The README's clearing language is still unconditional in places; make it match the conditional remedies.
- The removal advice should tell the owner to re-check (and ideally back up) before removing a store, since a store repaired after our read means removal discards decisions — including declines — for no reason.
- Say that `/trust` also enables project resources; it is not merely dismissing a provenance warning.

## Appetite and the checkpoint rule
The lane is at 11 files, past its ceiling, with no checkpoint in any report — my rule, and it has now gone unenforced twice. This round: if you cross what remains, WRITE THE CHECKPOINT (what remains, what it would cost) and stop rather than continuing. `--max-budget-usd 15`.

## doneWhen
`npm test` exits 0; the full nested→remediate→restart transition is pinned; an obstructed lock path and a dangling agent-dir link both label with truthful remedies and a pi-oracle assertion; no declaration overstates.

## Report (≤25 lines)
The `/trust` trace with file:line for resolve/read/lock/write · each MUST with its before/after · the pi-oracle assertions · `npm test` summary · size against ceiling and your checkpoint decision · residuals · the one claim most likely wrong · `VERDICT: DONE`.
