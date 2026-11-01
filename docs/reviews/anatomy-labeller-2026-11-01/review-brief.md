Feature: FEAT-042 · Measure builder context

Lane anatomy-labeller (Part 1). Class: ordinary. Threat model: honest variation in our tools' output is in scope (model replies with wrong ids, missing or extra units, off-vocabulary labels, fenced JSON, unknown usage; runs killed mid-batch; torn store tails); deliberate forgery, such as a planted store or labels, is out.

Review `git diff origin/main...HEAD` on `feat/anatomy-labeller`. The plan of record is `plan.md` in this folder, revised after `plan-attack.md`; `build-brief-1.md` and `build-report-1.md` record the build. The 2026-11-01 entry "a model labels the builder-context store" in `docs/sessions/2026-10.md` summarises the lane.

The change: the `label` command of `apps/bench/anatomy.mjs` with `apps/bench/lib/anatomy-labels.mjs` and sealed values in `anatomy-config.mjs`; R-3390 to R-3398; A-098.

Seat record: locked full suite at 75e23c4a read 253 files, 251 pass, 2 skip. CI run 41329574657 passed Linux, Windows and all install checks; macOS failed six checks in untouched `objective-golden` and `test-locked`, and the seat re-ran that job.

Question: does the feature work for its user, the seat labelling the private builder-context store for Part 2, and does the change cause a harm the review standard lists? Check especially that unit text and keys never reach stdout, stderr or the repository; that the store and folder refuse a checkout and are written private; that a killed or capped run keeps every finished batch and resumes without re-sending them; that a resume under a changed model, prompt, effort or seed is refused; that a malformed reply rejects its whole batch; and that the dollar cap charges unknown usage pessimistically.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
