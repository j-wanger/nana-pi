Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 1: win-shards

Review the whole lane, excluding what the merge of main brought in (already reviewed and landed): the lane's commits 1e030ecd (shards) and 837b2d85 (Windows on main only), and the merge 6bf20e5f's conflict resolution. Plan: `docs/plan/win-shards.md` (M1–M9); build 2 brief added M10–M13 (rows R-3824–R-3827): pull requests skip Windows; nana-land waits only for non-Windows legs on a lane tip; a red or missing leg on main's newest push run, Windows included, blocks lands; release still needs every leg. Reports: `docs/reviews/win-shards-2026-11-07/`.

The owner (2026-11-07): "Main only" — no lane waits for Windows before landing; Windows runs on main after each land; a red main blocks further lands. Windows testing stays required (ruling 2026-10-10). The shards cut main's Windows wait.

Threat model: honest variation in runner speed, job ordering, partial failures and re-runs; forgery out. One reviewer plus CI. This lane changes the CI workflow and the land tool's CI reading. Its own pull-request CI run has no Windows legs by design; M6's wall time is measured on main after the land.

Question: does the feature work for its user (the seat landing lanes, and main's Windows coverage), and does the change cause a harm the review standard lists? Pay attention to: every test file running exactly once across shards (RUN_ALONE kept); a failed, cancelled, skipped or missing shard never reading as a pass, including partial re-runs; release gated on all legs; nana-land refusing on a red main; old single-record runs; the ruling and the AGENTS/shared-pattern text matching.
