# Review — artifact-flow (the product page draws how artifacts link the capabilities), 2026-10-24 (the final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary (the product page only; no install, hook, gate or land-tool change). Threat model: honest variation in our tools' output and in other projects' ledgers in scope (a ledger with no registry or no `Reads:` lines, a kindless tree, a frozen feature, a retired entry, a `Reads:` line naming an unknown or retired ID, a constraint capability, a shallow clone); deliberate forgery out (a reader path that never opens the artifact, a false run).

Review `git diff 26235c79..HEAD` on `feat/artifact-flow`. Main is 26235c79 (feature-artifact-lines, landed). The lane's commits: 1a80d1a4 (plan of record), e7f69c02 (build 1, the lane), fa4927be (pairs at e7f69c02, notes), and the final commit with this brief.

The plan of record is `docs/reviews/artifact-flow-2026-10-24/must-meet.md`, after one adversary pass (`plan-attack.md`; 3 MUST, 4 SHOULD, 7 NOTE, all taken). The seat's decisions there: an Artifacts view at `#artifacts` with the flow first, then two lists, then one card per live entry, no table; exact texts for every line; every live entry aged in the one `artifactAges` call the deliverable blocks use; one flow line per maker capability, reader capability and entry, with the entry's run and no stage-order mark, because this ledger has no `Needs:` lines; the second list says "made by no nana run" and shows each manual reason; a read of an ID with no live entry shows `no live entry` and draws no line; the feature detail gains `Registers:` and `Reads:` lines.

The seat's record:
- Build 1's locked full suite: 219 PASS, 0 FAIL, 2 SKIP. The builder turned each row's red cases red by hand.
- Wrong-code pairs (`seat-mutate.mjs`): 20 of 20 red at e7f69c02 (`seat-mutate-e7f69c02.txt`); pair 19 is red by a crash, which is its red case.
- The page built from the lane: 20 capability-pair headings, 48 flow lines, 21 and 38 list items, 79 entry cards. The tree check prints `deliverables: 19 of 22 made and read by code, 19 parked` and no note. map:check, readme:check, the trace, the known-bugs check and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 26235c7..fa4927b: 4 rows in 1 features
FEAT-039 · See the product and its decisions in one report
  R-2799 new (implemented)
  R-2800 new (implemented)
  R-2801 new (implemented)
  R-2802 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: can the view show a link between capabilities that no read supports, or miss one that a read does; does either list mislead the owner about what is read or made; and does the same commit still give the same page on any machine?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
