# nana code (the desk)

Local dashboard over pi: every session on the machine in one place, live sessions
driven from the browser. Aim: the TUI's main capabilities, in a browser. It has **no
npm dependencies of its own** — no `package.json`, no `node_modules`, nothing to
install — but it is **not standalone: it requires the installed pi**, which it both
spawns and imports (see below).

```bash
node apps/desk/server.mjs     # → http://127.0.0.1:7317   (DESK_PORT to change;
                              #    not 4317 — that's OTLP, and VPN/telemetry
                              #    filters can silently eat loopback to it)
```

## Dependencies

| | What | Why |
|---|---|---|
| Runtime | **Node ≥ 22.19** | pi's own floor (`engines` in its package.json). The desk's own code needs nothing newer than Node 18, but it imports pi in-process, so pi's floor is the desk's floor. |
| Runtime | **`@earendil-works/pi-coding-agent` ≥ 0.84.4, installed globally** (`npm i -g @earendil-works/pi-coding-agent`) | Both **spawned** (`pi --mode rpc`, one child per live session — that is why auth, models.json and installed packages behave exactly as in the terminal) and, since 2026-09-09, **imported** for session reading. |
| Tests (browser e2e only) | **Playwright** (`playwright` or `playwright-core`; 1.61.1 in this repo's root `node_modules`) | Only `test/*.e2e.mjs`. They resolve it from `PW_ROOT` if set, else from the test directory's own require chain — i.e. the repo root — so a plain `npm i playwright` at the repo root is enough and `PW_ROOT` is only for a Playwright that lives somewhere else. The `test/*.test.mjs` files are zero-dep: `node <file>`, exit 0 = PASS. |
| | *nothing else from npm* | No package.json, no lockfile, no build step. Everything else is `node:` builtins. |

**What is imported from pi**, all from the package ROOT export
(`@earendil-works/pi-coding-agent`, i.e. its `dist/index.js`; never a deep `dist/…`
path, which is not a supported entry point):

- `parseSessionEntries` — JSONL text → entries, malformed lines skipped
- `migrateSessionEntries` — v1→v2→v3 entry migration, **in memory only**
- `CURRENT_SESSION_VERSION` — what the imported parser understands

`apps/desk/pi-session.mjs` owns both halves — the binary the desk spawns and the
package it imports — because **importing a different pi than it spawns would render
sessions with one version's parser while a child writes them with another's**. The
package must be *tied* to the executable:

1. `DESK_PI_ROOT`, if set — the operator's word, used **exclusively**: nothing else is
   consulted (so a wrong value fails instead of silently loading another install) and
   nothing is spawned. It does **not** suspend the same-install rule: if the `pi` the
   desk would spawn lives inside a *different* package, the desk **refuses**, naming
   both (a stale path in a service file is the likely way this goes wrong). Setting
   `DESK_PI_BIN` as well — the binary that goes with `DESK_PI_ROOT` — is the one
   configuration where the two halves may differ, because then both are the
   operator's explicit choice; the desk warns and continues.
2. Walk up from `realpath(PI_BIN)`: a package that CONTAINS the executable is the
   install, by construction. Normal npm/pnpm case, costs nothing.
3. Otherwise the executable is a shim (Volta's `pi` is a manager shim, not a symlink
   into the package). Then: ask `pi --version`, enumerate the layouts we can detect
   (`npm root -g`, `npm_config_prefix`, `volta which pi` + Volta's package image,
   the node prefix for nvm/fnm, bun's global dir, `~/.local`, `~/.npm-global`,
   `%APPDATA%\npm`, Homebrew, `/usr/local`, `/usr`), and accept **one** whose
   `package.json` version equals it. Zero matches — or two that cannot be told
   apart — and the desk **refuses to start**, listing every path with its version.

It **fails loudly at startup** for all of: no install; an install that cannot be tied
to the binary; an override that contradicts the binary; a version below 0.84.4 (the
exports were only verified there — and a *prerelease* of 0.84.4 counts as below it,
since a beta of the release that introduced these exports need not have them); a
version string that is not a semantic version at all; or a missing export. Tying a
package to a binary is exact-identity (`0.84.4+build` is not `0.84.4` — two builds of
one version are two different parsers); the floor is semver precedence. On success it logs the winning path, so *which parser is this desk
running* is answerable from the startup line:

```
nana code: pi 0.84.4 — spawning /Users/x/.local/bin/pi, parsing sessions with
           /Users/x/.local/lib/node_modules/@earendil-works/pi-coding-agent (resolved via PI_BIN walk-up)
```

`SessionManager` is deliberately NOT used: `SessionManager.open()` rewrites the file
when a migration applies, and a read endpoint must never write the user's session
file. Parity is pinned by `test/pi-session-parity.test.mjs`, which builds a session
with pi's own `SessionManager` and checks the desk reads it identically, and
`test/pi-resolution.test.mjs`, which drives the resolution rules against synthetic
install layouts (shim, mismatched versions, two indistinguishable installs).

Two consequences worth knowing. **Migrated v1 sessions get synthetic entry ids**
(`v1-000001`, …): pi's v1→v2 migration mints random ids, which would change on every
refresh, so the desk derives them from position instead — stable across reads and
restarts, meaningful only within that file. **The rail's name scan is bounded** (64 KB
head + 32 KB tail): a rename buried in the middle of a multi-megabyte session shows as
the inferred title in the rail, while `/api/transcript` — which reads the whole file —
has it right.

