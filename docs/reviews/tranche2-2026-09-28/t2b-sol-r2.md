1. **#1 FIXED** — canonical/scoped identity and canonical Git revisions: `review-round.mjs:67-75,118-156`.
2. **#2 RULED** — role-max was correctly removed; distinct revision count: `review-round.mjs:78-86`.
3. **#3 FIXED** — `pi-review --worker` refuses; separate launcher: `review-round.mjs:296-300`, `pi-worker.mjs:21-25`.
4. **#4 FIXED** — permanent tally is independent of rotating audit: `review-round.mjs:50-58,390-396`.
5. **#5 FIXED** — compatibility export restored and blank overrides refused: `review-round.mjs:83-95`.
6. **#6 FIXED** — `complete()` validates/consumes its live reservation under lock: `review-round.mjs:375-398`.
7. **#7 FIXED** — malformed tally records refuse with line number: `review-round.mjs:236-245`.
8. **#8 FIXED** — non-regular ledger paths and symlinks refuse: `review-round.mjs:164-184,278-282`.
9. **#9 FIXED** — `check` projects without reservation/pruning: `review-round.mjs:356-369`.

10. **HIGH — confirmed fail-open:** `diffDigest()` converts every Git failure into “clean” (`review-round.mjs:131-137`).
A failed diff must refuse admission with a diagnostic. Do not invent a reusable clean revision; an “unknown” nonce is inferior because identity is unverified.

11. **HIGH — digest is not a canonical working-state identity.**
Different states collapse: untracked files; CRLF/LF normalized by attributes; mode changes with `core.fileMode=false`; distinct dirty submodule contents (typically only `-dirty`); clean filters; and ultimately a 64-bit-prefix collision.
One state splits: adding an unchanged untracked file changes the digest; changing `diff.noprefix` changed my digest with identical files. Existing tracked content staged versus unstaged produces the same aggregate diff, correctly.
Therefore a `git add`ed new file earning a round is **not correct** under “one working state”: index classification alone changed. Include relevant untracked files and hash a deterministic snapshot, not rendered diff text; retain the full SHA-256.

12. **MED — admission/review TOCTOU:** revision is captured at `308-310`, but completion at `375-398` never verifies the reviewed tree remained that revision. Concurrent edits can record a verdict against the wrong state.

13. **HIGH — `pi-worker` reuses a review-only success predicate.**
`pi-watchdog.mjs:18,98-109` imports ledger code and requires `VERDICT|LAND|FAIL|finding|BLOCKING`; an ordinary successful worker response may be retried three times, repeating mutations, then reported failed. The test’s `VERDICT: LAND` worker masks this.
Parameterize success: worker = exit 0 plus nonempty output; review additionally requires review shape. Move the predicate out of the ledger module.

14. `pi-worker` can intentionally run a review prompt and accept review-shaped output, but records no admission; direct `pi` can too. That is the documented self-governance boundary, not a security defect. I found no path through `pi-review` that skips `admit()`/`complete()`.

15. **MED — 12-hour lease:** a still-live long review is pruned and its verdict lost (`review-round.mjs:250-269`). Use a renewable heartbeat; never expire a demonstrably live, renewing owner.

**CARRY for astra:** fail-closed diff errors; canonical snapshot semantics/full hash; stage-only invariant; submodules/EOL/modes/untracked tests; completion stability check; worker-specific success predicate/no ledger import; renewable reservations; install `pi-worker` symlink and external migrations.

VERDICT: BLOCK
