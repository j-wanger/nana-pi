# Fact-check (repo) — regroup CHANGE.md draft 1, at main e451c90

Method: opened every cited file:line at e451c90; "Ran" = run here on scratch copies under `plan-regroup/fc/` (lift + templates copied; a 4-row flat fixture; trading-zone and yokai-world ledgers copied before any run). 8 WRONG.

## Claims

### Header and §1
1. main e451c90, lift landed — VERIFIED (`git rev-parse`; HANDOFF.md:31).
2. Sonnet builds larger lanes (HANDOFF.md:25); FORMAT = two plan rounds — VERIFIED (HANDOFF.md:25, :18).
3. No nana-setup or hook change, so no install check — VERIFIED (CLAUDE.md install-check rule scopes to `packages/nana-setup/` or a hook).
4. Queue: regroup now, feature-oriented next, two lanes max (HANDOFF.md:79-81) — VERIFIED; ruling at HANDOFF.md:29.
5. Skill stops at the lift, "name no regroup command until that lane lands" (SKILL.md:132) — VERIFIED.
6. Lifted purposes read "Not yet sorted:" (requirements-lift.mjs:24) — VERIFIED, except reserved nodes, which take the seed's text (requirements-lift.mjs:731-746).
7. A hand mapping already applies with proof: move, merge, empty proposed feature — VERIFIED (Ran: flat merge + move + `proposed` feature with `rows: []` and a `from: []` feature, exit 0).
8. The plan prints only `<id>: <n> row(s)` and move lines, no label/purpose/status (:968-978) — VERIFIED (:976, :978; proof line :980).
9. basketball-geek's draft untracked, six questions open (C §5) — UNVERIFIABLE from this repo (another project; research-understand.md:104).
10. 11 builder runs — VERIFIED (build-1..7 + build-b1..b4 logs in docs/reviews/req-tree-2026-10-09/). "About 22 hours" — UNVERIFIABLE (corpus commits span 2026-10-09 20:47 to 2026-10-10 10:04; B:90 counts to a later land).
11. One-page outline; "Do one review on all 1009 placements"; 12 reviewers — VERIFIED (req-tree-2026-10-09/outline.md; placement-review.md:3; CHANGE-B.md:10).
12. aml-desk 365 rows, basketball-geek 165 at HEAD — VERIFIED (scratch copies: 365; REQUIREMENTS.HEAD.md 165, 171 dirty).
13. trading-zone 197 rows, cited to "C §6" — WRONG cite: C §6 (research-understand.md:107-118) has no trading-zone column; the 197 is docs/reviews/lift-2026-10-14/research-ledgers.md:64 (count VERIFIED on a copy: 197, 0 shares).
14. None of the three carries a share line (lift CHANGE.md:205-206) — VERIFIED by grep on copies (0/0/0); the cite shows clean dry runs, not a share count.
15. nana-pi has 31 `Also applies:` lines, which the lift refuses — VERIFIED (31 at line start, 35 anywhere; refusal requirements-lift.mjs:226-227; real-dry.txt).
16. 22 G rows outside the seed's subgroups — VERIFIED (REQUIREMENTS.md:1558-1579 directly under FEAT-033 :1535; lab-dry.txt names all 22).
17. T22b's closed MUST: shares refused in every form — VERIFIED (requirements-lift.mjs:155-157; requirements-lift.test.mjs:1298-1346).

### §2 Requirement delta
18. Highest ID R-1169 at REQUIREMENTS.md:1532 — VERIFIED.
19. "R-1170 to R-1181 are unused (grep count 0 each, at e451c90)" — WRONG: R-1170 occurs 6 times at HEAD, as the lift's mutation fixture row (docs/reviews/lift-2026-10-14/seat-mutate.mjs:267 and five seat-mutate-output*.txt). R-1171–R-1181 are 0. None is in REQUIREMENTS.md or code, so the IDs are free.
20. R-1178 goes in FEAT-032 after R-1169 — VERIFIED (FEAT-032 :1514, R-1169 :1532, FEAT-033 :1535).
21. FEAT-040 unused; CAP-07 holds FEAT-028 — VERIFIED (highest FEAT-039 :1581; CAP-07 :1311; FEAT-028 :1315).
22. Reserved CAP-90, FEAT-900, SUB-900–SUB-904 — VERIFIED (requirements-lift.mjs:42).
23. R-1167 text holds "an `Also applies:` line"; R-1166 "with or without a tree" — VERIFIED (REQUIREMENTS.md:1347, :1346).
24. Leaf total literal 1,136 at requirements-tree.test.mjs:40 → 1,145 — VERIFIED (:40, :54-55).
25. "headings 68 → 69 if J5 holds", with only R-291's literal in scope — WRONG (incomplete): `headings.length === 68` is also pinned at requirements-tree.test.mjs:28 (R-288 check) and :299 (R-1158 CRLF check). FEAT-040 reds both; §4 and T14 name neither.

