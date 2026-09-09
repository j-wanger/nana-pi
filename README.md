# nana-pi

Adoption of the [pi coding agent](https://github.com/earendil-works/pi) as a primary
coding-agent platform (macOS + native Windows, Codex subscription + local models).
Sibling repo to `~/nana-agent-loop`.

- `research/` — grounded landscape knowledge. Start with `research/pi-landscape-2026-09-01.md`
  (adoption verdict + full capability map, adversarially verified). `research/raw/` holds the
  deep-research artifacts it was distilled from.
- `packages/` — our pi packages, chiefly the nana extension pack covering the four hook
  classes (pre-tool permission gating, post-edit format/lint/test triggers, session lifecycle,
  notifications/observability) plus scaffold + dev-workflow skills. Installable via
  `pi install git:` or a local path.
- `templates/` — copier project templates behind the `scaffold-py`/`scaffold-ts` skills
  (greenfield) and `adopt-py`/`adopt-ts` (retrofit onto an existing project — adopt mode
  emits configs only, source tree untouched). Opinionated Python and TypeScript stacks,
  folder-by-feature, nested AGENTS.md, post-edit quality gates. The copier src is the
  REPO ROOT (root `copier.yml`, `language` question) — canonically
  `https://github.com/j-wanger/nana-pi.git` — so copies are tag-versioned and re-sync
  via `uvx copier update`; template changes ship by commit + `v*` tag. Generated CI
  carries a `template-drift` job that goes red when the project is behind the latest tag.
- `apps/desk/` — nana code, a local browser dashboard over pi sessions: no npm dependencies
  of its own, but it requires the installed pi (spawned AND imported — see `apps/desk/README.md`).
- `apps/bench/` — a reusable benchmark for pi itself: run the same tasks through different
  tool/prompt profiles and record tokens, wall time, tool-call mix and deterministic
  correctness. Studies live in `apps/bench/studies/`; see `apps/bench/README.md`.
- `docs/` — design docs; `docs/shippable-nana-pi-options-2026-09-02.md` is the ratified
  shippability plan.

## Dependencies

Nothing in this repo is published to npm and nothing here has a lockfile.
Dependencies vary by component; a globally installed pi is the common requirement for
the pi-hosted ones. Per component:

| Component | Runtime | Dev / test |
|---|---|---|
| `apps/desk/` (nana code) | Node ≥ 22.19; **`@earendil-works/pi-coding-agent` ≥ 0.84.4 installed globally** — spawned as `pi --mode rpc` per live session AND imported in-process for session parsing (`parseSessionEntries`, `migrateSessionEntries`, `CURRENT_SESSION_VERSION`). Enforced at startup: below 0.84.4, or when the package cannot be tied to the `pi` the desk spawns, it refuses to start. No npm dependencies of its own. | Playwright 1.61.1 (`playwright`/`playwright-core`, root `node_modules`) for the `test/*.e2e.mjs` browser tests only; `PW_ROOT` points at it if it lives elsewhere. `test/*.test.mjs` are zero-dep `node <file>` runs. Details: `apps/desk/README.md`. |
| `packages/nana-pack/` (the extensions + skills) | pi itself, as an **optional peerDependency** (`@earendil-works/pi-coding-agent: "*"`) — the extensions run inside pi, so pi is the host, not a package they install. No runtime npm dependencies. | Zero-dep `node packages/nana-pack/tests/*.test.mjs`; the ones that load a real extension skip themselves when pi is not installed globally. |
| `packages/nana-stage/` (the stage ledger) | Same: pi as an optional peerDependency, no runtime npm dependencies. | Zero-dep node tests. |
| `templates/` (copier scaffolds) | `uv` (which ships `uvx`, how copier runs) for both languages; `pnpm` for the TypeScript template. Generated projects carry their own pinned stacks. | — |
| `apps/bench/` (the pi benchmark) | Node ≥ 22.19; **`@earendil-works/pi-coding-agent` ≥ 0.84.4 installed globally** — spawned as `pi --mode json` per measured run AND imported in-process for token/cost arithmetic (`calculateCost` + the `Usage` type from its bundled `@earendil-works/pi-ai` root export; `ModelRuntime` from the pi root, for offline model pricing). `pi-web-access` 0.28.0 under `apps/bench/.ext/` for profile C only — reviewed, content-pinned in `study.json`, not vendored, installed with `npm i --prefix apps/bench/.ext/pi-web-access pi-web-access@0.28.0`. No npm dependencies of its own. | No Playwright, nothing from npm: all ten `test/*.test.mjs` are zero-dep `node <file>` runs with no model calls. Details: `apps/bench/README.md`. |

## Install — the whole experience ships from this repo

Prerequisites (standard tooling only, nothing nana-specific): Node ≥ 22.19 and pi
(`npm i -g @earendil-works/pi-coding-agent`); `uv` for BOTH templates — it is the Python
toolchain, and copier runs as `uvx copier` with `uvx` shipping inside uv, so the
TypeScript path needs uv as well (copier itself is nothing extra to install); plus
`pnpm` for the TypeScript template. On Windows add
Git for Windows — pi's bash tool runs through Git Bash (see pi's `docs/windows.md`;
everything here works in PowerShell or cmd, no WSL needed). If pi errors
`No bash shell found`: install Git for Windows to its default location (pi probes
`%ProgramFiles%\Git\bin\bash.exe`, no PATH change needed), or for scoop/portable Git
set `{ "shellPath": "C:\\...\\bin\\bash.exe" }` in `~/.pi/agent/settings.json`. Don't
let it fall through to WSL's `System32\bash.exe` — commands would run inside Linux
with Linux paths.

