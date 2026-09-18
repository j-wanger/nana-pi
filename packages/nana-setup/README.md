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
| `nana-personal.md` (private) | `~/.claude/rules/` | **copied from `nana-personal.example.md`, only when absent**, then never touched |
| SessionStart + UserPromptSubmit hooks | `~/.claude/settings.json` | merged in: only the missing entries are added, nothing is removed or reordered |
| shared auto-memory | `~/.claude/nana-memory/shared/MEMORY.md` | created when absent |
| per-project `shared` symlink | `~/.claude/projects/<key>/memory/shared` | **no installer step** — the SessionStart hook creates it, per project, per session |
| `nana-pack.json` | `~/.pi/agent/` | seeded **only when absent** |
| `nana-objective.md` | `~/.pi/agent/` | seeded only when `nana-pack.json` was seeded by this run, or its `objective.path` resolves to this file — pointing the objective at a real repo's `OBJECTIVE.md` means no starter file is created |
| knowledge index | `~/.pi/agent/nana-knowledge/index.db` | built when absent (`nana-knowledge build` refreshes it) |
| `pi-review` | `~/.local/bin/pi-review` | symlink to `packages/nana-pack/bin/pi-review.mjs` (`pi install` does no bin linking) |
| desk service | `~/Library/LaunchAgents/com.nana.pi-desk.plist` | opt-in `--desk`; rendered from `launchd/*.tmpl`, loaded with `launchctl bootstrap gui/$UID` |
| pi packages | `~/.pi/agent/settings.json` | `pi install <install root>` — **only when nana-pi is not already registered**. Registration is matched by identity, not by string: `~` expands, relative entries resolve against the pi home (pi's own rule), both sides are realpath'd, and an entry in *another checkout of this repository* counts, because a git worktree and its main clone share one `--git-common-dir`. Remote entries must be pi's own spellings of this exact repo — `git:github.com/j-wanger/nana-pi`, `github:j-wanger/nana-pi`, `https://github.com/j-wanger/nana-pi`, `git@github.com:…`, `ssh://…`, `git://…`, `git+ssh://…`, with an optional `.git` and an optional pinned ref — host, path **and** scheme anchored (`file://` and `http://` are not accepted), so `https://evil.example/archive/j-wanger/nana-pi` is not us |

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

| File | Covers |
|---|---|
| `install.test.mjs` | a fresh machine, the second run changing nothing, backup on collision, what is never overwritten, `doctor` exit codes, `--dry-run` writing nothing, a home with a space (the generated hook commands are executed), the gated objective seed |
| `settings-merge.test.mjs` | foreign hooks preserved, no duplicates, matcher groups untouched, the tokenizer and parsed matching (`echo bash /tmp/nana-objective.sh` is not an invocation), shape validation making the install a no-op, the lock (none left after a normal run, an existing lock aborting with path + pid + age + the `rm` command, a day-old dead-pid lock still aborting, `--dry-run` unaffected, released on throw, a replacement lock never unlinked), and the post-temp-write re-compare — injected through the real write path, asserting abort + temp removed + the other writer's bytes intact |
| `project-key.test.mjs` | the `<key>` mapping, the over-200 hash form, cross-checked against the real `~/.claude/projects` |
| `shared-memory-hook.test.mjs` | the real bash hook, run with `HOME`/`CLAUDE_PROJECT_DIR` overridden: fail-open, self-heal, both resolution branches, the >200-char hash against the JS reference, a shared-prefix sibling left alone, non-ASCII paths skipping instead of guessing |
| `pi-registration.test.mjs` | "already registered?" across relative, `~`, absolute, worktree-of-the-same-repo and every accepted remote spelling — plus the look-alike remotes that must NOT count. A false negative double-loads every extension; a false positive suppresses a real `pi install` |
| `win32-degrade.test.mjs` | every posix-only step reporting `skipped (win32)`, and the copy path backing up / never writing through a symlink |
| `desk-service.test.mjs` | the plist rendering with resolved values, opt-in, and launchctl never being called from a test |
