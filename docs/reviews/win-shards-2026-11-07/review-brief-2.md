Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 2: win-shards — confirmation round

Confirmation round on the fix for round 1's MUST. Review only `git diff eb94c5a3..HEAD`: commit c4d70c6b (a shard counts as carried over when its job started before that shard's newest record, whatever attempt number it reports; the M8 fixture now uses GitHub's real shape; the Windows wall-time bound is report-only) plus this brief. Report: `docs/reviews/win-shards-2026-11-07/build3-report.md`.

Question: does a successful partial re-run on main now read green, while a shard whose newest record is missing or failed still reads red? Threat model and bar as in round 1.
