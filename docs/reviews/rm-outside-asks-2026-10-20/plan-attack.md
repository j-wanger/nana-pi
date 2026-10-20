# rm-outside-asks — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan is sound and its central claims hold under my own probes, but five fixes are needed. All probes ran in a temp clone with a made-up temp HOME. The folder is deleted, no probe process is left, and the repo is clean.

What I confirmed:
- Red today. The plan's 21 outside spellings (14 bash, 7 PowerShell) all ALLOW headless on main 72abe19a. `rm -i`, `rm -d`, `rm --verbose` and `rm -- -f ../x` also ALLOW. `rm -rf ../x` still blocks.
- Baselines. gate-corpus has 227 PASS and gate-rm-inside has 11 PASS. No other gate-loading test sends a plain rm. Every rm they send is recursive, so no existing count should move.
- Replay (read-only, outputs kept in the temp folder): 376 rm-shaped pi calls recorded on the seat's Mac (297 reviewer, 74 builder, 5 other) went through my prototype of the plan's design.
  - With the temp-folder pass: 1 new ask, a reviewer's `rm /config`, and 0 for builders. This matches the planner.
  - Without the pass: 73 reviewer calls would block on literal `/tmp/…` cleanup. The pass earns its place.
  - Builders clean up with variable-led targets (`rm -f "$msg"`, `"$log"`, `"$backup"`), so the variable rule carries their cleanup.
- Lane class is gate. The design is not over-built: each part maps to an honest spelling or to a measured headless cost.

Amendments:
1. A subshell cd can miss a delete. The plan's known limit 5 says a cd inside `( … )` "can only over-ask". That is false.
   - My prototype of the plan's design gives no hit for `(cd sub/deep && true); rm ../../x`, which deletes outside the working folder.
   - Fix: in a command the gate cannot split, a cd adds a folder to the set instead of replacing it. A relative target asks if it is outside from any folder in the set. On the 376 recorded calls this adds 0 asks.
   - R-2335's row now covers this case and PowerShell `Set-Location`. It still has one "shall".
   - Its test adds `(cd .. && rm x)`, `{ cd ..; rm x; }`, `(cd sub/deep && true); rm ../../x`, `cd -P .. && rm x`, `Set-Location -Path ..; Remove-Item x`, and `(cd sub && rm x)` as a no-hit case.
   - Wrong codes (p) and (r) are added.
2. A cd's folder is now the first word not beginning with `-`. Before, `cd -P ..` and `Set-Location -Path ..` read the flag word as the folder.
3. R-2337 is narrowed to the promise builders rely on: a variable-led target runs unasked.
   - The old row also pinned `$(…)`, `~user` and unreadable-cd targets as "shall stay unjudged". That is the "limit stated as a shall" pattern the 2026-10-09 audit flagged (C13).
   - Those forms stay in known limit 1, unpinned.
4. The handler checks now control the temp folder. lane-guard-temp-root's rows drop or fence a temp root that holds home (R-2271).
   - The plan's harness, copied from gate-rm-inside, puts HOME under the system temp folder. Its R-2333 handler check (`rm -f <system temp>/…` ALLOW) could then block. This is inferred from the other lane's rows; its final code does not exist yet.
   - Fix: point HOME at `F/home` and TMPDIR (TEMP and TMP on Windows) at `F/tmproot` as siblings, set after the fixtures exist.
   - This keeps the unresolved `/var` spelling on macOS and the 8.3 spelling on Windows CI, so wrong code (q) still bites.
5. Brief hints added:
   - `tokens(text, true)` splits `2>/dev/null` into `2` and `/dev/null`. The R-2332 test adds `&>/dev/null`.
   - The module must apply realPath to each temp root.
   - config-project-gate-fallback is added to the tests to re-run.
   - The ladder says the Windows CI leg is read on the reviewed tip as the seat's choice for this lane, following the owner's 2026-10-20 "not every land needs green Windows".

Files the build touches:
- packages/nana-pack/lib/gate-rm-outside.ts (new)
- packages/nana-pack/lib/gate-shell.ts (three exports)
- packages/nana-pack/extensions/nana-gate.ts (commandHit and the header comment)
- packages/nana-pack/tests/gate-rm-outside.test.mjs (new)
- packages/nana-pack/README.md
- REQUIREMENTS.md
- docs/requirements-tree.md and docs/code-map.md (regenerated)

Conflicts:
- review-ledger-run-win-launch has landed (main 72abe19a) and touches no gate file.
- lane-guard-temp-root overlaps:
  - nana-gate.ts: it edits laneWriteHit and this lane edits commandHit; the header comment and imports overlap.
  - Both edit the pack README's gate section, REQUIREMENTS.md and the two generated files.
  - This lane uses its temp-root helper.
- Land order: lane-guard-temp-root first, then rm-outside-asks.
- The other five slate lanes share only REQUIREMENTS.md and the generated files; regenerate on merge.
- Seat: close the HANDOFF Open-for-the owner line "Plain rm outside the working folder" in this lane's reviewed change. The pairs need no pi launch, so the spawn("pi" hazard does not apply.

The claim most likely wrong: "about 1 new ask in 376 calls, 0 for builders". My own prototype measured it, not the built module, on Mac history only. The real module's handling of the split-off pieces of a command it cannot split (heredoc bodies, subshells) may ask more often in reviewer sessions. No Windows history was replayed; Git Bash `/tmp` over-asks there (known limit 7).
