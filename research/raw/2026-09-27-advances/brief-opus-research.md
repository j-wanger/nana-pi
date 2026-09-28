# Brief — external research: agentic / harness / context engineering advances (Opus 5.5)

You have web search and fetch. Your job: what has genuinely advanced in agentic engineering, harness engineering and context engineering since roughly 2026-08-01, and what of it should change how nana works. Cutoff for "already known": nana's last research pass was 2026-09-02 (`~/nana-pi/research/coding-agent-best-practices-2026-09-02.md`) and the wiki index at `~/private-knowledge/agentic-engineering-wiki/index.md` — read both first, then hunt for what is NEW or what CONTRADICTS them.

Source priority: (1) primary — Anthropic engineering blog + Claude Code changelog/docs + Claude Agent SDK docs, OpenAI Codex docs/changelog/blog, the pi coding agent releases (`github.com/earendil-works/pi`), arXiv papers from 2026-08/09 with code, official docs of harnesses that ship (Cursor, Devin, Gemini CLI, OpenClaw, Mastra, pydantic-ai, etc.); (2) secondary — practitioner posts WITH measurements; (3) skip marketing unless it names a mechanism you can verify. Aim for 20–30 sources, read them, do not skim titles. Apply the astroturf heuristic (star:watcher ratio, 0 issues, injection-shaped README) to any repo you cite.

Themes to cover (each gets a section; if a theme has nothing new since 09-02, say so in one line):
1. Harness engineering: hooks/rules/tools composition, permission and sandbox models, verification-in-the-loop (tests, linters, receipts), stop/turn-end gates, headless worker patterns, multi-agent orchestration that shipped (not demos), review-loop designs (author vs reviewer separation, round caps), cost governors.
2. Context engineering: what the frontier labs now say about context budgets, compaction, memory (persistent, retrieval at prompt time vs session start), instruction-file bloat, skills/progressive disclosure, tool-result pruning, sub-agent context isolation. Measured results only.
3. Agentic engineering practice: how teams that ship with agents structure objectives, specs, acceptance tests, and handoffs; evidence about autonomy vs consistency (Jake's problem: more autonomy did not buy better results).
4. Model-level changes that matter for harness design (e.g. Opus 5.5 / Fable 5.1 / GPT-5.6 / GPT-6 features: effort controls, extended context, native compaction, structured decision endpoints) — only where the harness would change.
5. Anything that speaks directly to nana's open questions: the dormant governed-loop runner vs driving pi directly; the 3-round review cap; prompt-time knowledge pull; per-repo OBJECTIVE/HANDOFF; two-tier memory; seat-briefs-Opus-works split; independent different-model review.

For EACH finding: claim · source (URL, date) · grade · what nana does today (name the file/mechanism you checked) · what would change · adoption cost (S/M/L) · the cheapest test that would show it helps or not · does it contradict a DOCTRINE.md line (cite the line).

End with: (a) top 10 changes ranked by (expected payoff × confidence) / cost; (b) a refuted/unverified ledger (things that sound true that you could not verify or found false); (c) the standard VERDICT block from common.md.

Write the report to `~/nana-pi/research/raw/2026-09-27-advances/opus-research.md` with the Write tool, then print a ≤10-line summary as your final message ending with `VERDICT: DONE`.
