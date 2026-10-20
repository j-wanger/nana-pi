# Seat checks — notify-lifecycle-pins builds 1 and 2, tip b5bcf664 (2026-10-20)

- Builds, by a Claude Sonnet 5 subagent, on a branch from main 1b54211c (the plan commit 31d016cb):
  - Build 1 (`build-brief-1.md`): 537ebf2c. Two new test files, `lifecycle-journal.test.mjs` (R-162 narrowed,
    R-2140) and `notify-dispatch.test.mjs` (R-166 three times, R-173, R-818); R-2141 split off R-162 as violated;
    R-162, R-2140, R-166, R-173 and R-818 flipped to implemented; tree and map regenerated. b88c60b7 then merged main
    54f1271f.
  - CI run 39399669354 on build 1 (b88c60b7; GitHub's merge commit ee5806ec onto its ancestor 54f1271f) failed one
    check on all three legs: product-report's `R-1655: the not-passed heading states the number of rows listed under
    it`, detail `{"headingCount":6,"listedIds":[…six rows…],"violated":6}`. macOS `180 files: 177 PASS, 1 FAIL, 2 SKIP`
    (7,889 pass, 1 fail); Ubuntu 176 PASS, 1 FAIL, 3 SKIP (7,828 pass); Windows 162 PASS, 1 FAIL, 17 SKIP (6,824
    pass, 106 skip). The check's last clause compared the fixture's heading count, 6, with the live ledger's violated
    count. Main had 5 violated rows; this lane's honest R-2141 made it 6, the heading's own number. The product was
    fine; the check depended on the live ledger.
  - Build 2 (`build-brief-2.md`, commit e40fad6e, sent build 1 back): 8b5748c8, `product-report.test.mjs` only. The
    fixture now turns every violated row it copied from the live ledger to untested, forces one row (R-1042)
    violated, and the clause reads `view.model.violated.length === VIOLATED_COUNT && headingCount !==
    VIOLATED_COUNT` with `VIOLATED_COUNT = 1`. The title, the `// req: R-1655` marker and the other clauses are
    unchanged. The builder's second report says a wrong heading that counts violated rows turned R-1655 red.
  - 9fca41ae merged main 54433844 (the handoff-pins land tip); b5bcf664 regenerated the code map after it.
- CI run 39404468320 on draft pull request #119 at b5bcf664 (GitHub's merge commit 00097125 merges b5bcf664 into its
  own ancestor 54433844, so the tree tested is b5bcf664's): macOS `181 files: 179 PASS, 0 FAIL, 2 SKIP` (7,915 checks
  pass); Ubuntu `178 PASS, 0 FAIL, 3 SKIP` (7,854); Windows `164 PASS, 0 FAIL, 17 SKIP` (6,851 pass, 107 skip), its
  skips main's declared ones; install-check passes on macOS and Windows. No failure falls in main's known set.
- The lane's files on each leg: lifecycle-journal 2 pass, notify-dispatch 5 pass, product-report 71 pass on macOS,
  Ubuntu and Windows (`ci-windows-b5bcf664.log` beside this file). notify-fallback reads 28 on macOS and Ubuntu and
  19 pass, 1 skip on Windows, as before; lifecycle-reload 12 everywhere. On Windows all seven new checks print PASS
  by title, so the plan adversary's likeliest wrong claim, that the execFile stand-in and the faked platform work
  on the Windows leg, held: neither file skips there, and a missed stand-in would read 0 calls and FAIL.
- Wrong-code tries: the plan's probes (`must-meet.md`, `plan-attack.md`) turned each of W1 to W18 red in its named
  check, in a temp clone of main 31b95f34; 12 of the 18 left the existing suites green, and five more were red there
  by exit code only. The builder's own tries are in its two reports to the seat, not in this folder; the seat
  re-ran none.
- No seat wrong-code pairs and no independent check: an ordinary lane (tests, a product-report fixture, the rows and
  the map; no extension, lib, install, hook, gate or land-tool code). So no independent-check findings to settle.
- One false comment, found by the seat while writing these notes: `lifecycle-journal.test.mjs` says
  "session_start and session_shutdown are the only two pi 1.0.2 types give a reason on". The installed pi 1.0.2's
  `dist/core/extensions/types.d.ts` gives session_before_compact, session_compact and session_compact_failed a
  `reason: "manual" | "threshold" | "overflow"` too, as `must-meet.md` says. The checks are right; the comment is
  not. Recorded as a HANDOFF residual for the reviewer to weigh; the seat did not edit the test.
- In the worktree after the seat's notes: the trace reads 1,576 rows (1,339 implemented, 193 untested, 6 violated),
  0 off form; map:check reads 344 modules, 0 problems. `requirements-moved --base 54433844` lists six rows in
  FEAT-023: R-162 untested -> implemented with text changed, R-166, R-173 and R-818 untested -> implemented, R-2140
  new (implemented), R-2141 new (violated, as the plan says). Every row the plan flips or adds as tested reads
  implemented.
- Main moved to c7f582ad after this lane's base (mutation-runner-lock-overlap, post-edit-timeout-name and
  pi-launch-followups landed). None touches the notify or lifecycle extensions, the two new tests or product-report.
  All three touch HANDOFF and the session archive; post-edit-timeout-name and pi-launch-followups also add rows, so
  REQUIREMENTS.md, the tree and the map move too. The merge-base stays 54433844, and the lane has not merged c7f582ad.
- Carried to HANDOFF from the plan: R-2141's missing compaction reasons; the Windows toast's app id (inferred, with
  the plan's four owner steps); the checks proving the command line, not what the system shows; notify-fallback's
  R-642 headless check pairing tui with no UI; notify-fallback's prompt checks printing into their own capture. From
  the seat: the false comment above.
- Also in this commit, seat items from other lanes (config-advice-fixes, win-lock-fix-command, handoff-pins,
  mutation-runner-lock-overlap, pi-launch-followups review notes, and the pi-launch-deadline-grace and
  lock-fix-command-polish drops), written against main c7f582ad's HANDOFF; the session entry lists each. Two of
  main's lines differ from this lane's base: the deadline-kill residual (this lane writes main's wording with its
  inferred sentences replaced by the probe, so the merge of main keeps the lane's line) and the
  mutation-runner-lock-overlap landed line (main only; left for the seat's merge). post-edit-timeout-name's two
  independent-check items are already settled on main.
