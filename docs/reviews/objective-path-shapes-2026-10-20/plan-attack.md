# objective-path-shapes — plan attack (one adversary)

Verdict: AMEND

AMEND, with small changes. The design holds: one shared resolver, because drift between two copies of the rule is the bug itself. The class is right, and every Mac-side claim reproduced. Probes ran in a temp clone at 72abe19a with made-up temp homes.

Today's main:
- Doctor and `install --dry-run` both throw `TypeError: p.startsWith` at steps.mjs:651 for 5, true, {} and [].
- false and 0 do not throw. They are silently treated as the default, and no row reports them.
- For "", the producer prints `unreadable (<agent dir>)`, while doctor and install use the default file.

Prototype (resolver, one-line wiring and the doctor row):
- Every case passes. Doctor's last line lists `pi objective.path` as a fix by hand.
- objective-golden passed 1280 checks, fresh-machine 9 and objective-injection 69.
- A real install with objective.path 5 printed the same step labels as `{"objective":{}}`. Each install took under 1 s.

Amendments:
1. R-2282 no longer checks five named install labels. It compares the step labels with a baseline home whose config has objective.path absent. doctor-path-row-remedy in this slate may rename the PATH rows, which would break a hard-coded list. The baseline also pins "every step" more truly.
2. R-2281 adds false and [] to the invalid values. false is the case that is silent today and must now get a ✗ row. A new wrong-code item (a row only for truthy values) needs it to turn red.
3. R-2285 and R-2284 use a file named `notes\goal.md`, not OBJECTIVE.md. A file named OBJECTIVE.md could be picked up by the producer's upward search for the project objective file.
4. The brief warns: keep `o.path`, not `o?.path`, in objective.ts. objective-golden's R-2093 check requires a missing settings object to stay an internal error.
5. In-process diagnose must get `projectDir: <neutral temp dir>`. Otherwise it reads the test process's working folder.
6. The plan claimed doctor's "@errors none thrown" header becomes true. That holds only for objective.path: HANDOFF records another doctor crash.
7. A wrong-code item for `home: os.homedir()` in objectiveTarget. The existing R-309 install check catches it.
8. waitFor is none: review-ledger-run-win-launch is already on main (72abe19a).

Subtraction test on the tilde-backslash rule: it adds a platform argument, two rows and a Windows CI round. I kept it because it is one condition, matches pi's own rule on Windows and closes a HANDOFF item. Dropping R-2284 and R-2285 is the fallback if the Windows round is unwanted.
