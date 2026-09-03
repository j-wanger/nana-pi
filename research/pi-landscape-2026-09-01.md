# Pi agent family — landscape & adoption research (2026-09-01)

**Verdict: ADOPT as a primary coding-agent platform. No dealbreakers on macOS or native Windows.**
All three must-have areas (hooks, context management, session management) verified against
primary sources. The two structural caveats: nothing is permission-gated by default, and no
first-party graphical UI exists (TUI / RPC / SDK are the surfaces).

Method: 104-agent deep-research workflow (22 sources fetched, 110 claims extracted, 25
adversarially verified 3-vote each → 24 confirmed, 1 refuted) + direct seat verification of
`docs/extensions.md` (local 0.80.9 install and main branch), pi.dev, agent-pi, and npm engines.
Raw artifacts: `raw/deep-research-2026-09-01-output.json` (synthesized result),
`raw/deep-research-2026-09-01-journal.jsonl` (per-agent returns).

Everything below is a 2026-09-01 snapshot of a project releasing at very high cadence —
re-check version-specific details before acting on them later.

---

## 1. Canonical coordinates (the old ones are STALE)

- Repo: **`earendil-works/pi`** — moved 2026-05-07 from `badlogic/pi-mono` (old URL 301-redirects,
  same repo id 1035029907). Announcement: <https://pi.dev/news/2026/5/7/pi-has-a-new-home>
- npm: **`@earendil-works/pi-coding-agent`** (bin `pi`). The entire `@mariozechner/*` scope is
  deprecated and frozen at 0.73.1 (2026-05-07) with pointer messages.
- Docs: <https://pi.dev> / <https://pi.dev/docs/latest>. Official Discord: discord.com/invite/3cU7Bz4UPx
- Context: Zechner's 2026-04-08 "I've sold out" post — Earendil Works org stewardship.
  Licensing/roadmap implications unexamined; this is the long-term dependency watch item.
- Health (2026-09-01): ~100,445 stars, ~12,476 forks, pushed same day; latest **0.84.4**
  (2026-08-28); `legacy-node20` dist-tag maintained at 0.74.2. 0.84.4 requires **Node ≥22.19.0**.
- A refuted claim (0-3): "@earendil/pi" is NOT the scope — it is `@earendil-works`. Secondary
  coverage confuses this.

## 2. Family map

