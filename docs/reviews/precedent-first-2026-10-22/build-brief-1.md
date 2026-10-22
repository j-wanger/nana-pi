Feature: FEAT-006 · Launch builders with execution limits. Lane precedent-first, rows R-2578, R-2579, R-2580 and R-2581, plus the seal test. Class: ordinary. Builder: pi-worker (larger lane). Build session 1 of 2: the brief reader, the HEAD check, the known-bug attachment and pi-worker's use of them.

Work in the lane worktree on feat/precedent-first. The plan of record is `docs/reviews/precedent-first-2026-10-22/must-meet.md`: read the owner's ruling, D1 to D5, the rows, what each test does, the tunables and the known limits first; then `plan-attack.md` (M1, M2, S3, S4, S6, N1, N3, N4) and `plan-draft.md` (the code paths it checked). Follow packages/nana-pack/README.md's module rules.

Precedent:
- packages/nana-pack/bin/pi-worker.mjs — brief validation (:93-100), `laneFailure` (:59-64), the launch notice (:124), prompt assembly (:125-131), the `git()` helper (:56-58).
- packages/nana-pack/lib/handoff-asks.mjs — the fence-aware section and list-entry scan to share (D2).
- scripts/deliverables.mjs — `trackedAtHead` to move (:59-62) and the "is not tracked at HEAD" wording (:181).
- scripts/requirements-tree.mjs — the `ls-tree -z` call and its named failure (:585-598).
- scripts/known-bugs.mjs — the two constants to move and its pack-config import (:12-20).
- packages/nana-pack/lib/json-text.mjs — the BOM strip (:23).
- packages/nana-pack/tests/worker-lane.test.mjs — the prompt-copying stub, the spawn marker, the lock path.

1. Move the scan out of `handoff-asks.mjs` into one shared lib module and import it back there, with no behaviour change (D2). Move `trackedAtHead` into the new `packages/nana-pack/lib/brief-precedent.mjs` and import it back into `scripts/deliverables.mjs` (D1). Move `KNOWN_BUGS_DIR` and `UNPLACED_FILE` into a pack config module; `scripts/known-bugs.mjs` imports and re-exports both (D5).
2. `brief-precedent.mjs` (pure; tracked paths injected): read the Precedent section and the first Feature line (D2, D3), and judge entries (D3, D4). `packages/nana-pack/lib/brief-config.mjs`: the tunables the must-meet lists, each with its provenance.
3. `packages/nana-pack/bin/pi-worker.mjs`, lane mode, right after brief validation: read the brief, refuse through `laneFailure` (R-2578, R-2579), list the entries' paths at the worktree's HEAD as D4 says, attach the known-bug file as the third appended prompt (R-2581), and print the launch line before pi starts (D5).
4. Update the fixture briefs the must-meet lists (worker-lane, win32-launch with `- seed`, watchdog-exit). Tests with the must-meet's exact titles and `// req:` markers for R-2578 to R-2581 and the seal test, with every case "What each test does" lists. Add R-2578 to R-2585 to FEAT-006 (R-2584 to FEAT-014, shared into FEAT-006 through Also applies) with the must-meet's texts: session 1's four `implemented` with evidence, the other four `planned`.
5. Run the changed test files (worker-lane, win32-launch, watchdog-exit, frontier and product-report for the moved scan, the deliverables and known-bugs tests), `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your last commit. Try these wrong versions, see each go red, then restore: a header-only check; the check after the lock; `existsSync` instead of HEAD; stop at the first bad entry; no `--literal-pathspecs`; no trailing-punctuation strip; the section ending at the first non-bullet line; the index instead of HEAD; a fallback to `unplaced.md`; a listing failure that passes.

Seat check: `node docs/reviews/precedent-first-2026-10-22/seat-titles.mjs 1` must print `0 missing`.

Done:
- pi-worker refuses a brief with no usable Precedent section or an entry not tracked at HEAD, before the lock and before pi; an honest brief launches with the launch line; the feature's known-bug file follows the brief.
- The moved helpers leave their old importers' tests green.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 12 lines after the VERDICT line): the commit shas; the check results; each departure from the Precedent files with its reason; the wrong versions tried; the full suite's summary line; map, readme, trace and seat-check status.
