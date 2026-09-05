| Round-2 finding | Status | Evidence |
|---|---:|---|
| Readiness defaulted to `ready` when no `nana-tools` report arrived | FIXED for initial startup; PARTIAL for long-lived sessions | `apps/desk/apps.mjs:204-208` now returns `waiting`/`unreported` when `toolsExpected` is true and no status exists; `apps/desk/apps.mjs:313-315` refuses prompts unless `ready`; silent-child bound test at `apps/desk/test/app-listener.test.mjs:196-200`. Remaining gap: once `ready` is set, it is never revalidated. |
| `/api/data/*` trusted absent `Sec-Fetch-Site` on GET | PARTIAL | GET command route is gone: `apps/desk/apps.mjs:264-277`; tests cover GET 404/cross-origin/text/plain/same-origin/curl at `apps/desk/test/app-listener.test.mjs:165-169`; `edge-screener/desk/app.js:8-12` uses POST. Remaining gap: JSON content-type is only required when a body is detected (`server.mjs:1022-1025`), so a no-body simple POST can still reach the route. |
| 409 prompt path lost typed text after optimistic bubble | FIXED | `stage.js:432` gates before posting, `stage.js:435-436` removes optimistic bubble and restores input on refusal; `stage.js:442-449` disables send and re-polls while waiting. |
| Browser e2e relied on default-ready path | FIXED | Stub emits `waiting` then `ready` at `stage-page-edge.e2e.mjs:44-46`; assertion at `stage-page-edge.e2e.mjs:108`. |

## New findings

- [MAJOR] `/Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts:37-41` — readiness is one-shot after `ready` — `nana-stage` stops polling once expected tools are present, while the desk stores `nana-tools=ready` indefinitely via `server.mjs:205-206`/`apps.mjs:204-208`; if the adapter hot-swaps, drops, or later unregisters direct tools, prompts continue to pass the server gate and can run without the manifest tools — keep monitoring expected tools and downgrade the status on disappearance, or revalidate tool presence before every app prompt.

- [MAJOR] `/Users/jwang/nana-pi/apps/desk/server.mjs:1022-1025` — `/api/data` does not actually require JSON for empty-body POSTs — `originRejection` only enforces `Content-Type: application/json` when it thinks a body exists, and `/api/data/<key>` drains but ignores the body at `apps.mjs:269`; a simple no-body form POST from a client/webview that omits `Origin` can still trigger the manifest command — require `application/json` on all mutating POSTs, or at minimum on `/api/data/*`, regardless of body length; add a no-Origin/no-body simple POST regression test.

- [MINOR] `/Users/jwang/nana-pi/apps/desk/apps.mjs:214-216` — `awaitTools` on a child that exits mid-wait returns the current tools state, often still `waiting`, and `/api/session` can answer 200 with an exited child — not fail-open because later routes lose `liveChild`, but it is misleading UX/test coverage — return an explicit error/exited session state when the process dies before readiness.

VERDICT: REWORK

The round-2 fixes are real for the original startup fail-open and GET data route, and the page now handles refused prompts sanely. But two safety edges remain: readiness becomes stale after the first `ready`, and the POST data route’s JSON guard is conditional on body presence, leaving a simple no-body POST command trigger for no-Origin clients. Those are still fail-open enough to require another pass before landing.
