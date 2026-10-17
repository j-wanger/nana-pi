# Fact-check r2: seat-rule CHANGE.md (seat draft 1) against 2dbc817

Scope: every file:line, row ID, count, title, command and API claim in `CHANGE.md`, plus the census of checks
the change turns red. Branch tips read: `main` 2dbc817, `feat/regroup` c514964, `feat/roster-notice` 57fca87
(ea09ebe when the plan was drafted; 57fca87 adds only corpus files).

Method. A fresh extract of 2dbc817 in `fc2/base` (Ran: `git archive 2dbc817 | tar -x`). Three probe copies:
`fc2/mid` (base guide + the proposed test), `fc2/tip` (proposed guide, test and row; map regenerated), and
`fc2/sim` (the plan's pair simulation, re-run from copies, so the plan's own `probe/` was not touched). HOME was a
scratch folder for every probe run. Nothing under the repo, the lane worktrees or the home folder was written.

Verdict: 2 MUST, 8 SHOULD. The guide text, test, row, pair table and census are accurate at 2dbc817. The two
MUSTs are about what the plan says the hand-split sentences are for, and how it reads the owner's option (b).

## MUST

**MUST-1. The hand-split sentences rest on facts that no longer hold, and the sibling runner plan contradicts carry 1.**
- §1 says "Every hand-copied runner drops a pair id it does not know" and "until it lands, the guide must tell the
  seat to check the parts". §3.6 says "no tool closes it before the next lane". Residual 6 says "Every runner copy
  still drops an unknown id". All three are true only for the nine copies on main
  (Ran: `grep -n 'only.includes(p.n)' docs/reviews/*/seat-mutate.mjs` at 2dbc817, 9 hits, none with a refusal nearby)
  and for the regroup copy (Read: `feat/regroup:docs/reviews/regroup-2026-10-15/seat-mutate.mjs:529`).
- The roster-notice lane's runner already splits and refuses. It refuses an unknown pair id with exit 2
  (Read: `feat/roster-notice:docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs:565-568`). It splits into five
  parts by default (`:18-23`, `SHARDS_DEFAULT = "5"`). It prints a MISSING line for any pair no part reported
  (`:549-552`). Its first real run used the split: "66/68 red … across 5 shards" (Read:
  `feat/roster-notice:docs/reviews/roster-notice-2026-10-16/seat-mutate-output-59db91d.txt`, committed at 57fca87).
  It was committed at 21:46 (ea09ebe), after the sibling fact-check that the plan cites.
- The sibling runner plan now says the seat-rule lane "needs no split-run clause". It makes split runs the
  runner's default and makes no guide edit (Read: `../parallel-seat/CHANGE.md:545` and S13 `:577`). Its §3.8 rules
  out a guide edit (`:270`). Its S12 has every runner the seat copies refuse an unknown id until it lands (`:576`).
  Carry 1 here says the runner lane rewords R-1140 and the guide, and that its pairs red this lane's parallel
  check. The two plans cannot both hold.
- "The owner's answer keeps a hand split" (§1, §3.2, §3.6) is not in the owner's three answers as relayed. They
  set the rule, the limit and the order. None of them names a hand split. Treat it as INFERRED, or drop it.
