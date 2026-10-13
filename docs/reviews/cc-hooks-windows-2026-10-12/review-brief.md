# Review — the Claude Code seat's hooks on Windows, 2026-10-12 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

**Round 2.** Round 1 (`sol-r1.md` 6/10, `astra-r1.md` 78/100, both SEND-BACK, at `95d0410`) found the PowerShell lexer could hide a live commit, the matcher scan and exec-form ownership regressions, and evidence weaker than several rows claimed. Build 4 (`build-brief-4.md`) fixed them; the seat added mutation pairs 27–31 for those fixes (all red) and rewrote the ask to Jake as a page of exact steps (`jake-windows-check.md`). Check every round-1 finding is closed, then review the whole diff again: the final review covers the exact tip that will land.

Review `git diff 7e6ce39..HEAD` on `feat/cc-hooks-windows` (based on current `main`, `7e6ce39`). Threat model
(Jake, 2026-10-11): honest variation in a Windows machine — Git Bash present or not, PowerShell as the primary
shell, backslash and mixed-separator paths, a user's own hand-written hook entries, an earlier nana install —
is in scope; a hostile local user is out. Lane class: gate-adjacent (the pipe guard's PowerShell lexer).

Records, all in `docs/reviews/cc-hooks-windows-2026-10-12/`: the plan (`CHANGE.md`; seat planning workflow,
two fact-checks, sol plan r1–r3 at 70, 86, 100), three Sonnet builds (`build-brief-1..3.md`), the seat's
acceptance script (`seat-verify-hooks.mjs`, black box through a forced-win32 install; 59/59), the title check
(`seat-verify-tests.mjs`; 0 gaps), and the seat's code-break runner (`seat-mutate.mjs`; 36/36 red at the last
build — do NOT run it: it takes many minutes and adds scratch git worktrees; read its committed outputs
`seat-mutate-build{1,2,3,4}-output.txt`, `seat-mutate-build4-seat-output.txt`). You may run `seat-verify-hooks.mjs` and any test file. The real Windows
evidence is CI run 38333416292 at the last code tip (Windows job: `hooks-win32-exec` 25 pass, `pipe-guard` 66,
`win32-degrade` 77; `settings-merge` 191 pass and 3 file-mode fails the plan declares out of scope).

Check: (1) `packages/nana-setup/lib/settings.mjs`, `steps.mjs`, `doctor.mjs`, `verifier-hook.mjs`,
`claude/hooks/verifier-pipe.mjs` and `packages/nana-pack/lib/pipe-guard.mjs` against CHANGE §2–§4 and rows
R-1050, R-1051, R-1053–R-1064 and the reworded or retired rows — in particular that macOS and Linux output and
merge behaviour are exactly main's (R-1061), that the status-message gate matches main's for a different AND a
missing message, and that the PowerShell lexer cannot hide a live `git commit` the Bash lexer would see;
(2) each row has one `shall`, and the clause each cited test pins — rows proven only on the Windows leg must
say so; (3) README, AGENTS.md, CLAUDE.md and the template's runtime-matrix cell: every claim true of the code
and byte-identical where the plan says so; (4) the HANDOFF lines and the session entry are true, including the
steps in the ask to Jake; (5) anything that should block the merge. Rare cases are residuals.
Answer with the full review: MUST / SHOULD / NOTE with file:line, evidence and the smallest fix; a score; the
last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`, `VERDICT: SEND-BACK`.
