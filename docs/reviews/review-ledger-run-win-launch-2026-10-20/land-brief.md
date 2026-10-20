# Review — review-ledger-run-win-launch (review-ledger run starts any reviewer command on Windows, and a command it cannot start ends with one named line), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-007 · Review a specific revision independently (SUB-008 · Run and stop an isolated reviewer)

Review `git diff 95870225..HEAD` on `feat/review-ledger-run-win-launch` (main was `95870225` when this brief was
written; `git merge-base HEAD main` is `95870225`, the pack-config-utf16 land tip, which the lane merged at
`7b996d0a`). The plan of record is `docs/reviews/review-ledger-run-win-launch-2026-10-20/must-meet.md`: five must-meet
checks, rows R-2250 to R-2254; build 2 added R-2255. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md`
and `build-brief-2.md` are the two builds (406f3289; 3e90e4d7, tests, rows and README only). The seat's record is
`seat-verify-7b996d0a.md`: CI run 39423062782 at 9dc58d5e, 0 failing files on macOS, Ubuntu and Windows
(`ci-windows-9dc58d5e.log` beside it; R-2254 passes on Windows), the macOS wrong-code pairs (`seat-mutate.mjs`; 17 of
19 red on 6ec2cf0e, 18 of 19 on build 2 3e90e4d7, M15 a declared equivalent) and the independent check
(`independent-check-7b996d0a.md`: HOLDS, no MUST, run on 6ec2cf0e). The Windows-only wrong code ran as five pairs on a scratch
Windows CI job: 5 of 5 red (`seat-mutate-win-output-b696bfc8.txt`). The final reviewer's brief is
`review-brief.md`. CI has not run on 7b996d0a; the land runs the locked suite on the reviewed tip, and the local macOS
install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
7b996d0a, before the seat's notes commit):

```
tree movement 9587022..7b996d0: 6 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-2250 new (implemented)
  R-2251 new (implemented)
  R-2252 new (implemented)
  R-2253 new (implemented)
  R-2254 new (implemented)
  R-2255 new (implemented)
```

The code under review: `packages/nana-pack/bin/review-ledger.mjs`, which every hand-run reviewer goes through, and the
new `packages/nana-pack/bin/review-launch.mjs` it now calls to pick a launch. Off Windows the resolver keeps main's
start (an exact `pi` through `piLaunch`, anything else by name). On Windows it sends any spelling of pi through
`piLaunch`, takes a word with a path character as a path (a .cmd or .bat through `winCommand`'s cmd.exe line), looks
any other bare word up along PATH and PATHEXT, and refuses a name it cannot find or an argument cmd.exe cannot carry,
named. A refusal now runs after admission: `cannotStart` releases the reservation, writes `cannot start <word>:
<reason>` to --out as a best effort and exits 1. The spawn moved out of its Promise into a try, and a throw or the
spawn's `error` event goes through `cannotStart`. pi-review, `lib/win-command.mjs` and `bin/pi-watchdog.mjs` are
unchanged.

Judge whether the lane fails open: a round recorded for a command that never started, a failed start that keeps a
reservation or consumes a round, a verdict recorded from output the reviewer did not write, a cannot-start line written
over a tracked --out (admission's tracked-output refusal must run first), or a check that passes with the change
removed (R-2254's red half on Windows was not run; the seat infers it from main's by-name spawn). Judge whether it
leaves a harm the review standard lists, such as a broken review tool on any platform, the ledger's reservation,
round or audit files left inconsistent after a failed start, or a test writing outside its temp folders and temp
homes. Judge whether anything main does today stopped working: an exact `pi` and every other command on macOS and
Linux, a native .exe reviewer on Windows, `check` and `report`, the round cap and `--over-cap`, the unread-verdict
notice and its exit codes, a command that starts and then fails (still `no verdict`), and both CI install-check legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: pi typed
by its path takes no pi launch; pi typed with an extension starts the first pi found; PATH-folder order lets an earlier
.cmd beat a later .exe; a bare name is refused when an earlier folder holds it with another PATHEXT extension such as
.js, where main started a later .exe (the independent check's finding 1); a Store app alias reviewer may go unfound
(inferred); a program in the reviewed tree's own folder no longer starts (inferred); a quoted path word starts directly
(inferred); the lookup runs from the launcher's folder, not --tree; a refused or failed start prints the admission note
first and keeps the over-cap audit line; a .cmd line over 8191 characters ends as no verdict; `claude -p` reading its
brief from stdin is inferred. The pairs and the independent check ran on macOS only, so CI is the only Linux and native
Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (command spellings: PI, pi.cmd, a path, an
npm `.cmd` shim, a native .exe, an empty or unset word, a typo; macOS, Linux and Windows; npm shim layouts); deliberate
forgery is out, such as a forged shim. A relative PATH entry is a recorded residual.
Lane class: install, hook or gate — the land and review tools (review-ledger run and the review launch resolver it
uses; pi-review is unchanged).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
