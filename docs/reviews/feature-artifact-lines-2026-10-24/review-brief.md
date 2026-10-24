# Review — feature-artifact-lines (each feature lists the artifacts it reads from other features), 2026-10-24 (the final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary (the tree checker, the outline, the movement report and the ledger; no install, hook, gate or land-tool change). Threat model: honest variation in our tools' output and in other projects' ledgers in scope (a ledger with no registry or no `Reads:` lines, a kindless tree, a subgroup-homed deliverable, a parked deliverable, a frozen or retired feature, a retired entry, a renamed reader, a lift that moves a feature, a CRLF ledger); deliberate forgery out (a reader path that never opens the artifact, a false row citation).

Review `git diff 6ea795eb..HEAD` on `feat/feature-artifact-lines`. Main is 6ea795eb (report-names-artifacts, landed). The lane's commits: 9ab189cf (plan of record), c8a228bb (build 1, the lane and the paste), 652567c7 (pairs at c8a228bb, build brief 2), 3d0bdccc (build 2, tests), f6fd3aaf (notes, pairs 5 and 15 at 3d0bdccc), and the final commit with this brief and `tree-movement.txt`.

The plan of record is `docs/reviews/feature-artifact-lines-2026-10-24/must-meet.md` with `entry-table.md` (33 new entries and 100 `Reads:` lines, written by an adversarial verifier from the derive text `entry-table-derive.md`; the seat's rulings are at its end), after one adversary pass (`plan-attack.md`; 1 MUST, 6 SHOULD, 8 NOTE, all taken). The seat's decisions there: one `Reads: A-nnn · <reader paths>` line per artifact a feature reads from another feature; reader paths rather than bare IDs; no `Writes:` line; a feature's reads of its own entries stay implicit; stat-only reads and the install check's temporary-home reads count; a deliverable's `built from:` list counts as its home feature's statement of the read, and R-2798 ties them; `Reads:` lines are not registry entries and switch on no registry rule, but they count for the tree checker's print gate and make the shared report read the HEAD tree.

The seat's record:
- Build 1's locked full suite: 219 PASS, 0 FAIL, 2 SKIP; build 2 changed only tests and ran the suite green. The builder turned each row's red cases red by hand.
- Wrong-code pairs (`seat-mutate.mjs`): 23 of 25 red at c8a228bb; pairs 5 (a read of a retired entry) and 15 (a built-from entry read only in another feature) went to build 2 and are red at 3d0bdccc.
- The tree check at the tip: `deliverables: 19 of 22 made and read by code, 19 parked`, no note. The ledger now holds 79 entries and 100 `Reads:` lines. map:check, readme:check, the trace, the known-bugs check and `nana-writing HANDOFF.md` are clean; the frontier check is within budget.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`), in full in `tree-movement.txt`; its head:

```
tree movement 6ea795e..f6fd3aa: 6 rows in 1 features, 33 artifact change(s), 100 read change(s)
FEAT-028 · Maintain requirement identity and trace links
  R-2538 text changed
  R-2787 text changed
  R-2795 new (implemented)
  R-2796 new (implemented)
  R-2797 new (implemented)
  R-2798 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: can a true ledger now fail every land's suite through a new note, or a stale read pass silently; do the pasted entries and `Reads:` lines match the code; and does any other tool that parses feature spans (the lift, the regroup, the known-bugs check, the page) mishandle the new line?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
