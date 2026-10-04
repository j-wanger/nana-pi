# Batch A3 — round 2 read-and-replay review

**VERDICT: BLOCK**  
**Score: 6/10**

Reviewed `fa1cf89` on `feat/ears-a3`, including its changes from `16792b5` and preservation against `main` (`ef9d774`).

**Three form MUSTs remain.** All **11 sampled records replayed red**. The record-coverage gap rate is **27/46 implemented rows — 58.7%**. Coverage gaps are NOTEs, not landing gates.

## 1. Form MUSTs

### MUST 1 — Restore the condition on R-851

`REQUIREMENTS.md:394–396` splits R-727 into three rows, but R-851 now says:

> The review shall never run.

The original prohibition applied to a **pi-review invocation containing `--worker`**, not every review. Splitting dropped that condition.

Restore the condition explicitly, for example:

> WHEN pi-review receives --worker, the review shall never run.

Name pi-review in R-854 as well so its refusal promise stands independently.

### MUST 2 — Preserve immediate refusal for symlinks and unwritable directories

`REQUIREMENTS.md:387–389` correctly restores the directory-lock guarantees in R-852. However, R-844 drops **“at once”** for the other two original cases:

- a symlink;
- an unwritable ledger directory.

The mapping explicitly acknowledges removing this unproven guarantee. Missing evidence justifies `untested`; it does not justify deleting the promise.

Retain the immediate-refusal guarantee, with an honest status.

### MUST 3 — Preserve the incomplete-record diagnostic guarantee

`REQUIREMENTS.md:384–385` removes **“naming file and line”** from the incomplete-tally-line case.

The original R-721 applied that diagnostic promise to both malformed and incomplete lines. R-853 preserves refusal but omits the diagnostic. Its mapping explicitly says the guarantee was excluded because the citation does not prove it.

Preserve that guarantee as an untested clause rather than removing it.

### Closure of the requested form items

| Item | Finding |
|---|---|
| R-711 → R-711, R-850 | Closed. Both original promises remain separate. |
| R-718 → R-718, R-839 | Closed structurally. Ownership and recording are separate; evidence gaps remain below. |
| R-727 → R-727, R-854, R-851 | Promises separated, but R-851 loses its governing condition. |
| R-723 → R-852 | Directory-lock guarantees restored completely in the sentence. R-844 introduces the separate loss described above. |
| Nine standalone rewrites | R-842, R-845, R-846, R-847, R-849, R-911, R-912, R-913 and R-914 restore their previously missing subjects or conditions. |
| Timeout versus interruption | R-912 and untested R-915 preserve both trigger families. |

## 2. Record-coverage audit — NOTEs

I read **all 46 implemented clauses**, including origins, against their recorded `break` descriptions and relevant assertions.

A red compound assertion does not establish coverage of conjuncts that remain true. Removing a whole record proves sensitivity to its absence, not independently to its metadata. Records attached only to another row were not silently credited.

| Row | Uncovered words | Record limitation |
|---|---|---|
| R-702 | “review-shape predicate” | Renaming an always-true predicate to `reviewShaped` changes its name, not its semantics. |
| R-831 | “ledger” | The actual record imports `review-shape.mjs`; no ledger-module import record is attached. |
| R-703 | “--item \<slug> shall be required” | The mutation still refuses missing `--item`; only the diagnostic changes. |
| R-706 | “cwd’s realpath” | Changing `path:` to `path2:` retains realpath resolution. |
| R-834 | “Any number of reviews” | Both records distinguish roles; neither breaks repeated reviews under the same role. |
| R-850 | “shall be admitted” | Unconditional tally appending breaks “earning nothing,” not admission. |
| R-715 | “launcher pid is dead”; “stopped renewing past the window”; “pruned at the next admission” | Only future-dating is mutated. Its citation uses non-pruning `project()`, not admission-time pruning. |
| R-838 | “for the admitted revision as unverified with the new state recorded” | Suppressing the entire tally append proves consumption sensitivity, not the retained record’s revision or metadata. |
| R-718 | “own a live reservation” | Forcing `mine=false` rejects a legitimate completion; it does not exercise acceptance without ownership or liveness. |
| R-839 | “consumed or forged … record nothing” | The aggregate audit-count assertion runs **before** those attempts. The consumed-reservation citation checks refusal, not recording. |
| R-719 | “per item” | The recorded constant change pins three, not item scoping. |
| R-720 | “admission shall be refused unless”; “non-blank” | The sole record covers flag-shaped reasons, not absent or blank reasons. |
| R-842 | “reason, round and timestamp at admission even when that review then fails” | Suppressing all override records does not separately establish metadata, admission timing, or failed-review persistence. |
| R-843 | “naming file and line” | Silently skipping the line breaks refusal; it does not isolate diagnostic correctness while refusal remains intact. |
| R-723 | “Every ledger path” | Only the directory lock path has a recorded mutation. |
| R-852 | “no stack”; “before the review runs” | The replay times out with empty stderr: no stack remains true. It does not start the review. |
| R-844 | “A symlink or an unwritable ledger directory … refused with a message and no stack, before the review runs” | Removing the writable-directory suffix leaves a refusal message. It does not break the other named guarantees or the symlink case. |
| R-725 | “warn, still run” | Removing snapshot exclusion leaves warning and execution intact. |
| R-845 | “outside the reviewed tree” | Only the ignored-inside-tree case has a record. |
| R-727 | “no worker mode” | Changing refusal’s exit code does not introduce a worker mode. |
| R-851 | “The review shall never run” — without qualification | Its record covers only refused `--worker` calls, not the unconditional sentence now written. |
| R-728 | “N re-attempts after the first”; “a one-line notice” when explicitly passed | The record only makes the notice appear when the flag is absent. |
| R-847 | “explicit --retries shall opt in” | Removing the mutation warning leaves retry opt-in intact. |
| R-605 | “exits non-zero”; “times out” | This row’s only record changes signal handling. |
| R-913 | “a failing file’s last lines shall be shown” | Printing passing-file output breaks the exclusion; it leaves failing-tail emission and truncation unchanged. |
| R-615 | “red, warn” | Both records remove only the pipe-holding fixture. |
| R-914 | “the run exiting non-zero” | Changing a fixture’s expected verdict leaves the non-zero exit intact. |

