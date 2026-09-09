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

## Contract notes (2026-09-09 — four buffer caps)

The four ways a local producer pushes data *through* this process — the transport buffers and
the request concurrency — now have ceilings. (Not everything the desk holds: the per-session
maps a child fills and a session export are still unbounded, both under "Known limits" below.)
A pi child, an extension inside it, an app `data` command or a browser tab that stops reading
can all push more at this process than it can hold, and the desk is one process holding *every*
live session — so each of these used to be a whole-desk outage. Four caps, all named constants
at the top of `apps/desk/server.mjs` (`apps.mjs` for the last), each overridable by an env var
that exists for the tests, the way `DESK_KILL_GRACE_MS` does:

- **A child's stdout line: 64 MiB** (`DESK_STDOUT_LINE_CAP`). Events arrive as one JSON object
  per line, so text with no newline in it has to be held. Past the cap the desk **throws that
  partial line away and keeps the session running** — a pathological line must not cost you the
  session. Clients on that session get one `desk_event_dropped` saying so (the existing event
  type), the desk logs it once, and **every RPC in flight on that child is rejected**, because
  one of them may be what the discarded line was answering and it would otherwise sit on its
  timer — up to ten minutes for a prompt — with no answer coming. This holds whether the
  oversized line arrives in pieces or all at once with its newline attached: both are checked, so
  a producer cannot slip a big line past by sending it in one write. The number is ~3.5× the
  biggest legitimate line pi produces: a `get_messages` response carries the whole conversation
  on one line, measured at 18.4 MiB for the largest session on this machine, and everything else
  is far smaller (pi truncates tool output at 50 KiB, nana-stage at 128/256 KiB). It counts
  characters, not bytes.
- **Per SSE client: 8 MiB of unread output** (`DESK_SSE_BUFFER_CAP`). A tab that stops reading
  used to accumulate in Node's write queue for that one response with nothing to stop it
  (measured: 12 MB after 200 events, still climbing). Now that client's response is **ended and
  its socket dropped**; the browser's `EventSource` reconnects on its own and gets a fresh
  `desk_hello` snapshot, which is the normal way back in — the desk never replays event buffers.
  A slow tab is **disconnected and resynced, never throttled**: one tab must not pace the fan-out
  for the others, and the other clients on that session see no interruption. The 8 MiB is what
  *this process* retains for that client; the kernel's own send buffer fills first and is not
  counted, so the real lag before a drop is a little more than the number says.
- **In-flight RPCs per session: 64** (`DESK_MAX_PENDING_RPC`). Above that, a new one **fails
  fast** — `POST /api/session/:id/rpc` (and `/bash`) answers **429** with
  `too many in-flight requests for this session (64)`, and an internal caller gets a rejected
  promise — instead of being queued. Requests already in flight are untouched and keep their own
  timers. The cap is on concurrency, not on a rate: once they drain, the next request is fine.
- **An app `data` command's stdout: 8 MiB** (`DESK_DATA_OUTPUT_CAP`). Its output has to be read
  whole (it is one JSON document), and the 20 s timeout only killed on *time* — a command
  printing at pipe speed reached gigabytes first. Past the cap the process is **killed through
  the same tree-kill the desk uses for a session** — on Windows that is `taskkill /T /F`, so a
  `data` command's own descendants go with it (untested: this repo is developed on macOS); on
  macOS and Linux it signals the named process only, the same descendant limit the session
  lifecycle already has — and
  the request answers **500**, `data output exceeded cap (8388608 bytes)`, in the same shape as
  the timeout's 504. Its stderr is now held as an 8 KiB tail (the reported tail was already only
  the last 600 characters, so nothing a caller sees changes).

Two accumulations on these paths were checked and were **already bounded**: a child's captured
stderr (`stderrTail`, last 2000 characters) and request bodies (`readBody`, 32 MiB).

## Contract notes (2026-09-09 — page races)

Six page-level rules landed with the client-race fix (`7a91f42`, hardened in `c8249d7`, `8afd799`
and `c284123`, closed in `163bab6`). All six are about *when* a response is allowed to touch the
screen, and all six are visible to anyone driving the page.

