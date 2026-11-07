Feature: FEAT-016 · Start the local development desk

# Review brief 3: desk-page-retire — confirmation round

Confirmation round on the fix for Windows CI run 42403415976 (`taskkill` exit 128 when the host had already exited, the race round 1 noted). Round 2 said LAND on b4d13495. Review only `git diff b4d13495..HEAD`: commit 3ed15084 (a shared stop helper that treats an already-gone process as stopped and still fails if it stays alive, now used by three desk test files) plus this brief. Report: `docs/reviews/desk-page-retire-ci/stop-server-report.md`.

Question: does the fix stop every child on Windows and macOS without hiding a process that stays alive? Threat model and bar as in round 1.
