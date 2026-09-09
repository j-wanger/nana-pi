# apps/bench — independent GO/NO-GO, round 7 (Fable), HEAD efa8c3f

Read-only. 13 test files re-run at HEAD: **768 PASS / 0 FAIL**, every file exit 0. No `--go`/`--smoke`.
Round-6 forge + race reproductions re-run against HEAD; new memory-only accessor probe added in
`bench-work/fable-scratch/`. Paths relative to `~/nana-pi/apps/bench`. Pins verified against files on
disk: `eval-module.mjs`=`01bec720…`, `ext:sidecar`=`b85294d5…`, `ext:sidecar-lib`=`b4e19071…` — all
match `study.json` and `fingerprint.txt`; `schedule.json` fingerprint `d0838225…` = `fingerprint.txt`
head; schedule holds 132 runs, rep 0 = 44 (pi-defaults 8, lean-code-hinted 8, lean-code 14, research
14) + 1 C registration probe. So rep 0 will not abort on a pin/fingerprint mismatch before spend.

## A. The three round-6 findings — all CLOSED

**A1. Buffer.from nonce leak — CLOSED.** `eval-module.mjs:71,151` capture `bufFrom` pre-import and
build `NONCE_KEY` as a Buffer before the untrusted import; `:206,215,220` sign with the Buffer key and
`hmacUpdate(h, json, "utf8")` (string payload, explicit encoding — a `Buffer.from(json)` payload would
reach `Buffer.prototype.utf8Write`). Round-6 forge re-run through the REAL `runCheck` at HEAD →
`{"pass":false,…got 12, want 8}` (was `pass:true`). The whole emit body is now inside `try` (`:211-225`)
so a signing throw fails closed, not "forged line is the only line". PASS.

**A2. Interrupt drain race — CLOSED.** Sticky `interrupting` set at the top of `handleInterrupt`
(`run.mjs:237`); `runPlan` yields before both appends (`:955,1014`) and `markAppending`/`APPENDING`
(`:186-189`, checked `:253`) covers the mid-append sliver, un-marked on a failed append (`:971,1021`).
Round-6 race re-run with **production defaults**, both orderings → exactly one `run-error: interrupted`
row, `cost:null`, `nestedUnknown:true`. Test 5b drives the same with production defaults. PASS.

**A3. executeRun never tested on a real fixture — CLOSED.** `orchestration-paths.test.mjs:526-587`
(tiny real fixture: pin→materialize→mutate→preRun→diff→writeEvidence, asset-after-child, drifted-pin→
grader-error with 0 tokens) and `:589-621` (shipped c7 end to end, 13/13 probes, real ctx). PASS.

**Sweep test — load-bearing, residual acceptable.** `evaluator-hardening.test.mjs:190-241` wraps every
writable+configurable DATA function property on Buffer/String/Number/Array/Object/Function/Reflect/JSON/
Error/TextEncoder/typed-array prototypes/process and asserts the post-import path reaches **NONE**
(`reached.length === 0`) while still grading 6 probes correctly. That is the check that would have
caught A3 without knowing to look. **Not covered:** accessor (getter/setter) properties and any global
not in the list. I probed the gap directly (`fable-scratch/accessor/`): redefining `Buffer.from` as a
getter AND planting an `Object.prototype` accessor still yields the correct verdict (`got 12, want 8`),
because the signing path consults no writable *or* accessor property once the key is a pre-captured
Buffer. The residual is therefore a theoretical surface reachable only by an **adversarial** module;
gpt-5.6-sol doing a benign one-line fix is not that. Worst case (a wrong verdict on ≤2 of 8 code tasks)
requires adversarial intent that is out of scope for this pilot. **Acceptable — PASS.**

## B. What the fold introduced — no new defects

