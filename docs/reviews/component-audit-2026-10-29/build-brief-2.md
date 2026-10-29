Feature: FEAT-039 · See the product and its decisions in one report

Lane component-audit. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on the tip of build 1.

The plan of record is still `docs/reviews/component-audit-2026-10-29/plan.md`. Build 1 built rows R-3100 to R-3110 and stopped PARTIAL on one identity-scan finding in the plan file. The seat has fixed that finding and rewritten the branch, so the branch's commit ids changed; work from the current tip.

## What the seat saw in build 1's output

1. **The memory ask recommends the status quo.** `--asks` prints "Seat recommends: keep the printed index" for the one component the audit rates `gap`, with evidence that the index is already over budget. The owner asked the audit to "initiate conversations on a potential memory or whatever component redesign", and he doubts memory is robust or scalable. A default that contradicts the component's own evidence does not start that conversation. In `docs/components/nana-pi.json`, set the library ask's default to what the evidence supports: plan a memory redesign lane that evaluates a searched, reviewed store, with the machine-local memory MCP tools as prior art. Its gains-and-misses line names what that default gains and what it may miss against keeping the printed index. Its cost line starts `easy to undo` or `hard to undo` and then says why, in a few words, as the planner prompt asks; "Easy to undo" alone is not enough.
2. **Coverage is mostly noise.** `--check` lists 175 of 475 mapped modules as unclaimed, and nearly all of them are test files and test helpers. Leave test files and test helpers out of the coverage count, so only product code is counted. Then claim each remaining unclaimed product module in the component it belongs to (for example the review ledger, review shape, review timeline and review launch in the review ladder; the worker config and build report in the workshop; the issue watch, roster and frontier commands where they fit). The coverage line should then name few or no modules.
3. **No wrong-code pairs.** For each must-meet, make one wrong-code change, show its test fails, restore it, and list the pairs in the report.

Numbers that must not move: the frozen contract and fixture sha256 values; rows R-3100 to R-3110 and their meaning.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: the full `--asks` output; the coverage line from `--check`; the wrong-code pairs; each departure from the Precedent; every existing test you changed.

## Precedent

- `scripts/component-audit.mjs`: build 1's `--check` and `--asks`.
- `docs/components/nana-pi.json`: build 1's hand source.
- `packages/nana-pack/prompts/planner.md`: the question-line labels and what each must hold.
