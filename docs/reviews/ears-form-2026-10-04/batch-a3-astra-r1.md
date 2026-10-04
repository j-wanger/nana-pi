# Batch A3 review

**VERDICT: BLOCK — 5/10.**

Reviewed `16792b5` against `main` at `ef9d774`. Mechanical verification passes, but all three merges contain separately breakable promises. The seeded sample yields **14 PINS / 6 PARTIAL**. One refusal guarantee was dropped.

The reviewed worktree remains clean.

## MUST

### 1. Reject all three merges

“One mutation breaks both” does not establish equivalence. I executed mutations that separate the promises.

| Merge | Executed mutation | What remained intact | Ruling |
|---|---|---|---|
| **R-711**, `REQUIREMENTS.md:366` | Include file mtime in the dirty-content hash. Reverting identical content now earns another round; the revert assertion fails. | Re-reviewing an already-counted revision remains admitted without another round; its assertion passes. | **Split.** Recovering a previously reviewed content state and deduplicating an existing revision are distinguishable promises. |
| **R-718**, `REQUIREMENTS.md:375` | Append a verdict audit record inside the invalid-reservation branch, immediately before its existing refusal. | Expired, consumed and forged completions still return refusal. **All three cited checks pass.** An uncited aggregate verdict-count check fails. | **Split.** Rejecting a completion does not prove that it recorded nothing. Reassess the no-record clause’s evidence. |
| **R-727**, `REQUIREMENTS.md:390` | Run the watchdog for `--worker` before executing the existing refusal branch. | The command still prints `--worker was removed` and exits 1, without introducing a successful worker mode. | **Split.** Refusal and never starting a review are independently breakable. The compound citation detects the latter. |

These are executed counterexamples to the mapping’s non-separability claims.

### 2. Restore the directory-lock refusal promise

At `REQUIREMENTS.md:384–385`, the original R-723 promised that a **directory lock path** would be refused:

- at once;
- with a message;
- without a stack;
- before the review runs.

The split leaves R-723 saying only that ledger paths must be regular files. R-844 retains the refusal guarantees for **symlinks and unwritable directories**, but omits the **directory lock path**.

Its citation still tests some of those guarantees. A citation does not preserve a promise missing from the requirement text.

**Restore the omitted case and its guarantees.**

### 3. Six sampled rows overclaim their citations

**6/20 PARTIAL exceeds the permitted two.** Each counterexample below preserves the row’s cited assertions.

| Row | Executed counterexample | Observed citation result | Required correction |
|---|---|---|---|
| **R-833** — `:358` | Replace an outside-git explicit revision with literal `substituted`. | `--revision abc accepted` passes: it checks success, not preservation of `abc`. | Evidence must pin **“as given,”** not merely acceptance. |
| **R-843** — `:382` | For a parsed but incomplete tally record, refuse with generic `bad record`, omitting filename and line. | Both cited checks pass. The incomplete-record check asserts only exit 1. | Split or downgrade the unpinned diagnostic guarantee. |
| **R-844** — `:385` | Delay symlink and unwritable-directory diagnostics by four seconds. | Every cited assertion passes. | The citations do not pin **“at once.”** |
| **R-846** — `:392` | Make **pi-review only** read an after-separator `--retries`, setting its retry count and notice flag. | The cited assertion passes because it launches **pi-worker**. | Pin the promised review-wrapper surface, not only its sibling. |
| **R-910** — `:432` | Label an exit-1 file PASS while preserving exit-0 WARN handling. | Its sole citation passes. The existing non-zero-exit assertion fails elsewhere. | Add applicable non-zero-exit evidence. |
| **R-912** — `:438` | Clear the active-child and scratch references on SIGINT/SIGTERM before cleanup. | The entire runner test file passes, **24/24**. | Timeout/no-match cleanup does not pin interrupt cleanup or all promised tree killing. |

A recorded red mutation proves sensitivity to that mutation. It does not establish coverage of every condition or outcome in the row.

## SHOULD

### Restore standalone subjects and conditions

The split contract requires complete sentences that repeat their governing conditions.

| Row | Missing standalone context |
|---|---|
| R-842 | “That override”: identify the valid over-cap override and its admission condition. |
| R-845 | “One”: name the `--out` path. |
| R-846 | “the same name”: name `--retries` and the separator. |
| R-847 | Name the worker whose retries are enabled. |
| R-849 | “It”: name `adopt-structure`. |
| R-911 | “It”: name the FAIL line from an exit-0 file. |
| R-912 | “that whole tree”: identify the child’s process tree. |
| R-913 | Replace “Otherwise” with the explicit non-verbose condition. |
| R-914 | Name the fixtures and repeat `--self-test` / `NANA_TEST_SELFTEST=1`. |

