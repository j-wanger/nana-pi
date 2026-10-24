# Review — report-at-land (each land writes the product report; suite and build store ages), 2026-10-23 (the final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary (the write runs inside every land's locked suite; the seat treats its guard as load-bearing). Threat model: honest variation in our tools' output is in scope (the Windows land path; a land from a linked worktree; a land nana-land refuses after its suite passed; filtered runs; a hand measure on a dirty tree; a failing suite, and a coverage failure whose plain rerun passes; a malformed HANDOFF ask, a ledger with tree problems or none; a page path that cannot be written; a shallow clone; records from lane worktrees HEAD does not contain; a running build; a fresh clone with no stores); deliberate forgery out (hand-edited records or ledger lines, a hand-set land tip, a forged page).

Review `git diff d547b329..HEAD` on `feat/report-at-land`. Main is d547b329 (park-honestly, landed). The lane's commits: f7226901 (plan of record), 4722da58 (build 1, the lane), aa08801e (pairs), f2d20d91 (merge of main, which also drops a duplicate `repositoryRoot` declaration both lanes added to the deliverables test), 0401b8ee (notes), and the final commit with this brief.

The plan of record is `docs/reviews/report-at-land-2026-10-23/must-meet.md`: the seat's decisions on the attack (M1: a hand measure never writes the page, and the suite record and the page share one exported land test; M2: no `product-report` artifact name and no age from the page's own commit; S2: a machine-local artifact map keyed by maker and writer; S3: the seat's publish check; S4: a linked-worktree case; N3: the stop flag re-checked; N6: an atomic write), rows R-2740 to R-2745, and the known limits. `plan-draft.md` and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 24 of 25 red at 4722da58 (`seat-mutate-output-4722da58.txt`). Pair 19 crashes the product-report file inside R-2745's case rather than printing its line. The survivor, S1, replaces the suite record's land test with a bare tip comparison; it changes only the land prefix on a hand measure's record lines, recorded as a FEAT-031 known-bug line.
- Real-run check in a scratch clone of 4722da58: a passing land wrote the page on the measured path, the Windows path (injected) and a linked worktree, each with its embedded commit equal to HEAD and nothing written under the worktree's private git folder; a hand measure left the page byte for byte. The page built at the merged tip shows 9 of 41 ages, and the tree check prints `deliverables: 18 of 22 made and read by code, 19 parked` with no note.
- The seat's diff check finds no removed escaped `\n`. Session titles: 0 missing. Build 1's locked full suite: 217 PASS, 0 FAIL. After the merge, the deliverables and tree test files pass alone; map:check, readme:check, the trace and the tree check are green; `nana-writing HANDOFF.md` finds no long sentence.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement d547b32..0401b8e: 10 rows in 3 features
FEAT-006 · Launch builders with execution limits
  R-2597 Made by/Read by lines changed
FEAT-031 · Run checks reliably and without contaminating work
  R-2547 Made by/Read by lines changed
FEAT-039 · See the product and its decisions in one report
  R-1012 text changed
  R-1014 Made by/Read by lines changed; Parked lines changed
  R-2740 new (implemented)
  R-2741 new (implemented)
  R-2742 new (implemented)
  R-2743 new (implemented)
  R-2744 new (implemented)
  R-2745 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green. This land is the write's first real run: nana-land's output must carry the product-report note.

Ask above all: can the page write ever change a land's exit code, slow it unboundedly or write the page for a run that is not a land; and does every age the page shows come from a record the report really reads, with a reason the reader can tell apart when it cannot show one?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
