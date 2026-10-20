# Seat checks — setup-checkout-spelling builds 1 and 2, tip 06e9b65d (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker; the lane branched from main 6bc2f727:
  - Build 1 (`build-brief-1.md`): rows R-1980 to R-1985 (86e1e71c), the must-meet checks first (8fa24d53), then the
    code (6bf3c850). `lib/paths.mjs` computes `pkgRoot` through the pack's `realPath`, the folder's spelling on disk.
    Each compare that judges a path against the checkout moves from `fs.realpathSync` to `realPath(x, { mustExist:
    true })`: `linkOk`, `skillLinkState`, `linkSkill`'s foreign-link test, the two retired-hook compares,
    `pathVisibleNode`'s candidate, the win32 hook settings rows, `knowledgeHookHealthy`, and uninstall's `repoReal`,
    preflight targets and per-link removal target. `realpathSafe` becomes `realPath(p)`. The setup README gains one
    Known-limits bullet and a tests-table row.
  - Build 2 (`build-brief-2.md`): 5c5e287b, after CI on 6bf3c850 failed two of the lane's files. Ubuntu failed
    checkout-spelling as `0 pass, 7 skip — no check passed and no skip was declared`. Windows failed one
    pi-registration check, `the throwaway worktree is a linked worktree of the main clone`: the test compared through
    `fs.realpathSync`, which keeps the typed 8.3 spelling, while the product's `repoRoot` was right. Build 2 declares
    the file's skip in `scripts/test.mjs` through `checkoutSpellingSkipReason` in `test-runner-config.mjs` (the same
    case-swap probe the test uses, never the platform name; row R-1986 in FEAT-031), and compares the worktree through
    `realPath` in the test. No nana-setup code changed.
  - 06e9b65d merges main cdf4b098 (review-test-waits' land tip) into 5c5e287b. After it, the seat's notes commit adds
    only this record, the independent check, the Windows log, the two review briefs, HANDOFF and the session entry.
- CI run 39375927343 on draft pull request #103 at 06e9b65d (GitHub's merge commit a5a5bcaf merges 06e9b65d into its
  own ancestor cdf4b098, so the tree tested is 06e9b65d's):
  - macOS `175 files: 173 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7789 pass, 0 fail, 27 skip`; checkout-spelling
    `6 pass`, test-runner `45 pass`, pi-registration `70 pass, 3 skip`.
  - Ubuntu `175 files: 172 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7728 pass, 0 fail, 45 skip`; checkout-spelling
    `SKIP … no second spelling exists on a case-sensitive volume`, the declared skip R-1986 pins; test-runner
    `45 pass`, pi-registration `70 pass, 3 skip`.
  - Windows `175 files: 158 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6724 pass, 0 fail, 104 skip`
    (`ci-windows-06e9b65d.log`). The 17 skipped files are the 16 declared desk files and bench's study-tasks, main's
    declared set. checkout-spelling `5 pass, 1 skip` ran all three second spellings natively:
    ```
    SPELLING case — canonical=C:\Users\runneradmin\AppData\Local\Temp\nana-test-5708-JIUS7f\nana-spelling-TOOPXL spelled=C:\Users\runneradmin\AppData\Local\Temp\nana-test-5708-JIUS7f\NANA-SPELLING-toopxl
    SPELLING lowercase drive — canonical=C:\Users\runneradmin\AppData\Local\Temp\nana-test-5708-JIUS7f\nana-spelling-TOOPXL spelled=c:\Users\runneradmin\AppData\Local\Temp\nana-test-5708-JIUS7f\nana-spelling-TOOPXL
    SPELLING 8.3 short — canonical=C:\Users\runneradmin\AppData\Local\Temp\nana-test-5708-JIUS7f\nana-spelling-TOOPXL spelled=C:\Users\RUNNER~1\AppData\Local\Temp\nana-test-5708-JIUS7f\nana-spelling-TOOPXL
    PASS R-1980: doctor through a second spelling of the checkout gives the same rows as through its on-disk spelling
    PASS R-1981: install through a second spelling of the checkout exits 0 and refuses none of its own links
    PASS R-1982: install through a second spelling of the checkout leaves the home byte-identical
    PASS R-1983: after installs through both spellings the stale-copy producer prints nothing through either
    PASS R-1984: links, hook entries and pi entries written through another spelling of the checkout still read as this checkout's
    SKIP R-1985 — uninstall is POSIX-only
    ```
    test-runner `45 pass` (`PASS R-1986: checkout spelling skips exactly when the temporary volume has no second
    letter-case spelling`); pi-registration `73 pass, 2 skip`, the build-1 failure now passing.
  - install-check: macOS and Windows success.
  - Build 1's CI run 39372424797 (6bf3c850; `ci-windows-6bf3c850-build1.log`): macOS `174 files: 172 PASS, 0 FAIL`;
    Ubuntu `171 PASS, 1 FAIL` (checkout-spelling, above); Windows `155 PASS, 2 FAIL, 17 SKIP` (pi-registration, above,
    and main's mutation-runner lock check, which mutation-runner-win-lock fixed on main before 06e9b65d's merge);
    checkout-spelling `5 pass, 1 skip` on Windows there too; both install checks success.
  - None of main's other known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86 and
    Windows main read 0 FAIL from 4be0b79 (both in the lane's base); no R-291 merge artifact arises, since GitHub's
    merge commit holds 06e9b65d's tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-6bf3c850.txt`, committed in 5779dc75), through
  the shared mutation runner on 6bf3c850, macOS, Node 22.22.2, one shard, each pair run in POSIX form and forced
  win32 through the case spelling (declared (a)): 10 of 14 red, each by exactly its named titles; 4 survived, each
  declared before the run.
  - Red: M1 (pkgRoot keeps node's spelling) turns R-1980 and R-1982; M2, M3, M4, M8, M9 and M10 turn R-1984; M12 and
    M13 turn R-1985; M14, every site in main's form (main's code), turns all six. Baseline checkout-spelling `6 PASS`.
  - Survived: M5 and M6 (the two retired-hook compares in `stepRetiredArtifacts`) and M7 (`pathVisibleNode`'s
    candidate): no must-meet check reaches them with a second spelling (declared (c), must-meet Known limits). M11
    (uninstall's `repoReal`): with pkgRoot canonical, `repoRoot` is already the on-disk spelling, and R-1985 runs
    uninstall only through it (declared (d)). Each is a HANDOFF residual.
  - No single-site pair turns R-1981 or R-1983 red (plan-attack amendment 4); M14 and the tests-first commit 8fa24d53
    are their evidence (declared (b)). The case-fold alternative (build brief 1's W11) has no pair (declared (e)).
  - Build 2 changed no nana-setup code, only tests, the runner's declared skip and its config, so the record stands
    for 06e9b65d. No pair ran on Windows; CI's native run of the checks is the Windows evidence.
- Independent check (`independent-check-6bf3c850.md`): it ran on build 1, 6bf3c850, not on 06e9b65d. A private clone
  switching between main 6bc2f727 and the lane, temp homes, macOS APFS, the case spelling: HOLDS, no MUST, ten probes
  plus the must-meet file (`SUMMARY PASS=6 FAIL=0 SKIP=0`, nothing written to the parent home).
  - An upgrade with no spelling change left the home byte-identical and doctor's rows identical (P1). A home main
    wrote through the other case converged at the lane's install: the hook links relinked (`updated relinked (was
    .../X/...)`), the knowledge hook command rewritten, and a second install byte-identical (P2). Forced win32, the
    four launcher rows read ✗ until that install, then converged, as disclosed (P3). The forced-win32 stale-copy
    producer stayed silent where main printed a false `INSTALL STALE` line (P4). The rulings extension's `linkOk`
    held (P5), the dry run changed nothing (P6), and a real uninstall matched main's (P7). A checkout named in two
    Unicode forms read 0 differing doctor rows against main's 22 (P8). A symlinked checkout held (P9). The pi package
    source row read ✓ where main read ✗ (P10).
  - Its finding and how it was settled:
    1. Known bug, disclosed, not a MUST: uninstall no longer removes a knowledge hook entry an earlier install wrote
       through another spelling. Main installed through `/X`, then the lane's uninstall through `/X` left 1 entry;
       main's own uninstall left 0. POSIX only, since uninstall refuses on Windows. Not fixed: the plan's Known limits
       and the setup README call it a small regression. Recorded as a HANDOFF residual.
  - Not verified there: the lowercase drive letter and the 8.3 short name, now run natively by CI's Windows leg at
    06e9b65d (above); a subst or mapped drive, where the native realpath may return a UNC path (inferred), recorded as
    a HANDOFF residual. It did not run the install check; the seat runs it on macOS before the land.
  - Nobody re-ran it on build 2, which changed only tests and the runner's skip; CI covers that change.
- The plan's known limits: the one-time convergence of an earlier-spelling home goes into the Landed line; the
  uninstall knowledge entry, the desk plist read ✗ until `install --desk` (inferred), the unchecked retired-hook,
  `pathVisibleNode` and rulings-extension paths, `realpathSafe`'s fallback on a non-missing error, and the subst or
  mapped drive are each a HANDOFF residual. Link spellings, which node resolves itself, the home's own spelling (an
  existing residual) and output printed in the on-disk spelling are by design.
- HANDOFF: one Landed line. The win-path-commands residual on a launcher read as stale through another letter case
  now names only the one-time rewrite of a launcher written before this lane. Six new carried residuals, each naming
  this lane: the uninstall knowledge entry; the three unchecked compares and the rulings extension (M5 to M7); the
  uninstall root compare (M11); the desk plist; the subst or mapped drive; the fallback on a non-missing error.
- Rows: R-1980 to R-1986 read `implemented` in REQUIREMENTS.md. The seat helper's run at 06e9b65d:
  `node scripts/requirements-trace.mjs` reads `requirements: 1519 total (1253 implemented · 1 planned · 34 retired ·
  226 untested · 5 violated); 1253 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check`
  reads 334 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base cdf4b098): `cdf4b09..06e9b65:
  7 rows in 4 features`. FEAT-013: R-1981, R-1982, R-1984; FEAT-015: R-1980, R-1983; FEAT-018: R-1985; FEAT-031:
  R-1986; all new (implemented). CAP-04 moves from 416 to 422 rows, FEAT-013 from 156 to 159 (SUB-013 32 to 34,
  SUB-014 32 to 33), FEAT-015 from 96 to 98, FEAT-018 from 21 to 22; CAP-07 from 306 to 307 and FEAT-031 from 91 to
  92.
- Not in this record: a locked full-suite run (CI's three legs ran the whole suite) and the local macOS install check,
  which runs before the land.
- Main was cdf4b098 at the merge in 06e9b65d, the merge base. Main has since moved to 8466795b (doctor-fix-line
  landed). It changed `lib/doctor.mjs`, `bin/nana-setup.mjs`, the setup README, HANDOFF, the session archive,
  REQUIREMENTS.md, the tree and the code map; it did not change the lines this lane changes in `lib/doctor.mjs`. A
  trial merge of main into 06e9b65d (`git merge-tree`, nothing written) conflicts only in the generated code map and
  tree; this notes commit adds HANDOFF and session-file edits at the places doctor-fix-line edited too. So the land
  needs a merge of main, a re-run of the pairs on the merged tip (plan-attack's order for these two lanes) and a
  confirmation round on that tip.
