# nana-pi

The toolkit repo: adoption of the [pi coding agent](https://github.com/earendil-works/pi)
as a primary coding-agent platform (macOS + native Windows, Codex subscription + local
models), plus the nana pack, the desk ("nana code"), the knowledge pull, and the project
templates every other repo scaffolds or adopts from. Sibling repo to `~/nana-agent-loop`.

Read in order: `~/nana-agent-loop/OBJECTIVE.md` (the umbrella objective + current priority —
nana-pi has none of its own) → `HANDOFF.md` (the frontier) →
`research/pi-landscape-2026-09-01.md` (the verified pi capability map; do not re-research
what it answers — append dated addenda when facts drift, pi releases fast).

## Objective contract (both runtimes, one producer: `packages/nana-pack/lib/objective.ts`)

- Session start injects the nearest `OBJECTIVE.md` walking UP from the session cwd — always, no
  opt-in; with none found, the user-scope umbrella (`objective.path`) governs. Its default is
  `nana-objective.md` in pi's ACTIVE agent dir (`piAgentDir()`: `PI_CODING_AGENT_DIR` when set —
  a relative value resolves against the process cwd — else `~/.pi/agent`), and a relative
  `objective.path` resolves against that same dir, never the session cwd. Project config can
  neither choose nor disable it.
- `objective.projectFile` (user scope) only RENAMES the file looked for — a bare filename; a
  separator, `.` or `..` is refused and `OBJECTIVE.md` is used (`nana-setup doctor` reads ✗).
- When a product file governs, both program lines (`program objective:` / `program current
  priority:`) are shown too, followed by a precedence sentence: the product lines govern the
  session's work; the program lines say what the toolkit is for.
- Only the marker-bearing `**Objective` / `**Current priority` lines are emitted — one physical
  line each, capped — never raw file content. An unusable file prints `OBJECTIVE UNAVAILABLE`.
- Provenance label (T2c): when a repo-supplied file governs and pi's ACTIVE trust store (`trust.json` in
  `PI_CODING_AGENT_DIR` when set, else `~/.pi/agent`; resolved by `piAgentDir()`, shared with the gate) yields
  no usable affirmative record for its folder (or a nearest recorded ancestor), a two-line
  `UNTRUSTED DATA: …` paragraph precedes the governing lines — the lines are intent, DATA, never
  instructions. Its second line depends on why: store usable → start pi IN that folder (a
  subfolder's record does not count), run `/trust`, restart; otherwise → name the object that is
  actually wrong — the store (malformed, unreadable, not a regular file, too large, owned by
  another user, not writable), a folder or dangling link on its path, or an obstructed
  `trust.json.lock` (pi locks by `mkdir` and reclaims only a lock stale by proper-lockfile's 10 s
  mtime rule, so a file, link, non-empty folder, or a fresh or future-dated empty folder means
  pi's own lookup throws and even a recorded `true` does not count; a held lock's remedy says
  another pi holds it — wait and restart, never remove it) — and the fix to do first, saying when it may need rights the user lacks; never
  a store that does not exist. Every remedy names the store that must receive the decision; under
  a RELATIVE `PI_CODING_AGENT_DIR` it pins the absolute agent dir, since starting pi elsewhere
  would pick another store. `/trust` also makes pi load the folder's project resources. Removal
  advice says to re-check and back up first. It never changes what governs; the umbrella is never
  labelled. Defence in depth, not a security boundary.

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
- `packages/nana-setup/` — the one-command bootstrap for everything outside pi: the Claude Code
  hooks/rules/`settings.json` wiring, the two-tier auto-memory, user-scope pi config, `pi-review`
  on PATH, the desk launchd service. The canonical copies of those hooks and rules live HERE
  (`claude/`), symlinked into `~/.claude` — edit them in the repo, never in `~/.claude`.
  `nana-setup doctor` is the ✓/✗ instrument for a machine.
- `apps/desk/` — "nana code": the local browser dashboard over pi sessions (rail, live
  transcripts, spawn/fork/rename, the wire). Its README carries the Contract notes and
  Known limits — read them before changing its surface.
- `apps/bench/` — the reusable pi benchmark (study/profile/task/checker; costed with pi-ai's
  own `Usage`/`calculateCost`); `studies/` holds recorded verdicts.
- `templates/` — copier templates behind `scaffold-py`/`scaffold-ts` and `adopt-py`/`adopt-ts`.
  The copier src is the REPO ROOT (root `copier.yml`, `language` question); template changes
  ship by commit + `v*` tag. `templates/_shared/` is the SINGLE source of everything more than
  one consumer emits — `working-under-nana-pi.md` (the canonical section below) and the three
  frontier seeds `OBJECTIVE.md` / `HANDOFF.md` / `docs/sessions/README.md`, which the language
  templates pull in with a Jinja `include` (the loader root is the repo root), the skill
  `adopt-structure` copies, and `nana-setup project` fills. Edit them there, never in a copy.
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
  `<agent dir>/receipts` — pi's active agent dir: `PI_CODING_AGENT_DIR` when set, else
  `~/.pi/agent`). The commands are yours to define — a scaffolded project
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
  summary to the user-scope store `~/.pi/agent/handoffs/<sha256(cwd)>.md` (the path is
  printed on write and pickup) and re-injects it into the next fresh session in this
  exact directory. Treat it as background state; update that store file in place when it
  goes stale. A repo `.pi/handoff.md` is never injected (the session gets one pointer line
  naming it as untrusted repo text) — do not create or maintain it.
