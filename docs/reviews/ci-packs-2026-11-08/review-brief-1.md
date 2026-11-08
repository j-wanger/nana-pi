Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: ci-packs

Review the whole lane: `git diff main...HEAD` on branch feat/ci-packs. Plan: `docs/plan/ci-packs.md` (M1–M10), with design files in `docs/plan/ci-packs/`. Builder reports: `docs/reviews/ci-packs/report.md` and `docs/reviews/ci-packs/build2/report.md`. Measured: land pack 49.7 s wall at four jobs on macOS (71 files, 2,445 checks), against 768 s for today's whole suite.

Question: after this lane, can a regression still land unseen? Check that every collected test file is in exactly one pack; that a main push runs every file except release and manual (retire included); that a lane's module selection reaches every file its diff can break, and falls back to the whole module pack when it cannot tell; that each core capability keeps a land-pack guard; that nana-land, the main CI check and the CI waiter accept real pack-run records (macOS and Windows shards) and refuse incomplete or failed ones; that the locked local runner keeps one machine lock for pack runs; and that main and Windows behave as before. No test was deleted; moved cases keep their markers and assertions.

Threat model: honest variation in lane diffs, the code map's reach, runner speed and platforms. Forged suite records are out.
