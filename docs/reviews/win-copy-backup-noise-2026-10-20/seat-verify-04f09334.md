# Seat checks — win-copy-backup-noise builds 1 and 2, tip 04f09334 (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (two builds); the lane branched from main 72abe19a, with the
  plan at 34069294 (`must-meet.md`, `plan-attack.md`: one adversary, AMEND; `build-brief-1.md`):
  - Build 1 is one commit, dfe54123. `packages/nana-setup/lib/paths.mjs` gains `layout.copyRecord`
    (`<claude home>/nana-setup-copies.json`, chosen). New `lib/copy-record.mjs` (six-tag header, `COPY_RECORD_HASH`
    sha256, chosen) exports `openCopyRecord(file)`: it reads the record only when lstat says a regular file, and any
    read, parse or shape failure (not an object, a relative key, a value that is not 64 hex characters) gives an empty
    record; `unedited(target)` hashes a regular target's current bytes against its entry; `remember(target, bytes)`;
    `save(o)` writes nothing on a dry run or when nothing was remembered, otherwise merges with the earlier entries
    and writes through `fsops.writeIfChanged`, and turns a SKIPPED result or any throw into one SKIPPED `copy record`
    row that names the path and says the next update backs up each changed copy. `lib/fsops.mjs`
    `writeBytesWithBackup` gains an optional `unedited` predicate (fsops never imports copy-record); `linkFile` passes
    it through on `copyInstead`. A regular file that passes is refreshed with no backup, and the dry run says `would
    refresh the managed copy`. Build 1's refresh wrote the copy in place (`fs.writeFileSync(target, want)`).
    `lib/steps.mjs`: `stepRules` (win32), the `linkSkill` win32 file loop and `stepPiConfig`'s rulings copy pass
    `o.copyRecord?.unedited(target)` and, after a non-dry-run CREATED, UPDATED or UNCHANGED copy on win32,
    `remember(target, sourceBytes)`; `install()` opens the record at the start of `fileSteps` on win32 (dry run
    included) and pushes the `save` rows at its end, inside the settings lock on a real run. POSIX opens and writes
    nothing. `lib/state-manifest.mjs` adds `rebuild("copy record", layout.copyRecord, "file")`. The setup README gains
    an install-table row (Windows only), rewrites the Windows sentence in "Never destroys a file it replaces" and the
    skill-mirror sentence, and lists the new test file. The new `packages/nana-setup/tests/copy-record.test.mjs` holds
    R-2310 to R-2313, R-2315 and R-2316 (FEAT-018; R-2314 left unused); `state-manifest.test.mjs`'s R-954
    install-coverage check gains the record as a win32-only target of kind "file", and R-954's evidence names that
    check. `doctor-fix-line.test.mjs`'s injected read failure moves from the copy's second read to its third, because
    the record's predicate now reads the copy first.
  - acb4d4f9 adds the seat's pairs on dfe54123. 6c2b1d96 adds `build-brief-2.md` after the independent check.
  - Build 2 is 04f09334 (`build-brief-2.md`). The refresh no longer writes in place. It writes the new bytes with
    flag `wx` to a temporary file beside the copy, named `.<name>.nana-refresh-<pid>-<ms>`, then renames it over the
    copy: a new file, atomic on one volume, never through a hard link. A temporary file that cannot be written gives
    a PROBLEM row naming the copy and the error. If the rename fails, it removes the temporary file (best effort) and
    falls back to main's backup branch: rename the copy to its dated backup, then write the new bytes. If that fails
    too, a PROBLEM row names both errors and the backup path it tried, where the old copy may be. Install goes on in
    every case. The test file gains R-2317 (a read-only unedited copy) and R-2318 (a second hard-linked name).
    R-2317 simulates the Windows refusal on every platform: an `--import` shim makes `fs.renameSync` throw EACCES when
    the source is a `.nana-refresh-` file and the target has no write bit. R-2317 skips under POSIX root. Build 2 added
    both rows to REQUIREMENTS.md and regenerated the code map, but not `docs/requirements-tree.md`, where FEAT-018
    still read 31 rows without R-2317 and R-2318.
  - 53af2418 adds the pairs on build 2. 3889e33f merges main 5ef07f7f, the objective-path-shapes land tip. That lane
    changed `objectiveTarget` in `steps.mjs` and `piObjective` in `paths.mjs`; this lane changed other lines of both,
    and git merged them cleanly. The merge conflicted only in the generated code map and tree; the merge helper
    regenerated both, which also brought the tree up to R-2317 and R-2318 (FEAT-018 33 rows). After 3889e33f, the
    seat's notes commit adds only this record, the independent check, the Windows log, the two review briefs, HANDOFF
    and the session entry.
