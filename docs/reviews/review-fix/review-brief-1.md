Feature: FEAT-007 · Review a specific revision independently

# Review brief 1: review-fix

Review `git diff main...HEAD` on feat/review-fix (three commits; the third is the seat's one-line HANDOFF addition).

Card: two review-tool faults seen on 2026-11-09, fixed in the tools.
1. A first line that carries "verdict:" but no verdict label is prose, not a conflict, when the final line holds a valid label; a first line naming a different label still refuses. When a verdict is still unread, claude-review asks the same reviewer session once for the verdict line only; a second unread result is a failed review. Research run 5 found all 10 stored unread reviews ended in a valid final line.
2. claude-review refuses to launch, before any model call, on a tree with uncommitted tracked changes or untracked non-ignored files, naming up to ten paths. pi-review keeps its separate immutable-checkout path.
3. Leftovers from the Cut B review: R-3294, R-3295 and R-3304 become `untested`; the objective's measure drops "and generated"; `apps/bench/lib/usage.mjs` and `unpushedProfile` are deleted; stale comments fixed.

Builder's validation: the recorded cut-a round-3 review now reads LAND; a replay of 8,746 review files changed only that one, from unread to LAND, with no label-to-label change; in a temp clone the launcher refused an untracked `.codex/hooks.json` with no model call. Seat re-ran trace, tree, map, README, review-ledger-verdicts, claude-review-launch, requirements-deliverables, code-map-launch and known-bugs: all exit 0.

Questions:
- Can the narrower rule now accept a review whose first line genuinely conflicts with its final verdict (a label in any spelling the reader folds)?
- Can the re-ask change a recorded verdict, run against a different revision, or loop?
- Does the dirty-tree refusal block a launch that should go through (the seat's own review of a clean lane, an ignored file, a nested repository)?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
