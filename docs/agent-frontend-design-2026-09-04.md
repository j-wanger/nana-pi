# UI-centric agent frontend — design

*2026-09-04. Status: v6 — pi (gpt-5.6-sol) VERDICT LAND on round 6 (rounds 1-5 REWORK; corpus in `docs/reviews/agent-frontend-2026-09-04/`). Awaiting Jake's ruling before slice 1. Sibling of the chat-centric desk (`apps/desk`); does not replace it. Review rounds and adjudications are in §9.*

## 1. Decision

Build a second frontend shape where the screen belongs to the application (a dashboard, a case file, a league board) and chat is the primary way to drive it. One transferable kit serves three products: fantasy basketball, the AML investigator, family-planner.

The kit is a **contract plus two thin runtimes**, not a dashboard component library:

1. **The block contract** — a JSON schema for a small set of presentation blocks, with a validator in JS and Python. App tools produce blocks; the model never authors block data.
2. **`nana-stage`, a pi extension** — records every block a tool returns into the session as a durable ledger entry, validating it at that boundary.
3. **The stage host, a browser module** — a chat drawer, a stage area, and a non-foldable gate bar, served from its own listener on the desk server through a client library extracted from the desk. The same renderer produces a static HTML page from the ledger for turns nobody watched.

Everything else (layouts, app-owned views, domain queries) stays app-owned and hand-built.

## 2. The reframe that shapes the design

Every target screen holds two kinds of content with different plumbing:

| Kind | Examples | Who paints it | How the agent affects it |
|---|---|---|---|
| **Durable state the app owns** | fridge stock, chores, case record, league roster | the app, from its store | mutates data through the app's tools; the view re-renders from the store |
| **Analysis the agent produces** | strength analysis, trade insight, entity network for this case, "what expires and what to cook" | the stage, from blocks | calls a query tool; the tool returns a block; the block lands on stage |

The agent never paints durable state. The layout is fixed and app-owned. The agent has exactly one kind of action: **call a tool**. Some tools mutate (the app refreshes), some tools answer with a block (the stage shows it). There is no "draw this" tool.

**One input channel, three ways to author a turn.** Chat is primary (Jake, 2026-09-04). A turn is authored by typing, by clicking (the UI composes the prompt: click an entity → "explore counterparties of X"), or by schedule/event (morning briefing, new league data). Direct manipulation survives only where a click is a complete write (check off a chore). Scheduled turns run with no browser open, so the stage renders from the ledger to a static page as well as live.

## 3. Architecture

```
┌─ app page, served from THIS APP'S LISTENER (127.0.0.1:<port>) ─────────┐
│  GATE BAR (non-foldable; pending + missed dialogs; always on top)       │
│  app-owned views (durable)              stage (blocks)      ┌────────┐ │
│  ┌──────────┐ ┌──────────┐            ┌──────────────┐      │ agent  │ │
│  │ roster   │ │ schedule │  ...       │ card   table │      │ drawer │ │
│  │ [agent✎] │ │          │            │ table        │      │ (chat) │ │
│  └──────────┘ └──────────┘            └──────────────┘      └────────┘ │
│        ▲ refresh                              ▲ ledger             ▲   │
└────────┼──────────────────────────────────────┼────────────────────┼───┘
         │  app API / store              desk-client.mjs (extracted from app.js)
         │                     ┌──────────────────┴────────────────────┴──┐
         │                     │ desk server process                       │
         │                     │  desk listener :7317  (+ Origin rule)      │
         │                     │  app listener  :<port> per manifest        │
         │                     │   one child; no spawn/live/bash/rpc       │
         │                     └──────────────────┬───────────────────────┘
         │                                        │ pi --mode rpc -t <manifest tools> -a|-na
         │                     ┌──────────────────┴───────────────────────┐
         │                     │ pi session                                │
         └── mutating tools ───│  app tools (pi extension, or MCP via      │
                               │   pi-mcp-adapter)                         │
                               │  nana-stage: tool_result → validate →     │
                               │   appendEntry("nana-block")               │
                               └──────────────────────────────────────────┘
```

