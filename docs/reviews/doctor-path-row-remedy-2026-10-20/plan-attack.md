# doctor-path-row-remedy — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds, and every red-today claim checks out. Three test-level defects need fixing before the build.

Probes ran in a temp clone of main 72abe19a, with a temp HOME and made-up home names. I appended the plan's six checks to doctor-fix-line.test.mjs. The probe folder has been removed and no process was left running.
- On today's code, R-2320, R-2321, R-2323 and R-2325 are red and R-2322 and R-2324 are green guards. The "on" run printed "3 missing — fix by hand as each ✗ line says: PATH resolves pi-review; then run: nana-setup install for the other 2". The forced-win32 run listed the row by hand among 5. The "after" run listed it by hand.
- With the candidate fix (binAt, then a slice lookup before binAt, then installLabel "PATH pi-review"), all 14 checks pass: R-1990–R-1997 plus the 6 new ones. "on" and "after" printed "3 missing — run: nana-setup install". The forced-win32 run gave the row to install among "the other 2". In the forced-win32 dry run, install reported `PATH pi-review` as updated after only the .cmd was removed. That settles half of the plan's most-likely-wrong claim.
- readme-check found 0 problems and map:check found 0 problems with the README sentence replaced.
- doctor-runtime R-953 and win-shims R-1616 assert only ✓/✗, zprofile or the shadow path. They keep passing, because their bin folder is off PATH or shadowed.

Amendments:
1. The plan's "to install" assertion only required the summary to name `nana-setup install`. That passes with no repair on the refusal line ("nana-setup install will not run until…") and on the could-not-predict line, because neither form has a by-hand list. It now requires the plain run-install form or the then-run form.
2. runOnPath must call spawnSync directly, never run() or withPiStub. withPiStub prepends the stub with path.delimiter, which is ":" on a POSIX host. That glues the stub onto the forced Path's first entry (the upper-cased bin), so R-2323 would go red against correct code.
3. R-2320, R-2321 and R-2322 now say the launcher is missing, so no row is wider than its test. R-2323 says "runs as win32", as R-1993 does.
4. The forced run's Path now includes System32 on a Windows host, so cmd.exe still resolves.
5. Known limits now say what is unpinned. On a POSIX host, findOnPath never finds a file under forced win32 (it rewrites paths with backslashes). So the win32 shadow branch runs only on the Windows CI leg. The stale-link update case and trailing-slash entries are also unpinned.
6. R-1993's by-hand regex moves into one shared helper rather than being copied.

Lane class: install, hook or gate is correct, because the lane changes doctor. Seat duties apply: install-check before nana-land, the land reviewer, wrong-code pairs and an independent check. The subtraction test passes: the slice lookup reuses firstOnPath and findOnPath, and nana-setup.mjs needs no change, because its existing installLabel mapping lets the dry run decide.

Files: packages/nana-setup/lib/doctor.mjs, packages/nana-setup/tests/doctor-fix-line.test.mjs, packages/nana-setup/README.md and REQUIREMENTS.md. docs/code-map.md changes only if the regenerated map changes. The lane touches nothing in steps.mjs, fsops.mjs or nana-setup.mjs.

Conflicts: review-ledger-run-win-launch is on main (72abe19a) and shares no file with this lane. Expected slate overlaps (inferred, since no worktree exists for them yet):
- linked-claude-folder-remedy, the same doctor-fix-line family: it probably also appends checks before the test's final summary line and edits the same README dry-run paragraph. Land this lane first, and that lane merges main and reconciles both.
- win-copy-backup-noise: it may edit the Windows shim rows directly above this lane's lines in doctor.mjs, or the shims' dry-run status. A missing .cmd stays "updated" either way.
- objective-path-shapes and win-pi-launch-orphan touch other doctor.mjs regions.
- lane-guard-temp-root conflicts only if it changes tests/tmp-dir.mjs or stub-pi.mjs.
- rm-outside-asks: none.
- Land order: rm-outside-asks and lane-guard-temp-root at any time, then this lane, then objective-path-shapes, then linked-claude-folder-remedy, then win-copy-backup-noise, then win-pi-launch-orphan.

The seat retires the HANDOFF residual "it always lists the Path row for pi-review by hand" in the reviewed change.

Claim most likely wrong: that the win32 shadow lookup works natively. That lookup runs findOnPath with env {PATH: slice, PATHEXT}. No Mac probe can exercise it, so only the Windows leg proves the win32 half of R-2324 and R-2325, and the env-spread wrong code survives on a Mac. If this lane lands without a green Windows leg, record that half as unverified.
