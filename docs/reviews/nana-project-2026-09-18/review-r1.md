- **HIGH — `packages/nana-setup/lib/fsops.mjs:89-92`, used by `packages/nana-setup/lib/project.mjs:75-80`: dangling symlinks are treated as absent and written through.** `fs.existsSync()` returns false for a dangling symlink. Given `OBJECTIVE.md -> /tmp/victim` with `/tmp/victim` absent, `nana-setup project .` creates `/tmp/victim` through the existing symlink instead of leaving the existing project entry untouched. This breaks the central never-overwrite/no-write-through guarantee.

- **MEDIUM — `packages/nana-setup/lib/project.mjs:197-203`: `--check` rejects states intentionally produced by setup.** For a directory inside an existing Git repository, setup correctly skips nested `git init`, but `--check` fails because there is no local `.git`. Likewise, with nonempty user-scope `postEdit.commands`, setup intentionally omits `.pi/nana-pack.json`, then `--check` fails that omission and repeatedly tells the user to rerun setup.

- **MEDIUM — `packages/nana-setup/lib/project.mjs:164-169`, `packages/nana-knowledge/bin/nana-knowledge.ts:35-37`: a held build lock is falsely reported as a successful rebuild.** The knowledge CLI prints the lock error to stderr but exits 0; `stepKnowledgeRefresh` ignores stderr on exit 0 and reports `"rebuilt"`. Concrete input: create a live `build.lock`, then run `nana-setup project` against that knowledge home—the requested refresh does not happen, but output says it did.

- **MEDIUM — `packages/nana-setup/lib/project.mjs:159-163`: the refresh has no hard wall-clock deadline.** `spawnSync(..., {timeout})` sends the default `SIGTERM` after ten minutes but still waits for child termination. A build blocked in an uninterruptible filesystem operation, such as reading a hung FUSE knowledge root, can therefore hang `nana-setup project` indefinitely; unlike the hook, there is no parent-side asynchronous abandonment.

- **MEDIUM — `packages/nana-pack/skills/adopt-structure/SKILL.md:76-86,128-132`: the fallback cannot fill the real project name.** The throwaway scaffold is rendered with `project_name=_tmp`, so Copier has already replaced `<name>` before step 6 attempts its replacement. When `templates/_shared` is unavailable, adopting project `ledger` seeds `# Objective and current priority — _tmp` and `# Handoff — _tmp frontier`.

- **LOW — `packages/nana-setup/tests/project.test.mjs:153-155`: Copier integration silently disappears when `uvx` is unavailable.** A CI machine without `uvx` passes without exercising either language, byte equality, or `_skip_if_exists`, despite these being core invariants of the change.

VERDICT: BLOCK
