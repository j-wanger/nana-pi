## MUST

1. **Restore plain-commit validation.**  
   `packages/nana-pack/bin/nana-land.mjs` now resolves `${sha}^{commit}` without checking the original object type. This silently accepts annotated-tag object IDs, contrary to R-976 and CHANGE §3.

   I reproduced this in a scratch repository: a tag object pointing to a reviewed commit successfully landed. Restore the `cat-file -t` check before canonicalization and add a regression test. This does not bypass coverage, but it weakens an explicitly retained contract.

2. **Publish the complete operational residuals.**  
   CHANGE §5 says its residuals appear in `packages/nana-pack/README.md`; several do not:
   - Deployment must stop **workers**, as well as land and review processes.
   - A land holding the ledger lock can cause another review’s completion to time out and remain unrecorded; preserve its output and rerun.
   - A new commit starts with a clean verdict history, including an empty commit.
   - A narrow review counts for the entire ancestry covered by its revision.

   “Does not prove … review scope” does not explain that last consequence. Put these limits beside the land instructions or Trust model. Explicitly state that direct commits bypass the helper, although the working pattern forbids them.

## SHOULD

- Remove the unused `readLedger` and `now` parameters from `runLand`. The retained `readLedger` injection no longer controls either reading.
- Move release-status collection outside the ledger lock, as CHANGE §4 specifies. It unnecessarily extends the period that blocks review admission and completion.

## NOTE

- The main enforcement design matches the owner's ruling: uncovered commits refuse, exemptions disappear, every completed verdict persists, and non-LAND verdicts cannot hide behind a LAND.
- Repository identity, snapshot rejection checks, in-flight refusal, and the locked final reading address the important compatibility and concurrency risks.
- Version-1 records cannot authorize new lands. Old readers refuse a tally containing version-2 records. Before that first record, the documented quiescent cutover remains essential.
- The owner's checkpoint-1 decisions appear correctly in both `REQUIREMENTS.md` and the generated tree: the revised merge-feature purpose and R-1008 share.
- The shared working pattern requires reviewed handoff/session changes and prohibits unreviewed follow-ups.
- `HANDOFF.md` describes the intended merged state. Its checkpoint-2 acceptance claim becomes true only after the owner actually accepts; this review does not establish that acceptance.
- The session entry accurately describes the inspected implementation. I did not independently repeat its historical ledger analysis or mutation campaign.

### Evidence

- Seat acceptance script: **48 checks passed; zero mismatches**.
- Land tests: **50 passed**.
- Requirements-tree tests: **all passed**.
- Review-ledger tests: observed checks passed until my **120-second timeout**; not a completed suite result.
- Annotated-tag regression: independently reproduced using scratch repositories and a scratch ledger.
- Checkout remained unchanged. No real-ledger land command ran.

## Accepted residuals

I accept advisory enforcement rather than a security boundary: reviewer independence remains procedural, tally files remain editable, review scope remains conventional, and direct Git operations can bypass the helper. Commit-identity resets, legacy-review invalidation, and the existing checkout-switch race are acceptable within the declared design. The missing consumer-facing disclosures above must still be fixed.

**Score: 8/10.** Core enforcement is sound; one retained contract regressed, and operational disclosures are incomplete. Review the corrected exact tip before merging.

VERDICT: SEND-BACK
