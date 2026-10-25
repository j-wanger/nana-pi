# nana-setup

One command that installs nana setup surfaces outside pi.

`pi install` brings the pi extensions, skills and templates. Everything else used to be
hand-maintained dotfiles on one Mac: the Claude Code hooks and rules, the settings wiring, the
two-tier auto-memory, the user-scope pi config, and the PATH entries for `pi-review`, `pi-worker`, `nana-land`, `nana-setup` and `nana-writing`, and the desk
service. `nana-setup` installs the supported surfaces from the repo, and `nana-setup doctor` reports their state. A bare `uvx copier copy` route keeps its seeded DRAFT objective lines; only the skills ask the owner to ratify both lines.

```bash
node packages/nana-setup/bin/nana-setup.mjs install      # install / repair everything
node packages/nana-setup/bin/nana-setup.mjs doctor       # one ✓ or ✗ per piece; exits 1 on any ✗ or !
node packages/nana-setup/bin/nana-setup.mjs install --desk   # + the desk launchd service (macOS)
node packages/nana-setup/bin/nana-setup.mjs project ~/my-thing   # make a folder a nana project
node packages/nana-setup/bin/nana-setup.mjs uninstall --dry-run  # preview safe removal
node packages/nana-setup/bin/nana-setup.mjs trust ~/my-thing --yes # record pi project trust after confirmation
```

Runtime dependencies: **Node ≥ 22.18** and the globally installed `@earendil-works/pi-coding-agent` package (used for pi's exported project-trust API). The floor is set by the installed
`claude/hooks/nana-objective.mjs` hook, which runs `packages/nana-pack/bin/nana-objective.mjs` and
then the bounded `packages/nana-pack/bin/nana-frontier-summary.mjs` producer under their shared
output budget; the objective CLI imports `../nana-pack/lib/objective.ts` with no flag, relying on Node's built-in TypeScript stripping (default from
22.18). On an older Node the hook prints `OBJECTIVE UNAVAILABLE: Node <v> is older than 22.18 …`
instead of the objective, and `doctor`'s
`node for the objective hook` line reads ✗. `install` calls out to `pi` (only to register
the packages, and only when they are not registered yet). On Windows it finds the first supported
`pi.com`, `.exe`, `.bat` or `.cmd` on PATH, respecting PATH-folder and PATHEXT order. An npm
`pi.cmd` starts its package's Node entry; any other `.cmd` or `.bat` runs through ComSpec. A missing pi is skipped with the install hint. A found pi whose version
probe fails is a problem and makes install exit 1. On macOS/Linux, a `pi` whose interpreter is missing
still reports “not on PATH” because the OS gives the same error. On POSIX the existing PATH lookup remains.
Install also calls `node` (to build the knowledge index) and `launchctl` (only with `--desk`, only on
macOS, only against the real home).

A session-start producer still running at the launcher's 2,500 ms cap is stopped, and its unavailable line prints instead. A hook's producers end by 4,000 ms on the hook's own process clock, leaving 1,000 ms for process start and exit within Claude Code's 5 s limit. A producer in a wait no signal ends, such as a hung network mount, is not stopped, and Claude Code's limit then drops the hook's output.

## What it installs

