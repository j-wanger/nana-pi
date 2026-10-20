# Review — notify-lifecycle-pins (tests pin the pi seat's system notices and its session journal lines), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-023 · Inspect changes and receive useful notices

Review `git diff 54433844..HEAD` on `feat/notify-lifecycle-pins` (`git merge-base HEAD main` is `54433844`; main has
since moved to `c7f582ad` with the mutation-runner-lock-overlap, post-edit-timeout-name and pi-launch-followups lands,
which this lane has not merged). The plan of record is `docs/reviews/notify-lifecycle-pins-2026-10-20/must-meet.md`
with the adversary's `plan-attack.md`: four existing rows, R-162 (narrowed), R-166, R-173 and R-818, and two new rows,
R-2140 and R-2141 (R-2141 recorded violated with no test). The builds are `build-brief-1.md` and `build-brief-2.md`.
The seat's record `seat-verify-b5bcf664.md` holds CI, with the Windows log `ci-windows-b5bcf664.log` beside it.

Tree movement (`requirements-moved --base 54433844`): 6 rows in 1 feature, 2 added.

```
tree movement 5443384..b5bcf66: 6 rows in 1 features
FEAT-023 · Inspect changes and receive useful notices
  R-162 untested -> implemented; text changed
  R-166 untested -> implemented
  R-173 untested -> implemented
  R-818 untested -> implemented
  R-2140 new (implemented)
  R-2141 new (violated)
```

Judge whether each of the seven new checks fails when its row's promise breaks, on macOS, Linux and Windows, with no
real notifier started; whether narrowing R-162 and splitting R-2141 off as violated states the code honestly rather
than hiding a defect; and whether the product-report fixture change keeps R-1655's check honest without weakening it.

Threat model: honest variation in our tools' output and the OS in scope (macOS, Linux and Windows on Node 22; pi's
tui, rpc, print and json modes as pi 1.0.2 binds them; `notify.headless` absent, false or true; a notifier that
succeeds or fails; the live ledger's violated count moving as honest lanes split rows); deliberate forgery out. Lane
class: ordinary — two new test files, one product-report fixture change, the rows, the tree and the map; no
extension, lib, install, hook, gate or land-tool code.

Check: (1) each must-meet check matches its row and is not vacuous (each title's assertions fail under the wrong
versions W1 to W18 that `must-meet.md` names); (2) notify-dispatch never starts a real `osascript` or
`powershell.exe`, and restores `execFile` (re-synced), `process.platform` and `process.stdout.write` in a finally,
with stdout restored before any `check()`; (3) the UI cases cover both tui and rpc, and the no-UI cases keep a `ui`
object, as pi 1.0.2 binds a no-op UI in print and json mode; (4) R-162's new text and R-2140 together promise what
nana-lifecycle does, and R-2141's violated evidence is true of `extensions/nana-lifecycle.ts` and pi 1.0.2's types;
(5) the product-report change touches only the fixture's copied ledger, keeps the R-1655 title, marker and other
clauses, and still fails on a heading that counts violated rows instead of listed rows, whatever the live ledger's
violated count; (6) R-166, R-173 and R-818 keep their text and cite only the new checks; (7) no test writes outside
the temp folders it owns, and HOME, USERPROFILE and `PI_CODING_AGENT_DIR` are handled as the plan says; (8) nothing
else changed (no extension, lib or script code); (9) HANDOFF and the session entry are true, including the seat
items from other lanes, which the seat wrote against main `c7f582ad`'s HANDOFF and those lanes' review folders on main
(the deadline-kill residual carries main's wording with its inferred sentences replaced by the dropped
pi-launch-deadline-grace lane's probe); (10) the seat's one finding: a comment in `lifecycle-journal.test.mjs` says
only session_start and session_shutdown carry a reason in pi 1.0.2's types, while those types give the three
compaction events one too — the seat recorded it as a residual; (11) any MUST.

## Base note (the seat, after this brief was written)

Since `179a320d`, the seat merged main `c7f582ad` (the pi-launch-followups land tip) into the lane at `6bd03b29`. Review this lane's own change as `git diff main...HEAD` (three dots: against the merge base). In the merge the seat kept this lane's reworded deadline-grace residual ("probed") and dropped main's older copy of the same line.
