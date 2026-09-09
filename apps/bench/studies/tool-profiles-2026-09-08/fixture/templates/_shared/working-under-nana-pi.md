## Working under nana-pi

This project runs under the nana-pi pack: five pi extensions that load in every
session once the pack is installed at user scope — any project, no per-project
setup. What that means while you work here:

- **Post-edit checks.** After a successful edit/write, the pack runs the commands
  in this project's `.pi/nana-pack.json` (`postEdit.commands`) whose `match` regex
  hits the edited file, and feeds any failure straight back to you to fix before
  moving on (each run also leaves, best-effort, a content-bound receipt under
  `~/.pi/agent/receipts`). The commands are yours to define — a scaffolded project
  ships a working set (format / lint / type-check); a project set up with the
  `adopt-structure` skill ships a **placeholder** to replace with your real
  toolchain. Until a real command is in place, post-edit runs nothing. The shape
  (one entry per checker; `match` is a regex on the edited path, `run` is the shell
  command, `{file}` is that path — a Python example; use your project's own checker):

  ```json
  {
    "postEdit": {
      "commands": [
        { "match": "\\.py$", "run": "ruff check {file}" }
      ]
    }
  }
  ```

- **Handoff on compaction.** When the context compacts, the pack writes the
  summary to `.pi/handoff.md` and re-injects it into the next fresh session in this
  directory — continuity across the context window, no config needed. Treat it as
  background state; update it in place when it goes stale; only a human deletes it.
- **Journal.** Session events (start / compact / shutdown) append to
  `~/.pi/agent/nana-journal.jsonl` for observability.
- **Notify.** A desktop notification fires when the agent settles and is waiting on
  you.
- **Gate.** Inspects `bash`/`powershell` command strings for dangerous patterns and
  `edit`/`write` target paths for protected files (`.ssh`, `.env`, pi auth), and
  prompts before running — or blocks, when there's no UI to prompt. Scope is narrow:
  reads, custom tools, and direct extension commands are NOT gated, and a later
  handler can still mutate input the gate already checked. It is **advisory** — a
  load-path convenience, not a security boundary; real enforcement is the sandbox /
  container layer.

### Navigation

pi loads `AGENTS.md` from the session's cwd and every ANCESTOR up the tree at
startup, closest-wins — it does NOT descend into subfolders. Keep each rule where
it applies: repo-wide rules at the root, folder rules in that folder's `AGENTS.md`.

A session started higher up does not auto-load a subfolder's `AGENTS.md`, so:

- **Baseline (works everywhere):** before working in a folder, READ that folder's
  `AGENTS.md` — each is written to stand alone as a useful on-demand read.
- **Cleaner when available:** run or delegate folder-scoped work with the session
  cwd set to that folder (e.g. a cwd-capable subagent rooted there), so pi
  auto-loads that folder's `AGENTS.md` as its own cwd + ancestors. (Subagents are
  an extension pattern, not core pi.)

An `AGENTS.override.md` replaces a layer instead of adding to it.

### Config

`.pi/nana-pack.json` (project scope) is honored **only in trusted projects** — it
can set `postEdit.commands`, gate patterns (`extraPatterns` / `allowPatterns` / `protectedPaths`),
and the handoff path. `~/.pi/agent/nana-pack.json` is the user-scope equivalent,
always read.

### The desk

Sessions here are visible and driveable on nana code (the desk, started separately) — a local browser
dashboard over your pi sessions (history, live transcripts, spawn, rename).
