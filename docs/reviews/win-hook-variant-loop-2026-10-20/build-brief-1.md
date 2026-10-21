# win-hook-variant-loop — build brief 1

Feature: FEAT-015 · Diagnose the active environment. Class: install, hook or gate.
Work in ~/nana-pi-wt/win-hook-variant-loop on feat/win-hook-variant-loop, branched from current main. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md or docs/sessions/.
Rows: R-2410 to R-2412, from block R-2410 to R-2419. Read must-meet.md first. It holds the row texts, check titles, fixtures and design steps 1 to 4.
Run single test files only, never the full suite. Other lanes hold the machine's suite lock, and the seat runs the locked suite. This overrides the preamble's full-suite line.
Trace scanner: put each `// req:` marker on the line directly above a `check("title", …` call. Keep the title's opening quote on the same line as `check(`. A split marker broke CI in slate 22.

## Change
1. REQUIREMENTS.md: add R-2410 to R-2412 with status untested. Put them in FEAT-015's table directly after R-1055, not at the table end, because two in-flight lanes append there. Run `npm run req:tree`.
2. Tests first. Add the three checks to packages/nana-setup/tests/win32-hook-repair.test.mjs after the F4 check. Reuse its helpers: run, seed, freshHome, posixWanted, winWanted, carriedSession, carriedVerifier, carriedKnowledge and f4Home.
   - Build each fixture entry from a POSIX desiredHooks entry, changing only command or args. Nana's status message and timeout 5 must stay.
   - Quote paths with double quotes or leave them unquoted, and use forward slashes only. Unquoted backslashes are escapes on the Windows leg.
   - Find a row's line with a regex on `[✓✗] settings <label>\s`.
   - Update the SUMMARY total and the header's check count.
   - Run the file before any code change. R-2410 must fail, and R-2411 and R-2412 must pass, because they are guards.
3. Code: change packages/nana-setup/lib/hook-health.mjs only, in the win32 branch, per must-meet design steps 1 to 4.
   - Import validateShape, mergeRepoHooks and mergeHooks from ./settings.mjs.
   - Do not change settings.mjs, doctor.mjs or bin/nana-setup.mjs. Never change the caller's settings object.
   - Keep today's detail text and append to it.
   - Update the module header's @outputs. Keep @purpose to one sentence.
4. packages/nana-setup/README.md:
   - Add one Known limits bullet directly after the withPiStub bullet, because win-pi-launch-orphan appends at the end of that list. Say that on Windows install leaves such entries as written, and that doctor's ✗ line names each one with its fix by hand.
   - Extend the tests-table line for win32-hook-repair.
   - Leave lines 46 to 53 and the doctor paragraphs near line 270 alone, because other lanes edit them.
5. Flip the three rows to implemented with evidence. Run `npm run map`, then commit the map and the tree.

## Wrong code to try (restore each one; it must turn the named check red)
- Keep today's detail with nothing named: R-2410.
- Name the dead path but not this checkout's script: R-2410.
- Name every dead target without running the merge on a copy: R-2411.
- Append the hand repair to every unhealthy row: R-2411.
- Drop the validateShape guard: R-2412 (doctor throws a TypeError).
- Windows-only pair, for the seat on CI: drop today's detail text. That turns doctor-detail's R-393 check red on the Windows leg.
- Seat hazard: apps/desk/test/knowledge-home-isolation.test.mjs scans docs/reviews/**/*.mjs for the literal text spawn("pi". A seat wrong-code table must not spell a pi launch that way.

## Done
- win32-hook-repair is green, and R-2410 was seen red first. Each wrong code turns its named check red.
- These single files are green: win32-hook-repair, settings-merge, win32-degrade, doctor-detail, doctor-fix-line, stale-copies and install.
- These pass: `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check` and `node scripts/requirements-trace.mjs`.
- No change to settings.mjs, no POSIX output change and no inline tunable.

## Report (at most 10 lines)
Tip sha · files · each check, with red before yes or no · wrong-code results, one line each · single-file pass and fail counts · map, readme, tree and trace results · open items.

## Seat amendments (re-check on main 9552afb1)

- Branch from main 9552afb1. hook-health.mjs, settings.mjs, win32-hook-repair.test.mjs and settings-merge.test.mjs did not change after planning, so the design and the fixtures still apply as written.
- README: the lanes that edited lines 46 to 53 and the doctor paragraphs have landed. Still leave the "What it installs" table alone, because the slate's verifier lane and Claude-folder lane edit nearby text. That table is about lines 37 to 62, with the hooks row at line 50 and the verifier-pipe guard at line 65. Also leave the doctor paragraphs at lines 267 to 273 alone.
- README: the withPiStub bullet is now at line 280. Put the new Known limits bullet directly after it. Do not append at the end of Known limits.
- README: the tests-table line for win32-hook-repair is now at line 491. Extend that line only, and leave the Tests paragraph above it alone, because the Claude-folder lane edits that paragraph.
- REQUIREMENTS.md: R-1055 is now at line 1257. Insert R-2410 to R-2412 directly after it, as the brief says. Three slate lanes may append to the end of FEAT-015's table.
- Test file header: it says "eight repair checks", but the file already has eleven. After your three checks, write fourteen in the header and use 14 in the SUMMARY line.
- Doctor also prints a "✓ settings lock" row, which matches a bare `settings ` pattern. For R-2412, assert ✗ on each of the six winWanted labels with `[✓✗] settings <label>\s` (use regexEscape). Do not count lines that match `settings `.
- Single quotes are fine where must-meet names them: the carried POSIX entries and the R-2411 look-alike `node '/Users/other/custom/nana-objective.mjs'`. The brief's double-quote or unquoted rule covers only the new variant entries. Every path stays forward-slash.
- Do not add a `.claude` literal or a hooks-folder rule of your own in hook-health.mjs. Decide which entries install leaves only by running install's own merge on a copy: validateShape, then mergeRepoHooks, then mergeHooks. Where a hooks folder is needed, read `layout.hooksDir`. The slate's Claude-folder lane owns where that folder is.
- Land order: this lane can land any time. If the Claude-folder lane lands first, merge main and rerun win32-hook-repair and settings-merge before the final review.
- Merge main before the final review, then regenerate the code map and the requirements tree. The other slate lanes share only REQUIREMENTS.md, the README, the map and the tree with this lane.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane win-hook-variant-loop --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
