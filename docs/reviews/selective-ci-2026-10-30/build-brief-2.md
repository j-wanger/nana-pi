Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane selective-ci. Class: gate. Builder: pi-worker (larger lane). Build session 2, continuing build 1's uncommitted work in this worktree.

Build 1 stopped BLOCKED on the seat's wording. "Do not touch the code map" meant: do not change the code map's code (`scripts/code-map.mjs`, `scripts/code-map-launch.mjs`, `code-map.config.json`) or export `linkRepo`. It did not forbid the generated map. Regenerate `docs/code-map.md` with `node scripts/code-map.mjs --write` so the three new modules get their entries, and fix any header the map check names.

The local install check's `pi post-edit` failure was a one-off: the seat re-ran `node packages/nana-setup/bin/install-check.mjs` in this worktree and on main and both passed every step. Re-run it once at the end; if `pi post-edit` fails again, re-run it once more and report both outputs.

Then finish build brief 1 as written (`docs/reviews/selective-ci-2026-10-30/build-brief-1.md`): locked full suite green in the foreground, the Done-when checks, commit with explicit paths, push, and report the finished CI run for the new tip naming the Windows suite leg (rerun a Windows R-3104 timeout once). Keep the builder outputs you wrote in the lane folder and commit them.

Report: every row and test changed; each wrong-code pair and its exit codes; each departure from the Precedent.

## Precedent

- `packages/nana-pack/bin/nana-issue-watch.mjs`: the shape of a seat-side command.
- `packages/nana-pack/lib/ci-records.mjs`: the CI record reader.
- `packages/nana-pack/lib/frontier-summary.mjs`: the session-start block.
- `packages/nana-pack/lib/lane-class-config.mjs`: the gate list.