### 3.1 The block contract (kit; JS + Python validators)

Two blocks in v0: `table` and `card`. Four more (`kpi`, `chart`, `timeline`, `graph`) are reserved names, added only when a slice needs them.

```json
{
  "id": "blk_…",                 // stable per (tool, key); a later block with the same id replaces it
  "type": "table" | "card",
  "title": "…",
  "scope": "2025-26 regular season, per-game, through 2026-04-10; source: basketball.sqlite",
  "evidence": [{ "label": "…", "ref": "…" }],
  "actions": [{ "label": "Evaluate trade", "prompt": "…", "mutates": false }],
  "slot": "main" | "side" | "modal",
  "show": true,
  "note": "optional one-line, code-authored, rendered on stage and in the text",
  "produced_by": { "tool": "player_card", "args": { "name": "…" }, "toolCallId": "…", "at": "…" }
}
```

`table`: `columns: [{key, label, type: "text"|"number"|"date"}]`, `rows: [{…}]`. `card`: `subtitle?`, `fields: [{label, value, evidence?}]`, `badges?`. `scope` is required: one human sentence saying what data, what period, how fresh, from where.

**Who authors what (the provenance contract):**

| Field | Author | Why |
|---|---|---|
| everything except `produced_by` | **app tool code** | data, labels, rows, scope, evidence, actions are deterministic products of a query; the model cannot retype, relabel, omit rows, or invent derived values because it never touches the block |
| `produced_by` | `nana-stage` | stamped from the tool event (`toolName`, `input`, `toolCallId`); any value supplied by the tool is overwritten |
| the assistant's chat text | **model** | the narrative. It lives in the drawer under a fixed label, "agent's reading", never inside a block and never on the stage |
| which tool to call, with which arguments, and which not to call | **model** | the decision. This is the residual way the model can mislead: a selectively scoped query, or a query it didn't run. The block shows the tool, its arguments, and the code-authored scope; the drawer shows every tool call in the turn. That is the disclosure the design offers; it does not claim to prevent a bad decision, only to make it visible |

There is no `present` tool and no model-authored projection. A tool that returns a block is asking to show it (`show: false` for tools the agent uses to think; hidden blocks still enter the ledger).

Blocks travel in the tool result: for pi-extension tools in `details.blocks`; for MCP tools in the tool's `structuredContent.blocks`, which `pi-mcp-adapter` exposes under `details.mcpResult` when its setting `directToolResultDetails` is `"bounded"`. The adapter caps that raw result (16 KiB default, `outputGuard.detailsMaxBytes`); over the cap it substitutes an omission summary rather than the blocks. `nana-stage` treats a `mcpResult` that is a summary (no `structuredContent.blocks` where the tool's text content announces blocks, or an `omitted` marker) as an error result: "block too large for the adapter cap; paginate or raise `detailsMaxBytes`". Slice 2 pins the exact path, the cap setting, and the overflow test; slice 1 uses extension tools only.

**Text and stage cannot diverge, by construction:** after validation, `nana-stage` *replaces* the tool result's text `content` with the canonical text rendering of the validated blocks (table → aligned rows, card → label/value lines, plus each block's `scope` and optional `note`) and nothing else. A tool that wants to say something beyond the data puts it in the block's code-authored `note` field, which the stage renders too. Any other text the tool returned is dropped. The model reads exactly what the stage renders; no correspondence check is needed. Tools that return no blocks are untouched.

### 3.2 `nana-stage` (kit; pi extension)

