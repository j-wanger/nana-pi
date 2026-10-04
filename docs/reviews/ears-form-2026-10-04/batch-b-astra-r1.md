# Batch B — one-round review

**VERDICT: BLOCK**  
**Score: 4/10**

Reviewed `b5c6c73` and `42e46e0` on `feat/ears-b`, against `main` at `afc026a`.

The mechanical checks pass. **All 10 merges conceal separable promises.** Additional form findings concern lost scope and a narrowed guarantee.

The record-coverage gap rate is **66/83 implemented rows — 79.5%**. These gaps are **NOTEs**, not verdict gates.

## 1. Command verification

Commands ran from the reviewed worktree:

```sh
node docs/reviews/ears-form-2026-10-04/apply-batch.mjs \
  docs/reviews/ears-form-2026-10-04/batch-b.json --base main

node docs/reviews/ears-form-2026-10-04/refusal-test.mjs
node packages/nana-pack/tests/requirements-trace.test.mjs
git diff --check
```

| Check | Result |
|---|---|
| Batch verifier | **ALL CHECKS GREEN**; zero rows added |
| Refusal test | **ALL PASS**; affected files byte-identical |
| Invalid `pins` experiment | **Correctly refused**, exit 1 before writing |
| Files affected by invalid-`pins` experiment | SHA-256 hashes unchanged |
| Requirements trace tests | **8 passed** |
| Off-form count and allowance | **53 / 53** |
| `git diff --check` | Clean |
| Reviewed worktree after verification | Clean |
| Replay checkout after restoration | Clean |

For the invalid-`pins` experiment, I changed one record in a temporary mapping to text absent from its sentence. The verifier reported:

> mutation record #0 pins is missing, empty, or not a substring of the clause's own text: R-204

I did not rerun the full repository suite.

## 2. FORM — MUSTs

I read all **47 origins** against all **100 resulting clauses**, grouped by package: knowledge **15**, stage **10**, setup **22**.

### MUST 1 — Undo all 10 merges

The required test is separability, not whether one large mutation breaks both promises. Sharing a branch, helper, comparison or ternary does not make promises synonymous.

The following are concrete counter-mutation witnesses. They are source-level separability arguments, not claims that I executed additional mutation hunts. Where the prescribed replay supplies direct evidence, I identify it.

| Origin → merged row | Counter-mutation: break one promise while retaining another | Ruling |
|---|---|---|
| R-304 → R-304 | Return exit 0 for reported problems while retaining the occupied-directory refusal, diagnostic and untouched files. | **Split** reporting/preservation, exit status and backup prohibition as originally promised. |
| R-315 → R-315 | Reject `--yes` during argument parsing without introducing any prompt. | **Split** never prompting from accepting a no-op flag. |
| R-324 → R-324 | Keep tilde expansion, relative resolution and realpath matching; remove cross-checkout/worktree identity matching. | **Split** path normalization from repository-identity equivalence. |
| R-333 → R-333 | Keep `lstat` and the no-write guard; remove the skipped diagnostic or its description of the obstruction. | **Split** presence detection from reporting/preservation. |
| R-348 → R-348 | Ignore `CLAUDE_CONFIG_DIR` while retaining transcript-path preference under the default directory. Replay **82** demonstrates this: preference checks pass, alternate-directory handling fails. | **Split** preference from alternate-directory support. |
| R-349 → R-936 | Retain bash-hook filtering but remove only the knowledge command’s environment-prefix stripping. | **Split** exclusion from command rewriting. |
| R-351 → R-938 | Keep doctor’s stale-file detection and install’s refresh; suppress only the backup. Doctor and install also have separate recorded mutations already. | **Split** stale-copy diagnosis/refresh from handwritten-file backup. |
| R-354 → R-354 | Replace the missing-template-value error with an empty string while preserving opt-in, idempotence and valid-value rendering. | **Split** missing-value refusal from service installation/rendering. |
| R-355 → R-355 | Always omit the environment entry. Default-directory omission remains correct; non-default export fails. Replay **92** reproduces the export failure. | **Split** the two conditional outcomes. |
| R-358 → R-358 | Keep the `--home` early return without running `pi install`; change its reported status or explanation. | **Split** non-execution from skipped reporting. |

References: `REQUIREMENTS.md` rows above and `docs/reviews/ears-form-2026-10-04/batch-b.json`’s `merged` array.