### §3 Design
26. The lift's shape check reads only its own fields, so it ignores `regroup` (:415-469) — VERIFIED (Ran: a top-level `regroup` key, exit 0).
27. `stringsOf` scans every string for CR, LF, U+FFFD (:470-475, :491-494) — VERIFIED; a `why` or `notes` string with a line break is refused by the lift itself.
28. Pin, byte and BOM rules in `readMapping` (:478-500) — VERIFIED.
29. Row text never appears in the mapping (lift CHANGE.md:56) — VERIFIED.
30. A pair = rows leaving the node naming their heading, or an old tree heading folded in (:605-635) — VERIFIED as code.
31. "Vanished IDs are merges, which the lift prints (:619)" — WRONG for flat input: :610 builds `treeIdAt` only from headings carrying a tree ID, so :619 never fires on a flat ledger. Ran: default mapping of a flat fixture, `## 2. Two` folded into FEAT-001 (default FEAT-002 gone): dry run printed only `## 1. One -> FEAT-003`, exit 0. Every named user and the rehearsal are flat.
32. Proposed features cannot hold rows (:538; requirements-tree.mjs:189-191) — VERIFIED.
33. The lift checks only ID uniqueness (A §4) — VERIFIED (:521).
34. nana-pi retires merged IDs (REQUIREMENTS.md:43-45) — VERIFIED.
35. `parseLedger` :60, `readRequirementRows` :231 — VERIFIED. The second reads only tables whose header equals `| ID | Requirement | Status | Evidence |` exactly (requirements-tree.mjs:20, :68); all three downstream copies use it (45/9/16 tables).
36. The plan loop destructures two elements (:978) and is the only `detectMoves` caller — VERIFIED (grep).
37. `PROBLEM_LINE_CAP`, `UNSORTED_PREFIX` exported — VERIFIED (:40, :24).
38. Main guard by realpath (:1117) — VERIFIED.
39. "The requirements skill is the only one both seats load (steps.mjs:58)" — WRONG: steps.mjs:58 links five pack skills into Claude Code (requirements, spec, py-lint, py-review, py-test); only win32 skips four (:59, :336). The conclusion holds: a new skill would need a `CLAUDE_SKILLS` edit, so a requirements-skill paragraph is right.
40. `--emit-mapping` gives the start: default for flat, identity for a tree (:931-936, :957-963) — VERIFIED, but it refuses a partial tree. Ran: yokai-world (46 tree headings) and 5b68a91 both refused, so step 1 has no start for them.
41. Placement criteria (placement-review.md:5) — VERIFIED.
42. `--write` needs the proposal committed and clean in every worktree — VERIFIED (:990-997; R-1164 :1344).
43. Step 6, "the reviewer runs `--verify <base>`" — WRONG: with no `--mapping`, verify rebuilds the default or identity mapping (:1081-1093) and refuses a regrouped HEAD. Ran: `--verify <base>` → `line 5 differs from HEAD`, exit 1; `--verify <base> --mapping proposal.json` → exit 0. The same error recurs in §5 acceptance ("`--verify <base>` exits 0").
44. The five pi skills' "then a regroup … that the owner approves" stays true — VERIFIED (CARVE, templates-render.test.mjs:455; SKILL.md:128).
45. The proof line is identical for LF, CRLF and BOM ledger copies (R-1177 feasibility) — VERIFIED (Ran: same proof line on all three).
46. Node-level field typos are caught — VERIFIED (Ran: `lable` and `outcom` both refused by the proof, "heading sequence differs").

### §4 Scope
47. templates-render.test.mjs:454-499 is `checkRequirementsSkillTreeText` — VERIFIED (:454; T29 helper :483-498; call :499).
48. README must name the new script (lift CHANGE.md:149) — VERIFIED; see consumer C below for the flag rule.
49. `~/nana-pi-wt/land` (`land/t3`) is stale — VERIFIED (`git worktree list`: 4ea846e).

