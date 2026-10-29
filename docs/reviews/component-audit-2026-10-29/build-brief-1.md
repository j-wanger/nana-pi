Feature: FEAT-039 · See the product and its decisions in one report

Lane component-audit. Class: ordinary (`node scripts/lane-class.mjs` prints `ordinary` on the planned files). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/component-audit, based on main. The plan of record is `docs/reviews/component-audit-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it; the plan already takes every attack point. The plan has no list of allowed edits. A sibling lane builds at the same time against the same frozen data contract; read the plan's Shared data contract section and add `docs/components/contract.json` and `docs/components/fixture.json` byte for byte with the sealed sha256 values it names. Do not change the contract; if you find you need to, stop and report it.

What the lane does, in one sentence: a tracked, checked data model maps nana-pi's components, workflow and governance, with each part's paths, the features it serves, a rule-based status with evidence, and a conversation starter per gap that the seat can post as an ask.

Build every must-meet in the plan, rows R-3100 to R-3110. The owner's questions are posted as issues 262 and 263; build on the defaults.

Report the `--check` output and the `--asks` output in full; the seat posts the asks after the land, never the builder.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green, and the two contract files match their sealed sha256.

Report: each must-meet's test title; the sealed values with provenance; each departure from the Precedent below; every existing test you changed.

## Precedent

- `scripts/requirements-tree.mjs`: take `parseLedger` and `readRequirementRows` for feature labels, row counts, row statuses and the set of known IDs. Import them; do not parse `REQUIREMENTS.md` again.
- `scripts/product-report.mjs`: the nearest per-feature status count, and the injected git runner pattern. Reuse any exported helper rather than copying.
- `packages/nana-pack/lib/brief-precedent.mjs`: `trackedAtHead` for "a cited path exists" (A3).
- `scripts/deliverables.mjs`: the nearest checker that turns a cited path not tracked at HEAD into a named problem line.
- `scripts/known-bugs.mjs`: how known-bug files are read, for checking that a known-bug anchor points at a `- ` line.
- `scripts/code-map.mjs`: `repoGraph`, as `scripts/lane-class.mjs` imports it, for the list of mapped modules the coverage lines compare against.
- `packages/nana-pack/lib/ask-shape.mjs`: `ASK_LABELS` for the five ask labels `--asks` prints, and `parseAskBody` for the round-trip test. Import the labels; never retype them.
- `scripts/requirements-moved.mjs`: `defaultGit` and `MAX_GIT_BUFFER` for the bounded, injected git runner the activity and staleness counts use.
- `packages/nana-pack/lib/release-status.mjs`: read-only git queries over refs, the nearest shape for the in-flight branch count.
- `scripts/first-look-config.mjs` and `scripts/outside-reader-config.mjs`: the sealed-config file with provenance beside each value.
- `scripts/identity-scan.mjs`: the scan R-3106's test pipes `--asks` through, and the seat runs again before posting.
- `packages/nana-pack/tests/first-look.test.mjs`: the test file layout for a `scripts/` tool tested from `packages/nana-pack/tests`.