Two pieces of session handling stay ours because pi exports no equivalent: the
**byte-window scan** behind the sessions rail (pi's `SessionManager.list()` fully
loads every session file to build a row) and the **tail/leaf walk** behind the
historical rename (pi's parser is whole-file, and its own branch walks have no
cycle guard — the desk's does).

## What it does (TUI parity map)

- **Sessions rail** — folds away entirely with the masthead `⟨`/`☰` or Ctrl/Cmd+B
  (the choice persists; with it folded a compact `＋` in the masthead keeps
  "open a session" one click away). Contents: `~/.pi/agent/sessions/` JSONL trees (newest 15 per workspace),
  grouped by workspace with collapsible headers (only the most recent starts open;
  choices persist). Titles are inferred from the first user message; ✎ on any row
  renames — live sessions via `set_session_name` RPC, historical ones by appending
  the same `session_info` entry shape pi itself persists (desk readers take the
  last name entry; an empty name clears back to the inferred title).
- **Spawning** — "Open a session…" opens a picker: Browse… pops the NATIVE OS
  folder dialog (Finder / Explorer / zenity — the server opens it locally and
  returns the absolute path, which web pages can't get from their own pickers;
  one dialog at a time), or type a path directly. Plus per-spawn resource
  toggles: the skills and extensions pi's
  documented locations yield for that cwd (global + project incl. ancestor
  `.agents/skills` + plain-path settings entries + installed packages; settings
  glob/exclusion entries are NOT enumerated — the UI says so). All-on spawns with
  pure pi defaults (no flags); any narrowing spawns `--no-skills`/`--skill` +
  `--no-extensions`/`-e` with exactly the checked set. pi has no MCP — extensions
  are the pluggable surface, so that's what the toggles cover. "Trust project
  config" maps to `-a` (RPC sessions never prompt); when unchecked, project-local
  items are locked off so untrusted project code can't ride in via explicit flags.
  The picker also lists the session's **built-in tools**, and says where the list
  came from: a trusted project's `.pi/settings.json` `defaultTools` REPLACES the
  global array (it is not merged), so the set is recomputed from `/api/resources`
  on every cwd change *and* every flip of the trust box — reading global settings
  alone hid project-enabled tools and left no way to drop them. With neither file
  setting it, pi's own read/bash/edit/write. Unchecking sends `-xt` — deliberately
  NOT `-t`, which is a strict allowlist over *every* tool and would delete
  nana-stage and the subagent tools along with the one you dropped.
- **Transcripts** — markdown rendering, collapsed thinking blocks, tool cards with
  full args + results + edit diffs, compaction/branch summaries, model/thinking
  change markers; abandoned branches collapse into dimmed groups. The `subagent`
  tool (pi-subagents) gets a readable card instead of raw JSON: agent — task in
  the header, and a live strip per child (agent, model, tools/tokens/duration,
  current activity) built from the tool's `details`, both mid-run and on
  history re-render.
- **Live drive** — `pi --mode rpc` subprocess per session (max 4), so auth,
  models.json, and installed packages (incl. nana-gate) behave exactly as in the
  terminal. Composer: Enter sends (auto prompt/steer by run state), Alt+Enter
  follow-up, Shift+Enter newline, `!cmd` bash with streamed output, `/` command
  completion (desk + extension/skill/template commands), `@` file completion,
  image paste/drop, Esc = reclaim queued messages + abort (TUI Esc semantics).
- **Extension UI** — select/confirm/input/editor dialogs render as modals (this is
  how nana-gate escalations reach a human — live-verified: rm -rf → dialog →
  Block → `nana-gate: blocked by user`); notify → toasts; setStatus → header
  chips; setWidget → editor-adjacent boxes (pi-subagents' async-jobs widget
  arrives as a `PI_SUBAGENT_ASYNC_JSON:` machine snapshot for RPC clients — the
  desk decodes it into per-run rows instead of printing the blob);
  set_editor_text → composer.
- **Header/footer** — model picker, thinking-level picker, session rename,
  queue bar, status chips, tokens/cost, context meter (get_session_stats; after
  a compaction pi reports percent:null until the next reply, so the meter shows
  the compaction's own estimate as `~N% (est)` instead of going stale),
  theme toggle (auto/light/dark).
- **Session ops** — /model, /thinking, /compact [instructions], /name, /new,
  /fork (picker over prior user messages), /clone, /export (HTML download),
  /session; auto-compaction + steering/follow-up modes under ⚙.
- **Settings → Tools** — checkboxes over pi's built-ins (read, bash, powershell
  [win32], edit, write, grep, find, ls) writing `settings.json → defaultTools`,
  which REPLACES pi's own default set for new sessions; "Use pi defaults" deletes
  the key again. Built-ins only — extension tools are never in this list.
- **Settings → Nana pack** — a form over the whole nana-pack schema
  (`packages/nana-pack/lib/config.ts`): gate pattern lists, post-edit commands as
  match/run/timeoutMs rows (with a raw-JSON escape hatch), notify, journal,
  handoff, receipts. A scope switch edits either `~/.pi/agent/nana-pack.json` or a
  project's `<dir>/.pi/nana-pack.json` (project overrides user per section, and the
  project file is only read when the project is trusted). The write is a whole-file
  replace, so unknown top-level keys are refused *by name* rather than persisted;
  sub-keys the form does not render ride through untouched. Project-scope writes go
  through the same destination guards as context files (no write through a
  symlinked `.pi` or leaf), and every write leaves a `.bak`.

