# H1 Closure of the three round-5 items

1. **CLOSED** — The live path now uses `event.result.details.blocks`, and `tool_result.content` patches use content-part arrays (`agent-frontend-design-2026-09-04.md:97,106,176`).
2. **CLOSED** — The nonexistent `get_state.tools` assertion is replaced by runtime inspection through a test-only extension calling `pi.getActiveTools()` (`agent-frontend-design-2026-09-04.md:177`).
3. **CLOSED** — `nana-stage` is required to be the final block-relevant mutator, while extension blocks are capped at 64 KiB and 500 rows with corresponding tests (`agent-frontend-design-2026-09-04.md:98-99,176`).

# H2 Any regression introduced by v6

**PASS.**

**VERDICT: LAND**
