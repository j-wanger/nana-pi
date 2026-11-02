Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook (`packages/nana-knowledge/lib/db.ts`, read by the UserPromptSubmit knowledge hook). Threat model: honest variation in our tools' output is in scope (SQLite contention from another connection opening, reading or closing; a held build lock; a slow or loaded Windows runner; an exclusive lock held for seconds); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/knowledge-busy`. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`, a pi adversary's attack). The builds ran on the Windows laptop (`build-brief-1.md` to `build-brief-3.md` and their reports). Evidence: `hook-churn-probe.*` (main 15/20 pulls and rebuilds under churn; this lane 20/20), `m5-win32.txt`, `install-check-win32.txt`, the seat's wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-win32.txt` 8/8 red; `seat-mutate-darwin.txt` on macOS), and `seat-install-check.txt` (macOS install check, exit 0). Pull request #319.

The change: `openDb` runs `PRAGMA busy_timeout` first — `BUILD_BUSY_TIMEOUT_MS` (5000) for build opens, `QUERY_BUSY_TIMEOUT_MS` (100) for query opens — so the background index build and the hook's own query wait briefly instead of failing at once with "database is locked"; recovery keeps its explicit 0. R-3590 to R-3594; R-2403 amended to "for longer than BUILD_BUSY_TIMEOUT_MS".

Question: does the feature work for its user, a seat whose every prompt gets the knowledge pull and whose stale index gets rebuilt, including on a busy Windows machine; check especially that the hook still finishes inside its time budget under a long exclusive lock, that recovery still fails fast, that the build never waits forever, and that nothing on the hook path can now block a prompt; and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
