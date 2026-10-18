# Seat checks — win-install-shape builds 1 and 2, tip bd33b92 (2026-10-18)

- Full suite on the Mac on bd33b92: `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7457 pass, 0 fail, 14 skip · 775.6s`, exit 0.
- Install check on the Mac on bd33b92 (`node packages/nana-setup/bin/install-check.mjs`): exit 0, every line PASS.
- CI on draft pull request #21. Run 1 (e77ab22): install, state-manifest and uninstall pass; skills-and-standards fails
  the six occupied-skill-folder checks, and retired-artifacts fails the quoted context hook. Run 2 (`ci-windows-run-2.log`,
  bd33b92): every target file passes on Windows — install 85 + 5 skips, retired-artifacts 47 + 1 skip, skills-and-standards
  33 + 4 skips, state-manifest 19 + 1 skip, uninstall 1 + 2 skips. Each skip prints its reason. macOS and both install
  checks green; Windows failing 40 of 150 files (49 on main c401ad9's base).
- Seat ruling on the occupied skill folder: on Windows install backs up the owner's `SKILL.md` to a `.bak-` file inside
  the folder, copies the pack's files and exits 0; macOS refuses and leaves the folder alone. The lane declares the
  Windows behaviour in the test and does not change it; the difference is a known bug in HANDOFF's residuals.
- Quoted context hook: no released Windows install ever wrote it (bash hooks skipped on win32 from the first win32 commit;
  the hook retired on 2026-10-07, before Windows hooks shipped on 2026-10-12), so the case skips on Windows with that reason.
- No wrong-code pairs and no independent check: an ordinary lane (tests only; no install, uninstall or doctor code changed).
- After the seat's skip audit (`seat-skip-audit.md`, seven findings) and build 3, on tip 2836edf (main ddc45b4 merged):
  full suite on the Mac `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7457 pass, 0 fail, 14 skip · 779.7s`, exit 0;
  install check exit 0, 13 PASS lines and no FAIL. Windows run 3 (`ci-windows-run-3.log`, 2836edf): every target file
  passes — install 91 + 6 skips, retired-artifacts 47 + 1 skip, skills-and-standards 55 + 3 skips (sections 6 and 7a
  now run natively, the folder-link guard included), state-manifest 20, uninstall 2 + 2 skips. Each skip prints its
  reason. Windows failing 33 of 150 files.
- HANDOFF carries the occupied-folder known bug, the quoted-hook gap and the audit's smaller items. It also carries the
  handoff lane's reviewer note on its symlink probe.
