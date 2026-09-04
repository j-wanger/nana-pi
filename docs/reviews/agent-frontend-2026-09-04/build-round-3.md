## C1 — Closure per round-2 fix

1. **CLOSED** — The claim now correctly treats the manifest-configured child process as the trust boundary, while `nana-stage` scrubs the key before later extensions or subprocesses can inherit it (`packages/nana-stage/lib/sign.mjs:12-17`, `packages/nana-stage/extensions/nana-stage.ts:22-25`).
2. **CLOSED** — Invalid block entries retain their ledger identity and ancestry while their type and payload are neutralized (`apps/desk/apps.mjs:46-49`, `apps/desk/test/app-listener.test.mjs:167-169`).
3. **CLOSED** — Timed dialogs expire server-side, hello snapshots reconcile all gate cards, and expired responses are rejected (`apps/desk/server.mjs:254-264`, `apps/desk/public/stage/stage.js:233-240`, `apps/desk/test/app-listener.test.mjs:204-210`).
4. **CLOSED** — Every reconnect hello forces a full stage and drawer rebuild, bypassing the append optimization (`apps/desk/public/stage/stage.js:241-242`, `apps/desk/public/stage/stage.js:296-313`, `apps/desk/test/stage-page.e2e.mjs:176-183`).
5. **PARTIAL** — Signing now canonicalizes the JSON-transported form, but the expressly declined Win32 drive-root handling remains unchanged and out of this slice (`packages/nana-stage/lib/sign.mjs:26-34`, `apps/desk/server.mjs:177`, `apps/desk/server.mjs:774`).

## C2 — Regressions introduced by the rework

- **Redaction shape:** None found; outer entry metadata and parent topology survive while reducers ignore the rejected custom type.
- **Timer and `unref`:** No functional regression; `unref` permits clean shutdown, though answered timed dialogs retain harmless timer closures until their original deadline.
- **Reconnect replay ordering:** A minor transient race remains possible where an in-flight replay overwrites a newer live update; the next settled replay self-corrects it.
- **Hello reconciliation versus live dialogs:** None found; hello is written and client registration occurs synchronously, while subsequent dialog events are processed in stream order.

## C3 — Residual risks worth a documentation line

- Win32 drive-root and `%` path argument handling remains explicitly unsupported by this slice.
- The manifest-configured extension set remains trusted; scrubbing does not protect against an earlier extension that deliberately captured the key.
- Full replay is uncapped and concurrent live/replay ordering is eventually, rather than immediately, consistent.
- Cross-origin GETs still reach handlers, and failed post-spawn `get_state` can leave manifest session write-back stale.

**VERDICT: LAND — Fixes: none.**
