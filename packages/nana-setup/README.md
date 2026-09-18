# nana-setup

One command that makes this repo own the **whole** nana experience, not just the pi half.

`pi install` brings the pi extensions, skills and templates. Everything else used to be
hand-maintained dotfiles on one Mac: the Claude Code hooks and rules, the settings wiring, the
two-tier auto-memory, the user-scope pi config, the `pi-review` entry on PATH, and the desk
service. `nana-setup` installs all of that from the repo, and `nana-setup doctor` says, line by
line, whether a machine actually has it.

```bash
node packages/nana-setup/bin/nana-setup.mjs install      # install / repair everything
node packages/nana-setup/bin/nana-setup.mjs doctor       # one ✓/✗ per piece; exits 1 on any ✗
node packages/nana-setup/bin/nana-setup.mjs install --desk   # + the desk launchd service (macOS)
node packages/nana-setup/bin/nana-setup.mjs project ~/my-thing   # make a folder a nana project
```

Runtime dependencies: Node ≥ 22 and nothing else. `install` calls out to `pi` (only to register
the packages, and only when they are not registered yet), to `node` (to build the knowledge
index) and to `launchctl` (only with `--desk`, only on macOS, only against the real home) — each
of those is optional and reports "skipped" with the reason when it is missing.

## What it installs

| Piece | Where | How |
|---|---|---|
| `nana-objective.sh`, `nana-shared-memory.sh`, `context-size-check.sh` | `~/.claude/hooks/` | **symlink** into `claude/hooks/` — a `git pull` updates them |
| `nana-soul.md` (the identity) | `~/.claude/rules/` | **symlink** into `claude/rules/` |
| `nana-personal.md` (private) | `~/.claude/rules/` | **copied from `nana-personal.example.md`, only when absent**, then never touched. It must be a REGULAR file: a symlink there aims your private text at some other file — plausibly one inside this repo, which is how a private rule gets committed — so install prints `✗ private rule is a symlink — replace with a regular file`, the summary refuses to say "everything was already in place", and doctor reads ✗ (lstat, not existsSync) |
| SessionStart + UserPromptSubmit hooks | `~/.claude/settings.json` | merged in: only the missing entries are added, nothing is removed or reordered |
| shared auto-memory | `~/.claude/nana-memory/shared/MEMORY.md` | created when absent |
| per-project `shared` symlink | `~/.claude/projects/<key>/memory/shared` | **no installer step** — the SessionStart hook creates it, per project, per session |
| `nana-pack.json` | `~/.pi/agent/` | seeded **only when absent** |
| `nana-objective.md` | `~/.pi/agent/` | seeded only when `nana-pack.json` was seeded by this run, or its `objective.path` resolves to this file — pointing the objective at a real repo's `OBJECTIVE.md` means no starter file is created |
| knowledge index | `~/.pi/agent/nana-knowledge/index.db` | built when absent (`nana-knowledge build` refreshes it) |
| `pi-review` | `~/.local/bin/pi-review` | symlink to `packages/nana-pack/bin/pi-review.mjs` (`pi install` does no bin linking) |
| desk service | `~/Library/LaunchAgents/com.nana.pi-desk.plist` | opt-in `--desk`; rendered from `launchd/*.tmpl`, loaded with `launchctl bootstrap gui/$UID` |
| pi packages | `~/.pi/agent/settings.json` | `pi install <install root>` — **only when nana-pi is not already registered**. Registration is matched by identity, not by string: `~` expands, relative entries resolve against the pi home (pi's own rule), both sides are realpath'd, and an entry in *another checkout of this repository* counts, because a git worktree and its main clone share one `--git-common-dir`. Remote entries must be pi's own spellings of this exact repo — `git:github.com/j-wanger/nana-pi`, `github:j-wanger/nana-pi`, `https://github.com/j-wanger/nana-pi`, `git@github.com:…`, `ssh://…`, `git://…`, `git+ssh://…`, with an optional `.git` and an optional pinned ref — host, path **and** scheme anchored (`file://` and `http://` are not accepted), so `https://evil.example/archive/j-wanger/nana-pi` is not us |

## `project` — a blank folder becomes a nana project

`install` sets up the MACHINE. It does not give a folder the three files the per-project
mechanisms read: `OBJECTIVE.md` (what session start prints, and what the close scores the
session against), `HANDOFF.md` (the frontier) and `docs/sessions/` (the narrative). Neither did
anything else outside pi — the scaffold and adopt skills only exist inside pi, so a folder used
from Claude Code had no path to them at all. That gap is what `project` closes:

```bash
node packages/nana-setup/bin/nana-setup.mjs project [dir] [--name <n>] [--dry-run]
node packages/nana-setup/bin/nana-setup.mjs project [dir] --check    # ✓/✗ per file; exits 1 on any ✗
```

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

What it will not do is decide your objective. The two `(DRAFT — ratify by editing this line)`
lines are the owner's, and the command says so when it finishes.

**Present means present, not readable.** Every "is it already there?" decision is `lstat`, not
`existsSync`: a **dangling** symlink reads as absent to `existsSync`, and seeding "the missing
file" would write straight through the link to whatever it names. A symlink of any kind, or a
directory, at a seed path is reported `skipped` naming what was found, and nothing is written
through it.

**The refresh cannot hang the command.** It is spawned asynchronously with a parent-side
60 s deadline — SIGTERM, then SIGKILL 2 s later — and reported as `timeout`. `spawnSync`'s own
`timeout` is not a deadline: it signals and then keeps waiting for the child to die, so a build
stuck in an uninterruptible syscall (a hung network or FUSE knowledge root) would hang the
whole command.

**`--check` mirrors the setup decisions.** It never fails a state setup deliberately produced:
a folder inside an existing repo reads ✓ `inside <root> — no nested repo, by design`, and a
`.pi/nana-pack.json` omitted because you have user-scope `postEdit.commands` reads ✓ with that
reason. A check that failed those would send you round a loop re-running a command that
correctly does nothing.

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
  repo ships a placeholder template), `~/.pi/agent/nana-pack.json`, or `~/.pi/agent/nana-objective.md`.
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
- **Never prompts.** `--yes` is accepted for scripts and does nothing.
- **Never touches the live machine under `--home`** — no `pi install`, no `launchctl`. That is
  what makes the tests safe.

