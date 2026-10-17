# Change declaration — seat-rule: the seat starts independent work at the same time, and the lane limit becomes two building plus one in planning

*Lane `seat-rule` · `feat/seat-rule` · `~/nana-pi-wt/seat-rule`, from current `main` once `feat/regroup` lands (the owner's 2026-10-16 order: this lane first, then the shared split
mutation runner, then the runtime map) · cites at `2dbc817` · 2026-10-16 · seat draft 2 (seat revision 2, log at the end), before plan review. Feature: FEAT-006 (R-1140 reworded; no row added). Class SMALL:
one plan-review round (`AGENTS.md:95`). Builder: the small-lane builder from the roster, through `pi-worker --lane seat-rule --brief … --out …` (plus `--lane-size small` if `roster-notice` has
landed and the roster then sets `largerBuilder`); every test is named by exact title. It touches `packages/nana-setup/`, so the install check runs on macOS before `nana-land`
(`AGENTS.md:147`). Stakes: low and reversible — one rule file that every Claude Code seat loads at session start (a symlink on macOS and Linux, a copy on Windows) and one test
file; a wrong rule changes how much the seat runs at once, and a revert undoes it. Evidence beside this file: `nana-seat.proposed.md` (the byte source for the guide),
`probe/seat-rule.test.mjs` (the proposed test), `probe/sim-pairs.mjs` (the pair simulation), `probe/r1140.txt` (the row draft); `../parallel-seat/research.md`,
`../parallel-seat/design-critique.md`, `../parallel-seat/factcheck.md`. "Ran" = run on the seat machine (macOS, Node 22) in a scratch extract of `2dbc817`
(`git archive 2dbc817`); "Read" = read at `2dbc817`, not run; INFERRED = neither. The owner is "the owner" throughout, with no name and no word-for-word quote, so this file can
enter a public review corpus unchanged.*

## 1. Why

On 2026-10-16 the owner answered the parallel-work plans. A small lane adds a parallel-by-default rule to the seat guide and raises its lane limit to two lanes building plus
one more being planned. This lane goes first after the regroup. The design critique of the first parallel plan asked for exactly this order (`../parallel-seat/design-critique.md`
MUST-1): three of the four kinds of parallel work need no new tool, and the split runner can follow. MUST-1 also asked to leave the split clause out until the runner
lands; this plan does (S6). None of the three answers names a hand split.
- **The guide has no parallel rule.** Its only line on running work side by side is bullet 7: "Keep at most two lanes in flight, a nana default. While one runs, work the other
  or end your turn." (`packages/nana-setup/claude/rules/nana-seat.md:11` at `2dbc817`). Nothing names research agents or a long mutation run split into parts.
- **Serial checks cost hours.** On 2026-10-16 four serial mutation runs of the regroup lane took 31.7, 54.9, 97.9 and 96.6 minutes; the same lane's 217 pairs split by hand
  into five parts took 25.2 minutes, about 3.9 times faster (`../parallel-seat/research.md` §1.3, Ran there; recomputed in `../parallel-seat/factcheck.md` §4). The seat's
  checks after builds ran apart from the mutation run although they did not depend on it (`research.md` §1.3, last bullet).
- **A runner that splits itself already exists; the guide needs no split clause.** The nine copies on `main` drop a pair id they do not know:
  `PAIRS.filter((p) => only.includes(p.n))` (`docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs:281` at `2dbc817`; Ran `git grep -n 'only.includes(p.n)' 2dbc817`, nine
  copies, none with a refusal), and so does the regroup copy (`feat/regroup:docs/reviews/regroup-2026-10-15/seat-mutate.mjs:529`, Ran `git grep`). The roster-notice runner
  does not. It splits into five parts by default (`feat/roster-notice:docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs:18-23`, `SHARDS_DEFAULT = "5"` at `:56`). It
  refuses an unknown pair id with exit 2 (`:566-567`). It prints a MISSING line for any pair no part reported (`:549-552`). Its committed run reads "66/68 red … across 5
  shards" (`seat-mutate-output-59db91d.txt`, committed at `57fca87`; Read). That runner is the form the seat copies until the shared runner lands; the sibling runner plan
  already has every copy refuse an unknown id (`../parallel-seat/CHANGE.md` S12) and leaves the guide alone (its S13, §3.8 and queue item 2).
