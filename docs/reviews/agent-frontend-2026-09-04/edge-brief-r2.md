# Adversarial review, ROUND 2 — UI-centric frontend slice 2 (the edge desk)

You reviewed this build in round 1 (your findings: `/Users/jwang/nana-pi/docs/reviews/agent-frontend-2026-09-04/edge-r1.md`; the original brief with all dimensions and file list: `/Users/jwang/nana-pi/docs/reviews/agent-frontend-2026-09-04/edge-brief.md`). Verdict was REWORK. The author claims every MAJOR is fixed. Verify each against the CODE, not the claim. Then re-run your own adversarial pass on the changed surfaces.

## What the author changed (commits nana-pi 0dd1590, edge-screener 1ad8a11)

1. `/api/data/*` (apps.mjs): refuses `Sec-Fetch-Site` other than `same-origin`/`none` (absent header = curl, allowed) and refuses a foreign `Origin`; injectable timeout (`DESK_DATA_TIMEOUT_MS`, tests only) with a 504 test. Tests: `apps/desk/test/app-listener.test.mjs`.
2. Tool readiness: desk passes `NANA_STAGE_EXPECT_TOOLS` to app children (server.mjs); `nana-stage.ts` polls `pi.getActiveTools()` from `session_start` and reports `waiting`/`ready`/`missing: …` via `ctx.ui.setStatus("nana-tools", …)`; the listener holds `POST /api/session` until the status leaves `waiting` (35 s bound), returns `tools` on the session, and 409s `POST /api/prompt` unless `ready`. A child that never reports reads `ready` (`toolsState` in apps.mjs) — the real-chain e2e asserts `desk_hello.statuses["nana-tools"] === "ready"` so a silent child is caught there. `stage.js` shows the state. Sleeps removed from `stage-chain-edge.e2e.mjs`.
3. Chart validator (`blocks.mjs`): `isIsoDate` round-trips a real calendar date; a chart must have ≥1 finite y across series; `MAX_CHART_POINTS_TOTAL = 2400`; tests added in `blocks.test.mjs` (80 checks).
4. Evidence: `screen_panel` no longer has the derived survivorship column; every table row (panel, construction, stop) has a visible `source` column = `path:line`; the PIT band lives on the card with its own ref (`edge_screener/desk/blocks.py`, tests in `tests/unit/test_desk_blocks.py`).
5. New browser test `apps/desk/test/stage-page-edge.e2e.mjs` (stub pi + the real edge page): app views paint from data routes; mutating tool → `agent:changed` → shelf refetch; non-mutating → no refetch; chart render; table view; reload replay.
6. Design amended: §1 one canonical JS validator; §5 page/data/quick/agent:changed seam specified as kit; §11.7 records round 1 and the adjudication (including two MINORs consciously kept: roster panel, chart table view).

## Your job

- For each round-1 finding: FIXED / NOT FIXED / PARTIAL, with file:line evidence.
- Then attack the new code: the readiness protocol (can `toolsState` default to `ready` in production before nana-stage's `waiting` lands? what does `pi.getActiveTools()` return for adapter direct tools before/after hot-load? can a 409 on prompt strand the page?), the Sec-Fetch-Site rule (browsers that omit it; `no-cors` fetches; navigations), the `isIsoDate` round-trip (timezones, `2024-02-29`), the total-point cap arithmetic against `MAX_BLOCK_BYTES`, the new e2e's assumptions.
- Output: `## Round-1 findings` table (finding → status → evidence), `## New findings` with `[BLOCKER|MAJOR|MINOR] file:line — what — why — fix`, then `VERDICT: LAND | REWORK` and one paragraph.

Files: everything in the original brief's list plus `/Users/jwang/nana-pi/apps/desk/test/stage-page-edge.e2e.mjs`, `/Users/jwang/nana-pi/docs/reviews/agent-frontend-2026-09-04/edge-r1.md`, and §11.7 of the design doc.
