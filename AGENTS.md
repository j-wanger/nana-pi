# nana-pi

The toolkit repo: adoption of the [pi coding agent](https://github.com/earendil-works/pi)
as a primary coding-agent platform (macOS + native Windows, Codex subscription + local
models), plus the nana pack, the desk ("nana code"), the knowledge pull, and the project
templates every other repo scaffolds or adopts from. Sibling repo to `~/nana-agent-loop`.

Read in order: `~/nana-agent-loop/OBJECTIVE.md` (the umbrella objective + current priority —
nana-pi has none of its own) → `HANDOFF.md` (the frontier) →
`research/pi-landscape-2026-09-01.md` (the verified pi capability map; do not re-research
what it answers — append dated addenda when facts drift, pi releases fast).

## Layout

- `packages/nana-pack/` — the pi extension pack: gate, post-edit checks + receipts,
  session lifecycle/handoff, notify, `nana-objective`; `skills/` (scaffold, adopt-py,
  adopt-ts, adopt-structure, dev workflow); `bin/` (the `pi-review` runner + round cap,
  canonical home since 2026-09-18, on PATH via `~/.local/bin/pi-review`).
- `packages/nana-knowledge/` — the prompt-time knowledge pull: a zero-dep FTS5/BM25 index
  over the markdown knowledge stores on this machine, read from a Claude Code
  `UserPromptSubmit` hook and from pi's `before_agent_start` via one shared `hook` CLI.
- `packages/nana-stage/` — the staged-block layer behind the UI-centric frontend: validates,
  HMAC-signs and ledgers code-authored blocks a tool returns.
- `apps/desk/` — "nana code": the local browser dashboard over pi sessions (rail, live
  transcripts, spawn/fork/rename, the wire). Its README carries the Contract notes and
  Known limits — read them before changing its surface.
- `apps/bench/` — the reusable pi benchmark (study/profile/task/checker; costed with pi-ai's
  own `Usage`/`calculateCost`); `studies/` holds recorded verdicts.
- `templates/` — copier templates behind `scaffold-py`/`scaffold-ts` and `adopt-py`/`adopt-ts`.
  The copier src is the REPO ROOT (root `copier.yml`, `language` question); template changes
  ship by commit + `v*` tag. `templates/_shared/working-under-nana-pi.md` is the SINGLE
  source of the canonical section below — edit it there, never in a copy.
- `docs/` — design docs, review corpora (`docs/reviews/<slice>-<date>/`), and `docs/sessions/`
  (this repo's narrative, newest first).
- `research/` — grounded landscape knowledge. `research/raw/` holds the deep-research
  artifacts the distilled files were written from.

## Rules

- Target the `@earendil-works` scope only; `@mariozechner/*` is deprecated upstream.
- Extensions in `packages/` must stay cross-platform (darwin + native win32) and degrade
  gracefully when a capability is missing (no notifier, no formatter) — never crash the agent;
  remember `tool_call` handler errors BLOCK the tool (fail-safe upstream design).
- An extension gate is advisory-by-load-path: never claim it is un-bypassable. Unattended
  enforcement stays at the container/sandbox layer.
- Verify against the locally installed pi version (`pi --version`, docs under
  `$(npm root -g)/@earendil-works/pi-coding-agent/docs/`) before citing API details.
- Every README states its runtime dependencies, including the globally installed pi package
  the desk resolves at runtime (Jake, 2026-09-09).
- Contract changes are declared where the consumer reads them — `apps/desk/README.md`
  "Contract notes"/"Known limits", the pack README, the design doc — not only in a commit.

## Working pattern

- **The seat briefs, verifies and merges; Opus workers do the building**, in git worktrees
  under `~/nana-pi-wt/<lane>` on `feat/*` branches off main. Never two writers in one
  worktree; the desk's e2e tests bind fixed ports, so never run suites across worktrees at once.
- **Review ladder:** `gpt-5.6-sol` per package (local correctness), `gpt-6-astra` whole-unit
  (cross-package policy, undeclared contracts) — they catch disjoint classes, keep both when
  the blast radius warrants it. Run reviews with `pi-review` (on PATH); corpora land under
  `docs/reviews/`.
- **Review cap = 3 rounds per item** — `pi-review` refuses r4+ without `--over-cap "<what
  changed>"`. Instrument or implement instead of taking another round.
- Residuals from a review are recorded one line each (package README / Known limits), not
  carried in someone's head.

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
