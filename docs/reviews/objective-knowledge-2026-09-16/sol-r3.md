- **B — RESIDUAL:** Contract wording is accurate in README and CLI comments, but `tests/hook.test.mjs:162` still incorrectly headings the timer as an enforced “wall-clock bound”; subsequent comments correctly limit it to asynchronous stalls.
- **C — BLOCK:** `lib/build.ts:54-60` marks a lock stale after 10 minutes even when `kill(pid, 0)` confirms its owner is alive. A long build can therefore be reclaimed, admitting concurrent writers; with `--rebuild`, one can remove the active database/WAL beneath the other. TTL reclamation should apply only when no live owner PID can be established.
- **F — CLOSED:** The trailing alphanumeric boundary and regression cases correctly reject `r4beta` and `round-4k`.
- **H — RESIDUAL:** Real-process race coverage is now sound, but no test asserts that an alive owner remains protected after `LOCK_TTL_MS`, which would expose C.
- **NEW (missing roots) — CLOSED:** Rows are retained for configured-but-missing roots and purged only after a successful scan or configuration removal.
- **NEW — RESIDUAL:** `lib/build.ts:254-265` treats matching size/mtime or hash as unchanged without comparing `kind`; changing a root from `articles` to `ledger` leaves rows parsed under the old kind until file content changes or a rebuild occurs.

**VERDICT: BLOCK**

A live build lock can be reclaimed after ten minutes, allowing concurrent writers and destructive overlap with `--rebuild`.
