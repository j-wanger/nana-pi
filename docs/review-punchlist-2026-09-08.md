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
- **STILL OPEN — [astra: medium; high availability impact with a hostile local producer]
  unbounded buffers.** Child stdout accumulates until a newline arrives, SSE writes are not
  backpressure-aware, pending RPCs are uncapped, and an app `data` command's stdout is read whole.
  The stage's 128/256 KiB text caps bound what a *model* reads — not `details`, the ledger, or the
  transport. **Next step:** bound the buffers and the concurrency; disconnect slow consumers.
- **STILL OPEN — [astra: medium correctness] client switching / reconnect / bash / dedup races.**
  `apps/desk/public/app.js`. The `resync()` path is seat-confirmed: it re-reads the live-session
  handle after the `get_messages` await with no generation check, so a session switch mid-flight
  repaints the new pane with the old session's messages. The reconnect, bash echo-before-fetch and
  dedup cases are astra-reported and not individually confirmed. **Next step:** session-generation
  checks plus deterministic delayed-response / echo-first tests.

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
  A **gpt-6-astra** review of that commit returned BLOCK on two continuity defects plus four
  SHOULDs; `e917780` folds all six, each pinned failure-first (8 new checks, all failing with
  `e917780`'s code reverted): concurrent desks lost each other's issuance because the
  read-merge-write was not serialized (now one cross-process lock file around the whole
  transaction, stale-takeover at 30 s); a fork or clone lost its inherited blocks because pi
  copies the source's entries under a new header id (now seeded from the id the same child was
  observed holding, and observed at the RPC that moved it rather than at the next ledger read);
  a failed `get_state` verified with the previous session's keys (now no widening at all — the
  child's own key only); a failed save was never retried; an existing world-writable store
  directory was never tightened; and the test's fixed desk port collided with
  `session-races.e2e.mjs` (now dynamic).
  **Open sub-items:** the record is per session, not per app, so two app children that hold the
  same session file vouch for each other's blocks, and the same seeding rule fires on
  `new_session` where nothing is inherited (both declared in `apps/desk/README.md`); the session
  id a live child is filed under is self-reported through `get_state`, so the check proves
  possession of a desk-issued key for the session the child REPORTS, not authenticated session
  origin; continuity is bounded by 8 keys per session and 512 sessions; the store's reads,
  writes and lock wait are synchronous on the event loop; and the first app spawn of a desk pays
  a one-time session-header scan (~0.3 s over 556 files here) for the existence prune.

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