- Hooks `tool_result` for every tool (MCP-bridged tools are registered through `pi.registerTool` by the adapter, so the hook sees them). Looks for blocks at the two paths above. If present: validate each against the schema. On failure, return `{isError: true, content: [{type: "text", text: "<one-line reason>"}], details: <original details with the block carrier removed>}` (`content` patches are arrays of content parts); `tool_result` patches replace fields, so the carrier must be stripped explicitly or the invalid blocks would ride the subsequent `tool_execution_end` into the live stage. On success, stamp `produced_by`, `pi.appendEntry("nana-block", block)` per block, and return `details` with the carrier replaced by the stamped, validated blocks. The live reducer reads `event.result.details.blocks` on `tool_execution_end` and consumes only blocks carrying a `produced_by` stamp; anything else in a tool event is ignored.
- **Ordering:** `tool_result` handlers chain in extension load order. `nana-stage` must be the last block-relevant mutator: the manifest lists it as the final extension, and it re-validates on `tool_execution_end`'s own view (the reducer's stamp check) so a later handler that re-injects a carrier cannot reach the stage.
- **Size bound for extension blocks:** the validator rejects a block whose JSON exceeds 64 KiB or whose `table.rows` exceed 500; tools paginate. This mirrors the adapter's cap on the MCP path so both paths fail the same way.
- Ledger semantics: custom entries do not enter LLM context, survive compaction, and are readable via `get_entries` (with a `since` cursor) from any client and from the session file. The **ledger is the stage**; the browser is a view of it.
- Registers no tools and no commands. TUI rendering of ledger entries (`registerEntryRenderer`) is deferred; it is not needed for a browser feel check.

### 3.3 The stage host (kit; browser module + headless)

- **Client library first.** The desk's SSE client, RPC correlation, dialog handling, and tool-row renderer are private globals in `apps/desk/public/app.js`. Extract them into `apps/desk/public/desk-client.mjs` with the desk itself as the first consumer, no behaviour change; the existing browser E2E tests are the regression net. The stage host is the second consumer.
- **Replay reducer (the only stage state logic):** on attach, `get_entries`; take `leafId`, walk `parentId` ancestry to the root; over that path in order, fold `nana-block` entries by upserting on `id`. Abandoned branches are ignored. Live `tool_execution_end` events whose `result.details.blocks` carry stamped blocks apply the same upsert; the cursor is the last entry id seen. A new session, fork, or resume replays its own branch; there is no clear command.
- **Stage:** blocks render into app-defined regions by `slot`; unknown slot → `main`. Clicking an action calls `drawer.compose(prompt, {send: !mutates})`: read-only actions send at once, mutating actions land in the editor for the user to confirm.
- **Drawer:** turn list as outcome cards (user turn, "agent's reading" text, one line per tool call naming the block it produced, expand for full tool detail via the extracted tool-row renderer). Folded by default.
- **Gate bar:** a host-level bar that cannot be folded and sits above the app. It shows (a) pending `extension_ui_request` dialogs from `desk_hello` and live events, answered through `ui-response`; (b) unacknowledged missed gates from `GET /api/missed` on the app port. Kit invariant with a deterministic test: a pending select is visible with the drawer collapsed and after a reload.
- **Refresh rule (change trail):** on `tool_execution_end` of a tool in the manifest's `mutating` list, emit `agent:changed {tool, args, turn}`; the app re-fetches. No diffing, no optimistic UI. Attribution markers on app views and undo are app-owned and out of v0.
- **Headless (slice 1b):** `stage-render.mjs` exports the reducer, a DOM renderer, and an HTML-string renderer over the same block array; the server calls the latter at the end of `/api/run` (§3.4). Equality between live and static is judged on the reducer's block array (a semantic snapshot), not on markup.

### 3.4 Desk server: one listener per app

The desk process opens **one listener per app manifest**, `127.0.0.1:<manifest.port>`, so every app page is its own browser origin, distinct from the desk (7317) and from every other app. A listener serves that app's stage host and exactly these routes:

| Route | Does |
|---|---|
| `POST /api/session` | spawn this app's session from its manifest, or return the live one |
| `GET  /api/session` | the live child, or `null` |
| `GET  /api/events` | SSE, `desk_hello` then live events |
| `POST /api/prompt` · `/ui-response` · `/abort` | forwarded to this app's child |
| `GET  /api/entries?since=` | `get_entries` passthrough (the one RPC an app page needs) |
| `GET  /api/missed` · `POST /api/missed/ack` | the missed-gate ledger |
| `POST /api/run` | scheduled turn: `{prompt}` → see *attendance* below |