- **An answer for a session you have left is dropped, never painted.** Selecting, closing or
  reopening a session starts a new stage generation, and an in-flight continuation carries the
  generation it began in. Covered: the `get_messages` resync; the `get_state` /
  `get_session_stats` polls; the `get_commands` and file-list loads; the historical transcript
  load; the bash POST and the prompt POST; the queue reclaim and the Esc reclaim-then-abort pair
  (the abort carries the session Esc was pressed in, never the one you switched to); every desk
  slash command that awaits before acting, including `/model <pattern>`, `/new`, `/clone` and
  rename; the spawn response (the session is created and appears in the rail, but the stage you
  chose is kept); an image whose `FileReader` finishes late; and every event and error from the
  previous SSE stream. A stale one returns without touching the transcript, the header, the
  editor, the attachments or the live-session handle — **and paints no toast**, success or error:
  a command that fails for the session you left says nothing on the one you moved to. The old
  session's request may still complete on the server; only its effect on the page is dropped.
  **Not covered:** an RPC already in flight from an open model / thinking / fork picker — see
  Known limits.
- **A reconnect replays state and resyncs exactly once.** The SSE stream reconnects on its own,
  and the server sends `desk_hello` on every attach. Dialogs, status chips, widgets and the queue
  are whole-snapshot replacements, so a replayed hello does not duplicate them; a *second* hello
  on the same stage additionally triggers **one** `get_messages` resync, which is what brings back
  the events lost while the stream was down and clears the "disconnected" chip. First attach does
  not resync twice.
- **Bash output can arrive before its row exists, and is kept.** `POST /api/session/:id/bash`
  answers *after* the server has handed the command to the child, so `bash_execution_update` and
  `desk_bash_result` for that id can reach the page first. Such events are held per id, in arrival
  order, and flushed when the POST returns and the row is created. Bounds, per id: 200 events, and
  20 000 characters counting **every text an event carries** — a streamed `delta`, a result's whole
  captured `output`, and its error string, which share one budget within an event (the error is
  allocated first, so a huge output cannot starve it). Anything over is cut on the way in, so no
  single event can exceed the budget; then older events are dropped first; at most 8 unknown ids
  are held at once. Server ordering was not changed.
- **A finished bash card never shows more than 20 000 characters, of output or of error.** Both a
  result's captured output and its error string are unbounded on the wire; the live streaming path
  only ever kept the last 20 000, and the finished render keeps the same window for both and
  reports the cut as `· truncated` — whether this page made the cut or the server did. Cuts never
  split a surrogate pair, so a window that opens mid-emoji starts at the next whole character.
- **If the transcript was rebuilt while a bash POST was in flight, history wins.** A rebuild (a
  reconnect resync, a settled turn, a compaction) replaces the pane with pi's own record, and that
  record carries no RPC id — nothing on the page identifies which card belongs to the POST that is
  still out. So the page claims no card and builds none: it **drops the buffered events for that
  id** and re-reads history. Where the card comes from then depends on the command:
  - it had already **finished** — pi records a run only on completion — so the read brings the
    finished card back, with pi's own output;
  - it was still **running**, so the read finds nothing and the pane shows no card for it yet.
    The terminal `desk_bash_result` that arrives later is the trigger: an id its POST already gave
    up on causes **one more read**, and that is where the finished card appears. The page remembers
    at most 8 such abandoned runs: a ninth evicts the oldest, whose terminal event then triggers
    no read, so that card appears only with the next re-read for any other reason. A command that
    never terminates leaves no card — nothing on either side knows it ran.

  The one thing history cannot carry is a **desk-side** failure of the request itself (a bash
  timeout, a child that died): it is reported as a toast — `bash: <command> — <error>` — and
  pinned to no card.
- **History is re-read through one door, and re-reads coalesce.** Reconnect, a settled turn, a
  compaction, `/new`, a fork and the bash repair path all call the same routine. A read already in
  flight was started *before* any of them asked, so it cannot answer them: they set one flag
  between them and exactly **one** follow-up read runs when the current one finishes, however many
  asked while it was out.