- CI run 39443531519 on draft pull request #135 at 04f09334 (build 2; GitHub's merge commit 072c3f5f merges 04f09334
  into its own ancestor 72abe19a, so the tree tested is 04f09334's). CI is not green: one file fails on every leg.
  - macOS `191 files: 188 PASS, 1 FAIL, 2 SKIP` · checks 7,965 pass, 5 fail.
  - Ubuntu `191 files: 187 PASS, 1 FAIL, 3 SKIP` · checks 7,904 pass, 5 fail.
  - Windows `191 files: 172 PASS, 1 FAIL, 18 SKIP, 0 WARN · checks: 6890 pass, 5 fail, 112 skip`
    (`ci-windows-04f09334.log`). The 18 skipped files are main's declared set. copy-record `8 pass`, with its check
    lines:
    ```
    PASS R-2310: two source changes refresh unedited rule, skill and pi rulings copies with no dated backup
    PASS R-2311: owner-edited rule, skill and pi rulings copies each get exactly one dated backup holding the owner's bytes
    PASS R-2312: an absent, unparseable or non-object copy record falls back to one dated backup per changed copy
    PASS R-2313: a home installed before the record existed refreshes with no dated backup after one install
    PASS R-2315: dry run reports an unedited copy's refresh with no backup and changes nothing
    PASS R-2317: a read-only unedited managed copy refreshes without stopping install
    PASS R-2318: refreshing an unedited managed copy does not write through its second hard-linked name
    PASS R-2316: a directory or read-only file at the copy-record path leaves install finishing with one skipped copy-record row
    ```
    That settles the plan's claim most likely wrong, that the native Windows leg passes unchanged: the read-only
    record case passed there, and the neighbouring files all pass on Windows: fsops 17, install 93 + 5 skips,
    install-overlap 4, rulings-install 5 + 3 skips, skills-and-standards 63 + 4 skips, state-manifest 20, win32-degrade
    87 + 1 skip, stale-copies 13 + 1 skip, doctor-fix-line 9, retired-artifacts 47 + 1 skip, settings-lock 7 + 1 skip,
    uninstall 2 + 2 skips, win-shims 7, doctor-detail 68 + 1 skip, fresh-machine 9, writing-rule 3, checkout-spelling 5
    + 1 skip.
  - The one failing file on all three legs is `packages/nana-pack/tests/requirements-tree.test.mjs` (Windows: 88 pass,
    5 fail), the same five R-291 checks on each leg:
    ```
    FAIL R-291: committed outline equals a fresh render
    FAIL R-291: committed outline fields and row IDs match the real ledger (CAP-04, FEAT-018)
    FAIL R-291: every real heading's committed IDs survive expansion and the tree reads every row line once (CAP-04, FEAT-018)
    FAIL R-291: parent row counts aggregate descendants
    FAIL R-291: feature outline carries status and shared IDs (CAP-04, FEAT-018)
    ```
    Cause: build 2 added R-2317 and R-2318 without regenerating the requirements tree. The same five fail locally at
    53af2418. This is not main's known R-291 leaf-total merge artifact, since GitHub's merge commit holds 04f09334's
    tree. Fix: the seat's merge 3889e33f ran the merge helper, which regenerated the tree;
    `requirements-tree.test.mjs` then passes 93 of 93 locally, again at the notes commit (93 PASS, 0 FAIL). CI has
    not run on 3889e33f; the land runs the locked suite on the reviewed tip.
  - install-check: macOS and Windows success.
  - None of main's known failures showed (Ubuntu's path spelling, fixed on main at ca27d86; the R-291 merge artifact).
