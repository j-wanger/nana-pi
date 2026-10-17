# Fact-check r2 — runtime-map CHANGE.md (seat revision 2) against 2dbc817

Scope: every file:line, row ID, count, title, command and API claim in `CHANGE.md` (seat revision 2), against the repo at
`2dbc817`, the plan's own evidence (`r2/probe/`, `probe-*.json`, `research.md`) and the two sibling plans as they stood during
this check. Method: a scratch copy made with `git archive 2dbc817 | tar -x` (in `r2fc/src/`, Node v22.22.2); branch facts with
`git show` and `git grep` on refs only. No lane worktree was opened; nothing under the repo was edited; no full suite run.

Tags: "file:line at 2dbc817", "Ran: <command>", "Read: <file>", or INFERRED.

**Moved during this check (Ran: `git worktree list`, `git rev-parse`).** The regroup lane landed: `main` is now `c514964`
(fast-forward from `2dbc817`, 76 commits), `feat/regroup` and its worktree are gone, and the leaf total on main is 1,152.
`feat/roster-notice` moved to `ccd8f76`. R-1270 to R-1299 still has no hit on any of the 39 local and remote refs, nor on
`main`, `origin/feat/regroup` or `feat/roster-notice` at their new heads (Ran: `git grep -lE 'R-12(7[0-9]|8[0-9]|9[0-9])([^0-9]|$)'`
per ref, and `git show <ref>:REQUIREMENTS.md | grep -cE …`, 0 each). The regroup landing touched none of `scripts/test.mjs`,
`scripts/test-locked.mjs`, `scripts/code-map.mjs`, `package.json`, the configs or the census test files; it changed
`README.md` (+3/-1), `REQUIREMENTS.md` (+13), `HANDOFF.md`, `docs/code-map.md` (+25/-5) and `docs/requirements-tree.md`
(+3/-3) (Ran: `git diff --numstat 2dbc817 c514964`). FEAT-029 and FEAT-031 have no subgroups on the new main (Ran).

Totals: 2 MUST, 14 SHOULD, 3 census gaps (folded into SHOULD 5). Rows (27), titles (29), pairs (55) and every per-check pair
list recount correctly.

---

## A. MUST (wrong, and the plan changes)

