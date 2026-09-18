# Review brief — nana-setup (round 1)

You are the independent reviewer (different lineage from the author). The repo under review is the git worktree you are running in (branch `nana-setup`, one commit over main: `git show --stat HEAD`). Read-only tools only.

## What was built
`packages/nana-setup/`: a one-command bootstrap so the nana-pi repo owns the WHOLE nana experience — not just the pi extensions that `pi install` ships. `bin/nana-setup.mjs install|doctor` symlinks Claude Code hooks + the soul rule from the repo into `~/.claude/hooks` and `~/.claude/rules`, merges four hook entries into `~/.claude/settings.json`, seeds the shared auto-memory dir, seeds pi user config (`~/.pi/agent/nana-pack.json` + objective file) only when absent, builds the knowledge index when absent, links `~/.local/bin/pi-review`, registers the repo with `pi install` when not already registered, and (opt-in `--desk`, darwin) renders + loads a launchd plist. The shared-memory hook (`claude/hooks/nana-shared-memory.sh`) self-heals a `shared` symlink inside the per-project auto-memory dir at every SessionStart by deriving Claude Code's project key from `$CLAUDE_PROJECT_DIR`. Root README "Install" section rewritten to describe the two halves. `packages/nana-pack/package.json` gains a `bin`.

Read: `packages/nana-setup/README.md`, `bin/nana-setup.mjs`, everything in `lib/`, `claude/hooks/*.sh`, `pi/*`, `launchd/*`, the tests, and the root README diff (`git diff main -- README.md AGENTS.md packages/nana-pack/package.json`).

## Blast radius (rank findings by this)
1. `~/.claude/settings.json` merge — a bad write breaks EVERY Claude Code session on the machine. Check: parse-failure path touches nothing; foreign hooks and key order preserved; match-by-substring cannot mis-match or duplicate; concurrent/partial write (atomic rename or not); permissions preserved.
2. Symlink-over-regular-file replacement of hooks/rules — backup naming collisions, dangling links if the repo moves, running from a worktree that later disappears (the installer symlinks to whatever clone it runs from).
3. `pi install` registration guard — the live machine registers the two per-package RELATIVE paths in `~/.pi/agent/settings.json`; adding a root-level entry would load every extension twice. Verify `entryMatches` logic against relative paths, `~`, symlinked clones, and a run from a different clone.
4. The project-key derivation in the bash hook vs Claude Code's real rule (`replace(/[^a-zA-Z0-9]/g,"-")`, >200 chars → slice + hash). Check the glob fallback cannot pick a WRONG project's memory dir (prefix collisions) and that the hook is fail-open (never blocks a session start) and quiet when HOME is unusual.
5. Idempotence claims: second run changes nothing — look for steps that report "unchanged" while still writing (mtime), or "created" on every run (e.g. the pi objective seed being created even when nana-pack.json points elsewhere).
6. win32 degrade and the `NANA_SETUP_PLATFORM` seam: does the seam leak into production behaviour.
7. README truth: every sentence in the root README Install section must be true of the code as written (what it overwrites, what it never touches, private files).
8. Tests: do they assert invariants or mirror the implementation; is there a failure-first test for the settings merge on malformed JSON and on a file with a BOM/trailing commas; are temp homes actually isolated from the real `~`.

## Output
Findings ranked BLOCK / HIGH / MEDIUM / LOW with file:line and a concrete failing input for each. Then one line: `VERDICT: LAND` or `VERDICT: BLOCK` (BLOCK only if a BLOCK/HIGH finding is real). Be adversarial; do not pad.
