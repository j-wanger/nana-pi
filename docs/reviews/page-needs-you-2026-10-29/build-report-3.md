VERDICT: DONE

**Commit:** `2ed022dd` — `page-needs-you: show per-question recommendations and record counts`

- **Files:** `REQUIREMENTS.md`, `docs/known-bugs/FEAT-039.md`, both named test files, and `scripts/product-report.mjs`.
- **Rows:** R-3050 and R-3055 remain `implemented` with backticked `file::title` evidence.
- **Tests changed:** “R-3050: Overview leads with What it does and Needs you, then closes Broken, Gaps and Stale in Records”; “R-3055: issue Decisions cards render parsed choices with shared labels and body text stays inert.”
- **Wrong-code proof:** Before the fix, each test failed against the old renderer; both pass with the fix. No assertion was inverted.
- **Records summary:** `Records: Broken 5 · Gaps 0 · Stale 34`.
- **Issue 256 recommendations:** “When should the reader run?” → “After build 1, right after first-look, only on a lane that changes the product page.” “Where do the reader’s new findings go?” → “The seat shows the owner the top new finding in its report, beside the first-look card.” “Which model reads?” → “The roster’s first pi entry among `scout`, `land`, `builder`, in that sealed order.”
- **Precedent departures:** None. No other existing tests changed.
- **Checks:** `npm run map:check`, `npm run readme:check`, requirements trace, tree check, known-bugs check, and `node scripts/identity-scan.mjs` all exited 0. The locked suite exited 0: **234 files; 232 PASS, 2 SKIP; 8,677 checks passed, 0 failed, 44 skipped.** It ran in the foreground on the committed tip.
- **Initial suite attempt:** Failed due to a renderer reference error; corrected before the green full-suite run.
- **Not done:** Nothing from the brief. The worktree is clean.
