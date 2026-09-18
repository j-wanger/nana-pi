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
| `nana-pack.json`, `nana-objective.md` | `~/.pi/agent/` | seeded **only when absent** |
| knowledge index | `~/.pi/agent/nana-knowledge/index.db` | built when absent (`nana-knowledge build` refreshes it) |
| `pi-review` | `~/.local/bin/pi-review` | symlink to `packages/nana-pack/bin/pi-review.mjs` (`pi install` does no bin linking) |
| desk service | `~/Library/LaunchAgents/com.nana.pi-desk.plist` | opt-in `--desk`; rendered from `launchd/*.tmpl`, loaded with `launchctl bootstrap gui/$UID` |
| pi packages | `~/.pi/agent/settings.json` | `pi install <install root>` — **only when nana-pi is not already registered** |

## What it never does

- **Never overwrites** `~/.claude/rules/nana-personal.md` (private, and never in this repo — the
  repo ships a placeholder template), `~/.pi/agent/nana-pack.json`, or `~/.pi/agent/nana-objective.md`.
- **Never removes or reorders** anything in `settings.json`. A hook counts as present when any
  command on that event contains its marker substring, so a hand-edited command (a `~` path, an
  extra env var) is left exactly as it is. A `settings.json` it cannot parse **aborts the whole
  install before anything on disk moves**.
- **Never destroys a file it replaces.** A regular file where a symlink belongs is renamed to
  `<name>.bak-<YYYYMMDD>` first, and the backup is named in the output.
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
  beyond 200 characters truncated to 200 with a `-<hash>` suffix, which the hook matches by glob
  rather than recomputing);
- then it creates the memory dir and the `shared` symlink if they are missing, and prints the
  index.

So a brand-new repo links itself on its first session. `/Users/jwang/aml-desk` →
`-Users-jwang-aml-desk`; `/Users/jwang/.nana-worktrees/x` → `-Users-jwang--nana-worktrees-x`.

## Platforms

macOS and Linux install everything except the desk service (launchd is macOS-only). On **win32**
every posix-only step reports `skipped (win32)` instead of failing: the three bash hooks and
their settings entries, the `~/.local/bin` symlink and the desk service. The rules are installed
as copies there (no usable symlink), and the knowledge hook is wired without the
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
| `install.test.mjs` | a fresh machine, the second run changing nothing, backup on collision, what is never overwritten, `doctor` exit codes, `--dry-run` writing nothing |
| `settings-merge.test.mjs` | foreign hooks preserved, no duplicates, matcher groups untouched, an unparseable `settings.json` aborting without a write |
| `project-key.test.mjs` | the `<key>` mapping, the over-200 hash form, cross-checked against the real `~/.claude/projects` |
| `shared-memory-hook.test.mjs` | the real bash hook, run with `HOME`/`CLAUDE_PROJECT_DIR` overridden: fail-open, self-heal, both resolution branches |
| `pi-registration.test.mjs` | "already registered?" across relative, absolute and git specs — a false negative would double-load every extension |
| `win32-degrade.test.mjs` | every posix-only step reporting `skipped (win32)` |
| `desk-service.test.mjs` | the plist rendering with resolved values, opt-in, and launchctl never being called from a test |