## Idempotence

Re-running is the normal case: the second run prints `nothing to do — everything was already in
place`. `--dry-run` reports the same decisions and writes nothing.

**Exit codes.** `install`, `project` and `doctor` all exit **1** when any row is ✗ — something
on disk is wrong and only you can fix it (today: a private rule that is not a regular file).
Exiting 0 there would tell a script the machine is set up when it is not. `--dry-run` reports
the same ✗ and exits 1 with it.

## The two-tier auto-memory, and why there is no per-project step

Claude Code keeps per-project auto-memory under `~/.claude/projects/<key>/memory`. Shared rules
(how to work, who the owner is, external references) live once in `~/.claude/nana-memory/shared`
and are symlinked in as `shared/`.

Linking that per project would mean an installer step per repo, forever. Instead
`nana-shared-memory.sh` does it at session start for whatever project the session is in:

- it prefers the **exact** directory the harness names in `transcript_path` (when that path sits
  directly under `<claude home>/projects`);
- otherwise it derives `<key>` the way Claude Code does — every character outside `[A-Za-z0-9]`
  becomes `-` (verified 2026-09-18 against CLI 2.1.269: `p.replace(/[^a-zA-Z0-9]/g, "-")`, and
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

macOS and Linux install everything except the desk service (launchd is macOS-only). On **win32**
every posix-only step reports `skipped (win32)` instead of failing: the three bash hooks and
their settings entries, the `~/.local/bin` symlink and the desk service. The rules are installed
as copies there (no usable symlink — with the same backup guarantee as everywhere else), and the knowledge hook is wired without the
`NODE_NO_WARNINGS=1` prefix, which `cmd.exe` cannot run. `doctor` marks those lines `·` and does
not fail on them.

## Options

```
--name <n>           project: the project's name  (default: the folder's name)
--check              project: one ✓/✗ line per file; exits 1 on any ✗
--home <dir>         put every user-scope location under <dir> (tests, dry machines)
--claude-home <dir>  the .claude directory        (default ~/.claude)
--pi-home <dir>      the pi agent directory       (default ~/.pi/agent)
--desk               install + load the desk launchd service (macOS, opt-in)
--dry-run            report what would change, write nothing
--yes                accepted for scripts; the installer never prompts
```

## Tests

Zero-dep: `node packages/nana-setup/tests/<file>.test.mjs` (each file exits with its failure
count). Every run installs into `os.tmpdir()` with `--home`, so no test can touch the real
`~/.claude`, `~/.pi`, `~/.local/bin` or LaunchAgents, and none of them loads a launchd service.

Environment switches (tests and CI only):

| Variable | Effect |
|---|---|
| `NANA_SETUP_REQUIRE_COPIER=1` | the copier renders in `project.test.mjs` become a FAILURE instead of a counted `SKIP` when `uvx` is missing — it exists so a machine that cannot render never drops the byte-equality and `_skip_if_exists` invariants silently. **Residual (2026-09-18): this repo has no CI workflow at all** — the only `.github/workflows` here belong to the two project *templates*, and nothing in the repo runs these tests automatically. Until there is one, set this by hand on any machine that is meant to exercise the renders; when a repo workflow is added, the job that runs these tests must install `uv` and set `NANA_SETUP_REQUIRE_COPIER: "1"` |
| `NANA_SETUP_PLATFORM` | forces the win32 branches on a Mac |
| `NANA_SETUP_KNOWLEDGE_CLI` | points the knowledge refresh at a stub binary |
| `NANA_SETUP_KNOWLEDGE_DEADLINE_MS` / `NANA_SETUP_KNOWLEDGE_KILL_GRACE_MS` | shrink the refresh deadline and the SIGTERM→SIGKILL grace so the deadline is testable in under a second |

Every test file prints a `SUMMARY  PASS=… FAIL=… SKIP=…` line; a skipped gate is printed
loudly and counted, never silent.

| File | Covers |
|---|---|
| `install.test.mjs` | a fresh machine, the second run changing nothing, backup on collision, what is never overwritten, `doctor` exit codes, `--dry-run` writing nothing, a home with a space (the generated hook commands are executed), the gated objective seed, and the private rule as a **symlink** — install ✗ with the fix **and exit 1** (dry run too), a summary that does not claim everything is in place, nothing written through the link, doctor ✗ and exit 1, both green again once it is a regular file |
| `settings-merge.test.mjs` | foreign hooks preserved, no duplicates, matcher groups untouched, the tokenizer and parsed matching (`echo bash /tmp/nana-objective.sh` is not an invocation), shape validation making the install a no-op, the lock (none left after a normal run, an existing lock aborting with path + pid + age + the `rm` command, a day-old dead-pid lock still aborting, `--dry-run` unaffected, released on throw, a replacement lock never unlinked), and the post-temp-write re-compare — injected through the real write path, asserting abort + temp removed + the other writer's bytes intact |
| `project-key.test.mjs` | the `<key>` mapping, the over-200 hash form, cross-checked against the real `~/.claude/projects` |
| `shared-memory-hook.test.mjs` | the real bash hook, run with `HOME`/`CLAUDE_PROJECT_DIR` overridden: fail-open, self-heal, both resolution branches, the >200-char hash against the JS reference, a shared-prefix sibling left alone, non-ASCII paths skipping instead of guessing |
| `pi-registration.test.mjs` | "already registered?" across relative, `~`, absolute, worktree-of-the-same-repo and every accepted remote spelling — plus the look-alike remotes that must NOT count. A false negative double-loads every extension; a false positive suppresses a real `pi install` |
| `win32-degrade.test.mjs` | every posix-only step reporting `skipped (win32)`, and the copy path backing up / never writing through a symlink |
| `desk-service.test.mjs` | the plist rendering with resolved values, opt-in, and launchctl never being called from a test |
| `project.test.mjs` | `project` on a blank folder (every file, `git init`, the relative `CLAUDE.md` link, the canonical section verbatim), the second run changing no bytes, `<date>`/`<name>` filled while the DRAFT placeholders survive, an existing OBJECTIVE/AGENTS/sessions README left untouched, a CLAUDE.md-only folder getting no AGENTS.md, the user-scope postEdit shadow guard, `--dry-run` writing nothing, `--check` exit codes — plus the copier renders: both languages emit the three seeds byte-equal to `templates/_shared` (after `<name>`), and adopt mode does not overwrite a pre-existing `OBJECTIVE.md`. the win32 branch putting a COPY where the symlink would be; a **dangling symlink** and a **directory** at a seed path reported as skipped with nothing written through them **and then read ✗ by `--check`**; a project `--name` full of shell and regex metacharacters (`$(…)`, backticks, `$&`) landing LITERALLY in the files with nothing executed; the `adopt-structure` fallback commands taking the name from an env var rather than command text; the CLAUDE.md alias reading ✓ only when it RESOLVES to this project's AGENTS.md (dangling, `-> missing/AGENTS.md` and a link to another project all ✗, with exit 1); `--check` mirroring setup (inside-a-repo ✓, a deliberately omitted pack config ✓); a **held build lock** reported as such and never as a rebuild (a live lock in a temp knowledge home); and the refresh **deadline** against a stub CLI that traps SIGTERM. The copier half SKIPs loudly (or FAILs under `NANA_SETUP_REQUIRE_COPIER=1`) when `uvx` is not installed |