- **APPENDING mark / post-mutation diff base / emit-try / removed asset:** all wired correctly.
  `changedFiles = diffs.length` (`run.mjs:595`) and `workspace.diff` are the ONLY consumers of
  `workspaceDiffs`; no checker reads them (`changed-paths` recomputes via its own `hashTree`,
  `checkers.mjs:339`). So the pristine→post-mutation base change is **evidence-only and cannot move a
  verdict** — it fixed an empty diff on correct c7 fixes, nothing more. PASS.
- **Test seams test the code, not a stub:** `orchestration-paths` tests 7/10/11 use the REAL
  `appendResult`/`appendLedger`/`executeRun`/fixture; the DI stubs are confined to the probe (needs a
  real extension to spawn) and to fault-injection cases. PASS.
- **Removed `clamp-guard-probe.mjs`:** no checker referenced it; c8's 19 behaviour probes are the
  verdict and the asset MECHANISM is still exercised in test 10. Clean subtraction. PASS.

## C. Can rep 0 produce a WRONG (not merely unknown) number? — NO path found

- **Usage/cost parsing:** `parseStream` reads pi's own `totalTokens` and `cost` verbatim off each
  assistant `message_end` (`usage.mjs:216-217`); confirmed against a real pilot stream
  (`{input,output,cacheRead,cacheWrite,reasoning,totalTokens,cost{…}}`). Own vs nested kept strictly
  apart. PASS.
- **Nested / WebSocket:** the Codex WebSocket summary path is unmeasurable, but the sidecar marks it
  `nestedUnknown` (`nested.mjs:167,180,205`) → `cost:null` with reason → **step 0** makes C's cost
  clauses INSUFFICIENT rather than wrong. Never zero, never a total. PASS.
- **Pricing:** `createPricer` resolves offline against the PREPARED agent-dir catalogs
  (`pi-exports.mjs:180-208`); an unknown nested model → `null` with a reason, not a guess. PASS.
- **Checkers (6 nav + 6 research):** c1/c2 anchored regex with `\b` reject `153`/`530`; c3/c4 anchored
  `^\s*N\.?\s*$`; c5/c6 whole-array json-path (unordered); research whole-match against a pinned/live
  key. A wrong answer cannot match. PASS.
- **Live-key snapshot / ledger:** one oracle fetch per block, reused for both arms, failures recorded;
  probe spend ledgered fail-closed before any further spend. PASS.

**The only wrong-VERDICT class is the evaluator forgery — closed for every surface the current signing
path touches, and unreachable without an adversarial module.** Non-adversarial rep 0: no wrong number.

## D. Rep-0 checklist (before reps 1-2)

1. Every **C cell**: expect `nestedUnknown ≥ 1` with `costUnknownReasons` naming the WebSocket
   summary path, and `cost:null` — this is step-0 behaviour, NOT a bug; confirm it, don't "fix" it.
2. **`grader-error` count + `check.detail` per cell** (`did not finish`/`could not run`/`ambiguous`) —
   each names a harness fault; 3 in a row stops the study. Read the first C cell especially.
3. **c7/c8 coherence:** any run with `eval-module:ok` but `changed-paths:FAIL` — the `withinLines` rule
   (c7 150-153, c8 176-192) rejects an edit touching the doc-comment above the function. Decide the
   shape-rule strictness before rep 1; it is a strictness call, not a wrong guard.
4. **C `skippedOwnCalls > 0`** on runs that used web tools — confirms pi's own calls were scoped OUT of
   nested (the assumption the whole nested figure rests on).
5. **`keys.jsonl`:** one entry per research block, no oracle grader-errors (network reachable, pins not
   drifted — r3/r4/r5/r6 are tripwires).
6. **First C cell:** `provider`/`model` = `gpt-5.6-sol`, `nestedModels` billed separately — the cost
   arithmetic and the offline pricer resolved.

---
Residual risk for rep 0: **low**. Every round-6 finding is folded and reproduced-closed; the suite is
green; pins are consistent so the study starts rather than aborting; and no non-adversarial path yields
a wrong number. The evaluator's un-listed-surface residual is real but out of scope for a benign pilot.

VERDICT: GO
