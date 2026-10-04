## Ranked findings

### MUST 1 — The injection cap does not bound the read; the new extension can crash or hang pi

**File:** `packages/nana-pack/extensions/nana-writing.ts:54–71`

`buildBlock()` reads and decodes the entire file before applying `WRITING_INJECT_CAP`. The surrounding `try/catch` cannot recover from process-level memory exhaustion or a synchronous read that never returns.

**Executed probes, in disposable files/processes:**

| Rule file | Result |
|---|---|
| Missing | No block; ENOENT cause |
| Unreadable, mode `000` | No block; EACCES cause |
| Invalid UTF-8 | No injection; cause journaled by the handler test |
| 8,000 characters | Exactly 4,000-character block, including truncation notice |
| FIFO without a writer | Still blocked after two seconds; probe killed |
| 64 MiB, Node heap limited to 32 MiB | **SIGABRT: JavaScript heap out of memory** |

The ordinary error cases work. The resource-failure cases violate the extension’s “never crash the agent” rule and its own `@errors` claim.

**Smallest fix:** Reject non-regular resources and bound allocation before decoding/materializing the whole file. Preserve the promised truncation and UTF-8 behavior with bounded processing. Test these failure paths in subprocesses.

### MUST 2 — Soft-wrapped sentences receive the preceding sentence’s line number

**File:** `packages/nana-pack/lib/writing-check.mjs:114–119`

The extractor trims leading whitespace from a sentence but computes its line from the **untrimmed** starting offset.

**Executed input:**
```text
DONE.
The file was edited by Jake.
```

**Actual finding:**
```text
-:1: passive: passive candidate: "edited" in "The file was edited by Jake."
```

The sentence starts on **line 2**. This contradicts Amendment A2’s explicit sentence-start rule and R-743. The repaired R-743 fixture checks banned-word line numbers, which use a different scanner.

**Smallest fix:** Map the first retained sentence character to its source line. Add CLI fixtures for length/passive findings beginning after a soft-wrapped sentence boundary.

### MUST 3 — Clause coverage and the required composition regression remain incomplete

**Files:** `packages/nana-pack/tests/writing-check.test.mjs`; `packages/nana-pack/tests/writing-injection.test.mjs:175–230`; `REQUIREMENTS.md:357–381`

All four original row mutations now fail. However, additional direct mutations expose unpinned clauses:

| Mutation in a disposable copy | Test exit |
|---|---:|
| Report only the first over-cap sentence | **0** |
| Scan identifiers in headings, tables and fences too | **0** |
| Print a trailer after the summary | **0** |
| Remove objective injection entirely | **0** |

These correspond to R-744’s **every sentence**, R-748’s **prose blocks only**, R-749’s **end its output**, and Amendment A5’s required **objective plus writing, each once** regression.

The summary CLI assertion is `/^summary /m`: it proves presence, not final position or uniqueness. The composition tests assert the writing block but never assert the objective block.

**Smallest fix:** Add fixtures that distinguish those clauses. For composition, seed a usable objective and assert the base, objective and writing blocks exactly once, in order, through the installed runner.

### MUST 4 — Injection tests modify the actual shipped rule

**File:** `packages/nana-pack/tests/writing-injection.test.mjs:49–89,119–167`

The test deletes the real rule, replaces it with a directory, writes invalid bytes and oversized content, and inserts a reload marker. It restores the file afterward.

This is the same file that running pi sessions and Claude Code’s installed symlink consume. Another session can read fixture content during the test. `finally` and an exit handler do not protect against SIGKILL or process crashes; the header’s “can never leave” assurance is false.

**Smallest fix:** Inject the rule path into the handler factory, retaining the production default, or exercise a disposable copy of the extension and resources. Tests must not mutate the installed source resource.

### SHOULD 1 — The documented passive calibration is now stale

**Files:** `packages/nana-pack/README.md:298–301`; `packages/nana-pack/lib/writing-check.mjs:149–152`

The README says the fixture measures **77.8% precision / 58.3% recall**. The amended fixture now prints:

- TP 8, FP 0, FN 4, TN 12
- **100.0% precision, 66.7% recall**

Those are diagnostic results on 24 sentences, not general performance estimates. Label the former figures as pre-fix results or replace them with the current measurement.

### SHOULD 2 — The seventh extension is absent from the “every handler” safety harness

**Files:** `packages/nana-pack/tests/config-handlers-malformed.test.mjs:4,20`; `docs/code-map.md:1120`

The shared template, root copy and READMEs say seven correctly. But the malformed-config harness still enumerates six extensions while claiming to test every registered pack handler. Its generated code-map entry repeats “six extensions.”

Add writing to the harness and regenerate the map. Historical research/review references to six need not change.

### SHOULD 3 — The tally instructions mix report and handoff measurements

**File:** `docs/reviews/writing-trial-2026-10-04/tally.md:3–5`

The tally prescribes `--report` both for reports and `HANDOFF.md` edits, then offers only “Reports checked” and combined sentence columns. Handoffs deliberately do not use the report-only checks. Mixing them also distorts the 20-report stop condition and separate corpus targets.

Document normal mode for handoffs and keep their sentence totals separate from report counts.

## Round-1 closure

