# Build brief: knowledge-sources-unparseable

Feature: FEAT-003 · Index and connect existing knowledge sources
Class: install, hook or gate (hook). Threat model: honest editor and platform variation is in scope; forgery is out.
Builder: a Claude Sonnet subagent. This is a simple lane: about 40 lines in three modules, and a prototype passed.
Worktree ~/nana-pi-wt/knowledge-sources-unparseable on feat/knowledge-sources-unparseable, based on current main. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md or docs/sessions/.
Run single test files only. Never run the full suite: other lanes hold the machine's suite lock.

## Change
1. REQUIREMENTS.md: insert R-2370 to R-2376 (text in must-meet.md) into the FEAT-003 table right after R-1915, as untested. Flip each row to implemented when its test passes.
2. packages/nana-knowledge/tests/sources-file.test.mjs (new, six-tag header).
   - Use tmp-dir.mjs, a temp HOME/USERPROFILE and one NANA_KNOWLEDGE_HOME per case. Run the CLI through process.execPath with a 10 s timeout, as unreadable-root.test.mjs does.
   - Build any JSON that holds a real path with JSON.stringify. Spell F1's path with doubled backslashes in the JS source: `\x` before a non-hex character is a JS syntax error.
   - Import FORWARD_SLASH_ADVICE and MANUAL_JSON_ADVICE from ../../nana-pack/lib/json-text.mjs by name. Never import the lane's formatter for expected text.
   - Read markers from stdout, and assert that each expected line appears exactly once.
   - TRACE RULE: each `// req: R-nnn` marker sits on the line directly above `check("R-nnn: …", …`, with the title's opening quote on the same line as `check(`. Never split them; a split broke CI once.
   - Write all seven checks first, and see the six red-today checks fail before any change to lib/ or bin/.
3. lib/sources.ts: read bytes and decode them with parseJsonBytes. ENOENT seeds as today.
   - Any other read error returns problem { kind: "unreadable" }. A parse error returns { kind: "unparseable", ...jsonParseFailure(err) }.
   - Export one formatter for the marker text (exact strings in must-meet.md). Make the marker words named constants with a provenance comment. Never print err.message.
4. lib/build.ts: with a problem, skip the --rebuild delete and send every existing row through the preserved branch. Add the problem to BuildStats.
5. bin/nana-knowledge.ts: build prints `  <paths.sources>  <marker>` on stdout before the MISSING lines. status calls loadSources and prints `sources <file>  <marker>`. Both exit 0.
6. README.md:
   - In the sources.json section, cover the mark and UTF-16 reading and the keep-rows UNPARSEABLE/UNREADABLE behaviour, including on --rebuild.
   - In the Dependencies paragraph, name json-text.mjs as the second sibling file.
   - No machine paths and no owner name in new text.
7. Update the module headers (@inputs, @outputs and @errors of all three files). Then run `npm run req:tree` and `npm run map`.

## Run (single files)
- node packages/nana-knowledge/tests/sources-file.test.mjs
- The same for the discovery, incremental-build, unreadable-root, hook, extension and render .test.mjs files
- node packages/nana-setup/tests/project.test.mjs (its refresh reads the build's totals line)
- npm run map:check; npm run readme:check; node scripts/requirements-trace.mjs

## Wrong code to try (each must turn the named check red; revert after)
- W1: strip only a leading U+FEFF, with no UTF-16 decoding. Expect R-2370 red.
- W2: keep rows when roots.length === 0. Expect R-2376 red.
- W3: keep the --rebuild delete when there is a problem. Expect R-2374 red.
- W4: print err.message in place of the place. Expect R-2372 red.
- W5: always use FORWARD_SLASH_ADVICE. Expect R-2372 red on F2 and F3.
- W6: guard only parse errors, so a read error returns no roots as today. Expect R-2375 red.
- W7: leave status on loadRoots(). Expect R-2373 red.
- W8: treat ENOENT as unreadable. Expect the discovery.test.mjs seed checks red.
- W9: print the marker on stderr. Expect R-2372 red.
- W10: treat a zero-byte file as missing and re-seed it. Expect R-2371 red on F4.
- W11: drop the place when the repair is manual. Expect R-2372 red on F2.
- No pi launch is involved; never spell one in any committed .mjs.

## Done
- All seven checks PASS, and the six red-today checks were seen red first.
- The listed regressions are green, and map:check, readme:check and the trace check are green.
- Rows R-2370 to R-2376 are implemented with test evidence.
- W1 to W11 were each seen red.

## Report (10 lines or fewer)
verdict · commit · each row PASS and seen red first · regressions run · W1-W11 red/green · map/readme/trace · files touched · anything left unpinned

## Seat amendments (re-check on main 9552afb1)

- Cut the worktree from main 9552afb1. No lane that landed since the plan changed the knowledge package or the pack's JSON text helper. Every file, function and behaviour this brief names still holds, and the seat saw the red-today breakage again on 9552afb1.
- Builder: ignore the "Claude Sonnet subagent" line, which dates from power mode. This is a larger lane, so the seat launches the roster's larger builder with `pi-worker --lane-size larger`. If the roster changes before launch, use whatever it prints then.
- In REQUIREMENTS.md, put the seven rows directly under R-1915 and above R-208. On this main those rows are lines 254 and 255. knowledge-index-recover inserts below R-208 and shared-memory-index-cap below R-872. Keeping to your own spot lets the hunks merge separately.
- In sources.ts, import parseJsonBytes, jsonParseFailure, FORWARD_SLASH_ADVICE and MANUAL_JSON_ADVICE by name from `../../nana-pack/lib/json-text.mjs`. Do not edit json-text.mjs, and do not copy its byte-order-mark or line-and-column logic. It has one owner, and gate-stop-names-config reads it too.
- Do not build the marker with configFailureDetail: its prefix names the pack's own config file. Choose the advice from the `repair` field that jsonParseFailure returns.
- In the new test, put `import { tmpDir } from "./tmp-dir.mjs";` on its own line, exactly as written. Never call mkdtempSync. R-917's source check in the pack's test-runner test fails the suite on either mistake, and a landed lane hit this today.
- Add `node packages/nana-pack/tests/test-runner.test.mjs` to the single-file runs. It runs R-917's source check over every test file, including the new one.
- Keep the build.ts change small and in place. Add one condition to the `--rebuild` delete and one to the keep-rows branch, and do not re-indent buildLocked. knowledge-index-recover lands after this lane and will wrap that body.
- In cmdStatus, change only the loadRoots call and the `sources` line. Leave the openDb lines as they are; knowledge-index-recover edits them.
- This lane lands before knowledge-index-recover. After any merge of main, run `npm run req:tree` and `npm run map` again instead of resolving those two files by hand.
- Run the wrong-code tries W1 to W11 in a temp clone of the lane branch under the temp folder, with a temp home, not in the worktree.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane knowledge-sources-unparseable --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
