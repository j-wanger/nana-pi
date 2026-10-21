# Review round 2 — win-hook-variant-loop, 2026-10-20 (Claude Opus 5.5, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Round 1 reviewed `47cdfe47`. The final reviewer said LAND with two SHOULDs (S1, the README's first exception misdescribed a path whose last separator is a backslash; S2, the edit command joined its parts unquoted, so a checkout path with a space splits) and three NOTEs (N3, the edit route after install leaves a duplicate entry; N4 and N5, residuals already carried). The land reviewer sent it back with one MUST: R-2411's and R-2412's checks still passed with `packages/nana-setup/lib/hook-health.mjs` restored from main `7aadbc99`, so neither proved its feature.

This round reviews only what changed since round 1: `git diff 47cdfe47..HEAD` on `feat/win-hook-variant-loop`. Main has not moved (`7aadbc99`).

- `a299c37e`: `build-brief-5.md`, the brief for build 5.
- `96c17719` (build 5): R-2411's check now requires the row to name the entry install leaves, with its removal advice, and to leave out the one install repairs. R-2412's check adds an accepted shape whose dead entry must get the advice, and requires the refused and 3,000-deep shapes holding the same entry to get none, with no inspection crash. Both rows are reworded to match their checks. S1: the README bullet. S2: `shellPart` quotes any part holding a space or a double quote; R-2410's check pins it through a checkout root with a space, passed to `hookSettingsRows` as a new optional test-only override (doctor's call site passes none).
- `9c387e3e`: the seat's pairs on 96c17719, 15 of 16 red (`seat-mutate-output-96c17719.txt`). H1, main's form, turns all three checks red; H10, the shape guard dropped, is now red; H15 and H16 pin the quoting; H12 survives, Windows only, as before.
- The notes commit after it: HANDOFF and the session entry record round 1 and build 5, and add N3 as a carried residual. CI run 39514736526 at 96c17719 reads 0 failing on all three legs: macOS 196 PASS, 0 FAIL, 2 SKIP of 198 files (8,044 checks pass, 36 skip); Ubuntu 195 PASS, 0 FAIL, 3 SKIP of 198 files (7,983 checks pass, 56 skip); Windows 180 PASS, 0 FAIL, 18 SKIP of 198 files (6,973 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-96c17719.log in this folder.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at 9c387e3e):

```
tree movement 7aadbc9..9c387e3: 3 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2410 new (implemented)
  R-2411 new (implemented)
  R-2412 new (implemented)
```

Threat model and lane class as round 1: honest variation in our tools' output and the owner's settings is in scope; deliberate forgery is out. Install, hook or gate lane (doctor's Windows hook rows, read at every session start by the stale-copy producer).

Check: (1) round 1's MUST is closed: R-2411's and R-2412's checks fail with main's `hook-health.mjs`; (2) S1 and S2 are closed, and the new quoting gives a command that runs as printed in Claude Code's shell form and exec form on Windows; (3) the test-only override changes nothing at doctor's call site or for the stale-copy producer; (4) the reworded rows say no more than their checks prove; (5) HANDOFF and the session entry are true; (6) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
