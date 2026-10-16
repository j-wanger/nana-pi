# Lane regroup — build brief 2 (2026-10-16 · feat/regroup · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** The seat's checks of build 1 (`seat-verify-f9ed550.md`; repro scripts in `verify-f9ed550/`,
which read scratch paths — read them for the steps) found seven blocking gaps; the seat's mutation runner
(`seat-mutate-output-f9ed550.txt`) caught 77 of 81 code breaks. The lift change holds (500 fuzzed lifts and regroups).
Build brief 1's rules hold: touched test files only, in the foreground, each tool call under 5 minutes; commit after each
item; push; never write in a real project.

**A correction from the seat first.** Brief 1's clarification 2 was wrong: it said an evidence path counts only inside a
backtick span. basketball-geek writes evidence the trace rail's way (plain cells split on commas), so every one of its
cited rows read as text-placed. Item 1 replaces that clarification.

1. **Evidence the rail's way (R-1176).** A row is evidence-placed when its evidence cell, read exactly as the trace rail
   reads it (`scripts/requirements-trace.mjs`'s evidence parsing — import it, never copy it), names a path that exists
   under the root; otherwise text-placed. Test, `// req: R-1176`, red first with basketball-geek's plain form:
   `R-1176: a row whose evidence names an existing path in the trace rail's plain or backtick form is evidence-placed`
2. **`--out` against every alias (R-1171).** Compare by device and inode for an existing path (case-insensitive file
   systems and hard links), and by real path otherwise; a directory at `--out` is refused by name, never a crash. Tests
   under T19/T20's titles or a new `// req: R-1171` title: a case-only alias of the ledger, a hard link to the proposal,
   and a directory.
3. **Never a crash (R-1177).** `targets`, `about` or `reasons` given as an object instead of an array, and a `null`
   verdict, are refused by the shape check with a named path before anything reads them (`requirements-regroup.mjs:162`,
   `:167`, `:174`), and a failed run still removes an earlier page. Tests under R-1177's and R-1171's titles.
4. **Strict line numbers (R-1173).** A reason's or claim's `line` must be an integer; `"37"` is refused, named.
5. **The short packet Jake ruled (R-1178, R-1179).** Today the packet shows no node label, drops the old heading text
   from reported lines, has no refuted-items section and lists nodes flat. Make it the precedent's short form: every
   capability, feature and subgroup with its ID, label and purpose, nested; each reported line with its old line number,
   old heading text and new node; a refuted-items section with each refuted (row, target) and its reason; numbered
   decisions with recommendations; the full row list only as an appendix. Assert each section's presence and order in
   T14/T15/T16 (keep their titles).
6. **Unknown rows (R-1175, R-1176).** A review verdict, a share target, a `placed` entry, a `refuted` entry or a
   question's `about` entry naming a row the ledger does not hold is refused, naming it (brief 1's clarification 5 —
   not built). Test under R-1175's title.
7. **Pin what is claimed (R-1171, R-1175).** Export `regroupProblems` and give T8 a direct call that exercises a
   "carried" share outcome (only for a share; a move target never counts as carried), as CHANGE §3.4 item 2 and
   residual 2 say; and pin R-1171's "the lift and each evidence path" clause with a test.

Also fix, each with a test: `same_family: true` with different lineages is refused, and lineage strings compare
case-insensitively (clarification 1); the same-family header names both lineages; an `active` feature with no rows and
no evidence path is refused like a gap without evidence (R-1174); the skill paragraph names the proposal's fields and no
longer opens "Regroup the lifted tree" (it starts from a flat or lifted ledger, S7). And the four mutation survivors:
2/8 and 4/1 are masked by R-1184's checks — give T4 and T5 cases whose only fault is the placeholder or the missing
reason; 5/3 — T6's `..` path must exist outside the root; C5 is item 6.

Do not change any row's text. Do not touch `CHANGE.md`, the seat's files, `HANDOFF.md` or `docs/sessions/`.

## Done
The touched test files green; `node docs/reviews/regroup-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-2026-10-15/acceptance.mjs > docs/reviews/regroup-2026-10-15/acceptance-output.txt 2>&1` → only
the seat's HANDOFF/session cases miss; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`;
`npm run -s readme:check`. Commit, push.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output; the one claim most likely wrong.
