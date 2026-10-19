# Seat checks — clean-revision builds 1 and 2, tip a099700 (2026-10-19)

- Builds: 1 (57e542b) and 2 (7a4f363) by Claude Sonnet 5, on win-review-paths' tip (merged at 1103da1); main a0e0a69
  merged at 77289a0. a099700 adds only the seat's pairs output and runner table for 77289a0, so the code at a099700 is
  the code CI ran.
- CI on draft pull request #39 at 77289a0, run 39257938251: macOS `152 files: 150 PASS, 0 FAIL, 2 SKIP` (7,481 checks
  pass, 0 fail). Ubuntu `149 PASS, 1 FAIL, 2 SKIP`: path-spelling GP1/GP2 (2 checks), main's Linux regression from
  win-review-paths; the linux-path-spelling lane fixes it and awaits its land. Windows `131 PASS, 20 FAIL, 1 SKIP`
  (6,480 checks pass, 14 fail, 77 skip; `ci-windows-run-1.log`): 16 desk and 4 bench files, all main's at a0e0a69
  (win-leg-blocking's declared skips landed later). install-check passes on macOS and Windows.
- The lane's checks on Windows: all nine must-meet checks (R-1370 to R-1378) print PASS, including R-1377 `scratch
  objects resolve a linked repository with special path characters` — the plan's claim most likely wrong, that Windows
  git reads the alternates file's absolute drive path. review-ledger 157 pass, 2 skip; immutable-review 16 pass, 2 skip;
  land 52 pass; review-round 33 pass; path-spelling 11 pass; worker-lane 51 pass, 1 skip; win32-launch 13 pass, its
  `Windows: pi-review's recorded revision is a plain sha, not a +snap` now on a committed 100755 file. Each skip prints
  a reason (signals, NTFS modes, an extensionless git shim); none is a lane check. land's three in-flight checks pass,
  and the log holds no `+snap:dabb3236` and no EBUSY or EPERM. The plan's independent-check bar is met.
- The seat's wrong-code pairs (`seat-mutate.mjs`): 16 of 16 red, 0 survived, on 57e542b in 5 shards
  (`seat-mutate-output-57e542b.txt`). After build 2, 19 of 19 red, 0 survived, on 77289a0 in one unsplit run
  (`seat-mutate-output-77289a0.txt`): M17 to M19 drop the three scratch pins (safecrlf, splitIndex, hooksPath), and six
  anchors moved onto `scratchGit`.
  - M17 is red by a throw inside R-1378's own check (the scratch add exits 128 with git's safecrlf message), so the
    runner records its named title as not reached; the mutation is still caught at R-1378's site.
  - M7 (alternates naming the linked worktree's own git folder) is red by six unnamed checks and a crash earlier in
    review-ledger, so R-1377's own check is not reached under it on macOS.
  - M2 (copy the real index) turns R-1374 red; R-1376 stays green under it, against the adversary's prediction.
  - Declared gaps: no macOS pair for the alternates file's forward-slash form or R-1377's `;` path (Windows only); no
    test and no pair for the scratch removal in `finally`, the newline refusal, or the record for an untracked nested
    repository that has commits.
- Independent check (`independent-check-a099700.md`, run on 57e542b, build 1): FINDINGS, 16 probes; 11 hold, 3 findings,
  1 known bug, 1 not verified.
  - F1 MUST: a clean checkout under `core.autocrlf=true` and `core.safecrlf=true` was refused. Fixed in build 2
    (7a4f363): `core.safecrlf=false` on every scratch command, new row R-1378 and its check; it passes on all three CI
    legs, and M17 catches its removal.
  - F2 known bug: `core.splitIndex=true` left a `sharedindex.<sha>` file in the real `.git` per derivation. Fixed in
    7a4f363 (`core.splitIndex=false`), pinned by the extended R-1375 check; M18 turns it red.
  - F3 known bug: derivation ran the repository's `post-index-change` hook three times. Fixed in 7a4f363
    (`core.hooksPath` at an empty scratch folder); R-1375 reworded to "run no repository hook" and its check extended;
    M19 turns it red.
  - F4 known bug: a SIGKILL during derivation leaves a `nana-snapshot-*` folder in the OS temp folder. Recorded as a
    HANDOFF residual.
  - F5 known bug (inferred, unprobed): on Windows the scratch `rmSync` may throw EBUSY or EPERM under antivirus. Recorded
    as a HANDOFF residual; it did not show on run 39257938251.
  - P15 not verified (no Windows run on 57e542b): settled by run 39257938251, where R-1377 passes on Windows.
  - Held: P5 — a file force-added past `.gitignore` but not committed now derives plain HEAD (before, a snapshot);
    nana-land's tracked-change check (`git diff --quiet HEAD` exits 1) still refuses that land. P12 — a CRLF blob
    committed before an `eol=lf` attribute now derives a snapshot (before, plain HEAD), agreeing with `git status`;
    main's nana-land already refused that tree. Neither lets a land through.
  - P13 timing on a clean nana-pi clone: 309–322 ms before, 656–712 ms after, about 0.34 s more per derivation, as the
    plan declared.
- Rows R-1370 to R-1378 all read `implemented`; R-708 and R-709 are amended as the plan says. At a099700 the requirements
  trace (1,235 rows, 0 off form) and `map:check` (0 problems) are clean.
- Still owed before nana-land: the locked full suite on the final tip. Main has moved past a0e0a69 (to 06a874a), so the
  lane needs main merged again before an ff-only land, and that tip needs its own accepted review coverage.
