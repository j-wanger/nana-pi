# Fact-check: parallel-seat/CHANGE.md (lane `mutate-runner`) against main 2dbc817

Checked: every file:line, row ID, count, title, command, flag and API claim in `CHANGE.md`, plus the
`research.md` facts it leans on. Citation forms: "Read at 2dbc817" (a scratch copy made with
`git archive 2dbc817`), "Ran: <command>" (run on the seat machine: macOS, 10 cores, Node v22.22.2,
git 2.50.1), INFERRED (neither). Nothing outside this folder and the scratch copy was written.

Verdict counts: 15 WRONG (3 of them minor wording: W13 to W15), 4 census misses or conflicts, 7 UNVERIFIABLE,
everything else VERIFIED.

## 1. WRONG

| # | Where in CHANGE.md | Claim | Right fact and evidence |
|---|---|---|---|
| W1 | §2 (line 59-60), §6 S1 | "The runtime-map plan drafted R-1220 to R-1233 and nothing from R-1240", so this plan takes R-1240 to R-1266 and reserves R-1240 to R-1279. | The research notes do hold only R-1220 to R-1233. The runtime-map **plan** (`../runtime-map/CHANGE.md`, written one minute after this file) drafts 19 rows, R-1220 to R-1238 (its lines 43 and 73). Its seat decision S1 (lines 362-364) says that if the mutation runner is queued first, the runtime-map plan moves to **R-1240 to R-1258**. This plan's D2 recommends exactly that order. If both plans follow their own defaults, both claim R-1240 to R-1258. Ran: `grep -ohE 'R-12[0-9]{2}'` over both runtime-map files. |
| W2 | §4 Overlap | "The runtime-map plan edits `scripts/test.mjs` and FEAT-029; this lane touches neither." | The runtime-map plan also adds three rows to **FEAT-031** (R-1220 to R-1222) and changes R-618's evidence cell in FEAT-031 (its lines 4-5 and 52-54). Both lanes edit FEAT-031's table. Read. |
| W3 | §4 Overlap; §2 | "`feat/regroup` rewrites `REQUIREMENTS.md` and the tree"; "the regroup moves lines". | At c514964, `feat/regroup` adds 13 lines to `REQUIREMENTS.md` (13 new rows, nothing moved) and changes 3 lines of `docs/requirements-tree.md`. Ran: `git diff --numstat 2dbc817...feat/regroup -- REQUIREMENTS.md docs/requirements-tree.md` gave `13 0` and `3 3`. Placing rows by feature ID is still sound. The word "rewrites" is wrong. |
| W4 | §1 "Nine copies drift" | "Each says it was copied from the one before (`:5`)." | Only four of the nine copies on main have a "Form copied from" line: tree `:4`, seat-guide `:3`, lift `:5` and regroup-shares `:5`. cc-hooks-windows, fresh-install, install-check, process and roster have none. The in-flight regroup copy says it was copied from **lift** (`regroup-runner.mjs:4`), not from regroup-shares. Ran: `grep -n -i 'copied from'` on each copy. |
| W5 | §1; §3.9 row 1 | "Their plumbing is 195 to 224 lines a copy." | Each copy has a `── plumbing` marker. Counting from it, the nine copies on main run from **161 to 238** lines: cc-hooks-windows 161, process 166, fresh-install 175, roster 195, tree 201, lift 213, seat-guide 223, regroup-shares 224, install-check 238. The branch regroup copy has 208. The 195-224 range fits only roster, tree, lift, seat-guide, regroup-shares and the branch copy. The drift figures 22, 59, 70, 110 and 138 do reproduce for roster→seat-guide→tree→lift→regroup-shares→regroup. install-check differs from the older copies by 331 to 367 lines. Ran: `tail -n +<marker>` per copy, then `diff \| grep -c '^[<>]'`. |
| W6 | §3.2 step 3 | "Git took 40 concurrent adds in a throwaway repository (`research.md` §1.4, Ran)." | The research notes say 40 adds were made **eight at a time**, then 40 removes ran at once (`research.md:117-119`). |
| W7 | §3.9 (row "Scratch commits, …"); residual 4 | "one lane each"; "one lane each so far: seat-guide, install-check, cc-hooks-windows and roster". | Scratch commits appear in seat-guide **and** install-check (`install-check-2026-10-12/seat-mutate.mjs:15-17`, `:503`). Acceptance scripts appear in install-check **and fresh-install** (`fresh-install-2026-10-13/seat-mutate.mjs:36`, `:233-239`, with its own 45-minute limit at `:26`). Windows-only title lists appear in cc-hooks-windows **and** roster. So each is two lanes, and fresh-install is missing from the list. "Transform edits" is UNVERIFIABLE: no copy on main and not the regroup copy has an edit kind by that name. Read. |
| W8 | §3.5 `NPM_KEYS`; R-1244 | "the three values `npm run` exports that the copies supply (`:182-186`)". | The copies also set `npm_config_global_prefix` from the prefix (`:188`), so each child gets four npm values. R-1244, C3 and C4 leave out the fourth without saying so. Read. |
| W9 | §5.2 census, readme-check row | The Row column is "—". | The check carries `// req: G-012` (`packages/nana-pack/tests/readme-check.test.mjs:35-36`). Read. |
| W10 | §6 D2 | "Today's queue puts the 2026-10-16 feedback items next … then the parallel test runner (`HANDOFF.md:84-85`)." | The queue reads: the regroup now (`HANDOFF.md:82`), then feature-oriented development (`:83`), then the 10-16 items (`:84`), then the parallel runner (`:85`). The plan leaves out feature-oriented development, which comes before the 10-16 items. Read. |
| W11 | §3.8 | "Nothing the lane writes adds a provider, host name, absolute home path or owner name." | §4 and §5.4 step 1 put an old-form runner in the corpus, copied from regroup-shares. All nine copies on main hard-code `LANE_REPO` as an absolute path under the user's home folder (for example `regroup-shares…/seat-mutate.mjs:37`). As planned, the corpus copy adds one unless the seat replaces it with a placeholder or a relative lookup. Ran: `grep -n '^const LANE_REPO'`. |
| W12 | §6 S4 | "the tree counts rows only at leaf headings (`requirements-tree.test.mjs:51`), so a subgroup would force its 37 rows into subgroups too". | The checker does not force it. Ran a probe: `checkTree` reports 0 problems for a feature with its own rows beside a subgroup. The rule is prose, at `REQUIREMENTS.md:23-24`: a row is homed "under one subgroup when its feature is subdivided". Line `:51` only sums leaf headings. The conclusion holds, but `REQUIREMENTS.md:23-24` is the right source. |
| W13 | §2 (line 95) | "The suite runner's 37 rows in FEAT-031". | FEAT-031 does hold 37 rows (Ran: on main, `feat/regroup` and `feat/roster-notice`). Not all of them belong to the suite runner. R-898 and R-899 cover the real-pi harness and the acceptance driver, R-544 the bench, R-601 the pi locator, R-948 and R-949 the desk fixtures, and R-626 and R-627 the locked command. Minor wording. |
| W14 | §1 "Windows gaps in every copy" | Lists the bare `spawnSync("npm", …)` among the gaps in every copy. | Only five of the nine copies read npm (fresh-install, lift, tree, regroup-shares, seat-guide). fresh-install reads `prefix` only, with `cwd: os.tmpdir()` (`:284`). cc-hooks-windows, install-check, process and roster read no npm value. The POSIX-only kill and the silent id drop are in all nine (verified). Minor wording. |
| W15 | §6 D3 | "the desk's origin-rule test off its **fixed** port 4391". | The port is a default that an environment variable can override: `Number(process.env.DESK_TEST_PORT \|\| 4391)` (`apps/desk/test/origin-rule.test.mjs:17`). The suite runner passes non-NANA_ variables through unchanged, so every parallel child would still get the same value. The concern stands, but "fixed" is loose. Minor wording. |

