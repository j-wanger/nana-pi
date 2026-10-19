# Seat checks — win-leg-blocking build 1, tip d6b1bad (2026-10-19)

- Build: one build by Claude Sonnet 5 (`build-brief-1.md`): e3ae76d adds R-1380 to R-1383, the declared list and the
  four checks with the runner unwired; f74ab32 wires `scripts/test.mjs`, the three READMEs and the map. 60f8362 fixes the
  independent check's F1 and F2; d6b1bad adds the seat's pairs record only.
- CI on the draft pull request, run 39249092658 (d6b1bad merged onto main 1e3bf1f):
  - Windows (`ci-windows-run-2.log`): `150 files: 126 PASS, 3 FAIL, 21 SKIP`, checks 6,107 pass, 70 fail, 77 skip. The
    3 FAIL are main's short-path set: immutable-review 6, land 42, review-ledger 22 (70 checks); win-review-paths fixed
    them and is on main at 73f39d5. All 20 listed files SKIP with their declared reasons (16 desk, 4 bench); live-feel
    (64) and the nine other bench files PASS; study-tasks SKIPs for the missing extension, as on every leg. test-runner
    passes 43, R-1380 to R-1383 among them, so R-1381's forced-linux run passes on a real Windows host (the adversary's
    most-likely-wrong claim holds). requirement-rows 5 and requirements-trace 61 pass.
  - macOS: `150 files: 148 PASS, 0 FAIL, 2 SKIP`. Ubuntu: 147 PASS, 1 FAIL, lane-write-guard (main's; fixed by
    linux-lane-guard, not yet on main). install-check: success on macOS and Windows.
  - The earlier run 39248335035 on f74ab32 had requirement-rows and requirements-trace red on every leg (F1). Run
    39249092658 shows both green.
  - After the land merges main the Windows leg should read 0 failing files; inferred until main's first run after the land.
- The seat's wrong-code pairs (`seat-mutate.mjs`): 6 of 6 red on f74ab32, each on exactly its named check, 0 survived
  (`seat-mutate-output-f74ab32.txt`). Declared gaps: (a) the pairs force the platform on macOS, so the Windows run is the
  platform evidence; (b) no check pins which 20 files are listed; the Windows run is that evidence, and its SKIP set
  equals the list; (c) the SKIP branch is shared and unchanged. 60f8362 moved one line in the test file (the `const`
  above the R-1382 marker) and rewrote one desk README bullet. It touched neither `scripts/test.mjs`, nor
  `windows-skips-config.mjs`, nor any check's expression, so the pairs still hold at d6b1bad without a re-run.
- Independent check (`independent-check-d6b1bad.md`, run on f74ab32): FINDINGS, 14 probes with their commands. The four
  must-meet checks hold; the list equals the 20 files that failed on the plan's Windows run; off win32 the four listed
  bench files match `macos-baseline.txt` line for line.
  - F1 [MUST]: the `// req: R-1382` marker sat above a `const`, not above its check, so the trace scanner threw and
    requirements-trace and requirement-rows failed on every leg. Fixed in 60f8362 (the `const` moved above the marker);
    green on all three legs in run 39249092658.
  - F2 [known bug, docs]: the desk README bullet gave all 16 desk files one reason and called the config "the repo test
    runner". Fixed in 60f8362: the bullet names the 13-file resolver cause and the other three files' own reasons, and
    calls the config a module the runner reads.
- Seat checks on d6b1bad, this Mac: `node scripts/requirements-trace.mjs` exit 0 (1,219 rows, 0 off form);
  `npm run map:check` 286 modules, 0 problems; `node scripts/readme-check.mjs --check` 690 claims, 0 problems.
  R-1380 to R-1383 read `implemented`. This record holds no locked full suite on this Mac for the tip; CI's macOS leg
  ran the whole suite with 0 failing files. A full per-file match of desk and bench against
  `macos-baseline.txt` on the tip was not run; the independent check's P3 covers the four listed bench files.
- Left open, recorded in HANDOFF's residuals: whole-file skips hide about 285 checks that pass on Windows; nothing flags
  a list entry once its cause is fixed; the skipped desk and bench test bugs stay unfixed. The CI flip is the follow-up
  lane win-leg-flip.
