# Seat checks — post-edit-win-pin build 1, tip f8569bd (2026-10-19)

- CI on draft pull request #60, run 39305742574, GitHub's merge of f8569bd into main 27603d4 (merge commit 71805c8;
  its tree is f8569bd's, since f8569bd already holds 27603d4): Windows `158 files: 141 PASS, 0 FAIL, 17 SKIP, 0 WARN ·
  checks: 6497 pass, 0 fail, 83 skip` (`ci-windows-run-1.log`); macOS 158 files, 156 PASS, 0 FAIL, 2 SKIP (7,569 checks
  pass, 16 skip); Ubuntu 158 files, 156 PASS, 0 FAIL, 2 SKIP (7,514 checks pass, 34 skip); install-check macOS and
  Windows success. None of main's known failures showed.
- post-edit-hardening: Windows `17 pass` with no skip (15 on main); macOS and Ubuntu 22 pass, 1 skip each. The one skip
  is R-1701's check, which prints `SKIP win32: … — taskkill is Windows-only` off Windows (the CI summaries show file
  counts only; the seat helper's local macOS run at f8569bd prints that line, 22 PASS, 0 FAIL). So R-1700 and R-1701 both ran
  and passed on the Windows runner (`PASS tree: a timed-out check's process and that process's still-running child are
  both ended`, `PASS win32: with taskkill off PATH the timed-out check's shell is killed and the run settles`).
  post-edit-status: Windows 33 pass, 1 skip (31 and 1 on main); macOS and Ubuntu 32 pass, 1 skip. Every count matches
  the plan's Verification section.
- Per the builder's report (a pi gpt-5.6-sol builder through pi-worker, build 1 af00ffd): R-1700 to R-1703
  implemented; R-097, R-107 and R-243 retired as superseded. Each wrong-code try turned its check red on macOS: the
  POSIX group kill replaced by a direct kill (R-1700); `??` to `||`, `> 0` to `>= 0` and the dropped `timeoutMs > 0 &&`
  timed-out guard (R-1702); an append when a pass printed output (R-1703).
- `git diff 27603d4..HEAD -- packages/nana-pack/extensions/` is empty: the extension did not change. The lane touches
  the two post-edit test files, REQUIREMENTS.md, the generated tree and code map, one pack README sentence and, among
  existing tests, only the R-291 leaf total (1,306 on main 27603d4, 1,310 at the tip).
- Windows wrong-code half: not run. The plan's Verification names one seat mutant CI run (killTree's win32 branch with
  taskkill `/F /PID` and no `/T`, its `error` and `close` fallbacks both no-ops) on which R-1700 and R-1701 must FAIL on
  Windows. No such run appears in the seat's record; an ordinary lane gets no seat pairs. So on Windows both checks are
  shown to pass, not to fail against broken kill code. Each check's own non-vacuity guard did hold there: it saw the
  processes alive before the deadline. The adversary's claim most likely wrong (a kill without `/T` leaves level A
  running on Windows, inferred from libuv's silent breakaway) stays unsettled. Recorded as a residual in HANDOFF.
- f8569bd is the seat's merge of main 27603d4 (the review-timeline land). At that merge the seat's helper ran
  requirements-tree (89 pass), requirements-trace (61 pass), product-report (65 pass), the map check (0 problems) and
  the readme check (700 claims, 0 problems).
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`): 7 rows in 1 feature, FEAT-030 — R-097,
  R-107 and R-243 untested -> retired; R-1700, R-1701, R-1702 and R-1703 new (implemented).
- The seat helper's re-run at f8569bd: `node scripts/requirements-trace.mjs` reads `1310 total (1024 implemented · 1
  planned · 21 retired · 259 untested · 5 violated)` and `ears: 0 rows off form`, exit 0; `npm run map:check` reads 303
  modules, 0 problems; R-1700 to R-1703 read `implemented` in REQUIREMENTS.md.
- Main moved after the CI run: it is at 8482c2e, one land (win-leg-flip, which makes the Windows leg block release)
  past the lane's merge base 27603d4. The lane has not merged it; that merge needs its own confirmation round.
- No wrong-code pairs and no independent check: an ordinary lane (tests, rows, the tree and one pack README sentence).
- Known limits of `must-meet.md` stay open; HANDOFF carries each as a residual.
