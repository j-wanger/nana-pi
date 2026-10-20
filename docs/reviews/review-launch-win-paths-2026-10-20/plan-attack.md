# review-launch-win-paths — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is real and small. I probed main 72abe19a in a temp copy with a made-up home. reviewLaunch returns a cmd.exe launch for a missing C:\tools\reviewr.cmd, a missing C:\tools\Reviewr.BAT and a missing relative tools\review.cmd. I built the plan's design in the temp copy and ran the test file once per wrong code. Today R-2430 is red and R-2431 is green, so R-2431 is a guard. The prototype passes all checks, and R-2250, R-2252 and R-2255 stay green.
Wrong-code results (order R-2250 R-2251 R-2252 R-2253 R-2430 R-2431 R-2255):
- Unresolved exists: only R-2431 is red.
- process.cwd: R-2430 and R-2431 are red. The plan named only R-2431.
- Refuse every .cmd/.bat: R-2252 and R-2431 are red.
- Case-sensitive extension: R-2430 is red.
- Refusal without the path: R-2430 is red.
- Check every path: R-2252 is red.
Amendments:
(1) R-2432 is sharpened. Its refused case is now a relative .cmd that exists only in the launcher's folder, not an absolute missing path. That pins "read from the reviewed tree" in both directions, so wrong code 7 (resolver before admission, launcher cwd) turns both halves red, not one. The absolute missing case is already covered by R-2430 at the resolver. R-2250 covers the shared route from refusal to --out on every platform.
(2) The R-2432 row is rewritten to state what the test checks, not "shall judge that path".
(3) R-2431 is narrowed to .cmd, because the test covers only .cmd.
(4) Points the plan left unstated: piLaunch and findOnPath already default to defaultExists, so giving exists that default changes nothing for them. The default readers cannot throw, because piLaunch catches its own reads, so moving the call after admission cannot strand a reservation. The move also makes a bare name's relative PATH entries resolve against the tree, which matches where the child runs. That is a known limit with no row.
Lane class is right: review-ledger is a land and review tool. No install check is needed, because the lane changes no nana-setup code and no hook.
Files the build touches: packages/nana-pack/bin/review-launch.mjs, packages/nana-pack/bin/review-ledger.mjs, packages/nana-pack/lib/win-command.mjs (one export keyword plus its header), packages/nana-pack/tests/review-launch.test.mjs, packages/nana-pack/README.md (the Windows paragraph at about line 284), REQUIREMENTS.md, docs/code-map.md, docs/requirements-tree.md.
Conflicts: I checked every in-flight worktree's diff and uncommitted files. None touches review-launch, review-ledger, win-command, pi-watchdog or this test file. lane-guard-temp-root edits the pack README at line 257 and objective-path-shapes at line 950, so the merge with this lane's line-284 edit is textual only. REQUIREMENTS.md, the code map and the tree are shared by every lane. Merge main and regenerate them before the final round. Within the slate, win-hook-variant-loop is the only plausible overlap, if it edits lib/win-command.mjs. This lane only adds export to defaultExists, so either can land first. Land order: no constraint. waitFor: none.
Claim most likely wrong: R-2432's start half on the Windows leg. It depends on cmd.exe /s /c running a quoted relative path from the spawn's cwd. The red-today claim for the refused half is also inferred: cmd.exe fails with empty stdout, so review-ledger ends in "no verdict" with an empty --out. Nothing here ran cmd.exe.
