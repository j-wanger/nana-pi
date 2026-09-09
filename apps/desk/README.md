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

Five page-level rules landed with the client-race fix (`7a91f42`, hardened in `c8249d7` and
`8afd799`). All five are about *when* a response is allowed to touch the screen, and all five are
visible to anyone driving the page.

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
- **A bash row is only adopted when it is provably ours.** A rebuild of the transcript (a
  reconnect resync) brings back pi's own finished record of a command, which carries no RPC id.
  The in-flight POST claims that row only when exactly one new finished card for that command
  appeared while it waited and no other POST for the same command is outstanding; a buffered
  transport failure (a timeout, a dead child — which history does not record) is re-applied onto
  it. Otherwise nothing is adopted and no row is built from the buffer: the page drops the buffer
  and runs **one** repair resync, because history is the authority on what actually ran. So an
  older identical command's card can never end up showing a newer run's output.

One prompt-path rule changed with them: **an explicit rejection always returns your text to the
editor.** A `POST …/prompt` that answers `{ok: false}` (or 409) means the prompt is not running,
and that outranks a matching echoed user message — which can come from another tab or client on
the same session. Only a *lost response* (the request threw, nothing came back) after a matching
echo leaves the editor alone, because there the echo is proof pi has the message and restoring it
would send it twice.


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
  origin POSTs) from reaching it; they are not authentication.
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
  `.md` — do refuse a symlinked destination or `.bak` with 409 (`53d4aab`).
- **A restart redacts old stage blocks.** Each app session gets a fresh signing key per spawn
  (`NANA_STAGE_KEY`), and `/api/entries` drops any `nana-block` entry not signed under the
  current child's key. After a desk or child restart, blocks from before the restart vanish from
  the stage. That is the provenance rule working, not a render bug — the fix is a stable
  per-session key, never accepting unverifiable blocks.
- **A picker left open across a session switch still acts on the new session.** Selecting a
  session closes any open popover, but a model/thinking/fork picker whose RPC is *already in
  flight* when you switch applies to whichever session is selected when it lands. Narrow window,
  not closed — the only continuation the stage-generation rule does not cover.
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
