# Fact-check — runtime-map CHANGE.md (seat draft 1) against main 2dbc817

Scope: every file:line, row ID, count, title, command, flag and API claim in `CHANGE.md`, checked against the repo at
`2dbc817`, the plan's own evidence (`research.md`, `probe*.json`, `probe-knob/`, `forms/`, `times-1011.txt`) and the sibling
plan folder (`../parallel-seat/research.md`, `../parallel-seat/CHANGE.md`). Method: a scratch copy made with
`git -C <repo> archive 2dbc817 | tar -x` (Node v22.22.2, macOS); branch facts with `git show` / `git grep` on refs only. The two
lane worktrees were not opened. No full suite run.

Legend: **VERIFIED**, **WRONG** (with the right fact), **UNVERIFIABLE**. Evidence tags: "file:line at 2dbc817", "Ran: <command>",
or INFERRED.

Totals: 95 claim rows in section C — 74 VERIFIED (5 of them with a WRONG or UNVERIFIABLE part), 14 WRONG, 7 UNVERIFIABLE —
which fold into 15 distinct WRONG items (section A). Six census gaps (existing checks the change turns red that §5.2 does not
list). Rows (19), titles (24) and pairs (43, with every per-check list) recount correctly.

---

## A. WRONG (15)

| # | CHANGE.md | Claim | Right fact | Evidence |
|---|---|---|---|---|
| W1 | §1 L19-20 | The 30 modules with no test caller are "every `bin/` command, the hooks, the desk server, the extensions, `scripts/test.mjs` and `scripts/test-locked.mjs`" | The count 30 of 115 is right; the list is not. 11 of 16 `bin/` modules (5 have test callers: `nana-land`, `nana-roster`, `review-round`, `review-shape`, `worker-config`); 3 of 9 extensions (`nana-knowledge`, `nana-writing`, `nana-stage`); all 4 `.mjs` hooks. The 30 also hold 4 desk browser files (`apps/desk/public/app.js`, `changes.js`, `md.js`, `stage/stage.js`), `apps/desk/apps.mjs`, 3 bench modules and `scripts/ts-syntax-check.mjs` | Ran: `node -e` over `repoGraph()` with a transitive-caller walk in scratch |
| W2 | §1 L18-19 | "a spawned process or a computed import path makes no edge, and the ledger already carries that gap as open question 10" | Open question 10 covers only non-literal dynamic imports. The spawn gap is carried by R-861's untraced-test line and the `req:rows` note, not by question 10 | REQUIREMENTS.md:1758; templates/typescript/template/scripts/code-map.mjs:672; scripts/requirement-rows.mjs:61 at 2dbc817 |
| W3 | §2 L44-46, §6 S1 | "the sibling plan reserves R-1220 to R-1239 for its first lane"; fallback "this plan moves to R-1240 to R-1258" | Stale. The sibling's CHANGE.md declares R-1240 to R-1266 and reserves R-1240 to R-1279, leaving R-1220 to R-1239 to this plan. There is no collision now; the S1 fallback range would collide with the sibling | Read: ../parallel-seat/CHANGE.md:5, :58-60, :424-425 (only its research.md:246, :396 still says R-1220) |
| W4 | §4 L221 | The sibling's first lane has "no file overlap" with this lane | Both lanes edit `REQUIREMENTS.md` (both in FEAT-031), `docs/requirements-tree.md`, the leaf literal in `requirements-tree.test.mjs`, `docs/code-map.md`, `HANDOFF.md` and `docs/sessions/2026-10.md`. Only the new modules do not overlap | Read: ../parallel-seat/CHANGE.md:233-236 |
| W5 | §1 L17; §6 (b), (g) | The sibling "reads this lane's data (§6, later lanes b, c and g)"; "(b) `test-jobs`, the sibling's lane 3"; "(g) The sibling's lane-overlap signal" | The sibling reads only the per-file seconds, for `test-jobs`. Neither sibling file names line ranges per test or a lane-overlap signal. `test-jobs` is lane 4 in the sibling's CHANGE.md (lane 3 only in its research.md) | Read: ../parallel-seat/CHANGE.md:465-466; ../parallel-seat/research.md:205, :228 (grep for "overlap", "line range", "runtime map" in both) |
| W6 | §3.2 L93; INFERRED list L393 | Without `npm_execpath`, test-locked starts `node undefined test`, "INFERRED to fail with a type error" | It fails with `MODULE_NOT_FOUND` ("Cannot find module '<cwd>/undefined'") and exit 1. No type error | Ran: `env -u npm_execpath NANA_SUITE_LOCK_DIR=<scratch> node scripts/test-locked.mjs nothing-matches` in scratch |
| W7 | §3.2 L97 | `mkdtemp(os.tmpdir(), COVERAGE_PREFIX)` | `mkdtemp` takes one prefix path; its second argument is options. As written it throws `ERR_INVALID_ARG_VALUE` ("The argument 'encoding' is invalid encoding"). The form is `mkdtemp(path.join(os.tmpdir(), COVERAGE_PREFIX))`, as the runner does | Ran: `node -e 'fs.mkdtempSync(os.tmpdir(),"nana-runtime-")'`; scripts/test.mjs:292 at 2dbc817 |
| W8 | §3.4 L140 | "A path argument becomes a repo path the way the generator makes one (`relative` to the root, then `/` separators)" | The generator runs `posix.normalize(relative(root, resolve(a)))` and keeps the raw argument when the path neither exists nor is a module. It never turns `\` into `/`. Converting separators is a different rule from the generator's, and the two differ on win32 | templates/typescript/template/scripts/code-map.mjs:854-859 at 2dbc817 |
| W9 | §3.4 L142 | "(`code-map.mjs:683-686`, `:815`)", right after `scripts/code-map.mjs` | `scripts/code-map.mjs` has 51 lines. The cited lines are in the template generator: the renderer promise at :682-686 and the byte compare at :815 | templates/typescript/template/scripts/code-map.mjs:682-686, :815 at 2dbc817 |
| W10 | §5 L227-228 | "Every new runner check removes the inherited `NODE_V8_COVERAGE` from the copied runner's env" | Deleting the key from a child's `env` does not remove it. Node copies the parent's `NODE_V8_COVERAGE` into any child env that lacks the key. Removal needs the key set to `""` in the child env, or deleted from the test's own `process.env`. As written, C3's "absent" case reds inside a measuring run | Ran: parent with `NODE_V8_COVERAGE=<dir>` spawns `node -e` with `{...env}` minus the key: the child prints `<dir>`; with `NODE_V8_COVERAGE: ""` it prints `""` |
| W11 | §5.3 pair 1 | "the runner sets `NODE_V8_COVERAGE` to the knob folder on its own `process.env` before `BASE_ENV` is built" reds C1, M9 | Setting the variable after start gives a process no coverage. Each test file's env still sets its own folder, and the runner's other children (`git`, `pgrep`, `taskkill`) are not node. Nothing lands in the knob root. The pair is very likely a survivor (equivalent mutant) | Ran: `node -e 'process.env.NODE_V8_COVERAGE="<dir>/cov"'` wrote nothing; scripts/test.mjs:150, :294-297, :362 at 2dbc817 |
| W12 | §5.2 L273 | `readme-check.test.mjs:36` is "red if the README names `npm run map:measure` before `package.json` has it; green with both" | The checker also requires every file name under `scripts/` in some README, and every `package.json` script. With the script and the file added, two problems: `'map:measure'` and `'runtime-measure.mjs'` "not documented in any README". The planned sentence names only `npm run map:measure`, so the check stays red until a README names `runtime-measure.mjs` | Ran: in a scratch copy, added the script to package.json and an empty `scripts/runtime-measure.mjs`, then `node scripts/readme-check.mjs --check`; templates/typescript/template/scripts/readme-check.mjs:456-463, :531-547 |
| W13 | §3.5 table | `scripts/code-map.mjs` "adds process"; `scripts/test.mjs` "adds disk" | Both effect kinds are already declared: the shim's header lists disk and process; the runner's lists process and disk. The effect text grows; no kind is added (minor) | scripts/code-map.mjs:7; scripts/test.mjs:11-14 at 2dbc817 |
| W14 | §5.2 L274 | The existing `test-runner.test.mjs` checks are "R-600 to R-618" | Its markers also trace R-648, R-910, R-911, R-912, R-915, R-916, R-917 and R-918 (minor) | Ran: `grep -n "req:" packages/nana-pack/tests/test-runner.test.mjs` |
| W15 | §4 L220 | "`feat/roster-notice` adds rows, a module and the tree total" | It adds two pack lib modules, an extension, a hook and two test files. It also edits `README.md` and `package.json`, two files this lane edits (minor) | Ran: `git diff --stat` and `--diff-filter=A` for `2dbc817...feat/roster-notice` |

---

## B. Census gaps: existing checks the change turns red that §5.2 misses

| Check | Why it reds | Evidence |
|---|---|---|
| `code-map.test.mjs:235` "scripts/code-map.mjs --check exits 0 on a clean repo" (no marker) | Same stale map as :39; red until `npm run map` | packages/nana-pack/tests/code-map.test.mjs:231-235 at 2dbc817 |
| `requirements-tree.test.mjs:76` "R-291: parent row counts aggregate descendants" | Reads row counts from the committed outline; red until `npm run req:tree` | packages/nana-pack/tests/requirements-tree.test.mjs:76-83 |
| `requirements-tree.test.mjs:85` "R-291: feature outline carries status and shared IDs" | Calls `checkOutlineFields` on the committed outline; red until `npm run req:tree` | packages/nana-pack/tests/requirements-tree.test.mjs:85 |
| `readme-check.test.mjs:50` "scripts/readme-check.mjs --check exits 0" (no marker) | Same README problems as :36 (W12) | packages/nana-pack/tests/readme-check.test.mjs:50 |
| `readme-check.test.mjs:36` (second cause) | A backticked data location such as `nana/runtime-map.json` or `.git/nana/runtime-map.json` is a path claim and must exist, unless `readme-check.config.json` declares it external. `<git common dir>/nana/runtime-map.json` is not a path claim (the `<` stops it) | templates/typescript/template/scripts/readme-check.mjs:305-319, :490-495 |
| `product-report.test.mjs` (checks using the copied real HANDOFF, e.g. :60) | The report throws on a malformed "Open for ..." ask, and the test copies the real `HANDOFF.md`. §6 turns five owner calls into HANDOFF lines; each must keep the ask form | packages/nana-pack/tests/product-report.test.mjs:32; scripts/product-report.mjs:211-215 |

Also incomplete, same red: the cause list for `code-map.test.mjs:39` omits the shim's new import edge to
`runtime-map.mjs` (its map entry's callees change), and the new modules' own edges.

Checked and green, as §5.2 says: `code-map.test.mjs:225` (calls `formatImpact` directly); `templates-render.test.mjs:633-639`;
`requirement-rows.test.mjs` (imports the shim's `repoGraph`, runs `requirement-rows.mjs` on `pi-review.mjs`); `test-locked.test.mjs`
(fake npm through `npm_execpath`); no existing test spawns the nana-pi shim with `--impact` (Ran: grep for `--impact` and
`map:impact` in `packages`, `apps`, `scripts`). `validateStore` compares stamps with the ledger at the stamped commit, so new rows
in FEAT-029 (rated solid) and FEAT-031 fail no store check (scripts/product-report.mjs:166-200).

---

## C. Claim by claim

### Header and §1

| Claim | Verdict | Evidence |
|---|---|---|
| At most two lanes at once, `HANDOFF.md:81` | VERIFIED | HANDOFF.md:81 |
| FEAT-029 holds measure and impact rows; FEAT-031 runner rows; R-618 in FEAT-031; R-291 in FEAT-028 | VERIFIED | REQUIREMENTS.md:1315, :1333, :1355, :1473, :1504 |
| No `packages/nana-setup/` file or hook touched, so no install check | VERIFIED | §4 file list; CLAUDE.md install-check rule |
| Four regexes over raw source, `code-map.mjs:393-411` (template) | VERIFIED | templates/typescript/template/scripts/code-map.mjs:393-411 |
| Open question 10 at `REQUIREMENTS.md:1758` | VERIFIED (line); scope WRONG, see W2 | REQUIREMENTS.md:1758 |
| 30 of 115 non-test modules have no test caller | VERIFIED (count); list WRONG, see W1 | Ran: repoGraph walk (267 modules, 152 test-root, 115 non-test) |
| `templates/` ignored, `code-map.config.json:33` | VERIFIED | code-map.config.json:33 |
| Seat runner copied per lane, `seat-mutate.mjs:5`; test sets by hand `:18-22` | VERIFIED | docs/reviews/regroup-shares-2026-10-15/seat-mutate.mjs:5, :18-22 |
| Parallel test runner queued, `HANDOFF.md:85` | VERIFIED | HANDOFF.md:85 |
| Only per-file timing list is the 2026-10-11 output, 133 files; 144 now | VERIFIED | docs/reviews/verdict-position-2026-10-11/test-locked-output.txt (`133 files: 132 PASS, 0 FAIL, 1 SKIP`); Ran: `ls` of the six test roots = 144; grep of docs for per-file lines |
| Coverage cost -2% to +5% over 8 files | VERIFIED | probe-1/2/3.json overheadPct: 5, -2, 4, 1, -2, 4, 0, 2 |
| A child spawned with `env: { PATH }` still writes coverage | VERIFIED | probe-knob/cov/0001 holds two coverage files; Ran again: `forms/a.mjs` under `NODE_V8_COVERAGE` |
| Lift test's 257 lift runs show up | VERIFIED (257); "all" UNVERIFIABLE from the evidence | probe-2.json: `scripts/requirements-lift.mjs procs=257` |
| 8 files give a measured test to 8 of the 30 | VERIFIED | probe JSONs: server, apps, pi-worker, pi-watchdog, verifier-pipe hook, nana-setup, nana-knowledge CLI, test-locked |
| Template generator runs under the code-map test | VERIFIED | probe-1.json |
| SIGTERM or SIGKILL child writes no coverage | VERIFIED | Ran: `NODE_V8_COVERAGE=<dir> node a.mjs` in a copy of `forms/`: 5 files, none from `killed.mjs` |
| `?query` / `#fragment` URLs; `[eval]`, `evalmachine.<anonymous>`, `[eval1]` entries | VERIFIED | forms rerun (`c.mjs?v=1`, `c.mjs#frag`, `[eval]`); probe-3.json (`evalmachine.<anonymous>`); probe-2.json (`packages/nana-pack/[eval1]`, in the test-runner test) |
| Repo's own `node_modules/` present | VERIFIED | Ran: `ls -d <repo>/node_modules` |
| 1,419 global-npm entries in one desk test | VERIFIED (count); "global npm folder" UNVERIFIABLE: the probe records only a `file:node_modules` bucket outside the root | probe-3.json app-listener `outside` |
| `/tmp` is a link on macOS | VERIFIED | Ran: `ls -ld /tmp` |
| 8.3 short names in CI logs | VERIFIED (temp paths); repo-root case INFERRED as stated | ci-run-1-windows.log: `C:\Users\RUNNER~1\AppData\Local\Temp\...` |
| `.gitattributes` holds no line-ending rule | VERIFIED | .gitattributes: one `-whitespace` line |

