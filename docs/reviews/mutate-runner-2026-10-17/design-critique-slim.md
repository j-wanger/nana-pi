# Design critique, slim draft: mutate-runner (`CHANGE.md`, seat draft 4)

*Adversarial plan review of `CHANGE.md` in this folder (seat draft 4, "the slim rewrite"), against main at `afd74de`. Citation forms:
"Read" = read at `afd74de` in a scratch extract (`crit-slim/src`), not run; "Ran" = run on the seat machine (macOS, Node 22.22.2) in
scratch; INFERRED = neither read nor run. Bare line citations (`:547`) are into `docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs`
at `afd74de`, "the landed runner", as in the plan. The probes are one script, `crit-slim/probe.sh`: it builds a throwaway repository and a
copy of the landed runner with only its constants and pair table replaced, and every "Ran (probe X)" below is its output. Nothing outside
the plan folder was written. No owner name, provider or machine name appears here, so the file can enter a public corpus as it is.*

**Verdict: not ready. 2 MUST, 12 SHOULD, 11 NOTE.** Both MUSTs are cheap, and the fix for the second one removes code.

**Stakes read.** Low to medium and reversible, as the plan says. Nothing in land, release or the suite reads the runner's exit. But the
record is the seat's evidence that tests pin code, and it is committed to the corpus. So the bar is that honest input never leaves a
record that is wrong while the run exits 0, and never drops pairs without a word.

---

## Is it the smallest lane that delivers a shared runner with a built-in split?

Mostly yes. The plan promotes a design with three committed five-shard records instead of redesigning it. It cuts draft 3's queue,
copy baseline and judging changes, which was the right subtraction. Ran: the plan's own `slim/recount.mjs` reports 12 rows, 22 titles and
33 pairs with no problem. The three records say what the plan says (Ran: `head -1` and the RESULT line of each `seat-mutate-output-*.txt`):
5 shard headers each, 68, 70 and 71 pairs, and 71/71 red with 55 exact, 4 named green, 15 unnamed red and 0 survived at `f5c2d3c`.

| Part | Earned? | Why |
|---|---|---|
| Lib module, table finds its repository from its own path, repeated-id refusal | yes | The hard-coded path is at `:41`. The repeat loses a pair (Read `:547`, `:561`) and, worse than §1 says, double counts: each shard that holds the id selects *both* pairs through `only.includes` (`:578`), so RESULT counts them twice (NOTE-10). |
| `.ts` checked by the repository's checker | yes | A broken `.ts` mutant reached only through a spawned child would read as an exact RED. The six landed `.ts` pairs pass the checker (the plan's probe). |
| `taskkill` at the time limit, `windowsHide`, `realpathSync.native` | yes | Each is one line. Without them a Windows run hangs or refuses every pair. |
| Part and tally files in a temp folder (S14) | yes, and it is worth more than the plan says | At the base, two five-shard runs that share one `SEAT_MUTATE_OUT` each delete and rewrite `<out>.part<k>of<N>` (`:512`, `:525`), so each merge can read the other run's parts (Read). S14 ends that. |
| The drain after `exit` (half of R-1234, M9, pair 13, a second `DRAIN_MS`) | **no** | SHOULD-1. No committed record shows a file reaching a runner's time limit, and the drain brings a declared violation of the standards with it. |
| Hooks off through an empty folder instead of `/dev/null` | neutral | NOTE-1. The plan's reason is unverified, and both forms are probably no-hooks on both platforms. |
| The optional owner ask about a Windows red run | **no** | SHOULD-6 pins the Windows clause on macOS instead. The ask's premise that only the owner's machine runs native Windows ignores the hosted Windows leg. |
| The optional `branch` table field | **no** | SHOULD-3. The table checkout's HEAD gives the same note with no field. |
| A new "npm could not be read" line, with `winCommand` deferred | no | SHOULD-7. `lib/win-command.mjs` already holds `findOnPath` and `winCommand`, in the same folder. |

Missing from the smallest lane: MUST-1, a one-line change inside R-1235's own text, and MUST-2, which deletes the in-process branch.

---

## Can honest input lose or misjudge a pair, or leave a stray worktree?

