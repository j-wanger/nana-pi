# Seat verification — win-leg-flakes, builds 1 (6c99f999), 2 (76529d12), 3 (bc3e492d) and 4 (72df3508), 2026-10-21

Builder: pi-worker, small lane (roster builder), three sessions. Build 1 reported PARTIAL (no wrong-code tries run); builds 2 to 4 reported DONE. Build 4 answered the Windows leg (run 39626329305): stale-copies-slow passed nothing on Windows, which the runner fails, so R-2483 now runs on Windows and its preload matches the fixture home through HOME or USERPROFILE (wrong-code probe: HOME only, with HOME unset, red).

- Seat title check (`seat-titles.mjs all`): 0 missing.
- Single files on macOS: install-check 133 pass after build 1; stale-copies 14 pass and stale-copies-slow 2 pass (37.9 s) after build 2; the builder's build-3 runs of pi-launch-limits and pack-config-utf16 (5 pass) and every touched file.
- Wrong-code pairs (`seat-mutate.mjs`, shared runner, macOS): 12 of 12 red, 0 survived, re-run at 72df3508 after build 4 (`seat-mutate-output-72df3508.txt`). They cover the brief's eleven tries and the adversary's pair: with the relay's deadline removed, only the outer backstop stops a hung pi (about 8 s), and R-2020 to R-2022 stay red under the 7.5 s bound.
- The R-2484 and R-2485 checks are functions the file's harness awaits (`check(title, run)` pushes `{ title, run }`), so neither passes by being truthy.
- macOS install check (`node packages/nana-setup/bin/install-check.mjs`, lane touches nana-setup): 17 PASS, 0 FAIL, exit 0, at bc3e492d's code.
- Merged main bc529014 (frontier-first) at 6ef4f91e: clean merge; map:check 0 problems, readme:check 0 problems, trace exit 0; frontier 51 pass and product-report 76 pass after the notes.
- The builder's full suite at bc3e492d: 201 files, 199 PASS, 0 FAIL, 2 SKIP; 8,228 checks pass. The land reruns the locked suite on the reviewed tip.