### §2 Requirement delta

| Claim | Verdict | Evidence |
|---|---|---|
| R-1220 to R-1238 unused on main and every branch; only hits are range mentions up to R-1219 in the roster-notice corpus | VERIFIED (all 58 refs); worktree files UNVERIFIABLE (not opened, by brief) | Ran: `git grep -E "R-12(2[0-9]|3[0-9])"` on every ref: 0 hits; `R-121[6-9]` hits only roster-notice corpus files |
| Sibling reserves R-1220 to R-1239 | WRONG, see W3 | |
| FEAT-029 and FEAT-031 survive the regroup | VERIFIED | `git show feat/regroup:REQUIREMENTS.md`: :1367, :1485 |
| 19 rows added, one `shall` each | VERIFIED | Ran: count of `| R-12xx |` rows (19) and whole-word `shall` per row (1 each) |
| R-618 text: the scrub keeps `NANA_TEST_*` only, so `NANA_COVERAGE_DIR` is scrubbed | VERIFIED | REQUIREMENTS.md:1504; scripts/test.mjs:279 |
| Leaf total 1,139 at `requirements-tree.test.mjs:40`; regroup tip 1,152 | VERIFIED | requirements-tree.test.mjs:40, :54; `git show feat/regroup:...` :40 (roster-notice tip says 1,165) |

