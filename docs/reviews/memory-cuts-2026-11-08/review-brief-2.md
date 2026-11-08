Feature: FEAT-043 · Measure memory outcomes

# Review brief 2: memory-cuts — confirmation round

Review only `git diff b693d913595c1c6600dcd426628d722353866183..HEAD`: a builder's merge of current main (setup-retire and earlier lanes, 22 conflicts) plus review 1's SHOULD 2 fix. That fix keeps `nana-memory-end.mjs` as a do-nothing placeholder that ignores stdin and exits 0, so an updated checkout without a reinstall raises no error; install still unwires it and never installs it. Merge report: `docs/reviews/memory-cuts-merge-main/report.md`. Judge that the merge dropped nothing from either side (main's deletions stand, this lane's removals kept), that the placeholder is safe, and that the lane's feature still works. Bar as in round 1.
