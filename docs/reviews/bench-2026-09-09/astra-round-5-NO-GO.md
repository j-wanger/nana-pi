**Replicate 0 must not start at `9784d58`.** The fold improves normal persistence and pricing, but the evaluator still accepts manufactured success, interruption accounting remains incomplete, and preflight has a new unconditional error.

Read-only review; no model calls or spending commands. All five content pins match; rep 0 contains 44 unique tuples. Aggregate tests passed. Writing integration/checker suites were inspected, not executed. Paths below are relative to `~/nana-pi/apps/bench`.

## A. Evaluator robustness — BLOCK

### Isolation properties actually provided

| Property | Finding and minimal fix |
|---|---|
| **1. Nonce unreachable after fd 4 closes** | **Not guaranteed.** `lib/checkers.mjs:108–117,142` leaves `bench-eval-*/spec.json` readable until the child exits. The module runs as the same user; mode `0600` does not isolate it. Closing fd 4 does not remove this filesystem copy. **Fix:** on this POSIX pilot, unlink the file after opening it and before spawning; test that no pathname exposes the nonce. |
| **2. Exactly one verdict accepted; multiple-line policy defined** | **Deterministic selection, not uniqueness.** `lib/checkers.mjs:120–128` returns the **first HMAC-valid, JSON-parseable line**. It neither requires exactly one line nor rejects multiple valid verdicts. **Fix:** document this policy and test invalid→valid, valid→valid and malformed→valid sequences—or reject multiple valid lines. Validate verdict shape and expected probe count too. |
| **3. Captured originals and prototype-independent verdict** | **Only direct-reference capture holds.** `lib/eval-module.mjs:35–47` captures functions before import, but `:87–98` serializes ordinary objects/arrays. Original `JSON.stringify` still invokes inherited `toJSON`. HMAC `.update/.digest`, array `.map/.push`, `TextEncoder.prototype.encode`, and error-class machinery remain mutable (`:88,110,136,148,203`). **Fix:** prototype-independent serialization/data construction and captured call paths throughout; add adversarial tests for those surfaces. |
| **4. Primitive type-check before `===`** | **Not explicitly guaranteed.** `lib/eval-module.mjs:175–180` ordinarily evaluates `value === want` without first rejecting objects/functions. With the shipped primitive expectations, strict equality already rejects boxed/object returns without coercion. **Fix:** validate primitive expectations and explicitly reject nonprimitive returns; test boxed values, promises and coercion hooks. |
| **5. Never-resolving import becomes timeout/grader-error** | **Not universally.** `lib/checkers.mjs:117–119` correctly classifies actual timeouts as infrastructure failures. But a bare unresolved top-level await can make Node exit **13**, before timeout; `lib/eval-module.mjs:99,198` emits incomplete state, classified as an ordinary failure. **Fix:** retain an evaluator watchdog until completion, or explicitly classify unfinished evaluation as grader-error. Test unresolved await separately from busy loops. |

**Read-only reproduction:** I executed the evaluator source with its fd-spec input substituted in memory, leaving probe/signing logic unchanged. A wrong `twice(n) => n*3` plus inherited `Object.prototype.toJSON` produced an **HMAC-valid successful verdict**. No nonce extraction was needed. A separate unresolved-import reproduction exited 13 with a signed incomplete verdict.

These are missing grader tests within the declared prototype/filesystem threat model—not the excluded memory-scanning case. The existing adversarial matrix mainly tests replacing `fs.writeSync` and `JSON.stringify` themselves, not their remaining mutable dependencies.

### Probe specification gaps

- **c7:** `tasks/c7-bugfix.json` discriminates the rounding mutation, but leaves signed zero, large negative exponentials and nonnumeric inputs uncovered. Add fixture-derived probes such as:
  - `fmtNum(-0) → "0"`
  - `fmtNum(-1e21) → "-1e+21"`
  - `fmtNum("3.140") → "3.140"`
  - `fmtNum(NaN) → "NaN"` and `fmtNum("") → ""`.
- **c8:** `tasks/c8-guard.json:41–126` omits **NaN, Infinity, undefined, booleans**, and invalid caps with empty text. A guard based on remainder/comparison checks can pass these probes while accepting NaN. Add each invalid class, including `clampText("", 0, ...)` to catch guarding after an early return.
- Valid c8 coverage should include cap **1**, a very large positive integer, empty text, and multibyte truncation. The long-text checks alone permit incorrect truncation content that merely fits the cap and includes the notice.

Finite probes necessarily establish sampled behavior, not general correctness. That limitation does not excuse manufactured signed evidence.

## B. Fail-closed persistence — PARTIAL, still BLOCK

**Fixed normal path:** `run.mjs:729–744` awaits ledger append and throws with spent tokens on failure; `:778–783` does the same for results. No subsequent paid child starts after either rejected append. Probe evidence failure now stops too. Remaining-wall capping and early UNATTACHED folding are improved.