These are not additional omitted behaviours when read beside their origins, but they violate the independent-sentence rule.

### Preserve reproducible isolated-mutation evidence

The submission contains descriptions, not the worker’s isolated scripts or their execution logs. I therefore cannot certify those scripts as byte-faithful.

My independent replays confirm mutation sensitivity, with these qualifications:

| Row | Independent replay | Faithfulness and finding |
|---|---|---|
| **R-723** | Removed the lock-path regular-file guard. The exact extracted block fails after **31.3 seconds**. | No added inner timeout was necessary: the existing `ledgerRun()` already has `timeout: 30000`. The claim that the cited call has no timeout and hangs forever is incorrect. |
| **R-837** | Forced lock takeover. The exact `blocked` assertion fails. | I preserved setup and assertion, changing only subsequent cleanup to tolerate an already-removed lock. That adaptation is necessary and must be disclosed. |
| **R-721** | Rotated the tally after appending. The exact extracted rotation block fails at `the tally never rotates`. | The actual assertion checks **both** absence of `.1` and three retained rounds. A faithful reproduction must retain both, plus the relevant setup. |

All three independent baseline blocks passed. These results support the cited checks; they do not authenticate unavailable worker artifacts.

## NOTE

Two sibling-cite explanations overstate mutation independence:

- **R-831:** the recorded import of `reviewShaped` breaks both the import regex and the `reviewShaped` regex. My import of `canonicalItem` from `review-round.mjs` isolates the import promise and still fails the citation.
- **R-911:** adding `f === 0` to `ok` also suppresses the WARN, because WARN emission requires `ok`. My label-only mutation preserves WARN emission while breaking the verdict half.

Both sibling citations are legitimate. Their recorded explanations need correction.

## Mechanical verification

I ran these first:

```sh
node docs/reviews/ears-form-2026-10-04/apply-batch.mjs \
  docs/reviews/ears-form-2026-10-04/batch-a3.json --base main

node docs/reviews/ears-form-2026-10-04/refusal-test.mjs
```

| Check | Result |
|---|---|
| Verifier | **ALL CHECKS GREEN**, zero rows added |
| Refusal test | **REFUSAL TEST: ALL PASS** |
| Worktree before/after | Clean; unchanged |
| Rail | 647 rows; 547 implemented; **100 off form, allowance 100** |
| Requirements-rail tests | **8 passed** |
| Full `review-ledger.test.mjs` baseline | **134 passed** |
| `review-round.test.mjs` baseline | **33 passed** |
| `test-runner.test.mjs` baseline | **24 passed** |
| `npm run map:check` | **172 modules, zero problems** |
| Four changed test files | Byte-equivalent after removing requirement markers and normalizing the authorized seal change |
| Production source in branch | Unchanged |

I did not rerun the full repository suite.

## Origin audit

I compared every origin on `main` with all resulting clauses.

| Origin | Added rows | Preservation ruling |
|---|---|---|
| R-702 | R-831 | Preserved |
| R-703 | R-832 | Preserved |
| R-706 | R-833 | Condition preserved; citation PARTIAL |
| R-707 | R-834 | Preserved |
| R-710 | R-835–836 | Preserved |
| R-711 | Merge | **Reject merge** |
| R-715 | R-837 | Preserved |
| R-717 | R-838 | Condition and outcomes preserved |
| R-718 | Merge | **Reject merge** |
| R-719 | R-840–841 | Preserved |
| R-720 | R-842 | Preserved contextually; repeat condition |
| R-721 | R-843 | Preserved; citation PARTIAL |
| R-723 | R-844 | **Directory-lock refusal guarantees lost** |
| R-725 | R-845 | Preserved contextually; name subject |
| R-727 | Merge | **Reject merge** |
| R-728 | R-846 | Preserved contextually; name flag; citation PARTIAL |
| R-735 | R-847 | Preserved; name worker |
| R-740 | R-848 | Distribution promise preserved |
| R-741 | R-849 | Preserved contextually; name skill |
| R-605 | R-910 | Preserved; citation PARTIAL |
| R-606 | R-911 | Preserved contextually; repeat subject |
| R-609 | R-912 | Conditions preserved; citation PARTIAL |
| R-613 | R-913 | Preserved contextually; repeat non-verbose condition |
| R-615 | R-914 | Preserved contextually; repeat self-test condition |

**24/24 origins reviewed.** No other omitted promise found.

## Mutation method and sample

Mutations ran sequentially in a disposable clone. Production files were restored after each execution. Ambient `NANA_*` and `PI_CODING_AGENT_DIR` variables were removed.

