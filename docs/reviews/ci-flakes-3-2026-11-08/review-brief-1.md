Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: ci-flakes-3

Review the whole lane: `git diff main...HEAD` (includes a clean merge of main). Plan: `docs/plan/ci-flakes-3.md` (M1–M6). Evidence: `docs/plan/ci-flakes-3/evidence.md`. The builder made R-2694 wait for read-specific readiness before SIGTERM. It retired build-busy M2 (R-3591), with a caller search showing the stale hook pull has no runtime caller after memory-cuts.

Question: does R-2694 still prove pi-worker ends on SIGTERM during each hanging start-up read, without timing luck? Is M2's retirement right, with no live product path left untested, and no budget widened? Only one of the two R-2694 failure logs was exported, by the seat's mistake. Judge attribution on the one available. Threat model: honest runner and signal timing; forgery out.
