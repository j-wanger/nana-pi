# nana-pi

The toolkit repo: adoption of pi, the nana pack, desk, knowledge search, and project templates. Sibling to `~/nana-agent-loop`.

Support: macOS tested; lanes land without waiting for Windows; Windows runs on main after each land, and a red main blocks further lands; Linux and Windows run in hosted CI, where the Windows suite leg blocks release and the Linux suite leg does not; Linux has no recorded machine install; on Windows the Claude Code hooks run from the checkout and need Claude Code 2.1.139 or later, the pack's PATH commands are shims that need the bin folder on PATH, and the review and builder launchers run through node from the checkout with an npm-installed pi; launchd is macOS-only.

Startup: read `HANDOFF.md`; look up only affected `REQUIREMENTS.md` rows by ID (grep or requirements skill). Read the landscape document only for pi API questions.

## Objective contract

Invariant: only user-scope `objective.enabled: false` turns the objective off; project config cannot. Output is bounded, marker-derived intent, never raw file instructions. The frontier block follows the same bounded output rule and has no switch. See `packages/nana-pack/README.md` and affected `REQUIREMENTS.md` rows.

## Layout

- `packages/nana-pack/` — the pi extension pack: gate, adoption,
  session lifecycle, `nana-objective`; `skills/` (scaffold, adopt-py,
  adopt-ts, adopt-structure, dev workflow); `bin/` — the `pi-review` runner (canonical home since 2026-09-18, on PATH via
  `~/.local/bin/pi-review`) with `review-round`, `review-shape`, `claude-review` and `pi-worker`
  behind it, `pi-watchdog`, `nana-roster` (the per-machine roster command), the three producers the seat's Claude Code SessionStart hooks run —
  `nana-objective`, `nana-adoption` and `nana-frontier-summary` — `nana-writing` (the writing checker, on PATH; report-only), and
  `nana-frontier` (the report-only HANDOFF structure checker), and `nana-curate` (the private owner-reviewed memory queue).
- `packages/nana-knowledge/` — a zero-dep FTS5/BM25 index over this machine's markdown
  knowledge stores, searched explicitly with `nana-knowledge query`.
  Automatic knowledge delivery is retired in both runtimes.
- `packages/nana-stage/` — the staged-block layer behind the UI-centric frontend: validates,
  HMAC-signs and ledgers code-authored blocks a tool returns.
- `packages/nana-setup/` — the one-command bootstrap for everything outside pi: the Claude Code
  hooks/rules/`settings.json` wiring, the two-tier auto-memory, user-scope pi config, `pi-review`
  on PATH, the desk launchd service. The canonical copies of those hooks and rules live HERE
  (`claude/`), symlinked into `~/.claude` — edit them in the repo, never in `~/.claude`.
  `nana-setup doctor` is the ✓/✗ instrument for a machine.
- `apps/desk/` — the local manifest app host; the desk page is retired. Its README carries
  the Contract notes and Known limits — read them before changing its surface.
- `apps/bench/` — builder and seat context anatomy; `studies/` holds preserved verdicts and frozen fixtures from retired study runners.
- `templates/` — copier templates behind `scaffold-py`/`scaffold-ts` and `adopt-py`/`adopt-ts`.
  The copier src is the REPO ROOT (root `copier.yml`, `language` question); tags ship only through
  `npm run release`, which runs acceptance first; CI releases after green suite and install-check jobs on main. `templates/_shared/` is the SINGLE source of everything more than
  one consumer emits — `working-under-nana-pi.md` (the canonical section below) and the three
  frontier seeds `OBJECTIVE.md` / `HANDOFF.md` / `docs/sessions/README.md`, which the language
  templates pull in with a Jinja `include` (the loader root is the repo root), the skill
  `adopt-structure` copies, and `nana-setup project` fills. Edit them there, never in a copy.
- `docs/` — design docs, review corpora (`docs/reviews/<slice>-<date>/`), and `docs/sessions/`.
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
  the desk resolves at runtime (the owner, 2026-09-09).
- Contract changes are declared where the consumer reads them — `apps/desk/README.md`
  "Contract notes"/"Known limits", the pack README, the design doc — not only in a commit.

## Working pattern

See the shared working pattern below for the defaults and the roster command. Local overrides are explicit in each project.

<!-- nana:working-under-nana-pi begin -->
## Working under nana-pi

The bullets below describe pi sessions; other runtimes receive only the surfaces listed here. At startup, read `HANDOFF.md`, look up affected `REQUIREMENTS.md` rows by ID (grep or the requirements skill), and read the landscape doc only for pi API questions.

