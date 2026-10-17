# Review — win-claude-hooks (the Claude Code seat's hooks proven on Windows), 2026-10-17 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 9fcd4f2..HEAD` on `feat/win-claude-hooks` (main is `9fcd4f2`). The plan of record is
`docs/reviews/win-claude-hooks-2026-10-17/must-meet.md`: row R-1330 and must-meet test KH1, plus KH2, the Windows CI
evidence. The Windows plan is in `docs/reviews/windows-fixes-2026-10-17/` (identical to the win-project-files lane's
copy). The seat's record (`seat-verify-*.md`) holds the Mac suite, the install check and two Windows runs, logs beside it.

The review standard pi-review appends is the bar. Threat model: honest variation in Windows paths, file names and
process behaviour in scope; deliberate forgery out. Lane class: ordinary — every change is in tests and the row; no
hook, install or library code changed.

Check: (1) KH1 proves on Windows that the installed knowledge hook prints a pull block, and fails if the hook printed
nothing; (2) no Windows skip hides a check that could run there, and no edited check pins less on macOS than before;
(3) HANDOFF and the session entry are true; (4) any MUST.
