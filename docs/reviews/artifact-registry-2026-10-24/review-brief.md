# Review — artifact-registry (artifacts get their own numbers in the product ledger), 2026-10-24 (the final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary (the tree checker, the outline, the movement report and the ledger; no install, hook, gate or land-tool change). Threat model: honest variation in our tools' output in scope (a store absent on CI, a home folder that differs per machine, a Windows path, a CRLF ledger, a parked deliverable, a frozen feature, a kindless or flat tree, a regroup that moves a feature, a renamed writer, a shallow clone); deliberate forgery out (a writer path that never writes the artifact, a false run, a location naming a store that is not there).

Review `git diff 822286b5..HEAD` on `feat/artifact-registry`. Main is 822286b5 (bench-study-scratch, landed). The lane's commits: 502767ca (plan of record), af5dc49f (build 1, the lane), dd9f7d75 (pairs at af5dc49f), 8aba7ea1 (build brief 2), 12a8d514 (build 2), abf8a1c2 (merge of main, the outline regenerated), the pairs at abf8a1c2, d5bcf403 (notes), and the final commit with this brief.

The plan of record is `docs/reviews/artifact-registry-2026-10-24/must-meet.md` with `entry-table.md` (the 46 entries, the rewritten Made-by lines and 11 corrections, derived by one agent and corrected by an adversarial verifier; the derive and verify texts are kept beside it), `plan-draft.md` and three adversary passes (`plan-attack-format.md`, `plan-attack-checker.md`, `plan-attack-page.md`). The seat's decisions there: four one-feature lanes (this is the first); artifact entries are ledger fields, added like rows, with no owner sign-off per entry; the frozen desk's artifacts are lines only; tags and CI records stay undated; a named reference binds the claim's run and every writer; a built-from list needs only live entries; no plain-path third part in this repository; until the page lane, a reference resolves to the string the page already ages, and a store entry maps back to today's machine-local name only under today's exact R-2743 test.

