Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 2: ci-packs — confirmation round

Review only `git diff 5ca05c73..HEAD`: the fix for round 1's MUST. Every changed collected test file, in any pack except manual, is now selected as "changed test" and recorded, and nana-land's reader checks they ran. Release is added when a release-pack test, or a module one imports, changes. There are replay tests for acceptance-win-cmd's diff and the ci-wait pair. Builder report: `docs/reviews/ci-packs/build3/report.md`. Question: does a lane's edited test now always run in its CI before it lands, and does nana-land refuse a record that lacks one? The branch still needs a merge of current main, which gets its own short round. Bar as in round 1.
