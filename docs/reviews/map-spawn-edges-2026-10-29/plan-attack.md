# map-spawn-edges — plan attack

Adversary for `docs/reviews/map-spawn-edges-2026-10-29/plan.md`, worktree `~/nana-pi-wt/map-spawn-edges` at 8da540e8.
Threat model as the plan states it: honest variation in scope, forgery out.
Probe scripts lived in the session scratchpad. Each finding gives the command or file:line that backs it.

## MUST

### 1. MUST — The path-resolution rule is not stated. As written, the plan both guesses and drops real edges.

The must-meets say "`join`/`resolve` of literal segments". They never say what a non-literal first argument means. In R-3149 that is `join(root, "apps", "s.mjs")`; in R-3152 it is `join(root, "bin", "x.mjs")`. The precedent list names a sealed "two-segment suffix minimum". That means a unique suffix match, which is the same kind of guess as the unique-basename fallback that R-3152 retires, one segment longer. No must-meet pins it.

Evidence:
- The current linker splits `join(PACK, "bin", "pi-worker.mjs")` into separate literals. Only the basename fallback links them (`scripts/code-map-launch.mjs:56-60`). I ran `addLaunchLinks` on this repo with and without that fallback. 70 of today's 127 launch edges exist only because of the fallback.
- Of those 70, 13 have no two-segment literal in the source at all. They are spelled `const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin")`, then `path.join(bin, "pi-review.mjs")`. Examples: `packages/nana-pack/tests/review-ledger.test.mjs:24-27`, `watchdog-exit.test.mjs:27-29`, `immutable-review.test.mjs:20`, `path-spelling.test.mjs:21`, `review-timeline.test.mjs:28`. These are the review and land tool tests. Under R-3152's "names only a bare basename" they become unresolved. They are real edges today, and the plan would lose them.
- I scanned the 489 `join`/`resolve` path expressions in launching modules. 176 resolve exactly from the repo root. 111 resolve only by suffix: the anchor is a package directory (`pkg` 28, `root` 17, `bin` 16, `PACK` 5, `packageRoot` 6, ...) or a temp copy (`copyRoot`, `tmp`, `pageDir`, `dirs.public`). 8 match more than one module. 194 match none.
- Inferred, not confirmed: the plan's leftover class "lane-watcher-child relaunches itself" looks like the same loss. `packages/nana-pack/lib/lane-watcher.mjs:32` names the child by `new URL("lane-watcher-child.mjs", import.meta.url)`, which the plan's own path rule resolves. `bin/pi-worker.mjs:34` imports lane-watcher. The tests reach pi-worker by spellings such as `join(bin, "pi-worker.mjs")`. If the prototype dropped the basename fallback, those tests lose pi-worker, and the child is lost with it.

Fix to the plan:
- State the anchor rule as deterministic resolution, not a guess. An anchor resolves when it traces, through local constants, to `import.meta.url` (`dirname(fileURLToPath(import.meta.url))`, `new URL(".", import.meta.url)`) or to a constant that is itself resolved. Joins of resolved directory constants compose.
- If a unique-suffix rule stays for unknown anchors, call it a declared heuristic in the row text. Stop claiming "never guesses".
- Add must-meet fixtures for:
  - `const bin = join(dirname(fileURLToPath(import.meta.url)), "..", "bin"); spawnSync(process.execPath, [join(bin, "t.mjs")])`, which must link exactly;
  - an unknown-anchor case, `join(tmp, "bin", "t.mjs")` where `tmp` comes from `mkdtempSync`, with its pinned outcome.
- Add a replay gate: no edge that today's map holds may vanish without being named as unresolved. Diff the old and new launch edges, and report every lost edge with its reason.

### 2. MUST — "Unresolved" is undefined once the path rule is module-wide. R-3150 and R-3152 conflict.

R-3150 counts every path expression in a launching module, so `run(CLI)` links through `function run(file) { return spawnSync(process.execPath, [file]); }`. R-3152 lists a launch as unresolved when "a node launch's arguments resolve to no mapped module". Its fixture uses `[fileFromParameter]` "where no path expression exists in the module". So the R-3150 fixture's launch inside `run` is unresolved per launch, and resolved per module. The plan never says which.

- Read per launch: every wrapper helper in 162 launching tests lands on the always-run list.
- Read per module: a module with one resolvable path silently hides every other unresolved launch it makes. An example is a temp-written child that imports `lib/b.mjs` through a quoted string. That breaks "names what it cannot see".
- R-3152 also lists "a path matches more than one mapped module" as an unresolved *launch*. Under the module-wide rule, that path need not be a launch argument.

Fix: define unresolved as a node launch whose argument expressions do not trace to a path expression that resolves. Tracing follows local constants and, at most, one helper parameter bound at its call sites. Separately, define what happens to an ambiguous path expression that is not a launch argument (report it or drop it). Pin both in the R-3150 fixture: assert whether `run`'s spawn appears under unresolved launches.

### 3. MUST — R-3153 names only tests that *hold* an unresolved launch. The CI selector needs every test that *reaches* one.

