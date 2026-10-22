# Fact-check (external and owner's-seat view) of the regroup CHANGE.md, seat draft 1

*nana-pi `main` `e451c90`, 2026-10-15. Read-only on the repo. "Ran" means run on scratch copies in `plan-regroup/tmp-tests/` (work-project ledger copied from `subjects/`). INFERRED means neither read nor run.
Stakes: medium blast, reversible. The page decides what the owner approves, and every later feature-oriented lane trusts the tree it produces.*

## Top three issues
1. **The page cannot be judged in one sitting at work-project size, and nothing tests that it can.** R-1175/R-1176 put every row's text on the page. For work-project that is at least 19k words, about twice the precedent packet for 1,009 rows. No reading budget is set, and no rows are triaged (§1). The plan names this as its "claim most likely wrong" (CHANGE:171). Its test is the blind rehearsal, which measures agreement and sets no threshold (CHANGE:164-167).
2. **The placement review is the plan's trust anchor, and nothing checks it.** `regroup.review` is free text that only has to be non-empty (R-1174). The fallback reviewer is the drafter's own lineage (CHANGE:102), yet J3 tells the owner "by another lineage" (CHANGE:183). `pi-review` is not on PATH on Windows. Acceptance covers one of four seat and OS combinations (§3).
3. **No cost is stated: no tokens, no wall clock, no owner minutes.** The precedent took about 22 hours and 27 review runs (B §3, §5). The work-project read set alone is about 110k tokens (INFERRED). §3.4 drops research C's six-worker split and keeps one drafter (§5).

