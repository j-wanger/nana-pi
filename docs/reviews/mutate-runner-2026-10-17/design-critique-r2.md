# Design critique, round 2: mutate-runner (`CHANGE.md`, seat draft 2)

*Adversarial plan review of `CHANGE.md` in this folder, against main at `2dbc817`. Citation forms: "file:line at 2dbc817" (read, not run);
"Ran: <command>" (run on the seat machine, macOS, Node 22.22.2, in a scratch extract of `2dbc817` at `crit2/src`, with HOME and TMPDIR set
to a scratch folder); INFERRED (neither read nor run). Line citations with no file name are `docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs`
at 2dbc817, as in the plan. New probes beside this file: `crit2/probe-pass-detail/probe.mjs`, `crit2/scan-fmt.mjs`, `crit2/scan-check.mjs`.
Nothing outside the plan folder was written.*

**Verdict: not ready. 3 MUST, 8 SHOULD, 7 NOTE.**

**Stakes read.** Medium and reversible, as the plan says. Round 1's five MUSTs are closed. Three new MUSTs stand. Two are regressions
against the judging and the child kill that main's newest hand copies have today. The third is a fail-open path in a check the plan says
it adds. All three sit in the parts the seat trusts most: judging and the test child.

---

## Does it do what the owner asked, and nothing more?

- **Asked:** a shared split mutation runner, second in the order, after the seat-rule lane and before the runtime map. The plan is that
  lane. It leaves the guide, the lane limit and the runtime map to their own lanes. §6's queue keeps the owner's order, with
  feature-oriented development after the three lanes. Good.
- **Beyond a port plus a split**, five parts came from round 1: the longest-title rule (R-1250), the `.ts` crash reading (R-1245's second
  clause), the runner hash (R-1265), the forbidden-character refusal (R-1262) and the suite-value contract (R-1264). MUST-1 and MUST-3 show
  that two of them rest on a false reading of the repo. SHOULD-3 says R-1264 does not earn its place. The hash and the refusal are cheap
  and earned.
- **One cross-plan gap:** the seat-rule plan now puts a hand-split sentence in the guide and hands its rewording to this lane. This plan
  forbids that edit and says the sentence does not exist (SHOULD-1).
- **Row range.** The relayed brief named no range for this lane. The three sibling plans now hold disjoint ranges: seat-rule R-1220 to
  R-1229 (`../seat-rule/CHANGE.md:40`), this plan R-1230 to R-1269, runtime-map R-1270 to R-1299 (`../runtime-map/CHANGE.md` §2, as
  saved at 22:01). Ran: `git grep -l -E 'R-12(3[0-9]|4[0-9]|5[0-9]|6[0-9])([^0-9]|$)'` over all 39 local and remote refs, 0 refs hit;
  control `R-1183` hits `main`. Recount Ran over the plan: 39 added rows, each with one `shall` once code spans are masked; 47 titles under
  `// req:`; every row named by at least one title; 91 pairs, numbered 1 to 91 with no gap.

---

## MUST

### MUST-1. Many test files print detail after PASS titles; R-1249 and R-1250 as written misjudge them, where the copies do not.

- **The premise is false.** §3.3: "Test files print `PASS <title>` with nothing after it". It cites two files. Many others print their
  check helper's third argument on PASS lines too.
  - Ran: `grep -l -E 'console\.log\(ok \? "PASS" : "FAIL", (n|name|title), (extra|detail|why)\)'` over the test roots at 2dbc817:
    34 files (16 desk, 14 bench, 3 pack, 1 stage).
  - `packages/nana-stage/tests/blocks.test.mjs:19` and `:54` at 2dbc817. Ran: it prints `PASS valid chart {"ok":true}`.
  - `apps/bench/test/plan.test.mjs:21-24` and `:52` at 2dbc817. Ran: it prints `PASS run count = sum over tasks of (eligible profiles) x reps 24`.
  - `packages/nana-pack/tests/agent-dir-config.test.mjs:44` at 2dbc817. Ran: 18 of its 98 PASS lines carry detail, some of it a temp
    path that changes every run. `lifecycle-reload.test.mjs`: 5 of 12.