The plan's own leftovers sit in non-test modules. Examples are `lane-watcher-child.mjs:18` (`spawn(process.execPath, [process.argv[1], ...])`) and the temp-written children. A test that imports a module with an unresolved launch is just as blind. R-3153 says "print the count and names of the test files that hold an unresolved launch", and its fixture puts the unresolved launch in a test. The later selector then trusts an impact set that misses these tests, which is the failure the owner asked this lane to prevent.

Fix: make R-3153 name every test whose enriched transitive callees include a module with an unresolved launch, or that holds one itself. Pin it with a fixture where `lib/y.mjs` holds the unresolved launch, `tests/y.test.mjs` imports it, and the line names `tests/y.test.mjs`.

### 4. MUST — A4 hides launches that run repo code under programs other than node. The plan's own leftovers fall in that hole.

A4 says any program other than node (pi, a shell, Claude Code) "is not reported as unresolved". The plan then lists, among the 20 leftover tests, "pi loading the extension folders a manifest names" and "hooks reached through an installed settings.json", and says "Those are what the unresolved report must name". By A4's rule they are never reported. A pi launch runs repo `.ts` and `.mjs` code.

Fix: pick one of these and write it into R-3152:
- (a) treat `pi` (and any launch whose argv carries `-e`, `--extension` or a repo directory) as a repo-code launch, and report it as unresolved when no path resolves;
- (b) keep A4, list these tests in a declared, reasoned always-run list in config, and pin the list.

Either way, the recorded runtime-gap check must show that each leftover entry point is named somewhere a selector reads.

## SHOULD

### 5. SHOULD — The replay's window and leg handling are misdescribed, and the "inferred flakes" are mostly Windows-only failures.

- `gh run list --workflow ci --status failure --limit 200` returns 182 failed runs from 2026-10-08 to 2026-10-29. The newest 90 start at 2026-10-20, not 2026-10-08. I re-derived the plan's 83 runs and 111 pairs from those 90: the union of `failed:` files across the three suite legs.
- 71 of the 111 pairs (64%) failed only on `suite (windows-latest)`. Every one of the 9 `mutation-runner.test.mjs` pairs is Windows-only (the plan says 8). 3 of the 4 `test-runner.test.mjs` pairs are Windows-only. 2 of the 4 `pi-launch-limits.test.mjs` pairs are macOS failures on `main`, which point to a base that was already red rather than a flake.
- These are platform failures or red-base failures. A selector that "skips them correctly" ships them to the post-land Windows run on main. The CI lane must know this.
- `ci.yml` checks out a pull request's default merge ref (`.github/workflows/ci.yml:81`, `actions/checkout@v4` with no `ref`). The tested tree is the head merged with the main of that moment. A diff taken from "the newest main-push ancestor of the head" misses main commits merged in after the branch point. Failures those commits cause get counted as flakes.

Fix:
- Correct the window line.
- Split every replay number by leg (macOS, Linux, Windows).
- Add an "already red on base" class: the same file failed on the base revision's run.
- Diff against the merge base the run actually tested, using `pull_request.base.sha` at run time where it is available. Otherwise mark the pair unknown.
- Commit the seat prototype's replay script to the lane folder before build 1. A6 compares the builder's numbers "against the prototype's 55", and that comparison means nothing if the two use different methods. Today the folder holds only `plan.md`.

### 6. SHOULD — R-1272's row text becomes false. A2 leaves one consumer inside `--impact` itself unnamed.

- R-1272 (REQUIREMENTS.md:2483) says impact prints "the code-map generator's output byte for byte". After R-3153 and R-3154, the shim prints its own impact. The test still passes, because it compares two shim runs (`packages/nana-pack/tests/runtime-map.test.mjs:171-192`). The row reads false. Amend R-1272 in this lane.
- `artifactBlock` (`scripts/code-map.mjs:132-138`) computes its "no import path" radius from `repoGraph()` and `impact()`. One `--impact` output would then mix enriched callers with import-only artifact flags. State which graph it uses. Keeping import-only fits its `ARTIFACT_NO_IMPORT_PATH` label, but say so.
- The R-2822 order check is already vacuous. It searches for `"untraced test modules"` (`runtime-map.test.mjs:204`). The real line says `untraced tests: … test modules`, so `indexOf` returns -1 and the check always passes. Fix it when O3 rewords the line.

### 7. SHOULD — `map:search` reads the written map and will change. The plan does not name it as a consumer.

`scripts/code-search.mjs:147` boosts ranking with `m.callers`/`m.callees`, and lines 166-176 print callees, all parsed from `docs/code-map.md`. With module-wide path edges, hubs gain many callees. On my scan, `packages/nana-setup/lib/doctor.mjs` names 18 modules, `steps.mjs` 15 and `scripts/product-report.mjs` 15. The R-3007 quality test reads only *historical* maps (`code-search.test.mjs:110`), so it cannot see this. Fix: name `map:search` under A2. Either filter path edges out of the search neighbours, or re-run the R-3007 measure on a map regenerated at the built tip and record it.

