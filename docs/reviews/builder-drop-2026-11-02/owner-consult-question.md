The owner of nana-pi is away until 07:00 EST and asked: "make your best judgment and then consult with pi Astra when you need me". You are that consult.

Context: his current priority (2026-11-02) is "craft each role's context by design, builder first, measured by drop tests". He said: "go ahead with the drop test whenever theres a free lane ... without it, we lack understanding of what context matters". The plan is docs/reviews/builder-drop-2026-11-02/plan.md in this worktree (revision 2, after a hostile attack in plan-attack.md). This lane builds the harness and spends nothing; the paid round happens in a later study lane, so answers here set defaults that lane inherits.

Answer each question below: your pick, one line why, and what would change your mind. Read the plan if you need to.

## Questions for the owner

The owner is away. The seat decides these with an astra consult. Each default is the one this planner defends. All
three bind the study lane; none changes this lane's code.

Question: How large is the first paid round, and what may it spend?
Default: a control-only pilot first, 10 drawn lanes × 2 control runs (about USD 33); then, only if the pilot passes its bar and the power simulation shows 10 lanes can detect a 0.2 harm, 10 lanes × 3 arms (control, no tool list, no lessons) × 3 repeats, with reviews on one repeat per lane and arm, about USD 205 in all under a USD 400 hard cap.
What the default gains and misses: the pilot buys proof that the replay environment yields usable controls before any treatment spend, and ten lanes give the exact paired test room to decide; it misses lanes that never landed, which have no frozen grader, and so says nothing about them.
Cost of a wrong guess: hard to undo; money spent does not come back, and an underpowered round must be paid again.
If answered otherwise: `study.json` changes before `PREREG.md` is committed; no harness code changes.

Question: What does "the tool list" arm remove?
Default: the three tool-listing sections pi wrote into the recorded prompt (the skills listing, pi's `tools` section and pi's `docs` section); the tool schemas stay because pi sends them from `-t`, and tool-labelled lines in briefs and AGENTS.md stay.
What the default gains and misses: a structural cut needs no label (tools labels fail agreement at κ 0.58) and covers the 20k skills listing; it misses command lines inside AGENTS.md and briefs, which a model-label cut would remove.
Cost of a wrong guess: hard to undo; a third of the treatment spend answers a question the owner did not ask.
If answered otherwise: the arm's section list in `study.json` changes, or the arm uses the label path T2 already pins.

Question: Which builder model runs every replay?
Default: openai-codex gpt-6.1-sol, thinking medium (the roster's small-lane builder today), pinned in `study.json` for the whole study whatever the roster later says.
What the default gains and misses: the verdicts describe the builder that will receive the redesigned context; it misses a cost anchor, since only one medium build is recorded (USD 0.59), which gpt-6-luna (122 builds, median USD 0.03) would give.
Cost of a wrong guess: hard to undo once runs start, since a model change invalidates every row; easy before.
If answered otherwise: one pinned value in `study.json` changes; a second model doubles the runs.

## Feature

Feature: FEAT-045 · Test which builder context changes builds

Purpose line: Replay past first builds with one kind of context removed, in a sandbox that reaches only the start
tree, grade them by frozen test manifests, and give each kind a verdict by a rule fixed before any paid run.

Under CAP-08, beside FEAT-042. This lane: rows R-3600 to R-3607. Artifact line: `A-101 · builder replay journal and
rows · user-home store: ~/<private --out folder>/journal.jsonl and rows.jsonl · manual: the seat runs node
apps/bench/replay.mjs run by hand with a private folder outside any git checkout; synthetic runs use OS temp`. Read by:
`code: apps/bench/replay.mjs` (`run` on resume, `report`).

Commands this lane adds:
```
node apps/bench/replay.mjs render   --contexts <anatomy-store> --labels <labels> --build <id> --arm <arm.json> --out <private-folder>
node apps/bench/replay.mjs run      --study <study-dir> --repo <repo> --contexts <store> --labels <labels> --out <private-folder> [--smoke] [--go]
node apps/bench/replay.mjs grade    --manifest <grading.json> --tree <private-clone> --out <private-folder>
node apps/bench/replay.mjs errors   --sessions <sessions-root>
node apps/bench/replay.mjs rows     --in <private-folder>
```
`run` with no `--go` prints the schedule, argv, sandbox profile hash and reserved spend, and spends nothing. An arm is
`{ "name", "dropSections": [...] }`, `{ "name", "dropLabel": "<function>" }` or `{ "name": "control" }`. The study
lane's `report` reads `rows`.
