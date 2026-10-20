# Seat checks — win-hook-settings-repair builds 1 and 2, tip dc56f0d8 (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (`--lane-size larger`, the roster's larger builder):
  - Build 1 (`build-brief-1.md`): 14844fc6, merged with main d4423eff at 805d225a. Rows R-1880 to R-1885 at the end
    of SUB-013 after R-1208, R-316's evidence (the win32 exception) and R-653's pin. In `lib/settings.mjs`,
    `installerTarget` gains two win32-only forms: `posix-shell`, the five Node hooks under the POSIX installer's
    default hooks folder (`POSIX_INSTALLER_HOOKS_SUFFIX`) in their exact single-quoted command, and `posix-unquoted`,
    the first installer's exact unquoted knowledge command. `mergeRepoHooks` on win32 scans the PreToolUse groups
    whose matcher is `POSIX_VERIFIER_MATCHER`, splices each timeout-5 installer-shaped verifier, appends
    `{...moved, command, args}` under `WIN_VERIFIER_MATCHER` only when no installer-shaped verifier is already there,
    and counts the move as a repair (`replaced = movedVerifier`). The header rules comment records the exception;
    the setup README's hooks row and "Install never removes or reorders" bullet name the repair and the move, and
    the tests table gains the new file. `tests/win32-hook-repair.test.mjs` holds the plan's eight checks.
  - Build 2 (`build-brief-2.md`): dc56f0d8, after the independent check and the first pairs. `mergeRepoHooks` drops
    a `Bash` group only when this pass spliced an entry out of it (`removedFromGroup`, two lines): the independent
    check's F1. Three new checks and rows R-1886 to R-1889: an owner's empty `Bash` group survives an install that
    writes while a group the move empties goes (R-1886; F1 and M11); a move-only repair beside six healthy exec
    entries is written (R-1887; M10); an owner look-alike with its own timeout under `WIN_VERIFIER_MATCHER` stays
    before nana's appended verifier, and the moved verifier keeps an extra owner key (R-1888 and R-1889, one check;
    M13 and M12).
  - After dc56f0d8, f78ece8e adds only the seat's pair table and its output, and the seat's notes commit adds only
    this record, the independent check, the Windows log, the two review briefs, HANDOFF and the session entry. No
    code or test changed in the lane after dc56f0d8. This record does not restate the builder's reports; the pairs
    below re-judge the checks.