### §3 Design

| Claim | Verdict | Evidence |
|---|---|---|
| Per-file env set beside HOME and TMP, `:362` | VERIFIED | scripts/test.mjs:362 |
| A runner started with the variable credits itself | VERIFIED | Ran: `NODE_V8_COVERAGE=<dir> node scripts/test.mjs incremental-build`: one file names `scripts/test.mjs` |
| Label known `:382`; SKIP branch `:352-357`; `rel(file)` `:62`; printed seconds `:369` | VERIFIED | scripts/test.mjs at those lines |
| probe-knob patch is 12 added lines; SKIP, PASS-with-child, PASS, FAIL each got one folder with its record; child coverage in its folder; no runner coverage | VERIFIED | Ran: `diff` of probe-knob runner vs scripts/test.mjs (12 `>` lines); probe-knob/cov/0000-0003 records and URLs |
| Test file and its child saw no knob | VERIFIED | records: `a-spawn` PASS, its two PASS checks test exactly that |
| Runner imports node built-ins only today; runner test copies it alone, `:12-15`, `:47-56` | VERIFIED | scripts/test.mjs:45-50; test-runner.test.mjs:12-16, :47-58 |
| Sibling `test-jobs` moves the runner onto a pack library | VERIFIED | ../parallel-seat/research.md:228; CHANGE.md:465 |
| `test-locked.mjs:112` uses `npm_execpath` | VERIFIED | scripts/test-locked.mjs:111-112 |
| Fails with a type error without it | WRONG, see W6 | |
| Lock only without a filter, `:20`, `:168`; npm path `:103-115` | VERIFIED | scripts/test-locked.mjs:20, :168, :103-115 |
| `mkdtemp(os.tmpdir(), COVERAGE_PREFIX)` | WRONG, see W7 | |
| Largest sampled coverage 65 MB (lift test) | VERIFIED | probe-2.json: 64.9 MB |
| `path.win32.relative` ignores drive-letter case | VERIFIED | Ran: `path.win32.relative("C:\\Repo\\nana-pi","c:\\repo\\nana-pi\\scripts\\x.mjs")` = `scripts\x.mjs` |
| Every repo entry had a top-level run count of 1 | VERIFIED as recorded; the probe keeps the maximum over processes, so a per-process 0 would not show | probe.mjs:80 (`Math.max`) |
| Totals line form, `scripts/test.mjs:413-415` (R-616) | VERIFIED | scripts/test.mjs:413-415; REQUIREMENTS.md:1502 |
| `git rev-parse --git-common-dir` prints `.git` in the main checkout, an absolute path in a linked worktree | VERIFIED; note it prints a cwd-relative path (`../.git`) from a subfolder, so resolve against git's cwd | Ran: throwaway repo plus worktree |
| `scripts/code-map.mjs` calls `main` at `:49-51` | VERIFIED | scripts/code-map.mjs:49-51 |
| Map's test set equals the runner's, 144 each | VERIFIED | Ran: set compare over `repoGraph()` and the six roots: no difference |
| Path argument made "the way the generator makes one" | WRONG, see W8 | |
| `code-map.mjs:683-686`, `:815` | WRONG file, see W9 | |
| Layers: scripts may import packages, never the reverse, `code-map.config.json:39-51` | VERIFIED | code-map.config.json:39-51 |
| Prior art: `scripts/template-release.mjs:12` imports a pack lib module | VERIFIED | scripts/template-release.mjs:12 |
| Effects "adds process" / "adds disk" | WRONG, see W13 | |
| Sibling's shared runner lives in `packages/nana-pack/lib/` (§1.6) | VERIFIED | ../parallel-seat/research.md:140-145 |
| Sibling's runner and later suite runner "must import" the reader and config | UNVERIFIABLE: neither sibling file names an import of the runtime reader | grep of both sibling files |
| `NANA_SUITE_LOCK_DIR` at `test-locked.mjs:17` | VERIFIED | scripts/test-locked.mjs:17 |
| Node names its files `coverage-<n>-<n>-<n>.json` | VERIFIED | probe-knob/cov file names |
| `nana-test-runner-` prefix at `scripts/test.mjs:292` | VERIFIED | scripts/test.mjs:292 |
| `package.json` map scripts at `:11-13` | VERIFIED | package.json:11-13 |
| README map paragraph `README.md:55-61`; a "thin shims" sentence | VERIFIED | README.md:55-62 |
| `npm_execpath` keeps Windows off `npm.cmd` | VERIFIED | scripts/test-locked.mjs:111-112 |
| Windows CI temp folder is an 8.3 short path | VERIFIED | ci-run-1-windows.log |
| `realpathSync` resolves a win32 junction | UNVERIFIABLE (INFERRED as stated) | not run on Windows |
| Windows CI leg runs the new test | VERIFIED; the leg is non-blocking | .github/workflows/ci.yml:44-70 (`continue-on-error` for non-macOS, runs on `pull_request`) |
| Drift of 22 to 138 lines per copy | VERIFIED | ../parallel-seat/research.md:39-41 |

