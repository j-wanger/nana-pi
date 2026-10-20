# checkout-spelling-converge — plan attack (one adversary)

Verdict: AMEND

Probes ran on a temp clone of main aa5f25cd (which contains 54433844), on macOS APFS with temp homes.

1. MUST fix: the Windows suite leg would go red. The plan's new file SKIPs every check on win32. The runner calls a file that exits 0 with no PASS a failure. Probe: a dummy all-SKIP file under packages/nana-setup/tests gave "FAIL ... 0 pass, 1 skip — no check passed and no skip was declared". The Windows leg blocks release. WINDOWS_SKIPS cannot take the file, because R-1383 limits that list to desk and bench files. Fix: add one platform-keyed entry to the SKIPS map in scripts/test.mjs, as hooks-win32-exec.test.mjs already has. No in-flight worktree touches scripts/test.mjs.

2. Red-today evidence confirmed:
- R-2200 (link): 16 links were relinked; spec, py-lint, py-review and py-test printed "unchanged" and kept the old spelling. Case gave the same.
- R-2202 (link): "already wired", and the command kept the link spelling. Case is already rewritten today.
- R-2203: both spellings gave "settings hook variant skipped left", and the entry stayed.
- Guards R-2201 and R-2204 are green on main and on my candidate. W2 turned R-2201 red (exit 0, texts changed, 0 foreign rows). W7 turned R-2204 red (entry B removed).

3. The candidate design held. My version of the brief added 21 lines and removed 8. It turned every red case green on both spellings. These files passed alone on it: retired-artifacts 47, settings-merge 221, uninstall 31 and checkout-spelling 6, all with 0 FAIL. R-665's relative-link test stays green because its link text resolves to the on-disk source path.

4. Rows were wider than their tests. "Another spelling" now reads "another letter case or a link to it". R-2201 and R-2204 now name only "another copy of the repository"; R-665 already covers other foreign targets.

5. Subtraction:
- W5 dropped: it is W4 plus a native lookup, and adds no check.
- The win32 guard in removeInstallerHooks is dropped. The predicate is already false on win32, because the wanted knowledge entry there has args and its command is "node".

6. New known limits, measured:
- A checkout moved with no link left: install exits 1 with 4 "foreign link" rows, on main and on the candidate.
- Forced-win32 install through a link keeps all six hook entries in the link spelling, so the README must not claim Windows converges a junction spelling.

7. The class is right: install, hook or gate. A lane is one feature, but here the two uninstall rows (under FEAT-018) fix this checkout-spelling regression (HANDOFF residual 625). Splitting them out would double the install, hook or gate review steps, so they stay as the plan bundled them.
