Feature: FEAT-014 · Create or adopt a project workspace. Lane project-drift-notice, row R-2624's test only. Class: hook. Builder: pi-worker (small lane). Build session 2: the invalid UTF-8 case in R-2624's check.

Work in the lane worktree on feat/project-drift-notice. Change only `packages/nana-setup/tests/project-stale.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows or any code under `lib/`, `bin/` or `extensions/`.

Finding F1 (the seat's pairs at e1ac980f, `seat-mutate-output-e1ac980f.txt`): pair p8, which decodes AGENTS.md with `fatal: false`, survives. R-2624's "invalid UTF-8" case writes the byte 0x96 before the whole drifted file. The bad byte then sits on the begin marker's line, so with a loose decode that line reads U+FFFD plus the marker, no begin marker is found, and the region reads as malformed. The case gives no line whether or not decoding is fatal. A seat whose editor saved AGENTS.md as Windows-1252 with a dash inside the working section would then get a wrong stale line, because `nana-setup project` refuses that file.

Precedent:
- packages/nana-setup/tests/project-stale.test.mjs — the `r2624-cp1252` case and `negativeControl`, which the fix keeps.
- packages/nana-setup/tests/project-working-region.test.mjs — its region fixtures, for building a file whose markers stay intact around an edited inside.

1. Move the invalid byte inside the working region, after the begin marker's line and before the end marker's line, so the markers still parse and only the strict decode keeps the line away. Keep the case's name, the `negativeControl` call and its positive step.
2. Keep R-2624's title, its `// req:` marker and every other case and assertion unchanged.
3. Try the wrong version: change `fatal: true` to `fatal: false` in `projectStaleLine`'s decoder in `packages/nana-setup/lib/stale-copies.mjs`. Run the file and see R-2624 go red, then restore the code.
4. Run the file, then once more with TMPDIR, TEMP and TMP pointed at a long folder outside the worktree (about 120 extra characters). Run `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/project-drift-notice-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: a loose decode turns R-2624 red, the file ends 0 on macOS with the strict decode, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the wrong version's result; the two runs' results; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
