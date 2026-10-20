# Review — doctor-fix-line (doctor's last line names install only for the ✗ rows install would repair), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff bdc65eba..HEAD` on `feat/doctor-fix-line` (main was `bdc65eba` when the lane last merged it; `git
merge-base HEAD main` is `bdc65eba`). The lane branched from main `6bc2f727` and merged main `bdc65eba` at
`b6c5007e` with no conflict. Main has since moved to `cdf4b098` (the review-test-waits land), so the land needs a
merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/doctor-fix-line-2026-10-20/must-meet.md`: M1 to M7, rows R-1990 to R-1996; build 2 added R-1997.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds (87efebe6,
then f44248c7). The seat's record is `seat-verify-b6c5007e.md`: CI run 39373655522 at b6c5007e, 0 failing files on
macOS, Ubuntu and Windows (`ci-windows-b6c5007e.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 15 of 18
red on 87efebe6, 18 of 20 red on f44248c7 with D1 and D3 declared survivors) and the independent check
(`independent-check-87efebe6.md`: HOLDS, no MUST, 13 probes, run on build 1). The final reviewer's brief is
`review-brief.md`. The local macOS install check runs before the land.

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

The code under review: runDoctor in `packages/nana-setup/bin/nana-setup.mjs` now runs install's own dry run when some
row is ✗ and builds its last line from it: install for the ✗ rows the dry run would create or update, by hand for
the rest, install's refusal by its first line, or, for any other dry-run error, a could-not-predict line that falls
back to main's run-install advice. diagnose's `add` in `packages/nana-setup/lib/doctor.mjs` carries an optional
install label on three rows. The new test file is `packages/nana-setup/tests/doctor-fix-line.test.mjs`.

Judge whether the lane fails open: doctor writing to the home it diagnoses, through the dry run or otherwise; the
dry run starting a real `pi install`; a ✗ row reading as `all good` or exit 0; a ✗ row missing from the last line;
or a crash that hides doctor's rows where main printed them. Judge whether it leaves a harm the review standard
lists: data lost or corrupted in an owner's home, a broken install or doctor run, or a test writing outside the temp
folders and temp homes it owns. Judge whether anything main does today stopped working: doctor's rows, its
`all good` and `!`-only lines and its exit codes on macOS, Linux and Windows; `install` and `install --dry-run`; and
both CI install-check legs, whose doctor step reads doctor's output.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: with a
linked Claude folder, the last line sends the refused skills to ✗ lines that say to run install (the independent
check's bug B; main sent them to install); the last line trusts install's prediction, so a leftover settings lock, a
folder saved as a file or a failed `pi install` still gets run install; some ✗ lines name no fix; `PATH resolves
pi-review` is always by hand; the refusal form shows only its first line, and no check pins the relative agent
folder refusal (pair D1); no check has two ✗ rows with one label (pair D3); a doctor run with a ✗ row took 0.54 s
against main's 0.35 s in one probe, the extra `pi --version` the dry run starts.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux, native win32 and forced
win32; fresh, installed and partly installed homes; a foreign folder at a skill path; a linked Claude folder; an
unparseable, unreadable or locked settings file; a relative `PI_CODING_AGENT_DIR`; win32 with the bin folder off the
Path; an unreadable file on the win32 copy path); deliberate forgery, such as a forged plan, label or home, is out.
Lane class: install, hook or gate — doctor in nana-setup.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