| Honest input | Under the plan | Finding |
|---|---|---|
| A mistyped pair id on the command line | Refused with exit 2 before any worktree (R-1240, `:575-577`) | sound |
| A repeated, blank or space-holding id in the table | Refused (R-1240) | sound; A3 should also assert the base's double count (NOTE-10) |
| A mistyped **edit** path | The shard throws. At one shard the record stops with no RESULT and no MISSING line; at two, healthy pairs in that shard read MISSING (Ran, probe A) | **MUST-1** |
| A mistyped **test** path | Baseline red twice, then shard exit 2, its pairs read MISSING, run exit 2 | sound (fails closed); in DRY mode it passes unseen (NOTE-11) |
| Two runs at once with one output file at one shard | Lines from both runs interleave under one header, and both runs exit 0 (Ran, probe B) | **MUST-2** |
| Two runs at once with separate outputs | The git side is safe: worktree names are taken by an atomic folder create, and three five-shard records ran (INFERRED for git, Ran for the records). Load from two split runs, or a split run beside a builder's full suite, is not measured | SHOULD-10 |
| A table edited, or a tip given as a branch name that moves, while shards are still starting | Each shard re-imports the table and re-resolves the tip up to (N-1) × stagger later, 16 s at five shards (`:527` passes `SEAT_MUTATE_TIP` through raw; `:43`, `:311-316` resolve it again in every process) | SHOULD-2 |
| Uncommitted edits in the lane worktree | The run silently tests the tip commit. With no `branch` field it also loses the "branch is now …" note main prints today | SHOULD-3 |
| A test leaves untracked, ignored or nested-repository files in the scratch worktree | `reset --hard` and `clean -fdxq` clear the first two. A nested repository survives `-fdxq` (Ran, probe D), so `:340-341` throws and the shard's later pairs read MISSING | SHOULD-9 |
| A hung test file | The time limit kills the tree on both platforms | sound; a hung git, npm or `.ts` checker call is unbounded, and residual 9 names git only |
| A Windows 8.3 temp path | `realpathSync.native` on both sides | sound (INFERRED) |
| A fixture environment "built from scratch" on Windows | With no `SystemRoot` or `TEMP`, Node's `os.tmpdir()` falls back to a relative `undefined\temp`, and `git` or `taskkill` may not start (INFERRED from Node's source) | SHOULD-6 |
| A run killed outright (a forced stop, a closed terminal) | Worktrees stay and no path was printed. §3.7's README tells the reader that `git worktree prune` clears them, which is false while the folder exists (Ran, probe C) | SHOULD-4 |
| A partial `config` passed by a table | Every value it leaves out becomes undefined | SHOULD-8 |

---

## MUST

### MUST-1. A mistyped edit path throws instead of reading ANCHOR-MISS, and it loses healthy pairs.

- **Input.** Honest, and named by the threat model: a hand-written or copied table names an edit file that does not exist. Examples are a
  typo, a file renamed on the lane, or a path with backslashes written on Windows and run on macOS.
- **What happens** (`:372-381`, kept as "the landed code moved"). `fs.readFileSync` throws, nothing catches it, and the shard dies. Its
  `finally` removes the worktree, so no worktree is left. Ran, probe A:
  - At one shard: exit 1. The record holds the header, the baseline and pair 1, then nothing. There is no RESULT line and no MISSING line,
    and pairs 3 and 4 vanish without a word in the record. Only the console stack trace says why.
  - At two shards: exit 2. Pair 4, a healthy pair that shared the dead shard, reads `MISSING`.
- **Why it is a MUST.** Healthy pairs are lost to another pair's typo. Both rows the lane flips to `implemented` say otherwise. R-1235 says
  an anchor that "does not occur exactly its stated number of times" is ANCHOR-MISS, and in a missing file it occurs 0 times. R-1239 says
  the record holds a MISSING line for every pair no shard printed, and one RESULT line. No check exercises the case, so the rows would
  land overclaimed. The run fails closed (exit 1 or 2), which is why this is not a wrong-verdict bug. It is a lost-pairs bug.
