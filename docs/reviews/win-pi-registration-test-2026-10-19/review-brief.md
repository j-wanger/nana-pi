# Review — win-pi-registration-test (the Windows test run proves how install registers nana with pi through a `.cmd` pi), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-013 · Connect hooks and packages without duplication)

Review `git diff 27603d4..HEAD` on `feat/win-pi-registration-test` (`git merge-base HEAD main` is `27603d4`; main was at
`f9cd9fd` when this brief was written, four lands later — win-leg-flip, readme-install, parallel-runner and
adopt-closes-check — and the lane has not merged it; that merge gets its own confirmation round). The plan of record is
`docs/reviews/win-pi-registration-test-2026-10-19/must-meet.md` (row R-1690), with the adversary's amendments in
`plan-attack.md` and the build in `build-brief-1.md`. The seat's record `seat-verify-6ff7a7b.md` holds CI, the Windows
log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 27603d4..6ff7a7b: 1 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-1690 new (implemented)
```

Judge whether, on Windows, the R-1690 check runs a `.cmd` pi first on PATH through the real launch — no injected
platform, locator, ComSpec or spawn — and fails if install runs a package root or the manifest root, skips the version
probe, reports `created` without installing, or launches the `.cmd` without cmd.exe. Judge whether the R-392 coverage
check and the R-654 doctor check, now outside the platform guard, still mean what their rows say on every platform.
Judge the one edit to an existing check: R-323's `install adds only the missing per-package entry, never a root entry`
keeps its title byte for byte but now uses the shared recorder and asserts status `created` and the exact argument lists
`[["--version"], ["install", <repo>/packages/nana-pack]]`; it used to check two calls, the second the pack install, and
no root install. Does it still pin R-323's row on macOS and Linux? Judge too whether the test restores PATH and writes
only inside its own temp folders.

Threat model: honest variation in our tools' output and the OS in scope (drive letters, a temp folder on another drive
from the checkout, 8.3 short temp names, PATH spelled `Path` or `PATH`, PATHEXT, Node refusing to start a `.cmd` without
cmd.exe); deliberate forgery out. Lane class: ordinary — one test file, one new row, the regenerated tree and the R-291
leaf total; no install, doctor, hook, extension, gate or review-tool code changes.

Check: (1) the R-1690 check is not vacuous: a missing call log reads as no calls and fails, and the Windows CI log shows
it PASS; (2) R-323's edited check is at least as strict as before and its title is unchanged; (3) the test writes only
inside the temp folders it owns, restores PATH, and leaves `fake-pi.mjs`, `stub-pi.mjs` and `steps.mjs` unchanged;
(4) nothing else changed; among existing tests only R-323's check and the R-291 leaf total changed; (5) the one Windows CI
failure, the mutation runner's cleanup check, lies outside the lane's change; (6) HANDOFF and the session entry are
true; (7) any MUST.
