### G1 — PASS

1. **Invalid block carriers — CLOSED:** failure strips the carrier, success replaces it with validated/stamped blocks, and slice 1 tests both the emitted event and live path (`agent-frontend-design-2026-09-04.md:97,174,177`).  
2. **Headless settlement — CLOSED:** termination now waits for `agent_settled`, with retry and queued-follow-up coverage correctly deferred to slice 1b (`agent-frontend-design-2026-09-04.md:135,179`).  
3. **Text/block correspondence — CLOSED:** model-facing content is solely the canonical rendering, with supplemental material constrained to the rendered, code-authored `note` (`agent-frontend-design-2026-09-04.md:79,93`).  
4. **Scheduled/static contract — CLOSED:** `/api/run` now defines settlement, timeout, rendering ownership, output path, response, and is wholly deferred to slice 1b (`agent-frontend-design-2026-09-04.md:138-140,179`).  
5. **Deterministic tests — CLOSED:** v5 adds malformed live-path, route-enumerated Origin, lifecycle, prerecorded branch, and semantic snapshot tests in their correct slices (`agent-frontend-design-2026-09-04.md:174-179`).

### G2 — FINDING (MAJOR)

Three pi payload assertions need correction before slice 1 implementation. `tool_execution_end` carries blocks at `event.result.details.blocks`, not `event.details.blocks`, so the live reducer and tests currently point implementers at the wrong path; additionally, a `tool_result` content patch is an array of content parts, not the string shown on the failure path (`agent-frontend-design-2026-09-04.md:97,104,174`; `docs/rpc.md:1040-1051`; `docs/extensions.md:848-873`). Separately, `get_state` has no `tools` field, making the proposed “bash absent from `get_state` tools” safety test impossible as written; verify the exact spawn arguments and, if runtime confirmation is required, use controlled extension-side `pi.getActiveTools()` introspection (`agent-frontend-design-2026-09-04.md:175`; `docs/rpc.md:185-216`).

### G3 — FINDING (MINOR)

Two one-line cautions would preserve the stated guarantees: require `nana-stage` to be the final `tool_result` mutator—or revalidate after later handlers—because handlers chain in extension load order, and state a size/row limit for extension-produced blocks because only the deferred MCP path currently has a documented cap (`agent-frontend-design-2026-09-04.md:91,97`; `docs/extensions.md:848-851`).

**VERDICT: REWORK**

1. Use `event.result.details.blocks` throughout the live reducer and tests, and express `tool_result.content` patches as text-content arrays.
2. Replace the nonexistent `get_state.tools` assertion with an executable allowlist test.
3. Document/enforce `nana-stage` hook ordering and extension-block size bounds.