| Package (npm, @earendil-works/*) | What it is | Version @ 2026-09-01 |
|---|---|---|
| `pi-coding-agent` | The CLI/TUI agent, bin `pi` | 0.84.4 (2026-08-28) |
| `pi-agent-core` | Agent runtime: tool calling, state | 0.84.4 |
| `pi-ai` | Unified multi-provider LLM SDK (cross-provider context handoffs) | 0.84.4 |
| `pi-tui` | Terminal UI lib, differential rendering | 0.84.4 |
| `pi-telemetry` | Telemetry | co-released |
| `pi-web-ui` | Reusable web chat **component library** — NOT an app | 0.75.3 (2026-05-27, lags ~3 months) |

Slack/chat automation split to separate repo `earendil-works/pi-chat`.

## 3. Must-have analysis

### 3a. Hooks (extension events) — ALL FOUR classes covered

Pi ships **no built-in permission system** — launched "full YOLO mode" (Nov 2025); README
philosophy: "No permission popups. Run in a container, or build your own confirmation flow with
extensions." Extensions (TypeScript modules, landed ~2026-01-05 PR #454) are the hook mechanism.
Event list verified identical between installed 0.80.9 and main (0.84.4-era) `docs/extensions.md`:

1. **Pre-tool gating**: `tool_call` — fires after `tool_execution_start`, before execution.
   **Can block** via `{ block: true, reason?, terminate? }`; handler errors block the tool
   (**fail-safe**). Shipped examples: `permission-gate.ts`, `confirm-destructive.ts`,
   `protected-paths.ts`, `dirty-repo-guard.ts`, `timed-confirm.ts`, `sandbox/`.
2. **Post-edit triggers**: `tool_result` — fires after execution, **can modify result**
   (middleware-chained patches to content/details/isError/usage); `tool_execution_end` is the
   notification-only sibling. Example: `file-trigger.ts`.
3. **Session lifecycle**: `session_start` (reason: startup/reload/new/resume/fork),
   `session_shutdown`, `session_before_switch` (cancelable), `session_before_fork` (cancelable),
   `session_before_compact` (**can cancel or supply custom summary**), `session_compact`,
   `session_compact_failed`, `session_info_changed`; plus `before_agent_start` (can inject
   message / modify system prompt), `agent_start/end/settled`, `turn_start/end`,
   `message_*`, `model_select`, `project_trust`.
4. **Notifications/observability**: `ctx.ui.notify(message, level)`, `ctx.ui.setStatus`,
   `ctx.ui.setWidget`; `pi.events` pub/sub bus between extensions; custom entry/message
   renderers. No built-in desktop notifier or external sink — but extensions are full TS with
   system access, so osascript/toast/journald sinks are trivial. Examples: `notify.ts`,
   `event-bus.ts`, `status-line.ts`.

Also notable: `context` event (modify messages before each LLM call, non-destructively),
`before_provider_headers` / `before_provider_request` / `after_provider_response` (raw HTTP
interception), `user_bash` (can intercept `!` commands), `input` (raw input transform),
`pi.registerTool/Command/Shortcut/Flag`, `ctx.ui.custom()` full TUI components.

**Gate caveat (design-relevant)**: gating exists only if a gate extension is loaded. An
extension gate is only as un-bypassable as its load path (`~/.pi/agent/extensions/` user-global,
`.pi/extensions` project-local — the latter only after `project_trust` resolves, which is good
design). For unattended use, container/OS-sandbox remains the enforcement layer — same posture
as nana-agent-loop's gate invariant.

### 3b. Context management — SATISFIED natively

Auto-compaction **enabled by default**: reactive (context overflow → recover and retry mid-run)
AND proactive (`contextTokens > contextWindow − reserveTokens`, default reserve 16384). Manual
`/compact [instructions]`. Extension-customizable via `session_before_compact` (cancel or custom
summary; `custom-compaction.ts` example). Only edge bugs found in issue sweep were
provider-specific and closed. Settings: `compaction.enabled` in `~/.pi/agent/settings.json`.

### 3c. Session management — SATISFIED natively

Sessions auto-save as **JSONL tree files** (id/parentId entries) under `~/.pi/agent/sessions/`,
organized by cwd. `pi -c` (continue most recent), `pi -r` / `/resume` (browse/select/delete),
`/fork`, `--fork <path|id>`, `/clone`, `--session`, `--no-session`, `--session-dir`, HTML
export, in-place branch navigation via `/tree`. Docs: `sessions.md`, `session-format.md`.

## 4. Cross-platform

- **macOS**: primary, no caveats.
- **Native win32**: real support, not a WSL punt — dedicated `docs/windows.md` (Git Bash
  discovery at `C:\Program Files\Git\bin\bash.exe` for the bash tool; optional built-in
  PowerShell tool via `pwsh.exe -NoProfile -NonInteractive`; Windows `shellPath` config; WSL
  only a PATH fallback). Live native-win32 user report #2839 (Windows Terminal, 2026); minor
  open paste bug there. Needs Node ≥22.19 (or `legacy-node20` tag at 0.74.2) + Git for Windows.
- **UI on Windows**: moot — no GUI app exists on any platform (see §6).

## 5. Providers

- **Subscription logins**: Anthropic Claude Pro/Max, **OpenAI ChatGPT Plus/Pro (Codex, OAuth)**,
  GitHub Copilot. Tokens in `~/.pi/agent/auth.json`.
- **API-key providers**: ~30 (Anthropic, OpenAI, Azure, Gemini, Vertex, Bedrock, DeepSeek,
  Mistral, Groq, Cerebras, xAI, OpenRouter, Fireworks, Together, …).
- **Local models**: llama.cpp router is **first-class** (`/login llama.cpp`, `/llama` model
  management, `docs/llama-cpp.md`). Ollama / LM Studio / vLLM via `~/.pi/agent/models.json`
  custom providers speaking a supported API — `docs/providers.md` has an explicit Ollama example
  (`localhost:11434/v1`, api `openai-completions`) with Ollama/vLLM compat flags. Third-party
  `pi-ollama-provider` exists; official local-provider extensions are a live request (#4155).
- **Switching ergonomics**: `pi-ai` cross-provider context handoffs are designed-in
  (mid-session model/provider switching), `/model`, Ctrl+P model cycling.

## 6. UI surfaces ("Pi Agent UI")

**No first-party graphical app exists.** pi.dev lists exactly four surfaces: interactive TUI,
print/JSON mode, **RPC mode** (`pi --mode rpc`, strict-JSONL protocol over stdin/stdout,
designed for embedding in IDEs/custom UIs; note: Node `readline` is not protocol-compliant —
U+2028/U+2029), and the **SDK** (`AgentSession` via `createAgentSession`; documented use case
"Build a custom UI (web, desktop, mobile)"; `examples/sdk/`). `pi-web-ui` is a lagging component
library, not an app. agent-pi ships browser-based approval/report viewers as a partial pattern.

Adoption posture: TUI-first (extensions can build substantial UI in-terminal: widgets, status
lines, overlays, custom components); build an RPC/SDK-based GUI only if the TUI proves
insufficient after real use.

## 7. Community ecosystem

Substrate verified, census thin — no mature awesome-list survived verification.

- **Distribution**: "pi packages" bundle exactly four resource types — extensions, skills,
  prompt templates, themes — via `pi install npm:@foo/bar@1.0.0` / `git:github.com/user/repo@v1`
  / local paths, with gallery preview metadata (`docs/packages.md`). **Security: packages run
  with full system access** → review-before-install; astroturf-source heuristics apply.
- **First-party `examples/` is the real standard library** (80+): `plan-mode/`, `subagent/`
  (the two Claude Code features pi omits, reimplemented), `permission-gate.ts`, `sandbox/`,
  `custom-provider-anthropic/`, `git-checkpoint.ts`, `handoff.ts`, `auto-commit-on-exit.ts`,
  `claude-rules.ts`, `structured-output.ts`, `interactive-shell.ts`, `todo.ts`, …
- **ruizrica/agent-pi** — largest community suite: 43 extensions, 11 themes (Catppuccin,
  Dracula, Nord, Tokyo Night…), 20+ skills, 6 modes (NORMAL/PLAN/SPEC/PIPELINE/TEAM/CHAIN),
  security layer, browser approval viewers. 267 stars, single maintainer, no visible tests/CI,
  README still targets old scope. Verdict: mine for patterns + themes; do NOT adopt the
  extension layer wholesale.
- Smaller: `Dwsy/pi-session-manager`, `s1lver091/pi-agent-config`, `pi-ollama-provider`.
- **MCP**: excluded from core by explicit design (context-cost: MCP tool descriptions burn
  7-9% of window; "pi does not and will not support MCP" for core). Extension path deliberately
  open — README "What's possible" lists MCP server integration; badlogic's own issue #563
  proposes an MCP extension example. Read: no ambient MCP tax, opt-in when needed.

## 8. Philosophy / Claude Code comparison

"Pi ships with powerful defaults but skips features like sub agents and plan mode" — explicit
bullets: No sub-agents, No plan mode, No permission popups; "aggressively extensible so it
doesn't have to dictate your workflow." Sub-1000-token system prompt, four built-in tools.
Everything Claude Code bundles (permission prompts, sub-agents, plan mode, ambient MCP, hooks
config) is bring-your-own via extensions — which cuts both ways: more build, full control,
deterministic gates at boundaries fit naturally.

## 9. Recommendations (ratified by Jake 2026-09-01, execution in this repo)

1. **Upgrade** to 0.84.4 (`npm i -g --ignore-scripts @earendil-works/pi-coding-agent`);
   Node ≥22.19 + Git for Windows on the Windows box. (Mac had 0.80.9, Node 22.22.2 ✓.)
2. **nana extension pack** (this repo, `packages/`): the four hook classes — gate
   (`tool_call`), post-edit triggers (`tool_result`), lifecycle/status, notification sink —
   distributed via `pi install git:`. Start from first-party examples.
3. **Local models**: `models.json` custom-provider entries for Ollama/LM Studio now; llama.cpp
   router when wanted.
4. **Defer GUI** until TUI + pack proves insufficient; RPC mode is the attachment point.

## 10. Open questions carried forward

- Earendil Works governance/licensing direction post-acquisition (long-term platform risk).
- Community census maturity — does an awesome-pi / registry emerge? (Discord is where it lives.)
- pi-web-ui: does it get promoted to an app or stay a lagging component lib?
- Win32 paste bug (#2839) and the rising Node floor on Windows.

## Addendum 2026-09-03 — verified drift since the snapshot

- **§7 MCP/census is superseded.** The MCP-extension ecosystem materialized within days:
  `pi-mcp-adapter` (nicobailon, 1.4k★, ~761k npm dl/mo, single ~200-token proxy tool +
  lazy connects — honors the §7 context-cost rationale) is the community standard and is
  ADOPTED here (verified live against a real stdio server). `pi-subagents` (same author)
  fills the §8 sub-agents omission; also adopted. A community census now exists
  (awesome-pi.site; pi.dev/packages gallery) — the §10 "does an awesome-list emerge"
  question is answered yes.
- **Hook-class overlap rule checked for the new installs**: neither package registers
  `tool_call` — nana-gate remains the only gate; both use `tool_result`, which is
  middleware-chained by design and coexists with nana-post-edit.
- **Version**: 0.84.4 still npm latest as of 2026-09-03 — no upstream drift yet.
- **New §6-relevant signal**: upstream discussion #4444 (Agent Client Protocol support)
  — a potential future standard surface for editor/GUI attachment; watch item.
- Still open: #2839 paste-bug status, Windows-box Node ≥22.19 verification, §9-R3 local
  models (untouched).

- https://github.com/earendil-works/pi (README, docs/extensions.md, compaction.md, sessions.md,
  providers.md, models.md, windows.md, packages.md, rpc.md, sdk.md, examples/)
- https://pi.dev · https://pi.dev/news/2026/5/7/pi-has-a-new-home · https://pi.dev/docs/latest
- https://mariozechner.at/posts/2025-11-30-pi-coding-agent/ ·
  https://mariozechner.at/posts/2026-04-08-ive-sold-out/
- npm registry: @earendil-works/* and deprecated @mariozechner/* manifests, dist-tags, engines
- Issues/discussions: #2839 (win32), #4155 (local providers), #563 (MCP extension), #3280, #3373
- Community: github.com/ruizrica/agent-pi · github.com/Dwsy/pi-session-manager ·
  github.com/disler/pi-vs-claude-code (secondary) · deepwiki.com pi-mono hooks page (secondary)
- Local ground truth: installed 0.80.9 package docs + examples at
  `~/.local/lib/node_modules/@earendil-works/pi-coding-agent/`