| Round-1 item | Round-2 result |
|---|---|
| **MUST 1: context-file precedence** | **Closed.** Installed pi 1.0.2 loaded existing user `CLAUDE.md` and `AGENTS.override.md` instructions alongside the extension’s rule. No `AGENTS.md` was created. |
| **MUST 2: verdict failures** | **Closed.** “reopened” and empty input give `0/1`; numbered `DONE.` and heading-then-`DONE.` give `1/1`. |
| **MUST 3: formatting-dependent counts** | **Original probes closed.** Wrapped/unwrapped 26-word sentences match. Table separators and fenced content contribute no prose/check findings; report mode still correctly reports the absence of a verdict. New line-number defect above. |
| **MUST 4: seals** | **Closed for the five requested mutations.** All now fail; changing 25→24 fails exactly the sentence-cap seal. |
| **MUST 5: clause-pinning** | **Partially closed.** All four original mutations fail. Additional unpinned clauses remain above. |
| **SHOULD 1: passive calibration** | **Behavior closed.** Whole-word exceptions catch “needed” and suppress “green”/“wooden”; diagnostic fixture retained. Documentation is stale. |
| **SHOULD 2: aggregation/stopping** | **Substantially closed.** One passing plus one failing input gives `1/2`; tally and stop conditions exist. Corpus separation needs clarification. |
| **SHOULD 3: foreign-file installation failure** | **Closed by subtraction.** The pi context-file installation step and R-373–R-375 are gone, as amended. |

The rule itself now passes the checker without relying on soft wrapping. The banned word is present in a code span, and the decision-point paragraph is a list.

### Requested mutation results

| Mutation | Exit |
|---|---:|
| Minimum sentence words 3→4 | 1 |
| Verdict vocabulary reduced to LANDED | 5 |
| Exceptions reduced to `need` | 3 |
| Add `test` to banned vocabulary | 1 |
| Sentence cap 25→24 | 1 |
| Force CLI line numbers to 1 | 1 |
| First banned occurrence only | 1 |
| Ignore `--report` | 4 |
| Remove CLI summary | 5 |

Nonzero values are the harness’s failed-check counts.

## New-extension runtime review

### Composition works on installed pi 1.0.2

I independently loaded the pack through `DefaultResourceLoader`, seeded a real objective, and drove the actual `ExtensionRunner.emitBeforeAgentStart()`.

Across both precedence cases and repeated fresh loads:

- Existing user instructions survived.
- The objective marker appeared **once**.
- The writing heading appeared **once**.
- The objective preceded writing.
- Extension discovery returned seven entries, with objective before writing.

This confirms the implementation’s composition claim. It does **not** repair the missing regression assertion identified above.

### Reviewer, worker and subagent behavior

- **`pi-review` / `pi-worker`:** Their watchdog preserves ordinary extension loading and sets `NANA_HANDOFF=off`. Writing does not consult that variable or gate on `hasUI`. Repeating the runtime probe under that environment preserved both blocks. Caller-supplied extension-disabling options remain exceptions.
- **Subagents:** I executed the installed pi-subagents launch planner through pi’s extension loader:
  - Background child, default extension selection: ambient extensions enabled.
  - Foreground child: ambient extensions disabled.
  - Background child with `extensions: []`: ambient extensions disabled.
  - Background child explicitly selecting writing: writing included.

Thus writing reaches ordinary background children, but **not every possible child configuration**. Its scope paragraph excludes reviews and worker reports. No model calls were made to evaluate behavioral compliance with that exclusion.

Missing/unreadable/invalid-rule handlers degrade normally and journal their causes in the tested configuration. The unbounded-read failures remain blocking.

## Requirement audit

All **15 added or changed rows have exactly one `shall`**.

| Row | Clause-pinning assessment |
|---|---|
| R-742 | Stdin and `-` labeling pinned. |
| R-743 | Multiple files and banned-finding line numbers pinned; sentence-derived line numbers are wrong and untested. |
| R-744 | Single over-cap sentence, count and cap seal pinned; **every sentence** is not. |
| R-745 | Detection, whole-word exceptions and restored “needed” detection pinned. |
| R-746 | Case-insensitive matches, repeated occurrences and code-span exclusion pinned. |
| R-747 | Original negative/positive cases and CLI report behavior pinned. |
| R-748 | Identifier shapes and report switch pinned; **prose-only exclusion** is not. |
| R-749 | Pure summary counts/share pinned; CLI presence pinned, **final position/uniqueness** not pinned. |
| R-750 | Successful exit despite findings pinned. |
| R-751 | Writing append/heading pinned; required objective-composition regression incomplete. |
| R-752 | No-injection and journal causes exercised. The cited check itself asserts only no injection; cite the separate journal assertion too. |
| R-753 | Emitted-block cap and truncation notice pinned; does not guarantee bounded reading. |
| R-754 | All five reasons and reload pickup exercised. |
| R-301 | New writing-rule link/source pinned. Existing fourth-hook gap remains, explicitly carried by Amendment A4. |
| R-376 | Real rule passes the real checker with zero findings. |

R-373–R-375 were deleted as the amendment directed; their prior Windows-copy and remediation obligations no longer apply to pi delivery.

## Executed check results

| Check | Result |
|---|---|
| Checker tests | 39 passed |
| Injection tests | 21 passed |
| Writing-rule tests | 3 passed |
| Installer tests | 76 passed |
| Requirement rail | 534 rows; 460 implemented/traced |
| `map:check` | 169 modules; zero problems |
| `readme:check` | Five missing dependency-artifact paths |
| Full `npm test` | **90 PASS, 1 FAIL, 1 SKIP** across 92 files; 5,460 passing checks |

The full-suite failure remains `readme-check.test.mjs`: missing `apps/bench/.ext`, its `pi-web-access` child, and nana-knowledge’s `node_modules`. These are the previously recorded worktree dependency gaps, not new writing claims.

For `land-ruling.md`, ordinary wrapped and unfolded prose now both produce **14/55 over-cap sentences (25.5%)**, with identical word and check counts. The previous formatting-dependent share is gone.

The worktree is clean after verification. No implementation changes were made.

**VERDICT: BLOCK — 8/10.**
