# Review — win-lock-fix-command (a leftover install lock prints removal commands that run as printed, and doctor reports the lock), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (R-2084 and R-2085 sit in FEAT-015 · Diagnose the active environment)

Review `git diff 385c633f..HEAD` on `feat/win-lock-fix-command` (main was `385c633f` when the lane branched; `git
merge-base HEAD main` is `385c633f`). Main has since moved to `445f4d5b` (the ci-suite-timeout and knowledge-index-pins
lands); a trial merge conflicts only in the generated `docs/requirements-tree.md`, so the land needs a merge of main,
CI on the merged tip and a confirmation round. The plan of record is
`docs/reviews/win-lock-fix-command-2026-10-20/must-meet.md`: six must-meet checks, rows R-2080 to R-2085, with R-322
retired. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` to `build-brief-3.md` are the three builds
(74606671, then cdccc250, tests and REQUIREMENTS.md only). The seat's record is `seat-verify-74606671.md`: CI run
39388721628 at 74606671, 0 failing files on macOS, Ubuntu and Windows, with cmd.exe and Windows PowerShell running
the printed lines natively (`ci-windows-74606671.log` beside it); no CI run yet on build 3; the wrong-code pairs
(`seat-mutate.mjs`; 21 of 23 red on 74606671, then M22 and M23 red on cdccc250) and the independent check
(`independent-check-74606671.md`: HOLDS over 8 probes, no MUST, run on 74606671). The final reviewer's brief is
`review-brief.md`. The local macOS install check runs before the land.

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

The code under review: the new `packages/nana-setup/lib/settings-lock.mjs`, which names the lock, reads its holder and
renders its removal commands (one sh `rm` off win32; a Command Prompt `del` and a PowerShell
`Remove-Item -LiteralPath` on win32); `withSettingsLock` in `packages/nana-setup/lib/steps.mjs`, whose refusal now
prints those commands, each alone on its line under a label line; and the new `settings lock` row in
`packages/nana-setup/lib/doctor.mjs`, ✗ while the lock exists, with no install label. The new test file is
`packages/nana-setup/tests/settings-lock.test.mjs`; R-2080 sits in `settings-merge.test.mjs`.

Judge whether the lane fails open: a printed line that, pasted whole, deletes or changes anything but the lock, or
leaves the lock while reading as done; a label line that runs as a command; doctor reading ✓ or `all good` while a
lock exists, or a lock row missing from its last line; doctor telling the user a running install's lock is safe to
remove. Judge whether it leaves a harm the review standard lists: data lost or corrupted in an owner's home, a broken
install or doctor run, or a test writing outside the temp folders and temp homes it owns. Judge whether anything main
does today stopped working: install under a held lock (exit 2, nothing written), `install --dry-run` under a lock,
a lock install did not create never removed, `uninstall --yes`, doctor's other rows, its `all good` line and its
exit codes on macOS, Linux and Windows, and both CI install-check legs, whose doctor step reads doctor's output.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: Command
Prompt expands a defined `%NAME%` inside double quotes, so that line breaks there (the PowerShell line still works);
Git Bash and Claude Code's Bash tool on Windows get no form of their own; doctor marks a running install's lock ✗; a
hidden or read-only lock defeats both Windows lines, and a lock left as a folder defeats `rm` and `del`; doctor's ✗
text says install will not run, while `install --dry-run` still runs under a lock (the independent check's wording
bug); the stored product-report assessments still list the retired R-322 as untested; the PowerShell line's
typographic-quote doubling has no wrong-code run on Windows; nobody re-ran the independent check on build 3.

Threat model: honest variation in our tools' output and the OS is in scope (a home path holding a space, a straight or
typographic apostrophe, a non-ASCII letter, `$`, a backtick or square brackets; drive letters and 8.3 names; sh,
Command Prompt and Windows PowerShell; a run killed mid-install; fresh and installed homes; forced win32 on a POSIX
host); deliberate forgery, such as a lock planted as a folder or a link, is out. Lane class: install, hook or gate —
install's settings-lock message and doctor's new row in nana-setup.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
