Feature: FEAT-031 · Run checks reliably and without contaminating work
Card: fix
Serves: roadmap step 1 (finish the CI lanes): restores main green after the ci-packs land.

# Review brief 1: packs-win-skip

Main's Windows run 42529779897 failed `agent-dir-hostile.test.mjs`: after ci-packs moved its symlink cases out, only section C remains, and it skips itself on win32, so the file passed nothing. Review `git diff main...HEAD`: a whole-file Windows skip declaration, removal of the unused symlink probe, an update to R-1383's inventory assertion, and the builder's sweep of all 24 moved-from and moved-to files (`docs/reviews/packs-win-skip/report.md`).

Questions: is the skip reason true (section C cannot run on Windows), and does no other check in that file lose Windows coverage? Is the R-1383 change a real contract change or a loosening that hides something? Does the sweep's "only this file" verdict hold? Threat model: honest platform variation; forgery out.