Routes carry no app name and no child id: the listener *is* the app, and it holds exactly one child reference. There is no `/api/spawn`, `/api/live`, `/api/session/:id/*`, bash, rpc passthrough, delete, or settings on any app listener. The desk listener on 7317 is unchanged in routes and does not serve app pages.

**Origin enforcement on every listener, including the existing desk one.** Today the desk parses any POST body as JSON without checking `Origin` or `Content-Type`, so any web page open in the same browser can fire a cross-origin `text/plain` POST at `/api/spawn`. This is a live exposure independent of this design and is fixed first (deliverable 0, §6): every state-changing request must carry `Content-Type: application/json` and either no `Origin` header (curl, scripts) or an `Origin` equal to the listener's own; anything else is rejected with 403 before the body is read. Same rule on app listeners. Test: cross-origin simple POST against 7317 and against an app port both return 403; a same-origin JSON POST succeeds.

**Manifest** (`~/.pi/agent/apps/<app>.json`, server-side, never client-supplied): `port`; `cwd`; `tools` (passed as `-t`, allowlisting built-in, extension, and MCP-adapter tools; app sessions get **no `bash`, `edit`, or `write`** unless listed); `extensions`; `mutating`; `trust: "approve" | "no-approve"` (→ `-a` / `-na`, project-trust only); `session` (last session file).

**Session file tracking:** after spawn, the server calls `get_state`, reads `sessionFile`, and writes the manifest atomically (temp file + rename). App listeners expose no command that changes the session file (no `new_session`, `switch_session`, `fork`, `resume`), so spawn is the only transition in v0 and the only trigger needed. When a fork or resume route is added later, it re-runs the same `get_state` + atomic write.

**Attendance is a property of the turn, not the manifest.** A page-driven turn is attended; a `POST /api/run` turn is headless. Rules:
- If a live child exists, `/api/run` posts its prompt into it and the turn is attended if at least one SSE client is connected at the moment a dialog arrives; a dialog with no connected client waits (attended semantics; the gate bar shows it on reconnect). No auto-decline for attended sessions, ever.
- If no live child exists, `/api/run` spawns one from the manifest, marks it headless, runs the single turn, and kills the child after `agent_settled` (not `agent_end`, which can precede a retry, a compaction retry, or a queued continuation). In a headless child the server answers every `extension_ui_request` that expects a response with `cancelled: true` immediately and appends `{at, kind, title, sessionFile, toolCallId?}` to `~/.pi/agent/apps/<app>.missed-gates.jsonl`. Fail closed: the turn proceeds as if the user declined.
- A page attaching to a headless child mid-turn does not change its mode (the turn was started unattended); it sees the missed-gate record afterwards and can re-ask.
- The gate bar shows unacknowledged missed gates from `GET /api/missed`; `ack` marks them. No pi command and no extension involvement.
- **`/api/run` contract:** the request holds until `agent_settled` (or a manifest `runTimeoutSec`, default 900, after which the child is killed and the run recorded as timed out). The server then runs the reducer over the session file, renders the static page with the same module the browser uses (`stage-render.mjs`, one export for DOM and one for HTML string), writes it to `~/.pi/agent/apps/<app>/runs/<iso-timestamp>.html`, and responds `{sessionFile, htmlPath, blocks, missedGates}`. Callers are cron or a CLI; the server is the only invoker of the renderer. **The whole scheduled path (`/api/run`, missed-gate ledger, static page) is slice 1b: built after the feel check and before slice 2, since a feel check needs none of it.**

**Threat model, stated plainly:** single user, own machine, own pages, no authentication on any listener. Per-app origins plus the Origin rule isolate app pages from the desk and from each other, and the desk from other websites in the same browser. None of it defends against a hostile local process, and nothing here is safe to expose beyond localhost (see §8).

## 4. Lifecycle