## 1. Can a human judge a 365-row regroup in one sitting?
- **Ran.** work-project holds 365 rows with 17,742 words of requirement text (median 33 words, p90 79). The R-1176 appendix alone carries all of it.
- **Ran.** Moved rows on top: a section-preserving proxy (move only rows whose test file's majority section differs) gives 37 moved rows, 19 move pairs and 1,192 words. That supports "dozens" of reasons. A regroup that changes the feature cut moves more (INFERRED).
- **Page estimate.** At least 19k words before the tree, questions and renames. At 238 wpm, the mean adult silent rate for non-fiction [1], one read takes about 80 minutes. Judging takes longer than reading.
- **Code-review data.** Defect finding drops after 60-90 minutes and above about 500 LOC per hour [2]. That is an analogy for rows, not a measurement.
- **The precedent is smaller.** At checkpoint 2, the owner read `outline.md` (3,072 words) and `placement-review.md` (6,446 words), planned at about 20 minutes (`docs/reviews/req-tree-2026-10-09/CHANGE-B.md:159-165`). That is about 9.5k words for 1,009 rows, and neither file lists every row's text. Research B §6 item 7 says to reproduce "a ~15-minute packet", with moves, refuted items and decisions, not every row. J2 cites this precedent (CHANGE:181) for a page roughly twice its size. "One-page outline" (CHANGE:18) is in fact 163 lines.
- **No triage.** Research C §6 counts 174 work-project rows (74 local plus 100 sibling-cited) placed by text alone, the riskiest placements. The page does not mark which rows were placed by evidence and which by text. Contested rows exist only as free-text `notes`.
- **Fix (seat's suggestion).** Set a sealed page budget near the precedent (about 10k words). Mark each row's placement basis. Put first the rows the reviewer contested, the text-placed rows and the moved rows. Move the full appendix to a reference file. In the rehearsal, record how many minutes the owner spends reading.

## 2. Tracing to the owner's words, and scope creep
The owner (2026-10-14): "understanding existing repo and turn into feature trees, then development really becomes feature oriented". The queue line reads: "An agent reads an existing repo and proposes its feature tree; the owner approves it, and the lift's tool applies it" (`HANDOFF.md:80`).
**These trace:** the proposal format, the skill procedure, a review page (the lift prints no labels, `requirements-lift.mjs:968-978`), the lift as the tool that applies it, and a review of every placement. The last one traces to "Do one review on all 1009 placements" (B §3). Shares partly trace to "allow multiple features pointing to the same requirements" (B §3).
**Scope creep, each with a reason:**
1. **Gap discovery** (proposed features, R-1173's path rules, a pass over the import graph). It is requirement discovery, which the audit mode already owns (`SKILL.md:134-150`). It costs one row, four mutation pairs and a judgment pass, and none of it is needed to tree the existing rows. Arguable under "understanding existing repo"; defer it or keep it as `notes`.
2. **R-1177, a byte-identical page across LF, CRLF and BOM copies.** The page is not the record: S5 makes the committed proposal the record (CHANGE:191). No consumer needs the page to be deterministic. It costs one row and three mutation pairs.
3. **R-1174's non-empty checks on `read` and `review`.** These are self-reports the checker cannot verify, so the checks are ceremony. The `read` paths are not even checked for existence, while evidence paths are (R-1173). Either structure them so they can be checked (§4) or drop the checks.
4. **R-1171 clause 2 (S9, an ID re-pointed).** It is vacuous on every flat ledger, because a flat ledger has no input tree IDs (`detectMoves` `treeIdAt`, `requirements-lift.mjs:610`). All three users are flat (CHANGE:20).
5. **J6, moving nana-pi's 22 G rows into CAP-90.** It changes the tree the owner approved on 2026-10-10, and nobody asked for it. Regrouping nana-pi at all rests on `HANDOFF.md:63`, a limit the seat wrote, not on the owner's quoted words.
6. **Declared share adds and drops in `regroup-shares` (J4 option B) instead of carry-only.** It partly traces to the owner's shares request. It is a GATE lane, which doubles the program's review cost. Carry-only lets downstream projects regroup now; adds can follow.
7. **T12, the symlink run.** Minor; it mirrors the lift's own test.

## 3. How each seat runs it (macOS and Windows)
| Seat · OS | Skill source | Command | Placement reviewer | Tested by the plan? |
|---|---|---|---|---|
| Claude Code · macOS | symlink of the pack's skill (`steps.mjs:58`) | Bash runs `node "$HOME/nana-pi/scripts/requirements-regroup.mjs" …` | `pi-review` if pi and the roster exist, else a Claude subagent (same lineage) | **Yes**, basketball-geek end to end (CHANGE:162) |
| Claude Code · Windows | a **copy**, stale until `nana-setup install` is re-run (`steps.mjs:217-228`; residual 7) | Bash is Git Bash; MSYS converts `/c/Users/…` for node.exe (INFERRED, not run) | bare `pi-review` is **not on PATH** (`doctor.mjs:605`); needs `node "$HOME/nana-pi/packages/nana-pack/bin/pi-review.mjs"` (pack `README.md:228`) | No. CI leg is Git Bash and non-blocking (CHANGE:169; `CLAUDE.md:5`). The owner's Windows check is still blocking (`HANDOFF.md:90`) |
| pi · macOS | pack `pi.skills` (`packages/nana-pack/package.json`) | pi's bash tool | `pi-review`; a "fresh subagent" needs the third-party pi-subagents (`packages/nana-setup/README.md:100,119`) | **No pi-seat run at all** |
| pi · Windows | same | the PowerShell form has never run (residual 6) | node form of `pi-review` | No |
- **pi entry path.** `adopt-py/SKILL.md:149-151`, `adopt-ts:171-173` and `adopt-structure:172-174` say "then a regroup … that the owner approves" but give no command and do not point to the requirements skill. A pi agent reaches the procedure only if R-1178's "regroup" description triggers (INFERRED). CHANGE §3.5 freezes those five skills.
- **Factual error.** "The requirements skill is the only one both seats load (`steps.mjs:58`)" (CHANGE:92-93) is false. That line lists five shared skills: requirements, spec, py-lint, py-review and py-test. The conclusion (no new skill needed) still holds.
- **Windows encoding.** PowerShell 5.1 `>` writes UTF-16. The lift refuses it as NUL (`requirements-lift.mjs:482`), so it fails closed. Step 4's bare `pi-review` is a hard failure on Windows. R-1178's T13 should pin the node form.

## 4. What an LLM grouping gets wrong, and whether the deterministic layer catches it
| Failure (literature or practice) | Caught? | Where |
|---|---|---|
| Hallucinated row ID, including a range spanning missing IDs | **Yes** | `validateMapping` "unknown" `requirements-lift.mjs:528`; range expansion `requirements-tree.mjs:296-314` |
| Lost or forgotten row (83.7% of zero-shot LLM taxonomies omitted items; 51 hallucinated items in 129 [3]) | **Yes** | "missing from the mapping" `:561-562`; listed twice `:529` |
| Hallucinated or dropped old heading or `from` line number | **Yes** | exact line text `:514`; named exactly once `:554-560` |
| Stale proposal after a ledger edit | **Yes** | pin SHA-256 `:495-496` |
| Row text altered | **Yes** | the proposal carries no row text; proof checks byte identity |
| Placeholder purpose left in | **Yes (planned)** | R-1171 |
| Purpose drift (purpose does not describe its rows, or is generic) | **No** | only the prefix is checked; rests on the reviewer and the owner |
| Plausible but wrong home | **No** | measured once by the rehearsal, no threshold |
| Over- or under-splitting (LLM topic granularity is inconsistent [4]) | **No** | no size check or tunable; the page shows counts only |
| A reason that does not fit its rows | **No** | R-1172 checks that each pair has a reason, not that the reason is true |
| A fabricated or partial review record, or `read` list | **No** | non-empty only (R-1174); "rows covered" is not compared with the row count |
| Wrong lifecycle status (`frozen` versus `active`) | **Enum only** | `requirements-tree.mjs:19,188` |
| An existing but irrelevant gap evidence path | **No** | existence only (R-1173) |
| Middle rows of a long context handled worse ("lost in the middle" [5]) | Partly | lost rows are caught; misplaced middle rows are not. One drafter reads all of it (§5) |
- **Read.** The lift's coverage proof covers every identity failure, and that part is solid. Every semantic failure falls through to the review, which nothing checks.
- **Cheapest deterministic upgrade.** Make the review record structured: one verdict per row ID, plus the reviewer's lineage. The checker then requires that the verdicts cover every row (and a cross-lineage reviewer, where the seat has one). Add a sealed size bound per feature that warns rather than refuses.

## 5. Is the cost stated?
- **No.** CHANGE.md states no token, time or owner-minute figure. The only cost line is "the owner's review time" (CHANGE:7, :184). Rehearsal runs, placement-review runs and re-reviews after amendments have no budget.
- **work-project read set (Ran sizes, tokens INFERRED at about 4 chars per token):** ledger 258 KB, code map 91 KB, test titles 56 KB, `@purpose` lines 16 KB, HANDOFF 15 KB, README 12 KB. That is about 450 KB, about 110k tokens, before the import graph. The emitted mapping is 31 KB (Ran `--emit-mapping`).
- **Review.** One full pass over the row text is about 107 KB (about 27k tokens) per reviewer, plus the tree. The precedent ran 12 reviewers, 12 skeptics, a critic and 2 more skeptics (B §3). The precedent took about 22 hours of wall clock and 11 builder runs (B §5). One zero-shot taxonomy took 24 s; the reliable chained workflow took 2,643 s [3].
- **Single drafter.** Research C §6 says work-project needs "one worker per Part (six)"; CHANGE §3.4 names one drafter. Ask: state a per-project budget (tokens, wall clock, owner minutes), and record all three in the rehearsal.

## 6. Other checks
- **Ran.** The default work-project lift proves 365 rows kept byte-identical and prints 0 move lines. So a straight-from-flat regroup's move pairs come only from re-cutting, which supports CHANGE:173's open question.
- **Residual 5.** A stale page survives a failed run, and the owner will not compare hashes. Unlinking `<page>` before the check costs one line.
- **J1–J6 plus the Windows reinstall.** The plan sends the owner seven asks. The attention-limit trial allows three blocking asks (`HANDOFF.md` Next 4). CHANGE:177 keeps them non-blocking, so this is consistent.

Sources: [1] Brysbaert 2019, J. Memory and Language 109:104047 — https://www.researchgate.net/publication/332380784 · [2] SmartBear/Cisco study — https://support.smartbear.com/support/media/resources/cc/Episode_4_TheLargestCaseStudyOfCodeReviewEver.pdf · [3] Grunde-McLaughlin et al., "Designing LLM Chains by Adapting Techniques from Crowdsourcing Workflows", arXiv:2312.11681 §7.1.4-7.1.5 (older models; zero-shot baseline) — https://arxiv.org/pdf/2312.11681 · [4] Liu et al., "LLM-Guided Semantic-Aware Clustering for Topic Modeling", ACL 2025 — https://aclanthology.org/2025.acl-long.902.pdf · [5] Liu et al., "Lost in the Middle", TACL 2024 — https://aclanthology.org/2024.tacl-1.9/
