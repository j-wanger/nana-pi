# Review brief 1: seat-pull-off

Feature: FEAT-013 · Install and connect harness runtimes

Lane class: install (nana-setup library). Threat model: honest variation in scope (shell and exec hook forms, a quoted path with spaces, a foreign UserPromptSubmit entry or a sibling command in the same matcher group, settings with no hooks, win32 checkouts, a machine that never had the hook); deliberate forgery of settings entries out.

Review the branch `feat/seat-pull-off` from main `2c0a3e4a` to its tip. It includes a merge of main after builder-context landed (098263ee). Conflicts were only in HANDOFF.md and the session archive (both sides kept), plus the generated map and tree. The plan is `docs/reviews/seat-pull-off-2026-11-06/plan.md` (adversary pass taken in full), and the builder's report is `builder-report.md` in the same folder. The seat ran the install check locally on macOS on this tip; every line passed.

Intent: the owner took the seat's recommendation on #342. Retire the Claude Code seat's per-prompt knowledge hook (UserPromptSubmit), since about 2% of its suggestions were ever opened. Keep `nana-knowledge query`, the index and the pi extension.

Question: does the change do that for its users (owners installing or upgrading nana on a machine), and does it cause a harm the review standard lists? Check in particular:
- an upgrade removes only our knowledge command, never a foreign one or a sibling in the same group;
- doctor names a still-wired hook with the fix, and is quiet when it's gone;
- nothing else in install, uninstall, doctor or the install check changes behaviour;
- search still works after install;
- R-3739 to R-3746 match their tests, and the retired rows are marked correctly.
