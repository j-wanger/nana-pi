Feature: FEAT-039 · See the product and its decisions in one report

# Review brief 1: hive-retire

Review the whole lane: `git diff 89afbe55..HEAD` on branch feat/hive-retire, excluding what the merge of main brought in (the one-reviewer lane, already reviewed on main; the merge commit is 6a32d6d5). Plan: `docs/plan/hive-retire.md`. Builder report: `docs/reviews/hive-retire-2026-11-07/build-report.md`.

The owner (2026-11-07) chose to cut the hive city page: about 83,000 lines (mostly vendored three.js), no change since 10-31, no measured reader, and a coupling that turned the suite red when a component was added. The product report, its Pages publish and identity check, the component audit and first-look stay.

Threat model: honest variation in tool output and Windows paths; forgery out. One reviewer plus CI (owner, 2026-11-07).

Question: does the feature work for its user (the published product report, the component audit, first-look), and does the change cause a harm the review standard lists? Pay attention to: Pages workflow order and identity scan, the artifact registry (A-085/A-086/A-087), first-look's other capture modes, retired rows vs live rows naming deleted files, and the merge resolution in the lost-edge test.
