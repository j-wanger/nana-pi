Feature: FEAT-034 · Define reproducible comparisons. Lane bench-study-scratch. Class: ordinary. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/bench-study-scratch. The spec is `docs/reviews/bench-study-scratch-2026-10-24/must-meet.md`; read it whole, including the seat decisions and the wrong versions. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder. Test code and REQUIREMENTS.md only: `apps/bench/run.mjs`, `apps/bench/lib/` and every product path stay unchanged.

Precedent:
- apps/bench/test/orchestration-paths.test.mjs — `freshStudyDir` and section 11, the case to change; section 10 for a relative `fixture.dir`.
- apps/bench/test/catch-ledger.test.mjs — lines 298-300, keeping a test's study work out of a shipped study.
- apps/bench/test/tmp-dir.mjs — the bench's own test temp helper.
- apps/bench/run.mjs — `executeRun`, `evidenceDir` and `rec.evidence`, unchanged.
- apps/bench/lib/profiles.mjs — the sidecar path resolution, unchanged.

The task:
1. Add rows R-2770, R-2771 and R-2772 under FEAT-034 in REQUIREMENTS.md, worded as in the must-meet, status `implemented` once their tests pass, each with its test as Evidence; regenerate `docs/requirements-tree.md` (`npm run req:tree`).
2. In section 11, run `executeRun` with `studyDir` set to a new empty scratch study folder from `freshStudyDir` (its own name), and pass `study` with `fixture.dir` and `sidecarExtension` made absolute against the shipped study folder. Point the R-533 workspace-diff read at the scratch folder. Remove the trailing `fs.rm` of the shipped study's `raw/code-bugfix`.
3. Before the case, seed one stand-in evidence file in the scratch folder under `raw/code-bugfix/<another profile>/rep0/`; after it, R-2771 checks the file is byte for byte the same.
4. R-2770 checks that the run's evidence files exist on disk under the scratch folder.
5. R-2772: take a recursive listing of every folder under `apps/bench/studies/` (paths, sizes, modification times, folders included) before the file's first case and compare it after the last case.
6. Keep every existing check in the file passing with its title unchanged.

Try the must-meet's three wrong versions by hand, see each turn its named check red, restore, and say so in your report; do not commit them.

Checks before your one commit: `node apps/bench/test/orchestration-paths.test.mjs` alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/bench-study-scratch-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the three rows and their tests exist and pass, section 11 never writes into or removes anything under a shipped study, every existing check still passes, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the three rows; the hand checks of the wrong versions; the full suite's summary line; map, readme, trace, tree and seat-check status.
