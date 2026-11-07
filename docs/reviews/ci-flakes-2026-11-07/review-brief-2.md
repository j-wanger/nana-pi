Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 2: ci-flakes — confirmation round

Confirmation round. Review only `git diff 36d5c94a..HEAD`: the merge of main (c1aca063) as merge commit faac8e59; one conflict in docs/requirements-tree.md, regenerated, plus this brief. Main's side of each merge was already reviewed and landed (one-reviewer, bench-retire, hive-retire); judge only whether the lane's own changes and the conflict resolutions are right, and that the merge dropped nothing from either side. Generated files (code map, requirements tree) were rebuilt by their generators.

Threat model and bar as in round 1. One reviewer plus CI.
