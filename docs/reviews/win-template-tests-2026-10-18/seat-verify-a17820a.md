# Seat checks — win-template-tests builds 1 and 2, tip a17820a (2026-10-18)

- Full suite on the Mac on a17820a (main 86af1e8 merged, map regenerated): `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN ·
  checks: 7457 pass, 0 fail, 14 skip · 782.1s`, exit 0.
- CI on draft pull request #24. Run 1 (`ci-windows-run-1.log`, 25717de): template-acceptance 12, template-release 5 and
  test-runner 39 pass with no skip; templates-update 30 pass, 3 fail (copier's update under the short temp path). Run 2
  (`ci-windows-run-2.log`, 8c5d512): templates-update 33 pass, 1 fail — "Python earlier-tag update prints Part G drift",
  the Python template's own pytest failing on Windows (`UnicodeDecodeError ... byte 0xb7`). Run 3 (`ci-windows-run-3.log`,
  the exact merged tip a17820a): the same; worker-lane (main's review-tools lane) still passes; Windows failing 25 of 150
  files (28 on main 86af1e8).
- `must-meet.md` carries the seat's amendment: TT1 holds for every check but that one, a product bug in
  `templates/python/template/` that the next lane, win-python-template, fixes.
- The seat's checks of both builds are in `seat-audit-1.md` (no MUST); build 2 took the audit's SHOULD (a failed tag
  probe fails under `NANA_TEST_REQUIRE_COPIER=1`).
- No wrong-code pairs and no independent check: an ordinary lane (tests and one test helper only; no template or tool
  code changed).
