# Batch A3 worker report — EARS form split, Part A §10-13

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears-a3`, branch `feat/ears-a3`, cut from main `ef9d774` (A2 landed, allowance 124).
Spec: `design-ruling.md` §2, `batch0-land-ruling.md` §5, A1/A2's lessons (mechanical mutation-record rule, reject merges unless the two promises share one control-flow gate, mutate every case a clause names, never cite a neighbouring case). Mapping: `batch-a3.json`. Applier/verifier: `apply-batch.mjs` (unmodified from A2).

## Scope

24 off-form origins: §10 pi-review round cap and stall watchdog (16), §11 pi-worker (1), §12 skills contract (2), §13 the repo test runner (5). Off form 124 → 100.

## Rows (round 1, superseded by round 2 below)

- 24 origins, 23 new rows (R-831–R-849 in the pack continuation block minus R-839; R-910–R-914 in the runner continuation block, per design-ruling.md §2's table).
- 20 new rows `implemented`, 3 `untested` (R-832 — "a call without --item, or with a flag in its place, shall be refused loudly without a stack": no assertion checks `noStack()` for either named case, only for a neighbouring bad-slug case that is R-704's territory; R-848, R-849 — the tag-gated template-distribution and adopt-structure promises, searched for and confirmed uncited).
- 3 merges, all on the same ground as A2's accepted standard (one control-flow gate, not two separately-breakable promises), each confirmed by execution:
  - **R-711**: "reverting" and "re-reviewing an already-counted revision" both reduce to the identical `revs.includes(revision)` check in `decide()`. Disabling `complete()`'s `idx < 0` guard (always append) broke both cited tests at once.
  - **R-718**: "own a live reservation" and "expired/consumed/forged record nothing" are one `if (!mine || reservationStale(held, st)) throw` gate viewed from two sides. Leaving the consumed reservation's file unlinked broke "completing B twice is refused".
  - **R-727**: "no worker mode", "--worker refused" and "the review never runs" are enforced by one unconditional `process.exit(1)` right after the refusal message in `pi-review.mjs`, before `runWatchdog` is reachable. Removing that one `exit(1)` broke the single cited test (the refusal message still prints, but the watchdog then runs anyway).

## Mutations (round 1, superseded by round 2 below)

**48 mutation records across 42 implemented clauses** (22 origins implemented — all but R-740 `planned` and R-741 `untested` — plus 20 new implemented rows; several clauses carry two records to cover two named cases or two independent cites). Every one is an executed edit-run-revert cycle: `cp <file> /tmp/<file>.orig` before, `diff` after reverting to confirm byte-identical, for every file touched (`review-round.mjs`, `pi-watchdog.mjs`, `pi-review.mjs`, `pi-worker.mjs`, `scripts/test.mjs`). Representative examples: R-707 (`roundsUsed` deduped by `revision.length` vs by `revision+role` — two distinct, independently-isolating mutations for the two split clauses); R-719 (`REVIEW_ROUND_CAP` 3→4; `roundCapVerdict`'s allow-threshold off-by-one; `decide()` scoped by launcher — three independent mutations for three clauses); R-710 (a cached-diff addition to the snapshot hash; disabling the untracked-files loop; removing `--exclude-standard`; adding mtime to a tracked file's content hash — four mutations for three clauses, one clause carrying two to cover both named cases); R-605/R-606 (shared compound test, two different mutations: suppressing the WARN push vs adding a content-based `ok` override, each leaving the other's half of the test green).

Three mutations could not be run against the full 748-line `review-ledger.test.mjs` without crashing or hanging the harness, as a **direct, confirmed consequence of the mutation itself** (not a test-ordering accident): removing `withLock`'s lock-dir `isFile` check causes an infinite retry loop that never reaches its own deadline (confirmed: a 90s run never returned); forcing `withLock`'s stale check to `true` unconditionally makes the toctou block's child steal-and-release a live lock before the real test's own `fs.unlinkSync(lockFile)` runs, so that cleanup line throws ENOENT; force-rotating the tally after every append corrupts bookkeeping later blocks in the same file depend on, crashing with a `TypeError` on `undefined.v`. Each of these three (R-723 clause A, R-715 clause B / R-837, R-721 clause A) was instead verified with an isolated, byte-faithful reproduction of the exact cited check and its own boolean expression — run standalone with a bounded timeout where relevant — confirmed PASS at baseline and RED under the mutation. Documented in full in each mutation's own `break` text, not silently substituted.

## Sibling-cite list (round 1, superseded by round 2 below)

**3** (R-831, R-911, R-914) — all legitimate. Each shares its origin's only cite(s) because that one test's compound boolean has two independently-breakable disjuncts/branches, proven by two different, independently-executed mutations (e.g. R-702/R-831 both cite `pi-watchdog imports no ledger or review module`: R-702's mutation hits the test's `!/reviewShaped/` half, R-831's hits its `!/import.../` half — neither mutation touches the other half). Full reasoning for all three in `batch-a3.json`'s `notes` field.

## Verifier (`apply-batch.mjs --base main`)

`ALL CHECKS GREEN`, exit 0, idempotent (`rows added: 0` on the final re-run).

## Totals (round 1, superseded by round 2 below)

- Rail: `ears: 100 rows off form (allowance 100)`, exit 0. Rail test (`requirements-trace.test.mjs`): 8/8 pass, including `seal: EARS_ALLOWANCE is 100 (G-015)` and the R-757 equality seal.
- `refusal-test.mjs`: `REFUSAL TEST: ALL PASS`, 18 affected files byte-identical before/after the tampered-mapping repro.
- `map:check`: 172 modules, 0 problems, exit 0.
- `npm test` (alone, after confirming no other `scripts/test.mjs` running): 95 files — 93 PASS, 1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 291.7s. The one failure, `packages/nana-pack/tests/readme-check.test.mjs` (5 problems: missing `node_modules`, missing `apps/bench/.ext`), is the worktree's pre-existing environmental gap — identical in kind and count to batch 0, A1 and A2's own finding, not caused by this batch. `review-ledger.test.mjs` (134 pass, 63.1s), `review-round.test.mjs` (33 pass) and `test-runner.test.mjs` (24 pass) — every file this batch's mutations touched — all pass clean, confirming no residual mutation was left behind.

## Round 2: astra r1 fixes

Astra r1 **BLOCK 5/10** (`batch-a3-astra-r1.md`) — 14 PINS/6 PARTIAL (exceeds the 2-PARTIAL threshold), all three merges rejected by executed counterexample, one guarantee (directory-lock-path refusal) lost in the split, two NOTE corrections on sibling-cite explanations. Key line: "A recorded red mutation proves sensitivity to that mutation. It does not establish coverage of every condition or outcome in the row." Every implemented clause in this batch was re-checked against that rule — mutating each condition/outcome its own text names, not stopping at the first mutation that worked.

**MUST 1 — all three merges split**, each confirmed non-separable-vs-separable by execution, not assertion:
- **R-711**: including a tracked file's mtime in the dirty-content hash breaks `revert the edit → original revision recognised, no new round` while `re-reviewing an already-counted revision is admitted and earns nothing` and `worktree W2...` (both clean-commit scenarios, untouched by a dirty-hash mutation) stay green. Split: R-711 (origin, "reverting...shall earn no round") + new **R-850** ("re-reviewing a counted revision shall be admitted earning nothing", cites the two clean-commit tests, mutation: `complete()`'s tally append made unconditional).
- **R-718**: forcing `mine=false` breaks only `complete(B) recorded; the item has 3 rounds, never 4` (own-a-live-reservation) while the three invalid-reservation refusals are unaffected. Split: R-718 (origin, "shall own a live reservation", cite+mutation verified via an isolated temp-patched copy — forcing `mine=false` globally breaks every legitimate completion in the 748-line file, too destructive to run whole) + new **R-839** ("an expired, consumed or forged reservation shall record nothing", now also citing the aggregate verdict-count check astra pointed to — "rejecting a completion does not prove it recorded nothing" — via a mutation that appends a spurious audit record inside the invalid-reservation branch before its refusal throw).
- **R-727**: wrong exit code (0) breaks only the refusal's status half; astra's own technique (running the watchdog before refusing) breaks only the never-runs half. Split into three single-shall clauses: R-727 ("shall have no worker mode") + new **R-854** ("a --worker flag shall be refused" — shares R-727's cite and mutation by design: astra's counterexample never separated these two, only "refused" from "never runs") + new **R-851** ("the review shall never run", its own mutation).

**MUST 2 — directory-lock-path refusal restored.** New **R-852**: "a directory lock path shall be refused at once with a message and no stack, before the review runs" — the full four-guarantee promise the original split dropped. R-723 stays the general "every ledger path shall be a regular file"; R-844 reworded to drop the unproven "at once" for symlink/unwritable-directory specifically (astra's 4-second-delay counterexample survived both of those citations, which check no timing).

**MUST 3 — six PARTIAL rows corrected:**
- **R-833** downgraded to `untested` — its only citation checks acceptance (`status === 0`), not that the literal `--revision` value is preserved; searched for a second assertion, none found.
- **R-843** split: "a malformed tally line...naming file and line" keeps only the corrupted-JSON citation (the one that actually checks the file:line format); new **R-853** ("an incomplete tally line shall likewise refuse admission") carries the missing-fields citation without the unproven naming guarantee.
- **R-844** — see MUST 2.
- **R-846** downgraded to `untested` — its sole citation launches pi-worker, a neighbouring case (R-735/R-847's own territory), not pi-review; no test exercises pi-review's own after-separator `--retries` handling.
- **R-910** gains a second, dual-tagged citation (`a file that exits non-zero is FAIL and the run exits 1`) plus its own mutation (`ok || r.code === 1` in the label), since the original citation covered only the exit-0-plus-FAIL-line half.
- **R-912** narrowed to the timeout trigger only (dual-citing R-609's process-tree-kill evidence); new **R-915** ("on Ctrl-C or SIGTERM...", `untested`) — astra's counterexample (clearing `active`/`scratch` at the top of the signal handler before `cleanup()`) leaves the entire 24-check file green, confirming no test sends a signal to the runner.

**SHOULD — standalone sentences restored**, naming their own subject/condition instead of a sibling-dependent pronoun or elliptical opener: R-842, R-845, R-846, R-847, R-849, R-911, R-912, R-913, R-914.

**SHOULD — isolated-reproduction scripts committed**, byte-faithful to their cited checks: `isolated-repro-r723.mjs` (directory-lock-path refusal — **no added timeout**, correcting this worker's earlier wrong claim that the call hangs forever; it fails via `ledgerRun`'s own existing 30000ms `spawnSync` timeout, confirmed at ~31s against the real file first), `isolated-repro-r837.mjs` (toctou lock-steal — discloses its one necessary cleanup adaptation), `isolated-repro-r721.mjs` (tally-rotation — keeps both conjuncts of the real assertion), and `isolated-repro-r718.mjs` (not explicitly requested, written on the same ground: forcing `mine=false` is too destructive to run against the full file).

**NOTE corrections:** R-831's mutation changed from "import `reviewShaped`" (astra showed this hits both the import-regex and the name-regex at once, not isolating cleanly) to "import `canonicalItem` from `review-round.mjs`" (a real import matching only the import-regex, confirmed red, genuinely isolating R-831 from R-702). R-911's mutation changed from "add `f === 0` to `ok`" (astra showed this also suppresses the WARN push, since `if (ok && f)` requires `ok`) to a label-only change (`(ok && f === 0) ? "PASS" : "FAIL"`), confirmed to leave the WARN line intact.

### Rows: after round 2

24 origins, **30 new rows** (R-831–R-854 in the pack continuation block, R-910–R-915 in the runner continuation block) — **46 implemented, 7 untested** (R-832, R-833, R-846, R-848, R-849, R-915, and R-741's own pre-existing untested status), 1 `planned` (R-740). Zero merges (`merged: []`).

### Mutations: after round 2

**54 mutation records across 46 implemented clauses.** All four previously-isolated scripts re-verified at both baseline (PASS) and under mutation (FAIL) before being recorded; the four new/corrected mutations (R-850, R-839's aggregate-record check, R-718's isolated temp-patch, R-852, R-854, R-851, R-910's second record, R-911's corrected record) were each individually confirmed red via the real suite (or the dedicated isolated script, where running against the full file would be destructive) and reverted clean (`diff` against the saved `.orig` byte-identical) before the next mutation.

### Sibling-cite list: after round 2

**6** (R-831, R-852, R-854, R-851, R-911, R-914) — all legitimate, explained in full in `batch-a3.json`'s `notes` field. R-831/R-911/R-914 each use two different, independently-verified mutations hitting two different disjuncts/branches of one compound test. R-852 deliberately shares R-723's cite *and* mutation (the A2 R-142/R-828 precedent: one code path, `withLock`'s `isFile` check, genuinely renders both "not a regular file" and the lock-path's four refusal guarantees at once — not two separately-achievable states). R-854 likewise shares R-727's cite and mutation by design (astra's counterexample never separated "no worker mode" from "refused", only from "never runs"). R-851 shares the same cite as R-727/R-854 but has its own, different mutation.

### Totals: after round 2

- Verifier (`apply-batch.mjs --base main`): `ALL CHECKS GREEN`, exit 0, idempotent (`rows added: 0` on re-run).
- Rail: `ears: 100 rows off form (allowance 100)`, exit 0. Rail test: 8/8 pass.
- `refusal-test.mjs`: `REFUSAL TEST: ALL PASS`.
- `map:check`: 172 modules, 0 problems, exit 0.
- `npm test` (alone, after confirming no other `scripts/test.mjs` running): 95 files — 93 PASS, 1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 294.4s. The one failure is the same pre-existing environmental `readme-check` gap (5 problems: missing `node_modules`, missing `apps/bench/.ext`), unchanged across both rounds. `review-ledger.test.mjs` (134 pass, 62.9s), `review-round.test.mjs` (33 pass) and `test-runner.test.mjs` (24 pass) all pass clean.

## Round 3: astra r2 fixes (read-and-replay; no round 4)

Astra r2 **BLOCK 6/10** (`batch-a3-astra-r2.md`), using Fable's read-and-replay shape (`bc-method-ruling.md` §4): 11/11 sampled records replayed red (mechanics sound), but 3 form MUSTs (promises dropped during round-2's own fixes) and a 27/46 = 58.7% record-coverage gap rate across all 46 implemented clauses, read against each clause's own named conditions/outcomes. Per the method ruling, A3 lands under its in-flight fix: the gap table is the seat's downgrade worklist, not a mutation-hunt mandate — no round 4.

**Form MUSTs — every dropped promise restored, none deleted:**
1. **R-851** restored its governing condition: "WHEN pi-review receives --worker, the review shall never run." **R-854** reworded to name pi-review: "A pi-review invocation carrying --worker shall be refused." (R-854 stays `implemented` — clean per astra r2's own read — and keeps the shared citation alone, now that R-727/R-851 no longer need it.)
2. **R-844** restored "at once" for the symlink and unwritable-directory cases (full text: "...shall be refused **at once** with a message and no stack, before the review runs."). astra r2's own read found the row under-covered well beyond timing alone, so the whole clause folds into the status-gap downgrade below rather than a narrower split.
3. **R-855** (new, `untested`) restores "naming file and line" for the incomplete-tally-line case, split off from R-853 — R-853 itself is unchanged and stays `implemented` (its narrower, diagnostic-free text is exactly what its citation proves).

**Status gaps — all 27 rows astra's §2 audit named downgraded to `untested`**, no new mutation invented to rescue any of them this round (per the brief): R-702, R-831, R-703, R-706, R-834, R-850, R-715, R-838, R-718, R-839, R-719, R-720, R-842, R-843, R-723, R-852, R-844, R-725, R-845, R-727, R-851, R-728, R-847, R-605, R-913, R-615, R-914. Each carries an explicit `evidence` string quoting astra's own "uncovered words" and record-limitation text, so the cell is the 6b coverage-completion worklist, not a bare "—". Every `// req:` marker those 27 rows held alone is removed; markers still shared with a row that stays `implemented` (R-910, R-606, R-911, R-609, R-912, R-722, R-735, R-854, R-717, R-612, R-729) are kept, trimmed to the surviving id(s) — including 8 origins (R-605, R-703, R-706, R-715, R-719, R-720, R-725, R-728) whose own first-clause marker had never been touched by any prior round's `markerEdits` and so needed a fresh removal edit this round.

