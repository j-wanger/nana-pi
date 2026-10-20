# Seat checks — win-claude-skills builds 1 and 2, tip fc6ac33d (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (`--lane-size larger`). Build 1 (`build-brief-1.md`): one
  commit cc3457a3 (rows R-1900 to R-1903, R-351, R-938, R-388 and R-359 pinned, R-665 and R-666 narrowed to non-win32,
  R-669 and R-937 lose the cites of removed checks; stepSkills' and the retired step's win32 skips and the unused
  `skip` helper deleted; doctor's win32 ✗ for a link or a regular file at a skill path, its `skipped (win32; pi-only)`
  note deleted; the stale-copies checker's win32 skip deleted; the four skill labels dropped from the win32 doctor
  note list and the R-1081 pin; the README's skills row and Windows skills paragraph; the regenerated tree). The seat
  merged main d4423eff at 942127f4. Build 2 (`build-brief-2.md`): one commit fc6ac33d. MUST 1: the retired step now
  leaves a link or a directory holding the `.nana-setup-copy` marker at spec, py-lint, py-review or py-test silent,
  and R-1904 in `install.test.mjs` runs a second forced-win32 install on every leg. MUST 2: R-1902's read of the
  installed SKILL.md is guarded, so a missing file fails the check instead of crashing the file. The builder also ran
  the locked full suite, which its brief's single-files rule did not allow: 168 files, 166 PASS, 0 FAIL, 2 SKIP, 7,732
  checks pass (`build-2-suite.log`). After fc6ac33d, c5b69e46 adds only the pair output, and the seat's notes commit
  adds only this record, the independent check, the Windows log, the review briefs, HANDOFF and the session entry. No
  code or test changed in the lane after fc6ac33d.
- CI on build 1, run 39357366425 on draft pull request #90 at 942127f4:
  - macOS `168 files: 166 PASS, 0 FAIL, 2 SKIP · checks: 7729 pass`; Ubuntu `166 PASS, 0 FAIL, 2 SKIP · 7674 pass`;
    install-check passes on macOS and Windows.
  - Windows `168 files: 149 PASS, 2 FAIL, 17 SKIP, 0 WARN · checks: 6666 pass, 3 fail, 78 skip`
    (`ci-windows-942127f4-build1.log`). `install.test.mjs` read 88 pass, 2 fail, 5 skip. It failed natively on
    "second install prints no retired row for a skill it linked" and "second install reports no more skipped rows than
    the first". The second install printed four rows like `– retired .claude/skills/spec  skipped  unrecognized kind
    or provenance at …\.claude\skills\spec — left untouched`, one for each of nana-setup's own marked copies. This is
    the independent check's K1, and build 2's MUST 1. The third failing check, mutation-runner's "contending child
    processes observe complete lock ownership…", is main's (the readme-windows-checklist lane saw it too); the lane
    does not touch the mutation runner.
- CI on build 2, run 39361156672 on draft pull request #90 at fc6ac33d (GitHub's merge commit 112d89bf merges fc6ac33d
  into its own ancestor d4423eff, so the tree tested is fc6ac33d's):
  - macOS `168 files: 166 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7730 pass, 0 fail, 26 skip`. install `107 pass`;
    install-check `114 pass`; retired-artifacts `47 pass`; skills-and-standards `88 pass`; stale-copies `13 pass`;
    state-manifest `20 pass`; win32-degrade `87 pass`.
  - Ubuntu `168 files: 166 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7675 pass, 0 fail, 44 skip`. The same seven files
    pass with the same counts.
  - Windows `168 files: 151 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6670 pass, 0 fail, 78 skip`
    (`ci-windows-fc6ac33d.log`). The 17 skipped files are main's declared set. install `91 pass, 5 skip`;
    install-check `114 pass`; retired-artifacts `47 pass, 1 skip`; skills-and-standards `63 pass, 4 skip`;
    stale-copies `13 pass, 1 skip`; state-manifest `20 pass`; win32-degrade `86 pass`; mutation-runner `36 pass,
    3 skip`. Every must-meet check and both install checks build 1 failed run natively and pass by title:
    ```
    PASS pin R-1081: the doctor note list
    PASS second install prints no retired row for a skill it linked
    PASS second install reports no more skipped rows than the first
    PASS R-1904: forced win32 second install prints no retired row for four marked skill copies
    PASS R-1901: forced win32 install and dry-run refuse all four owner skill directories without changing them
    PASS R-1902: forced win32 install retires the recognized spec fixture and installs the pack copy
    PASS R-351: on win32 install mirrors every shipped file of all five Claude Code skills byte-for-byte
    PASS R-1900: on win32 doctor marks all four newly managed skill copies healthy and names the copy form
    PASS R-938: on win32 doctor names every stale SKILL.md and install refreshes all five copies
    PASS R-388: on win32 each overwritten SKILL.md has one regular in-folder backup and no skill-name backup entry
    PASS R-359: on win32 refresh preserves every owner note and every copy marker
    PASS R-1903: on win32 doctor identifies regular files and a skill link or junction with the move-then-install fix
    ```
  - install-check: macOS and Windows success, each printing `PASS doctor`. The Windows job's doctor step fails any
    note row off the pruned list, so doctor's real win32 output carried no note row for the four skills.
  - So the 13 Windows-only checks the plan rewrote without a local Windows run all hold natively; the plan's "most
    likely wrong" list was right. The Windows skip counts of install (5), retired-artifacts (1),
    skills-and-standards (4) and stale-copies (1) match main's (`ci-windows-5fa19acd.log` in win-hook-rows), so no
    rewritten check passes by skipping.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds fc6ac33d's
    tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS with win32 forced
  through `NANA_SETUP_PLATFORM` where the code branches on it, one shard, Node 22.22.2:
  - Build 1 (942127f4, `seat-mutate-output-942127f4.txt`, committed in d1a4729e): 7 of 7 red, 0 survived. Six went red
    by exactly their named titles. W1 (stepSkills skips the four on win32) crashed `retired-artifacts.test.mjs` at
    R-1902's unguarded read, so R-1902 was named but not reached and the later checks never ran. That is a test
    defect, build 2's MUST 2.
  - Build 2 (fc6ac33d, `seat-mutate-output-fc6ac33d.txt`, committed in c5b69e46): 8 of 8 red, each by exactly its
    named titles, 0 survived. Baselines: skills-and-standards 88, retired-artifacts 47, stale-copies 13,
    install-check 114 and install 107 PASS. W1 now gives a named R-1902 FAIL with no crash, and all later checks
    run. W2 (the retired step skips the four) turns R-1902 red; W3 and W4 (doctor drops the win32 link or
    regular-file line) turn R-1903 red; W5 (doctor keeps the win32 note) turns R-1900, R-938, R-1903 and R-1761 to
    R-1763 red; W6 (the stale-copies checker keeps its skip) turns R-1761 to R-1763 red; W7 (the note list keeps the
    four labels) turns the R-1081 pin red. New W8 (the retired step reports the marked copies again) turns R-1904
    red. Declared, no pair: the README rows and linkSkill's doc comment carry no behaviour; native junction
    behaviour is CI's Windows leg. Declared (e): under W8, skills-and-standards' "a second run changes nothing" stays
    green, because the summary still says nothing to do beside skipped rows; R-1904 alone catches it.
- Independent check (`independent-check-942127f4.md`): it ran on build 1, 942127f4, not on fc6ac33d, in a private
  clone with a temp HOME for every probe and single test files only. HOLDS, no MUST, nine probes. A fresh forced-win32
  install copies all five skills and doctor marks each ✓ (P1). A pull from main to the lane makes the session-start
  checker name the four as stale until install runs, then go silent (P2). macOS install, doctor and the checker are
  unchanged (P3). A link at spec, even to the pack's own folder, and a dangling link at py-lint make install exit 1
  with no write through the link, and doctor names a symlink or junction (P4). Two edits on one day leave two dated
  backups and none in the skills folder (P5). A simulated pull refreshes py-lint (P6). A dry run writes nothing (P7).
  Uninstall exits 2 and the copies stay (P8). A CRLF legacy spec copy is refused and left byte-identical (P9). Its
  findings and how each was settled:
  1. K1, known bug: every repeat win32 install printed four retired rows for nana-setup's own marked copies. CI's
     Windows leg caught the same on build 1. Fixed in build 2, fc6ac33d, with R-1904; the seat's pair W8 proves
     R-1904 catches it, and CI's Windows leg passes both older install checks on fc6ac33d.
  2. K2, known bug: each pack change to a skill leaves a `SKILL.md.bak-<date>` of nana-setup's own earlier copy in
     that skill folder. The requirements skill already did this on main; now all five do, so backups pile up over
     pulls. Nothing is lost. Recorded as a HANDOFF residual.
  3. K3, known limit, now confirmed (P9): a CRLF or edited legacy copy of the four moves win32 install from exit 0 on
     main to exit 1. Nothing is lost and the move fix is printed. The plan named it as inferred. Recorded as a HANDOFF
     residual.
  4. K4, test quality: R-1900's check needs doctor's overall exit 0, so an unrelated ✗ row, such as pi-subagents
     missing in a bare temp home, fails it. Its row-level match holds. Recorded as a HANDOFF residual.
  5. K5, status: the suite legs had not finished on 942127f4 when it checked. Settled by build 2's CI run above: the
     Windows leg reads 0 failing files.
- The plan's other known limits, each a HANDOFF residual unless said: on Windows a copy does not follow a pull, so a
  changed skill reads ✗ until install runs again, and Windows uninstall leaves the copies; an owner's junction to the
  pack's own skill folder is refused (R-352), though it would follow pulls better; the pre-marker version list holds
  only requirements versions, yet every skill name consults it (contrived); the win32 dry run still says "would link"
  for a legacy copy (cosmetic); R-938 keeps no actor, so the ledger's open question 18 stays open (the ledger carries
  it; no HANDOFF line).
- Where the build differs from the plan (the seat's reading, not run): the plan retired R-939 as a duplicate of
  R-359, but R-939 still reads `untested` beside the pinned R-359; and the plan gave R-1081 an evidence note, which the
  build did not add. Neither changes behaviour. The R-939 gap is a HANDOFF residual. The plan also listed the code map
  among the touched files; no module header or import edge changed, so the map needed no edit and map:check is clean.
- Build 2's marked-copy branch in the retired step is not guarded by platform. On macOS or Linux a directory at one of
  the four names that holds the marker now gets no retired row; stepSkills still refuses it with exit 1 and the move
  fix. Only a home copied from Windows would carry the marker there (inferred, not run). The review briefs name it.
- HANDOFF's "Doctor's skill advice" residual now keeps only the macOS and Linux link half: on Windows doctor says to
  move a plain file or a link at a skill path (R-1903).
- This lane reverses a written 2026-10-07 design choice, the four skills skipped on Windows (R-665, R-666), under the
  2026-10-10 priority. No owner ruling backs either way; the seat decided it, as reversible and losing no data. An
  optional line in HANDOFF's "Open for Jake" asks the owner to confirm the Windows Claude Code seat should get the four.
- Rows: R-1900 to R-1904 read `implemented` in REQUIREMENTS.md, in SUB-015 directly after R-1426. The seat helper's
  re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1464 total (1194 implemented · 1 planned ·
  34 retired · 230 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 326
  modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base d4423eff):
  ```
  tree movement d4423ef..c5b69e4: 11 rows in 2 features
  FEAT-013 · Install and connect harness runtimes
    R-351 untested -> implemented
    R-359 untested -> implemented
    R-388 untested -> implemented
    R-665 text changed
    R-938 untested -> implemented
    R-1900 new (implemented)
    R-1901 new (implemented)
    R-1902 new (implemented)
    R-1903 new (implemented)
    R-1904 new (implemented)
  FEAT-015 · Diagnose the active environment
    R-666 text changed
  ```
  R-669's and R-937's evidence also changed (the report lists text and status, not evidence).
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was d4423eff when the lane last merged it, its merge base. Main has since moved to 8a9ff9a3 (the
  readme-windows-checklist land). That lane changes the install check's config and pin file, the setup README,
  REQUIREMENTS.md, the tree, the code map, HANDOFF and the session archive, and adds a Windows README checklist
  rehearsal to the install check. So the land needs a merge of main, and that merge needs its own accepted review
  coverage.
