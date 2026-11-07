Feature: FEAT-034 · Define reproducible comparisons

# Review brief 1: bench-retire

Review the whole lane: `git diff 89afbe55..HEAD` on branch feat/bench-retire. Plan: `docs/plan/bench-retire.md`. Builder report: `docs/reviews/bench-retire-2026-11-07/report.md`.

The owner (2026-11-07) chose to cut the finished benchmark study runners (tool-profile study done 2026-09-08, catch-ledger study 2026-09-28) while keeping the builder-anatomy tools, which serve the current context work. Live helpers (globMatch, parseStream, callJudge, cohensKappa/seededSample, readJsonl) had to move before their files went.

Threat model: honest variation in tool output and Windows paths; forgery out. One reviewer plus CI (owner, 2026-11-07).

CI passed on ecc2ad85 (run 42396098104, attempt 2; attempt 1 failed only the known worker-lane wall-clock timing case on macOS).

Question: does the feature work for its user, and does the change cause a harm the review standard lists? Pay attention to: every live reader of a moved helper (deliverables, product report, memory shaping, anatomy) getting byte-identical behaviour; study records untouched; rows retired rather than left pointing at deleted files; anything still importing a deleted module.
