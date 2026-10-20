# claude-config-dir — build brief 3

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/claude-config-dir`, on top of the current tip. Rules: the builder preamble, but single test files only, never the full suite (other builders share this machine). No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
Build 2 (d9a5bdfb) put a `{{sharedMemoryDir}}` placeholder in the shared-memory seed and filled it at install. Uninstall removes the shared-memory index only when its bytes equal the seed source file, so a freshly installed, unedited index now reads as "edited since seeding" and stays. The seat ran `npm test -- packages/nana-setup/tests/uninstall.test.mjs` alone: 31/31 pass on a6947c42 (build 1), 29 pass and 2 fail on d9a5bdfb — "install --desk then uninstall restores the independent home snapshot" and "released context entry is retired by install and its link is removed on uninstall".

The seed's folder text (independent check F2) is cosmetic. The seat drops that fix and carries F2 as a known bug.

## Do, nothing else
1. Put `packages/nana-setup/claude/memory/MEMORY.seed.md` and `stepSharedMemory` in `packages/nana-setup/lib/steps.mjs` back to their exact form at a6947c42 (`git diff a6947c42 -- <those two files>` must be empty). Keep build 2's banner change and its test.
2. Run alone: `npm test -- packages/nana-setup/tests/uninstall.test.mjs` (31/31 expected), `claude-config-dir.test.mjs`, `install.test.mjs`, `shared-memory-hook.test.mjs`, `state-manifest.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
3. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result.
