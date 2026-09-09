### A. Cap semantics — FINDING

- **SHOULD — `apps/desk/server.mjs:405-441`**: the cap is checked only after all newline-terminated lines in the chunk are processed. Interleaving: `pending` is just below the cap; the next chunk contains enough data to exceed it **and** `\n`. The oversized line reaches `JSON.parse()` and is never reported as dropped. Memory remains approximately bounded by cap plus one stream chunk, but the documented “past the cap is discarded” contract is false. **Minimal fix:** check each extracted line’s length before parsing, using the CR-stripped line, while retaining the existing partial-line check.
- Decoder resynchronization otherwise works across UTF-8 boundaries and `\r\n`; `droppingLine` correctly ignores through the next newline and then processes subsequent lines.
- Rejecting all pending RPCs is conservative but appropriate. Prompt callers receive a rejection and do not treat the child as dead. The measured 18.4 MiB `get_messages` path makes 64 MiB defensible, though four two-byte JS strings can occupy nearer 512 MiB than the comment’s 256 MiB.

### B. SSE drop — FINDING

- **SHOULD — `apps/desk/server.mjs:1873-1875`, `apps/desk/apps.mjs:361-363`**: the return from the `exitNote` write is ignored. If the hello succeeds but the second write crosses the cap or fails, the destroyed response is still inserted into `child.clients`; the close listener is registered only afterward. **Minimal fix:** `if (child.exitNote && !sseWrite(...)) return;` before adding the client.
- `res.writableLength` correctly measures Node’s retained writable queue, not the kernel send buffer; the comments at `server.mjs:143-146` inaccurately claim both. A healthy client can be disconnected by a synchronous burst once the kernel plus 8 MiB queue fills, but reconnect/resync is the declared policy.
- An oversized `desk_hello` from the acknowledged unbounded maps can cause repeated immediate reconnect, serialization, and drop cycles. **Minimal mitigation:** cap/suppress EventSource retries client-side after repeated hello failures, or bound/summarize those snapshot maps.

### C. RPC cap — PASS

Both insertion sites are covered (`server.mjs:622-630`, `server.mjs:1900-1906`), and both check before consuming `nextRpc`. The stage-key `/api/entries` path adds two concurrent RPCs per read (`apps.mjs:382-390`), but ordinary page polling remains far below 64; saturation requires many tabs or a non-answering child. `/rpc` errors become thrown `rpcCall` errors: interactive actions generally toast them, while background state/stats/rail refreshes intentionally swallow them. Prompt saturation is translated by `promptChild` to 409 and restores the optimistic input.

### D. Data cap — FINDING

- **SHOULD — `apps/desk/apps.mjs:203-220`**: timeout/over-cap/close settlement is safely single-threaded and guarded, and the lowered environment cap makes the 500 test reachable. On Windows, however, `proc.kill("SIGKILL")` kills only the direct process, unlike the existing `taskkill /t /f` lifecycle helper; a command that launches a descendant inheriting stdout can leave that descendant alive. **Minimal fix:** use a shared cross-platform process-tree kill helper for timeout and over-cap paths.

### E. Generation mechanism — FINDING

- **BLOCK — `apps/desk/public/app.js:2343-2347`**: Esc awaits `reclaimQueue()` for A, then reads global `L.id`. If the user switches to B while A’s `clear_queue` is pending, `reclaimQueue` correctly returns stale, but the continuation then aborts **B**. **Minimal fix:** capture generation and session id before the first await and return if stale before posting abort.
- **SHOULD — `app.js:1924-1929`**: `FileReader.onload` can attach an image selected in A to B after a switch. Capture `stageGen` and ignore stale loads.
- **SHOULD — `app.js:1846-1848`, `1750-1805`**: slash-command continuations are not generation-bound. In particular, switching while `handleDeskCommand()` awaits can clear B’s editor afterward; `/model <pattern>`, `/new`, `/clone`, rename, and export continuations also touch current `L`/DOM without their originating generation.
- **SHOULD — `app.js:2075-2087`**: a delayed spawn response can call `openLive()` after the user has selected another stage, reopening the older requested session.
- The named core paths—resync, state/stats, queue reclaim result, command/file loads, SSE callbacks, bash/prompt POSTs, and historical load—are guarded. `clearStage()` closes the old EventSource, so stale streams are not intentionally leaked. Child exit and rename do not replace `L`; kill/select/reopen do pass through `clearStage()`.

