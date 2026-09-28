# Brief — project-management concepts applied to agentic workflows (Opus 5.5)

You have web search and fetch. Jake's ask, verbatim: "research on project management concepts and their applications to agentic workflows, e.g. agile approach; again with lenses on nana process."

Already known — read first, do not repeat: `~/private-knowledge/agentic-engineering-wiki/index.md` (the two `ai-project-management*` articles; open them under the wiki's articles path if present), `~/nana-agent-loop/docs/sessions/2026-09.md` entry "2026-09-06 (1) — ai4kanban comparison" (nana adopted its prune guide as the HANDOFF drop rule), `~/nana-agent-loop/docs/operating-model.md` (the five-loop model L1 operate · L2 improve · L3 learn · L4 feel · L5 govern), `~/nana-agent-loop/OBJECTIVE.md` (objective + priority + the 3-round review cap), `~/nana-agent-loop/HANDOFF.md` §"How to update", `~/nana-agent-loop/loops/QUEUE.md` and `loops/FRICTIONS.md` (skim the heads: these are nana's backlog and impediment ledgers), `~/nana-pi/templates/_shared/` (the frontier seeds every product repo carries).

What nana's process is today, in PM terms (verify against the files, then judge): objective + single current priority as the only planning artifact; HANDOFF.md as a rolling frontier (not a backlog); QUEUE.md as graduated backlog; FRICTIONS.md as an impediment log; DOCTRINE.md as a lessons ledger; session logs as the retrospective; a 3-round review cap as a WIP/timebox device; "spec the contract, not the design" as the story format; headless worker lanes with independent review as the delivery unit; land review as definition-of-done; no sprints, no estimates, no velocity, no explicit WIP limit across lanes; Jake as sole product owner who rules by conversation.

Research (primary sources preferred: the Agile Manifesto and Scrum Guide, Kanban Method (Anderson), Lean/Toyota (jidoka, andon, kaizen, WIP limits, Little's law), Shape Up (Basecamp), critical chain, OKRs, DoD/DoR, XP practices; then 2025–2026 work on applying these to AI-agent teams — papers, practitioner reports with data, vendor docs of agent orchestration products that expose PM constructs (tickets, sprints, boards), and the ai4kanban-style repos). Aim for 15–25 sources actually read.

Questions to answer, each with evidence:
1. Which PM concepts transfer to agent workflows unchanged, which transfer with a change of unit (sprint → lane, story points → budget cap, standup → session start hook, retro → session log, DoD → land review), and which do not transfer (and why: no human attention economics, near-zero cost of re-planning, forgetful executors, no team learning without written deposit).
2. Flow control: WIP limits, batch size, Little's law, cost of delay — does nana over-parallelize lanes or over-serialize? Is the 3-round review cap the right control, or a proxy for a missing WIP limit / cycle-time measure?
3. Planning cadence and horizon: single-priority (nana) vs sprint goal vs Shape Up bets vs OKRs. What does the evidence say about the right horizon when executors are agents and the product owner is one person with limited attention?
4. Feedback loops: acceptance-by-feel (Jake's "feel it" gate), demo/review rituals, retros — what forms produce the change they promise? Jake's diagnosis: autonomy rose, consistency did not.
5. Impediment and knowledge handling: impediment logs vs kaizen vs blameless post-mortems; where a ledger stops being read; what makes lessons re-enter the next cycle (nana's DOCTRINE `[uses:N]` counter is one attempt).
6. Roles: product owner / scrum master / team when the team is models. Who owns the backlog grooming? Who says stop? Evidence on human-in-the-loop cadence.
7. Anti-patterns to watch: process theatre, ceremony that accrues without measurement, "agile as reporting", estimates as commitments — and their agent-workflow equivalents.

For EACH finding: claim · source (URL, date, or book/edition) · grade · what nana does today (name the file) · what would change · cost (S/M/L) · cheapest test · contradiction with a DOCTRINE.md line if any.

End with: (a) top 10 changes ranked by (payoff × confidence) / cost; (b) refuted/unverified ledger; (c) the VERDICT block from common.md.

Write the report to `~/nana-pi/research/raw/2026-09-27-advances/opus-pm.md` with the Write tool; final message = ≤10-line summary ending `VERDICT: DONE`.
