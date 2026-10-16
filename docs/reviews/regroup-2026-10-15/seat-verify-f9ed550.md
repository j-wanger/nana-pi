# Seat's checks of build 1 (2026-10-16, at f9ed550)

MUST 1. R-1176 is wrong on basketball-geek. The checker reads evidence paths only inside backticks (brief item 2), but the trace rail splits plain cells on commas, and all 145 of basketball-geek's cited rows use that plain form. A correct proposal with 20 placed reasons is refused ("R-001 is text-placed … but has no placed reason … and 105 more"). The packet then lists all 165 rows as placed by text alone. Repro: `node /private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/regroup-mutate-verify/bg-placed.mjs`. It only checks which paths exist in `~/basketball-geek`; the ledger comes from the cache copy.
MUST 2. Writing `--out` over an input passes on macOS when the path differs only in case, or is a hard link. `--out <root>/requirements.md` exits 0 and overwrites the ledger with the page. `--out …/PROPOSAL.json` or a hard link to the proposal overwrites the proposal, which is not yet committed. The cause is that `nearestRealPath` and `realpathSync` keep the case as typed. Comparing `statSync` device and inode for an existing path would fix it. Repro: `t2.mjs` (c), (d), (e) in the scratch folder.
MUST 3. An honest shape slip crashes the run and leaves the earlier page in place, against R-1171 and the module's "never a crash" contract. Triggers: `targets` written as one object, `about` as one object, `reasons` as an object keyed by line, or a `null` verdict. Each throws an uncaught TypeError at `requirements-regroup.mjs:162/167/174`. After a passing run, the `targets` crash left the earlier page at `--out`. Repro: `t2.mjs` (b) and `t1.mjs`.
MUST 4. A reason whose `"line"` is the string `"37"` passes. The R-1173 check compares keys as text, but the page and the claim lookup compare numbers strictly. The result: the page prints "Line 37 -> FEAT-004 / Reason: " (blank), and the claim's quoted text is never compared, so a changed reason passes under an old accept. Repro: `t2.mjs` (a).
MUST 5. The packet is not the "Short package" Jake ruled.
- No node label appears anywhere: not in the table, the node list or the appendix. On basketball-geek the mechanical proposal passes and would write "CAP-01 · Not yet sorted", which the owner never sees.
- Reported lines drop the old heading text.
- No refuted-items section exists (§3.4 item 3), so the reason a target was refuted is never shown.
- The node list is flat, with no capability, feature and subgroup nesting.
MUST 6. A `placed` entry for a row that does not exist (R-999) exits 0, against brief item 5 and R-1176's "exactly". No test covers unknown rows: deleting the verdict refusal for an unknown row leaves T7 green.
MUST 7. Some rows read `implemented` with clauses no cited test pins. T8's title says "a share carried … passes", but T8 calls nothing directly and has no carried share; deleting the carried outcome leaves it green (against brief item 7 and residual 2). R-1171's "the lift and each evidence path" clause also survives deletion; only the seat's acceptance script covers it. Repro: `mut2.mjs`.

Notes:
- The lift change keeps every lift guarantee I tested. 400 fuzzed flat ledgers, 210 of them with identical heading lines, plus 100 regroups of the lifted result all passed. Each dry run's line records matched an independent reader, every row and prose line landed under the right node after `--write`, `--verify <base> --mapping` exited 0, and the regroup command exited 0. A sample of 10 of the lift's mutation pairs all went red; 1/5 is partial (one named title green), as the lift lane recorded. The lift and regroup test files pass at HEAD.
- Rows R-1170 to R-1180 and R-1184 match §2 word for word.
- Packet length, mechanical proposal, words before the appendix at 238 words a minute:

| Ledger | Words | Minutes | Budget | Note |
|---|---|---|---|---|
| aml-desk, project paths present | 6,739 | 28 | 45–60 | 196 rows text-placed; appendix adds 18,638 words |
| aml-desk, bare copy | 10,625 | 45 | 45–60 | every row text-placed |
| basketball-geek | 4,292 | 18 | 20–30 | 3,797 words are the misclassified list from MUST 1 |
| basketball-geek, rail's evidence form | about 960 | 4 | 20–30 | estimated, not run |

  Both runs are under budget. Real proposals add moves, questions and refutations, so real packets will be longer.
- Also accepted:
  - an `active` feature with no rows and no evidence, i.e. a gap that dodges R-1174
  - refuted items and questions that name unknown rows
  - `same_family: true` with different lineages, which the page prints as "another lineage"
  - lineage names differing only in case, also read as another lineage
  - a "carried" outcome counted for a move, though R-1175 says share only (unreachable until `regroup-shares` lands)
- `--out` naming a directory crashes. The same-family header omits the lineage name.
- The skill paragraph names no proposal field. It also opens "Regroup the lifted tree", although S7 and the aml-desk run start from a flat ledger.

Scripts are in `/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/regroup-mutate-verify/`: `fuzz.mjs`, `mut.mjs`, `mut2.mjs`, `packet.mjs`, `t1.mjs`, `t2.mjs`, `bg-placed.mjs`. The packets are under `packet/`.

---

Tip: `f9ed5500a950d7b3b9931be8d342908a8c3aac42` (feat/regroup; merge-base e451c90). The run exited 0, the scratch worktree was removed, and the lane worktree is still clean at the tip. All six baseline files were green on the first run, so no retry was needed.

RESULT line (verbatim):
`RESULT: 77/81 red (67 exactly their named titles, 2 with a named title green, 9 with an unnamed red), 4 survived [2/8, 4/4, 5/3, C5]`

