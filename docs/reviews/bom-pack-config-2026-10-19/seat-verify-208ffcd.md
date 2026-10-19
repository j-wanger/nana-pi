# Seat checks — bom-pack-config build 1b, tip 208ffcd (2026-10-19)

- Builds: a pi gpt-5.6-sol builder through `pi-worker --lane-size larger`. Build 1 stalled under pi-worker's 75-second
  watchdog before it committed; build 1b (`build-brief-1b.md`) judged and finished its uncommitted work as 48314e9. The
  seat merged main 713d6aa as 208ffcd; the one conflict was the R-291 leaf total in requirements-tree.test.mjs, now
  1,305 (main's 1,298 plus the lane's seven rows). 14e04fe adds only the seat's pair table and its record; no lane code
  changed after 208ffcd.
- CI on draft pull request #56, run 39298704191 on 208ffcd (GitHub's merge commit 1f5115de merges 208ffcd into its own
  ancestor 713d6aa, so the tree tested is 208ffcd's):
  - macOS: `157 files: 155 PASS, 0 FAIL, 2 SKIP` · 7,560 checks pass, 15 skip. doctor-detail 68, install 102,
    project 123, adoption-reader 44 and adoption-producer 62 pass.
  - Ubuntu: `157 files: 155 PASS, 0 FAIL, 2 SKIP` · 7,505 checks pass, 33 skip. The same five files pass with the same
    counts.
  - Windows (`ci-windows-run-1.log`): `157 files: 140 PASS, 0 FAIL, 17 SKIP` · 6,487 checks pass, 83 skip. The 17
    skipped files are the 16 declared desk files and bench's study-tasks (no pi-web-access). The lane's files:
    doctor-detail `64 pass, 1 skip`, install `92 pass, 6 skip`, project `123 pass`, adoption-reader `42 pass, 1 skip`,
    adoption-producer `61 pass`. All seven must-meet checks run natively there and pass:
    ```
    PASS adoption: a nana-pack.json saved with a byte-order mark keeps journal.enabled false, journal.path and objective.projectFile
    PASS hook: a nana-pack.json saved with a byte-order mark keeps its absolute journal.path
    PASS doctor reads a nana-pack.json saved with a byte-order mark and CRLF as it reads the same file without one
    PASS two leading marks, a mark inside the object or malformed text after one mark stay unparseable for doctor and adoption
    PASS objective seed: not created when a nana-pack.json saved with a byte-order mark points elsewhere
    PASS project skips .pi/nana-pack.json when a user nana-pack.json saved with a byte-order mark has postEdit.commands
    PASS --check counts post-edit commands from a .pi/nana-pack.json saved with a byte-order mark
    ```
  - install-check: macOS and Windows success.
  - None of main's known failures shows: Ubuntu's path-spelling GP1/GP2 were fixed on main at ca27d86, and no R-291
    merge artifact arises, since GitHub's merge commit holds 208ffcd's tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`): 8 of 8 red on 208ffcd, each red on exactly its named titles, 0
  survived, one shard on macOS (`seat-mutate-output-208ffcd.txt`). M1 removes no mark (6 named checks red); M2 to M5
  try every-leading-mark, trim, every-mark-anywhere and an empty object on bad text (R-1586's check red each time);
  M6 to M8 leave one of the three readers on main's plain parse. Two declared limits: every pair runs on macOS only
  (the Windows run is CI's leg), and no pair covers the six inline one-mark strips, pi's settings.json readers or the
  frozen desk, which the lane leaves unchanged.
- Independent check (`independent-check-208ffcd.md`): HOLDS, no MUST. It ran on 208ffcd in a private clone with a temp
  HOME for every probe, and recorded ten probes with their output: doctor's three rows go from ✗ on main to ✓ on the
  lane (P1); install twice keeps the file's bytes and mark and creates no objective file (P2); the hook lists the
  configured journal's root, and a UTF-16 file stays unparseable without a crash (P3); the parser matches pi 1.0.2's
  `stripBom` and the pack's config.ts on seven boundary inputs (P5); three of its own mutations each turn a named check
  red (P7); nothing was written outside temp (P8). The seat's copy drops one harness banner line that preceded the
  check's text; the rest is verbatim, scrubbed. Its findings and how each was settled:
  1. F1: HANDOFF's Roster residual still ended "Doctor and the adoption hook still fail on a file saved with a
     byte-order mark", which the lane makes false. Fixed in this commit: the seat removed that sentence and added
     nothing in its place.
  2. F2: project.test.mjs finds pi through `npm root -g`, which under a temp HOME pointed at another node's global
     folder, so the file crashed until `npm_config_prefix` was set. The code predates the lane. Residual (HANDOFF,
     found on main too).
- The plan's other known limits stay open and HANDOFF carries each as a residual: pi's settings.json readers, a Claude
  Code settings.json with a mark, UTF-16 files (with the adversary's doubt that the owner's file is UTF-8 at all) and
  the frozen desk. The share of the new rows with FEAT-013 and FEAT-014 is the owner's call (must-meet known limit 6).
- Rows R-1580 to R-1586 read `implemented`. `node scripts/requirements-trace.mjs`: 1,305 total, 1,019 implemented,
  1,019 traced, 0 rows off form. `npm run map:check`: 300 modules, 0 problems. Tree movement
  (`requirements-moved.mjs --base main`): `713d6aa..14e04fe: 7 rows in 1 features`, FEAT-015 · Diagnose the active
  environment, R-1580 to R-1586 new (implemented).
- Not yet run: the local macOS install check, which runs before the land.
