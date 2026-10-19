# win-path-commands — build brief 2

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Builder: pi gpt-5.6-sol through
pi-worker --lane-size larger. Read `must-meet.md` and `build-brief-1.md` first; build 1 is `f7c5db53`, and the seat's
pairs commit `33df0705` follows it. Rows R-1610 to R-1619 are this lane's block.

## Findings to fix, in order

1. **R-1612 fails on the Windows CI leg** (run 39322810029, the only failing file: `win-shims.test.mjs 5 pass, 1 fail`).
   `assert.deepEqual(result.argv, args)` differs only in the `@<brief>` argument: the fixture folder's `é` arrives as
   `├⌐`, the UTF-8 bytes of `é` read in code page 437. The cause is the caller, not the shim: `runCmdCaller` writes the
   arguments into `argument caller.cmd` with `fs.writeFileSync` (UTF-8), and cmd.exe reads a batch file's lines in the
   console's OEM code page. Build brief 1 asked for "a verbatim `/d /s /c` line (cmd.exe)", which is the path a user
   typing in a console takes: put the `pi-review …` command and its arguments on cmd.exe's own command line
   (`windowsVerbatimArguments: true`), with no generated batch file, and keep `é` in the fixture path. Do the same for
   R-1614's cmd caller if it uses the batch file. If a verbatim line cannot carry one of R-1612's arguments, say which
   and why in the report rather than dropping it. Do not weaken the assertion.
2. **The .cmd shim's no-node message escapes its own redirect** (independent check, read on the template, not run):
   `ECHO nana PATH shim: node.exe was not found on PATH 1^>^&2` prints the text plus a literal `1>&2` on stdout. It
   must go to stderr. Add row R-1618 (WHERE win32, IF no node.exe is on PATH THEN the .cmd shim shall exit 1 and
   write the not-found message to stderr, not stdout) and its Windows-only check in `win-shims.test.mjs` (a PATH
   without node.exe; read status, stdout and stderr). See it fail on the Windows leg's reasoning first: say in the
   report why today's line fails it.
3. **R-1615's block crashes instead of failing** (seat pair M1): under main's install (no shims), the block's
   `fs.unlinkSync(path.join(binDir, "nana-land.cmd"))` at `win32-degrade.test.mjs:164` throws ENOENT, so R-1615's title
   never prints. Make that block report a named FAIL when the shim it expects is missing (for example check the file
   first and fail the check), without changing what the check asserts on correct code.
4. **Wording** (independent check, cosmetic): a repeat win32 install's unchanged PATH row reads
   `unchanged  sh: write; .cmd: write`, naming writes that did not happen. Make an unchanged row name no write.

## Rules
Single test files only, never the full suite. No push. No HANDOFF.md or docs/sessions/ edits. Every `// req:` marker sits
directly above its check call with the title on that line. Run `npm run req:tree`, `npm run map` if headers or modules
change, `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`.

## Done
- win-shims, win32-degrade, install and install-check pass as single files on macOS; the Windows-only titles SKIP there.
- R-1618 reads `implemented` with "Windows leg only" in its Evidence.

## Report (10 lines or fewer)
VERDICT; commits; each finding and how it was fixed; each single-file command with exit code and PASS/FAIL/SKIP counts;
for finding 2, why the old line fails the new check; anything you could not verify without Windows.
