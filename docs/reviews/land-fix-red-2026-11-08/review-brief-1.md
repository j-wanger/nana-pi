Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 1: land-fix-red

Review the whole lane: `git diff main...HEAD`. Plan: `docs/plan/land-fix-red.md` (M1–M8). Builder report: `docs/evidence/land-fix-red/report.md`.

Question: can the reviewed fix for main's newest red push run now land through nana-land with `--fixes-red <run>`, while every other land still refuses on a red main? Check that the option waives only the red-main gate (review coverage, the lane's own CI, the macOS job, the local fallback and merge conflicts still refuse), that unreadable or stale main-CI evidence never authorizes a land, and that the rule text in the rulings and the shared land checklist agrees.

Threat model: honest variation in main's CI state (red, green, unfinished, newer runs or attempts). A seat naming a run it did not fix is out of scope.