- **Fix (one line).** Read an edit file that does not exist, or cannot be read, as 0 occurrences: ANCHOR-MISS, naming the file and the
  read error, with no test file run and the run ending with exit 3. Add the case to M10's title, for example "…an anchor that occurs twice
  or not at all, or an edit file that does not exist, is ANCHOR-MISS…". Add a pair "a missing edit file throws (the landed form)" that
  reds M10. Residual 6 then covers only environment faults (a failed worktree add or reset).

### MUST-2. At one shard the run writes the record itself, line by line, outside the merge, so R-1239 is false there and two runs at once corrupt the record with exit 0.

- **Input.** Two of the task's honest cases, plus the plan's own serial mode:
  - Two runs at once with one `SEAT_MUTATE_OUT`. The seat-rule lane makes parallel work the default, and a seat may restart a run that
    looks stalled.
  - `SEAT_MUTATE_SHARDS=1`, which acceptance A2 uses, together with any throw (MUST-1, or residual 6).
- **What happens.** §3.2 step 3: "At one shard, run in this process." That is the landed `:588-594`. It truncates `SEAT_MUTATE_OUT` and then
  appends every line as it goes (`:309`, `:589-590`). Ran, probe B: two one-shard runs, started 0.5 s apart with one output file, both exit
  0. The file holds one header, six pair lines for three pairs and two RESULT lines. With two different `SEAT_MUTATE_TIP` values it would
  hold two tips' verdicts under one header. At five shards the same pair of runs is safe: each parent writes its whole record once
  (`:566`), and the last writer wins.
- **Why it is a MUST.** A corrupted record is committed evidence, and nothing marks it bad: both exits are 0. Separately, residual 6 already
  concedes that R-1239's MISSING and RESULT clause is false at one shard, yet R-1239 has no one-shard exception and M17 and M18 never
  throw at one shard.
- **Fix (a subtraction).** Run the work in shard processes at every count, one shard included, so the parent always merges and writes the
  record once, whole. Then the one-shard path is the five-shard path. R-1239 is true at every count. The signal handling is the parent's
  at every count. A2's two legs exercise one code path. The cost is one extra `node` start. Run M18 at one shard too, and add a pair
  "at one shard the run judges in this process and appends the record line by line (the landed form)" that reds M18's one-shard case. An
  exclusive lock on `SEAT_MUTATE_OUT` that refuses a second live writer with exit 2 is optional.

---

## SHOULD

### SHOULD-1. Cut the drain. It fixes a stall no record shows, and it brings a declared standards violation with it.

- **Evidence.** Ran: a grep over all 42 committed mutation records at `afd74de` for the runners' timeout notes (` (timeout)`, `TIMEOUT`,
  ` timed out`). The only hits are pair names and one test's own 30 s per-case limit. No file has ever reached a runner's 10-minute limit,
  and that limit is the only way the landed "wait for `close`" stall shows. The plan's §1 cites the stall as "Read" only.
- **Cost.** The drain costs half of R-1234, M9, pair 13, a second definition of `DRAIN_MS` (which §3.5 calls "a declared violation"),
  residual 1's drain clause, and the plan's own second "most likely wrong" claim: helper output after 2 s is lost and the group is killed
  sooner.
- **Fix.** Keep the landed behaviour: on `close`, kill what remains of the group on POSIX. R-1234 becomes "WHEN a test file's output
  closes, … kill what remains of the file's process group on POSIX", pinned by M8 and pair 12. Add one clause to residual 4: on Windows, a
  descendant that holds a file's output after the file exits hangs that shard. No mutation pair runs on Windows today. The drain returns
  with `lib/test-child.mjs`, where the suite already owns it, if a stall is ever seen.

### SHOULD-2. Shards re-read what the parent already decided. Pass the parent's tip and table identity down, and print the runner's identity.

- **Problem.** The parent resolves the tip and deals the ids. Then each shard starts as `node <table> <ids>` up to (N-1) × stagger later.
  It re-resolves `SEAT_MUTATE_TIP` (`:527` passes it raw; `:43`, `:312`) and re-imports the table and the runner from disk. Two honest cases
  follow. A tip given as a branch name, or `HEAD`, that moves in that window gives one record with two tips. A table the seat edits right
  after starting a background run gives shards that judge the edited pairs under the old ids.
- **Fix.** The parent passes the resolved tip SHA in `SEAT_MUTATE_TIP`. It also passes content hashes of the table and the runner module,
  and a shard whose hashes differ refuses with exit 2, so its pairs read MISSING. Print both hashes in the header.
