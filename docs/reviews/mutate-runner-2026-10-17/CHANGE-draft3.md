# Change declaration — mutate-runner: one shared seat mutation runner that splits a run across parts

*Lane `mutate-runner` · `feat/mutate-runner` · `~/nana-pi-wt/mutate-runner`, from current `main` in the first build slot after the seat-rule lane, second of the three lanes
in the owner's 2026-10-16 order (§6) · cites at `2dbc817` · 2026-10-16 · seat draft 3 (seat revision 3, change log at the end), before plan review. Feature: FEAT-031 (40 new
rows, R-1230 to R-1269, the seat's whole range for this lane); a test literal only in FEAT-028 (R-291). Class: neither gate nor format (no land, release or
suite gate reads its exit), and not small (new process code on two platforms, 49 checks, 98 pairs), so two plan-review rounds (S11). Builder: the larger-lane builder. It
touches no `packages/nana-setup/` file and no hook: no install check. Stakes: medium, reversible — the runner is the seat's evidence that tests pin code, so a bug that loses or
misjudges a pair hides a survivor; that fails open in the seat's own checks only, never in `nana-land`, the suite or a release; the parallel default raises the odds of a
load-made red, which the copy baseline answers (R-1247); no bin, PATH link, hook or install step changes, and a revert removes it. Evidence beside this file: `research.md`
(facts, options and the first lane draft), `design-critique.md`, `factcheck.md`, `regroup-runner.mjs` (the in-flight regroup runner, saved from `feat/regroup` at `c514964`),
`probe-reset/probe.mjs`, `probe-ts/probe.mjs` (added in revision 2); `design-critique-r2.md`, `factcheck-r2.md`, and in `r3/` the revision 3 probes `probe-title-rule/probe.mjs`,
`probe-stray/probe.mjs` and `probe-ts-child/run.sh`, with `roster-notice-runner.mjs` (saved from `feat/roster-notice` at `ccd8f76`). "Ran" = run on the seat machine (macOS, 10
cores, git 2.50.1, Node 22.22.2); "Read" = read at `2dbc817`, not run; INFERRED = not read or run. Line citations without a file name are
`docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs` at `2dbc817`, the newest hand-copied runner on main at that revision; "the roster-notice runner" is
`docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs` at `ccd8f76`. Main moved to `c514964` during round-2 review (the regroup lane landed); citations stay at `2dbc817`
unless they name another revision, and the build bases on current main. The owner is "the owner" throughout, with no name and no word-for-word quote, so this file can
enter a public review corpus unchanged.*

## 1. Why

On 2026-10-16 the owner asked that the seat run work at the same time by default, and set the order of three lanes: a seat-guide rule first, then this shared split mutation
runner, then the runtime map, with feature-oriented development after them (§6). The seat-rule lane makes parallel work the seat's rule; this lane gives the seat a tool that
splits its slowest step, the mutation run, with no hand work. That the seat's lanes ran slow is the seat's reading of its own records below, not the owner's words.

