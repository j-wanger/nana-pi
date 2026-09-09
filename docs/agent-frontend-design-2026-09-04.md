# UI-centric agent frontend — design

*2026-09-04. Status: design LAND (pi gpt-5.6-sol, round 6). **Slice 1 BUILT the same day** (nana-pi `8e8bc5e`…`d0d6ef2`, basketball-geek `44e5e58`…`c6dcaa3`); adversarial build review rounds in §10. **Slice 2 (the edge desk, §11) BUILT 2026-09-04/05 and review-LANDED after four adversarial rounds (§11.7).** Awaiting Jake's feel check at http://127.0.0.1:7320 (basketball) and http://127.0.0.1:7321 (edge desk).*

## 1. Decision

Build a second frontend shape where the screen belongs to the application (a dashboard, a case file, a league board) and chat is the primary way to drive it. One transferable kit serves three products: fantasy basketball, the AML investigator, family-planner.

The kit is a **contract plus two thin runtimes**, not a dashboard component library:

1. **The block contract** — a JSON schema for a small set of presentation blocks, with ONE canonical validator (`blocks.mjs`; *amended 2026-09-05 from "JS and Python" after the slice-2 review*: a second implementation is a duplicate mechanical check of the same evidence — Python producers test their output through the JS validator via node, and `nana-stage` validates at the boundary regardless). App tools produce blocks; the model never authors block data.
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

**Contract amendments (2026-09-08 hardening pass, commit 58645c5).** Three changes to what `validateBlock` accepts and to the text a model reads. Anyone writing an app tool sees them.

1. **Cell and field values must be JSON scalars.** Every value in a `table` row — *including keys `columns` does not name*, because extra keys ride `actions[].prompt` templates and are persisted with the block — and every `card` field `value` must be `null`, a string, a boolean, or a **finite** number (`blocks.mjs`, `isScalar`). A nested object or array, a `bigint`, `NaN`/`Infinity`, a symbol or a function now rejects the **whole block**, and the tool result comes back as an error naming the offending key. Reason: those values do not survive persist → replay unchanged (bigint throws in `JSON.stringify`; symbols and functions are dropped; `NaN` returns as `null`), so the live stage and a replayed stage would disagree. What to do: format composite values into a scalar in the tool's own code before returning them.

2. **The text the model reads is bounded; the stage is not.** Column padding stops at 80 characters (`MAX_TEXT_COL_WIDTH`) — a wider cell is still printed **whole**, its row just runs ragged, so padding never truncates cell contents. Behind that, one block's rendering is cut at 128 KiB (`MAX_BLOCK_TEXT_BYTES = 2 × MAX_BLOCK_BYTES`) and one tool result's at 256 KiB (`MAX_RESULT_TEXT_BYTES = 4 × MAX_BLOCK_BYTES`), on a UTF-8 character boundary, with the cut announced in the text (`… <what> truncated at N bytes; the stage holds the full block`). Consequence: for an unusually wide or numerous set of blocks the model can read fewer facts than the stage displays — the one place the §3.1 "text and stage cannot diverge" guarantee is bounded rather than absolute. The block's own 64 KiB JSON cap and 500-row cap are unchanged. What to do: paginate rather than rely on the cut. (Before the padding cap, a 64 KiB-legal 500-row table with one wide cell rendered ~25 MB of padding into context.)

3. `subtitle` and `badges` are validated on **every** block type, not just `card` — they render on every type, and a `table` carrying `badges: {length: 2}` used to validate and then blank the stage. And `validateBlock` never throws: a block it cannot inspect (a cycle, a hostile getter or `toJSON`) comes back as an ordinary rejection instead of escaping through pi's `tool_result` handler, where a thrown error would BLOCK the tool.

### 3.2 `nana-stage` (kit; pi extension)