One prompt-path rule changed with them: **an explicit rejection always returns your text to the
editor.** A `POST …/prompt` that answers `{ok: false}` (or 409) means the prompt is not running,
and that outranks a matching echoed user message — which can come from another tab or client on
the same session. Only a *lost response* (the request threw, nothing came back) after a matching
echo leaves the editor alone, because there the echo is proof pi has the message and restoring it
would send it twice.


## Contract notes (2026-09-09 — stage signing keys)

- **Stage signing keys belong to the session, not to the child, and the desk keeps a record of
  them on disk.** New directory: `~/.pi/agent/nana-desk/stage-keys/` (`0700` when the desk
  creates it), holding **one file per session**, `<pi session id>.json` (`0600`), written
  temp-file-then-rename so a reader never sees a half-written one:
  `{"v":1,"keys":["<hex>", …],"updatedAt":<ms>}` — the keys this desk has issued for that
  session, most recent first, at most **8** (the 9th drops the oldest, and blocks signed under a
  dropped key go back to redacted). The first time a desk opens an app it deletes the records of
  sessions with no file left under `~/.pi/agent/sessions/` — but only if that enumeration
  succeeded and came back non-empty (an empty one is indistinguishable from a directory it could
  not read), and a record it fails to unlink is simply left where it is. Records are kept per session precisely
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
    it happened to see. If the source cannot be established, nothing is inherited: the fork's
    copied blocks that were signed *only* by inherited keys redact, while any signed by the live
    child's own key still verify. `switch_session` and `new_session` inherit nothing, by construction.
    Two things make that hold under load: lifecycle commands (`fork`, `clone`, `switch_session`,
    `new_session`) run **one at a time per child**, so a second transition cannot capture a
    source the first has already moved away from; and while one is in flight a ledger read may
    *use* the session it observes but does not file it, so it cannot claim the destination under
    the live key alone before the fork has been accounted for. A ledger read that lands in that
    window verifies that session against the live child's key plus whatever was already recorded
    for it, without filing the observation — so on that read a brand-new fork's copied blocks
    signed only by inherited keys do not verify until those keys are recorded, while copied blocks
    signed by the live child's key, and an existing session's blocks, still do. If the child exits
    before any later observation,
    that session is simply never recorded.
  - **All of it happens inside the one command, or not at all.** After the fork the desk retries
    the state read that identifies the new session up to three times inside a **1000 ms budget**:
    what is left of that budget is checked before each attempt, raced against each answer, and
    rechecked before an answer is accepted — so a reply that lands on or after the deadline is
    ignored even if it beats the timer, and the command returns at the budget rather than at the
    RPC's own timeout. If the destination is never confirmed, **that fork inherits nothing** —
    its copied blocks signed only by inherited keys stay redacted, while blocks signed by the
    live child's own key still verify. There is deliberately no "finish it later" flag: a child's
    session can also change by a route the desk never sees — pi runs an extension's slash command
    straight off a `prompt` — so a pending inheritance would eventually be attached to an
    unrelated session. The desk also keeps no memory of "the session this child is in": every
    decision asks the child in the moment, so there is no stale identity to go wrong.
  - **`POST /api/session/:id/rpc` answers 429** when an APP child already has 8 session-changing
    commands queued or running (`fork`, `clone`, `switch_session`, `new_session`). Only app
    children are serialized this way — they are the ones that carry a signing key — so a plain
    desk session's commands are unaffected by this bound. Slots free on every outcome, success or
    failure.
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
  a record under `~/.pi/agent/nana-desk/stage-keys/<session id>.json` is enough to mint stage
  blocks that pass the provenance check for that session — the same authority the desk process already has, which is
  why it is `0600` in a `0700` directory and why it is not a defence against a process running
  as you.
- **"Trust project config" is a resource policy, not a sandbox.** Unchecked now genuinely denies
  (`-na`, the UI stops offering project-local items, and the server refuses a project path), but
  any extension that *does* load runs with your full authority, and context files are still model
  input.