### 8. SHOULD — Several rows are wider than their tests.

- R-3149 claims "a literal, a local constant, `new URL`, or `join`/`resolve`". The fixture covers only `new URL` and `join`. Add a bare literal and a constant case, or narrow the row.
- R-3151 claims "as an argv array or a command string". The fixture covers only `["run", "tool"]`. It also leaves open a scripts entry that chains (`a && b`) or calls another `npm run`.
- R-3154's on-repo test computes the expected count "from the shim's exported graph". The code under test computes it the same way, so the check only mirrors the implementation (code-quality lens 4). Pin a fixture with a known launch-only test, and assert the count against a number taken from the fixture.

### 9. SHOULD — R-3151 has no measured case and fails the subtraction test.

Nothing in this repo launches `npm run <name>`. No module or test launches a package bin by command name either. I grepped spawn, exec and execSync calls in packages, apps and scripts. Every `"npm run …"` hit is text inside a test (`gate-corpus.test.mjs:67`, `runtime-map.test.mjs:196`, `readme-check.test.mjs:67`). The only npm launch is `npm root -g` (`packages/nana-pack/tests/pi-install.mjs:31`). The runtime and replay numbers show no miss of this kind. Fix: drop R-3151 and leave a known-bug line. If it stays, cite the launch site it closes.

### 10. SHOULD — The CI lane needs non-module reach, and the plan leaves even the cheapest part out.

- `npm run map:impact -- templates/typescript/template/scripts/code-map.mjs` prints `[NOT A MAPPED MODULE]`, with 0 callers. That is the generator every map test runs.
- The graph already records the edge: `scripts/code-map.mjs`'s `external` list holds `templates/typescript/template/scripts/code-map.mjs`.
- 25 test files name `templates/`. Ten name `.github/workflows` or `ci.yml` (for example `ci-workflow.test.mjs`, `land.test.mjs`, `pages-workflow.test.mjs`). 41 name `package.json`.
- The plan's known-bug line is correct, but it leaves nothing for the CI lane to build on.

Fix:
- At least have `--impact` print a non-module target as "not mapped; selector must run all". Today it prints only the `[NOT A MAPPED MODULE]` marker.
- Record that repo-relative `external` imports into ignored roots already exist as data.
- Give the CI lane a machine-readable impact output (for example `--json`) rather than sealed English wording (R-3153, O2). A selector that parses sentences breaks on the next rewording.

### 11. SHOULD — The new config module's sealed values have no seal tests or rows.

The precedent names `scripts/code-map-launch-config.mjs`. It holds launch call names, node-program markers, inline-code flags and the suffix minimum. The standards need one pin test per sealed value, each naming its row, and the must-meets list none. Inline-code launches (`node -e`, `--input-type`) also get no rule: resolve the literals inside them, report them unresolved, or ignore them. Fix: add the seal tests to the must-meet list, and state the inline-code rule in R-3152 with one fixture case.

### 12. SHOULD — Base drift. Main has moved 15 commits, and a new root has landed.

The worktree sits at 8da540e8. `main` is at 57167e92 (`git log HEAD..main` shows 15 commits). Main adds `apps/hive` as a map root and `apps/hive/vendor` to `ignore` (`git diff HEAD main -- code-map.config.json`). R-3149 to R-3154 are still free on main (its highest row is R-3148). Fix: merge main before build 1, and re-take the "Measured today" numbers at the new tip.

## NOTE

### 13. NOTE — Some counts do not reproduce under the plan's own rule.

With A3's call-name list, `repoGraph()` gives 237 mapped `*.test.*` files, and 162 of them launch. The plan says "243 tracked test files, 171 start a child process". The 237 matches the runtime check, so the static scan used some other file set. State the counting rule beside each number.

### 14. NOTE — The replay record must not carry account fields.

`gh run list`/`view` JSON can include actor logins. A6 writes replay output into the public lane folder, and the identity scan knows only four words. Have the replay script keep only run id, sha, branch, leg and file. Pass its output through the scan and a hand check before commit.

### 15. NOTE — Existing checks hold.

- `node scripts/lane-class.mjs` prints `ordinary`, both for the plan's file list and with `code-map.test.mjs` and `runtime-map.test.mjs` added.
- `lane-class`, `requirement-rows`, `component-audit` and `blast-radius` read only `repoGraph()`. They stay import-only under A2.
- `npm run map:check` is green at this tip (479 modules, 0 problems).
- The R-3000 fixture (`code-search.test.mjs:42-71`) stays satisfied by the new rules: its non-launching `scripts/reference.mjs` still yields no edge.
- `templates-render.test.mjs:933-934` keeps the template's wording under A1.

### 16. NOTE — Identity scan.

`node scripts/identity-scan.mjs` returns `summary files=4669 findings=0` and exits 0 at this tip. That run covers tracked files only, and the lane folder is untracked. `node scripts/identity-scan.mjs --stdin --root .` exits 0 on both `plan.md` and this file. Re-run the tree scan once the folder is committed.