- **R-1249 refuses where the copies judge.** The row needs each named title to "be a PASS line". `valid chart` is not one, so the run
  stops with exit 2. The copies accept it: their test is "equals, or begins with the title plus a space" (`:242`, used at `:314`).
- **R-1250 drops the match the copies make.** The row reads a FAIL line as the longest baseline PASS title it equals or begins with. Here
  the baseline PASS text is `valid chart {"ok":true}`. The mutant prints `FAIL valid chart {"ok":false,…}`. No PASS text is a prefix of
  it, so the line reads as its own text, and the named title is not matched. The copies match it (`:351`).
- **Ran** `node crit2/probe-pass-detail/probe.mjs` (a scratch copy of nana-stage, one mutant in `validateBlock`'s chart branch):
  R-1249 as written `false`, the copies' baseline check `true`; R-1250 as written "named title matched: false", the copies' rule `true`.
- **Consequence.** A pair that pins its named title reads "no named case" with an unnamed red, or the whole run refuses. Under the same
  literal reading, a stay-green pair (R-1252) whose listed title prints detail reads RED (UNEXPECTED) (INFERRED: not probed). The seat
  acts on these lines. This is a regression of judging
  that main's copies do today. Acceptance 2 cannot see it, because the lift test prints nothing after a PASS title
  (`packages/nana-pack/tests/requirements-lift.test.mjs:20` at 2dbc817).
- **Fix.**
  - R-1249: a named title is present when a baseline PASS line equals it or begins with it plus a space, as in the copies.
  - R-1250: the candidates are the pair's own named titles (`expectRed`, `alsoRed`, `expectGreen`) plus the file's baseline PASS texts.
    Take the longest one the FAIL line equals or begins with plus a space. Where PASS lines are bare, round 1's S-3 fix still holds.
    Where they carry detail, the reading falls back to the copies' reading, never below it.
  - Drop the §3.3 premise. Give M17, M18 and M19 a fixture file whose PASS lines carry detail. Add one wrong-code pair: "the baseline
    title check uses equality".

### MUST-2. The plan drops the copies' tree kill after every test file.

- **What main's copies do.** Five copies kill the test file's process group after every run, not only on a timeout:
  `try { process.kill(-child.pid, "SIGKILL"); } catch {} // stray group members` (`:234`; also `roster-2026-10-13/seat-mutate.mjs:307`,
  `lift-2026-10-14/seat-mutate.mjs:335`, `tree-2026-10-14/seat-mutate.mjs:298`, `seat-guide-2026-10-14/seat-mutate.mjs:230`, all at
  2dbc817; Ran `grep -c 'stray group members'`). The roster copy names the case it met: "a mutated launcher's child".
- **What the plan does.** It models the child on the suite runner (§3.1, "the way the suite runner does"; §3.6). The suite runner kills
  the tree only at the timeout (`scripts/test.mjs:240` at 2dbc817) and after a held-pipe drain (`:257`). A normal close settles with no
  kill (`:261`). R-1240 and R-1241 say the same. No row, check or pair keeps the kill after a normal exit. §1 reads `:234` as a timeout
  kill, which it is not.
- **Consequence.** A mutant that leaves a child alive, the roster case, leaves it running while the next pair runs in that worktree. The
  stray can hold a port, a core or files there. Over a 200-pair table, strays pile up and load every part. A stray can turn the next
  pair red, which hides a survivor. That is fail-open, and a regression of what main's newest copies do. On Windows a stray also holds
  its folders open, so removal fails (INFERRED).
- **Fix.** Add one row: "WHEN a test file's run ends, the mutation runner shall kill what remains of its process tree before that
  worktree takes another pair." On POSIX this is the copies' group kill. On Windows `taskkill /T` finds descendants only while the parent
  lives (INFERRED), so the row's evidence names the Windows clause as partial. Add one check (a fixture file starts a child that outlives
  it; after the run no such process is left) and one wrong-code pair ("no tree kill after a normal exit").

