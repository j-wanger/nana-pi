# the pi desk

Local, zero-dependency dashboard over pi: every session on the machine in one place,
live sessions driven from the browser, and **the wire** — a live tape of session
lifecycle events across ALL pi activity (TUI sessions included), fed by the
nana-pack lifecycle journal. Aim: the TUI's main capabilities, in a browser.

```bash
node apps/desk/server.mjs     # → http://127.0.0.1:4317   (DESK_PORT to change)
```

## What it does (TUI parity map)

- **Sessions rail** — `~/.pi/agent/sessions/` JSONL trees (newest 15 per workspace),
  display names included. Click to read; "Continue here" resumes live.
- **Transcripts** — markdown rendering, collapsed thinking blocks, tool cards with
  full args + results + edit diffs, compaction/branch summaries, model/thinking
  change markers; abandoned branches collapse into dimmed groups.
- **Live drive** — `pi --mode rpc` subprocess per session (max 4), so auth,
  models.json, and installed packages (incl. nana-gate) behave exactly as in the
  terminal. Composer: Enter sends (auto prompt/steer by run state), Alt+Enter
  follow-up, Shift+Enter newline, `!cmd` bash with streamed output, `/` command
  completion (desk + extension/skill/template commands), `@` file completion,
  image paste/drop, Esc = reclaim queued messages + abort (TUI Esc semantics).
- **Extension UI** — select/confirm/input/editor dialogs render as modals (this is
  how nana-gate escalations reach a human — live-verified: rm -rf → dialog →
  Block → `nana-gate: blocked by user`); notify → toasts; setStatus → header
  chips; setWidget → editor-adjacent boxes; set_editor_text → composer.
- **Header/footer** — model picker, thinking-level picker, session rename,
  queue bar, status chips, tokens/cost, context meter (get_session_stats).
- **Session ops** — /model, /thinking, /compact [instructions], /name, /new,
  /fork (picker over prior user messages), /clone, /export (HTML download),
  /session; auto-compaction + steering/follow-up modes under ⚙.
- **The wire** — SSE tail of `~/.pi/agent/nana-journal.jsonl` via fs.watch.

Not covered (TUI-only): `/tree` branch *jumping* (RPC has no goto; fork/clone are
the desk's branch tools), `!!` hidden bash, themes, `/login`, `/settings` beyond
the ⚙ subset, `/reload`, keybinding customization. `@file` completion inserts a
path reference; it does not attach file contents the way TUI submit does.

## Design decisions

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

## Known issues

(none currently. The 2026-09-02 double-rendered-user-message bug is FIXED: `send()`
appends the user bubble optimistically *before* the POST and queues it; the
`message_end` handler swaps the queued bubble for pi's echoed user message —
append-before-POST matters because the SSE echo can beat the fetch response.
Regression check: `test/double-msg.e2e.mjs`, browser-level, passed 2026-09-02.)
