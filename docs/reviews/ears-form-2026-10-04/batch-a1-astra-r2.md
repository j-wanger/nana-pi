# Batch A1 — Round 2 review

**VERDICT: BLOCK — 8/10, mechanical corrections only.** The redraw yields **19 PINS / 1 PARTIAL**. No promise was lost or hidden.

The judgement threshold passes. Two evidence citations still need correction before landing; neither requires another redraw.

Reviewed `892809f` against `main` at `3d7072b`. The reviewed worktree remains clean.

## Findings

### MUST — Close two evidence errors before landing

These are mechanical closure items under `design-ruling.md` §2: every discovered PARTIAL must receive the right citation or an honest status.

**1. R-759’s new citation does not assert the remedy.**

`REQUIREMENTS.md:53` now cites:

```text
T2c ${label}: trustRecord problem === ${problem}, store === the active store
```

I replayed the round-1 mutation: change the unwritable-folder remedy to blame the nonexistent store.

- The cited `trustRecord` assertions **still pass**, including both absent-store fixtures.
- Eight other assertions fail, including the absent-store paragraph and remedy checks.
- The cited assertion checks the diagnostic object, not the rendered advice.

**Correction:** cite the existing paragraph/remedy assertion that actually fails. No new test is needed. This round-1 item is **not closed**.

**2. R-783’s citations do not cover the queue key.**

The standalone sentence now explicitly promises that the resolved edited path feeds the command, digest **and queue key**.

I changed:

```ts
res = await queue(abs, guarded);
```

to:

```ts
res = await queue(ctx.cwd, guarded);
```

Results:

- Its cited `post-edit-hardening.test.mjs` stays entirely green.
- That harness runs without pi’s queue.
- `post-edit-file-queue.test.mjs` fails, including:
  - `checker is gated while pi holds the file's mutation queue`
  - `checker ran strictly after the queue was released`

**Correction:** retain the command/digest citations and add existing queue-sensitive evidence, with its marker and mapping entry.

### SHOULD — The verifier’s new seal exception permits assertion weakening

The fix adds a substring-based exemption in `apply-batch.mjs`:

```ts
content.includes(sealOld) || content.includes(sealNew)
```

In a disposable copy, I changed the seal comparison from:

```ts
EARS_ALLOWANCE === 157
```

to:

```ts
EARS_ALLOWANCE === 157 || true
```

Running the verifier with `--base main` returned **exit 0, ALL CHECKS GREEN**.

The exemption permits more than the authorized numeric retune. Compare the complete normalized assertion line, not a substring.

This is a defect in the **new verification logic**. The actual branch does not contain that assertion weakening.

## Round-1 closure

| Item | Re-executed evidence | Closure |
|---|---|---|
| R-763 | Block custom/out-of-scope tools except `read`; both formerly cited files remain green | **Closed:** now `untested`, with the precise coverage gap recorded |
| R-781 | Disable post-edit under malformed unrelated `notify: 7`; malformed-config suite remains green | **Closed:** now `untested`, with the precise coverage gap recorded |
| R-768 | Bypass inspection above `MAX_SUBJECT`; newly cited subject-cap assertion fails | **Closed:** citation now distinguishes checking from default allowance |
| Verifier’s two prior controls | Simultaneously invert the catastrophic-regex assertion and rewrite R-001 to “shall inject nothing”; run with `--base main` | **Closed for both controls:** exit 1 names R-001 and both changed assertion lines |
| R-759 | Blame the nonexistent store instead of the unwritable folder | **Open:** correct tests fail, but the newly selected citation stays green |
| R-761 | Let live `isProjectTrusted()` suppress the label | **Closed:** both live-trust hook-versus-pi equality assertions fail |
| R-794 | Ignore configured `receipts.dir` | **Closed:** six cited hostile-path receipt assertions fail |
| R-760 | Re-read obstructed-lock advice; replay held-lock deletion advice mutation | **Closed:** `violated` accurately preserves the obstruction contradiction; fresh/future-lock tests still catch deletion advice |
| R-764 | Read the rewritten sentence independently | **Closed:** names the documented dangerous command form |
| R-771 | Read the rewritten sentence independently | **Closed:** names the shell-computed-path limitation |
| R-783 wording | Read the rewritten sentence independently | **Closed for wording:** coverage remains PARTIAL, as above |

R-771 and R-777 remain honestly `untested`. The four untested split rows and one violated split row retain their promises visibly.

## Redrawn sample

**Seed/revision:** `892809f`.

There are **32 implemented split rows**. Only **12** were not mutated in round 1, including its follow-up probes. Excluding all prior mutations therefore cannot supply 20 rows; I used the full sorted population.

Applied `(n * 11 + 5) mod 32`, zero-based:

```text
5,16,27,6,17,28,7,18,29,8,19,30,9,20,31,10,21,0,11,22
```

All indexes are unique; no forward filling was needed.

Test filenames below are under `packages/nana-pack/tests/`; `.test.mjs` is omitted. **PINS means a cited assertion failed**, not merely another assertion in the same file.

