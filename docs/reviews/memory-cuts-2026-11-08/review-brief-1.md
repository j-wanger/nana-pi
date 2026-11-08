Feature: FEAT-043 · Measure memory outcomes

# Review brief 1: memory-cuts

Review the whole lane: `git diff $(git merge-base main HEAD)..HEAD` on branch feat/memory-cuts. Plan: `docs/plan/memory-cuts.md` (M1–M8). Builder report: `docs/reviews/memory-cuts-2026-11-08/build-report.md`. The branch still needs a merge of current main; that merge gets its own confirmation round.

Question: after this lane, does knowledge search still work while no session receives an automatic knowledge pull; does no land or session end start a memory run while the manual memory command still works; are the finished experiment tools gone with their rows retired; and do install, doctor, uninstall (including on a machine set up before this lane), the install check's other judges, adoption and new projects still work? Check that no test of surviving code was deleted rather than moved.

Threat model: honest variation in machines' installed state (old settings, old hook wiring, existing indexes and memory stores). Forgery out.