| Event | Stage | App ↔ session |
|---|---|---|
| compaction | unaffected (custom entries persist) | unaffected |
| browser reload | reducer over `get_entries` from `leafId` | `GET /api/session` on the app port |
| fork / resume / new session | not reachable from an app page in v0; when added, reducer over the new branch or file | manifest `session` rewritten atomically after `get_state` |
| desk restart | children die; the page re-spawns via manifest with `session`; reducer over the file | manifest |
| pi child death | same as desk restart | same |
| pending dialog, headless (slice 1b) | cancelled at once + missed-gate record | — |
| pending dialog, attended, no client | stays pending in the child, no timeout; shown from `desk_hello` on attach | — |

## 5. Transferability, stated so it can fail

The claim is that the **mechanism** transfers, not the taxonomy: block contract + `nana-stage` + stage host + per-app listener + manifest are reused unchanged by the second and third apps, and each app adds only (a) its tools returning blocks, (b) its manifest, (c) its page. The claim is judged at slice 2, which must exercise everything slice 1 avoids: MCP-bridged tools with the `details.mcpResult` path, mutation refresh, cell-level evidence, and lifecycle recovery on a real case. If slice 2 needs a change to `nana-stage` or the host beyond adding a block type, the design failed and that app goes bespoke.

| | App-owned views | Blocks (v0 types) | Composed prompts | Scheduled |
|---|---|---|---|---|
| **fantasy basketball** | none in slice 1 | `card` player (players + season stats + contract + injuries), `table` board / nine-cat | click player → "evaluate trading X" | nightly after `scripts/nightly.py` |
| **AML investigator** | case record, alert list (aggregate-only tools exist) | `card` entity, `table` red-flag hits with evidence, later `graph` + `timeline` | click red flag → "show the transactions behind this" | new-alert trigger |
| **family-planner** | everything it has now; direct manipulation stays | `table` proposed meal plan, later `kpi` expiring | "plan next week around what expires" | morning briefing (phase 6) |

## 6. Slice 1: fantasy basketball, two blocks, one page

