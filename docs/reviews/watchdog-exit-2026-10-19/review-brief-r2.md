# Review — watchdog-exit, confirmation round 2, 2026-10-19 (Opus final reviewer and Fable land reviewer)

Review `git diff 16a8b0b..HEAD` on `feat/watchdog-exit` (main is `4be0b79`; `git merge-base HEAD main` is `4be0b79`).

Round 1 said LAND on `16a8b0b` from both reviewers. Since then `eba2ac2` merges main `4be0b79` (win-objective-golden, win-review-paths, tree-briefs, linux-lane-guard, roster-set, readme-check-cp1252, win-leg-blocking). Conflicts resolved: the R-291 leaf total (now 1,248), `docs/requirements-tree.md` and `docs/code-map.md` regenerated; HANDOFF and the session file kept both sides. `bin/pi-watchdog.mjs` merged without a conflict; main's win-review-paths changed the review tools around it. The lane's own code and tests are unchanged since round 1.

The seat ran on the merged tip: watchdog-exit.test.mjs 6 pass, and the three requirement tests pass.

Threat model: honest variation in our tools' output and the OS in scope; deliberate forgery out. Lane class: gate (pi-watchdog behind pi-review and pi-worker).

Check: (1) the merge kept both sides' text and lost nothing from the lane's change; (2) main's review-tool changes since round 1 (win-review-paths: real-path keys, `--poll` use in path-spelling) still fit the watchdog's new exit wait; (3) any MUST.
