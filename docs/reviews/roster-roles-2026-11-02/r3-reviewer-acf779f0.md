The round-2 MUST is fixed. R-3187 is no weaker than before, and nothing else in the product or its tests changed.

**The fix.** The diff from `aceba5f6` to `HEAD` changes one code line, the `ledger/bay-1` row in `packages/nana-pack/tests/hive-city.test.mjs:512`. The other 13 files are new evidence files under `docs/reviews/roster-roles-2026-11-02/`.
- **Why the old pattern broke:** on main it matched `if (digest) promptParts.push(Buffer.from('\n\n'), Buffer.from(digest.text));`. This lane moved that prompt assembly into `prepareWorker`, so that line no longer exists.
- **What the new pattern matches:** the line at `packages/nana-pack/bin/pi-worker.mjs:245`. It builds `promptBytes` and adds the known-bug digest only when there is one.
- **That line really delivers the digest:** `prepareWorker` (`pi-worker.mjs:405-414`) writes `Buffer.concat(promptBytes)` to the prompt file the Claude Code builder receives. On main the old line served the same Claude Code builder path, so the claim covers the same flow as before.
- **It matches exactly once:** the role launch at `pi-worker.mjs:145` also builds `promptBytes`, but it has no digest spread, so it doesn't match.

**Is R-3187 weaker?** No. The old pattern only needed `promptParts.push(` followed later by `Buffer.from(digest.text)`. The new one needs the whole `...(digest ? [Buffer.from('\n\n'), Buffer.from(digest.text)] : [])],` inside `promptBytes: [`, which is at least as strict. I ran the pattern against four changes to the source; each one left 0 matches, so the check would fail every time:

| Change | Matches |
|---|---|
| Original tip | 1 |
| Digest spread removed | 0 |
| `digest.text` replaced by `bugText` | 0 |
| Condition forced to `false` | 0 |
| Line commented out | 0 |

The test's own checks still apply: one match on each of four line-ending and whitespace variants, and a failure when the line is removed.

**Test run.** I ran `node packages/nana-pack/tests/hive-city.test.mjs` on `3b9e4c77`. It exited 0 with `PASS R-3187` and 19 checks passed, matching `build-3-hive-green.log`. `git status` was clean before and after, so the test wrote nothing into the worktree.

**Nothing else changed.** Outside that one line, the new commits only add logs and `review-brief-3.md`. None of them touches product code, hooks, install or requirement rows. I found no listed harm: no data loss, no writes outside the worktree or temp folder, no broken install or hook, and nothing main does today stops working.

**One note, not blocking.** `build-3-mutations.md` records a run that never tested its 9 mutations. The baseline check refused it because MM6's test title wasn't in the passing output on darwin; MM6 is a Windows test and is likely skipped there. The darwin-only rerun in `build-3-mutations-darwin.md` turned all 8 remaining mutations red. So MM6 has no recorded mutation run on this machine; that is a gap in the evidence, not a fault in the product.

VERDICT: LAND
