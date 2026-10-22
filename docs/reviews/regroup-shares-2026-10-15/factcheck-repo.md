# Fact-check (repo) — regroup-shares CHANGE.md, seat draft 1

*nana-pi `main` `e451c90`, 2026-10-15. Read = source opened at the cited line; Ran = run on copies under `plan-shares/fc/` (repo untouched).
Cites without a file are `scripts/requirements-lift.mjs`; `proof:`, `tree:`, `test:` as in the plan. The regroup plan's file is being edited live:
`regroup@023ca75` = its committed draft 2, `regroup-live` = the working copy (draft 3, 271 lines, uncommitted). Lab = A's patched lift copied to `fc/lab`
(share line joins both `fieldBlockAt` copies; heading tuple carries `also_applies`), so a Ran through it shows today's code plus A §5 (a)+(b), not this plan's design.*

## Share-line census (Ran, `fc/shares.mjs` on `fc/led/REQUIREMENTS.md`, byte-equal to HEAD)

- 31 lines match `^Also applies:`; 31 parsed by the tree parser; 0 fenced; 0 outside a FEAT span; 1 per feature (31 of 39 features); 0 malformed IDs; 126 IDs.
- Every one sits on the line right after its feature's `Status:` line; none after a table. Shapes: 23 `, `-separated lists, 8 single IDs, 0 no-space lists, 0 trailing blanks.
- 13 shares name G rows: FEAT-028 (G-013..015), FEAT-029 (G-004, G-007..011, G-019), FEAT-032 (G-012, G-021, G-022). Tree check: 0 problems.
- Four more lines mention `Also applies:` mid-line (25, 53, R-292 at 1334, R-1167 at 1347): none starts the line, so none is a share or a refusal.

## VERIFIED

