# win-hook-variant-loop — plan attack (one adversary)

Verdict: AMEND

AMEND: cut the install half and keep doctor's half. Add a shape guard the plan was missing. All of this was probed in a temp clone with a temp home, forced to win32.

1. The install repair claims entry shapes that no nana tool ever wrote. I checked git history. Every .mjs hook has been single-quoted since its first commit (c053b020). Exec form has always named the checkout (7b46022c onward). No README or doc shows a double-quoted hook command. The earlier lane win-hook-settings-repair declined these shapes on purpose and pinned the double-quoted look-alike under R-653. The plan's own riskiest claim was that such entries occur at all. Widening install's ownership to entries the owner wrote fails the subtraction test, and it sits outside the "our tools' output" threat model.

2. The loop is narrower than the plan says. On today's main, after install over the plan's variant home, install prints "already wired" six times and writes nothing. Doctor's summary already reads "6 missing — fix by hand as each ✗ line says: settings …". The real gap is the ✗ line itself. It says only "target is missing or does not resolve inside <repo>", with no entry named and no fix given. Doctor's half closes that gap for every shape install leaves (other quoting, exec form, custom folder, other timeout or message), not only the variants.

3. The plan's §3 crashes doctor as written. Running mergeHooks on a copy of a settings file that install refuses throws. With `{"hooks":{"SessionStart":[…],"UserPromptSubmit":"x"}}` it throws `TypeError: groups.find is not a function` and doctor prints no rows. `{"hooks":"disabled"}`, `null` and `5` also throw. The same function runs at every session start through bin/stale-copies.mjs. The amended design checks validateShape first, and R-2412 pins that guard.

4. I built a 20-line prototype in hook-health.mjs. All three amended checks pass on it, and win32-hook-repair reads 14/14. doctor-detail, doctor-fix-line, win32-degrade and stale-copies also pass. On today's main, R-2410 fails, and R-2411 and R-2412 pass as guards. I tried five wrong versions of the code and each failed its named check: old detail kept, the checkout's script not named, every dead target named, a hand repair added to every ✗ row, and the shape guard dropped (TypeError).

Files the build touches: packages/nana-setup/lib/hook-health.mjs, packages/nana-setup/tests/win32-hook-repair.test.mjs, packages/nana-setup/README.md, REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md. It does not touch settings.mjs, doctor.mjs, bin/nana-setup.mjs or settings-merge.test.mjs. R-653, R-923 and the F4 check stay as they are.

Conflicts with lanes in flight: none in code. I checked each worktree's diff and untracked files. No in-flight lane touches hook-health.mjs or win32-hook-repair.test.mjs. linked-claude-folder-remedy edits bin/stale-copies.mjs, which reads only each row's ok and label.
- REQUIREMENTS.md: the new rows go directly after R-1055 at line 1232. objective-path-shapes inserts after R-343 at line 1226, with unchanged lines between the two edits. doctor-path-row-remedy and linked-claude-folder-remedy both append at the end of FEAT-015's table, which this lane avoids.
- README: the new Known limits bullet goes after the withPiStub bullet at line 279. win-pi-launch-orphan appends after line 286. doctor-path-row-remedy edits lines 267–273, and other lanes edit 46–53; this lane avoids both. Line 482 is three unchanged lines away from linked-claude-folder-remedy's insertion at 486.
- Code map and requirements tree: regenerate after merging main.

Overlaps within the slate:
- claude-config-dir: I have not seen its plan. If it changes hook-health.mjs or layout.hooksDir, land this lane first, and have claude-config-dir merge main and rerun win32-hook-repair.
- knowledge-sources-unparseable, knowledge-index-recover and claude-config-dir may append doctor rows to FEAT-015's table end. This lane inserts after R-1055, away from that end.
- verifier-pipe-commit-match may edit README line 49, which this lane leaves alone.
- The rest share only the generated files.

Land order: any time. Land before claude-config-dir if that lane touches hook-health.mjs.

Builder: a simple lane, so a Claude Sonnet subagent builds it. The lane class is still install, hook or gate.

Claim most likely wrong: that install's own merge, run on a copy (mergeRepoHooks for the row, then mergeHooks when nothing was found), predicts exactly which entries install leaves on win32. stepSettings first runs removeRetiredContextHook, which touches only the bash context-size entry, and skips migrateLegacyHooks on win32. So I infer the prediction holds, but I have not probed it on a native Windows leg.
