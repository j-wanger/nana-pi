# Seat checks — win-claude-hooks builds 1 and 2 (2026-10-17)

- Title check: `seat-titles 1: 0 missing`; the trace rail clean after build 2 flipped R-1330.
- Full suite on the Mac (`npm run test:locked`): `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7445 pass, 0 fail, 14 skip · 764.7s`, exit 0.
  Install check: exit 0.
- CI on draft pull request #17. Run 1 (39073656911, `ci-windows-run-1.log`): KH1 passes on Windows (hooks-win32-exec 28 → 29); hook 94,
  discovery 37, settings-merge 209 (+7 skips), shared-memory-hook 42 (+1); render and verifier-pipe one failure each; the macOS leg failed the
  trace rail on the planned row. Run 2 (39075195798, `ci-windows-run-2.log`): every target file passes on Windows — hook 94, discovery 37,
  render 67 (+2), hooks-win32-exec 29, settings-merge 209 (+7), shared-memory-hook 42 (+1), verifier-pipe 29; macOS and both install checks
  green; Windows failing 56 of 150 files (main 9fcd4f2: 62).
- No wrong-code pairs and no independent check: an ordinary lane (the changes stay in tests).
