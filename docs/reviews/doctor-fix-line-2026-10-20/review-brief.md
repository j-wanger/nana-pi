# Review — doctor-fix-line (doctor's last line names install only for the ✗ rows install would repair), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff bdc65eba..HEAD` on `feat/doctor-fix-line` (main was `bdc65eba` when the lane last merged it; `git
merge-base HEAD main` is `bdc65eba`). The lane branched from main `6bc2f727` and merged main `bdc65eba`, the
mutation-runner-win-lock land, at `b6c5007e` with no conflict. Main has since moved to `cdf4b098` (the
review-test-waits land), so the land needs a merge of main and a confirmation round on the merged tip. The plan of
record is `docs/reviews/doctor-fix-line-2026-10-20/must-meet.md`: seven must-meet checks M1 to M7, rows R-1990 to
R-1996 from the block R-1990 to R-1999; build 2 added R-1997. `plan-attack.md` holds the adversary's AMEND;
`build-brief-1.md` and `build-brief-2.md` are the two builds (87efebe6, then f44248c7). The seat's record is
`seat-verify-b6c5007e.md`: CI run 39373655522 on draft pull request #102 at b6c5007e, 0 failing files on all three
legs (the Windows suite log `ci-windows-b6c5007e.log` beside it), the wrong-code pairs (`seat-mutate.mjs`;
`seat-mutate-output-87efebe6.txt`, 15 of 18 red; `seat-mutate-output-f44248c.txt`, 18 of 20 red, D1 and D3 declared
survivors) and the independent check (`independent-check-87efebe6.md`: HOLDS, no MUST, 13 probes, run on build 1;
its known bug A is fixed in build 2 with R-1997, and its known bug B is a HANDOFF residual). The local macOS install
check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base bdc65eba`, the merge base):

```
tree movement bdc65eb..b6c5007: 8 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-1990 new (implemented)
  R-1991 new (implemented)
  R-1992 new (implemented)
  R-1993 new (implemented)
  R-1994 new (implemented)
  R-1995 new (implemented)
  R-1996 new (implemented)
  R-1997 new (implemented)
```

CAP-04 moves from 416 to 424 rows and FEAT-015 from 96 to 104. No existing row changed.

The code under review: runDoctor in `packages/nana-setup/bin/nana-setup.mjs` and its header. Only when some row is
✗, it calls `refuseCwdRelativePiHome(layout, "this install")` and `install(layout, { dryRun: true })`; a ✗ row is
install's when a dry-run row labelled `row.installLabel ?? row.label` reads created or updated. The last line takes
one of five forms: all install's (main's line, byte for byte), all by hand, mixed, a SetupError refusal (its first
line), and, since build 2, `could not predict nana-setup install repairs (<code>) — <n> missing — run: nana-setup
install` for any other dry-run error. Each keeps main's ` (and see the <w> ! above)` suffix. In
`packages/nana-setup/lib/doctor.mjs`, diagnose's `add` takes an optional install label, and three rows pass one: the
private rule, the shared memory index and the pi objective file. Tests: the new
`packages/nana-setup/tests/doctor-fix-line.test.mjs`, with R-1997's check throwing EACCES on forced win32 through a
Node preload. The setup README gains one paragraph and a tests-table row.

Judge whether the last line gives install exactly the ✗ rows its dry run would create or update, and lists every
other ✗ row once, by label, in row order; whether a refusal is named by its first line and any other dry-run error
falls back without a stack; whether doctor stays read-only, the dry run writing nothing on any platform; and whether
every row, the `all good` line, the `!`-only line and every exit code are as on main.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux, native win32 and forced
win32; fresh, installed and partly installed homes; a foreign folder at a skill path; a linked Claude folder; an
unparseable, unreadable or locked settings file; a relative `PI_CODING_AGENT_DIR`; win32 with the bin folder off the
Path; an unreadable file on the win32 copy path); deliberate forgery, such as a forged plan, label or home, is out.
Lane class: install, hook or gate — doctor in nana-setup.

Check: (1) the must-meet checks and R-1997 are not vacuous: each fails on main's code or on the wrong code its pair
names; (2) doctor writes nothing: under every form, forced win32 included, the dry run leaves every file, folder and
link unchanged and starts no `pi install`; (3) the label join: the three install labels match install's own row
labels, and no other ✗ row is wrongly given to install or wrongly listed by hand; (4) nothing main does today stopped
working: every row, the `all good` and `!`-only lines, the exit codes, `install --dry-run` and both CI install checks;
(5) the tests write only inside the temp folders and temp homes they own, and clean up; (6) HANDOFF and the session
entry are true, including the two edited residuals (doctor's skill advice and the bin folder off the Path), the lane's
new residuals and the other lanes' items; (7) any MUST.
