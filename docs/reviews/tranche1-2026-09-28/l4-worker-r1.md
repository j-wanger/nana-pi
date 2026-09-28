**L4 report: canonical test path for nana-pi**

`npm test` now runs all 42 unit test files from the repo root and they all pass (exit 0). The doctor test fails on the old `doctor.mjs` and passes after the fix. No file went from PASS to FAIL under the temp HOME, but three files quietly skip their real-machine checks there (details below).

**Commits** on `lane/l4-test-path`, not pushed:
- `4bec951`: doctor fix and new test (`packages/nana-setup/lib/doctor.mjs`, detail strings only; `packages/nana-setup/tests/doctor-detail.test.mjs`, new).
- `83dd7bc`: the runner (`scripts/test.mjs`, new), `package.json` (adds `scripts.test` only, no `prepare`/`postinstall`, `pi` field untouched), and a short "Tests" section in the root `README.md`.
- `git diff b8a926e --stat` shows only these 5 files changed.

**Baseline** (each file run with `node --experimental-strip-types` from its package dir, before any change): 41 files, all exit 0, 1711 PASS lines, 0 FAIL, 0 SKIP.

**`npm test` after the change:**
- 42 files: 42 PASS, 0 FAIL, 0 SKIP.
- Checks: 1709 pass, 0 fail, 4 skip. Takes about 112s. Exit 0.
- Each file runs one at a time from its package dir with its own temp HOME and USERPROFILE.
- `*.e2e.mjs` files and anything under `apps/bench/studies/**/fixture/**` are excluded.
- A file counts as FAIL if it exits non-zero, times out after 300s, or prints a `FAIL` line even with exit 0.
- `post-edit-hardening` is declared as SKIP when `pgrep` isn't on PATH. I checked this with `PATH=/nonexistent`: it printed the SKIP line and exited 0.

**Runner self-test:**
- `npm test -- --self-test review-round` gives 1 PASS and 1 FAIL (the fixture), with `FAIL the runner must turn this file red`, and exits 1.
- `NANA_TEST_SELFTEST=1 npm test -- doctor-detail` also exits 1.
- The fixture is created in a temp dir at run time, so it never runs in the default set.

**Doctor test:**
- **Before the fix:** `FAILED 4`, exit 1.
  - The regular file got ✓, but its detail was "private rule is not a regular file — replace with a regular file".
  - The absent file's detail was "private — never in the repo", which doesn't say it's missing or how to fix it.
  - The symlink and directory cases already passed.
- **After the fix:** 10/10 pass, exit 0.
  - Regular file shows "private — never in the repo".
  - Symlink keeps the exact existing string.
  - Directory shows "not a regular file".
  - Absent shows "private rule is missing — run `nana-setup install` to seed it".
- `install.test.mjs` still passes, 64/64.

**Machine-dependent files:** none flipped to FAIL. These three lose checks under the temp HOME (the drop of 12 from baseline):
- `nana-knowledge/tests/ledger-parse`: 24 → 21 plus a printed "SKIP real DOCTRINE.md not present".
- `nana-setup/tests/project-key`: 20 → 13 plus "SKIP no ~/.claude/projects on this machine".
- `nana-setup/tests/pi-registration`: 51 → 49 plus "SKIP the main clone is not under $HOME" (the tilde case) and "SKIP no ~/.pi/agent/settings.json on this machine".

So by design, `npm test` no longer checks this machine's real registration, project dirs or DOCTRINE.md. Only the per-file baseline commands do.

**Two gaps:** the brief's file list doesn't cover `apps/bench/test/*.test.mjs`, so `npm test` doesn't run them. And if you Ctrl-C the runner, a child running in its own process group can outlive it; only the timeout path kills the whole group.

**The claim I'd most expect to be wrong:** the "total checks" number. It counts output lines that start with `PASS`/`FAIL`/`SKIP`, and the test files don't share one output format. A file that prints ✓ or something else would be undercounted. Pass/fail per file doesn't depend on this; it comes from the exit code and FAIL lines.

VERDICT: DONE
