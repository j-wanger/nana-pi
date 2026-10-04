# Batch A2 — round 2 review

**VERDICT: BLOCK — 8/10.**

The new sample yields **19 PINS / 1 PARTIAL**, meeting the sampling bar. All **12 selected mutation records replay successfully**. The remaining blocker is the verifier: its new rejection check runs **after it writes the rejected mapping**.

Reviewed `74f6168` against `main` at `6a2e372`. The review worktree remains clean.

## MUST

### 1. Validate mutation records before writing

`docs/reviews/ears-form-2026-10-04/apply-batch.mjs` writes files in section 6, then validates mutation records in section g2.

I reproduced the consequence in a disposable clone:

1. Removed R-110’s mutation record from a copy of the mapping.
2. Changed its sentence from “stored summary” to “stored handoff summary”.
3. Ran the verifier against `6a2e372`.

Observed:

```text
exit: 1
FAIL: implemented clause has no recorded red mutation
      (mutationRecords: true): R-110
REQUIREMENTS.md changed: True
```

The verifier correctly rejects the missing record **but leaves the rejected requirement edit on disk**. This contradicts its declared refusal-without-changes contract.

The write-before-verification architecture predates this fix; the mutation-record rejection path is newly added.

**Correction:** Run the mutation-record check before any writes. Add a refusal test that compares all affected files byte-for-byte before and after execution.

## SHOULD

### 1. R-796 still overclaims the default-store case

The added custom-path citation closes the **exact round-1 mutation**:

```text
FAIL custom path: no .gitignore beside it
```

However, the row explicitly promises both **default store and custom path**.

I refined the mutation to create `.gitignore` beside the handoff **only when no custom path is configured**:

```ts
atomicWrite(file, text);
if (!custom)
    fs.writeFileSync(path.join(path.dirname(file), ".gitignore"), "*");
```

Both cited test files remain entirely green:

- `handoff-store.test.mjs`: exit 0
- `handoff-artifact.test.mjs`: exit 0

The store assertion still checks the repository’s `.pi/.gitignore`, not the store directory.

**Ruling: PARTIAL.** Preserve the default-store promise explicitly as untested, or provide applicable evidence. This is the sample’s only PARTIAL, within the permitted threshold.

### 2. Mutation-record validation accepts malformed extra records

The new comment says each record must contain valid fields, but implementation uses `muts.some(valid)`.

I appended this record beside an existing valid record:

```json
{"file":"","break":"","cite":"unrelated","result":"red"}
```

The verifier returned **ALL CHECKS GREEN**, exit 0.

This does not invalidate the committed mapping’s successful replay. Either validate every record’s shape separately or narrow the documented contract to the actual “at least one valid red record” rule.

## Round-1 closure

| Item | Independent verification | Ruling |
|---|---|---|
| **R-796** | Original mutation now fails the added custom-path assertion. Default-only mutation survives both cited files. | Exact fix verified; residual **PARTIAL** above |
| **R-812** | Silencing unreadable journals fails both directory-as-journal and EACCES assertions. Wording now limits the comparison to absence versus unreadability. | Closed |
| **R-816** | Increasing the deadline from 8,000 to 14,500 ms fails the newly cited bounded-fallback assertion. | Closed |
| **R-142 / R-828** | Wrong custom filename fails the filename assertion. Removing “in place” separately fails the update assertions. Both promises remain separate rows. | Closed |
| **R-193 / R-829** | Read-and-discard mutation leaves the cited suite green; R-193 correctly becomes untested. Applying stranded gate settings fails the stale-deny assertions; R-829 remains implemented. | Closed |
| **R-803** | Governing IF condition restored. Appending raw hostile paths still fails the cited raw-path exclusions. | Closed |
| **R-806** | Write-only final-component symlink check fails the newly cited parent-directory-link overwrite assertion. | Closed |
| **R-807** | Case-insensitive `NANA_HANDOFF` comparison survives the cited suite. Row correctly becomes untested. | Closed |
| **R-825** | Removing the stranded-file existence condition survives the cited suite. Row correctly becomes untested. | Closed |
| **R-827** | Ambient-directory write during `install --pi-home` survives the parity suite when expressed without triggering its unrelated lexical scan. Row correctly becomes untested. | Closed |
| **Standalone sentences** | Re-read R-807, R-811, R-816, R-825 and R-826. Inputs, conditions, objects and deadline are now named. | Closed |

I also repeated the untested-row probes for **R-166, R-173, R-818, R-248 and R-880**. Nothing found warrants promoting them.

The prior provenance problems were substantively corrected: the mapping now records mutations, and the inappropriate implemented statuses were downgraded.

One reporting discrepancy remains: the branch changes **16 test files**, not the worker report’s 17.

## Recorded-mutation replay

Flattened `mutations` arrays in mapping file order: **59 records**. Selected zero-based indexes **2, 7, 12, …, 57**, as instructed for seed `74f6168`.

**A replay passes only when the named citation fails—not merely when the file exits nonzero.**