### F. Reconnect, bash, and prompt — FINDING

- `helloSeen` is reset by `newLiveState`; each reconnect hello triggers one resync. It can overlap with an independently triggered `agent_settled`/`compaction_end` resync, but does not itself trigger twice.
- Arrival order is preserved for buffered bash events, including result-before-update.
- **BLOCK — `apps/desk/public/app.js:374-381`, `388-395`**: the advertised 20,000-character bound counts only `delta`. A buffered `desk_bash_result.data.output` is retained whole, and `finishBashRow` also renders it whole. Eight unknown ids can therefore retain eight stdout-cap-sized results, not 20,000 characters each. **Minimal fix:** normalize buffered events, slicing/counting `data.output`, `delta`, and error text against one per-id character budget; also truncate result output when rendering.
- **SHOULD — `app.js:486-493`, `345-352`, `1838`**: a reconnect resync can history-render a completed `bashExecution` without its RPC id while the POST is held; the eventual POST then creates a second row and flushes into it. The buffer is flushed only by POST row creation, not history re-render.
- **SHOULD — `app.js:1872-1896`**: `optimisticUserEls` proves only that a matching echo was observed, not that the HTTP request succeeded. Exact interleaving: matching `message_end`, then an explicit `{success:false}` response within five seconds; the server returns 409, but `restore()` no-ops. **Minimal fix:** distinguish explicit rejection from transport loss and suppress restoration only for the latter, or reconcile against authoritative refreshed history.
- The byte-identical steer consumption limitation is real and remains undeclared in README.

### G. Tests as evidence — FINDING

- The pre-fix failure counts are credible from the assertions: ten buffer failures and eight race failures target the stated regressions.
- **SHOULD — `apps/desk/test/session-races.e2e.mjs:48-49`**: ports 4441/4442 collide with `stage-key-persistence.test.mjs:35-36`. File-by-file execution avoids simultaneous binding, but `die()` does not await server/relay/browser shutdown before `process.exit`, so the next file can race the previous server’s release. **Minimal fix:** allocate ephemeral desk and relay ports and await all close/exit events.
- **NIT — `session-races.e2e.mjs:240,278,309,331,355-356`**: despite the “no sleeps decide any outcome” claim, several negative assertions rely on 500–1000 ms waits and one polling sleep. Release ordering is controlled, but completion is still timing-based. Replace these with explicit request/SSE counters or app-side completion signals.
- **SHOULD — `buffer-caps.test.mjs:257-261`**: teardown SIGKILLs the server and waits a fixed 300 ms without awaiting server exit or proving every child/socket is gone. **Minimal fix:** close clients, terminate sessions/server, await exit, and assert recorded child PIDs are gone before removing the fixture.

### H. Docs — FINDING

- **BLOCK — `apps/desk/README.md:284-290`**: the documented “8 ids × 200 events × 20,000 characters” bash bound is false because result output is neither counted nor truncated.
- **SHOULD — `README.md:267-283,367-370`**: the claim that every pane/`L`/editor continuation is generation-bound omits the Esc-abort, FileReader, slash-command, spawn-response, and export/rename continuations above. Known limits mention only picker RPCs.
- **SHOULD — `README.md:226`**: “Nothing … grows without a ceiling” conflicts with the immediately documented unbounded status/widget/dialog maps and whole-file export. Narrow it to the four transport/concurrency accumulations.
- Numeric caps, environment names, primary error strings, and `desk_event_dropped` naming otherwise match the implementation.

VERDICT: BLOCK