- **Why the hashes also matter later.** With a shared runner, an old table re-run later is judged by a newer runner, and §6 already plans
  judging changes ("it changes the copies' reading for 4 title pairs"). The hashes are how a reader tells which runner wrote a record.
  §3.9 cut the hash because "nothing reads them yet". After this change the shards read them.
- **Pins.** Add a pair "shards re-resolve `SEAT_MUTATE_TIP` themselves (the landed form)" that reds M22, with a case that moves a fixture
  branch between the parent's start and a later shard.

### SHOULD-3. Use the table checkout's HEAD instead of the optional `branch` field, and name uncommitted changes the run will not see.

- **Problem.** The landed runner always prints `NOTE: <branch> is now <head>` when the lane has moved past the table's tip (`:42`, `:404`,
  `:513`). §3.4 makes `branch` optional, so a new table that leaves it out loses a note main prints today. Separately, the run always tests
  the tip commit. A seat that strengthens a test and re-runs the runner before committing, which is the seat guide's "re-run the lane's
  mutation runner" step, sees the old test judged with no word that its edit was skipped.
- **Fix.** The repository is the table's own checkout, so its `HEAD` is the lane head. Note when `HEAD` differs from the tip. Name any
  uncommitted change under the paths the pairs edit or test, with one `git status --porcelain -- <paths>` call in the parent. Drop the
  `branch` field. That is one table field fewer, and the note can no longer be left out.

### SHOULD-4. A run killed outright leaves worktrees, and the plan's cleanup advice is wrong. Print each scratch path at the start.

- **Advice.** §3.7 says the pack README will state that "a run killed without a signal handler leaves worktrees that `git worktree prune`
  clears". Ran, probe C: `prune` leaves a linked worktree whose folder still exists, and only removing the folder first lets `prune` drop
  it. Residual 5's "the printed folder" has the same gap.
- **No trail.** The landed runner prints the scratch path only with keep set (`:397`, `:488`). After a forced stop there is no path to
  remove.
- **Fix.** Each shard prints its scratch folder in its first line. The README and residual 5 then say: remove the printed folder, then run
  `git worktree prune`, or run `git worktree remove --force <path>`. Consider adding SIGHUP, which a closed terminal sends, to the handled
  signals: it is one word in the same handler. The suite runner handles only SIGINT and SIGTERM, so leaving SIGHUP out keeps parity, but
  then residual 5 should name it.

### SHOULD-5. One behaviour per row, each clause pinned. R-1241 holds two unrelated options, and one of its clauses has no check.

- **R-1241.** It holds the dry option and the log folder. Its baseline-log clause ("save there each red baseline run's output") is named by
  no title: M22 names only "each pair's output per test file". Split it into a dry row and a log-folder row, or move the log folder into
  R-1239, and pin the baseline log in M22, or cut the clause.
- **R-1232.** It holds about six behaviours (the start form and cwd, the fresh home and temp folder, the scrub, `gc.auto`, the npm values,
  the npm line) and has 3 pairs. Split the npm part into its own row. No pair reds HOME kept, cwd at the repository root, `SEAT_MUTATE_`
  kept, `PI_CODING_AGENT_DIR` kept, `gc.auto` missing, or the global prefix left unfilled.
- **R-1230.** It hides an IF/THEN refusal, the own-root check, inside a plain "shall" row. Give that check its own EARS row: it is the one
  guard that keeps `reset --hard` and `clean -fdx` out of a real checkout.
- **Missing pairs.** Clauses the plan changes or relies on have no wrong-code pair. Add the cheap ones, in the plan's own style of "pairs
  that put back the landed form":
  - no `reset --hard` between pairs → M1;
  - `clean -fdq`, the landed form, which reds M1's ignored-file case and pins the `-x` change;
  - keep ignored, so worktrees are removed anyway → M3;
  - the parent exits 0 after a signal → M4;
  - pairs dealt in contiguous blocks, not round-robin → M15;
  - the refusals checked after the worktree add → M19;
  - parts left beside the record (the landed form) → M3 or M17.
- **M17.** Its title names "the header" but none of R-1239's seven header fields. Name the fields the check asserts.