- Fix, one of two. (a) Drop the two hand-split sentences ("Split a long mutation run …" and "Check that the parts
  report every pair once."). Keep "a long check in parts" as an example. Then pairs 11 and 12 go, the pair count
  becomes 17, and R-1140's row and the new title lose their hand-split clause. This matches the design critique's
  MUST-1 and the sibling's S13. (b) Keep them. Then the sibling plan must take carry 1 and drop S13. Either way,
  rewrite §1's third bullet, the §3.6 rows for the hand split and the every-pair check, S6, and residuals 1 and 6
  to name the roster-notice runner. Name that runner as the form the seat copies until the shared runner lands.

**MUST-2. The plan says option (b) "as the owner chose it", then widens it.**
- Option (b) as the sibling plan put it to the owner reads "two lanes building plus one in planning — research,
  drafts and plan review, with no worktree and no build" (Read: `../parallel-seat/CHANGE.md:409-415`, D1).
- §3.2 says a lane in planning may already hold a worktree, and "the limit counts builds, not worktrees". That is
  not option (b) as written. The roster-notice example is accurate: its plan, plan review and seat acceptance were
  committed on its branch before build 1 (Ran: `git log --reverse main..feat/roster-notice`: f22bf32, 61b48e1,
  b9f66a2, 7a47cdd, then the build brief b2e5dae).
- The guide text itself is fine; it never mentions worktrees. Fix: drop the worktree sentence from §3.2, or
  declare it as a seat reading (a new S-line) that departs from (b)'s wording. If it stays, the owner should see
  it, as an optional ask or a line in the report. Then §1's claim that the answer matches (b) holds.

## SHOULD

1. **A standing owner preference is not reconciled.** The seat's private shared memory records a 2026-07-08
   correction: the owner picks which work fills a new parallel lane. The seat offers candidates with a
   recommendation and does not pull silently from the queue (Read; paraphrased, outside the repo). The new
   bullet says "start it now: another lane's build". A seat can read that as leave to open a lane on its own.
   Either word it as a lane already planned (for example "another planned lane's build"), or state in §3.2 that
   choosing which lane enters planning stays the owner's pick. §6 "no new optional ask" may then change.
2. **The provenance comment the plan names is missing.** §3.3 says the limit values' provenance is "recorded here
   and in the test's comment". `probe/seat-rule.test.mjs` has no such comment (Ran: `grep -n -i 'owner\|2026-10-16\|provenance'`, 0 hits).
   Add one line beside `RULE_7` naming the owner's 2026-10-16 answer, or drop the claim.
3. **HANDOFF positions.** "The existing optional ask on the Windows seat guide at `:90` onward": the ask is at
   `HANDOFF.md:95` at 2dbc817, and `:90` is the section heading. Once regroup lands, everything moves by two:
   the residual line goes to `:64`, the queue clause to `:83`. The ask is also retitled "The seat guide and the
   regroup on Windows" (Read: `git show feat/regroup:HANDOFF.md`). §6 cites the old title. Cite by content, not line.
4. **Roster-notice overlap is incomplete.** §4 lists its FEAT-006 changes as R-1120 to R-1124 plus new R-1190,
   R-1191 and R-1212. It also rewords R-961 and adds R-1192 between R-1123 and R-1124 (Ran:
   `git diff main...feat/roster-notice -- REQUIREMENTS.md` and the FEAT-006 row order on that branch). "Not beside
   R-1140" still holds.
5. **Line drift after roster-notice.** Roster-notice inserts a "Larger lanes" bullet just before the seat-guide
   pointer. Once it lands, the pointer moves from `AGENTS.md:100` to `:101` and from shared `:32` to `:33`.
   Acceptance (d) compares bytes to the lane's base, so it is unaffected; only the citations drift.
6. **Cross-plan ID overlap (not this lane's fault).** `../runtime-map/CHANGE.md:43` still claims R-1220 to R-1238.
   That overlaps this lane's reserved R-1220 to R-1229 and the runner plan's R-1230 to R-1268 (`../parallel-seat/CHANGE.md:562`).
   This lane adds no row, so it is safe. The runtime-map plan has to move.
7. **Unverifiable "request" claims.** §3.2 says the three examples "are the request's three kinds" and the six steps
   "are the request's list". The repo and the relayed answers carry no request text to check this against. Mark both INFERRED.
8. **Design tension the review will likely raise.** Bullet 1 (unchanged) says to launch in the background and end
   your turn. The new bullet says to start independent work now. §3.2 defends dropping "work the other" by saying
   bullet 1 already ends the turn, which sharpens the tension. Say once that the seat starts every independent item
   and then ends its turn. Also, the step-order sentence overlaps bullet 5, which already puts the mutation run
   before review. §3.6 should weigh that overlap.

## Claim-by-claim

| Claim (CHANGE.md) | Result | Evidence |
|---|---|---|
| Guide bullet 7 text at `nana-seat.md:11` | CONFIRMED | Read at 2dbc817 |
| Proposed guide: 13 lines, 1,659 bytes, nine bullets; §3.1 block equals `nana-seat.proposed.md` | CONFIRMED | Ran: `wc -c`, `grep -c '^- '`, `diff` of CHANGE lines 60-72 against the file |
| Bullets 1-6 and the last unchanged; parallel bullet before the limit bullet | CONFIRMED | Ran: `diff` base guide vs proposed (11c11,12) |
| Writing checker: `over=0 passive=0 banned=0 identifiers=0`, same for today's guide | CONFIRMED | Ran: `node packages/nana-pack/bin/nana-writing.mjs` on both |
| "being planned" reads passive | CONFIRMED | Ran: same checker on a variant, `passive=1` |
| Row draft equals the §2 table text; one `shall` with code spans masked; no pipe; opens with "The" | CONFIRMED | Ran: diff, `sed` + `grep -o -w shall` (1), `grep -c '|'` (0) |
| R-1140 in FEAT-006; R-1141 next to it; R-1142 in SUB-019 | CONFIRMED | Read: `REQUIREMENTS.md:328`, `:354-355`, `:893` |
| Main's highest ID R-1183; regroup adds R-1170 to R-1180, R-1184, R-1187; roster-notice R-1190 to R-1215 | CONFIRMED | Ran: `comm` of row IDs per branch |
| R-1220 to R-1229 unused on main, feat/regroup, feat/roster-notice | CONFIRMED | Ran: `git show <b>:REQUIREMENTS.md \| grep -c -E 'R-122[0-9]\b'` (0, 0, 0) and `git grep` over each tree (0) |
| `../runtime-map/CHANGE.md:43` names R-1220 onward | CONFIRMED | Read: "IDs R-1220 to R-1238" (see SHOULD 6) |
| Test lines `:3`, `:25`, `:32`, `:34`, `:48`, `:63` | CONFIRMED | Read `seat-rule.test.mjs` at 2dbc817 |
| 11 titles, 3 changed; 10 R-1140 titles replacing 9 (two renamed, one new) | CONFIRMED | Ran: diff base test vs probe test |
| Test-first commit: exactly the three changed checks FAIL; rail names the two retired titles | CONFIRMED | Ran in `fc2/mid`: 3 FAIL; `requirements-trace.mjs` exit 1 naming both titles |
| Tip: eleven PASS, rail exit 0 with `ears: 0 rows off form`, tree `--check` exit 0 and byte-equal, map stale then one line `:2509` | CONFIRMED | Ran in `fc2/tip` |
| `readme:check` fails only on `.git` in an archive | CONFIRMED | Ran: 666 claims, 1 problem, `packages/nana-knowledge/README.md:56` |
| Pair simulation 19/19 as declared | CONFIRMED | Ran: `node sim-pairs.mjs` from copies in `fc2/sim` |
| Pair recount 5+10+1+1+1+1 = 19; count check red in 1-17, limit in 1-5 and 16, parallel in 6-16 | CONFIRMED | Recounted from the sim output |
| `regroup-shares…/seat-mutate.mjs:281` filter, same line in all nine copies | CONFIRMED for main | Ran: grep, 9 copies; but see MUST-1 for the roster-notice copy |
| Serial runs 31.7, 54.9, 97.9, 96.6 min; split 217 pairs in 25.2 min, about 3.9 times faster | CONFIRMED | Ran: record header times vs file write times in the seat's scratch records; ids 44/44/43/43/43 |
| Five wall-clock bounds in four files; 10 cores | CONFIRMED | Read the five lines at 2dbc817; Ran `sysctl -n hw.ncpu` |
| `seat-guide-2026-10-14/CHANGE.md:87-88` ("a nana default") and `:51-56` (pointer reasons) | CONFIRMED | Read |
| `AGENTS.md:95` (small lane, one plan round), `:100` (pointer), `:147` (install check) | CONFIRMED | Read |
| Shared pointer at `templates/_shared/working-under-nana-pi.md:32`, same text as `AGENTS.md:100` | CONFIRMED | Ran: `cmp` |
| Setup README `:40` names three of eight rules | CONFIRMED | Read |
| `steps.mjs:48`, `state-manifest.mjs:59` | CONFIRMED | Read |
| `handoff-asks.mjs:13` ask form; `product-report.test.mjs:31-35` copies the real HANDOFF | CONFIRMED | Read |
| FEAT-006 stamp lists 21 rows, not R-1140 | CONFIRMED | Ran: `node -e` over `docs/product-report/assessments.json` |
| `skill-claims.mjs:13-25` surfaces are skills and the shared file | CONFIRMED | Read |
| Census lines: trace `:61`, code-map `:39` (G-004, G-009, G-010), win32 `:82-86` (R-350), install `:112` (R-301), templates-render `:270-274`, `:274` (R-859), `:395-400`, `:397-405` (R-1142), tree `:40` (R-291) | CONFIRMED | Read |
| Neither live lane touches the guide or its test | CONFIRMED | Ran: `git diff --name-only main...<b>` |
| Roster-notice FEAT-006 rows | INCOMPLETE | SHOULD 4 |
| HANDOFF `:63`, `:81` | CONFIRMED | Read; `:90 onward` should be `:95` (SHOULD 3) |
| "a lane in planning may hold a worktree" is option (b) | WRONG | MUST-2 |
| "no tool closes it before the next lane"; "every runner copy still drops an unknown id" | WRONG | MUST-1 |
| "the owner's answer keeps a hand split" | UNVERIFIED (INFERRED at best) | MUST-1 |
| Provenance "in the test's comment" | WRONG for the probe | SHOULD 2 |
| `--lane-size small` needed once roster-notice lands and the roster sets `largerBuilder` | CONFIRMED | Read: `feat/roster-notice:packages/nana-pack/bin/pi-worker.mjs:104` (small or larger) and `:108` (no size refused when `largerBuilder` is set) |
| Doctor reads ✗ on Windows until re-install | CONFIRMED | Read: `doctor.mjs:73-79` (byte compare on win32), `:340-342` |

## Census: checks the change turns red that the plan misses

None found. Searched at 2dbc817:
- Every code and test file naming `nana-seat` (Ran: `grep -rln nana-seat`). `restore`, `state-manifest` and `uninstall`
  tests name the file only. `doctor.mjs` and the install check compare links (bytes on Windows only).
- The words "lanes in flight", "eight rules" and "at most two" outside the review corpora (Ran: `git grep` on all
  three refs). The hits are the guide, its test, R-1140, `HANDOFF.md:81`, `docs/code-map.md:2509` and a session
  entry. Only the map is checked, and the plan covers it.
- Tests reading the real HANDOFF or the shared file. Product report is covered. `project*.test.mjs` render from
  the shared file, which this lane does not change.
- Ledger hash pins (`"sha256"`) in docs and scripts. Only the product report's historical stamps, which do not
  include R-1140.
- The live lanes' edits to `templates-render`, `win32-degrade` and `install` tests. None reads the guide's text.
- The regroup lane's new tests read fixtures, not the real ledger (Read: `requirements-regroup.test.mjs:208-216`
  on that branch).

## Recounts

- Rows: 1 reworded (R-1140), 0 added, 0 retired. R-1141 and R-1142 unchanged. The leaf total stays at 1,139
  (Ran: the trace rail prints `1139 total`; tree `--check` exit 0).
- R-1140 evidence: 9 titles become 10. File checks: 10 become 11, with 3 changed.
- Pairs: 17 numbered plus S1 and S2 make 19. Under MUST-1 fix (a) they become 15 numbered plus S1 and S2, which is 17.
