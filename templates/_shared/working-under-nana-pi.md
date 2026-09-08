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
- **Gate.** Dangerous commands and protected paths (`.ssh`, `.env`, pi auth) prompt
  before running — or block, when there's no UI to prompt. It is **advisory** — a load-path convenience, not a security
  boundary; real enforcement is the sandbox / container layer.

### Navigation

pi reads the closest `AGENTS.md` and layers every ancestor up the tree,
closest-wins. Keep each rule where it applies: repo-wide rules at the root, folder
rules in that folder's `AGENTS.md`. An `AGENTS.override.md` replaces a layer
instead of adding to it.

### Config

`.pi/nana-pack.json` (project scope) is honored **only in trusted projects** — it
can set `postEdit.commands`, gate patterns (`extraPatterns` / `allowPatterns` / `protectedPaths`),
and the handoff path. `~/.pi/agent/nana-pack.json` is the user-scope equivalent,
always read.

### The desk

Sessions here are visible and driveable on the nana desk (started separately) — a local browser
dashboard over your pi sessions (history, live transcripts, spawn, rename).
