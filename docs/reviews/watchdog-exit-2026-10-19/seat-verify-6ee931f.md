# Seat checks — watchdog-exit build 1, tip 6ee931f (2026-10-19)

- Build 1 by Claude Sonnet 5 at c99e329 (rows d8f789d, checks and fix c99e329). 6ee931f adds only the seat's pair table
  and its output (`seat-mutate.mjs`, `seat-mutate-output-c99e329.txt`); no code or test changed after c99e329.
- CI run 39250107447 on draft pull request #37 (c99e329): macOS `151 files: 149 PASS, 0 FAIL, 2 SKIP` (watchdog-exit 6
  pass, 15.2 s); Ubuntu `151 files: 148 PASS, 1 FAIL, 2 SKIP` (watchdog-exit 6 pass, 13.9 s; the one failure is
  lane-write-guard, main's, fixed by the linux-lane-guard lane, not yet on main); Windows `151 files: 127 PASS, 23 FAIL,
  1 SKIP` (`ci-windows-run-1.log`; watchdog-exit 6 pass, 18.3 s, R-1390 to R-1395). The 23 Windows failures are main's
  set at b3f6ec2 only: immutable-review, land and review-ledger (the short-path bug, fixed by win-review-paths, now on
  main) plus 16 desk and 4 bench files. install-check macOS and Windows: success.
- The plan's most-likely-wrong claim was too pessimistic: WE1 and WE4 (pi-review) pass on the Windows leg without
  win-review-paths, which the lane did not branch after (base b3f6ec2).
- Observation, cause inferred: on Windows immutable-review took 27.9 s on this run against 78 to 79 s on earlier
  Windows runs with the same 9 pass, 6 fail, 2 skip result; review-ledger 133.1 s against 188 to 199 s. The watchdog
  fix is the likely cause; nobody measured it.
- The seat's wrong-code pairs on c99e329: 8 of 8 red, 0 survived, 5 shards, macOS (`seat-mutate-output-c99e329.txt`).
  P1 is main's poll-only wait (WE1, WE2, WE3 red). W1 to W6 are the plan's; W7, added by the seat, clears the poll timer
  before the wait (WE3 and WE5 red). Seven pairs turn exactly their named checks red; W6 also turned WE1 red, unnamed.
  Declared: every named check is timing-based, but only W3's WE3 red depends on machine speed (a `ps` read landing in
  a ~50 ms window); two sites have no pair because must-meet's known limits declare them unpinned (the spawn-error
  wake, pi-review's exit after SIGINT); the wall-clock ceiling has no must-meet check.
- Independent check (`independent-check-6ee931f.md`, run on c99e329): HOLDS, no MUST. All six checks pass (15.5 s);
  review-ledger 155/155, worker-lane 52/52, win32-launch 5/5, immutable-review 17/17, requirements-tree 89/89. Its
  probes also exercise both unpinned sites: a missing pi ends in 68 ms (main 60,070 ms); pi-review stops 74 ms after
  SIGINT (main 58,466 ms). Findings and how each was settled:
  1. Known bug, low: output a grandchild writes after pi exits is no longer captured (main caught it by chance before
     the next poll); must-meet's "as today" was slightly wrong. Recorded as a HANDOFF carried residual.
  2. Residual: WE4 and WE6 green on win32 by inference only. Now verified: the Windows leg of run 39250107447 passes
     watchdog-exit 6 of 6 on c99e329. Closed.
  Not this lane's: immutable-review leaves one empty capture folder in the temp folder, on main and on the lane alike.
- R-1390 to R-1395 read `implemented`. `node scripts/requirements-trace.mjs`: 1,221 rows, 0 off form, exit 0;
  `npm run map:check`: 0 problems, exit 0.
- Main is 73f39d5 (win-review-paths landed) as this is written; the lane's merge-base is still b3f6ec2, so the land
  needs a merge of main and a review covering that tip.
