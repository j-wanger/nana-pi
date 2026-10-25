# Review — review-texts-durable (the documented backup and restore keep the kept review texts), 2026-10-25 (the final reviewer)

Feature: FEAT-017 · Inspect durable state and follow restoration steps

Class: ordinary (the state manifest, two setup test files, REQUIREMENTS.md, the setup README, the regenerated map and tree, notes; no install, uninstall, doctor, hook, gate or land-tool change; the local macOS install check ran because the lane touches the setup package). Threat model: honest variation in our tools' output and the home layout in scope (a moved pi home, a custom Claude home, an empty or growing text store, a review completing during a backup); deliberate forgery out.

Review `git diff 61671be0..HEAD` on `feat/review-texts-durable`. Main is 61671be0 (impact-artifacts, landed). The lane's commits: e1b04d58 (plan of record), 4ccc6979 (build 1), 15758350 (pairs and notes), and the final commit with this brief.

The plan of record is `docs/reviews/review-texts-durable-2026-10-25/must-meet.md`, after one adversary pass (`plan-attack.md`; 0 MUST, 4 SHOULD, 8 NOTE). The owner lifted the 2026-10-24 pause for four page-free lanes on 2026-10-25; this is one. The durable-state list gains one row for the kept review text store: durable, nana-pack, a folder, with the tally row's source and restore text (R-2870). The list holds exactly one row for each path the review ledger names, each an explicit call (R-2871). A kept text survives the README's backup and restore and reads as intact to the land's evidence check (R-2872). R-955 narrows to its layout clause.

The seat's record:
- Build 1's locked full suite: 220 PASS, 0 FAIL, 2 SKIP. The builder's own install check failed at pi post-edit inside its builder session; the seat's run of the same tip outside pi passed 18 of 18 (a FEAT-015 line).
- Wrong-code pairs (`seat-mutate.mjs`): 7 of 7 red at 4ccc6979 (`seat-mutate-4ccc6979.txt`); pair 3 also turns an outside-home check red, and pair 4 crashes the restore check.
- The real-home count, read only: `state --paths` lists 72 kept texts, and the store holds 72.
- CI on the draft pull request at 4ccc6979 passed every leg on the first attempt, Windows included.
- map:check, readme:check, the trace, the tree check, the known-bugs check, the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.
- The notes rewrite HANDOFF's pause lines (the lane pause lifted; the page frozen until the owner's discussion) and Windows line, add FEAT-017 known limits, narrow the FEAT-017 audit line this lane closes, and fold the impact lane's three Windows first-try failures and the builder install-check failure.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 61671be..1575835: 4 rows in 1 features
FEAT-017 · Inspect durable state and follow restoration steps
  R-955 text changed
  R-2870 new (implemented)
  R-2871 new (implemented)
  R-2872 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: after this change, does a real owner's backup and restore keep every kept review text a land needs; can a future ledger path still slip out of the list unnoticed; does the new row change what uninstall or doctor does; and is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
