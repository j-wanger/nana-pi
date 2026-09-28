1. **#13 worker predicate — FIXED.** Worker accepts exit 0 + non-empty output without review shape and defaults to zero retries (`pi-worker.mjs:19,30-38`; `pi-watchdog.mjs:68-70,103-116`).
2. **#10 fail-open git — FIXED.** Unexpected Git failures throw with diagnostics; only “not a git repository” falls back (`review-round.mjs:116-142`).
3. **#11 snapshot identity — FIXED.** Raw content, modes, symlinks, untracked files, and recursive submodules are hashed without rendered diffs (`review-round.mjs:156-216`).
4. **#12 completion check — FIXED.** Drift produces an unverified tally/audit record, refuses the verdict, and consumes the admitted revision (`review-round.mjs:457-498`).
5. **#15 heartbeat — FIXED.** Reclamation uses owner liveness and renewal age; launchers renew until completion (`review-round.mjs:330-334,505-523`; `review-ledger.mjs:38-47`).

**Clean-definition ruling: KEEP RAW-BYTE IDENTITY.** A review identity should represent bytes the reviewer could observe, not Git’s normalized equivalence. Filters, LFS, and EOL conversion can produce materially different reviewed trees; distinguishing those states is correct even when a fresh checkout does not receive the bare-HEAD identity.

**Output-in-tree ruling: WARN, with one refusal case.** Warn whenever `--out` is inside the reviewed tree and recommend an external or ignored location. Refuse when it resolves to a tracked path, because excluding that path can mask its overwrite. Previous outputs do **not** grant unlimited rounds: they can waste distinct-revision slots, but the permanent per-item cap still stops after three.

**NEW MED:** Completion has a TOCTOU window: revision is derived before acquiring the ledger lock (`review-round.mjs:469-471`), so an edit while waiting can still receive a valid verdict. Move the final derivation inside the lock, immediately before recording; cost of error is false validation under concurrent writes.

**NEW LOW:** Explicit `pi-review --retries N` now performs one additional attempt versus the old contract. No production call site in this repository supplies it, but external callers change silently; add a migration/release warning.

**CARRY for astra:**
- MED — close completion’s pre-lock TOCTOU; false-valid verdict risk.
- MED — refuse tracked `--out`; masked mutation/data-loss risk.
- LOW — warn for other in-tree outputs; accidental round consumption.
- LOW — announce changed explicit retry semantics; unexpected extra invocation.

Targeted `review-ledger.test.mjs` passes completely.

VERDICT: LAND
