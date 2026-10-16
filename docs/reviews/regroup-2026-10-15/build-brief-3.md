# Lane regroup — build brief 3 (2026-10-16 · feat/regroup · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Build 2 (`228f37c`) closed most of build 1's findings. The seat's checks of build 2
(`seat-verify-228f37c.md`) found six blocking gaps; two come from merging main, where share support (regroup-shares) has
landed. The seat's mutation runner caught 101 of 104 breaks (`seat-mutate-output-228f37c.txt`). The plan gained seat
amendment 2 and the seat's answer to sol's round 3, at the end of `CHANGE.md`: read both first. Build brief 1's rules
hold: touched test files only, in the foreground (`node scripts/test.mjs <file>`), each tool call under 5 minutes;
never `npm run test:locked`; commit after each item; push; never write in a real project.

0. **Merge main first** (`git merge origin/main`, main is `2dbc817`). Resolve: (a) the lift's plan print — keep this
   lane's line-keyed `detectMoves` print, then main's `shares_added`/`shares_dropped` loop; main's old
   `for (const [oldHeading, newId] of detectMoves(...))` line must not survive (it crashes every dry run with a move);
   (b) `REQUIREMENTS.md` FEAT-028 — main's R-1181 to R-1183 first, then this lane's R-1170 to R-1179 and R-1184; R-1180
   stays in FEAT-032; (c) R-291's title and value become **1,152** after item 2 (1,151 right after the merge);
   (d) regenerate `docs/requirements-tree.md` and `docs/code-map.md`; (e) `HANDOFF.md` and `docs/sessions/` take main's
   text. Commit the merge alone, then run the lift, regroup and tree test files.
1. **The shares plan's T10 (M5).** Add `shares_added` and `shares_dropped` to `PROPOSAL_KEYS.feature`. Test, title
   verbatim, `// req: R-1177`: `R-1177: a proposal whose feature declares shares_added and shares_dropped holds no unknown key and passes the regroup checker`.
2. **R-1187 and the reworded R-1178, R-1179 (M6, amendment 2).** Add R-1187 after R-1184 and reword R-1178 and R-1179,
   each with amendment 2's text verbatim. Check: each row a feature's `shares_added` or `shares_dropped` names needs a
   `share` verdict with that feature among its targets, refused naming the row and the feature. T24, `// req: R-1187`:
   `R-1187: a share added or dropped with no share verdict targeting its feature is refused, an added one with that verdict passes as carried, and a dropped one passes only refuted or asked`
   — on a tree-form fixture (only a tree ledger can drop a share), including the case the seat's answer names: a refused
   move replaced by a share to the same feature passes as a carried share.
3. **Evidence values never crash (M1).** Every `regroup.evidence` value must be an array of strings, refused by name
   (`regroup.evidence.<FEAT>: …`) before anything reads it — the `--out` pre-check included — for any feature, gap or
   not. A failing run still removes an earlier page. Cases under R-1177's shape test: an object, a number, `true`, for a
   gap and a non-gap feature, each after a passing run at the same `--out`.
4. **Only a review page is removed (M2).** An earlier page is a file whose first line, with any BOM and trailing CR
   removed, equals `PAGE_HEAD` exactly. Nothing else at `--out` is touched. When `--out` is a symlink, a failing run
   removes the page the link points to and leaves the link. An `--out` the run cannot write is a named refusal, exit 1,
   no stack. Cases under T21's title: a file whose first line only begins with `PAGE_HEAD`, a BOM page, a CRLF page, a
   symlinked `--out`; an unwritable `--out` under R-1171's title.
5. **Exact field types (M3).** Every field naming a row, node or line — `id`, `at`, `to`, `node` (strings) and `line`
   (an integer) — in reasons, claims, verdicts, targets, `refuted` and question `about` entries has its exact type,
   refused by name otherwise; no key is built by string coercion. Cases under R-1173's and R-1177's titles, including a
   reason whose `to` is `["CAP-01"]`.
6. **Reserved nodes as the lift writes them (M4, R-1178).** The page shows each reserved node's label, purpose and
   outcome from the lift's seed, never blank and never proposal text the lift ignores. Export the lift's `loadSeed` and
   `seedNodeText` (add `export` only; change nothing else in them) and import them.
7. **The page per R-1178 and R-1179 as reworded.** The feature table gives each feature's label and status (a proposed
   gap reads `proposed`). Nodes nest by heading level with no leading spaces (four spaces make a Markdown code block).
   Each target line is marked `move` or `share`, gives the row's current home, and an asked target reads
   `asked in question <n>`. T14 and T16 keep their titles and assert each of these, and they must red under each of the
   five page breaks the check left green (finding 32) and the three sol r3 names: labels dropped, feature status dropped,
   question number dropped.
8. **Tests that pin what they claim.** (a) Every refusal case asserts a substring unique to the check that should refuse
   it, not only a row ID; this closes survivors 4/4, B2/9 and B2/16, where another check refused first. Keep each case's
   fixture in sync (claims, reasons) so only its own check can catch it. (b) The R-1171 lift-and-evidence alias test
   copies the files it aims `--out` at into a temp folder; it never points `--out` at a file in this checkout. (c) T21
   checks a file exists before reading it, so a removed file fails the check instead of throwing. (d) R-1176's plain-form
   test must red when plain cells are not split on commas. (e) Cite build 2's six new titles, T10 and T24 in their rows'
   Evidence cells, and move T8's carried case into T8's block or cite the direct-call title in R-1175.
9. **Smaller refusals, each with a case.** Lineage names compare trimmed and case-folded. A `refuted` entry, or a question
   `about` entry with an `id`, that names no move or share target of its row is refused. A claim verdict matching no required purpose,
   outcome or reason is refused. A `keep` verdict carrying targets is refused. A question without `ask` is refused. A
   feature status the tree checker's status pattern refuses is refused (`proposed`, `active`, `frozen (<why>)`,
   `retired (<why>)`; `scripts/requirements-tree.mjs:19`). Only a `proposed` or `active` feature with no rows counts as a
   gap; a frozen or retired one with no rows passes. An evidence citation's path is its text before `::`, then before
   the first space, less a trailing `:<line>` or `:<line>-<line>`; and the text-placed refusal says the cell "names no
   path that exists", not that it has no evidence.

Do not change any row's text except the three rows amendment 2 names. Do not touch `CHANGE.md`, the seat's files,
`HANDOFF.md` or `docs/sessions/` beyond item 0's merge.

## Done
The touched test files green; `node docs/reviews/regroup-2026-10-15/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/regroup-2026-10-15/acceptance.mjs > docs/reviews/regroup-2026-10-15/acceptance-output.txt 2>&1` → only
the seat's HANDOFF/session cases miss; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`;
`npm run -s readme:check`; `node scripts/requirements-trace.mjs`. Commit, push.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output; the one claim most likely wrong.