## 2. Census misses and conflicts (§5.2)

| # | Check | Why the census misses it |
|---|---|---|
| C-a | `packages/nana-pack/tests/readme-check.test.mjs:36` (G-012) | §3.7 puts "the table shape and usage of §3.4" in the pack README. §3.4's usage line names `seat-mutate.mjs` in a code span. Ran a probe: `checkReadme` reads `seat-mutate.mjs` as a path claim and reports `'seat-mutate.mjs' does not exist`. If the usage line is copied as written, the check goes red, against the census's "green". §3.7's "names only paths that exist" contradicts its own instruction to include §3.4's usage line. |
| C-b | `packages/nana-pack/tests/product-report.test.mjs` (R-1012, R-1019 and others) | It copies the **real** `HANDOFF.md` into every fixture (`:31-35`) and parses its open-asks section with the parser in `lib/handoff-asks.mjs`. A malformed ask makes the report refuse (`:227-242`). §6 says each decision becomes one HANDOFF line. If D1 to D3 go in as asks without the `- **[blocking\|optional\|parked, since YYYY-MM-DD] Title.** body` form, this file's checks go red. Not in the census. |
| C-c | `apps/desk/test/knowledge-home-isolation.test.mjs:27` (R-898) | It reads every `.mjs` under `docs/reviews/`, so the new corpus files (`seat-titles.mjs`, the old-form runner, the ported table) are scanned. They stay green unless one spawns `pi` by name. Checked, no change needed. Listed because the census does not mention it. |
| C-d | `packages/nana-pack/tests/requirements-trace.test.mjs:86` | It requires no nested test files outside fixture folders. It stays green only while the fixture's test files are written to the OS temp folder, as §5 says. If a builder commits them under `tests/<sub>/`, the check goes red. |

