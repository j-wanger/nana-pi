# Builder credentials — merge build 2

Feature: FEAT-002 · Resume decisions and next actions

## Changes and preservation

Merged origin/main at 5bb48872 into feat/builder-credentials, starting at b344d148.
The only conflict was the session archive's first insertion point. Both entries remain whole, newest first.
The preservation check confirms the merged archive equals main plus exactly the original lane entry.
Every unrelated tracked file matches origin/main, including main's deletions.
The preamble and worker-lane test remain byte-identical to the pre-merge lane tip.
R-3650 remains unchanged beside R-2510. No new rows, tests, tunables or behavior changes.
The code map and requirements tree were regenerated, not hand-merged. The code map matches main.
No README changes were needed; any existing lane README changes would have been preserved.

## Review notes

Added exactly three authorized FEAT-002 known-bug lines, all marked `(builder-credentials, review round 1)`:
stored-credential wording versus authenticated push/PR commands, literal plain-push wording without an upstream, and R-3650's numeric order.
No known bug was fixed. No other known-bug file differs from main.
Precedent departures: none. The existing session entry remains unchanged; no new session entry was added.
Existing tests edited in this build: none.

## Verification

All commands exited 0 unless stated otherwise. Sibling merge logs contain the full output, with worktree paths replaced by `<worktree>`.

- `npm run map`
- `npm run req:tree`
- `node packages/nana-pack/tests/worker-lane.test.mjs`
- `node packages/nana-pack/tests/worker-claude.test.mjs`
- `node packages/nana-pack/tests/templates-render.test.mjs`
- `npm run map:check`
- `npm run readme:check`
- `node scripts/requirements-trace.mjs`
- `node scripts/requirements-tree.mjs --root .`
- `node scripts/requirements-tree.mjs --check`
- `node scripts/known-bugs.mjs --root .`
- `node scripts/lane-class.mjs --root .`
- Preservation assertions: unrelated paths match main; session archive is main plus the whole lane entry; lane preamble and test unchanged.
- `git diff --check`

The initial preservation assertion exited 1 because its expected string inserted an extra blank line. Correcting that verification string passed without changing any repository content.
`git merge --no-commit origin/main` exited 1 for the documented session conflict; it was resolved by retaining both entries.

No new mutation pairs apply to a behavior-preserving merge. Build 1's unchanged R-3650 wrong-code pair remains in `wrong-code-first.log` (exit 1) and `worker-lane.log` (exit 0).

The required checks are repeated on the final commit before push. Identity scanning runs after staging the evidence.
CI covers the full suite; the local locked suite is intentionally not run. No CI run is read or awaited.
