# Build brief 2 — win-lock-fix-command (the seat, 2026-10-20)

Build 1 left its whole change uncommitted and reported BLOCKED: `node scripts/requirements-trace.mjs` exits 1
because R-2082 and R-2083 stay `untested` (as brief 1 said, until the Windows CI leg runs them) while their checks
carry `// req: R-2082` and `// req: R-2083` markers. That was the seat's brief error, not yours.

Do this, and nothing else:
1. Keep build 1's uncommitted work exactly as it is (do not reset or redo it).
2. In `packages/nana-setup/tests/settings-lock.test.mjs`, change the two Windows-only markers to
   `// req-candidate: R-2082 (Windows only; becomes req: when the Windows CI leg passes it)` and the same for R-2083.
   The trace ignores `req-candidate:`; the seat flips them after CI, as it did for R-1890 in win-watchdog-cpu-read.
   Keep each marker directly above its `check("…` line.
3. Keep R-2082 and R-2083 `untested` in REQUIREMENTS.md, with evidence saying the Windows-only checks exist and wait
   for the Windows CI leg.
4. Run `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`,
   `node packages/nana-setup/tests/settings-lock.test.mjs` and `node packages/nana-setup/tests/settings-merge.test.mjs`.
   All must exit 0.
5. Commit everything build 1 changed plus this edit, with explicit paths. Single test files only; no full suite;
   no push; no pull request; never edit HANDOFF.md or docs/sessions/.

Report (at most 6 lines): VERDICT, commit, the trace's last two lines, and the files committed.