Checked and not affected: `requirement-rows.test.mjs` (objective rows only); `templates-render.test.mjs:247` (G rows only); `land.test.mjs:497-505`, `review-ledger.test.mjs:1023` and `adoption-reader.test.mjs:106` (pattern-presence checks on the pack README); `review-standard.test.mjs:41-57` (copies a fixed list of lib files); `frontier.test.mjs` (does not read the real HANDOFF); `requirements-tree.test.mjs:28` (68 headings, unchanged because no heading is added); `nana-pack/package.json` (no `files` list). Read.

## 3. Recounts

- **Rows.** R-1240 to R-1266 is 27 rows. Each has exactly one `shall` under the rail's own regex (`requirements-trace.ts:148`) with code spans masked. Each opens with an EARS keyword (The / IF / WHEN / WHERE). No cell holds a pipe. Ran: node over CHANGE.md lines 67-93.
- **IDs.** Main's highest is R-1183. `feat/regroup` holds R-1170 to R-1180, R-1184 and R-1187. `feat/roster-notice` holds R-1190 to R-1215, with gaps at R-1193, R-1213 and R-1214. R-1220 to R-1279: 0 hits on main, both branches and the three lane worktrees. Ran: `git show <ref>:REQUIREMENTS.md`, `git grep -E 'R-12[2-7][0-9]\b'` and `grep -rIl`. The only clash is with the runtime-map plan (W1).
- **Checks.** C1 to C7 plus M1 to M31 make 38. Every row has at least one check, and the §5.1 coverage list matches the markers.
- **Pairs.** 68, numbered 1 to 68 with no gap. The group sums 13+9+7+11+11+7+4+6 = 68 are right. Pairs 9 and 11 run on the Windows leg only, which leaves 66 macOS pairs. All 38 checks have a pair; only C5 lacks a macOS pair. All verified.
- **Clause gap (not a fact error).** R-1260 says the drain and the kill grace are read by name from the config. M26 exercises neither, and no pair breaks either through the runner. C7 passes the drain as a `runTestFile` argument. So R-1260's drain and kill-grace clauses are unpinned. R-1260 can be flipped only for the five values M26 names.
- **Leaf total.** 1,139 on main (Ran: `node --experimental-strip-types tests/requirements-tree.test.mjs` in the scratch copy: 89 PASS, including the 1,139 title). It is 1,152 on `feat/regroup` and 1,165 on `feat/roster-notice` (Ran: `git show`). Both lanes change it first, as stated.

## 4. Verified (grouped)

