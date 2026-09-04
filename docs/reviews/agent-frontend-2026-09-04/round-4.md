### F1 — FINDING (MAJOR)

Of the six round-3 fixes: **1 App isolation — CLOSED**, because each manifest now owns a distinct `127.0.0.1:<port>` origin and an unnamed, single-child route table; **2 Legacy-desk CSRF — CLOSED**, because the stated Origin/content-type rule addresses browser cross-origin writes under the declared localhost threat model; **3 MCP overflow — CLOSED**, because omission is detected and tested consistently with the adapter’s bounded-result behavior; **4 Attendance — CLOSED**, because mode is now determined per turn and attended dialogs never auto-decline; **5 Session tracking — CLOSED**, because spawn is the only v0 transition and explicitly triggers `get_state` followed by atomic replacement; **6 Text/block correspondence — PARTIAL**, because deterministic block text is generated but arbitrary original text is appended and can still contradict it (`agent-frontend-design-2026-09-04.md:90-96,110-138`; `pi-mcp-adapter/README.md:465-474`; `docs/rpc.md:160-181`).

### F2 — FINDING (BLOCKING)

Per-port origins, Origin plus JSON-content enforcement, per-turn attendance, and post-spawn `get_state`/atomic manifest writing are sound for the stated threat model. Two claims are wrong. First, malformed blocks can still reach the live stage: the failure return changes only `content` and `isError`, while omitted `details` fields are retained; therefore the original invalid `details.blocks` remains on the subsequent `tool_execution_end`, which the live reducer consumes without validation (`agent-frontend-design-2026-09-04.md:96,103`; `docs/extensions.md:842-873`). Second, a headless child must not exit at `agent_end`: that event may precede automatic retry, compaction retry, or queued continuation; `agent_settled` is the documented terminal event (`agent-frontend-design-2026-09-04.md:134`; `docs/rpc.md:864-905`; `docs/extensions.md:569-580`). The correspondence claim is also overstated because appending unrestricted original text means the model does not read “exactly what the stage renders” (`agent-frontend-design-2026-09-04.md:92`).

### F3 — FINDING (MAJOR)

The scheduled/static path remains implementation-stalling: `/api/run` does not define whether its response waits for settlement, what it returns, where generated HTML is written, or who invokes `stage-html.mjs`; the document merely states that scheduled turns produce a file while the deliverables build an independent CLI (`agent-frontend-design-2026-09-04.md:124,132-136,109,175`). Either specify that contract and wire it into slice 1, or defer `/api/run`, missed-gate scheduling, and static generation together; the Python validator and MCP-overflow work can likewise wait for slice 2 because slice 1 uses extension tools only (`agent-frontend-design-2026-09-04.md:90,154,172`).

### F4 — FINDING (MAJOR)

The order is broadly correct, but the tests are not yet sufficient. Add a malformed-block live-path test proving invalid carrier fields are removed before `tool_execution_end`; test headless completion across retry/compaction or queued continuation and exit only after `agent_settled`; test the Origin guard as centralized policy across every state-changing method, including existing bodyless `DELETE` routes rather than only `/api/spawn`; and define a semantic snapshot for static/live equality plus how the branch-only fork fixture is created despite app listeners exposing no fork route (`agent-frontend-design-2026-09-04.md:168-176`; `apps/desk/server.mjs:997-1238`; `docs/rpc.md:717-746,893-910`).

**VERDICT: REWORK**

1. Strip or replace block-bearing `details` on validation/overflow failure, and make live rendering consume only explicitly validated/stamped blocks.
2. Terminate headless children after `agent_settled`, with retry/continuation coverage.
3. Make model-facing content solely the canonical block rendering, or formally constrain and test supplemental text.
4. Define `/api/run` completion, response, HTML output path, and renderer invocation—or defer the whole scheduled/static path.
5. Expand the deterministic tests for invalid live blocks, all state-changing Origin paths, settled lifecycle behavior, and static/fork fixtures.
