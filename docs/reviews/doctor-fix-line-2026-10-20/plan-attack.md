# doctor-fix-line — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds: install's own dry run decides which ✗ rows install repairs, and there is prior art for that (the stale-copies bin asks stepSkills' dry run the same question, R-1762). I rebuilt the plan's prototype in a temp clone of main 531ff1ec, since win-silent-skips has now landed. All 7 checks pass, natively and with every run forced to win32. On main code, M1 and M6 pass and the other 5 fail. W1 to W7 each turn their named check red. The existing test files pass: relative-agent-dir 30, doctor-quiet 4, doctor-detail 68, stale-copies 13, win32-degrade 87, retired-artifacts 47. A doctor run on a fresh home takes 0.33 s with the dry run and 0.32 to 0.37 s without it. The dry run wrote nothing in any home I probed. I also probed six odd homes: .claude as a file, rules as a file, .pi as a file, agent as a file, an unreadable skills folder, and nana-memory as a file. None crashed doctor; .claude as a file takes the refusal form.

Amendments:
(1) R-1993 was wider than its test. It required PATH resolves pi-review to be listed by hand on win32 in every case. That includes a bin folder already on the Path with only the shim missing, which install does fix. That would write a known limit into a requirement. The row is now narrowed to "that home's bin folder is not on the Path", and the test checks that condition first.
(2) M3 could not tell install's count from the by-hand count: both were 1. A new wrong code, W8 (install gets the by-hand count), passed the plan's M3. M3 now removes two rules, so the expected line is "3 missing — … skill spec; then run: nana-setup install for the other 2". W8 turned it red in the probe.
(3) R-1996 covered both by-hand forms, but its test covered only the all-by-hand form. M7 now also checks the mixed form. W6b, which drops the ! suffix only from the mixed form, turned it red in the probe.
(4) R-1990, R-1991 and R-1992 now say the dry run completes. Without that, a refusal also met R-1991's "none of them", so R-1991 and R-1994 could both apply. R-1990 and R-1994 now also require at least one ✗ row, so they stay clear of the all-good and !-only paths.
(5) R-1996 now defines w as the number of ! rows.

Lane class confirmed: install/hook/gate, because it changes doctor.

Files: packages/nana-setup/bin/nana-setup.mjs (runDoctor and its header), packages/nana-setup/lib/doctor.mjs (diagnose's add closure plus three add calls, and the header), packages/nana-setup/tests/doctor-fix-line.test.mjs (new), packages/nana-setup/README.md, REQUIREMENTS.md, docs/code-map.md and docs/requirements-tree.md (both regenerated). The seat alone handles HANDOFF.md (the stale-copies-hooks doctor skill-advice residual and the win-path-commands bin-off-the-Path residual), docs/sessions/ and docs/reviews/doctor-fix-line-<date>/.

Conflicts:
- win-silent-skips has landed; there is no overlap.
- win-hook-settings-repair is landing now. Its README tests-table row goes right after win32-degrade, and win32-degrade sits right after doctor-quiet, where this lane adds its row. It also changes install's win32 settings plan, which this lane reads; no check here depends on that plan. Build from main after it lands.
- win-watchdog-cpu-read, mutation-runner-win-lock and review-test-waits share only REQUIREMENTS.md and the generated docs, so their merges are mechanical.
- In this slate, setup-checkout-spelling and win-config-json-path were not visible to me. This lane's doctor.mjs edits are around lines 306, 356-366, 399 and 428. If win-config-json-path touches the objective-path reads (lines 424-428), a textual conflict is likely; I infer this and did not check it. If a doctor/install disagreement follows, the summary honestly lists that row by hand. Whichever slate lane lands second merges main and gets a confirmation round.
- The steps write only in the lane worktree and the OS temp folder. M4's real home is the scratch HOME and USERPROFILE, and the dry run never starts a pi install.

Most likely wrong: the claim that native Windows behaves the way forced win32 does on macOS. M2's exact string needs a native Windows `install --home` to leave only pi-subagents ✗. M3 needs native win32 to refuse the foreign spec folder. Only the lane's Windows CI leg proves either. Second most likely wrong: the claim that install's dry run is a faithful judge. A leftover settings lock, rules saved as a file, and a failed knowledge build or pi install still get "run install".
