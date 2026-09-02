# Shippable nana-pi: integration options (2026-09-02)

**The question**: how to turn nana-pi into something shippable and usable out of the box,
generating modular, best-practice code with a clear folder structure — and which parts of
nana-dev-kit to bring over. Evidence base: `../research/coding-agent-best-practices-2026-09-02.md`
(324 Opus-4.8 research agents, 3 runs) + a full nana-dev-kit portability inventory + pi
0.84.4 installed-docs verification. Four decisions, each with options and a pick.

**What pi gives us for free** (verified against installed 0.84.4 docs — this shapes
everything): packages bundle extensions + skills + prompts + themes in one installable
unit; pi implements the Agent Skills standard and can even consume `~/.claude/skills`
directly; pi natively reads `AGENTS.md`/`CLAUDE.md` per-directory (all ancestors layered,
`AGENTS.override.md` replaces a layer); extensions get blocking `tool_call`, modifying
`tool_result`, system-prompt injection, custom tools, slash commands. The one thing core
pi won't carry is MCP (extension-only via `pi-mcp-adapter`).

---

## D1 — How "out of the box" gets delivered (the scaffold mechanism)

| | Option | Tradeoff |
|---|---|---|
| A | **Scaffold skills only** — port py-init/ts-init as pi skills; templates live inside nana-pack | Lightest; but generated projects have no update path — the copy-paste drift problem the research flags as THE scaffold killer |
| B | **Copier templates + thin pi skill wrappers** ✅ | Templates live as versioned copier templates; a `/scaffold-py` / `/scaffold-ts` pi skill runs `uvx copier copy`. Generated projects record their template version; `copier update` re-syncs, a CI check flags drift. Research-backed (cruft/copier model). Cost: templates move out of skill prose into a real template repo |
| C | **Custom generator command in nana-pack** (`pi.registerCommand`) | Most control, reinvents copier, highest maintenance |

**Pick: B.** The strongest scaffold finding was that template drift, not initial
generation, is the real problem. Copier gives update/check for free; the pi skill stays a
5-line wrapper. (uv is already a prerequisite of our Python opinion, so `uvx copier` adds
no new toolchain.)

## D2 — The quality floor for generated code (your modularity goal)

| | Option | Tradeoff |
|---|---|---|
| A | Prompt/AGENTS.md guidance only | Cheapest; research says guidance is NOT useless (the "prompts don't reduce smells" claim was refuted) but nothing enforces it |
| B | **In-loop deterministic gates + CI backstop** ✅ | nana-post-edit (already built) runs format + lint + typecheck + size/complexity caps on EVERY edit and feeds failures back to the model as self-correction text; pre-commit + CI re-enforce at the boundary. This is the documented "deterministic shell around the probabilistic agent" pattern |
| C | B + an LLM review pass (py-review analog) as a skill | Adds judgment-tier review; port later as cheap prose once B is proven |

**Pick: B now, C as a fast follow.** Concrete cap preset (shipped as nana-pack config +
scaffold lint config, per-project overridable):

- **TypeScript**: ESLint/Biome `max-lines` 300 (ESLint's own default), `max-lines-per-function`
  50, complexity 15 (Qlty default).
- **Python**: ruff `C901` complexity 10-15 + `PLR` limits (statements/function 50);
  file cap ~500 lines via a trivial post-edit check (ruff has no file-length rule).
- **Honest framing** (matters for how hard we enforce): line caps are convention +
  mechanism, NOT proven defect-reducers — the strong empirical claims failed adversarial
  verification, and measured *agentic* failure is architectural (God Class), which
  complexity caps catch and line caps miss. So: caps fire as **in-loop feedback the agent
  must satisfy** (self-correct), with CI as the hard stop — not as silent auto-reject.

## D3 — Navigation structure in generated projects (per-folder .md vs map)

| | Option | Tradeoff |
|---|---|---|
| A | Single root AGENTS.md | Simplest; measured to bloat, conflict, and lose rule adherence as it grows |
| B | **Lean root + nested per-folder AGENTS.md** ✅ | pi-native (ancestor layering, closest-wins is spec-backed); scaffold generates a one-screen AGENTS.md per major folder (purpose, key files, local rules); root stays <150 lines — the practitioner adherence ceiling |
| C | B + a generated repo-map artifact (system-map style) | The map trades general-comprehension quality for token savings on a single unreplicated study; Claude Code's grep-JIT bet went the other way. Keep maps as an ARCHITECT surface for nana-pi itself, not something generated projects carry |

**Pick: B.** Your per-folder-.md instinct is exactly what the evidence and pi's own
mechanism support — with the discipline that each file stays one screen and the root stays
lean (context rot + instruction-bloat findings are the strongest-replicated in the whole
research). Skip llms.txt (published widely, consumed ~nowhere). Structure opinion baked
into templates: **folder-by-feature + colocation** (the one clear structure consensus),
src/ layout for Python, `tests/` separate for Python (pytest-conventional), test placement
for TS chosen per-template since no universal norm survived verification.

## D4 — What to port from nana-dev-kit

**Tier 1 — port now (cheap, high value):**
- Config pins as copier template content: pyproject (uv/ruff/pytest/coverage), pre-commit,
  CI workflows, tsconfig (strict umbrella + complementary flags), Biome, Vitest. All
  harness-agnostic already; research confirms uv/ruff/src-layout/pyproject-only and
  strict/vitest as consensus. Keep mypy-strict and Biome as **declared opinions** (both
  genuinely unresolved in the community — fine, an opinionated tool picks).
- py-lint / py-test / py-review / spec as **pi skills** (they're prose + portable
  commands; pi speaks the same skills standard).
- AGENTS.md templates — **rewritten lean** per the bloat evidence, not copied wholesale.

**Tier 2 — selective extension work (the real port cost):**
- nana-post-edit cap presets (D2) — config, not new code.
- A test-ran gate on session settle (Claude Stop-hook analog via pi lifecycle events) —
  only if D2 proves insufficient; subtraction test applies.
- Check ecosystem overlap first (pi-lens covers LSP/lint feedback; permission packs cover
  gating) — the 09-01 census warned: never two packs on one hook class.

**Tier 3 — defer:**
- dev-wiki + knowledge-wiki families: heavy Claude-specific orchestration (subagent
  dispatch, AskUserQuestion, TodoWrite); port only if a felt need emerges in pi usage.
- memory_server: portable code, but pi core has no MCP — needs pi-mcp-adapter or a
  `registerTool` wrapper. Defer until something in pi actually wants memory.

---

## Not settled here

- Python type-checker (mypy vs pyright vs ty) and Biome-vs-ESLint stay conscious opinions;
  revisit when ty exits beta.
- Barrel files, pnpm/monorepo defaults: zero surviving evidence after three passes —
  decide from tool docs when they bite.
- Desk double-messaging bug: cause traced and recorded in `../apps/desk/README.md`
  (Known issues) — optimistic append + un-deduped user `message_end` echo; small fix,
  separate change.

## Suggested build order (if the picks stand)

1. Copier template repos (py + ts) carrying the Tier-1 config pins + lean nested AGENTS.md.
2. `/scaffold-py` + `/scaffold-ts` skills in nana-pack; post-edit cap presets wired.
3. Port py-lint/py-test/py-review/spec as pi skills.
4. Desk double-messaging fix.
5. Dogfood: generate a real project, feel the loop, then decide Tier 2.