(The wire — a journal-tail lifecycle feed — was removed 2026-09-03: it confused
more than it informed. The nana-pack journal itself still exists on disk.)

Not covered (TUI-only): `/tree` branch *jumping* (RPC has no goto; fork/clone are
the desk's branch tools), `!!` hidden bash, themes, `/login`, `/settings` beyond
the ⚙ subset, `/reload`, keybinding customization. `@file` completion inserts a
path reference; it does not attach file contents the way TUI submit does.

## Design decisions

Visual language = the nana loop-desk system ("Orchestr — light / studio",
`nana-agent-loop/app/src/styles.css`): warm paper surfaces, mono for structure +
tool output, sans for prose, semantic go/warn/stop, terracotta accent for
interactive/live. All color lives in two token blocks in `public/styles.css`
(`:root` = light, `[data-theme="dark"]` = dark studio); reskins touch only that
file. A masthead toggle cycles auto/light/dark — auto follows the system live,
the choice persists in localStorage, and an inline pre-CSS script in
`index.html` applies the saved theme before first paint so there is no flash.

RPC subprocess over in-process SDK (extension/auth fidelity — the gate rides
along; decoupled from SDK churn); strict LF-only JSONL framing per upstream docs
(Node readline is non-compliant); binds 127.0.0.1 only, no auth — do not
port-forward it; transcript/switch/resume paths realpath-checked against the
sessions dir. No event-buffer replay: clients get a `desk_hello` state snapshot
(open dialogs, statuses, widgets, queue), render history from `get_messages`,
then apply live events — `message_end` and settled-resync make that race-free
enough for a local tool.

Smoke-verified 2026-09-01 (curl-level, all against a live child): spawn →
set_model → prompt → streamed deltas → settled → stats; extension-UI dialog
round-trip via a throwaway `-e` extension; REAL nana-gate escalation answered
from the desk; bash streaming; fork; export; queue steer + reclaim; historical
transcript with branch flags; clean teardown, zero orphan `pi` processes.

## Contract notes (2026-09-08 hardening pass)

Two client-visible API changes landed in commit `368f67f`. Both change what a caller gets back,
not just what the server does internally.

- **A config save that cannot be backed up is refused, not completed.** Every write to
  `~/.pi/agent/settings.json`, `mcp.json`, `nana-pack.json`, a project `AGENTS.md`/`CLAUDE.md`/
  `AGENTS.override.md`, and a subagent `.md` copies the existing file to `<file>.bak` *first*.
  If that copy fails, the write is aborted and the request answers **500** with the reason —
  previously the failure was swallowed and the file was overwritten anyway. "There was nothing
  to back up" (the file does not exist yet) is still fine. Separately, a file that exists but
  does not parse as a JSON object answers **409** rather than being clobbered with a two-key
  replacement. Callers: retry after fixing the directory or moving the bad file; a save that
  returns non-200 changed nothing on disk.
- **`POST /api/spawn` `approve` is a strict boolean.** `true` → `-a`; `false` → `-na`;
  **omitted or any non-boolean value → no flag at all**, which means pi's own defaults (a saved
  `trust.json` decision, or `defaultProjectTrust: "always"`) decide. So `false` now denies where
  it used to be indistinguishable from silence — an unchecked "Trust project config" box
  previously still loaded project config. With the box unchecked the spawn UI switches
  project-local skills and extensions off, and (since `53d4aab`) the server **refuses** any
  narrowed `resources` path that resolves inside the session cwd: 500, `refusing to load project
  <kind> without project trust: <path>`. A client cannot spend the trust it just declined. App
  listeners do not use `approve` at all: they carry the manifest's own
  `trust: "approve" | "no-approve"`, and an operator-authored `no-approve` manifest may still name
  extensions inside its own cwd.