| Piece | Where | How |
|---|---|---|
| `claude/hooks/nana-objective.mjs`, `claude/hooks/nana-adoption.mjs`, `claude/hooks/nana-shared-memory.mjs`, `claude/hooks/nana-roster-notice.mjs`, `claude/hooks/verifier-pipe.mjs` | `~/.claude/hooks/` | **symlink** into `claude/hooks/` on POSIX — a `git pull` updates them |
| `claude/rules/nana-soul.md` (the identity) | `~/.claude/rules/` | **symlink** into `claude/rules/` |
| `claude/rules/nana-standards.md` (the coding standards) | `~/.claude/rules/` | **symlink** into `claude/rules/` — requirement-first, no inline tunables, one purpose per module with the six-tag header, the code map kept current, status honesty. Generic, language-agnostic; it does not repeat `claude/rules/nana-soul.md` |
| `claude/rules/nana-seat.md` (running builders and reviewers) | `~/.claude/rules/` | **symlink** into `claude/rules/` — the seat guide: background launches, no reading or judging partial work mid-run, verify once at the end |
| `packages/nana-pack/rules/nana-writing.md` (the writing rule, adopted 2026-10-21) | `~/.claude/rules/nana-writing.md` | **symlink** — sourced from `packages/nana-pack/rules/`, not this package's own `claude/rules/`, because the `nana-writing` pack extension reads the SAME file for pi (one source, two runtimes — design-ruling.md Amendment 1, 2026-10-04, §A1) |
| `packages/nana-pack/rules/nana-rulings.md` (nana's standing rulings, rulings-file lane, 2026-10-19) | `~/.claude/rules/nana-rulings.md` | **symlink** — sourced from `packages/nana-pack/rules/`, the same file the pi half reads a COPY of (below), named no owner and no model |
| `packages/nana-pack/rules/nana-rulings.md` | the pi agent dir (`nana-rulings.md`) | **symlink** on POSIX, **byte-equal copy** on win32 — unlike `nana-writing`, the `nana-rulings` pack extension reads THIS installed copy, never the pack file directly (the owner's install ruling: "install to user level .pi folder"); doctor's `pi nana-rulings.md` row reads ✗ for anything else, including a stale win32 copy |
| Windows managed-copy record | `~/.claude/nana-setup-copies.json` (**Windows only**) | Records the hash of each rule, skill and pi rulings copy install last wrote. An unchanged managed copy refreshes without a dated backup; an owner-edited or unrecorded copy still gets one first. An unusable record fails safe to backups and a skipped row. |
| `requirements`, `spec`, `py-lint`, `py-review`, `py-test` skills | matching `~/.claude/skills/<name>` | **symlinks** to the same runtime-neutral `packages/nana-pack/skills/<name>` directories pi reads on POSIX; **byte-equal managed copies** on Windows. Recognized stale nana-dev-kit copies are moved to dated backups outside the active skills root before linking or copying; unknown or edited directories are left untouched and doctor reads ✗. The `scaffold-*` and `adopt-*` skills remain pi-only because they assume pi |
| retired nana-dev-kit and broken Codex imports | `~/.claude/backups/` or `~/.agents/backups/` | recognized artifacts move to `<YYYY-MM-DD>-retired/` only after lstat and provenance checks; unknown content stays in place. A link at `spec`, `py-lint`, `py-review` or `py-test` is reported by its skill row, not as retired. `~/.agents/skills/synced/` is excluded. Existing repository context-warning markers are not scanned; install prints a reminder to remove them manually. Under a linked Claude home, install reports only the retired artifacts that are there and leaves them in place — an absent retired path prints no row |
| `~/.claude/rules/nana-personal.md` (private) | `~/.claude/rules/` | **copied from `claude/rules/nana-personal.example.md`, only when absent**, then never touched. It must be a REGULAR file: a symlink there aims your private text at some other file — plausibly one inside this repo, which is how a private rule gets committed — so install prints `✗ private rule is a symlink — replace with a regular file`, the summary refuses to say "everything was already in place", and doctor reads ✗ (lstat, not existsSync) |
| SessionStart + UserPromptSubmit + PreToolUse hooks | `~/.claude/settings.json` | missing active entries are added without reordering foreign entries; exact managed legacy SessionStart bash entries are migrated in place. Retired script invocations outside those exact entries are preserved and doctor reports them as problems. Install removes only the exact managed tilde form and released quoted absolute-path form for the retired context-size hook; variants are preserved. On POSIX, the knowledge hook is migrated in place only when its timeout and status metadata match and its command is exactly the installer form `NODE_NO_WARNINGS=1 node '<absolute checkout>/packages/nana-knowledge/bin/nana-knowledge.ts' hook`, allowing only the checkout path to differ. Customized commands—including environment prefixes, interpreters, or arguments—are preserved as complete entries. The Node PreToolUse hook (matcher `Bash` on macOS and Linux, `Bash\|PowerShell` on Windows) asks only when a masked pipeline's exit status can reach the commit without active `pipefail`; a `;` or a newline that discards it does not prompt, and `git.exe` and path spellings count as git; a non-match or hook error abstains with empty stdout, and errors write a diagnostic to stderr. Claude Code documents the no-decision behavior: “If no decision is returned, Claude Code continues with its normal permission flow” ([PreToolUse decision control](https://code.claude.com/docs/en/hooks#pretooluse-decision-control)). On native Windows (Claude Code ≥ 2.1.139), setup wires every hook entry in exec form instead — `"command": "node"` plus an `args` array Claude Code spawns directly with no shell — naming the checkout's own scripts under `packages/nana-setup/claude/hooks/` and `packages/nana-knowledge/bin/` with no path quoted, escaped or refused; an installer-shaped entry whose script no longer resolves inside the checkout, in either form, is replaced in place the next time install runs — a hand-written entry naming a different, customized target is left untouched. Windows also repairs the POSIX installer's five shell-form hook entries and its first unquoted knowledge entry to exec form in place, and moves its verifier from `Bash` to `Bash\|PowerShell` without duplicating one already there.
| shared auto-memory | `~/.claude/nana-memory/shared/MEMORY.md` | created when absent |
| per-project `shared` symlink | `~/.claude/projects/<key>/memory/shared` | **no installer step** — the SessionStart hook creates it, per project, per session |
| `nana-pack.json` | the pi agent dir (`PI_CODING_AGENT_DIR`, else `~/.pi/agent/`) | seeded **only when absent** |
| `nana-objective.md` | the pi agent dir | seeded only when `nana-pack.json` was seeded by this run, or its `objective.path` resolves to this file — pointing the objective at a real repo's `OBJECTIVE.md` means no starter file is created; an empty or non-string `objective.path` resolves to this file too, and doctor reads ✗ naming the value when it is present and neither a string nor null |
| `extensions/subagent/config.json` (pi-subagents' own config — a third-party vendor extension nana-pi only consumes) | the pi agent dir | seeded **only when absent**, exactly `{"asyncByDefault":true,"forceTopLevelAsync":true,"maxSubagentDepth":1}` — `forceTopLevelAsync` is the key that forces an ORDINARY, model-driven top-level `subagent` tool launch into the background (the gated runner process) regardless of what the model asks for (see `packages/nana-pack/README.md` Behavior notes for the exceptions it does not reach); `maxSubagentDepth` caps nested fan-out at one level. `doctor` reads ✗ naming the key and its required value when either is wrong, or when the file is missing or invalid — and never rewrites a file you already have |
| `agents/reviewer.md` (shadows pi-subagents' builtin `reviewer` agent by name) | the pi agent dir | seeded **only when absent** — the upstream reviewer persona verbatim, with `bash` added to its tools and three rule changes: it gathers its own `git`/test evidence instead of asking the parent for it, and reports a gap under "Could not verify" rather than blocking on a supervisor reply. `doctor` reads ✗ when the file is absent or its body's first line is not the nana marker comment |
| knowledge index | `~/.pi/agent/nana-knowledge/index.db` (under `--pi-home` / `--home` when given) — **not** under an ambient `PI_CODING_AGENT_DIR` | built when absent (`nana-knowledge build` refreshes it); doctor opens read-only and counts rows from the expected `docs` table, so a corrupt or wrong-schema database reads ✗. The knowledge runtime reads `NANA_KNOWLEDGE_HOME` or `~/.pi/agent/nana-knowledge` and never `PI_CODING_AGENT_DIR`, so following that variable here built an index nothing read; moving knowledge storage needs a deliberate cross-runtime contract, which this installer does not make on its own |
| `pi-review` | `~/.local/bin/pi-review` | POSIX symlink to `packages/nana-pack/bin/pi-review.mjs`; Windows extensionless sh and `.cmd` shims. Doctor checks both Windows files and whether the first `pi-review` on PATH is this checkout's `.cmd` shim. |
| `pi-worker` | `~/.local/bin/pi-worker` | POSIX symlink to `packages/nana-pack/bin/pi-worker.mjs`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| `nana-land` | `~/.local/bin/nana-land` | POSIX symlink to `packages/nana-pack/bin/nana-land.mjs`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| `nana-setup` | `~/.local/bin/nana-setup` | POSIX symlink to `packages/nana-setup/bin/nana-setup.mjs`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| `nana-writing` | `~/.local/bin/nana-writing` | POSIX symlink to the executable `packages/nana-pack/bin/nana-writing.mjs`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| desk service | `~/Library/LaunchAgents/com.nana.pi-desk.plist` | opt-in `--desk`; rendered from `launchd/*.tmpl`, then loaded with `launchctl bootstrap gui/$UID` and started with plain `kickstart` on first load. After bootout it waits for launchd to report the job absent before bootstrap; an error-5 bootstrap gets one retry after the same wait. Every explicit `--desk` repair restarts an existing service with `kickstart -k`; bootstrap or kickstart failure exits 1. The plist uses a curated PATH (the node binary directory, `~/.local/bin`, Homebrew, `/usr/local/bin`, `/usr/bin`, `/bin`), not the installing shell's PATH. launchd does not inherit your shell's environment, so when the chosen pi agent dir is not `~/.pi/agent` the plist exports it as `PI_CODING_AGENT_DIR` (absolute). Doctor requires `launchctl print` state `running` and the plist's `ProgramArguments[0]` to exist and run Node ≥22.19. macOS only — there is no service definition on other platforms |
| pi packages | `settings.json` in the pi agent dir | Registration is complete only when every extension directory in the root `package.json` manifest is loaded. A root entry covers both manifests; per-package entries cover their own manifest. Install adds only missing per-package entries, never a root entry atop existing package entries. `install --dry-run` reports decisions made before the first `pi install`, otherwise reports what it would add, and starts no `pi install`. Paths use pi's matching rules (`~`, settings-relative paths, real paths and linked-worktree identity); exact remote entries are also recognized. On Windows, setup and doctor use the first supported external pi on PATH, not PowerShell aliases/functions or a working-directory command; `.cmd`/`.bat` paths or arguments containing `%`, `!`, a quote, line break or NUL, or an argument ending in backslash are refused for manual registration. Doctor reports the version under the same launch rules. Doctor's separate `pi package source` row reports whether the registered source is the checkout supplying hooks and rules. |

**Verifier-pipe guard (user-scope):** every session will prompt before running a Claude Code Bash or PowerShell command when a masked pipeline's exit status can reach the commit without earlier active `pipefail`. Earlier live Bash text also makes that pipeline prompt when it contains `errexit` anywhere, in any case and even inside a longer word, or contains a `set` word at any position followed within the same simple command—before the next `;`, `&`, `|`, newline or closing bracket—by an option word made of `-` and letters including `e`. A later `set +e` or `set +o errexit` never turns that text flag off, and `+o errexit` itself counts as enabling, even before a status-discarding `;` or newline. Without that earlier Bash errexit text, a `;` or a newline that discards the status does not prompt, and `git.exe` and path spellings count as git; on native Windows the guard covers PowerShell too, through the pipe guard's own PowerShell dialect (string, here-string and comment rules). This is an additive best-effort text check: a pipeline or commit not present in the literal command text and reached through a later call is not matched; the sandbox is the boundary. Claude Code documents the response shape as `hookSpecificOutput` with `hookEventName: "PreToolUse"`, `permissionDecision: "ask"`, and `permissionDecisionReason` ([PreToolUse hook output](https://docs.anthropic.com/en/docs/claude-code/hooks#pretooluse-decision-control)). Non-matches and hook errors abstain (empty stdout), so Claude Code's normal permission flow continues; errors write a diagnostic to stderr.

## Updating and removing

### Update nana-pi

1. Finish or pause desk sessions, then run `launchctl bootout gui/$(id -u)/com.nana.pi-desk` if the service is installed.
2. Update the source with `git -C <clone> pull --ff-only`. On the machine whose main branch is the live install, landing the change is the update. Quiesce before `nana-land` only when `git diff --name-only main...feat/<lane> -- apps/desk packages/nana-stage packages/nana-pack/lib/agent-dir.mjs` is non-empty.
3. Run `node packages/nana-setup/bin/nana-setup.mjs install --desk` (drop `--desk` when there is no desk service).
4. Run `node packages/nana-setup/bin/nana-setup.mjs doctor`.

Session starts report unhealthy installed hook links, hook settings, rules, skills and pi rulings with this checkout's install command. In an adopted project, the stale-copy producer also names every failing objective, frontier, session-log or navigation file row that `project --check` decides from files alone. It names this checkout's `node packages/nana-setup/bin/nana-setup.mjs project` command for rows the command repairs and its `--check` form for rows the owner fixes by hand. When install refuses a skill path, the line first names that existing path to move aside; when a linked Claude home or skills folder causes the refusal, it names that linked folder instead. Doctor's ✗ skill rows name the same linked folder, and its final line lists them as a fix by hand when install's dry run completes. Under a linked Claude home or skills folder, doctor's legacy enforcement-flag and scaffolder rows name the linked folder and every present path to move out of the way by hand, because install will not back these up through that folder. Install refuses before any write when the Claude folder, its rules or shared-memory folder, the shared-memory folder's parent, or off Windows its hooks folder is a link whose target cannot be reached. The refusal names the link to move aside, and doctor's final line names that refusal.

Upgrade pi itself with `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.4.0 --before=2026-10-23T18:35:54Z`. To stay at the supported floor, use `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.3 --before=2026-10-05T08:40:00Z`. Pi 1.0.3 through 1.2.0 needs a cutoff from before the next pi release; doctor's `pi dependencies` row reports scoped dependencies installed newer than pi. Both commands are tested in the root CI workflow. Never run targetless `pi update`, `pi update --all` or `pi update --self`; `pi update <source>` and `pi update --extensions` update packages only.

### Remove nana setup

1. Boot out the desk service if installed: `launchctl bootout gui/$(id -u)/com.nana.pi-desk`.
2. Preview with `node packages/nana-setup/bin/nana-setup.mjs uninstall --dry-run`.
3. Remove confirmed nana-owned pieces with `node packages/nana-setup/bin/nana-setup.mjs uninstall --yes`.
4. Run `pi list` and `node packages/nana-setup/bin/nana-setup.mjs doctor`; use the doctor's `pi packages` and `pi package source` rows to identify nana-pi entries, then remove those entries with `pi remove`.

Edited seeds, memories, per-project `shared` links, pi trust records, backups, logs, knowledge sources and project files stay. Hand-written hook variants stay. No update command — the runbook is the sequence; build one only after a recorded miss.

## State and restore

State classes:

- **durable** — private working state to archive and restore.
- **rebuildable** — links, generated indexes and configuration recreated by setup or their owner.
- **re-ratified** — trust decisions that must be recorded again for each repository.
- **disposable** — locks, caches, logs and temporary working state; do not archive.
- **secret** — credentials, sessions, transcripts and key material; carry by hand or sign in again.

`nana-setup state` lists each store's class, owner, resolved path and presence. `state --paths` lists regular files under present durable stores only; symlinks are skipped. The inventory is the archive boundary.

| Store | Class | How it comes back |
|---|---|---|
| Private rule, shared memory, project memories | durable | Restore from the private archive; the SessionStart hook recreates project `shared` links. |
| Review-ledger tally, audit and rotated files, and kept review texts | durable | Restore from the private archive. |
| nana-pack config, objective, pi settings, knowledge sources and pull log, apps and nana share | durable | Restore from the private archive. |
| Hook, rule, skill and bin launchers; subagent config and reviewer seed | rebuildable | Run `nana-setup install`. |
| Knowledge index, pi-subagents package and desk plist | rebuildable | Build knowledge, install pi-subagents from the network, and use `install --desk` when needed. |
| Project trust | re-ratified | Run `nana-setup trust <dir>` for every repository. |
| Ledger locks and reservations, suite lock, knowledge shown/build lock, desk log, MCP cache, handoffs and nana journal | disposable | Recreated as needed; not archived. |
| Login credentials, MCP/model config, sessions, Claude transcripts, bench agent and desk stage keys | secret | Sign in again or carry by hand; not archived. |

Back up the listed files as one archive:

```sh
node packages/nana-setup/bin/nana-setup.mjs state --paths > ~/nana-state.list && tar -czf ~/nana-state.tgz -C ~ -T ~/nana-state.list
```

Restore in order:

1. Install Node and pi; clone nana-pi, nana-agent-loop and the product repositories at the SAME absolute paths.
2. Run `nana-setup state`; every durable row must be absent. Otherwise stop: this is not a clean home.
3. Extract the archive: `tar -xzkf ~/nana-state.tgz -C ~`.
4. Run `nana-setup install`.
5. Sign in again to pi (`/login`) and Claude Code.
6. Run `nana-setup trust <dir>` for each repository.
7. Run `pi install npm:pi-subagents@0.75.0`.
8. Run `install --desk` if the desk is used.
9. Run `doctor`.

The restore needs the same home path and repository paths: memory keys, nana-pack config, knowledge sources and ledger repository identity use absolute paths. A different username needs hand edits; no re-keying is built. The archive is unencrypted private data. Secret stores are carried by hand or recreated by signing in. macOS `tar -k` keeps existing files; GNU tar errors instead, so the target must be clean. This procedure is macOS-tested only.

This inventory does not configure a backup destination. Several repositories have no remote, and unpushed commits in other repositories are outside this archive.

## The nana-owned reviewer agent — why `agents/reviewer.md` shadows the builtin

`agents/reviewer.md` doesn't add a new agent — it REPLACES pi-subagents' builtin `reviewer` for
anyone using this pack, because pi loads a user-scope agent file of the same name instead of the
builtin (`docs/agents.md`'s own documented precedence: builtin → package → user → project). The
seed is the upstream reviewer persona and output format verbatim, with one tools change (`bash`
added) and three rule changes (architecture-ruling.md, 2026-10-04): the review role gathers its
own `git`/test evidence with that `bash` tool instead of asking the parent for it, and reports a
gap under "Could not verify" rather than blocking on a supervisor reply.

`bash` here is instructed-read-only, not sandboxed enforcement: this agent runs as a LEAF — the
subagent config seed above caps `maxSubagentDepth` at 1 — inside pi-subagents' detached background
runner process, where nana-gate (`packages/nana-pack`'s own `tool_call` hook) loads as an ambient
extension and inspects every command and edit target before it runs, the same as any other
background subagent. nana-gate is advisory by doctrine — a load-path convenience, not a security
boundary; real enforcement is the sandbox or container boundary, exactly as everywhere else in this
repo. That guarantee covers the ordinary case only — see `packages/nana-pack/README.md` Behavior
notes for the two documented cases where a child does NOT load nana-gate even under this seeded
config.

- Registration: `registrationState` recognises string `packages` entries only. An object-form entry (pi's resource filter) reads as unregistered, doctor reads ✗, and install would run `pi install` again.

## pi-subagents' version, and mcp.json — read-only checks

Limits recorded at landing (2026-10-04):

- pi-mcp-adapter was removed from this machine on 2026-10-05. While it was installed, pi did not read mcp.json directly (pi 1.0.2 docs, mcp.md), and doctor never detected the adapter, so its `!` stayed moot the whole time it was present.
- doctor's `pi reviewer agent` line reads any read error as missing and suggests install. Install's own row then names what is there, such as a directory or an unreadable file.
- An unmarked reviewer.md reads ✗ because it is not nana's seed, not because it is broken. A reviewer you wrote reads ✗ by design. Adding the marker by hand turns it ✓ without the bash and evidence rules.

`doctor` also reads three things `install` never writes, because they belong to pieces outside its
own job: pi's installed scoped dependencies, a third-party npm package, and pi's own MCP config.

- **`pi dependencies` after `pi executable`** — follows the `pi` on PATH to its package and reads only that package's scoped `dependencies`. It reads ✓ when every installed version is at or below pi's own version, ✗ with the shared pi install hint when any is newer, and · when the package or an exact three-part version cannot be read. The `pi packages` row remains nana-pi registration.
- **`pi pi-subagents`** — the installed `pi-subagents` package (`<agent dir>/npm/node_modules/
  pi-subagents/package.json`) must be at least `0.75.0`; this pack's subagent config seed above and
  its nana-gate analysis were verified only against that version (0.75.0's own CHANGELOG: background
  subagents were broken on 0.74.0 and fixed again there). `install` never runs `pi install` or
  `npm` on your behalf for this — that is a network fetch of third-party install code, a new class
  of effect this installer does not take on. When the version is missing or too old, `doctor` reads
  ✗ naming the exact fix: `pi install npm:pi-subagents@0.75.0`.
- **`pi mcp.json`** — WHERE `~/.pi/agent/mcp.json` (or your chosen pi agent dir's copy) exists,
  `doctor` reads `!` when any configured server has no `exposure` key while `autoEnableCodemode` is
  not `false`: that server's tools default to pi's `codemode` exposure the moment it connects, and
  `nana-setup` never edits this file for you. Give the server an explicit `exposure`, or set
  `"autoEnableCodemode": false` beside `mcpServers`, to clear it. Absent entirely, this line is
  skipped — not everyone configures an MCP server.

## `project` — a blank folder becomes a nana project

`install` sets up the MACHINE. It does not give a folder the three files the per-project
mechanisms read: `OBJECTIVE.md` (what session start prints, and what the close scores the
session against), `HANDOFF.md` (the frontier) and `docs/sessions/` (the narrative). Neither did
anything else outside pi — the scaffold and adopt skills only exist inside pi, so a folder used
from Claude Code had no path to them at all. That gap is what `project` closes:

```bash
node packages/nana-setup/bin/nana-setup.mjs project [dir] [--name <n>] [--dry-run]
node packages/nana-setup/bin/nana-setup.mjs project [dir] --check    # accepts any existing month log
node packages/nana-setup/bin/nana-setup.mjs project <dir> --not-a-project   # dismiss a repo root once
node packages/nana-setup/bin/nana-setup.mjs trust <dir> [--yes]             # record pi's trust decision
```

`--not-a-project` writes `.nana-not-a-project` (one line: what it means and the date) at a git
repository root and nothing else — commit it, so every clone inherits the decision; the seat's
`[nana:adoption]` block stops naming that repo. Anywhere but a repository root it refuses with the
reason. `project` on a folder holding the marker **refuses** (exit 2), naming the marker: delete it
to adopt. A recorded decision is never silently overwritten.

`dir` defaults to the current directory, the name to its basename. Seed steps are idempotent and never overwrite existing files. The exception is the explicitly marked working section in a regular `AGENTS.md`: `project` refreshes only the bytes between exactly one ordered pair of `<!-- nana:working-under-nana-pi begin -->` / `<!-- nana:working-under-nana-pi end -->` markers. It never guesses the bounds of an unmarked copy. Add the two markers around that section once; malformed pairs and symlinked `AGENTS.md` files are reported and left alone. `--dry-run` reports the refresh without writing. A second run with a current section reports `unchanged`. At session start, an adopted repository gets one project-stale line for any failing file rows, in the check's order, with project-fixable and by-hand remedies kept distinct.

| Step | What | When it is skipped |
|---|---|---|
| `git init` | only when the folder is not already a repo | a folder INSIDE another repo is left alone — a nested repo hides every file from the outer one |
| `OBJECTIVE.md`, `HANDOFF.md`, `docs/sessions/README.md` | copied from `templates/_shared/`, with `<date>` filled with today and `<name>` with the project name | any one of them that already exists |
| `docs/sessions/<YYYY-MM>.md` | this month's log, header only | it already exists |
| `AGENTS.md` + a one-line `CLAUDE.md` import (`@AGENTS.md`, every platform) | a lean stub — name, empty `Layout` and `Rules that don't move`, then the canonical `Working under nana-pi` section inside the exact nana markers | a new stub is created only when neither navigation file exists; an existing regular `AGENTS.md` has only its valid marked region refreshed. Unmarked, malformed, or symlinked files are left alone and reported |
| `.pi/nana-pack.json` | `{"postEdit":{"commands":[]}}` — an empty on-ramp, so nothing runs until you fill it in | when it exists, **and** when you have user-scope `postEdit.commands`: project config replaces user config per key group, so an empty project block would shadow your global checks in this repo |
| `nana-knowledge build` | refreshes the index so the new repo's docs are findable at prompt time | when there is no index yet — run `install` first; when another build **holds the lock** (that CLI exits 0 on a held lock so the prompt hook never fails, so the lock message on stderr is the only evidence — reported `skipped (build lock held)`, never "rebuilt"); and on the **60 s deadline** |

The three seeds have ONE source, `templates/_shared/`, and three consumers: this command, the
copier templates (both languages `include` them, and `_skip_if_exists` keeps adopt mode from
overwriting a real one) and the `adopt-structure` skill. So a scaffolded, an adopted and a
hand-made project read identically. `<date>` is left literal in the rendered template on
purpose — copier has no date variable — and is filled by this command or by the skill. Project
names land literally, including `<date>`, `<name>`, replacement tokens, backticks and shell-looking
text; placeholder-looking text inside a name is not filled again.

**Trust is yours to decide, too.** The seeded `.pi/nana-pack.json` is ignored until you decide this folder's trust. Run
`nana-setup trust <dir>` and confirm interactively, or pass `--yes` in a script. The command
records through pi's own `ProjectTrustStore` and prints the store path. `pi -a` / `--approve`
(and the desk's trust box, which sends `-a`) trusts one run only; it is not a recorded decision.
Trust loads pi's store from the pi package in npm's global folder (`npm root -g`). When it is
missing there or has no `ProjectTrustStore`, trust exits 2 with one line naming the path it
tried and the pi install command. A pi installed by another package manager is not found there.

`project` and every scaffold and adopt completion message name the first two steps: ratify the
seeded `OBJECTIVE.md`, then run `nana-setup trust <dir>`. Scaffold and adopt messages also say
to fill the date; project setup already fills it. What the tool will not do is decide your objective.

**Present means present, not readable.** Every "is it already there?" decision about a file this
installer WRITES is `lstat`, not `existsSync`: a **dangling** symlink reads as absent to
`existsSync`, and seeding "the missing file" would write straight through the link to whatever it
names. (The two steps that only ask whether something OTHER than a seed exists — the knowledge
index and the desk server file — and `doctor`'s presence rows for the memory index and the objective
file use `existsSync`; doctor's knowledge row opens the index read-only: nothing is written through those paths.) A symlink of any kind, or a
directory, at a seed path is reported `skipped` naming what was found, and nothing is written
through it. The command also checks every folder on the way to a seed. A stray file or dangling
link there skips that seed by name instead of stopping the run; the closing line lists each such
seed, and every odd seed entry, as a fix by hand.

**The refresh cannot hang the command.** It is spawned asynchronously with a parent-side
60 s deadline — SIGTERM, then SIGKILL 2 s later — and reported as `timeout`. `spawnSync`'s own
`timeout` is not a deadline: it signals and then keeps waiting for the child to die, so a build
stuck in an uninterruptible syscall (a hung network or FUSE knowledge root) would hang the
whole command.

**`--check` mirrors file-presence decisions and reports effective state separately.** A folder
inside an existing repo reads ✓ `inside <root> — no nested repo, by design`, and a deliberately
omitted `.pi/nana-pack.json` reads ✓ with its reason. Separate `!` rows flag an empty or starter
checker set and missing affirmative trust when project configuration exists; these rows make
`--check` exit nonzero without replacing the file-presence row. A copier-born project reads ✗ for the month log until `nana-setup project` runs; that setup route and copier/scaffold/adopt routes remain distinct.

**…but a seed must be a REGULAR file to read ✓.** A symlink or a directory sitting at
`OBJECTIVE.md` is exactly what setup refused to write through, and the objective still cannot
be read — so `--check` reads ✗ naming what it found, says to move or remove it by hand, and
exits 1. `CLAUDE.md` is the one exception to BOTH rules: `project` writes it as the one-line import
`@AGENTS.md`, on every platform, and an existing project's own relative symlink to `AGENTS.md` still reads ✓ — only
when it **resolves** to this project's own `AGENTS.md`: a dangling link, `-> missing/AGENTS.md`
or a link to another project's file reads ✗ naming the target, because Claude Code would then
be reading different instructions from the ones pi reads. The placeholder text a Windows clone
produces when a committed `CLAUDE.md` symlink is checked out with no symlink support — the
literal 9 bytes `AGENTS.md` — also reads ✗; re-running `project` replaces it with the import file.
A project's own regular `CLAUDE.md` beside `AGENTS.md` is not replaced: fold its instructions into
`AGENTS.md`, then leave only the line `@AGENTS.md` in `CLAUDE.md` by hand.

`project --check` compares only the marker-owned section; text outside it does not affect that row. A differing section names `nana-setup project <dir>` as its fix, and absent or malformed markers read `!`. The project's dry run, which writes nothing, decides which ✗ rows the closing summary gives to `nana-setup project`. When project fixes every row the summary says `run: nana-setup project <dir>`; when it fixes none, the summary lists the labels to fix by hand; a mixed result lists those labels first and then names project for the other count. Labels are deduplicated in row order.

`project --check` mutes the same two Node warnings doctor mutes and prints every other Node warning.

Doctor reads the shared auto-memory tier (`~/.claude/nana-memory/shared`) and the current project's tier (`~/.claude/projects/<key>/memory`). It resolves `[[name]]` by each target's frontmatter `name:` rather than filename. Shared memories may link only to shared names; project memories may link to shared or same-project names. Dangling links are informational and add only a count; they do not fail doctor. Cross-tier and ambiguous links read `!`; doctor never edits memory. The row prints at most 30 named issues, followed by a count when more remain.

Doctor's `pi executable` row checks `pi --version` and names the shared install hint on failure. The next `pi dependencies` row follows that executable's package and reports scoped dependencies installed newer than pi. The `pi packages` row checks nana-pi registration. `PATH resolves pi-review` checks the first executable match on PATH. `pi package source` compares registered package trees with the checkout supplying hooks and rules. Doctor mutes exactly the SQLite ExperimentalWarning and MODULE_TYPELESS_PACKAGE_JSON warning and prints every other Node warning.

Install's dry run decides which ✗ rows doctor's last line gives to `nana-setup install`, and doctor lists the rest by hand. `PATH resolves pi-review` goes to install when the bin folder is already on PATH and no earlier PATH entry holds a pi-review; otherwise doctor lists it by hand. The dry run writes nothing. When install refuses the home, doctor prints `<n> missing — nana-setup install will not run until this is fixed: <first refusal line>`.

Doctor's `release status` row is informational (·). It counts template commits on main since the highest plain vX.Y.Z tag and compares main with origin/main as of the last fetch. It never fetches; the owner decides when to tag and push. The shared reader exports `selectReleaseTag` and `countTemplateCommits` for later release gates.

## Known limits

- A defined `%NAME%` in a Windows home path is expanded by Command Prompt even inside double quotes, so the Command Prompt lock-removal form can target the wrong path; use the PowerShell form instead.
- Git Bash on Windows has no settings-lock removal form of its own.
- `state --paths` archives only the default, non-overlapping layout and refuses custom homes that alias or nest; configured home roots cannot contain glob characters.
- No mechanical check keeps a future doctor-calling test inside `withPiStub`; an unwrapped call runs the ambient `pi --version` (read-only), and reviewers check it.
- On Windows, install leaves hand-written or look-alike hook entries as written; doctor's ✗ settings line names each one and tells you to remove it by hand and run install, or edit it to run this checkout's command. Two exceptions are not named and may leave the row reading ✓: an entry whose script path's last separator is a backslash, such as `C:\Users\me\old\nana-objective.mjs`, and an entry run through `node.exe`.
- `project` still prints the typeless warning.
- A bare `uvx copier copy` project keeps the seeded objective's DRAFT lines until an owner ratifies them through the relevant scaffold or adopt skill; copier alone does not ask for either line.
- A copier-born project has no month log until `nana-setup project` runs; the distinct entry routes are not collapsed into one setup path.
- Project-scope `.pi/settings.json` package entries are not read; a second separate clone with a different git common dir is not recognized; `http://` spellings are invisible under R-325. Install still reports a remote- or worktree-covered registration as in place and adds nothing; doctor is the instrument for detecting a source that differs from this checkout.
- `tests/install.test.mjs` and `tests/win32-degrade.test.mjs` fail when started from an untrusted working folder: their CLI subprocesses inherit that folder's trust state. The suite runs them from the repo, so it stays green.
- An earlier install made through another spelling of the checkout converges once on the next install. On macOS and Linux, install converges every link and the knowledge hook to the checkout's on-disk spelling, a linked spelling included, and uninstall removes a knowledge entry that differs from install's desired entry only in that spelling. On Windows, a letter-case, drive-letter or short-name spelling gets six hook entries and eight launcher files rewritten with dated backups, while hook entries written through a junction to the checkout stay.
- When native realpath fails, setup uses typed realpath spelling, so native spelling guarantees do not apply on that path.
- A `pi.cmd` with no resolvable npm package beside it, including pi.dev, pnpm and Volta layouts, keeps the Command Prompt route. Killing install alone or its relay can leave that pi running.
- Windows Ctrl-C has no install handler. An npm pi ends with install, which can cut short pi's cleanup. Pi's settings lock is held only around a write and treats a leftover lock as stale after about 10 seconds.
- The npm pi route uses the Node running install, not a `node.exe` beside the shim.
- A process pi starts through Command Prompt, such as npm for a registry package, leaves the job chain. A local-folder install starts none.
- Doctor uses the same npm pi route, but no check kills doctor alone.
- On macOS and Linux, killing the relay alone can leave pi running.
- R-2300 and R-2303 are implemented by checks that pass on the Windows CI leg.

## What it never does

- **Never overwrites** `~/.claude/rules/nana-personal.md` (private, and never in this repo — the
  repo ships a placeholder template), `nana-pack.json`, `nana-objective.md`,
  `extensions/subagent/config.json` or `agents/reviewer.md` in the pi agent dir.
- **Never runs `pi install` or `npm` for you** to bring `pi-subagents` to the version `doctor`
  checks for, and never edits `mcp.json` — both are read-only checks (above); the fix is a command
  `doctor` names, for you to run.
- **Install never removes or reorders** existing settings entries except the two exact retired context-hook forms and the Windows repair of POSIX-installer entries: the five shell-form hooks and first unquoted knowledge form become exec form in place, while the verifier moves from `Bash` to `Bash\|PowerShell` without disturbing foreign entries or duplicating an existing verifier. It updates only the command field of exact managed retired SessionStart hooks, in place. `uninstall` removes exact desired hook objects and a knowledge entry that differs only by another spelling of the same file; variants and foreign entries stay. A hook counts as present only when
  the command actually **executes** that script: the command is tokenized with shell-quoting
  rules, leading `VAR=value` assignments are dropped, and `argv[0]` must be the interpreter
  (`node` for the ported hooks; bash/sh/zsh for other commands) with `argv[1]` a path ending in `/<script>` (plus the expected
  argument, for the knowledge hook). So a hand-edited command (a `~` path, an extra env var,
  quotes, `/bin/bash`) is left exactly as it is, while `echo node /tmp/nana-objective.mjs` and
  `…/nana-objective.mjs.disabled` read as *not installed*. A command carrying a shell operator,
  redirection or substitution outside quotes (`&&`, `||`, `;`, `|`, `&`, `>`, `<`, `` ` ``, `$(`)
  is not a plain invocation and reads as not installed either — `node …/nana-objective.mjs &&` is
  not even valid shell, and doctor must not call it healthy. Anything unparseable also reads as not
  installed — the installer would rather add a correct entry than call a machine healthy. Paths
  the installer writes are single-quoted, so a home or clone with a space in it still runs.
- **Never half-writes `settings.json`.** Preflight parses the file *and* validates its shape
  (`{"hooks":"disabled"}` parses but cannot be extended) — a failure there **aborts before
  anything on disk moves**. After preflight, install takes an exclusive lock file
  (`~/.claude/.settings.json.nana-setup.lock`, taken with `O_EXCL`) before its first write and holds
  it through the PATH entries. Retired artifacts, hooks, rules, skills, settings, shared memory,
  pi config, subagent config, the reviewer agent and PATH entries all run while it is held. A second
  install started then exits 2 and writes nothing. Inside the lock, the settings file is re-read and
  compared to the preflight bytes; the temp file is written and `fsync`ed; then the file is compared
  **again**, immediately before the rename. Mode is preserved, and the temp file is removed on any
  abort. `--dry-run` never takes the lock. The knowledge build, desk service and pi registration run
  after release, so a Ctrl-C there leaves no lock.

  The lock lives in the Claude home. Two installs with different `--claude-home` values over one pi
  home and bin folder are not kept apart. A second install started after release runs beside the
  first run's knowledge build, desk step and pi registration; concurrent pi registration still
  relies on pi's own settings lock.

  **A leftover lock is yours to clear.** If the lock exists, the run aborts before anything is
  written and prints the lock path, the pid and age the lock recorded. On macOS and Linux it prints
  a POSIX sh `rm` command; on Windows it prints separate Command Prompt `del` and PowerShell
  `Remove-Item -LiteralPath` forms, with every command alone on its line. Doctor's `settings lock`
  row reports the same forms. There is no age threshold,
  no pid liveness check, and it never unlinks a lock it did not create. Automatic reclamation is
  deliberately absent: two runs can both judge one lock stale, and the loser's `unlink` then
  deletes the winner's *fresh* lock, putting both inside the critical section. Doing it safely
  needs a second lock to guard the first, and a human-run one-shot installer does not earn that —
  a leftover lock means a previous run was interrupted, which is worth a human's glance.

  **The floor:** an external writer that ignores the lock can still land in the microseconds
  between that final compare and the `rename(2)`, and its write would be lost. There is no
  portable way to close that gap — POSIX has no compare-and-swap rename — so the design shrinks
  the window to a syscall pair and takes a lock that every nana-setup respects. Claude Code and
  editors do not take this lock.
- **Never writes through a symlink.** Seeded files are decided by `lstat`, so a dangling
  symlink counts as present (see `project` above); the Windows copy path removes a link before
  copying rather than writing through it.
- **Never destroys a file it replaces.** A regular file where a symlink belongs is renamed to
  `<name>.bak-<YYYYMMDD>` first, and the backup is named in the output. On Windows, an unedited
  managed copy refreshes without another backup; an edited or unrecorded copy is backed up first.
  The copy path never writes *through* a symlink: it removes the link, leaving its target untouched.
- Install and project setup never prompt. `trust` requires `--yes` or an interactive owner confirmation.
- **Never touches the live machine under `--home`** — no `pi install`, no `launchctl`, and `trust`
  refuses an explicit `--pi-home` outside the supplied `--home`. That is what makes the tests safe.

**Known residuals (astra review lane r1 and r2, 2026-10-04) — recorded, not blocking:**

- The symlink guard (`writeIfChanged`, `linkFile`, `seedFile`) is a pre-check, not race-proof
  filesystem enforcement; concurrent path replacement and symlinked ancestors are outside it.
- `doctor` still reads the desk plist through a symlink — install refusing to manage a
  symlinked plist does not make `doctor`'s own read of it safe too.
- The read-instrumentation test for `writeIfChanged` (`tests/fsops.test.mjs`) spies on
  `fs.readFileSync` only, not every filesystem-reading API; revisit it if the implementation
  changes which call it reads through.
- Native Windows and real launchd operation are unexercised by the desk-service tests — they
  stub `launchctl` and never touch the real service or a real win32 box.
- A tag that exists only locally reads as released, though Copier renders the highest pushed tag.
- Release counts are only as fresh as the last fetch or push.

## Idempotence

Re-running install is the normal case: the second run prints `nothing to do — everything was already in
place`. `install --dry-run` reports the same decisions and writes nothing. On the real home the dry run's pi packages step runs install's own pi checks, `pi --version` included, and stops before the first `pi install`, so it cannot foresee a `pi install` failure. Install, its dry run and doctor stop waiting at the limits `PI_LAUNCH_LIMITS_MS` sets in `lib/steps.mjs`, end the pi process tree (taskkill on Windows; without taskkill only cmd.exe ends), and print ✗ naming the command and the limit. On macOS and Linux, install's relay also ends its pi launch when install is killed, even with its whole process group, and still gives pi its grace. On Windows, an npm pi also ends when install is killed. `uninstall --dry-run` previews inventory rows without taking the settings lock or writing. Uninstall requires exactly one of `--dry-run` or `--yes`; edited seeds and hand-written pieces are left.

**Exit codes.** `install`, `project` and `doctor` all exit **1** when any row is ✗ — uninstall exits 1 only for a failure such as a loaded desk service or unsafe settings preflight. `uninstall` exits 2 when its confirmation mode is missing or the platform is win32. Left-by-design items are reported but do not fail. `doctor`
also exits 1 on a `!` row, which says what was checked may not be what pi reads, so it never
reports "all good" — something
on disk is wrong and only you can fix it (today: a private rule that is not a regular file, or a
non-symlink directory sitting where the `requirements` skill symlink belongs).
Exiting 0 there would tell a script the machine is set up when it is not. `--dry-run` reports
the same ✗ and exits 1 with it.

## The two-tier auto-memory, and why there is no per-project step

Claude Code keeps per-project auto-memory under `~/.claude/projects/<key>/memory`. Shared rules
(how to work, who the owner is, external references) live once in `~/.claude/nana-memory/shared`
and are symlinked in as `shared/`.

Linking that per project would mean an installer step per repo, forever. Instead
`claude/hooks/nana-shared-memory.mjs` does it at session start for whatever project the session is in:

- it prefers the **exact** directory the harness names in `transcript_path` (when that path sits
  directly under `<claude home>/projects`);
- otherwise it derives `<key>` the way Claude Code does — every character outside `[A-Za-z0-9]`
  becomes `-` (verified 2026-09-18 against CLI 2.1.269 — `p.replace` of every non-alphanumeric with `-`, and
  beyond 200 characters truncated to 200 with `-<hash>`, `hash` being the 32-bit rolling string
  hash in base 36 — the hook reproduces that arithmetic rather than guessing);
- and it **never picks a directory by pattern**: two projects can share their first 200
  characters, so a glob "match" could mutate the wrong project's memory. The fallback key comes
  from `lib/project-key.mjs`, including non-ASCII paths; when no project directory can be read it
  reports self-heal skipped and still prints the index;
- then it creates the memory dir and the `shared` symlink if they are missing, and prints the
  index;
- the budget in `lib/shared-memory-config.mjs` sits below Claude Code's 10,000-character hook
  output cap. The longest descriptions are cut first, trailing entries drop only when titles
  overflow, and a fold line follows.

So a brand-new repo links itself on its first session. `/Users/example/a-work-project` →
`-Users-example-a-work-project`; `/Users/example/.nana-worktrees/x` → `-Users-example--nana-worktrees-x`.

## Platforms

Support: macOS tested; Linux and Windows run in hosted CI, where the Windows suite leg blocks release and the Linux suite leg does not; Linux has no recorded machine install; on Windows the Claude Code hooks run from the checkout and need Claude Code 2.1.139 or later, the pack's PATH commands are shims that need the bin folder on PATH, and the review and builder launchers run through node from the checkout with an npm-installed pi; launchd is macOS-only.

On native Windows, nana-setup wires every Claude Code hook entry in exec form from the checkout, needing Claude Code 2.1.139 or later to run at all. Windows gets no hook file copy, so install and doctor list each hook only by its settings row. It writes extensionless sh and `.cmd` launchers for the five PATH commands; `~/.local/bin` is not on the Windows user Path by default, so add it through Environment Variables before bare names resolve.

Known launcher limits match ordinary `.cmd` behavior. Windows PowerShell 5.1 drops an empty argument and breaks a spaced argument ending in `\\`. cmd.exe changes an unspaced argument containing `& | < > ^ ( )`, an embedded double quote, or a defined `%NAME%`. Use Git Bash or the node form for those values. Git Bash rewrites `/`-shaped arguments before native Node receives them. The shim names a same-drive bin relative to `%dp0%` because cmd.exe reads a `.cmd` file in the console code page. On the hosted Windows runner under code page 437, a same-drive absolute bin path containing `é` misread that letter and failed to start the bin. A bin on another drive still needs the absolute form and is therefore inferred to fail when its path contains characters outside the active console code page; doctor still reads the rendered shim ✓. The shim resolves `node.exe` only through PATH because a bare `node` searches the caller's folder first. No `.ps1` shim is written because the default Restricted policy would reject it instead of falling back to `.cmd`. Node must remain on PATH at run time. Windows uninstall remains unsupported and leaves these shims, while a changed shim is preserved under a dated backup during repair.

On Windows all five runtime-neutral Claude Code skills are mirrored as managed copies, not links. Each copy carries `.nana-setup-copy`; install refreshes a shipped file without a backup when it still matches the last installed bytes, and backs up an owner-edited or unrecorded file while preserving owner-added files. A real directory at any managed skill path that nana-setup did not make is refused and left untouched, the same as macOS; install exits 1 naming it and doctor reads ✗. Doctor also refuses a regular file, symlink or junction at a Windows skill path and names the path type.

## Usage and options

```
--name <n>           project: the project's name  (default: the folder's name)
--check              project: one ✓ or ✗ line per file; exits 1 on any ✗
--home <dir>         put every user-scope location under <dir> (tests, dry machines)
--claude-home <dir>  the .claude directory        (default: CLAUDE_CONFIG_DIR, else ~/.claude)
--pi-home <dir>      the pi agent directory       (default: PI_CODING_AGENT_DIR, else ~/.pi/agent)
--desk               install + load the desk launchd service (macOS, opt-in)
--dry-run            install: report changes; uninstall: preview removal (writes nothing)
--yes                uninstall: confirm removal; install never prompts
```

A **relative** ambient `PI_CODING_AGENT_DIR` is resolved by each pi against its own start folder,
so a directory derived from setup's cwd is not the one pi reads elsewhere: `install`, `project`
and `project --check` all refuse it (exit 2, naming the resolved dir, before anything is read or
written — `project` reads the user-scope config to decide what to write) until you pass
`--pi-home <absolute dir>` or set an absolute value, and `doctor` prints a `!` line naming the cwd it resolved against and never says "all good"
(exit 1). An explicit `--pi-home`, relative or not, is your decision and is used as given.

An absolute `CLAUDE_CONFIG_DIR` is honoured when neither `--claude-home` nor `--home` is given. A relative value makes install exit 2 before writing, and doctor names that refusal in its summary. An empty value counts as unset. The two flags always win over the variable.

## Install check

Run `node packages/nana-setup/bin/install-check.mjs` from the repository root. The check installs nana into a temporary home, registers the checked-out pi extensions, installs pi-subagents, starts a pi RPC session, runs one scripted pi turn, runs one offline review through each installed pi-review launcher against a throwaway repository, simulates Claude Code hook dispatch, and runs doctor. After doctor it starts one offline lane build through each installed pi-worker launcher, in its own linked worktree of that throwaway repository. The scripted turn, reviews and builds use local test models: they make no network request and call no real model. Before the builds, the check points the temporary home's roster builder at the test model and lists the review fixture in pi's user settings. Its child processes receive the temporary home and temporary/cache folders; the sanitized base environment removes `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, `CLAUDE_CONFIG_DIR`, nana's override variables and caller npm configuration. Each build adds only `PI_OFFLINE=1`. The check does not install nana into the caller's real home. The check depends on Node, Git, pi and npm registry access. The pi-subagents install is retried up to three times, five seconds apart, after an exit failure, and each failed attempt prints a NOTE line with npm's error-code line.

After doctor, macOS and Windows also rehearse the root README's platform fresh-machine checklist as written and print one `readme checklist` result line. Each step's commands are the backticked spans that directly follow `Run ` or `then `, joined with ` && ` and run from a second home (`readme-home`, inside the install-check home, never reused). macOS uses one `/bin/zsh -l -c` call. Windows uses one verbatim `cmd.exe /d /v:off /s /c "<joined>"` call. Linux runs neither rehearsal shell and prints no `readme checklist` line.

The rehearsal environment removes `ZDOTDIR`, redirects the package.json repository URL to the checkout and allows file-only git transport. Its npm global prefix is inside the second home: macOS puts the prefix's `bin` folder before the caller's PATH, while Windows puts the prefix itself, the home's `.local\bin` folder and the caller's Path in that order, joined with literal `;`. The Windows bin entry stands in for checklist step 5, which writes the user Path and cannot run inside the temporary process environment. Step 2's pi install runs for real over the network into that prefix. `nana-setup trust ` commands get `--yes` appended because no terminal can answer the prompt; every other command runs as written. `readme checklist` is FAIL unless some step names both commands and expected text and every command step exits 0 within its sealed timeout with its expected text in stdout. It names the first failing step and command, or the missing expectation.

On FAIL, the check prints the hooks block and the last knowledge-pull record after the result lines. The pi session fails on an extension error or an unavailable notice, widget or status. The adoption hook fails on a stale-install or stale-check-unavailable line. A pi-review run fails on a timeout, launch or exit failure, a missing or non-LAND final verdict, a missing single LAND tally for its item, or a fixture record missing the whole review standard, run token or reviewer role. A pi-worker run fails on a timeout, launch or exit failure, wrong final answer and verdict lines, missing rendered preamble, brief, writing tag or worker role, a missing or wrong build-record pair, or a wrong or unreleased lane lock. A failed build line names pi-worker's refusal or pi's own first error line. The review and build ledgers belong to the temporary home, not the caller's home. The check sets one failing post-edit command in the temporary home's nana-pack.json. The scripted turn covers pi's objective, rulings, writing and knowledge prompt injections, nana-gate blocking the Bash verifier sample, and a file write whose result must carry that post-edit check's failure line. On Windows the turn enables pi's PowerShell tool, and nana-gate must block the PowerShell verifier sample. It does not cover the UI confirmation path. The check proves that the documented installation and selected installed hooks run in this fixture on the current runner. It does not start Claude Code or prove the result on every machine. Installed Windows hooks run directly in exec form (`node` with arguments, no shell). A Windows green result is not a substitute for a rehearsal on the owner's Windows machine.

## Tests

Zero-dep: `node packages/nana-setup/tests/<file>.test.mjs` (each file exits with its failure
count). The repository runner scrubs `CLAUDE_CONFIG_DIR` before starting each file. Every run
targets a fresh home under `os.tmpdir()` through its environment and explicit setup flags, so no
test can touch the real `~/.claude`, `~/.pi`, `~/.local/bin` or LaunchAgents, and none loads a
launchd service.

Environment switches (tests and CI only):

| Variable | Effect |
|---|---|
| `NANA_TEST_REQUIRE_COPIER=1` | the copier renders in `tests/project.test.mjs` become a FAILURE instead of a counted `SKIP` when `uvx` is missing — it exists so a machine that cannot render never drops the byte-equality and `_skip_if_exists` invariants silently. Root CI (`.github/workflows/ci.yml`) installs uv and sets this variable on both suite legs. |
| `NANA_SETUP_PLATFORM` | forces the win32 branches on a Mac |
| `NANA_SETUP_KNOWLEDGE_CLI` | points the knowledge refresh at a stub binary |
| `NANA_SETUP_KNOWLEDGE_DEADLINE_MS` / `NANA_SETUP_KNOWLEDGE_KILL_GRACE_MS` | shrink the refresh deadline and the SIGTERM→SIGKILL grace so the deadline is testable in under a second |

Every test file prints a `SUMMARY  PASS=… FAIL=… SKIP=…` line; a skipped gate is printed
loudly and counted, never silent.

| File | Covers |
|---|---|
| `tests/uninstall.test.mjs` | explicit confirmation, exact settings pruning, and released context-hook handling |
| `tests/copy-record.test.mjs` | Windows rule, skill and pi rulings refreshes without backup noise; edited and unrecorded copies; dry runs; unusable records |
| `tests/state-manifest.test.mjs` | classified inventory, layout coverage, ledger parity, secret classification, and read-only listing with inaccessible secret fixtures |
| `tests/restore.test.mjs` | documented command lines, durable-store absence, inventory listing and restore ordering |
| `tests/install.test.mjs` | a fresh machine, the second run changing nothing, printing no retired skill-link row and adding no skipped rows, backup on collision, what is never overwritten (incl. a hand-edited `extensions/subagent/config.json` and `agents/reviewer.md`), `doctor` exit codes, `--dry-run` writing nothing, a home with a space (the generated hook commands are executed), the gated objective seed, the subagent config and reviewer agent seeded only when absent, and the private rule as a **symlink** — install ✗ with the fix **and exit 1** (dry run too), a summary that does not claim everything is in place, nothing written through the link, doctor ✗ and exit 1, both green again once it is a regular file |
| `tests/settings-merge.test.mjs` | foreign hooks preserved, no duplicates, matcher groups untouched, the tokenizer and parsed matching, in-place migration of exact retired hook entries, and doctor detection of retired commands, shape validation making the install a no-op, the lock (none left after a normal run, a held lock stopping install before its first write with the full home unchanged, path + pid + age + the platform's removal commands reported, a day-old dead-pid lock still aborting, `--dry-run` unaffected, released on throw, a replacement lock never unlinked), and the post-temp-write re-compare — injected through the real write path, asserting abort + temp removed + the other writer's bytes intact |
| `tests/settings-lock.test.mjs` | the printed sh, Command Prompt and PowerShell lock-removal lines run as printed from an unrelated folder without changing other files; doctor's leftover-lock row repeats the commands and its summary lists the lock to fix by hand |
| `tests/project-key.test.mjs` | the `<key>` mapping, the over-200 hash form, cross-checked against the real `~/.claude/projects` |
| `tests/shared-memory-hook.test.mjs` | the real Node hook, run with `HOME`/`CLAUDE_PROJECT_DIR` overridden: fail-open, self-heal, both resolution branches, the >200-char hash against the JS reference, a shared-prefix sibling left alone, and non-ASCII key derivation |
| `tests/shared-memory-input.test.mjs` | the shared-memory hook's TTY guard and 65536-byte stdin cap |
| `tests/shared-memory-budget.test.mjs` | the shared-memory hook's output budget, longest-description cuts, whole trailing-entry drops, surrogate-safe trim mark and fold counts |
| `tests/pi-registration.test.mjs` | "already registered?" across relative, `~`, absolute, worktree-of-the-same-repo and every accepted remote spelling — plus the look-alike remotes that must NOT count. A false negative double-loads every extension; a false positive suppresses a real `pi install` |
| `tests/pi-launch-limits.test.mjs` | bounded `pi --version` and `pi install` launches for install, its dry run and doctor; timeout rows, full process-tree cleanup after limits, signals or parent death, default limits, agent-folder environment, POSIX termination grace and near-1 MiB output on each stream |
| `tests/doctor-package-source.test.mjs` | pi package source diagnosis for remote entries, object-form sources, in-checkout relative entries, external worktree identity, clone-first remedy and unrelated packages |
| `tests/doctor-pi-dependencies.test.mjs` | the package behind pi on PATH, nested and hoisted scoped dependencies, newer-version failures, unreadable notes and injected Windows npm layouts |
| `tests/fresh-machine.test.mjs` | ordered README checklist and sourced Node, pi and pi-subagents versions |
| `tests/readme-rehearsal.test.mjs` | the checklist's `Run`/`then`/`expect` parse grammar, the sealed answer rule, the rehearsal home's environment (no ZDOTDIR, the home npm prefix ahead of PATH, only the clone redirect added), the spawn adapter's configurable output cap, and the stop-at-first-failure verdict (all steps ok, a nonzero exit, a timeout, missing expected text, and no expected text anywhere) |
| `tests/doctor-runtime.test.mjs` | pi executable diagnostics and first executable pi-review PATH resolution |
| `tests/doctor-quiet.test.mjs` | doctor and `project --check` mute the SQLite ExperimentalWarning and MODULE_TYPELESS_PACKAGE_JSON warning while preserving unrelated Node warnings |
| `tests/doctor-fix-line.test.mjs` | doctor's final line gives install only the ✗ rows its dry run repairs, lists the rest by hand, reports a refusal, preserves ! counts, and writes nothing |
| `tests/win32-degrade.test.mjs` | every still-posix-only step reporting `skipped (win32)`; install and doctor printing no hook-file row; all eight PATH shim files, install idempotence and collision backup; doctor requiring both shim renderings; the six win32 settings entries wired in exec form with matcher `Bash\|PowerShell`; and the copy path backing up / never writing through a symlink |
| `tests/win32-hook-repair.test.mjs` | Windows repair of carried POSIX shell-form hooks and the first unquoted knowledge form; verifier relocation and deduplication; second-install and doctor health; owner look-alikes preserved byte-identically; doctor naming dead entries install leaves, excluding entries install repairs, and tolerating refused settings shapes |
| `tests/win-shims.test.mjs` | bare-name sh, cmd.exe and Windows PowerShell argument and exit-status handoff; PATH node selection; self-rewrite safety; and Windows PATH-resolution diagnosis |
| `tests/desk-service.test.mjs` | the plist rendering with resolved values, opt-in, and launchctl never being called from a test |
| `tests/stale-copies.test.mjs` | Claude Code and pi stale-copy notices on POSIX and win32; exact doctor-label parity across hook links, hook settings, rules and skills; blocked skill paths or their linked parent to move; repair clearing the line; a byte-unchanged home; silence when current; and the checker failure marker |
| `tests/project-stale.test.mjs` | both seats' shared project-stale line; adopted-root, repository and launcher-role guards; exact file-row and by-hand parity with `project --check`; bounded fatal reads; safe command fallbacks; reload clearing; and no child or TypeScript dependency |
| `tests/linked-claude-folder.test.mjs` | a Claude home or skills folder that is a link, before or after install: no retired row for an absent retired path or a skill link or copy install made; a present retired artifact reported ✗ and left byte-for-byte untouched (an unlinked home still gets it moved or unlinked); doctor's ✗ skill rows naming the linked folder to move aside, matching the session-start line exactly; legacy rows naming every refused path to move by hand and reading ✓ after those paths move; ✓ skill and legacy rows matching an unlinked home; moving a linked folder aside and reinstalling turning every skill row ✓; an unreachable Claude, rules, shared-memory or off-win32 hooks link refusing before any write while broken skills and win32 hooks links do not; and doctor's final line listing skill rows by hand when the dry run completes or naming that refusal |
| `tests/checkout-spelling.test.mjs` | install, doctor, stale-copy and uninstall identity across the checkout's on-disk spelling and an available case, drive-letter or 8.3 spelling, including homes written by an earlier spelling |
| `tests/checkout-converge.test.mjs` | POSIX install convergence for same-checkout skill links and the knowledge hook, foreign-link preservation, and uninstall ownership; the runner skips this file on Windows |
| `tests/realpath-fallback.test.mjs` | install, doctor, the stale-copy producer and POSIX uninstall when native realpath fails inside the checkout and typed realpath succeeds |
| `tests/skills-and-standards.test.mjs` | the `requirements` skill and the `claude/rules/nana-standards.md` rule: the frontmatter name and every trigger phrase the description must carry, a fresh machine getting both as symlinks into the repo, idempotence, doctor ✓ or ✗ with the fix named, a **regular directory** already at `~/.claude/skills/requirements` reported with install **exit 1** and the owner's file untouched and nothing backed up into the skills dir, a symlink pointing elsewhere relinked, and the forced win32 branch (a real directory of byte-equal copies, a stale copy caught by doctor and refreshed, a hand-written file backed up beside itself); on win32 a folder nana-setup did not make is refused the same way — install and `--dry-run` **exit 1** and leave it byte-identical, doctor reads ✗ — while a `.nana-setup-copy`-marked mirror or a pre-marker shipped SKILL.md (LF or CRLF) keeps refreshing and a fresh mirror gets the marker written |
| `tests/project.test.mjs` | `project` on a blank folder (every file, `git init`, the one-line `CLAUDE.md` import, the canonical section verbatim), the same import written with `NANA_SETUP_PLATFORM=win32` forced, the second run changing no bytes, `<date>`/`<name>` filled while the DRAFT placeholders survive, an existing objective, navigation, or sessions README left untouched, a CLAUDE.md-only folder getting no AGENTS.md, the user-scope postEdit shadow guard, `--dry-run` writing nothing, `--check` exit codes — plus the copier renders: both languages emit the three seeds byte-equal to `templates/_shared` (after `<name>`), and adopt mode does not overwrite a pre-existing `OBJECTIVE.md`. nana-pi's own committed `CLAUDE.md`, a regular file holding the import; a **dangling symlink** and a **directory** at a seed path reported as skipped with nothing written through them **and then read ✗ by `--check`**; a project `--name` full of shell and regex metacharacters (`$(…)`, backticks, `$&`) landing LITERALLY in the files with nothing executed; the `adopt-structure` fallback commands taking the name from an env var rather than command text; the CLAUDE.md import reading ✓, and an existing symlink still reading ✓ only when it RESOLVES to this project's AGENTS.md (dangling, `-> missing/AGENTS.md` and a link to another project all ✗, with exit 1); the AGENTS.md placeholder text reading ✗ and a refresh replacing it with the import file without ever writing through a link; `--check` mirroring setup (inside-a-repo ✓, a deliberately omitted pack config ✓); a **held build lock** reported as such and never as a rebuild (a live lock in a temp knowledge home); and the refresh **deadline** against a stub CLI that traps SIGTERM. The copier half SKIPs loudly (or FAILs under `NANA_TEST_REQUIRE_COPIER=1`) when `uvx` is not installed |
| `tests/project-odd-seeds.test.mjs` | all seven seed paths as links or folders; files and links on folder paths; by-hand setup and check summaries; the project's own `CLAUDE.md`; literal odd names; and dry-run parity including a missing parent |
