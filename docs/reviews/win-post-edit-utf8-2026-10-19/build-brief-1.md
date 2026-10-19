# Build brief: win-post-edit-utf8

Feature: FEAT-030 · Get trustworthy feedback after edits. Class: install, hook or gate (pi extension). Threat model: honest variation in host encodings, Python versions and the owner's Python and locale variables is in scope; deliberate forgery is out (see the must-meet). Work in the lane worktree on `feat/win-post-edit-utf8`, based on main after post-edit-win-pin lands. Follow `packages/nana-pack/prompts/builder-preamble.md`. Run single test files only; the seat runs the locked full suite. Never edit HANDOFF.md or docs/sessions/. Committed text names no machine path and no owner; say "the owner".

## Change
1. REQUIREMENTS.md: append R-1740 to R-1743 to the end of the FEAT-030 table as `planned`, word for word from the must-meet. Leave R-1744 to R-1749 unused. Then the tests, then the code.
2. New `packages/nana-pack/tests/post-edit-utf8.test.mjs` with the six-tag header:
   - Drive the real registered handler under a temp HOME with user-scope config, as `post-edit-hardening.test.mjs` does.
   - Find Python as `python3`, then `python`: it exits 0, prints sys.executable, and is 3.7 or later; use that path, quoted, in the check command. With none, R-1740 and R-1741 FAIL naming the commands tried.
   - Checker scripts are ASCII with `\u` escapes, call `sys.stdout.reconfigure(errors="backslashreplace")`, print `ï — λ` and exit 1. The R-1741 parent runs the direct script through `subprocess.run([sys.executable, …], capture_output=True, text=True)` and prints `child said: ` plus its stdout.
   - Set `LC_ALL=en_US.ISO8859-1` and remove PYTHONUTF8 and PYTHONIOENCODING; restore all three in `finally`.
   - Control: run the direct script with raw-byte stdout. When the bytes contain the UTF-8 bytes of `ï — λ` (contain, not equal: Windows ends lines with CRLF), print SKIP for R-1740 and R-1741 naming why.
   - R-1740 is one `check` that is true only when both runs show `ï — λ`: PYTHONUTF8 and PYTHONIOENCODING unset, then both empty. Its detail names the failing case.
   - R-1742 sets all five variables to non-empty values; R-1743 removes PYTHONIOENCODING, LANG, LC_ALL and LC_CTYPE. Each uses a node checker that writes its process.env as JSON to a temp file. Restore every variable in `finally`.
   - Put each `// req:` line directly above a one-line `check("title", …` with the must-meet's titles. Await every fire under a named watchdog with `chosen` provenance.
3. `packages/nana-pack/extensions/nana-post-edit.ts`:
   - Build every check's env as `{ ...process.env }`. Add PYTHONUTF8=1 when `process.env.PYTHONUTF8` is unset or empty; read it from `process.env`, not the copy (case-insensitive on Windows). Add NANA_PI_FILE on win32 as today. Every platform.
   - Name the variable and value once, beside MAX_OUTPUT, with contract provenance (R-1740, R-1741; PEP 540). Touch nothing else in the run path. Add pi's PYTHONUTF8 to the header's @inputs.
4. `packages/nana-pack/README.md`:
   - In the "post-edit failures are appended" bullet, add two or three sentences: the switch, the owner's PYTHONUTF8 and PYTHONIOENCODING precedence, pass-through of LANG and LC_*, and the Windows trade.
   - On the Dependencies line, say the post-edit UTF-8 test FAILs, naming `python3` and `python`, when neither is Python 3.7 or later.
5. Run `npm run req:tree` and `npm run map`. If the R-291 leaf-total literal still exists in `packages/nana-pack/tests/requirements-tree.test.mjs`, set it (value and title) to the total `node scripts/requirements-trace.mjs` prints.

## Wrong code to try (each must turn a test red on macOS)
- No change: R-1740 and R-1741.
- The switch on win32 only: R-1740 and R-1741.
- The switch added only when `=== undefined`: R-1740 (empty case).
- PYTHONIOENCODING=utf-8 in place of the switch: R-1741 and R-1743.
- The switch always overriding the owner's PYTHONUTF8: R-1742.
- PYTHONIOENCODING=utf-8 beside the switch, only when unset: R-1743.
- LC_ALL=en_US.UTF-8 or LANG=C.UTF-8, only when unset: R-1743.
- Dropping NANA_PI_FILE turns existing hardening path checks red on Windows only; list it for the seat's CI run.

## Done
- R-1740 to R-1743 are `implemented`.
- Alone, these pass: post-edit-utf8 (4 PASS on macOS), post-edit-hardening, post-edit-status, post-edit-file-queue, display-surfaces and requirements-tree, with the base's counts unchanged.
- The trace exits 0 with `ears: 0`. `npm run map:check` and `npm run readme:check` are green.

## Report (at most 10 lines)
Commit SHA · rows flipped · each test file with PASS/FAIL/SKIP counts · trace total and the R-291 value, or "literal gone" · map:check and readme:check exit codes · each wrong-code mutant and the test it turned red · any mutant that stayed green · the Python version and path the test found · any existing test edited · anything not done.