- **Pairs run one at a time.** Every hand-copied runner loops over its pairs and awaits each test file in turn (`:320-343`). Measured on 2026-10-16 (regroup lane, the seat's
  records; start from each header, end from the record's last write; `research.md` §1.3; re-Ran in `factcheck.md` §4):

  | Run | Pairs | Minutes | Pairs per minute |
  |---|---|---|---|
  | serial, tip `228f37c` | 104 | 31.7 | 3.3 |
  | serial, tip `656dc86` | 148 | 54.9 | 2.7 |
  | serial, tip `8c7ed24` | 195 | 97.9 | 2.0 |
  | serial, tip `cd8991b` | 209 | 96.6 | 2.2 |
  | five parts split by hand, tip `e5d71c6` | 217 | 25.2 | 8.6 |

  The serial runs took 281 minutes that day. The hand split was about 3.9 times faster per pair. Load average stayed at 9.0 to 10.8 on 10 cores during the split (Ran `uptime`,
  `sysctl -n hw.ncpu`; a reading of the moment, not re-readable). The split shows no sign of load-made reds: 44 of 217 split pairs had an unnamed red, against 40 of 209 in
  the last serial run (Ran: the RESULT lines of `seat-mutate-output-cd8991b.txt` and `-e5d71c6.txt` on `feat/regroup` at `c514964`). The tips differ, so that comparison is
  INFERRED, not proof.
- **The hand split works but is fragile.** Each part made its own worktree and re-ran its own baseline of five or six files (Ran: `grep -c ^BASELINE` on each part's log). Nothing
  merged the five records: the committed record ends with a hand-written `RESULT (all shards)` line (Ran `git show c514964:docs/reviews/regroup-2026-10-15/seat-mutate-output-e5d71c6.txt`).
  Every copy on main drops a pair id it does not know without a word, `PAIRS.filter((p) => only.includes(p.n))` (`:281`; Ran `grep -c`: the same line once in each of the nine
  copies at `2dbc817`, and in all ten at `c514964`), so a typo in a hand-made id list loses a pair and only the header's pair count shows it.
- **A built-in split already exists, on a branch.** The roster-notice runner (commit `ea09ebe`, unchanged at `ccd8f76`, Ran `git diff --stat`; that lane lands before this one)
  is the first copy with a split: it runs the selected pairs as N child processes of itself, five by default (`:56`), dealt round-robin (`:499`) and started 4 s apart
  (`:59`), merges the part files into one record in table order with one summed RESULT and a `MISSING` line for a pair no part printed (`:497-560`), refuses an unknown pair
  id with exit 2 (`:566-567`), handles SIGINT and SIGTERM (`:383-392`, `:510`), removes `SEAT_MUTATE_` variables from test children (`:271`) and names a title by RegExp
  (`:292`). Its committed record ran 68 pairs in five parts (Ran `git show` of `seat-mutate-output-59db91d.txt`) in 2 min 15 s, header `01:46:57Z` to the merged record's last
  write (Ran `stat` on the seat's part files). Its parts ended 54, 114, 98, 117 and 118 s after their own starts: the round-robin deal gave part 1 no `templates-render`
  baseline (13 s of baseline against 42 to 51 s) and 41 s of pair work against 48 to 73 s, so it finished 80 s before the last part (Ran: each part's header time, BASELINE
  seconds and file time). Its `.ts` check runs `--experimental-strip-types --check` (`:374`), which exits 0 on a broken `.ts` file (Ran `probe-ts/probe.mjs` again), so it
  reads a broken `.ts` mutant as RED.
- **Copies drift.** Main held nine JavaScript runners at `2dbc817`, 3,878 lines (Ran `wc -l docs/reviews/*/seat-mutate.mjs`), and ten at `c514964`, 4,510 lines, since the
  regroup lane landed (Ran `git ls-tree`, `git show`); the roster-notice runner makes eleven when it lands. Four of the nine name the copy they came from (tree `:4`,
  seat-guide `:3`, lift `:5`, regroup-shares `:5`); the other five say nothing (Ran `grep -n -i 'copied from'`). Counted from each copy's `── plumbing` marker, the plumbing runs
  161 to 238 lines a copy, and successive copies in the roster, seat-guide, tree, lift, regroup-shares, regroup line differ by 22 to 138 lines (`factcheck.md` W5, Ran).
- **Windows gaps.** In all nine copies a test's POSIX process group is killed at the timeout (`:231`), and five of them (roster, seat-guide, tree, lift, regroup-shares) kill
  it again after every run, to reap strays (`:234`; Ran `grep -c 'process.kill(-'`: two calls in those five, one in the other four); no copy calls
  `taskkill` (Ran `grep -l taskkill`: no file, at `2dbc817` and at `c514964`). Five copies at `2dbc817` read npm values (fresh-install, lift, tree, regroup-shares,
  seat-guide), six at `c514964`; each starts `spawnSync("npm", …)` with no shell (`:185`), which cannot start `npm.cmd`, so on Windows those values are skipped without a word
  (INFERRED from Node's documented `.cmd` rule; not run on Windows). The four newest copies at `2dbc817` (five at `c514964`) turn hooks off with `core.hooksPath=/dev/null`
  (`:114`), a POSIX path, and write a red baseline's output beside the table, inside the lane checkout (`:310`). The suite runner kills the whole tree on both platforms
  (`scripts/test.mjs:76-83`), but only at its timeout and after its drain (`:240`, `:257`), never after a normal close (`:261`).

**Why this lane, and why second.** The owner's order puts it after the seat-rule lane. That rule needs no runner: its other kinds of parallel work (another lane's build,
separate research, separate checks) need nothing new. The seat guide already sends the seat to "the lane's mutation runner" (`packages/nana-setup/claude/rules/nana-seat.md:9`
at `2dbc817`, and still bullet 5 of the seat-rule lane's proposed guide, `../seat-rule/nana-seat.proposed.md`), so once this lane lands the split comes from the runner's
default, with no new guide words (S13). Until then the seat copies the roster-notice runner, which already splits and refuses an unknown pair id (S12), so a split needs no
hand work.

**Threat model.** In scope, honest variation in our tools' output and in seat tables: test output with CRLF endings, a title followed by detail on PASS and FAIL lines alike
(34 test files print it on PASS lines, some of it a temp path or a count), a title holding a run value at its end, a FAIL line from a file that exits 0, a file that crashes
before its checks, a file whose descendant holds its output open, a file that leaves a descendant running after it exits, a file that hangs, a file that reads stdin; a named
title that is the start of another title; a syntax-broken `.ts` mutant, including one a test reaches only through a spawned child; two copies of one test file at once (a
default port, a shared temp name); a timing-bound title that goes red under load; a script
edit that reads stdin or hangs; sibling worktrees doing git work at the same time; a Windows 8.3 short temp path beside git's long path (`docs/sessions/2026-10.md:25`, lesson 2);
an antivirus lock or a live descendant when a scratch folder is removed; `npm` installed as `npm.cmd`; git hooks in the lane repository; a repository with no `main` branch; a
lane branch that no longer exists; a mistyped or repeated pair id, or one holding a character Windows forbids in a file name; case labels with no label reader; a bad or
oversized parts value; a selection of only skipped pairs; a tip that does not resolve, or a lane branch that moved past it; a throw inside one part; more parts than pairs; a
stop by Ctrl-C or a background-task stop; a table copied from an older one or out of its checkout. Out of scope, deliberate forgery: a forged pair table, a test file written
to print false PASS or FAIL lines, tampering with a scratch worktree from outside the run, and lane code that attacks the machine (the runner runs the lane's own code by
design, as the suite does). A finding outside the model is a residual.

## 2. Requirement delta

Main's highest ID is R-1183; `feat/regroup` (`c514964`) adds R-1170 to R-1180, R-1184 and R-1187; `feat/roster-notice` (`59db91d`) R-1190 to R-1215. The seat gave this lane
R-1230 to R-1269 on 2026-10-16. None of them is used anywhere (Ran 2026-10-16: `git grep -E 'R-12(3[0-9]|4[0-9]|5[0-9]|6[0-9])([^0-9]|$)'` over all 39 local and remote
branches, 0 hits, with a control grep for R-1183 finding it on 7; `grep -rIlE` over the main checkout and the three lane worktrees, 0 files). The runtime-map plan's first
draft used R-1220 to R-1238 (`../runtime-map/CHANGE.md` §2), which overlapped this range at R-1230 to R-1238; that plan now holds R-1270 to R-1299 (Read: its §2 as saved at
22:23), so carry 1 is closed. This plan uses R-1230 to R-1269; revision 3 gave R-1269, kept free until then, to the group kill after every test file. One `shall` per row:
the rail's EARS check counts exactly one, code spans masked
(`templates/typescript/template/tests/requirements-trace.ts:279-290`). A new row enters `planned` and flips to `implemented`, with its evidence cell, in the commit whose code
turns its marked tests green; in between the trace rail is red. Rows are placed by feature ID, never by line, because the lanes ahead of this one add rows first. All rows go to
FEAT-031 ("Run checks reliably and without contaminating work", `REQUIREMENTS.md:1473`), with no new subgroup (S4).

| ID | Change | Text |
|---|---|---|
| R-1230 | added | The mutation runner shall apply each pair's edits in a detached scratch worktree of the lane tip that it creates in a new folder under the OS temp folder, reset to the tip and cleared of untracked and ignored files before each pair. |
| R-1231 | added | The mutation runner shall run every git command it starts with git hooks turned off. |
| R-1232 | added | IF a scratch worktree path is missing or is not its own git root, THEN the mutation runner shall run no git reset or clean there. |
| R-1233 | added | WHEN a run ends, the mutation runner shall remove every scratch worktree it created, with its git worktree entry and its folder, or, with the keep option set, leave each one and print its path. |
| R-1234 | added | IF the mutation runner cannot remove its scratch folder, THEN the mutation runner shall print one line naming the folder after the RESULT line and keep the run's exit code. |
| R-1235 | added | The mutation runner shall run each named test file as `node --experimental-strip-types <file>` from the file's package folder. |
| R-1236 | added | The mutation runner shall give each test file run a fresh home folder and a fresh temp folder of its own as HOME, USERPROFILE, TMPDIR, TEMP and TMP. |
| R-1237 | added | The mutation runner shall remove from each test file's environment every ambient NANA_ variable except NANA_TEST_ ones, and PI_CODING_AGENT_DIR. |
| R-1238 | added | The mutation runner shall set git's gc.auto to 0 in each test file's environment after the caller's GIT_CONFIG entries. |
| R-1239 | added | WHERE the caller's environment lacks npm's prefix, global config or user config value, the mutation runner shall give each test file the value npm reports for it, and the prefix as npm's global prefix when the caller sets none, or print one line naming each value it could not read. |
| R-1240 | added | WHEN a test file runs past the per-file time limit, the mutation runner shall kill the file's whole process tree and count the file as timed out. |
| R-1241 | added | WHEN a test file exits while a descendant still holds its output open, the mutation runner shall stop waiting for that output after the configured drain. |
| R-1242 | added | WHEN the run receives SIGINT or SIGTERM, the mutation runner shall kill the process tree of every test file still running, print its scratch folder's path and exit non-zero. |
| R-1243 | added | The mutation runner shall start every git command, syntax check and script edit with no stdin and stop it at the configured helper time limit. |
| R-1244 | added | IF an edit's anchor or pattern does not occur exactly its stated number of times, or a script edit exits non-zero or runs past the helper time limit, THEN the mutation runner shall report the pair as ANCHOR-MISS, run none of its test files, and end the run with exit 3. |
| R-1245 | added | IF a mutated .mjs or .js file fails `node --check`, or a mutated .ts file fails the repository's TypeScript syntax checker, THEN the mutation runner shall report the pair as SYNTAX, run none of its test files, and end the run with exit 3. |
| R-1246 | added | WHILE the parts count is 1, the mutation runner shall run each test file a runnable pair names once, unmutated, before any pair, and run a red one again up to the configured baseline retries, printing each attempt. |
| R-1247 | added | WHILE the parts count is N above 1, the mutation runner shall run each test file a runnable pair names as N unmutated copies at the same time, one in each scratch worktree, before any pair and with no retry. |
| R-1248 | added | IF a baseline test file is still red after its attempts, THEN the mutation runner shall judge no pair and exit 2, naming the file and, above one part, saying to re-run with `--parts 1`. |
| R-1249 | added | IF no PASS line in a runnable pair's unmutated test files equals a title the pair names or begins with it followed by a space, THEN the mutation runner shall judge no pair and exit 2, naming the pair and the title. |
| R-1250 | added | The mutation runner shall read each PASS and FAIL line as the longest candidate title that the line equals or begins with followed by a space, or as the line's own text when none matches, where the candidates are every title the table names and each PASS line of the same file's unmutated run that begins with a named title and a space when that run also printed the named title alone. |
| R-1251 | added | The mutation runner shall print RED for a pair with a failing title or a crashed or timed-out test file, listing each named title that stayed green or was not reached and each failing title neither named nor declared also-red, and GREEN (SURVIVED) for a pair with neither. |
| R-1252 | added | WHERE a pair lists stay-green titles, the mutation runner shall print GREEN (stays green, expected) only when no title fails and every listed title passes, and RED (UNEXPECTED) otherwise. |
| R-1253 | added | WHERE a pair lists expected case labels, the mutation runner shall list each expected label absent from its named titles' FAIL details, read through the table's label reader, and count the pair as having a named case green. |
| R-1254 | added | WHERE a pair carries a skip reason, the mutation runner shall print SKIPPED with that reason and neither apply its edits nor run its test files. |
| R-1255 | added | The mutation runner shall end its record with one RESULT line that counts red pairs, pairs red on exactly their named titles, pairs with a named title or case green, pairs with an unnamed red, survivors with their ids, stay-green pairs, and ANCHOR-MISS, SYNTAX, ERROR and skipped pairs. |
| R-1256 | added | WHILE the parts count is N above 1, the mutation runner shall run up to N pairs at the same time, each in its own scratch worktree. |
| R-1257 | added | The mutation runner shall take its parts count from `--parts N`, else from the parts variable, else from the available cores divided by the configured cores per part and rounded down, held between 1 and the smaller of the runnable pair count and the available cores, printing one line when it cuts a requested count. |
| R-1258 | added | WHEN no selected pair is runnable, the mutation runner shall create no scratch worktree and print each selected pair's SKIPPED line and the RESULT line. |
| R-1259 | added | The mutation runner shall write each selected pair's line to its record exactly once and in table order, each as soon as every earlier pair's line is written, whatever order the pairs finish in. |
| R-1260 | added | IF preparing, editing or running a pair throws, THEN the mutation runner shall report the pair as ERROR with the message, take no further pair in that part, and end the run with exit 3. |
| R-1261 | added | IF every part has stopped while selected pairs remain unreported, THEN the mutation runner shall name each such pair on a NOT RUN line and end the run with exit 3. |
| R-1262 | added | IF a pair id on the command line is not in the table, the table repeats a pair id, a pair id holds a character other than `/` that Windows forbids in a file name, a pair lists case labels while the table gives no label reader, the parts value is not a positive whole number, or the tip names no commit, THEN the mutation runner shall refuse before creating any worktree, naming the id or value, and exit 2. |
| R-1263 | added | The mutation runner shall read its cores per part, per-file time limit, baseline retries, helper time limit and scratch prefix by name from its config module, which holds each value with its provenance and which a caller may replace whole. |
| R-1264 | added | The mutation runner shall use the suite runner's output drain and kill grace values. |
| R-1265 | added | The mutation runner shall begin its record with one line naming the lane, the tip, the lane branch's head when it differs from the tip or `none` when the branch does not resolve, the merge base with main or `none`, the pair count, the parts count, the platform, the Node version and one SHA-256 over its three modules, with `config injected` when a caller replaced the config, followed by one DECLARED line per declared reading and one TITLE line per short title name. |
| R-1266 | added | WHEN the dry option is set, the mutation runner shall apply and syntax-check every selected pair's edits, print DRY ok for each pair that applies, and run no test file. |
| R-1267 | added | WHEN a log folder is given, the mutation runner shall save each pair's output for each test file there, named by the pair's id with each `/` turned into `-`, then `--`, then the file's base name. |
| R-1268 | added | The mutation runner shall read its record path, tip override, dry, keep, log folder and parts options from SEAT_MUTATE_OUT, SEAT_MUTATE_TIP, SEAT_MUTATE_DRY, SEAT_MUTATE_KEEP, SEAT_MUTATE_LOGDIR and SEAT_MUTATE_PARTS. |
| R-1269 | added | WHEN a test file's run ends on a POSIX platform, the mutation runner shall kill what remains of the file's process group before that scratch worktree takes another pair. |

40 rows added, none reworded or retired. FEAT-031 holds 37 rows on main, most of them the suite runner's (R-898, R-899, R-544, R-601, R-948, R-949, R-626 and R-627 are not).
R-1235 to R-1238 and R-1240 to R-1242 repeat clauses of R-603, R-604 with R-917, R-618, R-648, R-912, R-610 and R-915 for the mutation runner, because the two runners share
no code until the parallel suite lane (residual 1). R-1269 has no suite counterpart: the suite runner kills a tree only at its timeout and after its drain
(`scripts/test.mjs:240`, `:257`), while five copies kill the group after every run (`:234`; roster `:307`, "a mutated launcher's child"; lift `:335`; tree `:298`;
seat-guide `:230`; Ran `grep -n 'stray group members'`). Its Windows half is a residual (15), not a clause, so the row can reach `implemented` on what macOS pins. R-291's
text is unchanged; its check's leaf-total literal changes (§5.2), and no evidence cell cites that title (Ran: `grep "leaf counts total" REQUIREMENTS.md`, no hit). Leaf
total 1,139 at `2dbc817` (`requirements-tree.test.mjs:40,54,55`); 1,152 on main at `c514964` (Ran `git show`) and 1,165 on `feat/roster-notice` (`factcheck.md` §3, Ran);
the lane adds 40 to whatever main holds at its base.

## 3. Design

**3.1 Three modules in the pack's lib.** The code map lets apps and `scripts/` import packages, never the reverse (`code-map.config.json` `layers`), so a module in
`packages/nana-pack/lib/` can later serve `scripts/test.mjs` (the parallel suite lane), and one in `scripts/` could never serve a package. `docs/reviews/` is not a map root, so
lane tables stay outside the map. No bin, PATH link or `package.json` change: the lane table is the entry point. Each module opens with the six-tag header.
- `lib/test-child.mjs` — *@purpose* "Run one test file the way the suite runner does and return its exit, output, seconds and whether it timed out." *@effects* process, disk.
  Exports `childEnv(base, { home, tmp })` (no effects), `npmConfigValues({ env, platform, spawn })`, `runTestFile({ file, cwd, env, scratchRoot, timeoutMs, drainMs,
  killGraceMs, live })` (makes and removes the file's own home and temp folders under `scratchRoot`; adds the child to the caller's `live` set while it runs; on POSIX kills
  what is left of the file's process group before it resolves, as five copies do at `:234`, R-1269) and `killTree(child)`. It reads no config: the caller passes every limit. On win32 it starts npm through `findOnPath` and `winCommand` from `lib/win-command.mjs`, which it imports
  and does not edit (41 transitive callers today, Ran `node scripts/code-map.mjs --impact packages/nana-pack/lib/win-command.mjs` in a scratch copy; the new modules are leaves).
- `lib/mutation-runner.mjs` — *@purpose* "Apply a lane's pair table in scratch worktrees of its tip, run each pair's named test files, and judge and report each pair once."
  *@effects* disk, process. Exports `runMutations(spec, deps)` (resolves to the exit code); the edit makers `anchorEdit(file, anchor, replacement, times = 1)`,
  `regexEdit(file, re, replacement, times)` and `runEdit(args)`; `resetScratch(dir, tip)` (for M3); and `judgePair(pair, runs, candidates, labelsOf)`, which has no effects, so
  the judging lines are tested without git. It starts the repository's TypeScript checker (`scripts/ts-syntax-check.mjs`, R-993, R-994) as a helper child with the table's
  `repo` as its root, never imports it, so the layer rule is untouched. `deps` injects `argv`, `env`, `cores`, `out`, `config`, `runTestFile` and `rmDir`, each defaulting to the real one.
- `lib/mutation-runner-config.mjs` — *@purpose* "Hold the mutation runner's tunables and contract values, each with its provenance." *@effects* none.

**3.2 How a run goes.**
1. Read the pair ids and `--parts N` from the arguments and the six `SEAT_MUTATE_` variables (R-1268). Resolve the tip, the branch head and the merge base with `MAIN_BRANCH`;
   a branch or merge base that does not resolve prints `none` and the run goes on, because both fields are information only (R-1265). Refuse with exit 2 before any worktree
   on any R-1262 case.
2. Split the selection into skipped and runnable pairs. With nothing runnable, print the header (reading `parts 0`), each SKIPPED line and RESULT, and make no worktree
   (R-1258).
3. Set the parts count (R-1257): `--parts`, else `SEAT_MUTATE_PARTS`, else `floor(os.availableParallelism() / CORES_PER_PART)`; held between 1 and the smaller of the
   runnable pair count and the available cores, with one line when a requested count is cut.
4. Print the header, the DECLARED lines and the TITLE lines (R-1265), then `seat-mutate: scratch <folder>`. The header's hash covers `mutation-runner.mjs`, `test-child.mjs`
   and `mutation-runner-config.mjs` in that order; an injected config adds `config injected`.
5. Make one folder with `mkdtemp(<os.tmpdir()>/<SCRATCH_PREFIX>)` holding an empty `no-hooks` folder and the worktrees `wt0` to `wt<N-1>`, added one after another with
   `git -c core.hooksPath=<no-hooks> worktree add --detach` (R-1230, R-1231). Every git call carries that hooks path. Git took 40 adds eight at a time, then 40 removes at
   once, in a throwaway repository (`research.md` §1.4, Ran); adding one after another needs no Windows probe and costs N short calls.
6. Baseline phase. At one part, each file a runnable pair names runs once, unmutated, and a red file runs again up to `BASELINE_RETRIES` times, each attempt printed as
   `BASELINE` or `BASELINE RETRY` (R-1246). Above one part, each file runs as N unmutated copies at the same time, one per worktree, files one after another, with no retry
   (R-1247): the pair phase runs N copies of one file at once (172 of 187 regroup pairs name one file, 35 of 36 regroup-shares pairs; `design-critique.md` MUST-4, Ran), so the
   baseline loads the machine the way the pairs will. A red file after its attempts refuses the run with exit 2, names it, and above one part says to re-run with `--parts 1`
   (R-1248); its output goes to the log folder when one is given. Then every title a runnable pair names (`expectRed`, `alsoRed`, `expectGreen`) needs a PASS line in one of
   that pair's baseline files that equals it or begins with it followed by a space: the copies' rule (`:242`, used at `:314`), so a title whose PASS line carries detail
   passes (R-1249). Each file's baseline PASS lines are kept for R-1250's candidates.
7. Pair phase: one queue in table order. A part takes the next index before any await (`const i = next++`), so no two parts take one pair. It checks that its worktree is its
   own git root (R-1232, compared with `fs.realpathSync.native` on both sides), resets it to the tip and runs `git clean -fdxq` (R-1230; scratch worktrees hold no
   `node_modules`, since the root `package.json` has no dependencies at `2dbc817`), applies the edits, runs `node --check` on each mutated `.mjs` or `.js` and the TypeScript
   checker on each mutated `.ts` (R-1245), runs the pair's files through `runTestFile`, which on POSIX kills what is left of each file's group before it returns (R-1269),
   judges with `judgePair` and stores the line at index i.
8. Output: stdout prints each pair line as the pair finishes, so a monitor sees progress. The record (`SEAT_MUTATE_OUT`) gets the pair lines in table order, each written once
   every earlier line is written (R-1259): a run stopped half-way leaves a valid prefix, and two runs of one table compare line by line.
9. Faults: a throw while preparing, editing or running a pair prints `ERROR <id> <name> — <message>`, and that part takes no further pair, because its worktree's state is
   unknown (R-1260). A git call past `HELPER_TIMEOUT_MS` throws, so it lands here. When every part has stopped with pairs left, one `NOT RUN` line names them (R-1261). Both end
   with exit 3. A throw before the pair phase (adding a worktree) ends the run through Node's own error exit after cleanup, with no pair judged (residual 13).
10. The RESULT line (R-1255), then cleanup in `finally`: unless keep is set, each worktree goes through `git worktree remove --force`, then the folder through
    `fs.rmSync(…, { recursive: true, force: true, maxRetries: RM_RETRIES })`, then `git worktree prune` (R-1233). Each step catches its own error; a folder left behind is
    named on one line after RESULT, and the exit code stays the verdict's (R-1234). With keep, each path is printed.
11. Exit 0, or 3 after any ANCHOR-MISS, SYNTAX, ERROR or NOT RUN.

Helper children (R-1243): every git call, `node --check`, TypeScript check and script edit runs through one internal helper that is awaited, starts with `stdio: ["ignore", "pipe", "pipe"]` and
`windowsHide`, and is killed at `HELPER_TIMEOUT_MS`. Ran (`design-critique.md` MUST-5): under `spawnSync`, a child that reads stdin got end of input and exited 0; under async
`execFile`, the same child still waited when a 3 s limit killed it. Async calls keep one part's reset from stalling another part's test; the copies use `spawnSync` (`:113`).
Ran `probe-reset/probe.mjs` (re-Ran in `factcheck.md`): five sibling worktrees of one repository each did 30 rounds of edit, async `git reset --hard` and `git clean -fdq` at
the same time, with 0 git errors, all five clean at the tip, one worktree entry left after removal, in 1.6 to 1.7 s.

Signals (R-1242): SIGINT and SIGTERM handlers kill every child in the `live` set with `killTree`, print the scratch folder and `git worktree prune` as the way to clear it, and
exit 130 or 143, as the suite runner does (`scripts/test.mjs:107-114`). Worktree removal is left to that command.

One process holds every part (option B1 in `research.md` §2) rather than one child process per part (B2). B2 is no longer only the hand split: the roster-notice runner
builds it in (§1), merged record, `MISSING` lines and unknown-id refusal included, and has one measured run. B1 is kept against that built-in form, for three reasons and at
two costs.
- *A shared queue, not a fixed deal.* B2 deals pairs round-robin before the run (`:499`), so a part with cheap pairs and no slow baseline finishes early and idles: in the
  measured run part 1 ended 80 s before the last part (§1). In B1 each part takes the next pair when it is free.
- *Nothing to merge.* B2 writes a part file and a tally file per part (`:517`), then parses its own pair lines back with a pattern (`:296`, `:536`), and writes the merged
  record only once every part ends (`:556`). B1 keeps order and exactly-once in memory, and its record holds a valid table-order prefix while it runs (R-1259).
- *One header and one baseline phase,* run as N copies at once (R-1247), instead of N shard headers and N baselines.
- *Cost: no process isolation.* A crash in one B2 part leaves the others running; in B1 a throw ends that part only (R-1260), and an uncaught one ends the run (residual 13).
- *Cost: the baseline phase runs files one after another.* B2's parts run their baselines side by side, each over its own files. On the measured roster-notice table the
  12 baseline files take 59.5 s in sequence and the pairs about 302 s of part time, so B1 would take about 60 + 302 / 5 ≈ 120 s against B2's measured 135 s (INFERRED: it
  assumes baseline times do not grow under N copies and a perfect queue). On a table whose pairs name one file, as 173 of 187 regroup pairs do (`factcheck-r2.md` S6, Ran),
  the two baselines cost the same.

**3.3 The judging stays the copies' judging.** `judgePair` is the newest copy's judging (the regroup runner, `regroup-runner.mjs:582-620`, with `alsoRed` at `:585`), plus the
stay-green pair of `docs/reviews/seat-guide-2026-10-14/seat-mutate.mjs:346-356`, the expected case labels of `:357-367` read through a table-supplied `labelsOf` (the lift's
reader is `:247`), and the skip of `:321-325`. Output splits at `\r?\n` and each title is trimmed (`:241`). A file counts as crashed when its last line is Node's version
line, when it exits non-zero or times out with no FAIL line, or when it prints FAIL lines and exits 0, as in the copies.

One change, in how a line is read as a title. The copies match a line to a named title when `t === title || t.startsWith(title + " ")` (`:242`, `:314`, `:351`), so when a
pair names title A and a longer title "A …" fails while A passes, the pair reads as red on A (4 such title pairs on main, `design-critique.md` S-3, Ran). The fix must
keep the copies' reading wherever a file prints detail after a title, which is common, on PASS lines as well as FAIL lines:
- 34 collected test files print their check helper's third argument on PASS lines too, 16 desk, 14 bench, 3 pack and 1 stage (Ran `grep -lE` for
  `console.log(ok ? "PASS" : "FAIL", n, extra)` and its spellings over the collected test roots), among them `apps/desk/test/changes-endpoint.test.mjs:35`, which
  revision 2 cited for the opposite. 58 print nothing after a PASS title, as the lift test does (`requirements-lift.test.mjs:20`; Ran `grep -lE 'ok \? "" : (why|detail|extra)'`
  over the same roots, 144 test files in all).
- `blocks.test.mjs:54` (nana-stage) prints `PASS valid chart {"ok":true}`; `changes-endpoint.test.mjs:718` prints `PASS route: an unknown session is 404 404`, and `:720` its
  longer partner `PASS route: an unknown session is 404 on the file route too 404`. Ran `agent-dir-config.test.mjs`: 42 of its 98 PASS lines end with the run's own temp
  path, so they differ on every run. `packages/nana-knowledge/tests/hook.test.mjs:200` and `:339` put measured milliseconds at the end of the title itself.
- Ran `crit2/probe-pass-detail/probe.mjs` (one mutant in a copy of nana-stage): revision 2's R-1249, a whole-line match, refuses `valid chart`, and its R-1250, PASS
  texts only, reads the mutant's FAIL line as its own text, so the pair would read "not reached" plus an unnamed red. The copies' rule gets both right.

So R-1249 keeps the copies' rule, and R-1250 reads every PASS and FAIL line as the longest *candidate* title it equals or begins with plus a space. The candidates are every
title the table names (each pair's `expectRed`, `alsoRed` and `expectGreen`, and the keys of the table's `titles` map), plus one safe use of the baseline: a PASS line that
begins with a named title and a space, from a file whose baseline also printed that named title alone. A title printed alone carries no detail on its own line, so
another PASS line that begins with it and a space is a longer title, unless the file prints that same title twice with different detail (residual 17). A raw PASS text is never a candidate otherwise: a check whose third argument is the same on PASS and FAIL (a constant, as at
`apps/bench/test/study-tasks.test.mjs:259`, or a status code the mutant leaves alone) would turn its FAIL line into that PASS text and lose the named title. Ran
`r3/probe-title-rule/probe.mjs` over six cases shaped on the files above:

| Case | Copies | PASS texts as candidates (round-2 wording) | Table titles only | R-1250 |
|---|---|---|---|---|
| A: detail on PASS and FAIL (`blocks.test.mjs:54`) | right | right | right | right |
| B: bare titles, the longer one unnamed (`tokenize.test.mjs:32-33`) | wrong | right | wrong | right |
| C: detail, both titles named in the table (`changes-endpoint.test.mjs:718-720`) | wrong | wrong | right | right |
| D: detail, the longer title unnamed (same file) | wrong | wrong | wrong | wrong |
| E: a third argument the mutant leaves unchanged | right | wrong | right | right |
| F: a temp path in the detail (`agent-dir-config.test.mjs:44` form) | right | right | right | right |

R-1250 is never below the copies on these cases. Case D stays as the copies have it: the table settles it by naming the longer title in its `titles` map, and the README
says so (residual 16). The RED line then lists A as still green whenever a longer candidate takes the failing line.
- A `.ts` edit is syntax-checked up front with the repository's own checker, `scripts/ts-syntax-check.mjs` (R-993, R-994, `REQUIREMENTS.md:1470-1471`; on the tree since
  2026-10-08, so present at acceptance 2's tip `f6bb0bd`, Ran `git cat-file -e`), run as this repo's `.ts` post-edit check does (`.pi/nana-pack.json:5`). Node's own
  `--check`, with or without `--experimental-strip-types`, exits 0 for a broken `.ts` file (Ran `probe-ts/probe.mjs`). Ran: the checker exits 1 with
  `ERR_INVALID_TYPESCRIPT_SYNTAX: Expression expected` on `probe-ts/lib/bad.ts` and `bad2.ts` in 0.08 s each, and exits 0 on `packages/nana-knowledge/lib/build.ts` in
  0.09 s. Revision 2 read SYNTAX from a crashed test's output instead; that misses a `.ts` module a test reaches only through a spawned child. Ran
  `r3/probe-ts-child/run.sh` (a broken `bin/nana-knowledge.ts`, which `hook.test.mjs:286-317` spawns): the checker exits 1 up front, while the test prints a FAIL line
  and passes "CLI query exits 1 on a corrupt index" because the broken child also exits 1. This file then happens to crash at a later `execFileSync`; a test that reaches
  the module only through `spawnSync` would not crash, and the crash reading would judge it RED (INFERRED from the copies' crash rule). The checker is started as a helper
  child under R-1243's stdin rule and limit, from the table's `repo`, with its arguments as the contract value `TS_CHECK_ARGS` (§3.5). A checker missing from `repo`
  makes every `.ts` pair SYNTAX and the run exit 3, so that fault fails closed.
- Line words kept: the header `seat-mutate: lane …`, `seat-mutate: scratch …`, `DECLARED`, `TITLE`, `BASELINE ok` and `BASELINE FAIL`, `BASELINE RETRY`, `BASELINE MISSING`,
  `RED`, `GREEN … SURVIVED`, `GREEN … stays green (expected)`, `RED … UNEXPECTED`, `ANCHOR-MISS`, `SYNTAX`, `SKIPPED`, `DRY ok`, `RESULT`, `RESULT (DRY)` and
  `seat-mutate: KEEP`. New: the header fields `parts N`, `runner sha256:<12 hex>`, `config injected` and `none`, and the line words `ERROR` and `NOT RUN`.
- Old records stay valid: nothing edits or runs the nine runners or their records; the two in-flight lanes keep their own copies to the end (S6); an old and a new record read
  the same pair line for the same verdict, except a pair whose named title prefixes a failing title (R-1250); a new record's header names the runner that judged it by hash.
- A red baseline file's full output goes to the log folder when one is given; the runner writes nothing beside the table.

**3.4 The lane table.** A lane's `docs/reviews/<lane>-<date>/seat-mutate.mjs` becomes constants, titles, DECLARED readings, the pair table and one call. Pair fields: `n`, `name`,
`edits`, `tests`, `expectRed`; optional `alsoRed`, `expectGreen`, `expectWhy`, `skip`. Table fields: `lane`, `repo`, `tip`; optional `branch`, `declared`, `titles`, `labelsOf`.
`repo` is found from the table's own path, so a table carries no absolute path (`design-critique.md` S-13; all nine copies hard-code a path under the home folder, `:37`).
Usage is the copies' usage plus the parts option (`:30`):
`SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] [SEAT_MUTATE_KEEP=1] [SEAT_MUTATE_LOGDIR=<dir>] [SEAT_MUTATE_PARTS=<n>] node seat-mutate.mjs [--parts N] [pair-id …]`.

```js
// A seat script, never imported, run or copied by a suite test (builder preamble, `packages/nana-pack/prompts/builder-preamble.md:22`).
import { fileURLToPath } from "node:url";
import { runMutations, anchorEdit } from "../../../packages/nana-pack/lib/mutation-runner.mjs";
const LIFT = "scripts/requirements-lift.mjs";
const LT = "packages/nana-pack/tests/requirements-lift.test.mjs";
const T1 = "R-1181: the identity mapping of a tree-form ledger with shares writes each Also applies line byte-identical, …";
process.exitCode = await runMutations({
  lane: "regroup-shares", repo: fileURLToPath(new URL("../../../", import.meta.url)), tip: "f6bb0bd",
  declared: ["(a) pair ids: …"], titles: new Map([[T1, "T1"]]),
  pairs: [{ n: "1/4", name: "writer regenerates a kept line", edits: [anchorEdit(LIFT, "    if (sources.length === 1 && !changes) return sources[0].seg;\n", "")], tests: [LT], expectRed: [T1] }],
});
```

**3.5 Config, read by name** (`lib/mutation-runner-config.mjs`; each value with its provenance beside it).

| Name | Value | Provenance |
|---|---|---|
| `CORES_PER_PART` | 2 | chosen, from two runs at five parts on a 10-core seat machine (2026-10-16): the regroup hand split, 217 pairs at 8.6 a minute against 2.0 to 3.3 serially, load average 9.0 to 10.8 (`research.md` §1.3); the roster-notice built-in split, 68 pairs in 2 min 15 s, with no serial run or load reading beside it (§1); the claim most likely wrong (§5.4) |
| `FILE_TIMEOUT_MS` | 600000 | chosen: every copy uses 10 minutes (`:50`), twice the suite's 5 (`scripts/test.mjs:57`), because parts share the machine |
| `BASELINE_RETRIES` | 1 | chosen: the regroup runner re-runs a red baseline file once, alone, because other heavy jobs share the machine (`regroup-runner.mjs:546-551`); used at one part only (R-1246) |
| `HELPER_TIMEOUT_MS` | 120000 | chosen: the slowest helper probed took 31 ms (reset and clean; worktree add 24 ms, `node --check` 26 ms; `design-critique.md` S-5, Ran); two minutes leaves room for a script edit that regenerates a file and still ends a hang |
| `DRAIN_MS` | 2000 | contract R-1264: the suite runner's drain (`scripts/test.mjs:58`, R-610), so a file behaves as under `npm test` |
| `KILL_GRACE_MS` | 5000 | contract R-1264: the suite runner's kill grace (`scripts/test.mjs:59`; its row R-611 is `untested`, `REQUIREMENTS.md:1495`) |
| `RM_RETRIES` | 5 | chosen: rides over a short antivirus or indexer lock when a scratch folder is removed on Windows; read only with `recursive: true` (Node docs) |
| `SCRATCH_PREFIX` | `seat-mutate-` | chosen: one prefix, so a leftover folder is easy to find |
| `HASH_CHARS` | 12 | chosen: enough to tell runner versions apart in one header line |
| `MAIN_BRANCH` | `main` | contract: the working pattern's base branch, read for the merge base |
| `ENV_NAMES` | `SEAT_MUTATE_OUT`, `_TIP`, `_DRY`, `_KEEP`, `_LOGDIR`, `_PARTS` | contract R-1268: the first five are the names the copies read (the usage line `:30` and the keep note `:27`); `_PARTS` is new |
| `PARTS_FLAG` | `--parts` | contract R-1257 |
| `NPM_KEYS`, `GLOBAL_PREFIX_KEY` | `prefix`, `globalconfig`, `userconfig`; `global_prefix` | contract R-1239: the values `npm run` exports that the copies supply, the fourth filled from the prefix (`:182-188`); `restore.test.mjs` needs them under plain node (`docs/reviews/seat-guide-2026-10-14/seat-mutate.mjs:173-176`) |
| `EXIT_REFUSED`, `EXIT_TABLE_FAULT` | 2, 3 | contract R-1244, R-1245, R-1248, R-1249, R-1260 to R-1262: the copies' exits for an unjudged run and for ANCHOR-MISS or SYNTAX (`:318`, `:392`) |
| `SIGNAL_EXITS` | SIGINT 130, SIGTERM 143 | contract R-1242: the suite runner's codes (`scripts/test.mjs:109`) |
| `CHILD_NODE_ARGS` | `--experimental-strip-types` | contract R-1235, after R-603 |
| `TS_CHECK_ARGS` | `--no-warnings`, `--experimental-vm-modules`, `scripts/ts-syntax-check.mjs` (the script path resolved against the table's `repo`; the mutated file follows) | contract R-1245: the repository's `.ts` post-edit command (`.pi/nana-pack.json:5`), whose checker R-993 and R-994 state; without `--experimental-vm-modules` it exits 1 on a valid file ("vm.SourceTextModule is not a constructor", Ran) |
| `WIN_FORBIDDEN_ID_CHARS` | `<>:"\|?*` and control characters | contract R-1262: the characters Windows forbids in a file name, less `/`, which R-1267 turns into `-` (Node and Windows naming docs, INFERRED for this list) |
| `LOG_NAME` | `/` becomes `-`, joined by `--` | contract R-1267: the copies' log names (`:344`) |
| `CONFIG_INJECTED_MARK` | `config injected` | contract R-1265 |

M38 alone holds the sealed literals of `ENV_NAMES`, `PARTS_FLAG`, `EXIT_REFUSED`, `EXIT_TABLE_FAULT`, `CHILD_NODE_ARGS`, `TS_CHECK_ARGS` and `NPM_KEYS`; M33 compares `DRAIN_MS` and
`KILL_GRACE_MS` with the suite runner's text; every other check imports the names, so a re-measure of `CORES_PER_PART` changes the config and no test. `DRAIN_MS` and
`KILL_GRACE_MS` are defined twice, here and in `scripts/test.mjs:58-59`, which the standards forbid: a declared violation, pinned equal by M33 and closed by the parallel suite
lane (residual 1).

**3.6 Cross-platform.** Process tree: `detached` and a group kill on POSIX, `taskkill /T /F /PID` and `windowsHide` on win32, as `scripts/test.mjs:76-83` and `:206-212`.
After a test file ends, POSIX kills what is left of its group (R-1269); Ran `r3/probe-stray/probe.mjs`: a child that a test file leaves running after a normal exit was
still alive 2 s later with no kill, and gone within 2 s after a group kill. On Windows `taskkill /T` walks the tree from a live parent, so once the test file has exited
its orphaned descendants are out of reach (INFERRED; residual 15). The TypeScript checker is plain Node on both platforms. Helper children: stdin ignored and
`windowsHide` on every platform. Hooks off through an empty folder inside the scratch folder, not `/dev/null`. Paths compared with `fs.realpathSync.native` on both sides
(8.3 short names), for the own-root check. Scratch folders removed with `recursive` and `maxRetries`. npm found
with `findOnPath` and started through `winCommand` on win32, or one printed line naming the values not read (R-1239). Output split at `\r?\n`. Test paths joined with
`path.join`, so a table's forward slashes work on Windows. The parts default uses `os.availableParallelism()` (Ran: 10 on the seat machine), never `os.loadavg()`, which reads
zeros on Windows. Signals: on Windows Ctrl-C reaches Node as SIGINT and the system sends no SIGTERM (Node docs, INFERRED for this runner); M8 runs on POSIX and prints SKIP on
Windows. Path length: the longest tracked path at `2dbc817` is 145 characters (`design-critique.md` N-6, Ran), so a temp folder path under about 65 characters keeps a worktree's
files under Windows' 260 (INFERRED); the README states it.

**3.7 Docs.** The pack README gains one section, `## Seat mutation runner (lib/mutation-runner.mjs)`, after the writing checker section (`README.md:309`): what it is for, the
table shape and usage of §3.4 with the table path spelled `docs/reviews/<lane>-<date>/seat-mutate.mjs`, the line words, exits 0, 2 and 3, the parts default, and its limits —
run one split run per machine at a time, because two at once ask for about twice the cores (residual 3); a split run beside another lane's suite run loads the suite's five
wall-clock bounds, so a red there may be load (residual 3); re-run a pair whose named title is a wall-clock bound with `--parts 1` (residual 2); a run killed without a signal
handler leaves its test trees, found by the scratch folder the header names (residual 6); keep the temp folder path short on Windows; when a named title begins a longer
title in a file that prints detail after titles, name the longer title in the table's `titles` map (residual 16); on Windows a child a test file leaves running outlives
it (residual 15); a lane that needs one of the features left out keeps a local runner (residual 4). The checker reads a code span holding `<…>` as prose, and a bare `seat-mutate.mjs` as a path that must exist (Read:
`templates/typescript/template/scripts/readme-check.mjs:305-318`; `factcheck.md` C-a, Ran), so the section never names the table file bare. No root README, AGENTS.md, seat guide
or shared working pattern change in this lane (S13).

**3.8 What NOT to do.** No edit to the hand-copied runners on main or their records, to the in-flight lanes' runners, to `scripts/test.mjs`, to
`scripts/ts-syntax-check.mjs` (started as a child, never imported), the seat guide (the seat-rule lane owns it, and its revision 2 leaves nothing for this lane to reword,
§6 queue item 2), the shared working pattern, `package.json`, `nana-setup` or any hook. No machine-wide slot, no load reading, no part stagger, no scratch commits, acceptance scripts,
probes or Windows-only title lists. No suite test imports, runs or copies a lane table. Nothing the lane writes adds a provider, host name, absolute home path or owner name:
the corpus tables find their repository from their own path, and evidence copied into the corpus is scrubbed first (`regroup-runner.mjs:29` and
`r3/roster-notice-runner.mjs:41` name a home path, and the `r3/` probe outputs hold temp paths under it).

**3.9 Subtraction test.**

| Part | Earns it because | Cut or kept smaller |
|---|---|---|
| One shared runner | 161 to 238 plumbing lines copied per lane, 22 to 138 lines of drift per copy, the same silent drop and POSIX-only kill in all nine | lane machinery one or two lanes used stays out (S9) |
| Built-in split | about 3.9 times faster per pair on the measured run | one option; no load reading |
| One process, not a child per part | against the roster-notice runner's built-in split: a shared queue instead of a round-robin deal that left one part idle 80 s; no part files, tally files or parse of its own lines; one baseline phase | no process isolation (R-1260 and residual 13 instead); baselines in sequence, about even on the one multi-file table measured (INFERRED, §3.2) |
| Copy baseline above one part | the pairs run N copies of one file at once; a file that fails that way, or under that load, shows before it can fake a red pair | no retry above one part; files one after another |
| Retry at one part | a file red once from outside load, re-run alone | from config; one part only |
| Candidate titles (R-1250) | a named title that a longer named title begins no longer reads as pinned, and a title with detail after it still matches, as in 34 test files; a refusal would block every such pair | the table's own titles plus one safe use of the baseline; raw PASS texts are not candidates (case E) |
| `.ts` checked up front | a broken `.ts` mutant would read as RED, even one a test reaches only through a spawned child; Node's check passes it (Ran) | the repository's existing checker, started as a helper child; the crash reading of revision 2 is cut |
| Group kill after every test file | a stray child of one mutant would load or red the next pair in that worktree; five copies do it (`:234`), and the roster copy names the case it met | POSIX only; Windows is residual 15 |
| Helper stdin and limit | an async helper that reads stdin hangs the run for good (Ran) | one config value |
| Signal handler | at five parts a stop could leave five hung test trees with no timer left to kill them | kills trees only; worktrees to `git worktree prune` |
| RESULT before cleanup | a failed removal can no longer hide the verdict | one line per path left |
| Table-order record, finish-order stdout | records compare line by line; stdout shows progress to a monitor | no heartbeat timer |
| Runner hash in the header | a record names the three modules and any injected config that judged it | 12 characters |
| `test-child.mjs` as its own module | one purpose; the parallel suite lane reuses it | duplicates the suite runner's env code until then (residual 1) |
| Refusals before any worktree | close a silent pair loss present in all nine copies, and a silent label miss | — |
| ERROR and NOT RUN | a throw in one part no longer ends the run without a RESULT or loses the other parts' lines | a part stops after its first error |
| npm values, or a line when unread | a test needs them under plain node; Windows no longer skips them silently | — |
| Injected config | lets checks prove each tunable is read by name, and use short limits | the default is the config module |
| Part stagger | no: git needs none (`research.md` §1.4), and it delayed the last part 24 s per phase | cut |
| A bin, PATH link or `package.json` entry | no: the lane table is the entry point | cut |
| Scratch commits, acceptance scripts, probes, Windows-only title lists | no: one or two lanes each (residual 4) | cut; such a lane keeps a local runner |
| A load-aware parts count | no: Windows reads zeros, and runs would vary | cut |
| A machine-wide slot for split runs | not yet: one split run per machine is a README rule | later lane |
| A seat-guide line for split runs | no: the guide already points at the lane's mutation runner (`nana-seat.md:9`), whose default is now split, and the seat-rule lane's guide names a long mutation run in parts as parallel work | cut (S13) |
| Pattern (RegExp) titles, as in the roster-notice runner (`:292`) | no: the prefix rule names a title whose run value comes at its end (`hook.test.mjs:200`, `:339`); one table needs a mid-title value, and no row ID is left | cut; residual 4 |

## 4. Scope

**In.** New: `packages/nana-pack/lib/test-child.mjs`, `lib/mutation-runner.mjs`, `lib/mutation-runner-config.mjs`, `tests/test-child.test.mjs`, `tests/mutation-runner.test.mjs`.
Changed: `REQUIREMENTS.md` (40 rows in FEAT-031), `docs/requirements-tree.md` (regenerated), `packages/nana-pack/tests/requirements-tree.test.mjs` (the leaf total),
`docs/code-map.md` (regenerated), the pack README (one section), `HANDOFF.md` (a Landed line, the residual lines and the asks of §6 in the tagged form
`- **[optional|parked, since 2026-10-16] Title.** body`), `docs/sessions/2026-10.md`, and the review corpus `docs/reviews/mutate-runner-<date>/` (this file, `seat-titles.mjs`,
the seat's old-form runner for this lane, copied from the roster-notice runner, and the ported regroup-shares table of §5.4, both finding their repository from their own
path and both holding the R-190 and R-917 forms of §5.2). HANDOFF and session lines paraphrase the owner and quote nothing.
**NOT.** §3.8; the seat guide, the lane limit and their rows (the seat-rule lane); the suite runner (the parallel suite lanes); the runtime map (the runtime-map lane).
**Overlap.** `feat/regroup` adds 13 rows to `REQUIREMENTS.md` and changes 3 lines of the tree (Ran `git diff --numstat 2dbc817...feat/regroup`: `13 0` and `3 3`);
`feat/roster-notice` adds R-1190 to R-1215, pack modules and pack README text in other sections; the seat-rule lane edits the seat guide and its rows; all three change the leaf
total and land first. This lane rebases onto current main before the build and cites rows by ID. The runtime-map lane comes after this one: its first draft also adds rows to
FEAT-031, changes R-618's evidence cell (`../runtime-map/CHANGE.md` §2) and edits `scripts/test.mjs`, whose drain and kill-grace lines M33 reads; it rebases onto this lane.

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). Tunables imported by name; M38 alone holds sealed literals. The
fixture is a throwaway git repository made with `git init -b main` in the OS temp folder, with one package, two tiny `.mjs` modules, one `.ts` module and small test files whose
behaviour each pair's edit switches; nothing reads a lane table, and no fixture test file is written under `tests/` (the trace rail refuses nested test files,
`requirements-trace.test.mjs:86`). The fixture also holds a test file that prints detail after its PASS titles (the `ok ? "PASS" : "FAIL", n, extra` form, a detail that
changes on every run among them), a test file that leaves a child running after it exits, a `.ts` module that a fixture test reaches only through a spawned child, and a
copy of the repository's `scripts/ts-syntax-check.mjs`, read from the real checkout, so `TS_CHECK_ARGS` resolves in the fixture's `repo`. Every temp folder a test file
makes, fixture repositories included, comes from `tmpDir` (§5.2, R-917). Concurrency is proved with a rendezvous, never timing: each fixture test writes a start mark in a folder a `NANA_TEST_` variable names and
waits, up to a fixture limit, for its partner's mark. Marks are keyed by a value the pair's edit sets (the unmutated value in the baseline), so baseline marks never satisfy the
pair phase. A timed-out wait prints FAIL; no wait passes on time alone, and no green check waits out a limit. The fixture limit is a named constant at the top of each test
file with its provenance. Every async case runs under a per-case limit. Windows-only titles print SKIP elsewhere, and M8 prints SKIP on Windows, as the suite's other
platform checks do. The build brief gives the two files a measured time budget; Ran (`design-critique.md` S-5): `git worktree add` 24 ms, reset plus clean 31 ms,
`node --check` 26 ms, a tiny test file 30 ms, so the waits decide the suite cost. INFERRED: the two files add about 40 to 60 s to the suite.

**5.1 New checks (49 titles).**
- **`packages/nana-pack/tests/test-child.test.mjs`:**
  C1 `// req: R-1235` `test child: a file runs as node --experimental-strip-types from the package folder given, so it can import a .ts module`.
  C2 `// req: R-1236` `test child env: the home and temp folders given become HOME, USERPROFILE, TMPDIR, TEMP and TMP`.
  C3 `// req: R-1237` `test child env: ambient NANA_ variables and PI_CODING_AGENT_DIR are removed, and NANA_TEST_ variables stay`.
  C4 `// req: R-1238` `test child env: gc.auto 0 is added after the caller's GIT_CONFIG entries, which keep their places`.
  C5 `// req: R-1239` `npm values: a prefix, global config or user config the caller lacks is filled from npm, the prefix also fills a missing global prefix, and a value the caller set is kept`.
  C6 `// req: R-1239` `npm values: an npm that cannot be started fills nothing and returns one line naming each value not read`.
  C7 `// req: R-1239` `Windows: npm values are read through npm's command shim` (Windows leg only).
  C8 `// req: R-1240` `a file past its time limit has its whole process tree killed and is reported timed out` (both platforms; taskkill on Windows).
  C9 `// req: R-1241` `after a file exits, a descendant holding its output delays the result by at most the drain`.
  C10 `// req: R-1269` `a child that a test file leaves running after a normal exit is gone when the file's result returns` (POSIX; prints SKIP on Windows; the fixture child holds
  no pipe, so the drain plays no part, and the check polls for the pid's end up to a fixture limit, passing on the end, never on time).
- **`packages/nana-pack/tests/mutation-runner.test.mjs`:**
  M1 `// req: R-1230` `a pair's edit lands only in a scratch worktree under the temp folder, the source checkout stays unchanged, and the next pair in that worktree sees neither the edit nor an untracked or ignored file the test left`.
  M2 `// req: R-1231` `git hooks in the lane repository do not run when the runner adds or resets a scratch worktree`.
  M3 `// req: R-1232` `a scratch path that is not its own git root is refused before any reset or clean, and an untracked file in the repository around it survives`.
  M4 `// req: R-1233` `after a run no scratch folder or git worktree entry is left, at one part and at three`.
  M5 `// req: R-1233` `with the keep option every scratch worktree is left and its path printed`.
  M6 `// req: R-1234` `a scratch folder that cannot be removed is named on one line after the RESULT line, and the exit code stays the verdict's` (through the injected `rmDir`).
  M7 `// req: R-1235 R-1236 R-1237` `through the runner, each test file runs from its package folder with its own fresh home and temp folder, no ambient NANA_ variable and a NANA_TEST_ variable kept`.
  M8 `// req: R-1242` `SIGTERM during a run kills every running test file's process tree, prints the scratch folder and exits non-zero` (POSIX; two parts, two hung files).
  M9 `// req: R-1243 R-1244` `a script edit that reads stdin gets end of input and applies, and one that runs past the helper time limit is ANCHOR-MISS`.
  M10 `// req: R-1244` `an anchor that occurs twice or not at all, a pattern with the wrong count and a script edit that exits non-zero are each ANCHOR-MISS, run no test, and the run exits 3`.
  M11 `// req: R-1245` `an edit that breaks a .mjs module's syntax is SYNTAX, runs no test, and the run exits 3`.
  M12 `// req: R-1245` `an edit that breaks a .ts module's syntax is SYNTAX before any test file runs, even when its test reaches the module only through a spawned child, a valid .ts edit is not SYNTAX, and the run exits 3`.
  M13 `// req: R-1246` `at one part, a baseline file that fails fewer times than the configured retries allow is run again and the run goes on, each attempt printed`.
  M14 `// req: R-1247` `at two parts, each baseline file runs as two unmutated copies at the same time, one in each scratch worktree`.
  M15 `// req: R-1248` `a baseline file still red after its attempts stops the run with exit 2 and no pair line, naming the file, at one part after the retries and at two parts with no retry`.
  M16 `// req: R-1247 R-1248` `at two parts, a baseline file that fails only when two copies run at once stops the run with exit 2 and says to re-run with --parts 1`.
  M17 `// req: R-1249` `a named title that no baseline PASS line equals or begins with plus a space stops the run with exit 2, naming the pair and the title, and a named title whose PASS line carries detail does not`.
  M18 `// req: R-1250` `judge: a failing longer title that the table names, or that a file printing the named title alone printed beside it, is read as the longer title, so the named title is listed as still green, and a passing longer title does not count the named title as reached`.
  M19 `// req: R-1251` `judge: with LF or CRLF output and detail after titles on PASS and FAIL lines, a pair that reds its named title is RED naming it, and a pair with no failing title is GREEN (SURVIVED)`.
  M20 `// req: R-1251` `judge: a RED line lists a named title that stayed green, one not reached, an unnamed failing title, a crashed file and a timed-out file, and leaves a declared also-red title out of the unnamed list`.
  M21 `// req: R-1252` `judge: a stay-green pair is GREEN (stays green, expected) only when nothing fails and every listed title passes, and RED (UNEXPECTED) otherwise`.
  M22 `// req: R-1253` `judge: an expected case label absent from the named title's FAIL detail is listed and counts the pair as having a named case green`.
  M23 `// req: R-1254` `a pair with a skip reason prints SKIPPED with the reason and neither applies nor runs it`.
  M24 `// req: R-1255` `the RESULT line counts red, exact, named-green, unnamed-red, survived with ids, stay-green, ANCHOR-MISS, SYNTAX, ERROR and skipped pairs`.
  M25 `// req: R-1256` `with two parts, two pairs run at the same time in different scratch worktrees, each holding only its own edit`.
  M26 `// req: R-1257` `the parts count comes from --parts, else SEAT_MUTATE_PARTS, else the available cores divided by the cores per part, held between one and the smaller of the runnable pair count and the available cores, with one line when a requested count is cut`.
  M27 `// req: R-1258` `a selection with no runnable pair creates no scratch worktree and prints its SKIPPED lines and the RESULT line`.
  M28 `// req: R-1259` `every selected pair is written to the record once and in table order at one, two and five parts; at one part a pair's test finds the earlier pair's line already written, and at two and five parts pairs finish out of order`
  (at two and five parts it asserts from stdout that pair 2 finished before pair 1; at one part it sets no rendezvous).
  M29 `// req: R-1260` `a pair whose processing throws is ERROR with its message, its part takes no further pair, the other parts finish the rest, and the run exits 3`.
  M30 `// req: R-1261` `when every part has stopped with pairs left, each is named on a NOT RUN line and the run exits 3`.
  M31 `// req: R-1262` `an unknown pair id, a repeated table id, a pair id holding a character Windows forbids, case labels with no label reader, a parts value that is not a positive whole number and a tip that names no commit each refuse with exit 2, naming it, before any worktree is created`.
  M32 `// req: R-1263` `an injected config's cores per part, per-file time limit, baseline retries, helper time limit and scratch prefix each change what the run does`.
  M33 `// req: R-1264` `the output drain and kill grace equal the suite runner's` (reads `scripts/test.mjs` as text; it has no exports).
  M34 `// req: R-1265` `the record's first line names the lane, tip, a newer branch head or none, the merge base or none, pair count, parts count, platform, Node version, one hash over the three runner modules and an injected config, followed by the DECLARED and TITLE lines`.
  M35 `// req: R-1266` `the dry option applies and syntax-checks every selected pair, .ts files included, prints DRY ok for each pair that applies, and runs no test file`.
  M36 `// req: R-1267` `a log folder holds each pair's output for each test file, named by the pair's id with / turned into -, then --, then the file's name`.
  M37 `// req: R-1268` `SEAT_MUTATE_OUT names the record file and SEAT_MUTATE_TIP overrides the table's tip`.
  M38 `// req: R-1235 R-1239 R-1244 R-1245 R-1248 R-1249 R-1257 R-1260 R-1261 R-1262 R-1263 R-1268` `sealed values: the option names, --parts, exits 2 and 3, the child's node argument, the .ts checker command and the npm keys, and every config value has its provenance beside it`.
  M39 `// req: R-1250` `judge: a FAIL line with detail after the named title reads as the named title, even when its detail equals the baseline PASS line's`.

Every row has at least one check: R-1230 M1; R-1231 M2; R-1232 M3; R-1233 M4 M5; R-1234 M6; R-1235 C1 M7 M38; R-1236 C2 M7; R-1237 C3 M7; R-1238 C4; R-1239 C5 C6 C7 M38;
R-1240 C8; R-1241 C9; R-1242 M8; R-1243 M9; R-1244 M9 M10 M38; R-1245 M11 M12 M38; R-1246 M13; R-1247 M14 M16; R-1248 M15 M16 M38; R-1249 M17 M38; R-1250 M18 M39;
R-1251 M19 M20; R-1252 M21; R-1253 M22; R-1254 M23; R-1255 M24; R-1256 M25; R-1257 M26 M38; R-1258 M27; R-1259 M28; R-1260 M29 M38; R-1261 M30 M38; R-1262 M31 M38;
R-1263 M32 M38; R-1264 M33; R-1265 M34; R-1266 M35; R-1267 M36; R-1268 M37 M38; R-1269 C10. Evidence cells for R-1239 and R-1240 name their Windows clause as unverified:
C7 and C8's taskkill path run only on the non-blocking Windows leg, and no mutation pair has seen them red (pairs 9 and 11). R-1269 states POSIX only; its Windows gap is
residual 15. Both new test files print bare PASS lines (`ok ? "" : why`) and no title of the 49 begins with another followed by a space, so the old-form runner of
acceptance 1 reads them exactly (build-brief rule 3 below).

**5.2 Census of existing checks that change** (Read at `2dbc817`; line numbers move once the lanes ahead land, so the build works from titles).

| Check | Row | Change |
|---|---|---|
| `requirements-tree.test.mjs:40` …leaf counts total 1,139 | R-291 | red; the literal at `:40`, `:54` and `:55` becomes the total at the lane's base plus 40 (1,152 on main at `c514964`); no evidence cell cites this title |
| `requirements-tree.test.mjs:36` R-291: committed outline equals a fresh render, and `:38` | R-291 | red until `node scripts/requirements-tree.mjs --write` regenerates `docs/requirements-tree.md` |
| `requirements-trace.test.mjs:61` REQUIREMENTS.md and the markers the suite carries agree | — | red while a marker traces a `planned` row; green once the 40 rows flip |
| `requirements-trace.test.mjs:56` the EARS report line | G-014 | green: each new row holds one `shall` (Ran in revision 3 over §2's table; the allowance is 0, `scripts/requirements-trace.mjs:52`) |
| `requirements-trace.test.mjs:86` no collected test root has nested test files outside fixture directories | — | green while the fixture writes its test files under the OS temp folder, never under `tests/<sub>/` (`factcheck.md` C-d) |
| `code-map.test.mjs:39`, `npm run map:check` | G-004, G-009, G-010 | red until `npm run map` regenerates `docs/code-map.md` with the five new files |
| `readme-check.test.mjs:36` every README this repo ships holds its claims | G-012 | green only while the new section spells the table path with placeholders and names no bare `seat-mutate.mjs` (`factcheck.md` C-a, Ran) |
| `product-report.test.mjs` (it copies the real HANDOFF, `:31-35`; a malformed ask refuses, `:227-242`) | R-1030 and others | green only while this lane's HANDOFF asks use the tagged form of §4 (`factcheck.md` C-b) |
| `apps/desk/test/knowledge-home-isolation.test.mjs:27` | R-898 | green: it scans every `.mjs` under `docs/reviews/` for a `pi` spawn by name; no new corpus file spawns `pi` (`factcheck.md` C-c) |
| `packages/nana-pack/tests/test-runner.test.mjs:422-438` the source check detects direct mkdtemp calls while ignoring only generated leak fixtures | R-917 | green only while neither new test file holds `mkdtempSync(` anywhere in its source, fixture texts included, and each takes temp folders through `tmpDir` with the import line exactly `import { tmpDir } from "./tmp-dir.mjs";` (the scan reads every `.mjs` in every collected test root but `tmp-dir.mjs`, Read) |
| `packages/nana-pack/tests/agent-dir-parity.test.mjs:184-189` PI_CODING_AGENT_DIR is resolved only by agent-dir.mjs | R-190 | green only while no tracked `.ts`, `.mjs` or `.js` outside `tests/` and `test/`, the new lib modules and corpus files under `docs/reviews/` included, has a line ending in the bare name, with or without `;`, or reads `process.env.PI_CODING_AGENT_DIR`; two files are allowed (`agent-dir.mjs`, `apps/bench/lib/pi-exports.mjs`). Ran the scan's regex: `delete env.PI_CODING_AGENT_DIR;` and a comment line ending in the name read red; `k === "PI_CODING_AGENT_DIR"` and `delete env["PI_CODING_AGENT_DIR"];` read green. Ran the scan's own `git grep` at `ccd8f76`: it hits the roster-notice runner's line 8, a comment ending in the name, so that check reads red on that branch (INFERRED from the allow list; not run there), and acceptance 1's copy rewrites that line |

Green with no edit: every win-command check (imported, not edited), `test-runner.test.mjs`'s other checks (the suite runner is untouched; M33 only reads its text), and
the checks `factcheck.md` §2 lists as not affected (Read); every other existing check is INFERRED green from the lane's file list, and the build's full suite shows it.

**Build-brief rules** (each from a check above; the brief states them, the reviewer checks them):
1. Test files make temp folders only through `tmpDir` from `./tmp-dir.mjs`, and no source text in them, fixture test files written from strings included, holds
   `mkdtempSync(` (R-917).
2. Code outside `tests/`, the corpus tables included, names `PI_CODING_AGENT_DIR` only inside quotes, never at the end of a line, comments included, and never reads
   `process.env.PI_CODING_AGENT_DIR` (R-190).
3. Both new test files print nothing after a PASS title (`ok ? "" : why`), and no title begins with another title followed by a space, so the old-form runner reads
   every pair exactly.

**5.3 Fact-check fold-in** (`factcheck.md`, each item re-read at `2dbc817`). W1, the row range: the seat's assignment (§2); the runtime-map overlap is carry 1. W2: §4 names
the runtime-map draft's FEAT-031 rows and R-618 cell. W3: §4 says "adds 13 rows"; §2 gives the true reason for placing rows by ID. W4 and W5: §1 counts four lineage lines
and 161 to 238 plumbing lines; §3.9 follows. W6: §3.2 step 5. W7: residual 4 names each feature's two lanes and fresh-install; "transform edits" is dropped (no copy has
them). W8: R-1239, C5, pair 82 and `GLOBAL_PREFIX_KEY`. W9: the census names G-012. W10: §6's queue is the owner's 2026-10-16 order plus HANDOFF's for the rest. W11: the
corpus tables find their repository from their own path (§3.4, §3.8, §5.4). W12: S4 cites `REQUIREMENTS.md:23-24`. W13: §2 says most of FEAT-031's 37 rows are the suite
runner's. W14: §1 says five copies read npm. W15: the parked ask (§6) says the port is a default that `DESK_TEST_PORT` overrides, the same value in every child. Census C-a to
C-d: §3.7, §4 and §5.2. Unverifiable 6: the port names no branch (the local `feat/regroup-shares` is gone; `origin/feat/regroup-shares` is `2dbc817`, already in main,
Ran), so its header reads `none`; `f6bb0bd` is in main's history (Ran `git merge-base --is-ancestor f6bb0bd 2dbc817`). Unverifiable 7: S11. The `rmSync` caution: §3.2
step 10 and §3.5. Research-note errors: `alsoRed` is in five copies' judging and the seat-guide and tree tables (`factcheck.md` §6), so S9 keeps it as a shared feature.

**5.4 Wrong code first.** Each pair edits code, never an assertion, and must red exactly the named checks. The seat runs these pairs with its old-form runner, never with the
new one (S7). Pairs 9 and 11 can red only on Windows; the Windows leg runs no mutation pairs, so no runner runs them (their rows' evidence says so, §5.1). Pairs 42 and 43 hold
new pairs in the numbers the cut stagger pairs left; 69 to 91 were appended in revision 2 and 92 to 98 in revision 3, so earlier numbers keep their meaning; revision 3
rewrites pairs 75 and 76 in place. 98 pairs.

| # | Wrong code | Reds |
|---|---|---|
| 1 | `childEnv` keeps ambient NANA_ variables | C3, M7 |
| 2 | `childEnv` removes NANA_TEST_ variables too | C3, M7 |
| 3 | `childEnv` writes gc.auto at GIT_CONFIG index 0, over a caller entry | C4 |
| 4 | `childEnv` keeps PI_CODING_AGENT_DIR | C3 |
| 5 | the child starts without `--experimental-strip-types` | C1 |
| 6 | the child runs from the repository root, not the folder given | C1, M7 |
| 7 | npm values overwrite values the caller set | C5 |
| 8 | an npm that cannot start is ignored with no line | C6 |
| 9 | npm spawned by name on win32 | C7 (Windows; no runner runs it) |
| 10 | the timeout kills only the child, not its group | C8 |
| 11 | no `taskkill` on win32 | C8 (Windows; no runner runs it) |
| 12 | the result waits for the output to close, with no drain | C9 |
| 13 | the drain ignores its input and waits a fixed 30 s | C9 |
| 14 | the scratch folder made beside the lane repository, not under the temp folder | M1 |
| 15 | edits applied in the source checkout | M1 |
| 16 | no `git clean` between pairs | M1 |
| 17 | git calls without the hooks path | M2 |
| 18 | the own-root check removed from the reset | M3 |
| 19 | cleanup skips `git worktree remove` | M4 |
| 20 | cleanup removes only the first part's worktree | M4 |
| 21 | the keep option ignored | M5 |
| 22 | one home folder shared by every test file | M7 |
| 23 | an anchor counted with `includes` instead of an exact count | M10 |
| 24 | a script edit's exit status ignored | M10 |
| 25 | ANCHOR-MISS leaves the exit at 0 | M10 |
| 26 | the syntax check skipped | M11 |
| 27 | a red baseline ignored | M15 |
| 28 | no baseline retry at one part | M13 |
| 29 | the baseline title check removed | M17 |
| 30 | a pair with no failing title counted RED | M19, M24 |
| 31 | the RED line leaves out the matched titles | M19 |
| 32 | a declared also-red title listed as unnamed | M20 |
| 33 | a crashed file with no FAIL line counted GREEN | M20 |
| 34 | a timed-out file not counted as crashed | M20 |
| 35 | a stay-green pair judged as an ordinary pair | M21 |
| 36 | expected case labels ignored | M22 |
| 37 | a skipped pair is run | M23 |
| 38 | RESULT leaves out the ERROR count | M24 |
| 39 | pairs awaited one at a time whatever the parts count | M25 |
| 40 | every part shares one worktree | M14, M25 |
| 41 | baseline copies run one after another, not at the same time | M14, M16 |
| 42 | the baseline runs each file once at any parts count | M14, M16 |
| 43 | a red baseline copy is retried above one part | M15 |
| 44 | the parts default divides by 1, not the cores per part | M26 |
| 45 | the parts count not held to the runnable pair count | M26 |
| 46 | SEAT_MUTATE_PARTS read before `--parts` | M26 |
| 47 | the record written in finish order | M28 |
| 48 | the queue skips its last pair | M28 |
| 49 | the queue reads its next index before an await and advances it after, so two parts take one pair | M28 |
| 50 | a thrown pair swallowed and the run exits 0 | M29 |
| 51 | a part keeps taking pairs after an error | M29 |
| 52 | pairs left unreported are not named and the run exits 0 | M30 |
| 53 | unknown pair ids filtered out without a word (the copies' `:281`) | M31 |
| 54 | a repeated table id accepted | M31 |
| 55 | parts 0 read as 1 | M31 |
| 56 | the refusals run after the worktrees are made | M31 |
| 57 | the per-file time limit read as a literal 10 minutes | M32 |
| 58 | the baseline retry count read as a literal 1 | M32 |
| 59 | a config value's provenance comment removed | M38 |
| 60 | `SEAT_MUTATE_KEEP` renamed in the config | M38 |
| 61 | the header leaves out the parts count | M34 |
| 62 | the header hashes the lane table instead of the three runner modules | M34 |
| 63 | the dry option still runs tests | M35 |
| 64 | the log file name drops the pair id | M36 |
| 65 | `SEAT_MUTATE_OUT` ignored, the record going to stdout only | M37 |
| 66 | `SEAT_MUTATE_TIP` ignored | M37 |
| 67 | output split at `\n` with no trim, so a CRLF title never matches | M19 |
| 68 | titles matched by equality only, so a FAIL line with detail after its title is missed | M19 |
| 69 | a helper child's stdin left open as a pipe | M9 |
| 70 | helper children run with no time limit | M9 |
| 71 | cleanup runs before the RESULT line, so a failed removal loses it | M6 |
| 72 | a failed removal sets the exit code to 1 | M6 |
| 73 | no signal handler | M8 |
| 74 | the signal handler kills only the first live test tree | M8 |
| 75 | a mutated `.ts` file not syntax-checked | M12, M35 |
| 76 | a FAIL line matched to the first named title that begins it, as the copies do, not the longest candidate title | M18 |
| 77 | the record written only when the run ends | M28 |
| 78 | a selection with no runnable pair still makes worktrees | M27 |
| 79 | a pair id holding `:` accepted | M31 |
| 80 | case labels with no label reader judged anyway | M31 |
| 81 | `--parts` above the available cores not cut | M26 |
| 82 | the prefix does not fill a missing global prefix | C5 |
| 83 | `git clean` without `-x`, so an ignored file carries over | M1 |
| 84 | `KILL_GRACE_MS` set apart from the suite runner's value | M33 |
| 85 | `EXIT_TABLE_FAULT` changed in the config | M38 |
| 86 | `NPM_KEYS` loses `userconfig` | M38 |
| 87 | the header hashes `mutation-runner.mjs` alone | M34 |
| 88 | `config injected` never printed | M34 |
| 89 | a merge base that does not resolve refuses the run | M34 |
| 90 | a branch that does not resolve refuses the run | M34 |
| 91 | `childEnv` leaves TEMP and TMP unset | C2 |
| 92 | the baseline title check uses equality, so a named title whose PASS line carries detail refuses the run | M17 |
| 93 | every baseline PASS line is a candidate title, so a FAIL line whose detail equals its PASS line's reads as that line | M39 |
| 94 | the candidates are the pair's own named titles, not every title the table names | M18 |
| 95 | PASS lines matched by the copies' rule, so a passing longer title counts the named title as reached | M18 |
| 96 | no group kill after a test file's normal exit | C10 |
| 97 | `TS_CHECK_ARGS` loses `--experimental-vm-modules` | M12, M38 |
| 98 | baseline PASS lines never candidates, so a longer title printed beside a bare named title reads as the named title | M18 |

Recount: test child 1-13, 82, 91 and 96 (16); scratch and cleanup 14-22, 71, 72 and 83 (12); edits, syntax and helpers 23-26, 69, 70 and 75 (7); baseline 27-29, 42, 43,
76 and 92 (7); judging 30-38, 67, 68, 93, 94, 95 and 98 (15); parts and record 39-41, 44-49, 77, 78 and 81 (12); faults, signals and refusals 50-56, 73, 74, 79 and 80 (11);
config 57-60, 84-86 and 97 (8); header and options 61-66 and 87-90 (10); 16 + 12 + 7 + 7 + 15 + 12 + 11 + 8 + 10 = 98, numbered 1 to 98 with no gap. 96 pairs run on
macOS. Every new check has at least one pair the seat's runner runs on macOS, except C7, whose only pair (9) can red only on Windows.

**Seat acceptance** (seen failing at the base where it can fail).
1. This lane's 96 macOS pairs run with an old-form runner (S7) copied from the roster-notice runner (on main once that lane lands; from `ccd8f76` until then), which already
   splits five ways, merges the parts with `MISSING` lines and refuses an unknown pair id (S12), so no hand split is needed. The copy gets three edits: it finds its
   repository from its own path instead of `:41`'s home path (W11); its line 8, a comment ending in the bare `PI_CODING_AGENT_DIR`, is reworded (build-brief rule 2); and
   its header names the copy it came from. Its `.ts` check (`:374`) passes a broken `.ts` file (Ran), which does not matter here: every pair edits a `.mjs` module.
2. Equivalence. The seat ports `docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs` to a table (`seat-mutate-port.mjs` in the corpus; it exercises `labelsOf`,
   `expectWhy` and a conditional `skip`, and names no branch) and runs it in this lane's worktree at tip `f6bb0bd`, at `--parts 1` and at the default. Each run must print, in
   table order, the same verdict word and named-title count per pair, and the same RESULT counts, as the committed record
   `docs/reviews/regroup-shares-2026-10-15/seat-mutate-output.txt` (36/36 red, 28 exact, 2 with a named title or case green, 6 with an unnamed red, 0 survived, 2 skipped; Ran
   `grep ^RESULT`); a pair that differs only by R-1250 is named with its titles. The default run's baseline shows each file as N copies. The two wall times go in the corpus.
   INFERRED: about 25 minutes at one part and 6 at five, from the lift test's 38.8 s baseline. The lift and tree tests print nothing after a PASS title
   (`requirements-lift.test.mjs:20`, `requirements-tree.test.mjs:19`), so this run cannot show the detail rule of R-1249 and R-1250; M17, M18, M19 and M39 carry it with a
   fixture file that prints detail, and pairs 92 to 95 and 98 red them.
3. The ported table with a mistyped id refuses with exit 2 and leaves `git worktree list` unchanged; at the base, the old copy runs the other pairs and says nothing.
4. `npm run test:locked`, `npm run map:check`, `npm run readme:check`, the tree check and the trace rail on the lane tip. Windows: the PR's Windows leg runs both new files
   (non-blocking), including C7 and C8's taskkill path.

**The claim most likely wrong:** the parts default of available cores divided by 2. It rests on two runs at five parts on one machine, neither compared with another parts
count beside it, with test files that spawn few children.
A machine with fewer cores, or a table whose files spawn many children, may want fewer parts. It is one config value with provenance, so a re-measure changes no code. Next most
likely: that the copy baseline refuses only runs that deserve it. A file that passes alone but fails as N copies (a default port, a shared temp name) now stops a split run that
the serial copies judged, so the seat may fall back to `--parts 1` more often than the speed case assumes (INFERRED; acceptance 2 shows one table). Third: that one process
keeps the speed of the split runs measured so far; N parts' output and git calls share one event loop, and its baseline runs files in sequence, so on a multi-file table it
may match the built-in split rather than beat it (about 120 s against 135 s on the roster-notice table, §3.2), INFERRED until acceptance 2 times it.

## 6. Decisions, residuals and later lanes (each becomes one HANDOFF line)

**Decided by the owner (2026-10-16; replaces draft 1's D1 and D2).** (1) The runtime map records, per test file, the code it runs (spawned children included) and its
seconds, kept on the machine outside the repo and never read by the map check; this lane does not touch it. (2) The seat-rule lane adds a parallel-by-default rule to the seat
guide and raises the lane limit from two lanes in flight to two lanes building plus one being planned; that is draft 1's D1 option (b), and it leaves this lane. (3) The order
after the regroup lane lands: the seat rule, then this lane, then the runtime map; feature-oriented development follows them.

**The queue** (the owner's 2026-10-16 order; HANDOFF's order for the rest, `HANDOFF.md:81-86` at `2dbc817`):
1. Landed: the regroup lane (main `c514964`). In flight: the roster-notice lane (the fleet line, the first of the 2026-10-16 feedback items).
2. The seat-rule lane: the parallel-by-default rule and the raised lane limit. Its revision 2 names "a long mutation run in parts" as work to start at once, adds no
   hand-split sentence, and carries nothing to this lane (Read: `../seat-rule/CHANGE.md` residual 1, "No carry to the runner lane", and `../seat-rule/nana-seat.proposed.md`
   bullet 7; Ran `grep -c -i 'by hand'` on the proposed guide: 0). An earlier version added a hand-split sentence and a carry asking this lane to reword it; that plan's
   revision 2 removed both (its revision log, item 1). This lane makes split runs the runner's default and edits no guide line (S13).
3. This lane, `mutate-runner`.
4. The runtime-map lane.
5. Feature-oriented development.
6. Then HANDOFF's queue in its order: the rest of the 2026-10-16 feedback items (the rulings file first), then the parallel test runner (the two suite lanes below), then
   project files on Windows and the items after them.

**The owner's calls.** None is blocking; this lane builds on its defaults.
- [optional, since 2026-10-16] Windows red run. What we tested: C7 and C8's taskkill path pass on the Windows CI leg, which runs no mutation pairs. The result: pairs 9 and 11
  have never run, so those two clauses are unverified. The trade: one run of two pairs on the owner's Windows machine, against two rows whose evidence names the gap. Recommend
  no run now; the evidence cells say unverified. It is the owner's call because only the owner's machine runs native Windows.
- [parked, since 2026-10-16] The desk test's port, for the first parallel suite lane. The parallel suite needs the desk's origin-rule test off its default port 4391, which
  `DESK_TEST_PORT` overrides but which every parallel child would share (`apps/desk/test/origin-rule.test.mjs:17`); the change is to a test file only, no desk code. The process
  plan raised it first (`docs/reviews/process-2026-10-13/CHANGE.md:156`). Recommend allowing a test-only edit. The owner's call because the desk has been frozen since
  2026-10-10 (`HANDOFF.md:72`). Parked until that lane is planned.

**Seat decisions (declared, not asked).**
- S1 IDs R-1230 to R-1269, the seat's whole range; R-1269 is the group kill (revision 3), so no ID is left for plan review.
- S2 One process holds every part (B1), not one child per part (B2), weighed in revision 3 against the roster-notice runner's built-in B2 (§3.2).
- S3 Home `packages/nana-pack/lib/`; no bin, PATH link or `package.json` entry.
- S4 FEAT-031, no new subgroup: once a feature is subdivided, every row it holds is homed under a subgroup (`REQUIREMENTS.md:23-24`), so a subgroup for these rows would move
  FEAT-031's 37 rows too. The checker itself does not force it (`factcheck.md` W12, Ran). A later regroup may move the 40 rows into their own feature.
- S5 The parts default is the core count divided by `CORES_PER_PART`, not 1, because parallel is the default; `--parts 1` gives today's serial run.
- S6 The two in-flight lanes keep their own copies until they land; no lane switches runners mid-lane; old records stay as they are.
- S7 The seat judges this lane's pairs with an old-form copy, because the new runner would judge its own code.
- S8 A signal handler kills live test trees only, as the suite runner does; worktrees are left to `git worktree prune` (residual 6).
- S9 Judging features that tables on main at `2dbc817` use stay in (`alsoRed`, `expectGreen`, case labels, `skip`); lane machinery outside judging stays out, and such a lane
  keeps a local runner (residual 4). The roster-notice table's pattern titles (`:292`) stay out too: the prefix rule names a title whose run value comes at its end, and no
  row ID is left.
- S10 The suite stays serial in this lane; running the suite in parallel is the two suite lanes' job (below).
- S11 Class: neither gate nor format. The working pattern gives one plan round to a small lane and two to a gate or format lane (`AGENTS.md:95`) and names none for a larger
  lane that is neither; this one is not small, so the seat plans two rounds. Builder: the larger-lane builder.
- S12 Until this lane lands, the seat copies the roster-notice runner, which already refuses an unknown pair id (`:566-567`) instead of `:281`'s silent filter and splits
  with no hand work; this lane's old-form copy is one (§5.4).
- S13 No seat-guide edit: `nana-seat.md:9` already sends the seat to the lane's mutation runner, the seat-rule lane's proposed guide keeps that bullet and names a long
  mutation run in parts as parallel work, and the seat-rule lane owns the guide. This lane touches no `packages/nana-setup/` file, so no install check.
- S14 No part stagger (cut in revision 2).
- S15 PASS and FAIL lines are read by the longest candidate title (R-1250) rather than refused: a refusal would block every pair that names a title another title begins
  with, and a title can print twice with different detail (`agent-dir-config.test.mjs` prints `[absolute] (b) policyFileHit` for two paths, Ran).
- S16 Above one part the baseline runs N copies of each file and does not retry; the retry stays at one part (R-1246 to R-1248).
- S17 After every test file, POSIX kills what is left of its group (R-1269), as five copies do; Windows has no equivalent once the parent has exited (residual 15).
- S18 `.ts` files are checked up front by the repository's own checker, started from the table's `repo` (R-1245, `TS_CHECK_ARGS`); the crash reading of revision 2 is cut.

**Carries.**
1. Closed in revision 3: the runtime-map plan now holds R-1270 to R-1299 (Read: `../runtime-map/CHANGE.md` as saved at 22:23). Tell its author that its "R-1269 left
   free" is stale (R-1269 is now this lane's group kill) and that its line citations into this file have moved.
2. To the roster-notice lane, before it lands: its runner's line 8, a comment ending in the bare `PI_CODING_AGENT_DIR`, is hit by the R-190 scan's own `git grep` at
   `ccd8f76` (Ran), so its suite should read that check red (INFERRED; not run); and its `.ts` syntax check (`:374`) passes a broken `.ts` file (Ran
   `probe-ts/probe.mjs`), so a broken `.ts` mutant reads RED there; `scripts/ts-syntax-check.mjs` is the check that fails it.
3. If the seat-rule plan puts a hand-split sentence back into the guide, S13 and §6 queue item 2 reopen.

**Residuals.**
1. Until the parallel suite lane, `lib/test-child.mjs` and `scripts/test.mjs` hold two copies of the child environment, the kill and the drain, and `DRAIN_MS` and
   `KILL_GRACE_MS` are defined twice: a declared violation, pinned equal by M33.
2. A pair whose named title is a wall-clock bound can go red from load, not from its edit, and hide a survivor. The copy baseline catches a file that fails under its own
   N-copy load every time; not one that fails now and then, nor load from outside the run, such as another lane's suite. Re-run such a pair with `--parts 1`.
3. Two split runs at once ask for about twice the machine's cores, and a split run beside another lane's suite run loads the suite's five wall-clock bounds; the suite lock does
   not cover mutation runs. The README says to run one split run per machine at a time and names the second effect; a machine-wide slot is a later lane.
4. Lanes that need scratch commits (seat-guide, install-check), acceptance scripts (install-check, fresh-install), Windows-only title lists (cc-hooks-windows, roster) or a
   title named by pattern because a run value sits inside it (roster-notice, `:143`, `:292`) keep a local runner (`factcheck.md` W7, Read).
5. Windows: concurrent git work in sibling worktrees was probed on macOS only; the runner adds worktrees one after another; the Windows CI leg is non-blocking; the Windows
   clauses of R-1239 and R-1240 have never been seen red (pairs 9 and 11).
6. A signal stop kills the live test trees and leaves up to N scratch worktrees of about 29 MB each (Ran `du -sh` on a lane worktree); `git worktree prune` and removing the
   printed folder clear them. A SIGKILL of the runner runs no handler, so its test trees live on until their own end.
7. A lane table imports the runner from its own checkout, so a later lane that edits the runner is judged by its own copy; such a lane judges with main's, as S7 does here.
8. A table copied out of its checkout breaks its relative import and its repository path, with Node's import error.
9. The parts default rests on two runs at five parts on one 10-core machine, the regroup hand split and the roster-notice built-in split, with no other parts count
   measured beside either (§5.4).
10. The record holds a finished pair's line until every earlier pair is written, so a slow early pair holds later lines out of the record; stdout shows them as they finish.
11. The kill grace is passed to every test file, but no check makes an exit fail to arrive after a kill, as for the suite's R-611 (`untested`).
12. Closed in revision 3: the dry run checks `.ts` files with the repository's checker (R-1245, R-1266, M35).
13. A throw before the pair phase, such as a failed worktree add, ends the run with Node's error exit and no RESULT line; it judges nothing, so it fails closed.
14. Windows paths: a temp folder path over about 65 characters can push a worktree file past 260 characters (INFERRED); the README says so.
15. Windows strays: no kill reaches a child that a test file leaves running after it exits, because `taskkill /T` walks from a live parent (INFERRED). The stray can load
   the machine, or hold files so the next reset or clean in that worktree fails into ERROR (R-1260), which fails closed (INFERRED). A setsid child escapes the POSIX group
   kill too (out of reach of both runners, as `scripts/test.mjs:257` notes).
16. A named title that begins a longer, unnamed title, in a file that prints detail after titles, still reads the longer title's FAIL line as the named title, as the
   copies do (case D of §3.3, Ran). The table settles it by naming the longer title in its `titles` map; the README says so.
17. A file that prints one title both alone and with detail, under the same title, can make that detailed PASS line a candidate, so a FAIL line with the same detail
   reads as that line (INFERRED rare; the test files were not searched for it).

**Later lanes** (each planned when the queue reaches it).
- `test-jobs-prep` (small, not a gate change), first of the two parallel suite lanes. The suite's parallel preconditions, all still on main (`research.md` §1.5, Ran grep): the
  desk test's default port (the parked ask); five wall-clock bounds (`packages/nana-knowledge/tests/hook.test.mjs:200`, `:339`;
  `packages/nana-pack/tests/test-locked.test.mjs:103`; `packages/nana-pack/tests/bounded-read.test.mjs:37`; `packages/nana-pack/tests/review-ledger.test.mjs:614`), widened
  with provenance or listed as run-alone; `--poll 1` in the review-ledger tests (`:82`). These also cut load-made reds in split runs that name those files.
- `test-jobs` (gate lane, two plan rounds), after the runtime-map lane: moves `scripts/test.mjs` onto `lib/test-child.mjs` (closing residual 1) and runs files N at a time,
  longest first from the runtime map's per-file seconds, with the exit code still the gate. Not now: it is a gate lane, its preconditions are unfixed, and its timings are
  stale (144 test files against 133 on 2026-10-10, Ran in `research.md` §1.5).
- Later, on demand: a machine-wide slot for split runs (residual 3); a left-out lane feature once a second current lane needs it; picking a pair's test files from the runtime
  map (an idea in the runtime-map draft, INFERRED value).

**INFERRED.** That load added no false reds in the split run (the tips differ); that the copies skip npm's values on Windows; that Windows sends no SIGTERM and delivers Ctrl-C as
SIGINT to this runner; the Windows path-length margin; the time the two new test files add to the suite; acceptance 2's run times; that one process keeps the split runs'
speed, and its estimate of about 120 s on the roster-notice table; that the copy baseline rarely refuses a run the serial copies judged; that the README section passes the
README check; that no other existing check changes; that `taskkill /T` cannot reach an orphaned descendant on Windows; that the roster-notice branch's R-190 check is red;
that a test reaching a broken `.ts` only through `spawnSync` would not crash.

## Seat revision 2 (2026-10-16)

Each seat decision on the owner's answers, `design-critique.md` and `factcheck.md`, each repo fact re-read at `2dbc817`, as applied:
1. The owner's answers. (2) takes the seat-guide bullet, the lane limit (draft 1's D1) and lane 2 `seat-parallel` out of this plan into the seat-rule lane, which goes first;
   (3) answers draft 1's D2 and sets the queue (§6); (1) touches nothing here. The header, §1's "Why this lane, and why second", §4's NOT and Overlap, §6's queue and the later
   lanes follow. Draft 1's D3 (the desk test's port) becomes the parked ask, since it belongs to the first suite lane. No blocking owner call is left; one optional and one
   parked ask stay, in the tagged form.
2. Critique MUST-1 (order): settled by the owner's order. Its interim fix stays as S12 (hand copies refuse an unknown id). Its "the split-run clause joins the guide" is not
   needed: the guide's bullet at `nana-seat.md:9` already points at the lane's runner, whose default is now split (S13).
3. Critique MUST-2 (an owner call hidden as none): D2 is answered; §6 states the full queue by item.
4. Critique MUST-3 and factcheck W1 (row clash): the seat's range R-1230 to R-1269; the old "subtract 20" branch and draft 1's R-1240 to R-1266 are gone; carry 1 moves the
   runtime-map draft. Ran 2026-10-16: 0 hits over 39 branches and four checkouts, with a control grep.
5. Critique MUST-4 (baseline does not run what the pairs run): R-1247 (N copies at once, no retry), R-1246 (retry at one part only), R-1248 (refuse naming the file and
   `--parts 1`); M14, M15 and M16; pairs 41 and 42 red M14 and M16, pair 43 reds M15; §3.2 step 6, §3.9 and residual 2 rewritten.
6. Critique MUST-5 (async helpers hang): R-1243, `HELPER_TIMEOUT_MS`, R-1244's past-limit clause; a git call past the limit throws into R-1260; M9; pairs 69 and 70.
7. Critique SHOULDs, by number: 1, RESULT before cleanup, R-1234, M6, pairs 71 and 72. 2, signal handler, R-1242, M8, pairs 73 and 74, S8, residual 6 corrected. 3, the
   seat's own fix: longest-title match (R-1250, M18, pair 76, S15) instead of a refusal, which would block every such pair. 4, `.ts` syntax from the crash, inside R-1245
   (Ran `probe-ts/probe.mjs`), M12, pair 75, residual 12. 5, rendezvous rules in §5's preamble and M28's note; the probe timings for the build brief. 6, R-1243 split into
   R-1235 to R-1238 and R-1240 into R-1230 and R-1231. 7, M28 pins "as soon as" at one part (pair 77); the drain and kill grace leave R-1263 for R-1264; the print clause moves
   into R-1233; nothing runnable is R-1258, M27, pair 78. 8, M38 seals the exits, the child argument and the npm keys (pairs 85 and 86). 9, the hash covers three modules plus
   `config injected` (pairs 62, 87, 88). 10, the stagger is cut (old R-1254, M20, pairs 42 and 43, `PART_START_INTERVAL_MS`); S9 restated. 11, case labels with no reader
   refuse (R-1262, pair 80). 12, `none` for a merge base or branch that does not resolve (R-1265, pairs 89 and 90); fixtures use `git init -b main`. 13, tables find their
   repository from their own path. 14, `git clean -fdxq` (pair 83). 15, pairs 9 and 11 are named as run nowhere; the evidence cells say unverified; the optional ask. 16, pair
   67 is "split at `\n` with no trim". 17, (a) §1 marks "slow" as the seat's reading; (b) every ask is tagged; (c) the load beside a suite run is in the README limits and
   residual 3; (d) the drain and kill grace are a declared violation, pinned by R-1264 and M33 (pair 84).
8. Critique NITs: 1, §2 adds R-604 with R-917, and `KILL_GRACE_MS` names R-611 as `untested`. 2, `CORES_PER_PART` is labelled chosen. 3, R-1267 states the name mapping and
   R-1262 refuses a forbidden character (pair 79). 4, `--parts` is held at the available cores (pair 81). 5, S10 names the suite lanes, not a request part. 6, the path-length
   margin in §3.6, the README and residual 14.
9. Factcheck W2 to W15, the census misses C-a to C-d, unverifiable items 6 and 7, the `rmSync` caution and the research-note errors: folded as §5.3 lists.
10. Renumbering (draft 1 → draft 2): R-1240 → R-1230 and R-1231; R-1241 → R-1232; R-1242 → R-1233; R-1243 → R-1235 to R-1238; R-1244 → R-1239; R-1245 → R-1244; R-1246
    → R-1245; R-1247 → R-1246 to R-1249; R-1248 → R-1251; R-1249 → R-1252; R-1250 → R-1253; R-1251 → R-1254; R-1252 → R-1255; R-1253 → R-1256 and R-1247; R-1254 cut;
    R-1255 → R-1257; R-1256 → R-1259; R-1257 → R-1260; R-1258 → R-1261; R-1259 → R-1262; R-1260 → R-1263; R-1261 → R-1240; R-1262 → R-1241; R-1263 → R-1265; R-1264 →
    R-1266; R-1265 → R-1267; R-1266 → R-1268. New: R-1234, R-1242, R-1243, R-1250, R-1258 and R-1264. Checks: C1 → C3 and C4; C2 → C1 and C2; C3 to C7 → C5 to C9; M1 to
    M5 keep their numbers; M6 → M7; M7 → M10; M8 → M11; M9 → M15; M10 → M13; M11 → M17; M12 to M17 → M19 to M24; M18 → M25; M19 → M14; M20 cut; M21 → M26; M22 → M28;
    M23 to M26 → M29 to M32; M27 → M38; M28 to M31 → M34 to M37. New: M6, M8, M9, M12, M16, M18, M27 and M33.
11. Recount: 39 rows added (R-1230 to R-1268), none reworded; 47 new titles (C1 to C9, M1 to M38); 91 pairs, numbered 1 to 91 with no gap, 89 on macOS; the tree total is
    the base plus 39; carry 1 and residuals 1 to 14; owner calls: 0 blocking, 1 optional, 1 parked.

## Seat revision 3 (2026-10-16)

Seven MUST findings from the round-2 fact-check (`factcheck-r2.md`, items 1 to 4) and design critique (`design-critique-r2.md`, items 5 to 7); items 1 and 5 are one
finding seen twice. Each was re-verified at `2dbc817` in a fresh extract (`r3/src`, HOME and TMPDIR set to `r3/home` and `r3/tmp`) and, where it names one, at `c514964` or
`ccd8f76` (read-only `git show`, `git grep`, `git ls-tree`). All seven are accepted; item 2 needs no scope change, and item 5's fix is taken with one change.
1. Fact-check MUST-1 (PASS lines carry detail). Accepted. Re-verified: `changes-endpoint.test.mjs:35` prints the third argument on PASS lines, `:718` and `:720` are as
   quoted, 34 collected test files use that form (Ran `grep -lE` over the collected roots), 42 of `agent-dir-config.test.mjs`'s 98 PASS lines end with the run's temp path
   (Ran), and `hook.test.mjs:200` and `:339` end their titles with measured milliseconds (Read). Changes: R-1249 takes the copies' rule; R-1250 reads PASS and FAIL lines by
   candidate titles, which settles clashes among the titles the table names; §3.3's false premise is gone; M17, M18 and M19 are retitled and M39 is new; the fixture holds a
   test file that prints detail on PASS lines; pairs 92 to 95 and 98.
2. Fact-check MUST-2 (the sibling plans contradict). Accepted as a cross-plan check, with no scope change. The seat-rule plan's revision 2 already took the finding's second
   option: its guide adds no hand-split sentence and it carries nothing to this lane (Read: `../seat-rule/CHANGE.md` residual 1; Ran `grep -c -i 'by hand'` on
   `../seat-rule/nana-seat.proposed.md`: 0). So this lane edits no guide line and touches no `packages/nana-setup/` file, and no install check runs. Changes: §6 queue item
   2 and S13 cite the guide as the seat-rule lane leaves it; §3.8 and the §3.9 row follow; carry 3 reopens S13 if a hand-split sentence comes back.
3. Fact-check MUST-3 (prior art on the roster-notice branch). Accepted. Re-verified the roster-notice runner (saved as `r3/roster-notice-runner.mjs`): `:56`, `:59`, `:499`,
   `:497-560`, `:566-567`, `:383-392`, `:271`, `:292`, `:374` (Read); its record holds 68 pairs in five parts (Ran `git show`); header `01:46:57.8Z` to the merged record's
   last write at 21:49:12 local, 2 min 15 s (Ran `stat`); parts ended 54 to 118 s after their starts (Ran over the part logs); its `.ts` check exits 0 on a broken file (Ran);
   main at `c514964` holds ten copies, 4,510 lines, six npm readers and five `/dev/null` users (Ran `git ls-tree` and `git show`). Changes: a new §1 bullet and corrected
   counts; §3.2 argues B1 against the built-in B2, with the measured round-robin idle time for it and two named costs against it, one an INFERRED estimate of about 120 s
   against the measured 135 s; S2 and S12 restated; acceptance 1 copies the roster-notice runner and needs no hand split; `CORES_PER_PART`'s provenance, residual 9 and the
   claim most likely wrong now name two runs; carry 2 tells the roster-notice lane about its `.ts` check. B1 stays (S2).
4. Fact-check MUST-4 (census conditions). Accepted. Re-verified `test-runner.test.mjs:422-438` (R-917) and `agent-dir-parity.test.mjs:184-189` (R-190) (Read), and the
   R-190 pattern on sample lines (Ran). Also found: the R-190 scan's own `git grep` at `ccd8f76` hits the roster-notice runner's line 8, a comment ending in the bare name
   (Ran), so acceptance 1's copy rewrites that line and carry 2 tells that lane. Changes: two census rows; `test-runner.test.mjs` leaves "green with no edit"; build-brief
   rules 1 to 3; §4's corpus note; §5's fixture paragraph.
5. Design-critique MUST-1 (the same finding as item 1). Accepted, with one change to its fix. Its R-1250 wording, "the pair's named titles plus the baseline PASS texts",
   was probed and not taken as worded: Ran `r3/probe-title-rule/probe.mjs` over six cases shaped on real files. That wording misreads case E, a third argument the mutant
   leaves unchanged, where the FAIL line equals a baseline PASS text and the named title is lost, a regression against the copies; and case C, a longer title another pair
   names. R-1250 instead takes every title the table names, plus a baseline PASS line only from a file that printed the named title alone. It is right on five of six cases
   and never below the copies; case D is residual 16. The requested pair "baseline title check uses equality" is pair 92; the PASS-detail fixture serves M17, M18, M19 and M39.
6. Design-critique MUST-2 (the dropped group kill). Accepted. Re-verified five copies (Ran `grep -n 'stray group members'`) and `scripts/test.mjs:240`, `:257`, `:261`
   (Read); Ran `r3/probe-stray/probe.mjs`: a stray child lived on with no kill and was gone after a group kill. Changes: R-1269, worded for POSIX so that macOS can pin all
   of it, with the Windows half as residual 15 rather than a partial clause; C10; pair 96; §3.1, §3.2 step 7, §3.6, a §3.9 row and S17. §1's Windows bullet is corrected:
   `:234` is the after-run kill, in five copies, not a timeout kill in nine.
7. Design-critique MUST-3 (the existing `.ts` checker). Accepted. Re-verified `scripts/ts-syntax-check.mjs`, R-993 and R-994 at `REQUIREMENTS.md:1470-1471`, and
   `.pi/nana-pack.json:5` (Read); the file is present at `f6bb0bd` (Ran `git cat-file -e`) and was added on 2026-10-08 (Ran `git log`). It exits 1 on `bad.ts` and `bad2.ts`
   and 0 on a real `.ts` file (Ran), and exits 1 on a valid file without `--experimental-vm-modules` (Ran). Ran `r3/probe-ts-child/run.sh`: with a broken
   `bin/nana-knowledge.ts`, `hook.test.mjs` printed one FAIL, passed a check that expects exit 1, then crashed. Changes: R-1245 drops the crash clause; `TS_CHECK_ARGS`
   joins §3.5 and M38's seal; M12 and M35 are retitled; pair 75 is rewritten and pair 97 added; residual 12 is closed; §3.3, §3.6, §3.8, a §3.9 row and S18.
8. Taken in passing: carry 1 is closed (the runtime-map plan holds R-1270 to R-1299), and S9 now keeps the roster-notice table's pattern titles out, with residual 4. The
   SHOULD and NOTE items of both round-2 reviews are not applied in this revision; design-critique SHOULD-1 and NOTE N-1 are covered by items 2 and 8.
9. Numbers: no row, check or pair is renumbered. New: R-1269; C10 and M39; pairs 92 to 98.
10. Recount (Ran `node r3/recount.mjs`, and the rail's `shall` pattern over §2): 40 rows added (R-1230 to R-1269), none reworded, each with one `shall` and an EARS
    opener; 49 new titles (C1 to C10, M1 to M39), every row named by one, the coverage list equal to the markers; 98 pairs, numbered 1 to 98 with no gap, 96 on macOS; every
    check has a macOS pair except C7; no title begins with another followed by a space; the tree total is the base plus 40; carries 1 (closed), 2 and 3; residuals 1 to 17,
    with 12 closed; owner calls: 0 blocking, 1 optional, 1 parked.
