# Review brief — lane T2b round 2 of 3 (gpt-5.6-sol) — confirm the redesign

Your r1 (`t2b-sol-r1.md`) BLOCKed with 5 HIGH, 3 MED, 1 LOW. Two fix rounds followed: `9bce86e` (`t2b-worker-r2.md`) and `d5b6e86` (`t2b-worker-r3.md`). Worktree `~/nana-pi-wt/t2b`; clean diff vs main `t2b-r3.patch`.

**Seat rulings to judge as rulings:**
- **Your HIGH #2 (count rule) → the role-max formula was SUBTRACTED, not patched.** A round is now one distinct REVISION per item; `--role` is audit metadata only. Rationale: in practice a round is one review pass over a state of the work, so ten reviewers on one commit are one pass and a fix produces the next state. Reviewing one state repeatedly burns budget (governed by `--max-budget-usd`) and earns no rounds.
- **Your HIGH #3 (`--worker`) → the flag was DELETED.** Worker launches go through a new `bin/pi-worker.mjs` that shares the stall watchdog (`bin/pi-watchdog.mjs`, moved unchanged) and never imports the ledger; it refuses `--item`, `--role`, `--revision`, `--over-cap`.
- **Then the worker found the hole in the seat's own count rule and refused to fix it without a ruling** (a dirty tree keeps HEAD's revision, so uncommitted fix-review cycles were uncapped; `launch-sol-review.sh` reviews the working tree). Ruled and implemented: revision = HEAD sha, plus a 16-hex sha256 digest of `git diff HEAD --binary --no-color --no-ext-diff --no-textconv` when dirty.

**A defect the SEAT is raising, which the worker declared — judge its severity and whether the fix below is right:** if `git diff` FAILS (e.g. a diff exceeding the 1 GiB buffer), the tree is treated as CLEAN and the review is admitted. That is a fail-open in the mechanism whose whole purpose is to close fail-opens. The seat's position: a failed diff must refuse, or be treated as a distinct unknown state that cannot be silently reused. Rule on it; it will be fixed in the next round with whatever else you find.

Other fixes to judge: identity normalized (NFKC, trim, casefold, collapse whitespace, reject `/ \ .. ` and controls, ≤128 chars) and scoped by the realpath of the git common dir; a permanent `review-ledger.rounds.jsonl` that is never rotated so rotation no longer resets a cap; `complete()` verifies and consumes its own reservation under the lock; malformed records refuse with a line number; non-regular ledger paths refused; `check` non-mutating; `roundFromOutPath` re-exported so nana-agent-loop's forwarder still links; the trust model documented as a self-governance device, not a security control.

Seat-verified: `npm test` → 69 files, 3266 checks, exit 0.

Judge, ≤40 lines:
1. Each r1 finding FIXED / PARTIAL / NOT FIXED / RULED with the line.
2. The `git diff` fail-open above — severity and correct behaviour.
3. NEW defects from either fix round. Attack the digest specifically: can two different working states produce the same revision, or one state two revisions (line-ending or mode changes, submodules, a diff that is empty but the tree differs, `core.autocrlf`, a file staged vs unstaged)? Attack `pi-worker`: can it be made to admit a review, or can `pi-review` be made to skip the ledger?
4. The worker's own doubts: a `git add`ed new file changes the digest and earns a round (correct or not?); the 12-hour reservation expiry losing a long review's verdict.
5. Your CARRY list for the astra land ruling.
End with `VERDICT: LAND` or `VERDICT: BLOCK`.
