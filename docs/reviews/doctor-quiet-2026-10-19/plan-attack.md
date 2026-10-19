# doctor-quiet — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds, but two rows conflicted and one row claimed more than its test checks. I ran every probe in a temp clone of main dbbba7e, which moved after the plan's 8482c2e because readme-install landed. Node was 22.22.2 on macOS, with a temp home.

Probes I ran:
- Red today: the endorsed test file fails R-1750 (the SQLite ExperimentalWarning) and R-1751 (the four-line typeless warning naming gate-paths.ts, plus SQLite). R-1752 passes.
- Patched clone: all three tests pass.
- Wrong codes: each of the seven turned its named test red. They were restore-in-finally, SQLite-only, no forwarding, drop ExperimentalWarning by name, drop Warning by name, runtime NODE_NO_WARNINGS, and no filter at all.
- Doctor's stdout was byte-identical to main and the exit code was unchanged. `--trace-warnings` still printed the stack, and `--no-warnings` stayed silent.
- With the three rows added, the trace printed 1318 total and the EARS check found 0 rows off form. The tree test passed after `req:tree` once the leaf total was set to 1,318.

Amendments:
1. The rows conflicted. R-1750 said a doctor run in a plain folder writes no warning line, but R-1752's test is a doctor run in a plain folder that must print two. R-1750 and R-1751 now say "with no Node options".
2. R-1752 said "pass to Node's own warning printer", which also covers --trace and --redirect, but the test only reads stderr. The row now says "write that warning to stderr", limited to Node's default warning output.
3. The preload is now passed as an `--import <file URL>` argument, not through NODE_OPTIONS. This keeps it out of doctor's `node -p` child processes and avoids NODE_OPTIONS quoting on Windows. Probed: it works.
4. Each test now checks that doctor actually ran (the banner on stdout, and for R-1751 the project trust row). Without that, a crashed doctor would pass the mute tests.
5. The test also removes NODE_REDIRECT_WARNINGS from the child's env. The preload matches the plain-text banner "nana-setup doctor", not the em dash.
6. The leaf total on main is now 1,315, not 1,308. The brief no longer names a fixed number.
7. Dropped the injected-process parameter. Nothing can import the bin without running main, so no caller would use it.

Class: install, hook or gate is correct, because the lane changes nana-setup doctor.

Files the build touches:
- packages/nana-setup/bin/nana-setup.mjs
- packages/nana-setup/tests/doctor-quiet.test.mjs (new)
- packages/nana-setup/README.md
- REQUIREMENTS.md
- docs/requirements-tree.md and docs/code-map.md (regenerated)
- packages/nana-pack/tests/requirements-tree.test.mjs (leaf total only, while that number is still in the file)

Conflicts:
- No in-flight lane touches bin/nana-setup.mjs; I checked every worktree's diff against its merge base.
- install-honest-report and win-stale-copies both edit packages/nana-setup/README.md, so expect small text merges.
- bom-pack-config touches doctor-detail.test.mjs, which this lane does not change.
- REQUIREMENTS, the tree and the code map need regenerating after merging main.

The claim most likely wrong: that this works the same on Windows and Linux. That is inferred, not run. The likeliest gap is whether doctor reaches the project trust row on the Windows leg. If it does not, R-1751's check that doctor ran fails loudly rather than passing for the wrong reason.

All probes stayed inside the temp folder at $TMPDIR/plan.dCIWcX; no repository was edited.
