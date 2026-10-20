# Review — win-lock-fix-command (a leftover install lock prints removal commands that run as printed, and doctor reports the lock), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (R-2084 and R-2085 sit in FEAT-015 · Diagnose the active environment)

Review `git diff 385c633f..HEAD` on `feat/win-lock-fix-command` (main was `385c633f` when the lane branched; `git
merge-base HEAD main` is `385c633f`). Main has since moved to `445f4d5b` (the ci-suite-timeout and knowledge-index-pins
lands), and GitHub reports the lane's draft pull request as conflicting with it; a trial merge conflicts only in the
generated `docs/requirements-tree.md`. So the land needs a merge of main, CI on the merged tip and a confirmation round
on that tip. The plan of record is `docs/reviews/win-lock-fix-command-2026-10-20/must-meet.md`: six must-meet checks,
rows R-2080 to R-2085, with R-322 retired (superseded by R-2080). `plan-attack.md` holds the adversary's AMEND;
`build-brief-1.md` to `build-brief-3.md` are the three builds (build 1's work committed by build 2 at 74606671, then
cdccc250, tests and REQUIREMENTS.md only). The seat's record is `seat-verify-74606671.md`: CI run 39388721628 on draft
pull request #114 at 74606671, 0 failing files on all three legs, with R-2082 and R-2083 passing by title on native
Windows (the Windows suite log `ci-windows-74606671.log` beside it); no CI run yet on build 3; the wrong-code pairs
(`seat-mutate.mjs`; `seat-mutate-output-74606671.txt`, 21 of 23 red, M22 and M23 surviving;
`seat-mutate-output-cdccc250-M22-M23.txt`, both red on build 3's two new R-2084 checks) and the independent check
(`independent-check-74606671.md`: HOLDS over 8 probes, no MUST, run on 74606671; its two known bugs are HANDOFF
residuals, and its open risk closed on the Windows leg). The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 385c633f`, the merge base):

```
tree movement 385c633..bcfb78f: 7 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-322 implemented -> retired
  R-2080 new (implemented)
  R-2081 new (implemented)
  R-2082 new (implemented)
  R-2083 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2084 new (implemented)
  R-2085 new (implemented)
```

CAP-04 moves from 443 to 449 rows, FEAT-013 from 165 to 169 (SUB-014 from 33 to 37) and FEAT-015 from 113 to 115.
R-322 keeps its text and reads `retired`, "superseded by R-2080, 2026-10-20". No other existing row changed.

The code under review: the new `packages/nana-setup/lib/settings-lock.mjs` (`SETTINGS_LOCK_NAME`, `settingsLockPath`,
`lockHolder`, moved from steps, and `removalCommands`: off win32 one `rm` quoted by settings.mjs's `shq`; on win32
`del "<lock>"` and `Remove-Item -LiteralPath '<lock>'` with U+0027, U+2018, U+2019, U+201A and U+201B doubled);
`withSettingsLock` in `packages/nana-setup/lib/steps.mjs`, which picks by `platform()` and prints one `  rm` line off
win32 or four lines on win32, each label on its own line and each command alone on the next; and the `settings lock`
row in `packages/nana-setup/lib/doctor.mjs`, ✓ `no leftover lock` or ✗ with the holder, the live-install caveat and the
commands, labels first and ending on a command, with no install label. Tests: R-2080 in
`packages/nana-setup/tests/settings-merge.test.mjs`, and the new `packages/nana-setup/tests/settings-lock.test.mjs`,
which runs each printed line whole from a sentinel folder through /bin/sh, cmd.exe and Windows PowerShell under the
fixture home ``nana lock 'q' ’ é $x `b` [1]``. The setup README names the forms and the doctor row and adds two known
limits.

Judge whether each printed line, pasted whole into its shell, removes exactly the lock and nothing else, under honest
home names on macOS, Linux and native or forced win32; whether every label sits on its own line, so no whole-line
paste runs a label; whether doctor's row is ✗ exactly while the lock exists, names the lock, its holder and every
command install prints, and keeps the caveat that a running install's lock must not be removed; whether doctor's last
line lists the lock as a fix by hand; and whether install's other behaviour under a lock (exit 2, nothing written, a
dry run unblocked, a lock it did not create never removed) is as on main.

Threat model: honest variation in our tools' output and the OS is in scope (a home path holding a space, a straight or
typographic apostrophe, a non-ASCII letter, `$`, a backtick or square brackets; drive letters and 8.3 names; sh,
Command Prompt and Windows PowerShell; a run killed mid-install; fresh and installed homes; forced win32 on a POSIX
host); deliberate forgery, such as a lock planted as a folder or a link, is out. Lane class: install, hook or gate —
install's settings-lock message and doctor's new row in nana-setup.

Check: (1) the must-meet checks are not vacuous: each fails on main's code or on the wrong code its pair names, and
R-2082 and R-2083 run the printed line on native Windows; (2) no printed line, run whole as printed, deletes or changes
anything but the lock, under any home name in scope; (3) doctor stays read-only, and its row and last line are right on
a fresh and an installed home, native and forced win32; (4) nothing main does today stopped working: install and
`install --dry-run` under a held lock, `uninstall --yes`, doctor's other rows, its `all good` line and exit codes, and
both CI install checks; (5) the tests write only inside the temp folders and temp homes they own, and clean up;
(6) HANDOFF and the session entry are true, including the three edited residuals (install-honest-report's leftover
lock, stale-copies-hooks' leftover-lock example and doctor-fix-line's trust in the dry run) and the lane's new
residuals; (7) any MUST.