Ledger mutation runs used mechanically extracted original setup and complete relevant test blocks. Assertions were unchanged. R-837’s cleanup adaptation is disclosed above. Runner and round mutations used their full test files.

Evidence:

- Clone: `/tmp/ears-a3-review-16792b5/`
- Logs: `/tmp/a3-evidence/`
- Drivers: `/tmp/a3-review.py`, `/tmp/a3-extra.py`

**Seed/revision: `16792b5`.** The sorted population contains exactly 20 implemented split rows. Applying `(n * 7 + 3) mod 20` selects every row without collisions.

The three sibling-cite rows were mutated first; they also appear in the sample.

| Order | Row | Mutation / cited observation | Ruling |
|---:|---|---|---|
| 1 | R-835 | Omit untracked files; untracked-state assertion fails | **PINS** |
| 2 | R-843 | Generic incomplete-record diagnostic survives both citations | **PARTIAL** |
| 3 | R-912 | Interrupt-only cleanup break survives all 24 runner checks | **PARTIAL** |
| 4 | R-836 | Include ignored files; separately include mtime; corresponding assertions fail | **PINS** |
| 5 | R-844 | Four-second refusal delay survives citations | **PARTIAL** |
| 6 | R-913 | Print passing-file tails; cited output-hiding assertion fails | **PINS** |
| 7 | R-837 | Steal a live lock; cited blocked assertion fails | **PINS** |
| 8 | R-845 | Warn for ignored output paths; ignored-path citation fails | **PINS** |
| 9 | R-914 | Change a fixture’s declared expected verdict; both self-test citations fail | **PINS** |
| 10 | R-838 | Consume no round after drift; both cited assertions fail | **PINS** |
| 11 | R-846 | Read child retry arguments in pi-review only; worker citation passes | **PARTIAL** |
| 12 | R-831 | Import a ledger module without naming `reviewShaped`; citation fails | **PINS** |
| 13 | R-840 | Admit a fourth revision; fourth-revision assertion fails | **PINS** |
| 14 | R-847 | Suppress mutation warning; explicit-retry assertion fails | **PINS** |
| 15 | R-833 | Substitute the accepted revision; acceptance citation passes | **PARTIAL** |
| 16 | R-841 | Scope counts by launcher; switching-launcher assertion fails | **PINS** |
| 17 | R-910 | Label exit 1 PASS; exit-0 WARN citation passes | **PARTIAL** |
| 18 | R-834 | Count revision-plus-role; both one-round assertions fail | **PINS** |
| 19 | R-842 | Suppress override audit records; both citations fail | **PINS** |
| 20 | R-911 | Flip only the exit-0 FAIL-line label; compound citation fails | **PINS** |

**Total: 14 PINS / 6 PARTIAL.**

### Recorded-mutation replay

I flattened the 48 records in mapping order and replayed every fifth, plus the final record covering the remaining tail.

| Record | Row | Recorded mutation | Result |
|---:|---|---|---|
| 5 | R-833 | Require SHA-shaped outside-git revision | Red |
| 10 | R-835 | Omit untracked-file collection | Red |
| 15 | R-715 | Stop expiring future-dated reservations | Red |
| 20 | R-719 | Change cap from 3 to 4 | Red |
| 25 | R-721 | Rotate tally after append | Red, isolated |
| 30 | R-725 | Remove output-path snapshot exclusion | Red |
| 35 | R-735 | Enable one worker retry by default | Red |
| 40 | R-911 | Make printed FAIL affect `ok` | Red |
| 45 | R-615 | Remove pipe-holding fixture | Red |
| 48 | R-914 | Misdeclare expected fixture verdict; environment-triggered self-test | Red |

**10/10 selected records reproduced red.** The successful replays do not resolve the surviving counterexamples above.

## Untested rows

| Row | Existing assertions checked | Ruling |
|---|---|---|
| **R-832** | Missing-item process assertion checks the message, not absence of a stack. Flag-as-item coverage is a pure-function rejection. Malformed-slug no-stack assertions exercise different inputs. | Keep **untested** |
| **R-848** | Template rendering uses local `HEAD`; it does not establish pushed-tag distribution. | Keep **untested** |
| **R-849** | Existing installer tests inspect `adopt-structure` fallback instructions, but do not prove that executing the skill leaves source/config/CI untouched. | Keep **untested** |

No existing assertion found that justifies promoting these three rows.

## Verdict

The mechanical boundary holds. Semantic splitting and clause-level evidence do not.

Split the three merges, restore the directory-lock guarantees, and correct the six PARTIAL rows without changing assertions in this lane.

**VERDICT: BLOCK**  
**Score: 5/10**
