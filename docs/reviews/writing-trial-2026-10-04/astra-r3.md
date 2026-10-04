## Ranked findings

### MUST 1 — UTF-8 recovery can discard genuinely invalid bytes

**File:** `packages/nana-pack/extensions/nana-writing.ts:135–145`

The new bounded read fixes the resource failures. However, its recovery loop assumes that removing up to four trailing bytes establishes a split UTF-8 character. It does not distinguish an incomplete character from malformed bytes.

**Executed probes:**

| Disposable rule | Result |
|---|---|
| 4,003 ASCII bytes, then `€`, then more text | Clean, capped injection |
| 4,002 ASCII bytes, then `😀`, then more text | Clean, capped injection |
| 4,003 ASCII bytes, then `0xff`, then more text | **Injection accepted; cause is null** |
| Invalid byte well inside the read window | Correctly refused |

The third input contains an invalid byte, not a character split by the read boundary. The loop removes it and accepts the file, contradicting R-752.

**Smallest fix:** Permit an incomplete trailing UTF-8 sequence, not arbitrary trailing-byte removal. Add positive split-character and negative malformed-tail fixtures.

Separately, bounded reading cannot establish that the *unread remainder* is valid UTF-8. Narrow that whole-file assurance explicitly; do not imply that the new implementation validates bytes it never reads.

### MUST 2 — The requested base-prompt regression assertion is still missing

**File:** `packages/nana-pack/tests/writing-injection.test.mjs:239–276`

The new tests now catch missing objective injection. However, the real-runner assertion checks only:

- One objective heading.
- One writing heading.
- Objective before writing.

It never checks the base prompt, despite its title saying all three appear exactly once. The stub checks only `startsWith("BASE")`.

**Additional executed mutation:** Replace the objective extension’s incoming prompt with the literal `"BASE"`, retaining the objective block.

**Result:** Injection suite exits **0**. Actual production base instructions would be discarded.

**Smallest fix:** Seed a distinctive base prompt through the installed runner and assert its exact preservation, count and ordering alongside the objective and writing blocks.

Production composition works in my independent probe. This is the remaining regression-coverage part of round-2 MUST 3, not an observed production composition failure.

### MUST 3 — R-753 introduces a second `shall`

**File:** `REQUIREMENTS.md`, R-753

The revised row contains both:

> “The injected block **shall** not exceed…”

and:

> “the read itself **shall** never exceed…”

The other fourteen branch-added or amended rows each have one `shall`. R-753 violates the stipulated row format.

The new read-budget clause also has weaker evidence than its wording: a successful 64 MiB-file run under a 32 MiB heap proves bounded resource use, but not the specific read ceiling.

**Smallest fix:** Express the obligations with one `shall`, or split them. Pin the byte-read ceiling directly rather than treating the heap probe as an exact-budget assertion.

## Round-2 closure

| Round-2 item | Round-3 result |
|---|---|
| **MUST 1: FIFO and memory exhaustion** | **Original failures closed.** FIFO refused immediately; 64 MiB file succeeds under a 32 MiB heap. New UTF-8 recovery defect above. |
| **MUST 2: wrapped-boundary line number** | **Closed.** Independent CLI probe reports the passive sentence on line 2. Both length and passive regression fixtures pass. |
| **MUST 3: four surviving mutations** | **All four now killed.** Base-prompt preservation remains unpinned, as detailed above. |
| **MUST 4: tests modify shipped rule** | **Closed.** Fixtures use disposable paths. Production default is read-only in tests; shipped-rule hash unchanged. |
| **SHOULD 1: stale passive calibration** | **Closed.** Documentation matches TP=8, FP=0, FN=4, TN=12: 100.0% precision, 66.7% recall. Correctly described as diagnostic. |
| **SHOULD 2: seventh extension missing from safety harness** | **Closed.** Writing is enumerated; malformed-config harness passes 98 checks; map updated. |
| **SHOULD 3: mixed tally corpora** | **Closed.** Reports use `--report`; handoffs do not. Separate counts and report-only stopping denominator are explicit. |

### Independently rerun mutations

Each mutation ran in a disposable package copy.

| Mutation | Exit |
|---|---:|
| Report only the first over-cap sentence | **1** |
| Scan identifiers in headings, tables and fences | **1** |
| Print a trailer after the summary | **1** |
| Remove objective injection | **2** |
| Replace incoming base instructions with literal `BASE` | **0 — survives** |

Nonzero values are failed-check counts.

## New-code and runtime review

### Resource bounds

Independent subprocess probes produced:

- **FIFO without writer:** exit 0, approximately 94 ms, `not a regular file (a FIFO)`, no block.
- **64 MiB ASCII rule, 32 MiB heap:** exit 0, approximately 94 ms, 4,000-character block with truncation notice.
- **Multibyte read-boundary cuts:** accepted without replacement characters, including a cut inside a four-byte character after a multibyte prefix.

The read loop handles short reads and bounds its buffer allocation before decoding. Descriptor closure is in `finally`.

