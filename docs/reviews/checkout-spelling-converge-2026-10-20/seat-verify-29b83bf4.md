# Seat checks — checkout-spelling-converge build 1, tip 29b83bf4 (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`); the lane branched from main 07f8f6f9
  (the post-edit-timeout-name land tip), with the plan at 0ddc32e0:
  - Build 1 is one commit, 8d6af832. `linkSkill` (steps.mjs) enters the foreign-link branch only when the link's text,
    resolved against its folder, differs from the source; it then compares `realPath(…, { mustExist: true })` of link
    and source, and a dangling link or another real path stays a PROBLEM "foreign link". A match falls through to the
    ordinary relink. settings.mjs gains one private predicate, `respelledKnowledgeEntry`: no `args`, both commands
    name an installer knowledge target, the commands differ, every other key equals the wanted entry, and both targets
    are one file under the native lookup (a throw reads false). `removeInstallerHooks` removes an exact or a respelled
    entry; `mergeRepoHooks` also replaces a healthy "posix"-form entry whose command differs and whose target is the
    same file. The healthy check keeps `fs.realpathSync`, with the comment the brief asked for. uninstall.mjs's
    `settingsVariants` reads the settings after removal. `scripts/test.mjs` declares the new file's skip on win32. The
    new `checkout-converge.test.mjs` holds R-2200 to R-2204; the setup README rewrites the earlier-spelling bullet and
    the uninstall sentence, and adds a tests-table row; the tree and code map are regenerated.
  - The builder also ran the locked full suite (181 files, 0 failing), which the brief did not ask for (it said to run
    single test files only). That is the builder's own run; the seat did not re-run it.
  - 29b83bf4 merges main c7f582ad (the pi-launch-followups land tip) into 8d6af832; the only conflict was the generated
    tree. d7bc8a46 adds the seat's pairs. After it, the seat's notes commit adds only this record, the independent
    check, the Windows log, the two review briefs, HANDOFF and the session entry.
