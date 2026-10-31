Feature: FEAT-040 · Make and keep memory

Lane memory-making. Class: ordinary. Threat model: honest variation in our tools' output is in scope (Claude Code transcripts in every shape the runtime writes, review files in every shape the review reader handles, temp-folder aliases, odd characters in owner text); deliberate forgery, such as a planted transcript or label file, is out.

Review `git diff origin/main...HEAD` on `feat/memory-making`. Main is e5db630e. The plan of record is `docs/reviews/memory-making-2026-10-31/plan.md`, revised after its one adversary pass (`plan-attack.md`). Build briefs 1 and 2 and `build-1.md` record the builds. The 2026-10-31 entry "the memory factory's making station" in `docs/sessions/2026-10.md` summarises the lane.

The change: `npm run memory:make` turns this repo's seat transcripts and review folders into shaped, low-trust candidate records with evidence pointers, written to a private folder outside every git checkout, counts-only output; `npm run memory:score` scores candidates against a labelled set. The record shape lives once in `memory-making-config.mjs`; another lane imports it. Transcript helpers moved from the writing-trial extractor to `claude-transcript.mjs`. New FEAT-040; rows R-3188 to R-3209 and R-3250; artifact A-088.

The seat's record:
- Builds 1 and 2; locked full suite at 716b360f: 243 files, 241 pass, 2 skip. CI run 41232359411 passed on all three systems.
- The seat ran the maker on real transcripts outside the repo; a separate agent labelled every owner turn blind. Correction recall 8/46, decision recall 119/162, lesson recall 56/56, precision 183/310, unlabelled 0. The rules miss the plan's bar; the plan's answer is a later model-shaper lane, and this lane stands as the baseline.
- Known bugs added: four lines in `docs/known-bugs/FEAT-040.md`.

Question: does the feature work for its user, the seat who wants candidate memories it can score and later store, and does the change cause a harm the review standard lists? Check especially that no owner text can reach the repo, stdout, stderr, CI logs or test fixtures; that the private-folder guards hold; that the helper move left the writing-trial extractor's behaviour unchanged; and that tests assert the maker's invariants rather than restate its rules.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
