# Review — adoption-window (the adoption report shows a full week of reports and says when its read stops short), 2026-10-25 (the final reviewer)

Feature: FEAT-014 · Create or adopt a project workspace

Class: hook (the adoption producer runs in the Claude Code SessionStart hook; the pack library it reads loads in eight places). Threat model: honest variation in our tools' output and environment in scope (a journal past the cap, a journal of exactly the cap, a torn first line, undated or non-JSON lines, JSON with no ts, an absent journal, a directory in its place, concurrent appends, a cold machine, Windows paths); deliberate forgery out (a hand-forged journal line).

Review `git diff 91444ace..HEAD` on `feat/adoption-window`. Main is 91444ace (artifact-readers, landed). The lane's commits: 40a611f7 (plan of record), d3a75946 (build brief 2), f3927f37 (build 2; build 1 stopped PARTIAL with no commit), 41545a07 (pairs script), be843b81 (build brief 3), 1bf7c6d6 (build 3), 02b4cb6d (pairs at 1bf7c6d6, independent check, notes), 9ebbafbb (merge of main), and the final commit with these briefs.

The plan of record is `docs/reviews/adoption-window-2026-10-25/must-meet.md`, after one adversary pass (`plan-attack.md`; 0 MUST, 9 SHOULD, 4 NOTE; every SHOULD taken; part two, stopping child journal events, dropped because the owner's pick named only the tail and R-076 and the pack README promise the line). The reader reads the journal back up to a sealed 4 MiB cap instead of a fixed 256 KiB tail (R-2850); past the cap with no line older than the 7-day window it ends with exactly one cut line naming the cap and the oldest time read (R-2851); no cut line when the read reaches an older line (R-2852). The producer's 256 KiB tail is unchanged and sealed. `tailLines` keeps its output; its body moved into a private `readTail` in the same module.

The seat's record:
- Build 1 stopped PARTIAL with no commit: its fixtures were quadratic and timed out. Build 2 rebuilt them in linear time (reader test about 4 s); its locked full suite: 220 PASS, 0 FAIL, 2 SKIP. Build 3 closed one test gap; the suite stayed green.
- Wrong-code pairs (`seat-mutate.mjs`, 22 pairs written by a pairs agent): pair 18 survived at f3927f37; 22 of 22 red at 1bf7c6d6 (`seat-mutate-1bf7c6d6.txt`).
- The independent check at f3927f37 (`independent-check-f3927f37.md`): MATERIAL none. On a copy of this machine's real journal, main's reader missed a 6-day-old report and the lane listed it; past the cap the lane printed exactly one cut line; the adoption producer took about 44 ms (64 ms worst) against its 2,500 ms per-producer limit.
- The local macOS install check passed 18 of 18.
- CI: the pull request got no run at f3927f37 (GitHub started none); CI at 1bf7c6d6 and at the reviewed tip runs on the draft pull request.
- map:check, readme:check, the trace, the tree check, the known-bugs check, the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 91444ac..02b4cb6: 3 rows in 1 features
FEAT-014 · Create or adopt a project workspace
  R-2850 new (implemented)
  R-2851 new (implemented)
  R-2852 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: does the reader list every report a week old and print the cut line exactly when the read stops short; can the change slow or break the SessionStart hook, the handoff producer's 24-hour check, or any of the library's other importers; and is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
