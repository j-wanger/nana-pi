# Seat checks — win-impact-paths builds 1 and 2, tip 3bd044e (2026-10-18)

- The builder's full suite on the Mac at c5698fd and at 3bd044e: `150 files: 148 PASS, 0 FAIL, 2 SKIP`, 7,460 checks at
  c5698fd; exit 0 both times. Map, trace and README checks clean.
- CI on draft pull request #26. Run 1 (`ci-windows-run-1.log`, 3ade09f, the check alone): IP2 fails there,
  `--impact maps a module named with the platform's native separator 0: packages\nana-pack\lib\agent-dir.mjs  [NOT A
  MAPPED MODULE]`; runtime-map 4 pass, 3 fail. requirement-rows and requirements-trace also fail on that commit only,
  because R-1361 is still `planned` while a test traces it (the rows command exits 1 there and 0 at the tip).
- Run 2 (`ci-windows-run-2.log`, c5698fd, the fix): code-map 48 pass; runtime-map 7 pass and R-1277's 1 skip
  (IP1); requirement-rows and requirements-trace pass; Windows failing 23 of 150 files (24 on main 5e8a7d7). Build 2
  changed only runtime-map's check helper so R-1278 prints its detail on a failure.
- The builder's wrong-code proof on macOS: joining the relative path with backslashes in the template generator turns
  IP2 red.
- No wrong-code pairs and no independent check: an ordinary lane.