Two particularly clear contradictions in the mapping:

- R-355’s rationale explicitly describes **two independent mutations breaking different halves**. That demonstrates separability.
- R-354’s rationale calls itself an **“attempted merge”** of several guarantees. Making the bundle untested does not repair its form.

Restoring the original clause boundaries requires **11 additional rows**, because R-304 merged three original clauses.

### MUST 2 — Restore the card/table-value scope

At `REQUIREMENTS.md:586`, R-270 reads:

> An object value or anything that mutates or vanishes on replay shall be rejected.

Its origin, R-252, concerns **card and table values**. The extracted sentence drops that scope and becomes an unrestricted rejection rule.

Repeat the card/table-value condition in R-270. A standalone requirement must not rely on its sibling to identify what it rejects.

### MUST 3 — Preserve missing-parent refusal beyond dry-run

At `REQUIREMENTS.md:689`, R-931 restricts refusal to:

> project --dry-run shall still abort.

The origin’s second clause promised that **“a missing parent shall still abort”**, without that new restriction. Its cited test confirms the broader interpretation: `project.test.mjs:419–421` invokes ordinary `project`, **without `--dry-run`**.

Preserve missing-parent refusal for `project`, including dry-run. Do not narrow the guarantee to fit the neighboring clause.

### MUST 4 — Make the split preflight condition standalone

At `REQUIREMENTS.md:654`, R-924 begins:

> IF either parse or shape-validation fails …

It no longer names **settings.json**, and “the file” consequently depends on R-320.

Repeat the file and preflight subject in the extracted sentence. This restores the original condition’s referent rather than changing behavior.

## 3. READ — record-coverage NOTEs

I read all **83 implemented rows** against their attached records.

The table distinguishes:

- **Q:** a named condition or outcome is absent from the union of `pins` quotes.
- **M:** words are quoted, but the recorded mutation does not establish them. Breaking one conjunct does not cover untouched conjuncts.

A condition mentioned elsewhere in the mapping does not replace this row’s required quote. These are downgrade findings, not requests for another mutation hunt.

### Knowledge — 19 gaps / 23 implemented