Why first: single user (Jake), analysis-shaped output, data that exists today. It judges **feel**, not transferability (slice 2's job). It is **not** zero blast radius: it touches session lifecycle and gate surfaces, so per this repo's invariant it ships with deterministic tests and an adversarial review pass before the feel check.

Data that exists in `~/basketball-geek` (README is stale on this): `data/basketball.sqlite` (players, player_season_stats, contracts, salaries, injuries, news, crosswalk), `data/intel.sqlite` (claims, sources), 50 dossiers under `data/dossiers/`, `src/basketball_geek/ninecat.py`, boards under `reports/`. **No league or roster data exists**; league import is a stated dependency, not in scope, and the page says so.

Deliverables, in order, each with its tests before the next starts:

0. **Origin rule on the existing desk listener** (independent exposure, see §3.4). Tests: cross-origin `text/plain` POST to `/api/spawn` → 403 and no child spawned; same-origin JSON POST unchanged; curl without `Origin` unchanged. Ships on its own before anything else.
1. `desk-client.mjs` extracted from `app.js`; desk unchanged; existing E2E green.
2. Block schema + JS validator + `nana-stage` (the Python validator and the MCP overflow path wait for slice 2, which is the first MCP consumer). Tests: malformed block → error result, no entry, **and the `tool_execution_end` event carries no block carrier**; valid block → one `nana-block` entry with `produced_by` stamped from the event, and the `tool_execution_end` event's `result.details.blocks` are the stamped blocks; an oversize block (>64 KiB or >500 rows) is rejected like a malformed one; a second extension loaded after `nana-stage` that re-injects a carrier does not reach the stage; tool-supplied `produced_by` overwritten; block missing `scope` rejected; `show:false` recorded and flagged hidden; text `content` after the hook equals the canonical rendering exactly, with the tool's own text dropped; a block-free tool result is untouched.
3. Per-app listeners + manifest loader. Tests: an app listener serves none of the desk routes (spawn, live, session/:id, bash, settings → 404); the spawn ignores any body fields; the child runs with `-t` from the manifest (assert the spawn arguments) and, at runtime, a test-only extension loaded by the manifest reports `pi.getActiveTools()` without `bash`, `edit`, or `write` (`get_state` has no tools field); two manifests → two ports, and a request to port A can only ever reach A's child (there is no route that names another); cross-origin POST from port A's origin to port B → 403; the Origin rule is one middleware applied to every non-GET route on every listener, tested by enumerating the route table (including body-less `DELETE`s on 7317); `trust` maps to `-a`/`-na`; manifest `session` is written atomically after spawn.
4. Basketball pi extension with two tools: `player_card(name)` and `board_table(board)`; each returns `details.blocks` + text content with the same data, and a required `scope`. Actions: card → "evaluate trading {name}" (read-only), table row → `player_card {name}`.
5. Stage host page + `stage-render.mjs` (reducer + DOM renderer; the HTML-string renderer lands in 1b). Tests, browser E2E through the real child: a prompt produces a block live; reload rebuilds the same block array through `get_entries` + `leafId` ancestry; a second call with the same block `id` replaces in place; a malformed block from a real tool never appears on stage; the branch test runs the reducer over a **pre-recorded session-file fixture** containing an abandoned branch (app listeners expose no fork route) and asserts only the leaf branch's blocks; gate bar shows a pending select with the drawer collapsed and after reload.
6. Adversarial pass (pi) on 0, 2–3 and 5, then feel check by Jake: ask for a board → table → click a player → card → click the action → reading in the drawer. Verdict decides slice 2 (AML).
7. **Slice 1b (after the feel check, before slice 2):** `/api/run`, headless mode, missed-gate ledger + `ack`, HTML-string renderer. Tests: `/api/run` with no live child spawns headless, a dialog is cancelled and recorded, the child is killed only after `agent_settled` (fixture: a run whose `agent_end` carries `willRetry: true` must not be killed early; a run with a queued follow-up must complete it); `/api/run` with a live child and a connected client leaves the dialog pending; the timeout kills and records; the static page's block array equals the live reducer's over the same session file; `ack` clears a missed gate.

## 7. Subtraction test

- **Why not just the desk?** Same backend, different information hierarchy: the user reads the app, the chat is a control. Not a fork; a client library is extracted and both consume it.
- **Why not generative UI?** Nothing is stable after the agent moves on, and nothing can be validated.
- **Why no `present` tool?** Every field it would let the model author is a fabrication surface. Tools returning blocks is strictly smaller and strictly safer.
- **Why a ledger instead of client state?** Reload, restart, fork, and headless all read one source, and pi already provides it.
- **Why a port per app instead of capability tokens?** A token handed to a page on a shared origin is available to every page on that origin, so it isolates nothing; a port per app is a browser-enforced origin with no plumbing, and the route table plus the Origin rule are the whole policy, testable by enumeration.
- **Why no TUI parity, no clear command, no ref table in v0?** Each was in v1 or v2 and each failed the subtraction test under review.

## 8. Blast radius

- **Desk posture unchanged:** localhost, no auth, single user. The app listener is also localhost-only. Serving an app page to a phone or another machine is **out of scope** and must not be done by proxying either listener; if slice 3 wants it, that is its own design with authentication, origin checks, and per-user identity (family-planner's MCP server currently uses one process-wide bearer token, so a phone drawer would act as whoever configured it).
- **App sessions are narrower than desk sessions:** manifest-fixed cwd, tools, trust, extensions; no shell or file tools by default; no client-supplied anything; one child per listener; a route table with no desk-wide surface; Origin rule on every listener.
- **Gates cannot be hidden:** gate bar is a host invariant with a deterministic test; headless sessions fail closed and leave a durable record.
- **Data never passes through the model:** blocks are code-authored and boundary-validated; forged `produced_by` is overwritten; `scope` is mandatory.

## 9. Review rounds (pi gpt-5.6-sol) and adjudication

**Round 1 → REWORK.** D1 no app identity, renderer not reusable → manifest apps + client extraction. D2 BLOCKING cross-process ref table; model-authored projection fabricates → no refs, no `present`, tools return blocks, validated at `tool_result`. D3 refs lost across lifecycle → ledger via `appendEntry`/`get_entries`. D4 taxonomy claim; slice 1 dodges risky seams; data overstated → mechanism claim judged at slice 2; data reconciled; slice 1 stays a feel check by design. D5 front-loaded → two blocks, one page. D6 BLOCKING `/api/spawn` arbitrary, folded gates, headless dialogs → manifest spawn, gate bar, headless deny.

**Round 2 → REWORK.** R1/R6 BLOCKING same-origin app pages could still call desk-wide routes; "not reachable" unenforced → **separate listener with an enumerable route table and app-scoped child map (§3.4)**. R2 MCP results are text + adapter details, not `details.blocks` → **`details.mcpResult.structuredContent.blocks` under `directToolResultDetails: "bounded"`, pinned by a slice-2 test (§3.1)**. R3 `produced_by` lacked args; narrative could overstate → **args stamped, `scope` mandatory, drawer text labelled "agent's reading", residual risk stated (§3.1)**. R4 feel check could pass on live events with replay broken; "zero blast radius" false → **produce→reload→replay E2E, isolation and tool-denial tests before the feel check; blast radius restated (§6)**. R5 `renderResult` was the wrong surface; `/stage` undefined → **both removed**. R6 `approve:"deny"` conflated with project trust; no RPC to record missed gates → **`trust` (→ `-a`/`-na`) and `attended` separated; server-side missed-gate ledger + `ack` (§3.4)**. D3 partial: replay ignored branches; session file tracking unspecified → **`leafId` ancestry reducer; server rewrites manifest `session` (§3.3, §3.4)**.

**Round 3 → REWORK.** C1/C2/C4 BLOCKING shared app origin lets pages name each other's routes; the desk listener accepts cross-origin `text/plain` POSTs → **one listener per app (routes carry no app name), Origin + Content-Type rule on every listener including the existing desk, deliverable 0 with negative tests (§3.4, §6)**. C1 MCP overflow becomes an omission summary, not a validation failure → **`nana-stage` treats the summary as an error naming the cap (§3.1)**. C1/C3 no trigger for manifest `session` rewrite → **`get_state` after spawn, atomic write; app listeners expose no session-changing command in v0 (§3.4)**. C3 `attended` static → **attendance per turn: page turns attended, `/api/run` headless only when no live child; no auto-decline for attended sessions (§3.4)**. C3 text/stage correspondence asserted → **`nana-stage` replaces text content with the deterministic block rendering (§3.1)**.

**Round 4 → REWORK.** F2 BLOCKING invalid `details.blocks` still ride `tool_execution_end` into the live stage → **failure path strips the carrier; success path replaces it with stamped blocks; live reducer accepts only stamped blocks (§3.2)**. F2 headless exit at `agent_end` is premature → **`agent_settled`, with retry and queued-continuation fixtures (§3.4, §6)**. F1/F2 appended tool text could contradict the rendering → **content is the canonical rendering only; code-authored `note` field for anything extra (§3.1)**. F3 `/api/run` under-specified; scheduled path not needed for a feel check → **contract defined (hold to settled, timeout, output path, single renderer module) and the whole path moved to slice 1b; Python validator and MCP overflow to slice 2 (§3.4, §6)**. F4 tests → **live malformed-block test, Origin middleware enumerated over every non-GET route incl. `DELETE`, settled-lifecycle fixtures, pre-recorded branch fixture, semantic-snapshot equality (§6)**.

**Round 5 → all five round-4 items CLOSED; three payload corrections.** G2 live path is `event.result.details.blocks`, `content` patches are part arrays, `get_state` has no tools field → **fixed throughout; runtime allowlist check via a test-only extension calling `pi.getActiveTools()` (§3.2, §3.3, §6)**. G3 hook ordering and extension-block size → **`nana-stage` last in the manifest + stamp re-check on the live path; 64 KiB / 500-row cap (§3.2)**.
