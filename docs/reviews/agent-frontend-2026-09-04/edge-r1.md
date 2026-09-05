## 1. Provenance & trust boundary — FINDING

- [MAJOR] `/Users/jwang/nana-pi/apps/desk/apps.mjs:237` and `/Users/jwang/nana-pi/apps/desk/apps.mjs:243` — `/api/data/<key>` is a `GET` route and Origin enforcement is skipped for all `GET`s, yet the handler spawns the manifest command at `/Users/jwang/nana-pi/apps/desk/apps.mjs:250` — another website cannot read the JSON under SOP, but it can cause repeated local `uv run ... data` executions on an app port; the design deviation even says `data` gets the “same Origin rule” at `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md:302` — apply Origin checking to `/api/data/*` or make data refresh a same-origin JSON `POST`.

## 2. The MCP seam — FINDING

- [MAJOR] `/Users/jwang/.pi/agent/npm/node_modules/pi-mcp-adapter/index.ts:1225` and `/Users/jwang/.pi/agent/npm/node_modules/pi-mcp-adapter/index.ts:670` — direct tools are first registered from the metadata cache, then refreshed after async initialization; the e2e papers over that with a fixed 6-second sleep at `/Users/jwang/nana-pi/apps/desk/test/stage-chain-edge.e2e.mjs:99` and again at `:138` — first app use can present no direct tools or race the model turn; with the app `-t` allowlist excluding `mcp`, the fallback proxy is not available — block session readiness until direct tools are registered, or expose a deterministic “MCP ready” event that the listener waits for before accepting prompts.
- [MINOR] `/Users/jwang/.pi/agent/npm/node_modules/pi-mcp-adapter/config.ts:346` and `:348` — settings merge is shallow, so a higher-precedence config that sets `outputGuard` replaces the whole object — today project `.pi/mcp.json` wins over global because project sources are later (`/Users/jwang/.pi/agent/npm/node_modules/pi-mcp-adapter/config.ts:466`, `:489`), but a project partial override can silently drop `detailsMaxBytes` back to default — deep-merge nested settings or require/diagnose full `outputGuard`.

## 3. Chart validator — FINDING

- [MAJOR] `/Users/jwang/nana-pi/packages/nana-stage/lib/blocks.mjs:96` — date validation only checks `YYYY-MM-DD`, so invalid dates like `2026-99-99` pass; renderer calls `Date.parse` at `/Users/jwang/nana-pi/apps/desk/public/stage/stage.js:149`, then computes domains at `:165`, producing `NaN`/broken SVG — validate dates with `Date.parse` plus round-trip `toISOString().slice(0,10)`.
- [MAJOR] `/Users/jwang/nana-pi/packages/nana-stage/lib/blocks.mjs:100` — all-null series pass validation; renderer filters nulls at `/Users/jwang/nana-pi/apps/desk/public/stage/stage.js:163` and then runs `Math.min(...[])` at `:165`, yielding infinities/invalid axes — either reject charts with zero finite points overall or render an explicit “no values” state.
- [MINOR] `/Users/jwang/nana-pi/packages/nana-stage/lib/blocks.mjs:20`, `:90`, and `:106` — `MAX_CHART_POINTS` advertises 1000 points per series, but the later 64 KiB block cap means many valid-by-point-count 2–4 series charts fail by byte size, while the adapter cap is also 65536 in `/Users/jwang/edge-screener/.pi/mcp.json:3` — make the point cap match the byte cap in practice, or document/enforce a total-point cap.

## 4. Evidence fidelity — FINDING

- [MAJOR] `/Users/jwang/edge-screener/src/edge_screener/desk/blocks.py:79` and `:86` — `screen_panel` puts a derived `survivorship` value in each row but the row `_ref` points to the corrected verdict table, not the survivorship report; e.g. `amihud_illiquidity` exists in corrected-live at `/Users/jwang/edge-screener/reports/edge-verdict-corrected-live.md:24`, but it is absent from the PIT table in `/Users/jwang/edge-screener/reports/edge-verdict-survivorship.md:6`–`:14` — give the survivorship cell its own ref or split it into a separately evidenced block/column.
- [MINOR] `/Users/jwang/edge-screener/src/edge_screener/desk/blocks.py:75` and `/Users/jwang/edge-screener/src/edge_screener/desk/reports.py:74`–`:82` — panel numbers are parsed from printed strings into numbers, so `1.000` becomes `1` and `0.0000` becomes `0` in the table renderer — the value still traces to the line, but the display is not the report’s literal figure — preserve printed strings for evidence-facing values or add explicit formatting metadata.

