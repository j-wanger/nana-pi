# Lane: client-side races in the desk page (branch `fix/races`)

Worktree: `/private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-races`. Read `brief-common.md` next to this file first.

## The open item (astra, medium correctness)

"`apps/desk/public/app.js`. The `resync()` path is seat-confirmed: it re-reads the live-session handle after the `get_messages` await with no generation check, so a session switch mid-flight repaints the new pane with the old session's messages. The reconnect, bash echo-before-fetch and dedup cases are astra-reported and not individually confirmed."

Files: `apps/desk/public/app.js` (2333 lines; the page), `apps/desk/public/desk-client.mjs` (SSE wrapper, `new EventSource` ~157, `onerror` ~167). Server side only if a race cannot be closed on the client (say so explicitly if you touch `server.mjs`).

## Leads to confirm (each with file:line and the exact interleaving)

1. **resync after switch** (`resync()` ~517): `L` (the live-session handle) is read before the `await rpc({type:"get_messages"})` and `renderMessages` runs after it without checking that `L` is still the same session. Interleaving: select A → resync starts → select B (L = B, pane cleared, B's hello renders) → A's get_messages resolves → `renderMessages(A.messages)` paints into B's pane. CONFIRMED by the seat; still re-read it and state the line.
2. **Reconnect**: `EventSource` auto-reconnects on error; the server re-sends `desk_hello` on attach. Check what the page does with a SECOND hello for the same session (open dialogs, statuses, widgets, queue, streaming state): duplicated dialog nodes? stale `streaming` flag? a resync that races the hello? Also: a reconnect that lands AFTER the user switched sessions — does the old stream's handler still write into the new pane (same generation problem as lead 1, on the event path)?
3. **Bash echo-before-fetch** (`!cmd` path ~1751–1765 and `bash_execution_update` ~816, `desk_bash_result` ~825): the page POSTs `/api/session/:id/bash`, then creates the row with the returned id. If the SSE `bash_execution_update` for that id arrives BEFORE the fetch resolves, `ctx.toolRows.get("bash:"+id)` misses → output chunk lost, or a row is created twice. Confirm the ordering is actually possible (the server sends the RPC to the child, the child streams on stdout; the HTTP response is written when? — read `server.mjs` bash handler) and what the page does today.
4. **Prompt dedup** (`send()` optimistic bubble + `message_end` swap; regression test `test/double-msg.e2e.mjs`): astra's claim is a race of the same shape. Enumerate the cases: echo beats fetch (already handled — verify), fetch rejects after echo (rejected prompt but bubble already swapped?), two sends in flight, a steer during streaming, Esc reclaim while a send is in flight. Confirm or NOT-A-BUG each.

## Required behaviour after the fix

- A **session generation** (monotonic counter bumped on every session select/close/reopen) captured by every async continuation that touches the pane: `resync`, stats/state polls, the hello handler, bash fetch, prompt fetch, `get_entries`/history loads. A continuation whose generation is stale returns without touching the DOM or `L`. One mechanism, applied everywhere; no per-site ad-hoc flags.
- Reconnect (second `desk_hello`) replaces dialog/status/widget/queue state idempotently — no duplicate dialog nodes, no stuck spinner, `streaming` derived from the hello, one resync after it (not one per hello + one per reconnect).
- Bash: the row exists before any stream event for it can arrive (pre-create with a client-side placeholder id and re-key on the response, OR buffer per-id events until the row exists and flush in order — pick one, justify). Output order preserved.
- Prompt dedup: whatever cases you confirm, close with the same optimistic-then-authoritative shape the existing code uses; do not introduce a second bubble model.

## Tests (deterministic, browser-level, Playwright; `PW_ROOT=/Users/jwang/nana-pi`)

Follow `test/double-msg.e2e.mjs` — a real server, a fake child, `page.route()` or a controllable fake child to DELAY or REORDER responses. Timing-based sleeps are not acceptable as the only control; delay the specific response deterministically (hold the fake child's `get_messages` reply until the test releases it).
- switch mid-resync: hold A's `get_messages`, switch to B, release → B's pane shows only B; A's messages never appear; no page errors.
- reconnect: kill the SSE socket server-side (or `evaluate` a close) with an open dialog and a status chip → after reconnect exactly one dialog node, one chip, no duplicate resync (count `get_messages` RPCs).
- bash echo-first: fake child emits `bash_execution_update` before the server answers the POST (the fake child can do this if the server writes the response after forwarding; if the server answers first, the test proves NOT-A-BUG and pins the ordering) → output present, one row.
- each confirmed dedup case.

## Docs

- `apps/desk/README.md`: delete the "Client-side races remain" Known-limit bullet; add one Contract-notes line describing the generation rule ("a response for a session you have left is dropped, never painted") and the reconnect rule. If you touched server ordering for bash, declare it.
- `docs/review-punchlist-2026-09-08.md`: rewrite the STILL OPEN races item as FIXED `<hash>` with the per-lead verdicts (CONFIRMED-fixed / NOT-A-BUG); keep anything left open as STILL OPEN with the reason.
