# win-hook-variant-loop — build brief 2

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/win-hook-variant-loop`, on top of the current tip (the seat committed its pairs record after build 1). Rules: the builder preamble, but single test files only, never the full suite (other builders share this machine). No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits.

## Why
The independent check on build 1 (32cdb9ee) HOLDS with no MUST, but three of its findings make doctor's new advice wrong for the user it serves, and one makes the README untrue:
- F3: the knowledge row's advice says to run `<…/nana-knowledge.ts>` without the `hook` argument. An entry edited to that path alone is not read as the hook; install then adds a working entry and the edited one stays, running the CLI with no subcommand.
- F2 (inferred, not run on Windows): on Windows the advice prints the entry's first argument with the checkout's backslashes (`C:\…\nana-pi/packages/…`). Pasted into settings.json as printed, `\U` or `\n` breaks the JSON or changes the path.
- F4: the new README limit line says doctor names "each one" it leaves, but the plan's known limits say an entry whose path ends in a backslash, or that runs through `node.exe`, is never named and reads ✓.
- F1: `hookSettingsRows` has no try/catch, so a settings file nested about 2,000 levels deep crashes win32 doctor before any row; main prints the rows.

## Do, nothing else
1. F3: every advice line that names a script to run gives the exact command install itself writes for that hook, the knowledge hook's `hook` argument included. Derive it from the same source install uses, never a second hand-written string.
2. F2: lead the advice with the safe route ("remove that entry by hand, then run install"), and print any path inside it with forward slashes, so a pasted path cannot break the JSON. Do not print a JSON fragment with backslash paths.
3. F4: make the README limit line true: name the two exceptions (a path ending in a backslash, an entry run through `node.exe`), in the README's existing style.
4. F1: wrap the new merge simulation in try/catch; on any error keep main's row and detail for that hook. No throw reaches doctor.
5. Tests: extend R-2410's check so it requires the knowledge advice to carry the `hook` argument and no backslash in printed paths under forced win32 (row text unchanged unless it no longer matches; EARS, one "shall"). Add a case to R-2412's check (the shape guard) for a settings file nested 3,000 levels deep that still prints every row. Each new assertion must fail on build 1's code (show it, temp copy).
6. Run alone: `npm test -- packages/nana-setup/tests/win32-hook-repair.test.mjs`, then `hook-health`-related and doctor test files the brief named for build 1; `node scripts/requirements-trace.mjs`, `npm run -s map`, `npm run -s map:check`, `npm run -s readme:check`.
7. Commit with explicit paths.

**Report** (6 lines or fewer, VERDICT first): commit; each command's result; the red-on-build-1 results.
