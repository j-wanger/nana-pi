VERDICT: DONE

Commit: `ca75511a` — `FEAT-039: show runtime counts in Records summary`.

- **Files:** `REQUIREMENTS.md`, `docs/known-bugs/FEAT-039.md`, generated `docs/requirements-tree.md`, `packages/nana-pack/tests/product-overview.test.mjs`, `scripts/product-report.mjs`.
- **Rows and tests:**
  - R-3080 — `R-3080: Records summary separates violated, failed, skipped and unmeasured runtime counts`
  - R-3081 — `R-3050: Overview leads with What it does and Needs you, then closes Broken, Gaps and Stale in Records`
  - R-3082 — `R-3082: Records summary comes from the model when the Broken label is renamed`
- **Existing test changed:** R-3050’s summary assertion now checks the no-run form; its marker also covers R-3081.
- **Mutation pairs:** The pre-change implementation failed the updated R-3050 assertion and the R-3080 and R-3082 checks (exit 1). The corrected implementation passed the targeted tests (exit 0).
- **Records summary:** `Records: violated 5 · failed 0 · skipped 6 · unmeasured 0 · Gaps 0 · Stale 34`
- **Precedent departures:** None. The generated requirements tree was refreshed because the full suite checks it against the ledger.
- **Checks:** targeted tests exit 0; requirements tree, requirements trace, map, README, known-bugs and identity checks all exit 0. The first full-suite run found the stale generated tree (exit 1); after regeneration, `npm run test:locked` passed.
- **Suite summary:** 235 files; 233 PASS, 0 FAIL, 2 SKIP; **8,687 checks passed, 0 failed, 44 skipped**.
- **Not done:** CI was not run.