- **The limit is now the owner's ruling.** The seat-guide lane worded "two lanes" as the seat's own rule, "a nana default" (`docs/reviews/seat-guide-2026-10-14/CHANGE.md:87-88`).
  The owner's answer matches option (b) of three: keep two (a), two building plus one in planning (b), or a lane parked on an owner choice not counting (c)
  (draft 1's D1 of `../parallel-seat/CHANGE.md`, which its revision 2 removed once answered; §3.2 quotes (b)).

**Threat model.** In scope, honest variation in our tools' output and in a builder's edit: a guide bullet dropped, duplicated, split in two, folded into another, indented
as a sub-bullet, or joined by an extra bullet; a limit number or clause changed; the old bullet 7 sentence left in; CRLF line ends; a stale Windows copy of the guide; a pi seat
that never opens the guide; a seat that splits a mutation run with a mistyped or missing pair id; a seat that splits the full suite into filtered runs beside another lane's
locked run; tests with wall-clock bounds that go red under the added load, the seat's or the builder's. Out:
deliberate forgery, and a seat that ignores the rule — no test can show that a seat obeys a rule line. A finding outside the model is a residual.

## 2. Requirement delta

Main's highest ID is R-1183; `feat/regroup` adds R-1170 to R-1180, R-1184 and R-1187, and `feat/roster-notice` R-1190 to R-1215 (`../parallel-seat/factcheck.md` §3).
This lane's range is R-1220 to R-1229: unused on `main`, `feat/regroup` and `feat/roster-notice` (Ran: `git grep -c -E 'R-122[0-9]\b' <ref>`, no hits on any of the three).
The lane adds no row, so the range stays reserved and unused; an earlier runtime-map draft that named R-1220 onward (`../runtime-map/CHANGE.md:43`) cannot collide with it.
The reworded row stays `implemented` and changes, with its evidence cell, in the commit whose test pins its new clauses. Rows are placed by feature ID, never by line.

| ID | Change | Text |
|---|---|---|
| R-1140 | reworded (FEAT-006) | The seat guide `packages/nana-setup/claude/rules/nana-seat.md` shall state each of nine rules exactly once, each as its own bullet, and hold no other bullet: launch in the background and end the turn, one foreground command in pi; no reading or judging of partial work and no re-run of checks while a builder or reviewer runs; act on its completion notification or a monitor's failure or stall signal, in that turn; verify once at the end; re-run the mutation runner after the seat's own change; findings back in the next brief; at each step, name the work that waits on nothing else and start it at once, keep each lane's own steps in order, and run the full suite whole, never in parts; at most two lanes building and one more in planning, a lane counting as building from its first build until it lands or closes; the builder preamble and review standard named, not restated. |

Evidence cell: the ten R-1140 titles of §5.1, in place of today's nine (two renamed, one new). Ran on `probe/r1140.txt` (revision 2, in a fresh extract `r3/tip`): one `shall`
with code spans masked, no pipe, opens with `The`; with the row and the proposed test in the scratch extract, `node scripts/requirements-trace.mjs` exits 0 and prints
`ears: 0 rows off form`.
R-1141 (the scope sentence) and R-1142 (the shared pointer) keep their text and evidence. The leaf total does not move: no row is added (Ran: `requirements-tree.mjs --check`
exits 0 and `docs/requirements-tree.md` is byte-equal to `2dbc817`).

## 3. Design

**3.1 The guide, exact text** (13 lines, 1,584 bytes, nine bullets, Ran `wc -lc` and `grep -c '^- '`; `nana-seat.proposed.md` is the byte source). Bullets 1 to 6 and the last bullet are unchanged. The new
parallel bullet sits before the limit bullet; the limit bullet replaces today's bullet 7. Ran `node packages/nana-pack/bin/nana-writing.mjs nana-seat.proposed.md`:
`over=0 passive=0 banned=0 identifiers=0` (today's guide prints the same).

```
# Nana — Running builders and reviewers

This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.

- In Claude Code, launch each builder or reviewer as a background task and end your turn. In pi, run it as one foreground command with no timeout.
- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.
- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.
- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.
- After any change of your own to code or tests, re-run the lane's mutation runner before the review.
- Send findings on a build back in the next brief instead of fixing the builder's work yourself.
- At each step, name what waits on nothing else and start it now: another lane's build, a long mutation run in parts, separate research agents. Keep each lane's own steps in order: plan, seat checks, build, verify, review, land. Run the full suite whole, never in parts.
- Keep at most two lanes building and one more in planning, a nana default. A lane counts as building from its first build until it lands or closes.
- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.
```

**3.2 Why each sentence.**
- *Name and start.* The owner asked for parallel work as the default. "Name" makes the choice visible in the seat's turn, so the owner can see what the seat ran at once. The
  three examples are the request's three kinds: a second lane's build, a long mutation run split into parts, independent research agents.
- *A mutation run, not any long check.* Draft 1's example read "a long check in parts". That also covers the full suite, 580 to 880 s serial at the last measure
  (`../parallel-seat/research.md` §1.5), which must not be split yet. A suite split by hand is a set of filtered runs, and filtered runs skip the machine-wide lock
  (`scripts/test-locked.mjs:4` and `:168` at `2dbc817`; R-626 covers full runs only, `REQUIREMENTS.md:1505`). The suite's own preconditions are unfixed: the desk origin test
  binds port 4391 unless `DESK_TEST_PORT` is set (`apps/desk/test/origin-rule.test.mjs:17`, `:23` at `2dbc817`), and only bench fixtures and the desk `.e2e.mjs` files, which
  the suite never runs (`scripts/test.mjs:20-21`), read that variable (Ran: `git grep -n DESK_TEST_PORT 2dbc817 -- scripts apps packages package.json`); five wall-clock
  bounds remain (`research.md` §1.5). Suite parallelism is its own gate lane in the queue (`HANDOFF.md:85` at `2dbc817`).
- *Full suite whole.* "Run the full suite whole, never in parts." closes what the narrower example only stops inviting: the bullet tells the seat to start what waits on
  nothing else, and suite parts look like that. The wording is the seat's (S8). The round-2 critique offered "under its lock"; the guide loads in every project's seat, and
  only nana-pi has a suite lock (Ran: `git grep -n 'test:locked\|test-locked' 2dbc817 -- templates`, 0 hits). nana-pi's lock rule stays at `AGENTS.md:143`, so a whole run
  there is `npm run test:locked`. Ran the writing checker on both wordings: `over=0 passive=0`.
- *No hand-split sentence.* The roster-notice runner already splits, refuses an unknown id and reports a missing pair (§1), and the seat copies that form until the shared
  runner lands (S6). A guide sentence that tells the seat to check parts by hand would restate what the copied runner checks in code, and the sibling runner plan makes no
  guide edit (its S13). So this lane carries no split clause, and the runner lane has nothing in the guide to reword.
- *Steps in order.* Parallel work must not start a lane's review while its own verification runs: bullet 5 already puts the mutation run before the review. The six steps
  are the request's list; plan review sits inside "plan" and the seat land review inside "land".
- *Limit.* "In planning", not "being planned": Ran, the writing checker flags "being planned" as passive (`passive=1`). Option (b), as put to the owner, reads "two lanes
  building plus one in planning — research, drafts and plan review, with no worktree and no build" (draft 1's D1 of the sibling plan, which its revision 2 removed once
  answered; quoted the same way in `factcheck-r2.md` MUST-2 and `design-critique-r2.md` S-1, and Read again in the seat's own record of draft 1). "A lane counts as building
  from its first build until it lands or closes" keeps a lane in review, or parked on an owner choice, in a build slot: the owner chose (b), not (c), which would free a parked
  lane's slot. The guide does not restate (b)'s "no worktree"; the seat follows it. "A nana default" stays: a project may set its own limit in its own section.
- *Dropped:* today's "While one runs, work the other or end your turn." The parallel bullet covers working the other lane, and bullet 1 already ends the turn after a launch.

**3.3 The test** (`packages/nana-setup/tests/seat-rule.test.mjs`; the full draft is `probe/seat-rule.test.mjs`). The `@purpose` says "nine rules" (`:3`); the comment at `:25`
says nine and names this file; `RULE_7` (`:32`) takes the new limit text; a new `RULE_9` holds the parallel bullet and joins `RULES` (`:34`), with a comment that it sits between
`RULE_6` and `RULE_7` in the file; the count check (`:48`) and the limit check (`:63`) take new titles; one new check pins `RULE_9`. Constants keep their names, so the diff stays
small. The test pins each bullet's exact text and the bullet count, not their order (today's design). Each value in a bullet — "two", "one more in planning" — is pinned by
its exact-line check under `// req: R-1140`, the row that states it; provenance: the owner's 2026-10-16 answer, recorded here and in the test's comment.

**3.4 What stays, and why.**
- **The shared pointer (R-1142).** `templates/_shared/working-under-nana-pi.md:32` and `AGENTS.md:100` keep their text. The pointer enters every project's `AGENTS.md`, which pi
  also loads into builder and reviewer children (`docs/reviews/seat-guide-2026-10-14/CHANGE.md:51-56`), and a pi seat waits on its one foreground build (bullet 1), so in pi a
  second lane's build needs a second session anyway. Pair S2 shows R-1142's check still guards the pointer. Residual 3.
- **The setup README line** (`packages/nana-setup/README.md:40`) names three of today's eight rules as a summary; it stays true. Adding a fourth would be a second, unpinned
  summary to keep in step.
- **R-1141, `nana-soul.md`, the install wiring** (`steps.mjs:48`, `state-manifest.mjs:59`) and the runtime table: no change.

**3.5 What NOT to do.** No new row (R-1140 is reworded, as asked, rather than joined by a near-duplicate); no edit to the pointer, the shared file, `AGENTS.md`, the setup README,
`nana-soul.md`, the builder preamble or the review standard; no part count, machine size or model name in the guide; no runner code (the next lane); no memory edit inside the
lane. Nothing the lane writes adds a provider, host name, absolute home path or owner name; a line it edits keeps any name already there.

**3.6 Subtraction test.**

| Part | Earns it because | Cut or kept smaller |
|---|---|---|
| Parallel bullet | the owner's ask; the guide has no such rule (§1) | one bullet, three sentences, no numbers |
| "Name" in it | makes the seat's choice visible in its turn, the only place the owner can see it | one word |
| "A long mutation run in parts" | a split cut a 97-minute run to about 25 (§1); naming the mutation run keeps the full suite out of the example | replaces draft 1's "a long check"; no new sentence |
| Step-order sentence | without it parallel work can start a review while the lane's own verify runs | one sentence; the six steps, no detail |
| Full-suite sentence | the bullet otherwise invites a split suite, whose filtered runs skip the lock and share port 4391 (§3.2) | one sentence; no lock, port or count named |
| Hand-split and every-pair-once sentences | — | cut: the roster-notice runner form splits, refuses an unknown id with exit 2 and prints MISSING (§1); the seat copies it (S6) |
| New limit | the owner's ruling | replaces bullet 7 in place |
| Building definition | without it a lane in review or parked can read as freeing a slot | one sentence |
| R-1140 reword | the row must state what its checks pin | no new row; R-1141 and R-1142 untouched |
| Ninth bullet, not a fold into bullet 7 | one rule per bullet keeps one check per rule; a fold makes a five-sentence bullet (pair 16 shows the fold is caught) | one more line |
| Pointer and README edits | — | cut (§3.4) |
| Order check | — | cut: bullet order carries no meaning the checks need |

## 4. Scope

**In.** `packages/nana-setup/claude/rules/nana-seat.md` (§3.1); `packages/nana-setup/tests/seat-rule.test.mjs` (§3.3); `REQUIREMENTS.md` (R-1140's row only);
`docs/code-map.md` (regenerated: one purpose line, Ran §5.2); `HANDOFF.md` (the queue's lane-limit clause at `:81`, the seat-guide residual line at `:63`, the existing optional
ask on the Windows seat guide at `:90` onward, and this lane's Landed line); `docs/sessions/2026-10.md` (one entry); the review corpus `docs/reviews/seat-rule-2026-10-16/`
(this file, `nana-seat.proposed.md`, `seat-titles.mjs`, `seat-mutate.mjs`, the briefs, reviews and outputs). The builder writes the guide, the test, the row and the map; the seat
writes HANDOFF, the session entry and the corpus before the final round. HANDOFF and session lines paraphrase the owner and quote nothing; any ask keeps the parser's form
`- **[optional, since YYYY-MM-DD] Title.** body` (`packages/nana-pack/lib/handoff-asks.mjs:13`), because `product-report.test.mjs:31-35` parses the real HANDOFF.
**NOT.** §3.5.
**Overlap.** `feat/regroup` edits `REQUIREMENTS.md`, `HANDOFF.md`, the tree, the map and the session archive; `feat/roster-notice` edits `REQUIREMENTS.md` (FEAT-006 rows R-1120
to R-1124 and new R-1190, R-1191 and R-1212, placed after R-285, not beside R-1140), `AGENTS.md`, the shared file, the setup README, the tree and the map (Ran: `git diff
--name-only main...<branch>` and `git show feat/roster-notice:REQUIREMENTS.md`). Neither touches the guide or its test. This lane rebases on `main` before the build and again
if `roster-notice` lands first; it regenerates the map after each rebase and cites rows by ID.

## 5. Verification

Exact titles under `// req:` lines, red before the guide changes, frozen in `seat-titles.mjs` (DONE = `0 missing`). Two commits: the test first (Ran, base guide with the new
test: exactly the three changed checks FAIL, and the trace rail names the two retired titles R-1140 still cites), then the guide, the row and the map (Ran: all eleven checks
PASS, the trace rail exits 0, `map:check` reports 0 problems).

**5.1 Checks** (`packages/nana-setup/tests/seat-rule.test.mjs`; 11 titles, 3 changed).
- Renamed: `// req: R-1140` `seat guide holds no bullet beyond its nine rules` (was "…eight rules").
- Renamed: `// req: R-1140` `seat guide carries: at most two lanes building and one in planning` (was "…at most two lanes in flight").
- New: `// req: R-1140` `seat guide carries: start what waits on nothing else, keep lane steps in order, run the full suite whole`.
- Unchanged: `// req: R-1141` `seat guide scopes itself to the seat in one sentence before its first bullet`, and the six R-1140 carries checks for bullets 1 to 6 and the
  preamble check, each with today's title.

Which clause each pins: every R-1140 check compares one whole line, so the new check pins all three sentences of the parallel bullet and the limit check both sentences of the
limit bullet; the count check pins "hold no other bullet" and "nine". Pairs 1 to 17 show each changed clause is caught.

**5.2 Census of existing checks** (lines at `2dbc817`).

| Check | Row | Change |
|---|---|---|
| `seat-rule.test.mjs:48` seat guide holds no bullet beyond its eight rules | R-1140 | red; renamed "nine", `RULES` gains `RULE_9` |
| `seat-rule.test.mjs:63` seat guide carries: at most two lanes in flight | R-1140 | red; renamed, `RULE_7` takes the new text |
| `requirements-trace.test.mjs:61` REQUIREMENTS.md and the markers the suite carries agree | — | red between the two commits (Ran: the rail names both retired titles); green once R-1140's cell cites §5.1's titles |
| `code-map.test.mjs:39` the repo's code map is current…; `npm run map:check` | G-004, G-009, G-010 | red until `npm run map` (Ran: `docs/code-map.md is stale`; after `--write` the diff is one line, `:2509`, and the check reports 0 problems) |

Green with no edit: the R-1141 check and the seven unchanged carries checks (Ran); `win32-degrade.test.mjs:86` (R-350: it compares the installed copy with the repo file read at
test time, Read `:82-86`); `install.test.mjs:112` (R-301; the link target is unchanged); `templates-render.test.mjs:397-405` (R-1142) and `:274` (R-859), because the pointer and
the region do not change; `requirements-tree.test.mjs:40` (R-291; no row added, Ran `--check` exit 0); `product-report.test.mjs` (the FEAT-006 assessment stamp lists 21 rows
and not R-1140, Ran: read from `docs/product-report/assessments.json`; the HANDOFF ask keeps the parser's form); `skill-claims.test.mjs` (its surfaces are the skills and the
shared file, not rule files, `packages/nana-pack/tests/skill-claims.mjs:13-25`). `readme:check` in the scratch extract fails only on `.git`, which an archive lacks
(Ran: `packages/nana-knowledge/README.md:56: '.git' does not exist`); the lane changes no README.

**5.3 Wrong code first.** Each pair edits the guide, or the shared file and nana-pi's `AGENTS.md` region alike, never an assertion. Ran `node probe/sim-pairs.mjs`: every pair
gives exactly the declared result against the proposed test (`RESULT 19/19 as declared`, re-run at revision 2). Pairs 11 and 12 hold revision 2's two new pairs in the
numbers the cut hand-split pairs left, so 13 to 17 keep their meaning. S2 was run against a copy of the R-1142 predicate
(`templates-render.test.mjs:395-400`), not the whole file, which needs `uvx copier`; the seat's runner runs the whole file. 19 pairs.

| # | Wrong code | Reds |
|---|---|---|
| 1 | bullet 7 keeps the old "two lanes in flight" text | limit check, count check |
| 2 | bullet 7 allows three lanes building | limit, count |
| 3 | bullet 7 drops "and one more in planning" | limit, count |
| 4 | bullet 7 drops what counts as building | limit, count |
| 5 | bullet 7 keeps the old "While one runs, work the other or end your turn." | limit, count |
| 6 | the guide has no parallel bullet | parallel check, count |
| 7 | the parallel bullet drops naming the work | parallel, count |
| 8 | the parallel bullet drops "another lane's build" | parallel, count |
| 9 | the parallel bullet drops the step-order sentence | parallel, count |
| 10 | the step order puts review before verify | parallel, count |
| 11 | the example goes back to draft 1's "a long check in parts" | parallel, count |
| 12 | the parallel bullet drops "Run the full suite whole, never in parts." | parallel, count |
| 13 | the parallel bullet appears twice | parallel, count |
| 14 | the step-order sentence becomes its own bullet | parallel, count |
| 15 | the parallel bullet is indented under bullet 6 | parallel, count |
| 16 | the parallel text is folded into bullet 7 | limit, parallel, count |
| 17 | a tenth bullet is added | count |
| S1 | the guide is saved with CRLF line ends | none: every check stays green (expected) |
| S2 | the shared pointer, and nana-pi's region alike, gain "it starts independent work at the same time" | `templates-render.test.mjs::shared working pattern carries one seat-guide bullet` (R-1142) |

Recount: limit bullet 1 to 5 (5), parallel bullet 6 to 15 (10), the fold 16 (1), the extra bullet 17 (1), the stay-green S1 (1) and the pointer guard S2 (1);
5 + 10 + 1 + 1 + 1 + 1 = 19, numbered 1 to 17 with no gap, then S1 and S2. Every changed check has a red pair: the count check 1 to 17, the limit check 1 to 5 and 16, the
new parallel check 6 to 16. The seat's runner runs all 19 in one part: 18 run the seat-rule file in well under a second each (Ran), and S2 runs `templates-render.test.mjs`
once (19 to 26 s in earlier baselines, `research.md` §1.3), so this lane's own run needs no split.

**Seat acceptance** (written before the build, seen failing at the base). (a) `seat-titles.mjs` prints `0 missing` for the eleven titles. (b) The guide equals
`nana-seat.proposed.md` with `\r` stripped, holds nine bullets, and `nana-writing.mjs` (no `--report`) prints `over=0 passive=0 banned=0 identifiers=0`. (c) R-1140's text equals
`probe/r1140.txt`, holds one `shall`, reads `implemented` and cites the ten R-1140 titles of §5.1; R-1141 and R-1142 are byte-equal to `2dbc817`; R-1220 to R-1229 appear nowhere.
(d) The shared file, `AGENTS.md` and `packages/nana-setup/README.md` are byte-equal to the base. (e) `git diff --name-only base..tip` lies inside §4 In. Then the seat's mutation
runner (pairs 1 to 17, S1, S2; a copy of the roster-notice form, S6), `npm run test:locked` (whole, never in parts), `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check`, the trace rail, and
`node packages/nana-setup/bin/install-check.mjs` on macOS before `nana-land`.

**The claim most likely wrong:** that the line changes what the seat does. A rule line cannot prove a seat obeys it; only the seat's next lanes show whether it names and starts
parallel work. Next most likely: that the extra load adds no false reds. Five parts already filled the 10-core seat machine (load 9 to 11, `research.md` §1.3), and four test files
carry five wall-clock bounds (`research.md` §1.5); a split run beside a builder's locked suite run can turn one red, in the seat's pair or in the builder's suite
(INFERRED; residual 2).

## 6. Decisions and residuals (each becomes one HANDOFF line)

**The owner's calls.** None blocking, none parked, no new optional ask. The owner's 2026-10-16 answers settle the rule, the limit and the order. The existing optional ask
"The seat guide on Windows" (since 2026-10-14) gains one clause: re-run the install after this land too, because Windows holds a copy and doctor reads ✗ until then.

**Seat decisions (declared, not asked).**
- S1 Nine bullets: the parallel rule is its own bullet, not folded into the limit bullet (§3.6).
- S2 R-1140 is reworded; no new row, and R-1220 to R-1229 stay unused.
- S3 "In planning" for the owner's "being planned", because the writing checker flags the passive (Ran).
- S4 A lane counts as building from its first build until it lands or closes, so a lane in review or parked on an owner choice keeps its slot: option (b), not (c). A lane in
  planning holds no worktree and no build, as (b) was worded; the guide does not restate it (§3.2).
- S5 The shared pointer and the setup README stay as they are (§3.4).
- S6 No hand-split sentence in the guide. Until the shared runner lands, a seat that splits a mutation run copies the roster-notice runner form, which splits into five parts by
  default, refuses an unknown pair id with exit 2 and prints MISSING for a pair no part reported (§1). This lane's own `seat-mutate.mjs` is that form; it runs its 19 pairs in
  one part (§5.3). This matches the sibling runner plan's S12 and S13.
- S7 Class SMALL, one plan round; the small-lane builder; the test diff keeps constant names.
- S8 The parallel bullet names "a long mutation run in parts", not "a long check", and adds "Run the full suite whole, never in parts." The owner's answers do not say this; the
  seat adds it because the suite's split preconditions are unfixed (§3.2). Wording "never in parts", not "under its lock", because only nana-pi has a suite lock.

**Residuals and carries.**
1. No carry to the runner lane. The guide holds no split clause, so the shared runner's lane edits neither the guide nor R-1140 (sibling S13). Until it lands, the seat
   copies the roster-notice runner form (S6). If a later lane names a split option in the guide, its pairs red this lane's parallel check.
2. Added load, both ways. A split mutation run beside a builder's locked suite run puts the five wall-clock bounds under load (`research.md` §1.5). A pair whose named title is
   such a bound can go red from load and hide a survivor; re-run it alone. The reverse also holds: the seat's split run loads the machine under the other lane's builder,
   whose locked suite can then go red on a bound. That is a false red someone may act on, by a send-back or by widening the bound; re-run that file alone before acting on
   it. The guide names no part count; the next lane brings a default. The bounds are fixed in a later small lane.
3. A pi seat sees only the pointer, which names the guide but not the parallel rule, and it waits on its one foreground build, so a second lane there needs a second pi session
   (existing, `HANDOFF.md:63`).
4. Windows: the Claude Code seat there keeps the old guide until install runs again (the reworded optional ask).
5. Until this lane lands, `main`'s guide still says two lanes in flight. This plan and the split-runner and runtime-map plans were drafted under the owner's 2026-10-16 answer.
6. Old runner copies. The nine copies on `main` and the regroup copy still drop an unknown id without a word (§1). The roster-notice copy refuses one and reports a missing
   pair, and it is the form the seat copies (S6). A seat that runs an older copy in parts can still lose a pair; the shared runner lane closes this in code.
7. The test pins each bullet's text and the count, not the order (existing).
8. Every lane edits the tree, the map, HANDOFF and the session archive, so a third lane in planning means more rebases. This lane adds no row, so it does not move the leaf total.
9. Carry, seat, outside the repo: the seat's shared memory still records the old two-lane rule; the seat updates it to the owner's 2026-10-16 limit.
10. Carry: the HANDOFF queue takes the owner's 2026-10-16 order (this lane, the split runner, the runtime map, then feature-oriented development) in whichever land comes first;
    this lane changes the queue's lane-limit clause either way.

**Later, on demand.** The parallel rule in the shared pointer for pi seats (residual 3); an order check, if bullet order ever carries meaning.

**INFERRED.** That a rule line changes seat behaviour; that the added load can turn a bounded test red; that S2's whole-file run reds only the R-1142 check when both copies are
edited alike (Read: `templates-render.test.mjs:270-274` compares the region with the shared file byte for byte); the step-order reading of plan review and the land review;
that a seat would read "a long check" as the full suite; that a split suite's desk origin test can pass against the other worktree's server on port 4391.

## Seat revision 2 (2026-10-16)

Three MUST findings from the round-2 fact-check (`factcheck-r2.md`) and design critique (`design-critique-r2.md`), each re-verified at `2dbc817` and on the two lane
branches (read-only `git grep`, `git show`, `git log`), as applied. Revision 2's runs used a fresh extract in `r3/` (`base`, `mid`, `tip`), with HOME set to `r3/home`. The
draft-1 copies of the guide, test, row and simulation are kept in `r3/` beside them.
1. Fact-check MUST-1 (hand-split facts; carry 1 against the sibling plan). Accepted, fix (a). Re-verified: nine copies on `main` filter without a refusal (Ran:
   `git grep -n 'only.includes(p.n)' 2dbc817 -- 'docs/reviews/*/seat-mutate.mjs'`, 9 hits); the regroup copy filters the same way at `:529` (Ran: `git grep` on
   `feat/regroup`, tip `c514964`). The roster-notice copy splits five ways by default at `:18-23` and `:56`, prints MISSING at `:549-552` and refuses an unknown id with exit 2
   at `:566-567` (Read on `feat/roster-notice`, tip `57fca87`). Its committed run reads "66/68 red … across 5 shards" (Ran: `git show` of the output file). `ea09ebe` added the
   runner at 21:46 (Ran: `git log`). The sibling plan's queue item 2, §3.8, S12 and S13 say what the finding says; their lines have since moved by one, so this plan cites
   them by name. None of the three relayed answers names a hand split. Changes: the bullet, R-1140 and the new title lose the two hand-split sentences; §1's opening and
   third bullet, the threat model, §3.2, the §3.6 rows, S6 and residuals 1 and 6 now name the roster-notice runner as the form the seat copies. Carry 1 becomes "no
   carry", which agrees with the sibling's S13. Pairs 11 and 12 go.
2. Fact-check MUST-2 (option (b) widened). Accepted. Re-verified: (b) as put to the owner gave the planning slot "no worktree and no build". The sibling's revision 2 removed
   its D1, so the wording was Read again in the seat's own record of draft 1; both round-2 reviews quote it the same way. The roster-notice history the finding names holds
   (Ran: `git log --reverse main..feat/roster-notice`, four plan-side commits before build brief `b2e5dae`). Changes: §3.2 drops the worktree sentence and quotes (b); S4
   says (b), not (c), and that a lane in planning holds no worktree; §1's citation of the sibling's §6 D1, which no longer exists, now points to draft 1's D1.
3. Design-critique MUST-1 ("a long check in parts" reaches the full suite). Accepted, with the optional sentence. Re-verified: `scripts/test-locked.mjs:4` and `:168` take the
   lock only with no filter; R-626 covers full runs only (`REQUIREMENTS.md:1505`); `apps/desk/test/origin-rule.test.mjs:17` and `:23` default to port 4391; outside bench
   fixtures and the desk `.e2e.mjs` files, which the suite never runs, nothing reads `DESK_TEST_PORT` (Ran: `git grep` at `2dbc817`); `HANDOFF.md:85` queues suite
   parallelism as its own lane. Changes: the example reads "a long mutation run in parts"; the bullet adds "Run the full suite whole, never in parts."; R-1140's clause and the
   new title follow; residual 2 now covers the builder's locked suite under the seat's split load; S8 declares the sentence; two INFERRED items are added. One part declined:
   the offered wording "under its lock". The guide loads in every project's seat, and no template ships a suite lock (Ran: `git grep` over `templates`, 0 hits). nana-pi's
   lock rule stays at `AGENTS.md:143`. Both wordings pass the writing checker (Ran).
Also fixed on the way: the §3.6 fold row says five sentences, not six, because the parallel bullet is now three sentences.

Re-run at revision 2 (Ran in `r3/`): the proposed guide is 13 lines, 1,584 bytes, nine bullets; the writing checker prints `over=0 passive=0 banned=0 identifiers=0` for it
and for today's guide. Base guide with the new test: exactly the three changed checks FAIL, and the trace rail exits 1 naming the two retired titles. Tip: 11 PASS, exit 0;
the trace rail exits 0 with `ears: 0 rows off form`; `requirements-tree.mjs --check` exits 0, and the tree file is byte-equal to `2dbc817`; `code-map.mjs --check` reports only
`docs/code-map.md is stale`, `--write` changes one line (`:2509`), and the check then reports 0 problems. `probe/sim-pairs.mjs` prints `RESULT 19/19 as declared`.

Recount. Rows: 1 reworded (R-1140), 0 added, 0 retired; R-1220 to R-1229 stay unused. R-1140 cites 10 titles; the file holds 11 checks, 3 changed. Pairs: draft 1's 19,
less pairs 11 and 12 (17), plus the old-wording pair (18), plus the dropped-suite-sentence pair (19). That is 17 numbered pairs with no gap, then S1 and S2:
limit 1 to 5 (5) + parallel 6 to 15 (10) + fold 16 (1) + extra bullet 17 (1) + S1 (1) + S2 (1) = 19. Owner calls: 0 blocking, 0 parked, no new optional ask. Seat decisions: S1
to S8.
