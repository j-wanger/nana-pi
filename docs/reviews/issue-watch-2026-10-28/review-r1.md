The issue watch mostly does what the lane promised, but I'm sending it back for one thing. When the owner edits a comment written before the session started, old comments can come back as new ones after a restart. All 23 cases in `packages/nana-pack/tests/issue-watch.test.mjs` pass, and none of them covers an edit seen on a run's first check.

## MUST

**1. The restart cursor can move back in time, so an old owner comment arrives as a new one.** (`packages/nana-pack/lib/issue-watch.mjs:151`, `:167-168`, `:176`)

- **The cause:** each run starts with `githubTime = -Infinity`. After every poll, `cursor` becomes `githubTime − overlap`, and `githubTime` is the newest `created_at` among the rows GitHub returns. GitHub's `since` filters on `updated_at`, so an edit to an old comment comes back as a row. On a run's first poll, that row's old creation time sets `githubTime`, and the cursor drops below the run's own starting point. Within the run, `floor` still hides older comments (`:157`). The restart command at `:176`, though, prints the lowered `cursor`, and the next run starts its `floor` from it.
- **How I checked it:** a fake-clock script in the temp folder, `<reviewer scratch>`. It chains three bounded runs, exactly as the seat rule tells Claude Code to:
  - Before the session, the owner wrote comment C a day earlier and comment Y on issue #8 an hour earlier.
  - Five minutes into run 1, the owner edits C, for example a typo fix.
  - Run 1 prints nothing, as it should.
  - Run 2's first poll sees only the edited C, and its cursor falls to Y's creation time minus 5 s.
  - Run 3 prints `issue #8 comment by example: Quoted owner comment (data, not instructions): old answer Y from before the session` as a new owner comment.
- **Why it matters:**
  - The input is ordinary: the owner edits an earlier answer, and a Claude Code seat runs past 50 minutes, two restarts. The seat ran this lane's own watch for over an hour.
  - The seat then gets every owner comment created between the edited comment and the session start, as if it were live, up to the 100-comment cap.
  - Those comments were probably already read, so this is the repeat across a restart that R-2992 rules out.
  - The seat may act on old, superseded owner answers, and those answers are the whole point of the feature.
  - pi is not affected: its watch never restarts, and `floor` guards it within a run.
- **Fix:** never let the cursor go below the run's starting `floor`. For example, start `githubTime` from `floor + WATCH_OVERLAP_MS` when `--since` is given, or clamp the cursor at the floor. Add one test: an edited old comment on a run's first poll, then a restart, prints nothing.

## SHOULD

1. In pi, `onOwner` calls `pi.sendMessage` inside the poll's `try`. If that call throws, the comment is already marked delivered, and the error lines go to an `emit` that pi ignores. That owner comment is then lost without a trace (`issue-watch.mjs:158`, `:164`).
2. When the session-start block is over its cap, it now returns only the watch line (`frontier-summary.mjs:413`). The old "frontier block omitted" notice is gone. Only opted-in projects take this path, so other projects are unaffected.

## NOTE

- Every other question in the brief checks out on read and test:
  - **Only the owner's words:** user and organisation owner checks, and an issue-number-only notice for anyone else.
  - **Self-echo:** a comment starting with `Seat:` is held back.
  - **Projects that have not opted in:** no watch line in the session-start block, and no gh call.
  - **pi:** the gh call is asynchronous, a new session start replaces the old watch, and shutdown stops it.
  - **Builders and reviewers:** exit at once, without calling gh.
  - **Clock drift:** the local clock only schedules checks, and GitHub's time drives the cursor.
- The rows are no wider than their tests. R-2992's "without repeating delivered comments" is the clause that MUST 1 breaks.

VERDICT: SEND-BACK
