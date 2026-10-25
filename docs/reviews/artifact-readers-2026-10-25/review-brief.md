# Review — artifact-readers (each artifact declares its readers or a dated park), 2026-10-25 (the final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary (scripts/deliverables.mjs, scripts/requirements-moved.mjs, three test files, REQUIREMENTS.md, the requirements skill and its shared template prose, the regenerated map and tree, notes; no page, desk, install, hook, gate or land-tool code). Threat model: honest variation in the ledger and our tools' output in scope (malformed, misplaced, foreign, repeated or reasonless reader and park lines, CRLF and trailing spaces, comma path lists, frozen features, retired entries, test-file paths, untracked paths); deliberate forgery out (a reader line naming code that never opens the artifact).

Review `git diff 4af28b0f..HEAD` on `feat/artifact-readers`. Main is 4af28b0f (review-texts-durable, landed); the lane merged it at 3b90772b. The lane's commits: 0432308f (plan of record), 9dae642b (build 1), c31937a6 (pairs at 9dae642b), 8a1e6359 and 0c083cb7 (build brief 2), 4f25258e (build 2), 3b90772b (merge of main), d1177a77 (pairs at 4f25258e and notes), and the final commit with this brief.

The plan of record is `docs/reviews/artifact-readers-2026-10-25/must-meet.md`, from the planner's draft and one adversary pass (`plan-attack.md`; 1 MUST, 8 SHOULD, 9 NOTE). The owner lifted the 2026-10-24 pause for four page-free lanes on 2026-10-25; the page stays frozen, so this lane changes no page code, and `source`, the count line and two deliverables moved to a later page lane. A feature span can hold `Read by: A-nnn · <kind>: <detail>` for its own artifact (R-2830); `runtime` needs a reason and never counts as code (R-2831); `Parked: A-nnn · since <date>: <reason>` parks an unread entry (R-2832); a test-file reader path gets a note on every reader form (R-2833); the exported `artifactConsumers` gives each live entry its reader kinds, and an entry with none and no park gets a coverage note (R-2834); the movement report lists artifact `Read by:` and `Parked:` changes (R-2837). This repository's ledger gained 19 reader lines and 2 parks so the suite stays green.

The seat's record:
- Build 1's locked full suite: 220 PASS, 0 FAIL, 2 SKIP. Build 2 widened fixtures only; the suite stayed green.
- Wrong-code pairs (`seat-mutate.mjs`, 48 pairs; a pair checker agent wrote three): 44 of 48 red at 9dae642b, 4 survivors and 4 rows red only through other rows (`seat-mutate-9dae642b.txt`); 48 of 48 red at 4f25258e, 0 survived (`seat-mutate-4f25258e.txt`).
- CI on the draft pull request: 9dae642b failed only R-2546's known Windows run-record check; 4f25258e passed every leg on the first attempt, Windows included.
- map:check, readme:check, the trace, the tree check (`deliverables: 20 of 23 made and read by code, 19 parked`, unchanged), the known-bugs check, the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.
- Existing tests the builder changed: R-2537's lists, R-2640's feature-span park case (now one note, still parks nothing), R-2787's fixture and title, and R-2783's registry fixtures (gained readers so the coverage note does not fire).

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 4af28b0..d1177a7: 10 rows in 3 features, 1 artifact change(s), 7 read change(s), 21 artifact reader/park change(s)
FEAT-026 · Verify output provenance across session history
  R-437 Made by/Read by lines changed
FEAT-028 · Maintain requirement identity and trace links
  R-291 Made by/Read by lines changed
  R-2787 text changed
  R-2830 new (implemented)
  R-2831 new (implemented)
  R-2832 new (implemented)
  R-2833 new (implemented)
  R-2834 new (implemented)
  R-2837 new (implemented)
FEAT-038 · Interpret workflow experiments and their limits
  R-536 Made by/Read by lines changed
artifacts:
  A-035 location docs/reviews/*/seat-mutate*output*.txt → docs/reviews/*/seat-mutate*.txt
  FEAT-008 A-008 readers none → packages/nana-pack/bin/nana-land.mjs
  FEAT-008 A-022 readers none → packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci.mjs
  FEAT-026 A-023 readers apps/desk/apps.mjs, packages/nana-stage/lib/blocks.mjs → apps/desk/apps.mjs, apps/desk/server.mjs
  FEAT-031 A-009 readers packages/nana-pack/lib/suite-records.mjs → packages/nana-pack/lib/suite-records.mjs, packages/nana-pack/lib/mutation-runner.mjs
  FEAT-039 A-015 readers none → scripts/product-report.mjs
  FEAT-039 A-046 readers none → scripts/product-report.mjs
  FEAT-032 A-003 readers scripts/product-report.mjs → none
  FEAT-003 A-052 reader code added
  FEAT-007 A-056 reader code added
  FEAT-007 A-057 park 2026-10-25 added
  FEAT-008 A-059 park 2026-10-25 added
  FEAT-013 A-081 reader runtime added
  FEAT-014 A-067 reader code added
  FEAT-014 A-068 reader code added
  FEAT-014 A-070 reader code added
  FEAT-016 A-017 reader person added
  FEAT-017 A-018 reader person added
  FEAT-018 A-019 reader code added
  FEAT-018 A-020 reader person added
  FEAT-027 A-029 reader code added
  FEAT-033 A-072 reader person added
  FEAT-039 A-073 reader code added
  FEAT-034 A-074 reader code added
  FEAT-036 A-041 reader code added
  FEAT-037 A-075 reader code added
  FEAT-038 A-076 reader code added
  FEAT-038 A-077 reader code added
  FEAT-038 A-078 reader person added
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: does the checker tell the truth about each artifact's readers on every reader form, with no honest line wrongly noted and no missing reader silently accepted; is each of the 21 migration lines an honest reader or park by the plan's own rule (a currency or presence check is not a reader); did any existing test's change weaken what it checked; does anything change what the frozen page renders beyond the data effects the plan lists; and is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