### MUST-3. The repo already checks `.ts` syntax up front; the plan's crash reading fails open.

- **The premise is false.** §3.3: "A `.ts` edit cannot be syntax-checked up front". The repo has a checker: `scripts/ts-syntax-check.mjs`
  at 2dbc817. It strips types, then compiles the result with `vm.SourceTextModule` and runs nothing. Its rows are R-993 and R-994
  (`REQUIREMENTS.md:1470-1471` at 2dbc817). It is this repo's own `.ts` post-edit check (`.pi/nana-pack.json:5` at 2dbc817). It came in
  on 2026-10-08, so it exists at acceptance 2's tip (Ran: `git cat-file -e f6bb0bd:scripts/ts-syntax-check.mjs`).
- **Ran** `node --no-warnings --experimental-vm-modules scripts/ts-syntax-check.mjs` on the plan's own probe files `probe-ts/lib/bad.ts`
  and `bad2.ts`: exit 1, `ERR_INVALID_TYPESCRIPT_SYNTAX: Expression expected`. On `packages/nana-knowledge/lib/build.ts`: exit 0 in 0.06 s.
- **The crash reading fails open.** R-1245 reads SYNTAX only when the test file itself crashes, printing a SyntaxError line and the
  edited `.ts` path. A `.ts` module that the test reaches only through a spawned child does not crash the test file. Example:
  `packages/nana-knowledge/tests/hook.test.mjs:286-317` at 2dbc817 spawns `bin/nana-knowledge.ts`. A broken mutant there makes the
  checks print FAIL, so the pair reads RED: a pin for a change that never ran. The threat model names this input ("a syntax-broken `.ts`
  mutant"). The path match is also untested on Windows.
- **Fix.** Check each mutated `.ts` file up front with that checker, as a helper child beside `node --check`, under R-1243's limit and
  stdin rule. Its argument list is a contract value in the config, with `.pi/nana-pack.json:5` as provenance. Drop the crash-reading
  clause and M12's crash form; M12 then pins the up-front check. The dry option then checks `.ts` too, so residual 12 closes. Keep pair 75
  as "a mutated `.ts` file not syntax-checked".

---

## SHOULD

### SHOULD-1. The two plans each leave the guide's hand-split sentence to the other.

- The seat-rule plan's guide text says: "Split a long mutation run into parts by hand while its runner cannot split it. Check that the
  parts report every pair once." (`../seat-rule/nana-seat.proposed.md`, bullet 7.) It adds that the sentence expires "even before the
  runner's lane rewords it (carry 1)" (`../seat-rule/CHANGE.md:80-82`).
- This plan says the seat-rule lane "needs no split-run clause" (§6 queue item 2). S13 and §3.8 forbid any guide edit here.
- After both lanes land, the guide keeps a hand-split sentence. An exact-line check under R-1140 pins it, and no lane owns its removal.
- **Fix.** Decide here, and correct §6 item 2 and S13 either way. Option one: take the reword into scope. That is one sentence, R-1140's
  text and its exact-line check in `packages/nana-setup/tests/seat-rule.test.mjs`; the lane then touches `packages/nana-setup/`, so it runs
  the install check. Option two: keep the sentence, since it expires by its own condition and in-flight lanes still split their old
  copies by hand, and ask the seat-rule plan to drop its carry 1. S13 should cite the guide as the seat-rule lane leaves it, since this
  lane builds after that one lands.

### SHOULD-2. A split run's load reaches the other building lane, and the stakes line says it cannot.

- The owner's answer makes two lanes building at once the normal case. This runner's default is five parts on ten cores, where the hand
  split measured load 9.0 to 10.8 (§1). A builder's `npm run test:locked` in the other lane then runs on a full machine. The suite holds
  five wall-clock bounds (§6, later lanes). A red from load lands on that builder, who never reads the pack README.
- The stakes line says a fault "fails open in the seat's own checks only, never in `nana-land`, the suite or a release". That is true of
  a bug. It is not true of the load, which reaches another lane's suite and can cost a build round or a needless test edit.
- **Fix.** Correct the stakes line. Put the effect in the HANDOFF residual line, not only the README. Optional: print one line at start
  when the suite lock holds a live pid (its folder: `scripts/test-locked.mjs:17` at 2dbc817). A machine-wide slot stays a later lane.

### SHOULD-3. R-1264, M33 and pair 84 do not earn their place.

- R-1264 turns two chosen values into a contract only to keep them equal. That contract is what makes them "defined twice", a declared
  standards violation (§3.5). It also needs M33, which reads `scripts/test.mjs` as text, and pair 84.
- The drain only matters for a file whose descendant holds its output (R-1241). Nothing breaks if the two runners drift until the
  test-jobs lane moves the suite onto `lib/test-child.mjs`.
- **Fix.** Cut R-1264, M33 and pair 84. Label `DRAIN_MS` and `KILL_GRACE_MS` "chosen: equal to the suite runner's values at 2dbc817
  (`scripts/test.mjs:58-59`)". Residual 1 shrinks to the duplicated child code. No violation is left to declare.

### SHOULD-4. Several rows carry more than one behaviour, and one clause has no wrong-code pair.

- R-1262 holds six refusal triggers under one title (M31). Pairs 53 to 56, 79 and 80 cover five of them. "A tip that names no commit" has
  no pair. Add one: "a tip that does not resolve goes on to add worktrees".
- R-1239 holds three behaviours: fill the three npm values, fill the global prefix from the prefix, and print a line for each value not
  read. Split at least the report from the fill.
- R-1233 holds removal and the keep option, which M4 and M5 already test apart. Split it.
- R-1245 holds two detection paths. After MUST-3 it becomes one: "a mutated file that fails its syntax check".

### SHOULD-5. Timing in the new checks: one inherent bound, one race, and no stated budget.

- C9 is a wall-clock bound by nature: it passes when the result arrives within the drain plus a margin. §5 says no check passes on time
  alone, which C9 cannot meet. State its margin with provenance, for example a descendant that holds output for 60 s against a result
  within 20 s. Add C9 to the later lane's list of wall-clock bounds.
- M28's out-of-order leg has pair 1's test wait for pair 2's mark and then exit. If pair 2's exit lags its mark, the runner can still see
  pair 1 close first (INFERRED). Make pair 1 wait until pair 2's process is gone, by the pid in its mark.
- M28's five-part leg adds cost and pins nothing the two-part leg misses: pairs 47, 48, 49 and 77 red at one or two parts. Drop it.
- §5 leaves the budget to the build brief and guesses 40 to 60 s. The 2026-10-11 timing record holds 132 files and 661 s (Ran: `awk` over
  `../runtime-map/times-1011.txt`). 40 to 60 s would put `mutation-runner.test.mjs` among the five slowest files. Name a budget in the
  plan. Drive judging checks through `judgePair`, with no git, wherever they can be.

### SHOULD-6. R-1242's Windows clause is unverified, and its evidence cell does not say so.

- M8 prints SKIP on Windows. §5.1 marks only R-1239 and R-1240 as having an unverified Windows clause.
- The suite runner already tests its signal handler on Windows through an IPC trigger (`scripts/test.mjs:115-119` at 2dbc817).
- **Fix.** Reuse that trigger for M8 on Windows, or mark R-1242's Windows clause unverified in its evidence cell.

### SHOULD-7. Two child paths sit outside the helper rule and the signal handler.

- R-1243 names git calls, syntax checks and script edits. The npm reads in `npmConfigValues` are not named. A hung or stdin-reading npm
  shim then has no limit. Route them through the same helper.
- The signal handler kills the `live` set, which holds test files only. A signal that arrives during a hung script edit leaves that
  child running, and its limit timer dies with the runner. Add helper children to `live`.

### SHOULD-8. The copy baseline runs N copies of a file that never runs N wide.

- R-1247 runs each named file as N copies. A table where 50 pairs name file A and 2 pairs name file B still runs B five wide. A file that
  fails five wide, such as one with a fixed port, then refuses a run whose pairs never run it more than two wide.
- **Fix.** Run each file as min(N, the number of runnable pairs that name it) copies. M14 and M16 still hold.

---

## NOTE

- **N-1.** Carry 1 is settled: the runtime-map plan now holds R-1270 to R-1299. Close it. That plan still cites this one as "rows from
  R-1240", which is stale; tell its author.
- **N-2.** `git worktree prune` removes only entries whose folders are gone. The signal line should say: remove the printed folder first,
  then prune. Residual 6 has the right order; R-1242's printed text should match it.
- **N-3.** The header hash reads file bytes. A Windows checkout with CRLF endings hashes the same runner differently (INFERRED). Hash
  with line endings folded, as the runtime-map plan does for its content hashes.
- **N-4.** A throw before the pair phase exits through Node's error path with code 1 (residual 13). The README lists exits 0, 2 and 3
  only. Name exit 1 there.
- **N-5.** Say whether an empty `SEAT_MUTATE_PARTS` counts as unset or refuses. A script that exports it empty is honest input.
- **N-6.** Pair ids `1/1` and `1-1` map to one log name under R-1267, and `A1` and `a1` collide on a case-blind disk. R-1262 refuses
  repeated ids only. Refuse ids whose log names collide, or note it.
- **N-7.** All 39 rows go into FEAT-031, the suite's feature, which then holds 76 rows, half of them about another tool. S4 weighs a
  subgroup only. A new feature under CAP-07 needs no subgroup and reads better for the feature-oriented development the owner queued
  next. It is a seat call; a later regroup can also move them.

---

## What holds up

- Round 1's five MUSTs are closed as described: the owner's order settles MUST-1 and MUST-2; the ranges no longer collide (Ran, above);
  the copy baseline answers MUST-4; R-1243 answers MUST-5.
- One process for all parts (B1) stays the right call: one baseline phase, exactly-once accounting in memory, and parts that balance
  themselves.
- The layer reasoning holds: `scripts/` may import packages, never the reverse (`code-map.config.json` `layers` at 2dbc817), and the
  whole repo ships as one package, so a lib module costs nothing extra.
- The cited suite-runner code is as stated: the drain and kill grace (`scripts/test.mjs:58-59`), the tree kill (`:77-83`), the signal
  codes (`:108-114`). `findOnPath` and `winCommand` are exported (`packages/nana-pack/lib/win-command.mjs:29`, `:50` at 2dbc817).
- The seat guide line the plan relies on today is as cited (`packages/nana-setup/claude/rules/nana-seat.md:9` at 2dbc817), and the
  builder rule keeps lane tables out of the suite (`packages/nana-pack/prompts/builder-preamble.md:22` at 2dbc817).
- The leaf-total literal is 1,139 at `requirements-tree.test.mjs:40`, `:54` and `:55` at 2dbc817.
- The pair table recounts to 91 with no gap, and every new check has a macOS pair except C7, as the plan says.

## The claim in this critique most likely wrong

MUST-2's weight. If no current or near-future table mutates code that spawns a lasting child, the dropped kill would not bite soon.
The roster copy's comment shows it has bitten once, and five copies kept the fix, so the finding stands as a regression either way. The
Windows half of its fix is INFERRED.
