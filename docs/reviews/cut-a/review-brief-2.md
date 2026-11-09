Feature: FEAT-007 · Review a specific revision independently

# Review brief 2: Cut A (confirmation)

Round 1 sent back 294cb71b on two MUSTs (build-records and ci-records tests still ran deleted scripts), two SHOULDs and five NOTEs. Review only the change since: `git diff 294cb71b 8d6a10a5` (six commits), plus the merge of main `b5d6349a`, which brings the landed helper-start lane and should add nothing else (`git diff --name-only main HEAD` equals `git diff --name-only main...HEAD`; the seat checked it).

- `b634d576`, `39373b1a`: the two MUSTs — both tests now call the libraries; R-2602, R-3761 and the five ci-records rows stay implemented.
- `1104b058`: R-2725 and R-2608 moved onto libraries and back to implemented.
- `b736a94c`: the builder preamble no longer lists the component audit.
- `2bd7386c`: the NOTE leftovers (unread pi-worker runs and sampler in brief-check.test, the orphan frontier fixture, stale comments, four known-bug lines).
- `8d6a10a5`: the builder ran every test file that names a deleted path, each alone: 15 files, all exit 0 (`docs/reviews/cut-a/build-3-checks.md`).

Seat re-ran on b5d6349a: trace, tree, map and README checks, and the build-records, ci-records and frontier-summary tests — all exit 0.

Question: does each commit close its finding without a new problem, and does any test file still call a deleted path?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
