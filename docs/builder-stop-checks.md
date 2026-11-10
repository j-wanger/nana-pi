# Builder-stop checks

## Project rail (R-3996)

`npm run check:lane` runs `scripts/check-lane.mjs` from the worktree root.
The ordered list lives only in that script, with lost-round comments. Each check
runs separately through Node; test groups use the canonical isolated test runner.
The first nonzero check ends the rail with `check:lane: fail: <check>` and exit 1.
A spawn error or signal produces `check:lane: error: <check>` and exit 2.
Success prints `check:lane: pass`. This rail supplements, not replaces, CI.

## Worker lifecycle (R-3997, R-3998)

The worker runs the rail only after a successful lane attempt and before writing
its end record, beside the existing post-build leak scan. Plain workers, role
workers, failed attempts and trees without a script keep their old behaviour.
The shared bounded-spawn relay supplies process-tree deadline and output bounds;
the existing Windows command resolver launches npm without a new shell mechanism.
The same credential-stripped child environment is inherited by npm and git.

A pass retains success; a failure or crash ends the build with exit 1 and the
bounded failing tail appended to its report. The optional `laneChecks` end field
and prefixed stderr lines are described in the pack README. A named failure
triggers a temporary detached starting-commit checkout: only the same named failure
there earns `red-on-base`. There is no dependency installation in that checkout.
Cleanup failures are report data; the lane's checkout and branch never move.

No automatic builder resume ships here. The lane prohibits starting model sessions,
so its requested finished print-session resume probe could not be performed.
The watchdog's explicit attempt session file and its callers remain unchanged.
Resume support needs that probe first; no alternate resume mechanism was built.
This is the permitted run-and-report fallback, not evidence that resume needs
anything beyond the existing session-file path.

The new suite tests exercise fake lane builders and tiny fixture-owned npm scripts,
never the repository rail, a seat script or a real model. They cover pass, absence,
named failure, base-red, runner crash, deadline and diagnostic line endings.

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
