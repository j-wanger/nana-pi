Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-reads-ci, rows R-2586 to R-2592, plus the seal test. Class: gate (a land tool). Builder: pi-worker (larger lane). Build session 1 of 1: nana-land reads the tip's GitHub CI runs before the suite.

Work in the lane worktree on feat/land-reads-ci. The plan of record is `docs/reviews/land-reads-ci-2026-10-22/must-meet.md`: read D1 to D12, the rows, what each test does, the tunables, the known limits and the wrong-code pairs first; then `plan-attack.md` (M1 to M3, S2 to S5, N1 to N5, N8 to N10) and `plan-draft.md` (its measurements). Where the draft and the must-meet disagree, the must-meet wins: scope is read from the tip, gh is called with `--hostname` and no GH_REPO, and the origin parser is the moved `GITHUB_REMOTE` (D4, D6, D9). Follow packages/nana-pack/README.md's module rules. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/bin/nana-land.mjs — `gitDefault`, `commandDefault`, `runLand`, the uncovered-commits check, the `refused:` catch, land notes and the success text.
- packages/nana-pack/lib/land-config.mjs — land-time tunables with provenance; `LAND_NOTE_PREFIX` and `TIP_DIGITS`.
- packages/nana-pack/lib/release-status.mjs — origin read through an injected git runner.
- scripts/product-report.mjs — `GITHUB_REMOTE` and its non-throwing origin read; move the regex into the pack lib and import it back.
- packages/nana-pack/tests/product-report.test.mjs — R-1511's origin spellings table.
- packages/nana-pack/tests/land.test.mjs — the fixture harness, the event log, the bare-origin fixture and the R-1372 command child.
- packages/nana-pack/tests/ci-workflow.test.mjs — R-1078, R-1530 and R-1531.
- .github/workflows/ci.yml — triggers, install-check, the Linux leg's `continue-on-error`.
- packages/nana-pack/README.md — the Dependencies line and the land paragraph.
- templates/_shared/working-under-nana-pi.md — the Land checklist bullet.
- AGENTS.md — the install-check step.
- REQUIREMENTS.md — CAP-04's R-1070 reader lines.

1. `packages/nana-pack/lib/land-ci.mjs` (pure, six-tag header): the moved `GITHUB_REMOTE`, `githubRepoOf(url)`, `ciScope` and `judgeRuns` (D2, D4, D8, D9). `scripts/product-report.mjs` imports `GITHUB_REMOTE` back with no behaviour change. The tunables in `land-config.mjs` with provenance; widen its header.
2. `nana-land.mjs`: the remote list and origin read, the non-recursive workflow listing at the tip, the exported gh runner factory and the one CI read after the uncovered-commits check and before the suite (D4 to D8, D11); the `ci:` lines and the note; header edits (D9). No new option.
3. Tests in `packages/nana-pack/tests/land.test.mjs` with the must-meet's exact titles and `// req:` markers, every case "What each test does" lists, new tunables through a namespace import. Rows R-2586 to R-2592 in FEAT-008 with the must-meet's texts, `implemented` with evidence; CAP-04's R-1070 reader line (D10). The docs the must-meet lists; regenerate AGENTS.md's marker region from the shared template.
4. Run land, product-report, ci-workflow, templates-render and the AGENTS region tests, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your last commit. Try these wrong versions, see each go red, then restore: pairs 2, 6, 11, 12, 16 and 17 of the must-meet's list.

Seat check: `node docs/reviews/land-reads-ci-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- Where origin is on github.com and the tip tracks a workflow, nana-land refuses before the suite until every workflow's newest run for the tip is completed with success, and names the run; elsewhere it lands with one note.
- product-report's origin tests stay green with the moved regex.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 14 lines after the VERDICT line): the commit shas; the check results; each departure from the Precedent files with its reason; each existing test you edited and why; the wrong versions tried and their results; the full suite's summary line; map, readme, trace and seat-check status.
