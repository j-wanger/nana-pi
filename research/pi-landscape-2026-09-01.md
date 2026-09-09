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

## Addendum 2026-09-04 — pi-subagents 0.64.0 upstream findings (desk dogfood r2)

- **Stuck async widget (bug, reproduced live).** `src/runs/background/async-job-tracker.ts`
  line ~97: the cleanup predicate `terminalStatus()` covers `complete|failed|paused|stopped`
  but NOT `partial` or `rejected`. A run that ends `partial` (e.g. step failed on a provider
  usage limit after producing output) never gets `scheduleCleanup`, never leaves
  `state.asyncJobs`, and the async widget is never republished — the finished run is pinned
  in TUI and RPC clients until the pi process restarts. Other modules disagree on the
  terminal set (`async-retention.ts` TERMINAL_STATES = complete/failed/stopped/rejected —
  also no `partial`). Desk defends itself since r2 (render-time linger + prune); worth an
  upstream issue/PR.
- **RPC async snapshot omits model/tokens (parity gap).** The `PI_SUBAGENT_ASYNC_JSON`
  snapshot (`src/runs/shared/async-status-projection.ts`, `AsyncStatusSnapshotNodeV1` /
  `ActivityV1`) carries state/turnCount/toolCount/currentTool only. The TUI widget renders
  model badges + token counts from full in-process `AsyncJobState` (`totalTokens`,
  `steps[].model`), so RPC clients (the desk) cannot reach TUI parity here — the data
  exists in the run dir's `status.json` but is not published. Upstream ask: add
  `model`/`tokens` to the snapshot node (fits the 32KB cap easily).


---

## Addendum 2026-09-09 — the pi lineup beyond pi-coding-agent

# Should nana-pi use more of the pi lineup? (2026-09-09)

Sources: installed pi 0.84.4, npm registry, `github.com/earendil-works/pi`. Claims are
**[V]erified** with a path/URL or marked **[I]nferred**. Dated addendum to
`research/pi-landscape-2026-09-01.md` §2 — that family map is **stale**: it lists six packages;
the monorepo ships eleven, and `pi-web-ui` has left it.

## 1. Inventory

`packages/` dirs [V] `api.github.com/repos/earendil-works/pi/contents/packages`. npm latest for
the line is **0.85.1 (2026-09-05)** [V] dist-tags — we run 0.84.4. "In our tree" = present under
the installed pi's `node_modules/@earendil-works/` [V].

| Package (npm `@earendil-works/*`) | What it is | npm latest | In our tree? | Signal |
|---|---|---|---|---|
| `pi-coding-agent` | CLI/TUI agent, bin `pi`; also the SDK + `./client` entry | 0.85.1 | yes (root, 0.84.4) | active, weekly |
| `pi-agent-core` | Agent runtime, tools, session state | 0.85.1 | yes, transitive | active |
| `pi-ai` | Multi-provider LLM SDK, unified `Usage` + `calculateCost` | 0.85.1 | yes, transitive | active |
| `pi-tui` | Terminal UI, differential rendering | 0.85.1 | yes, transitive | active |
| `pi-telemetry` | Vendor-neutral telemetry contracts | 0.85.1 | yes, transitive | active |
| `pi-protocol` | CBOR wire protocol for remote sessions | 0.85.1 | yes, transitive | new (0.84.0+), experimental |
| `pi-client` | Transport-neutral client for remote sessions (unix socket) | 0.85.1 | yes, transitive | new, experimental |
| `pi-server` | Local server hosting durable sessions + multi-attach | 0.85.1 | **no** | new, self-described "experimental" |
| `chord` | App-composition runtime (services, replicated state, RPC, plugins) | 0.85.1 | **no** | substrate under server/client |
| `pi-session-backend-sqlite-node` | SQLite session backend for pi-agent-core | 0.85.1 | **no** | new |
| `pi-evals` | Internal eval harness | unpublished (`private: true`) | no | internal |
| `pi-web-ui` | Web chat *component library* | 0.75.3 (2026-05) | no | **orphaned**: `packages/web-ui` 404s on main |

## 2. What nana-pi hand-rolls that pi ships

**(a) Session JSONL parsing — real overlap, public API.** `apps/desk/server.mjs:551`
`readSessionMeta` (65 KB head + 32 KB tail heuristic), `:598` `listSessions`, `:638`
`parseTranscript` (per-line `JSON.parse`, hand-rolled `parentId` walk with a cycle guard). pi
exports `parseSessionEntries`, `migrateSessionEntries`, `CURRENT_SESSION_VERSION`,
`SessionManager`, `SessionEntry`, `SessionTreeNode` from the **root public export** [V]
`dist/index.d.ts`. Buys: entry-format migration we do not do today — the desk ignores
`CURRENT_SESSION_VERSION`, so a format bump silently mis-renders old files [I: drift class, not
an observed bug]. Costs: importing it pulls `@anthropic-ai/sdk`, `@aws-sdk/client-bedrock-runtime`
and `@google/genai` via pi-ai [V] pi-ai `package.json`, and the desk is documented
zero-dependency (`apps/desk/README.md:3`).

