## Findings

### HIGH

1. **[adversarial · identity] Item identity is neither canonical nor repository-scoped.**  
   `packages/nana-pack/bin/review-round.mjs:70-83,145-147,156-176`  
   Three verdicts for `CaseItem` did not constrain `caseitem`; `scope one` did not constrain `scope  one`. `../item`, `a/b`, `..`, and a 50,000-character slug were accepted. The same slug in two unrelated repositories collided and exhausted the second repository’s allowance. Explicit revisions are also stored raw: `HEAD` and its short SHA became different revisions, while an unresolvable revision was accepted.  
   Canonicalize and bound the slug, include stable repository identity, and resolve explicit Git revisions to a canonical commit where possible. Positive control passed: two worktrees of the same repository resolved to the same short SHA.

2. **[adversarial · count] The role-max formula does not reliably represent a review cycle.**  
   `packages/nana-pack/bin/review-round.mjs:51-63,164-165,190`  
   Ten completed reviews on one revision using ten caller-chosen roles all remained “round 1/3.” Conversely, two legitimate sol reviews of different scopes on the same revision became rounds 1 and 2. A verdict followed by exit 1 consumed nothing and was safely rerunnable, but completed reruns have no idempotency key.  
   Use an explicit cycle/round identifier and deduplicate `{item, revision, cycle, role}` rather than inferring cycles from role cardinality.

3. **[adversarial · A5] `--worker` is a direct free-review bypass and is not acceptable as implemented.**  
   `packages/nana-pack/bin/review-round.mjs:177-180`  
   `packages/nana-pack/bin/pi-review.mjs:126`  
   Five review-shaped `VERDICT: LAND` outputs launched with `--worker` all succeeded while producing five `worker` records and zero verdicts. Audit visibility does not prevent the fourth spend, and the original defect was precisely a launcher/classification bypass. Worker execution needs a separate, constrained contract rather than a caller-controlled exemption on the review command.

4. **[adversarial · ledger] Rotation eventually resets the cap.**  
   `packages/nana-pack/bin/review-round.mjs:126-128,145-146`  
   `packages/nana-pack/README.md:87-89`  
   Counting correctly spanned the current file and `.1` at the first rotation boundary. At the second rotation, `.1` was replaced, the old item’s three verdicts disappeared, and its next review was admitted as round 1. Long slugs or worker records can accelerate this. Keep a compact permanent per-item summary before discarding audit generations.

5. **[scope · compatibility] Replacing the unit test also removed a still-consumed public export and weakened one pure assertion.**  
   `packages/nana-pack/tests/review-round.test.mjs:1-31`  
   `/Users/jwang/nana-agent-loop/app/scripts/review-round.mjs:7`  
   `/Users/jwang/nana-agent-loop/app/tests/review-round.test.ts:4,36-39`  
   After landing, nana-agent-loop’s forwarder will fail module linking because `roundFromOutPath` no longer exists. Separately, `roundCapVerdict(4, "   ")` now returns `override`; wrapper parsing masks this, but the exported function’s former contract was weakened. The replacement correctly pins the new arbitrary-name invariant, and the handoff assertion was not weakened, but the cross-repo API migration is incomplete.

### MEDIUM

6. **[adversarial · reservation] An expired live reservation can later complete without ownership and exceed the cap.**  
   `packages/nana-pack/bin/review-round.mjs:132-138,206-211`  
   I aged a live third-slot reservation beyond 12 hours, admitted a replacement, then completed both. The ledger ended with four verdicts/four rounds without an override. `complete()` must verify and consume the matching reservation under the lock.

7. **[adversarial · ledger] Malformed records fail open.**  
   `packages/nana-pack/bin/review-round.mjs:120-123`  
   A malformed line among valid records is silently skipped. Valid surrounding records still count, but corrupting one genuine verdict grants another review. Ledger corruption should refuse admission with a line diagnostic, not erase history silently.

8. **[adversarial · ledger] The ledger follows symlinks.**  
   `packages/nana-pack/bin/review-round.mjs:126-128`  
   A symlinked `review-ledger.jsonl` caused the verdict JSON to be appended to the target file. Refuse non-regular ledger paths and use no-follow/open validation.

### LOW

9. **[scope · reservation] `check` does temporarily reserve despite documenting that it reserves nothing.**  
   `packages/nana-pack/bin/review-ledger.mjs:26-31`  
   A concurrent real launch can briefly observe that reservation and be refused. This subcommand can be subtracted or implemented as a locked, non-mutating projection.

## Scope ruling

The custom lock and reservation are justified by the atomicity requirement, but the overrun was not merely mechanical: identity, counting, rotation, and reservation ownership need redesign. Keep the lock/reservation concept; remove live-lock stale takeover where possible, validate completion ownership, compact rotation state, and make `check` non-mutating.

## Compatibility inventory

- `~/nana-agent-loop/app/scripts/pi-review.mjs`: forwards argv unchanged; after landing, old invocations receive the clear required-item error. The forwarder itself needs no new argument.
- `~/nana-agent-loop/app/scripts/launch-loop.mjs`: not a `pi-review` callsite; line 88 only mentions the historical “pi-reviewer-judge” feature. No migration needed.
- `~/jev-research/docs/reviews/local-tool-judge-2026-09-19/launch-workers.sh:11`: add stable `--item … --worker`.
- `~/jev-research/experiments/launch-wp-h-after-primary.sh:7`: add stable `--item … --worker`.
- `~/jev-research/docs/reviews/local-tool-judge-2026-09-19/launch-sol-review.sh:8`: additionally found; add stable `--item … --role sol`.
- `~/.claude/nana-memory/shared/reference_pi_review_procedure.md:22,79`: publishes the old invocation and basename rule; update it, including worker instructions.
- `~/nana-agent-loop/loops/system-map.components.json:1406-1408`: old CLI/export contract; update with the coordinated API migration.
- Detached jev scripts will put the required-item diagnostic in their runner logs, although the parent shell still prints “launched.”

The README hand-rolled launcher shape worked with a stub Claude command in a temporary Git repository: exit 0, output written, verdict recorded.

`~/.local/bin/pi-review` currently resolves to `~/nana-pi/packages/nana-pack/bin/pi-review.mjs` on main (`d316e53`), not the lane (`d6b6dbd`), so behavior is unchanged today. On landing, merge/cherry-pick into current main and coordinate the external callsite/export/document migrations; the symlink updates automatically and does not need relinking.

## Residual probe results

- Four arbitrary output names: fourth correctly refused; missing item exited 1 with the required-item message.
- Five-way last-slot race: exactly one winner; killed launcher recovered correctly.
- Read-only ledger directory failed before launch, but with an unhandled stack.
- Lock path as a directory waited 15 seconds, then failed with a lock-busy stack.
- Future-dated live reservation held the slot and defeats TTL until its clock catches up; dead PID still prunes.
- Three fabricated verdict lines exhaust an item. This is inherent if the same-user ledger is authoritative, but needs a documented repair/trust model.
- Targeted `review-round` and `review-ledger` tests passed; full-suite evidence remains the seat-verified 3,204 checks.

VERDICT: BLOCK