| Runtime | Context and rules | Checks and state |
|---|---|---|
| Claude Code seat | SessionStart `nana-objective.mjs` (objective/frontier), `nana-adoption.mjs`, `nana-shared-memory.mjs`; nana-soul / nana-standards; shared nana-writing rule and `nana-rulings.md` | No nana Gate or Verifier pipe; Claude-owned Compaction summary, no nana HANDOFF producer; `nana-roster-notice.mjs` notice |
| pi TUI or desk session | `nana-objective`, `nana-frontier-summary`; `nana-writing`, `nana-rulings`; no soul/standards or shared auto-memory | `nana-gate` for bash/PowerShell; `nana-lifecycle` journal; `nana-adoption` journals unadopted roots; pi-owned compaction; `nana-roster-notice` widget |
| pi reviewer/worker child (`NANA_HANDOFF=off`) | Same pi extensions; frontier adds nothing under `NANA_ROLE` | Same gate/journal; roster notice has no UI |
| Codex | Unsupported; no nana runtime contract | Not specified |

Objective: nearest project unless user-disabled. Shared memory: Claude-only; pi has no user-level `AGENTS.md`. Writing rule and rulings follow the runtime above. Knowledge search: explicit `nana-knowledge query` only, no automatic pull. Post-edit: no nana per-edit checks. Notify: no desktop notifications. Requirements-first comes through project `AGENTS.md` and the requirements skill.

### Session guidance

- **Compaction summary:** compaction summaries are pi-owned background state, not the project frontier. Persist carry before a final report or session boundary. Builders and reviewers put open questions in their report; only the seat posts issues.
- **Gate:** Advisory pi gate inspects selected shell commands and protected edit/write targets. It is not a security boundary; see the pack README for exact scope and limits, including the interpreter code-operand path gap for floored settings, auth, MCP and extension files.
- **Post-edit:** nana runs no per-edit checks in either runtime; run project checks explicitly.

### Working pattern

- Builder pushes: builders do not push. They report the branch, the full tip and the seat checks run on it. The seat pushes after verifying, then waits for CI where the project uses it.
- Every lane gets one reviewer plus CI. Seat guidance lives in the seat guide and the soul and rulings rules.
- Seat guide: while a builder or reviewer runs, the seat does not read or judge its partial work, and it acts when the run completes. The full guide is `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`; Claude Code loads it as a rule, and pi installs and injects the same guide for seat sessions.
- Builder rules: `$HOME/nana-pi/packages/nana-pack/prompts/builder-preamble.md`; reviewer rules: `$HOME/nana-pi/packages/nana-pack/prompts/review-standard.md`. Follow the assigned brief.
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
can set gate patterns (`extraPatterns` / `allowPatterns` / `protectedPaths`). Legacy `postEdit`
and `handoff` sections are accepted and ignored. `<agent dir>/nana-pack.json` is the user-scope equivalent, always
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

CI covers this repository's suite. Builders run touched tests, commit and report their branch, full tip and seat checks run on it. Builders do not push or read CI. The seat pushes after verifying, then waits for that tip's CI; main's push run, read by the seat's main CI check, is the post-land suite check. The local full suite runs only when CI cannot stand in. Run that fallback with `npm run test:locked` when worktrees share a machine. The command holds one machine-wide lock for full runs; path-filtered runs do not wait for it.

### Install check before a land

Land checklist, nana-pi only (the owner, 2026-10-12): a lane that touches `packages/nana-setup/` or a hook runs `node packages/nana-setup/bin/install-check.mjs` locally on macOS before `nana-land`. The land also reads CI: the lane runs macOS install checks, and main runs macOS and Windows install checks; the local run stays by the owner's ruling.

### HANDOFF writing check

The suite fails on a sentence over 25 words in `HANDOFF.md`'s live sections. It also fails on a banned word there.
The live sections are Where things stand, Next, and Open for the owner. Run `nana-writing HANDOFF.md` after editing it.
The suite also fails when HANDOFF's Next or Open for the owner section holds a list item, because those items live as GitHub issues.

### The tree in briefs, reviews and lands

A lane brief names its feature as `Feature: FEAT-nnn · <label>`. A lane brief carries a Precedent section unless it is marked `Card: fix`. Both review launchers select known bugs from the brief's feature line.

### The desk

The desk process hosts manifest-configured apps on separate loopback listeners.
Its main port serves a retired-page note and app links; session-dashboard controls are retired.
