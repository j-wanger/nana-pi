# Astra land ruling — lane T2c: the provenance label (context-injection surface)

Read-only. Decide whether this merges to nana-pi main. Installed pi 0.87.1. T2a (objective producer) and T2b (review ledger) are already on main; this builds on T2a.

Read in order: `t2c-brief.md` → `t2c-worker-r1.md` → `t2c-fix-brief.md` (seat's own predicate error) → `t2c-worker-r2.md` → `t2c-sol-r1.md` → `t2c-fix2-brief.md` → `t2c-worker-r3.md` → `t2c-sol-r2.md` → `t2c-fix3-brief.md` → `t2c-worker-r4.md` → `t2c-sol-r3.md` → `t2c-fix4-brief.md` → `t2c-worker-r5.md` → `t2c-fix5-brief.md` → `t2c-worker-r6.md` → clean diff `t2c-r5.patch` → the code (`packages/nana-pack/lib/objective.ts`, `lib/gate-paths.ts`, `tests/objective-golden.test.mjs`) and the declaration surfaces (`AGENTS.md`, pack README, `templates/_shared/`, `nana-setup/lib/project.mjs`).

**What Jake ruled.** 2026-09-28, after being shown sol's contrary recommendation (require nana-trust): **build the label, do not trust-gate.** A governing `OBJECTIVE.md` whose folder the owner has not vouched for carries a provenance label framed as untrusted DATA. He accepted the residual deliberately; the README records that as explicit risk acceptance, and sol confirmed it does not overclaim.

**Review history: sol's three rounds are spent (r1, r2, r3 — all BLOCK).** Two later fix rounds were implemented under the round-cap rule. **This lane produced a "the stated remedy is false" finding in EVERY round**, four of them traceable to the seat's own specification:
1. Seat pre-review: the predicate cleared the label when pi "would have asked", not when the owner answered — so a recorded DECLINE went unlabelled.
2. sol r1: the remedy said run `/trust`, but pi records the CWD, so a nested session's `/trust` never matched the governing folder.
3. sol r2: the remedy promised `/trust` unconditionally, while the label also fires for unusable stores — and pi's `/trust` THROWS on a malformed store.
4. sol r3: the label read `~/.pi/agent/trust.json` while pi honours `PI_CODING_AGENT_DIR` — a **fail-open**, since a stale default `true` suppressed the label when the active store recorded a decline.
5. Worker-declared, then fixed on the seat's instruction: an affirmative record in an unwritable folder cleared the label although pi's own `get()` throws there and treats the project as untrusted.

**Seat-verified:** `npm test` → 71 files, 4262 checks, exit 0. Probes re-run by the seat: malformed store emits the repair-first remedy naming the real store path; the trust-shape cases behave as claimed.

**A finding this lane surfaced in LANDED code, filed but NOT fixed here** (`~/nana-pi/HANDOFF.md`, new section): `lib/config.ts:276` reads the user-scope `nana-pack.json` — which carries the GATE's deny patterns — from `~/.pi/agent` regardless of `PI_CODING_AGENT_DIR`, while `gate-paths.ts`, `config.ts:345` and now `objective.ts` honour it. Fail-open in L1/L2. Rule on whether that blocks this lane or is correctly a separate item.

Rule on:
A. **Contract satisfied?** Label conditions, remediation truth for every case an owner reaches, both runtimes byte-identical, precedence unchanged, sanitization intact, risk acceptance recorded honestly. Name any invariant only asserted.
B. **Is the remediation NOW true everywhere?** This is the lane's recurring failure. Look for the next case rather than re-confirming: a read-only volume (untested by the worker), ACLs, root, a store file read-only in a writable folder (the worker pins that it still vouches — correct?), and the advice going stale between our read and the owner's action.
C. **Harm if merged:** every repo not affirmatively trusted now carries the label, including `~/aml-desk` and `~/the-hive` today. Is that the right default given Jake's ruling, and does the label's wording survive a reader who has never seen this conversation?
D. **Seat conduct:** four specification errors in one lane, each caught downstream; a fix commissioned past the sol cap for a worker-declared fail-open; a cross-component defect found and filed rather than fixed. Judge the process, not only the result.
E. **Coupling:** T2a's surfaces were re-synchronized twice; `gate-paths.ts` gained a shared `piAgentDir()` used by both the gate and the objective producer.

End with `SCORE: n/10`, MUST (empty if none), CARRY priced by cost of error, the upstream-contract declaration, and `VERDICT: LAND` or `VERDICT: BLOCK`. ≤60 lines.
