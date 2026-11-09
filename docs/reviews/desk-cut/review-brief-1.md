Feature: FEAT-016 · Start the local development desk
Card: fix

# Review brief 1: desk-cut

Review only this lane's own commits: `git diff 43861f0d..HEAD -- . ':!docs/reviews/waking'` on branch feat/desk-cut, where `43861f0d` is the approved priority-lock tip it started from (now on main), and `fa6fba77` merges current main (one review brief file).

The owner, 2026-11-09: "Ok cut the desk". The lane removes `apps/desk` (the local app host) and `packages/nana-stage` (the staged-block layer), nana-setup's optional desk launchd service, first-look's desk mode, the frozen-desk identity entries, and their rows, configs and prose: 111 files, about 7,400 lines net. It retires 107 requirement rows (IDs kept), freezes eight features and retires five artifacts. The seat stopped the live desk service on this Mac before the build. The cut card the builder followed is the brief at its first build; the seat then removed the last desk lines from HANDOFF and two known-bug files (`2275f3e4`).

Questions:
- Does anything that stays on main still need a deleted file, export or flag: a live module, a test, CI, a README claim, the installer, uninstall, doctor, or a template that ships to other projects? Check Windows paths too: a Windows-only test that names a deleted producer turns main red after the land.
- Was anything shared deleted that other code still uses (`agent-dir.mjs`, the process-tree and runner configs, `/reload-runtime`, `DESK_PI_ROOT`, the Node floor value, `walkUpToPackage`)?
- Are the retired rows exactly the desk and stage rows, with every surviving row still traced to a surviving test?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
