# Review brief 1: load-log

Feature: FEAT-041 · Shape each agent's context by role

Lane class: gate (pi-review, a review tool). Threat model: honest variation in scope (symlinked cwd, linked worktrees, both AGENTS.md and CLAUDE.md in one folder, an unreadable file, a cwd-relative or env-set agent dir, a pi version without the export, Windows npm layouts); deliberate forgery of log lines or context files out.

Review the branch `feat/load-log` from main `2c0a3e4a` to its tip. The plan is `docs/reviews/load-log-2026-11-06/plan.md` (adversary pass taken in full), and the builder's report is `build-report.md` in the same folder.

Intent: pi-worker and pi-review add the context files pi loads for each child (found by calling pi's own exported `loadProjectContextFiles` through the installed package entry), the pi version, and the roster slot to the existing load line (R-3215). Delivery to the child must not change.

Question: does the change do that for its user, a seat reading the load log to see what each role loaded, and does it cause a harm the review standard lists? Check in particular:
- a launch can't be blocked or delayed meaningfully by the new lookup (pi not on PATH, export missing, import throwing, Windows shim layouts);
- the child's arguments and env are byte-identical to main's, apart from the logged line;
- the agent dir and cwd measured are the child's (sealed env in pi-worker, the temp checkout in pi-review);
- the move of pi-watchdog's win32 locator into `lib/pi-package.mjs` keeps piLaunch's behaviour and refusal texts;
- importing pi's entry inside the launcher process has no side effect on the launcher (output, handlers, exit);
- R-3726 to R-3732 match their tests.
