# Review — park-deliverables (a deliverable can be parked; the eight desk and app deliverables are), 2026-10-22 (the final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary (scripts/deliverables.mjs, scripts/requirements-moved.mjs, four test files, the root README, the requirements skill text and ledger lines; nothing on the install, hook or gate list). Threat model: honest variation in our own ledger lines — `-` for `·`, a reason holding a second ` · `, a date without `since` or in another order, an empty reason, extra spaces, lowercase or bold or bulleted forms, a park line under a feature heading or in a fence, CRLF, a park line in one capability naming another's row, a park line above the maker line, two park lines for one row, a park left after code makes and reads the row, other projects' trees with no park line, the movement report over old revisions. Deliberate forgery out: a park line claiming a decision that never happened passes; the reviewer sees it in the movement output.

Review `git diff 3bbb0662..HEAD` on `feat/park-deliverables`. Main is 3bbb0662 (land-reads-ci landed). The lane was cut from ca4018ed and merged main once at 6dc0c461; conflicts were HANDOFF's lanes line and the session archive, both resolved by the seat. The lane's own commits: e3069a18 (plan), 62e3ee38 (build 1 stopped PARTIAL with uncommitted work; build brief 2), a6382024 (build 2, the larger builder: the feature), 8fa454b0 (pairs and notes), the merge, and the final commit with this brief.

The plan of record is `docs/reviews/park-deliverables-2026-10-22/must-meet.md`: decisions D1 to D11, rows R-2639 to R-2643, the tunables, the known limits and the pairs. `plan-draft.md` and `plan-attack.md` (M 1, S 7, N 9) are its inputs; where they disagree, the must-meet wins. The owner's answer covered the eight desk and app rows only; the seat left the six study deliverables counted (D7) and added an optional ask.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): all 15 written pairs red at a6382024 (`seat-mutate-output-a6382024.txt`); p10 declared, as the attack's N2 found no natural build that checks a park against only the lines above it.
- No removed escape lines. Session titles 0 missing. The builder's locked full suite: `207 PASS, 0 FAIL, 2 SKIP`. After the merge the four named test files pass, map:check, readme:check and the trace are green, and the tree checker prints `deliverables: 14 of 31 made and read by code, 8 parked` with no note (main: `14 of 39`).
- The product report's data lists each park line as a `Parked` claim under its deliverable.

Tree movement, both reports (D10). The AGENTS.md command runs main's script, which does not read park lines:

```
tree movement 3bbb066..6dc0c46: 6 rows in 2 features
FEAT-028 · Maintain requirement identity and trace links
  R-2541 text changed
  R-2639 new (implemented)
  R-2640 new (implemented)
  R-2641 new (implemented)
  R-2643 new (implemented)
FEAT-039 · See the product and its decisions in one report
  R-2642 new (implemented)
```

The worktree's own `node scripts/requirements-moved.mjs --root . --base main`:

```
tree movement 3bbb066..6dc0c46: 14 rows in 7 features
FEAT-020 · Find and read previous sessions
  R-406 Parked lines changed
FEAT-023 · Inspect changes and receive useful notices
  R-422 Parked lines changed
FEAT-024 · Edit session and project settings safely
  R-457 Parked lines changed
FEAT-025 · Use consistent structured tool output
  R-260 Parked lines changed
FEAT-026 · Verify output provenance across session history
  R-256 Parked lines changed; also applies: FEAT-025
  R-257 Parked lines changed
  R-264 Parked lines changed
  R-437 Parked lines changed
FEAT-028 · Maintain requirement identity and trace links
  R-2541 text changed
  R-2639 new (implemented)
  R-2640 new (implemented)
  R-2641 new (implemented)
  R-2643 new (implemented)
FEAT-039 · See the product and its decisions in one report
  R-2642 new (implemented)
```

CI runs on the draft PR at the reviewed tip, the Windows leg included. The seat lands only on green.
