# Fact-check: plan-lift/CHANGE.md against nana-pi main d9cf0bc (repo read-only)

Probes are in `plan-lift/fc/`. `hand-lift.mjs` is §3.3 written independently from the plan text, with a §3.5-style proof
covering checks 1, 2, 3, 6 and 7. `tamper.mjs` runs the tampered outputs. `git/` holds scratch repos. `k1.mjs`, `k2.mjs` and `k3.mjs`
probe the skill-claim and readme checks. Ledger inputs are the copies in `plan-lift/ledgers/`, read only.

## Claims

**Header, §1**
1. VERIFIED: main is d9cf0bc and the tree lane has landed (`git log -1`).
2. VERIFIED: no nana-setup or hook change, so no install check (CLAUDE.md, install check rule). A gate lane gets two plan rounds (CLAUDE.md, working pattern).
3. VERIFIED: the builder is Sonnet 5 as a subagent. The 10-13 roster split gives larger or riskier lanes to Sonnet (shared `reference_roster.md`).
4. VERIFIED: the queue is at HANDOFF.md:78-79, and the tree plan's queue is at tree CHANGE.md:210-212.
5. VERIFIED: the no-tree line is at requirements-tree.mjs:416-418. The report reaches it through checkTree (product-report.mjs:16,205-207).
6. VERIFIED: SKILL.md:128 names "a lift into the tree, with every row kept byte-identical" and gives no command.
7. VERIFIED: tree CHANGE.md:26 says copier never rewrites a ledger (copier.yml:16 skips REQUIREMENTS.md). Tree residual 1 is at :224.
8. VERIFIED: work-project has 365 rows and Parts A–F (# at 13/221/318/400/482/601). Its three headless fragments are 149–165, 520–525 and 529–532.
9. VERIFIED: basketball-geek has 171 rows against 165 at HEAD, so 6 rows are uncommitted.
10. VERIFIED: trading-zone has 197 rows. Part G runs 151–208, and seven product sections (## 5–11, 209–325) follow it.
11. VERIFIED: yokai-world has 35 problems: 23 orphaned rows, 8 nesting, 4 Status (ledgers/yokai-world.tree.out).

**§2 Requirement delta**
12. VERIFIED: the highest ID is R-1161, at REQUIREMENTS.md:1341. R-1162–R-1169 have zero hits in REQUIREMENTS.md and the tests. They appear only in the tree corpus.
13. VERIFIED: FEAT-028 (:1315) holds R-287–R-294 and R-1157–R-1161. FEAT-032 (:1507) holds R-1154–R-1156 (:1522-1524). Neither has a SUB child.
14. VERIFIED: each new row has exactly one `shall` outside code spans (counted). No existing row overlaps (grep for lift, regroup, "Not yet sorted").
15. VERIFIED: the leaf total is 1,128 and there are 68 headings (ran checkTree). Eight leaf rows make 1,136.
16. VERIFIED: R-291's literal is at requirements-tree.test.mjs:40,54,55. R-291's Evidence cites another title, so the rename edits no row.

**§3.1 Modules and tunables**
17. VERIFIED: the import lines exist. requirements-tree.mjs: parseLedger :60, checkTree :428, noTreeProblem :416, ledgerReadProblem :423, readRequirementRows :231, expandRowIds :296, REPO_ROOT :15. requirements-trace.mjs: :21,25.
18. VERIFIED: TABLE_HEADER, TABLE_DELIMITER and markdownTableCells are unexported, at :20-27. compressRowIds sorts at :218. prove.mjs uses 3-digit IDs only (prove.mjs:45,87,103).
19. WRONG (minor): the seed closing lines are `REQUIREMENTS.md.jinja:110,112,119` only in the Python seed. The TypeScript seed has them at :108,110,117. The text is the same.
20. VERIFIED: the cap rationale matches tree CHANGE.md:14-15 (30,000 characters; 2,000 lines). `|---|---|---|---|` matches TABLE_DELIMITER (:21).
21. VERIFIED: Node 22.18 is needed for the .ts rail (README.md:80-81; requirements-trace.mjs:21 imports a .ts file).

**§3.2 Mapping**
22. VERIFIED: req-tree's mapping carries no row text (req-tree CHANGE.md:124-127). The split is `/\r?\n/` after the BOM strip (requirements-tree.mjs:61).
23. VERIFIED: the example values match the trading-zone copy: 197 rows, head through 54, Part G at 151, G1 at 161 with G-001/016/002/003/017, Open questions at 363.
24. VERIFIED: work-project has two `## 36b.` headings, at 484 and 570.
25. VERIFIED: the reserved nodes are at requirements-general.md:13 (CAP-90), :18 (FEAT-900) and :31-86 (SUB-900–904). Heading and purpose lines carry no Jinja. R-1151 is at :877.

**§3.3 Default mapping**
26. VERIFIED: the flat test matches :442-444. A lone SUB still yields the no-tree line, so "no SUB heading" is needed. A near-miss heading replaces the line. See gap G1 on `n`.
27. VERIFIED (ran hand-lift): basketball-geek-HEAD gives 1/9/0. trading-zone gives CAP-01 (FEAT-001–004), CAP-90 (FEAT-900, SUB-900–904), CAP-02 (FEAT-005–011). work-project gives 6/41/2 with 3 header pairs. All three pass the checker with 0 problems.
28. VERIFIED: tree residual 11 is at CHANGE.md:234. work-project's Part F has R-600–R-610 and no G row (no G IDs in the copy).
29. WRONG (minor): "SKILL.md:126 points at them" (both kept sections). It names `## Open questions` only. No skill names `## Deliberate omissions` (grep).

**§3.4 Apply and layout**
30. VERIFIED with a caveat: the segments and parsed.lines align by index for LF, CRLF+BOM, mixed endings and lone CR (ran). With a final newline, parsed.lines has one extra "".
31. VERIFIED: parseLedger needs the byte-exact header (:68). work-project §36 has six prose paragraphs between its fragments (503/518/527/534/544/560).
32. VERIFIED as cited: 49 headings rewritten, 147 lines inserted and 0 problems (research-ledgers.md:41). The hand run also gives 49 headings and 0 problems.

**§3.5 Proof**
33. WRONG: "Its standard is req-tree's … every line accounted". req-tree accounted every physical line, blanks and the final newline included (req-tree CHANGE.md:199-217). research-adopt.md:65 (§4B.7) asks the same. This proof skips blank lines (residual 1).
34. VERIFIED (ran tamper.mjs on two hand-lifted ledgers): each tamper is named.
    - A dropped row, a duplicated row and a renumbered ID are named by check 2.
    - A trailing space and a CRLF on one row are named by check 3.
    - A row moved into a new fence or an existing one, a row moved to another leaf and a swapped pair are named by checks 6 and 7.
    - A heading-ID collision is named by check 7 (duplicate heading ID).
35. WRONG: "one placement bug cannot pass both". Check 6 tests the output against the mapping, and the lift module builds the default mapping. See W4.

**§3.6 Command, gate, verify**
36. VERIFIED: `$HOME` works in PowerShell 5.1 (roster CHANGE.md:166-167). req-tree's mover defaulted to nana-pi (move.mjs:122,142). The exit codes match the checker (:447-485).
37. VERIFIED (ran fc/git): `diff --quiet HEAD --` passes an untracked file (0) and catches a staged-only edit (1). It is clean on an autocrlf CRLF checkout (0) where a byte compare differs (1).
38. VERIFIED (ran): `ls-files --error-unmatch` exits 1 on an untracked file and 128 without git. nana-land.mjs:25-28 uses `diff --quiet HEAD --`.
39. VERIFIED (ran): `git -C proj show HEAD:./REQUIREMENTS.md` works from a subfolder. Without `./` it fails.
40. VERIFIED (ran r4, r7): verify reads blobs on both sides, so an LF blob and a mixed CRLF blob under autocrlf both match. The `eol=` attribute case is still unrun, as the plan says.
41. VERIFIED: the trace module's guard uses realpath (:58), the tree module's uses resolve (:487), and the link exit is tree CHANGE.md:229.

**§3.7–§4 Skill and scope**
42. VERIFIED: templates-render.test.mjs:452-470 holds checkRequirementsSkillTreeText, and its CARVE at :453 pins R-1154 and R-1155. CHECKER_SKILL_CMD is at :185.
43. VERIFIED: only the requirements skill reaches both seats, since CLAUDE_SKILLS (steps.mjs:58) excludes the five scaffold and adopt skills. The win32 copy is at steps.mjs:217-226.
44. WRONG: "README.md:64 gains the lift command" is not enough scope. See W2.
45. VERIFIED: no lane is in flight. `git worktree list` shows main and land/t3, which main contains. feat/t3-land-b (2026-10-08) edits REQUIREMENTS.md and docs/code-map.md.
46. VERIFIED: scripts-layer imports are free (code-map.config.json). scripts/test.mjs:20 collects the new test file.

**§5 Verification**
47. VERIFIED: own() is at requirements-tree.test.mjs:239. A seat-titles.mjs and seat-mutate.mjs pair exists in the tree corpus.
48. WRONG: K1, "the existing R-598/R-629 titles red". See W1.
49. VERIFIED: the Windows CI leg runs `shell: bash` with continue-on-error (ci.yml:50,53).
50. VERIFIED (ran hand-lift): the acceptance counts hold. yokai-world is refused as not flat, and nanaclaw has no rows.
51. VERIFIED as achievable: CRLF, BOM+CRLF, mixed, trailing-space and unterminated copies of basketball-geek each keep 171/171 rows byte-identical (variants2.mjs). The seat's sim changed 114 of 171 on mixed endings (variants-output.txt:3), so this is a target the sim did not meet.
52. VERIFIED: no refusal trigger fires on the three flat ledgers. They have no field-label prose, setext or level 4+ heading, or duplicate ID (grep).
53. VERIFIED: rails are heading-blind (research-adopt.md:93). The tree residuals cited (2, 5, 6, 10, 11) say what the plan says (tree CHANGE.md:225-234).

## WRONGs that change the plan

**W1. K1 cannot red.** The skill-claim judge makes no path or flag claim from the `node "$HOME/nana-pi/…"` form.
- k1.mjs: a `--bogus` flag on the requirements-tree command gives 0 flag and 0 path problems. A bare `scripts/…` path gives 1 flag problem.
- A bare path cannot go in the skill. Its surfaces are python-scaffold, typescript-scaffold and checkout-render-only, so R-598 would fail there (k2.mjs).
- Fix: T29 reads requirements-lift.mjs and checks that every flag the skill shows appears in its source. Or drop K1 and name the gap.

**W2. readme:check goes red.** documentedProblems requires every file under `scripts/` to be named in some README (readme-check.mjs:456-463, 530-546; `undocumented` is empty).
- The plan adds requirements-lift-proof.mjs but names only the lift command at README.md:64.
- k3.mjs: "script 'requirements-lift-proof.mjs' is not documented in any README".
- Fix: add the proof module's name to README.md in §4.

**W3. The proof is weaker than the standard it claims.** req-tree and research-adopt §4B.7 account for blank lines; this proof does not.
- The seat's own sim accounted 692/692 lines.
- Fix: either account for blank lines (copied runs plus declared insertions), or drop the "req-tree standard" sentence and keep residual 1.

**W4. Independence holds only for apply, not for the default builder.**
- A builder bug that reorders rows inside one section (sorting by ID, say) passes check 6.
- It prints no move line, because the old and new heading pair is the same.
- `--verify` reruns the same builder, so it passes too. Only T4's fixture oracle catches it.
- Fix: in a run with no `--mapping`, the proof also checks each leaf's rows in input file order (R-1165 "moves no line out of its section's order").

## Gaps (precision, not false claims)
- G1. The flat test's `n` must be the raw row-line count. That count comes from a private function (requirements-tree.mjs:407-413), and the plan exports nothing else. The exported readRequirementRows gives work-project 338, not 365, so the deep-equal fails and the default refuses work-project (ran). Name `n`'s source.
- G2. T6 omits a duplicated row, a renumbered ID, a row moved into a fence and a heading-ID collision. The proof catches each (item 34), so add them to T6.
- G3. R-1167 names no refusal for invalid mapping JSON, a UTF-8 BOM on the mapping, or a wrong `lift` version. A BOM breaks JSON.parse, and Windows PowerShell 5.1's `-Encoding UTF8` writes one. It also names none for a ledger with a repeated row ID, where check 3's "the input's for that ID" is undefined.
- G4. work-project has 19 padded delimiters (`| --- | --- | --- | --- |`) under exact headers. §3.4 does not say whether they are rewritten. If they are, "the default diff is heading rewrites plus inserted lines" is false for work-project.
- G5. The tree corpus guard (acceptance.mjs:475, "R-1162 to R-1169 are unused") reds if rerun. It is outside the suite, so it is harmless. The mutation table skips #9.
- G6. INFERRED: the FEAT-028 and FEAT-032 assessments carry a `stamp`, so the new rows probably mark them out of date in the product report. The stamp's meaning was not read.
- G7. Ran: a staged edit reverted in the worktree passes `diff --quiet HEAD`. A commit by path overwrites it, so it is harmless.
