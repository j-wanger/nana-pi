Feature: FEAT-042 · Measure what a builder's context is for

Lane builder-anatomy. Class: ordinary. Builder: pi-worker (larger lane). Build session 1, on main 11454d44.

The owner: we cannot design memory well without evidence of what each role's context needs; start with the builder, broken down by function, not by source file. The owner confirmed ten functions as the starting hypothesis: purpose, task, method, constraints, precedent, knowledge, lessons, tools, output contract, feedback. This slice is descriptive and spends nothing: it splits real builder contexts into labelled units, reports what each function costs, what is duplicated, what nothing supplies and what builders fetch for themselves, and keeps a segmented copy that later replays can cut or stage.

Build the plan of record, `docs/reviews/builder-anatomy-2026-11-01/plan.md`, revised after its adversary pass (`plan-attack.md`; see "Revision after the attack"). Build every must-meet test and the seal test it names. Follow its Precedent, Assumptions and Threat model. IDs: FEAT-042 under CAP-08, R-3270 to R-3278, A-092. Lane context-anatomy (FEAT-041, R-3210 to R-3229, A-089) lands first; do not use its IDs.

Helper moves authorized: none required. Import `cohensKappa` and `seededSample` from `apps/bench/lib/catch-stats.mjs`; import `entriesIn` and `transcriptFiles` from `packages/nana-pack/lib/claude-transcript.mjs` only where they fit pi sessions (pass an explicit selector; its default drops worktree sessions). If you need the nested `norm` inside `apps/bench/lib/catch-judge.mjs`, lift it to a module-level export in that file. No other private helper moves.

Privacy: session files quote the owner. Never write session text into the repo, a test, a log or your report. Fixtures are synthetic. Run nothing over the real sessions; the seat does that after the build.

Hand-labelled fixture units (seat-written, synthetic). Use them as the R-3271 fixture whose labels the rules must keep; write the rules after reading them, not before:

| Unit | Function |
|---|---|
| The lane exists so a reviewer can see which known bugs a change touches. | purpose |
| Add a `--json` flag to the report command that prints one object per row. | task |
| Write the failing test first, then the code, then run the targeted test file. | method |
| Never write to the real home folder; every test uses a temporary home. | constraints |
| Follow `lib/report-table.mjs` for column widths and padding. | precedent |
| The map check fails when a module header lacks the six tags. | knowledge |
| A past build broke Windows by unescaping newline escapes in test strings. | lessons |
| Run `npm run map:check` to regenerate and verify the code map. | tools |
| End the report with the commit, the rows changed and each departure from the precedent. | output contract |
| The change is done when the locked suite and the map check exit 0. | feedback |
| Do not copy a private helper; import it or ask for the move. | constraints |
| The owner wants plain language in every report. | constraints |
| Builds stall when the suite runs detached; run it in the foreground. | lessons |
| `pi-worker` refuses a brief whose Precedent names an untracked file. | knowledge |
| Report a known bug the change touches as one line in the report. | output contract |

## Show your work

A run of every subcommand on synthetic fixtures, counts only. Locked full suite in the foreground.

## Done when

Rows `implemented` with backticked evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: every row and test changed; each sealed or chosen value with provenance; each departure from the Precedent.

## Precedent

- `apps/bench/catch-ledger.mjs`: a hand-run CLI with subcommands.
- `apps/bench/lib/catch-extract.mjs`: extraction over session files.
- `apps/bench/lib/catch-stats.mjs`: `cohensKappa`, `seededSample`.
- `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md`: definitions fixed before labels.
- `packages/nana-pack/lib/claude-transcript.mjs`: torn-line JSONL reading and the private folder.
- `packages/nana-pack/lib/build-records.mjs`: `readBuildLedger`, `collectBuildUsage`.
- `packages/nana-pack/lib/brief-precedent.mjs`: `readBrief`.
- `packages/nana-pack/lib/markdown-list-sections.mjs`: fence-aware Markdown scanning.
- `packages/nana-pack/lib/memory-shaping-config.mjs`: a config module with provenance.
- `apps/bench/test/catch-ledger.test.mjs`: the bench test form.
