# Review — review-ledger-run-win-launch (review-ledger run starts any reviewer command on Windows, and a command it cannot start ends with one named line), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-007 · Review a specific revision independently (SUB-008 · Run and stop an isolated reviewer)

Review `git diff 95870225..HEAD` on `feat/review-ledger-run-win-launch` (main was `95870225` when this brief was
written; `git merge-base HEAD main` is `95870225`, the pack-config-utf16 land tip, which the lane merged at
`7b996d0a`). The lane branched from main `a112fd30`. The plan of record is
`docs/reviews/review-ledger-run-win-launch-2026-10-20/must-meet.md`: five must-meet checks, rows R-2250 to R-2254;
build 2 added R-2255. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the
two builds (406f3289; 3e90e4d7, tests, rows and README only). The seat's record is `seat-verify-7b996d0a.md`: CI run
39423062782 on draft pull request #129 at 9dc58d5e (build 2 plus the seat's merge of main 1207b69e), 0 failing files on
macOS, Ubuntu and Windows (`ci-windows-9dc58d5e.log` beside it; R-2254 passes on Windows), the macOS wrong-code pairs
(`seat-mutate.mjs`; 17 of 19 red on 6ec2cf0e and 18 of 19 on build 2 3e90e4d7, records `seat-mutate-output-*.txt`; M15
a declared equivalent), and the independent check (`independent-check-7b996d0a.md`: HOLDS, no MUST, run on 6ec2cf0e).
No Windows pairs ran: the Windows-only wrong code rests on the Windows leg's green checks. CI has not run on 7b996d0a;
the land runs the locked suite on the reviewed tip, and the local macOS install check runs before the land.

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

CAP-02 moves from 184 to 190 rows, FEAT-007 from 125 to 131 and SUB-008 from 38 to 44. No existing row's text changed;
R-1723's Windows check gains one condition (--out starts `cannot start pi: pi launch refused:`) and its marker names
R-2250.

The code under review: the new `packages/nana-pack/bin/review-launch.mjs` (`reviewLaunch`: off win32 main's start,
an exact `pi` through `piLaunch` and any other word by name; on win32 a bare pi name in any case or with a PI extension
through `piLaunch`, a path as given with .cmd and .bat through `winCommand`, any other bare word through `findOnPath`
and `winCommand`, or a named refusal), and `packages/nana-pack/bin/review-ledger.mjs` (the resolver in place of its
`piLaunch` branch; a refusal after admission through `cannotStart`, which releases the reservation, writes the
cannot-start line to --out as a best effort and dies; the spawn in a try outside the Promise with `launch.options`; a
throw or the spawn's `error` event through `cannotStart`). `lib/win-command.mjs`, `bin/pi-watchdog.mjs` and
`bin/pi-review.mjs` are unchanged. Tests: the new `packages/nana-pack/tests/review-launch.test.mjs` (R-2250 to R-2255;
R-2254 runs only on Windows, R-2255 only off it) and one condition in `tests/win32-launch.test.mjs`. The pack README's
run paragraph, a new Windows note and example, and the Windows paragraph's last sentence change with it. The rest of
the diff is the plan, the seat's records, the generated code map and tree, HANDOFF and the session entry.

Judge whether review-ledger run now starts every honest Windows spelling of a reviewer the plan names (PI, pi.cmd, an
npm .cmd shim on PATH, a native .exe, a .cmd or .bat path) with its arguments and stdin unchanged; whether every command
it cannot start (an empty word, a typo, a file without the execute bit, a refusal) ends with exit 1, the cannot-start
line on stderr and in --out, no stack trace, and no reservation or round; whether a command that starts and then fails
still reads `no verdict` rather than `cannot start`; whether the --out write can only happen after admission's tracked
--out refusal; whether macOS and Linux start every command exactly as main does; and whether the tests' child
processes stay inside the temp homes and folders they own.

Threat model: honest variation in our tools' output and the OS is in scope (command spellings: PI, pi.cmd, a path, an
npm `.cmd` shim, a native .exe, an empty or unset word, a typo; macOS, Linux and Windows; npm shim layouts; cmd.exe's
quoting); deliberate forgery is out, such as a forged shim. A relative PATH entry is a recorded residual.
Lane class: install, hook or gate — the land and review tools (review-ledger run and the review launch resolver it
uses; pi-review is unchanged).

Check: (1) the must-meet checks are not vacuous: each macOS pair turns its named check red (M2 to M14, M16 to M19), M1
turns R-2255 red, M15 is a true equivalent, R-2254 passes on the Windows leg, and its red half on Windows (W10, W11) is
inferred, not run — judge whether that leaves a must-meet check unproven; (2) no fail-open: a round is recorded only on
exit 0 with review-shaped output, a command that cannot start consumes no round and leaves no reservation, and the
heartbeat cannot outlive a failed start; (3) every route in the resolver matches R-2251 to R-2253, including ComSpec in
any key case and the `cmd.exe /d /v:off /s /c` line's quoting; (4) nothing main does today stopped working: an exact
`pi` and any other command off Windows, a native .exe on Windows, `check` and `report`, the round cap, the
unread-verdict notice and its exit codes, and pi-review; (5) the tests write only inside the temp folders and homes
they own; (6) every README command and path it names runs as written, and the Windows example writes --out outside the
reviewed tree; (7) HANDOFF and the session entry are true, including the rewritten roster, launcher and folder lines,
the two removed output-file lines, the ten new residuals and the seat items from other lanes; (8) any MUST.
