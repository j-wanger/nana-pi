# win-path-commands — build brief 4

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Builder: pi gpt-5.6-sol through
pi-worker --lane-size larger. Read `must-meet.md` and build briefs 1 to 3 first. Build 3 is `a73e8a1d`; the seat's
pairs commit `31eb1709` follows it. You cannot run Windows here: the seat runs the Windows leg.

## What the Windows CI leg showed on build 3 (run on a73e8a1d, the full suite through `npm test -- --verbose`)

`win-shims.test.mjs 6 pass, 1 fail`. R-1612 failed on its absolute-path half; your new diagnostics printed both runs:

- `relative cmd shim`: status 7, argv exact, `é` intact, execPath the PATH node.exe.
- `absolute cmd shim`: status 1, stderr `Error: Cannot find module 'C:\…\nana shim space & % ( ) ' $a ├⌐-h9TKFk\bin 100%&(x)\probe.mjs'`.

So under the suite's console code page cmd.exe reads the shim's `é` as `├⌐` (code page 437), and the absolute form breaks.
That is brief 1's design reason for `%dp0%`, and it holds. Build 3 concluded the opposite from the seat's scratch run, which
ran the test file directly with node in a CI step whose console code page evidently kept `é`. Both runs are real; the
code page differs between them, and a default US console uses 437.

## Fix

1. R-1612 must not require the absolute form to work. Assert the shipped (relative, `%dp0%`) form end to end, as before.
2. Make the code page deterministic for the cmd.exe callers, so the result does not depend on how the runner was started:
   for example prefix the verbatim caller line with `chcp 437>nul &` (a default US console), or another way you can
   justify. Then an absolute bin path holding `é` must fail R-1612 (or a check in this block that you name), so the seat's
   wrong-code pair W5 (absolute bin path for `%dp0%`) turns red on the Windows leg in any runner.
3. Correct must-meet's Known limits and the README if they now say the absolute form works; say instead that the shim
   names its bin relative to `%dp0%` because cmd.exe reads a .cmd file in the console code page, and a same-drive path
   with characters outside that page breaks the absolute form (Windows CI, the run above). A bin on another drive still
   needs the absolute form: say what happens then (inferred unless you can show it), and keep it a known limit.
4. Keep build 3's diagnostics.

## Rules
Single test files only, never the full suite. No push. No HANDOFF.md or docs/sessions/ edits. Every `// req:` marker sits
directly above its check call with the title on that line. Run `npm run req:tree`, `npm run map` if headers or modules
change, `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`.

## Report (10 lines or fewer)
VERDICT; commits; each fix; each single-file command with exit code and PASS/FAIL/SKIP counts; what only the Windows leg
can confirm.
