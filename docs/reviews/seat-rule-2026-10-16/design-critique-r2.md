# Design critique r2: seat-rule (CHANGE.md, seat draft 1)

*Adversarial plan review of `CHANGE.md` in this folder, against main at `2dbc817`. Citation forms: `file:line at 2dbc817` (read, not
run); "Ran: <command>" (run on the seat machine, macOS, Node 22.22.2, in `r2-probe/src` beside this file, a fresh
`git archive 2dbc817` extract, with HOME set to a scratch folder); INFERRED (neither). Paths starting `../` are sibling plan folders.
The owner's three 2026-10-16 answers, as relayed to all three plans, are the yardstick for "what the owner asked".*

**Verdict: send back. 1 MUST, 6 SHOULD, 5 NOTE.**

**Stakes read:** low and reversible, as the plan says: one rule file, one test file, one row. But the rule loads into every Claude Code
seat at session start, and it now tells the seat to run more at once on one machine. The MUST below sits on that path.

**Scope check.** The plan does what the owner asked: a parallel-by-default bullet, and the limit raised to two building plus one in
planning. It also adds four things the three answers do not contain: "name" at each step, a six-step order list, a hand-split
sentence, and a manual every-pair-once check. S-2 and S-3 cover the two that cost something.

---

## MUST

**MUST-1. "A long check in parts" reaches the full suite, which must not be split yet.**
- *What the text says.* The new bullet tells the seat to start "a long check in parts" now. Besides the mutation run, the longest check
  a seat runs is the full suite: 580 to 880 s serial at the last measure (`../parallel-seat/research.md` §1.5, read there). This plan's
  own seat acceptance runs `npm run test:locked` (§5).
- *Why it goes wrong.* A suite split by hand is a set of filtered runs, and filtered runs skip the machine-wide lock
  (`scripts/test-locked.mjs:4` and `:168` at 2dbc817; R-626 covers full runs only, `REQUIREMENTS.md:1505`). The parallel suite's
  preconditions are still unfixed on main:
  - the desk origin test binds port 4391 unless `DESK_TEST_PORT` is set (`apps/desk/test/origin-rule.test.mjs:17`, `:23`), and nothing
    under `scripts/`, `apps/` or `packages/` sets it outside a bench fixture (Ran: `grep -rn DESK_TEST_PORT scripts apps packages`);
  - five wall-clock bounds, for example `packages/nana-pack/tests/test-locked.test.mjs:103` (< 1200 ms) and
    `packages/nana-pack/tests/bounded-read.test.mjs:37` (< 1000 ms) (Read; the full list is `../parallel-seat/research.md` §1.5).
  The queue keeps suite parallelism as its own gate lane (`HANDOFF.md:85` at 2dbc817). In the owner's order it comes after the runtime
  map.
- *Realistic input.* Lane A's seat splits its verify suite into filtered parts while lane B's builder runs `npm run test:locked`. Both
  runs reach the desk origin test at once. The second desk server cannot bind 4391, so that run's requests go to the other run's server
  (INFERRED from `:17-23`). Or a bound goes red under the load the plan itself names as its second most likely wrong claim (§5).
- *Consequence.* A false red that someone acts on: a send-back on a false finding, or a builder that widens a bound to get green.
  The port case can also read green against the wrong worktree's server (INFERRED).
- *The plan's coverage.* The threat model names bounded tests, but residual 2 and all 19 pairs cover only the mutation run. Residual 2
  also misses the reverse case: the seat's split run loads the machine under the other lane's builder's locked suite.
- **Fix.** Name the mutation run, not "a long check". Ran `nana-writing.mjs` on this wording: `over=0 passive=0`.
  "At each step, start what waits on nothing else, then end the turn: another lane's build, a long mutation run in parts, research
  agents. Run the full suite whole, under its lock." Add one pair: the example goes back to "a long check in parts", which reds the
  parallel check. Extend residual 2 to the builder's locked suite.

---

## SHOULD

**S-1. The new planning slot has no boundary, and the plan changes option (b) without saying so.**
- The plan defines "building" (S4) but not "in planning". The owner chose option (b), which the D1 ask described as "research,
  drafts and plan review, with no worktree and no build" (`../parallel-seat/CHANGE.md:412-413`). §3.2 instead says a lane in
  planning "may already hold a worktree" and calls this "option (b) as the owner chose it".
