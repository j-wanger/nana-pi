Feature: FEAT-007 · Review a specific revision independently

# Review brief 1: review-paperwork

Review the whole lane: `git diff ae1f14f9..HEAD` on branch feat/review-paperwork. Plan: `docs/plan/review-paperwork.md` (M1–M10). Builder report: `docs/reviews/review-paperwork/report.md`.

The owner (2026-11-07) cut review paperwork: review-ledger keep, the tree-movement page, round caps and over-cap reasons, and the per-lane review folder as a required artifact. claude-review now does the ledger's run job itself; the review store stays; nana-land checks that a verified LAND covers the tip, with its two locked checks, plus CI.

Threat model: honest variation in tool output, old store records and Windows paths; forgery of review records is out (nana-land no longer checks kept review text integrity). One reviewer plus CI (owner, 2026-11-07). This lane changes the review and land tools themselves; you are being launched by the pre-lane claude-review from main.

Question: does the feature work for its user (the seat reviewing and landing lanes on old and new machines, macOS and Windows), and does the change cause a harm the review standard lists? Pay attention to: claude-review recording a verified LAND without review-ledger (and refusing on drift during a review), Windows launch and credential sealing in the moved code, nana-land's first and final locked checks, old store records, the rehomed git helpers' readers, and rules or prompts still telling a role to do a removed step.
