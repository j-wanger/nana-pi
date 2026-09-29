# Review brief — lane T2c round 3 of 3 (gpt-5.6-sol), FINAL. After this the seat lands with residuals or implements; no further sol round.

Your r2 (`t2c-sol-r2.md`) confirmed the three r1 findings fixed and BLOCKed on one HIGH: the remediation promised `/trust` unconditionally, while the label also fires for unusable trust stores — and you reproduced that pi's own `/trust` throws on a malformed store rather than repairing it. Fix commit `2fc8e07` (`t2c-worker-r4.md`). Worktree `~/nana-pi-wt/t2c`; clean diff vs main `t2c-r4.patch`.

**The fix.** A new `trustRecord(dir)` returns whether the owner vouched, the store path and a reason; `ownerVouched` wraps it, so the DECISION is unchanged. Line 2 now has two forms:
- no affirmative record, store usable (unchanged): `start pi in <folder> itself (not a subfolder), run /trust there, then restart the session.`
- store unusable: `the trust store <store> is unusable (<reason>), so /trust alone will not reliably clear this label (it errors on a malformed store) — repair or remove that file first (removing it forgets every saved trust decision), then start pi in <folder> itself (not a subfolder), run /trust there, and restart the session.`
Reasons emitted: `malformed` (bad JSON, an array, a bad value), `not a regular file` (directory, FIFO), `too large` (>1 MiB), `unreadable` (mode 000), `owned by another user`. Your reproduction is now a golden check ("pi's /trust path throws (getEntry) and cannot repair it (setMany)"). The worker proved the new checks can fail: forcing the old unconditional text back failed 15 checks, 8 of them the new "never /trust alone" ones.

Seat-verified: `npm test` → 71 files, 3976 checks, exit 0; a malformed store in a temp HOME emits the second form naming the real store path and `(malformed)`.

**Judge, ≤30 lines.** This lane has produced a "the stated remedy is false" finding at every round, so spend your budget looking for the next one rather than re-confirming the last:
1. The r2 HIGH: FIXED / PARTIAL / NOT FIXED with the line.
2. **Is either remediation false for any case a real owner reaches?** The worker names two it doubts: removing a foreign-owned store may exceed the owner's rights, and it did not test what pi does with a >1 MiB store after rewriting it. Also consider: `~/.pi/agent` itself unwritable or missing; a store on a read-only volume; a store that becomes valid between our read and the owner's `/trust`; the owner following "remove that file" and thereby forgetting every other trust decision (is that consequence stated clearly enough?).
3. Two grouped reasons the worker declares: `~/.pi/agent` being a file shows as `unreadable`, and valid-JSON-wrong-shape shows as `malformed`. Acceptable or misleading?
4. Any NEW defect from `trustRecord`, the reason strings, or the surface rewordings (`AGENTS.md`, the pack README, `working-under-nana-pi.md`, `templates/_shared/OBJECTIVE.md`, `project.mjs:309`).
5. Your CARRY list for the astra land ruling, each priced by cost of error, and your call on whether the deferred `nana-setup trust <dir>` should stay a follow-up.
End with `VERDICT: LAND` or `VERDICT: BLOCK`.
