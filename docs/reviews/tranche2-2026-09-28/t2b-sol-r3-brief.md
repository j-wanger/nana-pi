# Review brief — lane T2b round 3 of 3 (gpt-5.6-sol), FINAL. After this the seat lands with residuals or implements; no further sol round.

Your r2 (`t2b-sol-r2.md`) confirmed all nine r1 findings fixed and raised 3 HIGH + 2 MED. Fix commit `4dc67cb` (`t2b-worker-r4.md`). Worktree `~/nana-pi-wt/t2b`; clean diff vs main `t2b-r4.patch`.

Fixes to judge:
- **#13 worker predicate.** Review-shape moved to `bin/review-shape.mjs`; the watchdog imports no ledger or review code (pinned by a test). `pi-worker` succeeds on exit 0 + non-empty output and defaults to `--retries 0`, warning that a retry repeats file changes. Before/after: a stub printing `Implemented the change; edited src/a.ts.` ran 3× then failed; now runs once, exit 0. Note `--retries N` was redefined as re-attempts after the first (`pi-review` default 2 = 3 attempts).
- **#10 fail-open.** Any git error except "not a git repository" now refuses admission with the git error text. Reproduced on a corrupt index: old code recorded the dirty tree as the clean sha.
- **#11 snapshot identity.** No diff is rendered. Revision = bare HEAD sha when clean, else `<HEAD>+snap:<full sha256>` over every path in HEAD's tree, the index, and non-ignored untracked files, in byte order; each path hashed as on-disk mode + sha256 of raw bytes; symlinks hash their target; a submodule contributes its own revision computed the same way; the review's own `--out` is excluded. Every collapse and split case you listed is pinned. 685 files hash in 0.16 s.
- **#12 completion check.** `complete()` recomputes the revision; on mismatch it refuses the verdict (exit 1) but the round still counts against the admitted revision, with `unverified: true` and the new revision recorded. Rationale: a tree edited mid-review was never read in one state, and counting nothing would make mid-review edits a free-review generator.
- **#15 heartbeat.** Renewal every 2 minutes; reclaim only on a dead owner, 10 minutes without renewal, or a future date. No fixed lifetime.

Seat-verified: `npm test` → 69 files, 3303 checks, exit 0.

Judge, ≤35 lines:
1. Each r2 finding FIXED / PARTIAL / NOT FIXED / RULED with the line.
2. **The worker's most-doubted claim, and the one the seat most wants ruled:** "clean = raw bytes match HEAD's tree" deliberately disagrees with `git status` under clean/smudge filters, LFS and `core.autocrlf`, so a fresh checkout on such a repo never reads as clean and costs one round. Is that the right definition for a review-round identity, or should it follow git's own notion of clean? Give the call and the reason.
3. **An operational residual the seat wants your ruling on:** a previous review's output file sitting inside the reviewed tree makes a new state, so writing review outputs into the repo under review would grant unlimited rounds. Our own practice writes outputs to a different working tree, so we are not exposed — but should the tool refuse, warn, or simply document it? (`--out` inside the reviewed tree is detectable.)
4. NEW defects from the snapshot hash, the completion rule, the heartbeat, or the `--retries` redefinition (does the changed meaning silently alter any existing call site's behaviour?).
5. Your final CARRY list for the astra land ruling, each priced by cost of error.
End with `VERDICT: LAND` or `VERDICT: BLOCK`.
