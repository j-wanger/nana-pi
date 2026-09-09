# apps/bench — independent review, round 6 (Fable), HEAD 09e6f4b (+ e18ea5e docs)

Read-only. 13 test files run: 741 PASS / 0 FAIL, every file exit 0. No `--go`/`--smoke`. Reproductions in
`bench-work/fable-scratch/` (memory-only, no model calls). Paths relative to `~/nana-pi/apps/bench`.

**Headline: one live forgery remains in the evaluator (A3, the exact Node-internals question the brief
asked), reproduced end to end through the real `eval-module` checker at HEAD. Three-line fix, verified.
Because `lib/eval-module.mjs` is content-pinned (`study.json:pinnedSha["trusted-evaluator"]`) and the
pin is in the fingerprint, fixing it AFTER rep 0 would make reps 1–2 refuse to resume
(`lib/plan.mjs:195-199`). Fix before spend.**

## A. Evaluator isolation — verification register

| # | Property | Verdict | Where |
|---|---|---|---|
| 1 | Nonce unreachable after fd 4 close + spec unlink | **GUARANTEED** | `lib/checkers.mjs:153-158` (write → open → unlink → spawn); `lib/eval-module.mjs:103-135` (read to EOF, close, `spec = null`). Tested: `evaluator-hardening.test.mjs:39-72` (tmpdir glob + `/dev/fd/4` both unreadable). |
| 2 | Exactly one HMAC-valid verdict; shape + probe count | **GUARANTEED** | `checkers.mjs:107-127` (`ambiguous` on >1), `:186-217` (object shape, `probes` array, count vs spec). Serialiser escapes `\t` (`eval-module.mjs:151`) so `lastIndexOf("\t")` is the separator. Tests `:74-99`. |
| 3 | Prototype-independent verdict construction | **GAP — live forgery** | See below. |
| 4 | Primitive-only comparison | **GUARANTEED** | `eval-module.mjs:340-357`: expectation and return both checked with `isPrimitive` before `===`; NaN handled by `isNaN_`. Tests `:167-185`. |
| 5 | Unfinished evaluation → grader-error unless a failing probe was already signed | **GUARANTEED** | `eval-module.mjs:206-207` (exit hook signs partial state), `checkers.mjs:206-212`. Tests `:187-214` (exit 13, busy loop, exit-during-import, fail-then-exit, pass-then-exit). |

### A3 — the nonce leaks through `createHmac("sha256", <string>)`

`eval-module.mjs:193` calls captured `createHmac` with the nonce **as a string**. Node 22.22.2's
`Hmac` constructor → `prepareSecretKey` → `getArrayBufferOrView` → **`Buffer.from(key, encoding)`**
(`node:internal/crypto/keys:689`), and `Buffer.from` is a plain writable property on the global
`Buffer`, not a primordial. A module that replaces it receives the nonce at emit time — after the
probes, before the signature.

Reproduction (`fable-scratch/forge/attack.mjs`, driven through the REAL `runCheck({type:"eval-module"})`):
`twice(n) => n*3` + a `Buffer.from` hook that (a) captures the 64-hex string, (b) signs a forged
all-pass verdict with the original `createHmac`, (c) writes it to fd 3, (d) throws — so the evaluator's
own `emit` never reaches `writeSync` and `sent` is already `true` (`:190-191`). fd 3 carries exactly one
HMAC-valid line. Result at HEAD:

```
{"pass":true,"detail":"1/1 behaviour probes passed under the trusted evaluator (signed verdict)"}
```

The whole hook fits inside a probed function body (it only needs to run before `emit`), so
`withinLines` does not bound it. It defeats every A3 test in the matrix because none of the 15 patch
shapes touches `Buffer.from` (`evaluator-hardening.test.mjs:103-135`).

**Fix (3 lines, verified in `fable-scratch/eval-fixed.mjs` → `"got 12, want 8"` against the same attack):**
capture `const bufFrom = Buffer.from` beside `bufAlloc` (`:70`); build
`const NONCE_KEY = typeof NONCE === "string" ? bufFrom(NONCE, "utf8") : null` right after `:132`
(pre-import); sign with `hmac("sha256", NONCE_KEY)` at `:193`. A Buffer key returns from
`getArrayBufferOrView` via `isArrayBufferView` with no JS-visible call. Then: add the `Buffer.from` hook
to the A3 matrix AND to the positive control, re-pin `trusted-evaluator` in `study.json`, regenerate
`fingerprint.txt`/`schedule.json`.

