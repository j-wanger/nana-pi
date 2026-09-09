# Lane: bounded buffers in the desk server (branch `fix/buffers`)

Worktree: `/private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-buffers`. Read `brief-common.md` next to this file first.

## The open item (astra, medium; high availability impact with a hostile local producer)

"Unbounded buffers. Child stdout accumulates until a newline arrives, SSE writes are not backpressure-aware, pending RPCs are uncapped, and an app `data` command's stdout is read whole. The stage's 128/256 KiB text caps bound what a model reads — not `details`, the ledger, or the transport."

Threat model to design against: a LOCAL producer (a pi child, an extension inside it, an app `data` command, or a slow/hung browser tab) that emits or fails to drain arbitrarily much. The desk must stay up and keep serving its other sessions. Nothing here is authentication.

## Leads to confirm (each with file:line)

1. `apps/desk/server.mjs` ~289–300: `pending += decoder.write(chunk)` with newline splitting. A child that writes a multi-GB line with no `\n` grows `pending` without bound.
2. `apps/desk/server.mjs` `sseWrite`/`broadcast` (~155–178): `res.write(line)` return value ignored; a client that never reads accumulates in the socket's write buffer (`res.writableLength`) without bound while the child keeps streaming.
3. `apps/desk/server.mjs` `child.pending` Map (~275, ~480–490): RPCs are added without a cap. Confirm whether the existing per-RPC timer bounds lifetime; a caller that fires thousands of `/api/...` requests before any resolve still grows the map. Also check `/api/entries`, `get_messages` and stats polls from N tabs.
4. `apps/desk/apps.mjs` ~185–200: `out += c` for an app `data` command's stdout; read whole before `JSON.parse`. The timeout kills on time, not on size.
5. `child.stderrTail` — confirm it is already bounded (state the cap) or bound it.
6. Any other accumulation you find on the same paths (e.g. `readBody` for request bodies — confirm it has a cap; export temp files; `--append-system-prompt` size). Report, fix only if on the item's paths.

## Required behaviour after the fix (the contract)

- **Child stdout line cap**: a hard cap on the unterminated `pending` buffer (pick a number, justify it against pi's own largest legitimate RPC line — a `get_messages` response for a long session can be several MiB; check what pi caps tool results at, `docs/` in the installed pi package or its source under `$(npm root -g)/@earendil-works/pi-coding-agent`). On overflow: discard the partial line, keep the child running, emit ONE `desk_event_dropped` (existing type) with a reason to the session's clients, reject any pending RPC whose response was the dropped line (they will otherwise wait for their timer), and log once. Do NOT kill the child for this; a pathological line must not cost the user the session.
- **SSE backpressure**: per client, if `res.writableLength` (or `writableNeedDrain`) exceeds a cap, END that client's response (it reconnects and gets a fresh `desk_hello` snapshot — that path exists). Never block or buffer per client on the server side. Say in the README that a slow tab is disconnected and resynced, not throttled.
- **Pending RPC cap** per child: above N in flight, new RPCs fail fast with a distinct error (`429`-shaped JSON on the HTTP side, a rejected promise internally) rather than queueing. Existing timers unchanged.
- **App `data` command output cap**: above M bytes, kill the process and answer `500` with an explicit "data output exceeded cap (M bytes)" body (same style as the timeout body).
- Every cap is a named constant at the top of the file, overridable by an env var ONLY if the existing code already has that pattern (check; do not invent a config surface).

## Tests (failure-first, real server on an ephemeral port, fake child where the existing tests use one)

- stdout: a fake child that writes 2× the cap without a newline, then a normal JSON line → the server survives, clients receive `desk_event_dropped`, the next line is processed, the child is still "running".
- SSE: a client that connects and never reads while the child floods → that client is ended; a second, healthy client on the same session keeps receiving; the server's RSS/`writableLength` does not track the flood (assert on `writableLength` before/after, not on timing).
- pending: N+1 concurrent RPCs against a child that never answers → the (N+1)th fails fast; the first N still resolve/reject on their timers.
- data cap: a fake app whose `data` command prints M+1 bytes → 500 with the cap message, process reaped (no zombie: assert on `proc.exitCode`/`killed` through the same teardown invariants the suite already has).

## Docs

- `apps/desk/README.md`: delete the "Buffers are unbounded" Known-limit bullet; add a Contract-notes entry naming the four caps and what happens at each. Plain language.
- `docs/review-punchlist-2026-09-08.md`: rewrite the STILL OPEN buffers item as FIXED `<hash>` with a one-line per-cap summary; keep any sub-item you deliberately left open as STILL OPEN with the reason.