## 5. Mutation confinement — PASS

No findings. `explore_screen` resolves only registered screen names before writing, and writes under `reports/explore/<timestamp>-<screen>.md` at `/Users/jwang/edge-screener/src/edge_screener/desk/blocks.py:365`–`:367`; the manifest marks only `explore_screen` mutating at `/Users/jwang/.pi/agent/apps/edge.json:17`–`:19`; `pull` is not in the interactive tools allowlist at `/Users/jwang/.pi/agent/apps/edge.json:5`–`:12`.

## 6. Tests — FINDING

- [MAJOR] `/Users/jwang/nana-pi/apps/desk/test/stage-chain-edge.e2e.mjs:99` and `:138` — the real-chain e2e depends on fixed 6-second sleeps before the first turn — this hides the direct-tool registration race instead of asserting readiness — replace sleeps with a deterministic readiness condition or a manifest/session endpoint that reports active tools.
- [MAJOR] `/Users/jwang/edge-screener/desk/app.js:83`–`:87` and `/Users/jwang/nana-pi/apps/desk/public/stage/stage.js:438`–`:439` — the core mutation-refresh contract (`agent:changed` reaches app.js and refreshes shelf) has no browser assertion; the e2e only checks a file was written at `/Users/jwang/nana-pi/apps/desk/test/stage-chain-edge.e2e.mjs:123`–`:126` — add a browser test that observes the shelf count/list change after a mutating tool event.
- [MINOR] `/Users/jwang/nana-pi/apps/desk/test/app-listener.test.mjs:133`–`:141` — data route tests cover success/failure/non-JSON/unstartable, but not the 20-second timeout path implemented at `/Users/jwang/nana-pi/apps/desk/apps.mjs:176` — add a short injectable timeout or fake clock test for killed data commands.

## 7. Transferability verdict (§5) — FINDING

- [MAJOR] `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md:177` and `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md:270`–`:280` — the design explicitly deferred the Python validator to slice 2 and required it; the implementation declares “No Python validator” at `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md:301`–`:302`, and edge tests shell out to the JS validator at `/Users/jwang/edge-screener/tests/unit/test_desk_blocks.py:28`–`:37` — record this as a design failure against the stated validator contract, or amend the design to a single canonical JS validator.
- [MAJOR] `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md:177` and `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md:302` — by the letter of §5, the host changed beyond adding `chart`: `page`, `data`, `quick`, and `agent:changed`; code confirms normalized manifest fields at `/Users/jwang/nana-pi/apps/desk/apps.mjs:122` and route serving/data behavior at `:141`–`:151`, `:243`–`:250` — I would record this as a design gap the design named (“app API / store”, “its page”) but failed to specify, not an app-bespoke failure, because the ledger/stamp/block mechanism stayed shared.

## 8. Subtraction — FINDING

- [MINOR] `/Users/jwang/edge-screener/src/edge_screener/desk/data.py:82`–`:111` and `/Users/jwang/edge-screener/desk/app.js:43`–`:57` — the persona roster adds a whole durable panel and click behavior, but the slice’s feel path and e2e do not use it — remove it from v0 or prove it earns space with a tested workflow.
- [MINOR] `/Users/jwang/nana-pi/apps/desk/public/stage/stage.js:219`–`:236` — chart “table view” duplicates the same points already summarized and rendered, adding UI state and DOM complexity — keep only if a user task requires exact point inspection; otherwise subtract until needed.

VERDICT: REWORK

The core path is close, but not landable as-is: cross-origin pages can trigger app data commands, chart validation admits inputs that break rendering, the first-turn MCP readiness is a timed race, and evidence refs blur derived survivorship values. The transferability story also needs an honest design amendment: the host API gap and missing Python validator are deviations from the written failure rule, not just implementation details.
