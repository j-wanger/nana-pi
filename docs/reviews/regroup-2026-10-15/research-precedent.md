# Research B — how nana-pi's own tree was built by hand (the precedent)

Read-only at main e451c90, 2026-10-15. `RT/` = `docs/reviews/req-tree-2026-10-09/`, `RP/` =
`docs/reviews/requirements-proposal-2026-10-09/`, `LIFT/` = `docs/reviews/lift-2026-10-14/`, `MEM:n` = project
memory `project_requirements_tree.md` line n. "(ran)" = computed in this session.

## 1. What astra's draft contained

- Origin: the owner asked astra (separate session) for "requirements categories" because he could not read the
  flat 1,004-row ledger (MEM:11-13; RP/README.md:10-15). Built at e9ecc90; kept unedited in
  `RT/mapping-astra.json`, IDs only, never row text (its `source.note`).
- Shape: one purpose ("Help a developer turn project goals into useful software ... reusable across
  projects"); 5 outcomes (label, description, provenance); 8 capabilities (purpose + outcome); 38 features
  (purpose + row IDs); 21 subgroups (purpose + row IDs) under 4 features (ran).
- Every row's feature: 1,002 IDs (980 R, 22 G), each in exactly one feature (ran). Rows per feature:
  - CAP-01 context: 001 23 · 002 62 (5 sub) · 003 35 · 004 31 · 005 16 | CAP-02 changes: 006 13 · 007 74 (5 sub) · 008 7
  - CAP-03 trust: 009 31 · 010 45 · 011 36 · 012 21 | CAP-04 install/adopt: 013 83 (5 sub) · 014 61 (6 sub) · 015 31 · 016 24 · 017 6 · 018 19 · 019 13
  - CAP-05 desk: 020 14 · 021 11 · 022 25 · 023 32 · 024 7 | CAP-06 stage: 025 26 · 026 25 · 027 23
  - CAP-07 checkable: 028 10 · 029 10 · 030 42 · 031 37 · 032 10 · 033 14 | CAP-08 bench: 034 19 · 035 9 · 036 16 · 037 23 · 038 18
- Flaws in the draft's form: Part G split (9 of 22 G rows in FEAT-028/029/032) (ran); subgroup IDs embedded
  the feature (`SUB-002-01`); subgrouped features listed rows twice, so 280 rows would trip a "doubly placed"
  stop (RT/fable-consult.md:12,15; ran: each feature set equals its subgroup union).
- Beyond the tree: a 15-issue register (C02–C18) and a delivery process (two checkpoints per increment, WIP
  limit, acceptance package) (RP/README.md:3-5,71-79). Its explorer HTML is not in the repo (MEM:13); not read.

## 2. What the seat did before the owner saw it

- Scripted fact-check plus a 10-agent workflow: rows verbatim at e9ecc90, but "one home per ID" was FALSE
  at HEAD within 4 h (R-285, R-286 unmapped; R-231 text changed) (RP/README.md:17-26).
- Sample: 0 wrong placements in 40; 90.1% of rows sit in their old section's main capability
  (RP/README.md:59-60). The seat used that overlap to call the tree low-value; the owner corrected it — his
  comprehension need is his to judge (RP/README.md:10-15; shared feedback `joy_control_north_star`:16).
- Constraints kept: one copy inside the ledger; a reorder is rail-safe, a file split is not (RP/README.md:65-68).
- Deviations declared as the diff astra draft → `RT/tree.json` (RT/CHANGE.md:124-127): G rows whole in
  FEAT-033 with `See also:` lines (:182-185); R-286, R-285 appended to FEAT-006 (:186-189); flat
  SUB-001..021 (:166-167); leaf-only row lists.
- Prose between old tables got declared destinations, not majority ones: §13c's majority home was FEAT-002,
  but its note is about the code map, so FEAT-029 (RT/CHANGE.md:168-175). Positional §10 prose went to a
  dated old-section map (:176-177).
- Plan review: 2 Fable consults; sol plan SEND-BACK 5, SEND-BACK 6, LAND-WITH-FIXES 8
  (RT/sol-plan-r1..r3-response.md). Fable's one insisted change: review names and grouping BEFORE the
  build, while a change is a JSON edit (RT/fable-consult.md:8,17).

## 3. How the owner reviewed it — two checkpoints planned, three in practice

Checkpoint 1 (before any row moved; RT/CHANGE.md:240-243):
- He read `RT/outline.md`: top purpose in his own words, astra's outcomes, a 38-row table (rows, status mix,
  frozen/idle share), every heading with its purpose line (RT/outline.md:5-60,63-162).
- Four decisions, each with a recommendation (RT/CHANGE.md:258-272): purpose wording; business layer =
  purposes, technical = rows; one feature per lane, trial of five; governance "visible, not pinned".
- Ruling: "Ok I like this, lets proceed" — no renames, all four as recommended. Commit 6b9202a became the
  approved commit that freezes the inputs (RT/CHANGE.md:274-280; MEM:22).

Checkpoint 2, first attempt (planned ~15 min: proof line, deviations, verdicts; RT/CHANGE.md:245-247):
- The owner did not accept: "Do one review on all 1009 placements, also we should allow multiple features
  pointing to the same requirements ... proper governance on the features and requirements life cycle"
  (RT/CHANGE-B.md:10-13). The mapping had been checked for fidelity, never for correctness (:15-16).

Increment B, then checkpoint 2 (~20 min; RT/CHANGE-B.md:159-165):
- Placement review by a different lineage: 12 reviewers (one batch each, every row against all 67
  headings), 12 skeptics, a consistency critic, 2 more skeptics (RT/placement-review.md:3).
