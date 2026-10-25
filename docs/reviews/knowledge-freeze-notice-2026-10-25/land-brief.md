# Review — knowledge-freeze-notice (every knowledge pull says when a broken sources file freezes the index, and doctor shows the file and the index age), 2026-10-25 (the land reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources (the artifact assessment proposed FEAT-004; the plan chose FEAT-003, where R-2370 to R-2374 live)

Class: hook (the Claude Code knowledge hook and pi's knowledge extension print the notice; doctor gains a row). Threat model: honest variation in our tools' output and environment in scope (a sources.json that does not parse, cannot be read, is empty, is a folder, holds a byte-order mark or CRLF, is absent or has the wrong shape; a damaged or missing index; reviewer and worker roles; bad hook input; a pull past its budget; Windows paths); deliberate forgery out.

Review `git diff 91444ace..HEAD` on `feat/knowledge-freeze-notice`. Main is 91444ace (artifact-readers, landed). The lane's commits: 906a6901 (plan of record), 9ceaad8a (build 1), 82391398 (pairs script), 3b2f555a (build brief 2), 1a9d7692 (build 2), 1c785226 (build brief 3), 793b0494 (build 3), dc7563bd (pairs at 793b0494, independent check, notes), ed41e1c8 (merge of main), and the final commit with these briefs.

The plan of record is `docs/reviews/knowledge-freeze-notice-2026-10-25/must-meet.md`, after one adversary pass (`plan-attack.md`; 1 MUST, 5 SHOULD, 10 NOTE; every MUST and SHOULD taken; the MUST was that the sealed clause named a command on no PATH). While sources.json is broken or unreadable, every eligible pull prints one notice first: the marker and a sealed clause naming the user and no command (R-2860); a good or absent file prints none, and the pull's own read never writes the file (R-2861); doctor gains a knowledge sources row with a node-path rescan command (R-2862); doctor's index row shows the build age (R-2863). R-217 and R-225 gained an exception clause. built_at keeps advancing on a failed parse (R-2408).

The seat's record:
- Build 1's locked full suite: 220 PASS, 0 FAIL, 2 SKIP. Build 2 closed five test gaps the pairs found and added a full stop to the UNREADABLE notice. Build 3 fixed R-2862's Windows-only failure: the fixture quoted `C:\Users`, and on Windows the detail starts with the real temp path under `C:\Users`.
- Wrong-code pairs (`seat-mutate.mjs`, 40 pairs written by a pairs agent): five survived or went red only by other rows at 9ceaad8a; 40 of 40 red at 793b0494 (`seat-mutate-793b0494.txt`), pairs 14 and 31 red by the throw that is their red case.
- The independent check at 9ceaad8a (`independent-check-9ceaad8a.md`): MATERIAL none. The notice printed for five kinds of broken file and never for good, absent, reviewer, worker, bad-input or skipped pulls; no pull or doctor run wrote sources.json; pull median 78.8 ms broken against 78.0 ms good.
- The local macOS install check passed 18 of 18.
- CI: 9ceaad8a failed R-2862 on Windows (the fixture bug); 793b0494 passed Windows, and its macOS leg failed once on a desk event-loop check (re-run). CI at the reviewed tip runs on the draft pull request.
- map:check, readme:check, the trace, the tree check, the known-bugs check, the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 91444ac..dc7563b: 6 rows in 2 features, 2 read change(s)
FEAT-003 · Index and connect existing knowledge sources
  R-2860 new (implemented)
  R-2861 new (implemented)
  R-2862 new (implemented)
  R-2863 new (implemented)
FEAT-004 · Retrieve relevant context with provenance
  R-217 text changed
  R-225 text changed
artifacts:
  FEAT-004 A-052 readers none → packages/nana-knowledge/lib/hook.ts, packages/nana-knowledge/lib/sources-file.mjs
  FEAT-015 A-052 readers none → packages/nana-setup/lib/doctor.mjs, packages/nana-knowledge/lib/sources-file.mjs
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all, as the land reviewer: is this change safe to put on main for every later prompt and every doctor run? Can the new read throw past its guards, slow a pull past its budget, print where it should not, write sources.json or the index, or change doctor's exit code?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
