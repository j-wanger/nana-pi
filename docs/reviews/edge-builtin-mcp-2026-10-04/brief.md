# Brief — the edge desk moves to pi's built-in MCP

Seat: Opus 5.5. Worker: you. Reviewer after you: gpt-6-astra through `pi-review`.
Date 2026-10-04. pi on this machine: 1.0.2 (`pi --version`).

## Goal (one falsifiable sentence)

WHEN the desk starts the edge app session, its six tools shall come from pi's built-in MCP
(no pi-mcp-adapter loaded), and every block they return shall still be validated, stamped,
signed and staged by nana-stage exactly as today.

## Where you work

- nana-pi: `~/nana-pi-wt/edge-builtin-mcp`, branch `feat/edge-builtin-mcp` (off main `d358e5d`).
- edge-screener: `~/edge-screener-wt/builtin-mcp`, branch `feat/builtin-mcp` (off `p87-setup`
  `085a3a5` — the edge desk code lives on `p87-setup`, not edge-screener's `main`; do not touch
  either of those branches).
- Commit on the two feature branches. Do not push. Do not merge.

## Do NOT touch

`~/.pi/**` (including `~/.pi/agent/apps/edge.json` and `~/.pi/agent/apps/vendor/`), `~/.claude/**`,
`~/.pi/agent/mcp.json`, the live checkouts `~/nana-pi` and `~/edge-screener`, the running desk
(launchd `com.nana.pi-desk`, ports 7317/7320/7321 — never stop or restart it). The seat applies
machine changes after landing. Write the proposed new `edge.json` into your report instead.

## Established facts (verified by the seat — do not re-derive, but do re-check anything you rely on)

1. The edge app session today: `~/.pi/agent/apps/edge.json` loads
   `~/.pi/agent/apps/vendor/node_modules/pi-mcp-adapter/index.ts` + nana-stage by path; the
   adapter reads `~/edge-screener/.pi/mcp.json` (adapter format: `directTools`, `toolPrefix: none`,
   `lifecycle: eager`, `settings.directToolResultDetails: bounded`). Tools are unprefixed:
   `screen_panel, screen_detail, construction_table, stop_table, direction_board, explore_screen`;
   `mutating: [explore_screen]`.
2. The desk spawns app sessions as `pi --mode rpc -na -t <tools> --no-skills --no-extensions -e <each>`
   (`apps/desk/server.mjs` `spawnChild`, ~L388–450) with env `NANA_STAGE_KEY` and
   `NANA_STAGE_EXPECT_TOOLS`. `-na` means pi does NOT read the project's `.pi/mcp.json` under
   built-in MCP (docs `mcp.md`: project config is read only after project trust).
3. Built-in MCP (`$(npm root -g)/@earendil-works/pi-coding-agent/docs/mcp.md`, `dist/extensions/mcp/tools.js`):
   - tools are named `mcp__<server>__<tool>` (non-`[A-Za-z0-9_]` → `_`);
   - an extension can add a server for the session with `pi.registerMcpServer(name, config)`
     (same shape as an `mcpServers` entry; `exposure: "direct"` declares the tools to the model);
   - `convertMcpResult` returns `{content, details: {server, tool, fullOutputPath?}, structuredContent: <CallToolResult minus _meta>}`
     — so the server's own structured output, and the blocks, arrive at
     `event.structuredContent.structuredContent.blocks` in a `tool_result` handler, NOT at
     `details.mcpResult.structuredContent.blocks`;
   - a `tool_result` handler that returns `content` without `structuredContent` drops it
     (`dist/core/extensions/types.d.ts` ~L956–960 and ~L1074; `dist/core/extensions/runner.js` ~L905–925);
   - text over 20 KB is middle-truncated for the model; `structuredContent` is never truncated.
     There is no equivalent of the adapter's `outputGuard.detailsMaxBytes`.
4. nana-stage reads only the adapter carrier: `packages/nana-stage/lib/blocks.mjs` `extractBlocks`
   / `stripCarrier` (~L254–283), `processToolResult` (~L341–390, including the `detailsMaxBytes`
   overflow message); `extensions/nana-stage.ts` passes `{toolName, toolCallId, input, content, details, isError}`
   — not `structuredContent`. README residual paragraph: `packages/nana-stage/README.md` L39–42.
   Requirement row: R-263 (`untested`).
5. The basketball app already uses the pattern this lane copies: an app-owned pi extension inside
   the app repo, listed in the manifest's `extensions` (`~/basketball-geek/.pi/extensions/nana-basketball.ts`).
   The desk deliberately allows an app manifest with `trust: "no-approve"` to name extensions
   inside the app's own cwd (`server.mjs` comment above `refuseProject`).
6. Other adapter mentions: `apps/desk/test/stage-chain-edge.e2e.mjs` (whole file is the adapter
   chain, incl. a 512-byte `detailsMaxBytes` overflow child); `apps/desk/public/app.js` ~L1838
   (MCP settings panel says "Bridged by pi-mcp-adapter"); `edge_screener/desk/mcp_server.py`
   docstring L6 (names `.pi/mcp.json`). `packages/nana-setup` mentions are about removal/doctor —
   leave them.
7. The user-scope `~/.pi/agent/mcp.json` has one server, `memory`, `exposure: direct`,
   `autoEnableCodemode: false`. It will also connect inside the edge app session.

