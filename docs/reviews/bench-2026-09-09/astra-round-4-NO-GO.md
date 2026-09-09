**Replicate 0 should not start at `79c8d1c`.** The intended nested detector works, but trusted-suite forgery remains reproducible and probe persistence still fails open.

Read-only review; no model calls or spending commands. Read all requested code and tests. Ran the read-only nested tests and memory-only reproductions on Node **22.22.2**; did not run the writing integration/checker suites.

Paths below are relative to `~/nana-pi/apps/bench`.

## A. Nested detectors — PASS for the pinned summary path; limitations remain

- **The WebSocket wrapper can fire.** Installed pi-ai’s `openai-codex-responses.js:703–730` obtains `globalThis.WebSocket` at connection time on Node; `:777–790` constructs that returned constructor. It is neither a module-scope captured Node constructor nor an imported `ws` constructor.
- **The details detector matches actual output.** pi-web-access’s `index.ts:1448–1459` returns `details.summary.{phase,model,fallbackUsed}`. Its successful summary report names `provider/model` (`summary-review.ts:399–407`), within the recorder’s traversal depth.
- The non-LLM-window reset defect is fixed. Nested unit tests passed. **16,289 is appropriately relabelled observed spend.**
- Constructor interception does not observe **reused sockets**. The details detector also cannot distinguish an unmeasured call from a measured call using the same model. Fallback summaries can follow attempted model calls, yet omit their model and are ignored by `notePaths`.
- Consequently, **if both detectors miss, failure can still be silent**: measured search traffic suppresses silence detection. A memory-only recorder reproduction returned `unknown:false` for measured search plus a timeout-fallback report. This is a coverage limitation, not evidence that the pinned Luna success path escapes both detectors.
- Conservative unknown flags on cache/local work—and potentially every summarizing C run—are acceptable for this pilot: **C’s cost claim becomes insufficient, not falsely cheap**. Unused web tools do not automatically flag C.

The “zero fetch calls” explanation is overstated: installed Codex also has an SSE fallback through `options.fetch ?? globalThis.fetch` at line 265.

## B. Sentinel/trusted-suite — BLOCK

### Allowed source still manufactures a passing verdict

`lib/checkers.mjs:23,286–314`; `lib/harness-sentinel.cjs:47–110`.

On Node 22, I loaded the actual sentinel and fixture suite into an in-memory VM, with filesystem writes intercepted. A change entirely inside c7’s permitted `fmtNum` range:

- retained broken one-decimal rounding, merely changing whitespace to evade `notContains`;
- accessed `process.stdout['write']` and `process['exit']`, avoiding every denylist token;
- rewrote FAIL output to PASS;
- supplied a fabricated trusted frame using `Error.prepareStackTrace`;
- forced the trusted exit wrapper to receive zero.

Result:

```text
denyHits: []
trustedPass: 112
untrustedPass: 0
fail: 0
exitAttempts: []
exitCode: 0
```

The protected test file was unchanged. **All three c7 checker predicates accept this shape and evidence.** Stack attribution identifies ordinary callers, but it is not trustworthy against code sharing mutable globals.

Other requested surfaces are likewise not isolated:

- stdout wrappers remain replaceable;
- original exit functions are explicitly exposed as `.__benchOriginal`;
- marker paths are exposed in the environment;
- workers and filesystem access are not restricted;
- copying the sentinel outside the fixture provides provenance, **not protection from same-user runtime writes**.

**Required:** replace the mutable same-process trust claim with a constrained implementation evaluator or genuinely isolated assertion harness. Adding more literal denylist entries will not close this class.

### NEW: legitimate guard tests are rejected

`lib/checkers.mjs:345–348` rejects a normal `node:assert` assertion failure unless it also produces a FAIL line or calls trusted `process.exit(nonzero)`.

A standard `assert.throws(() => clampText(...), TypeError)` test passes with the guard and genuinely fails without it, yet is classified as a crash. The task prompt requires no special reporter.

**Required:** accept actual assertion failures through trusted structured reporting, without requiring an unstated output convention.

## C. Probe/run persistence and killing — BLOCK

