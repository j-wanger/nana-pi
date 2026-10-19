# Seat checks — win-objective-golden build 1, tip a686a93 (2026-10-19)

- The builder's full suite on the Mac at a686a93: `150 files: 148 PASS, 0 FAIL, 2 SKIP`, 7,460 checks; exit 0.
  objective-golden 1,236 checks.
- The builder's wrong code (OG1): `displayPath`'s `esc` writing a newline as `\n` fails all four path-payload checks
  across both shapes (exit 6); restored, they pass.
- CI on draft pull request #28, run 1 (`ci-windows-run-1.log`, a686a93): objective-golden 982 pass, 6 skip — the same
  counts as main's Windows run (OG2). Windows failing 23 of 150 files, as on main b3f6ec2.
- No wrong-code pairs and no independent check: an ordinary lane (one test file).
