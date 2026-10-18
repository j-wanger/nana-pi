# Lane win-pi-handoff — build brief 1 (2026-10-17 · feat/win-pi-handoff · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. A Windows fix lane under the owner's feature-first ruling:
the changes stay in tests, and the must-meet is the Windows CI evidence HD1 in `must-meet.md` (no new row, no new test).

**What to fix**, per `docs/reviews/windows-fixes-2026-10-17/rows.json` (entries for handoff-artifact, handoff-staleness,
handoff-store, handoff-trust, display-surfaces, post-edit-file-queue and frontier) and `plan.md` §2 L9:
- `handoff-store.test.mjs:193`, `handoff-trust.test.mjs:108,115`: parse each journal line with `JSON.parse` and compare
  its path field, instead of a substring match on raw JSON (which escapes backslashes).
- `frontier.test.mjs:44`, `handoff-staleness.test.mjs:87,111,139,159`, `post-edit-file-queue.test.mjs:67`: build expected
  paths with `path.sep` or normalise separators; for the post-edit `-e` script, pass the path through an environment
  variable rather than interpolating a backslashed path into source.
- `handoff-artifact.test.mjs:60` and `handoff-staleness.test.mjs`: Windows temp folders can be 8.3 short paths while the
  product reports long ones; resolve both sides with `fs.realpathSync.native` inside the test. Do not change
  `scripts/test.mjs`.
- `display-surfaces.test.mjs:161,219,273,291`: names with LF or ESC are NTFS-illegal; on win32 skip those probes with the
  reason and keep at least one Windows-legal hostile name per probe (U+202E, U+2028).
- Watch for the pattern lane win-pi-gate found: a test that `process.chdir`s into a temp folder must move back before
  removing it, or Windows refuses with EBUSY.
Do not change product files; if a Windows failure needs one, stop and report it.

**Rules.** Work only in this worktree; touched test files only, in the foreground, through `npm test -- <file>` on this
Mac; each call under 5 minutes; never the full suite or a background command; no test writes this checkout; never the
real home folder, `~/.claude` or `~/.pi`; no person's, provider's or machine's name; never `process.env.PI_CODING_AGENT_DIR`
or a line ending in `PI_CODING_AGENT_DIR`; no new test; edit an existing check only where Windows makes it false, and
list each edit; do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with explicit paths, prefix
`win-pi-handoff: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to `origin feat/win-pi-handoff`
after each commit.

## Done
The seven files green on macOS with their counts unchanged; the code-map and trace checks. The seat then opens a draft
pull request and reads the Windows leg.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each
existing check edited and why; the one claim most likely wrong on Windows.
