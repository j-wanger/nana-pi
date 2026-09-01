# the pi desk (pilot)

Local, zero-dependency dashboard over pi: every session on the machine in one place,
live sessions driven from the browser, and **the wire** — a live tape of session
lifecycle events across ALL pi activity (TUI sessions included), fed by the
nana-pack lifecycle journal. No other pi dashboard has that feed.

```bash
node apps/desk/server.mjs     # → http://127.0.0.1:4317   (DESK_PORT to change)
```

- **Sessions rail** — reads `~/.pi/agent/sessions/` JSONL trees (newest 15 per
  workspace). Click one to read its transcript; "Continue here" resumes it live.
- **Live sessions** — each is a `pi --mode rpc` subprocess (max 4), so auth,
  models.json, and installed pi packages (incl. nana-gate) behave exactly as in
  the terminal. Composer supports prompt / steer / follow-up, Stop turn, Kill.
- **The wire** — SSE tail of `~/.pi/agent/nana-journal.jsonl` via fs.watch.

Design decisions: RPC subprocess over in-process SDK (extension/auth fidelity —
the gate rides along; decoupled from SDK churn); strict LF-only JSONL framing per
upstream docs (Node readline is non-compliant); binds 127.0.0.1 only, no auth —
do not port-forward it; transcript endpoint realpath-checks paths against the
sessions dir.

Smoke-verified 2026-09-01: sessions list (24 workspaces), transcript parse,
traversal guard, spawn → prompt → streamed text deltas → settled → kill,
wire replay, clean shutdown with no orphan `pi` processes.
