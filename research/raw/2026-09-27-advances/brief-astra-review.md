# Astra review brief — attack the synthesis

You are gpt-6-astra, the contract/architecture reviewer for Jake Wang's nana program. Read-only tools. The seat (Claude Fable 5.1) synthesized five lane reports into ONE document that will drive process changes and a set of code fixes. Your job is to find where the synthesis is wrong, overclaims, ranks badly, or would cause harm if adopted.

Read in order:
1. `~/nana-pi/research/agentic-advances-and-nana-review-2026-09-27.md` — the synthesis under review.
2. The five raw lane reports in `~/nana-pi/research/raw/2026-09-27-advances/`: `opus-research.md`, `sol-research.md`, `opus-review.md`, `sol-review.md`, `opus-pm.md`. Also `common.md` (the shared brief).
3. Context: `~/nana-agent-loop/OBJECTIVE.md`, `HANDOFF.md`, `loops/DOCTRINE.md`, `docs/loops-vs-pi-2026-09-04.md`, `docs/audits/` (09-16 spend audit), `~/nana-pi/HANDOFF.md`, `~/nana-pi/AGENTS.md`, and the shared rules index `~/.claude/nana-memory/shared/MEMORY.md`.
4. Where a synthesis claim is marked (seat-verified), check the artifact yourself where cheap (git log dates, grep counts, `nana-gate.ts` ordering, `review-round.mjs`).

Review dimensions — each gets PASS or FINDING(s) with severity HIGH/MED/LOW and the evidence:
A. **Fidelity**: does the synthesis misstate any lane's finding, drop a caveat the lane gave (evidence grade, "unverified", "most-likely-wrong"), or promote an inferred claim to fact?
B. **Ranking**: is the top-14 order defensible by cost-of-error × confidence / cost? Name any item that should move up or down and why. Name anything the lanes found that the synthesis omitted and should not have.
C. **Harm if adopted**: for each of items 1–6, what breaks or what perverse incentive appears? (e.g. a WIP limit that starves work; a handoff age bound that drops a live constraint; gate tightening that blocks legitimate commands headless; a round-cap counter that is gamed by item renaming.)
D. **Contradictions** with DOCTRINE.md, OBJECTIVE.md rules, Jake's shared feedback rules, or between recommendations.
E. **The Open-for-Jake list**: are these the right decisions, phrased so he can rule in one line each? Is anything on it that the seat should decide itself, or missing that only he can decide?
F. **Blast radius**: which recommended code changes touch the gate/permission/lifecycle surfaces and therefore need deterministic tests + an adversarial pass before landing (per nana-agent-loop AGENTS.md invariant)?

End with `SCORE: n/10` (10 = adopt as is), a MUST-FIX list (things that must change before this drives any action), a SHOULD list, and `VERDICT: LAND` or `VERDICT: BLOCK`.
