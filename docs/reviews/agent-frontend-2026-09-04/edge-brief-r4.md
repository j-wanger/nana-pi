# Adversarial review, ROUND 4 — UI-centric frontend slice 2 (the edge desk)

Round-3 findings: `/Users/jwang/nana-pi/docs/reviews/agent-frontend-2026-09-04/edge-r3.md` (REWORK: one-shot readiness; conditional JSON guard on the data POST; 200-with-waiting on a dying child). Original brief: `edge-brief.md` in the same directory.

## What changed (nana-pi HEAD)

1. `packages/nana-stage/extensions/nana-stage.ts`: the readiness watcher runs for the process lifetime, DETACHED from `session_start` (pi awaits handlers; an awaited infinite loop blocked the session — caught by the real-chain e2e). 200 ms polls until `ready`, then every 2 s; on a missing expected tool after `ready` it reports `missing: …`; only status CHANGES are reported.
2. `apps/desk/apps.mjs`: `/api/data/<key>` requires `content-type: application/json` unconditionally (body-less POSTs included) before the shared Origin rule; `POST /api/session` answers 502 if the child exits before its tools report.
3. Tests (`apps/desk/test/app-listener.test.mjs`): body-less no-content-type POST → 403, form content-type → 403; a dying stub child → 502 on spawn. Real chains: edge 21/21, basketball 15/15.

## Your job

Verify each round-3 finding against the code (table: FIXED / PARTIAL / NOT FIXED, file:line). Then one last adversarial pass on the changed lines only: the detached watcher (unhandled rejection if `ctx.ui.setStatus` throws after the session ends? two watchers after a `new_session` RPC? the 2 s window between a tool disappearing and the downgrade — is a prompt in that window an accepted residual?), the content-type check ordering vs `originRejection`, and the 502 path. Output the table, `## New findings` with severities, `VERDICT: LAND | REWORK`, and one paragraph. MINOR residuals should be listed, not block.

Files: `/Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts`, `/Users/jwang/nana-pi/apps/desk/apps.mjs`, `/Users/jwang/nana-pi/apps/desk/server.mjs` (spawnChild, handleChildEvent, originRejection), `/Users/jwang/nana-pi/apps/desk/test/app-listener.test.mjs`, `/Users/jwang/nana-pi/docs/agent-frontend-design-2026-09-04.md` §11.7.
