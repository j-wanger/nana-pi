# nana-setup

One command that installs nana setup surfaces outside pi.

`pi install` brings the pi extensions, skills and templates. Everything else used to be
hand-maintained dotfiles on one Mac: the Claude Code hooks and rules, the settings wiring, the
two-tier auto-memory, the user-scope pi config, the `pi-review` entry on PATH, and the desk
service. `nana-setup` installs the supported surfaces from the repo, and `nana-setup doctor` reports their state.

```bash
node packages/nana-setup/bin/nana-setup.mjs install      # install / repair everything
node packages/nana-setup/bin/nana-setup.mjs doctor       # one ✓ or ✗ per piece; exits 1 on any ✗ or !
node packages/nana-setup/bin/nana-setup.mjs install --desk   # + the desk launchd service (macOS)
node packages/nana-setup/bin/nana-setup.mjs project ~/my-thing   # make a folder a nana project
node packages/nana-setup/bin/nana-setup.mjs trust ~/my-thing --yes # record pi project trust after confirmation
```

Runtime dependencies: **Node ≥ 22.18** and the globally installed `@earendil-works/pi-coding-agent` package (used for pi's exported project-trust API). The floor is set by the installed
`claude/hooks/nana-objective.sh` hook, which runs `packages/nana-pack/bin/nana-objective.mjs`; that
CLI imports `../nana-pack/lib/objective.ts` with no flag, relying on Node's built-in TypeScript stripping (default from
22.18). On an older Node the hook prints `OBJECTIVE UNAVAILABLE: Node <v> is older than 22.18 …`
(and `… node not found on PATH …` with no `node` at all) instead of the objective, and `doctor`'s
`node for the objective hook` line reads ✗. `install` calls out to `pi` (only to register
the packages, and only when they are not registered yet — and it probes `pi --version` first, so a
machine without pi on PATH reports `skipped` with the install command instead of failing), to `node` (to build the knowledge
index) and to `launchctl` (only with `--desk`, only on macOS, only against the real home). A missing `pi` is reported as skipped; a failed launchctl bootstrap or kickstart is a problem and makes install exit 1.

## What it installs

