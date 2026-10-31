Feature: FEAT-040 · Make and keep memory

Lane memory-shaper. Class: ordinary. Builder: pi-worker (larger lane). Build session 1, on main a6dcc99a (memory-making landed).

The owner's memory factory: the rule maker from lane memory-making set the baseline and missed the bar on real data, so this lane builds the model-call shaper scored on the same frozen labels. The owner chose a Claude model (issue 283): the default runner is an isolated `claude -p` with `claude-sonnet-5` at low effort, so owner text reaches no new provider. Both runners are built as the plan says.

Build the plan of record, `docs/reviews/memory-shaper-2026-10-31/plan.md`, revised after its adversary pass (`plan-attack.md`; see "Revision after the attack"). Build every must-meet test it names, follow its Precedent, Assumptions and Threat model. IDs: FEAT-040, rows R-3251 to R-3269, artifact A-091.

Helper moves authorized, in `packages/nana-pack/lib/memory-making.mjs` (now on main): the walks inside `transcriptCandidates` and `reviewCandidates`, with their private helpers (`ownerTurn`, `textOnly`, `askCalls`, `askAnswer`, `inWindow`, `sourceFiles`), become exported unit generators in the same module; the private `shape` is exported with an optional claim and context override, or split into a record builder plus the rule claim form. The rule maker keeps its behaviour; `packages/nana-pack/tests/memory-making.test.mjs` stays green unchanged. No other private helper moves.

Never call a model in tests or in this build: every test injects a runner. The one synthetic canary call the plan names is the seat's, after the build. Do not read `~/nana-memory-runs` or any real transcript. Fixtures are synthetic.

Carried notes from memory-making's final review, for this lane's notes step only (do not fix unless a must-meet needs it): a pending seat question clears only on an owner turn; correction cues match anywhere in the turn; seat context requires `isSidechain === false` exactly; owner entries without a timestamp are dropped.

## Show your work

The shaper run on synthetic fixtures with an injected runner, and its counts-only stdout. Locked full suite in the foreground.

## Done when

Rows `implemented` with backticked evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: every row and test changed; each sealed value with its provenance; each departure from the Precedent.

## Precedent

- `packages/nana-pack/lib/memory-making.mjs`: units, shape, `resolveEvidence`, `memoryArgs`.
- `packages/nana-pack/lib/memory-making-config.mjs`: the record shape.
- `packages/nana-pack/lib/memory-score.mjs`: the scorer, unchanged.
- `packages/nana-pack/lib/claude-transcript.mjs`: transcript reading and the private folder.
- `scripts/memory-make.mjs`: the npm-script form.
- `apps/bench/lib/usage.mjs`: spend accounting from a pi stream.
- `apps/bench/lib/catch-judge.mjs`: the isolated `claude -p` runner.
