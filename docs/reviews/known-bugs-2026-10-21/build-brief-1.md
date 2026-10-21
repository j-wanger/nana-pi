Feature: FEAT-002 · Resume decisions and next actions. Lane known-bugs, rows R-2504 to R-2510. Class: ordinary. Builder: pi-worker (larger lane). Build session 1 of 1: the known-bug check, its tests and the shared text.

Work in ~/nana-pi-wt/known-bugs on feat/known-bugs. The plan of record is `docs/reviews/known-bugs-2026-10-21/must-meet.md`: read its seat decisions, rows, what each test does, the shared text and the known limits first. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. No push.

The seat already moved HANDOFF's 891 known-bug lines into `docs/known-bugs/` in the plan commit (`move.mjs`; `conserve.mjs` proves none is lost). HANDOFF now ends with a `## Known bugs` pointer section. Do not touch either.

1. `scripts/known-bugs.mjs`, a new module with the six-tag header. Export `KNOWN_BUGS_DIR = "docs/known-bugs"` and `UNPLACED_FILE = "unplaced.md"` with their provenance comments from the must-meet, and a pure check, for example `checkKnownBugs({ root })`, that returns name findings (R-2506) and size lines (R-2507). Read the ledger with `parseLedger` from `scripts/requirements-tree.mjs`; a feature is live when its status is `active` or starts with `frozen`. Count bytes with `Buffer.byteLength` and lines the way `packages/nana-pack/bin/nana-frontier.mjs` counts them; import `READ_WINDOW_BYTES` and `READ_WINDOW_LINES` from `packages/nana-pack/lib/frontier-config.mjs`. A `--root <dir>` CLI prints one line per finding and a summary line, and exits 1 on a name finding, 0 otherwise (size lines never fail). Name the script, its flag and what it does in the root README, where the other repo scripts are listed (the readme check fails a script no README names).

2. Tests, each with the must-meet's exact title and its `// req:` marker directly above the check call:
   - R-2504 in `packages/nana-pack/tests/frontier.test.mjs`.
   - R-2505 to R-2508 in a new `packages/nana-pack/tests/known-bugs.test.mjs` (six-tag header), with every case and control the must-meet lists; build R-2506's temp ledgers with the real status forms.
   - R-2509 in `packages/nana-pack/tests/templates-render.test.mjs`, plus the seal test `seal: the known-bugs folder is docs/known-bugs` (req R-2509) that pins `KNOWN_BUGS_DIR`.
   - R-2510 in `packages/nana-pack/tests/worker-lane.test.mjs` with the existing `preambleOnce` helper.
   Every other assertion imports the names, never the literals.

3. The shared text, as the must-meet's "The shared text (R-2509)" gives it: the Review bar and the Land checklist in `templates/_shared/working-under-nana-pi.md`, and the same two edits byte for byte in AGENTS.md's copy inside the marker region (R-859 checks the copy). Keep the Plans bullet's "residual". Write `docs/known-bugs/<feature>.md` in backticks and the unplaced file without backticks, so R-598's path checker reads no missing path. Then the builder preamble's line 7. Run `packages/nana-pack/tests/skill-claims.test.mjs` and `templates-render.test.mjs` to confirm R-598 holds.

4. Rows: add R-2504 to R-2510 to FEAT-002 in REQUIREMENTS.md with the must-meet's texts, status `implemented` and their evidence once each test passes.

5. Run the four test files, `node docs/reviews/known-bugs-2026-10-21/conserve.mjs`, `node scripts/known-bugs.mjs --root .`, `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your commit. For each row, try the cheap wrong versions the must-meet and the attack name (a checker that never reports a size; a character count instead of bytes; an exact-name check that accepts `FEAT-001.MD`; a Review bar that says "HANDOFF's carried residuals"), see the check go red, and restore. Commit with explicit paths.

Seat check: `node docs/reviews/known-bugs-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- R-2504 to R-2510 are implemented with passing checks; the shared text, AGENTS.md's copy and the preamble say what the must-meet says; skill-claims and templates-render pass.
- conserve, the known-bug check, map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; the check results; the known-bug check's summary line on the repo; the wrong versions tried; the full suite's summary line with its check count; map, readme, trace and seat-check status.