- CI run 39361563148 on draft pull request #91 (dc56f0d8; GitHub's merge commit 2f160d3c merges dc56f0d8 into its own
  ancestor d4423eff, so the tree tested is dc56f0d8's):
  - macOS `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7736 pass, 0 fail, 26 skip`; win32-hook-repair
    `11 pass`, settings-merge `219 pass`, win32-degrade `87 pass`.
  - Ubuntu `169 files: 167 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7681 pass, 0 fail, 44 skip`; the same three counts.
  - Windows `169 files: 151 PASS, 1 FAIL, 17 SKIP, 0 WARN · checks: 6675 pass, 1 fail, 78 skip`
    (`ci-windows-dc56f0d8.log`). The 17 skipped files are the 16 declared desk files and bench's study-tasks, main's
    declared set. The one FAIL is `packages/nana-pack/tests/mutation-runner.test.mjs` (`35 pass, 1 fail, 3 skip`),
    its check `mutation runner: contending child processes observe complete lock ownership and never overlap their
    critical sections`: workers killed at the time limit, lock and marker left. That is main's lock bug, which main's
    HANDOFF carries since knowledge-unreadable-root's notes and the urgent mutation-runner-win-lock lane fixes. This
    lane does not touch the mutation runner. win32-hook-repair runs natively and passes all eleven by title:
    ```
    PASS win32 install: carried shell-form SessionStart entries become exec form in place
    PASS win32 install: a shell-form verifier under Bash ends as one exec-form verifier under WIN_VERIFIER_MATCHER
    PASS win32 install: a Bash verifier beside a WIN_VERIFIER_MATCHER verifier ends as one
    PASS win32 install: the Bash group keeps its matcher and other entries when the verifier moves
    PASS win32 install: preserves an owner-empty Bash group but drops the group its verifier move empties
    PASS win32 install: a move-only verifier repair is written
    PASS win32 install: an owner verifier look-alike stays before nana's moved verifier with its extra key
    PASS win32 install: a second install over the repaired home reports all six settings rows unchanged
    PASS win32 doctor: all six settings rows read ✓ after one install over the carried home
    PASS win32 install: the first installer's unquoted knowledge entry becomes exec form in place
    PASS win32 install: shell-form look-alikes (timeout, message, quoting, folder) stay byte-identical
    ```
    settings-merge `212 pass, 7 skip`; win32-degrade `86 pass`; hooks-win32-exec `31 pass`.
  - install-check: macOS and Windows success.
  - Build 1's CI run 39357679413 (805d225a): the same single Windows FAIL (mutation-runner `35 pass, 1 fail, 3
    skip`); win32-hook-repair `8 pass` there; the macOS and Ubuntu suites and both install checks success.
  - None of main's other known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86 and
    Windows main read 0 FAIL from 4be0b79 (both in the lane's base); no R-291 merge artifact arises, since GitHub's
    merge commit holds dc56f0d8's tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, Node 22.22.2, one
  shard, with win32 forced by the lane's file (declared (a)):
  - On 805d225a (`seat-mutate-output-805d225a.txt`, committed in c22d4b3a): 9 of 13 red, each by exactly its named
    titles; 4 survived. M10 (the move not counted as a repair), M11 (an emptied `Bash` group kept), M12 (the moved
    verifier keeps none of its own keys) and M13 (the already-moved test drops its timeout gate) named no title and
    turned nothing red. Build brief 2 sent all four back.
  - On dc56f0d8 (`seat-mutate-output-dc56f0d8.txt`, committed in f78ece8e): 14 of 14 red, 0 survived; 10 by exactly
    their named titles, 4 also turned a build-2 check red that they do not name. M10 to M13 now turn R-1887, R-1886,
    R-1889 and R-1888 red; M14, build 1's form of the group drop (any empty `Bash` group), turns R-1886 red.
    Baselines: win32-hook-repair 11, win32-degrade 87, settings-merge 219, verifier-pipe 29, stale-copies 13,
    uninstall 31, install 106, each 0 FAIL.
  - Declared, no pair: (c) the absolute-path and knowledge-suffix tests of the two new forms, since a look-alike that
    copies nana's message, timeout, quoting and folder is forgery; (d) `POSIX_VERIFIER_MATCHER` replacing the inline
    `"Bash"` in `desiredHooks`, and reusing an existing verifier-matcher group, since neither changes named behaviour.
- Independent check (`independent-check-805d225a.md`): it ran on build 1, 805d225a, not on dc56f0d8. A private clone
  at 805d225a with main d4423eff beside it, temp homes, macOS with win32 forced: HOLDS, no MUST, eight probes plus
  the single-file runs (win32-hook-repair 8 PASS; settings-merge, win32-degrade, stale-copies, install and uninstall
  0 FAIL; code map and readme check 0 problems). A copy of the owner's real Mac hooks block repairs to six exec-form
  entries with one verifier under `Bash|PowerShell`, a second install changes no bytes, and doctor marks all six ✓
  (P1). On macOS the lane's install output and settings bytes match main's apart from paths (P2). Main's win32
  output upgrades to one verifier (P3). Mixed homes: the spaced and forward-slash paths repair in place, the
  backslash entry keeps an exec twin as documented, and foreign groups stay byte-identical (P4). The dry run changes
  no bytes (P5). The test writes nothing outside its temp homes (P6). The documented residual shapes behave as listed
  (P7). Its finding and how it was settled:
  1. F1, known bug, not MUST: on win32 the `Bash`-group pass dropped every empty `Bash` group, so an owner's existing
     empty group vanished whenever install wrote for another reason (P8 case B; main keeps it). Fixed in build 2,
     dc56f0d8 (`removedFromGroup`), and pinned by R-1886, whose check M14 (build 1's form) turns red. The independent
     check did not re-run on build 2; the pairs and CI cover that change. Recorded as a HANDOFF residual.
  It exercised no real Windows host; CI's Windows leg ran the eleven checks natively at dc56f0d8.
- The plan's known limits, each a HANDOFF residual unless said: the mirror case (a Windows exec entry carried to a Mac);
  unclaimed forms (a custom Claude folder, a double-quoted path, a shell form naming the checkout's own hooks folder,
  which under `Bash` keeps an exec twin); a backslash path (an exec twin, doctor ✓ beside the dead entry, R-923's
  limit); an exec-form verifier under `Bash` moves unpinned; repairs report `created added`; carried `.sh` entries
  stay problem rows; nothing runs Claude Code, so one firing per Bash or PowerShell call is inferred. The plan's "no
  check pins dropping an emptied `Bash` group" is closed by R-1886. R-1885's scope (an unreleased form, repaired in
  place, where R-660 excluded one for removal) is a session-entry note, not a residual.
- HANDOFF: one Landed line. The stale-copies-hooks residual on the doubled Windows verifier closes and is removed, as
  the must-meet says. Eight new carried residuals, each naming this lane: the mirror case; the unclaimed forms; the
  backslash path; the unpinned exec-form move; the repair wording; the `.sh` entries; Claude Code's firing inferred;
  the independent check on build 1 only, with the pairs on macOS only. One more line, for the deferred scrub lane,
  names the three committed CI logs that still carry home paths.
- Seat items from other lanes: win-hook-rows' two review notes, install-pins' four, review-records-pin's two, the
  immutable-review flake on install-pins' land suite and main's mutation-runner lock bug are all already carried by
  main's HANDOFF (readme-windows-checklist's and knowledge-unreadable-root's notes, both landed after this lane's
  base). They reach this lane at its merge of main, so the lane adds no second copy. review-records-pin's SHOULD,
  that no hosted run tests R-1842 on Windows, is in this lane's own HANDOFF already.
- Rows: R-1880 to R-1889 read `implemented` in REQUIREMENTS.md, directly after R-1208. The seat helper's run at
  f78ece8e: `node scripts/requirements-trace.mjs` reads `requirements: 1469 total (1195 implemented · 1 planned · 34
  retired · 234 untested · 5 violated); 1195 traced by tests` and `ears: 0 rows off form (allowance 0)`;
  `npm run map:check` reads 327 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base d4423eff): `d4423ef..f78ece8:
  10 rows in 1 features`, FEAT-013 · Install and connect harness runtimes: R-1880 to R-1889 new (implemented). CAP-04
  moves from 387 to 397 rows, FEAT-013 from 130 to 140 and SUB-013 from 22 to 32. R-316's and R-653's evidence
  changed, which the report does not list.
- Not in this record: a locked full-suite run (CI's three legs ran the whole suite) and the local macOS install check,
  which runs before the land.
- Main was d4423eff when the lane branched, its merge base. Main has since moved to bffa2f2d (readme-windows-checklist,
  knowledge-unreadable-root and hook-output-fail-open landed), so the land needs a merge of main, and that merge needs
  its own accepted review coverage. Main changed HANDOFF, the session archive, REQUIREMENTS.md, the tree, the code map
  and the setup README since d4423eff; it did not change `lib/settings.mjs`.
