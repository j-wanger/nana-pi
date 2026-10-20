# Build brief 3 — win-lock-fix-command (the seat, 2026-10-20)

Build 1 (committed by build 2 at `74606671`) is green on CI run 39388721628 on all three legs. On native Windows,
`settings-lock.test.mjs` printed `PASS R-2082: on Windows, the Command Prompt line install prints for a held lock,
run by cmd.exe, …` and `PASS R-2083: on Windows, the PowerShell line install prints …`. The seat's wrong-code pairs
gave 21/23 red, and the independent check HOLDS. Two pairs survived:
- M22: doctor's win32 row puts each shell label after its command instead of before it — green, because R-2084 only
  checks that each command appears somewhere in the row (the plan-attack's amendment 2 is not pinned).
- M23: doctor's row drops "install will not run until it is removed; if no nana-setup is running" and so tells the
  user a live install's lock is safe to delete — green, because no check reads that caveat.

Do this, and nothing else:
1. In `packages/nana-setup/tests/settings-lock.test.mjs`, change the two `// req-candidate: R-2082 (…)` and
   `// req-candidate: R-2083 (…)` markers to `// req: R-2082` and `// req: R-2083`, directly above their
   `check("…` lines. In REQUIREMENTS.md flip R-2082 and R-2083 to `implemented`, citing their checks and the Windows
   CI run 39388721628. Run `npm run req:tree`.
2. Pin M23: one check (under R-2084, the doctor row's row) that doctor's settings lock row, on a fresh and on an
   installed home, says the lock must be removed only if no nana-setup is running — assert the caveat's meaning
   through an imported name if the text is a module constant, or the exact phrase once if it is not (one literal,
   the sealed-value rule). Show M23's wrong code turns it red, then revert.
3. Pin M22: extend the R-2084 check (or add one beside it under R-2084) so that, on forced win32, each shell label
   comes before its command in doctor's row and the row ends on a command, as the plan-attack amendment says. Show
   M22's wrong code turns it red, then revert.
4. Run `node packages/nana-setup/tests/settings-lock.test.mjs`, `settings-merge.test.mjs`, `install.test.mjs`,
   `win32-degrade.test.mjs`, `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`.
   All exit 0.
5. Commit with explicit paths. Single test files only; no full suite; no push; no pull request; never edit
   HANDOFF.md or docs/sessions/. Change no product code.

Report (at most 8 lines): VERDICT, commit, the new or extended check titles, M22 and M23 results, the trace's last
two lines, files committed.
