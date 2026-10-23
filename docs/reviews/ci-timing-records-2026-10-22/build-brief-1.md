Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane ci-timing-records, rows R-2631 to R-2635, R-2637 and R-2638, plus the seal test. Class: ordinary. Builder: pi-worker (larger lane). Build session 1 of 1: each CI suite leg keeps the runner's record as an artifact, and a seat-run reader prints each leg's totals and slowest files.

Work in the lane worktree on feat/ci-timing-records. The plan of record is `docs/reviews/ci-timing-records-2026-10-22/must-meet.md`: read D1 to D8, the rows, what each test does, the tunables, the known limits and the wrong-code pairs first; then `plan-attack.md` (M 4, S 12, N 12) and `plan-draft.md` (its measurements). Where the draft and the must-meet disagree, the must-meet wins: no runtime-map comparison (D6), and the reader is a person (D7). land-reads-ci has landed: import its `githubRepoOf` from `packages/nana-pack/lib/land-ci.mjs` and its gh runner factory `ghDefault` from `packages/nana-pack/bin/nana-land.mjs`; do not copy them. Before editing, run `npm run map:impact -- <file>` on scripts/test-locked.mjs, packages/nana-pack/lib/suite-records.mjs and .github/workflows/ci.yml's readers, and work from the blast radius. Follow the root README's module rules. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- scripts/test.mjs — the record knob write (R-2546); CI only sets `NANA_SUITE_RECORD_FILE`. SKIP entries carry 0 seconds; a self-test mismatch is an unnamed failure with no FAIL count.
- scripts/test-locked.mjs — `readRunRecord`; MOVE it into suite-records.mjs and import it back with its three messages unchanged (R-2553).
- packages/nana-pack/lib/suite-records.mjs — `defaultGit`, `gitText`, `numberText`, `finalFiles` (export it), the PASS and FAIL counts in `suiteRecordLines` (extract one `recordCounts(record)` both call), and the slower list's text form.
- packages/nana-pack/lib/suite-records-config.mjs — the home for the new names with provenance; it keeps importing only land-config.mjs (R-2553's fixture copies five config files).
- packages/nana-pack/lib/land-ci.mjs — land-reads-ci's `GITHUB_REMOTE`, `githubRepoOf` and its runs handling; the gh call form `gh api --hostname github.com repos/<owner>/<repo>/…` (GH_HOST overrides placeholders, measured).
- packages/nana-pack/bin/nana-land.mjs — land-reads-ci's exported gh runner factory with its time limit and output bound; imported, not copied.
- packages/nana-pack/lib/release-status.mjs — a read-only reader with an injected runner, where each missing input becomes a line, never a throw.
- scripts/requirements-moved.mjs — the seat-run script shape: `main(argv, git)` and the direct-invocation guard.
- .github/workflows/ci.yml — the suite job's env with a chosen comment above each key, the two `npm test` steps and their arguments, the `${{ env.NANA_CI_JOBS }}` form, and release `needs`.
- packages/nana-pack/tests/ci-workflow.test.mjs — the suite-job slice, R-2557's one-home and chosen-comment check, R-2556's scan of every `npm test` step, R-1313's regex (the Windows step's `if:` directly under `run:`), and R-1530's `continue-on-error` helper, narrowed here.
- packages/nana-pack/tests/test-runner.test.mjs — `rootRecord`, `recordedMutation` (one unnamed failure) and `runRecorded`.
- packages/nana-pack/tests/suite-records.test.mjs — `runnerFixture`, the bounded case limit and `tmpDir`.
- packages/nana-pack/tests/land.test.mjs — a JSON command knob as `[process.execPath, fake]`.
- docs/reviews/suite-records-2026-10-22/plan-draft.md — D7: compare CI records with main's, never merge them into the runtime map.

1. `.github/workflows/ci.yml`'s suite job: `NANA_CI_RECORD_NAME` in the job env under a `chosen` comment; `NANA_SUITE_RECORD_FILE` in the env of each `npm test` step; the upload step after the last `npm test` step, exactly as D3 and R-2632 say. Narrow R-1530's helper in ci-workflow.test.mjs to accept that one step-level `continue-on-error: true` and still refuse one anywhere else.
2. `readRunRecord` moves from scripts/test-locked.mjs into packages/nana-pack/lib/suite-records.mjs with its three messages unchanged; `finalFiles` and one `recordCounts(record)` exported there. The new names in suite-records-config.mjs with provenance.
3. `packages/nana-pack/lib/ci-records.mjs` (gh runner, fs and temp root injected) and `scripts/ci-records.mjs` (`main(argv, …)` with the direct-invocation guard), as D4 and D5 say.
4. Tests with the must-meet's exact titles and `// req:` markers, every case "What each test does" lists, with a fake gh on every system. Rows in FEAT-031, `implemented` with evidence; CAP-07's deliverable lines for R-2632 (D7); R-616's person line; the README paragraph and its Dependencies line.
5. Run the new and edited test files, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `node scripts/requirements-tree.mjs --check`, then `npm run test:locked` before your last commit. Run the new test file once more with TMPDIR, TEMP and TMP pointed at a long folder outside the worktree (about 120 extra characters). Try these wrong versions, see each go red, then restore: pairs 1, 2, 6, 8, 13 and 15 of the must-meet's list.

Seat check: `node docs/reviews/ci-timing-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- Each suite leg's steps set the record knob and an upload step keeps the record without failing the leg; R-1530 still refuses any other continue-on-error.
- `node scripts/ci-records.mjs <rev>` prints one totals line and one slowest line per record, names each leg with no readable record and why, and exits 0 only when a record printed.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 14 lines after the VERDICT line): the commit shas; the wrong versions tried and their results; the long-temp-folder result; each departure from the Precedent files with its reason; each existing test you edited and why; the full suite's summary line; map, readme, trace and seat-check status.
