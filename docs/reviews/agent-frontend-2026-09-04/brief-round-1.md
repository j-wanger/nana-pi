# Review brief — UI-centric agent frontend design

You are an independent design reviewer. The seat (Claude) authored a design doc for a second
frontend shape for pi-based agents: the app owns the screen, chat drives it. Review it for
soundness against the actual code it claims to build on. Be adversarial; pushback is wanted.

## Read first (all paths absolute)
1. /Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md — THE DESIGN under review
2. /Users/jwang/nana-pi/apps/desk/server.mjs — lines 1-60 (API surface), 95-200 (RPC allowlist, spawn), grep for MAX_CHILDREN, tool_execution
3. /Users/jwang/nana-pi/apps/desk/public/app.js — grep for tool_execution_end, extension_ui_request, renderWidgets, custom
4. /Users/jwang/.local/lib/node_modules/@earendil-works/pi-coding-agent/docs/rpc.md — "Extension UI Protocol" section and tool_execution events
5. /Users/jwang/.local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md — registerTool, details, renderCall/renderResult, sendMessage, compaction
6. /Users/jwang/family-planner/mcp_server.py — the existing app tools the design says it reuses
7. /Users/jwang/basketball-geek/README.md — the first-slice data source

## Dimensions
D1 Mechanism truth: does every seam the doc relies on exist as described (desk API, RPC events carrying tool `details`, extension dialogs in RPC mode, renderCall/renderResult, session reattach via /api/live)? Name any claim the code/docs do not support.
D2 The ref-table tooth: is "query tools return {data, ref}; present resolves ref server-side" implementable inside a pi extension? Where does the ref table live, how do MCP-served tools (family-planner is an MCP server, not a pi extension) register refs? Is there a hole where the model can still fabricate?
D3 Compaction/reload/restart: what happens to presented blocks, refs, and the stage across pi compaction, browser reload, desk restart, pi child death? Does the doc's answer hold?
D4 Transferability claim (§4): is six blocks honestly enough for the three cases, or is the claim unfalsifiable? Is the first slice (§5) the right first slice for a feel verdict?
D5 Subtraction: name anything in the design that does not earn its complexity, and anything simpler that achieves the same.
D6 Blast radius (§8): any privilege or exposure the doc misses (desk server localhost, family-planner authz, gate dialogs hidden by a folded drawer).

## Output
For each dimension: PASS or FINDING (severity BLOCKING / MAJOR / MINOR, one paragraph, cite file:line where relevant).
End with a line: VERDICT: LAND | LAND-WITH-FIXES | REWORK, followed by the ordered list of fixes.
