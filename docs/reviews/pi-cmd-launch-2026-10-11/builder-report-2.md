VERDICT: PARTIAL

- Commits: `bdddd7c` and `7bd424b`, both pushed to `feat/pi-cmd-launch`.
- Files: `packages/nana-pack/tests/win-command.test.mjs`; `packages/nana-setup/tests/pi-registration.test.mjs`.
- Rows: R-323 guards the POSIX fake-pi test; injected launch cases remain cross-platform. R-1038 checks each internal command plus a missing-command control. R-1034’s npm-shim check pins exact argv.
- Run 38166757684, Windows lines verbatim:
  `PASS  packages/nana-pack/tests/post-edit-status.test.mjs              30 pass, 1 skip  2.2s`
  `FAIL  packages/nana-pack/tests/win-command.test.mjs                   80 pass, 48 fail  11.6s  — exit 1`
  `FAIL  packages/nana-setup/tests/pi-registration.test.mjs              48 pass  2.1s  — exit 1`
- Run 38170007121, Windows lines verbatim:
  `PASS  packages/nana-pack/tests/post-edit-status.test.mjs              30 pass, 1 skip  2.1s`
  `FAIL  packages/nana-pack/tests/win-command.test.mjs                   39 pass, 45 fail  3.1s  — exit 1`
  `FAIL  packages/nana-setup/tests/pi-registration.test.mjs              57 pass, 2 fail, 3 skip  6.8s  — exit 1`
- Run 38172275204, Windows lines verbatim:
  `PASS  packages/nana-pack/tests/post-edit-status.test.mjs              30 pass, 1 skip  2.9s`
  `PASS  packages/nana-pack/tests/win-command.test.mjs                   84 pass  2.5s`
  `PASS  packages/nana-setup/tests/pi-registration.test.mjs              61 pass, 3 skip  5.5s`
- Mutation evidence: internal probe failed first on exit-status assumptions, then on `where.exe`’s stderr; corrected probe passed 84 checks. npm-shim check failed under shell invocation, then its file passed after switching to npm’s JS CLI.
- Commands: focused tests and syntax checks exit 0; `npm run test:locked` first exit 1 (requirement-tag placement), rerun exit 0; both seat scripts exit 0; pushes and final CI run succeeded.
- Suite summary: `134 files: 133 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6764 pass, 0 fail, 8 skip · 661.8s`
- `seat-verify-wincmd-output.txt`: `cases: 86/86` / `seat-verify-wincmd: 0 mismatch(es)`
- `seat-verify-tests-output.txt`: `ok   replaced: win32 skips pi executable probe → win32 pi executable probe uses injected ComSpec launcher` / `seat-verify-tests: 0 gap(s)`
- Partial: CI’s normal runner only logs per-file summaries, not the individual npm-shim PASS line. The 61-pass registration result includes that exact-argv check, but its individual output is not verbatim in the run log.
- Left untouched: unrelated Windows baseline failures described in the brief. Most likely wrong claim: the npm CLI invocation will preserve argv across other Windows npm/toolchain versions.
