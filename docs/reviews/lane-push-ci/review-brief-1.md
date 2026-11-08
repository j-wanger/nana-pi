Feature: FEAT-008 · Integrate and clean up reviewed changes
Serves: roadmap step 1 (finish the CI lanes, then stop): lanes get CI on their own tip when only generated files conflict, and run their selected tests on Windows before landing, which ends the red-main loop.

# Review brief 1: lane-push-ci

Review the whole lane: `git diff main...HEAD`. Plan: `docs/plan/lane-push-ci.md` (M1–M9, R-3935–R-3944); M9 is the seat's Windows-selected-tests addition, and M8 was amended to match it. Builder evidence: `docs/evidence/lane-push-ci/report.md`. Builder choices: O1, feature-branch pushes own CI and same-repository feature PR jobs skip; O2, `ci-wait` fetches main and reuses the land merge-tree helper. The seat merged current main before this round.

Questions: does every PR kind (same-repo feature, same-repo non-feature, fork) still get exactly one executed macOS suite and the install checks? Does the Windows job run only the lane's selection, and nothing when the selection is empty? Can a lane land on a push run for a tip other than the reviewed one, or on a skipped PR run read as success? Do main pushes still run the full Windows shards and install checks? This tip's own CI is the proof for the workflow; read it. Threat model: honest GitHub event, mergeability and timing variation; forgery out.