- The boundary is live now: three plans are being drafted at once (Ran: `ls plan-next` shows three plan folders). After this lane
  lands, whether a reviewed plan waiting for a build slot counts decides whether the seat may start the next plan. Residual 5 does
  not answer that.
- It is not a MUST, because the consequence is the seat's pace and the owner's ask count, not a gate or data.
- **Fix.** Define the slot in the same bullet. Ran `nana-writing.mjs`, clean: "A lane counts as in planning from its first draft until
  its first build, and as building from then until it lands or closes." Say in §6 how the two sibling plans count when this lane
  lands. Either follow (b) on worktrees, or declare the worktree allowance as a seat decision.

**S-2. The hand split becomes the default on runner copies that drop a pair without a word, with only a prose guard.**
- §1, §3.2, §3.6 and S6 rest the hand-split sentence on "the owner's answer keeps a hand split". None of the three relayed answers says
  that; answer (3) gives only the order. The prior critique's MUST-1 asked to leave the clause out, or to make the seat's copy refuse
  an unknown id (`../parallel-seat/design-critique.md` MUST-1).
- "Expires by itself" does not hold. The split-runner lane is judged by an old-form copy (`../parallel-seat/CHANGE.md` §6 S7). Lanes
  with scratch commits or acceptance scripts keep local runners after it (residual 4 there). Each such copy still runs
  `PAIRS.filter((p) => only.includes(p.n))` (`docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs:281` at 2dbc817).
- The plan's threat model puts "a mistyped or missing pair id" in scope, and the only guard is one sentence the seat must remember.
  A lost pair hides a survivor, so the record reads clean. Under the review standard that is a gap in test evidence, so SHOULD.
- **Fix.** Turn residual 6's "can" into a declared seat action with a HANDOFF line. Any copy used for a split refuses an unknown id
  with exit 2 and prints the ids it selected. That costs one line outside the lane. Or drop the hand-split sentences until the runner
  lands. Either way, mark the clause as the seat's decision, not the owner's.

**S-3. The six-step list has no source, its reading of the land review is wrong, and it repeats the working pattern.**
- "The six steps are the request's list" (§3.2) has no source I could find. The sibling research and plan drafted "Keep each lane's own
  steps in order." with no list (`../parallel-seat/research.md:160`; `../parallel-seat/CHANGE.md:458`).
- §3.2 places "the seat land review inside 'land'". But the seat writes `seat-land.md`, HANDOFF and the session notes "in the lane's
  reviewed change before the final round" (`AGENTS.md:99` and the land checklist at 2dbc817). A seat that follows the list as glossed
  writes after review. That costs a confirmation round.
- The list restates an order that the working pattern already holds, and it can drift from that pattern.
- **Fix.** Cut the list and keep "Keep each lane's own steps in order." Pair 10 then goes. Or keep the list and fix the gloss: the land
  review, HANDOFF and session notes belong before the final review round.

**S-4. Bullet 1 still says to end the turn after a launch; the old bridge sentence is gone.**
- Bullet 1 says "launch each builder or reviewer as a background task and end your turn". Old bullet 7's "While one runs, work the
  other" put the second lane's work before the turn ends, and this lane drops it (§3.2).
- A seat that reads bullet 1 first launches lane A and ends its turn. It starts lane B only when A's notice wakes it, so the two builds
  run one after the other. That is the serial pattern the owner asked to end.
- **Fix.** Put the order in the parallel bullet: "start …, then end the turn" (MUST-1's wording does this). Update pair 7.

**S-5. The commit order puts the row after the test, against the rows-first rule and the lane precedent.**
- §2 and §5 change R-1140 in commit 2, with the guide. The repo rule and the computed task say rows first.
- Precedent rewords before tests and stays `implemented`: the seat-guide lane's rows commit came before its tests (`7163476`, then
  `2c458d3`). The regroup-shares rows commit reworded R-1167 first, still `implemented` (Ran: `git show 2822f20 -- REQUIREMENTS.md`).
