Feature: FEAT-041 · Shape each agent's context by role

Lane context-anatomy. Class: gate (claude-review and pi-review are review tools; pi-worker and a Claude Code SessionStart hook also change). Threat model: honest variation in our tools' output and in the machines that run them is in scope (missing or malformed settings, Windows paths and shells, interrupted reviews, oversized known-bug files, an unwritable log); deliberate forgery, such as a known-bug line written to steer a reviewer or a hand-edited log line, is out.

Review `git diff origin/main...HEAD` on `feat/context-anatomy`. Main is 11454d44. The plan of record is `docs/reviews/context-anatomy-2026-10-31/plan.md`, revised after its adversary pass (`plan-attack.md`). Build briefs 1 to 4 and the build reports record each build. The 2026-10-31 entry "each launched agent gets a context shaped for its role, and every launch is logged" in `docs/sessions/2026-10.md` summarises the lane. This change also carries version 2 of `docs/memory-factory-design-2026-10-31.md`, confirmed by the owner.

The change: the Claude reviewer and builder start isolated from the user's settings, MCP servers, auto-memory and ancestor CLAUDE.md files, keeping login, proxy and effort; builders get a capped known-bug digest; both review launchers send the feature's known bugs; three launchers and the shared-memory hook write a load log. FEAT-041; R-3210 to R-3219; six amended rows; A-089.

The seat's record:
- Land condition, two real review rounds with this branch's launcher: round 1 at 28,822 tokens but the owner's rules file still loaded; round 2 after build 2 at 28,774 tokens with only the tree's CLAUDE.md and AGENTS.md and no MCP instructions. Baseline 52,128; bar 42,000.
- 34 wrong-code pairs: 0 failed, re-run by the seat on the final code. macOS install check from the seat's shell: exit 0.
- Locked full suite at 411af910: 247 files, 245 pass, 2 skip. CI run 41258654043 passed on all three systems.
- Known bugs: nine lines in a new `docs/known-bugs/FEAT-041.md`; two fixed lines removed from FEAT-006 and FEAT-007.

Question: does the feature work for its users, the reviewers and builders the seat launches, and does the change cause a harm the review standard lists? Check especially that no launch loses the login, proxy or effort it needs; that the ancestor exclusion keeps the reviewed tree's own instructions; that a digest never drops a line the brief's precedent names; that no test or launch writes to the real home; and that a log failure never blocks a launch or changes the hook's output.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
