VERDICT: PARTIAL

- Commit `f341415` pushed to `feat/pi-cmd-launch`; worktree clean.
- **A — R-1036:** Added POSIX `ENOENT`, `EACCES`, and exit-2 cases; EACCES asserts `installExitCode` 1.
- **B — R-1033/R-1038:** Generic lookup honors PATHEXT; `findPi` restricts pi to four extensions. Updated installer, doctor, post-edit tests, requirements, and code map.
- Mutation evidence: 16/17 red; the remaining mutation reported `ANCHOR bare pi spawn on win32`. Left the runner unchanged; output is in `docs/reviews/pi-cmd-launch-2026-10-11/seat-mutate-output.txt`.
- Seat verification scripts: both exit 0; Windows command verification 87/87.
- Commands: tagged tests and seat scripts exit 0; `npm run test:locked` exit 0 (133 PASS, 1 SKIP); `git push` exit 0.
- Initial locked-suite run failed on stale code map and requirement trace; fixed, regenerated map, and reran successfully.
- **CI run 38179093415:** requested Windows lines:
  - `PASS  packages/nana-pack/tests/post-edit-status.test.mjs              31 pass, 1 skip  2.7s`
  - `PASS  packages/nana-pack/tests/win-command.test.mjs                   86 pass  3.5s`
  - `PASS  packages/nana-setup/tests/pi-registration.test.mjs              64 pass, 3 skip  6.6s`
- CI overall failed: 67 Windows test files failed, including `doctor-runtime`; logs show unrelated Windows portability/environment failures. macOS passed.
- **Suite summary:** local locked full suite passed; hosted CI is not green overall.
- Not done: resolving the mutation runner’s stale anchor or unrelated Windows CI failures.