- The plan's reason, an honest status at every commit, is fair, but the plan does not declare it as a departure.
- **Fix.** Follow the precedent (row, then test, then guide), or declare the order as a seat decision with its reason.

**S-6. A numbered list item survives the count check.**
- R-1140 says the guide holds "no other bullet", and the threat model names "joined by an extra bullet". The count check matches only
  `-`, `*` and `+` markers (`seat-rule.test.mjs:47` in the probe).
- Ran: appending `1. Run three lanes when the queue is long.` to the proposed guide leaves all 11 checks green. Appending trailing
  prose also stays green, but R-1140 does not forbid prose, so only the numbered item is a gap.
- This gap already exists on main and is not a regression.
- **Fix.** Count `^\s*(?:[-*+]|\d+[.)])\s` as a bullet, and add one pair. Or declare the gap as a residual.

---

## NOTE

- **N-1.** "Name" at each step makes the seat write what waits on nothing else, even when nothing does. Reporting what the seat started
  is cheaper and shows the owner the same thing. Weakly earned; the seat's call.
- **N-2.** In the test, `RULE_9` is the seventh bullet and `RULE_7` the eighth, and the new check sits between `RULE_7` and `RULE_8`.
  Renumbering costs about four lines and keeps a later reader from editing the wrong constant. The comment at `:25` explains the
  order, so this is optional.
- **N-3.** §4 cites the Windows seat-guide ask "at `:90` onward". `HANDOFF.md:90` is the heading of the open-asks section; the ask is at
  `:95` at 2dbc817.
- **N-4.** "R-1220 to R-1229 stay reserved and unused": both sibling drafts still list R-122x IDs (Ran: grep of
  `../runtime-map/CHANGE.md` and `../parallel-seat/CHANGE.md`). This lane adds no row, so the seat must move the siblings. Say in §2
  that this lane needs no range.
- **N-5.** R-1140 grows to nine rules in one row. That is the seat-guide lane's accepted form, and one exact-line check pins each
  bullet. Carry 1 rewords the same row next lane. A separate row would let that lane touch one row, but it is not worth the tree
  change now. §3.5's "as asked" has no source in the three answers; drop the two words.

---

## What holds up

Checked, and no change needed:
- The proposed guide is 13 lines and 1,659 bytes (Ran: `wc -lc`). `nana-writing.mjs` prints `over=0 passive=0 banned=0 identifiers=0`
  for it. "one more being planned" flags `passive=1`, so S3's wording choice is right (Ran).
- The test diff is five hunks against `2dbc817` (Ran: `diff`). Against the base guide, exactly the three changed checks FAIL
  (Ran). Against the proposed guide, all 11 PASS (Ran).
- `probe/sim-pairs.mjs`, copied into `r2-probe/`, prints `RESULT 19/19 as declared` (Ran). The recount 5 + 10 + 1 + 1 + 1 + 1 = 19
  is right.
- With the proposed row, test and guide: `requirements-trace.mjs` exits 0 with `ears: 0 rows off form`. `requirements-tree.mjs --check`
  exits 0. `code-map.mjs --check` reports only `docs/code-map.md is stale`, as §5.2 says (Ran).
- R-1220 to R-1229 are unused on `2dbc817`, `feat/regroup` and `feat/roster-notice` (Ran: `git grep -c`).
- The old limit appears only in `HANDOFF.md:81`, the guide, R-1140 and the test, outside review and session archives
  (Ran: `git grep -i "two lanes|lanes in flight|lanes at once|at most two"`). The plan's In list covers all four.
- The FEAT-006 assessment stamp does not contain R-1140, so the reword does not change its state (Ran: read
  `docs/product-report/assessments.json`).
- The R-1142 pointer and its predicate are as cited (`templates/_shared/working-under-nana-pi.md:32`, `templates-render.test.mjs:395-400`,
  Read). The guide is Windows-safe: the test strips `\r`, and S1 stays green (Ran).

## The claim in this critique most likely wrong

MUST-1 assumes a seat will read "a long check" as covering the full suite and split it by hand. If seats only ever split mutation
runs, MUST-1 drops to a SHOULD; the wording fix is still cheap.

VERDICT: SEND-BACK
