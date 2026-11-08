Feature: FEAT-041 · Shape each agent's context by role

# Review brief 1: ci-flakes-2

Review the whole lane: `git diff 860785c2..HEAD` on branch feat/ci-flakes-2. Plan: `docs/plan/ci-flakes-2.md` (M1–M5). Builder report: `docs/reviews/ci-flakes-2-2026-11-07/build-report.md`.

Question: does each changed test still prove its requirement while no longer failing on Windows runner timing? Check that M1 still fails on a wrong matcher (root matched twice or not at all), that the R-2023 judge rejects a surviving original process and accepts a reused PID, and that no assertion was deleted or margin widened without provenance. Windows runs on main after the land (owner ruling "Main only"); the lane's CI may still run it.

Threat model: honest variation in Windows runner speed, path spellings and process exit timing. Forgery out.
