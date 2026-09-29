Commit `e938341` is on `lane/t2c-provenance-label` (not pushed). A fresh or future-dated empty lock folder now keeps the label even when the store records `true`. A stale one does not.

- **Reproduced first:** I added the new T17 cases to the unfixed code and ran the golden test (exit 20). "fresh empty lock folder, affirmative record: LABELLED" failed, and so did "predicate === pi's recorded decision (false)": our side said trusted while pi's `get()`/`set()` threw `ELOCKED`. The future-dated case failed the same way. After the fix the test exits 0 with 1071 PASS lines.
- **pi's staleness rule:** `proper-lockfile/lib/lockfile.js:84-85` treats a lock as stale when `stat.mtime.getTime() < Date.now() - options.stale`. The stale interval defaults to 10000 ms (`:208`), and pi passes no override (`trust-manager.js:113`). pi takes over an existing lock only when that rule says stale (`:65-82`); otherwise it retries 10×20 ms (`trust-manager.js:108-127`) and throws. `lockProblem()` in `objective.ts` applies the same comparison. A lock that is stale when we check is still stale when pi checks later.
- **The three lock cases (T17, each run with a recorded `true` and with no record):**

  | Lock | Our verdict | pi's `get()`/`set()` | Lock afterwards |
  |---|---|---|---|
  | Fresh empty | new problem "store locked"; labelled | both throw `ELOCKED` | left in place |
  | Future-dated empty | "store locked"; labelled, remedy shows the ISO date | both throw `ELOCKED` | left in place |
  | Stale empty (60 s old) | usable (unlabelled with `true`; plain `/trust` advice with no record) | both succeed; `get()` returns `true` only when recorded | reclaimed by pi |

  All six cases also check that the hook and pi runtimes emit byte-identical text.
- **Remedy text for a live lock:** "pi's trust store S is locked by another pi process — its lock folder O is less than 10 s old, so pi treats it as held, and while it is held pi's own trust check and /trust both fail (even a recorded decision is not read). The lock clears on its own once that pi finishes and removes it; do not remove it yourself (it may belong to a running pi). Wait for that pi to complete and restart this session; if the label remains, start pi in …". A test checks that it never says move, delete or remove-first.
- **Docs:** the README (around lines 550–582) and `AGENTS.md:36-39` no longer imply an empty lock is fine.
- **`npm test`:** exit 0 — 71 files: 70 PASS, 0 FAIL, 1 SKIP; 4457 checks pass, 0 fail, 6 skip.
- **Residuals:**
  - The verdict is still computed once at startup. A lock that becomes stale later leaves the session labelled, which is the safe direction.
  - A far-future-dated lock stays labelled with "wait and restart" advice and no removal advice. That is deliberate, because pi's rule never calls it stale.
  - The fresh-lock test assumes each step runs within 10 s, since the lock ages in real time.
  - `config.ts:276` deny-policy is untouched, as briefed.
- **Claim most likely wrong:** that "another pi process" holds the lock. A fresh empty folder could also be left by something other than pi, so for the future-dated case the wording is a presumption.

VERDICT: DONE
