Feature: FEAT-007 · Review a specific revision independently

# Review brief 4: review-paperwork — confirmation round

Confirmation round on merges of current main (0b0c4646). Review only `git diff 4f7ecdea..HEAD`: the merge commit(s) since the last accepted round, generated files rebuilt by their generators, plus this brief. Main's side was already reviewed and landed (land-regen-both, desk-page-retire, ci-flakes-2). Judge only that the merge dropped nothing from either side and the lane's feature still works. Threat model and bar as in round 1.
