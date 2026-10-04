# Batch A2 review

**VERDICT: BLOCK — 6/10.** The sample yields **17 PINS / 3 PARTIAL**, exceeding the allowed two. Both merges hide distinct promises.

Reviewed `6565cfe` against `main` at `6a2e372`. The reviewed worktree remains clean.

## MUST

### 1. Three sampled rows overclaim their citations

| Row | Evidence | Correction |
|---|---|---|
| **R-796** — `REQUIREMENTS.md:195` | Creating `.gitignore` beside the actual handoff leaves the cited store test entirely green. Its assertion checks `<repo>/.pi/.gitignore`, not the handoff’s directory. | Add applicable evidence, including the existing `handoff-artifact` assertion `custom path: no .gitignore beside it`, which fails under this mutation. |
| **R-812** — `REQUIREMENTS.md:255` | Silently swallowing unreadable journals leaves its absent-journal citation green. Existing unreadable-file and directory-as-journal assertions fail. | Cite the assertions distinguishing absence from unreadability. |
| **R-816** — `REQUIREMENTS.md:286` | Changing the notifier deadline from **8,000 to 14,500 ms** leaves both cited assertions green. Only the separate deadline assertion fails. | Add the existing deadline citation and marker. |

**3/20 PARTIAL fails the judgement threshold.** Correcting these requires no assertion changes.

R-812 also retains an inherited wording problem: readable journals with no open candidates legitimately produce silence. “Only an absent journal” needs its intended read-failure scope made explicit, not silently narrowed.

### 2. Neither merge satisfies the semantic merge rule

Shared implementation or assertions do not make two promises equivalent. The sibling-cite list identifies cases to review; it does not prohibit shared citations.

| Merge | Executed evidence | Ruling |
|---|---|---|
| **R-142**, `REQUIREMENTS.md:239` | Removing the update instruction leaves the correct filename on the `Source:` line. The update assertions fail. Naming the file and instructing an in-place update therefore remain independently breakable promises. | **Reject merge.** Split the promises, allowing shared evidence where appropriate. |
| **R-193**, `REQUIREMENTS.md:326` | Added `fs.readFileSync(stranded)` while discarding its contents. The entire cited `agent-dir-config` suite stays green. Reading the file and applying its stale denies are distinguishable behaviours. | **Reject merge.** Preserve both promises separately. The cited assertions prove policy behaviour, not absence of a read. |

R-193 is the more serious concealment: an unpinned **no-read** promise receives `implemented` status through assertions about **no policy effect**.

### 3. R-803 loses its governing condition

`REQUIREMENTS.md:218` now says:

> The raw path shall not appear in the pointer.

Main restricted that promise to paths that **cannot be addressed as written**. Removing the condition creates an unconditional prohibition that ordinary pointers violate.

I called `stalePointer()` with a clean absolute path. Its output contains that raw path, correctly under the original contract.

**Restore the original IF condition.** The hostile-path mutation pins the intended conditional promise, not the branch’s unconditional sentence.

## SHOULD

### Correct four additional PARTIAL rows in the code-read set

- **R-806:** The citations omit writes through a **parent-directory symlink**. Restricting only the write-side refusal to final-component symlinks leaves both citations green. Existing assertion `e: external handoff.md not overwritten` fails. Add it.
- **R-807:** Case-folding `NANA_HANDOFF` makes `OFF` suppress normal behaviour. Both citations remain green because they exercise only `on` and unset. This is the same uncovered case correctly recognized in R-138.
- **R-825:** Removing the stranded-file existence check leaves the entire cited suite green. It never exercises a relocated active directory with **neither config file present**.
- **R-827:** Adding an ambient-directory write specifically during `install --pi-home` leaves the entire cited parity suite green. Its real installation uses `--home`; `--pi-home` receives only a resolver check.

Use existing applicable assertions where available; otherwise mark the unpinned promise honestly.

### Make split sentences independently readable

The ruling requires repeated conditions and complete sentences. Examples still dependent on siblings include:

- R-807: “Any other value”
- R-811: “That name”
- R-816: “A hung one” and “the deadline”
- R-825: “Otherwise”
- R-826: “The handler” and “that named reason”

Name the input, condition and relevant object directly. R-803’s substantive scope error is separately a MUST.

## NOTE

The worker report’s provenance claims need correction:

- R-138 and R-166 **were implemented on main**. Their changes to `untested` are genuine, appropriate downgrades.
- The mapping claims every implemented split received an actual mutation, while the report acknowledges code-read judgements.
- The actual branch changes **15 test files**, not 16.

These inaccuracies did not affect my independent execution.

## Mechanical verification

I ran the required command first:

```sh
node docs/reviews/ears-form-2026-10-04/apply-batch.mjs \
  docs/reviews/ears-form-2026-10-04/batch-a2.json --base main
```

Results:

- **ALL CHECKS GREEN**, zero rows added, no worktree changes.
- **621 rows:** 529 implemented, 2 planned, 81 untested, 9 violated.
- **124 off form**, allowance 124.
- Sibling-cite list: empty.
- Requirements-rail test: **8 checks passed**.
- `npm run map:check`: **172 modules, zero problems**.
- All **15 changed test files** match main after removing requirement-marker lines and normalizing the authorized **157 → 124** seal retune.
- No production source changed.

All **15 mutation-relevant test files passed baseline execution**. I did not rerun the full repository suite.

## Origin audit

I compared every main-branch origin with its branch clauses:

```text
R-110 112 113 114 119 120 124 128 133 134 138
R-140 142 145 148 150 154 156 163 166 171 172
R-173 178 179 180 181 182 193 194 197 199 248
```

All **33 origins** were reviewed.

Apart from the two rejected merges, the lost R-803 qualifier, and the standalone-sentence issues above, I found no omitted or hidden promise.

## Mutation method and results

Mutations ran in a disposable clone, with production changes restored after each run. Assertions were unchanged. Children excluded ambient `NANA_*` and `PI_CODING_AGENT_DIR`.

Evidence:

- Clone: `/tmp/ears-a2-review-6565cfe/`
- Logs: `/tmp/a2-review-evidence/`
- Drivers: `/tmp/a2-mutate.py`, `/tmp/a2-sample.py`, `/tmp/a2-extra.py`

**PINS means a cited assertion failed—not merely another assertion in the file.**

### Code-read set — executed first

The nine unmutated implemented split origins are R-134, R-138, R-178, R-179, R-180, R-181, R-194, R-197 and R-199. They produce **ten implemented children**, because R-181 produces two.

Test filenames below are under `packages/nana-pack/tests/`; `.test.mjs` is omitted.

| Row | Production mutation | Observed evidence | Ruling |
|---|---|---|---|
| R-806 | Check only final-component symlinks during writes | Cited checks pass; `handoff-symlink` parent-link overwrite assertion fails | **PARTIAL** |
| R-807 | Compare `NANA_HANDOFF` case-insensitively | Entire `handoff-writer-role` file passes | **PARTIAL** |
| R-819 | Remove `finish()`’s `toWellFormed()` | `objective-golden`: backstop assertion fails | **PINS** |
| R-820 | Change code-span cap comparison from `<=` to `<` | `display-surfaces`: exactly-at-cap assertion fails | **PINS** |
| R-821 | Replace newlines with spaces inside `locator()` | Cited exact-decode assertion fails | **PINS** |
| R-822 | Escape only the first UTF-16 unit | Cited astral round-trip assertion fails | **PINS** |
| R-823 | Leave astral characters literal inside the quoted result | Both-units assertion fails; round-trip still passes | **PINS** |
| R-825 | Remove `fs.existsSync(stranded)` from mismatch detection | Entire `agent-dir-config` file passes | **PARTIAL** |
| R-826 | Return `block: false` for an unusable policy | `agent-dir-hostile`: named-reason blocking assertion fails | **PINS** |
| R-827 | Write into the ambient directory during `install --pi-home` | Entire `agent-dir-parity` file passes | **PARTIAL** |

**Code-read total: 6 PINS / 4 PARTIAL.**

