| Round-3 finding | Status | Evidence |
|---|---:|---|
| Readiness watcher was one-shot after `ready` | FIXED | `/Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts:34-55` starts one detached lifetime watcher, keeps polling forever, reports `ready` when all tools exist, and downgrades to `missing: …` after a post-ready disappearance. Server prompt gate still refuses non-ready at `/Users/jwang/nana-pi/apps/desk/apps.mjs:313-315`. |
| `/api/data/*` JSON guard was conditional on body presence | FIXED | `/Users/jwang/nana-pi/apps/desk/apps.mjs:264-272` applies route-local `Content-Type: application/json` unconditionally before running the manifest command. Regression tests at `/Users/jwang/nana-pi/apps/desk/test/app-listener.test.mjs:171-172`. Shared `originRejection` remains body-conditional at `/Users/jwang/nana-pi/apps/desk/server.mjs:1016-1025`, but `/api/data/*` overrides it. |
| `POST /api/session` could return `200`/`waiting` for a child that exited mid-wait | FIXED | `/Users/jwang/nana-pi/apps/desk/apps.mjs:214-216` waits only while running; `/Users/jwang/nana-pi/apps/desk/apps.mjs:296-297` returns `502` if the child is no longer running. Dying-stub test at `/Users/jwang/nana-pi/apps/desk/test/app-listener.test.mjs:204-213`. |

## New findings

- [MINOR] `/Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts:40,45-55` — detached watcher has no rejection boundary. If `ctx.ui.setStatus()` or `pi.getActiveTools()` throws, the lifetime monitor dies silently/unhandled. Startup still fails closed via `waiting`/`unreported`, but after a prior `ready` this could leave stale readiness. Add a small `try/catch` or `.catch()` if hardening further.

- [MINOR] `/Users/jwang/nana-pi/packages/nana-stage/extensions/nana-stage.ts:55` — after `ready`, polling every 2s leaves a small residual window where a tool can disappear and one prompt can pass before downgrade. This is a bounded residual, not worse than a tool disappearing mid-turn; closing it fully would require prompt-time revalidation.

VERDICT: LAND

The round-3 fixes are real: readiness is no longer one-shot, `/api/data/*` no longer has the body-less simple POST hole, and early child exit now returns 502 instead of a misleading 200. The remaining issues are hardening residuals around the detached polling watcher, not current fail-open blockers.