**Gap rate: 27 / 46 = 58.7%.**

No additional record gap identified in these **19 rows**:

R-707, R-710, R-835, R-836, R-711, R-837, R-717, R-840, R-841, R-721, R-853, R-854, R-735, R-910, R-606, R-911, R-609, R-912 and R-613.

This exceeds the method ruling’s one-in-five reconsideration threshold. It does **not** add a landing MUST under this brief.

### Record-description discrepancies

- **R-831:** the mapping’s notes claim the record now imports `canonicalItem` from `review-round.mjs`. The actual `break` still imports `reviewShaped` from `review-shape.mjs`.
- **R-852:** its description says all four assertion conditions flip. The replay produces empty stderr, so `noStack()` remains true.

## 3. Recorded-mutation replay

**Seed checkout: `fa1cf89`.** Flattened all **54 records in file order** and selected one-based indices **1, 6, 11, …, 51**.

| Index | Row | Recorded mutation | Result |
|---:|---|---|---|
| 1 | R-702 | Rename default predicate to `reviewShaped` | **RED** |
| 6 | R-834 | Deduplicate by revision plus role | **RED** |
| 11 | R-836 | Include mtime in the content hash | **RED** |
| 16 | R-837 | Force lock takeover | **RED** |
| 21 | R-839 | Append a verdict before invalid-reservation refusal | **RED** |
| 26 | R-842 | Suppress override audit records | **RED** |
| 31 | R-852 | Remove the lock-path regular-file guard | **RED** |
| 36 | R-854 | Return exit 0 from the refusal branch | **RED** |
| 41 | R-605 | Treat signal termination as successful | **RED** |
| 46 | R-609 | Spawn without a detached process group | **RED** |
| 51 | R-615 | Remove the pipe-holding fixture | **RED** |

**11/11 selected records reproduced red at their cited checks. Zero green.**

Method:

- Replayed sequentially in `/tmp/ears-a3-r2-fa1cf89`.
- Used full cited test files except the two recorded isolated reproductions, R-837 and R-852.
- Both isolated reproductions passed before mutation.
- R-837 retains its disclosed cleanup-only adaptation.
- R-852 failed after approximately **30 seconds**, using the existing timeout.
- Scrubbed ambient `NANA_*` and `PI_CODING_AGENT_DIR`.
- Restored production files after each replay.
- Reaped processes left by the process-group mutation after assertions completed.
- Per-record patches and logs: `/tmp/a3-r2-evidence/`.

No new mutation hunt was performed.

## 4. Command verification

| Check | Result |
|---|---|
| `apply-batch.mjs batch-a3.json --base main` | **ALL CHECKS GREEN**, zero rows added |
| `refusal-test.mjs` | **ALL PASS** |
| Requirements trace tests | **8 passed** |
| `review-ledger.test.mjs` baseline | **134 passed** |
| `review-round.test.mjs` baseline | **33 passed** |
| `test-runner.test.mjs` baseline | **24 passed** |
| `npm run map:check` | **172 modules, zero problems** |
| `git diff --check` | Clean |
| Reviewed worktree after verification | Clean |
| Replay checkout after restoration | Clean |

The trace reports **654 requirements, 551 implemented, 100 off form, allowance 100**. I did not rerun the full repository suite.

## Verdict

The mechanical checks pass and the sampled records reproduce. The fix still deletes two guarantees and drops one governing condition.

Restore those form promises. Treat the coverage table as the seat’s downgrade worklist, not grounds for another mutation hunt or round three.

**VERDICT: BLOCK**  
**Score: 6/10**
