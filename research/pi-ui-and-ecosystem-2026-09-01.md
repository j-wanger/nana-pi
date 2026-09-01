# Pi UI options & community ecosystem census (2026-09-01)

Second research pass, building on `pi-landscape-2026-09-01.md` (read that first — this doc
does not restate the platform verdict). Method: 105-agent deep-research workflow with ALL
subagents pinned to **Opus 4.8** (23 sources, 112 claims, 25 verified 3-vote → 23 confirmed,
2 refuted), plus a seat-direct census pass (pi.dev/packages gallery, awesome-pi, npm registry
keyword query) that closed the gap the workflow left uncovered. Raw artifacts:
`raw/deep-research-2026-09-01-ui-output.json` + `-ui-journal.jsonl`.

Snapshot warning applies: high-cadence ecosystem, versions/dates drift fast.

---

## 1. Attachment surfaces (the ground truth for any UI decision)

- **SDK is the docs-preferred path for JS/TS**: `AgentSession` via
  `createAgentSession()` — rpc.md itself steers Node builders away from subprocess-RPC to the
  SDK. "Build a custom UI (web, desktop, mobile)" is a documented use case. (3-0)
- **RPC mode is live and maintained**, for other-language/IDE embedders: v0.82.0 added
  streaming `bash_execution_update` for direct RPC, v0.84.4 added `clear_queue`; a shipped
  `RpcClient` exists. Strict-JSONL framing constraint: LF-only delimiters, Node `readline`
  is non-compliant (U+2028/U+2029). (3-0)
- **First-party investment goes to the TUI, not a GUI**: v0.84.0 (2026-08-06) shipped
  Fullscreen TUI mode (sticky editor, scrollable transcript, Mermaid/LaTeX rendering),
  v0.84.2 transcript search, v0.84.4 selection copy. No GUI/web-app in the v0.81–v0.84.4
  window. First-party `@earendil-works/pi-web-ui` remains a component library frozen at
  0.75.3 (mid-May 2026) — NOT caught up, NOT promoted to an app. (3-0)
- Whether earendil-works has a GUI roadmap is **genuinely open** — the "no roadmap mention"
  claim was refuted 1-2, so absence is unproven either way.

## 2. Ranked UI shortlist

| # | Project | What | Attaches via | Scope | Windows | Verdict |
|---|---|---|---|---|---|---|
| 1 | **BlackBeltTechnology/pi-agent-dashboard** | Electron + web multi-session controller: spawn/watch/kill parallel pi sessions, live reasoning, mobile-remote via mDNS/zrok. 267★, near-monthly cadence, real-org maintained, v0.8.0 2026-08-26 | Bespoke in-pi Bridge Extension + dual WebSocket gateways (:9999 pi / :8000 browser) | STALE @mariozechner | **YES — native x64+ARM64 installers (only proven-Windows option); unsigned → SmartScreen** | **Pilot** |
| 2 | **preinpost/pi-web-chat** | OpenWebUI-style mobile-friendly web UI, installed AS a pi package (`pi install npm:pi-web-chat` → `/web` or `pi --web`, localhost:3141) | SDK + WebSocket server | CURRENT | unverified (Node server) | Study-then-build |
| 3 | **xing-shuyin/pi-web-ui** (unscoped npm `pi-web-ui` — distinct from first-party!) | Full deployable web-chat app: terminal, git, file mgmt; Docker/systemd/launchd; pins ^0.84.4 | SDK in server process + ws | CURRENT | unverified — its native-Windows claim was REFUTED 1-2 | Study-then-build |
| 4 | **samfoy/pi-dashboard** | Web + genuine native iOS (SwiftUI) dashboard; one `pi --mode rpc` process per chat slot; reads session JSONL for history | RPC mode | stale README | unverified | Study-then-build |
| 5 | **svkozak/pi-acp** (~656★) | ACP adapter → embeds pi in **Zed** (JSON-RPC 2.0 over stdio bridging `pi --mode rpc`); other ACP clients untested. Siblings: aksdb/pi-acp-bridge, 0xSero/pi-acp; official discussion #4444 | RPC → ACP | current | n/a (follows Zed) | IDE lane, Zed-only today |
| 6 | Zetaphor/pi-vscode-extension | VS Code, embeds SDK as bundled dep | SDK | **pinned ^0.70.2 pre-migration** | — | **Avoid** (stale); other VS Code attempts exist (pithings/pi-vscode, johnny-zhao.pi-agent-studio) |

**Synthesis judgment (workflow's own + seat's, aligned)**: every third-party UI is
single-maintainer/alpha or stale-scoped. For anything load-bearing, **building our own on the
SDK beats adopting** — study #2/#3 for the SDK+ws attachment pattern, #1 for the
multi-session-ops UX. Also on the radar from awesome-pi: `@jmfederico/pi-web` (browser
supervision in real workspaces), `pi-studio` (dual-pane + live markdown preview).