The other two post-import internals the brief named, by reading Node 22 `lib/`:
`Hash.prototype.update(string)` → `validateEncoding` (internal `normalizeEncoding`) + native handle;
`Hmac.prototype.digest("hex")` → native on the un-finalised path (`Buffer.from` only on the
already-finalised branch, never taken); `fs.writeSync(fd, string)` → `validateStringAfterArrayBufferView`
+ `binding.writeString`. None consult a user-writable property. Confirmed indirectly: the fixed
evaluator produced a correct signed verdict with `Buffer.from` still hooked.

Residual (documented, not a forgery): a wrong module can convert FAIL → grader-error by dying before
its first probe result is recorded (e.g. a strict-mode `TypeError` from an accessor planted on
`Array.prototype[0]`, which makes `args[i] =` at `:308` throw). Exclusion is visible in the record and
3 in a row stop the study; accept.

Probe sets (c7 13 / c8 19): re-derived from the pristine fixture in `study-tasks.test.mjs:203-219`
(94 checks). Common wrong fixes are all caught: `Math.round(n*100)/100` (−2.345 → "-2.34"),
`n.toFixed(2)` without `parseFloat` (3.1 → "3.10"), remainder/comparison guards (NaN/Infinity), a guard
after the early return (`"",0`). No remaining wrong-fix class found.

## B. Interrupt salvage

The registered→acknowledged window is airtight on the **loss** side (`run.mjs:284-296` hook set at
spawn, released only at `:489`/`:532` after the append resolves) — but **not** on the **duplicate**
side, and the drain is a correctness-of-record risk, not only an evidence one.

Reproduced with production defaults (`fable-scratch/race/run.mjs`, real `runPlan`+`executeRun`, hung
stub child, `handleInterrupt({drainMs:1200, confirmMs:1500})`):

- checker blocks 300 ms (a c7 `suite` spawn): the killed child's `close` fires during the drain,
  postprocessing + append finish inside it, the hook is released, salvage persists **0**. The record on
  disk is `run-error "pi exited null (SIGKILL)"`, **`cost: 0.0012`, `nestedUnknown: false`** — a
  truncated stream priced as a total. README:36-43 promises `run-error: interrupted`, `cost: null`,
  `nestedUnknown` for this case; that holds only when postprocessing is slower than the drain.
- checker blocks 2500 ms (c8: `command` + `revert-and-fail` workspace copy + `suite`): salvage writes
  the interrupted record, then the normal path appends a **second** record for the same tuple
  (rows=2). In production `exit(130)` follows the salvage synchronously, so the second append usually
  loses the race — usually. `aggregate.mjs:57-62` would flag it as a duplicate; `budgetFrom` would
  count the spend twice.

**Fix:** a module-level `let interrupting = false`, set at the top of `handleInterrupt`; in `runPlan`
before `resultFn` (`:525`) and before `ledgerFn` (`:471`): `if (interrupting) return;` (the hook is
still registered, so the salvage owns the record). Test: the race script above, both timings → exactly
one row, `interrupted: true`.

Other B answers: exit 130 leaves no *paid* child — `LIVE` holds every `runChild` child and the handler
kills the group and confirms with `treeAlive` (`:146-155`). `loadProbe`'s RPC child (`:146`) is not in
`LIVE`; it is zero-token and dies on stdin EOF. The SIGINT wiring test drives the real registered
handler via `process.emit("SIGINT")` with an injected `exit` (`orchestration-paths.test.mjs:385-415`) —
real handler, real salvage, real file.

## C. Regressions / fresh-worker blind spots

- `orchestration-paths.test.mjs` reaches `loadProbe`, `registrationProbe`, `executeRun`, `runPlan`,
  `handleInterrupt`, `installInterruptHandler` — every exported orchestration function. Not reached by
  any test: `main()` (`run.mjs:311-404`; read line by line — every identifier declared) and
  `piVersion`/`resolvePiLauncher` (only `plan.test.mjs` mentions them). No undeclared reference found.
