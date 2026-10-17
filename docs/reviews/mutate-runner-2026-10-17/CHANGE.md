# Change declaration — mutate-runner: promote the roster-notice runner's plumbing into one shared module

*Lane `mutate-runner` · `feat/mutate-runner` · `~/nana-pi-wt/mutate-runner`, from current `main` after the seat-rule lane lands · cites at `afd74de` · 2026-10-17 ·
seat draft 4 (the slim rewrite) with seat revision 4 (slim) applying the slim fact-check and critique MUSTs and seat revision 5 applying the plan review (change logs at the end). Feature: FEAT-031 (15 new rows, R-1230 to R-1244; R-1245 to R-1269 stay free for the
later lanes of §6). Class: neither gate nor format (no land, release or suite gate reads the runner's exit). Small, so one plan-review round (S9), now spent. Builder: the seat's
larger-lane builder, a subagent in the lane worktree (`build-brief-1.md`). No `packages/nana-setup/` file and no hook: no install check. Stakes: low to medium, reversible. A bug that misjudges a
pair hides a survivor in the seat's own checks only, never in `nana-land`, the suite or a release. No existing code changes, and a revert removes the lane. Draft 3, with
its 40 rows, 49 checks and 98 pairs, is saved beside this file as `CHANGE-draft3.md`; its research, critiques, fact-checks and probes stay where they are and are cited
by name. "Ran" = run on the seat machine (macOS, 10 cores, Node 22.22.2) for this draft, its probes in `slim/` and `rev4/` beside this file; "Read" = read at `afd74de`, not run;
INFERRED = not read or run. "The landed runner" is `docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs` at `afd74de`; bare line citations are into it. The owner is
"the owner" throughout, with no name and no word-for-word quote, so this file can enter a public review corpus unchanged.*

## 1. Why

The owner asked that the seat run work at the same time by default and that its mutation runs stop being slow, and ordered a shared split mutation runner as its own
lane. The seat-rule lane (landing now) makes parallel work the seat guide's rule and names "a long mutation run in parts" as work to start at once. This lane gives every
lane the split without copying a runner.

- **Splitting is measured and already built.** Serial runs on the regroup lane ran 2.0 to 3.3 pairs a minute; a five-way hand split ran 8.6 (`CHANGE-draft3.md` §1, Ran
  there). The landed runner builds the split in: N child runs of itself, pairs dealt round-robin, starts 4 s apart, one merged record (`:18-23`, `:507-572`). It has three
  committed five-shard records: 68 pairs at `59db91d` in 2 min 15 s (draft 3 §1, Ran there), 70/70 at `633d41b`, and 71/71 red at `f5c2d3c` with 55 exactly their named
  titles, 4 with a named title green, 15 with an unnamed red and 0 survived (Ran `git show` of each record's RESULT line).
- **But it is still a copy.** Main holds 11 JavaScript runners, 5,104 lines (Ran `wc -l docs/reviews/*/seat-mutate.mjs` at `afd74de`). The plumbing starts at
  `:271` and runs to the end, 324 of the landed runner's 594 lines. The next lane would copy it again.
- **The plumbing has gaps worth fixing once, in the shared copy.**
  - A broken `.ts` mutant reads RED, not SYNTAX: `node --experimental-strip-types --check` exits 0 on a broken `.ts` file (`:384`; Ran `slim/ts/`). The repository's own
    checker, `scripts/ts-syntax-check.mjs` (R-993, R-994), exits 1 on it and 0 on a valid file (Ran).
  - A repeated pair id loses a pair at more than one shard: the merge keys lines by id (`:547`), so one pair's line prints twice and the other's never, with no
    `MISSING` line (`:561`; Read).
  - Windows: the timeout kill is `process.kill(-pid)` in a try (`:361`), which throws there and is caught, so a hung file hangs its shard (INFERRED, not run on Windows);
    test children start `detached` with no `windowsHide` (`:355`); the own-root check compares `fs.realpathSync` paths (`:335`), which keep an 8.3 short name
    (`docs/sessions/2026-10.md:53`, lesson 2; INFERRED for this check); npm is started by name with no shell (`:292`), which cannot start `npm.cmd`, so its values are
    skipped without a word (INFERRED from Node's `.cmd` rule).
  - A descendant that holds a test file's output open delays the result until the 10-minute time limit, because the stray-group kill waits for `close` (`:362-365`;
    Read). On Windows nothing bounds it (INFERRED).
  - The table hard-codes a checkout path under the home folder and a branch name (`:41-42`).
  - A mistyped edit path throws inside the shard (`:375`), and one shard runs in the parent's own process and writes the record line by line (`:588-594`). At
    one shard a throw or a red baseline leaves no `MISSING` line, a throw also leaves no RESULT line, and two runs at once given one record file mix their lines
    with exit 0. At two shards a healthy pair that shares the throwing shard reads `MISSING` (Ran `rev4/probe.sh`, cases RB1, A1, A2 and B).
  - Above one shard, two runs given one record file each write it whole at their end, so the later replaces the earlier and both exit 0 (`:566`; Read).
  - Each shard imports the table again and resolves the tip again (`:528`, `:584`), so a table edit or a branch move during the stagger mixes two tips or two tables
    under the parent's header (Read). A shard killed outright leaves its worktree and its running test tree (`:487-494` run only in a live shard; Read). An edit
    or test path is joined to the worktree with no check that it stays inside it (`:345`, `:374`; Read).

**Threat model.** In scope, honest variation in our tools' output and in seat tables: test output with CRLF endings; a title followed by detail on PASS and FAIL lines; a
title given as a pattern; a FAIL line from a file that exits 0; a file that crashes before its checks; a file that hangs; a file that leaves a child running after it exits;
a descendant that holds a file's output open; a syntax-broken `.mjs` or `.ts` mutant, including a `.ts` module a test reaches only through a spawned child; sibling
worktrees doing git work at the same time; git hooks in the lane repository; a Windows 8.3 short temp path beside git's long path; `npm` installed as `npm.cmd`; a mistyped,
repeated, blank or space-holding pair id; a mistyped edit path; an edit or test path that leaves the worktree by `..` or a symbolic link in the lane's tree; a
second run started with the same record file; a lock left by a run killed outright; a table edited or a branch moved while shards start; a table config that names one
tunable or a mistyped key; a bad shard count or stagger; a tip or merge base that does not resolve; a shard that dies mid-run; a stop by Ctrl-C or a
background-task stop; a table copied from the landed runner. Out of scope, deliberate forgery: a forged pair table, a test file written to print false PASS or FAIL lines,
tampering with a scratch worktree from outside the run, and lane code that attacks the machine (the runner runs the lane's own code by design, as the suite does). A finding
outside the model is a residual.

## 2. Requirement delta

Main's highest ID is R-1215 (Ran at `afd74de`). R-1230 to R-1269 appear on no branch except `feat/seat-rule` and its remote, where a fact-check note names the range as this
plan's (Ran `git grep` over all 40 local and remote refs; a control grep finds R-1215 at `afd74de`). The seat-rule lane rewords R-1140 and adds no row (Ran `git diff afd74de...feat/seat-rule
-- REQUIREMENTS.md`). The runtime-map plan holds R-1270 to R-1299 (draft 3 carry 1). One `shall` per row: the rail counts it with code spans masked
(`templates/typescript/template/tests/requirements-trace.ts:148`, `:272-282`; Ran its pattern over this table: 15 rows, one each). A new row enters `planned` and flips to
`implemented`, with its evidence cell, in the commit whose code turns its marked tests green. Rows are placed by feature ID: all fifteen go to FEAT-031 ("Run checks reliably
and without contaminating work", `REQUIREMENTS.md:1511`), with no new subgroup (S4).

| ID | Change | Text |
|---|---|---|
| R-1230 | added | The mutation runner shall apply each pair's edits only in a detached scratch worktree of the lane tip (SEAT_MUTATE_TIP when set, else the table's tip), one worktree per shard in a new folder under the OS temp folder, which it adds and resets with git hooks off and, before each pair and only after confirming the worktree is its own git root, resets to the tip and clears of untracked and ignored files. |
| R-1231 | added | WHEN a run ends, or receives SIGINT or SIGTERM on a POSIX platform, the mutation runner shall leave no test file it started running and remove each scratch worktree it created with its git worktree entry and folder, those of a shard that died included, or with SEAT_MUTATE_KEEP set to 1 leave each one and print its path, and after a signal exit non-zero. |
| R-1232 | added | The mutation runner shall run each test file as `node --experimental-strip-types <file>` from the file's package folder, with a fresh home and temp folder of its own as HOME, USERPROFILE, TMPDIR, TEMP and TMP, without PI_CODING_AGENT_DIR, any SEAT_MUTATE_ variable or any NANA_ variable other than NANA_TEST_ ones, with git's gc.auto set to 0 after the caller's GIT_CONFIG entries, and with each npm prefix, global config and user config value the caller lacks read from npm, the prefix also filling a missing global prefix, printing one line that names each value npm could not give. |
| R-1233 | added | WHEN a test file passes the per-file time limit, the mutation runner shall kill the file's whole process tree, by process group on POSIX and with `taskkill /T /F` on Windows, and report the file as timed out. |
| R-1234 | added | WHEN a test file exits, the mutation runner shall stop waiting for the file's output once it closes or the configured drain has passed, and then kill what remains of the file's process group on POSIX. |
| R-1235 | added | IF an edit's file resolves outside the scratch worktree with its symbolic links followed, does not exist or cannot be read, an edit's anchor does not occur exactly its stated number of times, a mutated .mjs or .js file fails `node --check`, or a mutated .ts file fails the repository's TypeScript syntax checker, THEN the mutation runner shall report the pair as ANCHOR-MISS or SYNTAX naming the file, run none of its test files, and end the run with exit 3. |
| R-1236 | added | WHEN a shard starts a run that is not dry, the mutation runner shall run no test file its pairs name that resolves outside the scratch worktree with its symbolic links followed, run each other one once unmutated, run a red one again up to the configured baseline retries, and, when a file resolves outside the worktree or stays red, or a named title matches none of the PASS lines of that pair's files, judge none of the shard's pairs and end the shard with exit 2, naming the file or the title. |
| R-1237 | added | The mutation runner shall print RED for a pair whose test files print any FAIL line, crash or time out, listing each named title that stayed green or was not reached and each failing title neither named nor declared also-red, and GREEN (SURVIVED) for any other pair, where a line matches a title that it equals or begins with followed by a space, or a title given as a pattern that tests true on it. |
| R-1238 | added | The mutation runner shall run the selected pairs as N shard processes, where N is SEAT_MUTATE_SHARDS or else the configured default and at most the selected pair count, dealing the pairs round-robin in table order, giving each shard its own scratch worktree, and starting each shard the stagger after the one before it, from SEAT_MUTATE_STAGGER_SECS or else the configured stagger. |
| R-1239 | added | The mutation runner shall write one record, to the file SEAT_MUTATE_OUT names when set, holding a header that names the lane, the tip, a lane branch head that differs from the tip, the merge base, the pair and shard counts, the platform and the Node version, then one DECLARED line per declared reading, each selected pair's line exactly once in table order with a MISSING line for a pair no shard printed, and one RESULT line summed over the shards, and end a run with no ANCHOR-MISS or SYNTAX pair with exit 2 when a pair is MISSING or a shard fails. |
| R-1240 | added | IF a pair id on the command line is not in the table, the table repeats a pair id or holds a blank one or one with white space, SEAT_MUTATE_SHARDS is not a whole number of 1 or more, SEAT_MUTATE_STAGGER_SECS is not a number of 0 or more, or the tip or its merge base with main does not resolve, THEN the mutation runner shall refuse before creating any worktree, naming the id or value, and exit 2. |
| R-1241 | added | The mutation runner shall, with SEAT_MUTATE_DRY set to 1, apply and syntax-check every selected pair's edits, print DRY ok for each pair that applies and run no test file, and, with SEAT_MUTATE_LOGDIR naming a folder, save there each red baseline run's output and each pair's output for each test file, the latter named by the pair id with each / turned into -, then --, then the file's base name. |
| R-1242 | added | WHEN SEAT_MUTATE_OUT names a record file, the mutation runner shall, before creating any worktree, create a lock file beside it with an exclusive-create flag holding its process id and start time, refuse with exit 2 naming the record file while that lock exists and its process still runs, report and replace a lock whose process no longer runs, and remove its own lock when the run ends. |
| R-1243 | added | The mutation runner shall resolve the tip to a commit and hash the pair table once in the parent, pass both to every shard, name both in the record's header, and, in a shard whose own tip commit or table hash differs from the parent's, refuse before creating that shard's worktree, naming both values, and end that shard with exit 2. |
| R-1244 | added | The mutation runner shall take each tunable a table's config names from that config and every other tunable from its config module, and refuse a config key outside the overridable tunables before creating any worktree, naming the key, with exit 2. |

15 rows added, none on main reworded or retired. R-1232 and R-1234 repeat clauses of the suite runner's R-603, R-604, R-648 and R-610 for the mutation runner, because the
two runners share no code until the parallel suite lane (residual 1). R-1233's Windows clause and R-1234's drain on Windows are pinned only by the non-blocking Windows leg,
and no mutation pair can red them on macOS (§5.3, pair 11); each evidence cell says so. R-291's text is unchanged; its leaf-total literal moves from 1,178
(`requirements-tree.test.mjs:40`, `:54`, `:55`) to the base's total plus 15 (1,193; main `61c5748` still holds 1,178, Ran).

## 3. Design

**3.1 Two modules in the pack's lib.** The code map lets apps and `scripts/` import packages, never the reverse (`code-map.config.json` `layers`), so a module in
`packages/nana-pack/lib/` can serve a later suite lane; `docs/reviews/` is not a map root, so lane tables stay outside the map. No bin, PATH link or `package.json`
change: the lane table is the entry point. Each module opens with the six-tag header. The runner imports only Node's modules and its config, and nothing imports
either, so both are new leaves of the map.
- `lib/mutation-runner.mjs` — *@purpose* "Run a lane's mutation pair table in scratch worktrees of its tip, split across shard processes, and write one judged record."
  *@effects* disk, process. Exports `runMutations(table)`, which resolves to the exit code; `judgePair(pair, runs)`, which has no effects, so judging is tested without
  git; `shardCount(env, selected, config)`, also without effects; and `resetScratch(dir, tip, config)`, for the own-root check (M2). It starts the repository's
  TypeScript checker as a helper child from the table's checkout and never imports it, so the layer rule is untouched.
- `lib/mutation-runner-config.mjs` — *@purpose* "Hold the mutation runner's tunables and contract values, each with its provenance." *@effects* none.

**3.2 How a run goes.** The landed runner's flow, kept step for step; §3.3 lists every change.
1. Read the pair ids from the arguments and the `SEAT_MUTATE_` variables, and the table's `config` over the config module (R-1244). Find the repository as the git
   root of the table's own folder. Resolve the tip and its merge base with `MAIN_BRANCH`, and the branch head when the table names a branch. Refuse with exit 2 before
   any worktree on any R-1240 or R-1244 case.
2. When `SEAT_MUTATE_OUT` is set, the parent (never a shard, which writes only its part file) takes the record's lock (R-1242): create `<record>` plus `LOCK_SUFFIX` with the `wx` flag, holding the parent's pid and start time.
   On `EEXIST`, read it: a pid that still runs (`process.kill(pid, 0)` succeeds or fails with `EPERM`) refuses with exit 2, naming the record file and the holder's pid
   and start time; a pid that no longer runs is reported on one line, the stale lock removed, and the `wx` create tried once more, so a second `EEXIST` refuses too.
   Any other create error refuses with exit 2, naming it. Everything after a created lock runs inside a `finally` that removes it, and a refused run removes no lock. Hash the
   pair table (R-1243): `TABLE_HASH` over the JSON of the table's pairs and config, a pattern title written as its source. Set the shard count (R-1238) and print the
   header, which names the tip commit and the table hash, and the DECLARED lines (R-1239).
3. Start shard k, for every k from 1 to N, one shard included, as `node <table> <its ids>` (k-1) × stagger after the first, with `SEAT_MUTATE_SHARD=k/N`,
   `SEAT_MUTATE_SHARDS=1`, the tip commit and table hash (`SEAT_MUTATE_TIP_COMMIT`, `SEAT_MUTATE_TABLE_HASH`), a scratch folder the parent makes for it with
   `mkdtemp(<os.tmpdir()>/<SCRATCH_PREFIX>)` and records (`SEAT_MUTATE_SCRATCH`), and its part and tally files in a new folder under the OS temp folder. Print each
   shard's lines live with a `[k/N]` prefix. The parent never judges a pair itself, so every run, one shard included, ends in the merge of step 7.
4. Signals (R-1231, POSIX): the parent passes SIGINT or SIGTERM on to each shard and marks the run interrupted; a shard kills its running test file's group, removes its
   worktree unless keep is set, and exits 130 or 143, as the suite runner does (`scripts/test.mjs:108-113`).
5. A shard: resolve its own tip commit and hash its own table as step 2 does, and refuse with exit 2, naming both values of whichever differs, before any worktree
   (R-1243). Its scratch folder is the one the parent made, holding an empty `no-hooks` folder and the worktree, added with
   `git -c core.hooksPath=<no-hooks> worktree add --detach` (R-1230); every git call carries that hooks path. While a test file runs, the shard keeps its pid in a
   file in the scratch folder (step 7). Baseline (R-1236): every named test file resolved first, with `fs.realpathSync.native` when it exists, and the shard refused
   with exit 2, naming the file, when one lands outside the worktree's own real path, before any test file runs; then each named file once unmutated, a red one
   again up to `BASELINE_RETRIES`, each attempt printed; then every named title (`expectRed`, `alsoRed`) must match a PASS line of one of the pair's files.
6. Each pair: confirm the worktree is its own git root, comparing `fs.realpathSync.native` on both sides; `git reset --hard <tip>`; `git clean -fdxq`; confirm HEAD and a
   clean status; apply the edits, where an edit file that resolves outside the worktree (by `..`, or with `fs.realpathSync.native` through a symbolic link), does not
   exist or cannot be read is ANCHOR-MISS naming the file, not a throw, and nothing is read or written outside; check each mutated `.mjs` or
   `.js` with `node --check` and each `.ts` with `TS_CHECK_ARGS` (R-1235); run the pair's files (R-1232 to R-1234); judge (R-1237).
7. Merge (R-1239), at every shard count. When a shard ends and its scratch folder is still there (it died, or threw before its own cleanup), the parent kills the
   test tree its pid file names, as R-1233 kills one, and removes the worktree with `git worktree remove --force` and then the folder, unless keep is set, when it
   prints the path (R-1231). When every shard ends, read the part files, put each pair line in table order, add a `MISSING` line for each selected pair no shard printed, sum the
   tallies into one RESULT line, write the record, remove the parts folder unless keep is set, and remove the lock (R-1242). Exit 3 after any ANCHOR-MISS or SYNTAX; else 2 after a MISSING pair, a
   shard that exited other than 0 or 3, or a signal; else 0.

A test file's run (R-1232 to R-1234) follows the suite runner (`scripts/test.mjs:76-83`, `:206-261`): `detached` on POSIX only, `windowsHide`, stdin ignored. At the time
limit it kills the tree (group kill on POSIX, `taskkill /T /F /PID` on Windows) and marks the file timed out. On `exit` it waits for `close` up to `DRAIN_MS`, then on
POSIX kills what is left of the group, then resolves. So a stray that holds no pipe dies at once, as in the landed runner, and one that holds the pipe gets at most the
drain. A file crashed when its last line is Node's version line, when it exits non-zero or times out with no FAIL line, or when it prints FAIL lines and exits 0 (`:305`,
`:457-459`, kept).

**3.3 Changes from the landed runner.** Everything else is the landed code moved, with its line words unchanged.

| Change | Why | Row |
|---|---|---|
| Table passes `self: import.meta.url`; the repository is the git root of its folder | no checkout path or home path in a table (`:41`) | R-1230 |
| Hooks off through an empty folder in the scratch folder, not `/dev/null` | `/dev/null` is a POSIX path; an empty folder means no hooks on both platforms | R-1230 |
| `git clean -fdxq`, not `-fdq` | a new worktree holds no ignored file; `-x` returns it to that state | R-1230 |
| Own-root check with `fs.realpathSync.native` on both sides | 8.3 short names on Windows (§1) | R-1230 |
| npm values the caller lacks come from `NPM_COMMAND`, with one line naming each value not read | a silent skip on Windows becomes a visible line | R-1232 |
| `detached` on POSIX only, `windowsHide`, `taskkill /T /F` at the time limit on Windows | the landed timeout kill does nothing on Windows (INFERRED, §1) | R-1233 |
| On `exit`, wait for `close` up to the drain, then kill the group; the landed runner killed the group on `close` | a pipe holder no longer stalls a file until the time limit; on Windows nothing else bounds it | R-1234 |
| `.ts` checked with the repository's checker, `TS_CHECK_ARGS`, not Node's `--check` | Node passes a broken `.ts` file (Ran); the six `.ts` pairs of the landed table pass the checker, so none turns SYNTAX (Ran `slim/probe-ts-pairs.mjs`) | R-1235 |
| A repeated, blank or space-holding pair id refused | the merge keys lines by id and parses ids as `\S+` (`:306`, `:547`) | R-1240 |
| The header names the shard count at one shard too | one header shape | R-1239 |
| One shard runs as a shard process too; the parent always merges and writes the record once, whole | the landed one-shard run appends the record line by line: a red baseline or a throw leaves no `MISSING` line, a throw leaves no RESULT line, two runs given one record file mix lines with exit 0 (Ran `rev4/probe.sh` RB1, A1, B) | R-1238, R-1239 |
| An edit file that does not exist or cannot be read is ANCHOR-MISS naming the file | the landed read throws (`:375`): at one shard the record stops after pair 1; at two a healthy pair in that shard reads `MISSING` (Ran `rev4/probe.sh` A1, A2) | R-1235 |
| Part and tally files in a temp folder, removed after the merge unless keep is set; the landed runner left five of each beside the record | the merged record holds every part line | R-1239 |
| A lock file beside the record, made with an exclusive create and holding the parent's pid and start time; a second run on that record refused; a lock whose pid no longer runs reported and replaced | above one shard, two runs given one record file each write it whole at the end, so the later replaces the earlier with both exit 0 (§1; plan review MUST 1) | R-1242 |
| The parent resolves the tip commit and hashes the table once and passes both on; a shard whose own differ refuses; the header names both | each landed shard re-imports the table and re-resolves the tip, so an edit or a branch move during the stagger mixes results under one header (§1; plan review MUST 2) | R-1243 |
| The parent makes and records each shard's scratch folder; after a shard ends with its folder still there, the parent kills the test tree the shard's pid file names and removes the worktree and folder | a shard killed outright left its worktree and its test tree (§1; plan review SHOULD 1) | R-1231 |
| Each edit and test path resolved, symbolic links followed, and refused when it leaves the worktree | the landed runner joins a table path to the worktree with no containment check (§1; plan review SHOULD 2) | R-1235, R-1236 |
| Tunables from the config module; a table passes in `config` only the overridable tunables it changes, merged over the module, and any other key is refused by name | coding standards; checks need short limits and an npm that cannot start; a replace-whole config leaves every value a table omits undefined (plan review SHOULD 4) | R-1244 |

Old records stay valid. Nothing edits, moves or runs an old runner or record; in-flight lanes keep their own copies (S6). A new record keeps the landed line words
(`seat-mutate: lane …`, `DECLARED`, `[k/N]` notes, `BASELINE ok`, `BASELINE FAIL`, `BASELINE RETRY`, `BASELINE MISSING`, `RED`, `GREEN … SURVIVED`, `ANCHOR-MISS`,
`SYNTAX`, `DRY ok`, `MISSING`, `RESULT`, `RESULT (DRY)`, `seat-mutate: KEEP`), so an old and a new record read the same pair line the same way. The header gains
the table hash after the tip commit, and the new notes (the lock, a stale lock, a shard's identity refusal, a dead shard's cleanup) start `seat-mutate:` as the old ones do.

**3.4 The lane table.** A lane's `docs/reviews/<lane>-<date>/seat-mutate.mjs` becomes constants, titles, DECLARED readings, the pair table and one call. Pair fields, as
in the landed table: `n`, `name`, `edits` (each `{ file, anchor, replacement, times }`), `tests`, `expectRed`, optional `alsoRed`; a title is a string or a RegExp. Table
fields: `lane`, `self`, `tip`, `pairs`; optional `branch`, `declared`, and `config`, an object naming only the `OVERRIDABLE` tunables it changes (R-1244). Usage is the landed usage (`:30-31`):
`SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] [SEAT_MUTATE_SHARDS=<n>] [SEAT_MUTATE_STAGGER_SECS=<s>] [SEAT_MUTATE_LOGDIR=<dir>] [SEAT_MUTATE_KEEP=1] node seat-mutate.mjs [pair-id …]`.

```js
// A seat script, never imported, run or copied by a suite test.
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const L1 = "roster notice: one line that starts with the prefix and names the builders, reviewer and land by model and thinking";
process.exitCode = await runMutations({
  lane: "roster-notice", self: import.meta.url, tip: "f5c2d3c",
  declared: ["(a) pair ids are §5.4's row numbers"],
  pairs: [{ n: "2", name: "the notice drops the thinking level", edits: [one("packages/nana-pack/lib/roster-notice.mjs", "…", "…")], tests: ["packages/nana-pack/tests/roster-notice.test.mjs"], expectRed: [L1] }],
});
```

**3.5 Config, read by name** (`lib/mutation-runner-config.mjs`; each value with its provenance beside it).

| Name | Value | Provenance |
|---|---|---|
| `SHARDS_DEFAULT` | 5 | chosen (seat, 2026-10-16), the landed default (`:56`): three five-shard records on the 10-core seat machine and the regroup hand split at five, 8.6 pairs a minute against 2.0 to 3.3 serially (§1); the claim most likely wrong (§5.4) |
| `STAGGER_SECS_DEFAULT` | 4 | chosen (seat, 2026-10-16), the landed default (`:59`): N worktree adds and first test files do not all begin in one second; not measured |
| `FILE_TIMEOUT_MS` | 600000 | chosen: every copy uses 10 minutes (`:50-51`), twice the suite's 5 (`scripts/test.mjs:57`), because shards share the machine |
| `BASELINE_RETRIES` | 1 | chosen: the landed runner re-runs a red baseline file once, because other jobs share the machine (`:416-421`) |
| `DRAIN_MS` | 2000 | contract R-1234: the suite runner's drain (`scripts/test.mjs:58`, R-610), so a file ends as under `npm test`; defined twice until the parallel suite lane (residual 1) |
| `SCRATCH_PREFIX` | `seat-mutate-` | chosen: one prefix, so a leftover folder is easy to find |
| `MAIN_BRANCH` | `main` | contract R-1240: the working pattern's base branch, read for the merge base (`:313`) |
| `ENV_NAMES` | `SEAT_MUTATE_OUT`, `_TIP`, `_DRY`, `_KEEP`, `_LOGDIR`, `_SHARDS`, `_STAGGER_SECS`; shard-only `_SHARD`, `_TALLY`, `_SCRATCH`, `_TIP_COMMIT`, `_TABLE_HASH` | contract R-1230, R-1231, R-1238, R-1239, R-1241: the landed names (`:30-31`, `:53`, `:527`); R-1231 and R-1243: the three shard-only names this lane adds |
| `LOCK_SUFFIX` | `.lock` | chosen: the lock sits beside the record under the record's own name, so a refusal names a file the seat can find |
| `TABLE_HASH` | `sha256` | chosen: Node's built-in hash, so the runner keeps no dependency; the header names it beside the value |
| `OVERRIDABLE` | `SHARDS_DEFAULT`, `STAGGER_SECS_DEFAULT`, `FILE_TIMEOUT_MS`, `BASELINE_RETRIES`, `NPM_COMMAND` | contract R-1244: the values a lane or a check may need to change, the four chosen run limits and `NPM_COMMAND`, which a check replaces with one that cannot start; every other value stays fixed |
| `EXIT_REFUSED`, `EXIT_TABLE_FAULT` | 2, 3 | contract R-1235, R-1236, R-1239, R-1240: the landed exits (`:438`, `:496`, `:569-570`, `:577`) |
| `SIGNAL_EXITS` | SIGINT 130, SIGTERM 143 | contract R-1231: the suite runner's codes (`scripts/test.mjs:109`) and the landed runner's (`:399`) |
| `CHILD_NODE_ARGS` | `--experimental-strip-types` | contract R-1232, after R-603 |
| `TASKKILL_ARGS` | `/T`, `/F`, `/PID` | contract R-1233: the suite runner's tree kill (`scripts/test.mjs:81`) |
| `TS_CHECK_ARGS` | `--no-warnings`, `--experimental-vm-modules`, `scripts/ts-syntax-check.mjs` (resolved against the table's checkout; the mutated file follows) | contract R-1235: the repository's `.ts` post-edit command (`.pi/nana-pack.json:5`), whose checker R-993 and R-994 state |
| `NPM_COMMAND` | `npm` | contract R-1232: the command npm's values come from; a check replaces it with one that cannot start |
| `NPM_KEYS`, `GLOBAL_PREFIX_KEY` | `prefix`, `globalconfig`, `userconfig`; `global_prefix` | contract R-1232: the values `npm run` exports that the landed runner supplies (`:289-295`) |
| `LOG_NAME` | `/` becomes `-`, joined by `--` | contract R-1241 |

M20 alone holds the sealed literals; every other check imports the names, so retuning `SHARDS_DEFAULT` changes the config and no test. A table's `config` merges
over this module (R-1244): a check that needs a short time limit names `FILE_TIMEOUT_MS` alone and every other value stays the module's. `DRAIN_MS` is defined twice,
here and in `scripts/test.mjs:58`, which the standards forbid: a declared violation, closed by the parallel suite lane (residual 1).

**3.6 Cross-platform.** Process trees: a group kill on POSIX, `taskkill /T /F /PID` on Windows, `windowsHide` everywhere. After a file exits, only POSIX can reach its
strays (R-1234); Windows strays are residual 4. Hooks off through an empty folder. Own-root paths compared with `fs.realpathSync.native`. npm started by `NPM_COMMAND`
with no shell; on Windows that fails and R-1232 prints the line (later lane: `winCommand`). Output split at `\r?\n`, each title trimmed. Test paths joined with
`path.join`, so a table's forward slashes work on Windows. The TypeScript checker is plain Node on both platforms. Signals: on Windows a parent's `kill` ends a child outright instead of
delivering a signal it can catch (`scripts/test.mjs:115-116`), so R-1231's signal clause is POSIX only and M4 prints SKIP on Windows (residual 4); a stop there
ends each shard outright, and the parent's dead-shard cleanup is then all that clears its test tree and worktree (INFERRED). The lock's liveness test,
`process.kill(pid, 0)`, works on both platforms. A dead shard's test tree is killed as R-1233 kills one, by `taskkill` on Windows. Containment compares
`fs.realpathSync.native` paths through `path.relative`, so a result that starts with `..` or is absolute (another drive) is outside; git on Windows may check out a
symbolic link as a plain file, so M25's symbolic-link case runs on POSIX only and its `..` case on both.

**3.7 Docs.** The pack README gains one section, `## Seat mutation runner (lib/mutation-runner.mjs)`, after the writing checker section (`README.md:312-369`): what it
is for, the table shape and usage of §3.4 with the table path spelled `docs/reviews/<lane>-<date>/seat-mutate.mjs`, the line words, exits 0, 2 and 3, the five-shard
default, the lock spelled `<record>.lock` and what a refused or stale lock prints, the overridable tunables a table's `config` may name, and its limits: never split a
long run while a full suite runs on the same machine (the seat guide's rule once the seat-rule lane lands); a parent killed outright writes no record, leaves its
shards to end on their own and leaves its lock for the next run on that record to replace; on Windows a stop ends each shard outright, and npm's values are not read; a table names a check's
longer title when a shorter named title begins it; a lane that needs a feature left out keeps a local runner. The README check reads a code span holding `<…>` as prose and
a bare `seat-mutate.mjs` as a path that must exist (`factcheck.md` C-a, Ran in draft 3), so the section never names the table file bare. No root README, AGENTS.md, seat
guide or shared working pattern change (S10).

**3.8 What NOT to do.** No edit to the runners on main or their records, to `scripts/test.mjs`, to `scripts/ts-syntax-check.mjs` (started as a child, never imported),
the seat guide, the shared working pattern, `package.json`, `nana-setup` or any hook. No suite test imports, runs or copies a lane table. Nothing the lane writes adds a
provider, host name, absolute home path or owner name: corpus tables find their repository from their own path, and evidence copied into the corpus is scrubbed first.

**3.9 Subtraction test.**

| Part | Earns it because | Cut or kept smaller |
|---|---|---|
| One shared module | 11 copies, 5,104 lines on main; each lane copies about 320 lines of plumbing again | two modules; no bin, PATH link or `package.json` entry |
| The record lock | two honest runs on one record file erase one run's record with both exit 0 (plan review MUST 1) | one file made with `wx`; a stale pid replaced, no wait or retry loop; residual 12 |
| The tip commit and table hash passed to shards | a table edit or branch move during the stagger mixes two tips or tables under one header (plan review MUST 2) | refuse on a difference, never adopt the parent's; the runner module itself is not hashed (residual 7) |
| The parent's dead-shard cleanup | a shard killed outright left its worktree and test tree (plan review SHOULD 1) | one pid file and one cleanup after each shard ends; a parent killed outright is residual 5 |
| Path containment | a table path can leave the worktree by `..` or a symbolic link (plan review SHOULD 2) | folded into R-1235 and R-1236's existing refusals; no new line word |
| The landed split: shard processes, round-robin deal, staggered starts, one merged record | three committed five-shard records; a five-way hand split ran 8.6 pairs a minute against 2.0 to 3.3 serially | moved as it is; a shared queue is a later lane |
| Windows tree kill at the time limit | without it a hung file hangs its shard on Windows (INFERRED) | the time limit only; Windows strays after exit are residual 4 |
| Drain after exit, then the group kill | a pipe holder no longer stalls a file until the time limit; on Windows the drain is the only bound | the suite's value; no kill grace |
| `.ts` checked by the repository's checker | Node's check passes a broken `.ts` file (Ran) | one helper call; the landed table's `.ts` pairs pass it (Ran) |
| Repeated, blank and space-holding id refusal | the merge keys lines by id; a repeat loses a pair with no `MISSING` line (Read) | one clause of R-1240 |
| One shard as a shard process, so the parent always merges | the record holds its `MISSING` and RESULT lines at every count and is written once, whole (Ran) | a subtraction: the parent's in-process branch goes; the cost is one `node` start |
| A missing edit file read as ANCHOR-MISS | a typo in a table no longer drops the healthy pairs that share its shard (Ran) | one guard around the edit read; one clause of R-1235 |
| The npm line | a silent skip on Windows becomes a visible line | no `winCommand` yet |
| Table finds its repository from its own path | no checkout path or home path in a table | — |
| Config module, merged under a table's `config` from an allowlist | no inline tunables; checks need short limits and an npm that cannot start; a partial override must keep every other value (plan review SHOULD 4) | one row (R-1244); M20 seals the contract values and the allowlist; values are not type-checked (residual 13) |
| Equivalence run of the landed table (§5.4, A2) | a promotion must not change a verdict | one table, at one shard and at five |
| Draft 3's one-process shared queue (B1) | no: a redesign of a measured design; its gain was an INFERRED 120 s against a measured 135 s | cut; later lane |
| Draft 3's copy baseline above one shard | no: draft 3 found no sign of load-made reds, 44 of 217 split pairs with an unnamed red against 40 of 209 serial | cut; later lane |
| Longest-candidate title reading | no: it changes the copies' reading for 4 title pairs on main; a table can name the longer title | cut; residual 2; later lane |
| Stay-green pairs, case labels, skip reasons | no: older tables use them; those lanes keep their own runners | cut; later lane |
| Script and pattern edits, async helpers with a time limit | no: no landed table uses them | cut; later lane |
| ERROR and NOT RUN lines | no: a throw ends that shard with a non-zero exit, its pairs read `MISSING`, and the run exits 2 at every shard count, which fails closed | cut; residual 6 |
| Core-based shard default and a `--parts` flag | no: the landed default ran three times; the variable exists | cut; later lane |
| Runner hash and `config injected` in the header | no: nothing reads them yet | cut; later lane |
| A refusal of characters Windows forbids in an id | no: log names turn `/` into `-`, and ids are short numbers | cut; later lane |
| Kill grace, `rmSync` retries, Windows signal handling | no Windows run to measure them against | cut; residual 4; later lane |
| `lib/test-child.mjs` as its own module | no: its consumer, the suite lane, is two lanes away | cut; later lane |
| A seat-guide line for split runs | no: the seat-rule lane's guide names a long mutation run in parts and never splitting beside a full suite | cut (S10) |

## 4. Scope

**In.** New: `packages/nana-pack/lib/mutation-runner.mjs`, `lib/mutation-runner-config.mjs`, `tests/mutation-runner.test.mjs`. Changed: `REQUIREMENTS.md` (15 rows in
FEAT-031), `docs/requirements-tree.md` (regenerated), `packages/nana-pack/tests/requirements-tree.test.mjs` (the leaf total), `docs/code-map.md` (regenerated), the pack
README (one section), `HANDOFF.md` (a Landed line, one queue line pointing at §6, and the residual lines and the optional ask of §7, the ask in the tagged form `- **[optional, since 2026-10-17] Title.** body`),
`docs/sessions/2026-10.md`, and the review corpus `docs/reviews/mutate-runner-<date>/`: this file, `seat-titles.mjs`, the seat's old-form runner `seat-mutate.mjs` (§5.4,
A1) and the builder's `seat-mutate-port.mjs` with its two records (A2), both tables finding their repository from their own path. HANDOFF and session lines paraphrase the owner and quote nothing.
**NOT.** §3.8; every later lane of §6.
**Overlap.** The seat-rule lane lands first: it changes HANDOFF, the session file, the seat guide and R-1140's text, adds no row and keeps the leaf total (Ran
`git diff --stat afd74de...feat/seat-rule`). This lane rebases onto current main before the build and cites rows by ID. The runtime-map lane follows and rebases onto this
one.

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). Tunables imported by name; M20 alone holds sealed literals.
The fixture is a throwaway git repository made with `git init -b main` under a `tmpDir` folder: one package, two tiny `.mjs` modules, one `.ts` module, a copy of the
real `scripts/ts-syntax-check.mjs`, a `post-checkout` hook that writes a mark, and fixture tables and test files written from strings (build-brief rule 5), never under `tests/`. Each
fixture table runs as its own `node` process with an environment the check builds from scratch: no `SEAT_MUTATE_`, `npm_config_` or ambient `NANA_` value leaks in from
`npm test`. Fixture test files write marks into a folder a `NANA_TEST_` variable names. Concurrency is proved with a rendezvous, never timing: each test writes a start
mark and waits, up to a fixture limit, for its partner's. Marks are keyed by a value the pair's edit sets, so baseline runs never wait. The only timing assertion is
M15's lower bound on the stagger. Every async case runs under a per-case limit, and the fixture limits are named constants at the top of the file with their provenance.
M4 and M8 print SKIP on Windows, and M25 runs its symbolic-link case on POSIX only. INFERRED: the file adds about 25 to 50 s to the suite; the build brief sets a measured budget.