## 3. Tools/plugins census (seat-direct, primary sources)

Scale: **5,523 packages in the pi.dev/packages gallery** (sorted by downloads);
**8,868 npm packages** carry the `pi-package` keyword. **BubblePtr/awesome-pi** (104★, updated
Aug 2026, CC0) is the curated map; entries predominantly current-scope. An enhanced fork
exists: **oh-my-pi** (40+ providers, 32 built-in tools, Python runtime).

Top popularity + actively published (npm, publish dates Aug 28–Sep 1 2026 = live):

- **pi-subagents** (0.62.0, ~2.5k dl/mo) — delegation + scripted multi-agent workflows; the
  de-facto sub-agent standard. Alternatives: `@tintinweb/pi-subagents` (Claude Code-style
  parallel), `@quintinshaw/pi-dynamic-workflows` (fan-out to 100s with routing).
- **pi-mcp-adapter** (2.31.0, ~1.4k dl/mo) — THE MCP bridge (#563 lineage); awesome-pi bills
  it as a ~200-token tool proxy, i.e. it dodges the context tax that made core say no.
- **pi-web-access** (0.27.0) — web search/fetch/GitHub-clone/PDF/YouTube; 🔥 in awesome-pi.
- **pi-lens** (4.1.3) — real-time LSP/linters/formatters/type-checking feedback.
- **@gotgenes/pi-permission-system** (29.1.0) — permission enforcement.
- **@narumitw/pi-plan-mode** (0.56.0) — Codex-like read-only `/plan` mode; same author ships
  pi-statusline, pi-goal, pi-usage.
- **pi-background-tasks** (2.4.2) — durable background shells + read-only delegated agents.
- **bigpowers** (2.88.0) — 73-skill engineering-discipline collection.
- Memory lane: pi-memory (qmd semantic search), pi-hermes-memory, @remnic/plugin-pi,
  @amaster.ai/pi-memory-mem0. Context: context-mode (aggressive context-window saving).
- Sandboxing/safety: cc-safety-net (destructive-command blocker), @trim21 bwrap sandbox.
- Curiosities: `pi-code` ("Anthropic's Claude Code integration", brand-new in gallery),
  `pi-claude-agent-sdk`, @plannotator (interactive plan review), pi-simplify (code review),
  @juicesharp/rpiv-todo + rpiv-ask-user-question (live overlay todo / structured questions).
- Themes: Tokyo Night/Catppuccin/Rose Pine/Synthwave, 65-theme iTerm2-adapted mega-packs,
  OS-appearance auto-sync tools.

### Adopt-now vs study-for-patterns (seat judgment)

**Adopt-now candidates (after per-package source review — full system access, always):**
pi-web-access · pi-subagents · pi-lens · @narumitw/pi-plan-mode · pi-background-tasks ·
pi-mcp-adapter (only when a concrete MCP need appears) · a theme pack.

**Study-for-patterns:** @gotgenes/pi-permission-system vs our nana-gate (theirs is at 29.x
with real cadence; ours is 40 auditable lines — compare before growing ours) · pi-lens vs
nana-post-edit (same overlap question) · memory extensions (vs our memory_server) ·
ruizrica/agent-pi (modes + browser approval viewers) · oh-my-pi (what a maximalist fork
considers table stakes) · samfoy/pi-dashboard's session-JSONL reading for desk-style feeds.

**Overlap note for our nana-pack:** community equivalents exist for gate (permission-system,
cc-safety-net) and post-edit (pi-lens). Keeping ours is justified by auditability + fail-closed
headless semantics tuned to our loop posture; adopting theirs is justified by maintenance
cadence. Decide per-piece after reading their source — do not run both simultaneously for the
same hook class (double-gating/noise).

## 4. Refuted / caveats worth remembering

- xing-shuyin/pi-web-ui "native Windows support (Git Bash terminal + Scheduled Task)" —
  REFUTED 1-2. Treat every Node-server web UI as POSIX-assumed until proven.
- "Release notes show no first-party GUI trajectory" — REFUTED 1-2 (roadmap question open).
- pi-agent-dashboard "never reads JSONL" mechanism detail was 2-1 (it loads historical
  sessions from disk via SDK); its RpcClient issue #8965 is closed-as-not-planned.
- pi-chat's offering beyond Slack: unexamined (open).
- No CI/security review was performed on ANY candidate — install nothing without reading it.

## 5. Open questions carried forward

1. Do the current-scope web UIs (pi-web-chat, xing-shuyin/pi-web-ui) run on native Windows?
   (One evening's test each on the Windows box settles it.)
2. earendil-works first-party GUI roadmap — watch releases/discussions.
3. pi.dev/packages download-rank deep-dive beyond page one; per-package security review for
   anything we shortlist.
4. Is pi-agent-dashboard migrating to @earendil-works scope? (Issue tracker watch.)
