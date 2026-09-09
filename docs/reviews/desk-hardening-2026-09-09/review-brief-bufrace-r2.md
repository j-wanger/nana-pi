# Review brief — bounded buffers + client-side races, ROUND 2

You reviewed round 1 and returned VERDICT: BLOCK (your review: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-sol-bufrace-r1.md — read it first; round-1 brief with the claims: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/review-brief-bufrace.md). Both workers folded. Verify each fold against the code and hunt for regressions the folds introduced. Do not re-litigate accepted design (four caps; drop-not-throttle; one generation counter; content-matched optimistic swap).

## Buffers folds (verify)
A. Each extracted CR-stripped line is length-checked before `JSON.parse` via one `dropOverCapLine()`; the remainder check stays. Comment corrected to ~512 MiB.
B. `if (child.exitNote && !sseWrite(...)) return;` at both attach sites (server.mjs, apps.mjs). Worker says no interleaving leaks a dead client (sync writes, close listener same tick) — folded as consistency. Oversized-hello reconnect cycle: declared in README Known limits, not fixed.
D. `killTree(proc, signal)` shared helper; `killChild` wraps it; `runData` uses it for timeout and over-cap (win32 branch untested, stated).
G. `buffer-caps.test.mjs` teardown: closes clients, DELETEs sessions through the real route, awaits desk exit, asserts recorded pids gone.
H. README opening narrowed to the four transport/concurrency accumulations; `writableLength` wording; chars-not-bytes; tree-kill.

## Races folds (verify)
E1. Esc: generation + session id captured before the first await; abort skipped when stale.
E2. Guarded: `FileReader.onload`, `handleDeskCommand` (`/model` set_model, `/thinking`, `/name`, `/new`, `/clone`, the caller's `input.value = ""`), `renameSession`, `exportSession` (label read before the request; download still happens), `spawnSession` (stale → refresh rail, no `openLive`).
F1. Bash buffer: one `BASH_CHARS = 20000` budget over delta + `data.output` + error; `clipBashEvent` cuts on the way in; `finishBashRow` renders the same window and reports `· truncated`.
F2. Reconnect + held POST: `renderMessages` bumps `L.renderSeq`; the bash POST captures it; if changed, `adoptHistoryBashRow` claims the newest unclaimed finished card with the same command, keys it by RPC id, DROPS buffered events (history authoritative). Newest-match heuristic stated in a comment.
F3. `restore(explicit)`: explicit rejection (`{ok:false}`/409) always restores text and removes a still-pending optimistic bubble; lost response after echo keeps the no-op.
G. `die()` awaits browser/relay/server; `uncaughtException`/`unhandledRejection` route through `die`; `page.unrouteAll` before close; polling sleep replaced by a route-resolved promise; a fetch spy fences negative assertions; remaining waits tagged `SETTLE = 400 ms` and declared in the header. Ports 4441/4442 kept (the stage-key test moved off them).
H. README: bash bound restated; generation bullet lists exactly what is covered, picker named as the exception; byte-identical steer declared.

## Read
- Round-2 diffs: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/diff-buffers-r2.patch and diff-races-r2.patch
- Post-fold merged tree: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/57ce8f73-0f8c-43aa-a701-395f73f0ce7d/scratchpad/wt-int — `apps/desk/server.mjs`, `apps/desk/apps.mjs`, `apps/desk/public/app.js`, `apps/desk/test/buffer-caps.test.mjs`, `apps/desk/test/session-races.e2e.mjs`, `apps/desk/README.md`, `docs/review-punchlist-2026-09-08.md`. (A third lane, stage signing keys, is mid-rewrite in this tree; ignore `stage-keys.mjs` except for interactions with the RPC cap.)

## Dimensions
A. Line cap fold: any path where a line is dropped twice or the `desk_event_dropped` fires per chunk instead of once? Does the per-line check change behaviour for a legitimate line just under the cap that arrives with `\r\n`?
B. `killTree` on POSIX vs the pre-existing `killChild` — any behaviour change for the session lifecycle (signal, grace, group kill)? `runData` over-cap: is the `close` handler still guarded after the tree kill?
C. Generation folds: each guard placed BEFORE the first DOM/`L` mutation, not after? `spawnSession` stale path: does the newly spawned session still appear in the rail and is its child tracked (no orphan)? `exportSession` stale: any DOM touch after the download?
D. F2 adoption: can `adoptHistoryBashRow` claim a card belonging to a DIFFERENT, still-running command with the same text (e.g. two `!ls` in flight)? Is `renderSeq` bumped by every history render path (reconnect resync, settled resync, historical open)? Dropping buffered events when adopting: can that lose a `desk_bash_result` error that history does not carry?
E. F3 split: is "explicit rejection" detected on every server shape (`{ok:false}`, HTTP 409, `{error}`), and can a 409 for a DIFFERENT reason (e.g. tools not ready) now remove a bubble that was legitimately echoed?
F. F1 clipping: cut on a UTF-16 surrogate boundary? `· truncated` shown only when something was cut? Existing streaming path's window and the new render window agree?
G. Tests: do the seven new race checks fail for the stated reason on the pre-fold page (the worker reports 7 more failures)? Any new fixed port? Teardown really awaits exit (signal exits report `code === null`)? Any remaining timing-decided assertion not tagged?
H. Docs exact vs code (numbers, strings, event names); anything observable from round 2 undeclared?

## Output
Per dimension: PASS or FINDING (BLOCK / SHOULD / NIT, file:line, what, minimal fix). Then exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
