# Review — win-hook-variant-loop (on Windows, doctor names each dead hook entry that install leaves as written, and gives its fix by hand), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 7aadbc99..HEAD` on `feat/win-hook-variant-loop` (main was `7aadbc99` when this brief was written; `git
merge-base HEAD main` is `7aadbc99`; the lane branched from main `9552afb1` and merged main `7aadbc99` at `eb6910ed`).
The plan of record is `docs/reviews/win-hook-variant-loop-2026-10-20/must-meet.md`: three must-meet checks, rows R-2410
to R-2412. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` to `build-brief-4.md` are the four builds
(build 1 32cdb9ee, build 2 a20a37ce, builds 3 and 4 27b06dec and 52dd276b, test only). The seat's record is
`seat-verify-efcf664a.md`. CI run 39508216671 on draft pull request #146 at eb6910ed reads 0 failing on all three legs:
macOS 196 PASS, 0 FAIL, 2 SKIP of 198 files (8,044 checks pass, 36 skip); Ubuntu 195 PASS, 0 FAIL, 3 SKIP (7,983 pass,
56 skip); Windows 180 PASS, 0 FAIL, 18 SKIP (6,973 pass, 114 skip). The install check passes on macOS and Windows. The
Windows leg's log is `ci-windows-eb6910ed.log` in this folder. The record also holds the macOS wrong-code pairs
(`seat-mutate.mjs`; 12 of 14 red on eb6910ed, H10 subsumed by build 2's try/catch, H12 able to turn red only on
Windows) and the independent check (`independent-check-efcf664a.md`: HOLDS over nine probes on build 1, 32cdb9ee, no
MUST, four known bugs, all fixed in build 2). Nobody re-ran the independent check on builds 2 to 4. The final
reviewer's brief is `review-brief.md`. The land runs the locked suite on the reviewed tip, and the local macOS install
check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
efcf664a, before the seat's notes commit):

```
tree movement 7aadbc9..efcf664: 3 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2410 new (implemented)
  R-2411 new (implemented)
  R-2412 new (implemented)
```

The code under review: the win32 branch of `hookSettingsRows` in `packages/nana-setup/lib/hook-health.mjs`, which
doctor and the Claude Code session-start stale-copy producer both run. For an unhealthy row in a settings file that
`validateShape` accepts, it runs install's own merge for that row on a `structuredClone` of the settings
(`mergeRepoHooks`, then `mergeHooks` when nothing was found) and appends a hand repair naming the targets left on the
copy outside the checkout, with forward slashes and the whole command install writes; a try/catch keeps the base row
when the simulation throws. settings.mjs, doctor.mjs and the POSIX branch do not change.

Judge whether the lane fails open: doctor naming an entry that install repairs, so the owner deletes a hook install
would have fixed; advice that, followed as printed, leaves the row ✗ or writes an entry Claude Code or install reads
differently (a backslash path, a dropped `hook` argument); the simulation changing the caller's settings object or the
home; doctor or the stale-copy producer throwing or printing fewer rows on any settings file that parses; or a
must-meet check that passes with the change removed. Judge whether it leaves a harm the review standard lists, such as
a broken install, doctor or hook on any platform, or a test writing outside its temp homes. Judge whether anything main
does today stopped working: the row's ✓ or ✗, today's detail text (which doctor-detail's R-393 check matches on the
Windows leg), doctor's last line, the stale-copy notice, the POSIX branch, and all three CI legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: install still
leaves a dead hand-written or look-alike entry, and Claude Code keeps running it until the owner edits it (inferred);
macOS and Linux do not change; an entry run through `node.exe`, or with a backslash script path, is never named and its
row reads ✓ beside the entry install adds; before install, a row with one repaired and one left entry names only the
second while doctor's last line sends it to install; the stale-copy notice names rows, not entries; no check pins that
the caller's settings stay unchanged or that duplicate paths are dropped. The pairs and the independent check ran on
macOS with win32 forced, so CI is the only native Windows run, and H12 has not run there.

Threat model: honest variation in our tools' output and the OS is in scope (owner-edited or older entries: other
quoting, exec form, a custom folder, another timeout or message, a carried home path; any settings file that parses,
deeply nested ones included; forced win32 on macOS and native Windows); deliberate forgery, an entry built to copy
nana's own form, is out.
Lane class: install, hook or gate — doctor's Windows hook settings rows, which the session-start stale-copy producer
also runs.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
