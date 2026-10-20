# win-silent-skips — plan attack (one adversary)

Verdict: AMEND

AMEND: the lane is worth building and ordinary is the right class. The plan, though, missed one file that drops checks silently, and its matching rule would let one wrong version pass. All probes ran in a temp clone of main d4423eff. No repository was touched; the main checkout is still clean.

What the probes showed:
1. Red today is confirmed. I wrote my own version of the plan's scanner. On main it reports all seven plan files red. Their CI Windows and macOS counts in run 39344916736 match the plan's table exactly.
2. The plan missed test-locked.test.mjs. I compared Windows and macOS pass+skip for every file in that CI run. test-locked reads 13+1 on Windows against 17 on macOS:
   - Its guard at line 178 drops three signal checks (SIGINT, SIGTERM, SIGHUP) with no SKIP line.
   - Its one SKIP belongs to the separate guard at 199, and that SKIP does not name its check.
   - The plan listed test-locked as a file with one SKIP per group. That is wrong.
   - No in-flight lane touches the file. I added it as R-1957, which makes eight tests, still within the limit.
3. install.test.mjs's guard at 307 also drops two checks silently. win-claude-skills is editing that file now, so it stays out and becomes a known limit and a HANDOFF line.
4. The matching rule was too loose. "Contains `<title> — `" would accept one SKIP line that names all three (b) checks. The amended rule: the SKIP text must start with `SKIP <title> — `, have a reason after it, and serve one title only. My probe turns that merged line red.
5. Wrong version 6 depends on how the inverted guard is written. As `{} else {` on one line it passes the scanner; as two lines it goes red. The brief now uses the two-line form. The one-line form, and a respelled guard in a file that keeps another recognized guard, are recorded as known limits.
6. Prototype fix: 24 lines added, 12 changed. All eight files turn green and pass `node --check`. The macOS counts did not change: bounded-read 4, adoption-producer 62, test-locked 17.
7. Simulated Windows after the fix matches macOS in every file I ran: regroup 59+4, lift 63+2, bounded-read 2+2, adoption-producer 61+1, test-locked 13+4. post-edit-hardening printed its six SKIP lines; its Windows kill checks fail under simulation, as expected.
8. All nine wrong versions behave as intended:
   - Seven turn their file red: a deleted SKIP, a merged SKIP, a SKIP moved into the guarded body, a SKIP without its title, a SKIP without a reason, the two-line inversion, and the old test-locked wording.
   - Respelling adoption-producer's only guard goes red through the "no guarded check" rule.
   - Respelling one of regroup's four guards and dropping its SKIP survives; that one is a known limit.

Other checks:
- Windows line endings: `.gitattributes` sets `eol=lf`, and the scanner splits on `\r?\n` anyway.
- The new test only reads text, so it runs the same on all three CI systems.
- The rows each have one "shall", so they pass the form check.
- `npm run req:tree`, `npm run map`, `map:check` and `readme:check` all exist, and the code map lists test files, so the new six-tag header is needed.
- The single-file name filters match only their own files.

Files the build touches:
- packages/nana-pack/tests/windows-skip-lines.test.mjs (new)
- packages/nana-pack/tests/requirements-regroup.test.mjs
- packages/nana-pack/tests/requirements-lift.test.mjs
- packages/nana-pack/tests/bounded-read.test.mjs
- packages/nana-pack/tests/adoption-producer.test.mjs
- packages/nana-pack/tests/post-edit-hardening.test.mjs
- packages/nana-pack/tests/adoption-reader.test.mjs
- packages/nana-pack/tests/test-locked.test.mjs
- packages/nana-setup/tests/win32-degrade.test.mjs
- REQUIREMENTS.md
- docs/requirements-tree.md and docs/code-map.md (regenerated)

Conflicts:
- No in-flight lane touches the eight test files. I checked each branch against main and each worktree's uncommitted changes.
- None of the five in-flight lanes adds rows at the end of FEAT-031. readme-windows-checklist's plain diff against main shows rows R-1770 to R-1779 removed; that is only its older base, and its own changes leave FEAT-031 alone.
- All lanes regenerate the tree and the code map; regenerate both after merging main.
- In this slate, review-test-waits edits immutable-review and win32-launch, so there is no overlap. install-dry-run-pi-packages probably edits install.test, which this lane leaves out. hook-output-fail-open might touch the adoption tests; I could not see that plan. Any clash would be one line per file, so nothing needs to wait.
- The edit to win32-degrade means the local install check runs before the land.
- The seat should update HANDOFF's post-edit-win-survivors residual at the land.

The one claim most likely wrong: that install.test's guard at 307 is the only other per-check guard that drops checks silently. That comes from one CI run's per-file gaps plus a scan of four guard spellings. A guard spelled another way could still hide inside a file whose group SKIP lines cover the gap, such as handoff-store, skills-and-standards or doctor-runtime. A second weak point: the test-locked reason ("Windows kills a child outright, so its signal handler never runs") is inferred from Node's documented Windows kill behaviour. It has not been seen on Windows.

Probe scripts are in <tmp> The final must-meet and brief texts are in <tmp>
