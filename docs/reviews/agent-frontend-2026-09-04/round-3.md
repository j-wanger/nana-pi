## C1 — FINDING (BLOCKING)

1. **App isolation — OPEN:** all apps share `:7318`, so a page can simply request app B’s named routes, while cross-origin `text/plain` POSTs can still reach the unchanged desk listener because it performs no Origin/content-type check (`agent-frontend-design-2026-09-04.md:110-127,172`; `apps/desk/server.mjs:929-946,997-1009,1048-1137`).
2. **MCP block transport — PARTIAL:** `details.mcpResult.structuredContent.blocks` is valid in bounded mode, but an oversized result becomes an omission summary rather than the claimed validation failure (`agent-frontend-design-2026-09-04.md:90`; `pi-mcp-adapter/direct-tools.ts:583-587`; `pi-mcp-adapter/README.md:465-474`).
3. **Branch-aware replay/session tracking — PARTIAL:** `leafId` ancestry correctly excludes abandoned branches, but “whenever the child reports a new session file” lacks a polling/event trigger because session changes do not emit `sessionFile` (`agent-frontend-design-2026-09-04.md:101,123`; `docs/rpc.md:717-746`).
4. **Provenance — CLOSED:** tool arguments, mandatory human-readable scope, and visibly interpretive model narrative now address the requested disclosure contract (`agent-frontend-design-2026-09-04.md:66-90`).
5. **Headless denial and missed gates — CLOSED:** trust and attendance are separated, cancellation has documented fail-closed semantics, and the server-owned durable ledger needs no Pi command (`agent-frontend-design-2026-09-04.md:123-125`; `docs/usage.md:120-130,245-250`; `docs/rpc.md:1368-1370`).
6. **Pre-feel tests — PARTIAL:** replay and gate tests moved before the feel check, but the proposed isolation tests only enumerate `:7318` and cannot prove either cross-app ownership or protection of `:7317` (`agent-frontend-design-2026-09-04.md:159-164`).

## C2 — FINDING (BLOCKING)

Three new claims are supported: `-a/-na` govern project trust only (`docs/usage.md:120-130,245-250`); a server can cancel dialogs and maintain its own missed-gate file without Pi persistence (`docs/rpc.md:1184-1191,1368-1370`); and `leafId` plus `parentId` supports an ancestry reducer (`docs/rpc.md:717-746`). Two are not fully supported. First, origin separation cannot be “the whole policy”: every app shares one app origin, and same-origin requests can name another app directly; moreover browser origin isolation prevents reading cross-origin responses, not simple state-changing requests to the unchanged desk listener (`agent-frontend-design-2026-09-04.md:121,127,172`). Second, bounded mode exposes raw `mcpResult` only while the entire MCP result fits the 16 KiB cap; overflow yields summarized/omitted structured content, not a block passed to schema validation (`pi-mcp-adapter/README.md:465-474`; `pi-mcp-adapter/direct-tools.ts:583-587`).

## C3 — FINDING (MAJOR)

Attendance and lifecycle remain under-specified. `attended` is a static manifest property even though one app is supposed to alternate between browser-driven and scheduled turns; an attended session with no browser can remain blocked indefinitely, while a headless session stays headless when a page later opens (`agent-frontend-design-2026-09-04.md:28,123-125,139`). Likewise, Pi exposes `sessionFile` through an explicit `get_state` response, not a session-change event, so manifest rewriting after new/resume/fork needs a concrete trigger and atomic update rule (`apps/desk/server.mjs:780-790`; `docs/rpc.md:160-181`). Finally, “text and stage never diverge” is only an assertion: the validator checks the block but does not compare it with textual content (`agent-frontend-design-2026-09-04.md:90,94`).

## C4 — FINDING (MAJOR)

The functional order is substantially improved: extraction, contract tests, constrained spawning, real tools, live/reload/fork/headless parity, adversarial review, then feel check is the right sequence (`agent-frontend-design-2026-09-04.md:157-164`). It is not yet trustworthy because step 3’s tests miss both actual escape paths: app A calling `/api/apps/B/...` on the shared origin and app pages issuing cross-origin state-changing requests to `:7317`. Those must be deterministic negative tests before the gate/session slice reaches Jake.

**VERDICT: REWORK**

1. Replace app-name-only ownership with an enforceable binding—per-app origin or unguessable capability—and reject cross-app requests.
2. Add Origin enforcement and non-simple content-type/CSRF protection on the legacy desk listener, with adversarial cross-origin POST tests.
3. Define MCP overflow behavior: detect `mcpResult.omitted`, return an explicit stage error, and pin/test adapter settings and total-result size limits.
4. Define how attendance changes between scheduled and browser turns, including disconnected-client timeout behavior.
5. Specify when `get_state` is queried and how manifest `session` is atomically updated after every session transition.
6. Add a canonical or tested correspondence rule between model-facing text and rendered block data.
