# Review — win-temp-check (the Windows hard-kill tests stop failing on PowerShell's leftover files), 2026-10-24 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary (test files, REQUIREMENTS.md, notes; no product file, install, hook, gate or land-tool change). Threat model: honest variation in our tools' output and environment in scope (Windows file locks, slow or loaded runners, antivirus scans, PowerShell's own start-up files, process-kill timing); deliberate forgery out.

Review `git diff 122d795e..HEAD` on `feat/win-temp-check`. Main is 122d795e (artifact-flow, landed). The lane's commits: 9a8d55e5 (plan of record), e3ff6827 (build 1), c95f4211 (build brief 2), b4dd8320 (build 2), 2406484c (pairs at b4dd8320, notes), and the final commit with this brief.

The plan of record is `docs/reviews/win-temp-check-2026-10-24/must-meet.md`, after one adversary pass (`plan-attack.md`; 2 MUST, 4 SHOULD, 7 NOTE). The seat took the adversary's simpler fix over the planner's draft (`plan-draft.md`): the killed pi-worker in `hardCase`, both owners of the R-2722 loop and R-2728's alpha starts with `--poll 60`, longer than its 30-second ceiling, so pi-watchdog takes no PowerShell CPU sample before the kill; R-2728's beta keeps `--poll 0.2`. The strict whole-folder check stays. One new row, R-2803: the hard-kill temp check returns every entry left in a case temp folder, sorted, and calls it empty only when none is left; the three hard-kill observations now carry those names. The watcher is unchanged; a kill during a sample can still leave PowerShell's two policy-test files in the user's temp folder, a FEAT-006 line.

The seat's record:
- Build 1's locked full suite: 219 PASS, 0 FAIL, 2 SKIP. The seat sent back the row's wording (wider than its test), two missing red cases and a stale module header; build 2 fixed all four and ran the suite green.
- Wrong-code pairs (`seat-mutate.mjs`): 4 of 5 red at b4dd8320 (`seat-mutate-b4dd8320.txt`); pair 4 is red by a crash, which is its red case. Pair 1, unsorted names, survived because macOS lists the names already sorted; it is a FEAT-006 line.
- CI on the draft pull request at b4dd8320: the Windows suite leg passed first try, with R-2721, R-2722 and R-2728 green; the macOS and Linux suite legs and all four install-check legs passed.
- map:check, readme:check, the trace, the tree check, the known-bugs check and `nana-writing HANDOFF.md` are clean; the frontier check is within budget. The notes also carry the artifact flow lane's late FEAT-039 lines and the owner's readability pause in HANDOFF.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 122d795..2406484: 1 rows in 1 features
FEAT-006 · Launch builders with execution limits
  R-2803 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: does the `--poll 60` start still exercise the hard kill each row names, or does any case now pass without the kill landing while the builder runs; can the stricter observation hide a lane file left behind; and is R-2803's row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
