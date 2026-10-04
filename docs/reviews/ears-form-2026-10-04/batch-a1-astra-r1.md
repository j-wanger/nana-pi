# Batch A1 review

**VERDICT: BLOCK — 6/10.** The seeded sample yields **17 PINS / 3 PARTIAL**, exceeding the brief’s two-row limit.

Reviewed `404644f` against `main` at `3d7072b`. The reviewed worktree remains clean.

## Findings

### MUST — Three sampled rows overclaim their cited evidence

1. **R-763 — custom tools are not covered.**  
   `REQUIREMENTS.md:74` promises reads, custom tools and extension commands pass untouched. I changed the gate to block out-of-scope tools except `read`. Both cited test files remained green. Their assertions exercise `read`, not custom tools.

2. **R-781 — “every other extension” exceeds the assertions.**  
   `REQUIREMENTS.md:138` promises continued operation across extensions. I made post-edit silently return when the unrelated `notify` block equals malformed value `7`. The cited malformed-config suite remained green. It asserts gate and objective behaviour, but supplies no working post-edit command in that scenario.

3. **R-768 — allowing a benign command does not prove inspection.**  
   `REQUIREMENTS.md:88` cites `benign 4 MB command ALLOWs`. I bypassed inspection for commands longer than `MAX_SUBJECT`. **That cited assertion remained green.** The file failed elsewhere, at `subject cap: a longer command gets no exception`.

Correct these statuses or citations before landing. Under the review contract, **3/20 PARTIAL requires the judgement-fix/redraw path**.

### SHOULD — The verifier does not establish its claimed branch-level invariants

`docs/reviews/ears-form-2026-10-04/apply-batch.mjs` compares its current input with its own output, not the branch against its base.

In the disposable copy, I simultaneously:

- inverted the catastrophic-regex assertion from expecting `BLOCK` to expecting `ALLOW`;
- rewrote unrelated on-form R-001 to “The pack shall inject nothing.”

The verifier still returned **exit 0, ALL CHECKS GREEN**.

Its test-line check also examines only files in `markerEdits` and stops at the first divergence. On an idempotent run, it checks no existing diff.

This does **not** invalidate this branch’s manually verified diff. It does invalidate relying on this verifier for those guarantees in later batches. Compare against an explicit base revision and examine every changed test line.

### SHOULD — Three `untested` rows already have mutation-sensitive evidence

R-759, R-761 and R-794 have existing assertions that fail when their behaviour breaks. Details appear below. Their “no test pins this clause” evidence is inaccurate.

### SHOULD — R-760 retains an inherited contract contradiction

`REQUIREMENTS.md:55` forbids removal advice for **obstructed**, fresh and future-dated locks.

However, `packages/nana-pack/lib/objective.ts:479–480` tells the owner to **“move it aside first”** for an obstructed lock path. The cited no-removal assertion covers fresh/future empty locks, not obstruction.

The fresh-lock mutation pins successfully, but that does not justify the row’s complete `implemented` status. Preserve the intended distinction explicitly or record the contradiction as `violated`; do not silently narrow the promise.

### SHOULD — Some split sentences still depend on their siblings

The standalone-sentence rule is not fully met:

- R-764: “merely mention **one**”
- R-771: “**That residual**”
- R-783: “**That one resolution**”

Name the dangerous command form, shell-computed-path limitation and edited-path resolution directly.

## Mechanical verification

I ran:

```sh
node docs/reviews/ears-form-2026-10-04/apply-batch.mjs \
  docs/reviews/ears-form-2026-10-04/batch-a1.json

git diff main..HEAD -- '*.test.*' '*test*'

node --experimental-strip-types \
  packages/nana-pack/tests/requirements-trace.test.mjs
```

Results:

- Verifier: **ALL CHECKS GREEN**, zero rows added, no worktree changes.
- Rail: **588 rows; 500 implemented; 157 off form, allowance 157**.
- Rail test: **8 checks passed**.
- No pre-existing ID disappeared.
- Changed pre-existing rows are exactly the 37 origins plus G-013/G-015 evidence updates.
- All **16 changed test files** are byte-equivalent after removing `// req:` lines and normalizing the authorized seal update.
- **No assertion moved.** Strictly, the diff is not comments-only: the authorized seal assertion changes **194 → 157**.

The sibling-cite list is empty.

## Origin and merge audit

I compared **all 37 main-branch origins** with their branch clauses:

`R-016, 026, 027, 032, 036, 038, 039, 043, 045, 046, 047, 048, 050, 053, 056, 063, 067, 070, 071, 072, 073, 075, 078, 082, 083, 084, 089, 091, 092, 093, 096, 097, 099, 100, 103, 104, 106`.

**No promise was lost or hidden by the split.** The standalone wording and inherited contradiction findings above remain.

**R-050 merge: accepted.** In context, retaining and enforcing the owner’s catastrophic regex expresses the same observable policy as not policing that regex. Rejecting `(a+)+$` made its cited assertion fail. Shared citations alone would not justify a merge; the semantic equivalence does.

R-097’s downgrade is appropriate: an immediately passing command does not prove the absence of a deadline.

## Mutation results

Disposable copy and logs: `/tmp/ears-a1-review/`.

