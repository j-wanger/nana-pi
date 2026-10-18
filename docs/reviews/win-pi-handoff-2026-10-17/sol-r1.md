### MUST

- `packages/nana-pack/tests/handoff-store.test.mjs:237` skips dangling-link cases on Windows as “POSIX symlinks.” Windows supports dangling symlinks, and the same CI run passes multiple Windows symlink tests, including `handoff-symlink.test.mjs`. A Windows handoff store containing a dangling entry or directory therefore bypasses ten checks for the required missing-versus-broken behavior. HD1 requires every Windows skip to represent an impossible case, so this evidence is incomplete.

The seven targeted files pass locally on macOS: 419 checks, no failures or skips. Other edits preserve macOS coverage, and the HANDOFF and session claims match the recorded run.

VERDICT: SEND-BACK