### §4, §5, §6

| Claim | Verdict | Evidence |
|---|---|---|
| Sibling lane 1 "no file overlap" | WRONG, see W4 | |
| roster-notice "adds rows, a module and the tree total" | WRONG (minor), see W15 | |
| `feat/t3-land-b` has no worktree | VERIFIED | Ran: `git worktree list` (worktrees on main, `land/t3`, `feat/regroup`, `feat/roster-notice`) |
| 24 new titles | VERIFIED | C1-C4, M1-M13, I1-I6, S1 |
| C2's SKIP fixture fires everywhere, `scripts/test.mjs:161-162` | VERIFIED | scripts/test.mjs:161-162 |
| `--check` and `--impact` take about 0.07 s | VERIFIED | Ran: `/usr/bin/time -p node scripts/code-map.mjs --check` (3 runs) and `--impact`: real 0.07 |
| Census lines `code-map.test.mjs:39`, `:225`; `requirements-tree.test.mjs:36`, `:38`, `:40`; `requirements-trace.test.mjs:61`; `readme-check.test.mjs:36`; `templates-render.test.mjs:633-639`; rows G-004, G-009, G-010, R-291, G-012, R-861, R-862 | VERIFIED (lines, titles, rows) | those files at 2dbc817; REQUIREMENTS.md:1333, :1414-1415, :1564, :1569-1570, :1572 |
| A traced `planned` row reds the rail | VERIFIED | templates/typescript/template/tests/requirements-trace.ts:17, :84 |
| readme-check "green with both" | WRONG, see W12 | |
| Test-runner checks are "R-600 to R-618" | WRONG (minor), see W14 | |
| Every new runner check removes the inherited `NODE_V8_COVERAGE` | WRONG, see W10 | |
| `requirement-rows` imports the shim's `impact` | VERIFIED (it imports `impact` and `repoGraph`) | scripts/requirement-rows.mjs:13 |
| Product report shows FEAT-029 and FEAT-031 out of date; no check fails on it | VERIFIED by Read (was INFERRED): both are assessed, stamped at `c4332ec`; `validateStore` reads the ledger at the stamp | docs/product-report/assessments.json; scripts/product-report.mjs:172-200; HANDOFF.md:67 |
| 43 pairs; groups 7+2+4+6+8+12+4; numbered 1-43 with no gap | VERIFIED | recount |
| Per-check pair list (C1 1, 2 … S1 40-43) | VERIFIED | recomputed from the Reds column: every list matches |
| Pair 1 reds C1, M9 | WRONG, see W11 | |
| Acceptance: `pi-worker.mjs` lists `worker-lane.test.mjs`; the generator lists `code-map.test.mjs`; `scripts/test.mjs` lists none | VERIFIED by probe | probe-3.json, probe-1.json, probe-2.json (copies outside the root) |
| The PR's Windows leg | UNVERIFIABLE: CI runs on `pull_request`, but whether this lane opens a PR is not in the repo | .github/workflows/ci.yml:2-5 |
| 661 s run; 12 to 16 minutes | 661 s VERIFIED; 12-16 min UNVERIFIABLE (INFERRED as stated) | test-locked-output.txt totals line |
| launchd is macOS-only | VERIFIED | CLAUDE.md support line |
| The 2026-10-11 queue does not hold this request | VERIFIED | HANDOFF.md:81-88 |
| Sibling recommends `test-jobs` after runtime-map (§2(c)) | VERIFIED | ../parallel-seat/research.md:205 |
| Lesson 2 at `docs/sessions/2026-10.md:139` | VERIFIED | docs/sessions/2026-10.md:139 |
| `NANA_SUITE_TEST_COMMAND` at `test-locked.mjs:5`, `:21` | VERIFIED (:5 describes "an optional fixture command override"; :21 names it) | scripts/test-locked.mjs:5, :21 |
| Hook test SKIPs off Windows | VERIFIED | scripts/test.mjs:166-167 |
| `req:rows` tiers at `scripts/requirement-rows.mjs:53-58` | VERIFIED (computed :44-51, printed :52-58) | scripts/requirement-rows.mjs |
| 4 workers: 165 s longest first, 236 s round-robin, 458 s contiguous chunks | VERIFIED | Ran: node over the 132 timed lines of test-locked-output.txt (2 workers: 331 / 386 / 497) |
| Sibling lane-overlap signal; sibling reads lanes b, c, g | WRONG, see W5 | |
| `test-jobs` is the sibling's lane 3 | WRONG (stale), see W5 | |
| Builder choice "under the seat's current split" | UNVERIFIABLE (roster, not in the repo) | |
| Git leaves unknown files in its common dir alone | UNVERIFIABLE (INFERRED as stated) | |
| Rename over an open file can fail on Windows | UNVERIFIABLE (INFERRED as stated) | |