### Seeded sample

**Seed/revision:** `6565cfe`.

After excluding those ten children, the sorted remaining population contains **21 implemented split rows**. I applied `(n * 7 + 3) mod 21`, filling forward on collisions.

Selected zero-based indexes:

```text
3,10,17,4,11,18,5,12,19,6,13,20,7,14,0,8,15,1,9,16
```

| Row | Production mutation | Observed cited result | Ruling |
|---|---|---|---|
| R-798 | Suppress `handoff_cwd_mismatch` journaling | Journal assertion fails | **PINS** |
| R-808 | Inject the ancestor file’s text | Ancestor-text exclusion fails | **PINS** |
| R-815 | Invoke fallback after successful notifier completion | Both successful-notifier absence assertions fail | **PINS** |
| R-799 | Inject decoded text after a UTF-8 read failure | Nothing-injected assertion fails | **PINS** |
| R-809 | Require `.git` to be a directory | Linked-worktree root assertion fails | **PINS** |
| R-816 | Increase notifier deadline to 14,500 ms | Both citations pass; separate deadline assertion fails | **PARTIAL** |
| R-800 | Suppress `handoff_write_failed` journaling | Failed-write journal assertion fails | **PINS** |
| R-810 | Route adoption events through merged `cfg.journal.path` | Project- and relative-path exclusion assertions fail | **PINS** |
| R-817 | Journal notifier failures only when `hasUI` | Headless-journal assertion fails | **PINS** |
| R-801 | Overwrite the prior file before attempting atomic replacement | Byte-identity assertion fails | **PINS** |
| R-811 | Accept `.` and `..` as objective filenames | Producer-name parity assertions fail | **PINS** |
| R-824 | Return an empty string for throwing `toString()` | Named-placeholder assertion fails | **PINS** |
| R-802 | Inject summary text beside the stale pointer | Summary-exclusion assertion fails | **PINS** |
| R-812 | Treat unreadable journals as empty | Citation passes; unreadability assertions fail | **PARTIAL** |
| R-795 | Remove the path from write notifications | Write-notice assertion fails | **PINS** |
| R-803 | Append the raw hostile path to its escaped pointer | Raw-path exclusion assertions fail | **PINS*** |
| R-813 | Permit control characters through code-span validation | Forged-heading exclusion fails | **PINS** |
| R-796 | Create `.gitignore` beside the actual handoff | Entire cited store file passes | **PARTIAL** |
| R-805 | Leave a temporary file beside refused legacy handoffs | All three cited litter checks fail | **PINS** |
| R-814 | Register shutdown under the wrong event name | Shutdown-registration assertion fails | **PINS** |

\* Pins the original conditional clause; the branch sentence still needs its condition restored.

**Sample total: 17/20 PINS, 3/20 PARTIAL.**

## Untested rows and R-166

I searched the existing tests and inspected their assertions, including neighbouring malformed-config coverage.

| Row | Executed check / existing evidence | Ruling |
|---|---|---|
| **R-818** | Removing the OSC write’s `hasUI` guard leaves `notify-fallback` green. Its fixtures select Darwin/Windows notifier branches, not headless OSC output. | Keep **untested** |
| **R-880** | Removing the parent-realpath legacy-shape check leaves `handoff-trust` green. No applicable parent-alias assertion found. | Keep **untested** |
| **R-166** | Returning before notification dispatch leaves both successful-notifier absence assertions green. Failure-path assertions turn red, but do not establish successful notifier use. | Keep **untested** |

I also checked the split origins:

- **R-138:** case-folding mutation survives; the downgrade is justified.
- **R-173:** removing the headless opt-in guard leaves the notifier suite green; retain `untested`.
- **R-248:** removing case-insensitive legacy matching leaves the trust suite green; retain `untested`.

I found no existing assertion that justifies promoting these rows.

## Verdict

Mechanical verification passes. Clause preservation and citation honesty do not: the sample exceeds the PARTIAL threshold, four additional children overclaim coverage, and both merges need correction.

**VERDICT: BLOCK**  
**Score: 6/10**
