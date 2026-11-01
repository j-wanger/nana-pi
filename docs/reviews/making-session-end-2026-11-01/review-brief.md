Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Threat model: honest variation in our tools' output is in scope (Claude Code hook input shapes, slow node starts, stdin held open or closed early, a missing or stale tracking ref, a busy clone lock, failed pushes, moved checkouts); deliberate forgery, such as forged hook input, a planted transcript, a hand-edited settings entry or a hand-moved tracking ref, is out.

Review `git diff origin/main...HEAD` on `feat/making-session-end`. The plan of record is `plan.md` in this folder, revised after `plan-attack.md`; `build-brief-1.md`, `build-report.md` and `build-brief-2.md` (a merge of main) record the builds. `independent-check-72d2f5d2.md` is the lane's independent check. The 2026-11-01 entry "memory is also made at the end of each seat session" in `docs/sessions/2026-10.md` summarises the lane.

The change: the Claude Code SessionEnd hook `packages/nana-setup/claude/hooks/nana-memory-end.mjs` and its settings row; tracking-ref update and push-result reading in the profile sync; the empty-run skip in memory-run; doctor's local last-run note. R-3350 to R-3362.

Seat record: locked full suite after the merge read 255 files, 253 pass, 2 skip; the lane's mutation runner read 24 of 24 red; CI passed on all three systems at build 1; the local install check fails only on the known `pi post-edit` write-error.

Question: does the feature work for its user, the seat whose memory should be made at every session end without slowing or breaking the exit, and does the change cause a harm the review standard lists? Check especially that the hook never blocks or fails a Claude Code exit within its limit on macOS and Windows; that it starts nothing for a repository not enabled; that no owner text reaches stdout, stderr, the repository or a log; that a push failure is read and status counts truly; and that install, uninstall and doctor treat the new row like the existing hooks.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