**5.1 New checks (26 titles), all in `packages/nana-pack/tests/mutation-runner.test.mjs`.**
- M1 `// req: R-1230` `mutation runner: a pair's edit lands only in a scratch worktree under the temp folder with the lane repository's git hooks not run, the source checkout stays unchanged, and the next pair in that worktree sees neither the edit nor an untracked or ignored file the test left`
- M2 `// req: R-1230` `mutation runner: a scratch path that is not its own git root is refused before any reset or clean, and an untracked file in the repository around it survives`
- M3 `// req: R-1231` `mutation runner: after a run at one shard and at three, and after one whose shard is killed outright, no running test file, scratch folder or git worktree entry is left, and with SEAT_MUTATE_KEEP=1 every scratch worktree is left and its path printed` (a fixture test kills its own shard by `process.ppid` with SIGKILL and then waits; the check polls for that test's pid to end up to a fixture limit)
- M4 `// req: R-1231` `mutation runner: SIGTERM during a two-shard run kills every running test file's process tree, leaves no scratch worktree and exits non-zero` (POSIX; SKIP on Windows)
- M5 `// req: R-1232` `mutation runner: each test file runs as node --experimental-strip-types from its package folder with its own fresh HOME, USERPROFILE, TMPDIR, TEMP and TMP, no ambient NANA_ or SEAT_MUTATE_ variable or PI_CODING_AGENT_DIR, its NANA_TEST_ variables, and gc.auto 0 after the caller's GIT_CONFIG entries` (the flag is read from the test's `process.execArgv`: Node 22.22.2 imports a `.ts` file with no flag, Ran `slim/ts/imp.mjs`)
- M6 `// req: R-1232` `mutation runner: npm's prefix, global config and user config fill only values the caller lacks, the prefix fills a missing global prefix, and an npm that cannot start prints one line naming each value not read` (a fake `NPM_COMMAND` run by `node`, then a missing one)
- M7 `// req: R-1233` `mutation runner: a test file past its time limit has its whole process tree killed and is reported timed out` (both platforms; `taskkill` on Windows)
- M8 `// req: R-1234` `mutation runner: a child that a test file leaves running after a normal exit is gone when the file's result returns` (POSIX; SKIP on Windows; the child holds no pipe; the check polls for the pid's end up to a fixture limit)
- M9 `// req: R-1234` `mutation runner: after a test file exits, a descendant holding its output delays the result by at most the drain` (a detached sleeper holds stdout for a fixture limit; the check passes when the result returns while the sleeper still lives)
- M10 `// req: R-1235` `mutation runner: an anchor that occurs twice or not at all, or an edit file that does not exist, is ANCHOR-MISS naming the file, runs no test file, and the run exits 3` (at one shard, with a healthy pair after the missing file's pair)
- M11 `// req: R-1235` `mutation runner: an edit that breaks a .mjs module, or a .ts module a test reaches only through a spawned child, is SYNTAX before any test file runs, a valid .ts edit is not, and the run exits 3`
- M12 `// req: R-1236` `mutation runner: a baseline file red once runs again and the run goes on, while one red on every attempt, or a named title with no matching baseline PASS line, ends the shard with exit 2 before any pair is judged, naming it`
- M13 `// req: R-1237` `mutation runner judge: with LF or CRLF output, detail after titles and a title given as a pattern, a pair that reds its named title is RED naming it, and a pair with no failing title is GREEN (SURVIVED)`
- M14 `// req: R-1237` `mutation runner judge: a RED line lists a named title that stayed green, one not reached, an unnamed failing title, a crashed file and a timed-out file, and leaves a declared also-red title out of the unnamed list`
- M15 `// req: R-1238` `mutation runner: at two shards started a stagger apart, pairs dealt round-robin run at the same time in different scratch worktrees` (three pairs: pairs 1 and 3 report one worktree, pair 2 another; pairs 1 and 2 meet at a rendezvous; the second shard's header is at least half the stagger after the first's)
- M16 `// req: R-1238` `mutation runner: the shard count is SEAT_MUTATE_SHARDS, else the configured default, and never more than the selected pair count`
- M17 `// req: R-1239` `mutation runner: the record holds the header, the DECLARED lines, each selected pair's line once in table order at one shard and at three, and one RESULT line summed over the shards` (four pairs, so shard order differs from table order; asserts ids, order and counts, not verdict words)
- M18 `// req: R-1239` `mutation runner: at one shard and at two, a pair whose shard dies before printing it is a MISSING line, the record still ends with one RESULT line, and the run exits 2` (a fixture test kills its own shard by `process.ppid`)
- M19 `// req: R-1240` `mutation runner: an unknown pair id, a repeated or blank table id, an id with white space, a bad shard count or stagger and a tip that names no commit each refuse with exit 2, naming it, before any worktree is created`
- M20 `// req: R-1230 R-1231 R-1232 R-1233 R-1234 R-1235 R-1236 R-1238 R-1239 R-1240 R-1241 R-1243 R-1244` `mutation runner: sealed values: the option names, exits 2 and 3, the child's node argument, the drain, the taskkill arguments, the .ts checker command, the npm keys and the overridable tunables, and every config value has its provenance beside it`
- M21 `// req: R-1241` `mutation runner: the dry option applies and syntax-checks every selected pair, prints DRY ok for each pair that applies, and runs no test file` (one good pair and one broken `.mjs` pair)
- M22 `// req: R-1230 R-1239 R-1241` `mutation runner: SEAT_MUTATE_OUT names the record file, SEAT_MUTATE_TIP overrides the table's tip, and a log folder holds each red baseline run's output and each pair's output per test file named by its id with / turned into -, then --, then the file's name` (the baseline case: a file red on its first attempt only, keyed by a mark file, so its one red attempt is logged with its FAIL line and its green retry is not)
- M23 `// req: R-1242` `mutation runner: a second run given the same record file is refused with exit 2, naming it, before it creates any worktree, the first run's record is whole and its lock gone when it ends, and a lock left by a process that no longer runs is reported and replaced` (the first run holds at a rendezvous until the check releases it after the second returns; the stale lock holds the pid of a child that has exited)
- M24 `// req: R-1243` `mutation runner: the record's header names the tip's commit and the pair table's hash, and a shard whose table or tip differs from the parent's refuses before creating its worktree, naming both values, so its pairs read MISSING and the run exits 2` (at two shards, a fixture table whose second pair, then whose tip, depends on `SEAT_MUTATE_SHARD`; no timing)
- M25 `// req: R-1235 R-1236` `mutation runner: an edit path that leaves the scratch worktree, by .. or through a symbolic link, is ANCHOR-MISS naming it, a test path that leaves it ends the shard with exit 2 naming it, and nothing outside the worktree is written or run` (the outside target and test file sit in the check's own temp folder; the symbolic link is a tracked link in the fixture repository)
- M26 `// req: R-1244` `mutation runner: a table config that names one overridable tunable changes only that one, and a config key outside the overridable tunables is refused with exit 2, naming it, before any worktree is created` (a key the module holds but does not list, such as `DRAIN_MS`, and a mistyped key)

Every row has a check: R-1230 M1 M2 M20 M22; R-1231 M3 M4 M20; R-1232 M5 M6 M20; R-1233 M7 M20; R-1234 M8 M9 M20; R-1235 M10 M11 M20 M25; R-1236 M12 M20 M25;
R-1237 M13 M14; R-1238 M15 M16 M20; R-1239 M17 M18 M20 M22; R-1240 M19 M20; R-1241 M20 M21 M22; R-1242 M23; R-1243 M20 M24; R-1244 M20 M26. R-1233's evidence
cell names its Windows clause as seen green on the Windows leg only and never red (pair 11). The file prints bare PASS lines (`ok ? "" : why`), and no title begins
with another title followed by a space, so the old-form runner of A1 reads every pair exactly (Ran `slim/recount.mjs`; seat revision 5 re-ran it over this file).

**5.2 Census of existing checks that change** (Read at `afd74de`; the build works from titles, since line numbers move).

| Check | Row | Change |
|---|---|---|
| `requirements-tree.test.mjs:40` …leaf counts total 1,178 | R-291 | red; the literal at `:40`, `:54` and `:55` becomes the base's total plus 15; no evidence cell cites this title |
| `requirements-tree.test.mjs:36` and `:38`, the committed outline | R-291 | red until `node scripts/requirements-tree.mjs --write` regenerates `docs/requirements-tree.md` |
| `requirements-trace.test.mjs:61` REQUIREMENTS.md and the markers the suite carries agree | — | red while a marker traces a `planned` row; green once the 15 rows flip, and only while build-brief rule 5 holds: the rail reads a `// req:` line inside a template-literal fixture as a real marker (`templates/typescript/template/tests/requirements-trace.ts:82`, `:344`; Ran `rev4/probe.sh`, MAP) |
| `requirements-trace.test.mjs:56` and `:149`, the EARS report and zero rows off form | G-013 to G-015 | green: one `shall` per row (Ran the rail's pattern over §2) |
| `requirements-trace.test.mjs:86` no nested test files outside fixture directories | — | green while fixture test files sit under the OS temp folder, never under `tests/<sub>/` |
| `code-map.test.mjs:39`, `npm run map:check` | G-004, G-009, G-010 | red until `npm run map` regenerates `docs/code-map.md` with the three new files |
| `code-map.test.mjs:39`, `npm run map:check`, fixture strings | G-004, G-009, G-010 | green only while build-brief rule 5 holds: the map reads a quoted relative specifier in a string, template literal or comment as an import (`templates/typescript/template/scripts/code-map.mjs:393-403`), one that resolves to no mapped module is a problem (`:545-548`), and `npm run map` does not clear it (Ran `rev4/probe.sh`, MAP: write and check both exit 1). Precedent: `test-runner.test.mjs:108` needed the ignore entry `packages/nana-pack/ts-probe.ts` |
| `readme-check.test.mjs:36` every README this repo ships holds its claims | G-012 | green only while the section spells the table path with placeholders and names no bare `seat-mutate.mjs` |
| `product-report.test.mjs` (it copies the real HANDOFF, `:32`) | R-1030 and others | green only while this lane's HANDOFF ask uses the tagged form of §4 |
| `apps/desk/test/knowledge-home-isolation.test.mjs:27`, `:43` | R-898 | green: it scans every `.mjs` under `docs/reviews/` for a `pi` spawn; no new corpus file spawns `pi` |
| `test-runner.test.mjs:438` the source check detects direct mkdtemp calls | R-917 | green only while the new test file holds no `mkdtempSync(` anywhere in its source and imports `tmpDir` with exactly `import { tmpDir } from "./tmp-dir.mjs";` (`:430-435`) |
| `agent-dir-parity.test.mjs:189` PI_CODING_AGENT_DIR is resolved only by agent-dir.mjs | R-190 | green only while no new file outside `tests/`, corpus tables included, has a line ending in the bare name or reads `process.env.PI_CODING_AGENT_DIR` (`:184`); the landed runner's lines pass it at `afd74de` (Ran `git grep`) |

Every other existing check is INFERRED green from the file list; the build's full suite shows it.

**Build-brief rules** (each from a check above; the brief states them, the reviewer checks them):
1. The test file makes temp folders only through `tmpDir` from `./tmp-dir.mjs`, and no text in it, fixture strings included, holds `mkdtempSync(` (R-917).
2. Code outside `tests/`, corpus tables included, names `PI_CODING_AGENT_DIR` only inside quotes, never at the end of a line, and never reads
   `process.env.PI_CODING_AGENT_DIR` (R-190).
3. The test file prints nothing after a PASS title, and no title begins with another title followed by a space.
4. Each fixture table runs with an environment built from scratch (§5 preamble); M5 reads the flag from `process.execArgv`; a fixture test that spawns the `.ts`
   module passes `--experimental-strip-types` itself.
5. Apart from the test file's own imports, no text in it, fixture strings and comments included, holds a quoted relative specifier in a form the map reads: after
   `from`, after a bare `import` at a line start, inside `import(…)`, or inside `import(new URL(…, import.meta.url))`. The test joins each fixture specifier in at
   run time. No line in it, other than a real marker, starts with `//` and then `req:` after its leading spaces (G-004, G-009, G-010 and the trace rail). This
   keeps `code-map.config.json` out of scope; an ignore entry is the other fix.

**5.3 Wrong code first.** Each pair edits `lib/mutation-runner.mjs` or `lib/mutation-runner-config.mjs`, never an assertion, and must red exactly the named checks. The
seat runs them with its old-form runner, never with the new one (S7). Pair 11 can red only on Windows, where no runner runs mutation pairs. 43 pairs; 34 and 35 came
with seat revision 4 (slim) and 36 to 43 with seat revision 5, each at the end, so no earlier number moves. No pair puts back seat revision 4's replace-whole config:
every check whose fixture table names one tunable would red with it, so it cannot red exactly one check; M26's merge half is pinned by its own assertion and by those checks.

| # | Wrong code | Reds |
|---|---|---|
| 1 | the scratch folder made beside the lane repository, not under the temp folder | M1 |
| 2 | no `git clean` between pairs | M1 |
| 3 | git calls without the hooks-off setting | M1 |
| 4 | the own-root check removed before the reset | M2 |
| 5 | cleanup skips `git worktree remove` | M3, M4 |
| 6 | a shard's signal handler kills no test tree | M4 |
| 7 | the test file started without `--experimental-strip-types` | M5 |
| 8 | ambient NANA_ variables kept | M5 |
| 9 | an npm that cannot start skipped with no line (the landed form) | M6 |
| 10 | the time limit marks the file timed out but kills nothing | M7 |
| 11 | no `taskkill` on win32; the POSIX group kill throws there and is caught (the landed form) | M7 (Windows only; no runner runs it) |
| 12 | no group kill after a normal exit | M8 |
| 13 | the result waits for the output to close, with no drain | M9 |
| 14 | an anchor counted with `includes`, not an exact count | M10 |
| 15 | a mutated `.ts` file checked with Node's own `--experimental-strip-types --check` (the landed form) | M11 |
| 16 | a mutated `.mjs` file not syntax-checked | M11, M21 |
| 17 | no baseline retry | M12 |
| 18 | the baseline title check removed | M12 |
| 19 | a pair with no failing title counted RED | M13 |
| 20 | a pattern title compared as a string | M13 |
| 21 | a declared also-red title listed as unnamed | M14 |
| 22 | a crashed file with no FAIL line counted GREEN | M14 |
| 23 | the parent waits for each shard before starting the next | M4, M15 |
| 24 | the stagger ignored | M15 |
| 25 | the shard count not held to the selected pair count | M16 |
| 26 | the merged record in shard order, not table order | M17 |
| 27 | RESULT sums only the first shard's tally | M17 |
| 28 | a pair no shard printed dropped with no MISSING line | M18 |
| 29 | unknown pair ids filtered out without a word (the copies' silent filter) | M19 |
| 30 | a repeated table id accepted (the landed form) | M19 |
| 31 | a config value's provenance comment removed | M20 |
| 32 | the dry option still runs test files | M21 |
| 33 | SEAT_MUTATE_TIP ignored | M22 |
| 34 | an edit file read with no guard, so a missing one throws and ends its shard (the landed form) | M10 |
| 35 | one shard runs in the parent's own process and appends the record line by line (the landed form) | M18 |
| 36 | no lock: a second run given the same record file runs beside the first (the landed form) | M23 |
| 37 | a shard skips the table-hash comparison (the landed form) | M24 |
| 38 | a shard skips the tip-commit comparison (the landed form) | M24 |
| 39 | the parent does no cleanup after a shard ends, so a dead shard's test tree and worktree stay (the landed form) | M3 |
| 40 | an edit path joined to the worktree with no containment check (the landed form) | M25 |
| 41 | a test path joined to the worktree with no containment check (the landed form) | M25 |
| 42 | a red baseline run's output not written to the log folder | M22 |
| 43 | a config key outside the overridable tunables accepted | M26 |

Recount: scratch and cleanup 1-6 and 39 (7); one test file's run 7-13 (7); edits and syntax 14-16, 34 and 40 (5); baseline 17-18 and 41 (3); judging 19-22 (4); split
and record 23-28, 35, 37 and 38 (9); refusals 29-30 (2); config and options 31-33, 42 and 43 (5); the record lock 36 (1); 7 + 7 + 5 + 3 + 4 + 9 + 2 + 5 + 1 = 43,
numbered 1 to 43 with no gap; 42 run on macOS. Every check has at least one pair the seat runs on macOS (Ran `slim/recount.mjs` over this file). Pairs 9, 11, 15, 30, 34
to 41 put back the landed runner's own form, so each shows a gap the promotion closes.

**5.4 Seat acceptance** (seen failing at the base where it can fail).
1. **Pairs.** The seat copies the landed runner as this lane's `seat-mutate.mjs` with three edits: it finds its repository from its own path instead of `:41`, it names
   this lane and branch, and its header names the copy it came from. Its `.ts` check gap does not matter here: every pair edits a `.mjs` module. It runs the 42 macOS pairs
   at its default five shards; each must red exactly its named checks.
2. **Equivalence.** The builder ports the landed table to `seat-mutate-port.mjs` as a Done check of build brief 1, and the seat runs it again at its verification:
   its constants, titles, DECLARED lines and 71 pairs, unchanged, plus one call that passes no `config`. Each runs the port in this lane's worktree with `SEAT_MUTATE_TIP=f5c2d3c`, at `SEAT_MUTATE_SHARDS=1` and at the default, both now through shard processes and the merge. Each run must print, per pair in table order, the same
   verdict word and named-title count as the committed record `docs/reviews/roster-notice-2026-10-16/seat-mutate-output-f5c2d3c.txt`, and the same RESULT counts: 71/71
   red, 55 exactly their named titles, 4 with a named title green, 15 with an unnamed red, 0 survived (Ran `git show`). Any pair that differs is named with its titles and
   traced to a row of §3.3 or reported as a bug. Both wall times go in the corpus; INFERRED: about 6 minutes at one shard and 2 to 3 at five, from the `59db91d` run's 60 s
   of baseline and 302 s of shard time (draft 3 §3.2).
3. **Refusals.** The port with a mistyped id, and again with one id repeated in the table, exits 2 and leaves `git worktree list` unchanged. At the base, the landed
   runner refuses the mistyped id, but at five shards it runs the repeated one and prints one pair's line twice (Read `:547`, `:561`).
4. `npm run test:locked`, `npm run map:check`, `npm run readme:check`, the tree check and the trace rail on the lane tip. Windows: the PR's Windows leg runs the new file
   (non-blocking), including M7's `taskkill` path and M9's drain.

**The claim most likely wrong:** that five shards dealt round-robin is a good default for every lane. It rests on runs on one 10-core machine, none compared with another
shard count beside it, and the one timed built-in run left its first shard idle 80 s of 135 (draft 3 §1). A machine with fewer cores, or a table whose files spawn many
children, may want fewer shards; that is one config value with provenance, so a re-measure changes no code. Next most likely: that moving the stray kill from `close` to
`exit` plus the drain changes no verdict. A helper that still writes a test's output more than 2 s after the test exits would now lose that output, and one in the
test's process group would be killed. A2 checks one table only (INFERRED for the rest).

## 6. Later lanes

Each draft-3 part this lane leaves out, one line each, planned when the queue reaches it. HANDOFF gets one queue line that points here, not one line per item.
- Stay-green pairs: `expectGreen` with `GREEN … stays green (expected)` and `RED … UNEXPECTED` (draft 3 R-1252).
- Expected case labels read through a table label reader, with a refusal when a table gives none (draft 3 R-1253 and R-1262's label clause).
- Skip reasons, and a selection of only skipped pairs that makes no worktree (draft 3 R-1254, R-1258).
- Longest-candidate title reading, with baseline PASS lines as candidates (draft 3 R-1250 and its residuals 16 and 17).
- A port of the regroup-shares table as a second equivalence run, once labels and skips exist (draft 3 acceptance 2).
- Script and pattern edits (`runEdit`, `regexEdit`) (draft 3 R-1244's script clauses).
- Helper children started with stdin closed and stopped at a helper time limit (draft 3 R-1243).
- ERROR and NOT RUN lines for a throw inside a shard (draft 3 R-1260, R-1261).
- One process with a shared queue in place of round-robin shard processes, writing the record in table order as pairs finish (draft 3 B1, R-1256, R-1259), only after a
  measured run shows the idle time matters.
- A baseline of N unmutated copies at once above one shard, with no retry there and a hint to re-run at one shard (draft 3 R-1247, R-1248).
- A core-based shard default and cap, `CORES_PER_PART`, and a `--parts` flag (draft 3 R-1257), after a re-measure on a second machine.
- A runner hash and `config injected` in the header, and `none` for a branch or merge base that does not resolve (draft 3 R-1265).
- A failed-removal line after RESULT, and RESULT before cleanup (draft 3 R-1234).
- Windows hardening: npm started through `findOnPath` and `winCommand`, `rmSync` retries for locks, signal handling that reaches shard processes, and the path-length note.
- A refusal of pair ids holding a character Windows forbids in a file name (draft 3 R-1262's name clause).
- A kill grace after a timeout kill, as the suite's `KILL_GRACE_MS`.
- `lib/test-child.mjs` shared with the suite runner, ending residual 1 (draft 3 §3.1, R-1264, M33).
- A machine-wide slot for split runs (draft 3 residual 3).
- `test-jobs-prep`: the suite's parallel preconditions (the desk test's port, a parked owner call since the desk is frozen; five wall-clock bounds; `--poll 1`).
- `test-jobs`: the suite on `lib/test-child.mjs`, files N at a time, longest first from the runtime map (a gate lane, two plan rounds).
- Picking a pair's test files from the runtime map.

## 7. Decisions, residuals and the owner's calls

Each residual and the optional ask becomes one HANDOFF line at the land; the seat decisions stay in this file.

**Decided by the owner (2026-10-16).** Parallel work is the seat's default, through the seat-rule lane. A shared split mutation runner is its own lane, after the seat
rule and before the runtime map; feature-oriented development follows them.

**The queue.** 1. The seat-rule lane (landing). 2. This lane. 3. The runtime-map lane. 4. The rest of HANDOFF's queue in its order.

**The owner's calls.** None blocks this lane.
- [optional, since 2026-10-17] Windows red run. What we tested: M7's `taskkill` path and M9's drain pass on the Windows CI leg, which runs no mutation pairs. The result:
  pair 11 has never run, so R-1233's Windows clause has never been seen red. The trade: one run of one pair on the owner's Windows machine, against one clause whose
  evidence names the gap. Recommend no run now. It is the owner's call because only the owner's machine runs native Windows.

**Seat decisions (declared, not asked).**
- S1 IDs R-1230 to R-1244; R-1245 to R-1269 stay free for the later lanes of §6. No draft-3 ID reached the ledger, so the range is reused from its start.
- S2 Promote the landed design (shard processes, round-robin, stagger, merged record), not draft 3's one-process queue.
- S3 Home `packages/nana-pack/lib/`; no bin, PATH link or `package.json` entry.
- S4 FEAT-031, no new subgroup: once a feature is subdivided, every row it holds is homed under a subgroup, so a subgroup here would move FEAT-031's other rows too.
- S5 Default five shards, the landed value, from config; `SEAT_MUTATE_SHARDS=1` gives a serial run.
- S6 Old runners and records stay as they are; in-flight lanes keep their own copies to the end.
- S7 The seat judges this lane's pairs with an old-form copy of the landed runner, because the new runner would judge its own code.
- S8 Judging stays the landed judging: the prefix rule, pattern titles and `alsoRed`; every other judging feature is a later lane.
- S9 Class: neither gate nor format. Small: fifteen rows, two new modules and one test file, no existing code changed, most of the code moved from a runner with three
  committed records, and A2 checks the move against one of them. So one plan-review round (`AGENTS.md`, working pattern); after it, only a named fail-open bug reopens
  the plan.
- S10 No seat-guide edit: the seat-rule lane's guide keeps "re-run the lane's mutation runner", names "a long mutation run in parts" as parallel work, and forbids a split
  beside a full suite (Read `feat/seat-rule`'s `nana-seat.md`).
- S11 The landed names stay: `SEAT_MUTATE_SHARDS`, `SEAT_MUTATE_STAGGER_SECS` and the word "shard"; the guide's "parts" means the same thing.
- S12 `.ts` files are checked by the repository's own checker, started from the table's checkout.
- S13 After a test file exits: wait for its output up to the drain, then kill its group on POSIX.
- S14 Part and tally files live in a temp folder and go after the merge unless keep is set.
- S15 A table passes in `config` only the overridable tunables it changes, merged over the config module, and any other key is refused by name (R-1244; plan review
  SHOULD 4, seat revision 5); the checks use it for short limits and a missing npm.
- S16 One shard runs as a shard process too, so the parent never judges a pair and always merges (fact-check M3, critique MUST-2). The parent owns the record file
  through a lock (S19).
- S17 An edit file that does not exist or cannot be read is ANCHOR-MISS naming the file, not a throw (critique MUST-1).
- S18 Fixture sources hold no specifier the map reads and no marker line (build-brief rule 5), so `code-map.config.json` stays out of scope (fact-check M1).
- S19 The parent takes an exclusive lock beside the record before any worktree; a live holder refuses a second run, and a dead holder's lock is reported and
  replaced, with no wait (R-1242; plan review MUST 1).
- S20 A shard whose own tip commit or table hash differs from the parent's refuses rather than adopting the parent's values, so a mixed run fails closed (R-1243;
  plan review MUST 2).
- S21 The parent makes each shard's scratch folder and cleans what a dead shard left, its test tree first, through a pid file the shard keeps there (R-1231; plan
  review SHOULD 1). The pid file is the decision's one addition: without it R-1231's "no test file left running" fails for a shard killed mid-test.
- S22 Path containment folds into the two refusals that already exist, ANCHOR-MISS for an edit and the baseline refusal for a test file, so no new line word and no
  new row (R-1235, R-1236; plan review SHOULD 2). R-1241's baseline-log clause is pinned in M22 rather than dropped (plan review SHOULD 3).

**Carries.**
1. To the runtime-map plan: this lane now uses R-1230 to R-1244 only, and its citations into draft 3 have moved to `CHANGE-draft3.md`.

**Residuals.**
1. Until the parallel suite lane, the suite runner and this module each hold the child environment, the tree kill and the drain, and `DRAIN_MS` is defined twice: a
   declared violation.
2. A named title that begins a longer failing title reads that line as the named title, as in every copy; the table names the longer title, and the README says so.
3. The round-robin deal can leave a shard idle while another works (80 s of 135 in the one timed run).
4. Windows: no mutation pair runs there. On a stop the parent's kill ends each shard outright there, past its handler, so only the parent's dead-shard cleanup (R-1231) clears its
   test tree and worktree, and no Windows run has shown it does (INFERRED). npm's values are not read (one line says so); a child left running after its test file exits
   is out of reach; a removal can fail on an antivirus lock; a temp path over about 65 characters can push a file past 260 (INFERRED).
5. A parent killed outright (SIGKILL on POSIX, a task stop on Windows) cleans nothing and writes no record. Its shards run on and remove their own worktrees when they
   end (INFERRED), and its lock stays until the next run on that record file reports and replaces it. A shard killed outright is no longer a residual: the parent
   cleans it (S21).
6. A throw inside a shard (a failed worktree add or reset) ends that shard with Node's error exit. Its pairs, healthy ones included, read `MISSING` above one RESULT
   line, and the run exits 2, at every shard count. It fails closed, and the parent removes what the shard left (S21). A missing edit file no longer throws (R-1235).
7. A table imports the runner from its own checkout, so a lane that edits the runner judges its pairs with an old-form copy, as S7 does here. The table hash covers the
   pairs and config, not the runner module, so a runner edited while shards start goes unseen; the runner hash is a later lane (§6).
8. A descendant that leaves its process group (a detached or setsid child) escapes the group kill, in both runners.
9. A git call has no time limit; a hung git hangs its shard.
10. The five-shard default rests on runs on one machine (§5.4).
11. Closed in seat revision 5 by R-1242's lock; it gets no HANDOFF line.
12. Lock limits: a stale lock whose pid another process now holds reads as live, and the refusal names the lock file, the pid and the start time for a removal by hand;
    two runs that find one stale lock in the same instant can both replace it and both run (INFERRED; the window is one removal and one create).
13. A table's `config` value is not checked for type or range; a wrong one can make the run misbehave rather than refuse (INFERRED).

**INFERRED.** That the landed timeout kill does nothing on Windows and hangs the shard; that the landed own-root check misreads an 8.3 short path; that npm's values are
skipped on Windows; that nothing bounds a pipe holder on Windows in the landed runner; the suite time the new file adds; A2's run times; that moving the stray kill to
`exit` changes no verdict outside A2's table; that the README section passes the README check; that no other existing check changes; that the parent's dead-shard
cleanup clears a Windows shard stopped outright; that shards orphaned by a parent killed outright clean up after themselves.

## Seat revision 4 (2026-10-17): the slim rewrite

The owner's ask: a slim first lane, by subtraction. Draft 3 (40 rows, 49 checks, 98 pairs, two plan rounds) is saved as `CHANGE-draft3.md`.
1. The lane now promotes the landed runner's plumbing, which landed after draft 3 was written and has three committed five-shard records. Draft 3's own design (one
   process, a shared queue, the copy baseline) moves to §6.
2. Kept from draft 3, folded into fewer rows: scratch worktrees with the own-root check and hooks off (draft 3 R-1230 to R-1232 → R-1230); cleanup, keep and signals
   (R-1233, R-1242 → R-1231); the test file's run (R-1235 to R-1239 → R-1232); the time-limit kill with `taskkill` (R-1240 → R-1233); the drain and the stray kill (R-1241,
   R-1269 → R-1234); ANCHOR-MISS and SYNTAX with the `.ts` checker (R-1244, R-1245 → R-1235); the baseline (R-1246, R-1248, R-1249 → R-1236); the judging (R-1251 →
   R-1237); the split (R-1256, R-1257 → R-1238, now shard processes); the record (R-1255, R-1259, R-1265 → R-1239); refusals (R-1262 → R-1240); dry and log names
   (R-1266, R-1267 → R-1241). The option names, draft 3's R-1268, now sit in the row that uses each one.
3. Cut to §6 whole: draft 3 R-1234, R-1243, R-1247, R-1250, R-1252 to R-1254, R-1258, R-1260, R-1261, R-1263 and R-1264 (12 rows). Cut in part: R-1244's script
   edits, R-1248's re-run hint, R-1255's ERROR, skipped and stay-green counts, R-1257's core-based default and `--parts`, R-1259's write-as-you-go, R-1262's
   forbidden-character and label clauses, and R-1265's hash, `config injected` and `none`. 28 kept + 12 cut = 40.
4. New against draft 3: the stagger (kept from the landed runner, which draft 3 cut), the repeated, blank and space-holding id refusal, the npm line in place of
   `winCommand`, and the equivalence run on the landed table in place of the regroup-shares port.
5. Probes for this draft, in `slim/`: `ts/` (Node's `--check` exits 0 on a broken `.ts` file and the repository's checker exits 1; a `.ts` import works with no flag
   on Node 22.22.2); `probe-ts-pairs.mjs` (the landed table's six `.ts` pairs pass the checker at `f5c2d3c`); `recount.mjs` (this file's counts).
6. Recount (Ran `node slim/recount.mjs`): 12 rows added (R-1230 to R-1241), none reworded, one `shall` each; 22 new titles (M1 to M22), every row named by one and the
   coverage list equal to the markers; 33 pairs numbered 1 to 33 with no gap, 32 on macOS, every check with a macOS pair; no title begins with another followed by a
   space; the tree total is the base plus 12; owner calls: none blocking, one optional.

## Seat revision 4 (slim), 2026-10-17: the fact-check and critique MUSTs

Sources: `factcheck-slim.md` M1 to M3 and `design-critique-slim.md` MUST-1 and MUST-2. The seat re-checked each one at `afd74de` before applying it (Ran
`rev4/probe.sh` over `rev4/src`, a `git archive` of `afd74de`; its outputs are in `rev4/p/`). All five are taken; none is declined.
1. M1, taken. Ran: a test file holding a fixture import string makes the map's write and check both exit 1, naming the unresolved specifier. Ran: a
   `// req: R-1230` line inside a template literal scans as a real marker. Added build-brief rule 5 and a census row, and extended the trace census row.
   Rule 5 names the four forms the map reads (`code-map.mjs:393-397`). A bare `new URL("./…", import.meta.url)` outside `import(…)` is not read, so the
   rule does not forbid it; that is the one place it is narrower than the finding. The ignore-entry fix is not taken, so `code-map.config.json` stays out of scope (S18).
2. M2, taken. Read `:415`: the baseline runs only when the run is not dry. R-1236 now opens "WHEN a shard starts a run that is not dry".
3. M3, taken through its simpler fix, which is MUST-2's fix too. Ran (RB1): at one shard with a red baseline, the landed runner exits 2 with no pair line and
   no `MISSING` line. Shards now start as child processes at every count (§3.2 steps 3 and 7, §3.3, §3.9, S16). R-1239's text then holds at one shard as
   written, and R-1238 already said "N shard processes", so neither row changes.
4. MUST-1, taken. Ran (A1, A2): a missing edit file throws at `:375`. At one shard the run exits 1 after pair 1, with no RESULT and no `MISSING` line; at two
   shards a healthy pair in that shard reads `MISSING`. R-1235 now names an edit file that does not exist or cannot be read, reported as ANCHOR-MISS naming
   the file. The clause holds for any `times` value, so an edit with `times: 0` cannot create a file. M10's title gains the case; pair 34 puts back the
   landed read and reds M10 (S17).
5. MUST-2, taken. Ran (B): two one-shard runs started 0.5 s apart with one record file both exit 0, and the record holds one header, six pair lines for
   three pairs and two RESULT lines. The one-shard path now ends in the merge; M18 runs at one shard and at two; pair 35 puts back the in-process path and
   reds M18. The critique's optional lock on the record file is not taken: residual 11 says what two runs at once now do. Residual 6 loses its one-shard
   sentence, and residual 4 notes that the Windows stop gap now holds at every shard count. The threat model gains a mistyped edit path and a second run
   with the same record file.
6. Recount (Ran `node slim/recount.mjs`): 12 rows added (R-1230 to R-1241), none on main reworded, one `shall` each; R-1235 and R-1236 reworded inside this
   plan. 22 titles (M10 and M18 retitled), every row named by one, and the coverage list equal to the markers. 35 pairs numbered 1 to 35 with no gap, 34 on
   macOS, every check with a macOS pair. No title begins with another followed by a space. 12 census rows, 5 build-brief rules, 11 residuals, seat
   decisions S1 to S18. Owner calls unchanged: none blocking, one optional.

## Seat revision 5 (2026-10-17): sol plan r1

Source: the plan review `sol-plan-r1.md` (SEND-BACK: MUST 1 and 2, SHOULD 1 to 4). The seat took all six and kept the lane slim: three rows added (R-1242 to
R-1244), three reworded inside this plan (R-1231, R-1235, R-1236), each with one `shall`, all inside R-1230 to R-1269. The base is now main `61c5748`, the seat-rule
lane landed; its R-291 leaf total is still 1,178 (Ran), so the tree literal becomes 1,193. This was the lane's one plan-review round (S9).
1. MUST 1, exclusive ownership of the record, taken. New R-1242: the parent creates `<record>.lock` with the `wx` flag, holding its pid and start time, before any
   worktree; a live holder refuses a second run with exit 2 naming the record file; a holder whose pid no longer runs is reported and replaced; the parent removes
   its own lock when the run ends (§3.2 step 2, §3.3, §3.5 `LOCK_SUFFIX`, S19). New M23 and pair 36. Residual 11 closes; residual 12 names the lock's two limits
   (a reused pid, and two runs that find one stale lock at once). §1 gains the finding.
2. MUST 2, one tip and one table per run, taken. New R-1243 rather than a reworded R-1240, because the refusal happens in a shard, not before the parent's first
   worktree: the parent resolves the tip commit and hashes the pairs and config once (`TABLE_HASH`), passes both to every shard (`SEAT_MUTATE_TIP_COMMIT`,
   `SEAT_MUTATE_TABLE_HASH`), and names both in the header; a shard whose own differ refuses before its worktree with exit 2, naming both, so its pairs read
   `MISSING` (§3.2 steps 2, 3 and 5, §3.3, S20). New M24, pairs 37 and 38; M20's marker gains R-1243 for the two shard-only names. Residual 7 notes that the runner
   module itself is not hashed.
3. SHOULD 1, a dead shard's leftovers, taken. R-1231 reworded: removal covers "those of a shard that died". The parent makes each shard's scratch folder
   (`SEAT_MUTATE_SCRATCH`) and, after a shard ends with the folder still there, kills the test tree the shard's pid file names and removes the worktree and folder,
   unless keep is set (§3.2 steps 3, 5 and 7, §3.3, S21). The pid file is the one addition beyond the decision: without it R-1231's "no test file left running"
   fails for a shard killed mid-test. M3 retitled (a shard killed outright), pair 39. Residual 4 shrinks to the Windows stop, which rests on this cleanup and is
   unrun; residual 5 becomes a parent killed outright; residual 6 gains the cleanup.
4. SHOULD 2, path containment, taken by folding it into the two refusals that already exist (S22): R-1235 reworded (an edit file that resolves outside the scratch
   worktree, symbolic links followed, is ANCHOR-MISS, nothing written outside), R-1236 reworded (a test file that resolves outside is never run and the shard
   refuses with exit 2). New M25 with req R-1235 and R-1236, pairs 40 and 41; its symbolic-link case runs on POSIX only (§3.6).
5. SHOULD 3, R-1241's baseline-log clause, taken by pinning it: M22 retitled to name each red baseline run's output, with a red-once fixture; pair 42.
6. SHOULD 4, the config, taken. New R-1244: a table's `config` merges over the config module, names only keys in `OVERRIDABLE` (`SHARDS_DEFAULT`,
   `STAGGER_SECS_DEFAULT`, `FILE_TIMEOUT_MS`, `BASELINE_RETRIES`, `NPM_COMMAND`), and any other key is refused before any worktree with exit 2, naming it (§3.2 step 1,
   §3.3, §3.4, §3.5, S15). New M26 and pair 43; M20 retitled to seal the allowlist, its marker gaining R-1244. No pair puts back the replace-whole config, because it
   would red every check whose fixture names one tunable (§5.3). §6 drops its named-config-row line, which R-1244 now is. Residual 13: values are not type-checked.
7. Also: the header names the builder as the seat's larger-lane builder (`build-brief-1.md`); §5.4 item 2 has the builder write and run the port as a Done check,
   and the seat runs it again; the threat model gains the cases above; §3.7's README limits follow the new cleanup and lock; the INFERRED list gains the Windows
   cleanup and orphaned shards.
8. Recount (Ran `node recount.mjs` over this file, the slim recount reading a path): 15 rows added (R-1230 to R-1244), none on main reworded, one `shall` each;
   26 titles (M1 to M26; M3, M20 and M22 retitled), every row named by one and the coverage list equal to the markers; 43 pairs numbered 1 to 43 with no gap, 42 on
   macOS, every check with a macOS pair; no title begins with another followed by a space. 12 census rows, 5 build-brief rules, 13 residuals (11 closed), seat
   decisions S1 to S22. Owner calls unchanged: none blocking, one optional.
