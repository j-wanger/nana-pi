# nana-setup

One command that installs nana setup surfaces outside pi.

`pi install` brings the pi extensions, skills and templates. Everything else used to be
hand-maintained dotfiles on one Mac: the Claude Code hooks and rules, the settings wiring, the
two-tier auto-memory, the user-scope pi config, and the PATH entries for `pi-review`, `pi-worker`, `nana-land`, `nana-setup`, `nana-writing` and `nana-knowledge`. `nana-setup` installs the supported surfaces from the repo, and `nana-setup doctor` reports their state. A bare `uvx copier copy` route keeps its seeded DRAFT objective lines; only the skills ask the owner to ratify both lines.

```bash
node packages/nana-setup/bin/nana-setup.mjs install      # install / repair everything
node packages/nana-setup/bin/nana-setup.mjs doctor       # one ✓ or ✗ per piece; exits 1 on any ✗ or !
node packages/nana-setup/bin/nana-setup.mjs project ~/my-thing   # make a folder a nana project
node packages/nana-setup/bin/nana-setup.mjs trust ~/my-thing --yes # record pi project trust after confirmation
```

Runtime dependencies: **Node ≥ 22.18** and the globally installed `@earendil-works/pi-coding-agent` package (used for pi's exported project-trust API). The floor is set by the installed
`claude/hooks/nana-objective.mjs` hook, which runs `packages/nana-pack/bin/nana-objective.mjs` and
then the bounded `packages/nana-pack/bin/nana-frontier-summary.mjs` producer under their shared
output budget; the objective CLI imports `../nana-pack/lib/objective.ts` with no flag, relying on Node's built-in TypeScript stripping (default from
22.18). The rm guard also imports TypeScript and gives no decision without type stripping (before 22.18).
On an older Node the objective hook prints `OBJECTIVE UNAVAILABLE: Node <v> is older than 22.18 …`
instead of the objective, and `doctor`'s
`node for the objective hook` line reads ✗. `install` calls out to `pi` (only to register
the packages, and only when they are not registered yet). On Windows it finds the first supported
`pi.com`, `.exe`, `.bat` or `.cmd` on PATH, respecting PATH-folder and PATHEXT order. An npm
`pi.cmd` starts its package's Node entry; any other `.cmd` or `.bat` runs through ComSpec. A missing pi is skipped with the install hint. A found pi whose version
probe fails is a problem and makes install exit 1. On macOS/Linux, a `pi` whose interpreter is missing
still reports “not on PATH” because the OS gives the same error. On POSIX the existing PATH lookup remains.
Install also calls `node` to build the knowledge index.

A session-start producer still running at the launcher's 2,500 ms cap is stopped, and its unavailable line prints instead. A hook's producers end by 4,000 ms on the hook's own process clock, leaving 1,000 ms for process start and exit within Claude Code's 5 s limit. A producer in a wait no signal ends, such as a hung network mount, is not stopped, and Claude Code's limit then drops the hook's output.

## What it installs

