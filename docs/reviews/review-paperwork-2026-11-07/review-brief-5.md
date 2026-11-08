Feature: FEAT-007 · Review a specific revision independently

# Review brief 5: review-paperwork — confirmation round

Confirmation round on a merge of current main (bdb12b9d: win-shards). Review only `git diff a05f4c0c..HEAD`: the merge commit, generated files rebuilt by their generators, plus this brief. The conflicts were in AGENTS.md's shared marker region and templates/_shared/working-under-nana-pi.md: check that main's Windows-on-main-only wording and this lane's review-paperwork removals both survive, the marker region equals the shared file, and nothing else from either side was dropped (merge report: `docs/reviews/review-paperwork-merge-bdb12b9d/report.md`). Threat model and bar as in round 1.
