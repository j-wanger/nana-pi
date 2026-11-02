# Proposed known-bug updates — not applied to the protected feature file

Replace the consecutive-lands sentence within the existing land-reads-ci line with:

Only a conflicting or unsupported merge costs another merge build, CI run and review; an eligible clean merge reuses the accepted tip's CI.

Add these lines:

- Clean merge (land-clean-merge, A7): the merge path re-reads CI once before taking the lock; a run starting after that snapshot is not seen. The fast-forward path still reads once.
- Clean merge (land-clean-merge, A8): lands serialize only when they share a review-ledger home; another home or an external main operation can race the final check and fast-forward.
- Clean merge (land-clean-merge, A9): exposure lasts from land until someone pushes main and its run reports; lands can stack in that window. Only macOS and Windows block; a Linux-only break can leave CI green.
- Clean merge (land-clean-merge, M8): a textually clean merge can break the build; the lane intentionally gives up merge-result CI and review.

The build brief requested edits to docs/known-bugs/FEAT-008.md and docs/sessions/2026-10.md. The standing lane scope forbids both edits. The prepared text stays here for the seat; no issue was created.
