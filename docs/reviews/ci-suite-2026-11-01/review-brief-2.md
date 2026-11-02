Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane ci-suite. Class: gate. Threat model as in `review-brief.md`.

Confirmation round 2. Round 1 reviewed fffb9fcd and both reviewers said LAND (texts kept as `r1-*.md`). Since then the seat added the final review's notes as known bugs and wrote `build-brief-3.md` (9d9fb680). Build 3 merged main at 81b78dfa and took the final reviewer's SHOULD: the builder preamble now runs the full suite unless the repository's `AGENTS.md` says CI covers it, R-3436 and its pins follow, and nana-pi's own AGENTS.md still says CI covers it. Review only `git diff fffb9fcd..HEAD` on `feat/ci-suite`.

Seat record: build 3's locked full suite read 253 files, 251 pass, 2 skip; the mutation runner reads 17 of 17 red.

Question: does the merge keep this lane's behaviour and rows as round 1 accepted them and bring main's changes in whole, including main's deletions? Does the preamble change restore the old default for projects whose AGENTS.md says nothing about CI, while nana-pi builders still push and stop? Does the change cause a harm the review standard lists?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
