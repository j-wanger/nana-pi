# Review — win-project-files (CLAUDE.md as a one-line import; AGENTS.md refresh on Windows; verbose Windows CI), 2026-10-17 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 9fcd4f2..HEAD` on `feat/win-project-files` (main is `9fcd4f2`; the lane merged main twice). The plan of
record is `docs/reviews/win-project-files-2026-10-17/must-meet.md`: rows R-1310 to R-1313, must-meet tests PF1 to PF5.
The Windows plan behind it is `docs/reviews/windows-fixes-2026-10-17/`. The seat's record (`seat-verify-*.md`) holds the
Mac suite, the install check and five Windows CI runs plus a rerun, logs beside it. Five build briefs record each round.

The review standard pi-review appends is the bar. Threat model: honest variation in git's checkout settings (symlinks
off, autocrlf), Windows file locking and file IDs, and editors' saves in scope; deliberate forgery out. Lane class:
ordinary (nana-setup project, not install, uninstall or doctor); the install check ran because it touches nana-setup.

Check: (1) a Windows clone of nana-pi and a new project load AGENTS.md through CLAUDE.md in Claude Code, and existing
macOS links keep working; (2) `nana-setup project` refreshes AGENTS.md on Windows and refuses, never overwrites, an
AGENTS.md its owner replaced mid-refresh, on every platform; (3) PF1 to PF5 each fail with their feature removed;
(4) HANDOFF and the session entry are true; (5) any MUST.
