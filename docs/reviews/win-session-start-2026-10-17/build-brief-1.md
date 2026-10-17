# Lane win-session-start — build brief 1 (2026-10-17 · feat/win-session-start · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. The fourth Windows fix lane under the owner's feature-first
ruling: build the feature to its must-meet tests and nothing more.

**What to build.** `must-meet.md` in this folder is the plan of record: row R-1340, the must-meet test SS1 (exact title
in `seat-titles.mjs`) and SS2, the Windows CI evidence. The triage is `docs/reviews/windows-fixes-2026-10-17/rows.json`
(entries for objective-golden, adoption-producer, adoption-reader and config-display-text).
1. SS1 in `packages/nana-setup/tests/hooks-win32-exec.test.mjs` (Windows only; SKIPs elsewhere), beside lane
   win-claude-hooks's knowledge-pull check: a fixture project with an `OBJECTIVE.md` and a configured priority, a temp
   home set as both `HOME` and `USERPROFILE`, the installed SessionStart objective and adoption commands run exactly as
   settings.json holds them; assert the objective block names the fixture's priority and the adoption output carries
   its line. Read the existing producer tests for the fixture shapes.
2. Test portability, per the triage, each skip printing its reason: set and restore `USERPROFILE` beside `HOME`
   (`objective-golden.test.mjs:39-40,106,976`, `adoption-reader.test.mjs:169`); keep the relative journal path on one
   drive (`adoption-producer.test.mjs:305`); for names NTFS forbids (LF, CR, VT, `:`, `*`, backslash), SKIP on win32 and
   keep at least one Windows-legal hostile name per case (U+2028, U+0085, a backtick, an em dash); POSIX-only modes
   (chmod 000, 0o555, 0o444) SKIP on win32.
3. If a check hidden behind a crash now fails on Windows because of product code, stop and report it.

**Order.** Row R-1340 first; then SS1 with its `// req:` marker and the row flipped to `implemented` in the same commit
(a planned row that a test traces fails the trace rail); then the portability edits. R-291's leaf total moves by one.

**Rules.** As lane win-claude-hooks's brief 1: work only in this worktree; touched test files only, in the foreground,
through `npm test -- <file>` on this Mac (two npm global folders make `node scripts/test.mjs <file>` misleading here);
each call under 5 minutes; never the full suite or a background command; no test writes this checkout; never the real
home folder, `~/.claude` or `~/.pi`; no person's, provider's or machine's name; never `process.env.PI_CODING_AGENT_DIR`
or a line ending in `PI_CODING_AGENT_DIR`; write SS1 and no other new test; edit an existing check only where Windows
makes it false, listing each edit; do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with
explicit paths, prefix `win-session-start: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push
to `origin feat/win-session-start` after each commit.

## Done
The touched files green on macOS with unchanged counts (SS1's file SKIPs here); `seat-titles.mjs 1` → `0 missing`;
`npm run req:tree` then the tree check; the code-map and trace checks. The seat then opens a draft pull request.

## Report
≤ 15 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the touched files' macOS lines; each existing
check edited and why; the one claim most likely wrong on Windows.