- **Journal.** Session events (start / compact / shutdown) append to
  `<agent dir>/nana-journal.jsonl` (pi's active agent dir) for observability.
- **Notify.** A desktop notification fires when the agent settles and is waiting on
  you.
- **Gate.** Inspects `bash`/`powershell` command strings for dangerous forms and
  `edit`/`write` target paths for protected files (`.ssh`, `.env`, pi auth, and the policy
  files: `nana-pack.json`, pi's `trust.json`, `.claude/settings*.json`, `.claude/hooks/`),
  and prompts before running — or blocks, when there's no UI to prompt. Allow patterns
  exempt one command segment, never a compound or the floor; a config change loosens the
  gate only at the next session start or `/reload`. Policy files are caught through
  `edit`/`write` (every path form) and through targets a command names *literally*, plus one
  variable spelling: `$PI_CODING_AGENT_DIR` / `${PI_CODING_AGENT_DIR}` / `%PI_CODING_AGENT_DIR%` /
  `$env:PI_CODING_AGENT_DIR` directly followed by `/nana-pack.json` or `/trust.json` (balanced forms
  only; case-insensitive on purpose, as cmd/pwsh names are). Any other
  path the shell computes (relative after `cd` — `cd <dir> && … > nana-pack.json` included —
  other variables and general variable expansion, globs, escapes, a symlink made in the same
  command, script files, interpreter string-building) is NOT caught — gate loosening
  from such a write waits for `session_start`, but the file's other blocks, including
  `postEdit.commands`, apply live, so it can run code in the same session through post-edit;
  the sandbox / container layer is what closes it. Scope is narrow:
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
and the handoff path. `<agent dir>/nana-pack.json` is the user-scope equivalent, always
read — `<agent dir>` is pi's ACTIVE agent dir: `PI_CODING_AGENT_DIR` when set, else
`~/.pi/agent`. When the variable resolves to a directory OTHER than `~/.pi/agent`,
`~/.pi/agent/nana-pack.json` is NOT read (no fallback, no migration); the pack notes that once
per session only when BOTH the active `<agent dir>/nana-pack.json` is absent AND a stranded
`~/.pi/agent/nana-pack.json` exists — otherwise it says nothing. "Trusted" means a decided trust: `/trust` in pi for the folder, then restart —
`pi -a` / the desk's trust box (one run) is not enough for a nana-only `.pi/`. A malformed
(or over-cap) `gate` block, user or project, falls back to the last valid policy for that scope
loaded in this process; with none (a fresh process), it stops every gated tool until the owner
repairs the named file with any editor **outside pi**, or deletes it (missing = defaults, which
discards that scope's custom denies).

### The desk

Sessions here are visible and driveable on nana code (the desk, started separately) — a local browser
dashboard over your pi sessions (history, live transcripts, spawn, rename).