## Contract notes (2026-09-09)

- **Stage signing keys belong to the session, not to the child, and the desk keeps a record of
  them on disk.** New directory: `~/.pi/agent/nana-desk/stage-keys/` (`0700` when the desk
  creates it), holding **one file per session**, `<pi session id>.json` (`0600`), written
  temp-file-then-rename so a reader never sees a half-written one:
  `{"v":1,"keys":["<hex>", …],"updatedAt":<ms>}` — the keys this desk has issued for that
  session, most recent first, at most **8** (the 9th drops the oldest, and blocks signed under a
  dropped key go back to redacted). A session whose file is gone from `~/.pi/agent/sessions/` has
  its record deleted the first time a desk opens an app. Records are kept per session precisely
  so there is nothing shared to merge or lock: a session id that is not name-shaped
  (`[A-Za-z0-9_-]{1,128}`) is neither recorded nor looked up, since it becomes a filename.
  Records are read from disk on every lookup and written read-union-write, so two
  live desks always see each other's keys. What changes for a caller:
  - **Spawning an app session on a session this desk already knows reuses that session's most
    recent key** instead of minting a new one, so `GET /api/entries` still returns the blocks
    minted before the restart as `nana-block` rather than `nana-block-rejected`.
  - **`GET /api/entries` verifies each `nana-block` against a SET of keys** — the live child's own
    key plus every key recorded for the session it currently holds. Any-of-recorded-keys is as
    strong as the single key it replaces: a forging extension or a hand-edited session file holds
    none of them, and this is what makes resume, restart, an in-child `switch_session` and a fork
    all verify. Nothing became acceptable that was not signed by a key this desk issued.
    **What the check proves, exactly:** possession of a key this desk minted and recorded for the
    session the child *says* it is holding. It is not an authenticated claim about which session,
    app or child produced the block — session identity is not cryptographically bound, and a key
    can be reused by any child the desk hands it to. Persistence is **best effort**: a key whose
    save failed still verifies for this desk (it is held in memory and the next record for that
    session retries the write), but is gone after a restart.
  - **A fork or clone inherits the source session's recorded keys.** pi copies the source's
    ledger entries into a new session file under a new header id, so the desk asks the child
    which session it holds *before* running the fork and seeds the new session's record from
    that — its own observation, never the `parentSession` text in the file, and never the last id
    it happened to see. If the source cannot be established, nothing is inherited and the fork's
    copied blocks redact. `switch_session` and `new_session` inherit nothing, by construction.
    Two things make that hold under load: lifecycle commands (`fork`, `clone`, `switch_session`,
    `new_session`) run **one at a time per child**, so a second transition cannot capture a
    source the first has already moved away from; and while one is in flight a ledger read may
    *use* the session it observes but does not file it, so it cannot claim the destination under
    the live key alone before the fork has been accounted for. A ledger read that lands in that
    window sees the new session's blocks redacted for that one read.
  - **A fork whose confirmation fails recovers.** If the state read that would attribute the new
    session fails, the desk keeps the confirmed source and completes the inheritance at the next
    confirmed observation (the next ledger read), rather than losing the fork's history.
  - If the child's current session cannot be established at read time (a failed `get_state`),
    there is **no** widening at all: only the live child's own key is used, so a block signed
    under another recorded key of that session redacts until the session can be read again.
  - **The live path is unchanged.** A block arriving on `tool_execution_end` must still be signed
    by *this* child's key and stamped by that very tool call; an older key of the same session
    does not pass there.
  - **Blocks minted before this change stay redacted.** Their keys were never written down, so
    nothing can vouch for them; there is no migration and no "accept unverifiable" fallback.
  - The record is only consulted for app sessions, and only when the desk knows the session id
    (from the session file's header on resume, from `get_state` afterwards). A session the desk
    has no record for simply gets a fresh key.
  - The session id a live child is filed under is the one the child reports through `get_state`,
    taken at face value. A child that lied would only file its own key under some other session,
    and it already controls both the blocks it signs and the entries it hands back — so there is
    nothing it could read that way that it could not read anyway.
  - **One narrowing was traded away, deliberately: the record is per session, not per app.** Two
    app manifests can name the same `session` file outright, and a child can be driven into
    another's session with `switch_session`; either way both children's keys end up recorded for
    that session and either one's blocks verify on its stage. What the check proves widens from
    "this app's child" to "some app child this desk gave a key for this session" — all of them
    manifest-configured children the design already treats as inside the trust boundary.

## Known limits

The 2026-09-08 hardening pass (five commits: four per-package under `gpt-5.6-sol` review, then
`53d4aab` folding a whole-unit `gpt-6-astra` review) closed the crash, browser-boundary, resume,
lifecycle, resource-classification and save-symlink items; item-by-item status is in
`docs/review-punchlist-2026-09-08.md`. What it did **not** close — read this as "what the desk
is not":

- **Loopback only, and not a sandbox.** It binds 127.0.0.1 with no auth. Any process running as
  you keeps full control-plane access: spawn a pi session in any directory, run bash in it, read
  `/api/settings` including MCP credentials. Do not port-forward it and do not proxy it. The
  Host and Origin checks added this pass stop a *browser* on another site (DNS rebinding, cross-
  origin POSTs) from reaching it; they are not authentication. Reading
  `~/.pi/agent/nana-desk/stage-keys.json` is enough to mint stage blocks that pass the provenance
  check for the sessions it names — the same authority the desk process already has, which is
  why it is `0600` in a `0700` directory and why it is not a defence against a process running
  as you.
- **"Trust project config" is a resource policy, not a sandbox.** Unchecked now genuinely denies
  (`-na`, the UI stops offering project-local items, and the server refuses a project path), but
  any extension that *does* load runs with your full authority, and context files are still model
  input.
- **Buffers are unbounded.** A child's stdout accumulates until a newline arrives, SSE writes are
  not backpressure-aware, pending RPCs are uncapped, and an app `data` command's stdout is read
  whole. The stage's 128/256 KiB caps bound what a *model* reads, not what this server holds in
  memory — a runaway or hostile local producer can exhaust it.
- **`~/.pi/agent/*.json` saves still follow symlinks, on purpose.** `settings.json`, `mcp.json`
  and `nana-pack.json` are your own paths, and symlinking them into a dotfiles repo is a normal
  setup, so those writes (and their `.bak`) resolve a link rather than refusing it. The two writes
  whose destination comes from a *request* — a context file in a picked directory, a subagent
  `.md` — do refuse a symlinked destination or `.bak` with 409 (`53d4aab`). The stage-key store
  follows the same policy at the DIRECTORY level: a symlinked `nana-desk/stage-keys` is resolved
  once at first use and every record is then read, written and moved aside inside the resolved
  directory. A directory the desk did not create is never re-permissioned — if it is looser than
  `0700` the desk says so once and leaves it alone.
- **The stage-key store is synchronous, on the event loop.** Its small per-session reads and
  writes, and the one-time session enumeration behind its hygiene pass, block the whole desk
  while they run. A hung filesystem under `~/.pi/agent` stalls the process, not just the request
  that touched it.
- **Two desks can lose one key for the same session.** A record is read, unioned and written
  back without a lock, so two desks doing that for the *same* session in the *same instant* leave
  whichever wrote last; the key the other one added survives only in its memory, and once it
  exits, blocks signed with that key redact. It takes an actual overlap of the two writes —
  sequential writers, however far apart, each read the current file first — and it costs at most
  one key for one session, corrupting nothing and touching no other session. This is the
  deliberate price of having no cross-process lock.
- **Ledger reads and lifecycle RPCs cost extra round trips.** `GET /api/entries` issues two RPCs
  (the entries and a `get_state` to establish the session), and a `fork`/`clone` waits for a
  `get_state` before and after it. So unanswered ledger reads consume the per-child pending-RPC
  allowance and can hold prompts off until they answer or time out, and a lifecycle command
  completes a round trip or two later than it used to. Temporary, not a wedge.
- **Stage blocks minted before 2026-09-09 stay redacted.** The desk only started writing down
  which signing key it issued for which session on that date, so a block signed under a key from
  before it has nothing that can vouch for it and `/api/entries` still returns it as
  `nana-block-rejected`. That is the provenance rule working, not a render bug. The same is true
  of any session whose keys have aged out of its record (8 per session), and of any session with
  no file left under `~/.pi/agent/sessions/`, whose record is deleted the first time a desk opens
  an app.
- **Client-side races remain.** Switching sessions while a `get_messages` resync is in flight can
  repaint the new pane with the old session's messages (`public/app.js` `resync()` re-reads the
  live-session handle after the await with no generation check); SSE reconnect, bash
  echo-before-fetch and prompt dedup have the same shape. Reported by review; only the resync
  path has been read line-by-line.
- **The running desk is whatever was on disk when it started.** The launchd service
  (`com.nana.pi-desk`, port 7317) keeps executing the `server.mjs` it loaded at launch — edits in
  this repo, including everything above, do not reach it until it is restarted.

Fixed and worth remembering: the 2026-09-02 double-rendered-user-message bug. `send()` appends
the user bubble optimistically *before* the POST and queues it; the `message_end` handler swaps
the queued bubble for pi's echoed user message — append-before-POST matters because the SSE echo
can beat the fetch response. Regression check: `test/double-msg.e2e.mjs`, browser-level.
