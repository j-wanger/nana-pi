## R2 verification

1. **PARTIAL** — `packages/nana-setup/lib/steps.mjs:105-153,168-197` uses an `O_EXCL` lock and re-compares after the fsynced temp write immediately before rename. However, stale-lock reclamation is racy (below), so the documented POSIX rename floor is not the only residual.

2. **FIXED** — `packages/nana-setup/lib/settings.mjs:24-89` tokenizes argv and anchors interpreter/script positions. `echo bash /tmp/nana-objective.sh` does not match; `NODE_NO_WARNINGS=1 node '/x y/nana-knowledge.ts' hook` does.

3. **FIXED** — `packages/nana-setup/lib/steps.mjs:425-465` requires `github.com` and normalized repository path `j-wanger/nana-pi`; `https://evil.example/archive/j-wanger/nana-pi` does not match.

## New regressions

### HIGH

- **`packages/nana-setup/lib/steps.mjs:115-140` — stale-lock reclamation can destroy a newly acquired lock.** Two processes can both inspect the same stale lock. After one removes it and successfully calls `take()`, the other can execute its already-decided `rmSync`, delete the first process’s live lock, and acquire its own. Both then enter the critical section, defeating the exclusive-write guarantee. Use an independently acquired reclamation mutex or another protocol that cannot unlink a replacement lock.

### Residuals below HIGH

- **MEDIUM — `packages/nana-setup/lib/settings.mjs:24-62,81-89` — malformed shell commands can count as working hooks.** For example, `bash /tmp/nana-objective.sh &&` tokenizes with the expected first two argv entries and matches, although the shell rejects the entire command syntactically. Doctor can therefore report a broken hook as installed.

- **MEDIUM — `packages/nana-setup/lib/steps.mjs:451-460` — URL parsing accepts unsupported schemes.** `file://github.com/j-wanger/nana-pi` has the expected hostname/path and returns true, despite not being a documented pi remote spelling, suppressing the required `pi install`.

VERDICT: BLOCK
