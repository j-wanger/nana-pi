## R1 — Closure per round-1 fix

1. **PARTIAL** — Blocks are schema-checked, event-bound, and HMAC-filtered, but every co-resident extension inherits `NANA_STAGE_KEY`, so the claimed extension ownership boundary is not cryptographically enforced (`apps/desk/server.mjs:168-188`, `packages/nana-stage/extensions/nana-stage.ts:24-25`).
2. **CLOSED** — Empty tool allowlists are rejected and per-app concurrent session requests share one spawn promise (`apps/desk/apps.mjs:82-85`, `apps/desk/apps.mjs:193-200`).
3. **PARTIAL** — Failed answers remain mounted and child exit clears gates, but timeout resolution and `desk_hello` reconciliation remain absent, allowing stale gate cards (`apps/desk/public/stage/stage.js:201-212`, `apps/desk/public/stage/stage.js:231-235`).
4. **CLOSED** — Board scope explicitly identifies analyst-generated rankings, while dossier fields and scope identify analyst/model-derived content (`basketball-geek/src/basketball_geek/blocks.py:128-131`, `basketball-geek/src/basketball_geek/blocks.py:207-215`, `basketball-geek/src/basketball_geek/blocks.py:257-260`).
5. **PARTIAL** — Full active-branch replay replaced cursor deltas, but reconnect `desk_hello` does not trigger replay and the append optimization preserves a drawer that may have missed disconnected events (`apps/desk/public/stage/stage.js:231-235`, `apps/desk/public/stage/stage.js:284-304`).
6. **PARTIAL** — Forged entries, concurrent spawn, empty tools, two dialogs, exit, and malformed real-tool cases gained tests, but timeout/failed-gate and a real co-resident extension with key access remain untested (`apps/desk/test/app-listener.test.mjs:106-174`, `apps/desk/test/stage-page.e2e.mjs:165-179`).

## R2 — Regressions or new holes

- **MAJOR — Key handling:** `NANA_STAGE_KEY` is process-wide and inherited by every extension and child subprocess, contradicting the statement that a second extension “has no key”; HMAC authenticates the child process, not `nana-stage` specifically (`apps/desk/server.mjs:168-188`).
- **MAJOR — Filtered-ledger topology:** `verifiedEntries` removes invalid entries rather than redacting their payload, so an invalid `nana-block` used as a parent or leaf severs ancestry and can blank valid earlier stage/drawer state (`apps/desk/apps.mjs:43-44`, `packages/nana-stage/lib/blocks.mjs:174-187`).
- **MINOR — Canonicalisation:** The custom canonicalizer is deterministic for transported JSON, but explicitly-`undefined` properties or sparse arrays sign differently before and after JSON serialization, causing legitimate blocks to be dropped (`packages/nana-stage/lib/sign.mjs:14-23`).
- **CLOSED — Timing-safe comparison:** Signature length is checked before `timingSafeEqual`, avoiding unequal-buffer exceptions and ordinary timing comparison (`packages/nana-stage/lib/sign.mjs:30-35`).
- **MINOR — Win32 path:** Removing trailing backslashes changes a drive-root argument such as `C:\` into drive-relative `C:`, and embedding `PI_BIN` directly still mishandles `%` in its path (`apps/desk/server.mjs:171-184`).
- **CLOSED — Serialized spawn:** The per-app promise closes the concurrent double-spawn/orphan race without widening client control over spawn inputs (`apps/desk/apps.mjs:193-200`).
- **MAJOR — Replay:** Reconnection does not replay on `desk_hello`; even if added, the ancestor optimization would decline to rebuild drawer events missed during disconnection (`apps/desk/public/stage/stage.js:231-235`, `apps/desk/public/stage/stage.js:291-304`).

## R3 — Residual risks for the doc

- Cross-origin GETs still physically reach app/desk handlers even though browser SOP hides their responses.
- A failed post-spawn `get_state` leaves session-file write-back stale but retains the live child.
- HMAC provenance should be documented as protection from unsigned corruption, not hostile code executing inside the child process.
- Session replay remains intentionally uncapped on the app endpoint and may become expensive for very large sessions.

**VERDICT: REWORK**

Fixes:

1. Define an enforceable provenance trust boundary or narrow the claim: process-wide environment keys cannot distinguish `nana-stage` from co-resident extensions.
2. Preserve ledger ancestry when rejecting invalid signed entries—redact/neutralize them rather than deleting topology nodes.
3. Reconcile gates from each `desk_hello` snapshot and clear timed/resolved dialogs; add timeout and failed-response tests.
4. Replay on every `desk_hello`, and rebuild drawer history after reconnect rather than assuming live rows are complete.
5. Canonicalize the JSON-serialized form before signing and fix Win32 drive-root argument handling.
