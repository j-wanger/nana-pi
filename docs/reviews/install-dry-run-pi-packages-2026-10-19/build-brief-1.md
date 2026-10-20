# Build brief · install-dry-run-pi-packages (builder: Claude Sonnet subagent, simple lane)

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate.
Follow packages/nana-pack/prompts/builder-preamble.md. Work in ~/nana-pi-wt/install-dry-run-pi-packages on feat/install-dry-run-pi-packages, branched from main. Rows R-358 and R-391 (pins) and R-1930 to R-1932 only. Read must-meet.md in this folder first.

## Change
1. REQUIREMENTS.md first, in SUB-014's table. Narrow R-391's text in place to must-meet's wording. Keep R-358's text. Add R-1930, R-1931 and R-1932 right after R-391, worded as in must-meet.md, status `planned`.
2. packages/nana-setup/tests/pi-registration.test.mjs: two new blocks just before the final R-392 manifest check. Leave every existing block unchanged.
   - Recording pi: copy the R-323/R-1690 block's record.cjs plus `pi` / `pi.cmd` pattern into a new tmpDir. record.cjs also prints `1.0.2` when argv[0] is `--version`.
   - CLI block: swap process.env.PATH so the recorder comes first; restore it in finally; pass no env copy. Run install, then install --dry-run, each on its own `piHomeWith(null)` --home. R-391 applies `/^\s*\S\s+pi packages\s+skipped\s+not registered \(--home override in play\)\s*$/m` to each stdout. R-358: no logged argv from those two runs starts with `install`; then, still under the swap, `stepPiRegister({ ...resolveLayout({ home: piHomeWith(null) }), isRealHome: true }, {}, { platform: () => process.platform })` reports created and logs an `install` argv.
   - Unit block: two tmpDir fixture roots, each holding packages/nana-pack/extensions and packages/nana-knowledge/extensions, a package.json per package and a root package.json declaring both. The second prefix holds `!`; neither prefix holds the word `install`. Layout: { piHome and piSettings under the fixture, isRealHome: true }. Run every case twice, without and with dryRun, with injected platform, env, exists, manifestRoot and a recording spawn. A spawn carries install when args[0] is `install` (darwin) or the cmd.exe line holds `"install"` (win32). Cases and assertions are in must-meet "How the tests work"; R-1931 also asserts installExitCode(dry) === 1.
   - Each `// req: R-nnn` line sits directly above its one-line `check("title", …`. Use the titles exactly as must-meet.md gives them.
   - Run the file. See R-391, R-1930 and R-1931 red before you touch steps.mjs.
3. packages/nana-setup/lib/steps.mjs, stepPiRegister only: must-meet Design 1 to 3, three lines. Keep every detail string as it is.
4. packages/nana-setup/README.md, with no owner name and no machine path: the Idempotence sentence and the test-table cell from must-meet Design 4.
5. Flip R-358, R-391 and R-1930 to R-1932 to `implemented`, with `packages/nana-setup/tests/pi-registration.test.mjs::<title>` as evidence; drop the old untested notes. Run `npm run req:tree` and `npm run map`. Then `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` must exit 0.

## Wrong code to try (each alone on your change; see the named checks red; revert)
- W2 delete the --home check → R-391, R-358. W3 drop the `install && o.dryRun` guard → R-1932.
- W4 `if (o.dryRun) return` today's would-add row right after the --home check → R-1930, R-1931. W5 the same right after `if (!pi)` → R-1930, R-1931.
- W6 move the guard above `if (command.refused)` → R-1931. W7 change the --home check to `!layout.isRealHome && o.dryRun` → R-391, R-358.
- W8 under --home spawn `pi install`, then return skipped → R-358. W9 guard on `o.dryRun` alone → R-1930, R-1931. W10 dry-run detail `added …` → R-1932.

## Run
Single files only, each `node <file>` under packages/nana-setup/tests: pi-registration, install, doctor-runtime, settings-merge, retired-artifacts, relative-agent-dir, desk-service. Also run `NANA_SETUP_PLATFORM=win32 node packages/nana-setup/tests/pi-registration.test.mjs`; its only FAIL must be main's existing R-323 install check. No full suite, no push, no edits to HANDOFF.md or docs/sessions.

## Done
- R-391, R-1930 and R-1931 were seen red before the code change; all five checks pass after it.
- W2 to W10 were each seen red on their named checks.
- Every named file exits 0. map:check and readme:check exit 0. The trace reports 0 rows off EARS form.

## Report (10 lines or fewer)
VERDICT; commits; rows narrowed, added and flipped; each check title with the wrong code seen red; each single-file command with its exit code; the forced-win32 FAIL list; map:check, readme:check and trace results; what was not done.