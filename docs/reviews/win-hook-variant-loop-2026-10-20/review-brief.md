# Review — win-hook-variant-loop (on Windows, doctor names each dead hook entry that install leaves as written, and gives its fix by hand), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 7aadbc99..HEAD` on `feat/win-hook-variant-loop` (main was `7aadbc99` when this brief was written; `git
merge-base HEAD main` is `7aadbc99`; the lane branched from main `9552afb1` and merged main `7aadbc99` at `eb6910ed`).
The plan of record is `docs/reviews/win-hook-variant-loop-2026-10-20/must-meet.md`: three must-meet checks, rows R-2410
to R-2412 (from block R-2410 to R-2419). `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` (with the
seat's amendments at its end) to `build-brief-4.md` are the four builds: build 1 32cdb9ee, build 2 a20a37ce (the
independent check's F1 to F4), builds 3 and 4 27b06dec and 52dd276b (test only, for the Windows leg). The seat's record
is `seat-verify-efcf664a.md`. CI run 39508216671 on draft pull request #146 at eb6910ed reads 0 failing on all three
legs: macOS 196 PASS, 0 FAIL, 2 SKIP of 198 files (8,044 checks pass, 36 skip); Ubuntu 195 PASS, 0 FAIL, 3 SKIP (7,983
pass, 56 skip); Windows 180 PASS, 0 FAIL, 18 SKIP (6,973 pass, 114 skip), with win32-hook-repair 14 pass there. The
install check passes on macOS and Windows. The Windows leg's log is `ci-windows-eb6910ed.log` in this folder. Two
earlier Windows runs failed in the test, not the product, and builds 3 and 4 fixed them. The record also holds the
macOS wrong-code pairs (`seat-mutate.mjs`; 10 of 10 red on 32cdb9ee; 12 of 14 red on a20a37ce, 27b06dec and eb6910ed,
with H10 subsumed by build 2's try/catch and H12 able to turn red only on Windows; records
`seat-mutate-output-*.txt`) and the independent check (`independent-check-efcf664a.md`: HOLDS over nine probes on
build 1, 32cdb9ee, no MUST, four known bugs, all fixed in build 2). Nobody re-ran the independent check on builds 2 to
4. The land runs the locked suite on the reviewed tip, and the local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base; run at
efcf664a, before the seat's notes commit):

```
tree movement 7aadbc9..efcf664: 3 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2410 new (implemented)
  R-2411 new (implemented)
  R-2412 new (implemented)
```

CAP-04 moves from 534 to 537 rows and FEAT-015 from 147 to 150. No existing row changed.

The code under review: the win32 branch of `hookSettingsRows` in `packages/nana-setup/lib/hook-health.mjs`, which
doctor and the session-start stale-copy producer both run. When a row is unhealthy and `validateShape(settings)`
returns null, it runs `mergeRepoHooks` for that one row on `structuredClone(settings)`, then `mergeHooks` when nothing
was found, and names the targets still on the copy that do not resolve inside the checkout. It appends `; install
leaves <path>[, <path>] as written — remove that entry by hand, then run nana-setup install; to edit instead, run
<command>` to today's detail, with forward slashes, inside a try/catch that keeps the base row. Tests: three checks in
`packages/nana-setup/tests/win32-hook-repair.test.mjs` (eleven to fourteen). The setup README gains one Known limits
bullet and extends one tests-table line. The rest of the diff is the plan, the seat's records, the generated code map
and tree, HANDOFF and the session entry.

Judge whether, on win32, a ✗ settings row names exactly the entries install leaves (never one install repairs) with
advice that is safe to follow: removing the entry and reinstalling, or pasting the printed command, repairs the row;
whether every settings file that parses still gets all six settings rows with no throw; and whether the row's ✓ or ✗,
the POSIX branch, doctor's last line and the stale-copy notice stay as on main. The declared behaviour change: on
win32, such a ✗ line gains the appended advice.

Threat model: honest variation in our tools' output and the OS is in scope (owner-edited or older entries: other
quoting, exec form, a custom folder, another timeout or message, a carried home path; any settings file that parses,
deeply nested ones included; forced win32 on macOS and native Windows); deliberate forgery, an entry built to copy
nana's own form, is out.
Lane class: install, hook or gate — doctor's Windows hook settings rows, which simulate install's settings merge.

Check: (1) the must-meet checks are not vacuous: R-2410 fails on main and each pair named in the seat's record turns
its check red — judge whether H10 is truly subsumed and whether H12 leaves R-2410's no-backslash promise unproven off
Windows; (2) no fail-open: doctor never names an entry install repairs, never tells the owner to edit an entry into a
form install or Claude Code reads differently, and never stops printing rows; (3) the merge simulation never changes
the caller's settings or the home, and the stale-copy producer's output is unchanged; (4) nothing main does today
stopped working on macOS, Linux or Windows; (5) every README sentence the lane changed is true, including its first
exception, "an entry whose path ends in a backslash", against the plan's "a script path whose last separator is `\`";
(6) HANDOFF and the session entry are true, including the Landed line, the dropped eight-check line, the seven new
residuals and the reworded shared-memory-index-cap lines; (7) any MUST.
