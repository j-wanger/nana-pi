Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: ci-flakes

Review the whole lane: `git diff ae1f14f9..HEAD` on branch feat/ci-flakes. Plan: `docs/plan/ci-flakes.md` (M1–M7). Builder report: `docs/reviews/ci-flakes-2026-11-07/build-report.md`.

On 2026-11-07 four CI attempts failed only on tests that then passed on re-run (context-anatomy R-3727 and R-3732 on Windows, worker-lane R-2883 on macOS), and templates-update's Python earlier-tag cases failed on Windows for a real cause (generation used python3 while pytest used uvx). The owner said "Start now" on fixing them.

Threat model: honest variation in runner speed and load; forgery out. One reviewer plus CI.

Question: does each changed case now pass or fail on the behaviour its requirement pins, not on runner speed, and did any case lose its proof (a deadline, a kill, a stale-map failure) in the process? Pay attention to sealed margins and their provenance, and to anything the fix weakens on macOS or Linux.