**Verified improvements:** explicit probe `pricer`; evidence before probe judgement; shared JSONL tail repair; trailing systemic streak restoration; budget recheck after probes; measured run tokens retained through the tested postprocessing failure.

**Remaining persistence failure:** `run.mjs:639–651` catches a failed ledger append, prints that probe spend is **NOT recorded**, and continues spending. A successful probe can therefore be repeated and omitted from resumed budgets. Evidence-write failures also do not prevent probe success.

The integration tests do **not** exercise probe→production-ledger persistence: they call `registrationProbe`, then separately construct and append synthetic ledger rows (`test/integration.test.mjs:123–132`). The main-loop failure path remains uncovered.

**Required:** persist the probe result durably before authorizing another paid child; a failed append must stop. Test the actual orchestration path.

Additional gaps:

- `SIGINT` immediately exits after signalling children (`run.mjs:590`), bypassing persistence of the current buffered stream and measured partial spend.
- The postprocessing fallback loses stderr-only `UNATTACHED` unknown status: `measured` is populated before that flag is incorporated (`:268–283`).
- Remaining-wall capping is not exact: `Math.max(30000, …)` grants 30 seconds even when less remains (`:624`).

**macOS kill confirmation:** probing the negative detached PID correctly checks surviving members of that process group, including after the leader dies. This fixes the earlier leader-only check. It does not cover descendants that deliberately create another session/group; confirmation is also only performed for timeouts.

## D. Decision procedure — PASS

`studies/tool-profiles-2026-09-08/DESIGN.md:226–282`.

The ordered procedure now supplies one verdict:

- sufficiency gates correctness conclusions;
- regression precedes improvement, including wins bought with doubled known spend;
- unknown spend disables cost clauses, leaving correctness-only outcomes or insufficient cost data;
- C research adoption requires improvement plus its additional threshold;
- default adoption requires affirmative code evidence and is prohibited under C’s unknown-spend rule;
- N→5 counts distinct task IDs; stops do not authorize extension.

No outcome-forcing defect found. Rep 0 alone cannot satisfy the two-decided-runs-per-arm requirement.

## E. Other fold verification — SHOULD

**Pricing wiring remains incomplete.** `createPricer` accepts explicit catalog paths, but `run.mjs:557` does **not pass `agentDir`**. The production runtime therefore still consults inherited/default configuration rather than explicitly using the prepared catalogs.

**Unknown cost still appears numeric.** `costOfRecord` (`lib/usage.mjs:65–70`) ignores `nestedUnknown`. A memory-only reproduction returned `$0.01` for an unknown-spend record. Aggregation consequently reports money alongside an unknown flag, contrary to the helper’s “whole run is priced” contract. Return null with a reason, or explicitly expose a separately named observed-cost lower bound.

Per-model pricing avoids the old first-model pooling error; multiple models within one tool result become unpriceable rather than guessed. Optional public Usage fields are carried. However, the sidecar itself still pools a window and does not supply full per-provider/model usage buckets.

## F. Rep-0 checklist — after fixes and fresh approval

1. **Identity:** current fingerprint/pins; exactly 44 unique rep-0 tuples; matching schedule/block IDs; no pilot records.
2. **Preflight:** prepared catalog paths, credential mode, expected model, compaction off, successful load probes; one durably recorded C registration probe.
3. **Health:** inspect state, exit/signal, settled/dangling/badLines, retries, compactions, extension errors and kill confirmation; no unresolved systemic stop.
4. **Nested coverage:** inspect the first C search’s raw summary report and `benchNested.unobservedPaths`; reconcile own/nested usage and unknown flags before trusting any cost.
5. **Correctness:** inspect both edit diffs and trusted assertion evidence; verify the guard test fails by assertion after restoration; confirm identical persisted oracle keys per block.
6. **Recost:** reconcile all-state run spend plus probe ledger, retaining unknown lower bounds; project reps 1–2 with headroom. Rep 0 authorizes no adoption verdict.

### For the maintainer
Do not launch rep 0 at this HEAD.
The sentinel still accepts forged success from the allowed source; ordinary assertion tests can also be rejected.
Make probe persistence fail closed and test the production ledger path.
Wire the prepared pricing catalog and preserve unknown status through every record path.

VERDICT: NO-GO
