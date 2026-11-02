PASS — land-regenerate-generated independent check. No MUST findings.

Checked tip `e6f9a2c8` against main `4c2ad436`. Used scratch repositories, isolated HOME, no network, and a PATH `gh` stub returning passing CI records.

1. **Generated conflicts:** tip landed; main refused. Only the two generated paths overlapped. Main moved after review. Both landed files matched fresh `npm run map` and `node scripts/requirements-tree.mjs --write` output.
2. **Additional source conflict:** both refused. Refs, checkout bytes, indexes, and worktree registrations remained unchanged.
3. **Generator failure and timeout:** both refused. Tip exercised exit 17 and the actual sealed 30,000-ms timeout. No temporary generator directory, branch, or worktree registration remained. Main checkout stayed unchanged.
4. **Non-generated modify/delete and rename conflicts:** both refused without changing refs or checkout bytes.
5. **Configuration:** tip ignored the npm-script decoy and configured default merge driver, landing correct bytes. Redirected output configuration refused before generator execution. Main refused each case.
6. **Recorded mutations:** all seven failed their named tests: G1→M2, G2→M3, G3–G5→M4, G6→M3, G7→M1. All shard baselines passed; no mutation survived.

**MUST findings:** None.  
**SHOULD findings:** None.

Evidence: `/var/folders/lg/h9m6nvvd2_9d7s3hyjvdlqxr0000gn/T/land-independent.kk5B0Y/` — `probes-final.log`, `probe.mjs`, `mutations-4.txt`, and mutation logs.

The original worktree remains clean and unchanged. No commits or pushes were made there.
