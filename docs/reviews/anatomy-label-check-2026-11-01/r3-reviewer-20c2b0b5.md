I found no MUST: the merge kept main's content, including the lines main deleted, and kept every change this lane made.

**What I checked** (comparing against both merge parents and base `ac20e30a`):

- **Main's changes carried through whole.** For every file, main's patch (`ac20e30a..d4285b6c`) has the same added and deleted lines as the merge's patch onto the lane (`db67e96a..44054cd8`). All 18 of main's deleted lines are gone from the merged tip. Main-only files match `d4285b6c` exactly: `git diff d4285b6c HEAD` is empty for `scripts/`, `packages/`, `code-map.config.json`, `docs/known-bugs/FEAT-040.md` and the `claude-cmd-launch` review folder.
- **This lane's changes survived the merge.** The lane's patch against main is the same before the merge (`ac20e30a..db67e96a`) and after it (`d4285b6c..44054cd8`) for every file but one. The exception, `docs/sessions/2026-10.md`, differs only in where a blank line sits in the diff. Its text is unchanged.
- **The session archive is intact.** Main's new `claude-cmd-launch` entry is whole at the top, followed by the profile-commands entry, then the lane's entry, then the Windows-tests entry. Each section has one blank line between it and the next.
- **The generated maps match the merged tree.** `docs/code-map.md` and `docs/requirements-tree.md` differ from main only in the lane's own `apps/bench` lines.
- **Checks on the merged tip all pass:**
  - `npm run map:check`: 0 problems.
  - `npm run readme:check`: 0 problems.
  - `requirements-tree.mjs --check`: 0 problems, 2421 rows, 43 features.
  - `requirements-trace.mjs`: exit 0.
  - `known-bugs.mjs --root .`: clean.
  - `nana-writing HANDOFF.md`: nothing over the limit, no banned words.
  - `anatomy-labels.test.mjs`: 30/30.
  - `anatomy.test.mjs`: 9/9.
  - Main's `claude-launch.test.mjs`: exit 0.
  - The working tree stayed clean afterwards.
- **No listed harm.** The merge changes no behaviour, writes nothing outside the worktree, and leaves no install or hook broken.

**NOTEs** (not MUSTs):

- **NOTE:** The lane folder's `tree-movement.md` still says `ac20e30..fb9e41c`, not the post-merge `d4285b6..fa42dde`. It names the same 9 FEAT-042 rows, so only the revision label is stale. `review-ledger keep` should rewrite it before the final round.
- **NOTE:** The lane's session entry sits below the profile-commands entry. When it lands, it will be newer than both 2026-11-01 entries above it, so newest-first order would put it on top. This order was already there before the merge and was accepted in round 2.

VERDICT: LAND
