1. **MUST 2 — FIXED:** `packages/nana-pack/lib/objective.ts:327` matches pi’s strict 10-second staleness comparison; `:432` rejects held locks even with recorded `true`. T17 covers fresh/future/stale locks, both record states, pi operations and runtime parity.
2. **NEW — nonblocking wording defect:** `objective.ts:517` cannot establish “another pi process” or promise its eventual cleanup. Not acceptable as a factual assertion; acceptable to carry because the label remains conservative and removal is explicitly forbidden. Prefer “pi treats this lock as held; it may belong to a running pi,” with conditional cleanup/retry advice.
3. **Comparison limit:** `objective.ts:304` overclaims monotonicity: wall-clock rollback or an intervening lock update can invalidate staleness. The comparison itself is correct; retain snapshot/pre-check limitations, not a guarantee.
4. README and `AGENTS.md` now correctly reject fresh/future empty locks. Seat reports 4,457 passing checks; I inspected source/tests, not reran them.

SCORE: 9/10
MUST: []
CARRY: Broken `trust.json` symlink diagnosis; writability/staleness pre-checks are not proof; Claude-hook relative-override cwd resolution; qualify lock-holder/cleanup wording and matching docs; separate urgent `packages/nana-pack/lib/config.ts:276` deny-policy fix.
VERDICT: LAND
