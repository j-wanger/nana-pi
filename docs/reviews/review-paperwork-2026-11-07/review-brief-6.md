Feature: FEAT-007 · Review a specific revision independently

# Review brief 6: review-paperwork — confirmation round

Confirmation round on a seat merge of current main (85ca2b75: data-pack-template). Review only `git diff becaf057..HEAD`. The only conflict was the generated docs/code-map.md, rebuilt by `npm run map` (with `npm run req:tree`); everything else merged without conflict. Judge only that the merge dropped nothing from either side. Threat model and bar as in round 1.
