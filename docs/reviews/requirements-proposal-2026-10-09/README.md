# Outside requirements-rework proposal — seat verification, 2026-10-09

Subject: an outside assistant's proposal (pasted by the owner, 2026-10-09) to reorganise `REQUIREMENTS.md`
into 8 capabilities / 38 features / 21 subgroups, plus a 15-issue register (C02–C18) and a
feature-increment delivery process. Its explorer was built at e9ecc90 (blob 3500b86).
Checked read-only at HEAD 5b68a91 by the seat (mechanical checks) and a 10-agent workflow
(six issue verifiers, consumers/IDs, placement/purpose, prior art, completeness critic).
Raw verifier output with path:line evidence: `verifier-output.json`.

> **Correction, 2026-10-09 (Owner).** The tree is the owner's request: he asked astra for requirements
> categories because he cannot read or understand the flat ledger. He has decided to implement it.
> Below, "Added value is narrow" measures grouping overlap only, not understanding, and does not
> bear on whether. "Purpose ... a new synthesis" is wrong: it paraphrases the owner's own prompt to astra
> ("a customized agentic coding experience, that can be used for any development projects").
> The consumer, staleness and upkeep findings stand as constraints on HOW to land it.

## Mechanical checks (seat, scripted)

| Claim | Result |
|---|---|
| 1,002 rows preserved verbatim | TRUE at e9ecc90: 1,002 ids, 0 `raw_line`/`source_line` mismatches, no duplicates |
| 716 / 264 / 6 / 1 / 15 statuses | TRUE at e9ecc90. HEAD: 718 implemented (R-285, R-286 added) |
| 980 R ids, 19 unassigned in R-001–R-999 | TRUE at e9ecc90. HEAD: 17 unassigned; usable = R-287–R-299 (13). R-241 reserved, R-373–R-375 tombstones |
| 35 of 60 sections split across features | TRUE |
| One feature home per id | TRUE at e9ecc90; FALSE at HEAD within 4 h (R-285, R-286 unmapped; R-231 text changed) |
| Ledger churn | 268 of 357 commits since 2026-09-30 touch `REQUIREMENTS.md` |

## Issue verdicts

Severity is the verifiers' read; the proposal rated 10 of 15 High. No verifier rated any above Medium.
Every relaxing literal reading found is already caught by a cited, marked test.

| Issue | Verdict | Tracked already? | Fix kind | Notes |
|---|---|---|---|---|
| C06 trust precondition | CONFIRMED | new | wording | R-778 lost "affirmative" in the EARS split (404644f). R-024 grouped wrongly. Medium-low |
| C07 benign mention vs rm text | CONFIRMED | new | wording | R-764 predates the 10-07 R-040 restore. A third carve-out: interpreter deletion text. Medium |
| C17 adopt-structure config | CONFIRMED | new | wording | Skill also edits an existing config (RECONCILE). Pack README repeats the phrase. Low-medium |
| C04 duplicates | CONFIRMED | new | wording | Retire R-739 (dup of R-302). R-972 cites miss the same-role repeat; an unmarked check pins it. Low |
| C02 atomicity | PARTIAL | OQ 8a, 6b | policy (Owner) | "Split did not help" is WRONG: split exposed gaps in 27/46 and 66/83 rows (OQ 6b; plan L8-08) |
| C13 limits as obligations | CONFIRMED | new | wording | R-056 conflicts with implemented R-053 today. R-731 duplicates R-721/R-722 |
| C03 status vocabulary | CONFIRMED | 6b, plan 6.7 | wording (legend) | No-coverage-number rule already standing (plan :58). 75 untested cells are partial pins |
| C05 template text vs evidence | CONFIRMED | 6b / 6.7 | policy (Owner, in 6b) | Latent: no `REQUIREMENTS-general.md` consumer on this machine |
| C16 stale questions | CONFIRMED | new | wording | OQ 3 stale since written (test-runner test landed same commit c0a7849). HANDOFF still lists OQ 2 (closed) and 3. R-865 has no end condition |
| C08 named exports | CONFIRMED | new | wording + template tag | All 9 of 9 extensions default-export; pi's loader REQUIRES it. The standard is wrong, not the code |
| C09 Windows applicability | CONFIRMED | partly (support line) | wording | R-937 also contradicts the win32 dir-link ✗ test. R-938 has no actor |
| C10 land coverage | CONFIRMED | new | policy (Owner) | Sharper than stated: land-review fix commits go to main with no re-review (e9ecc90, 5b68a91 single-parent, after LAND-WITH-FIXES). AGENTS says "suite on the reviewed tip". No the owner ruling found for report-not-block or free-text `--exempt` |
| C14 blast radius | PARTIAL | OQ 10–12 | wording (evidence cell) | "derivable from the map" already qualifies it; missing is the incompleteness note. Callees clause unpinned |
| C15 suite of record | PARTIAL | OQ 6 | wording (evidence cells) | Sibling-repo half has 0 instances. Proposed metadata columns break the rail (exactly 4 cells) |
| C18 id capacity | CONFIRMED | OQ 9 (stale: "about 150 remain") | policy | 13 usable ids at HEAD. Grammar `[RG]-\d{3}` in both rails; a 4-digit row is SILENTLY skipped; work-project and basketball-geek copies are R-only |

