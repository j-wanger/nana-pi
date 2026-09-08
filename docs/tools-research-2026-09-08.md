# pi tool sets — grounded brief (2026-09-08)

**Bottom line:** your observation has an exact mechanical cause and a one-line fix — but "read+bash heavy" is mostly *not* a defect, and no primary source says otherwise. Buy the cheap fix; don't buy the story.

## 1. Ground truth — installed pi 0.84.4 (VERIFIED in docs + `dist/`)

Default active set is `["read","bash","edit","write"]` (`dist/core/sdk.js:139`, `agent-session.js:2201-03`). `grep`/`find`/`ls` ship but are **off**, and the system prompt then adds *"Use bash for file operations like ls, rg, find"* — emitted only when bash is on and all three are off (`system-prompt.js:62-71`). Two further tilts: `bash`'s snippet is *"Execute bash commands (ls, grep, find, etc.)"*, and grep/find/ls carry **empty** `guidelines` arrays while read/write/edit each carry steering text.

| tool | what it is | default | caps |
|---|---|---|---|
| `read` | file contents + images; `offset`/`limit` | **on** | 2000 lines / 50KB |
| `bash` | shell (`powershell` on Windows) | **on** | last 2000 lines / 50KB → temp file |
| `edit` | exact-text replace, multiple disjoint edits per call | **on** | — |
| `write` | create/overwrite, makes parent dirs | **on** | — |
| `grep` | content search, **ripgrep-backed**, .gitignore-aware, glob filter | off | 100 matches / 50KB / 500-char lines |
| `find` | file search by **glob** (Claude Code's `Glob`), fd-backed, .gitignore-aware | off | 1000 results / 50KB |
| `ls` | directory listing, dotfiles, `/` suffix | off | 500 entries / 50KB |

- `defaultTools` (settings.md:226-244): built-ins only; user or project scope; **project replaces global**, no merge; `[]` = none; extension/SDK/MCP tools unaffected.
- `--tools/-t` is a strict allowlist over **all** tools incl. extension + MCP (`agent-session.js:2103-11`). `-xt` filters; `-nbt` drops built-ins only.
- **No web search, fetch, or subagent tool in core** — by design: pi "intentionally does not include built-in MCP, sub-agents, permission popups, plan mode, to-dos, or background bash" (usage.md). Web search exists only as a Brave-API *skill*.
- Extension tool: `pi.registerTool({ name, description, promptSnippet, promptGuidelines, parameters: Type.Object({…}), async execute(id, params, signal, onUpdate, ctx){…} })`; `setActiveTools(names)` toggles live. No built-in `/tools` command — only `examples/extensions/tools.ts`.

**Your machine (verified):** no `defaultTools` in `~/.pi/agent/settings.json`, so the seat runs the four-tool set. Session data is bimodal — seat sessions are `bash,edit,read,write`; every session using `find,grep,read` is a pi-subagents child, whose frontmatter declares `read, grep, find, ls`. **Your subagents get the search tools; your seat doesn't.** Seat bash verbs: 237 `uv`, 61 `git`, 22 search-shaped. Cost to enable all three: **509 measured tokens**.

## 2. Ecosystem (agent-reported, not locally verified)

~9.4k npm `pi-package` hits, no official registry. Leaders are `@earendil-works`-scoped and astroturf-clean on fork/contributor depth (star:watcher is useless here — pi itself is 103k★/322 watchers).

- **pi-web-access** (1.4k★, 94k dl/wk, pushed 09-06) — `web_search`, `fetch_content`, `source_check`, ~22 providers. The only credible web answer; same author as your pi-mcp-adapter and pi-subagents.
- **pi-subagents** (3.5k★) and **pi-mcp-adapter** (1.4k★, 257k dl/wk) — you run both. Memory: pi-hermes-memory (425★). Avoid pi-mcp-extension (dead, deprecated scope).

## 3. Best practice — the premise is largely wrong

**Claude Code** ships Read/Edit/Write + Glob/Grep + Bash + WebSearch/WebFetch + Agent/Skill ([agent-loop](https://code.claude.com/docs/en/agent-sdk/agent-loop)). **Codex CLI is shell-only** — `shell`, `unified_exec`, `apply_patch`, `web_search`, `view_image` ([config-reference](https://learn.chatgpt.com/docs/config-file/config-reference)). **Aider** has no model tool-calling at all. So there is no industry consensus to copy.

**No Anthropic primary source argues dedicated Grep/Glob over shelling out.** The famous "You MUST avoid find and grep" line is a third-party gist; current docs bless Bash `cat`/`head`/`rg`, and [best-practices](https://code.claude.com/docs/en/best-practices) calls CLI tools *"the most context-efficient way to interact with external services."* **SWE-agent** shows shell-only 11.0% vs 18.0% ([arXiv:2405.15793](https://arxiv.org/abs/2405.15793)) — bash search *"produc[es] too many results"*, *"inconsistent in appearance"* — **but** the same team's bash-only [mini-swe-agent](https://mini-swe-agent.com/latest/) scores >74% on SWE-bench Verified; that edge was a weak-model crutch. What survives: cap and shape output, own edits, keep bash first-class, prefer fewer capable tools ([writing-tools](https://www.anthropic.com/engineering/writing-tools-for-agents)).

**The parallelism argument doesn't transfer:** CC batches read-only tools and serializes Bash; pi parallelises *all* tool calls (extensions.md:1923). And pi's `bash` is already capped, `rg` already honours .gitignore — so grep/find/ls buy deterministic, head-biased, match-counted output, not a step change.

## 4. Recommendation — three profiles, your call

- **A. pi defaults** (today, unset): smallest prompt; seat can't search structurally and is steered to bash.
- **B. lean-code (my pick)** — `"defaultTools": ["read","grep","find","ls","edit","write","bash"]`. Matches pi's own read-only recipe (usage.md:299); capped search; kills the bash-for-search guideline. Costs 509 tokens (0.2% of context, cacheable); bash's snippet still advertises search.
- **C. research** — B plus `pi install npm:pi-web-access`. Closes the one real gap (pi has *no* web access) and pairs with your subagents. Costs a third-party dep with full system access — review source first.

**Pick B now, C after reading pi-web-access's source.** Add one line to `~/.pi/agent/AGENTS.md` (you have none): *"Prefer grep/find/ls over bash rg/find/ls; use bash for tests, git, builds"* — the built-ins contribute no guidelines of their own. Expect a modest win; judge by feel.

**Desk exposure — both surfaces nearly wired.** *Per-spawn:* `spawnChild()` already accepts `tools` → `-t` (`server.mjs:157,176`); the apps layer already demands a per-app allowlist (`apps.mjs:128-131`). Missing: a checkbox row in the spawn popover (`app.js:1800`), which already does this for skills/extensions. Caveat to encode: `-t` is global, so an allowlist must also name `subagent`, `subagent_wait`, `mcp` or they vanish. *Persistent:* add `"defaultTools"` to `SETTINGS_PATCH_KEYS` (`server.mjs:868`) and render it — one scope at a time, since project `defaultTools` replaces global.

---

**Paste summary**

1. pi's defaults are only `read, bash, edit, write`; `grep`/`find`/`ls` ship but are OFF, and the system prompt then tells the model to use bash for ls/rg/find — cause verified in `dist/`.
2. Your session data confirms it: seat sessions are `bash,edit,read,write`; only pi-subagents children use `find,grep,read`.
3. pi has NO built-in web search, fetch, or subagent tool, by explicit design; `pi-web-access` (1.4k★) is the credible add.
4. But bash-heavy isn't a defect — no Anthropic source argues against it, and SWE-agent's own bash-only successor scores >74% on SWE-bench Verified. Expect a modest win.
5. Recommend `defaultTools: [read, grep, find, ls, edit, write, bash]` + one AGENTS.md line; desk needs `defaultTools` in `SETTINGS_PATCH_KEYS` and a spawn-popover tools row — and any `-t` allowlist must name `subagent`/`mcp` or it kills them.
