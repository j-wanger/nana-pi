# Review — report-names-artifacts (the product page names each artifact and its age), 2026-10-24 (the final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary (the product page and the deliverable checker; no install, hook, gate or land-tool change). Threat model: honest variation in our tools' output and in other projects' ledgers in scope (a store absent on CI, a home folder that differs per machine, a ledger with no registry, a kindless or flat tree, a parked deliverable, a frozen feature, a shallow clone, a renamed store constant, a claim naming an unknown or retired ID); deliberate forgery out (a writer path that never writes the artifact, a false run, a location naming a store that is not there).

Review `git diff 0943299b..HEAD` on `feat/report-names-artifacts`. Main is 0943299b (artifact-registry, landed). The lane's commits: 54aa3b56 (plan of record), 809d0571 (build 1, the lane), c3e044ff (build brief 2), feaa4ea3 (pairs at 809d0571), dd038e0b (build 2, a test), 3a818d6e (pairs at dd038e0b, build brief 3), cfbb2aa5 (build 3, a test), a1053224 (notes, pair 19 at cfbb2aa5), and the final commit with this brief.

The plan of record is `docs/reviews/report-names-artifacts-2026-10-24/must-meet.md`, written after one adversary pass (`plan-attack.md`; 4 MUST, 8 SHOULD, 10 NOTE, all taken). The seat's decisions there: one artifact block per deliverable after its claims; ages off the claim lines; ages by class, with no file time and no ref date read anywhere; the age table and one predicate the checker and the page share, replacing the old machine-local names and lane 1's bridge; the land page entry is not a table key; the old store names are plain paths in a ledger with no registry; features with no deliverable listed on product cards, and a constraint card's features' artifacts on constraint cards.

The seat's record:
- Build 1's locked full suite: 219 PASS, 0 FAIL, 2 SKIP; builds 2 and 3 changed only tests and ran the suite green. The builder turned each row's red cases red by hand.
- Wrong-code pairs (`seat-mutate.mjs`): 22 of 23 judged red at 809d0571 (shard 4 unjudged on a seat title slip); pair 2 (a repeated built-from ID) went to build 2; 28 of 29 red at dd038e0b; pair 19 (a second writer at a table location) went to build 3 and is red at cfbb2aa5. Pair 5 is red by a crash, which is its red case.
- The tree check at the tip: `deliverables: 19 of 22 made and read by code, 19 parked`, no note. The page built from the lane: 30 deliverables name artifacts, 9 show only what they are built from, 3 parked ones say none is written down; 48 ages read "age not measured: <class>" by design and none reads "age unknown". map:check, readme:check, the trace and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 0943299..a105322: 11 rows in 1 features
FEAT-039 · See the product and its decisions in one report
  R-2542 text changed
  R-2544 text changed
  R-2545 text changed
  R-2743 implemented -> retired
  R-2744 text changed
  R-2745 text changed
  R-2790 new (implemented)
  R-2791 new (implemented)
  R-2792 new (implemented)
  R-2793 new (implemented)
  R-2794 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: can the page now show an age an artifact never earned, or show the wrong artifact for a deliverable; does the same commit still give the same page on any machine; and can a true ledger fail every land's suite through the new checker note?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
