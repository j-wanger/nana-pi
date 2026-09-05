# Adversarial review brief — UI-centric frontend slice 2: the edge desk

You are an independent, adversarial reviewer. The author is an AI seat; assume it made mistakes and find them. Read the files listed; do not trust the summary. Cite file:line for every finding.

## What was built (author's claim)

Slice 2 of the UI-centric agent frontend (design: `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md`, §11 is this slice). A research desk over `~/edge-screener`: a Python MCP server returns code-authored presentation blocks (`structuredContent.blocks`); `pi-mcp-adapter` (direct tools from `edge-screener/.pi/mcp.json`, `directToolResultDetails: "bounded"`) exposes them under `details.mcpResult`; the `nana-stage` pi extension validates, stamps, signs, ledgers them and replaces the tool text with a canonical rendering; the desk server's per-app listener serves the app's own page plus three "data" routes that run manifest-declared commands for app-owned durable state.

Kit changes (nana-pi):
- `packages/nana-stage/lib/blocks.mjs` — new `chart` block type (line series, ≤4 series, ≤1000 points, monotonic x, finite/null y) + `summarizeSeries`/`fmtY` text rendering.
- `apps/desk/public/stage/stage.js` — `renderChart` (inline SVG, hover, table view), `agent:changed` DOM event when a manifest-`mutating` tool finishes, per-app quick prompts.
- `apps/desk/public/stage/stage.css` — chart styles.
- `apps/desk/apps.mjs` — manifest `page` (serve an app's index.html/app.js/app.css), `data` (GET /api/data/<key> runs a fixed argv in the app cwd, 20 s timeout, JSON relay), `quick`.
- `apps/desk/server.mjs` — passes `childEnv` to the listener deps.
- Tests: `packages/nana-stage/tests/blocks.test.mjs`, `apps/desk/test/app-listener.test.mjs` (page/data cases), `apps/desk/test/stage-chain-edge.e2e.mjs` (REAL pi + adapter + MCP chain incl. an over-cap child).

App side (edge-screener):
- `src/edge_screener/desk/reports.py` (markdown-table reading with line refs), `blocks.py` (builders), `data.py` (tape/shelf/roster JSON), `mcp_server.py` (mcp 2.x `MCPServer`, tools return `CallToolResult` with one-line text + structured blocks).
- `scripts/desk_oos_series.py` (offline precompute → `reports/desk/oos-<screen>.json`), `desk/index.html|app.js|app.css` (the page), `.pi/mcp.json` (adapter config: direct tools, no prefix, eager, detailsMaxBytes 65536), `tests/unit/test_desk_blocks.py`.
- Manifest (outside repos): `/Users/jwang/.pi/agent/apps/edge.json`.

## Dimensions — report PASS or FINDING (severity: BLOCKER / MAJOR / MINOR) for each

1. **Provenance & trust boundary.** Can the model author or alter a block on this path? Can a page on another origin call `/api/data/*` or read another app's data? Is anything client-supplied reaching the data command (query string, headers, body)? Are `page`/`data` manifest keys as trusted as `extensions` and is that stated? Does serving `app.js` from a repo dir widen anything the design's threat model (§8) excluded?
2. **The MCP seam.** `directToolResultDetails: "bounded"` + `outputGuard.detailsMaxBytes: 65536` in a PROJECT `.pi/mcp.json`: is the settings merge order such that a global `~/.pi/agent/mcp.json` could silently override the cap? Does `toolPrefix: "none"` risk name collisions with built-ins or other servers? First-run behaviour: direct tools register from the adapter's metadata cache; is there a path where the app session's first turn has no tools and the model calls the `mcp` proxy instead (which the `-t` allowlist does not include)? Is the `CallToolResult` return honest about output schema (none advertised) — does the adapter validate structuredContent against a missing schema?
3. **Chart validator.** Find inputs that pass `validateBlock` for `chart` but break `renderChart` or `renderBlockText` (empty after null-filtering, single point, all-null series, x as number vs date mixed across series, huge/small magnitudes, identical x values, unicode labels). Is `MAX_CHART_POINTS` consistent with `MAX_BLOCK_BYTES` and the adapter cap?
4. **Evidence fidelity.** Table cells carry `_ref` `path:line`; card fields carry `evidence`. Does every displayed number trace to the line it cites? Are there derived or reformatted values that a reader could mistake for the report's (the `survivorship` column, percent handling, `_num` rounding)? Does `explore_table`'s `_ref` `:7` actually point at the "would hold" line of the report it writes?
5. **Mutation confinement.** `explore_table` writes under `reports/explore/`; can `screen` reach a path (traversal via the screen name)? Does the manifest `mutating` list match every tool that writes? Is `pull` (network) reachable from the app session?
6. **Tests.** Do the tests assert the right invariants or just the implementation? What is untested that could fail in use (the data route timeout, page-dir file types, the dark theme, `agent:changed` reaching `app.js`, the shelf refresh)? Is the e2e's 6-second sleep before the first turn a hidden flake?
7. **Transferability verdict (§5 of the design).** The design said slice 2 fails if `nana-stage` or the host needs a change beyond adding a block type. The host gained `page`, `data`, `quick` manifest keys and the `agent:changed` event; the kit's Python validator was NOT built (Python producers test against the one JS validator via node instead). Rule on this honestly: design failure, design gap that the design itself named ("app API / store", "its page") but never provided, or acceptable? State what you would record.
8. **Subtraction.** Anything here that does not earn its complexity (the Python `data.py` shelf grouping, the chart table view, the persona roster panel, the `quick` key)?

## Files to read (all of them)

nana-pi: `/Users/jwang/nana-pi/packages/nana-stage/lib/blocks.mjs`, `/Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts`, `/Users/jwang/nana-pi/apps/desk/apps.mjs`, `/Users/jwang/nana-pi/apps/desk/public/stage/stage.js`, `/Users/jwang/nana-pi/apps/desk/public/stage/stage.css`, `/Users/jwang/nana-pi/apps/desk/test/app-listener.test.mjs`, `/Users/jwang/nana-pi/apps/desk/test/stage-chain-edge.e2e.mjs`, `/Users/jwang/nana-pi/packages/nana-stage/tests/blocks.test.mjs`, `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md` (§3, §5, §8, §11).
edge-screener: `/Users/jwang/edge-screener/src/edge_screener/desk/reports.py`, `blocks.py`, `data.py`, `mcp_server.py` (same dir), `/Users/jwang/edge-screener/scripts/desk_oos_series.py`, `/Users/jwang/edge-screener/desk/index.html`, `app.js`, `app.css` (same dir), `/Users/jwang/edge-screener/.pi/mcp.json`, `/Users/jwang/edge-screener/tests/unit/test_desk_blocks.py`, `/Users/jwang/edge-screener/reports/edge-verdict-corrected-live.md` (to check refs).
manifest: `/Users/jwang/.pi/agent/apps/edge.json`.
adapter (for dimension 2): `/Users/jwang/.pi/agent/npm/node_modules/pi-mcp-adapter/config.ts` (getMergedSettings, getConfigSources), `direct-tools.ts`, `mcp-output-guard.ts`.

## Output format

For each dimension: `## <n>. <name> — PASS | FINDING` then bullets `- [BLOCKER|MAJOR|MINOR] <file>:<line> — <what> — <why it matters> — <fix>`. End with `VERDICT: LAND | REWORK` and one paragraph. Be concrete; no praise.
