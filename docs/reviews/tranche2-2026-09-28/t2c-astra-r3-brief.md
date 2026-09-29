# Astra land ruling — lane T2c, round 3 (final under the cap)

Your r2 (`t2c-astra-r2.md`, 7/10 BLOCK) left one MUST: the empty-lock false affirmation. Fix commit `e938341` (`t2c-worker-r8.md`). Worktree `~/nana-pi-wt/t2c`; clean diff vs main `t2c-r7.patch`.

**Reproduced before fixing:** the new cases were added to the UNFIXED code first — the golden test exited 20, with "fresh empty lock folder, affirmative record: LABELLED" failing and the predicate disagreeing with pi (we said trusted; pi's `get()`/`set()` threw `ELOCKED`). Same for the future-dated case.

**pi's rule, taken from source:** `proper-lockfile/lib/lockfile.js:84-85` — stale when `stat.mtime.getTime() < Date.now() - options.stale`; the interval defaults to 10000 ms (`:208`) and pi passes no override (`trust-manager.js:113`). pi takes over only when that rule says stale (`:65-82`), else retries 10×20 ms and throws (`trust-manager.js:108-127`). `lockProblem()` applies the same comparison, so a lock stale at our check is still stale at pi's.

| Lock | Our verdict | pi `get()`/`set()` |
|---|---|---|
| Fresh empty | "store locked" → LABELLED | both throw `ELOCKED` |
| Future-dated empty | "store locked" → LABELLED, remedy shows the ISO date | both throw `ELOCKED` |
| Stale empty (60 s) | usable → unlabelled with a recorded `true` | both succeed |

Each case runs with a recorded `true` and with no record, and asserts both runtimes emit byte-identical text.

**Remedy for a live lock** (a test asserts it never says move, delete or remove-first): names the store and the lock, says pi treats it as held and that both pi's trust check and `/trust` fail while it is, says it clears on its own when that pi finishes, says explicitly not to remove it, and tells the owner to wait and restart.

**Docs:** README (~550-582) and `AGENTS.md:36-39` no longer imply an empty lock is fine.

Seat-verified: `npm test` → 71 files, 4457 checks, exit 0.

Judge only, ≤25 lines:
1. MUST 2 now FIXED / PARTIAL / NOT FIXED, with the line.
2. Any NEW defect from the staleness comparison or the new remedy — including the worker's own doubt: for the future-dated case the text presumes "another pi process" holds it, when a fresh empty directory could have been left by anything. Is that presumption acceptable in the wording?
3. Your final CARRY list for the merge (the earlier carries stand: broken `trust.json` symlink diagnosis; writability checks as pre-checks not proof; Claude-hook relative-override resolution; and the separate urgent `config.ts:276` deny-policy item).
End with `SCORE: n/10`, MUST (empty if none), CARRY, `VERDICT: LAND` or `VERDICT: BLOCK`.