- **A child can still grow the desk's per-session bookkeeping.** The four transport buffers are
  capped (above), but the maps a child fills through its own events are not: every distinct
  `setStatus` key, `setWidget` key and unanswered dialog id is kept for the life of the session
  (`handleChildEvent` in `server.mjs`) and every one of them is sent to each new client in
  `desk_hello`. A child emitting millions of distinct keys still grows this process. And once
  that snapshot alone exceeds the SSE cap, every reconnect is dropped on its own `desk_hello`, so
  the tab reconnects, is dropped and reconnects again — the session becomes unwatchable rather
  than merely slow (there is no client-side retry cap). Bounding the maps needs a decision about
  what a *dropped* status or widget means to the page, which the buffer caps did not have to
  make.
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
- **Two desks can lose keys for the same session.** A record is read, unioned and written back
  without a lock, so two desks doing that for the *same* session in the *same instant* leave
  whichever wrote last, and **whatever the other write was adding is gone** — usually one key,
  but a fork's inheritance adds several at once. It takes an actual overlap of the two writes:
  sequential writers, however far apart, each read the current file first. The *store* keeps no
  copy of a key lost that way (only keys whose own write failed are held in memory), so it is
  gone from the next lookup; blocks signed with it still verify for as long as it happens to be a
  live child's own key, and redact once it is not. Nothing is corrupted and no other session is
  touched. This is the deliberate price of having no cross-process lock.
- **A prompt can move the session out from under a fork.** pi executes an extension's slash
  command straight off a `prompt`, and those can start, fork or switch a session without going
  through the desk's own commands. An extension command run from a prompt that changes the
  session anywhere between the source check and the destination confirmation can attribute the
  inheritance to whatever session the child then holds; only desk-issued keys are involved. Not
  fixed.
- **One failure path is not covered by a test: a session-changing command that runs out its
  wall-clock timeout (60 s for `fork`/`clone`/`switch_session`/`new_session`; 30 s is the
  ordinary RPC timeout, which is what a confirming `get_state` would use).** It takes the same
  `finally` as one that comes back unsuccessful — queue slot freed, nothing inherited — and the
  unsuccessful case is tested; the timeout path is not, because there is no test-only timeout
  knob and adding one to the RPC core is a wider change than this fix.
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
  no file left under `~/.pi/agent/sessions/`, whose record the first desk to open an app deletes
  — though only when that session enumeration succeeded and came back non-empty, and a record it
  fails to unlink is left where it is.
- **A picker left open across a session switch still acts on the new session.** Selecting a
  session closes any open popover, but a model/thinking/fork picker whose RPC is *already in
  flight* when you switch applies to whichever session is selected when it lands. Narrow window,
  not closed — the only continuation the stage-generation rule does not cover.
- **A bash command that never terminates, started just before the transcript was rebuilt, leaves
  no card.** The rebuild drops the page's buffer for it and pi records a run only on completion,
  so until the command ends neither side has anything to show. It reappears the moment it
  finishes (if it is among the last 8 abandoned runs; older ones wait for the next re-read); a
  command that never does is never drawn.
- **A steer whose text is byte-identical to a still-pending prompt eats that prompt's bubble.**
  The optimistic user bubble is matched to pi's echo by content (deliberately: a FIFO match let
  another tab's echo consume ours). Send `ok` as a prompt and, before its echo arrives, `ok` again
  as a steer, and the steer's echo swaps out the prompt's bubble — one bubble for two messages.
  Both messages did reach pi; only the transcript is short one line, and a resync repairs it.
- **The running desk is whatever was on disk when it started.** The launchd service
  (`com.nana.pi-desk`, port 7317) keeps executing the `server.mjs` it loaded at launch — edits in
  this repo, including everything above, do not reach it until it is restarted.

Fixed and worth remembering: the 2026-09-02 double-rendered-user-message bug. `send()` appends
the user bubble optimistically *before* the POST and queues it; the `message_end` handler swaps
the queued bubble for pi's echoed user message — append-before-POST matters because the SSE echo
can beat the fetch response. Regression check: `test/double-msg.e2e.mjs`, browser-level (one real
model call), and `test/session-races.e2e.mjs`, which pins the same case plus the three rules above
against a stub pi with no model call — it holds each response under test until the test releases
it, so no outcome depends on timing.
