# Lane win-claude-hooks — build brief 1 (2026-10-17 · feat/win-claude-hooks · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. The third Windows fix lane under the owner's feature-first
ruling: build the feature to its must-meet tests and nothing more.

**What to build.** `must-meet.md` in this folder is the plan of record: row R-1330, the must-meet test KH1 (exact title
in `seat-titles.mjs`) and KH2, the Windows CI evidence. The triage is `docs/reviews/windows-fixes-2026-10-17/rows.json`
(entries for hook, discovery, render, settings-merge, verifier-pipe and shared-memory-hook) and `plan.md` §2 L6 and L7.
1. KH1 in `packages/nana-setup/tests/hooks-win32-exec.test.mjs` (it runs only on Windows and prints SKIP elsewhere):
   seed a fixture knowledge store in its temp home, build the index, run the installed UserPromptSubmit knowledge
   command exactly as the installed settings.json holds it, with a matching prompt on stdin, and assert the output
   carries the pull block and names the fixture file. Read how `packages/nana-knowledge/tests/hook.test.mjs` seeds a
   store and how the existing win32 exec checks find the installed command.
2. Test portability, per the triage, each skip printing its reason: `hook.test.mjs` and `discovery.test.mjs`:
   `fileURLToPath` where a file URL's `.pathname` reaches node, and separator-neutral path comparisons;
   `render.test.mjs`: SKIP (not FAIL) the checks whose hostile file name NTFS refused, and add one NTFS-legal hostile
   name so the end-to-end path stays pinned on Windows; `settings-merge.test.mjs`: gate the mode-bit checks to POSIX and
   assert the win32 exec-form entries where it expects a `~/.claude/hooks` link; `verifier-pipe.test.mjs`: on win32 take
   the installed hook from the settings entry's command, and build the doctor fixture with the win32 platform;
   `shared-memory-hook.test.mjs`: SKIP the deleted-working-folder case on win32.
3. If a check that was hidden behind a crash now fails on Windows because of hook or library code (the knowledge
   build-lock race is the likeliest), stop and report it; that fix becomes its own hook-class lane.

**Order.** Row R-1330 first (`planned`), then KH1 with its `// req:` marker, then the portability edits. R-1330 flips
to `implemented` when the seat's Windows run shows KH1 passing; until then leave it `planned` and say so. R-291's leaf
total moves by one.

**Rules.** Work only in this worktree. Run only the test files you touch, in the foreground
(`node scripts/test.mjs <file>`), each tool call under 5 minutes; never the full suite or a background command. No test
writes this checkout. Never write the real home folder, `~/.claude` or `~/.pi`; never write a person's name or a provider
or machine name; never write `process.env.PI_CODING_AGENT_DIR` or end a line with `PI_CODING_AGENT_DIR`. Write KH1 and
no other new test; edit an existing check only where Windows makes it false, and list each edit. Do not touch
`HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with explicit paths, prefix `win-claude-hooks: `, ending
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to `origin feat/win-claude-hooks` after each commit.

## Done
The touched test files green on macOS (their macOS counts unchanged except KH1's file, which SKIPs here).
`node docs/reviews/win-claude-hooks-2026-10-17/seat-titles.mjs 1` → `0 missing`; `npm run req:tree` then
`node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`; `node scripts/requirements-trace.mjs`.
The seat then opens a draft pull request and reads the Windows leg.

## Report
≤ 15 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the touched files' macOS summary lines; the last
line of each Done command; each existing check you edited and why; the one claim most likely wrong on Windows.