SURVIVED lines (verbatim):
```
GREEN 2/8 placeholder check dropped — SURVIVED; named but GREEN: "R-1172: a node outside the reserved general-engineering nodes that keeps a \"Not yet sorted:\" purpose or outcome is refused"; 0 FAIL total (1 file changed, 1 deletion(-))
GREEN 4/4 reasons keyed by heading text — SURVIVED; named but GREEN: "R-1173: each line the lift reports needs exactly one reason by old line and node, a missing, repeated or stale reason is refused, and two same-text headings are reasoned apart"; 0 FAIL total (1 file changed, 6 insertions(+), 3 deletions(-))
GREEN 5/3 `..` accepted — SURVIVED; named but GREEN: "R-1174: a proposed feature with no evidence path, a missing path or a path leaving the root is refused, and an existing path written with backslashes passes"; 0 FAIL total (1 file changed, 1 insertion(+), 1 deletion(-))
GREEN C5 a verdict naming a row the ledger does not hold accepted (unknown-row refusal dropped) — SURVIVED; named but GREEN: "R-1175: a review record missing a row, repeating one, naming a stale home, an unknown verdict or target, an empty reason or a target without its own reason is refused"; 0 FAIL total (1 file changed, 1 insertion(+), 1 deletion(-))
```
ANCHOR-MISS: none (the dry run also applied 81/81).

Why each survivor survived. I confirmed each by re-running the case on a mutated copy of the script:
- **2/8:** T4's placeholder cases are refused anyway by R-1184's stale-claim-text check ("FEAT-001 purpose's claim quotes a stale text").
- **4/4:** T5's same-text case is refused by R-1184's missing-claim check ("line 30 -> FEAT-002 reason has no claim verdict").
- **5/3:** T6's `../outside.txt` does not exist, so the missing-path refusal catches it.
- **C5:** T7 has no unknown-row case. Build brief 1's clarification 5 asked for one, and it was not added.

Other inexact results:
- **4/1** (missing reason accepted): T5 stayed GREEN, masked by the same R-1184 missing-claim check. Only T21 caught it, by chance.
- **2/7** reached no named case. The mutant deletes the notes file, so T21's `readFileSync(notes)` at `requirements-regroup.test.mjs:254` throws ENOENT instead of printing FAIL. The test file then crashed before its later checks ran.
- **Unnamed reds:**
  - 1/1 and 1/2 red most of the regroup suite. This is expected under (a): the checker imports `detectMoves`.
  - 2/1 also reds T14, because there is no proof line.
  - 2/5 also reds T19, because the temp folder `/var` is a symlink to `/private/var`.
  - 7/5 also reds T11, which uses top-level keys.
  - 5/4, 6/17 and 7/2 break the honest fixture itself, as declared in (e).

Declared corrections (printed as DECLARED lines in the output):
- **(a) Test sets.**
  - Row 1 runs the lift test and the regroup test, because the checker imports `detectMoves` and spawns the lift.
  - Rows 2 to 9 run the regroup test only.
  - Row 10's skill pairs run templates-render, skill-claims and readme-check.
  - 10/6 runs requirements-tree.
- **(b) Pair ids.** §5's table has no row 3. Ids count across each row's "·" groups, giving 80 pairs.
- **(c) Code shapes some labels force.**
  - 1/1 maps each heading text to its first line and dedupes.
  - 1/3 changes the lift's print only.
  - 4/4 keys reasons by heading text, counted as a multiset.
  - 6/8 counts any refuted or asked entry for the row, once.
  - 7/5 to 7/22 skip the key check for that level at every site.
  - 9/3 prints the row's first target's outcome for every target.
  - 10/5 adds a second regroup span carrying `--force`.
  - 10/6 adds R-1185 after R-1180 and regenerates the outline.
- **(d) C5 is added by the seat** and judged on T7. The checker has no unknown-row refusal for `placed`, `refuted` or a question's `about` entry, so no pair can drop one.
- **(e)** 5/4, 6/17 and 7/2 break the honest fixture, so their unnamed reds are expected.

Code that contradicts a row or the brief (all in `scripts/requirements-regroup.mjs`):
- **:295-307** `placedProblems` only walks ledger rows. A `placed` entry for R-099 passes: exit 0, page written. This contradicts R-1176 ("exactly the rows") and clarification 5.
- **:290, :240 and :247** accept a `refuted` entry or a question `about` entry naming a row the ledger lacks (exit 0). This contradicts clarification 5's "share target" clause, under my reading of it.
- **:238 and :245** count `also_applies` as "carried" for a move target too. R-1175 says carried is for "a share only". This is unreachable today, because the lift's proof refuses an `Also applies` line ("line accounting … unaccounted extra").
- **:354** `regroupProblems` is not exported, and T8 runs through the command line (test lines 321-333). So no test exercises the "carried" outcome. CHANGE §3.4 item 2, clarification 7 and residual 2 all claim T8's direct call pins it, yet R-1175 is marked `implemented` with that clause unpinned.
- **:255-258** accept `same_family: true` when the two lineages differ (exit 0, and the page says "another lineage"). This contradicts clarification 1.
- **:380-381** print only "same-family review" and omit the lineage names. That is my reading of R-1178, which asks for the lineages; it is not confirmed.

Files are in `/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/regroup-mutate/`:
- `seat-mutate.mjs`
- `seat-mutate-output.txt`
- `seat-mutate-dry.txt`
- `logs/` (one log per pair and test file)
- `probe/` (the archived tip with `probe.mjs` and `probe2.mjs`)