- CI run 39409313594 on draft pull request #125 at 29b83bf4 (GitHub's merge commit 3f2cfc8a merges 29b83bf4 into its
  own ancestor c7f582ad, so the tree tested is 29b83bf4's):
  - macOS `181 files: 179 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7919 pass, 0 fail, 29 skip`; checkout-converge
    `5 pass`, checkout-spelling `6 pass`, settings-merge `221 pass`, uninstall `31 pass`.
  - Ubuntu `181 files: 178 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7858 pass, 0 fail, 48 skip`; checkout-converge
    `5 pass, 1 skip`, the skip being the case spelling on a case-sensitive volume, so all five checks ran through the
    link spelling. That settles the plan's inference that the copied-checkout install works on Linux. checkout-spelling
    skips as declared (R-1986); settings-merge `221 pass`, uninstall `31 pass`, retired-artifacts `47 pass`.
  - Windows `181 files: 163 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6845 pass, 0 fail, 110 skip`
    (`ci-windows-29b83bf4.log`). The 18 skipped files are main's declared 17 (16 desk files and bench's study-tasks)
    plus this lane's file, which the runner skips with its declared reason:
    ```
    SKIP  packages/nana-setup/tests/checkout-converge.test.mjs            POSIX-only: skill links are copies on win32 and uninstall refuses there
    ```
    settings-merge `214 pass, 7 skip`, checkout-spelling `5 pass, 1 skip`, retired-artifacts `47 pass, 1 skip`,
    skills-and-standards `63 pass, 4 skip`, uninstall `2 pass, 2 skip`.
  - install-check: macOS and Windows success.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arose, since GitHub's merge commit holds 29b83bf4's tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-29b83bf4.txt`, committed in d7bc8a46), through
  the shared mutation runner on 29b83bf4, macOS, Node 22.22.2, one shard, each check running both the link and the
  case spelling (declared (a)): 12 of 14 red, 2 survived, both declared before the run.
  - Red: the brief's W1 to W8 (P1, P2, P3, P11, P6, P7, P8, P14) and the seat's P4, P9, P12 and P13. By row: P1 and
    P4 turn R-2200; P2 and P3 turn R-2201; P11 and P12 turn R-2202; P6, P9 and P14 turn R-2203; P7 and P8 turn R-2204.
    P13 makes a normal install rewrite its own healthy entry and turns three settings-merge checks red. Ten pairs turn
    exactly their named titles; P4 also turns R-2202 red, and P13 two unnamed settings-merge "nothing to do" checks.
  - Survived: P5 (a dangling newly managed link falls through to the relink instead of reading foreign) and P10 (the
    respelling predicate owns an entry whose target is missing). No check plants either shape (declared (b)). The
    seat's probe shows the lane's own code right there, as main: a dangling py-lint link reads foreign, keeps its text,
    and install exits 1; a respelled entry with a missing target is left as a variant. Both go to HANDOFF as one
    residual.
  - No pair for the runner's skip entry (it acts only on the win32 leg) or the comment beside the healthy check; the
    predicate's args, marker and equal-command tests and mergeRepoHooks' posix-form test act the same on POSIX and
    forced win32, so they have none either (declared (c)). No pair ran on Windows, where the file is skipped.
- Independent check (`independent-check-29b83bf4.md`): it ran on 29b83bf4 in a private clone beside a clone of main
  c7f582ad, temp homes, macOS APFS, with a forced win32 run. HOLDS, no MUST, 12 probes plus the must-meet file
  (`SUMMARY PASS=5 FAIL=0 SKIP=0`) and neighbours (settings-merge 221/0, uninstall 31/0, retired-artifacts 47/0,
  checkout-spelling 6/0). skills-and-standards read 82 pass, 6 fail on the lane and on main alike, the same six titles,
  because the temp home has no pi-subagents; that is the check's environment, not the lane.
  - A home rewritten to the linked spelling converged on install through the on-disk spelling: 20 links and the
    knowledge entry, exit 0, no problem row; main on the same home kept 4 links and the entry in the linked spelling
    (probe 2). The case spelling converged the same way, and a second install there said nothing to do (probe 3).
  - Four newly managed links to the other copy stayed foreign, texts byte-identical, exit 1 (probe 4); the dry run left
    the home byte-identical (probe 5); uninstall removed the respelled entry and kept a foreign one and a respelled one
    with another key changed, each as a variant, where main left the respelled entry (probe 6). Forced win32 settings
    and install rows were identical, lane against main (probe 9). Nothing was written outside the check's own folders
    (probe 12).
  - Its findings and how each was settled:
    1. Known bug, low (probe 7): when settings already hold the exact knowledge entry, a respelled duplicate beside it
       is rewritten into a second identical entry, reported `created added`. Main kept two entries that differed only
       in spelling, so the count does not grow; uninstall removes both. Whether Claude Code runs an identical command
       once is the check's inference, not verified. Not fixed; a HANDOFF residual.
    2. Out of scope (probe 8): under a home reached through a link (`/var` to `/private/var`), a relative newly managed
       link into this checkout is now rewritten to the absolute on-disk path; main kept its text. Under a canonical
       home the text is kept (probe 11). The plan excludes the home's own spelling and names the like case of a link
       through the owner's own intermediate link. Recorded as one HANDOFF residual.
    3. Pre-existing (main c7f582ad prints the same): the dry run prints `created added` for a knowledge rewrite, not a
       would form. Recorded with the plan's limit that install reports the rewrite as added, as one residual.
- The plan's known limits, each now a HANDOFF residual: nothing changes on Windows (forced win32 through a link kept six
  hook entries in that spelling; no real junction run); a checkout moved with no link left still gives four foreign
  link rows and exit 1, as main; the dry runs are untested for these homes; where the native lookup fails, a case
  spelling reads as another copy again (realpath-strict-fallback's path); the new file repeats checkout-spelling's copy
  and repoint helpers. Install never writes a linked spelling itself, by design.
- HANDOFF: one Landed line. Three setup-checkout-spelling residuals go: uninstall leaving an earlier-spelling knowledge
  entry, install leaving four skill links in the old spelling, and the settings merge's older lookup with no comment
  (the comment is now there). Nine new residuals, each naming this lane: the duplicate entry (finding 1); the
  relative link under a linked home (finding 2); the added wording (finding 3 and the plan); Windows; a moved checkout
  with no link; the untested dry runs; the native-lookup failure; the repeated helpers; and P5 with P10 as one line.
- Land reviewer: Claude Fable 5.1 reviews the land, so the seat writes no `seat-land.md`.
- Rows: R-2200 to R-2204 read `implemented` in REQUIREMENTS.md. At the notes commit: `node
  scripts/requirements-trace.mjs` reads `1585 total (1345 implemented · 1 planned · 37 retired · 197 untested · 5
  violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 345 modules, 0 problems; `npm run
  readme:check` reads 721 claims, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base c7f582ad):
  ```
  tree movement c7f582a..d7bc8a4: 5 rows in 2 features
  FEAT-013 · Install and connect harness runtimes
    R-2200 new (implemented)
    R-2201 new (implemented)
    R-2202 new (implemented)
  FEAT-018 · Update or remove managed components safely
    R-2203 new (implemented)
    R-2204 new (implemented)
  ```
  CAP-04 moves from 474 to 479 rows, FEAT-013 from 180 to 183 (SUB-012 39 to 41, SUB-013 45 to 46) and FEAT-018 from
  22 to 24. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was c7f582ad at the merge in 29b83bf4, the merge base. It is now c203f485: notify-lifecycle-pins,
  mutation-runner-takeover-race and handoff-cap-surrogate have landed, touching no nana-setup file and not
  `scripts/test.mjs`. A trial merge of main (`git merge-tree`, nothing written) conflicts only in the generated code
  map. realpath-strict-fallback lands first in the chain. It adds a setup README bullet right after the one this lane
  rewrites; a trial merge of its branch conflicts in that README bullet and the three generated files. The planner's
  notes (not the committed plan) ask for this lane to merge main once realpath-strict-fallback has landed, before the
  final review, resolve that bullet, regenerate the map and tree, re-run the pairs on the merged tip, and run the macOS
  install check before the land. The seat's chain merge covers the merge; the pairs re-run follows it.