- Base dry run exits 1, 31 lines, all share lines, `line 84` first (Ran; my stderr is byte-equal to `base-dry.err`). Cap 40 (`:40`), so none hidden.
- `fieldBlockAt` `:160-173` and proof:98-111 hold Purpose/Outcome/Status only; label check `:226`; `sectionBody` skips field lines `:674`, `:683`; identity carries `also_applies` `:383`; shape check `:438-441`, `:453`; writer `:740`; first-line ending `:712` (lift CHANGE S10 at `:225-226`); tail verbatim `:756`; move lines `:978`, proof line `:980`, failing proof exits after the move lines `:979`; `--verify` validator/apply/proof `:1095-1099`; G-row rule `:532-536`; `MAPPING_FORMAT` 1 `:38`.
- tree:84-97 reads shares anywhere in the FEAT span, skipping fenced lines (tree:86); duplicate at tree:187; "does not exist" tree:198; "is homed in this feature" tree:201; no rule on shares of a retired feature (tree:172-207). Ran: a share line after its table and a fenced `Also applies: R-999` before the real line both pass the tree check; today's lift refuses only the unfenced line.
- proof:430-452 keeps the share line in `expectedProseFor`; proof:489 drops it from the region. Ran (lift patched, proof not): the A1 mapping fails with 31 "prose … missing" problems — the in-place mismatch is real. Accounting block is proof:540-608; check 7 is proof:410.
- A §5c (Ran by A, `plan-regroup/lab-dropshare.txt`; re-Ran by me): with (a)+(b), the G-move mapping minus FEAT-001's `also_applies` exits 0, proof clean, 358 vs 359 lines inserted, no share line printed.
- A §3 G rows (Ran): lab identity dry run gives exactly 22 problems, all "FEAT-033: row G-0nn belongs to the seed subgroup …". 22 `| G-` rows in the ledger.
- A1 (Ran, lab): G-move exits 0, 5/8/3/3/3, `1136 rows kept`, tree 0 problems, `^Also applies:` 31 = 31 byte-identical, FEAT-028/029/032 G shares pass.
- A2 (Ran, lab): emit on A1's output, `--mapping` dry run exits 0 with no `->` line, applied output `cmp`-equal to its input.
- A3 (Ran, lab, `also_applies` edited by hand as the plan's result): diff is exactly line 294 `Also applies: R-641, R-781` and line 1538 removed; tree 0 problems. R-756 into FEAT-033 without the drop: exit 1, "line 1538: FEAT-033 Also applies: R-756 is homed in this feature"; with it: exit 0.
- FEAT-001 line 81, share line 84, eight IDs R-021..R-819; FEAT-005 line 291 shares R-641; FEAT-033 line 1535 shares R-756 (1538). Outline: R-781 home FEAT-011 (`docs/requirements-tree.md:292`), R-756 home FEAT-028 (`:362`).
- T22b is test:1303-1388, title at test:1386, six modes. T22's share case is a flat intro (test:1276-1279), refused because a flat ledger has `headEnd` 0. Lift T6 tampers through `proveLift` directly (test:307-433; lift CHANGE:164). `seat-titles.mjs` has the GONE convention (:9, :153).
- `REQUIREMENTS.md:24-25` (shares), `:34-37` (share add/remove is the owner's), R-1167 at `:1347` holds both anchors the diff edits; R-1162..R-1168 at 1342-1348 close FEAT-028's table (FEAT-029 at 1352); R-1181..R-1183: 0 hits. Leaf literal `requirements-tree.test.mjs:40` (also `:54-55`).
- `HANDOFF.md:25` (Sonnet for riskier lanes), `:29` (Owner 10-14), `:63` (share sentence); `CHANGE-B.md:10-13` quote; `~/nana-pi-wt/land` is `4ea846e` `land/t3`, stale.
- regroup `:22-23` (no share line downstream) and residual 7 (`@023ca75:228`, live `:248`); A §8 case 1 (demoted feature); A §5b exists.
- Tail claim (Ran today's lift): a FEAT heading in `tail.from` already fails, with "tail: prose … stray" among others, because the tail copies Purpose, Status and rows too.
- 27 mutation pairs (8+4+10+4+1); T8×7 + T7×2 + T8 = 10 for row 3. Proof imports only tree and trace (proof:13-14), so a tree-parser recount keeps R-1163.

## WRONG

1. §1 "`baseRefusals` refuses every `Also applies:` line outside a field block (`:226`)". `:221` skips fenced lines and `:224` skips head and tail lines of a
   tree-form ledger. Ran: a T22b-shaped tree fixture with `Also applies: R-001` in the head, or in `## Open questions`, exits 0 with a proof line (`fc/ht-head`, `fc/ht-tail`).
   R-1167's text at HEAD already overclaims this; the plan carries it forward (see below).
2. §2/§4 "1,150 once the regroup lane's 11 rows land". `regroup-live` adds R-1184: 12 rows, leaf 1,148 (`:60`, `:170`, `:264`). Combined: **1,151**.
   The plan's figure matches only `regroup@023ca75` (11 rows, 1,147 at `:57`, `:156`).
3. §3.6 "(the regroup lane's paragraph names the keys)". No `shares_added` or `shares_dropped` appears anywhere in the regroup corpus, committed or live.
   `regroup-live:150` instead says "A mapping key `regroup-shares` adds must join `PROPOSAL_KEYS`, or the checker refuses it"; §4 Overlap omits this.
4. Header and §2 cite regroup `CHANGE.md:55-56` and `:38-39`. True at `regroup@023ca75`; the live file the plan names has moved: held text is now `:4`, `:41`, `:58-59`,
   and `:39-40` now reads "R-1171 to R-1184: 0 hits".
5. A1 "must … change only the G rows and the CAP-90 block". Ran (lab): 78 changed lines include 3 blank-line changes in FEAT-033's re-laid table
   (`diff` hunks `1553a1554,1555`, `1558,1580d1559`). Same loose wording in A §3. As written, the acceptance step fails on a correct lift.

## UNVERIFIABLE (design, not built)

- §3.4(c) outcomes ("1 missing" / "1 unaccounted extra") for each tamper; T4–T8 behaviour; the validator's wording; A4's eight named problems.
  INFERRED consistent with today's accounting. One gap: (c) catches an undeclared add only on a kept feature; a regenerated one rests on (b).
- "The claim most likely wrong" (three finders agree): today the lift's finder is fence-blind for Purpose/Status (`:166-171`), confirmed; agreement after the change is untested.

## WRONGs that change the plan

- **W1 → R-1167 rewording and §3.1.** New ledger clause "an `Also applies:` line other than the first outside a fence in a feature heading's own lines" reads as
  refusing fenced lines and head/tail lines; the code refuses neither and the plan changes neither. §3.1's "one under a … plain heading" is false for the closing
  heading and kept sections. Narrow the clause (for example "outside the head, the tail and fences"), or add the refusal and a T7 case. Otherwise the row overclaims.
- **W2 → T9 and §4.** The merge literal is 1,151, not 1,150. Whichever lane lands second must use the other lane's live count.
- **W3 → §4 Overlap and §3.6.** Add `shares_added`/`shares_dropped` to the regroup checker's `PROPOSAL_KEYS` (one lane must own it) and name the keys in the skill
  paragraph. Neither plan does both, so a proposal declaring a share change would pass the lift and be refused by the regroup checker (INFERRED from R-1177).
