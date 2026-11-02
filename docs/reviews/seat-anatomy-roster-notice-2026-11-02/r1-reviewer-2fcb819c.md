No MUST finding stands. The feature works on the real entry order, and the change does not cause any harm the review standard lists.

## What I checked

- **Tip and CI:** CI run 41446871282 ran on 367e45e6 and passed on every leg: suite and install-check on macOS, Linux and Windows. The tip contains `origin/main`.
- **Local tests:** I ran the touched test files at the tip. `anatomy-seat.test.mjs` passed 16/16, `anatomy.test.mjs` 9/9 and `anatomy-labels.test.mjs` 30/30.
- **Tests fail without the feature:** in an OS-temp copy, I swapped in main's `anatomy-seat.mjs`. The tests for R-3682, R-3683 and R-3684, plus the edited R-3640 and R-3643 tests, then failed. I also tried four wrong versions of the code, and each one failed at least one test:
  - Dedupe against any hook success: R-3684 failed.
  - Treat a hook as a producer without its public label: R-3640 failed.
  - Give unresolved entries the roster-notice kind: R-3640, R-3683, R-3684 and R-3643 failed.
  - Count an ambiguity when a window has no producer: R-3643 failed.

## Does it work for its user on the real entry order?

Yes.

- **Same start window:** the commandless entry has no `:startup`/`:compact` suffix, so `boundaryOf` treats it as a start signal. While no closing event has come, it stays in the current window, and `startKind` returning `unknown` does not change that window's start type.
- **Order doesn't matter:** attribution runs after the whole window is collected (`anatomy-seat.mjs:185-210`). The R-3682 test covers the entry arriving both after the last hook and right after the first one, for compact, startup and clear starts.
- **Producer by label:** a hook counts as a producer only when two things hold. Its `command` must equal one of the imported `desiredHooks` SessionStart status labels, and its kind must be in `contextHooks` (`:155-156`). No text, length or `toolUseID` takes part.
- **Matches the hook's contract:** `nana-roster-notice.mjs:59-63` prints `hookSpecificOutput.additionalContext`, which is what the plan relies on.
- **Real-data recount:** in `a4-counts-record.md`, one frozen input gives the same denominators in both runs. The only change is roster-notice going from 0 to 8,145 chars and hook-other from 8,145 to 0. The committed `seat-counts.md` matches the recorded sha256 (`391216e1…`).
  - This also shows the removed adjacency rule was not quietly deduplicating plain-text SessionStart output on real data. If it had been, objective or roster-notice would have moved too.

## Fallback when the producer is missing or ambiguous

It never guesses:

- **No producer:** the entry stays hook-other, with no ambiguity counted.
- **Two or more producer kinds:** the entry stays hook-other and exactly one ambiguity is counted.
- **Failed hooks:** `hook_non_blocking_error` is never added to a window group, so a failed roster hook is not a producer.
- **Foreign hooks:** they resolve to hook-other, so they are not producers either.
- **Closed windows:** an entry after a closing event opens a new `unknown` segment, which has no producer.

## Privacy and builder output

- **No transcript text, owner text or session ids:** the new `seat-counts.md` and the lane folder hold only counts, hashes and labels. The identity scan over the whole repo found nothing, and a grep found no UUID patterns, home paths, user names or segment ids.
- **Tests stay in OS temp:** the tests write only through `tmpDir` there.
- **Builder output unchanged:** the change touches only `SEAT_POLICY` and the seat adapter. The R-3648 builder golden test and `anatomy.test.mjs` pass. `runAnatomy` passes no `policy` key, so the default always applies outside tests.

## Findings

1. **SHOULD:** the nested-envelope dedupe path has no test that tells it apart from the plain one. If I drop `nestedEnvelope` from the key list, all 16 tests still pass. That's because the test's raw JSON also matches through `p.raw.includes(add.raw)`, which only diverges for text that JSON escapes (quotes, newlines). It doesn't matter for real data today, since the roster success's content is empty.
2. **SHOULD:** after re-attribution, the spans are re-segmented under the new kind (`anatomy-seat.mjs:197-198`), but no test checks this. Deleting that line passes everything. Span labels depend on the part name, so a later labelling run could see units marked as `hook-other`.
3. **NOTE:** the R-3643 hook fixture is entirely commandless, so it now checks only that hook-other is kept. Nothing covers the command-bearing branch that still matches by invocation ID (`:199-201`). The R-3643 row still says "correlate by window and invocation".
4. **NOTE:** the regenerated counts are in the lane folder. `docs/reviews/seat-anatomy-2026-11-02/seat-counts.md` still shows hook-other 8,145 and roster-notice 0, and nothing there points to the newer file. Plan A4 named that file as the one to replace. Keeping the old round's record is defensible, but anyone reading that folder sees the old numbers.
5. **NOTE:** this change doesn't touch HANDOFF or the session notes. The land checklist asks for them before the final round, so that's the seat's land step.
6. **NOTE (accepted limitation):** a foreign hook's commandless context in a window that also has a roster producer still counts as roster-notice. The plan's A2 already records this, and on real data it moved nothing.

VERDICT: LAND
