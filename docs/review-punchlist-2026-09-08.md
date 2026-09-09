# nana-pi review punch-list (2026-09-08)

**Status as of 2026-09-08, after the hardening pass.** The pass landed nine commits on `main` (five code, four docs/skills).
Four closed the per-angle review (`368f67f` desk · `2efd435` nana-pack · `58645c5` nana-stage ·
`f777638` docs/skills), each adversarially reviewed per package by **gpt-5.6-sol** (all three code
commits came back BLOCK first; every finding was folded failure-first). A whole-unit review by
**gpt-6-astra** then read all four commits, the combined diff, the new tests and this list, and
returned **BLOCK** on two incomplete repairs plus a SHOULD on resource classification; `53d4aab`
folds all three. A sol review of `53d4aab` then blocked again (timer-freed slot, error→exited,
leaf-only save-symlink check); `e493043` folds those; its own sol review passed everything but the context-file root being request-derived,
folded in `ddffd6b` (the last code commit of the pass; sol: A/C/D/E PASS).

The original list came from four independent **gpt-6-astra** reviews, one per angle: security &
trust · extension correctness & cross-platform · desk robustness · product coherence & docs.

**Confidence caveat.** **FIXED** = the landed code was read line-by-line for this list, and the
commit ships a test written failure-first (each of the five commits records that its fixes were
pinned by tests that fail with the fix reverted). Re-run green while writing this list:
`blocks.test.mjs` (112), `stage-render-edge` (11), `crash-paths` (42), `spawn-and-persist` (64),
`handoff-symlink`, `post-edit-hardening`, `post-edit-file-queue` — all exit 0.
**STILL OPEN** = astra-reported; the severity and the next step are astra's, and most have *not*
been line-by-line seat-verified — strong leads to confirm before fixing, not facts.
**NOT-A-BUG** = the reported lead was checked and the code was already correct;
where a real defect sat next to it, that is named.
This is a personal localhost tool: severities read "if nana-pi were shared or used broadly," not
"the personal happy path breaks today."

**The running desk is not this code.** The launchd service (`com.nana.pi-desk`, port 7317) keeps
executing the `server.mjs` it loaded at launch. None of the fixes below protect it until it is
restarted.

---

## Closed by the whole-unit review — commit `53d4aab`

astra's two BLOCK findings and its resource-classification SHOULD, folded failure-first:

- **FIXED `53d4aab` — historical rename severed context when the last entry exceeded the tail
  window.** As `368f67f` landed it, `sessionTail()` scanned two fixed windows (64 KiB, then 1 MiB)
  and discarded each one's partial first line; when the last valid entry fit in neither it returned
  `leafId: null`, the appended `session_info` became a new root, and resume came back with empty
  context — the exact failure that commit set out to fix, reachable via image-bearing messages and
  large compaction checkpoints. Now the window **grows** (64 KiB ×8, up to a 64 MiB budget) until a
  complete last entry is bounded, and "not found within budget" is its own answer (`status:
  "unknown"`) that makes the rename refuse with **409**, never a null leaf. Judged by pi's own
  `SessionManager`: `buildContextEntries()` = 1 before the fix, 3 after.
- **FIXED `53d4aab` — the stdin-EPIPE path bypassed the teardown escalation.** It marked a
  still-live child `exited` and sent SIGTERM only, freeing its `MAX_CHILDREN` slot at once, so a
  child that closed stdin and ignored SIGTERM survived untracked. It now goes through the shared
  `teardownChild()` lifecycle (counted while `exiting`, SIGTERM → SIGKILL after the grace, record
  dropped only on real exit) and settles pending RPCs with "session stdin closed". SIGINT/SIGTERM
  shutdown uses the same escalation.
