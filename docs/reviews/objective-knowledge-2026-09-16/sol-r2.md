### A — CLOSED
`packages/nana-pack/extensions/nana-objective.ts:40-48` — Relative paths resolve under `~/.pi/agent`; `~/` expands through the home directory and absolute paths remain unchanged.

### B — STILL OPEN
`packages/nana-knowledge/bin/nana-knowledge.ts:63-68`; `packages/nana-knowledge/lib/hook.ts:114-151` — The timer enforces asynchronous liveness but not the stated 1500 ms wall-clock bound. Synchronous SQLite and filesystem operations—including `existsSync`, database search, dedup reads/writes, and log append—block the event loop, preventing the timer from firing. The harness’s 5-second timeout preserves eventual fail-open behavior, but it does not satisfy the package’s documented 1500 ms guarantee. The no-worker decision is operationally reasonable only if the contract is weakened to “normally under 1500 ms, harness-bounded otherwise.”

### C — STILL OPEN
`packages/nana-knowledge/lib/build.ts:40-45` — Fresh-lock acquisition is atomic, but stale-lock reclamation reintroduces a race. Two builders can both stat the old stale lock; builder A removes it and creates its new lock, then builder B executes its already-authorized `rmSync`, deletes A’s new lock, and creates its own. Both return `true` and write concurrently. This is especially dangerous when either invocation uses `--rebuild`, which removes the database and WAL files.

### D — CLOSED
`packages/nana-knowledge/lib/hook.ts:86-101` — The final block is capped after formatting and explicitly labels indexed text as untrusted data that must never be treated as instructions.

### E — CLOSED
`packages/nana-pack/extensions/nana-objective.ts:105-136` — Missing, empty, unreadable, and workspace-symlink cases inject and journal an unavailable marker; cached state is cleared before the enabled check. Treating truncation as available is sound because the capped content is injected, truncation is conspicuous, and the journal records `truncated:true`.

### F — STILL OPEN
`app/scripts/review-round.mjs:12-16`; `app/tests/review-round.test.ts:17-21` — Both corpus conventions are now recognized and wrapper arguments are correctly isolated before `--`, but the claimed trailing alphanumeric boundary is not implemented. `(?![0-9])` permits letters, so unrelated basenames such as `report-r4beta.md` and `round-4k-notes.md` are classified as round 4 and refused. Tests cover trailing digits but not trailing letters.

### G — CLOSED
Owner decision accepted. No new harm beyond the previously considered local logging/privacy tradeoff.

### H — STILL OPEN
`packages/nana-knowledge/tests/hook.test.mjs:179-184,195-206` — Hung stdin and malformed input are now exercised end-to-end. However, the “concurrent” lock test invokes `acquireBuildLock()` three times sequentially in one process, so it cannot expose the stale-reclamation interleaving in C. The deadline test also explicitly accepts approximately 1570–1800 ms, rather than proving the advertised 1500 ms end-to-end bound.

### NEW — MEDIUM: Temporarily missing roots are purged
`packages/nana-knowledge/lib/build.ts:161-166,207-209` — Missing configured roots are reported as skipped, but their existing files remain in `existing` and are subsequently deleted from the index. A temporarily unavailable mount or renamed repository therefore erases all indexed knowledge for that root until another successful build restores it. Preserve entries belonging to configured-but-currently-missing roots; only purge files from roots that were successfully scanned or explicitly removed from configuration.

**VERDICT: BLOCK**

Stale-lock reclamation can still admit concurrent builders, and the advertised 1500 ms hard bound remains unenforced for synchronous stalls.