## Decided design (seat) — build this unless the probe disproves it

- **edge-screener** ships `.pi/extensions/edge-mcp.ts` that calls `pi.registerMcpServer("edge", …)`
  for `uv run python -m edge_screener.desk.mcp_server` with `exposure: "direct"` and a `cwd` that
  resolves to the repo root robustly (the e2e runs a child from a temp cwd). It registers no tools
  itself. Delete the adapter-format `.pi/mcp.json` (nothing reads it any more: the adapter is gone
  at user scope). Fix the `mcp_server.py` docstring. Tool names become `mcp__edge__<tool>`.
- **nana-stage** REPLACES the adapter carrier with the built-in one: blocks at
  `structuredContent.structuredContent.blocks`; on success AND failure the patch carries no
  `structuredContent` (so pi drops the raw, unstamped carrier) and stamped blocks stay in
  `details.blocks` as today. Remove the adapter path and its `detailsMaxBytes` overflow branch
  (subtraction: no consumer remains). `extensions/nana-stage.ts` passes `structuredContent` through.
  Pi-extension tools (`details.blocks`, basketball) must be byte-identical in behaviour.
- **Requirements first** (`REQUIREMENTS.md`, the `requirements` skill rules): retire R-263 with a
  reason; add new EARS rows (one `shall` each) for the built-in carrier: extraction + stamping,
  carrier dropped from the patch on success, carrier dropped on rejection. New rows land
  `implemented` only with a `// req:` marker on a green test that would fail if the clause broke.
- **Desk**: fix the one stale panel string in `app.js` to describe pi's built-in MCP. If that panel
  writes adapter-only keys (`directTools`, `toolPrefix`, `lifecycle`, `settings.*`) into `mcp.json`,
  REPORT it with line numbers; do not redesign the panel in this lane.
- Block prompts in `edge_screener/desk/blocks.py` ("Run explore_screen for …") stay unless the live
  acceptance shows the model fails to call the prefixed tool.

## Step 1 — probe BEFORE building (stop and report if any answer is no)

In your edge-screener worktree, with a throwaway extension file, start pi exactly the way the
desk does (`--mode rpc -na -t <the six mcp__edge__* names> --no-skills --no-extensions -e <ext> -e <nana-stage>`,
`NANA_STAGE_EXPECT_TOOLS` set to the same names) and answer with evidence:

a. Does the built-in MCP extension load under `--no-extensions`?
b. Does a server registered with `registerMcpServer` from a `-e` extension connect?
c. Do the six direct tools become active under the `-t` allowlist (they register after start)?
   Does nana-stage's readiness watcher report `ready`?
d. In one real model turn calling `mcp__edge__screen_detail` for `amihud_illiquidity`, what exactly
   does the `tool_result` event carry (`details`, `structuredContent` keys), and what reaches
   `tool_execution_end` on the RPC stream?
e. Does the `memory` server from user scope connect in that session, and is it excluded by `-t`?

If a/b/c fails: STOP, write the evidence to the report, and do not build a workaround. The seat
decides the next design (the fallback options are a different trust posture or a desk-side
change, both outside your remit).

## Step 2 — build, test, prove

- Unit tests in `packages/nana-stage/tests/blocks.test.mjs`: built-in carrier valid → stamped,
  content canonical, patch has no `structuredContent`; malformed → isError, carrier gone; no
  blocks → untouched; `details.blocks` path unchanged.
- Port `apps/desk/test/stage-chain-edge.e2e.mjs` to the built-in chain (new extension, prefixed
  names, stamped + signed blocks reach the stage, no unstamped carrier on the live event). The
  `detailsMaxBytes` overflow child has no built-in equivalent: replace it with an over-cap block
  set → nana-stage error and nothing staged, if that is cheap; otherwise retire it and say so.
  The e2e binds fixed ports: run it alone, never alongside another desk suite, and never on
  7317/7320/7321.
- Mutation proofs: break the new extraction (e.g. read the wrong key) and the carrier drop (e.g.
  return `structuredContent` in the patch); each must turn a cited, marked test red. Record the
  red output.
- Green at the end, in the nana-pi worktree: `npm test`, `npm run map:check`, `npm run readme:check`,
  the rail (`node scripts/requirements-trace.mjs`). Regenerate the map if a module changed. New
  modules carry the six-tag header. In edge-screener: its own test suite for anything you touched
  (`uv run pytest` on the relevant tests), and follow its `AGENTS.md`.
- Contract changes are declared where consumers read them: nana-stage README (replace the
  residual paragraph), `apps/desk/README.md` Contract notes if the app-session contract changed,
  the design doc `docs/agent-frontend-design-2026-09-04.md` only where it states the adapter shape.

## Report

`docs/reviews/edge-builtin-mcp-2026-10-04/worker-report.md` in the nana-pi worktree:
probe answers a–e with evidence · commits per repo · rows retired/added and the clause each
cited test pins · tests run with counts · mutation runs with the red lines · the proposed new
`~/.pi/agent/apps/edge.json` (full JSON) · machine steps the seat must do after landing
(e.g. remove `~/.pi/agent/apps/vendor/`) · residuals, one line each · anything you were unsure of.
Mark every claim [V] verified by execution, [S] read in source/docs, or [I] inferred.