- **FIXED `53d4aab` — global vs project resource classification.** Where a resource **lives**
  decides, not which config named it: anything whose real path is inside the spawn cwd is marked
  project-controlled (pi's own `~/.pi/agent` and `~/.agents` excluded), and `packages` entries
  resolve only in their declared scope (`~/.pi/agent/{npm,git}` for a global entry, `.pi/{npm,git}`
  for a project one). With `approve: false` the server now **refuses** a project-path resource
  outright rather than passing it via `-e` beside `-na`. An app manifest's own
  `trust: "no-approve"` is deliberately not covered — that is operator-authored config.
- **FIXED `53d4aab` — context/agent saves and their `.bak` followed symlinks.** Both
  `/api/context-file` and `/api/agents` `lstat` the destination *and* its `.bak` first and answer
  **409** on a link, so a repo-planted `AGENTS.md` symlink can no longer redirect a write.
  `~/.pi/agent/*.json` is intentionally exempt: those are the user's own paths and symlinking them
  into a dotfiles repo is a normal setup.

Tests with it: `crash-paths` 42 (EPIPE plus a stubborn child, one fixture), `spawn-and-persist` 64
(the SessionManager-judged resume case, resource classification incl. a home-directory-spawn
regression). `stage-render-edge` moved to ephemeral ports, the SSE reader frames incrementally, and
sleeps became readiness handshakes.

---

## Security

- **FIXED `368f67f` — [was high] title-derivation agents kept full `read/bash/edit/write`.** The
  `pi -p` child now runs `--no-tools --no-session --no-extensions --no-skills
  --no-prompt-templates --no-context-files`; historical text is fenced as data with an unclosable
  fence and capped at 1200 chars.
- **FIXED `2efd435` — [was high] nana-handoff followed symlinks in untrusted projects.** Refusal is
  now unconditional (trusted projects too), covers reads, writes and the sibling `.pi/.gitignore`,
  and checks *every* path component below the workspace root. Refusals journal
  `handoff_symlink_refused` and notify. Documented in `packages/nana-pack/README.md`, including
  the deliberate root/external-path exceptions and the fact that it is advisory (lstat is not
  atomic with the open) and non-atomic on write.
- **FIXED `58645c5` — [was high] stage.js chart-label → `innerHTML` XSS.** The tooltip is built
  with DOM APIs; reproduced with `<img onerror>` and pinned by `stage-render-edge.e2e.mjs`.
  **NOT-A-BUG (same sweep):** the other `innerHTML` sites were audited and were already safe —
  constant clears, and `mdToHtml` is escape-first with `href` limited to `http(s)`.
- **FIXED `368f67f` — [was high] DNS rebinding on GET reads.** Host allowlist on every request for
  the desk and every app listener (`127.0.0.1` | `localhost` | `[::1]` with that listener's port).
  A missing `Host` header is deliberately allowed (non-browser clients) — this is a rebinding
  guard, not authentication.
- **FIXED `53d4aab` — [was astra: high, conditional] global vs project resource confusion.** A
  globally-configured `packages` entry used to resolve by searching `~/.pi/agent/npm|git` and then
  `<cwd>/.pi/npm|git`, so a package living only inside the project satisfied a global entry, was
  labelled non-project, escaped the trust checkbox, and was then supplied explicitly with `-e`.
  Packages now resolve in their declared scope, path-based classification marks anything inside the
  spawn cwd as project, and `approve: false` refuses such a path outright. Details above.
- **FIXED `53d4aab` — [was astra: medium, potentially destructive] context/agent saves and `.bak`
  followed symlinks.** `assertNoSymlinkWrite()` `lstat`s the destination and its `.bak` before
  either write and answers 409 on a link. `~/.pi/agent/*.json` stays exempt on purpose (a dotfiles
  symlink there is a normal setup) — that remaining, intentional following is named as a limit in
  `apps/desk/README.md`.

## Desk robustness

- **FIXED `368f67f` — [was high] malformed request target crashed the server.** `GET ///`, `//[`,
  `/\` are parsed inside the request boundary → 400, and the outermost catch destroys the socket
  when headers are already sent instead of throwing a second time.
- **FIXED `368f67f` — [was high] child stdout `null` crashed the event handler.** Non-object JSON
  is skipped; `handleChildEvent` is wrapped at the EventEmitter boundary; `broadcast()` is
  non-throwing (unencodable event dropped and clients told) so a 50k-deep object cannot take the
  desk down through `JSON.stringify`.
- **FIXED `368f67f` (crash) + `53d4aab` (lifecycle) — [was high] child stdin EPIPE.** `368f67f`
  added the error listener so the process no longer dies; `53d4aab` routed it through the shared
  teardown so the child stays counted until it really exits.
- **FIXED `368f67f` — [was high] `/api/transcript` ancestry had no cycle detection.** The
  `onBranch` set doubles as the visited set, so a self-referential `parentId` terminates.
- **FIXED `368f67f` (partially) — [was high] historical rename severed resumed context.** The
  `parentId: null` cause is fixed (the append chains to the file's real leaf, matching pi's own
  `appendSessionInfo`), with guards for an unterminated last line, a headerless/empty file (409),
  CR/LF in names, and a size re-stat before append. The oversized-final-entry residue was closed
  by `53d4aab` (growing window + 409), above.
- **FIXED `368f67f` — [was med] teardown dropped the child before confirming termination.**
  Exiting children stay counted toward `MAX_CHILDREN`; SIGTERM → SIGKILL after
  `DESK_KILL_GRACE_MS` (3 s) → record dropped with a warning.
  **PARTLY FIXED `53d4aab` — [astra: should] lifecycle ownership was not uniform.** DELETE, stdin
  failure and SIGINT/SIGTERM shutdown now share one escalation. **STILL OPEN:** POSIX deletion kills
  only pi's own PID, and detached post-edit checker groups can still outlive a desk restart; the
  nana-pack checker's grace is 2 s with forced settlement while the desk's is 3 s + SIGKILL + 3 s.
  **Next step:** different durations are fine, different ownership guarantees are not — state
  explicitly how far descendant cleanup reaches.
- **FIXED `368f67f` — [was med] config writes clobbered on read-error and swallowed backup
  failure.** An unreadable/unparseable file answers 409 instead of being replaced; a failed `.bak`
  aborts the write (500). Declared in `apps/desk/README.md`.
- **FIXED `368f67f` — [was med] UTF-8 split across stdout chunks corrupted prompts and signed
  blocks.** `StringDecoder` holds the partial bytes.
- **FIXED `368f67f` — [was med] one malformed manifest aborted desk startup.**
  **NOT-A-BUG as reported:** the `JSON.parse` guard in `apps.mjs` was already correct. The real
  killer was a manifest that *parses* to a non-object (`null`, an array, a number) — that is what
  the commit fixes.
- **FIXED `4875dd0` + `f8f26bc` — [was medium; high availability impact with a hostile local producer]
  unbounded buffers.** All four leads were confirmed line by line and capped, each a named constant
  with a tests-only env override (the `DESK_KILL_GRACE_MS` pattern), each declared in
  `apps/desk/README.md`. **Child stdout, 64 MiB:** an over-cap line is discarded and the
  session is KEPT — one `desk_event_dropped` to its clients, one log line, and the RPCs in flight
  on that child rejected, since one of them may be what the discarded line was answering and would
  otherwise wait out its timer (600 s for a prompt). Sized against the largest legitimate line pi
  emits — a `get_messages` response carries the whole conversation on one line, measured at
  18.4 MiB for the biggest session on this machine. It counts characters, not bytes, and covers
  a line that arrives in pieces AND one that arrives whole with its newline attached — the second
  case was missed in `4875dd0` (the cap was tested only on the unterminated remainder, so a
  producer that wrote its whole oversized line at once still reached `JSON.parse`) and closed in
  `f8f26bc`. **SSE, 8 MiB per client:** a client whose retained write queue passes the cap is
  ended and its socket destroyed; `EventSource` reconnects and resyncs
  from `desk_hello`. Disconnected, never throttled — one slow tab must not pace the fan-out.
  (Pre-fix, measured: a client that never read held all 10 MB of a test flood in the server's write
  buffer, still climbing.) **In-flight RPCs, 64 per child:** the next one answers 429
  (`/rpc` and `/bash`) instead of queueing; those already in flight are untouched. **App `data`
  stdout, 8 MiB:** SIGKILL and a 500 naming the cap, in the same shape as the timeout's 504 — the
  timeout only ever killed on time, which a command printing at pipe speed reaches after gigabytes;
  its stderr is now held as an 8 KiB tail. Two neighbours were checked and were already bounded:
  `stderrTail` (2000 chars) and `readBody` (32 MiB). Pinned by
  `apps/desk/test/buffer-caps.test.mjs` — the real server on ephemeral ports against a stub `pi`,
  ten assertions that fail with the caps reverted, plus two more that fail on `4875dd0` for the
  terminated-line case. **`f8f26bc` also folds the rest of the gpt-5.6-sol r1 review of this
  lane:** the `desk_hello`/`exitNote` route guards its second SSE write before joining the
  fan-out (confirmed as unguarded, but not reachable as a retained dead client — both writes are
  synchronous and the close listener still evicts, so it lands as consistency with no test that
  can tell the two apart); the app `data` kill goes through the desk's own `killTree`
  (`taskkill /T /F` on win32, untested — this machine is darwin; POSIX behaviour unchanged); the
  test's teardown now ends every session, awaits the desk's exit and asserts every recorded pid
  is gone. Its RPC-cap finding (C) passed unchanged.
  **STILL OPEN — [same class] the per-child maps a child fills through its own events.**
  `statuses`, `widgets` and `dialogs` (`handleChildEvent`, `apps/desk/server.mjs`) take one entry
  per distinct key for the life of the session and are replayed whole in every `desk_hello`, so a
  child emitting millions of distinct keys still grows the desk — and once that snapshot alone
  exceeds the SSE cap, every reconnect is dropped on its own hello and the session becomes
  unwatchable rather than merely slow (no client-side retry cap; declared in the README, not
  fixed). Left out of these commits because
  bounding them means deciding what a *dropped* status or widget means to the page — a contract
  change, not a fifth transport cap. **Next step:** cap each map and show the page that something
  was dropped, rather than silently losing a status.
- **FIXED `7a91f42` — [was medium correctness] client switching / reconnect / bash / dedup
  races.** `apps/desk/public/app.js`. One mechanism: a stage generation bumped in `clearStage()`
  (the single point every select / close / reopen passes through) and captured by every async
  continuation that touches the pane, `L` or the editor — `resync`, the `get_state`/
  `get_session_stats` polls, `get_commands`, the file list, the historical transcript load, the
  bash POST, the prompt POST, `reclaimQueue`, and the SSE stream's own message and error
  callbacks. A stale continuation returns without touching anything. Per lead:
  - **CONFIRMED, fixed — resync after switch.** `resync()` awaited `get_messages` and called
    `renderMessages` with no generation check; A's messages painted into B's pane.
  - **CONFIRMED, fixed — reconnect.** Not the duplication astra described: `showDialog` is
    id-guarded and the status/widget/queue renders clear their box first, so a replayed
    `desk_hello` was already idempotent. The real defect is the opposite — the page did
    **nothing** with a second hello, so the transcript silently lost every event from the
    disconnected window and the chip stayed "disconnected" forever. A reconnect now runs exactly
    one resync, which also restores the chip and `streaming` through `refreshState`.
  - **CONFIRMED, fixed — bash echo-before-fetch.** `server.mjs` writes the bash POST response
    *after* handing the command to the child, so `bash_execution_update` / `desk_bash_result`
    can reach the page first; the handlers looked up `bash:<id>`, missed, and dropped the event
    — losing output and leaving a card spinning forever. Events for an unknown id are now held
    per id in arrival order and flushed when the row is created (bounded: 8 ids × 200 events).
    Server ordering unchanged.
  - **CONFIRMED, fixed — dedup, lost response after an accepted prompt.** If the POST's answer
    is lost after pi echoed the message, `restore()` pushed the text back into the editor even
    though the prompt was already running — a duplicate send waiting to happen. `restore()` now
    no-ops when the echo has already consumed the optimistic bubble.
  - **NOT-A-BUG — dedup, echo beats fetch.** Already closed 2026-09-02 (append-before-POST +
    content-matched swap); now pinned without a model call.
  - **NOT-A-BUG — dedup, two sends in flight / steer during streaming / Esc reclaim mid-send.**
    Steer and follow-up append no optimistic bubble, the swap is content-matched rather than
    FIFO, and a `prompt` is never queued (so it cannot be reclaimed). No duplicate or lost
    bubble in any of them.

  Folded after an independent `gpt-5.6-sol` review (BLOCK), in `c8249d7`:
  - **BLOCK, fixed — the Esc reclaim-then-abort pair aborted the wrong session.** `reclaimQueue()`
    correctly returned stale, and the continuation then read the *global* handle and posted the
    abort to the session you had switched to. Both halves now carry the generation and the id
    captured when Esc was pressed.
  - **BLOCK, fixed — the bash buffer bound was false.** Only a streamed `delta` counted, so a
    buffered `desk_bash_result` retained its whole captured output and `finishBashRow` rendered it
    whole: eight unknown ids could hold eight stdout-cap-sized results, not 20 000 characters each.
    One per-id budget now counts `delta`, `data.output` and the error string, oversized text is cut
    on the way in, and a finished row renders the same 20 000-character window the streaming path
    keeps (reported as `· truncated`).
  - **BLOCK (docs), fixed — the README stated that false bound.** Rewritten to what the code does.
  - **SHOULD, fixed — five more continuations were not generation-bound:** `FileReader.onload`
    (an image picked in A attached to B), the desk slash commands that await before acting
    (`/model <pattern>` re-read the handle and set the *new* session's model), `renameSession`,
    `exportSession` (the download was named after whatever session was selected when the blob
    arrived — the label is now read before the request), and the spawn response (a slow spawn
    yanked the stage back; the session is now left in the rail).
  - **SHOULD, fixed — a reconnect during a held bash POST produced two rows.** The resync replays
    pi's own finished record of the command, which has no RPC id; the POST then added a second
    card and flushed into it. The POST now adopts that row when the transcript was rebuilt while
    it waited, and drops the buffered events (history is authoritative for the same output).
  - **SHOULD, fixed — `restore()` swallowed an explicit rejection.** A matching echo proves only
    that *some* client's message of that text was accepted; a `{ok:false}` / 409 answer proves ours
    was not. Explicit rejection now always returns the text to the editor; only a lost response
    after an echo leaves it alone.
  - **SHOULD, fixed (docs)** — the byte-identical-steer limitation and the narrowed generation
    claim are both in `apps/desk/README.md` now.
  - **SHOULD, fixed (tests)** — `die()` awaits browser, relay and server exit before
    `process.exit`, an `uncaughtException`/`unhandledRejection` hook routes every exit through it
    (a throwing route callback had leaked a desk server and its pi children), and every page drops
    its route handlers before closing. The polling sleep is gone; negative assertions are fenced on
    a fetch/SSE spy and then a single marked `SETTLE` window, and the file's header says so instead
    of claiming "no sleeps". Ports stay 4441/4442 per the seat's ruling.

  Folded again after `gpt-5.6-sol` round 2 (BLOCK), in `8afd799`:
  - **BLOCK, fixed — adoption could claim an OLDER identical command's card.** `renderSeq` proved
    only that *some* rebuild happened. With a finished `!twice` already in history and a second
    `!twice` still running, an unrelated resync made the returning POST claim the old card, drop
    its buffer, and never create its own row — and the running command's later output then landed
    on the old run's card (reproduced: `FIRST-RUN\nSECOND-RUN`). Adoption now requires that
    exactly **one new** finished card for that command appeared since the POST started and that no
    other POST for the same command is outstanding. When it is ambiguous the page adopts nothing,
    builds nothing from the buffer, and runs exactly **one** repair resync — history is the
    authority. The comment claiming a wrong pick was invisible is gone; it was false.
  - **SHOULD, fixed — adoption dropped a buffered transport failure.** `bashExecution` history
    records the run (exit 0), not a `desk_bash_result` that failed at the transport (a timeout, a
    dead child), so the visible failure vanished. A buffered terminal failure is re-applied to the
    adopted row.
  - **BLOCK, fixed — the single-budget claim was still false.** `clipBashEvent` never clipped
    `error`, returned after clipping one field, and `bufferBashEvent` kept one event even over
    budget; `finishBashRow` then rendered the whole error. All of an event's texts now share one
    remaining budget (error allocated first), every field is clipped, the retain-one escape is
    gone, and the error render is capped and marked `· truncated` like output. A 50 000-character
    error was retained and rendered whole before; it is 20 000 now.
  - **SHOULD, fixed — the cut could split a UTF-16 surrogate pair.** `slice(-20000)` opened on a
    lone low surrogate (reproduced: `U+DE00`). The cut steps one code unit in when it would split
    a pair.
  - **SHOULD, fixed — stale slash/spawn continuations still painted toasts.** `/model` was
    unguarded after its second await, every command rejection catch was unguarded, and
    `spawnSession` handled `r.error` before checking staleness. `stale(g)` now gates every awaited
    response and every catch, and `spawnSession` does the stale-success rail refresh before any
    response UI.
  - **SHOULD, fixed (tests) — `die()` raced the server against 5 s and exited anyway.** The server
    is spawned `detached` (its own process group); teardown sends SIGTERM to the group, and if it
    has not gone by the deadline sends SIGKILL to the group and **awaits** the exit before cleanup.
  - **BLOCK/SHOULD (docs), fixed** — the bash bound and the generation claim in
    `apps/desk/README.md` and here now state what the code enforces.

  Folded again after `gpt-5.6-sol` round 3 (BLOCK), in `c284123` — this time by **subtraction**:
  - **BLOCK, fixed by removal — count-based adoption could not prove provenance.** A one-card
    increase does not identify a run: a compaction, a branch or new-session rewrite, another
    client, or a run from a previous stage generation can each introduce one unrelated
    same-command card, and returning to a session resets the in-flight bookkeeping the rule leaned
    on. Two rounds of patching the count did not close it, so the whole mechanism is gone —
    `adoptHistoryBashRow`, the finished-card counting, the per-command in-flight map and the
    `data-bcmd`/`data-bash-id` marks. New rule: if the transcript was rebuilt while the POST was
    in flight, the page claims no card and builds none from its buffer; it drops the buffer and
    asks history again. When nothing was rebuilt, behaviour is unchanged (create the row, flush
    the buffer).
  - **BLOCK, fixed — a buffered transport failure was written onto an unidentified card.** It is
    now surfaced as a toast, `bash: <command> — <error>`, pinned to no card. (Failing-first: the
    pre-fold page marked a history card `✗` and raised no toast.)
  - **BLOCK, fixed — repair resyncs did not coalesce.** The old flag was cleared when a resync
    finished, so a second ambiguous POST arriving after that started a second repair. A resync
    already in flight was started *before* a request arrived and cannot answer it, so such
    requests now set one "again" flag and exactly one follow-up runs after the current read
    completes. (Failing-first: 3 reads where 2 are correct.)
  - **SHOULD, fixed (tests)** — no positive assertion waits on a delay any more; each waits for
    its own DOM or counter condition. `SETTLE` now appears only before negative claims, which is
    what the file header says.
  - **BLOCK (docs), fixed** — "provably ours" and "never" are gone from `apps/desk/README.md`;
    the rule now states no adoption, history wins, one coalesced repair read, and the
    transport-failure toast.

  Tests: `apps/desk/test/session-races.e2e.mjs` — 42 browser-level checks against a stub pi, no
  model call. Each interleaving is controlled by holding the exact response under test
  (`page.route`, or a substituted `FileReader`) and releasing it on what the page has already
  received, plus a TCP relay so the reconnect checks destroy the real SSE socket. 8 fail on the
  page before `7a91f42`; 7 more fail on the page before `c8249d7`; 8 more fail on the page before
  `8afd799`; 4 more fail on the page before `c284123`. **Still open:** a model /
  thinking / fork picker whose RPC is already in flight when you switch sessions still applies to
  the new session (`clearStage()` closes the popover, which narrows it to that window), and a
  steer byte-identical to a still-pending prompt consumes that prompt's optimistic bubble. Both
  are declared in `apps/desk/README.md`.

## Extensions

- **FIXED `2efd435` — [was high] timeout-ignore hang.** `run()` moved from `exec` to `spawn` with
  its own deadline: SIGTERM to the process group (win32 `taskkill /T /F`), SIGKILL after a 2 s
  grace, stdio destroyed, and the promise **settles** with `timeout`/`not_run` even if the child
  never closes. `timeoutMs: 0` still means no deadline. **Open sub-item:** the win32 `taskkill`
  branch has not been run on real Windows.
- **FIXED `2efd435` — [was high] formatter concurrent-write race.** The check now runs inside pi's
  own `withFileMutationQueue`. Consumer-visible split, documented in the pack README: a queue that
  exists but cannot be acquired means the checker does **not** run (receipt `not_run` + feedback to
  the model); a queue module that cannot be resolved (outside pi) means it **does** run unlocked
  with a loud one-time warning.
- **FIXED `2efd435` — [was med] post-edit path-resolution mismatch and `$&` corruption.** One
  normalizer mirroring pi 0.84.4 `resolveToCwd` (`~`, leading `@`, Unicode spaces, `file://`)
  feeds the command, the digest and the queue key; `{file}` substitution uses a function replacer.
  **Open sub-item:** the mirrored normalizer can drift from pi's on upgrade — it needs
  compatibility coverage, not unification.
- **FIXED `58645c5` — [was med] stage JSON that passed validation threw in render.** `subtitle` and
  `badges` are validated for every block type (a table with `badges: {length: 2}` used to blank the
  whole stage), and `validateBlock` never throws — cycles, bigints and hostile getters/`toJSON`
  return a rejection instead of escaping through the `tool_result` handler and blocking the tool.
  **NOT-A-BUG:** several other render-tolerance candidates raised in the same review were checked
  and needed no change.
- **FIXED `58645c5` — [was med] block size cap did not bound model-facing output.** Padding stops
  at 80 columns (a wider cell still prints whole), and the rendering is capped at 128 KiB per block
  / 256 KiB per result, cut on a UTF-8 boundary with an announced truncation marker. Declared in
  `docs/agent-frontend-design-2026-09-04.md` §3.1.
- **FIXED `fdbaace` — [was medium continuity] stage signing key was recreated per spawn.**
  Confirmed line-by-line: the key was minted in `spawnChild` and kept only on the in-memory child
  record, while `nana-stage` writes every signed block into the session file — so a restart or a
  resume handed the new child a key nothing on disk was signed with and `/api/entries` redacted
  the session's whole history. Fixed by making the key the SESSION's: the desk records what it
  issued in `~/.pi/agent/nana-desk/stage-keys.json` (0700 dir, 0600 file, temp-then-rename, keyed
  by the pi session header id so a title-append rename does not lose it), a resume reuses that
  session's most recent key, and the LEDGER read verifies against `{child key} ∪ {keys recorded
  for the session the child holds}`. The live `tool_execution_end` path is unchanged — this
  child's key alone — and nothing unverifiable became acceptable: blocks signed before this
  landed stay redacted, a forged signature and a never-issued key still redact.
  `test/stage-key-persistence.test.mjs` (45 checks) pins it; with the wiring reverted 10 fail,
  the headline being a pre-restart block coming back as `nana-block-rejected`.
  Two **gpt-6-astra** rounds followed. Round 1 (BLOCK) found that concurrent desks lost each
  other's issuance, that a fork lost its inherited blocks, and four SHOULDs; `e917780` folded all
  six. Round 2 (BLOCK) then found that the *fix* for the first — a shared store behind an
  advisory lock — had grown a retry branch that could freeze the whole desk, plus a takeover
  race, dangling-symlink recovery and an ownership heuristic. The seat's call was to **subtract**
  rather than fold again: `eeb1135` replaces the shared file with **one record per session**
  (`~/.pi/agent/nana-desk/stage-keys/<session id>.json`, 0600 in a 0700 directory), which has
  nothing to merge and therefore needs no lock — every line of locking, merging and stale-takeover
  code is deleted. `eeb1135` also fixes round 2's other BLOCK: a fork inherited whatever id the
  desk last happened to observe, which a failed observation could leave stale, so it now
  establishes the source by asking the child *before* the fork runs, and a source it cannot
  confirm means no inheritance. Both were pinned failure-first. Round 3 (BLOCK) then found that
  an overlapping ledger read could file a fork's destination under the live child's key before
  the desk confirmed it, so seeding refused and the inherited blocks redacted permanently;
  `7d8e2be` serializes lifecycle transitions per child, stops an in-flight transition's
  observations from being written down, and makes seeding a union rather than a fill-a-blank.
  The same commit clears session identity at dispatch (a timed-out or unsuccessful command can
  still have moved the child), recovers a fork whose confirmation failed at the next confirmed
  observation, drops the store's lifetime cache (it let one desk redact a live sibling's blocks
  and then overwrite its record — records are now read on every lookup and written
  read-union-write), stops the prune deleting files it could never have written, and pins the
  test's store path against an inherited environment. Round 4 (BLOCK) found that the recovery
  hook round 3 had asked for was itself a bypass — a child's session can change through an
  extension slash command run off a `prompt`, which the desk never sees, so a pending inheritance
  would eventually attach one session's keys to an unrelated one. `8c0077a` removes it: a fork
  confirms its source, runs, and confirms its destination inside the one command (three tries,
  ~1 s) or inherits nothing. The same commit clears session identity at dispatch rather than
  after the source check, holds only unsaved ADDITIONS in the failed-write overlay (keeping the
  whole record masked and then overwrote another desk's later keys), bounds queued session
  changes at 8 per child with a 429 over that, and replaces the timed overlap tests with
  handshakes. 72 checks; with the code reverted, the 6 new ones fail.
  **Open sub-items** (each declared in `apps/desk/README.md`): two desks WRITING one session's
  record in the same instant keep only the last writer's, losing whatever the other write was
  adding — one key, or a whole inheritance (sequential writers each re-read first, so they lose
  nothing); a key lost that way is retained nowhere and redacts from the next lookup; an
  extension slash command run off a `prompt` can move the session between a fork's source check
  and the fork, attributing the inheritance to the previous session; a fork whose destination
  cannot be confirmed in three tries inherits nothing; a ledger read that lands while a
  transition is in flight sees that session's blocks redacted for that one read, and a child that
  exits before any later observation leaves that session unrecorded; the RPC wall-clock timeout
  path shares the tested unsuccessful-response cleanup but is not itself covered by a test;
  the record is per session, not per app, so two app children that hold the same session file
  vouch for each other's blocks; the session id a child is filed under is self-reported through
  `get_state`, so the check proves possession of a desk-issued key for the session the child
  REPORTS, not authenticated session origin; persistence is best effort (a key whose save failed
  verifies for that desk only); continuity is bounded by 8 keys per session; the store's reads
  and writes are synchronous on the event loop; and the first app spawn of a desk pays a one-time
  session-header scan (~0.3 s over 556 files here) for the existence prune.

## Coherence / docs

- **FIXED `368f67f` — [was med] unchecking "Trust project config" did not deny.** The checkbox
  sends a strict boolean; `false` → `-na`, `true` → `-a`, omitted/non-boolean → no flag (pi's own
  defaults). With the box unchecked the UI also switches project-local items off and disables their
  rows, and since `53d4aab` the server refuses a project-path resource under `approve: false`
  rather than trusting the client. Declared in `apps/desk/README.md`.
- **FIXED `f777638` — [was med] adopt-ts "keep your linter" still installed the biome preset, and
  the docs implied CI enforced the size caps.** `-x biome.json`, the biome post-edit entry dropped
  from `.pi/nana-pack.json`, the biome devDep skipped; both scaffold `AGENTS.md` now say the caps
  are enforced by `nana-post-edit` only (no CI cap — a shared `ci.yml` would red-line adopted repos
  on day one).
- **FIXED `f777638` — [was low] README TS prereqs omitted `uv`; pasted commands were not
  native-shell safe.** `uv` is listed for both templates (`uvx copier`), commands are one per line
  with no `&&` chains, and the adopt-structure fallback uses `node -e` with a PowerShell/cmd form
  alongside.

## Design note (decision still open, no code required)

- Per-folder `AGENTS.md` load only when a session's cwd is in or below that folder (pi loads
  cwd + ancestors, never descendants — verified in 0.84.4 `resource-loader.js`). Docs carry the
  read-on-demand baseline and the cwd-rooted-subagent option. astra: **low / design decision** —
  the existing guidance is honest, no fix needed. Open: whether per-folder authoring earns its
  place, or guidance should simply push "start pi in the folder."

## New from the whole-unit review — test architecture (not blocking)

astra rates the suite materially load-bearing (real-server raw requests, stub children, registered
handlers, real browser rendering; no suite needs a live model). Gaps and flake vectors it named,
most closed by `53d4aab`: `spawn-and-persist` now judges resumed context with pi's own
`SessionManager` and covers resource classification, `crash-paths` has one combined
EPIPE-plus-stubborn-child fixture, `stage-render-edge` uses ephemeral ports, the SSE reader frames
incrementally, and sleeps became readiness handshakes. **Still open:** `post-edit-file-queue` skips
silently when pi is not installed globally (it should report the skip in the acceptance command),
and Windows `taskkill` plus descendant cleanup have no coverage at all.

## Required checks after the desk is restarted

The disk changes do not protect the currently running old server, so on restart of
`com.nana.pi-desk`, astra asks for three checks: (1) desk and both app listeners load, unchecked
trust produces `-na` even with saved trust, and resource narrowing still works; (2) rename a
historical session, resume it, and confirm prior conversation survives — reload app stages and
distinguish the known signing-key restart loss from a render regression; (3) prompt → gate dialog
→ deny leaves a usable session, deleting a busy session makes its process disappear before the
capacity slot is reused, and no children of the old server survived the restart.
