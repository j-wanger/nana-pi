Feature: FEAT-042 · Measure builder context

Lane anatomy-label-check (Part 2 of the builder-context labeller). Class: ordinary. Threat model: honest variation in our tools' output is in scope (labels stores from capped and resumed runs, torn tails, oversize and duplicate units, sheets that differ only by cwd or branch); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/anatomy-label-check`. The plan of record is `plan.md` in this folder, revision 2 after `plan-attack.md`; `build-brief-1.md` to `build-brief-3.md` and `build-report.md` record the builds (build 2 retuned the label model to Opus at medium effort on the owner's decision; build 3 merged main). `labeller-counts.md` holds the seat's measurement and the owner's two rulings. The 2026-11-01 entry "four builder-context functions are now measured findings" in `docs/sessions/2026-10.md` summarises the lane.

Question: does the feature work for its user, the seat deciding which builder-context shares are findings, and does the change cause a harm the review standard lists? Check especially that `agree --model`, `sample --labels` and `report --labels` map a unit to its label through the normalized key, count each key once where the plan says so, and pool the two sheets as plan T8 says; that every reader is read-only, private and refuses the damaged stores listed in the plan; that no unit text or key reaches output or the repository; that `labeller-counts.md` reports only what the measurements show, with the four findings and six unmeasured functions as the owner ruled; and that the R-3397 retune is pinned.

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
