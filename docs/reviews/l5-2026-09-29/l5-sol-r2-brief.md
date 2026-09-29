# Review brief — lane L5, round 2 (confirm)

You blocked L5 at round 1 with five MUSTs (4/10). Read your own `l5-sol-r1.md`, then the worker's
`l5-worker-r2.md`, then `git log -p 2f0b6e4..HEAD`. Worktree `~/nana-pi-wt/l5`, branch
`lane/l5-directory-adoption`, HEAD `fc537c1`.

## How each MUST was ruled
1. **Forged seat output.** Reject then render: a claimed root is dropped unless absolute, not `/`,
   free of control characters, and still a repo root now; drops are counted in one line. Survivors
   print inside escaped backticks. A future or unparseable timestamp also drops the entry. The
   worker additionally stopped the PRODUCER from journalling an unprintable root, which was not in
   the brief — judge whether that is a correct tightening or a hidden behaviour change.
2. **Journal mismatch.** The adoption event now goes to one place both sides compute identically:
   the user-scope `journal.path` when ABSOLUTE, else `<active agent dir>/nana-journal.jsonl`. A
   project-scope override never captures it, and a relative user-scope path is not honoured for it.
   The worker also made the event follow only user-scope `journal.enabled`. Judge that too.
3. **One store resolver.** The store functions moved into the shared `.mjs`; the extension imports
   them. The seat ruled AGAINST routing the handoff store through `piAgentDir()`: the store is
   deliberately fixed at `~/.pi/agent/handoffs` (U2's NOT-list), so `ACTIVE STORE root still
   reported= true` is expected, not a defect. Confirm the copy is gone, not that the location moved.
4. **Broken journal vs absent journal.** Absent prints nothing; unreadable or non-regular prints
   `ADOPTION UNAVAILABLE`. One existing test asserted the old wrong behaviour and was changed —
   check the change is a correction, not a weakening.
5. **Configured objective filename.** Honoured now. The worker's own most-likely-wrong claim is that
   the filename VALIDATION is still a tested copy of `lib/objective.ts`, because the reader cannot
   import `.ts` without a Node floor. Rule on whether that residual is acceptable at this size.

## Confirm, executed
Re-run your own hostile probe and your edge matrix. Then look for what the fix ROUND introduced:
the printable gate now sits in two places (producer and reader) and the two must not disagree; the
drop-and-count path must not itself become a channel (a count that quotes anything, a message that
grows with the input); and a legitimate repo that is temporarily unreachable must not be dropped
permanently. Confirm `env -u NANA_HANDOFF npm test`.

## Scope
Non-test code is +174 lines across 6 allowlisted files, plus one one-line assertion change in
`packages/nana-setup/tests/project-dismiss.test.mjs`, which is outside the stated allowlist. The
lane as a whole is 11 non-test files against a ceiling of 10 because of the seat's settings
registration. Both are declared; say whether either matters.

## Output
State each of your five MUSTs as FIXED / PARTIAL / OPEN, with the probe output that shows it.
Findings at `file:line`, marked **executed** or **source-read**. End with `SCORE: n/10`, `MUST:`,
`CARRY:` and `VERDICT: LAND|BLOCK`.
