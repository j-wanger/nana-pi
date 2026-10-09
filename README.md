# nana-pi

Adoption of the [pi coding agent](https://github.com/earendil-works/pi), nana pack, desk, knowledge pull, and project templates.

Support: macOS tested; Linux runs in hosted CI, where the suite leg is non-blocking, with no recorded machine install; the pack runs on native Windows but is untested, and on Windows there is no Claude Code hook except the knowledge pull, none of its PATH commands are linked, and the review and builder launchers are unavailable; launchd is macOS-only.
Sibling repo to `~/nana-agent-loop`.

- `research/` — grounded landscape knowledge. Start with `research/pi-landscape-2026-09-01.md`
  (adoption verdict + full capability map, adversarially verified). `research/raw/` holds the
  deep-research artifacts it was distilled from.
- `packages/` — our pi packages, chiefly the nana extension pack: seven extensions (gate,
  post-edit, lifecycle, notify, handoff, objective, writing), plus scaffold + dev-workflow
  skills. Installable via
  `pi install git:` or a local path — which ships the extensions of `nana-pack` and
  `nana-knowledge` (the two the root `package.json` manifests) plus the pack's skills.
  `nana-stage`'s extension is NOT in that manifest: the desk loads it per app.
- `templates/` — copier project templates behind the `scaffold-py`/`scaffold-ts` skills
  (greenfield) and `adopt-py`/`adopt-ts` (retrofit onto an existing project — adopt mode
  emits configs only, source tree untouched). Opinionated Python and TypeScript stacks,
  folder-by-feature, nested AGENTS.md, post-edit quality gates, and the three frontier seeds
  (`OBJECTIVE.md`, `HANDOFF.md`, `docs/sessions/`) from the one `templates/_shared` source
  every path shares. The copier src is the
  REPO ROOT (root `copier.yml`, `language` question) — canonically
  `https://github.com/j-wanger/nana-pi.git` — so copies are tag-versioned and re-sync
  via `uvx copier update`; tags are cut only by `npm run release -- [--ref <rev>] [--push]`, which runs the acceptance gate first. CI runs that release step after a green suite on main; the first hosted run remains unproven until the seat records it. Generated CI
  carries a `template-drift` job that goes red when the project is behind the latest tag.
- `packages/nana-knowledge/` — knowledge pull: a local BM25 (FTS5) index over the
  markdown knowledge stores on this machine, queried from a Claude Code
  `UserPromptSubmit` hook and from pi's `before_agent_start` through one shared hook CLI,
  then injected as a few pointers at the moment of a live decision. Zero dependencies;
  read-only on every source. See
  `packages/nana-knowledge/README.md`.
- `packages/nana-setup/` — the one-command bootstrap for everything that is NOT a pi extension:
  the Claude Code half (hooks, rules, skills, `settings.json` wiring, the two-tier auto-memory), the
  user-scope pi config, `pi-review` on PATH, and the desk service. `nana-setup doctor` is the
  ✓/✗ instrument for a fresh machine. See `packages/nana-setup/README.md`.
- `apps/desk/` — nana code, a local browser dashboard over pi sessions: no npm dependencies
  of its own, but it requires the installed pi (spawned AND imported — see `apps/desk/README.md`).
- `apps/bench/` — a reusable benchmark for pi itself: run the same tasks through different
  tool/prompt profiles and record tokens, wall time, tool-call mix and deterministic
  correctness. Studies live in `apps/bench/studies/`; see `apps/bench/README.md`.
- `docs/` — design docs; `docs/shippable-nana-pi-options-2026-09-02.md` is the ratified
  shippability plan.

## Requirements-first

A project here keeps a standing, numbered contract — `REQUIREMENTS.md` — alongside its code, and
new behaviour starts there: a requirement diff (add, split or retire a row; IDs are never
renumbered), then tests carrying `req: R-nnn` markers, then the code. A trace check in the suite
fails when a status disagrees with the markers, so the ledger cannot quietly overclaim; before a
row is flipped to `implemented` somebody has to name the clause each cited test pins, and an
independent reviewer asks exactly that. The same file carries the general engineering bar as rows
(`Part G`): tunables defined once in a declared config surface with their provenance and no inline
literals, a six-tag contract header on every module, named exports and injected resources, and a
generated code map whose `--check` is in the suite and whose `--impact` gives a change's blast
radius before you touch a module. Both templates ship the file, the rail and the map script, and nana-pi runs them on ITSELF:
`npm run map` rewrites `docs/code-map.md`, `npm run map:check` fails when the map and the code
disagree, `npm run map:impact -- <file...>` prints a change's blast radius, and
`npm run readme:check` holds every README in `readme-check.config.json` to its claims. All
three are thin shims — `scripts/code-map.mjs`, `scripts/readme-check.mjs` and
`scripts/requirements-trace.mjs` — over the one copy of each tool that the templates ship, and
all three run inside `npm test` as well. Nana-pi's own `npm run req:rows -- <file...>` tool in
`scripts/requirement-rows.mjs` is not shipped by the templates, and its result is neither complete
nor exact. `scripts/ts-syntax-check.mjs` compiles TypeScript without evaluating it; the seat wires it as a post-edit check for `.ts` files. `nana-setup` installs the `requirements` skill that drives all of it (including an audit mode that
extracts rows from a project that has none yet) into both pi and Claude Code, plus a
`packages/nana-setup/claude/rules/nana-standards.md` rule carrying the same bar in prose. The pattern was proven in `~/aml-desk`
(2026-10-01/02) before it was promoted here.

## Dependencies

Nothing in this repo is published to npm and nothing here has a lockfile.
Dependencies vary by component; a globally installed pi is the common requirement for
the pi-hosted ones. Per component:

| Component | Runtime | Dev / test |
|---|---|---|
| `apps/desk/` (nana code) | Node ≥ 22.19; **`@earendil-works/pi-coding-agent` ≥ 0.84.4 installed globally (tested on 1.0.2, 2026-10-05)** — spawned as `pi --mode rpc` per live session AND imported in-process for session parsing (`parseSessionEntries`, `migrateSessionEntries`, `CURRENT_SESSION_VERSION`). Enforced at startup: below 0.84.4, or when the package cannot be tied to the `pi` the desk spawns, it refuses to start. No npm dependencies of its own. | Playwright 1.61.1 (`playwright`/`playwright-core`, root `node_modules`) for the `test/*.e2e.mjs` browser tests only; `PW_ROOT` points at it if it lives elsewhere. `test/*.test.mjs` are zero-dep `node <file>` runs. Details: `apps/desk/README.md`. |
| `packages/nana-pack/` (the extensions + skills) | pi itself, as an **optional peerDependency** (`@earendil-works/pi-coding-agent: "*"`) — the extensions run inside pi, so pi is the host, not a package they install. No runtime npm dependencies. | Zero-dep `node packages/nana-pack/tests/*.test.mjs`; pi-dependent tests FAIL naming the locations tried when pi is absent. Set `DESK_PI_ROOT` to point pack tests at another install (`DESK_PI_BIN` selects the executable for desk tests). |
| `packages/nana-stage/` (the stage ledger) | Same: pi as an optional peerDependency, no runtime npm dependencies. | Zero-dep node tests. |
| `packages/nana-setup/` (the bootstrap) | Node ≥ 22.18 only (the installed objective hook's CLI imports `.ts` via Node's built-in type stripping; older Node → a named `OBJECTIVE UNAVAILABLE` marker and a doctor ✗); no npm dependencies. Shells out to `pi` (registration), `node` (the knowledge build) and `launchctl` (`--desk`, macOS) — each optional, each reported as skipped when missing. | Zero-dep `node packages/nana-setup/tests/*.test.mjs`; every test installs into `os.tmpdir()` via `--home` and never touches the real `~/.claude`, `~/.pi` or LaunchAgents. |
| `packages/nana-knowledge/` (the knowledge pull) | Node ≥ 22.18 only — `node:sqlite` (bundled SQLite, FTS5) and Node's TypeScript type stripping; no build step, no npm dependencies, no model calls. pi is an optional peerDependency — the index, the `nana-knowledge` CLI and the Claude Code `UserPromptSubmit` hook run without it — but the package also ships a live pi extension (`packages/nana-knowledge/extensions/nana-knowledge.ts`, manifested in the root `package.json`) that pi loads when the pack is installed. | Zero-dep `node packages/nana-knowledge/tests/*.test.mjs`; no fixtures outside `os.tmpdir()`. Details: `packages/nana-knowledge/README.md`. |
| `templates/` (copier scaffolds) | `uv` (which ships `uvx`, how copier runs) for both languages; `pnpm` for the TypeScript template. Generated projects carry their own pinned stacks. | — |
| `apps/bench/` (the pi benchmark) | Node ≥ 22.19; **`@earendil-works/pi-coding-agent` ≥ 0.84.4 installed globally (tested on 1.0.2, 2026-10-05)** — spawned as `pi --mode json` per measured run AND imported in-process for token/cost arithmetic (`calculateCost` + the `Usage` type from its bundled `@earendil-works/pi-ai` root export; `ModelRuntime` from the pi root, for offline model pricing). `pi-web-access` 0.28.0 under `apps/bench/.ext/` for profile C only — reviewed, content-pinned in `study.json`, not vendored, installed with `npm i --prefix apps/bench/.ext/pi-web-access pi-web-access@0.28.0`. No npm dependencies of its own. | No Playwright, nothing from npm: all ten `test/*.test.mjs` are zero-dep `node <file>` runs with no model calls. Details: `apps/bench/README.md`. |

## Install — the whole experience ships from this repo

The experience has **two halves**, and both are installed from this repo:

1. **The pi runtime half** — extensions, skills and templates, installed with `pi install`
   (below). Nothing outside pi is touched.
2. **The Claude Code half + user-scope config** — the global hooks and rules, the
   `~/.claude/settings.json` wiring, the two-tier auto-memory, `~/.pi/agent/nana-pack.json` and
   the objective file, `pi-review` on PATH, and (opt-in) the desk service. That is
   `nana-setup`, and it needs the repo files on disk:

   ```bash
   node packages/nana-setup/bin/nana-setup.mjs install          # idempotent; re-run any time
   node packages/nana-setup/bin/nana-setup.mjs install --desk   # + the desk launchd service (macOS)
   node packages/nana-setup/bin/nana-setup.mjs doctor           # one ✓ or ✗ per piece; exits 1 on any ✗
   ```

   `doctor` is the check to run on a fresh machine, and whenever a session feels
   under-informed. Hooks, rules and the `requirements` skill are installed as **symlinks into the
   clone**, so a `git pull` updates them with no reinstall — and the skill symlink points at the
   same `packages/nana-pack/skills/requirements` directory pi reads, so both runtimes get one
   source, never two drifting copies.

   **What stays private:** `~/.claude/rules/nana-personal.md` — who you are, how you want to be
   talked to. It is never in this repo. The repo ships `packages/nana-setup/claude/rules/nana-personal.example.md`, and the
   installer copies it into place **only when the file is absent**, then never reads or rewrites
   it. **What it never overwrites:** that file, an existing `~/.pi/agent/nana-pack.json` or
   objective file, and any hook, setting or package entry already present — a hook already wired
   by hand is recognised and left alone, and a regular file where a symlink belongs is backed up
   to `<name>.bak-<date>` before it is replaced. `settings.json` is rewritten atomically and only
   when nothing else has touched it in the meantime; a file it cannot parse *or cannot safely
   extend* aborts the install before anything on disk moves.

### Fresh machine (macOS), in order

1. Install Node ≥ 22.19 with a global npm prefix you can write without sudo (Homebrew, nvm/fnm, or a user prefix), and install git (`xcode-select --install` if it is missing).
2. Run `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2`, then `pi --version`. Do not use pi's managed installer or `pi update`; see the setup README's “Upgrading pi itself” section.
3. Run `git clone https://github.com/j-wanger/nana-pi ~/nana-pi`; keep the clone.
4. Run `cd ~/nana-pi`, then `node packages/nana-setup/bin/nana-setup.mjs install` (`--desk` adds the desk service).
5. Run `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zprofile`, then open a new terminal.
6. Run `pi install npm:pi-subagents@0.75.0`.
7. Write your objective and current-priority lines over the placeholders in `~/.pi/agent/nana-objective.md`, or set `objective.path` in `~/.pi/agent/nana-pack.json` to an umbrella repo's `OBJECTIVE.md`.
8. Run `nana-setup doctor` from `~/nana-pi`; expect `all good`.

`uv` (both templates) and `pnpm` (TypeScript) are needed only to scaffold or adopt.

### A blank folder → a nana project

`install` sets up the machine; it does not give a folder the three files the session-start
hook, the score-at-close rule and the handoff protocol read **per project**. That is one
command, from any shell, for any language — pi or Claude Code:

```bash
node packages/nana-setup/bin/nana-setup.mjs project ~/my-thing   # creates the folder if needed; seeds; idempotent
```

Before the first session:
1. Ratify the two DRAFT lines in `OBJECTIVE.md`: give one objective line and one current-priority line; your words are written, never invented.
2. Run `nana-setup trust <dir>`.

It seeds `OBJECTIVE.md`, `HANDOFF.md`, `docs/sessions/` (README + this month's file),
`AGENTS.md` + a `CLAUDE.md` symlink and a `.pi/nana-pack.json` on-ramp, `git init`s when
needed, and refreshes the knowledge index. Nothing existing is ever overwritten;
`project --check` prints one ✓/✗ per file. Scaffolded and adopted projects get the same three
seeds from the same `templates/_shared` source (copier template, `adopt-structure` skill).

Prerequisites (standard tooling only, nothing nana-specific): follow the [macOS fresh-machine checklist](#fresh-machine-macos-in-order); `uv` for BOTH templates — it is the Python
toolchain, and copier runs as `uvx copier` with `uvx` shipping inside uv, so the
TypeScript path needs uv as well (copier itself is nothing extra to install); plus
`pnpm` for the TypeScript template. On Windows add
Git for Windows — pi's bash tool runs through Git Bash (see pi's `docs/windows.md`;
the documented pack and project commands are written to run in PowerShell or cmd (untested there); no WSL needed). If pi errors
`No bash shell found`: install Git for Windows to its default location (pi probes
`%ProgramFiles%\Git\bin\bash.exe`, no PATH change needed), or for scoop/portable Git
set `{ "shellPath": "C:\\...\\bin\\bash.exe" }` in `~/.pi/agent/settings.json`. Don't
let it fall through to WSL's `System32\bash.exe` — commands would run inside Linux
with Linux paths.

### From git (pack-only use; no clone needed)

```bash
# 1. the nana-pack — all seven extensions, the knowledge pull + every skill (the root package.json
#    manifests packages/nana-pack, which is what makes the git: install work)
pi install git:github.com/j-wanger/nana-pi        # pack-only use; add -l for project-local

# 2. a project — or just ask pi, the scaffold-py/scaffold-ts/adopt-* skills drive this
uvx copier copy --data language=python https://github.com/j-wanger/nana-pi.git <dest>

# For nana-setup or the desk, install from a local clone instead (see below).
```

Copier renders the latest `v*` tag, never HEAD — tags are cut only by
`npm run release -- [--ref <rev>] [--push]`, which runs the gate first; CI runs it after a green suite on main. The first green hosted run cut v0.6.4 on 2026-10-08. A passing gate prints no summary line, and the non-blocking Linux suite leg still fails one symlink-escape check. `npm run template:accept -- [--src <repo>] [--ref <rev>]` runs the four rendered project checks. Pinned pack installs (`@ref`) need a ref that contains the root manifest —
tags v0.4.0 and earlier predate it, so pin a commit (or any later `v*` tag) instead.

### From a local clone

Anyone using nana-setup or the desk installs from a local clone; doctor reads ✗ when pi loads a `git:` copy beside that clone.

One `git clone https://github.com/j-wanger/nana-pi`, then everything runs off the
working tree:

```bash
# pack — the install is LIVE: new sessions read the clone directly, so
# updating is `git pull`, never a reinstall
pi install /path/to/nana-pi

# project — a local src still renders the latest v* tag by default;
# --vcs-ref=HEAD renders the latest commit instead, and then uncommitted
# template edits ARE included (copier warns "dirty template")
uvx copier copy --data language=python /path/to/nana-pi <dest>

# nana code (the desk)
node /path/to/nana-pi/apps/desk/server.mjs

# the Claude Code half + user-scope config (add --desk to run the desk as a
# launchd service instead of by hand)
node /path/to/nana-pi/packages/nana-setup/bin/nana-setup.mjs install
node /path/to/nana-pi/packages/nana-setup/bin/nana-setup.mjs doctor
```

### Template acceptance and release

Run the rendered projects' native checks with `npm run template:accept -- [--src <repo>] [--ref <rev>]`.

Cut a tag only with `npm run release -- [--ref <rev>] [--push]` (`scripts/template-release.mjs`). Release runs acceptance before creating a tag. CI runs release only after a green suite on main. The first hosted run remains unproven until the seat records it.

### Updating and partial adoption

- **Pack and Claude Code half** — follow the canonical [updating and removal runbook](packages/nana-setup/README.md#updating-and-removing) for source updates, install and doctor. Targetless `pi update` updates pi itself; `pi update <source>` and `pi update --extensions` update packages only.
- **Part of the pack** — install the whole pack, then `pi config` (TUI; Tab
  switches user/project scope) to switch individual extensions and skills on or
  off. There is no per-skill install; enable/disable is the partial surface.
- **Generated project** — run `uvx copier update --conflict inline` inside the
  project (reads `.copier-answers.yml`): a three-way merge that replays your
  local edits onto the newest template tag. For adopted projects, convert
  decorator markers first; never use `--conflict rej`. Other update controls
  include `--skip-answered` to keep prior answers, `--pretend` for a dry run,
  and `--vcs-ref` to pin a specific tag. `copier recopy` is the escape hatch —
  re-render clean, discarding your diff. Generated CI carries a `template-drift`
  job that goes red when the project is behind the latest template tag.
- **Existing project, configs only** — adopt mode: the `adopt-py`/`adopt-ts`
  skills (or `--data adopt=true` on the copier command) overlay the pinned
  configs and leave the source tree untouched; reconcile from `git diff`, then
  commit including `.copier-answers.yml`. An adopted project re-syncs with
  `copier update` like any other copy.
- **Existing project, structure only** — the `adopt-structure` skill adds the
  AGENTS.md navigation layer (a coherent root + per-folder AGENTS.md), a
  starter `.pi/nana-pack.json`, and the three frontier seeds when they are
  missing, without touching the language toolchain. No `.copier-answers.yml`, so
  no `copier update` relationship; layer `adopt-py`/`adopt-ts` on top later for
  the pinned stack. Outside pi, `nana-setup project` does the seed half.

Canonical upstream coordinates: repo <https://github.com/earendil-works/pi>, npm `@earendil-works/pi-coding-agent`
(the `@mariozechner/*` scope is deprecated). Latest at repo creation: 0.84.4, Node ≥22.19.

## Tests

On a shared machine, run the full suite with `npm run test:locked` (implemented by `scripts/test-locked.mjs`); it serializes full runs across worktrees. Add a path substring after `--` for an unlocked filtered run, such as `npm run test:locked -- packages/nana-pack/tests/test-locked.test.mjs`. Two runs reclaiming the same dead holder's lock at the same instant may both proceed; this can share CPU but cannot lose suite data.

`npm test` from the repo root (`scripts/test.mjs`) runs every `packages/*/tests/*.test.mjs`
and `apps/desk/test/*.test.mjs` one file at a time, each from its package dir with a fresh
temp `HOME`/`USERPROFILE`, prints one PASS/FAIL/SKIP line per file plus a total, and exits 1
if any file fails — also when no file matched the filter, or a `--self-test` fixture missed
its expected verdict; 130 on Ctrl-C (SIGINT) and 143 on SIGTERM, each after killing the
active test's process tree. `apps/bench/test/*.test.mjs` is in it (stubs, zero model calls); the `*.e2e.mjs` browser suites are not.
`npm test -- <substring>` narrows the set; `--verbose` streams output; `--self-test` adds a
deliberately failing file to prove the runner turns red. `node scripts/template-acceptance.mjs`
runs the separate rendered-template acceptance gate; `--src <repo>` and `--ref <rev>` select
its source and commit. It is intentionally not collected by `npm test`.
