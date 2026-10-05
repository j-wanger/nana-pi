# Batch C — one-round, form-only review

**VERDICT: BLOCK**  
**Score: 6/10**

Reviewed `feat/ears-c` at `85f033d` against `main` at `70ef61e`.

Mechanical checks pass. Status preservation passes. Form still needs correction: an added restriction narrows grader-error accounting, and several extracted sentences lack standalone scope.

## 1. Command verification

Executed:

```sh
node docs/reviews/ears-form-2026-10-04/apply-batch.mjs \
  docs/reviews/ears-form-2026-10-04/batch-c.json --base main
node docs/reviews/ears-form-2026-10-04/refusal-test.mjs
node packages/nana-pack/tests/requirements-trace.test.mjs
git diff --check
git status --short
```

| Check | Result |
|---|---|
| Batch verifier | **ALL CHECKS GREEN**, zero rows added |
| Refusal test | **ALL PASS**, affected files byte-identical |
| Requirements trace tests | **8 passed** |
| EARS report | **`ears: 0 rows off form (allowance 0)`** |
| Diff whitespace | Clean |
| Worktree before and after verification | Clean |

Independent row comparisons confirmed:

- **53 origins**, **69 split-born rows**, **122 resulting clauses**.
- No duplicate requirement IDs.
- No split-born ID existed on `main`.
- The desk ranges **R-468–R-499** and **R-940–R-959** were entirely unoccupied on `main`.
- Desk allocation uses **R-468–R-499**, then **R-940–R-942**. No collisions.
- No merges, new requirement markers or behavioral test edits.

I ran no mutations and did not rerun the full repository suite.

## 2. FORM — MUSTs

I read every origin from `main` against its resulting clauses: **26 desk origins** and **27 bench origins**.

### MUST 1 — Restore accounting for every grader error

**`REQUIREMENTS.md:1002`, R-531 → R-571**

The original second promise says:

> every grader error shall be recorded undecided and excluded from every success denominator while still appearing in the state counts.

R-571 adds:

> In a composite checker …

That restricts a general accounting promise to composite checkers. Grader errors from ordinary checkers and post-processing lose the explicit guarantee.

The original citations corroborate the broader scope:

- `apps/bench/test/integration.test.mjs:196` checks a post-processing failure.
- `apps/bench/test/aggregate.test.mjs:57–59` checks denominator exclusion and state counting independently of composite-checker execution.

**Remove the composite-checker restriction from R-571.**

### MUST 2 — Preserve the distinct spawn-tool cases

**`REQUIREMENTS.md:784–785`, R-416 → R-477/R-478**

Repeating “WHEN built-in tools are unchecked” mechanically produces the contradictory R-477 condition:

> WHEN built-in tools are unchecked … when nothing is narrowed.

The original explicitly promises a separate **no-narrowing** outcome. Its citation invokes a spawn without `excludeTools`:

`apps/desk/test/spawn-and-persist.test.mjs:485–488`.

R-478 likewise conditions malformed-request refusal on tools being unchecked, although a non-array request need not describe any valid unchecked selection.

**State the cases independently:**

- No narrowing → no tool flag.
- Unknown tool name or non-array exclusion request → refusal.

Keep the unchecked-tools condition on R-416’s exclusion-list promise.

### MUST 3 — Make absence of a signed verdict unambiguous

**`REQUIREMENTS.md:989`, R-525 → R-564**

The standalone sentence is:

> No signed line shall be a failure.

Read literally, this prohibits treating any signed line as a failure. The intended promise concerns **receiving zero signed lines**.

The original citation makes that distinction explicit:

`apps/bench/test/evaluator-hardening.test.mjs:100` passes `{ verdict: null }` and checks ordinary failure, not grader error.

**Use an explicit condition and named subject**, for example:

> IF evaluator output contains no signed verdict line, THEN the bench shall record a failure rather than a grader error.

The ambiguity existed within the origin; extraction has not satisfied the required standalone form.

### MUST 4 — Restore standalone subjects and scope

These sentences still depend on neighboring clauses for their referents or operational scope.

| Location | Origin → row | Missing subject or scope | Required correction |
|---|---|---|---|
| `REQUIREMENTS.md:805` | R-422 → R-482 | “the answer” no longer identifies the changes-bar response for a live session. | Name that response and retain all three failure conditions. |
| `REQUIREMENTS.md:870` | R-449 → R-494 | “The manifest” and “the child” depend on the preceding app-listener clause. | Name the app manifest and its listener’s child. |
| `REQUIREMENTS.md:873` | R-450 → R-496 | “mid-wait” omits the wait for manifest-tool readiness; “the request” is unidentified. | Name the readiness wait and session request. |
| `REQUIREMENTS.md:877` | R-452 → R-498 | “dialog” loses the app-listener extension-dialog scope. | Name the app listener’s extension dialog. |
| `REQUIREMENTS.md:928` | R-504 → R-547 | “A request outside any window” does not identify model requests or watched-tool execution windows. | Restore both subjects from the original spend-accounting context. |
| `REQUIREMENTS.md:974` | R-520 → R-559 | “a second pass” no longer names interrupt salvage. | Name a second interrupt-salvage pass and the record protected against duplicate writes. |
| `REQUIREMENTS.md:1011` | R-534 retained clause | “the run” remains the unnamed subject explicitly prohibited by the brief. | Name the bench run using the pinned fixture. |
| `REQUIREMENTS.md:1020` | R-536 → R-574 | “Agreement” no longer identifies agreement over the review corpus. | Name review-corpus rater agreement. |

These are form corrections, not requests for additional promises or tests.

No additional lost or merged promise was identified.

## 3. STATUS — mechanical check

| Check | Result |
|---|---|
| Split-born rows marked `untested` | **69/69** |
| Standard batch-C evidence sentence | **69/69**, exact match |
| New `// req:` markers | **0** |
| Origins retaining main-branch status | **53/53** |
| Origins retaining exact evidence cells | **53/53** |
| Retained implemented origins | **44** |
| Retained untested origins | **9** |

I read the retained implemented clauses against their cited assertions. **No origin was left citing only a promise moved into a sibling.** Each retains citations addressing its remaining first clause.

That is a citation-relevance check, not a fresh certification of every condition. There is no mutation-coverage gap rate for this form-only batch.

## 4. Disposition

Correct the form findings in both `REQUIREMENTS.md` and `batch-c.json`, then rerun the verifier, refusal test and trace tests.

The verdict rests **only on form MUSTs**. Status preservation and ID allocation pass.

**VERDICT: BLOCK**  
**Score: 6/10**