The seat's record:
- Build 1's locked full suite: 219 PASS, 0 FAIL, 2 SKIP; build 2's the same. The builder turned each row's red case red by hand.
- Wrong-code pairs (`seat-mutate.mjs`): 25 of 29 red at af5dc49f; build 2 closed pairs 15 (a claim sharing only one of two writers) and S1 (the bridge's claim-writer clause); 27 of 29 red at abf8a1c2 (`seat-mutate-output-abf8a1c2.txt`). Pair 5 is equivalent (an unknown class still gets one note, through the shape check). Pair 19 is the mechanism behind R-2784, whose repository test reads every claim on its own (pair 20 red).
- The tree check at the tip: `deliverables: 19 of 22 made and read by code, 19 parked`, no note. The page built from the lane: 29 of 41 deliverables name an artifact (9 before); 22 claims read "age unknown: not tracked at HEAD" until the page lane. map:check, readme:check and the trace are green; `nana-writing HANDOFF.md` finds no long sentence; the frontier check is within budget. CI passed on every leg at af5dc49f.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 822286b..d5bcf40: 50 rows in 24 features, 46 artifact change(s)
FEAT-001 · Keep goals and priorities in view
  R-001 Made by/Read by lines changed
FEAT-002 · Resume decisions and next actions
  R-108 Made by/Read by lines changed
  R-873 Made by/Read by lines changed
FEAT-003 · Index and connect existing knowledge sources
  R-201 Made by/Read by lines changed
FEAT-004 · Retrieve relevant context with provenance
  R-217 Made by/Read by lines changed
FEAT-006 · Launch builders with execution limits
  R-1400 Made by/Read by lines changed
  R-2597 Made by/Read by lines changed
FEAT-007 · Review a specific revision independently
  R-1008 Made by/Read by lines changed; also applies: FEAT-008
  R-1560 Made by/Read by lines changed
FEAT-008 · Integrate and clean up reviewed changes
  R-977 Made by/Read by lines changed
FEAT-013 · Install and connect harness runtimes
  R-301 Made by/Read by lines changed
FEAT-014 · Create or adopt a project workspace
  R-327 Made by/Read by lines changed
  R-1150 Made by/Read by lines changed
FEAT-015 · Diagnose the active environment
  R-341 Made by/Read by lines changed
  R-1070 Made by/Read by lines changed
FEAT-019 · Release usable templates and report support
  R-596 Made by/Read by lines changed
FEAT-020 · Find and read previous sessions
  R-406 Made by/Read by lines changed
FEAT-023 · Inspect changes and receive useful notices
  R-159 Made by/Read by lines changed
  R-1194 Made by/Read by lines changed
FEAT-024 · Edit session and project settings safely
  R-457 Made by/Read by lines changed
FEAT-025 · Use consistent structured tool output
  R-260 Made by/Read by lines changed
FEAT-026 · Verify output provenance across session history
  R-256 Made by/Read by lines changed; also applies: FEAT-025
  R-257 Made by/Read by lines changed
  R-264 Made by/Read by lines changed
  R-437 Made by/Read by lines changed
FEAT-028 · Maintain requirement identity and trace links
  R-291 Made by/Read by lines changed
  R-1460 Made by/Read by lines changed
  R-2536 text changed
  R-2538 text changed
  R-2730 text changed
  R-2780 new (implemented)
  R-2781 new (implemented)
  R-2782 new (implemented)
  R-2783 new (implemented)
  R-2784 new (implemented)
  R-2785 new (implemented)
  R-2786 new (implemented)
  R-2787 new (implemented)
FEAT-029 · Navigate code and investigate impact
  R-1272 Made by/Read by lines changed
FEAT-031 · Run checks reliably and without contaminating work
  R-616 Made by/Read by lines changed
  R-1239 Made by/Read by lines changed
  R-2547 Made by/Read by lines changed
  R-2632 Made by/Read by lines changed
FEAT-039 · See the product and its decisions in one report
  R-1014 Made by/Read by lines changed
FEAT-034 · Define reproducible comparisons
  R-509 Made by/Read by lines changed
  R-532 Made by/Read by lines changed
FEAT-035 · Account for cost and uncertainty
  R-535 Made by/Read by lines changed
FEAT-037 · Grade behavior with trustworthy checks
  R-507 Made by/Read by lines changed
FEAT-038 · Interpret workflow experiments and their limits
  R-536 Made by/Read by lines changed; Parked lines changed
  R-694 Made by/Read by lines changed
artifacts:
  A-001 new under FEAT-001
  A-002 new under FEAT-002
  A-003 new under FEAT-002
  A-004 new under FEAT-003
  A-005 new under FEAT-005
  A-006 new under FEAT-006
  A-007 new under FEAT-007
  A-008 new under FEAT-007
  A-009 new under FEAT-008
  A-010 new under FEAT-009
  A-011 new under FEAT-013
  A-012 new under FEAT-013
  A-013 new under FEAT-013
  A-014 new under FEAT-014
  A-015 new under FEAT-014
  A-016 new under FEAT-016
  A-017 new under FEAT-016
  A-018 new under FEAT-017
  A-019 new under FEAT-018
  A-020 new under FEAT-018
  A-021 new under FEAT-019
  A-022 new under FEAT-015
  A-023 new under FEAT-020
  A-024 new under FEAT-021
  A-025 new under FEAT-023
  A-028 new under FEAT-026
  A-029 new under FEAT-027
  A-030 new under FEAT-028
  A-031 new under FEAT-028
  A-032 new under FEAT-029
  A-033 new under FEAT-031
  A-034 new under FEAT-031
  A-035 new under FEAT-031
  A-036 new under FEAT-032
  A-037 new under FEAT-033
  A-038 new under FEAT-033
  A-039 new under FEAT-034
  A-040 new under FEAT-035
  A-041 new under FEAT-036
  A-042 new under FEAT-037
  A-043 new under FEAT-038
  A-044 new under FEAT-038
  A-045 new under FEAT-039
  A-046 new under FEAT-014
  A-047 new under FEAT-014
  A-048 new under FEAT-015
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: can a false or stale artifact claim now pass silently, or a true one fail every land's suite; does each entry and rewritten claim match the code; and is the page unchanged in behaviour until the page lane?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