### §5 Verification
50. T20's move lines stay green — VERIFIED (requirements-lift.test.mjs:1190, R-1166 check).
51. T13 phrase "only after the owner's yes" — WRONG as a check: the phrase already sits in the lift paragraph at SKILL.md:132, pinned by T29 (templates-render.test.mjs:484). A whole-skill include stays green when the regroup paragraph drops it, so mutation row 9's third item survives unless T13 scopes to that paragraph.
52. 5b68a91: 1,004 rows, 0 shares, default refuses at line 1,320 — VERIFIED (Ran).
53. 5b68a91 holds no tree text outside docs/reviews/ — VERIFIED (`git grep` for CAP-0x/FEAT-0xx: none).
54. 85.9% / 94.1% (C §2) — VERIFIED (ground-truth-output.json).
55. "C §2: 72–86% of rows follow their test file's cluster" as the basis for dozens of reasons on a 365-row ledger — WRONG scope. Those figures are over marker-traced rows of nana-pi (849 of 1,136) and basketball-geek (105/145). For aml-desk, C §3 gives 52% (191/365) placeable by test evidence (research-understand.md:57).
56. 14 aml-desk modules span three or more sections — VERIFIED (research-understand.md:45).
57. Windows leg runs Git Bash and is non-blocking — VERIFIED (.github/workflows/ci.yml:50, :53). "The PR's" leg — UNVERIFIABLE: by default there is no PR, and CI reports only after a land (HANDOFF.md:106).
58. Node 22.18 or later — VERIFIED (README.md:80).

### §6 Decisions and residuals
59. Jake decides every tree change, shares included (REQUIREMENTS.md:34, :36) — VERIFIED.
60. J6: G rows must sit in their seed subgroup (:532-536) — VERIFIED as a refusal, not a placement: identity fails on all 22. Not named: a recorded decision, "G rows stay in FEAT-033 by declared design" (placement-review.md:5). J6 reverses it, and the lift leaves no other route.
61. J6 "78 changed lines" — UNVERIFIABLE (scratch; research-lift-api.md:47).
62. Residual 3 = lift residual 2 (aml-desk §36) — VERIFIED (lift CHANGE.md:229).
63. Residual 7: the Windows seat copies the skill, so a re-install updates it (steps.mjs:217-228) — VERIFIED.

## Consumers the plan does not name
A. yokai-world: 1,359 rows, 0 shares, 46 tree headings, partial tree. HANDOFF.md:63 says it needs "a hand-written grouping", which is a regroup proposal. The plan's user list omits it, and `--emit-mapping` refuses it (Ran).
B. aml-desk has two identical headings, `## 36b. Build at production size`, at lines 484 and 570. `detectMoves` dedups pairs by heading text (:619, :628), and the reason schema also keys by text, so the two sections collapse into one pair. A third element built at first push would drop the second section's rows.
C. readme-check gives each line's flags to the first bare `scripts/…` path on that line (template readme-check.mjs:399-407). The lookbehind at :152 skips `$HOME/nana-pi/scripts/…`. README.md:64's first script is `scripts/requirements-tree.mjs`, so `--proposal` or `--out` added there reds readme:check.
D. T29's flag scan covers every SKILL.md paragraph matching /lift/ (templates-render.test.mjs:490-497). A regroup flag in a separate backtick span in such a paragraph must exist in the lift's source, or T29 reds.
E. Blind rehearsal leak (INFERRED): ~/.pi/agent/nana-knowledge/sources.json indexes /Users/jwang/nana-pi/docs, which holds docs/requirements-tree.md, the ruled tree. Project memory holds project_requirements_tree.md. A Claude Code main-session rehearsal could be fed the answer.

## WRONGs that change the plan
1. (43) The reviewer's `--verify <base>` refuses every regroup unless it also passes `--mapping <proposal>`. Fix §3.4 step 6, §5 acceptance and the R-1178 skill text, and add a test that pins the full verify form.
2. (31, with B) On flat input, folds never print, and no input heading has an ID. R-1172 asks no reason for a merge, and R-1176's rename list is always empty. For all three users and the rehearsal, the page hides which old sections each feature absorbed. Add each node's `from` headings to R-1175, and define flat merge pairs, or record this as a residual.
3. (25) J5 also breaks the 68-heading literals at requirements-tree.test.mjs:28 and :299. Add both to §4 and T14, or the suite reds on the FEAT-040 heading.
4. (51) T13's "only after the owner's yes" cannot red. Scope T13's phrases to the regroup paragraph.
Minor, no plan change: 13 (cite), 19 (fixture mentions only), 39 (evidence, not conclusion), 55 (the reason-count estimate on aml-desk is optimistic).
