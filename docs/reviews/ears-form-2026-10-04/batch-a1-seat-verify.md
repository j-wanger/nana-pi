# EARS batch A1 — seat close of astra r2's mechanical items, 2026-10-04

astra r2 passed the judgement bar (19/20 PINS, no lost or hidden promise) and left three mechanical items. The worker closed them in `611a8bc`. The seat checked:
- Verifier `--base main`: exit 0. The seat replayed astra's seal weakening (`EARS_ALLOWANCE === 157 || true`), and the verifier exited 1 with "non-marker line changed under a test root". The file was restored, and the verifier exited 0 again.
- R-759 now cites `T2c ${label}: label is its own paragraph right before "governing:"`. The worker reports that astra's mutation turns it red for all four fixtures.
- R-783 now adds the two post-edit-file-queue gating checks. The worker reports that `queue(ctx.cwd, …)` turns both red.
Landed by the seat per batch0-land-ruling.md §5. A1 was not "clean" on its first round (3/20 PARTIAL), so A2 and A3 stay separate batches.
