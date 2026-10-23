Feature: FEAT-014 · Create or adopt a project workspace. Lane project-drift-notice, rows R-2623 to R-2628, plus the seal test. Class: hook. Builder: pi-worker (larger lane). Build session 1 of 1: the shared working-region compare, the project-stale line in the Claude seat's stale-copy producer, and its section in nana-rulings.

Work in the lane worktree on feat/project-drift-notice. The plan of record is `docs/reviews/project-drift-notice-2026-10-22/must-meet.md`: read D1 to D6, the rows, what each test does, the tunables, the known limits and the wrong-code pairs first; then `plan-attack.md` (M1 to M4, S1 to S11, N1 to N12) and `plan-draft.md` (its measurements). Where the draft and the must-meet disagree, the must-meet wins: the Claude seat's line is in the stale-copy producer, not the adoption reader, so the adoption reader does not change (D3). Before editing, run the map impact command on project.mjs, paths.mjs, stale-copies.mjs, bin/stale-copies.mjs and nana-rulings.ts, and work from the blast radius. Follow packages/nana-pack/README.md's module rules. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-setup/lib/project.mjs — checkProject's region row, `WORKING_BEGIN`, `WORKING_END`, `markerLines`, `SHARED_DIR`, `readShared` and its three uses of the shared file name, and `refreshWorkingRegion`'s fatal UTF-8 decode.
- packages/nana-setup/lib/paths.mjs — `pkgRoot` and `repoRoot`, the new home of `SHARED_DIR`.
- packages/nana-setup/bin/stale-copies.mjs — the adoption hook's second producer; it receives `--cwd` and renders the notice shape.
- packages/nana-setup/lib/stale-copies.mjs — `staleNotice` and its `codeSpan`-wrapped node command with a bare fallback.
- packages/nana-setup/lib/stale-copies-config.mjs — `STALE_PREFIX` and `STALE_SECTION` with provenance.
- packages/nana-pack/lib/adoption.mjs — `canonicalCwd`, `repoRootOf`, the dismissal `MARKER` and `printable`.
- packages/nana-pack/lib/display.mjs — `codeSpan`.
- packages/nana-pack/lib/bounded-read.mjs — `readBounded` and `BOUNDED_READ_CAP`.
- packages/nana-pack/extensions/nana-rulings.ts — session_start in a try, the section at before_agent_start, `STALE_SECTION` beside `RULINGS_SECTION`.
- packages/nana-pack/bin/worker-config.mjs — `REVIEWER_CHILD_ENV.NANA_ROLE`.
- packages/nana-setup/tests/stale-copies.test.mjs — one file driving both seats, the seal-test form, and the unset-section check.
- packages/nana-pack/tests/adoption-reader.test.mjs — temp HOME, the `repo()` fixture, and the env keys it removes.
- packages/nana-setup/tests/project-working-region.test.mjs — region fixtures and CRLF variants.
- packages/nana-setup/tests/stale-copies-slow.test.mjs — a `--require` preload through NODE_OPTIONS.
- packages/nana-pack/tests/agent-dir-config.test.mjs — createRequire plus syncBuiltinESMExports.
- packages/nana-knowledge/tests/hook.test.mjs — `delete process.env.NANA_ROLE` at the top.
- packages/nana-setup/tests/hooks-closed-output.test.mjs — `CASE_LIMIT_MS` with provenance.

1. New `packages/nana-setup/lib/working-region.mjs` holding the moved markers, `WORKING_FILE`, `markerLines`, `readSharedWorking()` and `regionVerdict` (D1); project.mjs imports them back and re-exports the markers and `SHARED_DIR`; `SHARED_DIR` moves to paths.mjs. R-989's tests must stay green unchanged.
2. `projectStaleLine` in `packages/nana-setup/lib/stale-copies.mjs` and the new names in its config (D2), never throwing.
3. `packages/nana-setup/bin/stale-copies.mjs` reads `--cwd` and writes the line before its install-record gate (D3). `nana-rulings.ts` computes and sets the section in its own try (D4).
4. Tests in `packages/nana-setup/tests/project-stale.test.mjs` with the must-meet's exact titles and `// req:` markers, every case "What each test does" lists, and the env handling it names. Rows R-2623 to R-2628 in FEAT-014 (R-2623 to R-2627 in SUB-016, R-2628 in SUB-021) with the must-meet's texts, `implemented` with evidence. The docs and headers the must-meet lists.
5. Run the new test file, stale-copies, adoption-reader, project-working-region, project, hook-deadlines, hooks-closed-output and the rulings tests, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your last commit. Run the new test file once more with TMPDIR, TEMP and TMP pointed at a long folder outside the worktree (about 120 extra characters). Try these wrong versions, see each go red, then restore: pairs 2, 7, 11, 13, 14 and 15 of the must-meet's list.

Seat check: `node docs/reviews/project-drift-notice-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- A Claude Code and a pi session in a project whose working section differs see one project-stale line naming the fix; matching, unrefreshable, worktree, nana-pi and dismissed roots and launcher children see none; the adoption block is unchanged.
- R-989's checks stay green with the moved compare.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 14 lines after the VERDICT line): the commit shas; the check results; the long-temp-folder result; each departure from the Precedent files with its reason; each existing test you edited and why; the wrong versions tried and their results; the full suite's summary line; map, readme, trace and seat-check status.
