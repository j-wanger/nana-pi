Feature: FEAT-034 · Define reproducible comparisons

# Review brief 2: bench-retire — confirmation round

Confirmation round on the merge of current main (commit 0db90a76, plus this brief). Round 1 said LAND on 00ebda66. Review only the change since then: `git diff 00ebda66..HEAD`, which is the merge of main (the one-reviewer lane) into this lane. Conflicts were in REQUIREMENTS.md, docs/code-map.md and two test retirement/lost-edge lists; generated files were rebuilt by their generators.

Question: did the merge keep both sides' rows and checks intact, drop nothing from either side, and leave the lane's feature working? Threat model and bar as in round 1.
