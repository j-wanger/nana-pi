# Review — land-records (every land attempt leaves a record the build report reads), 2026-10-24 (the land reviewer)

Feature: FEAT-008 · Integrate and clean up reviewed changes

Class: land tool (nana-land changes). Threat model: honest variation in our tools' output in scope (two lands of one clone at once; a land killed mid-suite by Ctrl-C, a closed terminal or SIGKILL; a suite killed by signal; `.git/nana` as a file or the ledger as a folder; torn, other-schema or orphan lines; a source tree detached or off `feat/`; a `--main` outside any repository; `--tree` and `--main` in different clones; a run object without times or with a negative span; a re-run attempt; a ledger over its cap; Windows paths and a second spelling of main). Deliberate forgery out (a hand-edited ledger, forged CI times).

Review `git diff 86c628b9..HEAD` on `feat/land-records`. Main is 86c628b9 (win-temp-check, landed). The lane's commits: b7d0bda5 (plan of record), d54146cb (build 1, the lane), 4194eea7 and c354f281 (brief and build 2: a committed suite log removed), 27c8877b (pairs and independent check at c354f281), a6bf2632 and 5912a41b (brief and build 3), 922b3ffb (pairs at 5912a41b), f579f669 (merge of main after win-temp-check; only generated files conflicted, regenerated), 85da83a2 (notes), and the final commit with these briefs.

The plan of record is `docs/reviews/land-records-2026-10-24/must-meet.md`, after one adversary pass (`plan-attack.md`; 2 MUST, 9 SHOULD, 6 NOTE; every MUST and SHOULD taken). The seat's decisions there: a clone store `<git common dir>/nana/land-records.jsonl` beside the build ledger, a start line and an end line per attempt, no lock, no pruning, a 32 MiB bounded read; every recorded field has a reader, so the draft's pid, paths, items, end tip and per-run CI times were cut, after the owner's concern about artifacts with no consumers; two consumers in this lane, the build report's land lines and nana-land's last `[nana-land] land record:` line; no consumer changes a land verdict; no page code; the build ledger's append, bounded read, pairing and format helpers move to `record-ledger.mjs` that both ledgers import, and build 3 moved pi-worker's error-text helper there too; the build report exits 0 when only the land ledger is over its cap; the CI wait counts from each judged run's creation; the end record stays after the CI-records step, a known limit. Rows R-2810 to R-2816 plus one seal; registry entry A-082 and CAP-02 deliverable R-2811.

The seat's record:
- Build 1's locked full suite: 220 PASS, 0 FAIL, 2 SKIP; builds 2 and 3 the same.
- Wrong-code pairs (`seat-mutate.mjs`): 32 of 33 red at c354f281 (`seat-mutate-c354f281.txt`; pair 20, `no lane`, survived and pair 13, a skipped-CI wait, turned only R-2814 red); build 3 added both cases; 33 of 33 red at 5912a41b (`seat-mutate-5912a41b.txt`). The merge of main touched no lane code file.
- The independent check at c354f281 (`independent-check-c354f281.md`): the lane's nana-land run end to end beside main's copy on landed, CI-refused, suite-refused, killed, detached, off-lane and separate-clone attempts; exit codes, merges and every earlier line matched main's byte for byte; each record line matched the build report; the record adds about 34 ms to a land. No MUST. Its SHOULD (a ledger whose last line lacks a newline swallows the next start) and two notes are FEAT-008 and FEAT-006 lines; two notes closed in build 3.
- The tree check prints `deliverables: 20 of 23 made and read by code, 19 parked`. map:check, readme:check, the trace, the known-bugs check and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 86c628b..f579f66: 7 rows in 1 features, 1 capability change(s), 1 artifact change(s)
FEAT-008 · Integrate and clean up reviewed changes
  R-2810 new (implemented)
  R-2811 new (implemented)
  R-2812 new (implemented)
  R-2813 new (implemented)
  R-2814 new (implemented)
  R-2815 new (implemented)
  R-2816 new (implemented)
capabilities:
  CAP-02 · Deliver controlled changes: Deliverables R-1400, R-1008, R-1560, R-977, R-2597 → R-1400, R-1008, R-1560, R-977, R-2597, R-2811
artifacts:
  A-082 new under FEAT-008
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all, as the land reviewer: is this change safe to put on main for every later land? Can the new start and end paths throw past their guards, print `refused:` for a land that merged, change a verdict, an exit code or an earlier line, slow a land materially, run inside the review-ledger lock, or write outside the main clone's git folder?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
