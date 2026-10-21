Feature: FEAT-005 · Communicate decisions clearly (PATH rows in FEAT-013). Lane writing-adoption, rows R-2498 to R-2503. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 2 of 3: nana-writing on PATH.

Work in ~/nana-pi-wt/writing-adoption on feat/writing-adoption. The plan of record is `docs/reviews/writing-adoption-2026-10-21/must-meet.md` (rows R-2498 and R-2499, seat decision D5). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. No push.

The seat checked build 1 at c2e488ed: writing-injection 30 pass, writing-check 47 pass, config-normalize 23 pass, the seat check prints `0 missing` for session 1, and map and trace are green. No findings carry over.

1. The checker becomes executable: `chmod +x packages/nana-pack/bin/nana-writing.mjs` and `git add` it, so git records mode 100755. Install never chmods the checkout.

2. One PATH list (D5). Export one `PATH_COMMANDS` list of `[name, source]` pairs from the setup lib that owns the bin paths, holding pi-review, pi-worker, nana-land, nana-setup and nana-writing (source: this checkout's `packages/nana-pack/bin/nana-writing.mjs`). Use it in `stepPath` (`packages/nana-setup/lib/steps.mjs` :800-806), in both doctor branches (`packages/nana-setup/lib/doctor.mjs` :634 and the win32 branch near :655-660), and in the state manifest (`packages/nana-setup/lib/state-manifest.mjs` :64-65, both the link and the `.cmd` shim names). Update each module's `@inputs`/`@outputs` header where it names the commands. Uninstall reads the manifest, so it follows.

3. R-2498 and R-2499, with the must-meet's titles and steps.
   - R-2498 in `packages/nana-setup/tests/install.test.mjs`: the source's git mode is 100755 before and after install; a temp-home install; the child PATH holds only the install's bin folder and node's folder; a fixed text piped to bare `nana-writing --report` exits 0 with the exact summary counts, `verdict=1/1` and exactly one length line; doctor ✗ after the link is removed, and ✗ after it is retargeted to `pi-review.mjs`.
   - R-2499 in `packages/nana-setup/tests/win-shims.test.mjs`: Windows only, SKIP elsewhere with a reason; the same fixed text piped through `cmd.exe /d /s /c` and through `powershell -NoProfile -Command` gives the same exact counts and the one length line.
   - Add a stdin case to R-1611's sh-shim check (piped text reaches node through the sh shim by bare name), keeping its title.
   - Amend R-1610 and R-1615 in REQUIREMENTS.md to name nana-writing in their command lists, and update their tests to expect five commands. Add R-2498 and R-2499 to FEAT-013 with the must-meet's texts; R-2499's evidence is `` `packages/nana-setup/tests/win-shims.test.mjs::<exact title>`; Windows-leg-only ``, the form R-2273 uses, with status `implemented`.
   - Update every test that lists PATH rows or state-manifest labels: `packages/nana-setup/tests/uninstall.test.mjs` (near :298), `restore.test.mjs` (near :53), `state-manifest.test.mjs` (near :61-77), the R-589 header regex in `install.test.mjs` (near :58), and any doctor or install-check fixture that counts PATH rows (grep for `nana-land` across `packages/nana-setup/tests/` and `packages/nana-setup/lib/install-check*.mjs`).

4. Run each changed test file, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, and `node packages/nana-setup/bin/install-check.mjs` (macOS). For R-2498, try the wrong versions the must-meet names (install chmods the source; doctor checks only that a link exists; the test inherits the real PATH) and see the check go red; restore each. Commit with explicit paths. No full suite this session.

Seat check: `node docs/reviews/writing-adoption-2026-10-21/seat-titles.mjs 2` must print `0 missing`.

Done:
- nana-writing is on PATH by one shared list on POSIX and as shims on Windows; R-2498 passes on macOS; R-2499 skips on macOS with its reason; R-1610, R-1611 and R-1615 still pass with five commands.
- map:check, req:tree, readme:check, the trace and the install check are green; the seat check prints `0 missing`; the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each check's result; the wrong versions tried; the install check's summary line; map, readme, trace and seat-check status.
