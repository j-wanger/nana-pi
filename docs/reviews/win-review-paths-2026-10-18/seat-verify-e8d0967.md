# Seat checks — win-review-paths, builds 1 to 4, tip e8d0967 (2026-10-19)

- Builds: 1 and 2 by Claude Sonnet 5, 3 and 4 by luna (Claude subagents were rate-limited on 10-18). The seat's audits:
  `seat-audit-1.md` (four MUSTs, fixed in build 2) and `seat-audit-2.md` (two MUSTs in build 2's identity fallback,
  fixed in build 3: the snapshot's dev+ino skip is gone; the tracked-file identity is exact, bigint, null for ino 0).
- Red proofs on macOS: all eleven path-spelling checks fail on the tools at fe03b6e (before the lane); only GP1's
  case-divergence leg fails on build 1's tools.
- The seat's wrong-code pairs (`seat-mutate.mjs`): 16 of 16 red on 1187eab (`seat-mutate-output-1187eab.txt`) and again
  on 337efa1 after build 4 and the merge of main (`seat-mutate-output-337efa1.txt`), 0 survived.
- The builder's locked full suite at e2446f2: 151 files, 149 PASS, 0 FAIL, 2 SKIP, 7,470 checks. path-spelling took 218 s
  on macOS before build 4 and 37 s after (`--poll 1` on every pi-review spawn).
- Windows CI run 1 (`ci-windows-run-1.log`, 1187eab): land 51, immutable-review and worker-lane pass; path-spelling hit
  the runner's 300 s file limit after GP6(ii), all passing until then; review-ledger 4 checks expected the 8.3 spelling.
  Run 2 (`ci-windows-run-2.log`, 337efa1): path-spelling 11 pass in 98 s, review-ledger 152 pass + 3 skips, land 51,
  immutable-review 15 + 2 skips, worker-lane 51 + 1 skip, review-round 33, review-standard 3 + 3 skips (as main).
  Windows failing 20 of 151 files, all desk and bench.
- Independent check (`independent-check-1187eab.md`): HOLDS, no findings, but no probe commands recorded; weak.
- Since 337efa1 the tip adds only main's merge (objective-golden) and the seat's notes; no lane code changed.