| Piece | Where | How |
|---|---|---|
| `claude/hooks/nana-objective.sh`, `claude/hooks/nana-adoption.sh`, `claude/hooks/nana-shared-memory.sh` | `~/.claude/hooks/` | **symlink** into `claude/hooks/` — a `git pull` updates them |
| `claude/rules/nana-soul.md` (the identity) | `~/.claude/rules/` | **symlink** into `claude/rules/` |
| `claude/rules/nana-standards.md` (the coding standards) | `~/.claude/rules/` | **symlink** into `claude/rules/` — requirement-first, no inline tunables, one purpose per module with the six-tag header, the code map kept current, status honesty. Generic, language-agnostic; it does not repeat `claude/rules/nana-soul.md` |
| `packages/nana-pack/rules/nana-writing.md` (writing for Jake — trial, 2026-10-04) | `~/.claude/rules/nana-writing.md` | **symlink** — sourced from `packages/nana-pack/rules/`, not this package's own `claude/rules/`, because the `nana-writing` pack extension reads the SAME file for pi (one source, two runtimes — design-ruling.md Amendment 1, 2026-10-04, §A1) |
| `requirements`, `spec`, `py-lint`, `py-review`, `py-test` skills | matching `~/.claude/skills/<name>` | **symlinks** to the same runtime-neutral `packages/nana-pack/skills/<name>` directories pi reads. Recognized stale nana-dev-kit copies are moved to dated backups outside the active skills root before linking; unknown or edited directories are left untouched and doctor reads ✗. The `scaffold-*` and `adopt-*` skills remain pi-only because they assume pi |
| retired nana-dev-kit and broken Codex imports | `~/.claude/backups/` or `~/.agents/backups/` | recognized artifacts move to `<YYYY-MM-DD>-retired/` only after lstat and provenance checks; unknown content stays in place. `~/.agents/skills/synced/` is excluded. Existing repository context-warning markers are not scanned; install prints a reminder to remove them manually |
| `~/.claude/rules/nana-personal.md` (private) | `~/.claude/rules/` | **copied from `claude/rules/nana-personal.example.md`, only when absent**, then never touched. It must be a REGULAR file: a symlink there aims your private text at some other file — plausibly one inside this repo, which is how a private rule gets committed — so install prints `✗ private rule is a symlink — replace with a regular file`, the summary refuses to say "everything was already in place", and doctor reads ✗ (lstat, not existsSync) |
| SessionStart + UserPromptSubmit + PreToolUse hooks | `~/.claude/settings.json` | missing active entries are added without reordering foreign entries. Install removes only the exact managed `bash ~/.claude/hooks/context-size-check.sh` invocation; variants are preserved. The knowledge hook is migrated in place only when its timeout and status metadata match and its command is exactly the installer form `NODE_NO_WARNINGS=1 node '<absolute checkout>/packages/nana-knowledge/bin/nana-knowledge.ts' hook`, allowing only the checkout path to differ. Customized commands—including environment prefixes, interpreters, or arguments—are preserved as complete entries. The Node Bash PreToolUse hook asks before a pipeline precedes `git commit` without active `pipefail`; a non-match or hook error abstains with empty stdout, and errors write a diagnostic to stderr. Claude Code documents the no-decision behavior: “If no decision is returned, Claude Code continues with its normal permission flow” ([PreToolUse decision control](https://code.claude.com/docs/en/hooks#pretooluse-decision-control)). The Claude Code hooks, including this verifier hook, are unavailable on Windows, so no PreToolUse verifier entry is installed there.
| shared auto-memory | `~/.claude/nana-memory/shared/MEMORY.md` | created when absent |
| per-project `shared` symlink | `~/.claude/projects/<key>/memory/shared` | **no installer step** — the SessionStart hook creates it, per project, per session |
| `nana-pack.json` | the pi agent dir (`PI_CODING_AGENT_DIR`, else `~/.pi/agent/`) | seeded **only when absent** |
| `nana-objective.md` | the pi agent dir | seeded only when `nana-pack.json` was seeded by this run, or its `objective.path` resolves to this file — pointing the objective at a real repo's `OBJECTIVE.md` means no starter file is created |
| `extensions/subagent/config.json` (pi-subagents' own config — a third-party vendor extension nana-pi only consumes) | the pi agent dir | seeded **only when absent**, exactly `{"asyncByDefault":true,"forceTopLevelAsync":true,"maxSubagentDepth":1}` — `forceTopLevelAsync` is the key that forces an ORDINARY, model-driven top-level `subagent` tool launch into the background (the gated runner process) regardless of what the model asks for (see `packages/nana-pack/README.md` Behavior notes for the exceptions it does not reach); `maxSubagentDepth` caps nested fan-out at one level. `doctor` reads ✗ naming the key and its required value when either is wrong, or when the file is missing or invalid — and never rewrites a file you already have |
| `agents/reviewer.md` (shadows pi-subagents' builtin `reviewer` agent by name) | the pi agent dir | seeded **only when absent** — the upstream reviewer persona verbatim, with `bash` added to its tools and three rule changes: it gathers its own `git`/test evidence instead of asking the parent for it, and reports a gap under "Could not verify" rather than blocking on a supervisor reply. `doctor` reads ✗ when the file is absent or its body's first line is not the nana marker comment |
| knowledge index | `~/.pi/agent/nana-knowledge/index.db` (under `--pi-home` / `--home` when given) — **not** under an ambient `PI_CODING_AGENT_DIR` | built when absent (`nana-knowledge build` refreshes it); doctor opens read-only and counts rows from the expected `docs` table, so a corrupt or wrong-schema database reads ✗. The knowledge runtime reads `NANA_KNOWLEDGE_HOME` or `~/.pi/agent/nana-knowledge` and never `PI_CODING_AGENT_DIR`, so following that variable here built an index nothing read; moving knowledge storage needs a deliberate cross-runtime contract, which this installer does not make on its own |
| `pi-review` | `~/.local/bin/pi-review` | symlink to `packages/nana-pack/bin/pi-review.mjs` (`pi install` does no bin linking) |
| desk service | `~/Library/LaunchAgents/com.nana.pi-desk.plist` | opt-in `--desk`; rendered from `launchd/*.tmpl`, then loaded with `launchctl bootstrap gui/$UID` and started with plain `kickstart` on first load. After bootout it waits for launchd to report the job absent before bootstrap; an error-5 bootstrap gets one retry after the same wait. Every explicit `--desk` repair restarts an existing service with `kickstart -k`; bootstrap or kickstart failure exits 1. The plist uses a curated PATH (the node binary directory, `~/.local/bin`, Homebrew, `/usr/local/bin`, `/usr/bin`, `/bin`), not the installing shell's PATH. launchd does not inherit your shell's environment, so when the chosen pi agent dir is not `~/.pi/agent` the plist exports it as `PI_CODING_AGENT_DIR` (absolute). Doctor requires `launchctl print` state `running` and the plist's `ProgramArguments[0]` to exist and run Node ≥22.19. macOS only — there is no service definition on other platforms |
| pi packages | `settings.json` in the pi agent dir | Registration is complete only when every extension directory in the root `package.json` manifest is loaded. A root entry covers both manifests; per-package entries cover their own manifest. Install adds only missing per-package entries, never a root entry atop existing package entries. Paths use pi's matching rules (`~`, settings-relative paths, real paths and linked-worktree identity); exact remote entries are also recognized. |

**Verifier-pipe guard (user-scope):** every session will prompt before running a Claude Code Bash command that pipelines output before `git commit` without earlier active `pipefail`; this Claude Code hook is unavailable on win32. This is an additive best-effort text check: a pipeline or commit not present in the literal command text and reached through a later call is not matched; the sandbox is the boundary. Claude Code documents the response shape as `hookSpecificOutput` with `hookEventName: "PreToolUse"`, `permissionDecision: "ask"`, and `permissionDecisionReason` ([PreToolUse hook output](https://docs.anthropic.com/en/docs/claude-code/hooks#pretooluse-decision-control)). Non-matches and hook errors abstain (empty stdout), so Claude Code's normal permission flow continues; errors write a diagnostic to stderr.

## Updating the checkout with the desk

Before updating this checkout, quiesce desk activity and close or pause sessions that depend on it. Update the checkout only after the desk is quiescent. Then explicitly repair and restart the desk with `node packages/nana-setup/bin/nana-setup.mjs install --desk`, and verify the result with `node packages/nana-setup/bin/nana-setup.mjs doctor`. Doctor must report the desk running and its plist-selected Node version healthy.

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

`doctor` also reads two things `install` never writes, because they belong to pieces outside its
own job: a third-party npm package, and pi's own MCP config.

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

## Upgrading pi itself

Upgrade with npm, **never `pi update`**: `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@<version>`.
Since 1.0.1, `pi update` on an npm install recommends migrating to pi.dev's managed installer,
which moves the `pi` binary out of `npm root -g` — breaking this installer's and the desk's
resolution until their own override variables are repointed at it. Nothing in this repo needs that
migration; staying on the npm install keeps `doctor` and the desk working as documented here.

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

`dir` defaults to the current directory, the name to its basename. Every step is idempotent and
**nothing existing is ever overwritten** — a second run prints `nothing to do`.

| Step | What | When it is skipped |
|---|---|---|
| `git init` | only when the folder is not already a repo | a folder INSIDE another repo is left alone — a nested repo hides every file from the outer one |
| `OBJECTIVE.md`, `HANDOFF.md`, `docs/sessions/README.md` | copied from `templates/_shared/`, with `<date>` filled with today and `<name>` with the project name | any one of them that already exists |
| `docs/sessions/<YYYY-MM>.md` | this month's log, header only | it already exists |
| `AGENTS.md` + a relative `CLAUDE.md` symlink (win32: a copy) | a lean stub — name, empty `Layout` and `Rules that don't move`, then the canonical `Working under nana-pi` section verbatim | when **either** `AGENTS.md` or `CLAUDE.md` is already there: that project has made its choice |
| `.pi/nana-pack.json` | `{"postEdit":{"commands":[]}}` — an empty on-ramp, so nothing runs until you fill it in | when it exists, **and** when you have user-scope `postEdit.commands`: project config replaces user config per key group, so an empty project block would shadow your global checks in this repo |
| `nana-knowledge build` | refreshes the index so the new repo's docs are findable at prompt time | when there is no index yet — run `install` first; when another build **holds the lock** (that CLI exits 0 on a held lock so the prompt hook never fails, so the lock message on stderr is the only evidence — reported `skipped (build lock held)`, never "rebuilt"); and on the **60 s deadline** |

The three seeds have ONE source, `templates/_shared/`, and three consumers: this command, the
copier templates (both languages `include` them, and `_skip_if_exists` keeps adopt mode from
overwriting a real one) and the `adopt-structure` skill. So a scaffolded, an adopted and a
hand-made project read identically. `<date>` is left literal in the rendered template on
purpose — copier has no date variable — and is filled by this command or by the skill.

**Trust is yours to decide, too.** The seeded `.pi/nana-pack.json` is ignored until you decide this folder's trust. Run
`nana-setup trust <dir>` and confirm interactively, or pass `--yes` in a script. The command
records through pi's own `ProjectTrustStore` and prints the store path. `pi -a` / `--approve`
(and the desk's trust box, which sends `-a`) trusts one run only; it is not a recorded decision.

`project` and every scaffold and adopt completion message name the first two steps: ratify the
seeded `OBJECTIVE.md` (fill the date; the DRAFT lines are yours), then run
`nana-setup trust <dir>`. What the tool will not do is decide your objective.

**Present means present, not readable.** Every "is it already there?" decision about a file this
installer WRITES is `lstat`, not `existsSync`: a **dangling** symlink reads as absent to
`existsSync`, and seeding "the missing file" would write straight through the link to whatever it
names. (The two steps that only ask whether something OTHER than a seed exists — the knowledge
index and the desk server file — and `doctor`'s presence rows for the memory index and the objective
file use `existsSync`; doctor's knowledge row opens the index read-only: nothing is written through those paths.) A symlink of any kind, or a
directory, at a seed path is reported `skipped` naming what was found, and nothing is written
through it.

**The refresh cannot hang the command.** It is spawned asynchronously with a parent-side
60 s deadline — SIGTERM, then SIGKILL 2 s later — and reported as `timeout`. `spawnSync`'s own
`timeout` is not a deadline: it signals and then keeps waiting for the child to die, so a build
stuck in an uninterruptible syscall (a hung network or FUSE knowledge root) would hang the
whole command.

**`--check` mirrors file-presence decisions and reports effective state separately.** A folder
inside an existing repo reads ✓ `inside <root> — no nested repo, by design`, and a deliberately
omitted `.pi/nana-pack.json` reads ✓ with its reason. Separate `!` rows flag an empty or starter
checker set and missing affirmative trust when project configuration exists; these rows make
`--check` exit nonzero without replacing the file-presence row.

**…but a seed must be a REGULAR file to read ✓.** A symlink or a directory sitting at
`OBJECTIVE.md` is exactly what setup refused to write through, and the objective still cannot
be read — so `--check` reads ✗ naming what it found, and exits 1. The one path where a symlink
is the healthy state is `CLAUDE.md`, which `project` writes as a relative link to `AGENTS.md`
(a copy on win32, which has no usable symlink) — and only when it **resolves** to this
project's own `AGENTS.md`: a dangling link, `-> missing/AGENTS.md` or a link to another
project's file reads ✗ naming the target, because Claude Code would then be reading different
instructions from the ones pi reads.

## What it never does

- **Never overwrites** `~/.claude/rules/nana-personal.md` (private, and never in this repo — the
  repo ships a placeholder template), `nana-pack.json`, `nana-objective.md`,
  `extensions/subagent/config.json` or `agents/reviewer.md` in the pi agent dir.
- **Never runs `pi install` or `npm` for you** to bring `pi-subagents` to the version `doctor`
  checks for, and never edits `mcp.json` — both are read-only checks (above); the fix is a command
  `doctor` names, for you to run.
- **Never removes or reorders** anything in `settings.json`. A hook counts as present only when
  the command actually **executes** that script: the command is tokenized with shell-quoting
  rules, leading `VAR=value` assignments are dropped, and `argv[0]` must be the interpreter
  (`bash`/`sh`/`zsh`, or `node`) with `argv[1]` a path ending in `/<script>` (plus the expected
  argument, for the knowledge hook). So a hand-edited command (a `~` path, an extra env var,
  quotes, `/bin/bash`) is left exactly as it is, while `echo bash /tmp/nana-objective.sh` and
  `…/nana-objective.sh.disabled` read as *not installed*. A command carrying a shell operator,
  redirection or substitution outside quotes (`&&`, `||`, `;`, `|`, `&`, `>`, `<`, `` ` ``, `$(`)
  is not a plain invocation and reads as not installed either — `bash …/nana-objective.sh &&` is
  not even valid shell, and doctor must not call it healthy. Anything unparseable also reads as not
  installed — the installer would rather add a correct entry than call a machine healthy. Paths
  the installer writes are single-quoted, so a home or clone with a space in it still runs.
- **Never half-writes `settings.json`.** Preflight parses the file *and* validates its shape
  (`{"hooks":"disabled"}` parses but cannot be extended) — a failure there **aborts before
  anything on disk moves**. The write itself runs under an exclusive lock file
  (`~/.claude/.settings.json.nana-setup.lock`, taken with `O_EXCL`) held across the whole
  read → validate → write-temp → re-compare → rename sequence. Inside it, the file is re-read and
  compared to the preflight bytes; the temp file is written and `fsync`ed; then the file is
  compared **again**, immediately before the rename. Mode is preserved, and the temp file is
  removed on any abort. `--dry-run` never takes the lock.

  **A leftover lock is yours to clear.** If the lock exists, the run aborts and prints the lock
  path, the pid and age the lock recorded, and the `rm` command to remove it — no age threshold,
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
  `<name>.bak-<YYYYMMDD>` first, and the backup is named in the output. The Windows copy path
  owes the same guarantee: it backs up too, and it never writes *through* a symlink — the link is
  removed first, so whatever it pointed at is untouched.
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

## Idempotence

Re-running is the normal case: the second run prints `nothing to do — everything was already in
place`. `--dry-run` reports the same decisions and writes nothing.

**Exit codes.** `install`, `project` and `doctor` all exit **1** when any row is ✗ — and `doctor`
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
`claude/hooks/nana-shared-memory.sh` does it at session start for whatever project the session is in:

- it prefers the **exact** directory the harness names in `transcript_path` (when that path sits
  directly under `<claude home>/projects`);
- otherwise it derives `<key>` the way Claude Code does — every character outside `[A-Za-z0-9]`
  becomes `-` (verified 2026-09-18 against CLI 2.1.269 — `p.replace` of every non-alphanumeric with `-`, and
  beyond 200 characters truncated to 200 with `-<hash>`, `hash` being the 32-bit rolling string
  hash in base 36 — the hook reproduces that arithmetic rather than guessing);
- and it **never picks a directory by pattern**: two projects can share their first 200
  characters, so a glob "match" could mutate the wrong project's memory. When the key cannot be
  derived in the shell (a non-ASCII path, which the harness hashes in UTF-16 code units and bash
  cannot), it prints one line saying the self-heal was skipped and changes nothing — those
  sessions still heal through `transcript_path`;
- then it creates the memory dir and the `shared` symlink if they are missing, and prints the
  index.

So a brand-new repo links itself on its first session. `/Users/jwang/aml-desk` →
`-Users-jwang-aml-desk`; `/Users/jwang/.nana-worktrees/x` → `-Users-jwang--nana-worktrees-x`.

## Platforms

Support: macOS tested; Linux has no recorded native acceptance; the pack runs on native Windows but is untested, Claude Code shell hooks and the review wrapper are unavailable, and launchd is macOS-only.

On Windows, installer copies and skipped shell hooks are implementation details, not a claim of supported parity.
On Windows the Claude Code `requirements` skill is the only one mirrored (a copy, not a link); `spec`, `py-lint`, `py-review` and `py-test` are skipped and stay pi-only there.

## Usage and options

```
--name <n>           project: the project's name  (default: the folder's name)
--check              project: one ✓ or ✗ line per file; exits 1 on any ✗
--home <dir>         put every user-scope location under <dir> (tests, dry machines)
--claude-home <dir>  the .claude directory        (default ~/.claude)
--pi-home <dir>      the pi agent directory       (default: PI_CODING_AGENT_DIR, else ~/.pi/agent)
--desk               install + load the desk launchd service (macOS, opt-in)
--dry-run            report what would change, write nothing
--yes                accepted for scripts; the installer never prompts
```

A **relative** ambient `PI_CODING_AGENT_DIR` is resolved by each pi against its own start folder,
so a directory derived from setup's cwd is not the one pi reads elsewhere: `install`, `project`
and `project --check` all refuse it (exit 2, naming the resolved dir, before anything is read or
written — `project` reads the user-scope config to decide what to write) until you pass
`--pi-home <absolute dir>` or set an absolute value, and `doctor` prints a `!` line naming the cwd it resolved against and never says "all good"
(exit 1). An explicit `--pi-home`, relative or not, is your decision and is used as given.

## Tests

Zero-dep: `node packages/nana-setup/tests/<file>.test.mjs` (each file exits with its failure
count). Every run installs into `os.tmpdir()` with `--home`, so no test can touch the real
`~/.claude`, `~/.pi`, `~/.local/bin` or LaunchAgents, and none of them loads a launchd service.

Environment switches (tests and CI only):

| Variable | Effect |
|---|---|
| `NANA_SETUP_REQUIRE_COPIER=1` | the copier renders in `tests/project.test.mjs` become a FAILURE instead of a counted `SKIP` when `uvx` is missing — it exists so a machine that cannot render never drops the byte-equality and `_skip_if_exists` invariants silently. **Residual (2026-09-18): this repo has no CI workflow at all** — the only `.github/workflows` here belong to the two project *templates*, and nothing in the repo runs these tests automatically. Until there is one, set this by hand on any machine that is meant to exercise the renders; when a repo workflow is added, the job that runs these tests must install `uv` and set `NANA_SETUP_REQUIRE_COPIER: "1"` |
| `NANA_SETUP_PLATFORM` | forces the win32 branches on a Mac |
| `NANA_SETUP_KNOWLEDGE_CLI` | points the knowledge refresh at a stub binary |
| `NANA_SETUP_KNOWLEDGE_DEADLINE_MS` / `NANA_SETUP_KNOWLEDGE_KILL_GRACE_MS` | shrink the refresh deadline and the SIGTERM→SIGKILL grace so the deadline is testable in under a second |

Every test file prints a `SUMMARY  PASS=… FAIL=… SKIP=…` line; a skipped gate is printed
loudly and counted, never silent.

| File | Covers |
|---|---|
| `tests/install.test.mjs` | a fresh machine, the second run changing nothing, backup on collision, what is never overwritten (incl. a hand-edited `extensions/subagent/config.json` and `agents/reviewer.md`), `doctor` exit codes, `--dry-run` writing nothing, a home with a space (the generated hook commands are executed), the gated objective seed, the subagent config and reviewer agent seeded only when absent, and the private rule as a **symlink** — install ✗ with the fix **and exit 1** (dry run too), a summary that does not claim everything is in place, nothing written through the link, doctor ✗ and exit 1, both green again once it is a regular file |
| `tests/settings-merge.test.mjs` | foreign hooks preserved, no duplicates, matcher groups untouched, the tokenizer and parsed matching (`echo bash /tmp/nana-objective.sh` is not an invocation), shape validation making the install a no-op, the lock (none left after a normal run, an existing lock aborting with path + pid + age + the `rm` command, a day-old dead-pid lock still aborting, `--dry-run` unaffected, released on throw, a replacement lock never unlinked), and the post-temp-write re-compare — injected through the real write path, asserting abort + temp removed + the other writer's bytes intact |
| `tests/project-key.test.mjs` | the `<key>` mapping, the over-200 hash form, cross-checked against the real `~/.claude/projects` |
| `tests/shared-memory-hook.test.mjs` | the real bash hook, run with `HOME`/`CLAUDE_PROJECT_DIR` overridden: fail-open, self-heal, both resolution branches, the >200-char hash against the JS reference, a shared-prefix sibling left alone, non-ASCII paths skipping instead of guessing |
| `tests/pi-registration.test.mjs` | "already registered?" across relative, `~`, absolute, worktree-of-the-same-repo and every accepted remote spelling — plus the look-alike remotes that must NOT count. A false negative double-loads every extension; a false positive suppresses a real `pi install` |
| `tests/win32-degrade.test.mjs` | every posix-only step reporting `skipped (win32)`, and the copy path backing up / never writing through a symlink |
| `tests/desk-service.test.mjs` | the plist rendering with resolved values, opt-in, and launchctl never being called from a test |
| `tests/skills-and-standards.test.mjs` | the `requirements` skill and the `claude/rules/nana-standards.md` rule: the frontmatter name and every trigger phrase the description must carry, a fresh machine getting both as symlinks into the repo, idempotence, doctor ✓ or ✗ with the fix named, a **regular directory** already at `~/.claude/skills/requirements` reported with install **exit 1** and the owner's file untouched and nothing backed up into the skills dir, a symlink pointing elsewhere relinked, and the forced win32 branch (a real directory of byte-equal copies, a stale copy caught by doctor and refreshed, a hand-written file backed up beside itself) |
| `tests/project.test.mjs` | `project` on a blank folder (every file, `git init`, the relative `CLAUDE.md` link, the canonical section verbatim), the second run changing no bytes, `<date>`/`<name>` filled while the DRAFT placeholders survive, an existing objective, navigation, or sessions README left untouched, a CLAUDE.md-only folder getting no AGENTS.md, the user-scope postEdit shadow guard, `--dry-run` writing nothing, `--check` exit codes — plus the copier renders: both languages emit the three seeds byte-equal to `templates/_shared` (after `<name>`), and adopt mode does not overwrite a pre-existing `OBJECTIVE.md`. the win32 branch putting a COPY where the symlink would be; a **dangling symlink** and a **directory** at a seed path reported as skipped with nothing written through them **and then read ✗ by `--check`**; a project `--name` full of shell and regex metacharacters (`$(…)`, backticks, `$&`) landing LITERALLY in the files with nothing executed; the `adopt-structure` fallback commands taking the name from an env var rather than command text; the CLAUDE.md alias reading ✓ only when it RESOLVES to this project's AGENTS.md (dangling, `-> missing/AGENTS.md` and a link to another project all ✗, with exit 1); `--check` mirroring setup (inside-a-repo ✓, a deliberately omitted pack config ✓); a **held build lock** reported as such and never as a rebuild (a live lock in a temp knowledge home); and the refresh **deadline** against a stub CLI that traps SIGTERM. The copier half SKIPs loudly (or FAILs under `NANA_SETUP_REQUIRE_COPIER=1`) when `uvx` is not installed |