- Hooks `tool_result` for every tool (MCP-bridged tools are registered through `pi.registerTool` by the adapter, so the hook sees them). Looks for blocks at the two paths above. If present: validate each against the schema. On failure, return `{isError: true, content: [{type: "text", text: "<one-line reason>"}], details: <original details with the block carrier removed>}` (`content` patches are arrays of content parts); `tool_result` patches replace fields, so the carrier must be stripped explicitly or the invalid blocks would ride the subsequent `tool_execution_end` into the live stage. On success, stamp `produced_by`, `pi.appendEntry("nana-block", block)` per block, and return `details` with the carrier replaced by the stamped, validated blocks. The live reducer reads `event.result.details.blocks` on `tool_execution_end` and consumes only blocks carrying a `produced_by` stamp; anything else in a tool event is ignored.
- **Ordering:** `tool_result` handlers chain in extension load order. `nana-stage` must be the last block-relevant mutator: the manifest lists it as the final extension, and it re-validates on `tool_execution_end`'s own view (the reducer's stamp check) so a later handler that re-injects a carrier cannot reach the stage.
- **Size bound for extension blocks:** the validator rejects a block whose JSON exceeds 64 KiB or whose `table.rows` exceed 500; tools paginate. This mirrors the adapter's cap on the MCP path so both paths fail the same way.
- Ledger semantics: custom entries do not enter LLM context, survive compaction, and are readable via `get_entries` (with a `since` cursor) from any client and from the session file. The **ledger is the stage**; the browser is a view of it.
- Registers no tools and no commands. TUI rendering of ledger entries (`registerEntryRenderer`) is deferred; it is not needed for a browser feel check.
- **Dependencies** *(recorded 2026-09-09)*: none at runtime beyond pi itself — `packages/nana-stage/package.json` declares `@earendil-works/pi-coding-agent` as an *optional* `peerDependency` (pi is the host the extension runs inside) and no `dependencies`/`devDependencies`; `lib/blocks.mjs` and `lib/sign.mjs` use `node:` builtins only, and `tests/blocks.test.mjs` is a zero-dep `node <file>` run.

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

