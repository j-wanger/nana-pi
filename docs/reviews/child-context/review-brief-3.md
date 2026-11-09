Feature: FEAT-013 · Install and connect harness runtimes

# Review brief 3: child-context (confirmation round)

Round 2 accepted tip 4deebf7e50f3ed1434aece5ed46c490d5ae7edb4. Since then the seat added only merges of main: 8d84f60f f2e3ce47 (newest first). Main brought records-move, memory-sort, a one-test fix and lane-push-ci.

Review only those merges. Each conflicted only in `docs/code-map.md`; the seat took main's side and rebuilt it with `npm run map`.

Check:
- `git diff main...HEAD` carries the same lane change round 2 accepted, apart from regenerated code-map lines and context from main.
- Nothing from main was dropped or reverted by the merges.
- `npm run -s map:check` passes at the tip.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
