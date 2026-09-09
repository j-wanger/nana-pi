# Review brief — nana-pi desk: bounded buffers (server) + client-side races (page)

You are the independent land reviewer (non-Anthropic lens) for two sibling changes to the nana-pi desk, a loopback Node control plane (`apps/desk/server.mjs`, `apps.mjs`) plus its browser page (`apps/desk/public/app.js`) driven over SSE + fetch. Verify; do not restate the diffs. Be concrete: file:line, the exact interleaving or input, the minimal fix.

## Change 1 — bounded buffers (worker's claims; verify)

Threat: a LOCAL producer (pi child, extension inside it, app `data` command, a browser tab that stops reading) grows memory in the one process that holds every live session.
1. `STDOUT_LINE_CAP` 64 MiB (chars, decoded): an unterminated child stdout line past the cap is discarded, the child KEPT, one `desk_event_dropped` broadcast, one log line, every pending RPC on that child rejected (one may have been the dropped answer). Justified against pi's largest legitimate line (a `get_messages` response, measured 18.4 MiB).
2. `SSE_CLIENT_BUFFER_CAP` 8 MiB per client: when `res.writableLength` exceeds it after a write, that client is ended + socket destroyed; EventSource reconnects and gets `desk_hello`.
3. `MAX_PENDING_RPC` 64 per child: `sendRpc` rejects with a 429-shaped error; the `/bash` route (which fills `child.pending` directly) has the same check.
4. `DATA_OUTPUT_CAP` 8 MiB for an app `data` command's stdout: SIGKILL + 500 naming the cap; stderr held as an 8 KiB tail.
5. Checked and already bounded: `stderrTail` (2000 chars), `readBody` (32 MiB). Left open, declared: per-child `statuses`/`widgets`/`dialogs` maps grow per distinct key; `/export` reads the HTML whole.
6. Test `apps/desk/test/buffer-caps.test.mjs` (real server, stub pi, caps lowered by env; 10 assertions fail with the caps reverted).

## Change 2 — client-side races (worker's claims; verify)

1. One mechanism: `stageGen` counter bumped in `clearStage()` (the single point every select/close/reopen passes through) and `stale(g)` checked by every async continuation that touches the pane/`L`/editor: `resync`, `refreshState`, `refreshStats`, `reclaimQueue`, `openLive` (`get_commands`, file list), the SSE `onmessage` and `onerror` closures, the bash POST, the prompt POST incl. `restore()`, `openHistorical`.
2. Reconnect: `L.helloSeen` — a SECOND `desk_hello` on the same stage triggers exactly one `resync()` (which restores the chip + `streaming`). Worker says duplication of dialogs/chips on replay was already impossible (id-guarded `showDialog`, `innerHTML=""` renders) and the real defect was that a second hello did nothing (events lost, chip stuck on "disconnected").
3. Bash: events for an unknown id (`bash_execution_update`, `desk_bash_result` arriving before the POST that creates the row returns) are buffered per id in order and flushed on row creation; bounded 8 ids × 200 events × 20 000 chars. Server ordering unchanged.
4. Prompt: `restore()` no-ops when the optimistic bubble was already consumed by pi's echo (a lost POST answer after the echo used to push the text back into the editor = duplicate send waiting). Ruled NOT-A-BUG with evidence: echo-beats-fetch, two sends in flight, steer during streaming, Esc reclaim mid-send. Left open, declared: a picker RPC already in flight at switch applies to the new session; a steer byte-identical to a pending prompt consumes its bubble.
5. Test `apps/desk/test/session-races.e2e.mjs` (Playwright, real server, stub pi, `page.route` holds the exact response, an SSE spy for release conditions, a TCP relay to destroy the real SSE socket; 8 checks fail on the pre-fix page).

## Read

- Diffs: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-buffers.patch and diff-races.patch
- Post-change merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/server.mjs` (search `STDOUT_LINE_CAP`, `sseWrite`, `MAX_PENDING_RPC`, `droppingLine`), `apps/desk/apps.mjs` (`runData`), `apps/desk/public/app.js` (`stageGen`, `stale(`, `helloSeen`, `bufferBashEvent`, `restore`), `apps/desk/public/desk-client.mjs`, the two tests, `apps/desk/README.md` (Contract notes 2026-09-09 four buffer caps / page races; Known limits), `docs/review-punchlist-2026-09-08.md` (the two FIXED entries).
- Note: a third sibling lane (stage signing keys) is merged in the same tree and adds a `get_state` RPC to every `/api/entries` read; it is reviewed separately, but flag any interaction with the RPC cap or the stdout cap.

## Dimensions

A. **Cap semantics.** stdout: after a dropped line, is the decoder/`pending` state guaranteed to resynchronise on the next newline (multi-byte boundary, `\r\n`)? Is `droppingLine` reset correctly when the overflow happens on a chunk that ALSO contains the terminating newline? Rejecting ALL pending RPCs — is that the right blast radius, and does anything observe a rejected prompt as "session dead"? Is 64 MiB defensible or would a smaller cap have broken a real path?
B. **SSE drop.** Is `writableLength` the right measure (kernel buffer vs Node buffer)? Can a HEALTHY client on a slow machine be dropped during a legitimate burst (e.g. `desk_hello` for a large session, a 256 KiB signed block ×N)? After `res.end()`+`destroy()`, is the client removed from `child.clients` on every path (the `sseWrite` return value → caller deletes)? Reconnect storm: a client dropped repeatedly reconnects repeatedly — any amplification?
C. **RPC cap.** Both fill sites covered? Is the count checked BEFORE the id is consumed (`nextRpc`)? Does the desk's own page (N tabs × polls + the new stage-key `get_state` per ledger read) plausibly hit 64 on one session and start 429-ing legitimate prompts? What does the page do on a 429 from `/rpc` (toast? silent?)
D. **Data cap.** Race between `overCap` resolve and the `close` handler; SIGKILL on win32 (`proc.kill` vs the tree-kill used elsewhere); is a `500` with the cap message reachable by a test without a 8 MiB fixture (env lowered)?
E. **Generation mechanism.** Enumerate every async continuation in `app.js` that touches the DOM/`L` and check each captures `g` — list any that do NOT (pickers are declared open; anything else?). Is `stageGen` bumped on EVERY path that changes `L` (including the child-exited path, "new session" from the picker, rename)? Can a stale SSE stream still be open (leak) after switch, even if its events are ignored?
F. **Reconnect + bash + prompt.** `helloSeen` reset correctly on every switch? Could the "one resync per second hello" double up with the settled-resync the page already does after `message_end`? Bash buffer: order preserved when `desk_bash_result` arrives before the last `bash_execution_update`? Flush on row creation for a row created by history re-render (not the POST)? `restore()` guard: is `L.optimisticUserEls` the authoritative signal, and can a 409 from the server (rejected prompt) arrive AFTER the echo (then the text is not restored though the prompt was refused)?
G. **Tests as evidence.** Do the tests fail for the right reason pre-fix (worker reports 10 and 8 failures)? Determinism: any sleep-based ordering left? Fixed ports: does either test add a port that collides with an existing test (the suite must run file-by-file; report collisions)? Does `buffer-caps` leave sockets/children behind (teardown invariants)?
H. **Docs.** README contract notes accurate vs code (numbers, error strings, event names)? Anything observable undeclared?

## Output

Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