---

## D. Notes that are not verdicts

- `fileURLToPath` already drops the query and fragment (Ran: `fileURLToPath("file:///tmp/x.mjs?v=1#frag")` = `/tmp/x.mjs`). R-1226's
  drop clause holds for free, and pair 14 reds only a mapper that slices strings.
- One name, two things: "S1" is both the seal check (§3.6, §5.1) and a seat decision (§6); "C2" and "C3" are both checks (§5.1) and
  research options (§3.9: "Loaded only mark (C2)", "Line ranges (C3)").
- Owner calls D1 to D5 are "ask before the build". The attention-limit trial allows at most three blocking asks until 2026-10-20
  (HANDOFF.md:79); none stand today (Ran: grep of HANDOFF.md).
- Seal coverage: the seal check names eight values, but pairs 40-43 change only four (`RUNTIME_SCHEMA`, `COVERAGE_ENV`,
  `DATA_SUBPATH`, `STALE_MARK`). `RECORD_FILE`, `DATA_FILE_ENV`, `TOTALS_LINE` and `NOTE_PREFIX` have no retune pair.

## E. Research-note errors the CHANGE does not repeat

- research.md §2: "46 take 1-5 s, and 14 take 20 s or more". Ran over the same file: 72 under 1 s, 35 from 1 to 5 s, 18 from 5 to
  20 s, 7 at 20 s or more (132 timed files).
- research.md §3: "about 200 entries per process" for `node:` built-ins. The probes show 73 to 109 per process.
- research.md §3: `[eval1]` came from "a code-map run". probe-2.json shows it in the test-runner test; probe-1.json (code-map) has none.
- research.md §3: "91 MB over 418 processes". The probes sum to 92.5 MB (88.2 MiB) over 418.
- research.md cites `test-locked.mjs:167` and `seat-mutate.mjs:16-21`; the right lines are :168 and :18-22, as the CHANGE has them.