**Record-description discrepancies fixed:** R-831's `break` text never actually matched round 1's claimed fix (still imported `reviewShaped`, not `canonicalItem`) — moot now, since R-831 is untested and carries no mutation; the stale round-1 notes paragraph is marked superseded rather than deleted. R-852's `break` text overclaimed that all four of the cited assertion's conditions flip; corrected (only status and elapsed-time do — `noStack()` stays true on the empty-stderr timeout) and folded into its own downgrade evidence.

**The 19 clean rows kept `implemented`, unchanged:** R-707, R-710, R-835, R-836, R-711, R-837, R-717, R-840, R-841, R-721, R-853, R-854, R-735, R-910, R-606, R-911, R-609, R-912, R-613.

### Rows and mutations: after round 3

24 origins, **31 new rows** (R-831–R-855 in the pack continuation block, R-910–R-915 in the runner continuation block) — **19 implemented, 36 untested**, 1 `planned` (R-740). Repo-wide: 655 requirements, 524 implemented, 120 untested, 2 planned, 9 violated.

### Sibling-cite list: after round 3

**2** (R-854, R-911) — down from 6, since R-831/R-852/R-727/R-851/R-914 are now untested and no longer make evidentiary use of a shared citation. R-911 still shares R-606's compound test via two different, independently-verified mutations (unchanged from round 2).

### Totals: after round 3

- Verifier (`apply-batch.mjs --base main`): `ALL CHECKS GREEN`, exit 0, idempotent (`rows added: 0` on re-run).
- Rail: `ears: 100 rows off form (allowance 100)`, exit 0 (off-form count unchanged — downgrading a row's status doesn't change its EARS form). Rail test: 8/8 pass.
- `refusal-test.mjs`: `REFUSAL TEST: ALL PASS`.
- `map:check`: 172 modules, 0 problems, exit 0.
- `npm test` (alone, after confirming no other `scripts/test.mjs` running): 95 files — 93 PASS, 1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 292.5s. The one failure is the same pre-existing environmental `readme-check` gap, unchanged across all three rounds. `review-ledger.test.mjs` (134 pass, 63.0s), `review-round.test.mjs` (33 pass) and `test-runner.test.mjs` (24 pass) all pass clean — only `// req:` marker lines changed in any test file this round, confirmed by `git diff` (no assertion line touched).
