VERDICT: DONE

DONE. Commit `4bb3f463` completed FEAT-006.

- **Files and rows:** Updated `REQUIREMENTS.md` evidence; added pins for R-3021–R-3025 and updated R-3026’s wording. Rows remain `implemented` with backticked `file::title` evidence. Reused `ruleSource(SEAT_GUIDE_FILE)` in install and doctor. The new sentence is: “In pi, the seat asks the user to start another lane's build from another pi session or the desk; its own builds run in the foreground.”
- **New pins and wrong-code pairs:** `pi builder and reviewer omit the guide while retaining the rulings section` catches reviewer-only injection; `seat guide unavailable prefix is distinct from the rulings prefix` catches the rulings marker reused for the guide; `doctor rejects a stale Windows guide copy on every host` catches existence-only doctor checks; `install-check seat-guide heading matches the injected guide heading` catches heading drift. Each pair made its test fail.
- **Existing tests changed:** Extended the builder/reviewer test with the reviewer case; updated `pi seat guide explains parallel builds and the shared working pattern names both guide loaders` for the new wording and placement. Its former wording pair is pinned by that test.
- **Precedent:** No departures. Imported the existing `ruleSource`; tested heading equality without adding an unapproved nana-setup-to-nana-pack production import.
- **Commands, exit codes:** Targeted rulings, install and seat-rule tests: 0. Wrong-code mutation runs: expected failures, 1. `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs`: 0. `npm run map:check`: 0; `npm run readme:check`: 0; requirements-tree, requirements-trace, known-bugs and identity-scan checks: 0. The initial map check found stale generated output; regenerated `docs/code-map.md`, then it passed.
- **Locked full suite on the committed tip:** `npm run test:locked` — exit 0; **232 files, 230 PASS, 0 FAIL, 2 SKIP; 8,663 checks passed, 0 failed, 44 skipped.**
- **Not done:** Nothing requested.
