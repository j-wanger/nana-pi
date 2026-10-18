# Seat checks — win-pi-handoff builds 1 to 4, tip 1c2ea6d (2026-10-18)

- Full suite on the Mac on 1c2ea6d: `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7457 pass, 0 fail, 14 skip · 776.1s`, exit 0.
- CI on draft pull request #20. Run 1 (41542d6): four of seven target files pass. Run 2 (35fe370): five. Run 3 (32ef165): six;
  display-surfaces at 180 of 181. Run 4 (`ci-windows-run-4.log`, 1c2ea6d): every target file passes on Windows —
  display-surfaces 181, frontier 45, handoff-artifact 7, handoff-staleness 46 + 4 skips, handoff-store 36 + 3 skips,
  handoff-trust 51, post-edit-file-queue 3 + 1 skip. Each skip prints its reason. macOS and both install checks green;
  Windows failing 38 of 150 files (49 on main c401ad9's base). The Linux leg fails as main does.
- Brief 2's cause for the `\\?\` prefix was wrong (the temp home); run 2 disproved it, and build 3 found the real source:
  `fs.mkdirSync(..., { recursive: true })` returns the first folder it made, and on Windows that comes back as `\\?\C:\...`.
- No wrong-code pairs and no independent check: an ordinary lane (tests only; no extension or library code changed).
- After final round 1 (SEND-BACK, `sol-r1.md`: the dangling-link skip's reason was false), build 5 runs those cases on Windows
  and skips only when the test cannot create a symlink. Run 5 (`ci-windows-run-5.log`, 0101eea): handoff-store 46 + 2 skips
  (was 36 + 3), with all ten dangling-link checks passing on Windows; the other six target files unchanged; Windows failing
  38 of 150 files.