### From git (no clone needed)

```bash
# 1. the nana-pack — all four extensions + every skill (the root package.json
#    manifests packages/nana-pack, which is what makes the git: install work)
pi install git:github.com/j-wanger/nana-pi        # add -l for project-local

# 2. a project — or just ask pi, the scaffold-py/scaffold-ts/adopt-* skills drive this
uvx copier copy --data language=python https://github.com/j-wanger/nana-pi.git <dest>

# 3. nana code (the desk) — no npm dependencies of its own (it uses the pi from
#    step 1, spawned and imported), but it needs the files, so clone
#    (two lines: `&&` breaks in Windows PowerShell 5.1)
git clone https://github.com/j-wanger/nana-pi
node nana-pi/apps/desk/server.mjs
```

Copier renders the latest `v*` tag, never HEAD — template changes ship by commit
+ tag. Pinned pack installs (`@ref`) need a ref that contains the root manifest —
tags v0.4.0 and earlier predate it, so pin a commit (or any later `v*` tag) instead.

### From a local clone

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
```

### Updating and partial adoption

- **Pack** — `pi update git:github.com/j-wanger/nana-pi` for this package alone,
  `pi update --extensions` for every installed package; a local-clone install
  just needs `git pull`.
- **Part of the pack** — install the whole pack, then `pi config` (TUI; Tab
  switches user/project scope) to switch individual extensions and skills on or
  off. There is no per-skill install; enable/disable is the partial surface.
- **Generated project** — `uvx copier update` inside the project (reads
  `.copier-answers.yml`): a three-way merge that replays your local edits onto
  the newest template tag. Partial-merge controls: `--conflict inline` (default,
  git-style markers in-file) or `--conflict rej` (clean files + `.rej` patches),
  `--skip-answered` to keep prior answers, `--pretend` for a dry run, `--vcs-ref`
  to pin a specific tag. `copier recopy` is the escape hatch — re-render clean,
  discarding your diff. Generated CI carries a `template-drift` job that goes
  red when the project is behind the latest template tag.
- **Existing project, configs only** — adopt mode: the `adopt-py`/`adopt-ts`
  skills (or `--data adopt=true` on the copier command) overlay the pinned
  configs and leave the source tree untouched; reconcile from `git diff`, then
  commit including `.copier-answers.yml`. An adopted project re-syncs with
  `copier update` like any other copy.
- **Existing project, structure only** — the `adopt-structure` skill adds the
  AGENTS.md navigation layer (a coherent root + per-folder AGENTS.md) and a
  starter `.pi/nana-pack.json`, without touching the language toolchain. No
  `.copier-answers.yml`, so no `copier update` relationship; layer `adopt-py`/
  `adopt-ts` on top later for the pinned stack.

Canonical upstream coordinates: repo `earendil-works/pi`, npm `@earendil-works/pi-coding-agent`
(the `@mariozechner/*` scope is deprecated). Latest at repo creation: 0.84.4, Node ≥22.19.
