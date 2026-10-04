# Batch A3 worker report — EARS form split, Part A §10-13

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears-a3`, branch `feat/ears-a3`, cut from main `ef9d774` (A2 landed, allowance 124).
Spec: `design-ruling.md` §2, `batch0-land-ruling.md` §5, A1/A2's lessons (mechanical mutation-record rule, reject merges unless the two promises share one control-flow gate, mutate every case a clause names, never cite a neighbouring case). Mapping: `batch-a3.json`. Applier/verifier: `apply-batch.mjs` (unmodified from A2).

## Scope

24 off-form origins: §10 pi-review round cap and stall watchdog (16), §11 pi-worker (1), §12 skills contract (2), §13 the repo test runner (5). Off form 124 → 100.

## Rows

- 24 origins, 23 new rows (R-831–R-849 in the pack continuation block minus R-839; R-910–R-914 in the runner continuation block, per design-ruling.md §2's table).
- 20 new rows `implemented`, 3 `untested` (R-832 — "a call without --item, or with a flag in its place, shall be refused loudly without a stack": no assertion checks `noStack()` for either named case, only for a neighbouring bad-slug case that is R-704's territory; R-848, R-849 — the tag-gated template-distribution and adopt-structure promises, searched for and confirmed uncited).
- 3 merges, all on the same ground as A2's accepted standard (one control-flow gate, not two separately-breakable promises), each confirmed by execution:
  - **R-711**: "reverting" and "re-reviewing an already-counted revision" both reduce to the identical `revs.includes(revision)` check in `decide()`. Disabling `complete()`'s `idx < 0` guard (always append) broke both cited tests at once.
  - **R-718**: "own a live reservation" and "expired/consumed/forged record nothing" are one `if (!mine || reservationStale(held, st)) throw` gate viewed from two sides. Leaving the consumed reservation's file unlinked broke "completing B twice is refused".
  - **R-727**: "no worker mode", "--worker refused" and "the review never runs" are enforced by one unconditional `process.exit(1)` right after the refusal message in `pi-review.mjs`, before `runWatchdog` is reachable. Removing that one `exit(1)` broke the single cited test (the refusal message still prints, but the watchdog then runs anyway).

## Mutations

**48 mutation records across 42 implemented clauses** (22 origins implemented — all but R-740 `planned` and R-741 `untested` — plus 20 new implemented rows; several clauses carry two records to cover two named cases or two independent cites). Every one is an executed edit-run-revert cycle: `cp <file> /tmp/<file>.orig` before, `diff` after reverting to confirm byte-identical, for every file touched (`review-round.mjs`, `pi-watchdog.mjs`, `pi-review.mjs`, `pi-worker.mjs`, `scripts/test.mjs`). Representative examples: R-707 (`roundsUsed` deduped by `revision.length` vs by `revision+role` — two distinct, independently-isolating mutations for the two split clauses); R-719 (`REVIEW_ROUND_CAP` 3→4; `roundCapVerdict`'s allow-threshold off-by-one; `decide()` scoped by launcher — three independent mutations for three clauses); R-710 (a cached-diff addition to the snapshot hash; disabling the untracked-files loop; removing `--exclude-standard`; adding mtime to a tracked file's content hash — four mutations for three clauses, one clause carrying two to cover both named cases); R-605/R-606 (shared compound test, two different mutations: suppressing the WARN push vs adding a content-based `ok` override, each leaving the other's half of the test green).

Three mutations could not be run against the full 748-line `review-ledger.test.mjs` without crashing or hanging the harness, as a **direct, confirmed consequence of the mutation itself** (not a test-ordering accident): removing `withLock`'s lock-dir `isFile` check causes an infinite retry loop that never reaches its own deadline (confirmed: a 90s run never returned); forcing `withLock`'s stale check to `true` unconditionally makes the toctou block's child steal-and-release a live lock before the real test's own `fs.unlinkSync(lockFile)` runs, so that cleanup line throws ENOENT; force-rotating the tally after every append corrupts bookkeeping later blocks in the same file depend on, crashing with a `TypeError` on `undefined.v`. Each of these three (R-723 clause A, R-715 clause B / R-837, R-721 clause A) was instead verified with an isolated, byte-faithful reproduction of the exact cited check and its own boolean expression — run standalone with a bounded timeout where relevant — confirmed PASS at baseline and RED under the mutation. Documented in full in each mutation's own `break` text, not silently substituted.

## Sibling-cite list

**3** (R-831, R-911, R-914) — all legitimate. Each shares its origin's only cite(s) because that one test's compound boolean has two independently-breakable disjuncts/branches, proven by two different, independently-executed mutations (e.g. R-702/R-831 both cite `pi-watchdog imports no ledger or review module`: R-702's mutation hits the test's `!/reviewShaped/` half, R-831's hits its `!/import.../` half — neither mutation touches the other half). Full reasoning for all three in `batch-a3.json`'s `notes` field.

## Verifier (`apply-batch.mjs --base main`)

`ALL CHECKS GREEN`, exit 0, idempotent (`rows added: 0` on the final re-run).

## Totals

- Rail: `ears: 100 rows off form (allowance 100)`, exit 0. Rail test (`requirements-trace.test.mjs`): 8/8 pass, including `seal: EARS_ALLOWANCE is 100 (G-015)` and the R-757 equality seal.
- `refusal-test.mjs`: `REFUSAL TEST: ALL PASS`, 18 affected files byte-identical before/after the tampered-mapping repro.
- `map:check`: 172 modules, 0 problems, exit 0.
- `npm test` (alone, after confirming no other `scripts/test.mjs` running): 95 files — 93 PASS, 1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 291.7s. The one failure, `packages/nana-pack/tests/readme-check.test.mjs` (5 problems: missing `node_modules`, missing `apps/bench/.ext`), is the worktree's pre-existing environmental gap — identical in kind and count to batch 0, A1 and A2's own finding, not caused by this batch. `review-ledger.test.mjs` (134 pass, 63.1s), `review-round.test.mjs` (33 pass) and `test-runner.test.mjs` (24 pass) — every file this batch's mutations touched — all pass clean, confirming no residual mutation was left behind.
