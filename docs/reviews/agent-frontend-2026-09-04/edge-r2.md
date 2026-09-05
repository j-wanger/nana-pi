## Round-1 findings

| Finding | Status | Evidence |
|---|---:|---|
| `/api/data/*` GET could be triggered cross-origin | PARTIAL | Added `Sec-Fetch-Site`/`Origin` checks at `/Users/jwang/nana-pi/apps/desk/apps.mjs:239-248`, with tests at `apps/desk/test/app-listener.test.mjs:155-158`; but absent `Sec-Fetch-Site` is still allowed at `apps.mjs:244`, so browsers/embedded webviews that omit Fetch Metadata can still trigger command runs. |
| Direct MCP tools first-turn readiness hidden by fixed sleeps | PARTIAL | Sleeps removed and session now reports `tools` via `NANA_STAGE_EXPECT_TOOLS` at `apps/desk/server.mjs:170-173` and `nana-stage.ts:30-46`; e2e asserts `statuses["nana-tools"] === "ready"` at `apps/desk/test/stage-chain-edge.e2e.mjs:113`. But listener defaults missing status to ready at `apps/desk/apps.mjs:212-217`, so the protocol is fail-open if nana-stage is absent/broken or before first status is observed. |
| Adapter `outputGuard` settings shallow-merge | NOT FIXED | Still shallow at `/Users/jwang/.pi/agent/npm/node_modules/pi-mcp-adapter/config.ts:345-348` and `:510-516`; design merely records operating note. |
| Chart date validator allowed impossible dates | FIXED | `isIsoDate` parses UTC and round-trips at `/Users/jwang/nana-pi/packages/nana-stage/lib/blocks.mjs:21-26`; tests include `2026-99-99`, `2026-02-30`, and `2024-02-29` at `packages/nana-stage/tests/blocks.test.mjs:52`. |
| Chart all-null series broke renderer | FIXED | Validator now requires at least one finite y at `packages/nana-stage/lib/blocks.mjs:109-110`; test at `packages/nana-stage/tests/blocks.test.mjs:53`. |
| Chart per-series cap inconsistent with byte cap | FIXED | Added `MAX_CHART_POINTS_TOTAL = 2400` at `packages/nana-stage/lib/blocks.mjs:20` and enforcement at `:108`; tests at `packages/nana-stage/tests/blocks.test.mjs:54-55`. |
| `screen_panel` derived survivorship column had wrong ref | FIXED | Panel columns are now only corrected-verdict fields plus `source` at `/Users/jwang/edge-screener/src/edge_screener/desk/blocks.py:86-94`; PIT band moved to card with survivorship ref at `:133-141`. |
| Panel numbers re-rounded from printed report strings | PARTIAL | Cards preserve printed strings at `/Users/jwang/edge-screener/src/edge_screener/desk/blocks.py:122-125`; panel still parses numbers via `_num` at `:31-33` and rows at `:73-78`, with source column/scope disclosing printed-line evidence at `:89-91`. |
| Real-chain e2e fixed 6s sleeps | FIXED | No fixed readiness sleep remains; session POST is checked for `tools === "ready"` at `/Users/jwang/nana-pi/apps/desk/test/stage-chain-edge.e2e.mjs:108-111`. |
| No browser assertion for `agent:changed` → shelf refresh | FIXED | New browser e2e asserts mutating refetch and non-mutating no-refetch at `/Users/jwang/nana-pi/apps/desk/test/stage-page-edge.e2e.mjs:125-132`. |
| Data-route timeout untested | FIXED | Injectable timeout used and 504 asserted at `/Users/jwang/nana-pi/apps/desk/test/app-listener.test.mjs:162-164`. |
| Design still promised Python validator | FIXED | Design amended to one canonical JS validator at `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md:11`; Python tests shell through JS validator at `/Users/jwang/edge-screener/tests/unit/test_desk_blocks.py:28-37`. |
| Host `page`/`data`/`quick`/`agent:changed` seam not specified | FIXED | Design now records the seam as kit/design gap at `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md:305-309`. |
| Persona roster panel complexity | NOT FIXED | Kept consciously; still rendered at `/Users/jwang/edge-screener/desk/app.js:31-48`, adjudicated at design `§11.7`. |
| Chart table view complexity | NOT FIXED | Kept consciously; still implemented at `/Users/jwang/nana-pi/apps/desk/public/stage/stage.js:218-236`, adjudicated at design `§11.7`. |

## New findings

- [MAJOR] `/Users/jwang/nana-pi/apps/desk/apps.mjs:212-217` — readiness is fail-open when `nana-tools` status is absent — production app sessions with a missing/broken/not-yet-reporting `nana-stage` read as `ready`, and `/api/prompt` only rejects when `toolsState(child) !== "ready"` at `apps.mjs:282-286`; this can run the first model turn without direct MCP tools — initialize app children with server-side `tools="waiting"` when expected tools exist, and only switch to ready on an explicit nana-stage report; if no report by the bound, return `missing/unreported` and reject prompts.

- [MAJOR] `/Users/jwang/nana-pi/apps/desk/apps.mjs:242-248` — `/api/data/*` still trusts absence of `Sec-Fetch-Site` as non-browser — older browsers/embedded webviews/extensions that omit Fetch Metadata send no `Origin` for `<img>`/`<script>` navigations, so they can still trigger local manifest commands; SOP prevents reading, not execution cost — make data refresh same-origin `POST` with JSON + Origin rule, or require a non-simple app-set header for `/api/data/*` and update app fetches/tests.

- [MINOR] `/Users/jwang/nana-pi/apps/desk/public/stage/stage.js:488-491` — a 409 prompt is only toasted after the optimistic user bubble is added, and the send button clears the input at `stage.js:499` — if tools are `waiting/missing`, the page loses the typed prompt and offers no retry path; this strands the user on transient readiness failures — disable send while session tools are not ready, or keep/requeue the rejected text.

- [MINOR] `/Users/jwang/nana-pi/apps/desk/test/stage-page-edge.e2e.mjs:89` — the new browser e2e runs with `extensions: []`, so it exercises the app page seam while relying on the listener’s default-ready path, not the real readiness protocol — a regression where nana-stage status events stop reaching the page would not fail here — add a stub status emitter or run this browser seam with nana-stage loaded and an explicit waiting→ready transition.

VERDICT: REWORK

The chart and evidence fixes are real, and the new browser test covers the mutation-refresh seam. But two safety-relevant edges remain fail-open: app sessions default to tool-ready without an explicit readiness report, and the data route still permits command-triggering GETs when Fetch Metadata is absent. Those are exactly the new surfaces this round was meant to harden, so this should not land until readiness is server-owned/fail-closed and data refresh is no longer triggerable by legacy cross-site GETs.
