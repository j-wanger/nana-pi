# Builder-stop checks

## Project rail (R-3996)

`npm run check:lane` runs `scripts/check-lane.mjs` from the worktree root.
The ordered list lives only in that script, with lost-round comments. Each check
runs separately through Node; test groups use the canonical isolated test runner.
The first nonzero check ends the rail with `check:lane: fail: <check>` and exit 1.
A spawn error or signal produces `check:lane: error: <check>` and exit 2.
Success prints `check:lane: pass`. This rail supplements, not replaces, CI.

## Replay validation

Each revision was checked in a detached temporary git worktree outside the repository.
Only the new runner was copied, outside the mapped roots, and run with that worktree
as cwd. No historical package script, README or map was changed: injecting the new
command there would itself create undocumented-script and stale-map failures.
Each checkout was removed through `git worktree remove` after the run.

| Revision | Exit | First failing check |
|---|---|---|
| 5f317d5b | 1 | test-packs |
| 95138872 | 1 | requirements-tree --check |
| 0b576c7c | 1 | requirements-cap-kinds |
| dbe250c0 | 1 | code-map-launch |
| 4f103106 | 1 | readme-check |
| 9b04f14a | 1 | test-runner |
| 97b6dd02 | 0 | none |
| 2daaed41 | 0 | none |
| main (0fbad954) | 0 | none |

The cut-a replay stops at its lost edge; the later deliverables check stays in the rail.
Raw command output remains outside the repository under `$TMPDIR`.
