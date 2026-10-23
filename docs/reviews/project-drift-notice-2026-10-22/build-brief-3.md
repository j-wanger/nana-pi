Feature: FEAT-014 · Create or adopt a project workspace. Lane project-drift-notice, row R-2623 and its test. Class: hook. Builder: pi-worker (small lane). Build session 3: shell-safe roots in the fix command, and R-2623's temp-folder dependence.

Work in the lane worktree on feat/project-drift-notice. Change only `packages/nana-setup/lib/stale-copies.mjs`, `packages/nana-setup/lib/stale-copies-config.mjs`, `packages/nana-setup/tests/project-stale.test.mjs`, R-2623's row in `REQUIREMENTS.md` and the generated docs. Do not edit HANDOFF, the session archive or the known-bug files.

Finding F2 (independent check, NOTE 1, at e1ac980f): a root whose path holds `$` gets the node form, `node "…/nana-setup.mjs" project "<root>"`. Pasted into a POSIX shell, the double quotes still expand `$NAME`. With an unset variable as the last folder name, the command named the parent folder, and `nana-setup project` ran `git init` there and wrote seed files. A backtick inside double quotes starts a command substitution (`sh -c 'echo "a-\`-b"'` is a syntax error), and cmd.exe expands `%NAME%` inside double quotes. The must-meet's R-2623 case (e) already expects the no-path form for a backtick root; build 1 kept the node form there.

Finding F3 (independent check, NOTE 3, and build 2's long-temp run): R-2623's case (g), "adoption block whole", fails when the test's temp folder lies under `/tmp` or `/private/tmp`. The adoption reader always skips `/tmp` unless `NANA_TEST_TEMP_ROOTS` is set, and the case sets only TMPDIR, TMP and TEMP for the hook child. A Linux runner with TMPDIR unset puts every test file's temp folder under `/tmp`.

Precedent:
- packages/nana-setup/lib/stale-copies.mjs — `projectStaleLine`'s `root.includes('"')` check and its no-path fallback.
- packages/nana-setup/lib/stale-copies-config.mjs — the `chosen` provenance lines beside each project-stale constant.
- packages/nana-pack/tests/adoption-reader.test.mjs — line 26: the child environment sets `NANA_TEST_TEMP_ROOTS: ""`.
- packages/nana-pack/tests/adoption-producer.test.mjs — lines 173 to 180: `NANA_TEST_TEMP_ROOTS` set to a named folder for one case.

1. Define one config constant, the characters that send the line to the no-path form: `"`, `$`, the backtick and `%`, with a `chosen` provenance line naming why (POSIX sh expands `$` and the backtick inside double quotes; cmd.exe expands `%`; `"` ends the quote). Read it in `projectStaleLine` in place of the `"` check. Keep `printable(root)`.
2. R-2623's row: "or holds a double quote" becomes "or holds a double quote, dollar sign, backtick or percent sign". Keep its ID, status and evidence.
3. R-2623's test: the backtick case (e) now expects the no-path form. Add a POSIX root holding `$` and one holding `%`, both expecting the no-path form; skip the `$` case on win32 only if the name is illegal there, with one reason line. Keep the title and the `// req:` marker. Keep every other case unchanged.
4. Case (g): give the hook child `NANA_TEST_TEMP_ROOTS` so the adoption reader's temp-root list does not hold the test's base folder, wherever the temp folder lies. Keep its assertion.
5. Try two wrong versions, see each turn R-2623 red, then restore: the `"`-only check; and case (g) without the new variable, run with TMPDIR, TEMP and TMP under `/private/tmp`.
6. Run the file with the default temp folder, then with TMPDIR, TEMP and TMP pointed at a long folder under `/private/tmp` (about 120 extra characters), then at one outside it. Run `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/project-drift-notice-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: a root holding any of the four characters gets the no-path form, R-2623 passes under every temp folder above, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the two wrong versions' results; the three runs' results; each departure from the Precedent files with its reason; each existing case you changed and why; the full suite's summary line; map, tree, readme, trace and seat-check status.