| Index | Row | Replayed break | Cited result |
|---:|---|---|---|
| 2 | R-112 | Write repository `.pi/handoff.md` after compaction | **Red:** nothing written to repository |
| 7 | R-114 | Inject mismatched-Cwd handoff body | **Red:** planted entry not injected |
| 12 | R-800 | Suppress failed-write journal event | **Red:** `handoff_write_failed` journaled |
| 17 | R-803 | Append raw hostile path to pointer | **Red:** raw path never appears |
| 22 | R-140 | Suppress ancestor-named journal event | **Red:** ancestor event journaled |
| 27 | R-809 | Require `.git` to be a directory | **Red:** linked worktree has its own root |
| 32 | R-154 | Treat unreadable journal as empty | **Red:** EACCES prints unavailable |
| 37 | R-814 | Rename shutdown registration | **Red:** shutdown handler registered |
| 42 | R-817 | Journal notifier failure only with UI | **Red:** headless failure journaled |
| 47 | R-180 | Truncate clean locator above 1,000 characters | **Red:** four-kilobyte locator exact |
| 52 | R-182 | Throw for Symbol input in `displayPath` | **Red:** path renderers never throw |
| 57 | R-826 | Return nonblocking decision for unusable policy | **Red:** handler blocks with named reason |

**Replay result: 12/12 successful.**

## New seeded sample

Population: **30 implemented new split rows**, sorted by ID.

Only **R-797, R-828 and R-829** had not received round-1 mutations. To honor “excluding … where possible,” I preferred those during forward collision filling until exhausted, then admitted previously mutated rows.

Starting index for each draw: `(n * 11 + 5) mod 30`.

Selected indexes:

```text
28,29,2,8,19,0,11,22,3,14,25,6,17,1,9,20,4,12,23,5
```

| Row | Executed mutation / cited observation | Ruling |
|---|---|---|
| R-828 | Remove “in place”; update assertions fail | **PINS** |
| R-829 | Apply stranded gate settings; stale-deny assertions fail | **PINS** |
| R-797 | Skip canonical realpath resolution; Darwin key-equivalence assertion fails | **PINS** |
| R-803 | Append raw hostile path; raw-path exclusion fails | **PINS** |
| R-816 | Extend deadline to 14,500 ms; bounded-fallback assertion fails | **PINS** |
| R-795 | Remove store path from write notice; notice assertion fails | **PINS** |
| R-808 | Inject ancestor body; ancestor-text exclusion fails | **PINS** |
| R-820 | Change cap comparison from `<=` to `<`; exact-cap assertion fails | **PINS** |
| R-798 | Suppress mismatch journal event; event assertion fails | **PINS** |
| R-811 | Accept `.` and `..` objective filenames; producer-parity assertions fail | **PINS** |
| R-823 | Leave astral character literal; both-code-units assertion fails | **PINS** |
| R-801 | Overwrite previous file before atomic replacement; byte-identity assertion fails | **PINS** |
| R-814 | Rename shutdown event; registration assertion fails | **PINS** |
| R-796 | Create `.gitignore` only beside default-store handoffs; both cited files remain green | **PARTIAL** |
| R-805 | Leave temporary litter beside refused handoff; litter assertions fail | **PINS** |
| R-817 | Require UI for failure journaling; headless assertion fails | **PINS** |
| R-799 | Inject decoded bytes after UTF-8 failure; nothing-injected assertion fails | **PINS** |
| R-809 | Require directory-shaped `.git`; worktree-root assertion fails | **PINS** |
| R-821 | Replace locator newlines with spaces; exact-decode assertion fails | **PINS** |
| R-800 | Suppress failed-write event; journal assertion fails | **PINS** |

**Sample: 19 PINS / 1 PARTIAL.**

## Mechanical verification

Executed:

```sh
node docs/reviews/ears-form-2026-10-04/apply-batch.mjs \
  docs/reviews/ears-form-2026-10-04/batch-a2.json --base main

node --experimental-strip-types \
  packages/nana-pack/tests/requirements-trace.test.mjs

npm run map:check
```

Results:

- Verifier: **ALL CHECKS GREEN**, zero rows added.
- Requirements: **623 total; 527 implemented, 2 planned, 85 untested, 9 violated**.
- Off form: **124**, allowance **124**.
- Merges: **zero**.
- Requirements rail: **8 checks passed**.
- Code map: **172 modules, zero problems**.
- All **16 changed test files** match main after removing requirement markers and normalizing the authorized allowance retune.
- No production source changed.
- All **15 mutation-relevant test files** passed baseline execution.
- Full repository suite was **not rerun**.

No omitted original promise was found in the corrected splits. The outstanding semantic issue is the explicitly identified default-store coverage gap.

## Evidence and verdict

Mutations ran in `/tmp/ears-a2-review-74f6168/`, with production changes restored after each run. Child environments excluded ambient `NANA_*` and `PI_CODING_AGENT_DIR`.

Logs: `/tmp/a2-r2-evidence/`. Drivers: `/tmp/a2-r2-{sample,mutate,extra,new,default-only}.py`.

The clause-preservation and sampling bars are met. **Move mutation-record validation before writes to close the remaining blocker.**

**VERDICT: BLOCK**  
**Score: 8/10**
