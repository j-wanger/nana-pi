# Adversarial review, ROUND 3 — UI-centric frontend slice 2 (the edge desk)

Your round-2 findings: `/Users/jwang/nana-pi/docs/reviews/agent-frontend-2026-09-04/edge-r2.md` (verdict REWORK on two fail-open edges). Original brief (dimensions + file list): `/Users/jwang/nana-pi/docs/reviews/agent-frontend-2026-09-04/edge-brief.md`. Verify the round-2 fixes against the CODE, then decide.

## What changed (nana-pi HEAD, edge-screener HEAD)

1. Readiness is desk-owned and fail-closed (`apps/desk/apps.mjs` `toolsState`/`awaitTools`, `apps/desk/server.mjs` `toolsExpected`): an app child spawned with expected tools is `waiting` until nana-stage's `nana-tools` status arrives; after `DESK_READY_BOUND_MS` (35 s default) with no report it is `unreported`; `POST /api/prompt` returns 409 unless `ready`. Listener test spawns a SILENT stub child (never reports) and asserts `unreported` + 409 (`apps/desk/test/app-listener.test.mjs`, delta app). Both browser stubs emit `waiting` → `ready`; `stage-page-edge.e2e.mjs` asserts send is enabled only after it.
2. `/api/data/<key>` is now `POST` only, body drained and ignored, under the same Origin + `application/json` rule as every mutating route; GET → 404. Tests: GET 404, cross-origin POST 403, `text/plain` 403, same-origin JSON 200, curl (no Origin) 200. `edge-screener/desk/app.js` posts.
3. Page (`stage.js` `toolsGate`/`sendPrompt`): send disabled while tools not ready; re-polls `/api/session` while `waiting`; a refused prompt returns to the input; `unreported`/`missing` shows an error toast.
4. Design §11.7 records round 2 and the accepted NOT-FIXED items (adapter shallow merge — adapter code; panel typed numbers with `source` column; roster panel; chart table view).

## Your job

- Table: each round-2 finding → FIXED / NOT FIXED / PARTIAL with file:line.
- Attack the changed code once more: `toolsState` timing (statuses map cleared/overwritten? `startedAt` vs a resumed session? what if nana-stage reports `ready` and the adapter later hot-swaps tools?), the 409 path vs the page's optimistic bubble, `awaitTools` on a child that exits mid-wait, the POST data route (can `readBody` reject a large body and leak an error? does the drained body change anything?), and whether the SILENT-child test actually exercises the bound (DESK_READY_BOUND_MS=1500).
- Output: the table, `## New findings` (`[BLOCKER|MAJOR|MINOR] file:line — what — why — fix`), then `VERDICT: LAND | REWORK` and one paragraph. If the remaining items are MINOR and recordable, say LAND with the residuals listed.

Files: `/Users/jwang/nana-pi/apps/desk/apps.mjs`, `/Users/jwang/nana-pi/apps/desk/server.mjs` (spawnChild, handleChildEvent), `/Users/jwang/nana-pi/apps/desk/public/stage/stage.js`, `/Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts`, `/Users/jwang/nana-pi/apps/desk/test/app-listener.test.mjs`, `/Users/jwang/nana-pi/apps/desk/test/stage-page-edge.e2e.mjs`, `/Users/jwang/nana-pi/apps/desk/test/stage-chain-edge.e2e.mjs`, `/Users/jwang/edge-screener/desk/app.js`, `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md` §11.7.
