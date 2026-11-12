# nana-pi

Adoption of the [pi coding agent](https://github.com/earendil-works/pi), nana pack, knowledge search, and project templates.

Support: macOS tested; lanes wait for selected Windows tests; the full Windows suite runs on main, and red main blocks lands; Linux and Windows run in hosted CI, where the Windows suite leg blocks release and the Linux suite leg does not; Linux has no recorded machine install; on Windows the Claude Code hooks run from the checkout and need Claude Code 2.1.139 or later, the pack's PATH commands are shims that need the bin folder on PATH, and the review and builder launchers run through node from the checkout with an npm-installed pi.
Sibling repo to `~/nana-agent-loop`.

- `research/` — `research/pi-landscape-2026-09-01.md` predates pi 1.x; installed pi docs win. Raw deep-research sources
  live in the private records folder and git history; see `docs/reviews/README.md`.
- `packages/` — our pi packages, chiefly the nana extension pack: eight extensions (gate,
  lifecycle, adoption, objective, frontier summary, writing, roster notice, rulings), plus scaffold +
  dev-workflow skills. Installable via
  `pi install git:` or a local path — which ships `nana-pack` extensions and skills.
  Knowledge search remains an explicit CLI, with no pi extension.
- `templates/` — copier project templates behind the `scaffold-py`/`scaffold-ts` skills
  (greenfield) and `adopt-py`/`adopt-ts` (retrofit onto an existing project — adopt mode
  emits configs only, source tree untouched). Opinionated Python and TypeScript stacks,
  folder-by-feature, nested AGENTS.md, explicit project checks, and the three frontier seeds
  (`OBJECTIVE.md`, `HANDOFF.md`, `<project>/docs/sessions/`) from the one `templates/_shared` source
  every path shares. The copier src is the
  REPO ROOT (root `copier.yml`, `language` question) — canonically
  `https://github.com/j-wanger/nana-pi.git` — so copies are tag-versioned and re-sync
  via `uvx copier update`; tags are cut only by `npm run release -- [--ref <rev>] [--push]`, which runs the acceptance gate first. CI runs that release step after the suite and install-check jobs pass on main; the Linux suite leg is non-blocking, while the Windows suite leg and the Windows install check block release. Generated CI
  carries a `template-drift` job that goes red when the project is behind the latest tag.
Python templates offer a default-off `data_checks` answer. Opting in adds a standard-library
read-only checker, settings and a pytest entry point for eight data checks. Adoption preserves
existing pack files. Release acceptance runs default-off templates plus opted-in Python scaffold
and adoption projects through their native toolchains; the suite exercises this on macOS and
Windows too. Configure real inputs before treating a green data test as validation. A missing configured
store skips the optional data test and names the file; a present store's errors still fail.
Release eligibility compares the template-surface trees, not commit counts, so a change and
its full revert do not mint an empty template tag.

- `packages/nana-knowledge/` — explicit local BM25 (FTS5) search over this machine's
  markdown knowledge stores. Use `nana-knowledge query`; automatic delivery is retired
  in pi and Claude Code. Zero dependencies; read-only on every source. See
  `packages/nana-knowledge/README.md`.
- `packages/nana-setup/` — the one-command bootstrap for everything that is NOT a pi extension:
  the Claude Code half (hooks, rules, skills, `settings.json` wiring, the two-tier auto-memory), the
  user-scope pi config and `pi-review` on PATH. `nana-setup doctor` is the
  ✓/✗ instrument for a fresh machine. See `packages/nana-setup/README.md`.
- `scripts/glob-match.mjs` — the shared minimal glob matcher for artifact paths in report consumers.
- `apps/bench/` — builder and seat context anatomy. Retired study records and frozen fixtures
  live in the private records folder and git history; see `docs/reviews/README.md` and `apps/bench/README.md`.
- `docs/` — design docs; `docs/shippable-nana-pi-options-2026-09-02.md` records the September shippability plan.

## Claude Code seat waking (nana-pi only)

`packages/nana-setup/claude/hooks/nana-waking.mjs` is a project-scope Stop and
PreToolUse hook entry, requiring Node ≥ 22.18 and git; optional authenticated `gh`
reads open asks. The hooks are wired in
`.claude/settings.json`; they are not installed by nana-setup and do not
change other projects or user settings. Stop and PreToolUse
(matcher `Bash|AskUserQuestion`) run
`node "$CLAUDE_PROJECT_DIR/packages/nana-setup/claude/hooks/nana-waking.mjs"`.

The advisory hooks block an unarmed seat turn with open lanes, deny an away-owner
blocking question, and deny lane launches without their own background call or
with shell detachment. They never answer `ask`. Any `NANA_ROLE` makes them abstain;
errors fail open with exit 0 and no stdout. Stop abstains on a repeated stop.
Its writing check runs without `session_crons`; only the wake reminder needs that
probed field. A recurring wake must fire at least
every 30 minutes; a question gets a safe default after 15 minutes of owner silence.
A default does not authorize destructive or outside-folder actions.

`packages/nana-pack/lib/open-lanes.mjs` reads clone-shared build and land records:
extant unfinished lanes count even when contained in main; otherwise a lane needs
activity within 48 hours, a tip outside main and no landed record. Old lanes are
parked. `packages/nana-pack/lib/waking-config.mjs` holds the chosen policy values;
these are not sealed. Payloads missing other required data and unreadable
transcripts fail open. No model is needed. Open-ask checks may use network access
and gh authentication; a failed issue read drops only that check.

## Requirements-first

A project here keeps a standing, numbered contract — `REQUIREMENTS.md` — alongside its code, and
new behaviour starts there: a requirement diff (add, split or retire a row; IDs are never
renumbered), then tests carrying `req:` markers for IDs with three or four ASCII digits (four-digit IDs never start with zero), then the code. A trace check in the suite
fails when a status disagrees with the markers, so the ledger cannot quietly overclaim; a row is
written no wider than its test, and an independent reviewer checks every land. The same file carries the general engineering bar as rows
(`Part G`): tunables defined once in a declared config surface with their provenance and no inline
literals, a six-tag contract header on every module, named exports and injected resources, and a
generated code map whose `--check` is in the suite and whose `--impact` gives a change's blast
radius before you touch a module. Both templates ship the file, the rail and the map script, and nana-pi runs them on ITSELF:
`npm run map` writes an optional ignored local `docs/code-map.md`; `npm run map:check` validates
headers, layers, imports and launch reasons without reading any local map, `npm run map:impact -- <file...>` prints a change's blast radius, and
`npm run map:search -- "<need>"` suggests five non-test precedent modules with purpose and ranking reasons,
then one hop of their callees (tests included). This local, dependency-free search uses whole headers,
paths and ledger artifact lines, without network or model calls; it renders the current map in memory,
never reads a local copy, and adds to the planner's own list.
Nana-pi's wrapper adds exact anchored launch/path links under every mapped root to the written map,
`--check` and `--impact`; the template stays unchanged. Launch-only callers carry `[launch/path]`.
The map lists unresolved launch lines without basename guesses. Impact lists every test that holds
or reaches an unresolved or repo-code launch as always-run blind reach; it selects nothing itself.
Shell, pi and untraced programs require a reasoned `launchAlwaysRun` entry in `code-map.config.json`.
Temporary-copy anchors stay unresolved. Other graph readers and the impact artifact block retain
import-only links; the artifact block explains its `(no import path)` marks.
The search lives in `scripts/code-search.mjs`, with sealed trial settings in `scripts/code-search-config.mjs`;
`scripts/code-map-launch.mjs` adds the links using sealed vocabulary in `scripts/code-map-launch-config.mjs`.
Lane records (briefs, plans, build and review texts, CI excerpts and evidence) live outside
this checkout in `~/nana-records/<project>/<lane>/` (Windows `%USERPROFILE%\nana-records\<project>\<lane>\`);
`<project>` is the main checkout's folder name, the folder that holds the shared git directory, not the lane worktree's name. Old records stay in git history;
`docs/reviews/README.md` gives checked commands for the archive snapshots.

`npm run check:lane` runs the project-owned builder-stop rail in `scripts/check-lane.mjs`:
requirements trace, requirements-tree check, map check, README check, then templates-working
(including the start-file character budgets), test-packs,
code-map-launch, requirements-deliverables, requirements-cap-kinds, readme-check, known-bugs
and test-runner through the canonical test runner. Finally it runs only changed and name-matched
tests between the merge base with main and the working tree (`--changed-tests-from=main`), reporting the
selection count and wall time. This includes committed, staged and unstaged tracked edits plus
untracked non-ignored files, deduplicated. An empty selection passes; an unreadable diff fails with git's reason.
On a clean checkout the selection is unchanged; no fetch is needed.
It stops at the first failure and names it;
the ordered list comments identify the recorded lost rounds. This is not a full suite.
A repeat reuses the worktree-local git pass record only when working-tree content (including
untracked non-ignored files and tracked files matching ignore rules), main, its merge base with HEAD,
Node version and the check-list/script hash are unchanged.
The reuse line names the pass time and content key; committing unchanged content preserves it.
`npm run check:lane -- --fresh` forces all checks. Key errors run checks; failures, crashes,
interruptions and edits during a run record no pass.

`npm run readme:check` holds every README in `readme-check.config.json` to its claims. All
three are thin shims — `scripts/code-map.mjs`, `scripts/readme-check.mjs` and
`scripts/requirements-trace.mjs` — over the one copy of each tool that the templates ship, and
all three run inside `npm test` as well. After a passing local suite, each fallback land writes
the product report for that tip into the clone's shared git folder.
`npm run map:impact` prints static callers and callees, blind-reach tests, and the artifacts a named file writes and reads with their recorded readers. Generate an optional ignored local `docs/requirements-tree.md` with `npm run req:tree` using `scripts/requirements-tree.mjs`; `node scripts/requirements-tree.mjs --check` validates the ledger and renders the outline without reading a local copy; its `scripts/deliverables.mjs` check also prints report-only notes when a product deliverable's `Made by:` or `Read by:` claim is missing, unreadable or names a path not tracked at HEAD, and its count line leaves out a deliverable held by a `Parked:` line, then says how many it holds. `node scripts/known-bugs.mjs --root <dir>` checks `docs/known-bugs` entry names against active or frozen features, reports over-window file sizes without failing for them, and exits 1 on a name finding. Any other nana project checks its own tree with `node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root <dir>` — no outline, just its problems, or a `0 problems` line followed by any deliverable count and notes. A flat ledger with no tree yet lifts into it with `node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root <dir>`, a dry run that prints the plan and a proof line and writes nothing until `--write` is given on a ledger git tracks and that matches HEAD in every worktree; `scripts/requirements-lift-proof.mjs` holds the proof it calls, independent of the apply step.
The report commands share the bounded read-only Git runner in `scripts/git-runner.mjs`.
`scripts/requirements-regroup.mjs` checks a drafted and reviewed proposal (a lift mapping plus one `regroup` object) against the lift and the regroup rules and writes the owner's review page: `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root <dir> --proposal <file> --out <page>`.
`node scripts/identity-scan.mjs [--root <dir>]` scans tracked paths and content against digest counts; add a pinned allowlist entry by hand with its path, counts, reason and manifest-backed pin. With `--stdin`, it scans standard input instead, prints only each hit's word index and count, and exits 0 clean, 1 on a hit or 2 on bad use. It never echoes input text.
`nana-setup` installs the `requirements` skill that drives all of it (including an audit mode that
extracts rows from a project that has none yet) into both pi and Claude Code, plus a
`packages/nana-setup/claude/rules/nana-standards.md` rule carrying the same bar in prose. The pattern was proven in a work project
(2026-10-01/02) before it was promoted here.

## Dependencies

Nothing in this repo is published to npm and nothing here has a lockfile.
Dependencies vary by component; a globally installed pi is the common requirement for
the pi-hosted ones. nana supports pi 1.0.3 through 1.4.0. For pi 1.0.3 through 1.2.0, install with an npm `--before` cutoff from before the next pi release; doctor's `pi dependencies` row reports a mixed install. The CI-record reader shells out to `gh`, signed in; its tests use a fake on every system, while a real `gh` has run only on macOS. Per component:

| Component | Runtime | Dev / test |
|---|---|---|
| `packages/nana-pack/` (the extensions + skills) | pi itself, as an **optional peerDependency** (`@earendil-works/pi-coding-agent: "*"`) — the extensions run inside pi, so pi is the host, not a package they install. No runtime npm dependencies. | Zero-dep `node packages/nana-pack/tests/*.test.mjs`; pi-dependent tests FAIL naming the locations tried when pi is absent. Set `DESK_PI_ROOT` to point pack tests at another install. |
| `packages/nana-setup/` (the bootstrap) | Node ≥ 22.18 only (the installed objective hook's CLI imports `.ts` via Node's built-in type stripping; older Node → a named `OBJECTIVE UNAVAILABLE` marker and a doctor ✗); no npm dependencies. Shells out to `pi` (registration) and `node` (the knowledge build) — each optional, each reported as skipped when missing. | Zero-dep `node packages/nana-setup/tests/*.test.mjs`; every test installs into `os.tmpdir()` via `--home` and never touches the real `~/.claude`, `~/.pi`. |
| `packages/nana-knowledge/` (explicit knowledge search) | Node ≥ 22.18 only — `node:sqlite` (bundled SQLite, FTS5) and Node's TypeScript type stripping; no build step, npm dependencies, model calls or pi runtime required. Automatic knowledge delivery is retired in both runtimes. | Zero-dep `node packages/nana-knowledge/tests/*.test.mjs`; no fixtures outside `os.tmpdir()`. Details: `packages/nana-knowledge/README.md`. |
| `templates/` (copier scaffolds) | `uv` (which ships `uvx`, how copier runs) for both languages; `pnpm` for the TypeScript template. Generated projects carry their own pinned stacks. | — |
| `apps/bench/` (context anatomy) | Node ≥ 22.19 and git; authenticated Claude CLI on PATH for optional paid labelling. No npm dependencies of its own. Study runners are retired; records remain frozen. | Synthetic `test/*.test.mjs` fixtures use OS temp and make no model calls. Details: `apps/bench/README.md`. |

## Install — the whole experience ships from this repo

The experience has **two halves**, and both are installed from this repo:

1. **The pi runtime half** — extensions, skills and templates, installed with `pi install`
   (below). Nothing outside pi is touched.
2. **The Claude Code half + user-scope config** — the global hooks and rules, the
   `~/.claude/settings.json` wiring, the two-tier auto-memory, `~/.pi/agent/nana-pack.json` and
   the objective file and `pi-review` on PATH. That is
   `nana-setup`, and it needs the repo files on disk:

   ```bash
   node packages/nana-setup/bin/nana-setup.mjs install          # idempotent; re-run any time
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

<!-- The install check runs the commands after Run and then in a new temporary home, and checks for the text after expect. -->

1. Install Node ≥ 22.19 with a global npm prefix you can write without sudo (Homebrew, nvm/fnm, or a user prefix), and install git (`xcode-select --install` if it is missing).
2. Run `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.4.0 --before=2026-10-23T18:35:54Z`, then `pi --version`. Do not use pi's managed installer or `pi update`; see the setup README's “Update nana-pi” section.
3. Run `git clone https://github.com/j-wanger/nana-pi ~/nana-pi`; keep the clone.
4. Run `cd ~/nana-pi`, then `node packages/nana-setup/bin/nana-setup.mjs install`.
5. Run `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zprofile`, then open a new terminal.
6. Write your objective and current-priority lines over the placeholders in `~/.pi/agent/nana-objective.md`, or set `objective.path` in `~/.pi/agent/nana-pack.json` to an umbrella repo's `OBJECTIVE.md`.
7. Run `cd ~/nana-pi`, then `nana-setup trust ~/nana-pi` (it asks before it records), then `nana-setup doctor`; expect `all good`.

`uv` (both templates) and `pnpm` (TypeScript) are needed only to scaffold or adopt.

### Fresh machine (Windows), in order

<!-- The install check runs the commands after Run and then in a new temporary home, and checks for the text after expect. -->

1. Install Node ≥ 22.19 and Git for Windows, then open Command Prompt.
2. Run `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.4.0 --before=2026-10-23T18:35:54Z`, then `pi --version`. Do not use pi's managed installer or `pi update`; see the setup README's “Update nana-pi” section.
3. Run `git clone https://github.com/j-wanger/nana-pi "%USERPROFILE%\nana-pi"`; keep the clone.
4. Run `cd /d "%USERPROFILE%\nana-pi"`, then `node packages/nana-setup/bin/nana-setup.mjs install`.
5. Add `%USERPROFILE%\.local\bin` to the user Path in Environment Variables, then open a new Command Prompt.
6. Write your objective and current-priority lines over the placeholders in `%USERPROFILE%\.pi\agent\nana-objective.md`, or set `objective.path` in `%USERPROFILE%\.pi\agent\nana-pack.json` to an umbrella repo's `OBJECTIVE.md`; write paths with forward slashes because JSON reads a single backslash as an escape, and `~/` means your user folder, for example `{ "objective": { "projectFile": "OBJECTIVE.md", "path": "~/umbrella/OBJECTIVE.md" } }`.
7. Run `cd /d "%USERPROFILE%\nana-pi"`, then `nana-setup trust "%USERPROFILE%\nana-pi"` (it asks before it records), then `nana-setup doctor`; expect `all good`.

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

In the generated project, it seeds `OBJECTIVE.md`, `HANDOFF.md`, `<project>/docs/sessions/` (README + this month's file),
`AGENTS.md` + a one-line `CLAUDE.md` import and a `.pi/nana-pack.json` on-ramp, `git init`s when
needed, and refreshes the knowledge index. Nothing existing is ever overwritten;
`project --check` prints one ✓/✗ per file. Scaffolded and adopted projects get the same three
seeds from the same `templates/_shared` source (copier template, `adopt-structure` skill).

Prerequisites (standard tooling only, nothing nana-specific): follow the [macOS fresh-machine checklist](#fresh-machine-macos-in-order) or the [Windows fresh-machine checklist](#fresh-machine-windows-in-order); `uv` for BOTH templates — it is the Python
toolchain, and copier runs as `uvx copier` with `uvx` shipping inside uv, so the
TypeScript path needs uv as well (copier itself is nothing extra to install); plus
`pnpm` for the TypeScript template. On Windows use
Git for Windows — pi's bash tool runs through Git Bash (see pi's `docs/windows.md`;
the Windows checklist's Command Prompt commands are rehearsed, while other documented pack and project commands are written to run in PowerShell or cmd (untested there); no WSL needed). If pi errors
`No bash shell found`: install Git for Windows to its default location (pi probes
`%ProgramFiles%\Git\bin\bash.exe`, no PATH change needed), or for scoop/portable Git
set `{ "shellPath": "C:\\...\\bin\\bash.exe" }` in `~/.pi/agent/settings.json`. Don't
let it fall through to WSL's `System32\bash.exe` — commands would run inside Linux
with Linux paths.

### From git (pack-only use; no clone needed)

```bash
# 1. the nana-pack — all eight extensions + every skill (the root package.json
#    manifests packages/nana-pack, which is what makes the git: install work)
pi install git:github.com/j-wanger/nana-pi        # pack-only use; add -l for project-local

# 2. a project — or just ask pi, the scaffold-py/scaffold-ts/adopt-* skills drive this
uvx copier copy --data language=python https://github.com/j-wanger/nana-pi.git <dest>

# For nana-setup, install from a local clone instead (see below).
```

Copier renders the latest `v*` tag, never HEAD — tags are cut only by
`npm run release -- [--ref <rev>] [--push]`, which runs the gate first; CI runs it after the suite and install-check jobs pass on main; the Linux suite leg is non-blocking, while the Windows suite leg and the Windows install check block release. The first green hosted run cut v0.6.4 on 2026-10-08. A passing gate prints no summary line, and the non-blocking Linux suite leg still fails one symlink-escape check. `npm run template:accept -- [--src <repo>] [--ref <rev>]` runs the four rendered project checks. Pinned pack installs (`@ref`) need a ref that contains the root manifest —
tags v0.4.0 and earlier predate it, so pin a commit (or any later `v*` tag) instead.

### From a local clone

Anyone using nana-setup installs from a local clone; doctor reads ✗ when pi loads a `git:` copy beside that clone.

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

# the Claude Code half + user-scope config
node /path/to/nana-pi/packages/nana-setup/bin/nana-setup.mjs install
node /path/to/nana-pi/packages/nana-setup/bin/nana-setup.mjs doctor
```

### Template acceptance and release

Run the rendered projects' native checks with `npm run template:accept -- [--src <repo>] [--ref <rev>]`.

Cut a tag only with `npm run release -- [--ref <rev>] [--push]` (`scripts/template-release.mjs`). Release runs acceptance before creating a tag. CI runs release after the blocking macOS and Windows suite legs pass on main; the Linux suite leg is non-blocking.

### Updating and partial adoption

- **Pack and Claude Code half** — follow the canonical [updating runbook](packages/nana-setup/README.md#updating) for source updates, install and doctor. Targetless `pi update` updates pi itself; `pi update <source>` and `pi update --extensions` update packages only.
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

## Run the product report

The product report is a generated HTML ledger of capabilities, features, requirement rows, open asks, the ledger's open questions, and the git revision behind the report. The page opens on the Overview, with Needs you, Broken, Gaps, Stale and What it does blocks. An artifact counts as stale past 30 whole days, counted to HEAD's commit time. Closed questions under `## Closed questions` stay off the page. Its stage view orders capability kinds, shows product deliverables and constraint coverage with gaps, and puts retired capabilities last. Run `npm run report`; `scripts/product-report.mjs` writes the ignored page under docs/product-report/out. The command accepts `--root <dir>` and `--out <file>`, and runs on any nana project with the tree: `node "$HOME/nana-pi/scripts/product-report.mjs" --root .`. Each passing fallback land through the locked suite also writes the page for the landed tip into the nana folder of the clone's shared git directory and prints a land note naming it; the published copy changes only when a seat republishes that page. A deliverable whose named clone-store entry matches a sealed age-table binding shows the newest record that HEAD contains. Claude Code seats republish the report to the same link; pi seats open the generated file. The report refuses malformed ledger or ask input. Under each row, every test its evidence cites in this repository lists its own title and file, linked to that file's GitHub page when the origin remote is a GitHub repository. A row citing no test in this repository says so.

The Issues view lists violated requirement rows. The page shows no per-test run labels or run counts.

For a first-look comparison after build 1, run `npm run first-look -- --page product --out <dir>`. `scripts/first-look.mjs` builds the report at main and at the current checkout, then saves four screenshots and the report-view accessibility diff. Its sealed inputs live in `scripts/first-look-config.mjs`. The command uses Playwright when available through `PW_ROOT`, the script's module search path or the main checkout; otherwise it prints the Playwright install instruction and exits successfully. For a new page or a reference comparison, use `npm run first-look -- --page url --after <url> --reference <folder> --spec <file> --out <folder>`; it saves viewport and full-page shots, numbered reference copies, the spec, a manifest and a side-by-side HTML page. URL-mode output must be outside git. No real browser is launched by the suite; `packages/nana-pack/tests/first-look.test.mjs` uses a fake browser and report runner.

After first-look on a product-page lane, run `npm run outside-reader -- --from <first-look folder> --out <folder>` with output outside git. `scripts/outside-reader.mjs` reads the after page and capped diff, the objective producer and newest known bugs, then asks one cold pi model for at most three new weaknesses and checks their page quotes. Use `--url <url or file path>` instead for a page without a diff; `--provider`, `--model` and `--thinking` override the first pi roster entry among scout, land and builder. It needs the same optional Playwright browser as first-look, resolved by `scripts/playwright-resolve.mjs`, plus pi on PATH and its model login. Missing browser, model or purpose prints a note; a failed model attempt exits 1. It saves the prompt, page text and answer outside git, never issues or known bugs. For a referenced page, run `npm run visual-reader -- --from <first-look folder> --out <folder>` before showing the owner the shots. `scripts/visual-reader.mjs` sends the page frames, reference frames and art spec to the Claude Code reviewer in the nana roster, using a cold Claude Code launch; it saves prompt.md and, on success, reader.md outside git, then prints pass or fail and any unjudged spec lines. It requires Playwright for first-look, Claude Code on PATH with its login, and a Claude Code reviewer in the roster; a missing reviewer skips the judge. The tracked prompt is `packages/nana-pack/prompts/outside-reader.md`; sealed caps and the single 600-second attempt live in `scripts/outside-reader-config.mjs`. The visual prompt is `packages/nana-pack/prompts/visual-reader.md`; its launch values live in `scripts/visual-reader-config.mjs`. `scripts/reader-common.mjs` shares the readers' repository-boundary and numbered-item helpers. The suite uses fakes only.

## Tests

PR CI runs land plus affected module tests and every edited nonmanual test on macOS.
Lanes add release files individually for template inputs (`copier.yml`, `templates/**`, `scripts/template-*.mjs`),
changed tests, graph reach or name matches; setup-path changes never add the whole release pack.
The slow data-pack and templates-update tests follow those same rules.
Setup-tail alone keeps its previous lane triggers to preserve its Windows coverage; it never promotes sibling files.
Main runs land, main, module and retire on macOS, Windows and Linux; Linux stays advisory.
Superseded PR runs cancel; main runs never cancel. `npm run release` runs the release pack before acceptance.

CI covers event-selected test packs. Builders run touched tests, commit and report their branch, full tip and seat checks. Builders do not push. The seat pushes after verifying, then waits for the pushed tip's CI. A land uses passing same-platform full-suite records or complete land/module pack records unless the lane changes a workflow or the runner; otherwise it runs the local suite. CI lands refresh no land product report or local suite record. Hand commands and fallback lands refresh those artifacts.

On a shared machine, run a fallback full suite with `npm run test:locked` (implemented by `scripts/test-locked.mjs`); it serializes full runs across worktrees. Add a path substring after `--` for an unlocked filtered run, such as `npm run test:locked -- packages/nana-pack/tests/test-locked.test.mjs`. Two runs reclaiming the same dead holder's lock at the same instant may both proceed; this can share CPU but cannot lose suite data.

Each unfiltered locked run keeps a suite record in the suite-runs store beneath the clone's shared git directory. Its two closing record lines name the clean baseline, then repeat the PASS and FAIL counts and every failure with its class and cause. A land prefixes both lines so its success report retains them. Each CI suite leg uploads the same runner record.

`npm test` from the repo root (`scripts/test.mjs`) runs every `packages/*/tests/*.test.mjs`
one file at a time, each from its package dir with a fresh
temp `HOME`/`USERPROFILE`, prints one PASS/FAIL/SKIP line per file plus a total, and exits 1
if any file fails — also when no file matched the filter, or a `--self-test` fixture missed
its expected verdict; 130 on Ctrl-C (SIGINT) and 143 on SIGTERM, each after killing the
active test's process tree. It retries removing each finished file's temporary folder; if the folder stays busy, it prints one FAIL line naming the file, folder and error, counts one failure, and continues. `apps/bench/test/*.test.mjs` is in it (stubs, zero model calls).
`npm test -- <substring>` narrows the set; `--verbose` streams output; `--self-test` adds a
deliberately failing file to prove the runner turns red. On win32 the runner also SKIPs each
file on the declared Windows skip list
(`packages/nana-pack/lib/windows-skips-config.mjs`), printing that file's reason without
starting it.

`npm test -- --pack=land` runs the land pack. `--pack=land,module --changed-from=main`
adds affected module tests, every changed collected nonmanual test, and tests in any nonmanual pack
whose text names a changed path's basename, printing `names <path>` reasons.
Changed paths run from main's merge base to the working tree: committed, staged and unstaged tracked edits
plus untracked non-ignored files, deduplicated.
For changed files under any bin/ or scripts/ folder, name matching also includes the basename without
its last extension when that stem has at least 6 characters and matches as an escaped whole word
(`\b<stem>\b`) not followed directly by `/` or `\`, printing `names <stem> (<path>)` reasons.
Hub basenames README.md, REQUIREMENTS.md, AGENTS.md and HANDOFF.md are excluded from name matching.
Suite records list changed tests, name matches and lane release selections separately;
the runner prints each reason, and CI readers refuse proof missing any selected test. `scripts/test-packs.mjs`
uses import and launch reach, blind reach and text-input watches; uncertainty runs every module test.
`packages/nana-pack/lib/test-packs-config.mjs` declares membership and sealed selection policy.
Every collected file needs a pack. Browser tests stay manual. A complete-pack
`npm run test:locked -- --pack=land` holds the machine lock and keeps its record;
adding a path substring still bypasses the lock.

`npm test -- --jobs=N` keeps up to N collected files running at once (default 1), reporting
matching labels, counts, excerpts, warnings, failed list, self-test verdict, totals and exit
code as a serial run, apart from timings and the order file blocks print in; a file on the
declared run-alone list (`packages/nana-pack/lib/test-runner-config.mjs`) still runs alone,
after every other file's pool has drained. `npm run test:locked` with no filter passes
`--jobs=` with the declared suite job count from that same module; `NANA_SUITE_JOBS`
overrides it, and `NANA_SUITE_JOBS=1` restores today's serial run.

`node scripts/template-acceptance.mjs`
runs the separate rendered-template acceptance gate; `--src <repo>` and `--ref <rev>` select
its source and commit. It is intentionally not collected by `npm test`.
