## R1 Closure — FINDING (BLOCKING)

D1 **CLOSED**: v2 adds manifest identity, app-specific lookup, and makes client extraction explicit (`agent-frontend-design-2026-09-04.md:97-110`). D2 **PARTIAL**: removing refs and model-authored projection closes the original fabrication mechanism, but MCP results do not arrive as the claimed `details.blocks` (`agent-frontend-design-2026-09-04.md:87-92`; `pi-mcp-adapter/direct-tools.ts:535-588`). D3 **PARTIAL**: custom entries provide durable storage, but replaying all `get_entries` also replays abandoned branches, and manifest session updates are unspecified (`docs/rpc.md:717-746`; `docs/session-format.md:289-312`; `agent-frontend-design-2026-09-04.md:117-123`). D4 **PARTIAL**: the data inventory and slice-2 transferability criterion are corrected, but the promised MCP seam cannot currently carry blocks (`agent-frontend-design-2026-09-04.md:129-140`). D5 **CLOSED**: v2 is reduced to two blocks, one page, and tool-materialized results (`agent-frontend-design-2026-09-04.md:143-151`). D6 **OPEN**: manifest spawning does not prevent app pages from invoking the existing global spawn and child routes, while headless missed-gate persistence lacks an implementable path (`apps/desk/server.mjs:988-1009,1048-1137`; `agent-frontend-design-2026-09-04.md:109-112`).

## R2 New mechanism claims — FINDING (MAJOR)

The basic Pi claims check out: MCP direct/proxy tools are registered with `pi.registerTool`, so normal `tool_result` middleware sees them (`pi-mcp-adapter/index.ts:272-287,732`); a handler may return `{isError:true}` (`docs/extensions.md:842-865`); `appendEntry` creates custom entries returned by `get_entries` (`docs/extensions.md:1471-1487`; `docs/rpc.md:717-746`); `-t` filters extension/custom tools, including dynamically registered adapter tools (`docs/usage.md:299-306`; `dist/core/agent-session.js:2101-2164`); and `desk_hello` contains pending dialogs (`apps/desk/server.mjs:1021-1022`). The unsupported claim is the block transport: the adapter converts MCP structured output to text and returns adapter-owned details; raw MCP data is only optionally nested under `details.rawMcpResult`, not exposed as `details.blocks` (`pi-mcp-adapter/direct-tools.ts:535-588`). Therefore slice 2 cannot exercise MCP-produced blocks without a specified adapter configuration and extraction mapping.

## R3 Provenance — FINDING (MAJOR)

The model can still mislead by choosing a selectively scoped query, omitting relevant calls, or writing drawer narrative that contradicts or overstates the block; identical source data does not ensure identical interpretation (`agent-frontend-design-2026-09-04.md:82-87`). “Tool name and arguments are on the block” is also factually inconsistent with the schema: `produced_by` contains tool, call ID, and time, but no arguments (`agent-frontend-design-2026-09-04.md:66,83`). Even visible raw arguments would not adequately disclose query scope, freshness, omitted alternatives, or why the agent selected that query; blocks need explicit human-readable scope/provenance, and model narrative must remain clearly marked as interpretation.

## R4 Slice 1 (§6) — FINDING (MAJOR)

The implementation order is broadly sound—extract client, establish contract, add constrained spawning, then tools and host—but the feel check can pass through live events while the claimed durable product is broken. Before Jake’s check, slice 1 needs an end-to-end test that produces a real block, reloads through `get_entries`, follows the active `leafId` ancestry, and verifies replacement/clear semantics; the current byte-stable fixture and one collapsed-drawer gate test do not exercise those paths (`agent-frontend-design-2026-09-04.md:143-151`; `docs/rpc.md:717-746`). It also needs manifest tool-denial and app-route isolation tests because this slice modifies session and gate surfaces despite being described as “zero blast radius.”

## R5 Subtraction — FINDING (MINOR)

TUI “`renderResult` parity” does not earn its complexity in the browser feel slice and is specified against the wrong extension surface: `renderResult` belongs to a registered tool, while `nana-stage` registers no tools; custom ledger entries instead use `registerEntryRenderer` (`agent-frontend-design-2026-09-04.md:91-95`; `docs/extensions.md:1620-1635,2240-2242`). The `/stage` command likewise adds an entry type whose replay semantics are never defined. Defer TUI parity or implement it as an entry renderer, and either specify `nana-stage-clear` in the ledger reducer or omit the command.

## R6 Blast radius (§3.4, §8) — FINDING (BLOCKING)

The manifest entry point is insufficient because every app page is served from the same unauthenticated origin and can still call `/api/spawn`, `/api/live`, `/api/session/:id/bash`, RPC/UI-response, abort, or DELETE for any known child; saying `/api/spawn` is “not reachable” is not enforced by routing or capability checks (`apps/desk/server.mjs:988-1009,1048-1137`; `agent-frontend-design-2026-09-04.md:109-112,158`). Headless cancellation is fail-closed for the waiting dialog, but `approve:"deny"` must map explicitly to `--no-approve`, not the current truthy `-a` behavior (`apps/desk/server.mjs:127-139`), and the server has no RPC command for appending `nana-gate-missed`; once cancelled, the dialog is no longer pending and therefore cannot automatically appear in a later gate bar. This requires capability-bound app routes, child ownership enforcement, and an explicit durable missed-gate protocol.

**VERDICT: REWORK**

1. Make app isolation enforceable: capability-bound app routes, app-owned child checks on every session operation, and no access from app pages to legacy spawn/live/bash/delete surfaces.
2. Define MCP block transport—adapter configuration plus exact mapping from MCP structured content into validated `details.blocks`—and test it.
3. Make ledger replay branch-aware using `leafId`/parent ancestry; define clear/update semantics and session-file tracking after new/resume/fork.
4. Add explicit query arguments and human-readable scope/freshness to provenance; keep model narrative visibly interpretive.
5. Specify headless denial separately from project trust, durably record missed gates, and define how attended clients surface them.
6. Move the live produce→reload→replay and tool-denial/isolation tests before the feel check; defer or correct TUI parity.
