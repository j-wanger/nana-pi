Feature: FEAT-008 · Land reviewed work safely
Card: fix
Serves: roadmap step 1 (finish the CI lanes): a Windows race that turned main red.

# Review brief 1: ledger-lock-win

Main's Windows run 42524912909 failed review-ledger "race2" with EPERM opening `review-ledger.lock`: `withLock` in `packages/nana-pack/bin/review-round.mjs` retried only EEXIST. Review `git diff main...HEAD`. The fix retries the codes the shared rename retry uses (EPERM, EBUSY, EACCES) within the existing wait limit, names the last code on timeout, and leaves other codes throwing at once. The seat merged current main (the ci-packs land) into the lane before this round.

Questions: does a lock held by a live process still block, and a stale one still clear? Can the retry mask a real permission problem for longer than the wait limit? Is each new test in the right pack? Threat model: honest Windows file-system timing; forgery out.