### SHOULD-6. Pin the Windows kill on macOS by injecting the platform and the kill command. Cut the optional ask, and make sure the Windows leg can run at all.

- **Pin it on macOS.** The standards say to inject resources with side effects at the module boundary. Inject `platform` and the kill
  command through the config surface, as `win32-degrade` forces its platform so it runs on macOS (the landed DECLARED (b)). Then M7 can
  assert `taskkill /T /F /PID <pid>` on a forced win32 with a recording fake, and pair 11 reds it on macOS. R-1233's Windows clause is
  then seen red, and the optional owner ask (§7) and its HANDOFF line go away. Its premise is also wrong: the hosted Windows leg is native
  Windows.
- **Let the Windows leg run.** Build rule 4's "environment built from scratch" must keep `PATH`, `SystemRoot`, `ComSpec`, `PATHEXT`, `TEMP`
  and `TMP` on win32. Without them, `os.tmpdir()` resolves to a relative `undefined\temp` and `git` or `taskkill` may not start (INFERRED),
  so the Windows leg fails, or passes for the wrong reason, on the only check that sees M7's real `taskkill` path. State the allowlist in
  the brief.

### SHOULD-7. Reuse `findOnPath` and `winCommand` for npm instead of a new "could not read" line.

- **What exists.** `packages/nana-pack/lib/win-command.mjs` sits in the same folder. It exports `findOnPath` and `winCommand`, which start a
  `.cmd` file safely. Six production modules use it (Ran `grep -rln win-command.mjs`), and it has its own tests. The code map lets the new
  module import it, since imports within packages are free.
- **Fix.** Three lines read npm's values on Windows today. That closes residual 4's npm clause and a §6 item, instead of printing that they
  were skipped. Keep the line only for an npm that is not installed, if it is wanted at all.

### SHOULD-8. `config` replaces the defaults whole, has no row, and lets a table replace sealed contract values.

- **Footgun.** A table that passes `{ FILE_TIMEOUT_MS: … }` for a slow lane leaves every other value undefined:
  - the shard count becomes NaN, so the run refuses with a message about `SEAT_MUTATE_SHARDS`;
  - `TS_CHECK_ARGS` throws when spread;
  - with SHOULD-1 not taken, an undefined `DRAIN_MS` makes the drain about 1 ms (Node sets a missing delay to 1 ms; INFERRED).
- **Back door.** The same field lets a table replace `EXIT_*`, `ENV_NAMES`, `SIGNAL_EXITS` and `MAIN_BRANCH`, values M20 calls sealed.
- **Fix.** Merge `config` over the defaults. Accept only the tunables (`FILE_TIMEOUT_MS`, `BASELINE_RETRIES`, `SHARDS_DEFAULT`,
  `STAGGER_SECS_DEFAULT`, `NPM_COMMAND` and the platform and kill injection of SHOULD-6). Refuse any other key with exit 2. Say so in one
  clause of R-1240.

### SHOULD-9. The exported `resetScratch` now runs `clean -fdx` on any folder that is its own git root. Guard it to the run's own scratch folders, and use `-ffdxq`.

- **Risk.** §3.1 exports `resetScratch(dir, tip, config)` for M2. A lane worktree is its own git root, so it passes the own-root check, and
  with `-x` a wrong caller would delete its ignored files as well as its uncommitted work (INFERRED; no such caller exists today).
- **Guard.** Refuse a folder that does not lie under the OS temp folder inside a `SCRATCH_PREFIX` folder this module made.
- **Nested repositories.** Ran, probe D: `clean -fdxq` leaves a nested repository a test created, so the clean-status check throws (MUST-1's
  failure shape). `-ffdxq` clears it.

### SHOULD-10. Put "another mutation run or a full suite on the same machine" in the threat model, and make it visible in the header.

- **Gap.** The threat model lists "sibling worktrees doing git work at the same time" but not a second split run or a builder's full suite.
  The seat guide makes both likely: two lanes in flight, each running "a long mutation run in parts". That is ten shards on ten cores, and
  their test children spawn more. Draft 3's load comparison (44 of 217 against 40 of 209) was one split run alone. A load-made FAIL on a
  named title reads as an exact RED and hides a survivor.
