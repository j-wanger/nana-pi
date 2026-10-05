# nana-stage

The stage ledger behind a UI-centric agent frontend: when a tool returns code-authored
**blocks** (a table, a card, a chart), this package validates them at the tool boundary,
stamps and signs their provenance, appends them to pi's session as durable `nana-block`
entries, and replaces the tool's text with the canonical rendering — so the model reads
exactly what the screen shows. The model never authors a block.

## Install

Not installed on its own, and **not** part of the user-scope pack: the root `package.json`
manifests `packages/nana-pack` and `packages/nana-knowledge` only. The desk loads this
extension **per app**, from this checkout, by naming it in an app manifest — so it is active
for the app children the desk spawns and nowhere else. It has no npm dependencies; pi is an
optional peerDependency (the extension runs inside pi, and `lib/blocks.mjs` runs unchanged in
a browser and in node).

## Usage

Two modules, one extension:

| File | What it is |
|---|---|
| `lib/blocks.mjs` | the pure block contract — `validateBlock` (schema + the size caps), `renderBlockText` (the canonical model-visible text), `extractBlocks` (find the carrier in a tool result's `details`, for pi-extension tools, or `structuredContent`, for pi's built-in MCP tools), `reduceEntries` (session entries → the stage). Zero deps, no I/O, runs in the browser too |
| `lib/sign.mjs` | `signBlock` / `verifyBlock` / `canonical` — HMAC-SHA256 over a block's sorted-key JSON (`produced_by.sig` excluded), keyed by the per-session `NANA_STAGE_KEY` the desk hands each app child |
| `extensions/nana-stage.ts` | the pi extension: hooks `tool_result` for every tool, validates, stamps `produced_by`, signs, appends one `nana-block` entry per block, and patches the tool's text. Registers no tools and no commands |

Caps are declared once in `lib/blocks.mjs` and enforced at the boundary: `MAX_BLOCK_BYTES`
(64 KiB), `MAX_TABLE_ROWS` (500) and `MAX_CHART_POINTS_TOTAL` (2400) across all series. An
invalid or over-cap block comes back as an `isError` tool result **with the carrier stripped**,
so it never rides into a live stage.

Two environment variables, both read and then **deleted** at load so tool subprocesses never
inherit them: `NANA_STAGE_KEY` (the signing key) and `NANA_STAGE_EXPECT_TOOLS` (the tool list
the readiness watcher waits for). Without a key — plain TUI use — blocks are stamped but
unsigned; the desk server is what refuses unsigned blocks, on the live event and on the ledger
read alike (`apps/desk/apps.mjs` imports `verifyBlock` from here).

**Built-in MCP (edge-builtin-mcp lane, 2026-10-04):** `pi-mcp-adapter` is gone. An MCP tool's
blocks now arrive at `structuredContent.structuredContent.blocks` — pi's built-in MCP puts the
server's own `CallToolResult` at the tool_result event's `structuredContent`, so the server's
`{"blocks": [...]}` sits one level down (R-282, supersedes `retired` R-263). `extractBlocks`
checks `details.blocks` (pi-extension tools, e.g. basketball) and that built-in carrier, in that
order. On success AND on rejection, the patch never sets `structuredContent` (R-283, R-284):
pi deletes a tool result's `structuredContent` when a handler replaces `content` without also
returning it (pi's own extension runner, `emitToolResult`), so the raw, unstamped MCP carrier
never rides `tool_execution_end` into a live stage — proved live over the real RPC chain by
`apps/desk/test/stage-chain-edge.e2e.mjs`. There is no built-in equivalent of the adapter's
`outputGuard.detailsMaxBytes` cap: pi never truncates or omits `structuredContent` (only the
model-facing text, at 20 KB), so that scenario (`retired` R-278) has no replacement — no residual.

Design: `docs/agent-frontend-design-2026-09-04.md` §3.1 (the contract) and §3.2 (the ledger).

## Tests

```bash
npm test -- nana-stage     # from the repo root; zero-dep, deterministic, no model calls
```

`tests/blocks.test.mjs` covers the contract and the hook logic together: validation and every
cap, the canonical rendering and its byte clamp, carrier extraction and stripping, the entry
reduction, and sign/verify round-trips including a forged signature.
