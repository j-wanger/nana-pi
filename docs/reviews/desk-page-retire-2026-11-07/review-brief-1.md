Feature: FEAT-016 · Start the local development desk

# Review brief 1: desk-page-retire

Review the whole lane: `git diff 89afbe55..HEAD` on branch feat/desk-page-retire. Plan: `docs/plan/desk-page-retire.md`. Builder reports: `docs/reviews/desk-page-retire-2026-11-07/builder-report.md` and `docs/reviews/desk-page-retire-ci/report.md`.

The owner (2026-11-07) chose to cut the desk page (1 open since 2026-10-09, frozen since 2026-10-10) and keep the app host, which ran the basketball app on 2026-11-05. The desk process and its launchd service stay and serve the app host.

Threat model: honest variation in local requests, manifests and Windows paths; every remaining listener must keep the Origin and Host rules. Deliberate attack beyond those rules is out. One reviewer plus CI (owner, 2026-11-07).

Known and accepted by the seat: seven shared transport rows (R-419, R-420, R-429, R-430, R-431, R-460, R-461) are now marked untested because their old harnesses used removed routes; the code stays. Judge whether any of them is a behaviour the app host depends on that now has no test at all.

Local macOS install check passed on 44814256. CI runs on this tip.

Question: does the feature work for its user (someone opening an app from a manifest), and does the change cause a harm the review standard lists? Pay attention to: the app listener, stage page assets, signed-block history across restart, the Origin/Host rules, the desk service, Windows teardown, and rows retired vs left pointing at deleted files.