- **Fix.** Add the case to the threat model with a residual. In the header, note the number of other live `seat-mutate-` scratch folders
  under the temp folder, and whether the suite lock is held. This costs no new tunable, and it also finds strays (SHOULD-4).

### SHOULD-11. A2 compares counts only, so differences between pairs can cancel.

- **Problem.** A2 compares, per pair, "the same verdict word and named-title count", and then the RESULT sums. One pair can gain an unnamed
  red while another loses one, or a named-green title can move between pairs, and every compared number stays the same.
- **Fix.** Compare the set of titles per pair (named green, not reached, unnamed red, crash) after stripping times and diff stats. A3
  should assert the base's RESULT over-count too (NOTE-10).

### SHOULD-12. Inline tunables remain in the code the plan moves as it is.

- **What is left.** §3.5 leaves out several values that the moved code holds inline in a package lib:
  - `maxBuffer: 64 * 1024 * 1024` (`:272`), a cap;
  - the display widths in `short(...)`: 110, 90, 100, 80, 120, 160, 200;
  - the counts of shown lines (`slice(0, 3)`, `slice(-3)`, `slice(0, 4)`);
  - the scrub vocabulary (`NANA_`, `NANA_TEST_`, `PI_CODING_AGENT_DIR`);
  - the syntax-check extension map (`.mjs`/`.js`, `.ts`);
  - the `gc.auto` key and value.
- **Fix.** "Line words unchanged" does not require these values to stay inline. Move them into the config module with provenance, or
  declare them format constants with a reason. Keep build rule 2 for the scrub name. R-190's grep, `PI_CODING_AGENT_DIR;?$`
  (`agent-dir-parity.test.mjs:184`, Read), passes a quoted array item but fails a comment line that ends in the bare name.

---

## NOTE

1. **Hooks folder.** "`/dev/null` is a POSIX path" is not shown to matter. Git looks for `<hooksPath>/<name>`, and `/dev/null/post-checkout`
   cannot exist on either platform (INFERRED). Either form works. Mark the reason INFERRED, or keep the landed form.
2. **Windows Ctrl-C.** In a console, Ctrl-C reaches every process attached to it, shards included, as SIGINT (INFERRED). Only a parent's
   `kill()` ends a child outright. "On Windows a stop does not reach the shards" is broader than true.
3. **Residual 7 comes back.** Most §6 lanes edit the runner, so each needs an old-form copy (S7), which is the copy problem this lane ends.
   A §6 line could let a table import the runner from the merge base, checked out under its scratch folder.
4. **HANDOFF size.** Most residuals (3, 4, 6, 9, 10) are §6 items. One queue line can cite them. Keep separate HANDOFF lines only for
   residuals no §6 lane closes.
5. **Numeric ids.** An id written as a number (`n: 3`) runs at one shard. At N shards every shard refuses it, because argument ids are
   strings, so all its pairs read MISSING. Refuse non-string ids in R-1240.
6. **Log names.** Ids `a/b` and `a-b` share a log name. Two runs with one log folder overwrite each other's logs.
7. **Scratch prefix.** `SCRATCH_PREFIX` drops the lane name the landed prefix carried (`roster-notice-seat-mutate-`), so a stray cannot be
   traced to its lane by name. Add the lane.
8. **Exits.** Exit 3 masks MISSING, a shard failure and an interrupt. The record shows them, so this is fine, but say it. No row says a
   clean run exits 0. M17 could assert it.
9. **Home.** The layer rule does not force `packages/`: `scripts/test.mjs` may import from `scripts/` too. The pack has no `files` field, so
   the runner ships with the installable pack, as `pi-review` and `nana-land` already do. Give that as the reason, not the layer rule.
10. **Base double count.** A repeated id at five shards also double counts RESULT, as shown above. A3 at the base should show it.
11. **Dry mode.** DRY never starts a test file, so a mistyped test path passes it. The README's dry line should say "anchors and syntax
    only".

---

## Row census (after this critique, if every MUST and SHOULD is taken)

