## HIGH

- **`packages/nana-setup/lib/steps.mjs:233-246` — registration guard misses equivalent clones and `~` paths, causing duplicate extension loading.** Matching is lexical against the current `repoRoot`; it neither expands `~` nor canonicalizes symlinks/repository identity. Concrete failure: this worktree runs from `/Users/jwang/nana-pi-wt/setup` while settings contains `../../nana-pi/packages/nana-pack`. The guard returns false and runs `pi install /Users/jwang/nana-pi-wt/setup`, loading the same extensions twice. `"~/nana-pi/packages/nana-pack"` fails similarly. The live-machine test at `tests/pi-registration.test.mjs:87-95` tests the canonical clone directly, not installation from this worktree.

- **`packages/nana-setup/lib/steps.mjs:96` — `settings.json` is overwritten in place, without atomic replacement or concurrency protection.** Concrete failure: an editor or Claude Code writes a new foreign hook after `readClaudeSettings()` but before line 96; the installer then truncates the file and writes its stale snapshot, silently deleting that hook. An ENOSPC/process termination after truncation can leave malformed JSON and break every Claude Code session.

- **`packages/nana-setup/lib/fsops.mjs:43-49` — Windows destroys an existing rule instead of backing it up.** With `NANA_SETUP_PLATFORM=win32` or actual Windows and an existing hand-written `~/.claude/rules/nana-soul.md`, `copyInstead` calls `writeFileSync` directly. No `.bak-*` is made, contradicting the documented no-destruction guarantee. If the target is a symlink, this can overwrite the symlink’s destination.

## MEDIUM

- **`packages/nana-setup/lib/settings.mjs:61-64` — valid JSON with an unexpected hooks shape causes a partial install.** Concrete input: `{"hooks":"disabled"}`. Parsing succeeds, hooks/rules are installed first, then assignment to `settings.hooks.SessionStart` throws an uncaught `TypeError`. The install has already moved files despite presenting settings parsing as its preflight safety boundary.

- **`packages/nana-setup/lib/settings.mjs:13,38` — generated hook commands do not quote paths.** Concrete input: clone or home at `/Users/Jane Doe/nana-pi`. Commands become `bash /Users/Jane Doe/...` and `node /Users/Jane Doe/...`, so every installed hook is split into incorrect arguments and fails.

- **`packages/nana-setup/claude/hooks/nana-shared-memory.sh:38-42` — the long-path fallback can select another project.** Concrete input: two project paths whose sanitized keys share the first 200 characters; only project B’s hashed directory currently exists, while a session for project A has no usable `transcript_path`. The one-hit glob treats B as A and mutates B’s memory directory. “Unambiguous” among existing directories does not establish identity.

- **`packages/nana-setup/lib/settings.mjs:50` — substring matching accepts unrelated commands as installed hooks.** Concrete input: a SessionStart command `echo nana-objective.sh.disabled`. Both installer and doctor consider the objective hook present, never add the real command, and report the machine healthy.

VERDICT: BLOCK
