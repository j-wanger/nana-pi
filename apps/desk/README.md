# the pi desk

Local, zero-dependency dashboard over pi: every session on the machine in one place,
live sessions driven from the browser. Aim: the TUI's main capabilities, in a browser.

```bash
node apps/desk/server.mjs     # → http://127.0.0.1:7317   (DESK_PORT to change;
                              #    not 4317 — that's OTLP, and VPN/telemetry
                              #    filters can silently eat loopback to it)
```

## What it does (TUI parity map)

- **Sessions rail** — `~/.pi/agent/sessions/` JSONL trees (newest 15 per workspace),
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
