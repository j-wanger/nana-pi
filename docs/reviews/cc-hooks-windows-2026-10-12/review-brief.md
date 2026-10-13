# Review — the Claude Code seat's hooks on Windows, 2026-10-12 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

**Round 5 — over-cap confirmation round on the final tip after fixes to named findings.** Round 4 (`sol-r4.md` SEND-BACK 9/10, `astra-r4.md` LAND-WITH-FIXES 97/100, at `29d638f`) had one finding, the same from both: the session entry's Windows CI paragraph named build 5's run as the final code tip. The seat corrected that paragraph only (`docs/sessions/2026-10.md`, the "Windows CI" paragraph: build 6's run 38347800159, job 115133128863, with 25, 84 and 86 checks read from that job's log). Confirm the correction and that nothing else changed since `29d638f`.

**Round 4 — over-cap confirmation round on the final tip after fixes to named findings.** Round 3 (`sol-r3.md` SEND-BACK 8/10, `astra-r3.md` LAND-WITH-FIXES 94/100, at `54b569b`) left one lexer finding (a `#` after a closing quote, `'hi'#`, missed as a comment start, so a `)` inside it closed `$( … )` early) and evidence references (R-937's skill-row test, the final CI run). Build 6 (`build-brief-6.md`) made the comment-boundary set the spec's union (§2.2.3 and §2.3.3, each character sourced in the code), added a case per boundary character and per word character, cited R-937's skill-row test and the build-6 Windows run. The seat re-anchored pairs 28 and 32 and re-ran the whole table on the code tip: 37/37 red. Confirm the round-3 findings are closed and that nothing else changed beyond them; the earlier rounds' findings stay closed. The macOS and Linux CI legs are red for the upstream pi-codemode reason (separate urgent lane); the local locked suite is 137 files, 0 FAIL.

Review `git diff 7e6ce39..HEAD` on `feat/cc-hooks-windows` (based on current `main`, `7e6ce39`). Threat model
(Jake, 2026-10-11): honest variation in a Windows machine — Git Bash present or not, PowerShell as the primary
shell, backslash and mixed-separator paths, a user's own hand-written hook entries, an earlier nana install —
is in scope; a hostile local user is out. Lane class: gate-adjacent (the pipe guard's PowerShell lexer).

Records, all in `docs/reviews/cc-hooks-windows-2026-10-12/`: the plan (`CHANGE.md`; seat planning workflow,
two fact-checks, sol plan r1–r3 at 70, 86, 100), six Sonnet builds (`build-brief-1..6.md`), the seat's
acceptance script (`seat-verify-hooks.mjs`, black box through a forced-win32 install; 59/59), the title check
(`seat-verify-tests.mjs`; 0 gaps), and the seat's code-break runner (`seat-mutate.mjs`; 37/37 red at the last
build — do NOT run it: it takes many minutes and adds scratch git worktrees; read its committed outputs
`seat-mutate-build{1,…,6}-output.txt`, `seat-mutate-build{4,5,6}-seat-output.txt`). You may run `seat-verify-hooks.mjs` and any test file. The real Windows
evidence is CI run 38347800159 at the last code tip (Windows job 115133128863: `hooks-win32-exec` 25 pass, `pipe-guard` 84,
`win32-degrade` 86; `settings-merge` 192 pass and 3 file-mode fails the plan declares out of scope).

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