**(b) RPC child driving — overlap, but pi's class does not fit.** `server.mjs:162` `spawnChild`,
`:264` strict-LF JSONL framing, `:456` `sendRpc` pending/timeout map ≈ pi's exported `RpcClient`.
Two verified blockers: no `extension_ui_response` path (`grep extension_ui`
`dist/modes/rpc/rpc-client.js` → 0 hits), so a nana-gate escalation would hang; and it spawns
`node <cliPath ?? "dist/cli.js">` (`rpc-client.js:31,42`) with no global-bin resolution. Also
absent from `docs/rpc.md` [V grep] — exported but undocumented. **Do not adopt the class.** Its
*types* (`RpcCommand`, `RpcResponse`, `RpcExtensionUIRequest/Response`, `JsonAgentSessionEvent`)
are public and would pin the desk's hardcoded allowlist (`server.mjs:115`) to upstream — but the
desk is plain `.mjs`, so that needs JSDoc + `checkJs`.

**(c) Usage/cost math — best value-per-line.** `apps/bench/lib/usage.mjs:28-35,171` sums four
buckets by hand and never reports cost. pi-ai's `Usage` already carries a computed `cost` object
[V] `pi-ai/dist/types.d.ts:265-286` plus `calculateCost(model, usage)` [V]
`pi-ai/dist/models.d.ts:192`; pi-coding-agent exports `calculateContextTokens`,
`getLastAssistantUsage`, `estimateTokens` [V] `compaction.d.ts:38,42,62`. `usage.mjs:9` already
cites pi-ai *internal dist line numbers* as its spec — the coupling exists, as a comment rather
than an import.

**(d) No overlap.** `desk-client.mjs:77` `renderDiff` and `public/md.js` are DOM-targeted; pi's
`generateDiffString` and pi-tui are terminal-targeted. `nana-stage/lib/blocks.mjs:283,302`
resembles `pi-coding-agent/client`'s transcript reducers, but those consume pi-protocol
`TranscriptItem`/`SessionSnapshot` from the CBOR service, not session JSONL — not a drop-in
[V] `dist/client/transcript.d.ts`.

## 3. New capabilities worth considering

**`pi-server` + `pi-client` + `pi-protocol` (+`chord`).** A durable session service over a unix
socket with multi-presentation attach: one long-lived session, many clients, reconnect without
losing state. That attacks three of the desk's own "known limits" — max 4 children, "a restart
redacts old stage blocks", "the running desk is whatever was on disk when it started". Shape: a
host process owns sessions; the desk becomes a `PiClient` browser bridge, not a subprocess parent.
Caveats, all verified: the README says "experimental Pi service protocol"; 0.84.3 already shipped
a breaking change to `RemoteSession.sessions` [V] CHANGELOG; and there is **no `pi serve` CLI** in
the 0.84.4 bundle [V grep `PiServer|listen(`] — you host it yourself.

**`pi-session-backend-sqlite-node`.** Sessions in SQLite instead of a JSONL tree. Turns the
desk's directory scan + byte-window heuristic into a query, and is the natural store for
nana-agent-loop's journal and an AML case ledger.

**`pi-ai` standalone.** For AML-agent grading and bench graders that need an LLM but not an agent
loop: one provider-neutral client with cost accounting, no pi process. Cheapest new adoption.

**Low value:** `pi-tui` (the desk covers status surfaces); `chord` (take transitively via
pi-server, never directly). **Not packages but relevant** [V org listing]: `gondolin` (2118★) is
the microvm sandbox the landscape doc §3a says unattended enforcement needs.

## 4. Three candidates

**(a) Stay as-is.** Only `pi-coding-agent`, spawned as a binary; desk stays zero-dep. Gains: no
version coupling to a project shipping weekly. Costs: we keep re-deriving session parsing and
usage math; the session-format drift class stays open. Blast radius: none.

**(b) Adopt pi's *data* surfaces, keep spawning the binary.** `Usage`/`calculateCost` in bench,
`parseSessionEntries`/`migrateSessionEntries` in the desk's read path; keep our own child driver.
Gains: real per-run cost, migration for free, ~150 lines deleted. Costs: the desk's zero-dep
claim ends; pi-ai drags three vendor SDKs. Blast radius: desk read path + bench metrics — non-gate
and reversible. First slice: bench only (`apps/bench/lib/usage.mjs`), where no zero-dep promise
is at stake.

**(c) (b) + `pi-server`/`pi-client`.** Re-found the desk on the durable session service.
Gains: multi-attach, survives restarts, stage-key limitation gone. Costs: an experimental protocol
that has already broken once, plus hosting a server pi ships no CLI for. Blast radius: the whole
desk lifecycle. First slice: a throwaway spike proving a `pi-server` host + `RemoteSession`
round-trip with nana-gate loaded.

**Pick: (b), starting with bench.** It removes duplicated math and buys cost data we don't have,
at a cost that is one `npm i` and fully reversible — while (c) bets the desk's lifecycle on a
protocol upstream itself labels experimental.

---

**Paste summary**

1. The lineup is 11 packages, not the 6 our landscape doc records; `pi-server`, `pi-client`, `pi-protocol`, `chord` and a SQLite session backend are new and published (0.85.1; we run 0.84.4).
2. We already ship 5 transitively; `pi-web-ui` is dead (frozen 0.75.3, gone from the monorepo) — there is no first-party web toolkit to adopt.
3. Real duplication is narrow: session-JSONL parsing (`server.mjs:551/598/638`) and token math (`bench/lib/usage.mjs`) — pi exports both publicly, `cost` included.
4. Pi's `RpcClient` cannot replace the desk's child driver: no `extension_ui_response` handler (nana-gate escalations would hang), no global-bin resolution.
5. Recommendation (b): adopt pi's data types in bench first, then the desk's read path; leave the experimental `pi-server` stack a spike, not a commitment.
