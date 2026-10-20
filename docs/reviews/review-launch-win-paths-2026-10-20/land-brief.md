# Review — review-launch-win-paths (on Windows, review-ledger run refuses a .cmd or .bat reviewer path that names no file in the reviewed tree, and names the path it looked for), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-007 · Review a specific revision independently (SUB-008 · Run and stop an isolated reviewer)

Review `git diff 9552afb1..HEAD` on `feat/review-launch-win-paths` (main was `9552afb1` when this brief was written;
`git merge-base HEAD main` is `9552afb1`). The plan of record is
`docs/reviews/review-launch-win-paths-2026-10-20/must-meet.md`: three must-meet checks, rows R-2430 to R-2432.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (6136c925). The seat's record is
`seat-verify-799872c1.md`. CI on draft pull request #145 runs at 6136c925. CI run 39496386067 at 6136c925 reads 0 failing on all three legs: macOS 192 PASS, 0 FAIL, 2 SKIP of 194 files (8,002 checks pass, 36 skip); Ubuntu 191 PASS, 0 FAIL, 3 SKIP of 194 files (7,941 checks pass, 56 skip); Windows 176 PASS, 0 FAIL, 18 SKIP of 194 files (6,931 checks pass, 114 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-6136c925.log in this folder. The record also holds the macOS
wrong-code pairs (`seat-mutate.mjs`; 8 of 8 red, 0 survived, record `seat-mutate-output-6136c925.txt`) and the
independent check (`independent-check-799872c1.md`: FINDINGS, no MUST, run on 6136c925; its one stale HANDOFF line is
rewritten in the seat's notes commit). The final reviewer's brief is `review-brief.md`. R-2432 runs only on Windows; it
stays `untested` behind its `req-candidate` marker and waits on the Windows leg, and its two Windows-only pairs (W1,
W2) have not run.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
799872c1, before the seat's notes commit):

```
tree movement 9552afb..799872c: 3 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-2430 new (implemented)
  R-2431 new (implemented)
  R-2432 new (untested)
```

The code under review: `packages/nana-pack/bin/review-ledger.mjs`, which every hand-run reviewer goes through, and
`packages/nana-pack/bin/review-launch.mjs`, the resolver it calls to pick a launch. On win32 the resolver now resolves
a `.cmd` or `.bat` path, in any letter case, against the folder it is given and refuses `no file at <resolved>` when
no file is there; a present file still starts through cmd.exe as written. review-ledger now calls the resolver after
admission with the reviewed tree, so a refusal goes through `cannotStart`, which releases the reservation, writes the
cannot-start line to --out as a best effort and exits 1. `lib/win-command.mjs` only exports its existing
`defaultExists`, the resolver's default probe. Off win32 the resolver reads no folder and nothing changes. pi-review is
unchanged.

Judge whether the lane fails open: a round recorded for a command that never started, a refused path that keeps a
reservation or consumes a round, a resolver throw after admission that strands a reservation, a cannot-start line
written over a tracked --out (admission's tracked-output refusal must run first), or a check that passes with the
change removed (R-2432 waits on the Windows leg; its red half there is W1 and W2, not yet run). Judge whether it
leaves a harm the review standard lists. Judge whether anything main does today stopped working: a present `.cmd` or
`.bat` path relative or absolute, a `.exe`, `.com` or extensionless path, pi and every other bare name on Windows,
every command on macOS and Linux, `check` and `report`, the round cap and `--over-cap`, the unread-verdict notice and
its exit codes, a command that starts and then fails (still `no verdict`), and both CI install-check legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: a `.cmd`
removed between the check and the start still ends as no verdict; a bare name's relative PATH entries, pi's included,
now resolve against the reviewed tree, with no row; R-2432 and the Windows pairs wait on the Windows leg; and
review-ledger-run-win-launch's Windows mutation runner anchors on a launch line that no longer exists, so re-running it
would fail to apply. The pairs and the independent check ran on macOS only, with win32 forced or injected, so CI is the
only Linux and native Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (a mistyped reviewer path, an upper-case
extension, a relative path with --tree set to another folder, a folder name with a space, a UNC path; macOS, Linux and
Windows; cmd.exe's quoting); deliberate forgery is out, such as a planted file or one deleted between the check and the
start.
Lane class: install, hook or gate — the land and review tools (review-ledger run and its launch resolver; pi-review is
unchanged).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Seat, after CI (2026-10-20)

The Windows leg of run 39496386067 at 6136c925 printed `PASS Windows: review-ledger run resolves a relative .cmd reviewer path against --tree, …` (log line 4417) (review-launch.test.mjs 8 pass, 1 skip; log `ci-windows-6136c925.log`). The seat flipped R-2432's marker from `req-candidate` to `req:` and its row from untested to implemented; its evidence cell now cites that check; the earlier sentences saying it waits on the Windows leg are superseded. The two Windows-only pairs W1 and W2 still have not run (a carried line).
