Feature: FEAT-043 · Measure memory outcomes

Lane outcome-meter. Class: ordinary. Threat model: honest variation in our tools' output is in scope (transcript shapes, shaper candidates that differ run to run, judge replies that are malformed or carry unknown usage, torn or old load-log lines, parallel sessions, pasted repeats); deliberate forgery, such as planted transcripts or a hand-edited load log, is out.

Review `git diff origin/main...HEAD` on `feat/outcome-meter`. Main is 8c665dcd. The plan of record is `docs/reviews/outcome-meter-2026-11-01/plan.md`, revised after its adversary pass (`plan-attack.md`) and two owner rulings recorded in it (count by interactions, not weeks; replay is the next lane). Build briefs 1 to 3 and `build-report.md` record the builds. The 2026-11-01 entry "a meter for corrections and decisions given twice" in `docs/sessions/2026-10.md` summarises the lane.

The change: `memory:meter`, `memory:meter-score` and `memory:meter-compare`, with the meter, config and scorer modules; one helper change to `scripts/memory-shape-runners.mjs` (sealed runner options, pi refused with them) and one to `packages/nana-pack/lib/memory-making.mjs` (an optional entry observer in the same pass). FEAT-043; R-3310 to R-3336; A-095.

The seat's record:
- Locked full suite at f67a67fb: 248 files, 246 pass, 2 skip. CI for that tip is linked on draft pull request 290.
- The seat ran the meter privately over both shaper runs of the frozen snapshot; counts stay in the private folder by the plan. Repeats were too rare to measure and the two runs agreed on no item. About one in six decision items came back unjudged. Both are recorded as known bugs, not reasons to send back by themselves.
- Known bugs: three lines in a new `docs/known-bugs/FEAT-043.md`.

Question: does the feature work for its user, the seat measuring memory outcomes over time, and does the change cause a harm the review standard lists? Check especially that owner text goes only to the sealed Claude runner and never to stdout, stderr, the repository or a non-Claude model; that output refuses a folder inside a checkout; that the window, lookback and warm-up rules match R-3310 and R-3311; that a bad judge reply fails closed; that the spend cap stops new calls; and that the two helper changes leave the shaper's and maker's behaviour unchanged.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