**§1 Why.** Verified: `:320-343`, the one-at-a-time loop with `await runTest` at `:343`. Verified: `:281`, the silent filter, once in each of the nine copies (Ran: `grep -c`). Verified: 3,878 lines over nine copies (Ran: `wc -l`). Verified: `:231` and `:234`, the POSIX group kill, present in all nine; no copy uses `taskkill`. Verified: `:185`, the bare npm spawn. Verified: `:114` with `/dev/null` in the four newest copies (lift, regroup-shares, tree, seat-guide). Verified: `:310`, the red baseline written beside the table, in the same four copies. Verified: `scripts/test.mjs:76-83`, the kill on both platforms.

**Timings.** Recomputed from the records in the session scratchpad. Each run was timed from its header (UTC) to the file's last write (local, UTC-4):

- 104 pairs: 31.7 min.
- 148 pairs: 54.9 min.
- 195 pairs: 97.9 min.
- 209 pairs: 96.6 min.
- 217 pairs, split: 25.2 min.

Pairs per minute: 3.3, 2.7, 2.0, 2.2 and 8.6. The four serial runs total 281 minutes. The split was 3.9 times faster than the last serial run. Shards held 44, 44, 43, 43 and 43 ids and started 6 s apart (00:19:57 to 00:20:21 UTC). Each shard re-ran 5 or 6 baseline files. Ran: `head -1`, `stat` and `grep '^BASELINE'`.

**Unnamed reds.** 44 of 217 in the split (9+8+5+12+10) against 40 of 209 in the last serial run. The committed split record ends with a hand-written `RESULT (all shards)` line. Ran: `git show c514964:…-e5d71c6.txt` and `…-cd8991b.txt`.

**Threat model.** `docs/sessions/2026-10.md:25`, lesson 2, is the 8.3 short-name lesson. Verified.

**§2 Rules.**
- FEAT-031's title is "Run checks reliably and without contaminating work" (`REQUIREMENTS.md:1473`).
- R-291 sits in FEAT-028 (`:1333`).
- "leaf counts total" appears in no evidence cell (Ran: `grep`).
- The EARS rule counts `shall` with code spans masked (`requirements-trace.ts:273`, `:279-292`).
- The allowance is 0 (`scripts/requirements-trace.mjs:52`).
- A marker on a `planned` row is a rail problem (`requirements-trace.ts:17`, `:84`).
- Markers with two IDs are allowed (`requirements-trace.ts:293-310`; many in use).
- R-603, R-610, R-611, R-618, R-648 and R-912 say what the plan says they say.

**§3 Design.**
- `code-map.config.json` layers put apps and `scripts/` above packages, and `docs/reviews/` is not a root.
- `win-command.mjs` exports `findOnPath` (`:29`) and `winCommand` (`:50`). `.cmd` works through `DEFAULT_PATHEXT`. There are 41 transitive callers (Ran: `node scripts/code-map.mjs --impact packages/nana-pack/lib/win-command.mjs`).
- Judging: `regroup-runner.mjs:582-620`, `alsoRed` at `:585`, and the retry at `:549-551`. The saved file matches `c514964:docs/reviews/regroup-2026-10-15/seat-mutate.mjs` byte for byte (Ran: `diff -q`).
- Stay-green logic: `seat-guide…:346-356`. Case labels: `:357-367`. Label reader: `:247`. Skip: `:321-325`. Title match: `:242`. Crash rules: `:245`, `:347-349`.
- Every line word listed exists in a copy: `BASELINE RETRY` in the regroup copy; `stays green (expected)` and `UNEXPECTED` in seat-guide.
- Usage `:30`, keep note `:27`, the 10-minute limit in all nine copies (`:50`), exits `:318` and `:392`.
- `scripts/test.mjs:57` (5 min), `:58` (drain 2000), `:59` (kill grace 5000), `:77-83` and `:206-212`.
- The npm comment is at `seat-guide…:173-176`. The builder preamble rule is at `:22`. The writing checker section is at `packages/nana-pack/README.md:309`.
- The example anchor occurs once in `scripts/requirements-lift.mjs` at f6bb0bd and at 2dbc817 (`:846`). The T1 title and pair `1/4` match `regroup-shares…:78` and `:126`.
- 29 MB per lane worktree (Ran: `du -sh`, 29M and 28M).
- `os.availableParallelism()` returns 10 (Ran).

