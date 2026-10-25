# Review — impact-artifacts (the impact command lists the artifacts each named file writes and reads), 2026-10-24 (the final reviewer)

Feature: FEAT-029 · Navigate code and investigate impact

Class: ordinary (the code-map shim, the runtime map config, one test file, REQUIREMENTS.md, the README, the regenerated map and tree, notes; no template, install, hook, gate or land-tool change). Threat model: honest variation in our tools' output and in the ledger in scope (a missing REQUIREMENTS.md, one with a NUL byte or no rows, a malformed Artifact line, a Reads line naming an unknown or retired ID, a `manual` entry, a file named by a relative, `./`, absolute or native-separator path, a file named twice, a file that is not a mapped module, the parse modules failing to load); deliberate forgery out (a ledger line naming a reader that never opens the artifact).

Review `git diff d3cf9a0d..HEAD` on `feat/impact-artifacts`. Main is d3cf9a0d (land-records, landed). The lane's commits: bca8a82d (plan of record), f5a2927d (build 1), 3a1e992f (pairs at f5a2927d), 3621fa3a (build brief 2), c50dc854 (build 2), 833bedee (pairs at c50dc854), 1d40da8a (notes), and the final commit with this brief.

The plan of record is `docs/reviews/impact-artifacts-2026-10-24/must-meet.md`, written from the judged design (`design-report.md`, section B: three designs, three judges, all three picked this route) and one adversary pass (`plan-attack.md`; 4 MUST, 4 SHOULD, 10 NOTE). The owner picked this lane on 2026-10-24 after asking whether artifacts belong in the code map. `npm run map:impact` now prints an artifact block between the generator's output and the runtime block. It reads only `Artifact:` writer lists and other features' `Reads:` lines, joined to the import graph on each run; nothing goes into `docs/code-map.md` or a module header. The block lives in `artifactBlock(root, argv, { load })` in `scripts/code-map.mjs`; the parse modules load only inside it, because three scripts import the shim. Four rows, R-2820 to R-2823, plus one seal test over every label in `packages/nana-pack/lib/runtime-map-config.mjs`; R-1272 and R-1273 change wording only.

The seat's record:
- Build 1's locked full suite: 220 PASS, 0 FAIL, 2 SKIP. Wrong-code pairs (`seat-mutate.mjs`) at f5a2927d: 17 of 24 red (`seat-mutate-f5a2927d.txt`); the fixture was too thin for seven red cases. Build 2 widened the R-2820 and R-2821 fixture only and ran the suite green.
- Pairs at c50dc854: 24 of 24 red (`seat-mutate-c50dc854.txt`); pair 21 is red by a crash, which is its red case.
- CI on the draft pull request at f5a2927d passed every leg on the first attempt: the three suite legs and all four install-check legs.
- On this checkout, impact on `packages/nana-pack/lib/build-records.mjs` lists A-006 with its two readers and marks the install check `(no import path)`; impact on `scripts/runtime-measure.mjs` lists A-032 with the product report marked `(no import path)`. No `artifact note:` line prints.
- map:check, readme:check, the trace, the tree check, the known-bugs check, the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` are clean; the frontier check is within budget. The plan's known limits are FEAT-029 lines; the notes also carry the land-records final tip's three Windows first-try failures.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement d3cf9a0..1d40da8: 6 rows in 1 features, 1 read change(s)
FEAT-029 · Navigate code and investigate impact
  R-1272 text changed
  R-1273 text changed
  R-2820 new (implemented)
  R-2821 new (implemented)
  R-2822 new (implemented)
  R-2823 new (implemented)
artifacts:
  FEAT-029 A-030 readers scripts/requirement-rows.mjs → scripts/requirement-rows.mjs, scripts/code-map.mjs
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: does the block tell an agent the truth about each named file's artifacts, with no reader or writer missing, misplaced or wrongly marked against the import radius; does the generator's output stay byte for byte and the exit code unchanged on every path, including the note paths; can the dynamic import or its failure change what the three importing scripts or R-1278's copied shim do; and is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