| Row | Behaviour mutation | Observed cited result | Ruling |
|---|---|---|---|
| R-765 | Keep empty-matching allow patterns | `gate-survives-mutation`: “still exempt nothing” fails | **PINS** |
| R-778 | Accept only direct canonical-cwd records, not ancestor records | `config-trust`: parent-trust assertion fails | **PINS** |
| R-790 | Render the failure count in warning rather than error colour | `post-edit-status`: exact failure-chip assertion fails | **PINS** |
| R-766 | Treat piped interpreters with script operands as floor | `gate-corpus`: script-operand allowance assertions fail | **PINS** |
| R-779 | Recompute trust instead of retaining session evidence | `config-trust`: mid-session settings assertion fails | **PINS** |
| R-791 | Rethrow after `setStatus` fails | `post-edit-status`: throwing-status containment assertion fails | **PINS** |
| R-767 | Make recursive removal of `.` floor | `gate-corpus`: exemption under `^rm` fails | **PINS** |
| R-780 | Remove session identity from diagnostic deduplication | `config-handlers-malformed`: new-session warning assertion fails | **PINS** |
| R-792 | Store the raw model path in receipt inputs | `post-edit-hardening`: three hostile-path binding assertions fail | **PINS** |
| R-768 | Bypass inspection above 64 KB | `gate-corpus`: longer-command assertion fails | **PINS** |
| R-782 | Publish status with zero matching outcomes | `post-edit-status`: no-match status assertion fails | **PINS** |
| R-793 | Discard valid commands when malformed entries exist | `receipt-binding`: valid-check assertion fails | **PINS** |
| R-769 | Suppress excess-allowPatterns diagnostics | `gate-corpus`: named `config_invalid` assertion fails | **PINS** |
| R-783 | Queue against the cwd instead of the resolved edited file | `post-edit-hardening`: entire cited file stays green | **PARTIAL** |
| R-794 | Ignore configured receipt-store relocation | `post-edit-hardening`: six cited assertions fail | **PINS** |
| R-770 | Accept malformed agent-directory variable spellings | `agent-dir-var-spellings`: six malformed-spelling assertions fail | **PINS** |
| R-784 | Record lock refusal as `checks_passed` | `post-edit-file-queue`: `not_run` receipt assertion fails | **PINS** |
| R-758 | Append refused symlink-target contents to unavailable-objective output | `objective-injection`: target-content exclusion assertion fails | **PINS** |
| R-772 | Omit `config_gate_fallback` diagnostics | `config-gate-fallback`: fallback-journal assertion fails | **PINS** |
| R-785 | Omit model feedback after lock refusal | `post-edit-file-queue`: refusal-feedback assertion fails | **PINS** |

**Sample total: 19/20 PINS, 1/20 PARTIAL.**

R-759 is an additional closure failure, **outside this sample denominator**.

## Mechanical and promise verification

I ran:

```sh
node docs/reviews/ears-form-2026-10-04/apply-batch.mjs \
  docs/reviews/ears-form-2026-10-04/batch-a1.json --base main

node --experimental-strip-types \
  packages/nana-pack/tests/requirements-trace.test.mjs

npm run map:check

git diff main..HEAD -- '*.test.*' '*test*'
```

Results:

- Verifier: **ALL CHECKS GREEN**, zero rows added, no worktree changes.
- Rail: **588 rows; 500 implemented; 157 off form, allowance 157**.
- Rail test: **8 checks passed**.
- Code map: **0 problems**.
- No pre-existing ID disappeared.
- Changed pre-existing rows are exactly the 37 origins and G-013/G-015 evidence updates.
- All **16 changed test files** are byte-equivalent after removing requirement-marker lines and normalizing the authorized **194 → 157** seal retune.
- No other assertion changed.
- Sibling-cite list: empty.

I reread **all 37 base origins against their final clauses**. No promise was lost, narrowed away or hidden by merging.

**R-050 merge remains accepted.** Dropping the catastrophic configured regex makes its cited enforcement assertion fail. This additional mutation is outside the sample.

All **13 relevant test files passed baseline execution**. An unrelated global-loader case in `post-edit-status` skipped; every sampled assertion executed. Mutation children excluded ambient `NANA_*` and `PI_CODING_AGENT_DIR`.

## Fix-introduced defects and disposition

The fix introduces two identifiable problems:

1. R-759 changes to `implemented` with the wrong assertion citation.
2. The new seal exemption accepts changes beyond the authorized retune.

R-783’s queue-coverage gap was inherited, not introduced by its wording repair. No production-behaviour regression was introduced by this commit.

Evidence and mutation logs are retained under `/tmp/ears-a1-r2-review/` and `/tmp/ears-a1-r2-verifier/`.

The **judgement/redraw bar passes**. Correct the two citations mechanically; tighten the verifier’s seal exception before relying on it for subsequent batches. The seat can verify those corrections without another sampled review.

**VERDICT: BLOCK — mechanical closure only**  
**Score: 8/10**
