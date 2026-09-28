# Brief — critical review of the nana implementation (nana-pi + nana-agent-loop)

Read-only over both repos (you may run existing test commands and git log/diff; install nothing; edit nothing). Write only your report.

Question: does what is built serve the objective + current priority, and where does it fail — in design, in code, and in the process that runs it? Be adversarial. The author of most of this is the seat model plus Opus/sol workers; assume every self-report in HANDOFF/sessions is a claim to re-derive from the artifact.

Read in this order, then go wherever the evidence points:
1. `~/nana-agent-loop/OBJECTIVE.md`, `AGENTS.md`, `HANDOFF.md`, `docs/operating-model.md`, `docs/loops-vs-pi-2026-09-04.md`, `docs/audits/` (the 09-16 spend audit), `loops/DOCTRINE.md`, `loops/FRICTIONS.md` (skim: what keeps fighting them), `docs/sessions/2026-09.md`.
2. `~/nana-pi/AGENTS.md`, `HANDOFF.md`, `docs/sessions/2026-09.md`, `packages/nana-pack/README.md` + `extensions/*.ts` + `lib/*.ts` + `bin/pi-review.mjs` + `bin/review-round.mjs`, `packages/nana-knowledge/README.md` + `lib/*.ts` + `bin/nana-knowledge.ts`, `packages/nana-setup/README.md` + `claude/` (the hooks and rules every Claude Code session runs under) + `lib/`, `apps/desk/README.md` + `server.mjs` + `pi-session.mjs`, `templates/_shared/`.
3. `~/nana-agent-loop/app/src/gate/`, `loop/runner.ts`, `loop/reviewer.ts`, `loop/trust-ladder.ts`, `host/loop-main.ts`, `loop/loop-status.ts`, `docs/system-map.html` (or `loops/system-map.components.json`), `.claude/settings.json` + `.claude/hooks/`.
4. `~/.claude/nana-memory/shared/*.md` — the rules the seat operates under. `~/.claude/settings.json` hooks if readable.

Review dimensions (each gets a section with findings; a finding = evidence `path:line` or a command you ran + its output, severity by cost-of-error, and the cheapest fix or test):
A. Objective fit: which mechanisms demonstrably serve "nana-pi experience consistent, coherent, effective", which serve a retired lane (the dormant loop runner, the parked desk), and what is carried only by habit. Name subtraction candidates with the turn-it-off test.
B. Process integrity: does the process as run (sessions logs) match the process as documented (AGENTS/HANDOFF/rules)? Where do agents pick wrong priorities or overspend (Jake's 09-16 diagnosis) — find the mechanism gap, not the symptom. Is the 3-round review cap, the objective print, the knowledge pull, the two-tier memory, the HANDOFF drop rule actually enforced or merely written? Which are measured?
C. Code defects with blast radius: gate/permission/lifecycle/knowledge-pull/pi-review paths — races, fail-open, silent errors, unbounded growth, cross-platform (win32) breaks, tests that assert the implementation rather than an invariant. Run `npm test` where a package has it and report counts honestly.
D. Duplication and drift: the same mechanism built twice (Claude Code hook vs pi extension, forwarders, two memory tiers, two knowledge indexes, doctrine vs memory vs HANDOFF), contracts declared in one place and read from another.
E. Context shaping: what does a fresh session (Claude Code and pi) actually see at start and at prompt time (measure it: bytes/tokens of hook output, CLAUDE.md, rules, memory index, knowledge pointers)? Is it the smallest high-signal set, or bloat? What is missing that sessions then re-derive?
F. Unmeasured claims: list the standing claims ("un-bypassable", "one producer per evidence", "retrieval is used", "review rounds catch disjoint classes") and whether any instrument exists.

End with: top 10 recommendations ranked by cost-of-error × confidence / cost, each one line + evidence + test; then the VERDICT block from common.md.

Write the report to `~/nana-pi/research/raw/2026-09-27-advances/opus-review.md` with the Write tool; final message = ≤10-line summary ending `VERDICT: DONE`.
