Feature: FEAT-007 · Review a specific revision independently

# Review brief 2: review-paperwork — confirmation round

Confirmation round. Review only `git diff 26ef7b70..HEAD`: round 1's fixes in 9616c0f5 (the MUST: deprecated REVIEW_ROUND_CAP and roundCapVerdict exports kept for ~/nana-agent-loop's forwarder, with a test importing all three names; the skill-claims fixture; the template and header wording) and two merges of main (2db50942 and 506b722f), plus this brief. Main's side of each merge was already reviewed and landed (one-reviewer, bench-retire, hive-retire); judge only whether the lane's own changes and the conflict resolutions are right, and that the merge dropped nothing from either side. Generated files (code map, requirements tree) were rebuilt by their generators.

Threat model and bar as in round 1. One reviewer plus CI.
