# win-pi-registration-test — plan attack (one adversary)

Verdict: AMEND

AMEND: the design holds up under probing. Four fixes go into the build: the land checklist, the counting command, the report shape and the row's scope.

Probes, run in a temp clone of main 713d6aa with a temp HOME, without touching the real repo or home:
- **The Windows gap is real.** The Windows suite log of CI run 39293614371 on main shows `SKIP POSIX-only fake-pi registration test`, with pi-registration at 64 pass, 3 skip. The whole Windows leg is green there (140 files PASS, 0 FAIL). Once win-leg-flip makes that leg blocking, a red check here would turn main red.
- **The prototype passes everything on macOS.** I applied the planned change and the row:
  - pi-registration through the repo runner: 64 pass, 3 skip, 0 fail, the same as main.
  - Trace: 1,299 rows, 0 problems, 0 rows off EARS form.
  - requirements-tree with the leaf total set to 1,299: 89 pass.
  - map:check and readme:check: 0 problems.
- **Wrong code goes red on the shared assertion (macOS, the R-323 branch).**
  - W1, install every package root: FAIL with 3 calls.
  - W2, install the manifest root: FAIL.
  - W4, report created without running install: FAIL.
  - W5, skip the version probe (new): FAIL.
  - W3 is Windows-only and not run.
- **The Windows launch line is accepted.** winCommand takes a CI-shaped fake pi path (8.3 short temp name) and the checkout path on the other drive with no refusal.
- **Most Windows risk is already ruled out by checks that pass there today:**
  - R-1034's npm-shim check runs the same cmd.exe launch on CI against a shim that also uses `%~dp0`.
  - R-679's root-identity check passes there with a cross-drive entry.
  - Doctor's "pi packages ✓" line passes there.

Simpler designs I considered:
- **Reuse R-323 with no new row.** It would cut the ledger and tree churn, but it breaks the contract that each must-meet test gets a row from this lane's block. A single title carrying both IDs on every platform would also let macOS seem to cover a Windows-only claim. Rejected.
- **The planned if/else title split** is about five lines and keeps status honest. Kept.

Amendments:
1. **Install check.** The lane touches packages/nana-setup/, so AGENTS.md requires `node packages/nana-setup/bin/install-check.mjs` on macOS before nana-land. The plan left this out.
2. **Counting command.** "64 pass, 3 skip on macOS" only holds through the repo runner, which gives each file a temp HOME. A bare `node <file>` in the builder's worktree reads the owner's real home: two machine-dependent checks then run and the counts change. The brief now uses `node scripts/test.mjs <file>`.
3. **Report shape.** The preamble puts `VERDICT:` on the first line, so the report shape now follows it. The report must also list the edited existing R-323 check, as the preamble requires. W5 is added to the wrong-code list.
4. **Row scope.**
   - It now says "WHEN the installer registers pi packages for the real home". The test calls the registration step with isRealHome set, not the full install, and that step skips under --home.
   - "for exactly two commands" becomes "exactly twice".
   - EARS still shows 0 rows off form (probed).
   - A known limit is added: the `.cmd` embeds Node's own path, so a `%` in that path would break it.

Files the build touches: packages/nana-setup/tests/pi-registration.test.mjs, REQUIREMENTS.md, docs/requirements-tree.md, and packages/nana-pack/tests/requirements-tree.test.mjs (only while the leaf-total literal exists).

Conflicts (checked by diffing every worktree):
- No in-flight lane touches pi-registration.test.mjs, stub-pi.mjs, the nana-setup tmp-dir.mjs or win-command.mjs.
- install-honest-report and bom-pack-config edit steps.mjs, but not stepPiRegister or packageCoverage.
- win-stale-copies edits doctor.mjs, but not the "pi packages" line.
- No lane uses the R-169x IDs or adds rows inside SUB-013.
- REQUIREMENTS.md, the tree outline and the R-291 literal will need routine merges, as for every lane.
- win-leg-flip changes how the lane is checked (a blocking Windows leg), not which files it touches.
- The build waits for no lane, but the land waits for the draft PR's Windows run.

The claim most likely wrong: that the Windows leg moves from 64 pass, 3 skip to 67 pass, 2 skip on the first draft-PR run. That is inferred; nothing ran on Windows. The likeliest way it breaks is the recorded install path being spelled differently from what the test expects, such as drive-letter case or a short name. Both sides come from the same module loader, so I expect them to match, but this is unproven.