| # | Where | Claim | Right fact | Evidence |
|---|---|---|---|---|
| MUST-1 | §2 "Taken elsewhere"; §6 S1; change log item 3 | The mutate-runner lane takes "rows from R-1240 (`../parallel-seat/CHANGE.md:5`)", and "that plan's draft 1 still reserves up to R-1279 (`:60`), which overlaps this range"; S1 makes narrowing it a seat check before either plan review | Stale when written. The sibling file was saved at 21:59, two minutes before this one, and already declares 39 rows R-1230 to R-1268 inside the seat's range R-1230 to R-1269, leaving R-1269 free (`:5`, `:68-71`, S1 at `:563`). No line in it reserves anything at or above R-1270. S1's carry is already met. §2's list should read "R-1230 to R-1269 (mutate-runner)", and S1 shrinks to "IDs R-1270 to R-1296 from the assigned range" with no cross-plan action | Read: `../parallel-seat/CHANGE.md:5`, `:67-71`, `:563`, `:659`; Ran: `stat` of both files (21:59:41 and 22:01:31) |
| MUST-2 | §5.1 M15; §5.3 pairs 33 and 34 | Pair 33 (no signal forwarded) and pair 34 (folder removed at once, before the suite exits) each red M15, whose title is "the coverage folder is gone after a complete run, an incomplete run, a forwarded stop and a stop whose wait ran out" | INFERRED from the title and the wrong code, not run. Pair 34: the folder is removed early and nothing writes into it afterwards (a SIGTERM'd runner writes no coverage, `scripts/test.mjs:108-114`), so it is still gone when the measure command exits, and M15 stays green. Pair 33: the fake suite never gets the signal, the injected wait runs out, the measure command removes the folder and exits, so M15 stays green; only M14 reds. M15 then pins only "is gone", not R-1289's ordering clause "once the suite has exited or … once the configured wait has passed", and by the repo's own clause rule R-1289 could not flip to `implemented` on M15. Fix one of two ways: (a) the M15 fake suite writes one file into the coverage folder after it receives the forwarded signal and before it exits, and the forwarded-stop case asserts the folder is gone and the suite exited before the measure command did; or (b) drop M15 from pairs 33 and 34 and add a check that pins the ordering clause. Either way, recount §5.3's per-check list for M15 | `CHANGE.md` §5.1 M15, §5.3 rows 33-34; the clause rule in `packages/nana-setup/claude/rules/nana-standards.md` ("a row is the weakest of its clauses"); `scripts/test.mjs:108-114` at 2dbc817 |

---

## B. SHOULD

1. **Stale sibling cites (not the design).** `../parallel-seat/CHANGE.md:154` (a pair's `tests` field) is now `:205`;
   `:465-466` and `:465` (the `test-jobs` lane) are now `:614-615`. "Its lane 4" is wrong: the sibling now plans two parallel
   suite lanes, `test-jobs-prep` and then `test-jobs` (`:610`, `:614`); item 4 in its queue is this runtime-map lane (`:548`).
   `../seat-rule/CHANGE.md:40-41` (the R-1220 to R-1229 reserve) moved to `:45-46` when that file was saved at 22:13. Cite
   sibling plans by section, not line, while they are still being revised. (Read: both files; Ran: `stat`.)
2. **Checks that call `measure` must pass their own `npm_execpath`.** M3 implies the refusal runs even with `start` injected.
   Under `npm test` the ambient env carries `npm_execpath`, but the shared mutation runner runs each file with plain node and
   supplies only npm's prefix, global config and user config (sibling R-1239, `../parallel-seat/CHANGE.md:87`), and the seat's
   shell has none. A check that relies on the ambient value is green in the suite and red at the mutation runner's baseline,
   which then judges no pair and exits 2 (sibling R-1248). §5 should say that M4 and M9 to M15 pass `env` holding a fake
   `npm_execpath` and that every fixture root is a git work tree. Precedent: `test-locked.test.mjs` sets a fake npm through
   `npm_execpath`. (Read; the failure is INFERRED.)
3. **Pair 35 costs ten minutes per run.** "Waits for the suite with no bound" makes M15's wait case hang until the shared
   runner's per-file limit, 600,000 ms (`../parallel-seat/CHANGE.md:229`). M15's wait case should race the measure command
   against its own short timer and print FAIL, so the pair reds in seconds. (Read; INFERRED.)
4. **Pair 28 may also red M10.** If M10's fake suite puts two coverage files in one folder, "reads only the first coverage
   file" changes M10's count, an unnamed red. Either give M10 one file per folder, or add M10 to pair 28's Reds. (INFERRED.)
5. **Census gaps** (existing checks the change turns red that §5.2 misses):
   - `packages/nana-pack/tests/code-map.test.mjs:99` "every mapped test module has an entry in docs/code-map.md" (no marker):
     the new `packages/nana-pack/tests/runtime-map.test.mjs` is a mapped test module, and the committed map has no
     `### \`…runtime-map.test.mjs\`` heading until `npm run map` (Read: `:95-99` at 2dbc817).
   - The mutate-runner lane's M33 "the output drain and kill grace equal the suite runner's" reads `scripts/test.mjs` as text
     (`../parallel-seat/CHANGE.md:375`, `:250`, `:316`); it lands before this lane. It stays green only while
     `const DRAIN_MS = 2000;` and `const KILL_GRACE_MS = 5000;` (`scripts/test.mjs:58-59`) keep their form. Add the row as
     green-with-that-condition, and add the two lines to §3.8 "What NOT to do". (Read; M33's matcher is not written yet, INFERRED.)
   - The `code-map.test.mjs:39` row's edge list omits `test-runner.test.mjs` → the config, which follows if C1 to C6 import the
     knob names ("Tunables imported by name", §5). Map regeneration covers it; the cause list is incomplete.
6. **R-1295 omits a cause §3.4 names.** §3.4: "With no data, unreadable data, another schema version or no git, one
   `runtime map:` note naming the cause replaces the block (R-1295)". R-1295 names three causes, not "no git". Add the
   no-git cause to the row (and to I6), or drop it from §3.4.
7. **EARS keywords.** R-1270, R-1271 and R-1272 open "WHEN `NANA_COVERAGE_DIR` is set" (an event keyword for a state), while
   R-1273 and R-1274 open "WHILE … set/unset" for the same state. One name for one thing: use WHILE in all five. R-1282 opens
   "WHERE a coverage entry's URL is not a file URL …", but WHERE marks an optional feature; this is an input condition (IF …
   THEN, or WHEN). The rail counts only `shall` (one each, Ran), so nothing reds; this is form, not a gate.
8. **"Outside the repository" needs one plain sentence.** The owner's answer 1 says the data stays outside the repo; the plan
   stores it in `.git/nana/` of the clone. That holds if "outside the repo" means never tracked, committed or pushed, which
   `.git/` satisfies, but the planned README sentence "inside the clone's shared git folder and outside the repository" reads
   as a contradiction. State that reading once in §3.3 and the README, or name it as an assumption. (INFERRED reading.)
9. **Acceptance step 2's `pgrep -f scripts/test.mjs` can false-fail under the new lane cap.** npm starts the runner as
   `node scripts/test.mjs` (relative, `package.json:9`), so the command line names no worktree, and with two lanes building a
   builder's filtered run elsewhere matches it (filtered runs skip the lock, `scripts/test-locked.mjs:168`). Check the measure
   command's own descendants (by process group or parent PID), or run step 2 when no other lane runs tests.
10. **Template generator cites, off by a few lines.** "`--impact` returns 0 today, `templates/typescript/template/scripts/code-map.mjs:851-862`":
    `return 0;` is at `:864` (the block is `:852-865`). The path-argument rule cited as `:854-859` is `:855-860`. (Ran: `grep -n`.)
11. **Runner header cites, off by a few lines.** "The runner's header and comment (`:5-7`, `:11-12`, `:22-24`)": @inputs is
    `:6-8`, @effects `:11-14`, and the scrub sentence `:24-26` (`scripts/test.mjs` at 2dbc817).
12. **Placement reason in §3.5.** "Later lanes a, c and f (§6) read them from pack code": lane f is a third tier in
    `scripts/requirement-rows.mjs`, a script, which may import a script. The pack home is earned by lane c and by the sibling's
    `test-jobs`, which moves the runner onto `lib/test-child.mjs` so R-1270 to R-1274 land in pack code.
13. **§4 overlap wording.** "The regroup rewrites `REQUIREMENTS.md`, the tree and the map": it added 13 rows and changed 3 tree
    lines and 30 map lines, and it has now landed (Ran: `git diff --numstat 2dbc817 c514964`). The header's "once the regroup
    lands" is now met; the base is `c514964` or later.
14. **§3.2 "the data describes the tree that was measured, even if someone edits during the run" overstates.** The hashes are
    taken before the lock wait and the run; a file edited during either is run at its new content and recorded at its old
    hash. The impact command then marks it stale, which is the honest outcome, but the sentence should say "marks it stale",
    not "describes the tree that was measured". Low stakes: one writer per worktree.

---

## C. Census, checked

Red as §5.2 says (Read at 2dbc817): `code-map.test.mjs:39` and `:235` (stale map); `requirements-tree.test.mjs:36`, `:38`,
`:40`, `:76`, `:85` (outline and leaf literal, R-291); `requirements-trace.test.mjs:61` (a marker traces a `planned` row; the
rail fails it, `templates/typescript/template/tests/requirements-trace.ts:17`); `readme-check.test.mjs:36` and `:50` (every
`package.json` script and every file under `scripts/` must be named in some README,
`templates/typescript/template/scripts/readme-check.mjs:531-547`; a backticked token with a slash or a known extension is a
path claim, `:305-319`, `:490-495`).

Green as §5.2 says: `code-map.test.mjs:225` (calls `formatImpact`); `templates-render.test.mjs:633-639`;
`requirement-rows.test.mjs` (imports the shim's `repoGraph`); `test-locked.test.mjs`; `product-report.test.mjs` (builds its own
store with `partial` ratings and FEAT-001, FEAT-002, FEAT-039; never FEAT-029 or FEAT-031, Read `:38-46`, `:316-353`);
`requirements-trace.test.mjs:56` (the report is `line` then `earsLine`, joined by construction, `requirements-trace.ts:601`);
`requirements-trace.test.mjs:149` (zero rows off form: 27 rows, one `shall` each, Ran). Also checked green: `code-map.test.mjs`'s
scratch-copy mutation (`:238-272`) runs the template generator directly, not the shim; `readme-check.test.mjs:91` copies all of
`scripts/` into its scratch root; `requirements-regroup.test.mjs` (now on main) mirrors only the requirement scripts
(Read `c514964:…:208-217`); `install-check.test.mjs:76` seals its own env list, which no new name joins. Only
`test-runner.test.mjs` copies `scripts/test.mjs` (Ran: grep over every test, template and config file), so `mkRoot` is the one
copy to change.

---

## D. Claim by claim (VERIFIED unless marked)

| Claim | Verdict | Evidence |
|---|---|---|
| Four regexes over raw source, template `code-map.mjs:393-411` | VERIFIED | `:393-396` regexes, `:406` loop |
| R-861's untraced-test line `…code-map.mjs:672`; `req:rows` note `scripts/requirement-rows.mjs:61`; open question 10 at `REQUIREMENTS.md:1758` | VERIFIED | those lines at 2dbc817 |
| 30 of 115 non-test modules have no test caller: 11 of 16 `bin/`, 3 of 9 extensions, 4 hooks, desk server and `apps.mjs`, 4 browser files, 3 bench modules, 3 scripts | VERIFIED | Ran: own walk over `repoGraph()` from `exemptRoots` (267 modules, 152 test-root, 115 non-test, 30 unreached; same 30 as `uncalled.out`); 16 `bin/`, 9 extensions |
| `templates/` outside the map, `code-map.config.json:33` | VERIFIED | `:33` |
| `seat-mutate.mjs:5`, `:18-22` | VERIFIED | regroup-shares corpus at 2dbc817 |
| `tests` field at sibling `:154`; `test-jobs` at sibling `:465-466`, "its lane 4" | WRONG (stale) | SHOULD 1 |
| 133 files on 2026-10-11, 144 now; 661 s | VERIFIED | totals line `133 files … 661.9s`; Ran: 144 direct test files under the six roots |
| -2% to +5% coverage cost; 257 lift runs; 1,419 outside entries; 65 MB | VERIFIED | `probe-1/2/3.json` (overheadPct 5, -2, 4, 1, -2, 4, 0, 2; `procs=257`; `1419`) |
| Child spawned with its own `env` still gets `NODE_V8_COVERAGE`; deleting it from the parent stops that | VERIFIED | `r2/probe/envprop.out` (A, C) |
| `/tmp`, `/var` links; coverage URLs name `/private/var` | VERIFIED | `r2/probe/link.out` |
| `.gitattributes` has no line-ending rule | VERIFIED | one `-whitespace` line |
| R-1270 to R-1299 unused on 39 refs and the three branches | VERIFIED | Ran (see header), at 2dbc817 and at the moved heads |
| R-1220 to R-1229 seat-rule reserve, no row | VERIFIED (cite moved to `:45-46`) | Read `../seat-rule/CHANGE.md` |
| Mutate-runner rows "from R-1240", reservation "up to R-1279" | WRONG | MUST-1 |
| 27 rows, one `shall` each, IDs contiguous | VERIFIED | Ran: parse of §2's table with the rail's `SHALL` regex, code spans masked |
| `requirements-trace.ts:17` (a traced `planned` row fails) | VERIFIED | `:17` |
| FEAT-029, FEAT-031 survive the regroup | VERIFIED | Ran: `git show c514964:REQUIREMENTS.md` `:1367`, `:1485` |
| Leaf total 1,139 at `requirements-tree.test.mjs:40`; regroup tip 1,152; roster-notice tip 1,165 | VERIFIED | Ran: `git show` per ref; main is now 1,152 |
| R-618 scrub keeps only `NANA_TEST_*`, `scripts/test.mjs:279`; row text | VERIFIED | `:279`; `REQUIREMENTS.md:1504` |
| `scripts/test.mjs` `:362` env, `:382` label, `:352-357` SKIP, `:62` `rel`, `:369` seconds, `:413-415` totals, `:292` mkdtemp, `:108-114` signals, `:114` SIGINT and SIGTERM only, `:110`/`:243`/`:248` `[runner]`, `:161-162` bench skip, `:166-167` win32 skip, `:45-50` imports, `:11-14` effects | VERIFIED | those lines at 2dbc817 |
| Runner labels are only PASS, FAIL, SKIP (a timeout is FAIL) | VERIFIED | `:379-382` |
| Header and comment `:5-7`, `:11-12`, `:22-24` | WRONG (minor) | SHOULD 11 |
| `test-runner.test.mjs:12-16`, `:47-58`; `TD` is realpath'd | VERIFIED | `:12-16`, `:32`, `:47-58` |
| `test-locked.mjs:112` `npm_execpath`; `:20`, `:168` lock only unfiltered; `:103-115` npm path; `:139-163` group signal, 500 ms SIGKILL, lock freed; `:152` 500 ms; `:156` three signals; `:132-133` win32 ends only npm; `:17` lock-dir override; `:5`, `:21` fixture command | VERIFIED | those lines at 2dbc817 |
| `mkdtempSync(path.join(os.tmpdir(), COVERAGE_PREFIX))` is the valid form | VERIFIED | Ran: two-argument form throws `ERR_INVALID_ARG_VALUE` |
| `fileURLToPath(u, {windows:true})` gives `C:\…` on darwin and drops `?query#fragment`; `path.win32.relative` ignores case | VERIFIED | Ran: `node -e` on v22.22.2; `r2/probe/url.out` |
| `git rev-parse --git-common-dir`: `.git`, `../.git` from a subfolder, absolute from a linked worktree | VERIFIED | Ran: throwaway repo (git 2.50.1) |
| `scripts/code-map.mjs:49-51` exits with `main`'s code; `:7` effects | VERIFIED | those lines |
| `--impact` returns 0, `:851-862`; path rule `:854-859` | WRONG (minor) | SHOULD 10 |
| Renderer promise `:682-686`, compare `:815` (template generator) | VERIFIED | `:683`, `:815` |
| Map test set equals the runner's, 144 each | VERIFIED | Ran |
| Layers `code-map.config.json:39-52`; scripts may import packages | VERIFIED | `:39-52` |
| Prior art `scripts/template-release.mjs:12` | VERIFIED | `:12` imports `../packages/nana-pack/lib/release-status.mjs` |
| `package.json:11-13`; README map paragraph `:55-61` and "thin shims" | VERIFIED | `package.json:11-13`; `README.md:55-62`, `:60` |
| `.github/workflows/ci.yml:2-5` (push to main, pull request), `:44-70` (suite matrix, non-macOS legs non-blocking) | VERIFIED | those lines |
| Windows CI temp is an 8.3 path | VERIFIED | `ci-run-1-windows.log`: 46 `RUNNER~1` hits |
| `HANDOFF.md:79` trial limit, `:81` two lanes; `nana-seat.md:11` | VERIFIED | those lines at 2dbc817 |
| `product-report.test.mjs:32`; `scripts/product-report.mjs:211-215`, `:166-200` | VERIFIED | those lines |
| `--check` and `--impact` about 0.07 s | VERIFIED | Ran: `/usr/bin/time -p`, 0.07 to 0.08 s |
| 200 GiB free | VERIFIED | Ran: `df -h` 199 Gi |
| `research.md` §3 `:151`, §5 option C2, §7 165/236/458 s | VERIFIED | `research.md:151`, `:243`, `:510` |
| Sibling S3 home `packages/nana-pack/lib/` | VERIFIED | `../parallel-seat/CHANGE.md:565` |
| Drift 22 to 138 lines per copy | VERIFIED | `../parallel-seat/research.md:39-41` |
| `feat/t3-land-b` has no worktree | VERIFIED | Ran: `git worktree list` |
| 29 titles; 55 pairs in groups 10+5+4+6+7+4+15+4; per-check lists (M11 1-6, 13, 23, 28, 29; I2 13, 38-42; …) | VERIFIED | Ran: parse of §5.1 and §5.3; every list matches the Reds column |
| Pair 13 reds I6 on any clone; pair 20 reds M5 only; pair 23 reds M11 | VERIFIED as reasoned | pair 23 holds while the runner hands the test a TMPDIR under the `/var` link: true for `scripts/test.mjs` (`:359`, `:362`), INFERRED for the shared runner, whose scratch root is `mkdtemp(<os.tmpdir()>/…)` with no realpath named |
| Pairs 33 and 34 red M15 | WRONG (INFERRED) | MUST-2 |
| Public-repo wording: no owner name, provider or machine name | VERIFIED | Ran: case-insensitive grep; only "Claude Code hooks" (the product the repo installs into) and a repo path |

---

## E. Recount

Rows: 27 added (R-1270 to R-1296), one `shall` each, none reworded; R-618 evidence only; R-1297 to R-1299 free. Titles: 29
(C1-C6, M1-M15, I1-I7, V1). Pairs: 55, numbered 1 to 55, no gap; every check has at least one pair. V1's twelve sealed names
match the twelve contract rows of §3.6, and its marker list matches their provenance rows. Residuals 1 to 16; later lanes a to
h; owner calls D3 optional, D2 and D5 parked, none blocking. After MUST-2, M15's pair list changes (to 35, 36 plus whichever of
33 and 34 the fix makes catchable), and the recount line should say so.
