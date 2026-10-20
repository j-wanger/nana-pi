# Build brief — doctor-path-row-remedy
Feature: FEAT-015 · Diagnose the active environment · rows R-2320–R-2325 · class: install, hook or gate
Work in ~/nana-pi-wt/doctor-path-row-remedy on feat/doctor-path-row-remedy, cut from current main. Follow packages/nana-pack/prompts/builder-preamble.md. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change, in this order
1. REQUIREMENTS.md, FEAT-015: add R-2320–R-2325 directly after R-1997 (before R-2084) as `untested`, with the must-meet text. Flip each row to implemented, with its file::title, once its check passes.
2. packages/nana-setup/tests/doctor-fix-line.test.mjs (tests before code):
   - Set up these helpers:
     - stubDir = withPiStub(() => process.env.PATH.split(path.delimiter)[0]).
     - nodeDir = path.dirname(process.execPath).
     - sysDirs = [<SystemRoot>\System32] on a win32 host, else [].
     - Throw if nodeDir or a sysDir holds pi-review or pi-review.cmd.
   - runOnPath(args, {home, cwd, entries, extraEnv}):
     - Set process.env.PATH to the entries, joined with ";" when win32 (host or forced) and with path.delimiter otherwise.
     - Call spawnSync(process.execPath, [cli, ...args], {cwd, env: cleanEnv(home, extraEnv), encoding: "utf8"}) DIRECTLY, and restore PATH in finally.
     - Never call run() or withPiStub here. withPiStub prepends the stub with ":" on a POSIX host, which glues it onto the forced Path's first entry. Never add a second PATH key.
   - Native home: run(["install","--home",home]), then remove the launcher. That is pi-review.cmd on a win32 host and the pi-review link otherwise.
   - `other` is a folder with an executable pi-review. On a win32 host it is pi-review.cmd containing "@exit /b 0".
   - Run doctor with NO --home on these PATH lists:
     - on: [stub, bin, node, ...sys]
     - off: [stub, node, ...sys]
     - before: [stub, other, bin, node, ...sys]
     - after: [stub, bin, other, node, ...sys]
   - Forced home with NANA_SETUP_PLATFORM=win32: install --home, remove pi-review.cmd, then run doctor with no --home on [bin.toUpperCase(), stub, node, ...sys].
   - Move R-1993's by-hand regex into a byHandOf(result) helper, and have R-1993 use it with the same meaning.
   - byHand(r): failedLabels(r) and byHandOf(r) both hold the row.
   - toInstall(r): failedLabels(r) holds the row, byHandOf(r) does not, and the summary matches /^(?:\d+ missing — run: nana-setup install|.*; then run: nana-setup install for the other \d+)(?: \(and see the \d+ ! above\))?$/. The refusal and could-not-predict lines must fail it.
   - R-2320 also checks that the ✗ PATH resolves pi-review line includes "nana-setup install" and not `add ${bin} to`. R-2322 checks that the line still includes `add ${bin} to`.
   - Map checks to runs: R-2320 and R-2321 use "on", R-2322 "off", R-2323 the forced home, R-2324 "before", R-2325 "after".
   - Put `// req: R-232n` directly above `check("R-232n: <title>", …`, with the call on one line and titles exactly as in the must-meet table.
   - Header: @outputs names R-1990–R-1997 and R-2320–R-2325. @purpose covers the PATH row's advice in the same one sentence.
3. packages/nana-setup/lib/doctor.mjs, PATH section, both branches:
   - Find binAt. On win32, split on ";" with findOnPath's trim and unquote, then compare path.win32.resolve on both sides, lowercased. On POSIX, split on path.delimiter and compare path.resolve.
   - installFixes = !matches && binAt >= 0 && nothing resolves from entries.slice(0, binAt). POSIX uses firstOnPath. win32 uses findOnPath with env ONLY { PATH: slice joined with ";", PATHEXT: process.env.PATHEXT }. A spread of process.env keeps Windows' "Path" key ahead of PATH.
   - When installFixes is true, the remedy is "<bin> is on PATH — run `nana-setup install` to recreate the launcher", and add() gets installLabel "PATH pi-review". Otherwise the code stays as it is today.
   - nana-setup.mjs, steps.mjs and fsops.mjs get no change.
4. packages/nana-setup/README.md: replace "A row with no install step, such as `PATH resolves pi-review`, is listed by hand." with "`PATH resolves pi-review` goes to install when the bin folder is already on PATH and no earlier PATH entry holds a pi-review; otherwise doctor lists it by hand."
5. Run npm run map, npm run map:check, npm run readme:check and node scripts/requirements-tree.mjs --check.

## Wrong code to try (each must turn the named check red on macOS)
- Always set the install label: R-2322 and R-2324 go red.
- Treat "bin on PATH" as enough, with no earlier-entry check: R-2324 goes red.
- Drop `binAt >= 0`, so slice(0, -1) applies: R-2322 goes red.
- Use found === null in place of the slice lookup: R-2325 goes red.
- win32 compares with case, or splits on path.delimiter: R-2323 goes red.
- installLabel "PATH resolves pi-review" (no such install row): R-2321, R-2323 and R-2325 go red.
- Set the install label but keep the add-to-PATH detail: R-2320 goes red.
- win32 lookup with { ...process.env, PATH: slice } goes red on the Windows leg only (R-2325). Report it as a Windows-only pair.

## Done
- R-2320–R-2325 PASS, with R-1990–R-1997 still passing, in doctor-fix-line.test.mjs.
- doctor-runtime.test.mjs passes.
- map:check, readme:check and the tree check are green, and the rows read implemented.
- No inline tunable is added, and the six-tag headers stay intact.

## Report (≤ 10 lines)
Report the verdict, the commit, the six titles with PASS, each wrong code with the check it turned red, the files touched, and any known limit you changed.