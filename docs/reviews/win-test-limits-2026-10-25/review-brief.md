# Review — win-test-limits (Windows test checks get room to start late, and the two hook files run alone), 2026-10-25 (the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Class: ordinary (test files, one new shared test helper and the run-alone list; no product, install, hook, extension, gate, land or review-tool code changes). Threat model: honest variation in scope (runner speed and load, antivirus scans, a cold Windows `node`, `cmd.exe` or PowerShell start under four jobs, Windows pid reuse); deliberate forgery out (a hand-planted pid file, a forged process command line).

Review `git diff main...HEAD` on `feat/win-test-limits`. Main is cd49d13a (knowledge-freeze-notice, landed). The lane's commits: 31704f18 (plan of record, build brief 1, seat title check), a6f7921c (build 1), dfd599b1 (pairs script), b9c0f892 (macOS pairs record), 0a7e4398 (Windows pairs record), 974ea03a (merge of main after launch-limits-identity), f45980bd (known-bug lines), b01ac2b4 (merge of main after knowledge-freeze-notice, with HANDOFF, session entry and FEAT-003 lines), and the final commit with this brief.

The plan of record is `docs/reviews/win-test-limits-2026-10-25/must-meet.md`, after one adversary pass (`plan-attack.md`; 0 MUST, 6 SHOULD, 9 NOTE; all taken). Each check that failed on a slow Windows start gets a named limit with room for that start, and a forced late start or late release proves it: R-2880 (R-2546's run-record limit), R-2881 (R-1960's release child starts late), R-2882 (R-1242's contend case: a late mark and a late release), R-2883 (a slow CPU sampler first on PATH for one worker-lane launch; the shim moved into a shared helper, `packages/nana-pack/tests/slow-sampler.mjs`, that brief-check and worker-lane import), R-2884 (R-1701's Windows tree case gets its own deadline and a late first level), R-2885 (hook-deadlines and adoption-reader run alone, each with a reason naming its hook limit). GP4 uses a pid no process can hold.

The seat's record:
- Build 1 (the larger builder): R-2880 to R-2885 implemented; its locked full suite 220 PASS, 0 FAIL, 2 SKIP. Departure: four rows hold one "shall" each, because the trace refused the plan's multi-shall wording.
- Wrong-code pairs (`seat-mutate.mjs`, written by a pairs agent and confirmed by a checker agent): 18 of 18 red on macOS at a6f7921c, 0 survived; 13 exactly on their named titles, 5 with an unnamed side red the writer predicted (`seat-mutate-a6f7921c.txt`). Pairs 14 to 16, R-2884's, ran in place on a scratch Windows CI job (run 40214999157, draft pull request since closed): 3 of 3 red (`seat-win-pairs-a6f7921c.txt`).
- CI at a6f7921c passed every leg on the first try. On Windows, worker-lane took 62.2 s (59.4 to 92.9 s on the eight passing legs before); hook-deadlines 30.7 s and adoption-reader 1.9 s, both alone; the suite 1,177 s.
- The second merge conflicted in `packages/nana-knowledge/tests/sources-file.test.mjs`: this lane's `hit()` now returns an object, and knowledge-freeze-notice added a full stop to the UNREADABLE marker. The seat kept this lane's structure with main's marker; the file passes alone (10 PASS, 0 FAIL). Knowledge-freeze-notice's new pull cases in that file spawn the hook command with a 10 s limit outside the file's named 30 s limit; the seat recorded that as a FEAT-003 known bug rather than widening this lane.
- Notes: the plan's known limits are FEAT-031 lines; three flake lines closed (R-2546's two, R-1960's), four narrowed (FEAT-031, FEAT-030, FEAT-014, FEAT-013), late review notes folded (FEAT-003, FEAT-014, FEAT-015, and two launch-limits lines in FEAT-031 while FEAT-013's file is at its size cap). HANDOFF gains one Open line for the guard decision.
- map:check, readme:check, the tree check, the known-bugs check (`names=0 sizes=0`), the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` (0 over, 0 passive) are clean; the frontier check reads 1194 of 1200 words.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement cd49d13..b01ac2b: 6 rows in 1 features
FEAT-031 · Run checks reliably and without contaminating work
  R-2880 new (implemented)
  R-2881 new (implemented)
  R-2882 new (implemented)
  R-2883 new (implemented)
  R-2884 new (implemented)
  R-2885 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: does each widened limit still fail the slow case it is meant to catch, rather than hide a real hang; can the shared slow-sampler helper or the run-alone list change what any other test sees; did the sources-file merge keep both lanes' checks intact; and is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
