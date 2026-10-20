# readme-windows-checklist — plan attack (one adversary)

Verdict: AMEND

AMEND, not DROP. The lane is worth building. Today the README tells Windows users the pack commands are "untested there". The rehearsal turns the Windows list into something the blocking Windows install-check job runs. Every must-meet test is red on today's code. I re-ran the probes on main f0d6da24 in a temporary clone with a temporary HOME. Main has moved since c827fcf8: knowledge-pull-fail-open-pin landed, and it shares no files with this lane.

What the probes confirmed:
- Today's parseChecklist(readme, "win32") ignores the platform and returns the macOS step 8.
- Today's runReadmeRehearsal({platformName:"win32"}) spawns nothing for a Windows-only README. With both headings it spawns /bin/zsh with no verbatim flag, and its env holds both `Path=C:\caller` and `PATH=<home>/.npm-global/bin:`. Node documents that on Windows the first key in sorted order wins, so the caller's Path would be lost.
- A draft Windows section keeps readme:check green (714 claims against 710 on main, 0 problems). It also keeps the fresh-machine and readme-rehearsal tests green.
- Doctor prints "all good" when · note rows are present (nana-setup.mjs runDoctor), so the Windows note rows do not block step 8.
- In CI run 39325219659 the Windows global pi install took 2m06s. The Windows install-check step took 12 s.

Amendments:
1. I cut the wording fix: the three adopt skills, templates/_shared/working-under-nana-pi.md, the AGENTS.md marker region and nana-soul.md.
   - The win-path-commands must-meet already ruled "Unchanged: templates/_shared's 'Where pi-worker and pi-review are not on PATH (Windows)' fallback, still true". A documented decision beats a fresh one.
   - It is a different feature with no row, and no test of it was planned.
   - It edits a global rule and makes every project's AGENTS working region read "differs" until refreshed.
   - Cutting it drops 6 files, two Done checks (entry-guidance, templates-render) and the conflict risk with sibling lanes.
2. Row placement. R-1850 to R-1852 are README checklist rows. They belong in FEAT-013 SUB-011 after R-1546, beside R-950, R-951, R-1111 and R-1546. readme-install set this precedent: "R-1546 extends FEAT-013 SUB-011". Only R-1853 to R-1855 go in FEAT-015 after R-1545.
3. Two more existing rows get "the macOS fresh-machine checklist": R-951 and R-1111. Once a second list exists, "the fresh-machine checklist" is wider than their macOS-only tests. R-1542 and R-1546 still get the plan's changes.
4. R-1852 is sharpened. It now fails on any `~` or `$HOME`, not only on an unquoted %USERPROFILE%. This pins what the user needs: commands that paste into Command Prompt and work in a user folder with spaces. Added wrong code: `~\nana-pi` in step 3.
5. The R-1855 test loops the caller's key over "Path" and "PATH". This makes "in any letter case" a tested claim. It also asserts a literal ";". Wrong code "join with path.delimiter" goes red on macOS.
6. Step 5 now uses doctor's own remedy words, "in Environment Variables", so the README and doctor's ✗ fix say the same thing.
7. The shell is still bare "cmd.exe", but for the right reason: it is the program step 1 opens. The plan's reason was keeping R-1079's filter green. That filter stays at 3 after pi-seat-live-turn's rewrite. I checked its worktree diff.
8. Done adds a stop rule. If the first Windows run fails on a defect outside this lane, the seat puts it to the owner: a fix lane first, or a dated known-red entry. It never loosens the check.

Class: ordinary is right. The install check is not install, uninstall or doctor, and readme-install was classed ordinary. With the wording fix cut, no rule or skill is touched. The lane touches packages/nana-setup/, so the seat runs install-check locally before the land.

Cross-platform: every test uses stubs and runs on darwin, linux and win32 with no skip. Because the platform is passed explicitly, the Windows suite leg still runs the darwin cases. Linux prints no readme line.

Writes: the builder works only in its worktree. Tests write under os.tmpdir(). The seat's install-check writes only to a temporary home. The CI pass pushes the lane branch, as win-path-commands did.

Files the build touches, after the cut:
- <repo>/README.md
- <repo>/packages/nana-setup/README.md
- <repo>/packages/nana-setup/lib/readme-rehearsal.mjs
- <repo>/packages/nana-setup/lib/install-check-config.mjs
- <repo>/packages/nana-setup/lib/install-check.mjs
- <repo>/packages/nana-setup/tests/fresh-machine.test.mjs
- <repo>/packages/nana-setup/tests/readme-rehearsal.test.mjs
- <repo>/packages/nana-setup/tests/install-check.test.mjs
- <repo>/REQUIREMENTS.md
- <repo>/docs/requirements-tree.md
- <repo>/docs/code-map.md

Conflicts:
- pi-seat-live-turn (building) is the hard conflict. Its diff (<worktrees>/pi-seat-live-turn) edits:
  - install-check-config.mjs: PI_TURN, PI_SESSION and SPAWN_TIMEOUT_MS, directly above README_REHEARSAL
  - install-check.mjs: the import line
  - install-check.test.mjs: the recordingRun stub, the R-1079 filter and about 180 lines of new tests
  - the setup README paragraphs on either side of "On macOS only…"
  - REQUIREMENTS.md: rows R-1790 to R-1796 directly after R-1545
  So this build waits for it to land. Planning can go ahead now.
- win-hook-rows: no textual wait. A new win32 doctor ✗ would fail both the main doctor row and this lane's step 8, so whichever lane lands second merges main and re-runs the Windows CI leg.
- install-pins: if it adds tests to install-check.test.mjs or fresh-machine.test.mjs, land the two lanes one after the other.
- The other lanes in flight share no files: pwsh-lexer-oracle, mutation-runner-win-prune, review-records-pin, and knowledge-pull-fail-open-pin (now landed).

The claim most likely wrong: that CI's Windows install-check leg prints PASS readme checklist on its first run. No part of the Windows rehearsal has run on Windows:
- cmd /s quoting of a joined line with inner quotes
- the git redirect to a drive-letter checkout from a shallow checkout
- npm's prefix-root launcher layout
- the nana-setup .cmd shim (the goto-undefined layout) chained with &&
- trust through the shim
- doctor's "all good" when run from the rehearsal clone, which the main check never does
All of these are inferred from Node and npm docs, the macOS leg, and the main check's Windows PASS.
