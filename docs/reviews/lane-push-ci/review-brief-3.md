Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 3: lane-push-ci (confirmation round)

Round 2 accepted tip f5b645864ffff27d77c01c79b3394eb8f2eae488. Since then the seat added two merges of main and nothing else: f6bc58a8 and fb123803. Main brought records-move, memory-sort and a one-test fix.

Review only those merges. The first merge conflicted only in `docs/code-map.md` and `docs/requirements-tree.md`; the seat took main's side and rebuilt both with their own generators (`npm run map`, `node scripts/requirements-tree.mjs --write`). The second merge had no conflict.

Check:
- `git diff main...HEAD` (the lane against current main) carries the same lane change that round 2 accepted in `git diff f5b64586^1...f5b64586` style, apart from regenerated lines in those two generated files and context from main.
- Nothing from main was dropped or reverted by the merges.
- The two generated files match what their generators produce at the tip (`npm run -s map:check`, `node scripts/requirements-tree.mjs --check`).

The CI run for the tip passed (push run 42552073804).

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
