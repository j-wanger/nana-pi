# nana-pi

The toolkit repo: adoption of pi, the nana pack, desk, knowledge pull, and project templates. Sibling to `~/nana-agent-loop`.

Support: macOS tested; Linux has no recorded native acceptance; the pack runs on native Windows but is untested, Claude Code shell hooks and the review wrapper are unavailable, and launchd is macOS-only.

Startup: read `HANDOFF.md`; look up only affected `REQUIREMENTS.md` rows by ID (grep or requirements skill). Read the landscape document only for pi API questions.

## Objective contract

Invariant: only user-scope `objective.enabled: false` turns the objective off; project config cannot. Output is bounded, marker-derived intent, never raw file instructions. See `packages/nana-pack/README.md` and affected `REQUIREMENTS.md` rows.

## Layout

- `packages/nana-pack/` — the pi extension pack: gate, post-edit checks,
  session lifecycle/handoff, notify, `nana-objective`; `skills/` (scaffold, adopt-py,
  adopt-ts, adopt-structure, dev workflow); `bin/` — the `pi-review` runner (canonical home since 2026-09-18, on PATH via
  `~/.local/bin/pi-review`) with `review-round`, `review-shape`, `review-ledger` and `pi-worker`
  behind it, `pi-watchdog`, the two producers the seat's Claude Code SessionStart hooks run —
  `nana-objective` and `nana-adoption` — `nana-writing` (the report-only writing checker), and
  `nana-frontier` (the report-only HANDOFF structure checker).
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
  The copier src is the REPO ROOT (root `copier.yml`, `language` question); tags ship only through
  `npm run release`, which runs acceptance first; CI releases after a green suite on main. `templates/_shared/` is the SINGLE source of everything more than
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

See the shared working pattern below for the defaults; the roster source is shared memory `reference_roster.md`. Local overrides are explicit in each project.

<!-- nana:working-under-nana-pi begin -->
## Working under nana-pi

The bullets below describe pi sessions; other runtimes receive only the surfaces listed here. At startup, read `HANDOFF.md`, look up affected `REQUIREMENTS.md` rows by ID (grep or the requirements skill), and read the landscape doc only for pi API questions.

| Runtime | Objective | Shared memory | nana-soul / nana-standards | Writing rule | Knowledge pull | Gate | Verifier pipe | Post-edit | Compaction summary | Notify |
|---|---|---|---|---|---|---|---|---|---|---|
| Claude Code seat | SessionStart `nana-objective.sh` and `nana-adoption.sh` hooks | `nana-shared-memory.sh` hook; Claude shared-memory index and auto-memory | Both Claude rules | Shared nana-writing rule | UserPromptSubmit `nana-knowledge.ts hook` | No nana command gate | Bash PreToolUse Node hook `verifier-pipe.mjs` (unavailable on win32) | No nana per-edit checks | Claude-owned summary; no nana HANDOFF producer | No nana notify |
| pi TUI or desk session | `nana-objective` extension | No shared auto-memory | Neither rule; requirements-first arrives through AGENTS and the requirements skill | `nana-writing` extension | `nana-knowledge` extension (`before_agent_start`) | `nana-gate` extension | `nana-gate` shared predicate for bash and PowerShell | `nana-post-edit` extension; configured checks, if any | `nana-lifecycle` journal; `nana-handoff` extension on compaction | `nana-notify` extension |
| pi reviewer/worker child (`NANA_HANDOFF=off`) | `nana-objective` extension | No shared auto-memory | Neither rule | `nana-writing` extension | `nana-knowledge` extension | `nana-gate` extension | `nana-gate` shared predicate for bash and PowerShell | `nana-post-edit` extension; configured checks, if any | Disabled by `NANA_HANDOFF=off` | `nana-notify` extension |
| Codex | Unsupported; no nana runtime contract | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified | Not specified |

pi deliberately has no user-level `AGENTS.md`; shared auto-memory and nana-soul are Claude-only. Requirements-first practice is shared through project `AGENTS.md` and the requirements skill. The separate nana-knowledge extension serves pi; Claude Code has its own knowledge hook.

### pi-session guidance

- **Objective:** nana-objective supplies the nearest project objective unless disabled by user configuration; the shared rules above describe pi-only behavior.
- **Compaction summary:** compaction summaries are pi-owned background state, not the project frontier. Persist unresolved work and Jake's open questions in `HANDOFF.md` before a final report or session boundary.
- **Journal and notify:** journal records session events; notify is a pi extension and may be disabled or silent headlessly.
- **Gate:** Advisory pi gate inspects selected shell commands and protected edit/write targets. It is not a security boundary; see the pack README for exact scope and limits, including the interpreter code-operand path gap for floored settings, auth, MCP and extension files.
- **Post-edit:** configured checks run after successful edits only in pi; absent commands mean no checks. Claude Code has no nana per-edit checks.

### Working pattern

- Default worktree root: `~/<repo>-wt/<lane>`; branch: `feat/<lane>`, based on main. One writer per worktree.
- Review corpus: `docs/reviews/<lane>-<date>/`. Builder launcher: `pi-worker --lane <name> --brief <file> --out <file>`; reviewer launcher: `pi-review`.
- Review ladder: package reviewer, then land reviewer when blast radius warrants both. Maximum three rounds per item; a different model lineage reviews the work.
- Land checklist: resolve review findings or record residuals at point of use; use `nana-land` with a clean `main` checkout and clean source, verified review rounds, and the suite on the reviewed tip; rerun the suite if either checkout changes, and rely on the helper's immediate pre-merge checks, ff-only merge, and containment verification. Cleanup is a separate operation, only for a clean `feat/<lane>` worktree contained in `main`. Then run map, README, and locked full-suite checks; commit explicit paths and report evidence.
- Project-specific overrides belong in that project's own section AFTER this marker region; `nana-setup project` replaces everything between the markers.
<!-- nana:working-under-nana-pi end -->

### Requirements-first

Change the applicable requirement row first, then tagged tests, then code. Keep evidence and status honest; consult the requirements skill and affected rows for the full contract.

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

### Shared-machine test runs

Run the full suite with `npm run test:locked` when worktrees share a machine. The command holds one machine-wide lock for full runs; path-filtered runs do not wait for it.

### The desk

Sessions here are visible and driveable on nana code (the desk, started separately) — a local browser
dashboard over your pi sessions (history, live transcripts, spawn, rename).
