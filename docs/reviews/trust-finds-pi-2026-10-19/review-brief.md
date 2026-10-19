# Review — trust-finds-pi (the trust command names a missing pi trust store in one line, not a stack trace), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-009 · Decide which project content is trusted

Review `git diff 22ccd849..HEAD` on `feat/trust-finds-pi` (the lane left main at `22ccd849`; `git merge-base HEAD
main` is `22ccd849`; main has since moved to `cb1a5b57`, which this diff does not include). The plan of record is
`docs/reviews/trust-finds-pi-2026-10-19/must-meet.md` (rows R-1800–R-1801), with the adversary's `plan-attack.md`
beside it. The seat's record `seat-verify-0c08bcd.md` holds CI, the Windows log beside it.

Tree movement (`requirements-moved.mjs --root . --base main`):

```
tree movement 22ccd84..0c08bcd: 2 rows in 1 features
FEAT-009 · Decide which project content is trusted
  R-1800 new (implemented)
  R-1801 new (implemented)
```

Judge whether `nana-setup trust <dir>`, when npm's global folder holds no pi trust module or one with no
`ProjectTrustStore`, exits 2 with exactly one stderr line naming the module path and the pi install command, and writes
no trust store; whether a found pi still records trust as before; and whether the tests write only inside the temp
folders they own.

Threat model: honest variation in our tools' output and the OS in scope: no pi under npm's global folder, a pi from
another package manager, a pi release that moved its trust module, a module without the export, an ambient npm prefix
variable in any letter case, and macOS, Linux and Windows. Deliberate forgery of pi's package is out. Lane class:
ordinary — the trust command, its test file and one setup README paragraph; install, uninstall, doctor, hooks, pi
extensions, the gate and the land and review tools are untouched.

Check: (1) the two must-meet checks are not vacuous: each fails on main's CLI, and R-1801's planted module sits where
the product looks; (2) the found-pi path, held by the existing R-670, R-671, R-672 and R-313 checks, behaves as before;
(3) no test writes outside the temp folders it owns: R-1801's check writes its stand-in module at the path npm reports
for the test's prefix, with no check that the path lies under the test root (the seat's note, inferred, not probed);
(4) the refusal line carries no stack, no multi-line message and never "undefined"; (5) the README sentences and the
CLI header's `@errors` match the behavior and name no pi-internal file path; (6) nothing else changed — REQUIREMENTS.md,
the tree and the code map change only by the two rows and their regenerated lines; (7) HANDOFF and the session entry
are true; (8) any MUST.

Build 2 (after this brief was first written): commit bdb6a204 adds the inside-temp-root guard to the two new checks (see the seat record). Judge it with check (1): the guard must fail a check, never skip it, and must stop the R-1801 write.
