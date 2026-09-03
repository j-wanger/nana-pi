# nana-dev-kit vs nana-agent-loop vs nana-pi — capability comparison (2026-09-03)

Requested by Jake after the examples census. Question: what do the two older stacks
have that the pi build doesn't, and which of those gaps are real. Grounded in:
nana-dev-kit `modules.json` + README (25 skills, 18 hooks, 7 layers), nana-agent-loop
CLAUDE.md + system map, and the current nana-pi tree. This EXTENDS shippable-options
D4 (the port tiering) with the loop-side machinery D4 didn't cover.

Boundary that keeps this honest: **nana-pi is the interactive seat + scaffolds;
nana-agent-loop owns governed autonomy.** Gaps are only real if they belong on the
interactive side.

## Capability matrix

| Capability | nana-dev-kit (Claude Code) | nana-agent-loop | nana-pi build | Verdict |
|---|---|---|---|---|
| Scaffolds + retrofit | py-init/ts-init, 10-dim scanner | — | copier templates + scaffold/adopt skills, tag-versioned, drift CI | **pi SUPERIOR** (update relationship; kit scaffolds are one-shot) |
| Quality gates | format/secrets/test hooks + pre-commit + CI | land toolchain rails | nana-post-edit (in-loop) + template pre-commit/CI (ruff/mypy/biome/gitleaks) | **parity**; test-ran-on-settle gate stays deferred (D2 Tier-2, subtraction test) |
| Spec discipline | /spec (9-section, two-tier review) | LoopSpec contracts + loop-init | /spec ported into nana-pack | **parity** for the seat |
| Plan lifecycle | /dev-plan → /dev-debrief → /dev-check (wiki-coupled, subagent dispatch) | HANDOFF + session logs + ceremony | nothing | **GAP (ruled 2026-09-03): plan belongs as a lean SKILL, not a mode** — a wiki-free plan/debrief skill pair is the candidate; port only on felt need after dogfood |
| Session continuity | pre-compact hook + debrief | HANDOFF.md ceremony + journal resume + compaction-boundary discipline | **nana-handoff (built 2026-09-03)**: compaction → `.pi/handoff.md`, fresh session auto-injects | **CLOSED today** — the loop's HANDOFF pattern, automated |
| Memory | MCP server + auto-store bridges (plan→memory, spec→memory) + /memory-consolidate | memory discipline rules (session-start recall, store-on-correction) | memory server BRIDGED via pi-mcp-adapter (verified); **no usage discipline** | **HALF-CLOSED**: plumbing yes, habits no. Candidate: one lean `~/.pi/agent/AGENTS.md` block (recall at session start, store corrections) — prompt-level, no code |
| Identity/rules | nana-soul/nana-personal synced to CLAUDE.md etc. | inherited | nothing (loop workers isolated BY DESIGN; interactive pi runs bare) | **OPEN QUESTION for Jake**: carry a lean identity into interactive pi via global AGENTS.md? Deliberate non-port so far |
| Knowledge wikis | 10 wiki skills, FTS5, episodic consolidation | research/ + DOCTRINE/IDEAS ledgers | deferred (D4 Tier-3) | **correctly deferred** — no felt need yet; revisit after dogfood |
| Review flows | py-review 8-point | reviewer-in-loop + non-Anthropic independent review | py-review ported; no ts-review | **minor gap**: ts-review skill (known since assessment) |
| Observability | session-start state hook, audit hooks | journal + desk feed + loop-status roll-call | nana-lifecycle journal + pi desk (sessions, approvals via dialogs) | **parity** for the seat |
| Governed loops | — | LoopSpec runner, budget gates, mandate gate, trust ladder, land choreography, ceremony Stop-hooks | none | **NOT A GAP** — stays in nana-agent-loop; pi is an engine there. Don't rebuild |
| Enforcement teeth | marker-gated enforce-spec/loop/memory hooks | Stop-hook roll-call, doctrine-lint, handoff-shape caps | none | **deliberate**: nana-pi CLAUDE.md is feel-first; teeth arrive only when a real failure shows need |
| Subagents | Claude-native Task tool | loop worker/manager pattern | pi-subagents (scout/researcher/worker/reviewer + custom .md agents) | **parity** for the seat |
| MCP/tools | kit MCP config | fetch-provenance host tools | pi-mcp-adapter proxy (memory bridged) + desk MCP tab | **parity+** |
| Native Windows | **NO** (bash hooks; WSL2 only) | partial (windows-native-shell lane) | **YES** — native win32 across pack/templates/desk (compat pass 2026-09-03) | **pi SUPERIOR — strategic**: the pi stack is the only nana surface that runs native on the Windows box |
| Eval harness | 52-scenario eval + LongMemEval benchmark | feel-first + doctrine ledger | none | **deliberate** (feel-first invariant); the kit's eval stays kit-side |
| UI | — | loop desk (loops ONLY, per AML rule) | pi desk (sessions, spawn, settings, titles) | complementary by design; keep the two desks separate |

## What this nets out to

**Real gaps worth acting on, in order:**
1. **Dogfood remains the gate** (unchanged from the assessment) — most "port on felt
   need" rows above are blocked behind actually using the stack on a real project.
2. **Memory usage discipline** — the bridge exists as of today; a ~10-line global
   AGENTS.md block (recall at start, store decisions/corrections) would close the
   loop the kit closes with hooks. Cheap, reversible, no code.
3. **Lean plan/debrief skills** (per today's ruling: skills, not modes) — the
   dev-plan pattern minus wiki coupling. Build after dogfood shows the shape.
4. **ts-review skill** — symmetry with py-review; small.
5. **Identity into interactive pi** — Jake's call, not a default: global AGENTS.md
   with a condensed nana-soul. The loop-side isolation stays untouched either way.

**Non-gaps to resist rebuilding in pi-land:** governed loops, enforcement teeth,
eval harnesses, wikis (for now). The kit is Claude-Code-shaped and macOS/WSL-bound;
the loop repo owns autonomy. nana-pi's edge is precisely the two things the others
lack: native Windows and the update-relationship scaffolds.