| Piece | Where | How |
|---|---|---|
| `claude/hooks/nana-objective.mjs`, `claude/hooks/nana-adoption.mjs`, `claude/hooks/nana-shared-memory.mjs`, `claude/hooks/nana-roster-notice.mjs`, `claude/hooks/nana-rm-guard.mjs` | `~/.claude/hooks/` | **symlink** into `claude/hooks/` on POSIX — a `git pull` updates them |
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
| SessionStart and Bash PreToolUse hooks (retired prompt, session-end and verifier cleanup) | `~/.claude/settings.json` | missing active entries are added without reordering foreign entries; exact managed legacy SessionStart bash entries are migrated in place. Retired script invocations outside those exact entries are preserved and doctor reports them as problems. Install removes only the exact managed tilde form and released quoted absolute-path form for the retired context-size hook; variants are preserved. The Claude Code knowledge hook is retired (#342); use `nana-knowledge query`. Install removes only complete installer-shaped knowledge entries in shell or exec form, including quoted paths with spaces, and drops a matcher group only when that removal empties it. Doctor reports remaining knowledge wiring as a retired-hook failure until install removes it. Customized commands—including environment prefixes, interpreters, or arguments—are preserved as complete entries. The verifier hook is retired. Install removes complete installer-shaped shell and exec verifier entries and owned hook links; doctor names remaining wiring with `nana-setup install` as the fix. Foreign siblings and customized entries stay unchanged. The pi gate's shared predicate remains active. On native Windows (Claude Code ≥ 2.1.139), setup wires every hook entry in exec form instead — `"command": "node"` plus an `args` array Claude Code spawns directly with no shell — naming the checkout's own active scripts under `packages/nana-setup/claude/hooks/` with no path quoted, escaped or refused; an installer-shaped entry whose script no longer resolves inside the checkout, in either form, is replaced in place the next time install runs — a hand-written entry naming a different, customized target is left untouched. Windows also repairs the POSIX installer's active shell-form hook entries to exec form in place.
| shared auto-memory | `~/.claude/nana-memory/shared/MEMORY.md` | created when absent |
| per-project `shared` symlink | `~/.claude/projects/<key>/memory/shared` | **no installer step** — the SessionStart hook creates it, per project, per session |
| `nana-pack.json` | the pi agent dir (`PI_CODING_AGENT_DIR`, else `~/.pi/agent/`) | seeded **only when absent** |
| `nana-objective.md` | the pi agent dir | seeded only when `nana-pack.json` was seeded by this run, or its `objective.path` resolves to this file — pointing the objective at a real repo's `OBJECTIVE.md` means no starter file is created; an empty or non-string `objective.path` resolves to this file too, and doctor reads ✗ naming the value when it is present and neither a string nor null |
| knowledge index | `~/.pi/agent/nana-knowledge/index.db` (under `--pi-home` / `--home` when given) — **not** under an ambient `PI_CODING_AGENT_DIR` | built when absent (`nana-knowledge build` refreshes it); doctor opens read-only and counts rows from the expected `docs` table, shows the `built_at` age, and reports a `knowledge sources` row for absent or broken `sources.json`; a corrupt or wrong-schema database reads ✗. The knowledge runtime reads `NANA_KNOWLEDGE_HOME` or `~/.pi/agent/nana-knowledge` and never `PI_CODING_AGENT_DIR`, so following that variable here built an index nothing read; moving knowledge storage needs a deliberate cross-runtime contract, which this installer does not make on its own |
| `pi-review` | `~/.local/bin/pi-review` | POSIX symlink to `packages/nana-pack/bin/pi-review.mjs`; Windows extensionless sh and `.cmd` shims. Doctor checks both Windows files and whether the first `pi-review` on PATH is this checkout's `.cmd` shim. |
| `pi-worker` | `~/.local/bin/pi-worker` | POSIX symlink to `packages/nana-pack/bin/pi-worker.mjs`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| `nana-land` | `~/.local/bin/nana-land` | POSIX symlink to `packages/nana-pack/bin/nana-land.mjs`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| `nana-setup` | `~/.local/bin/nana-setup` | POSIX symlink to `packages/nana-setup/bin/nana-setup.mjs`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| `nana-writing` | `~/.local/bin/nana-writing` | POSIX symlink to the executable `packages/nana-pack/bin/nana-writing.mjs`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| `nana-knowledge` | `~/.local/bin/nana-knowledge` | POSIX symlink to `packages/nana-knowledge/bin/nana-knowledge.ts`; Windows extensionless sh and `.cmd` shims; doctor checks both. |
| pi packages | `settings.json` in the pi agent dir | Registration is complete only when every extension directory in the root `package.json` manifest is loaded. A root entry covers both manifests; per-package entries cover their own manifest. Install adds only missing per-package entries, never a root entry atop existing package entries. `install --dry-run` reports decisions made before the first `pi install`, otherwise reports what it would add, and starts no `pi install`. Paths use pi's matching rules (`~`, settings-relative paths, real paths and linked-worktree identity); exact remote entries are also recognized. On Windows, setup and doctor use the first supported external pi on PATH, not PowerShell aliases/functions or a working-directory command; `.cmd`/`.bat` paths or arguments containing `%`, `!`, a quote, line break or NUL, or an argument ending in backslash are refused for manual registration. Doctor reports the version under the same launch rules. Doctor's separate `pi package source` row reports whether the registered source is the checkout supplying hooks and rules. |
| git pre-push leak scan | Git's pre-push hook in the main checkout | a marked `#!/bin/sh` shim that runs `packages/nana-pack/bin/leak-scan.mjs --pre-push` on every push, including pushes from linked worktrees; written for this checkout by default, and under `--home`, `--claude-home` or `--pi-home` only when `--repository <dir>` names a checkout. A foreign hook or a set `core.hooksPath` is left alone and reported skipped; an install run from a linked worktree also skips it |

The pack no longer supplies per-edit checks, compaction-summary production or desktop notifications. Adoption journaling and pi's gate remain. Legacy `postEdit` and `handoff` configuration is accepted and ignored.

**Agent deletion guard (Claude Code ≥ 2.1.317):** Bash PreToolUse `claude/hooks/nana-rm-guard.mjs` acts only on input carrying `agent_id`, from either a subagent or workflow agent. The main session gets no decision. It reuses `packages/nana-pack/lib/gate-rm-outside.ts` in strict mode: no temp exemptions; outside-folder and unresolved `rm`, `rmdir`, `unlink`, `find … -delete`, find exec actions (`-exec`, `-execdir`, `-ok`, `-okdir`) running `rm`, `rmdir` or `unlink` and `git clean` targets deny. The find exec forms judge the start folders, like `-delete`. Literal relative, dot-relative and absolute inside-folder targets get no decision. For direct `rm`, `rmdir` and `unlink`, final-part globs (`*?[]`) and brace groups such as `{build,out}` also get no decision when their literal prefix resolves inside cwd, following links. Such expansions must have no `..`, no trailing slash and no brace group containing `/`. Plain deletes beside complex commands resolve their targets normally. Variables, other globs or braces, substitutions containing deletes, nested shell deletes, unknown xargs input, parent steps and ambiguous Git options deny conservatively. The agent must leave the target and report its path and why deletion is needed to the seat; the seat approves by running the delete itself. On malformed input or internal failure the hook exits 0, emits no decision and writes one stderr line. This is a best-effort literal-command guard, not a sandbox: aliases, shell startup code, inline interpreter deletes, later script calls, `rsync --delete`, `shred -u`, `git worktree remove` and filesystem races are outside its scope. The PowerShell tool is not matched. Older Claude Code without `agent_id` cannot distinguish builders and gets no decision.

**Verifier-pipe guard (pi only):** the pi gate prompts when a masked pipeline's status reaches a commit without earlier active `pipefail`. Earlier live Bash text also prompts when it contains `errexit` anywhere, in any case and even inside a longer word, or contains a `set` word at any position followed within the same simple command—before the next `;`, `&`, `|`, newline or closing bracket—by an option word made of `-` and letters including `e`. A later `set +e` or `set +o errexit` never turns that text flag off, and `+o errexit` itself counts as enabling. Without earlier Bash errexit text, a `;` or a newline that discards the status does not prompt; `git.exe` and path spellings count as git. This is a best-effort text check: a pipeline or commit not present in the literal command text and reached through a later call is not matched; the sandbox is the boundary. Claude Code has no nana verifier hook.

The memory factory was cut on 2026-11-09. Install removes its managed session-end entry
and installed hook link; doctor names old wiring with `nana-setup install` as the fix.
The owner profile store stays.

The shared-memory SessionStart hook writes its unchanged index before dynamically loading the pack's context logger. It appends one versioned line to `nana-context-loads.jsonl` in pi's active agent dir, recording session, working folder, full/printed chars and entry filenames printed whole, shortened or omitted. It logs no memory contents. An unavailable module, append failure, cwd-relative agent dir or log inside a git worktree prints one stderr reason and cannot cost the index. Shell and hook environments with different `PI_CODING_AGENT_DIR` values split the log. There is no rotation or reader yet.

## Updating

### Update nana-pi

1. Update the source with `git -C <clone> pull --ff-only`. On the machine whose main branch is the live install, landing the change is the update.
2. Run `node packages/nana-setup/bin/nana-setup.mjs install`.
3. Run `node packages/nana-setup/bin/nana-setup.mjs doctor`.

Session starts report unhealthy installed hook links, hook settings, rules, skills and pi rulings, and tell the session to run this checkout's install command. Run `nana-setup project --check` on demand to report an adopted project's objective, frontier, session-log and navigation file health. When install refuses a skill path, the line first asks the user to move that existing path aside; when a linked Claude home or skills folder causes the refusal, it names that linked folder instead. Doctor's ✗ skill rows name the same linked folder, and its final line lists them as a fix by hand when install's dry run completes. Under a linked Claude home or skills folder, doctor's legacy enforcement-flag and scaffolder rows name the linked folder and every present path to move out of the way by hand, because install will not back these up through that folder. Install refuses before any write when the Claude folder, its rules or shared-memory folder, the shared-memory folder's parent, or off Windows its hooks folder is a link whose target cannot be reached. The refusal names the link to move aside, and doctor's final line names that refusal.

Upgrade pi itself with `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.4.0 --before=2026-10-23T18:35:54Z`. To stay at the supported floor, use `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.3 --before=2026-10-05T08:40:00Z`. Pi 1.0.3 through 1.2.0 needs a cutoff from before the next pi release; doctor's `pi dependencies` row reports scoped dependencies installed newer than pi. Both commands are tested in the root CI workflow. Never run targetless `pi update`, `pi update --all` or `pi update --self`; `pi update <source>` and `pi update --extensions` update packages only.

## Retired delegation seeds

Setup no longer seeds `extensions/subagent/config.json` or `agents/reviewer.md`. Install removes only regular files byte-identical to the historical seeds retained under `pi/retired/`. Edited files, including marked ones, foreign files and symlinks remain untouched. Dry runs make no changes. Doctor has no delegation-runtime rows, and the install check neither installs that runtime nor retries its installation.

- Registration: `packageCoverage` recognises string `packages` entries only. An object-form entry (pi's resource filter) reads as unregistered, doctor reads ✗, and install would run `pi install` again.

## Pi dependencies and mcp.json — read-only checks

Limits recorded at landing (2026-10-04):

- pi-mcp-adapter was removed from this machine on 2026-10-05. While it was installed, pi did not read mcp.json directly (pi 1.0.2 docs, mcp.md), and doctor never detected the adapter, so its `!` stayed moot the whole time it was present.

`doctor` also reads pi's installed scoped dependencies and pi's own MCP config; install never writes them.

- **`pi dependencies` after `pi executable`** — follows the `pi` on PATH to its package and reads only that package's scoped `dependencies`. It reads ✓ when every installed version is at or below pi's own version, ✗ with the shared pi install hint when any is newer, and · when the package or an exact three-part version cannot be read. The `pi packages` row remains nana-pi registration.
- **`pi mcp.json`** — WHERE `~/.pi/agent/mcp.json` (or your chosen pi agent dir's copy) exists,
  `doctor` reads `!` when any configured server has no `exposure` key while `autoEnableCodemode` is
  not `false`: that server's tools default to pi's `codemode` exposure the moment it connects, and
  `nana-setup` never edits this file for you. Give the server an explicit `exposure`, or set
  `"autoEnableCodemode": false` beside `mcpServers`, to clear it. Absent entirely, this line is
  skipped — not everyone configures an MCP server.

## `project` — a blank folder becomes a nana project

`install` sets up the MACHINE. It does not give a folder the three files the per-project
mechanisms read: `OBJECTIVE.md` (what session start prints, and what the close scores the
session against), `HANDOFF.md` (the frontier) and `<project>/docs/sessions/` (the generated project's narrative). Neither did
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

`dir` defaults to the current directory, the name to its basename. Seed steps are idempotent and never overwrite existing files. The exception is the explicitly marked working section in a regular `AGENTS.md`: `project` refreshes only the bytes between exactly one ordered pair of `<!-- nana:working-under-nana-pi begin -->` / `<!-- nana:working-under-nana-pi end -->` markers. It never guesses the bounds of an unmarked copy. Add the two markers around that section once; malformed pairs and symlinked `AGENTS.md` files are reported and left alone. `--dry-run` reports the refresh without writing. A second run with a current section reports `unchanged`. Run `nana-setup project --check` on demand to check project files and the working section, with project-fixable and by-hand remedies kept distinct.

| Step | What | When it is skipped |
|---|---|---|
| `git init` | only when the folder is not already a repo | a folder INSIDE another repo is left alone — a nested repo hides every file from the outer one |
| `OBJECTIVE.md`, `HANDOFF.md`, `docs/sessions/README.md` | copied from `templates/_shared/`, with `<date>` filled with today and `<name>` with the project name | any one of them that already exists |
| `docs/sessions/<YYYY-MM>.md` | this month's log, header only | it already exists |
| `AGENTS.md` + a one-line `CLAUDE.md` import (`@AGENTS.md`, every platform) | a lean stub — name, empty `Layout` and `Rules that don't move`, then the canonical `Working under nana-pi` section inside the exact nana markers | a new stub is created only when neither navigation file exists; an existing regular `AGENTS.md` has only its valid marked region refreshed. Unmarked, malformed, or symlinked files are left alone and reported |
| `.pi/nana-pack.json` | not seeded; project setup needs no pack config | any existing file stays byte-for-byte unchanged; legacy `postEdit` blocks are ignored |
| `nana-knowledge build` | refreshes the index so the new repo's docs are findable by explicit search | when there is no index yet — run `install` first; when another build **holds the lock** (that CLI exits 0 on a held lock so the prompt hook never fails, so the lock message on stderr is the only evidence — reported `skipped (build lock held)`, never "rebuilt"); and on the **60 s deadline** |

The three seeds have ONE source, `templates/_shared/`, and three consumers: this command, the
copier templates (both languages `include` them, and `_skip_if_exists` keeps adopt mode from
overwriting a real one) and the `adopt-structure` skill. So a scaffolded, an adopted and a
hand-made project read identically. `<date>` is left literal in the rendered template on
purpose — copier has no date variable — and is filled by this command or by the skill. Project
names land literally, including `<date>`, `<name>`, replacement tokens, backticks and shell-looking
text; placeholder-looking text inside a name is not filled again.

**Trust is yours to decide, too.** Any project `.pi/nana-pack.json` is ignored until you decide this folder's trust. Run
`nana-setup trust <dir>` and confirm interactively, or pass `--yes` in a script. The command
records through pi's own `ProjectTrustStore` and prints the store path. `pi -a` / `--approve`
trusts one run only; it is not a recorded decision.
Trust loads pi's store from the pi package in npm's global folder (`npm root -g`). When it is
missing there or has no `ProjectTrustStore`, trust exits 2 with one line naming the path it
tried and the pi install command. A pi installed by another package manager is not found there.

`project` and every scaffold and adopt completion message name the first two steps: ratify the
seeded `OBJECTIVE.md`, then run `nana-setup trust <dir>`. Scaffold and adopt messages also say
to fill the date; project setup already fills it. What the tool will not do is decide your objective.

**Present means present, not readable.** Every "is it already there?" decision about a file this
installer WRITES is `lstat`, not `existsSync`: a **dangling** symlink reads as absent to
`existsSync`, and seeding "the missing file" would write straight through the link to whatever it
names. (The step that only asks whether something OTHER than a seed exists — the knowledge
index — and `doctor`'s presence rows for the memory index and the objective
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

Doctor's `pi executable` row checks `pi --version` and names the shared install hint on failure. The next `pi dependencies` row follows that executable's package and reports scoped dependencies installed newer than pi. The `pi packages` row checks nana-pi registration. `PATH resolves pi-review` checks the first executable match on PATH. `pi package source` compares registered package trees with the checkout supplying hooks and rules. Doctor mutes exactly the SQLite ExperimentalWarning and MODULE_TYPELESS_PACKAGE_JSON warning and prints every other Node warning.

Install's dry run decides which ✗ rows doctor's last line gives to `nana-setup install`, and doctor lists the rest by hand. `PATH resolves pi-review` goes to install when the bin folder is already on PATH and no earlier PATH entry holds a pi-review; otherwise doctor lists it by hand. The dry run writes nothing. When install refuses the home, doctor prints `<n> missing — nana-setup install will not run until this is fixed: <first refusal line>`.

Doctor's `release status` row is informational (·). It reports `template changes since <tag>` or `no template change since <tag>` from the tree difference on templates/ and copier.yml between the highest plain vX.Y.Z tag and main, and compares main with origin/main as of the last fetch. It never fetches; the owner decides when to tag and push. The shared reader exports `selectReleaseTag` and `releaseSurfaceDiff` for release gates.

## What it never does

- **Never overwrites** `~/.claude/rules/nana-personal.md`, `nana-pack.json` or `nana-objective.md`; each is seeded only when absent. It never edits `mcp.json`.
- **Never removes or reorders** foreign `settings.json` hook entries. It removes only installer-shaped retired entries and, on Windows, rewrites its own shell-form entries to exec form. A hook counts as installed only when its command, parsed with shell quoting, plainly runs the script; such a command stays as written even when hand-edited, and anything else reads as not installed.
- **Never half-writes `settings.json`.** Preflight parses the file and checks its shape before anything moves. Install then holds `~/.claude/.settings.json.nana-setup.lock` from its first write through the PATH entries, and a second install exits 2. A leftover lock stops the next run before it writes: the run prints the lock's path, pid and age and the commands that remove it, and doctor's `settings lock` row repeats them. Nothing removes a lock automatically.
- **Never writes through a symlink or destroys a file it replaces.** A regular file where a link belongs is renamed to `<name>.bak-<YYYYMMDD>` first.
- **Never prompts during install or project setup, and never touches the live machine under `--home`** unless `--repository` names a checkout: no `pi install`, and `trust` refuses an explicit `--pi-home` outside the supplied `--home`.

## Idempotence

Re-running install is the normal case: the second run prints `nothing to do — everything was already in place`. `install --dry-run` reports the same decisions and writes nothing, but it cannot foresee a failing `pi install`. Install, its dry run and doctor stop a pi launch at the limits `PI_LAUNCH_LIMITS_MS` sets in `lib/steps.mjs`. `install`, `project` and `doctor` exit 1 on any ✗ row; doctor also exits 1 on a `!` row and then never says "all good".

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

Support: macOS tested; lanes wait for selected Windows tests; the full Windows suite runs on main, and red main blocks lands; Linux and Windows run in hosted CI, where the Windows suite leg blocks release and the Linux suite leg does not; Linux has no recorded machine install; on Windows the Claude Code hooks run from the checkout and need Claude Code 2.1.139 or later, the pack's PATH commands are shims that need the bin folder on PATH, and the review and builder launchers run through node from the checkout with an npm-installed pi.

On native Windows, nana-setup wires every Claude Code hook entry in exec form from the checkout, needing Claude Code 2.1.139 or later to run at all. Windows gets no hook file copy, so install and doctor list each hook only by its settings row. It writes extensionless sh and `.cmd` launchers for the six PATH commands; `~/.local/bin` is not on the Windows user Path by default, so add it through Environment Variables before bare names resolve.

Known launcher limits match ordinary `.cmd` behavior. Windows PowerShell 5.1 drops an empty argument and breaks a spaced argument ending in `\\`. cmd.exe changes an unspaced argument containing `& | < > ^ ( )`, an embedded double quote, or a defined `%NAME%`. Use Git Bash or the node form for those values. Git Bash rewrites `/`-shaped arguments before native Node receives them. The shim names a same-drive bin relative to `%dp0%` because cmd.exe reads a `.cmd` file in the console code page. On the hosted Windows runner under code page 437, a same-drive absolute bin path containing `é` misread that letter and failed to start the bin. A bin on another drive still needs the absolute form and is therefore inferred to fail when its path contains characters outside the active console code page; doctor still reads the rendered shim ✓. The shim resolves `node.exe` only through PATH because a bare `node` searches the caller's folder first. No `.ps1` shim is written because the default Restricted policy would reject it instead of falling back to `.cmd`. Node must remain on PATH at run time. A changed shim is preserved under a dated backup during repair.

On Windows all five runtime-neutral Claude Code skills are mirrored as managed copies, not links. Each copy carries `.nana-setup-copy`; install refreshes a shipped file without a backup when it still matches the last installed bytes, and backs up an owner-edited or unrecorded file while preserving owner-added files. A real directory at any managed skill path that nana-setup did not make is refused and left untouched, the same as macOS; install exits 1 naming it and doctor reads ✗. Doctor also refuses a regular file, symlink or junction at a Windows skill path and names the path type.

## Usage and options

```
--repository <dir>   install: the main checkout that gets the pre-push hook (default: this checkout; omitted under --home, --claude-home or --pi-home unless named)
--name <n>           project: the project's name  (default: the folder's name)
--check              project: one ✓ or ✗ line per file; exits 1 on any ✗
--home <dir>         put every user-scope location under <dir> (tests, dry machines)
--claude-home <dir>  the .claude directory        (default: CLAUDE_CONFIG_DIR, else ~/.claude)
--pi-home <dir>      the pi agent directory       (default: PI_CODING_AGENT_DIR, else ~/.pi/agent)
--dry-run            report changes without writing
--yes                trust: record without prompting; install never prompts
```

A **relative** ambient `PI_CODING_AGENT_DIR` is resolved by each pi against its own start folder,
so a directory derived from setup's cwd is not the one pi reads elsewhere: `install`, `project`
and `project --check` all refuse it (exit 2, naming the resolved dir, before anything is read or
written — `project` reads the user-scope config to decide what to write) until you pass
`--pi-home <absolute dir>` or set an absolute value, and `doctor` prints a `!` line naming the cwd it resolved against and never says "all good"
(exit 1). An explicit `--pi-home`, relative or not, is your decision and is used as given.

An absolute `CLAUDE_CONFIG_DIR` is honoured when neither `--claude-home` nor `--home` is given. A relative value makes install exit 2 before writing, and doctor names that refusal in its summary. An empty value counts as unset. The two flags always win over the variable.

## Install check

Run `node packages/nana-setup/bin/install-check.mjs` from the repository root. The check installs nana into a temporary home, registers the checked-out pi extensions, starts a pi RPC session, runs one scripted pi turn, runs one offline review through each installed pi-review launcher against a throwaway repository, simulates Claude Code hook dispatch, and runs doctor. After doctor it starts one offline lane build through each installed pi-worker launcher, in its own linked worktree of that throwaway repository. The scripted turn, reviews and builds use local test models: they make no network request and call no real model. Before the builds, the check points the temporary home's roster builder at the test model and lists the review fixture in pi's user settings. Its child processes receive the temporary home and temporary/cache folders; the sanitized base environment removes `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, `CLAUDE_CONFIG_DIR`, nana's override variables and caller npm configuration. Each build adds only `PI_OFFLINE=1`. The check does not install nana into the caller's real home. The check depends on Node, Git and the installed pi; it needs no delegation-package download.

After doctor, macOS and Windows also rehearse the root README's platform fresh-machine checklist as written and print one `readme checklist` result line. Each step's commands are the backticked spans that directly follow `Run ` or `then `, joined with ` && ` and run from a second home (`readme-home`, inside the install-check home, never reused). macOS uses one `/bin/zsh -l -c` call. Windows uses one verbatim `cmd.exe /d /v:off /s /c "<joined>"` call. Linux runs neither rehearsal shell and prints no `readme checklist` line.

The rehearsal environment removes `ZDOTDIR`, redirects the package.json repository URL to the checkout and allows file-only git transport. Its npm global prefix is inside the second home: macOS puts the prefix's `bin` folder before the caller's PATH, while Windows puts the prefix itself, the home's `.local\bin` folder and the caller's Path in that order, joined with literal `;`. The Windows bin entry stands in for checklist step 5, which writes the user Path and cannot run inside the temporary process environment. Step 2's pi install runs for real over the network into that prefix. `nana-setup trust ` commands get `--yes` appended because no terminal can answer the prompt; every other command runs as written. `readme checklist` is FAIL unless some step names both commands and expected text and every command step exits 0 within its sealed timeout with its expected text in stdout. It names the first failing step and command, or the missing expectation.

On FAIL, the check prints the settings hooks block after the result lines. The pi session fails on an extension error or an unavailable notice, widget or status. The adoption hook fails on a stale-install or stale-check-unavailable line. A pi-review run fails on a timeout, launch or exit failure, a missing or non-LAND final verdict, a missing single LAND tally for its item, or a fixture record missing the whole review standard, run token or reviewer role. A pi-worker run fails on a timeout, launch or exit failure, wrong final answer and verdict lines, missing rendered preamble, brief or worker role, an unexpected writing tag, a missing or wrong build-record pair, or a wrong or unreleased lane lock. A failed build line names pi-worker's refusal or pi's own first error line. The review and build ledgers belong to the temporary home, not the caller's home. The scripted turn covers pi's objective, rulings, seat-guide and writing prompt injections without requiring knowledge messages, nana-gate blocking the Bash verifier sample, and a successful file write. On Windows the turn enables pi's PowerShell tool, and nana-gate must block the PowerShell verifier sample. It does not cover the UI confirmation path. The check proves that the documented installation and selected installed hooks run in this fixture on the current runner. It does not start Claude Code or prove the result on every machine. Installed Windows hooks run directly in exec form (`node` with arguments, no shell). A Windows green result is not a substitute for a rehearsal on the owner's Windows machine.

## Tests

Run one file with `node packages/nana-setup/tests/<file>.test.mjs`; it exits nonzero on any failure. Every test runs in a fresh home under the system temp folder, so no test touches the real `~/.claude`, `~/.pi` or `~/.local/bin`. Root CI sets `NANA_TEST_REQUIRE_COPIER=1`, which turns the copier renders in `tests/project.test.mjs` from a counted skip into a failure when `uvx` is missing.