All mutations changed production behaviour, not assertions. Each mutation was isolated and restored afterward. All **14 relevant test files passed baseline execution**. Ambient `NANA_*` and `PI_CODING_AGENT_DIR` variables were removed.

An unrelated global-loader case in `post-edit-status.test.mjs` skipped; the sampled assertions executed.

**Seed:** `404644f`. Sorted implemented split IDs: 32.  
**Indexes:** `3,10,17,24,31,6,13,20,27,2,9,16,23,30,5,12,19,26,1,8`.  
All indexes were unique; no forward filling was necessary.

Test filenames below are under `packages/nana-pack/tests/`, with `.test.mjs` omitted.

| Row | Behaviour mutation | Cited test / observed result | Ruling |
|---|---|---|---|
| R-763 | Block custom/out-of-scope tools while leaving `read` untouched | `config-gate-fallback`, `gate-status`: both green | **PARTIAL** |
| R-770 | Accept malformed agent-directory variable spellings | `agent-dir-var-spellings`: six malformed-spelling assertions fail | **PINS** |
| R-779 | Recompute trust on every load instead of using session evidence | `config-trust`: mid-session settings assertion fails | **PINS** |
| R-786 | Omit queue-unavailable journal event | `post-edit-hardening`: absence-journal assertion fails | **PINS** |
| R-793 | Drop valid commands too when the list contains malformed entries | `receipt-binding`: valid-check assertion fails | **PINS** |
| R-766 | Treat piped interpreters with script operands as floor | `gate-corpus`: script-operand allowance assertions fail | **PINS** |
| R-774 | Bypass command detection when configured gate arrays are null | `gate-config-robustness`: built-in-deny assertion fails | **PINS** |
| R-782 | Publish status even with zero matching outcomes | `post-edit-status`: no-match status assertion fails | **PINS** |
| R-789 | Classify timeout zero as an elapsed deadline | `receipt-binding`: zero-timeout passing-check assertion fails | **PINS** |
| R-762 | Block despite selecting “Allow once” | `gate-corpus`: Allow-once assertion fails | **PINS** |
| R-769 | Suppress the excess-allowPatterns diagnostic | `gate-corpus`: named config-invalid assertion fails | **PINS** |
| R-778 | Accept only a direct canonical-cwd trust record, not an ancestor record | `config-trust`: parent-trust assertion fails | **PINS** |
| R-785 | Omit model feedback when locking fails | `post-edit-file-queue`: refusal-feedback assertion fails | **PINS** |
| R-792 | Record the raw model path rather than the resolved receipt-input path | `post-edit-hardening`: three hostile-path binding assertions fail | **PINS** |
| R-765 | Retain empty-matching allow patterns | `gate-survives-mutation`: “still exempt nothing” assertion fails | **PINS** |
| R-773 | Remove the fresh-process malformed-project stop, resurrecting user exceptions | `config-project-gate-fallback`: cancelled-exception assertion fails | **PINS** |
| R-781 | Disable post-edit under an unrelated malformed notify block | `config-handlers-malformed`: entire file stays green | **PARTIAL** |
| R-788 | Report completion instead of skipped after abort | `post-edit-status`: aborted-chip assertion fails | **PINS** |
| R-760 | Tell the owner to delete a held lock | `objective-golden`: cited fresh/future-lock assertions fail | **PINS*** |
| R-768 | Return no hit immediately for every command over 64 KB | `gate-corpus`: cited 4 MB assertion stays green; another assertion fails | **PARTIAL** |
| R-050, merged | Discard catastrophic extraPattern `(a+)+$` | `gate-corpus`: catastrophic-pattern assertion fails | **PINS** |

\* R-760’s successful mutation does not resolve its obstructed-lock contradiction.

**Sample total: 17/20 PINS, 3/20 PARTIAL.** R-050 is additional, not part of that denominator.

## Five `untested` rows

All five carry the standard split-origin/date/“no test pins this clause” evidence sentence.

| Row | Is `untested` honest? | Existing evidence |
|---|---|---|
| R-759 | **No, for the intended wrong-object remedy contract.** | `objective-golden` T13 explicitly exercises absent stores beneath unusable paths. Changing the unwritable-folder remedy to blame the nonexistent store fails the absent-store paragraph/remedy assertions. The mapping’s claim that no absent-store fixture exists is false. |
| R-761 | **No, for observable dependence on live/auto-trust.** | Existing fixtures provide `isProjectTrusted() === true` without recorded trust. Making that value suppress the label fails both corresponding hook-versus-pi equality assertions. Literal consultation with no observable effect is not what these tests prove. |
| R-771 | **Yes.** | I found no assertion proving sandbox-only closure of the shell-computed-path limitation. This remains an architectural limitation, not an exercised enforcement guarantee. |
| R-777 | **Yes.** | I found no assertion enforcing the “never claimed un-bypassable” documentation promise. |
| R-794 | **No.** | Ignoring configured `receipts.dir` fails six existing hostile-path assertions in `post-edit-hardening`. Those fixtures change HOME during writing and restore it before reading; the configured location keeps both operations on the same store. `receipt-binding` alone remains green. |

No new tests are needed to correct these citations.

## Verdict

The text split preserves the promises, and the actual branch diff respects the assertion-edit boundary. The coverage judgement fails the agreed threshold.

**VERDICT: BLOCK**  
**Score: 6/10**