- **Every `executeRun` test uses `fixture: false`.** `prepareWorkspace` → `verifyFixture` →
  `materialize` → `applyMutations`, the `preRun` capture (`:348-352`), `workspaceDiffs`, and
  `writeEvidence` with diffs are exercised only as separate pieces; `study-tasks.test.mjs:56-64` builds
  the checker `ctx` by hand (same keys as `run.mjs:45` — I diffed them). This is the classic
  test-the-stub seam. Minimal guard: one `executeRun` over the real study with a stub child that edits
  `blocks.mjs` and prints a stream; assert `changedFiles === 1`, `workspace.diff` present,
  `check.detail` contains `changed-paths:ok`.
- `orchestration-paths.test.mjs` predates this fold (first added in 9784d58); the commit message calls
  it new. Cosmetic.
- `tasks/c8-guard.json:6-12` copies `assets/clamp-guard-probe.mjs` to `_bench/` and its `note:14`
  says it "prints 13 PASS lines"; **no checker runs it** (already true at 9784d58). Dead asset, harmless
  (`benchPaths` excluded from diffs); delete or say so.
- `checkers.mjs:160`: a spawn timeout returns `infra` before reading fd 3, so a correct module that
  leaves a live handle after a signed verdict is a grader-error. Not reachable from `blocks.mjs`; note.

## D. Persisted cost contract

Consistent. Writer: `run.mjs:80-91` (`cost` null iff `unknownSpend` or unpriced nested; reason
alongside; `pricedNestedCost` carried). Readers: `usage.mjs:65-73` (`costOfRecord` null on
`nestedUnknown`, `cost===null`, or unpriced nested), `:85-89` (`observedCostOfRecord` uses
`nestedCost ?? pricedNestedCost`), `aggregate.mjs:86-91` (cell `cost` null if any decided run null;
`observedCost` always), `:128-129` (profile row). Budget: `run.mjs:452,536` use `observedCostOf`.
Salvage records: `cost: null` + reason (`:313-314`, `:208-209`). README:56 matches. One asymmetry:
the registration probe's non-interrupted `cost` (`:234`) is `own + (nestedCost?.total ?? 0)` — a number
even when nested spend is unpriced; ledger rows have no `nestedUnknown`. Low; the C probe rarely calls
tools.

## E. Readiness

Residual risk for rep 0 with A3 fixed: **low**. With a non-adversarial model the evaluator gap cannot
produce a wrong number; the interrupt race only matters if Jake hits Ctrl-C mid-run. Neither can be
fixed cheaply *after* rep 0 (evaluator pin → fingerprint), which is why the verdict is NO-GO rather
than GO-with-notes.

Top 3 things to read in rep-0 output:
1. Any `changed-paths:FAIL` on a run whose `eval-module:ok` — the `withinLines` rule (`c8` 176–192)
   rejects a model that also touches the doc comment above `clampText` (lines 173–175). That is a
   shape-rule strictness call, not a wrong guard; decide before rep 1 whether the rule stays.
2. `state: grader-error` counts per cell, and their `check.detail`: `did not finish` / `could not run`
   / `ambiguous` — each names a harness fault; 3 in a row stops the study.
3. The first C cell: `nestedUnknown`, `nestedUnattached`, `nestedModels`, and whether `cost` is null
   with `costReason` naming `no-network-observed` — step 0 of the decision rule keys on this.

### For the maintainer
1. Sign with a Buffer key built pre-import (`eval-module.mjs:70,132,193`); add the `Buffer.from` hook
   to the A3 matrix and the positive control; re-pin the evaluator + regenerate fingerprint/schedule.
2. Add an `interrupting` flag so the normal path never appends once salvage has begun; assert one row
   at both race timings.
3. Add one `executeRun` over the real study fixture with a stub child (edit + stream) so the
   workspace/diff/preRun wiring is driven, not mirrored.
4. Delete the unused `clamp-guard-probe.mjs` asset or run it.

VERDICT: NO-GO
