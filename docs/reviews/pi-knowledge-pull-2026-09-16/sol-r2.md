## 1. Deadline is real

**FINDING — MEDIUM** — `packages/nana-knowledge/tests/extension.test.mjs:88-105`  
The implementation has a real parent-side deadline: settlement is guarded, the happy path clears the timer, late callbacks are harmless, the timer is unref’d, and kill exceptions are swallowed.

However, the new test does not prove that deadline. It traps `SIGTERM`, while `makePull()` configures execFile to send `SIGKILL` at `packages/nana-knowledge/extensions/nana-knowledge.ts:95`. Removing the parent timer would still let this test pass through execFile’s own timeout callback. It also checks only an upper bound, not “near the deadline.”

Smallest fix: use a child that leaves a descendant holding inherited stdout open after the direct child receives SIGKILL, then clean up that descendant after asserting `makePull()` settled near the configured deadline.

## 2. Runtime choice

**PASS** — `packages/nana-knowledge/extensions/nana-knowledge.ts:60-61`  
The case-insensitive `startsWith("node")` check accepts `node`, `node.exe`, `nodejs`, `node22`, and corresponding case variants. Other runtimes fall back to PATH-resolved `node`; absent executables report ENOENT through the execFile callback and fail open, with synchronous spawn errors also caught.

## 3. Regression scan

**PASS**  
The fold is confined to the stated changes. The empty-string wrapper guard is removed, while the non-string API guard remains at `extensions/nana-knowledge.ts:147`. The inspected `lib/hook.ts` and `lib/tokenize.ts` retain the round-1 contracts, including the `PROMPT_MAX_CHARS` re-export. No pack-side behavior is implicated.

## 4. Docs honesty

**FINDING — LOW** — `packages/nana-knowledge/extensions/nana-knowledge.ts:16-18`; `packages/nana-knowledge/README.md:166-168`  
The deadline and accumulation descriptions otherwise match the implementation, but “a child that traps the signal” is inaccurate because the configured timeout signal is SIGKILL, which cannot be trapped.

Smallest fix: replace that example with a child wedged in an uninterruptible syscall or a descendant retaining an output pipe.

## 5. Residuals from round 1

**PASS**  
No folded change worsened the remaining trade-offs, and none warrants blocking.

- **bun — CLOSED:** non-Node runtimes now use PATH-resolved `node`.
- **overlap — RESIDUAL:** overlapping pulls can still race dedup and repeat pointers; no corruption.
- **maxBuffer — CLOSED:** maxBuffer errors fail open, and the independent timer bounds delayed close.
- **compaction — RESIDUAL:** old pointer messages may be summarized/dropped and cannot be re-pulled; now documented honestly.

**VERDICT: LAND**

The deadline implementation is sound; the remaining test and wording mismatch is non-blocking and should be corrected as a documented residual.
