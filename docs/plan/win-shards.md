# Plan: win-shards

Feature: FEAT-008 · Integrate and clean up reviewed changes

## Purpose

The owner, 2026-11-07: "Start now" (the seat's proposal to split the Windows suite across parallel jobs). Each CI run waits about 30 minutes on the Windows suite leg (1,790–1,860 s at 4 jobs on 2026-11-07), while macOS and Linux finish in about 15. Splitting the Windows suite into parallel shards should bring a CI run to about 12–15 minutes, with every test file still run once on Windows.

## Assumptions

- A1. `scripts/test.mjs` gains a shard option (for example `--shard=i/N`) that picks a stable, disjoint subset of the collected files; the union of all shards is exactly the full file list, and RUN_ALONE files stay alone within their shard.
- A2. CI runs the Windows suite as N shard jobs (N chosen from the 2026-11-07 timings so the slowest shard is near the macOS leg; record the provenance). macOS and Linux stay unsharded unless that is simpler.
- A3. nana-land and the main CI check, which read each CI run's suite records, treat a sharded Windows leg as one leg: it passes only when every shard passed, and its record sums the shards. A missing or failed shard is a failure.
- A4. The per-OS suite-record artifact name changes to carry the shard; the land and main-CI readers accept both the old single-record name and the new shard names, so earlier runs still read.
- A5. One reviewer plus CI. This touches the land tool's CI reading, so the local macOS install check runs before the land.

## Open choices

- O1. Builder picks the file-to-shard assignment rule (hash of path, or balanced by recorded runtime with a stable fallback).

## Questions for the owner

None.

## Threat model

Honest variation in runner speed, job ordering and partial job failure. Forgery out.

## Precedent

- `scripts/test.mjs`: the `--jobs` option's argument handling and refusal shape.
- `.github/workflows/ci.yml`: the suite matrix and the suite-record upload.
- `packages/nana-pack/lib/land-ci-records.mjs`: how land reads suite records per OS.
- `packages/nana-pack/bin/nana-main-ci.mjs`: the main CI check's job reading.

## Outside precedent

none recorded yet: the builder checks how one common Node test runner splits work (for example Jest's `--shard`) and notes adopt, borrow or skip.

## Must-meet

- M1 (disjoint, complete shards). For N in 1..4 and the repo's real file list, the shards' file sets are disjoint and their union equals the unsharded list; the same inputs give the same assignment on every OS.
- M2 (bad argument). `--shard=0/3`, `--shard=4/3`, `--shard=a/b` and a shard with `--self-test` are refused before any file runs, with a message, the way `--jobs` refuses.
- M3 (CI shape). The workflow runs the Windows suite as N shard jobs and macOS and Linux as before; every shard uploads its own suite record.
- M4 (land reads shards). nana-land's CI check accepts a run whose Windows shards all passed, and refuses a run where any shard failed, was cancelled or is missing; the main CI check reports the same.
- M5 (old runs). Records from runs before this lane (one Windows record) still read in nana-land and the main CI check.
- M6 (wall time). On this lane's own CI run, the slowest Windows shard finishes in under 20 minutes; the build report records each shard's time.
- M7 (adversary 1: release gate). With each Windows shard failed, cancelled and skipped in turn, the workflow's release job is blocked; with all shards passing it may run. Linux stays advisory.
- M8 (adversary 2: partial re-runs). Shard A passes in attempt 1, shard B fails then passes in attempt 2: nana-land and the main CI check accept, counting each file once. With B's outcomes reversed, or B's attempt-2 record missing, neither reports a pass.
- M9 (adversary 3: real execution). Timestamp-writing fixtures through the real sharded runner with `--jobs=2`, including a RUN_ALONE fixture: every assigned file runs exactly once, no unassigned file runs, ordinary files overlap, nothing overlaps a RUN_ALONE file; also on native Windows in CI.
