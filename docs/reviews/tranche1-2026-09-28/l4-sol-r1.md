## Findings

### MED — [B] Timeout and interrupt handling can orphan processes or hang indefinitely
`scripts/test.mjs:91,102-118`

- POSIX children are detached into their own process groups, but the runner installs no `SIGINT`/`SIGTERM` handler. Ctrl-C terminates the runner while the active child continues; cleanup at `scripts/test.mjs:174-175` is also bypassed.
- Timeout sends one group `SIGKILL` and waits only for `close`. A descendant that creates another process group while retaining stdout/stderr can evade the kill and prevent `close` forever. This exact pipe-holder scenario is documented in `packages/nana-pack/tests/post-edit-hardening.test.mjs:171-176`.
- On Windows, `child.kill("SIGKILL")` kills only the direct child, not its descendants.

Thus the advertised timeout is not reliably bounded and process-tree cleanup is incomplete.

### MED — [A/E] A runnable Windows test is incorrectly skipped
`scripts/test.mjs:70-73`; `packages/nana-pack/tests/post-edit-hardening.test.mjs:76,81-86,118,237`

The runner skips all of `post-edit-hardening.test.mjs` whenever `pgrep` is absent, which normally means every Windows run. But the test itself avoids `pgrep` on Windows (`survivors()` returns immediately), guards POSIX-only cases, and contains Windows-specific assertions. This hides runnable Windows coverage rather than declaring a genuinely unrunnable test. The skip predicate should be POSIX-only.

### LOW — [B] Output text can falsely fail a successful test
`scripts/test.mjs:120,153-160`

Any output line beginning with `FAIL` makes an exit-0 file red. Therefore explanatory output such as `FAIL is a reserved token in this parser` is treated as a failed assertion. A normal crash, signal, or spawn error cannot go green because its exit code is nonzero/null; the false-positive direction is the problem.

### LOW — [B] No-match filtering leaks the runner scratch directory
`scripts/test.mjs:123-127,174-175`

The scratch directory is created before the empty-selection check, then `process.exit(1)` bypasses the only cleanup block.

### LOW — [A] Original contract and worker brief disagree on the allowlist
`README.md:57-64`

The original §L4 contract does not allow a README edit, while the worker brief explicitly does. The worker followed its brief, but the resulting patch is outside the original lane contract’s four-file allowlist. All other allowlist constraints are respected: only `scripts.test` was added, no lifecycle scripts, and the `pi` field is unchanged.

## Other dimension results

- **A:** Otherwise PASS. Discovery is deterministic and filesystem-based; execution is serial via `process.execPath --experimental-strip-types`; each executed file gets fresh `HOME` and `USERPROFILE`; e2e and study fixture copies are not collected; self-test is opt-in.
- **C:** PASS. The regular-file detail no longer contradicts ✓ (`doctor.mjs:51-61`). The absent-file advice is accurate because install seeds the example through `stepRules` (`steps.mjs:53-66`). No other row has the same direct inversion, though hook/soul/PATH failure rows show desired `->` targets rather than actual state (`doctor.mjs:43,46,107`).
- **E:** `doctor-detail.test.mjs` mostly asserts invariants, not implementation strings; only the symlink string is exact as required (`doctor-detail.test.mjs:38-57`).

## Residuals to carry

- The canonical isolated HOME intentionally drops live-machine checks:
  - `ledger-parse` retains substantial fixture coverage; its real DOCTRINE check is optional integration coverage (`ledger-parse.test.mjs:69-78`).
  - `project-key` loses detection of upstream Claude project-key drift (`project-key.test.mjs:47-63`).
  - `pi-registration` loses both live registration validation and its worktree `~/...` case (`pi-registration.test.mjs:142-147,165-179`). The latter is a real code-regression class and should eventually become hermetic.
- **Known bench gap:** there are 13 `apps/bench/test/*.test.mjs`, not ten. Adding their direct test directory does not discover copied tests under study fixtures. Some bench tests read/materialize the pinned study fixture (`apps/bench/test/study-tasks.test.mjs:14-33`), but inspection found no listening ports or model calls; the bench documents zero model calls at `apps/bench/README.md:16,416-418`. Expect added runtime and stub child processes, not spend.

VERDICT: BLOCK
