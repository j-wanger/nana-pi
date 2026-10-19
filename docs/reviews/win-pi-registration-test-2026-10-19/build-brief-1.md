# Build brief 1: win-pi-registration-test

Feature: FEAT-013 · Install and connect harness runtimes. Class: ordinary. Builder: Claude Sonnet subagent in ~/nana-pi-wt/win-pi-registration-test on feat/win-pi-registration-test. Follow packages/nana-pack/prompts/builder-preamble.md. New row IDs come only from R-1690 to R-1699. Run single test files only, through the repo runner. Do not run the full suite; the seat runs it locked. Never edit HANDOFF.md or docs/sessions/.

## Change
1. REQUIREMENTS.md: add R-1690 under SUB-013, directly after R-1039. Use the exact row text in must-meet.md, status `implemented`, with Evidence citing the test below. Touch no other row.
2. packages/nana-setup/tests/pi-registration.test.mjs, in the block `if (process.platform !== "win32") { ... } else console.log("SKIP POSIX-only fake-pi ...")`:
   - Make it a plain `{ ... }` block. The R-392 and R-654 checks stay unchanged.
   - Replace the printf sh fake with one recorder. `record.cjs` in fakeBin appends `JSON.stringify(process.argv.slice(2)) + "\n"` to `calls` in fakeBin.
     - win32: `pi.cmd` = `@"${process.execPath}" "%~dp0record.cjs" %*\r\n`.
     - Elsewhere: `pi` = `#!/bin/sh\nexec '${process.execPath}' '${recorder}' "$@"\n`, chmod 0755.
   - Set `process.env.PATH = fakeBin + path.delimiter + saved` and restore it in `finally`. Call `stepPiRegister({ ...resolveLayout({ home }), isRealHome: true }, {})` with NO injection.
   - `calls` = the log's non-empty lines parsed as JSON, or `[]` when the log is missing.
   - `ok` = `installed[0]?.status === "created"` and the calls deep-equal `[["--version"], ["install", path.join(repo, "packages", "nana-pack")]]`.
   - win32: `// req: R-1690` directly above `check("win32 install runs a pi.cmd through cmd.exe to add only the missing per-package entry, never a root entry", ok, extra);`
   - Else: `// req: R-323` directly above the EXISTING title `check("install adds only the missing per-package entry, never a root entry", ok, extra);`, unchanged byte for byte.
   - Keep each `check("title", …` call on one line, directly under its marker.
3. Do NOT edit packages/nana-pack/tests/fake-pi.mjs, stub-pi.mjs, steps.mjs or any product code. Leave the module header as it is.
4. If packages/nana-pack/tests/requirements-tree.test.mjs still has the R-291 leaf-total literal on your base, set it and the "1,298" in its title and message to the total `node scripts/requirements-trace.mjs` prints (1,299 on 713d6aa). If leaf-total-drop has landed, skip this step.
5. Run `npm run req:tree` and commit the regenerated docs/requirements-tree.md.

## Tests to run (single files)
- `node scripts/test.mjs packages/nana-setup/tests/pi-registration.test.mjs` should give 64 pass, 3 skip, 0 fail. The runner gives the file a temp HOME. A bare `node <file>` reads your real home, and its counts differ, so do not use it for the count.
- `node scripts/test.mjs packages/nana-pack/tests/requirements-tree.test.mjs`
- `node scripts/requirements-trace.mjs` should report 0 problems and 0 rows off EARS form.
- `npm run map:check` and `npm run readme:check`

## Wrong code to try in steps.mjs (revert each one; product code stays unchanged in the commit)
- W1: loop over `state.packageRoots` with no filter. The R-323 branch must FAIL.
- W2: run `launch(["install", manifestRoot], true)` instead of the package directory. Must FAIL.
- W4: replace the install launch with `{ status: 0 }`. Must FAIL.
- W5: replace the version probe with `{ status: 0 }`. Must FAIL.
- W3 (Windows only, NOT run locally): launch the `.cmd` directly on win32, without ComSpec. Expected FAIL with EINVAL. Name it in the report as not run.

## Done
- The Windows SKIP line is gone, and the R-1690 check sits under its marker.
- The R-323 title is unchanged, and the runner shows 64 pass, 3 skip.
- W1, W2, W4 and W5 each go red, and each is reverted.
- The trace, map:check, readme:check and requirements-tree are all green.
- The commit names explicit paths and takes its message file from $TMPDIR.

## Report (≤ 10 lines)
Line 1: `VERDICT: DONE|PARTIAL|BLOCKED`. Then the commit SHA, the pi-registration and requirements-tree counts, and the trace summary line. Then the W1, W2, W4 and W5 FAIL lines, one each. Then the map and readme status, and the files changed. Name the edited existing check (R-323's fake and assertion), as the preamble requires. Say "Windows leg not run" once.