I found no MUST: the seat gets its ranked private bundle beside the shared index, and I found none of the harms the review standard lists. The tip's CI was still running when I checked PR #312; `nana-land` will wait for it.

## What I checked

- **The hook can't fail or overrun.**
  - The installed entry's timeout is 5 s (`packages/nana-setup/lib/settings.mjs:198`). The push stops at the shared 4,000 ms deadline, counted from process start.
  - Each git call is capped at the smaller of 1,000 ms and the time left. A timeout becomes the `deadline` reason.
  - All push work runs inside `try` blocks, and the index is built before any push work starts.
  - The new static imports (`memory-render.mjs`, and `hook-producer.mjs` with its config files) all live in the checkout. No install step copies the hook out of the checkout: there are no copy calls in `nana-setup/lib`. The only exposure is a hook run without the pack beside it, which is already a known bug.
- **Every no-push case prints main's bytes.**
  - I compared the moved `renderMemoryIndex` with main's inline code, with the budget name made the same. They are identical, and `HEADER` and `FOLD_LINE` are identical too.
  - Every skip path returns that output unchanged: role, CI, pointer, marker, disabled, worktree, repository, deadline, unavailable and budget. The unchanged shared-memory budget, hook and input tests pass: 7, 43 and 3 cases.
  - The store-error path shrinks the index's budget by the note's length, so the total stays at most 9,000.
- **No record text leaks.**
  - The load line carries only fixed reasons, counts and 12-hex ids. Git's stderr is captured, not passed through.
  - I ran the real hook on a synthetic store in the OS temp folder, from the repo root, a subdirectory, a symlinked cwd, a repository not enabled for making and a non-git folder. Every run exited 0 with empty stderr, in 77 to 141 ms. No canary claim or quote reached the log or any repository file.
  - Builders get nothing: `pi-worker` sets `NANA_ROLE`, Claude children load only project and local settings, and the repo has no project `.claude`.
  - A subdirectory cwd works: git returns a relative common dir such as `../.git`, which the probe resolves against the cwd.
- **The moved helpers leave their callers unchanged.**
  - `resolveMemoryRepository` keeps the same root selection and the same errors.
  - No existing caller passes a third argument to the `profileGit` runner, and the new timeout is capped at `PROFILE_GIT_TIMEOUT_MS`.
- **Real stores match what the tests assume.** Records written by `mergeMemory` do carry `repository` (`STORE_FIELDS`), and saved profile records carry `source: saved`. Profile saves and the maker's cut both use the UTC day.
- **Tests.**
  - All six touched test files pass locally.
  - B1 to B7 each map to rows R-3412 to R-3421.
  - The seat's 12 wrong-code pairs ran at 59bdc64e and all went red. The only package changes since then are a comment and the requirements-tree heading count (76 to 77).

## SHOULD / NOTE

1. **NOTE — no profile outside git.** A session started outside any git repository, such as the home folder, gets no push at all, profile included; the load log reason is `repository`. The README's "the profile still loads elsewhere" reads broader than that. The index output is unchanged, so this is a scope gap, not a harm.
2. **NOTE — `nana-memory.mjs` error order.** `runMemory` now reads `nana-pack.json` before resolving the repository's root commits. When both are broken at once, it reports `memory: invalid command` where it used to say `memory: unavailable` or the git error.
3. **NOTE — B3's comparison.** B3 compares each skip's output with the lane hook's own `NANA_ROLE=worker` run, not with main's hook. Parity with main rests on the unchanged budget and hook tests plus the identical moved code, which I confirmed by hand.
4. **NOTE — duplicate known bug.** The attack-N2 line (a reworded re-extraction of a retracted claim returns) now appears in both `docs/known-bugs/FEAT-040.md` and `docs/known-bugs/FEAT-044.md`.
5. **NOTE — README claim about the outcome meter.** The meter (`outcome-meter.mjs:118`) only accepts load lines that have `parts`. The shared-memory hook's line has never had `parts`, so the meter doesn't read it. That predates this lane, but the pack README now says "the seat line covers the shared-memory hook's index and push", which goes further than the meter supports.
6. **NOTE — store read has no deadline.** `readMemoryStore` reads every file before the deadline is checked. With today's roughly 20 records it is fast; a much larger store could take longer. The 1 s gap between the 4 s deadline and the 5 s timeout absorbs it for now.

VERDICT: LAND
