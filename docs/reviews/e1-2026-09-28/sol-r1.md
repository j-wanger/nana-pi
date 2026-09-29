## Scope

- **[PASS] Pre-registration order — `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md:1`**  
  Git history shows `fcf012d` at 20:37, followed by labels/results in `5ffe0e8` at 21:46. Repository history supports that the preregistration preceded every committed judge label.

- **[PASS] Scope — `apps/bench/studies/catch-ledger-2026-09-28/CHECKPOINT.md:29-35`**  
  `fcf012d^..HEAD` changes only `apps/bench/**`. The review corpus, product `lib/`, gate, review ledger, and objective producer are untouched.

- **[PASS, advisory] Size — `apps/bench/studies/catch-ledger-2026-09-28/CHECKPOINT.md:3-12`**  
  The 783 tool LOC plus 166 test LOC exceed the 600-LOC ceiling, but most of the file-count excess is generated evidence, while matcher B and pass C exposed the central P1/P2 reliability problems. The overrun largely earns its keep, though it did not buy sufficient matcher validation.

## Executed adversarial checks

- **[PASS] Deterministic rebuild — `apps/bench/studies/catch-ledger-2026-09-28/RESULTS.md:8-18`**  
  In `/tmp` with committed caches, `extract` and `build` reproduced byte-identical `rows.jsonl`, `results.json`, and `table.md`. `skipped.jsonl`, `reports.json`, `kappa-pairs.json`, and `ledger.jsonl` were also identical.

- **[HIGH] Uniqueness is computed from direct edges rather than same-defect components — `apps/bench/lib/catch-stats.mjs:43-65`, `apps/bench/lib/catch-stats.mjs:86-98`**  
  A scratch `CATCH_REVIEWS`/`CATCH_OUT` attack supplied a valid near-duplicate chain `sol-r1 ~ astra-r2 ~ astra-r1`. `buildLedger` returned `matched_sol:false` for astra-r1, and `claims()` included it in `unique_accepted_rows`, despite that row having `unique:false` and belonging to a component containing sol. Since “same underlying defect” is an equivalence relation, matching needs connected components or strict equivalence validation. The CLI currently checks only omitted IDs (`apps/bench/catch-ledger.mjs:125-128`).

- **[MEDIUM] Structural hints conflate different paths sharing a basename — `apps/bench/lib/catch-stats.mjs:25-39`**  
  The attack used `src/one/config.ts:10` and `src/two/config.ts:12`; `stageHints` called them a same-file, line-adjacent pair because it compares only `base`. These are merely hints, but they are presented to the semantic judge and can bias the matcher.

- **[MEDIUM] Pre-registered disposition confidence was not implemented — `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md:22-26`, `apps/bench/lib/catch-judge.mjs:38-65`, `apps/bench/lib/catch-judge.mjs:131-147`**  
  The preregistration requires `match_confidence = explicit|semantic`. No such field is requested, stored, or checked. Quote validation proves only that text occurs somewhere in the answering brief, not that it addresses the finding. The seven inspected P1 quotes were convincing by eye, but the full accepted-based dataset does not meet the registered contract.

- **[LOW] The κ sample is not literally the registered “40 findings” — `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md:37-40`, `apps/bench/catch-ledger.mjs:149-153`**  
  Sampling is over all non-verification rows, yielding three pass-A and five pass-B `not_a_finding` labels. This does not change the present gate outcome: among rows both judges call findings, top-level κ is still 0.735.

- **[PASS] κ arithmetic — `apps/bench/lib/catch-stats.mjs:5-16`**  
  I inspected the first 12 pair records across all axes. For the complete top-level axis: 34/40 agreement, \(p_o=0.85\), marginals A=`26/11/3`, B=`24/11/5`, \(p_e=0.475\), and κ=`0.7142857`, matching the committed result.

- **[PASS, bounded definition] Extraction coverage — `apps/bench/studies/catch-ledger-2026-09-28/RESULTS.md:20-30`**  
  I compared rows and skips against five reports: `l1`, `l2`, `l3`, `t2b`, and `t2c` astra-land. Every item was represented or logged. Defects expressed only in prose are deliberately not scored, as disclosed at line 29; therefore this is not complete finding recall.

- **[PASS] Fail-closed judge — `apps/bench/lib/catch-judge.mjs:88-104`**  
  A missing `CATCH_JUDGE_BIN` exited 1 with `judge unavailable: ENOENT`; a garbage-producing stub exited 1 with `judge returned non-JSON`. Neither wrote labels. The complete bench test also passed.

## Seat additions

- **[HIGH] P1’s process-changing headline is unproven — `apps/bench/studies/catch-ledger-2026-09-28/RESULTS.md:73-81`**  
  On the original five lanes, matcher A yields YES on four lanes while matcher B yields NO with only l3 qualifying. The worker’s hand-read of disagreements was not pre-registered and cannot adjudicate its own headline. The narrow six-lane threshold happens to remain YES under both matchers—matcher B reaches exactly l3+t2c—but that does not rescue the broader “astra’s rung is not ceremony” conclusion. With 83/87 cross-rung matches semantic-only and the implementation defect above, inferential P1 is matcher-dependent.

- **[HIGH] The data cannot distinguish Astra from final-review position — `apps/bench/studies/catch-ledger-2026-09-28/RESULTS.md:98-104`**  
  The report correctly discloses this caveat. Most distinctive functional catches are defects in folds made after sol r3, which only Astra saw. The evidence licenses “review the final fixes again”; it does **not** license “use Astra,” a particular reviewer role, or Astra’s cost premium.

- **[INFO] Astra confirm cannot be called near-valueless from this ledger — `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md:19-20`, `apps/bench/studies/catch-ledger-2026-09-28/RESULTS.md:103-104`**  
  Confirm rounds produced 62 extracted rows, including 17 structural verification rows. Verification is excluded from findings, and five of six LAND reports have no answering brief, so their work is mostly forced to `unmatched`. The “27 findings, 1 accepted, 1 unique” statistic measures newly accepted defects, not whether the round correctly verified MUSTs or safely authorized LAND.

- **[PASS] Reporting P3 numerically was consistent with the preregistration — `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md:41-43`, `apps/bench/studies/catch-ledger-2026-09-28/RESULTS.md:88-89`**  
  The contract says P3 is reported as unreliable when κ(origin) < 0.6, not suppressed. Showing 19/95 descriptively and immediately declaring it unreliable and “not an answer” is appropriate. It must not be quoted operationally as “20% trace to seat specification error.”

VERDICT: BLOCK
