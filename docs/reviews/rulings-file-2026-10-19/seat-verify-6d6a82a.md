# Seat checks — rulings-file builds 1 and 2, tip 6d6a82a (2026-10-19)

- Builds: 1 (743c568) and 2 (fa83ab3) by Claude Sonnet 5; main b8ace0b merged at 9c993df. 6d6a82a adds only the seat's
  pairs output for 9c993df, so the code at 6d6a82a is the code CI ran.
- CI on draft pull request #36 at 9c993df, run 39255048705: macOS `154 files: 152 PASS, 0 FAIL, 2 SKIP` (7,493 checks
  pass, 0 fail). Ubuntu `150 PASS, 2 FAIL, 2 SKIP`: lane-write-guard (fixed on main since by linux-lane-guard) and
  path-spelling GP1/GP2 (main's Linux regression; the linux-path-spelling lane is in flight). Windows `133 PASS, 20 FAIL,
  1 SKIP` (`ci-windows-run-2.log`): 16 desk and 4 bench files, all main's. install-check passes on macOS and Windows.
- The lane's checks on CI: rulings 10 pass on all three legs; rulings-install 8 pass on macOS and Ubuntu, and 5 pass plus
  3 skips on Windows (the three POSIX link shapes, each skip printing its reason); templates-render passes on all three.
- CI run 1 (39250052854, 743c568) failed templates-render on all three legs (R-680/R-985 runtime table) and three
  rulings-install checks on Windows (the POSIX blocks ran under native win32 behaviour). Build 2 fixed both.
- The seat's wrong-code pairs (`seat-mutate.mjs`): 28 of 29 red on 743c568 (`seat-mutate-output-743c568.txt`); E13
  survived, as the table declared, because no check pinned that the marker names the file and `nana-setup install`.
  After build 2, 29 of 29 red on 9c993df in one unsplit run (`seat-mutate-output-9c993df.txt`); E13 now turns R-1411's
  check red, plus the boundary check. Declared gaps: no pair for doctor's Claude-rules row, the README and package
  descriptions, or the code map.
- Independent check (`independent-check-6d6a82a.md`, run on 743c568): FINDINGS, 13 probes, 12 hold.
  - MUST: templates-render red, because the new extension was missing from the shared runtime table and the test's
    inventory. Fixed in build 2 (fa83ab3); passes on CI at 9c993df on all three legs.
  - Known bug (low): on Windows each refresh of a changed rulings file leaves a dated backup beside both copies.
    Recorded as a HANDOFF residual.
- Rows R-1410 to R-1418 all read `implemented`. At 6d6a82a the requirements trace and `map:check` are clean.
- Still owed before nana-land: the locked full suite on the final tip, and the install check run locally on macOS (the
  checker ran it on 743c568: 13 PASS; CI ran it on 9c993df). Main has moved past b8ace0b, so the lane needs main merged
  again before an ff-only land.
