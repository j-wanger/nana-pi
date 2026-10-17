### MUST

1. **Concurrent runs can silently erase valid evidence.**  
   Residual 11 permits two honest runs using the same output file to both exit 0 while the later write replaces the earlier record. Parallel work and retrying a stalled run make this realistic. The erased run loses every pair result without warning. Require exclusive output ownership or refuse the second writer before creating worktrees.

2. **Different shards can test different tips or pair tables under one header.**  
   Each staggered shard re-imports the table and re-resolves the original revision expression. If a branch advances or the table changes during startup, the merged record attributes mixed results to the parent’s resolved tip. Background runs followed by normal commits are realistic. Pass the resolved commit and table identity to every shard, then refuse identity drift.

### SHOULD

1. **Shard death and Windows stops can leave untraceable worktrees.**  
   The plan explicitly accepts this in residuals 4–6, despite R-1231 and the review brief requiring cleanup. The parent should track each shard’s scratch path and clean it after abnormal shard termination.

2. **Edit and test paths lack containment checks.**  
   Joining table paths to the worktree does not prove they remain inside it or avoid symlink escape. Validate resolved paths before reading, writing, or running them.

3. **R-1241’s baseline-log clause is not pinned.**  
   M22 checks pair logs but not each red baseline attempt. Add that assertion or remove the untested clause.

4. **The replace-whole configuration API is an avoidable footgun.**  
   A natural partial override leaves required settings undefined and can crash or refuse a run. Merge an allowlisted set of tunables over defaults instead.

Old records remain untouched, and the subtraction otherwise preserves the first lane’s essential split-runner scope.

VERDICT: SEND-BACK
