# install-check-turn-edit-powershell — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds. I rebuilt it in a temp clone of main and ran it for real on macOS (pi 1.0.2, temp HOME):
- A fresh `nana-setup install` seeded `{"objective":{"projectFile":"OBJECTIVE.md"}}`.
- After the merge, a live offline faux turn ran with the installed nana-pack, nana-knowledge, pi-subagents 0.75.0 and the tool list. It exited 0 with empty stderr.
- The results came back in call order:
  - bash: gate block, isError true.
  - write: `- check "<node>" -e "..." "<abs>" exited 3: <prompt> <token>`, isError false.
  - powershell: `nana-gate: verifier pipe blocked (headless fail-closed): ...`, isError true.
- Doctor then read `✓ pi nana-pack.json`.
- Without the tool list, the active tools were read, bash, edit and write plus pi-subagents' three tools, and the fixture made no powershell call.
- A grep of main confirms four rows are red today: there is no postEdit write, no `--tools`, and neither new line exists. R-2001 is green by construction, and the plan names its wrong code.

Subtraction check: I also tried enabling powershell from inside the fixture with `pi.setActiveTools` in `session_start`, which would have removed R-2003 and the winCommand risk. The pi turn hung with no output, so I kept the plan's `--tools`. winCommand quotes `"read,bash,edit,write,powershell"`, and its refused-character list leaves commas alone.

Amendments:
1. R-2000's test now substitutes the placeholder the way nana-post-edit does on the host. On win32 that is `"%NANA_PI_FILE%"` with the env var set. So the Windows suite leg, which blocks release, runs the real cmd.exe path. Before, only CI's install-check leg could show it, and that was the plan's weakest claim.
2. The check source uses `process.exitCode=<code>` instead of `process.exit(<code>)`, because Node pipes are async on macOS and an early exit can drop output. Probed: status 3, full stdout.
3. The judged exit text `exited <code>` is built from the sealed code. The `{file}` placeholder is sealed in config with its contract provenance. A retune then changes one value, not two.
4. R-2003 and R-2004 now carry the "no other platform" negative that their tests assert. That negative is load-bearing: a macOS `pi powershell gate` line would fail every real macOS run. Both rows are in ubiquitous EARS form with one shall each. In R-2000, "every other key" becomes "every other top-level key".
5. A non-object `postEdit` is replaced rather than spread.
6. New config exports go directly after PI_TURN, and new checks go directly after the `pin R-1790 to R-1796` check, so hunks stay apart from slate edits to HOOKS, SPAWN_TIMEOUT_MS or the file end.
7. The base moves to main cdf4b098, because review-test-waits landed.
8. The builder runs the macOS install check with `env -u NANA_WORKTREE_ROOT`. Otherwise the gate's lane write boundary (nana-gate.ts laneWriteHit) blocks the fixture write.

The lane class stays ordinary: the precedent must-meet for pi-seat-live-turn says "Class: ordinary" for this same fixture.

Files the build touches:
- packages/nana-setup/lib/install-check-config.mjs
- packages/nana-setup/lib/install-check.mjs
- packages/nana-setup/lib/install-check-turn.mjs
- packages/nana-setup/tests/install-check.test.mjs
- packages/nana-setup/README.md (Install check paragraph only)
- REQUIREMENTS.md
- docs/requirements-tree.md and docs/code-map.md (generated)

Conflicts, checked against each worktree's diff from its merge base:
- No in-flight lane edits these source files.
- doctor-fix-line, setup-checkout-spelling and win-config-json-path share REQUIREMENTS.md under different FEAT-015 anchors, the generated files, and packages/nana-setup/README.md (their edits are in the doctor section and tests table, not the Install check paragraph).
- win-config-json-path changes the pack's config.ts loader. A valid merged JSON object is unaffected.
- doctor-fix-line can change the doctor line the seat reads in the macOS install check, but that is not a file conflict.
- In this slate, hook-deadlines and pi-probe-timeout may touch install-check-config.mjs, install-check.mjs or the test file's end. Any conflict would be small and textual, so neither needs to wait.

Most likely wrong: that pi 1.0.2 on native Windows enables the powershell tool from `--tools` passed through the npm pi.cmd shim, so the fixture's `getActiveTools()` sees it and the errored result starts with the gate block text. Every live probe ran on macOS. Only CI's Windows install-check leg shows this. The cmd.exe check command is now covered by the Windows suite leg.