| Row | Uncovered words | Basis |
|---|---|---|
| R-204 | “WHERE a root is declared ledger”; “emit one row per entry”; “contains [uses:” | Q; disabling a prefix branch does not break the `[uses:` requirement. |
| R-882 | “WHERE a root is declared ledger” | Q |
| R-207 | “shall be purged only when” | Q/M: preventing permitted purges does not exercise prohibition of other purges. |
| R-883 | “WHEN a root is missing”; “treated as non-fatal” | Q/M: removing detection leaves the build non-fatal. |
| R-211 | “WHERE a discover block is configured”; “an immediate child of a listed parent”; “shall count as a repo” | Q |
| R-884 | “WHERE a discover block is configured”; “each listed subdir a counted repo has”; “an articles root” | Q/M: changing `discovered` does not change root kind. |
| R-885 | “A malformed discover block” | Q |
| R-219 | “In the prose fields” | Q |
| R-887 | “In the prose fields” | Q |
| R-223 | “safe integer” | M: the mutation removes only positivity checking. |
| R-889 | “IF a row cannot be rendered” | Q |
| R-890 | “dropping already-shown pointers”; “nothing shall be printed” | Q/M: removing the early return changes `all-shown` to `empty-block`; output remains null. |
| R-230 | “the index is missing”; “a detached background build shall be spawned”; “the existing index queried as-is” | M/Q: the mutation changes existing-index age handling only. |
| R-231 | “ts, cwd, session id, source”; “hits” | M: deleting `tokens` leaves the other fields intact. |
| R-893 | “deduped prompts shall not be logged” | M: the record adds logging on a skip-reason path, not the dedup path. |
| R-232 | “Every build path shall take build.lock atomically with its pid inside” | Q |
| R-234 | “IF the child times out on the handler's own timer, exits non-zero, is missing or prints nothing” | Q: the record instead exercises a null result from a deduped prompt. |
| R-895 | “IF the child times out on the handler's own timer, exits non-zero, is missing or prints nothing” | Q: the replay throws on normal dedup, not those failure cases. |
| R-896 | “log source pi” | Q |

### Stage — 20 gaps / 25 implemented

| Row | Uncovered words | Basis |
|---|---|---|
| R-250 | “at the tool_result boundary by one validator” | M: bypassing validation does not independently exercise boundary placement or validator uniqueness. |
| R-266 | “a type”; “a scope” | M: only title validation changes. |
| R-267 | “a bad slot” | M: only reserved/unknown type checks change. |
| R-251 | “WHERE the block is a table” | Q |
| R-268 | “WHERE the block is a table” | Q |
| R-269 | “WHERE the block is a table” | Q |
| R-252 | “Card and table values”; “strings, booleans or finite numbers only” | Q/M: the mutation changes null acceptance only. |
| R-270 | “anything that mutates or vanishes on replay” | M: accepting objects does not cover the other replay-changing values. |
| R-271 | “where rowPrompt substitutes the row” | Q |
| R-255 | “shall be rejected rather than thrown on” | Q/M: the records do not break the non-throwing guarantee. |
| R-257 | “WHERE a per-session key exists”; “over the canonical JSON excluding produced_by.sig — key-order independent”; “HMAC-SHA256” | Q/M: hashing a fixed payload retains the algorithm. |
| R-273 | “WHERE a per-session key exists” | Q |
| R-261 | “hard-bounded per block and per tool result” | Q |
| R-262 | “IF any block is malformed”; “become an error” | Q/M: removing diagnostic details leaves error status intact. |
| R-276 | “IF any block is malformed” | Q |
| R-277 | “IF any block is malformed”; “other details kept” | Q/M: returning unstripped details preserves the other details. |
| R-263 | “WHERE blocks arrive through the MCP adapter”; “stamped” | Q/M: disabling extraction does not independently exercise stamping of extracted blocks. |
| R-278 | “WHERE blocks arrive through the MCP adapter”; “naming the cap” | Q/M: removing overflow detection does not isolate diagnostic correctness. |
| R-279 | “WHERE blocks arrive through the MCP adapter” | Q |
| R-264 | “root first”; “replacing a repeated id in place while keeping first-appearance order”; “excluding abandoned branches” | M/Q: walking all entries breaks branch selection, not replacement ordering; the latter guarantees lack quotes. |

### Setup — 27 gaps / 35 implemented

| Row | Uncovered words | Basis |
|---|---|---|
| R-303 | “declare the requirements name” | Q |
| R-920 | “imperative, and distinct from nana-soul.md” | M: padding the file changes length only. |
| R-304 | “IF a regular directory occupies the skill path”; “left untouched”; “install and --dry-run exiting 1”; “nothing backed up inside the skills directory” | Q/M: the replay leaves the owner’s file untouched. |
| R-921 | “shall have no installer step” | Q |
| R-317 | “tokenized with shell-quoting rules, leading VAR=value dropped, argv[0] the interpreter, argv[1] a path ending in that script plus the expected argument” | Q |
| R-922 | “one that cannot be parsed”; “shall read as not installed” | Q |
| R-318 | “A look-alike command shall not suppress the real hook” | M: the recorded citation is the empty-settings case, which fails before the look-alike scenario runs. |
| R-923 | “kept as-is” | M: adding a duplicate leaves the handwritten entry unchanged. |
| R-320 | “parse” | M: only shape validation changes. |
| R-924 | “IF either parse or shape-validation fails”; “no hooks, no seeds, no PATH entry” | Q; the record covers malformed shape, not parse failure. |
| R-322 | “IF a lock file already exists”; “the run shall abort” | Q/M: shortening the message retains refusal. |
| R-926 | “IF a lock file already exists” | Q |
| R-927 | “WHEN this repo is already registered” | Q |
| R-333 | “a dangling symlink or a directory at a seed path reads skipped naming what was found, with nothing written through it and the link or directory untouched” | Q |
| R-335 | “shell and regex metacharacters land literally in every seeded file with nothing executed” | Q; the replacement mutation does not exercise shell non-execution. |
| R-338 | “including a folder it would create, and write nothing” | Q |
| R-931 | “WHEN a parent directory is missing”; “--dry-run” | Q/M: the cited invocation is not dry-run. |
| R-346 | “WHILE that value is ambient and relative”; “still run”; “never say all good and exit non-zero” | Q/M: deleting the warning retains execution. |
| R-932 | “shall be used as given” | M: changing the warning/refusal classification does not change the resolved path itself. |
| R-348 | “when it sits under the projects dir, else the derived key”; “throughout” | Q |
| R-935 | “fail open creating only what is missing” | M: removing the no-index guard does not establish failure closure or overwriting existing content. It targets the neighboring no-index guarantee. |
| R-349 | “WHERE the platform is win32” | Q |
| R-936 | “WHERE the platform is win32” | Q |
| R-937 | “WHERE the platform is win32” | Q |
| R-351 | “WHERE the platform is win32” | Q |
| R-938 | “WHERE the platform is win32”; “a stale or hand-written copy”; “as a FILE inside the skill dir”; “naming the file” | Q/M: suppressing backups and diagnostics does not separately establish their shape, location or metadata. |
| R-355 | “WHEN the chosen pi agent dir is not the default”; “absolute”; “inside EnvironmentVariables” | Q/M: removing the entry does not independently exercise path absoluteness or placement. |

### Gap rate

| Package | Implemented | Rows with gaps | Rate |
|---|---:|---:|---:|
| Knowledge | 23 | 19 | 82.6% |
| Stage | 25 | 20 | 80.0% |
| Setup | 35 | 27 | 77.1% |
| **Total** | **83** | **66** | **79.5%** |

A3’s reported rate was **27/46 — 58.7%**. B does not demonstrate convergence.

No additional gap identified in these **17 rows**:

`R-218`, `R-221`, `R-229`, `R-891`, `R-254`, `R-274`, `R-275`, `R-280`, `R-281`, `R-308`, `R-925`, `R-323`, `R-928`, `R-929`, `R-337`, `R-930`, `R-934`.

## 4. REPLAY — one record in five

Flattened all **93 records in file order**, using **zero-based indices 2, 7, 12, …, 92**.

Replays ran sequentially in `/tmp/ears-b-astra-replay`, cloned from the reviewed commit. All **12 distinct cited test files passed before mutation**. Ambient `NANA_*` and `PI_CODING_AGENT_DIR` were removed from test environments.

| Index | Row | Recorded mutation | Result |
|---:|---|---|---|
| 2 | R-204 | Disable continuation folding | **RED** |
| 7 | R-883 | Disable missing-root detection | **RED** |
| 12 | R-218 | Remove prose separator substitution | **RED** |
| 17 | R-889 | Let row-rendering exceptions escape | **RED** |
| 22 | R-231 | Append each successful log record twice | **RED** |
| 27 | R-895 | Throw on null pull; remove outer swallow | **RED*** |
| 32 | R-251 | Disable non-empty columns check | **RED** |
| 37 | R-254 | Remove action prompt requirement | **RED** |
| 42 | R-273 | Make signature verification always succeed | **RED** |
| 47 | R-276 | Return malformed block in entries | **RED** |
| 52 | R-264 | Reduce every entry instead of active branch | **RED** |
| 57 | R-304 | Remove occupied-directory problem return | **RED** |
| 62 | R-318 | Make `hasHook` always true | **RED** |
| 67 | R-925 | Unconditionally remove the settings lock | **RED** |
| 72 | R-333 | Follow symlinks using `statSync` | **RED** |
| 77 | R-338 | Create missing leaf directory during dry-run | **RED** |
| 82 | R-348 | Ignore alternate Claude configuration directory | **RED*** |
| 87 | R-937 | Disable doctor’s win32 hook skipping | **RED** |
| 92 | R-355 | Always omit the agent-directory environment entry | **RED** |

**19 red test files; zero green.**

\* Precision about recorded citations:

- **27:** an uncaught exception occurs while evaluating the cited dedup check, before it prints a verdict.
- **82:** an earlier alternate-directory assertion fails; evaluating the cited link check then throws `ENOENT`.

Thus **17 replays print the named failing check**; two make the file red through exceptions at the cited evaluation. Neither should be described as a clean named-assertion replay.

Source files were restored after every replay. Logs remain under `/tmp/b-replay-logs/`; the replay script is `/tmp/replay-b.py`. Neither checkout has outstanding changes.

## 5. Required disposition

1. Restore the separable promises concealed by the 10 merges.
2. Restore the dropped scope, broader missing-parent guarantee and standalone preflight condition.
3. Treat the 66 coverage findings as the seat’s downgrade worklist.
4. Re-run the verifier and refusal test after corrections.

The verdict rests on **form MUSTs only**, not the gap rate.

**VERDICT: BLOCK**  
**Score: 4/10**