- Rules: home = the feature whose purpose the row most directly serves (what breaks if it is violated), not
  where its code lives; share only when the row directly constrains the other feature (:5).
- Result: 17 moves, 113 shares over 95 rows in 30 features, 992 kept; refuted items and 6 critic questions
  with seat rulings, listed for the owner (:7,131-180).
- Plus `Status:` per feature (7 frozen from his desk ruling; seat inferences named for him) and
  governance text: the owner decides every tree change (RT/CHANGE-B.md:104-113; RT/fixed-text-b.md:22-26).
- Ruling: "accept the work"; tree, increment B and four-digit IDs landed together at 1836fa3 (MEM:41).

## 4. What the proof checked

- One-off `RT/move.mjs` builds; `RT/prove.mjs` proves; they share no code (RT/CHANGE-B.md:139).
- The caller cannot pick the baseline: base ledger, tree and fixed text come from `git show` at the approved
  commit (RT/CHANGE.md:199-201; RT/prove.mjs:15,23-27).
- Every physical line, blanks and final newline included, against a canonical layout: intro byte-identical
  except declared edits; fixed text verbatim; per node heading, `Purpose:`, `Outcome:`, `Status:`,
  `Also applies:`, moved notes; rows byte-identical in tree order; tail byte-identical
  (RT/CHANGE.md:201-217; RT/prove.mjs:91-147,156-166).
- Every base row once; only declared new rows, as canonical `implemented` rows (RT/prove.mjs:126,139,150-155).
- Old-section map: every old heading once, with package, computed counts and homes (RT/prove.mjs:169-186).
- Increment B: new tree vs approved tree — labels, purposes, outcomes, heading set and order identical; row
  lists differ by exactly the declared moves and new rows; dropped `See also:` IDs kept as shares
  (RT/prove.mjs:63-89).
- Output: "1004 base rows preserved once; 5 new rows; ... 1554 physical lines accounted; 64 old headings
  mapped" (ed2ed92); after B, 8 new rows, 1652 lines (RT/prove-output.txt:1). Mutation pairs required (RT/CHANGE.md:229-236).

## 5. What went wrong or took long

- Wall clock (git): base 5b68a91 18:10 → checkpoint 1 21:15 (10-09) → increment 1 reviewed 23:43 → B inputs
  frozen 01:03 → B reviewed 10:02 → land with IDs 15:58 (10-10). About 22 hours.
- Increment 1: 7 builder runs (run 1 PARTIAL: proof failing, no mutations; RT/builder-report-1.md); 3 sol
  build SEND-BACKs; astra land 2 rounds over cap (RT/sol-build-r1..r3.md; RT/astra-land-r4..r5.md).
- Reviewer-found checker defects: plain and setext headings not boundaries; G IDs rendered as R; two-ID runs
  dropped the second ID (74 IDs); table boundaries (RT/sol-build-r1.md:5-51; RT/sol-build-r2.md:5-41).
- Proof hole: placeholder `untested | —` rows passed; a builder report claimed it fixed until the seat
  re-ran it (RT/astra-land-r4.md:3-21; docs/sessions/2026-10.md:181). A frozen intro needed amendment A1.
- Increment B: 4 builder runs, 3 sol rounds. Found: an undeclared heading added to tree and ledger passed;
  last-write-wins metadata parsing; a field check that called the renderer it checked; swapped rows passed;
  `Status:` after a non-requirement table passed (RT/sol-build-b-r1.md:5-36; -r2.md:5-15; -r3.md:5-17).
- Stacked ID lane: the tree read malformed rows the rail rejected; fix = count rows only through the
  rail's exported row test (docs/reviews/req-ids-2026-10-10/sol-build-r4.md:3-18).
- The first-verdict review log masked a SEND-BACK; the seat held the merge (MEM:40).
- Biggest cost: placement correctness came after the build — a second increment, not a pre-build JSON edit.

## 6. What a regroup tool should reproduce for any project

Keep:
1. Draft = IDs only; capability (purpose, outcome) → feature (purpose, status) → subgroup (purpose); rows
   listed at leaves only; flat subgroup IDs; every row once.
2. Pin the draft to the ledger it read and refuse a stale one. The lift's mapping pin (SHA-256) does
   this (LIFT/CHANGE.md:35).
3. A mechanical fact-check before the owner sees anything: ID set equal, one home each, counts.
4. Placement correctness BEFORE checkpoint 1: a lineage other than the drafter's, a skeptic per batch, a
   consistency critic, the "what breaks" home rule and the "directly constrains" share rule.
5. The top purpose in the owner's words; agent wording only as a proposal.
6. Declared destinations for prose between tables, never majority-computed.
7. A ~15-minute packet: one table (feature, rows, status mix), every heading with its purpose, moves and
   shares with reasons, refuted items, numbered decisions each with a recommendation.
8. Apply by tool from frozen, approved inputs, with an independent whole-line proof: now the lift
   (`scripts/requirements-lift.mjs`; R-1163 at LIFT/CHANGE.md:32).
9. Feature `Status:` from the project's rulings, inferences named; old→new heading pairs (the lift prints
   them, R-1162 at LIFT/CHANGE.md:31; INFERRED: no dated section map); governance "visible, not pinned".

Do not reproduce: per-project move and proof scripts and their 11 builder runs; arguing the whether.
Gap first: nana-pi carries 31 `Also applies:` lines (ran). The lift refuses any such line
(`scripts/requirements-lift.mjs:155-156`; R-1167 at LIFT/CHANGE.md:36). Shares must become a mapping field,
proved like rows, before nana-pi can be regrouped.

Not read or not recorded: the owner's actual minutes per checkpoint (only planned times exist); the internals
of the 10-agent proposal workflow (`RP/verifier-output.json` read only via its README summary).