- The seat's wrong-code pairs (`seat-mutate.mjs`, the shared mutation runner, macOS, Node 22.22.2, one shard, merge
  base 72abe19a). Every pair ran on macOS with the platform forced to win32; no native Windows pair ran.
  - On dfe54123 (`seat-mutate-output-dfe54123.txt`, commit acb4d4f9): 19 of 19 red, 0 survived, each exactly on its
    named titles. Baselines: copy-record 6 PASS, uninstall 31 PASS, state-manifest 20 PASS.
  - On 04f09334 (`seat-mutate-output-04f09334.txt`, commit 53af2418): 21 of 21 red, 0 survived, each exactly on its
    named titles. Baselines: copy-record 8 PASS, uninstall 31 PASS, state-manifest 20 PASS. M9 is re-anchored, since
    the refresh branch is now a block.
  - The record: M1 (record in the pi agent folder) turns R-2310, R-2312 and R-2316 red; M2 (any entry means unedited)
    R-2311; M3 (a bad record owns every copy, fail-open) R-2312; M4 (keys by file name) R-2310 and R-2313; M5 (a
    SKIPPED save passes through unnamed) and M6 (a save error escapes) R-2316; M7 (the dry run remembers and saves)
    R-2315.
  - fsops: M8 (`linkFile` drops the predicate, main's form) turns R-2310, R-2313 and R-2315 red; M9 (no refresh
    branch) R-2310 and R-2313; M10 (the dry run keeps main's backup wording) R-2315.
  - steps: M11 (remember skips UPDATED) turns R-2310 red; M12 (remember skips UNCHANGED) R-2313; M13 (`stepRules`
    without the predicate, main's form) and M15 (`stepPiConfig`'s rulings copy without it) R-2310, R-2313 and R-2315;
    M14 (the `linkSkill` loop without it) R-2310 and R-2313; M16 (record opened only inside the lock) R-2315; M17
    (POSIX opens, remembers and writes the record) two uninstall checks.
  - Inventory: M18 (no row) turns R-955's layout check and R-954's install-coverage check red; M19 (kind "generated")
    R-954's install-coverage check.
  - Build 2: M20 (build 1's in-place write) turns R-2317 and R-2318 red; M21 (no fallback after a failed rename)
    turns R-2317 red, through the test's simulated refusal.
  - Declared before the run, with no pair (expected survivors, by reading): the record read's lstat guard (no test
    puts a symlink at the record path; the independent check's probe 4 saw one left untouched), the entry shape
    check, the save's keep-earlier-entries and skip-when-nothing-remembered guards, fsops' redundant regular-file
    condition on refresh, and the win32 gates at the record open and in `rememberCopy`, which cover each other on
    POSIX (M17 removes both).
  - The pairs have not run on the merged tip 3889e33f.
- Independent check (`independent-check-04f09334.md`, filed under this tip's name): it ran on build 1, dfe54123, in a
  private clone beside a clone of main 72abe19a, with temp homes and the platform forced to win32 unless noted.
  Verdict FINDINGS: one MUST and two known bugs, all from one cause, the in-place refresh. Must-meet and neighbouring
  files: copy-record 6 passed, 0 failed; state-manifest 20 PASS; 16 neighbouring files exited 0. Of its nine probes,
  probes 1 and 4 to 9 found no fault; probes 2 and 3 found the findings below. Each finding and how it was settled:
  1. MUST: a read-only unedited managed copy crashed install. main backs it up and finishes (exit 0, 31 rows); build 1
     threw a raw EACCES stack from `writeBytesWithBackup`, printed no rows and skipped every later step (probe 2).
     Fixed in build 2 (04f09334): the temporary file and rename never write to the old copy, and a failed rename
     falls back to main's backup branch; R-2317 pins it, and M20 and M21 each turn it red.
  2. Known bug: the in-place refresh wrote through a second hard-linked name (probe 3). Fixed in build 2: the rename
     gives the copy a new file. R-2318 pins it, and M20 turns it red.
  3. Known bug: the in-place refresh was not atomic, so a crash mid-write left a truncated copy with no backup. Fixed
     in build 2: the new bytes go to a temporary file in the same folder and replace the copy by one rename. No check
     simulates a crash; atomicity rests on the rename (inferred, not run).
  - Its other notes: the PATH launchers still back up on every run (the existing win-path-commands residual, now
    reworded); uninstall on a POSIX home leaves a planted record (the plan's known limit, a HANDOFF residual); it did
    not run the native Windows leg (CI has since: copy-record 8 pass), the mutation runner (the seat's pairs) or the
    full suite (CI's three legs).
  - No independent check ran on build 2. Both review briefs ask the reviewers to judge build 2's replace-and-fallback
    path directly: the temporary file beside the copy, its name, its cleanup on failure, the rename over a read-only
    or hard-linked copy on Windows and POSIX, and the fallback's backup.
- Seat observations on build 2, read from the code and not probed:
  - No run proves that Windows itself refuses a rename over a read-only copy, or that the fallback's rename away
    then works there. R-2317 simulates that refusal with its shim on every platform, the Windows leg included, and
    on macOS and Linux the real rename over a read-only file succeeds. A HANDOFF residual.
  - A crash between the temporary write and the rename leaves a hidden `.nana-refresh-` file beside the copy, in the
    rules folder, a skill folder or the pi agent folder. Nothing removes it later. Its name does not end in `.md`, so
    Claude Code should not load it as a rule (inferred). A HANDOFF residual.
- The plan's known limits, each a HANDOFF residual naming this lane: backups already on disk stay, and a home already
  stale at land time gets one last round of backups; a home reached through another spelling of its path misses its
  keys and backs up once (fail-safe); the win32 skill row still prints "N files copied" and never names a backup; no
  test pins that the save happens inside the lock; Windows has no uninstall, so the record stays (POSIX never writes
  it, and uninstall leaves a planted one); that Claude Code ignores a JSON file at the Claude folder root is
  inferred, untested. The PATH launchers' backups stay the win-path-commands residual.
- HANDOFF: one Landed line. Three residuals change: the rulings-file backup line now says only an owner-edited copy
  gets a backup; the win-path-commands launcher line no longer says rule copies back up too; the win-claude-skills
  "backups pile up over pulls" line goes, since the lane fixes it. Eight new residuals name this lane: the six plan
  limits above and the two seat observations.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2310 to R-2313 and R-2315 to R-2318 read `implemented` in REQUIREMENTS.md; R-2314 is unused. At the notes
  commit (no code or row changed since 3889e33f): `node scripts/requirements-trace.mjs` reads `requirements: 1639
  total (1402 implemented · 1 planned · 37 retired · 193 untested · 6 violated); 1402 traced by tests` and `ears: 0
  rows off form (allowance 0)`; `npm run map:check` reads 359 modules, 0 problems; `npm run readme:check` reads 726
  claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 5ef07f7f`, run at 3889e33f):
  ```
  tree movement 5ef07f7..3889e33: 8 rows in 1 features
  FEAT-018 · Update or remove managed components safely
    R-2310 new (implemented)
    R-2311 new (implemented)
    R-2312 new (implemented)
    R-2313 new (implemented)
    R-2315 new (implemented)
    R-2316 new (implemented)
    R-2317 new (implemented)
    R-2318 new (implemented)
  ```
  CAP-04 moves from 500 to 508 rows and FEAT-018 from 25 to 33. No existing row's text changed; R-954's evidence
  (FEAT-017) gains the install-coverage check.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite at 04f09334), native Windows
  wrong-code pairs, an independent check of build 2, and the local macOS install check, which runs before the land.
- Main moved under this lane once. The lane branched from main 72abe19a; the seat merged the objective-path-shapes
  land tip 5ef07f7f at 3889e33f, and main is now 5ef07f7f, the merge base and the review base.
