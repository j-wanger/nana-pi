# Lane pi-cmd-launch — build brief 3: one surviving mutation, one row gap, one duplicate (2026-10-11)

Round 2 made the Windows leg prove the lane (run 38172275204: `win-command`, `pi-registration` and
`post-edit-status` all PASS on Windows). The seat's mutation runner (`seat-mutate.py`, this folder)
turns 16 of 17 code mutations red. Do every item:

- [ ] **A. The survivor (R-1036 on POSIX).** Changing `stepPiRegister`'s POSIX check from
  `probe.error?.code === "ENOENT"` to any `probe.error` leaves the suite green: no suite test covers a
  found-but-failing pi on macOS/Linux. Add injected cases with `platform: () => "darwin"` in
  `pi-registration.test.mjs`: `ENOENT` → skipped with the hint; `EACCES` → problem and
  `installExitCode` 1; `--version` exit 2 → problem.
- [ ] **B. R-1038 says "with a PATHEXT extension"; the code allows only the four pi extensions.**
  `findOnPath`'s internal `extensions()` filters every lookup to `.com/.exe/.bat/.cmd`, so a
  post-edit command whose tool is `ruff.py` (PATHEXT holding `.PY`) is classified "could not run"
  although cmd.exe runs it. Make `findOnPath` honour the full PATHEXT by default and take the
  four-extension restriction as an option; add one exported `findPi({ env, cwd, exists })` in
  `win-command.mjs` that applies it (R-1033). Use `findPi` in `steps.mjs` and `doctor.mjs`, and delete
  the two copies of the filter there (`piLookupEnv` and doctor's `lookupEnv`). Tests: post-edit with
  PATHEXT `.PY;.CMD` and an existing `C:\bin\ruff.py` → NOT classified; `findPi` still skips `pi.js`
  and `pi.ps1`.
- [ ] **C.** Run `python3 docs/reviews/pi-cmd-launch-2026-10-11/seat-mutate.py > docs/reviews/pi-cmd-launch-2026-10-11/seat-mutate-output.txt 2>&1`.
  Its anchors name today's code; if B changes an anchored line so a mutation reports `ANCHOR`, do NOT
  edit the script — say which in the report, and the seat updates it. Otherwise it must end
  `mutations: 17/17 red` and `worktree clean`.

Rules as before. Then `npm run test:locked`, both seat scripts into their output files, commit with
explicit paths, push (the draft PR's CI must stay green for the three files on Windows — report the
run id and the three Windows lines verbatim). Report ≤ 20 lines, first line `VERDICT: …`.
