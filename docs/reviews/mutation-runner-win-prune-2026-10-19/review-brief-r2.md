# Review round 2 — mutation-runner-win-prune, 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-031 · the seat mutation runner. Class: ordinary. Threat model as round 1: honest variation in our tools' output, the OS and shards running git on one repository at once in scope; deliberate forgery out.

Round 1 (yours) on `f864d4d0`: SEND-BACK with M1 (R-1775's check passed with neither call site taking the lock) and M2 (the lock was not mutually exclusive: an empty-file gap let a waiter treat a live lock as stale; 63 of 2,400 acquisitions overlapped), plus S1 to S4. This round reviews `git diff f864d4d0..HEAD` on `feat/mutation-runner-win-prune`:

- `67b35afa` build brief 3 (your findings, verbatim in substance).
- `79f6b0b9` build 3 (a pi gpt-5.6-sol builder): atomic lock publication by hard-linking a complete temp file; removal only while the lock still holds the content read; an unreadable lock counts as held for up to 30,000 ms (sealed, R-1777); cleanup failures recorded instead of swallowed; R-1775 narrowed to one runner run and its check now drives a real shard's add and removal; new R-1776 (8 children, 2,400 acquisitions, exclusive marker, no overlap); T1's three-shard case has its own value. Builder: the old lock, a non-atomic publication and an unconditional removal each fail a check; skipping either call site's lock fails R-1775; the file passed 36/36 three runs in a row.
- `2012dc23` the seat's record of round 1 and build 3; the HANDOFF line no longer claims a bypassed lock fails a check (S4).
- This brief.

Check: (1) M1 is closed — each call site skipping the lock fails R-1775, and the check runs no fake operation in place of the runner; (2) M2 is closed — repeat your contention probe on the new lock, and look for any remaining window (publish, stale detection, release, the 30,000 ms unreadable rule, a holder pid reused); (3) S1 to S3 are settled as the brief asks; (4) nothing main's runner does today stopped working, and the tests stay in temp folders; (5) the rows match their checks; (6) any MUST.

Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
