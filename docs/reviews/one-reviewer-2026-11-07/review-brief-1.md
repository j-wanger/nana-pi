Feature: FEAT-007 · Review a specific revision independently

# Review brief 1: one-reviewer

Review the whole lane: `git diff 89afbe55..HEAD` on branch feat/one-reviewer (tip 0fed8ccb plus this brief's commit). The plan is `docs/plan/one-reviewer.md`; the scout map is `docs/plan/one-reviewer/removal-map.md` (group 1 only).

The owner (2026-11-07) cut the extra review machinery: every lane now gets one reviewer plus CI. This lane removes the land reviewer, the seat land review, the checker slot, wrong-code pairs, the mutation runner and the lane class, and the rules that require them. It runs under the rule it introduces.

Threat model: honest variation in tool output, old roster files, old checkouts and Windows paths is in scope; deliberate forgery is out.

CI passed on 0fed8ccb (run 42393049346, macOS, Windows and Linux suite plus install-check legs). The local macOS install check passed on 0ea3e8a8.

Question: does the feature work for its user (the seat and its builders on old and new machines), and does the change cause a harm the review standard lists? Pay particular attention to: roster files with and without `land`/`checker` read by old and new checkouts; any path that can still start a land review or a checker; the outside-reader model choice; rules and prompts that still tell a role to do a cut step; rows retired vs still pointing at deleted files.