### Production `{ rulePath }` compatibility

Installed pi reports **1.0.2**. Its extension loader calls:

```js
await factory(load.api);
```

Consequently, the optional second argument defaults correctly. I loaded the actual objective and writing extensions through that installed loader, without supplying test options.

Using the installed `ExtensionRunner`, a real objective and a distinctive forced base prompt, I verified:

- Base sentinel: **once**.
- Objective sentinel: **once**.
- Writing heading: **once**.
- Order: **base → objective → writing**.
- Complete shipped rule present.
- No extension-loading errors.

This probe also ran with `NANA_HANDOFF=off`. No model calls were necessary.

## Requirement re-audit

The branch adds or changes fifteen rows. Fourteen have one `shall`; R-753 has two.

| Row | Assessment |
|---|---|
| R-742 | Stdin reading and `-` labeling pinned. |
| R-743 | Multiple files, banned-finding coordinates and repaired length/passive coordinates pinned. Verdict coordinates remain a residual below. |
| R-744 | Count, cap seal and multiple over-cap sentences pinned. First-only mutation fails. |
| R-745 | Passive candidates and whole-word exceptions pinned. |
| R-746 | Case handling, repeated occurrences and code-span exclusion pinned. |
| R-747 | Positive/negative verdict cases, empty input and Markdown entry points pinned. |
| R-748 | Identifier shapes, report switch and prose-only exclusions pinned. Exclusion mutation fails. |
| R-749 | Summary counts/share and final, unique summary position pinned. Trailer mutation fails. |
| R-750 | Exit 0 despite findings pinned. |
| R-751 | Production append and objective composition work. Required base-preservation regression remains incomplete. |
| R-752 | Ordinary unavailable cases and journal causes pinned; FIFO refused. Malformed-tail recovery contradicts UTF-8 refusal. |
| R-753 | Output cap, notice and large-file resource behavior exercised. Two-`shall` defect; exact byte ceiling not directly pinned. |
| R-754 | Five session-start reasons and edited-rule reload exercised. |
| R-301 | Writing-rule link/source pinned. Existing fourth-hook coverage gap remains explicitly carried by Amendment A4. |
| R-376 | Actual shipped rule passes the actual checker with zero findings. |

R-373–R-375 remain removed as Amendment 1 directed.

## Residuals to RECORD at landing, not blockers

These warrant explicit limits rather than another expansion of this trial:

1. **Byte budget versus character notice.** A valid 2,000-character Chinese rule produced a 1,384-character block saying “cut at 4000 chars.” The declared byte budget permits earlier truncation; document that distinction and the imprecise notice.
2. **Filesystem race.** `statSync(path)` precedes `openSync(path)`. This rejects a stable FIFO, not a regular-file-to-FIFO replacement between those calls. Record the stable, trusted shipped-resource assumption; avoid an unconditional “never hangs” assurance.
3. **Base-test gap versus runtime evidence.** The production composition probe passes. Fixing its regression assertion is required, but no injector redesign is justified.
4. **FIFO fixture portability.** Without `mkfifo`, the new test fails rather than skips. I reproduced that by removing utilities from `PATH`. Record the test prerequisite; native Windows was not exercised.
5. **Verdict finding coordinates.** A heading followed by a failing first prose sentence on line 3 still reports the verdict at line 1. This is a low-consequence report-only limitation, but R-743’s newly broad wording should acknowledge the exception.
6. **Existing trial limitations.** Abbreviation splitting, heuristic passive detection, extension-disabled children, and behavioral compliance with the technical-record exclusion remain outside demonstrated guarantees.
7. **Existing worktree dependency gaps.** The README check remains red for absent dependency artifacts, not writing changes.

The malformed-byte acceptance, missing requested regression assertion and R-753 row defect are **not** merely items to record as completed.

## Executed checks

| Check | Result |
|---|---|
| Writing checker | **44 passed** |
| Writing injection | **21 passed** |
| Writing rule | **3 passed** |
| Malformed-config handlers | **98 passed** |
| Installer | **76 passed** |
| Requirement rail | **534 rows; 460 implemented/traced** |
| `map:check` | **169 modules; zero problems** |
| `readme:check` | **Five missing-path problems** |
| Full `npm test` | **90 PASS, 1 FAIL, 1 SKIP; 5,465 passing checks** |
| `git diff --check cb21608..b21c170` | Clean |

The completed full-suite run took approximately 284 seconds. Its sole failing file was `packages/nana-pack/tests/readme-check.test.mjs`, covering the previously recorded missing bench and knowledge dependency paths. An initial run hit my 200-second command timeout; I reran it to completion.

**Shipped rule SHA-256, identical before and after `npm test`:**

```text
6dff692dbc09a3ad5dafa5334048ff9ea980a05484907aa38e90840c1f7f1bfa
```

The worktree remains clean. No implementation files were changed.

This is round three: implement and verify the narrow corrections above, then seek the landing ruling—not another unchanged review round.

**VERDICT: BLOCK — 8/10.**