Additional findings (no proposal counterpart): R-873–R-879 misfiled under 13c; R-642/R-643 under §5 not §7;
R-389 has no subject; OQ 9 count and plan :61 reserve stale; R-734 lane mode prints SUCCESS on a
`VERDICT: BLOCKED` report; tranche 4–6 lane corpora (briefs, reports, reviews) are only in session scratch.
Also (found 2026-10-09 in the req-tree lane): `packages/nana-pack/README.md:156` documents `pi-review … -m gpt-5.6-sol`;
pi rejects `-m` ("Unknown option: -m"). A README contract violation (G-012 class).

## The reorganisation itself

- Placement quality: 0 wrong of a 40-row deterministic sample (95% upper bound 7.2%); 66 minority placements read as deliberate.
- Added value is narrow. 90.1% of rows sit in their section's most common capability. Outside the pack,
  each package maps to one capability at 93–100%. The layer cuts across only inside `nana-pack` (443 rows, 44%).
- Purpose: the draft's "help a developer…" is a new synthesis, not `OBJECTIVE.md` ("build products with agents,
  with nana-pi as the shared toolkit and experience"). It never cites the objective, priority, appetite or review date.
- Frozen or idle: desk, stage and desk-service rows = 161 (16%); with the idle bench, 239 (24%). CAP-05/06/08 are mostly this.
- Consumers: a physical reorder is mechanically safe (nothing parses headings or order), but breaks the
  split-placement ruling for 7 split-born rows and every positional link. A file split breaks both rails,
  four tests and ships through a template tag. The explorer is a full second copy with no upkeep check.
- Upkeep by form: full copy = stale same day; id→feature sidecar = stale on every row add (5–122/day in the program);
  section→capability table = stale only on a new section (53→62 in a week, zero rows ever changed section).

## Process proposals vs prior art

| Proposal | Present today | Seat view |
|---|---|---|
| Bounded feature change record | Lane brief template (DRAFT): goal, appetite, NOT, allowlist, doneWhen; no requirement delta. Appetite advisory; 1 of 42 October briefs states one | Promote the template; do not add a new object |
| Two human checkpoints per increment | Program-level rulings; per-lane acceptance by model reviewers | ~80 asks over 40 lanes vs the three-blocking-ask limit; the owner said "Keep going" mid-program. Reject per lane |
| WIP limit: one change awaiting review | None; attention trial limits asks, not changes | Serialises the program. The owner's call at the 10-20 trial verdict |
| Feature acceptance package | Pieces in nana-land output, review-ledger report, builder report, session archive | Already the held HTML land page (writing-trial verdict 10-18) |
| Metadata columns (method, env, revision) | Rail requires exactly 4 cells | Reject as stated; a sidecar if ever |

## Seat recommendation

1. Now, nana-pi-only wording lane (needs the owner's go; the priority's appetite is spent): C03 legend, C04, C06, C07,
   C09, C13, C14/C15 evidence cells, C16, C17, the misfiled rows, R-389, stale OQ 2/3/9 and plan :61, AGENTS
   "reviewed tip" line. Cite by id. Independent reviewer (rows change meaning).
2. Separate template change: C08 (G-005 + nana-standards + requirements skill), ships with a tag.
3. Before the next build program: the id format (13 left).
4. SUPERSEDED by the owner 2026-10-09: implement the tree. Land it inside `REQUIREMENTS.md` (one copy), not as a
   second full copy. C10 landing policy still goes to the 10-20 review.
5. Hold CAP-05/06 mapping until the 10-23 desk usage ruling (D4).
