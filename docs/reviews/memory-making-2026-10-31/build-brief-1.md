Feature: FEAT-040 · Make and keep memory

Lane memory-making. Class: ordinary. Builder: pi-worker (larger lane). Build session 1, on main e5db630e.

The owner wants a memory factory with six stations (making, shaping, storing, upkeep, checking, delivery) that shapes each agent's context, and asked the first three lanes to run in parallel. Ideas are tested by experiment, not dropped for weak evidence. This lane is the making station plus the record shape: a hand-run maker that turns past seat transcripts and review folders into shaped, low-trust candidate records with evidence pointers, and a scorer against a labelled set.

Build the plan of record, `docs/reviews/memory-making-2026-10-31/plan.md`, revised after its adversary pass (`plan-attack.md`, every finding taken; see its "Revision after the attack"). Build every must-meet test it names and follow its Precedent, Assumptions and Threat model.

Helper moves authorized: from `packages/nana-pack/lib/writing-trial-extractor.mjs`, the module-private `entriesIn`, `textFrom`, `edtDay` (its timezone a named sealed constant), `assistantText` if the maker needs seat text, and the private-folder creation inside `preserve`, move with the exported `transcriptFiles` into the new shared `packages/nana-pack/lib/claude-transcript.mjs`. The extractor imports them and keeps its exports and behaviour. No other private helper moves; import every other precedent module the plan names.

The record shape lives once, in `packages/nana-pack/lib/memory-making-config.mjs`, as a named field list that lane owner-profile will import. Keep it a plain exported list with provenance.

Privacy: the repo is public. Fixtures are synthetic. No real transcript text, owner quote or name enters any repo file, test, log or report. Do not run the maker on real transcripts; the seat does that after the build.

## Show your work

A run of both commands on the synthetic fixtures with their counts-only output. No model sessions. Locked full suite in the foreground.

## Done when

The plan's rows are `implemented` with backticked `file::title` evidence. These checks are green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: every row and test changed; the counts-only outputs; each departure from the Precedent.

## Precedent

- `packages/nana-pack/lib/writing-trial-extractor.mjs`: transcript reading and the private output folder (helpers move as above).
- `packages/nana-setup/lib/project-key.mjs`: `projectKey` for the default scope.
- `packages/nana-pack/lib/review-findings.mjs`: `mustTitlesOf`, `verdictWordOf`.
- `packages/nana-pack/lib/display.mjs`: `displayText` for capped, control-free text.
- `packages/nana-pack/lib/bounded-read.mjs`: `readBounded` for review files.
- `scripts/code-search.mjs` and `scripts/code-search-config.mjs`: npm-script form and sealed config shape.
- `scripts/ci-records.mjs`, `scripts/known-bugs.mjs`: counts-only output.