**Interruption gaps remain:**

- `registrationProbe` never registers an `INFLIGHT` salvage callback. SIGINT during the paid registration probe kills it and exits without ledgering partial spend.
- `executeRun` removes its callback immediately after child completion (`run.mjs:308`), **before** asynchronous evidence processing and the result append (`:780`). SIGINT in that interval loses an already-paid run.
- The SIGINT handler (`:641–654`) signals children, snapshots currently delivered stdout, then immediately exits. It does not drain remaining output or confirm termination. It also does not persist the raw live buffer as evidence.

**Fix:** keep paid-operation accounting active from spawn through acknowledged persistence, covering probes and runs. Test interruption during the child, postprocessing, and append; retain partial evidence and unknown-spend status.

**Requested DI answer: no.** `test/integration.test.mjs:213–223` replaces both append functions even on the happy path. The separate ledger test manually uses `fs.appendFile`; it does not exercise production `appendLedger`. Add a real-append orchestration test, plus result-append failure coverage.

## C. Pricing — PARTIAL

- **Prepared catalog wiring: PASS.** `run.mjs:602` passes `agentDir`; `lib/pi-exports.mjs:180–188` selects that directory’s configuration and catalog paths.
- **Buckets: improved.** `lib/nested.mjs:230–243,275–280` retains per-model usage; the sidecar forwards it; `lib/usage.mjs:185–200,236–269` prices each bucket.
- **Helpers and aggregate: PASS for unknown nested spend.** `lib/usage.mjs:65–91` separates null total from observed lower bound. `aggregate.mjs:85–92,127–128` carries that distinction into cells and profile rows.
- **Persisted run record: inconsistent.** `run.mjs:368–369` still writes numeric `cost` and potentially null `costReason` when `nestedUnknown` is true. The helper corrects this when reading, but the record itself contradicts the advertised contract.
- **Budget money loses observed cost.** `run.mjs:709,787` sums `costOf(...) ?? 0`, discarding known dollars from unknown-spend runs rather than using `observedCostOfRecord`.
- **Mixed-price lower bound is incomplete.** When one model bucket is unpriced, `nestedCost` becomes null; `observedCostOfRecord` then omits the other successfully priced nested buckets. Preserve their sum separately.

**DESIGN decision input is correct:** `DESIGN.md:224–240` defines its cost clauses using token spend and checks **`nestedUnknown`**, not the newly nullable dollar field. Do not replace that gate with `cost === null`: missing dollar prices and unobserved token spend are different conditions.

## D. Round-4 A/D regression check — PASS, bounded

- Nested detection logic is unchanged; per-model retention improves accounting. The previously reviewed coverage limitations remain, without reopening them.
- The ordered decision procedure is unchanged and retains its unknown-spend and sufficiency gates.
- Documentation still overstates Codex as fetch-free (`DESIGN.md:108–113`), although the sidecar comment now correctly describes its SSE fallback.
- The evaluator’s claimed isolation is not implemented; its finite-probe caveat cannot cover the concrete gaps in dimension A.

## E. New regressions — BLOCK

1. **Preflight throws before spending.** `run.mjs:431` references undeclared `onBuffer` inside `loadProbe`. Every actual preflight reaches this after spawning its RPC child. Remove the stray line and add a stubbed **loadProbe** test; current integration tests omit that path.

2. **c8 no longer runs the new test against the fixed source.** `tasks/c8-guard.json:129–159` checks file contents, runs only the reverted test, then the *existing* suite. A correct guard plus an always-failing new test can pass the grader. This contradicts both the prompt and `DESIGN.md:324–326`. Restore the positive command check and test an unconditional assertion failure/syntax error in the new test.

## F. Rep-0 checklist — after fixes and renewed approval

1. **Identity:** matching content pins/fingerprint; 44 unique rep-0 tuples; no pilot records mixed in.
2. **Preflight:** prepared catalogs, credential mode, model and compaction settings confirmed; all RPC load probes pass.
3. **Persistence:** production ledger/result append tests and interruption tests pass; C registration spend is recorded before any run.
4. **Correctness:** evaluator adversarial cases pass; inspect both edit diffs; new guard test passes fixed and fails reverted.
5. **Health/accounting:** inspect settled/dangling/errors/kill status and first C summary detector evidence; reconcile own+nested usage and unknown lower bounds.
6. **Stop/recost:** reconcile all-state results plus probe ledger, project remaining repetitions with headroom; rep 0 authorizes no adoption decision.

### For the maintainer
Do not launch replicate 0 at this HEAD.
Close the evaluator’s filesystem/prototype gaps and strengthen its missing-input tests.
Keep probe/run salvage active until persistence; test real append implementations.
Fix `loadProbe`, restore c8’s positive test execution, and align recorded/observed cost fields.

VERDICT: NO-GO
