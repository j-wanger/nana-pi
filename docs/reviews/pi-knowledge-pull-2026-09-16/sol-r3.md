## 1. The seam — PASS

`packages/nana-knowledge/extensions/nana-knowledge.ts:78-97`

`execFileFn` is typed as `typeof execFile`, defaults directly to Node’s `execFile`, and receives the same executable, arguments, options, and callback. It is exposed only through `makePull`’s options; production behavior is unchanged.

## 2. Test 5b proves the timer — PASS

`packages/nana-knowledge/tests/extension.test.mjs:88-109`

The stub never invokes the callback and its stdin methods are inert, so only `makePull`’s parent timer can resolve `null` before the race guard. The timing assertion pins settlement near 200 ms. Because the stub owns `kill`, the single recorded `SIGKILL` cannot come from Node’s `execFile` timeout. Implementation order is `done(null)` before `child.kill("SIGKILL")`.

## 3. Wording — PASS

- Header: `extensions/nana-knowledge.ts:18-21`
- Timer comment: `extensions/nana-knowledge.ts:107-114`
- README: `README.md:166-170`

All three now distinguish killable children—including descendants retaining pipes—from an uninterruptibly wedged child whose close callback never fires. No remaining timeout overclaim found.

## 4. Regression scan — PASS

The inspected `lib/` contracts and both package manifests remain consistent with round 2. The extension handler body at `extensions/nana-knowledge.ts:143-162` is unchanged: one handler, only the non-string API guard, child-owned dedup, and fail-open behavior.

## Residuals

- **RESIDUAL — overlap-dedup race:** concurrent pulls can repeat pointers; no corruption or hung turn.
- **RESIDUAL — compaction:** old pointer messages may be summarized or dropped and cannot be re-pulled in that session.
- **RESIDUAL — double registration:** explicitly installing both the repository root and nested package can register the same extension twice; normal either/or installation does not.
- **RESIDUAL — bun untested:** the PATH-resolved Node fallback is sound but lacks an actual Bun integration run.

**VERDICT: LAND**

The round-2 timer defect is now directly covered, accurately documented, and no blocking prompt, containment, or turn-progress defect remains.