**The reset probe.** Re-ran `probe-reset/probe.mjs` in a scratch folder: 0 git errors, 0 dirty worktrees, 1 worktree entry left, 1.6 s (the plan says 1.7 s).

**API facts** (Node documentation): `os.loadavg()` returns `[0, 0, 0]` on Windows; `fs.realpathSync.native` exists; `os.availableParallelism()` exists in Node 18.14 and later; spawning a `.cmd` without a shell fails on Windows; `taskkill /T /F /PID` is the right Windows command. One caution: `fs.rmSync`'s `maxRetries` is ignored unless `recursive: true` is set, and §3.2 step 8 shows only `{ maxRetries }`.

**§5 and §6.**
- Census lines: `requirements-tree.test.mjs:36`, `:38`, `:40`, `:54`, `:55`; `requirements-trace.test.mjs:55-56` (G-014) and `:60-61`; `code-map.test.mjs:38-39` (G-004, G-009, G-010). `npm run map`, `map:check`, `readme:check` and `req:tree` exist in `package.json`.
- Equivalence record: `RESULT: 36/36 red (28 exactly…, 2 with a named title or case green, 6 with an unnamed red), 0 survived, 2 skipped` (Ran: `grep ^RESULT`). The lift baseline took 38.8 s.
- `nana-seat.md:11` is bullet 7. R-1140 is at `REQUIREMENTS.md:354`, R-1142 at `:893`. Also verified: `seat-rule.test.mjs:26-48`, `packages/nana-setup/README.md:40` and `working-under-nana-pi.md:32`.
- HANDOFF: `:79` is the trial (three blocking asks until 2026-10-20) and `:81` the two-lane cap. `:72` dates the desk freeze to 2026-10-10.
- Process plan: `CHANGE.md:153-156` covers the test-jobs split, port 4391 and the desk question.
- Wall-clock bounds: `hook.test.mjs:200`, `:339`; `test-locked.test.mjs:103`; `bounded-read.test.mjs:37`; `review-ledger.test.mjs:614`. `--poll 1` is at `review-ledger.test.mjs:82`.
- Test files: 144 now and 133 on 2026-10-10 (Ran: `ls … \| wc -l`).
- `roster-notice` is the fleet lane. It adds `lib/roster-notice*.mjs` and changes other pack README sections (Ran: `git diff --stat`).

## 5. UNVERIFIABLE

1. Load average 9.0 to 10.8 during the split was a reading at that moment; it cannot be re-read now.
2. "Transform edits" as a lane feature: no runner on main or on the regroup branch has one (W7).
3. Windows behaviour: the bare npm spawn failing silently, `/dev/null` meaning no hooks, and concurrent worktree work. Nothing was run on Windows.
4. That one process keeps the hand split's 8.6 pairs per minute (INFERRED in the plan).
5. Acceptance 2's run times (about 25 and 6 minutes). The arithmetic fits: 36 pairs × 38.8 s.
6. Acceptance 2's setup: the `feat/regroup-shares` branch and its worktree no longer exist. Ran: `git rev-parse --verify feat/regroup-shares` fails, and `git worktree list` shows no such entry. The port must name another checkout. The §3.4 example's `branch` would not resolve, and R-1259/R-1263 do not say what happens then. The conditional skip still holds at f6bb0bd, because `scripts/requirements-regroup.mjs` is absent there (Ran: `git cat-file -e`).
7. The plan-round count: "neither gate nor format, so one plan-review round". The rule gives one round to "a small lane" and two to a gate or format lane (`AGENTS.md:95`). It names no count for a large lane that is neither, and this lane uses the larger-lane builder with 38 checks.

## 6. Research-note errors that feed the plan

- `research.md:76-78`: "`alsoRed` … regroup (branch) … one". Pairs on main use `alsoRed` in seat-guide (5) and tree (5), and lift, roster, seat-guide and tree all handle it. Ran: `grep -c 'alsoRed: \['`.
- `research.md:81-82`: scratch commits "seat-guide … one" and acceptance "install-check … one". Each is two lanes (W7).
- `research.md:39-41`: the 195 to 224 range and the lineage chain (W4, W5).
- `research.md:31`: "probably given the same start ID (R-1220)". Now confirmed, plus the fallback clash (W1).