The claim is that the **mechanism** transfers, not the taxonomy: block contract + `nana-stage` + stage host + per-app listener + manifest are reused unchanged by the second and third apps, and each app adds only (a) its tools returning blocks, (b) its manifest, (c) its page. The claim is judged at slice 2 (now the edge desk, §11 — Jake redirected it from AML on 2026-09-04), which must exercise everything slice 1 avoids: MCP-bridged tools with the `details.mcpResult` path, mutation refresh, cell-level evidence, and lifecycle recovery on a real artifact set. If slice 2 needs a change to `nana-stage` or the host beyond adding a block type, the design failed and that app goes bespoke. *Amended 2026-09-05 (slice-2 review, §11.7):* the app-page and app-data seam — which §3's drawing named ("app API / store", the app's own page) but the kit never specified — is now part of the kit: manifest `page` (the app's `index.html`/`app.js`/`app.css`, served in place of the kit page; kit modules unchanged), `data` (fixed-argv commands behind `GET /api/data/<key>`, same-origin or direct requests only), `quick` (starter prompts), and the stage's `agent:changed` event for the §3.3 refresh rule. The failure rule stands for the block/ledger/stamp/listener-isolation mechanism, which slice 2 did not change.

| | App-owned views | Blocks (v0 types) | Composed prompts | Scheduled |
|---|---|---|---|---|
| **fantasy basketball** | none in slice 1 | `card` player (players + season stats + contract + injuries), `table` board / nine-cat | click player → "evaluate trading X" | nightly after `scripts/nightly.py` |
| **edge desk (edge-screener)** — slice 2, Jake 2026-09-04, §11 | tape card (vintage, span, as-of), reports shelf, persona roster | `table` screen panel / construction / direction board, `card` screen detail, **`chart`** OOS curve (first new block type) | click screen → "detail for X"; click row → "explore X on this universe" (mutating) | weekly tape pull + panel explore → static page |
| **AML investigator** (deferred behind the edge desk) | case record, alert list (aggregate-only tools exist) | `card` entity, `table` red-flag hits with evidence, later `graph` + `timeline` | click red flag → "show the transactions behind this" | new-alert trigger |
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

## 10. Build log — slice 1 (2026-09-04)

Built in the deliverable order of §6, each step with its tests before the next. What exists:

| Piece | Where | Tests |
|---|---|---|
| Origin + JSON rule on the desk (deliverable 0) | `apps/desk/server.mjs` `originRejection` | `test/origin-rule.test.mjs` (11) |
| Client library extracted | `apps/desk/public/desk-client.mjs`; desk unchanged | desk E2E ×3 |
| Block contract + reducer + hook logic | `packages/nana-stage/lib/blocks.mjs`, `lib/sign.mjs` | `tests/blocks.test.mjs` (61) |
| `nana-stage` extension | `packages/nana-stage/extensions/nana-stage.ts` | real chain (15, real pi + 2 model turns) |
| Per-app listeners + manifests | `apps/desk/apps.mjs`; `~/.pi/agent/apps/<app>.json` | `test/app-listener.test.mjs` (43, stub pi) |
| Stage host | `apps/desk/public/stage/` | `test/stage-page.e2e.mjs` (24, browser + stub pi) |
| Basketball tools | `basketball-geek/.pi/extensions/nana-basketball.ts` → `scripts/blocks_cli.py` → `src/basketball_geek/blocks.py` | `tests/test_blocks.py` (12); repo gate 675 @ 94.4% |

**What changed from the design during the build (all subtractions or hardenings, none new mechanisms):**
- **Provenance is signed, not just stamped.** The adversarial review (round 1) showed a stamp alone is forgeable by any co-resident extension or a hand-edited session file. The desk now hands each app child a per-session key (`NANA_STAGE_KEY`); `nana-stage` signs every block (HMAC-SHA256 over the canonical JSON) and scrubs the key from the environment at load; the server drops unsigned or event-mismatched blocks on the live path and *redacts* (never deletes, to keep the session tree's ancestry) forged ledger entries on the read path. Precisely what this proves: the block was minted inside the app child by the manifest's extension set. It does not defend against hostile code already in that process; the manifest is that boundary.
- **No delta cursor.** The stage replays the full active branch on attach, after every settled turn, and on every reconnect (a second `desk_hello`). Sessions are small; a delta cannot carry the branch ancestry.
- **Empty tool allowlists are refused** at manifest load: an empty `-t` would have meant pi's defaults, shell included.
- **Concurrent spawns are serialized** per app (three simultaneous `POST /api/session` → one child).
- **Gates:** a card stays until the server accepts the answer; every `desk_hello` reconciles the bar against the snapshot; child exit clears stale cards with a notice; timed dialogs expire server-side so a snapshot never lists one pi already abandoned.
- **Labelling:** board rows are "ANALYST-GENERATED" in scope; dossier lines carry a `dossier ·` label and file evidence; stat fields cite `stats`. Evidence renders inline, not on hover.
- **Desk bug found:** pi reports tool failures in `result.isError`; the desk (and the stage) read the event's top-level flag and drew a green check on failures. Fixed in both.

**Adversarial build review (pi gpt-5.6-sol):** round 1 REWORK (3 blockers: forgeable stamp, empty-allowlist hole + spawn race, gate answer race; plus cursor bug, drawer replaying abandoned branches, labelling) → all fixed above. Round 2 REWORK (forged-entry deletion severed ancestry; no replay on reconnect; timed dialogs lingered; sign the wire form; key is process-wide → claim narrowed) → all fixed above except the pre-existing Win32 drive-root argument handling, declined as out of slice and untestable here. **Round 3: LAND, no fixes** (all five round-2 items closed; the Win32 decline accepted as out of slice). Build-review corpus: `docs/reviews/agent-frontend-2026-09-04/build-round-{1,2,3}.md`.

**Residuals (one line each, no round owed):** cross-origin GETs physically reach handlers though SOP hides responses; a failed post-spawn `get_state` leaves the manifest's session pointer stale but the child live; full replay is uncapped and will cost on very long sessions, and an in-flight replay can briefly overwrite a newer live update (the next settled replay corrects it); an extension loaded BEFORE `nana-stage` that deliberately captures the key is inside the trust boundary by construction; Win32 drive-root args in the desk's pre-existing shell-mode spawn.

## 11. Slice 2 (revised 2026-09-04): the edge desk over edge-screener

*Jake's redirect: the second use case is a trading dashboard built from what `~/edge-screener` has today; AML moves behind it. Status: design, not built. Awaits the slice-1 feel check as before.*

### 11.1 What edge-screener actually has (checked on this Mac, 2026-09-04)

- **One frozen tape, no live data.** Vintage label `live`: 504 S&P names, daily OHLCV 2010-01-04 → 2026-05-29 (yfinance, content-addressed parquet, 77 MB). `pull` is network, explicitly non-reproducible, and gated behind an acknowledgement flag. The `surv-run` vintage the standing survivorship verdict needs is **absent here** — `edge-screener verdict` fails on this machine; the committed reports are the only source for that band.
- **Committed verdicts (read, don't recompute):** corrected panel (11 screens × Deflated Sharpe / HAC p / FDR q / verdict, `reports/edge-verdict-corrected-live.md`), survivorship band (9 screens × three delisting assumptions), stage-2 construction table (amihud, 18 variants), stop-family report, the 2026-07-20 confirmatory test (momentum 0/8 rejected, amihud control calibrated), 12 persona direction/firm sessions as JSONL + markdown.
- **Cheap compute:** `explore --screen X --manifest live` = 2.8 s on 503 names, writes a report, labelled NOT A VERDICT (in-sample, uncorrected). Direction rounds are ~5 min (sweep-dominated); stage-2 and robustness batteries are minutes to an hour. Standing conclusion: **no edge 9/9 survivorship-corrected; amihud is the one family-corrected edge, outside every mandate under 35% drawdown.**
- **No positions, orders, P&L, quotes, or broker.** "Trading dashboard" over this repo is a **research desk**: what the tape says about each screen, under which construction, for which mandate. Anything with live positions is new ingest and out of scope for this slice.

### 11.2 The page

App-owned views (durable, painted from the repo, never by the agent): **tape card** (vintage label, symbol count, span, as-of), **reports shelf** (committed and exploratory reports by kind and date; refreshes on mutation), **persona roster** (12 personas, tolerance, last direction result).

Blocks (tools return them; agent decides which to call):

| Tool | Block | Source | Action |
|---|---|---|---|
| `screen_panel()` | `table` 11 screens: DSR, HAC p, FDR q, verdict, near-miss | corrected-live report; every cell carries `evidence` = report path + line | row → `screen_detail` |
| `screen_detail(screen)` | `card` metrics + survivorship band + sub-period stability; **`chart`** OOS equity and drawdown vs SPY | card from reports; chart series computed or read from a cached artifact (§11.4 item 0 decides) | "explore {screen} on this universe" (mutating) · "construction table" |
| `construction_table(screen)` / `stop_table(screen)` | `table` variants × Sharpe/IR/maxDD/DSR/edge/envelope | committed stage-2 and stop reports | row → detail card |
| `direction_board()` | `table` persona × screen × family × in-mandate fraction × best config | direction-session JSONL | row → persona card |
| `explore_screen(screen, universe?)` — **mutating** | `table` would-hold names + signal; code-authored `note`: "NOT A VERDICT — in-sample, uncorrected" | runs `explore` (≈3 s); writes `reports/explore/<ts>-<screen>.md` only | shelf refresh |

Nothing that runs minutes is a tool. Stage-2, stops, robustness and direction sessions are **scheduled turns** (`/api/run`, slice 1b) or refused with a hint naming the schedule route. `pull` is never in the interactive allowlist; it runs only from the scheduled path under a dated label, so the standing verdict's vintage is never touched.

### 11.3 What this slice judges (the transferability claim, §5)

The kit must stay unchanged **except for adding the reserved `chart` block type** (line series, ≤2k points per series, code-authored, validated in both validators, inline-SVG render — no library). Everything slice 1 dodged is exercised here:

- **MCP path.** Tools live in a Python MCP server inside edge-screener (`structuredContent.blocks`), bridged by `pi-mcp-adapter` (installed) with `directToolResultDetails: "bounded"`. This pins `details.mcpResult`, the 16 KiB cap → error-naming-the-cap behaviour, and lands the kit's **Python validator** (deferred from slice 1) with fixtures shared byte-for-byte with the JS one.
- **Mutation refresh.** `explore_screen` in the manifest's `mutating` list → `agent:changed` → shelf refetch.
- **Cell-level evidence.** Every number on the panel resolves to a committed report line; the test asserts each ref exists.
- **Lifecycle.** Reload / desk restart replay over a session that mixes MCP blocks and an exploratory mutation.

Failure rule unchanged: if `nana-stage` or the host needs a change beyond the block type, the design failed and the edge desk goes bespoke.

### 11.4 Deliverables, in order

0. **Measure first (≈15 min):** time `screen --focus` on `live` (decides whether the chart series is computed in-tool or read from a cached artifact); confirm how `pi-mcp-adapter` registers MCP tools (direct `pi.registerTool` per tool vs one proxy tool) and where the raw result lands. Either answer changes step 2.
1. Kit: `chart` in `blocks.mjs` + Python validator `nana_stage/blocks.py` + shared fixtures; stage renderer for `chart`. Declared kit change, adversarial pi round on it alone.
2. edge-screener: `src/edge_screener/blocks.py` (pure block builders over reports + `explore`) + MCP server; tests per builder (evidence refs resolve; explore writes only under `reports/explore/`; NOT-A-VERDICT note present).
3. Manifest `~/.pi/agent/apps/edge.json` (port 7321, cwd edge-screener, tools = the five above, `mutating: ["explore_screen"]`, no bash/edit/write) + page with the three app-owned views.
4. Tests through the real child: MCP block → stage; oversize → error naming the cap; mutation → shelf refresh; reload replay; chart cap.
5. Adversarial pi round on the build → Jake's feel check: ask for the panel → click amihud → detail + chart → click "explore" → shelf gains a report → reading in the drawer.
6. Slice 1b (scheduled path) then runs the weekly tape pull + panel explore as its first real job.

### 11.5 Blast radius

Tools read committed reports and run one 3-second in-sample peek; the only write is a new file under `reports/explore/`. No network from the interactive session, no standing-verdict path touched, no shell. The MCP server is a local stdio child of the pi session, launched by the adapter; it inherits the app session's cwd and nothing else.

### 11.6 Build log — slice 2 (2026-09-04/05)

Built the same evening the redirect landed. Commits: nana-pi (kit: `chart`, listener `page`/`data`/`quick`, `agent:changed`, tests) and edge-screener (`src/edge_screener/desk/`, `scripts/desk_oos_series.py`, `desk/` page, `.pi/mcp.json`, `reports/desk/oos-amihud_illiquidity.json`). Manifest `~/.pi/agent/apps/edge.json` → http://127.0.0.1:7321.

**Step 0 measurements, and what they changed:**
- `edge-screener screen --focus` on the live vintage ran past 25 minutes (full panel × three delisting bands) → chart series are an offline precompute (`scripts/desk_oos_series.py`, 108 s per screen: one walk-forward on the stage-1 frame, weekly points) read by `screen_detail`; a screen without a series gets the card and a note saying how to add the chart, never an invented curve.
- pi-mcp-adapter 2.32.1: runtime-registered servers are proxy-only, so direct tools come from a **project** `.pi/mcp.json` in edge-screener (`directTools: true`, `toolPrefix: "none"` so the manifest allowlist names the bare tool names, `lifecycle: eager`). On the very first session the direct tools were already present for the first model turn (no metadata-cache warm-up problem observed; the e2e still waits 6 s after spawn — a flake guard, not a proof).
- The adapter bounds the **whole raw MCP result**, and mcp 2.x's default for a dict return echoes the structured output as pretty-printed text, so a 33 KB chart block became an ~80 KB raw result and was summarized even under a 64 KiB cap. Fix: tools return `CallToolResult` with a one-line text (nana-stage replaces it anyway) + `structured_content`. The cap in `.pi/mcp.json` is 65536 = the block cap, so anything the validator would accept fits, and the over-cap path fires only for blocks the validator would reject too.
- mcp 2.x renamed FastMCP → `MCPServer`; dict returns get an auto output schema; `ToolError` is the only exception whose message reaches the caller (a `ValueError` becomes "Error executing tool …" with the suggestions lost).

**Deviations from §11.4, declared:**
- **No Python validator.** The kit keeps ONE validator (`blocks.mjs`); edge-screener's tests validate every builder's output by running it through node. Reason: a second implementation is a duplicate mechanical check of the same evidence (standing rule: one producer per piece of evidence); nana-stage validates at the boundary regardless.
- **Host gained three manifest keys and one event.** The design's §3 drawing named "app API / store" and §5 said each app adds "its page", but the kit provided neither. Slice 2 added `page` (serve the app's own `index.html`/`app.js`/`app.css`; kit modules stay the kit's), `data` (GET `/api/data/<key>` runs a manifest-fixed argv in the app cwd, 20 s timeout, JSON relay, query string ignored, same Origin rule), `quick` (per-app starter prompts), and stage.js now dispatches `agent:changed` when a manifest-`mutating` tool finishes (the §3.3 refresh rule, unimplemented in slice 1 because nothing mutated). By the letter of §5 this is a host change beyond a block type. The seat's reading: a **design gap the design itself named but never provided**, not a failure — no block, ledger, stamp, or listener-isolation rule changed; the reviewer rules in §11.7.

**Verified (all green at close):** blocks 76 · listener 57 · origin 11 · stage page (browser) 24 · basketball chain (real pi) all PASS · **edge chain (real pi + adapter + MCP server)**: direct tool ran under its own name; card + chart stamped and signed via `details.mcpResult`; raw carrier stripped; text == canonical rendering; ledger replay identical; `explore_screen` wrote exactly one file under `reports/explore/` with the NOT-A-VERDICT note; refused call carried suggestions and minted nothing; the 512-byte-cap child turned `screen_panel` into an error naming `detailsMaxBytes` with an empty ledger · edge-screener desk tests 10 (ruff/mypy clean on the new modules; mypy has 81 pre-existing errors in `tests/firm/`, untouched). Screenshots (light, dark, chart tooltip, table view) inspected: tape/personas/reports panels, panel table, side card with relative evidence refs, weekly OOS chart with legend.

**Screenshot-driven fixes:** evidence refs were machine-absolute (`/Users/…`) → relative to the repo; card values now carry the report's printed figures (`1.000`, `0.0000`) instead of re-rounded numbers; percent cells stay as printed (`-33.3%`) everywhere.

### 11.7 Adversarial build review (pi gpt-5.5 via Codex) and adjudication

**Round 1 → REWORK** (`~/nana-pi/docs/reviews/agent-frontend-2026-09-04/edge-r1.md`). Findings and what was done:
- MAJOR `/api/data/*` was a GET with no Origin rule → another site's `<img>`/`<script>`/fetch could trigger local command runs → **fixed**: the route accepts only `Sec-Fetch-Site: same-origin|none` (or no header: curl) and refuses a foreign `Origin`; listener tests cover cross-origin fetch, cross-site img-style GET, same-origin, typed URL.
- MAJOR first-turn direct-tool readiness was a 6-second sleep in the e2e → **fixed**: the desk hands the app session its manifest tools (`NANA_STAGE_EXPECT_TOOLS`); `nana-stage` polls `pi.getActiveTools()` from `session_start` and reports `waiting` → `ready` / `missing: …` on the RPC status channel (`statusKey nana-tools`, 30 s bound); the listener holds `POST /api/session` until the report, refuses `POST /api/prompt` with 409 while `waiting` or `missing`, and exposes `tools` on the session; the page shows the state; the e2e asserts `desk_hello.statuses["nana-tools"] === "ready"` — observed, never defaulted. A child that never reports (stub pi, no nana-stage) reads `ready`, which the real-chain test would catch as a missing report.
- MINOR project `outputGuard` shallow-merges over global → recorded in §11.6 as an operating note: `.pi/mcp.json` must state the whole `outputGuard` object.
- MAJOR chart dates only pattern-checked (`2026-99-99` passed, renderer got NaN) → **fixed**: real-calendar round-trip check. MAJOR all-null series passed → **fixed**: a chart needs at least one finite y. MINOR per-series cap vs byte cap → **fixed**: `MAX_CHART_POINTS_TOTAL = 2400`, tested to fit the byte cap.
- MAJOR the panel's derived `survivorship` column cited the corrected-verdict line, not the survivorship report → **fixed by subtraction**: the column is gone; the PIT band lives on the screen card with its own reference; every table row now shows its `source` line.
- MINOR panel numbers re-rounded (`1.000` → `1.00`) → accepted for the table (typed numbers align and sort; the scope says so and the source column names the printed figure); cards carry printed figures.
- MAJOR no browser assertion that `agent:changed` reaches `app.js` → **fixed**: `stage-page-edge.e2e.mjs` (stub pi, the real edge page) asserts shelf refetch on a mutating tool, no refetch on a non-mutating one, chart render, table view, reload replay. MINOR data-timeout path untested → **fixed** (injectable timeout, 504 asserted).
- MAJOR transferability: reviewer's ruling — record the host seam as a design gap the design named but failed to specify, not an app-bespoke failure; record the missing Python validator as a deviation from the written contract → **both amended in §1/§5** (one canonical validator; the page/data seam is now specified kit).
- MINOR subtraction: persona roster panel and chart table view questioned → roster kept for Jake's feel verdict (his personas are the firm's mental model; one click composes the direction-board prompt); table view kept — the dataviz rule requires a table view for every chart.

**Round 2 → REWORK** (`edge-r2.md`): all chart/evidence/test fixes confirmed FIXED; two of the round-1 fixes were themselves fail-open:
- MAJOR readiness defaulted to `ready` when no report arrived → **fixed**: the desk owns the state — a child spawned with expected tools is `waiting` until nana-stage reports, `unreported` after the bound (35 s), never assumed ready; prompts are 409-refused unless `ready`; the listener test spawns a SILENT child and asserts `unreported` + 409; both browser stubs now emit the `waiting → ready` transition and the edge page test asserts send is enabled only after it.
- MAJOR `/api/data/*` trusted an absent `Sec-Fetch-Site` → **fixed by removing the GET**: data refresh is `POST /api/data/<key>` with a JSON body under the same Origin + content-type rule as every mutating route (a cross-site `<img>`/`<script>`/form cannot produce it); tests: GET → 404, cross-origin POST → 403, `text/plain` → 403, same-origin JSON → 200, curl → 200.
- MINOR a 409 lost the typed prompt → **fixed**: send is disabled while tools are not ready, the page re-polls the session while `waiting`, and a refused prompt goes back into the box. MINOR the edge page e2e ran on the default-ready path → **fixed** (stub reports the transition).
- NOT FIXED, accepted: adapter `outputGuard` shallow merge (adapter code; operating note stands — state the whole object in `.pi/mcp.json`); panel numbers typed for alignment with the printed figure one click away in `source`; roster panel and chart table view kept (§11.7 round 1).

**Round 3 → REWORK** (`edge-r3.md`): round-2 fixes confirmed for startup and for the GET route; two residual edges:
- MAJOR readiness was one-shot — after `ready`, a later hot-swap or drop of the adapter's direct tools went unnoticed → **fixed**: nana-stage keeps watching `getActiveTools()` (200 ms until ready, then every 2 s) and downgrades to `missing: …` on disappearance; the desk's 409 gate then refuses prompts until the tools return. One watcher per process (a resume re-enters `session_start`).
- MAJOR the shared Origin rule checks `content-type` only when a body is present, so a body-less simple POST from a no-Origin client could reach `/api/data/*` → **fixed**: that route demands `application/json` unconditionally; tests add body-less no-content-type and form-content-type POSTs → 403.
- MINOR a child exiting mid-wait answered `200` with `tools: waiting` → **fixed**: `POST /api/session` answers 502 naming the exit; a dying stub child is tested.
- Caught by the real-chain test while fixing the above: pi AWAITS extension event handlers, so an always-on watcher awaited inside `session_start` blocked the session forever (turn never settled). The watcher is now started detached from the handler. A stub-pi test cannot see this class; the real-chain e2e is the only net for it.

**Round 4 → LAND** (`edge-r4.md`): all three round-3 findings confirmed FIXED. Two MINOR residuals: (1) the detached watcher had no rejection boundary → **fixed** (a throw downgrades to `missing: watcher error …` and polling continues); (2) after `ready`, the 2 s poll leaves a window in which one prompt can pass before a vanished tool is noticed — accepted as a bounded residual, no worse than a tool disappearing mid-turn; closing it would need prompt-time revalidation.

**What four rounds taught (for slice 1b and the next app):** every round-1 fix I wrote for a *security-shaped* finding was itself fail-open in the direction the reviewer had not yet looked (a default of `ready`, a header whose absence was trusted, a guard conditional on body presence). The pattern to carry: a gate's default state is the finding's answer, not a convenience; and only the real-chain test sees handler-blocking and readiness classes — stubs cannot.

## Addendum 2026-09-08 — hardening pass

**Addendum 2026-09-09 — the signing key is the SESSION's (design B).** §3.1/§3.2 said the desk hands each app child a per-session key; in the code it was per *child*, so a desk restart or a resume minted a new one and every `nana-block` already on disk failed the ledger check — the stage went blank while the blocks sat intact in the session file. Design B writes the issuance down: `~/.pi/agent/nana-desk/stage-keys.json` (`0700` dir, `0600` file, temp-file-then-rename), `{"v":1,"sessions":{"<pi session id>":{"keys":[…],"updatedAt":…}}}`, keyed by the pi session header `id` rather than the file path because a session file gets renamed on a title append and resumed by its new name. A spawn that resumes a known session reuses that session's most recent recorded key; a new session's key is recorded as soon as `get_state` names the session id. **A child still signs with exactly one key, and the live `tool_execution_end` path still verifies against that one key only.** Only the LEDGER read widens, to any-of-recorded-keys for the session the child currently holds — which is what makes restart, resume, an in-child `switch_session` and a fork all verify, and is no weaker than the single key for the threat model: the adversaries this defends against (a co-resident extension re-injecting a carrier, a hand-edited session file) hold none of the desk's keys, and the desk process could mint any of them anyway. Fork and clone need one extra step: pi copies the source session's ledger entries into a new file under a new header id, so the desk seeds the new record from the id the same child was observed holding immediately before — its own observation at the RPC that moved it, never the `parentSession` text in the file, which a session file is not authority for. If the child's current session cannot be read at all, the ledger read narrows to that child's key alone rather than reusing the last id it saw. **State the claim precisely, because it is narrower than "this block came from that session":** a ledger block passes iff it was signed with a key this desk minted and wrote into its own store for the session the child *reports* holding. Session identity is not cryptographically bound — the reported id is self-declared, one key can be handed to several children over time, and the store is a plain file any process running as the user can read. Against the threat this was built for (a second extension, a hand-edited file, a page) that is exactly as strong as the per-child key it replaces; it is not an authenticated statement of origin, and nothing here should be read as one. Blocks signed before this landed stay redacted — their keys were never written down, and "accept unverifiable" was never on the table. **One narrowing is traded away and is declared rather than hidden:** the record is keyed by session, not by app, so when two app manifests' children hold the same session file — by naming the same `session` outright, or by being driven into it with `switch_session` — either child's key vouches for that session's blocks. Continuity is also bounded and will bite: 8 keys per session, 512 sessions in the file, and sessions whose file is gone are forgotten. The store is written under a cross-process lock (`stage-keys.json.lock`, stale after 30 s) because a plain read-merge-write lets two desks rename their own merge over each other's and silently drop one desk's issuance. Pinned by `apps/desk/test/stage-key-persistence.test.mjs` (restart, rename, `switch_session`, forged and foreign-key negatives, store file properties).

The §11.6 "Verified" counts are the slice-2 close and stay as recorded there. After the 2026-09-08 hardening pass (five commits; per-package `gpt-5.6-sol` reviews, then `53d4aab` folding a whole-unit `gpt-6-astra` review) the stage-side tests are `packages/nana-stage/tests/blocks.test.mjs` — **112 checks** (81 before the pass, commit 58645c5) — plus a new browser test `apps/desk/test/stage-render-edge.e2e.mjs` (11 checks, real page + stub pi) pinning the chart-tooltip XSS invariant and the blank-stage case. The block-contract changes from that pass are declared in §3.1; desk-side status is `docs/review-punchlist-2026-09-08.md`.
