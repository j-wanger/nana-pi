# Lane pi-cmd-launch — build brief 4: the final reviews' findings (2026-10-11)

sol r1 (`sol-r1.md`, SEND-BACK 7/10) and astra r1 (`astra-r1.md`, SEND-BACK 8/10) find the code sound
but the evidence and one test unsafe. No new rows (if one is unavoidable, it takes R-1043; R-1040–R-1042
belong to the product-report lane). Do every item:

- [ ] **A (astra MUST).** In the Windows-only npm-shim test (`pi-registration.test.mjs`), make the
  fixture install and the exact `findPi` selection hard preconditions: if either fails, report the
  failure and stop that test before calling `stepPiRegister`. Call registration with a spawn wrapper
  that refuses (and fails the test) any command that is not ComSpec running the fixture's `pi.cmd`,
  so no other pi on PATH can ever run.
- [ ] **B (sol MUST 1).** Run the forbidden-character table (`"`, `%`, `!`, CR, LF, NUL) against an
  ARGUMENT as well as the shim path, keeping R-1035's marker.
- [ ] **C (sol MUST 2 + astra SHOULD 2).** R-1036: restore the plan's "IF pi is found but …" wording if
  it was lost, and cite the existing POSIX tests (darwin `EACCES` and exit-2) in its Evidence. Say in
  the setup README, beside the every-platform claim, that on macOS/Linux a `pi` whose interpreter is
  missing still reports "not on PATH" (the OS gives the same error).
- [ ] **D (sol MUST 3).** An injected doctor case for a located `PI.EXE`: assert the recorded spawn is
  the executable path itself with `["--version"]` and no ComSpec; cite it on R-1039.
- [ ] **E (sol SHOULD).** Setup README: "paths or arguments containing" instead of "paths containing".
- [ ] **F (astra SHOULD 3).** `cmdCouldNotRun` must also try the word AS WRITTEN in each PATH folder
  (CHANGE §3). Regression: `C:\bin\tool` exists, PATH `C:\bin`, PATHEXT `.CMD` → `tool x` is NOT
  classified.
- [ ] **G (astra NOTE, plan outcome 6).** `doctor-runtime.test.mjs` still fails 7 checks on the Windows
  leg — tests of POSIX-only behaviour (sh stubs, forced darwin, the `pi-review` PATH links doctor skips
  on win32). Guard each with `process.platform !== "win32"` and print `SKIP <reason>` on win32, as round
  2 did for the POSIX registration test, so the file passes on Windows. The injected win32 doctor cases
  stay on every platform.

Wrong code first for B, D, F. Then `npm run test:locked`, both seat scripts into their output files,
`python3 docs/reviews/pi-cmd-launch-2026-10-11/seat-mutate.py > docs/reviews/pi-cmd-launch-2026-10-11/seat-mutate-output.txt 2>&1`
(18/18 red; if a line reports `ANCHOR`, do not edit the script — name it in the report), commit with
explicit paths, push, and report the draft PR's Windows lines for `win-command`, `pi-registration`,
`doctor-runtime` and `post-edit-status` verbatim from the new run. Report ≤ 20 lines, first line
`VERDICT: …`.
