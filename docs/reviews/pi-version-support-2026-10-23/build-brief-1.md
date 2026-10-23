Feature: FEAT-013 · Install and connect harness runtimes (rows also in FEAT-015 · Diagnose the active environment and FEAT-019 · Release usable templates and report support). Lane pi-version-support. Class: install. Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/pi-version-support. The spec is `docs/reviews/pi-version-support-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ; read the draft for the measurements, the design parts 1 to 6, the test designs, the tunables' provenance and the pairs, and `plan-attack.md` for the findings the must-meet adopts. `probe-ci-2026-10-23.md` records the Windows and macOS CI runs on both versions. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: CI tests pi 1.4.0 (the ceiling, also the README's install) and pi 1.0.3 (the floor) with the install check on macOS and Windows, the suite runs on the ceiling, the READMEs state the range and carry one floor command, and doctor gains a `pi packages` row that prints ✗ when the pi on PATH runs from a package whose own scoped dependencies are installed newer than itself.

Precedent:
- .github/workflows/ci.yml — the workflow-level env block and its provenance comments, the install-check job the matrix extends, and the suite job's matrix.
- packages/nana-pack/tests/ci-workflow.test.mjs — the R-1091 declaration and seal checks (the shape of R-2712 and the new seal), the R-1078 checks and the R-1090 check (the shape of R-2711), and R-597's check.
- packages/nana-setup/lib/doctor.mjs — the `pi executable` block and its injected `opts.pi` readers, where the new row sits; the `pi pi-subagents` row, which reads an installed `package.json` version and names a fix; `versionAtLeast` and `firstOnPath`, passed into the new module as arguments, never imported by it.
- apps/desk/pi-session.mjs — `walkUpToPackage` (real path of the executable, then up at most six folders to the nearest `package.json`) and `resolvePiPackage`, the production walk the row copies. Read only.
- apps/bench/lib/pi-exports.mjs — the same walk, read only.
- packages/nana-setup/lib/pi-invocation.mjs and packages/nana-pack/bin/pi-watchdog.mjs `piLaunch` — read only: the win32 shim to package-folder resolution the row reuses through doctor's existing invocation.
- packages/nana-pack/tests/pi-install.mjs — `findPiRoot`'s walk; packages/nana-pack/tests/pi-install.test.mjs — the stub `npm` that answers `root -g` and `npm_config_prefix` on the decoy (S-2).
- packages/nana-setup/lib/steps.mjs — `PI_INSTALL_HINT`, reused in the ✗ detail.
- packages/nana-setup/lib/pi-pin.mjs — read only: how CI's pin is parsed; the floor and range checks follow its shape.
- packages/nana-setup/tests/doctor-runtime.test.mjs — PATH stub fixtures and the `diagnose()` row lookup.
- packages/nana-setup/tests/pi-registration.test.mjs — win32 fixtures through injected `exists` and `readText` on any OS.
- packages/nana-setup/tests/pi-install-pin.test.mjs — the README scan against CI's pin, the shape of R-2716, R-2717 and the amended R-1093 check.
- packages/nana-setup/lib/install-check-config.mjs — read only: `DOCTOR_NOTES`; the new row must never be `·` in CI or on this Mac.

Named departures the brief accepts: the row lives in its own module, `packages/nana-setup/lib/pi-packages.mjs`, because finding and judging pi's package is one purpose and doctor is already long; the walk is copied from the desk, because a package may not import from `apps/` and the desk is frozen; the row does not tie a shim to a package by `pi --version` as `resolvePiPackage` does; the label `pi packages` stays inline like doctor's others.

Traps:
- No `·` anywhere in the row's detail, ✓ and ✗ included: the install check fails any doctor line holding `·` whose label is not a declared note, on every CI leg.
- Read only `dependencies`, never `devDependencies`: pi 1.0.3 lists three uninstalled scoped packages there.
- The new module must not import `doctor.mjs` (an import cycle the map does not flag).
- R-1078's two checks must pass unedited. A needed change to pi-worker, pi-watchdog, the desk's or the bench's code, the install check's code or any extension stops the build: report it instead.
- The desk README edit is the install command and the tested-on note only.

Steps, in order:
1. Rows first: add R-2711 and R-2712 to `REQUIREMENTS.md` in FEAT-019 after R-1092, R-2713 to R-2715 in FEAT-015 after R-1037, R-2716 and R-2717 in FEAT-013 SUB-011 after R-1094, each `untested` until its check passes, then `implemented` with backticked `file::title` evidence. Amend R-1090, R-1091 and R-1093 in place as the must-meet says; keep their IDs; R-1093's README-command check takes its new title.
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, with the must-meet's changes to the draft's test designs (M-1, S-1, S-2, S-3, N-3, N-7). Edit R-597's and R-1091's checks as the must-meet says. Every new check must be red on main's code; check that by hand once per row and say so in the report (do not commit those checks).
3. CI and code: `ci.yml` (env pins with provenance comments, the install-check matrix and its gated install and version steps); `pi-packages.mjs` with the six-tag header; doctor's row directly after `pi executable`.
4. Docs: as the must-meet's and draft's Docs lists say, the README pins by R-1093, the support sentence (R-2716), the floor command in the setup README's "Upgrade pi itself" paragraph (R-2717), the doctor row list and test table, the tested-on notes naming what ran; module headers of `doctor.mjs` and `ci-workflow.test.mjs`. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: `ci-workflow`, `doctor-pi-packages`, `pi-install-pin`, `fresh-machine`, `doctor-runtime` and `doctor-package-source` test files each alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows or CI here; reason about the win32 paths and the matrix from the code and say what you could not run.

Seat check: `node docs/reviews/pi-version-support-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and was red on main as step 2 says, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
