**T2b should not merge unchanged.** The mechanism is substantially improved; two implementation gaps remain in promised safeguards.

Read the corpus in order, then the patch and named source/tests. This is static verification; the 69-file/3317-check pass and race-test sensitivity are seat-supplied evidence, not executions here. Paths below are under `packages/nana-pack/` unless stated otherwise.

**A. Contract**
- Identity and counting substantially satisfy the amended contract: normalized, bounded slug; real git-common-dir scope; distinct HEAD/snapshot revisions across roles and launchers. Revisions do not reset the item.
- Reservations serialize ordinary last-slot competition; completion checks ownership; heartbeat and dead-owner recovery are implemented. Unconditional atomicity remains qualified by the acknowledged stale-lock unlink race.
- Launcher independence means **participating launchers**, not universal enforcement. The shared `run` wrapper is real; `check` alone is not admission.
- Overrides are timestamped. Audit rotation preserves the permanent tally, but storage is **not globally bounded**, and failed overrides bypass even audit rotation.
- “Completed verdict” remains a token heuristic. Endpoint snapshot equality does not prove the tree stayed unchanged throughout review; edit-and-revert and concurrent snapshot reads remain outside that proof.

**B. Governance honesty**
- The bold, dedicated README trust-model section is sufficiently prominent and correctly disclaims security enforcement.
- Qualify “every admitted review … recorded”: ordinary failed admissions leave no durable audit after reservation removal. Budget control is external; these wrappers do not enforce `--max-budget-usd`.
- Other overstatements: “casefold” is actually lowercase normalization; staging independence has the force-added ignored-file exception; “only completed verdicts” has the explicitly documented unverified-completion exception.

**C. Migration and harm**
- Missing `--item` is genuinely diagnosable: exit 1 names the required flag, ledger and remedy before spawning. The nana-agent-loop forwarder preserves stderr/status; the deprecated export preserves linking.
- The inventory, worker symlink instruction and explicit retry notice are published.
- However, both named jev worker scripts already pass `--retries 2`. “Arguments otherwise unchanged” now means **three mutation attempts**, not the worker’s safe one-attempt default. Detached parents still print “launched”; diagnostics live in runner logs.
- Install `~/.local/bin/pi-worker` and coordinate external scripts/reference documents on landing day; workers must **not** receive `--item` or `--worker`.

**D. Snapshot ruling**
- Keep raw-byte identity. LFS/autocrlf can create an additional identity relative to bare HEAD—not another charge on every identical rerun. Cost: potentially one scarce slot, preferable to conflating observable bytes.
- Force-added, not-yet-committed ignored files and global excludes can split or omit states. **MED:** accidental slot consumption or missed changes; publish these exceptions.
- Non-UTF-8 refusal is safe but excludes affected repositories; the replacement-character check also rejects a valid literal U+FFFD filename. **LOW availability cost.**
- Full reads at admission/completion are acceptable at the reported 685 files/0.16 s, not a scalability guarantee; large files/LFS and serialized completion hashing can cause substantial latency or memory pressure.

**E. Seat conduct**
- Correcting the diff-hash ruling and accepting the worker’s dirty-tree objection strengthened the contract. Role-max subtraction and worker separation are legitimate rulings, not disguised fixes.
- Implementing after sol r3, followed by this independent ruling, respects the stated cap exception.
- The final completion-race fix has meaningful sensitivity evidence. But tracked-output resolution was declared closed without final-symlink coverage.
- `tests/review-ledger.test.mjs:306` captures its “before” tally **after** `check`; that equality assertion is vacuous. The restored compatibility/blank-override assertions are not weakened.
- I accept silence for ignored in-tree outputs: they are the recommended safe location, unlike ordinary untracked outputs.

**F. Integration**
- The supplied “both touch `lib/config.ts`” premise does not match `t2b-r5.patch`: it has no config hunk; T2b’s inspected config matches main. Preserve T2a’s objective validator/helpers and Tranche-1 gate semantics rather than copying whole files.
- README/package metadata need integration. The supplied patch also deletes main’s two unrelated `HANDOFF.md` notices; preserve them.
- Re-run root `npm test`, review-ledger/round, handoff-writer-role, config normalization/trust/fallback/display and objective golden/injection tests on the merged tree; smoke-test installed launchers and the external forwarder.

SCORE: 7/10

MUST:
- **Tracked-output protection:** `bin/review-round.mjs:407–414` resolves only the parent, not a final symlink; an external output symlink can overwrite a tracked file before completion rejects drift. `rel.startsWith('..')` also misclassifies tracked names such as `..notes.md`. Fix both and pin pre-launch refusal/file preservation.
- **Audit bound:** override append at `review-round.mjs:454` rotates only through successful completion at `:515`. Repeated failed over-cap launches grow it indefinitely. Rotate on every append path; document permanent tally growth separately.
- Correct the named worker migration recipe to remove retries unless deliberately justified; preserve main’s unrelated `HANDOFF.md` notices when integrating.

CARRY:
- **MED, false validation/extra spend:** non-atomic tree observation, stale-lock takeover race, heuristic verdict recognition.
- **MED, orphan spend/mutations:** parent termination is not forwarded to watchdog children; the crash test kills the whole group and does not prove parent-only cleanup.
- **MED, growing storage/latency:** permanent tally is O(items + overridden revisions), read in full; retain history rather than silently resetting caps.
- **LOW:** normalization/documentation precision and the vacuous projection assertion; snapshot costs priced above.

UPSTREAM-CONTRACT: Nana’s CLI/governance contract changes: required item, revision-based rounds, unverified-completion charging, separate worker launcher, N+1 retry semantics and persistent tally. No pi 0.87.1 core/API change or security guarantee. Total bounded storage is not satisfied as written.
VERDICT: BLOCK