| Row now | Behaviours | Pinned by titles | Pairs now | Change |
|---|---|---|---|---|
| R-1230 | scratch per shard, tip, hooks off, reset, clean, own-root refusal | M1, M2, M22 | 1-4, 33 | own-root refusal gets its own IF row; pairs for no reset and `-fdq` |
| R-1231 | end cleanup, keep, signal stop | M3, M4 | 5, 6, 23 | pairs for keep ignored and exit 0 after a signal; scratch path printed at start (SHOULD-4) |
| R-1232 | start form, home and temp, scrub, `gc.auto`, npm values, npm line | M5, M6 | 7, 8, 9 | npm values (via `winCommand`) become their own row |
| R-1233 | time-limit tree kill | M7 | 10, 11 | pair 11 runs on macOS (SHOULD-6) |
| R-1234 | drain, then group kill | M8, M9 | 12, 13 | drain cut; M9 and pair 13 go |
| R-1235 | anchor and syntax faults | M10, M11 | 14-16 | missing edit file is ANCHOR-MISS; one new pair |
| R-1236 | baseline | M12 | 17, 18 | none |
| R-1237 | judging | M13, M14 | 19-22 | none |
| R-1238 | count, deal, stagger | M15, M16 | 23-25 | pair for a contiguous deal |
| R-1239 | record and exit 2 | M17, M18, M22 | 26-28 | true at one shard (MUST-2); tip and hashes passed down (SHOULD-2); HEAD and dirty-path note (SHOULD-3); one-shard pair |
| R-1240 | input refusals | M19 | 29, 30 | config keys and numeric ids; pair for refusals after the worktree add |
| R-1241 | dry, log folder | M21, M22 | 32 | split in two; baseline log pinned or cut |

**Recount of the wrong-code table** under these changes:

- Start from 33 pairs.
- Cut 1: pair 13 (SHOULD-1).
- Add 10 pairs:
  - a missing edit file throws → M10;
  - the one-shard path judges in process and appends the record → M18, one-shard case;
  - no reset → M1;
  - `-fdq` → M1;
  - keep ignored → M3;
  - exit 0 after a signal → M4;
  - a contiguous deal → M15;
  - the refusals after the worktree add → M19;
  - shards re-resolve the tip → M22;
  - parts left beside the record → M3.
- Result: 33 − 1 + 10 = 42 pairs, all run on macOS once SHOULD-6 forces win32.
- Rows: 12, plus 1 (the own-root refusal), plus 1 (npm values), plus 1 (the log folder) = 15. R-1230 to R-1244 is still well inside the
  range.
- Titles: 22, less M9 = 21. M10, M17, M18 and M22 gain cases.

The plan's own recount holds as written (Ran `node slim/recount.mjs`: "no problems").

## Checked and found sound

- Every line citation into the landed runner that I opened matches: `:41-42`, `:272`, `:292`, `:305-306`, `:335`, `:355`, `:361-365`,
  `:384`, `:399`, `:438`, `:496`, `:527`, `:547`, `:561`, `:569-570`, `:577`. Plumbing from `:271` to `:594` is 324 lines.
- Repository facts, all Ran unless marked:
  - main has 11 `seat-mutate.mjs` runners with 5,104 lines;
  - the highest row ID is R-1215, and no R-123x to R-126x row is on main;
  - FEAT-031 is at `REQUIREMENTS.md:1511`;
  - the tree literal 1,178 is at `requirements-tree.test.mjs:40`, `:54` and `:55` (Read);
  - R-917's source scan reads only the test folders, so the lib may call `mkdtempSync` and the test file may not (`test-runner.test.mjs:425-437`, Read);
  - the `.ts` post-edit command is at `.pi/nana-pack.json:5`;
  - the 8.3 lesson is at `docs/sessions/2026-10.md:53`;
  - the pack README's writing section runs from `:312` to `:369`.
- The suite runner's tree kill, signal codes and drain are as cited (`scripts/test.mjs:57-58`, `:76-83`, `:108-116`, `:204-261`, Read). One
  difference the plan does not state: the suite kills the tree only when the drain expires. After a clean `close` it leaves a stray that
  holds no pipe alive. The mutation runner kills the group after every file, which is stricter and right for mutation work, but it is not
  "after R-610".
- Judging is unchanged from the landed runner (S8). The threat model's out-of-scope list is right. No existing code changes, so a revert
  removes the lane.
