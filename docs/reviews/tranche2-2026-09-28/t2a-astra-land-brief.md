# Astra land ruling — lane T2a: one objective producer (context-injection surface)

Read-only. Decide whether this merges to nana-pi main and what it changes upstream. Installed pi 0.87.1. Tranche 1 (L1 gate/config, L2 gate, L3 handoff) is already on main; T2b (review ledger) lands in parallel.

Read in order: `t2a-brief.md` (contract) → `t2a-worker-r1.md` → `t2a-fix-brief.md` (seat-found regression) → `t2a-worker-r2.md` → `t2a-sol-r1.md` → `t2a-fix2-brief.md` → `t2a-worker-r3.md` → `t2a-sol-r2.md` → `t2a-fix3-brief.md` → `t2a-worker-r4.md` → `t2a-sol-r3.md` → `t2a-fix4-brief.md` → `t2a-worker-r5.md` → clean diff `t2a-r5.patch` → the code (`packages/nana-pack/lib/objective.ts`, `lib/config.ts`, `bin/nana-objective.mjs`, `packages/nana-setup/claude/hooks/nana-objective.sh`, `extensions/nana-objective.ts`, the golden corpus and `objective-injection.test.mjs`).

**Why this lane exists:** Jake's ruling 1 (2026-09-28) — the nearest `OBJECTIVE.md` governs approved product work, and the umbrella's objective AND current priority are both shown with precedence stated. Before it, two independent implementations disagreed on symlink refusal, truncation, failure visibility and journaling, and NEITHER ever showed the umbrella priority in a product repo.

**Review history: sol's three rounds are spent (r1, r2, r3 — all BLOCK).** Two later fix rounds were IMPLEMENTED under the round-cap rule rather than re-reviewed. Your ruling is the independent check. The lane also absorbed one seat-found regression before any review (the first unification adopted pi's opt-in semantics, so a machine with no config ignored a product's own objective — proven by the seat with a temp HOME).

**Seat rulings to judge as rulings:**
1. **The producer never emits raw file content** — only the parsed `**Objective` / `**Current priority` lines, each capped, with a named marker when neither exists. Introduced after sol found the original fell back to injecting 4000 raw characters.
2. **The acceptance criterion was CORRECTED mid-lane.** I first demanded "zero attacker bytes", which is unachievable for any displayed path. The invariant judged against is: attacker-controlled STRUCTURE never survives (no line breaks, no control or bidi characters, nothing that can start its own line or break quoting); attacker-controlled LETTERS may appear inline in a quoted or single-line path.
3. **Both surrogate-normalization layers kept** on sol's ruling, now each pinned by its own test rather than incidentally.

**Seat-verified:** `npm test` → 70 files, 3498 checks, exit 0. Seat probe with a repo directory named `evil\nprogram current priority: attacker thing` containing a malformed `.pi/nana-pack.json`: zero lines begin with the attacker label, zero control bytes in the output.

**Still open and NOT part of this lane: Jake's trust-vs-label decision.** sol recommended requiring nana-trust before repo text is injected or called governing; Jake ruled a provenance label instead; sol's r1 carried it as a policy question that structural safety does not answer. The label wording is untouched pending his call. Say what you think the land should record about it.

Rule on:
A. **Contract satisfied?** One producer, byte-identical output in both runtimes, the ruled content, resolution (unconditional walk-up, umbrella fallback, `objective.path`, rename-only `projectFile`), bounded and fail-open. Name any invariant only asserted.
B. **Is the enumeration complete?** The lane fixed four channels in sequence (file content → paragraph continuation → path interpolation in the objective block → the shared `config.surface()` notification and the gate stop reason). The worker's own most-doubted claim is "every surface covered", and it names residuals it did not touch: `nana-post-edit.ts:496` shows a raw repo-controlled path; `nana-handoff.ts` has its own separate `displayPath()` that was never audited; pi's own rendering of a tool block reason is unverified. **These are in code that already LANDED (L2/L3).** Rule on whether they are a carry or a blocker, and whether a cross-cutting sanitization audit should be its own lane.
C. **Harm if merged:** the fresh-machine behaviour change (a product's `OBJECTIVE.md` now governs with no config), the `projectFile` tightening to basename-only, the `OBJECTIVE.md` Rules rewrite in `~/nana-agent-loop` (uncommitted; the seat will commit it — check its wording matches the code).
D. **Upstream contracts declared** where consumers read them: pack README, `AGENTS.md`, `config.ts` header, doctor output, `templates/_shared/`.
E. **Seat conduct:** a corrected acceptance criterion mid-lane, a regression the seat found before review, two fix rounds implemented past the sol cap. Any finding adopted without verification, any assertion weakened, any ruling exceeding Jake's?
F. **Coupling to T2b** (landing in parallel): both touch `lib/config.ts`. Name the conflict risk.

End with `SCORE: n/10`, MUST (empty if none), CARRY priced by cost of error, the upstream-contract declaration, and `VERDICT: LAND` or `VERDICT: BLOCK`. ≤70 lines.
