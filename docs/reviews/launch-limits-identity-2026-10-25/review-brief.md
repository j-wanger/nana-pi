# Review — launch-limits-identity (the launch-limit test judges each run at once and kills nothing), 2026-10-25 (the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Class: ordinary (one test file changes, plus ledger rows, regenerated docs and notes; no product file, hook, extension, gate or install code changes). The lane touches `packages/nana-setup/`, so the seat runs the local macOS install check before the land. Threat model: honest variation in scope (runner speed and load, process start time, timer delay, antivirus holds, Windows pid reuse within seconds); deliberate forgery out (a process writing a hand-made pid record, or a record naming another fixture's pid on purpose).

Review `git diff 91444ace..HEAD` on `feat/launch-limits-identity`. Main is 91444ace (artifact-readers, landed). The lane's commits: 1325c8a3 (plan of record, build brief 1, seat title check), 6ac0931a (build 1), 24cf8258 (pairs script), 0f0894cd (build brief 2), 3ff880fc (build 2), 30a500be (merge of main), b8d6d001 (pairs at 3ff880fc, notes), a8e6e3c5 (build brief 3), 8580786e (build 3: the six rows moved unchanged to the end of FEAT-013's table), and the final commit with this brief.

The plan of record is `docs/reviews/launch-limits-identity-2026-10-25/must-meet.md`, after one adversary pass (`plan-attack.md`; 2 MUST, 5 SHOULD, 7 NOTE). The seat took the adversary's simpler design: judge each R-2023 run right after it returns with the existing bare-pid probe, and send no failure-path kill anywhere in the file. Rows: R-2890 (alive at the wait's end reads not ended and signals nothing), R-2891 (a first probe at or after the run's deadline, or a record with no start time, reads not ended), R-2892 (a probe error other than ESRCH, or a bad pid or ppid, reads not ended), R-2893 (the source scan admits only the listed kill routes), R-2894 (sealed 6 s start allowance and 1 s self-exit margin, apart from the parent-kill bound), R-2895 (a late child inside the allowance counts as started).

The seat's record:
- Build 1: R-2890 to R-2895 implemented; the builder's locked full suite 220 PASS, 0 FAIL, 2 SKIP. It reported one departure: R-2893's second "shall" became "imports" for the one-shall rule.
- Wrong-code pairs (`seat-mutate.mjs`, 25 pairs written by a pairs agent): at 6ac0931a pair 13 crashed the whole file instead of failing by name; build 2 made a failed bystander reply fail by name. 25 of 25 red at 3ff880fc (`seat-mutate-3ff880fc.txt`), each exactly its named titles.
- Build 3 changed only `REQUIREMENTS.md` and the regenerated outline: the seat checked that the six rows are byte-identical before and after the move. Its suite: 220 PASS, 0 FAIL, 2 SKIP.
- CI was green on the first try at 6ac0931a and at 3ff880fc, the Windows leg included.
- The local macOS install check passed 18 of 18 at 8580786e. Two earlier seat runs failed only the adoption hook step, because the seat set TMPDIR under /tmp and the adoption reader skips roots there; that is recorded for a later lane, not this one.
- The plan's known limits: FEAT-013's known-bug file is at its size cap, so the seat put one line there and kept the other limits in `must-meet.md`'s Known limits section. The notes commit also carries late notes from earlier lanes (FEAT-023, FEAT-028 and FEAT-031 lines).
- map:check, readme:check, the trace, the tree check, the known-bugs check, the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 91444ac..8580786: 6 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-2890 new (implemented)
  R-2891 new (implemented)
  R-2892 new (implemented)
  R-2893 new (implemented)
  R-2894 new (implemented)
  R-2895 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: can the judge ever pass a run whose fixture is still alive, including when a fixture's own self-exit could pass as an end; is there any remaining path in the test file that signals a process it did not start; does the change keep R-2023 one synchronous case inside its case limit on a slow Windows runner; and is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
