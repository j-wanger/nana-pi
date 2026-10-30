# map-spawn-edges — plan (revision 2)

Lane class: `ordinary` (printed by `node scripts/lane-class.mjs --root . --files scripts/code-map-launch.mjs,scripts/code-map-launch-config.mjs,scripts/code-map.mjs,code-map.config.json,docs/code-map.md,packages/nana-pack/tests/code-map-launch.test.mjs,packages/nana-pack/tests/code-map.test.mjs,packages/nana-pack/tests/runtime-map.test.mjs,packages/nana-pack/tests/code-search.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md,README.md,docs/known-bugs/FEAT-029.md,docs/reviews/map-spawn-edges-2026-10-29/plan.md,docs/reviews/map-spawn-edges-2026-10-29/prototype-edges.mjs,docs/reviews/map-spawn-edges-2026-10-29/scan.mjs,docs/reviews/map-spawn-edges-2026-10-29/replay.mjs`).

Revision 2 takes the adversary's attack (`plan-attack.md`): all four MUST findings and SHOULDs 5, 6, 7, 9 and 12, plus the cheap parts of 8, 11, 13 and 14. Base: `feat/map-spawn-edges` at 7a96d6db, a merge of main at 57167e92 (adds the `apps/hive` map root). All numbers below are re-taken on that tree.

## Purpose

The owner's words, 2026-10-29: he wants selective CI later — pull requests run only the test files a change can reach, plus the document checks, and the full suite runs on all three systems on main after each land. His condition: "make sure we harden code map to cover path based child processes".

This lane is that hardening only; the CI change is a later lane. The agreed reading is the owner's own. The code map links a test to every repo module it starts as a child process by path, and `map:impact` walks those links. Where the map cannot resolve a launch, it names that launch and every test that can reach it, so a later selector can run those tests instead of trusting a partial set. The map never guesses.

### Measured on the merged tree (seat scan and prototype in this folder)

The seat's prototype of the rules below is `prototype-edges.mjs`; `scan.mjs` prints every count in this section; `replay.mjs` prints the replay. All three run from the repo root. The prototype is regex-level and overcounts unresolved launches (it matches launch names in comments and regex literals, and follows helper parameters only roughly). The builder re-runs both scripts against the built linker (`MAP_EDGES=built`) and reports the real numbers.

Counting rule: a test file is a mapped module under a `layerExempt` root whose name matches `*.test.{mjs,ts,js}`. A file "holds a launch" when it contains a bare call to one of the nine launch names (`spawn`, `spawnSync`, `exec`, `execSync`, `execFile`, `execFileSync`, `fork`, `boundedSpawnSync`, `runHookProducer`) or a member call on `cp`, `childProcess` or `child_process`, never a method call such as a regex's `exec`.

- 239 test files; 156 hold a launch.
- Edges: 1326 import edges. Today's launch links add 127. The new rules add 325 non-import edges.
- Edges lost against today's map: 7, each named in R-3156. Two are basename guesses to the wrong file (each test runs the hook of the same name, and the new rules link that hook). One is command text for a deleted checkout inside a settings fixture. Three launch a temp copy of the repo or the pack, so they become named unresolved launches. One is a name bound twice in the module (`pkg`), so it does not trace.
- Runtime check (the runtime map at 57167e92, 239 measured files, child processes included):
  - Import-only `--impact` misses 118 files, 260 launched entry points, 56 distinct modules.
  - Today's launch links miss 88 files, 154 entry points, 46 modules.
  - The new rules miss 12 files, 30 entry points, 22 modules. The rest: `lane-watcher-child.mjs` relaunching itself through `process.argv[1]` (6), pi loading the pack's extension folders (8 extension files), hooks reached through an installed `settings.json` (5), `apps/hive` modules a browser loads (4), and five bins or hooks started by a temp-copy path.
- Launch sites (prototype classes): 306 resolved, 265 external programs, 30 inline code with no `import` or `require`, 136 unresolved node launches, 106 with a program the scan cannot trace, 19 under pi or a shell, and 5 inside exported wrappers.
- Blind reach, the MUST 3 rule: 112 modules hold a launch the map cannot resolve. 170 of 239 tests (71%) hold one or reach one through enriched callees. Test files that hold one themselves: 72 (30%). The non-test hubs that drive the reach are `apps/bench/lib/checkers.mjs` (108 tests), `packages/nana-pack/lib/process-tree.mjs` (101), `scripts/runtime-measure.mjs` and `scripts/test-locked.mjs` (100 each), `packages/nana-pack/bin/pi-watchdog.mjs` (86) and the desk modules (80 to 82). Inferred, not confirmed: much of this is prototype noise. Even so, a selector under this rule would run most of the suite until hub launches resolve or are declared. That is Question 1.
- `map:search` neighbours: 146 modules gain callees. The largest gains are `lane-class.test.mjs` +23, `requirements-regroup.test.mjs` +16, `runtime-map.test.mjs` +13, `steps.mjs` +7.

Replay of failed CI (`replay.mjs`, recorded measurement, not a suite test):

- Window: all 182 failed `ci` runs that `gh run list --limit 200` returns, 2026-10-08 to 2026-10-29. The replay covers the 154 pull_request runs; push runs on main already run the full suite.
- Each failed suite job's base is read from its checkout log. That base is the main revision the tested merge ref used (the `HEAD is now at … Merge <head> into <base>` line). The diff runs from the merge base of that base and the head to the head. Each pair's failing files come from the suite runner's last `failed:` line on that leg.
- A pair is red on base when the same file failed on the same leg in a CI run of the base revision; those are excluded.
- Whole window: 4363 (run, leg, file) pairs. 3326 (run, file) pairs failed on Windows only; this is the period when the Windows leg was widely red. 1477 pairs are red on base and 1 names an unmapped file, leaving 2885.

| Class | All | macOS | Linux | Windows |
|---|---:|---:|---:|---:|
| changed test file selects itself | 199 | 10 | 11 | 178 |
| import edges | 218 | 35 | 41 | 142 |
| plus today's launch links | 66 | 8 | 7 | 51 |
| plus the new rules' edges | 51 | 10 | 9 | 32 |
| always-run through blind reach | 1823 | 143 | 133 | 1547 |
| missed: a changed file outside the map | 339 | 1 | 25 | 313 |
| missed: nothing reached | 189 | 3 | 10 | 176 |
| excluded: red on base, same leg | 1477 | 112 | 128 | 1237 |

- Since 2026-10-24, after the Windows leg turned green: 22 pull_request runs, 37 pairs, 27 of them Windows-only. 26 select themselves as changed tests, 1 through imports, 1 through today's launch links, 3 only through the new edges, and 6 only through always-run. None are missed, and none are red on base.
- Honest reading: on the whole window, edges alone pick 534 of 2885 (19%). Always-run picks 1823 more, and 528 (18%) are missed. Of the misses, 339 changed a non-module file (workflow, `package.json`, `templates/`, fixtures), which the CI lane must handle. The new edges add 51 pairs over today's map. Most failures are Windows-only or red on base: a selector would push those to the post-land Windows run on main, and the CI lane must plan for that.

## Assumptions

- A1. The template generator (`templates/typescript/template/scripts/code-map.mjs`) stays unchanged. All new rules live in nana-pi's shim layer (`scripts/code-map-launch.mjs`, `scripts/code-map-launch-config.mjs`, `scripts/code-map.mjs`), as R-3000 did. Other projects gain nothing; recorded as a known bug.
- A2. Only `--impact`, `--check` and the written map change. `repoGraph()` stays import-only, so `scripts/lane-class.mjs`, `scripts/requirement-rows.mjs`, `scripts/component-audit.mjs` and `scripts/blast-radius.mjs` keep today's output. Two consumers read the changed surfaces and are named here:
  - `--impact`'s artifact block (`scripts/code-map.mjs` `artifactBlock`) keeps the import-only radius from `repoGraph()`, which matches its `(no import path)` label. One `--impact` output therefore shows enriched callers above an import-only artifact flag, and the block's closing note says so.
  - `map:search` (`scripts/code-search.mjs`) parses callers and callees from `docs/code-map.md`, where the new edges land, as R-3000's launch links already do. R-3007's floor test reads only fixed historical maps, so the suite cannot see the change. The builder runs the ten R-3007 needs against a map regenerated at the built tip and records the share. If the share falls below the 0.75 floor, path-only edges are dropped from the search walk and listed on their own map line.
- A3. Launch names are sealed in `scripts/code-map-launch-config.mjs`. They are the nine names above, as a bare call or as a member call on `cp`, `childProcess` or `child_process`.
- A4 (kept, with MUST 4's option b). A launch is a node launch when its program is `process.execPath`, the literal `node`, a `fork` call, or a module-extension path. That holds whether the program is written directly, through a local constant, or through a helper parameter bound at its call sites. Literal programs outside the sealed repo-code list are external commands; they are not reported. Launches under a sealed repo-code program (`pi` and its constants, `bash`, `sh`, `cmd`, `powershell`, `pwsh`) are reported and need a declaration (R-3155). So is a program that does not trace.
- A5. The runtime map stays a separate signal. This lane does not merge measured tests into the static walk; `--impact` already prints them below.
- A6. `replay.mjs` and `scan.mjs` live in this folder and run against the prototype now and the built linker after build 1. Their records keep only run id, short sha, branch, leg and file. Their output passes the identity scan and a hand check before it is committed.
- A7. Every path expression in a module that starts a child process counts, not only expressions that reach a launch argument; a module that starts nothing gets no edge from a path it names (R-3000's clause holds). Accepted residual, the FEAT-029 precedent: a spurious edge from a path a launching module only reads as text is better than a lost one.
- A8. The npm-script and bin-name rule of revision 1 is dropped: nothing in the repo launches `npm run <name>` or a package bin by command name (attack SHOULD 9; the only npm launch is `npm root -g`). R-3151 stays unused, and a known-bug line records the gap.
- A9. Machine-readable impact output (attack SHOULD 10) is the CI lane's work. This lane keeps impact as text and records the gap, along with the fact that the map already lists `external` imports into ignored roots.

## Open choices

- O1. The builder picks the map-entry line format for unresolved launches and repo-code launches (for example `- **unresolved launches** — line 42: \`[bin, ...args]\``). It must carry the line number, contain no absolute path, and stay stable across platforms.
- O2. The builder picks how `--impact` marks a caller reached only through a launch or path edge, and the wording of the blind-reach line. Both are then sealed in the config module.
- O3. The untraced-test line moves to the shim's own wording. R-2822's order check, which today searches for a string the output never prints (`runtime-map.test.mjs:204`), is fixed to search for the new wording.
- O4. The builder may scope a name bound twice (a nested `const pkg` shadowing a module-level one) to the module level, if a fixture pins it. Otherwise a twice-bound name does not trace, and its edge is named in R-3156's loss list.

## Questions for the owner

Question: The reach rule puts most of the suite on the always-run list (prototype: 170 of 239 tests, driven by a few hub modules). Should this lane only report that list, or also add a reviewed declaration list that resolves a hub's launch by hand?
Default: report only — the map names each unresolved launch, `--impact` names every test that holds or reaches one, and the builder records the real share; a declaration list is the CI lane's first step.
What the default gains and misses: gains a lane that changes no selection policy and keeps "never guess" pure; misses a usable selector until the CI lane lands, since a 71% always-run share would leave little to save.
Cost of a wrong guess: easy to undo — a declaration list reads the same unresolved lines this lane writes.
If answered otherwise: add a `launchResolutions` config list (module, call-line text, resolution `external` or a repo path, reason); `map:check` fails when an entry stops matching its line; the builder seeds it for the ten largest hubs and reports the share again.

Question: A launch through an anchor that does not trace — a temp copy of the repo, `join(tmp, "packages", …)` — could still link when its literal tail spells a mapped module's full repo path. Should it?
Default: no — it stays an unresolved launch; 3 of today's edges become named unresolved launches, and their tests land on the always-run list rather than losing selection.
What the default gains and misses: gains one rule with no heuristic, so "never guesses" holds; misses 10 edges (prototype count) a full-path tail rule would add, which would shrink the always-run list slightly.
Cost of a wrong guess: easy to undo — the tail rule is one declared branch in the linker.
If answered otherwise: add the full-path tail as a declared heuristic, name it in R-3149's row, mark those edges in the map, and drop the three copy cases from R-3156's loss list.

Question: Should the other graph readers — lane class, requirement rows, the blast-radius page, the component audit — get the new edges now?
Default: no; only `--impact`, `--check` and the written map change.
What the default gains and misses: gains no change to review ladders, since lane class's hook-hop rule would otherwise class more lanes as hook lanes; misses requirement-row recall and a blast-radius page that shows launch-only tests.
Cost of a wrong guess: easy to undo — each reader switches to the enriched graph in its own lane.
If answered otherwise: `repoGraph()` returns the enriched graph, and the builder re-runs each reader's tests and records changed outputs.

## Feature

Feature: FEAT-029 · Navigate code and investigate impact

Rows: R-3149, R-3150, R-3152 to R-3160 are new. R-3151 is left unused: it was planned in revision 1 and dropped (A8), and it never entered the ledger. Main's highest row is R-3148, and no open lane claims a higher one.

Existing rows:
- R-3000 stays `implemented`. Its clause that a named path in a module that launches nothing is no edge is kept, and its fixture stays satisfied.
- R-1272 and R-2822 are amended in this lane. Each says impact prints "the code-map generator's output byte for byte", which stops being true. The new text: impact prints the shim's launch-aware impact block (the generator's format, with launch-reached callers marked and the blind-reach line), then the artifact block, then the runtime block. Their tests keep comparing shim runs, and R-2822's order check is fixed (O3).

## Threat model

In scope: honest variation in our own tools' output and in how our code spells a launch. That covers:
- a path through a local or imported constant, `new URL` against `import.meta.url`, `dirname(fileURLToPath(import.meta.url))`, `join` or `resolve` of resolved directories and literals;
- a helper's parameter, a twice-bound name, a temp copy;
- Windows backslashes in a literal, a file renamed since the map was written.

It also covers honest variation in CI logs (child runners printing their own `failed:` lines, Windows-only failures, a red base) and in git history for the replay.

Out of scope: deliberate forgery — code written to hide a launch from the map (a path assembled from computed strings, `eval`, a launch through an environment variable set elsewhere). A finding outside the model is a residual and goes to the feature's known-bug file.

## Precedent

- `scripts/code-map-launch.mjs` — the launch linker this lane rewrites: the balanced-argument reader (`callEnd`), local-constant following, reciprocal sorted caller/callee edges. Keep its shape. Replace the `scripts/`/`bin/` target filter and the unique-basename fallback with the anchor rule in R-3149.
- `docs/reviews/map-spawn-edges-2026-10-29/prototype-edges.mjs` — the seat prototype of these rules. The builder may lift code from it but must not copy its known shortcuts, which are marked APPROX (the comment and regex-literal hits, the rough helper-parameter search).
- `scripts/code-map.mjs` — the shim: `checkRepo`, `writeMap`, `renderRepoMap` already add launch links; `--impact` falls through to the template's `main`. The change routes `--impact` through the enriched graph using the exported `impact` and `formatImpact`, and adds the blind-reach line. `artifactBlock` stays on `repoGraph()` (A2).
- `templates/typescript/template/scripts/code-map.mjs` — `buildGraph`, `impact`, `untracedTests`, `formatImpact`, `external`; read-only for this lane (A1).
- `scripts/code-search-config.mjs` with its seal tests in `packages/nana-pack/tests/code-search.test.mjs` — precedent for the new `scripts/code-map-launch-config.mjs` and its one-test-per-sealed-value pins.
- `packages/nana-pack/tests/code-search.test.mjs` (R-3000 test, lines 42-71) — the fixture-repo pattern with `tmpDir`, `put` and header helpers; new tests follow it. Its R-3007 test (`gitShow` of fixed bases) is the precedent for R-3156's pinned comparison against a fixed revision.
- `packages/nana-pack/tests/code-map.test.mjs` — the untraced-line test (line 224 builds its count from the import graph); it changes with R-3154.
- `packages/nana-pack/tests/runtime-map.test.mjs` (R-1272 lines 171-192, R-2822 line 204) — the impact-output ordering tests that change with the R-1272 and R-2822 amendments.
- `packages/nana-setup/lib/paths.mjs` (`pkgRoot`, `repoRoot`, `realPath`) — the most-used imported anchors. The rule must trace them, and `realPath` is on the sealed path-preserving list.
- `map:search` results taken: `scripts/code-map.mjs`, `scripts/code-map-launch.mjs`, `scripts/requirement-rows.mjs`, `scripts/runtime-measure.mjs`, `scripts/code-search.mjs`. For the unresolved report it suggested nothing closer than the linker itself.
- Map impact forecast: `scripts/code-map-launch.mjs` reaches 6 tests (`blast-radius`, `code-map`, `code-search`, `component-audit`, `requirement-rows`, `runtime-map`) and the scripts `blast-radius`, `component-audit`, `lane-class`, `requirement-rows`. `templates-render.test.mjs:933-934` asserts the template's untraced wording for scaffolds and must stay green unchanged (A1). README text that names the import-only behaviour: the root `README.md` code-map paragraph and the `docs/code-map.md` header.

## Outside precedent

- Pants build system (Apache-2.0), dependency inference — borrow. Its `[python-infer].assets` option infers a dependency from a string that looks like a file path, and `unowned_dependency_behavior` (error, warning or ignore; default warning) reports an inference it cannot attribute rather than guessing. This lane borrows both: a path that resolves becomes an edge, and a launch that does not resolve is reported. It does not adopt Pants or its per-line `no-infer-dep` pragma. Sources: https://www.pantsbuild.org/stable/reference/subsystems/python-infer and https://www.pantsbuild.org/blog/2022/10/27/why-dependency-inference.
- Also looked at: Jest `--findRelatedTests` and Nx affected, which select tests from an import or declared project graph and infer no launch edges.

## The rules, stated exactly

1. **Launching module.** A module that holds a launch (A3).
2. **Path value.** An expression evaluates to a repo path only through these forms, recursively:
   - `import.meta.url` (this file), `import.meta.dirname`;
   - `new URL(<literal>, <path value>)`, with URL semantics (`"."` and `".."` give a directory);
   - `dirname(<path value>)`;
   - `join` or `resolve` (bare, `path.`, `posix.`, `win32.`) whose first argument is a path value and whose other arguments are string literals, or names bound to literals;
   - a sealed path-preserving one-argument call (`fileURLToPath`, `realpathSync`, `realpathSync.native`, `realPath`), and a `.href` or `.pathname` read;
   - a name bound once in the module by `const`, `let` or `var` to a path value, or a named import of such a constant from a mapped module.

   A path that leaves the repo, a name bound twice with different values, or any other anchor (`tmpdir()`, `mkdtempSync`, `process.cwd()`, a parameter, a template literal) gives no path value. There is no suffix or basename matching.
3. **Exact literals.** In a launching module, a string literal, or a `join` of only literals, that equals a mapped module's repo-root path exactly, or `./`/`../` relative to the file, names that module. A launch-argument literal also resolves from the file's folder (R-3000's kept behaviour).
4. **Edges.** Every path value or exact literal in a launching module that names a mapped module, other than the module itself, is a reciprocal callee/caller edge in the written map, `--check` and `--impact`.
5. **Launch site classes.** For each launch call:
   - The program is traced like a path argument: a local constant, or a helper parameter followed to every call site of that helper in the same module.
   - A node launch is **resolved** when at least one argument traces to a mapped module and no call-site binding of a traced parameter fails to trace.
   - A node launch whose arguments carry an inline-code flag (`-e`, `-p`, `--eval`, `--print`, `--input-type`) is **inline**. It is resolved when an argument traces to a mapped module. With no `import` or `require` in its arguments, it runs no repo code and is not reported. Otherwise it is unresolved.
   - Every other node launch is **unresolved**, and so is a launch whose program does not trace. Each unresolved launch is listed with its line number, plus the line of each failing call-site binding.
   - A launch under a sealed repo-code program (A4) is a **repo-code launch**.
   - A launch whose program is a parameter of an exported wrapper with no local call sites is resolved at its callers only when the wrapper's name is on the sealed launch-name list. Otherwise it is unresolved.
   - Path expressions that are not launch arguments and do not resolve are dropped without a report, since only launches are reported.

## Must-meet

Each test builds a throwaway fixture repo with its own `code-map.config.json`, as R-3000's test does, unless it says otherwise. Each carries its `req:` marker directly above the test call.

1. **R-3149 — anchors resolve exactly.** WHEN a launching module names a mapped module through `new URL(lit, import.meta.url)`, a constant `bin = join(dirname(fileURLToPath(import.meta.url)), "..", "bin")` then `join(bin, "t.mjs")`, an imported directory constant from another mapped module, or a launch-argument literal, nana-pi's map shall link that module whatever root it sits under. WHEN the anchor comes from `mkdtempSync`, the map shall link nothing. Fixture cases: `lib/x.mjs` spawns `new URL("x-child.mjs", import.meta.url)`; `tests/b.test.mjs` uses the `bin` constant; `lib/paths.mjs` exports `root`, and `tests/c.test.mjs` imports it and spawns `join(root, "apps", "s.mjs")`; `tests/d.test.mjs` spawns `["scripts/tool.mjs"]`; `tests/e.test.mjs` spawns `join(tmp, "bin", "t.mjs")` with `tmp = mkdtempSync(...)`. Pins: the first four edges exist in the written map's caller and callee lists. `tests/e.test.mjs` has no edge to `bin/t.mjs`, and its launch is listed unresolved.

2. **R-3150 — paths in a launching module count; a helper's spawn is judged per site.** WHEN a launching module holds a path value naming a mapped module, the map shall link it, including one that reaches a launch through a helper parameter. WHEN every call-site binding of that parameter traces, the helper's launch shall not be listed unresolved. WHEN one binding does not trace, the launch shall be listed with that call site's line. WHEN a module starts no child process, a path it names shall create no edge. Fixture: `tests/w.test.mjs` holds `const CLI = join(here, "..", "bin", "t.mjs")` (with `here` from `import.meta.url`), `function run(file) { return spawnSync(process.execPath, [file]); }` and `run(CLI)`. `tests/v.test.mjs` holds the same helper called once with `CLI` and once with `process.argv[2]`. `scripts/reference.mjs` holds `const named = join(here, "..", "bin", "u.mjs")` and launches nothing. Pins: `bin/t.mjs`'s callers include both tests. `tests/w.test.mjs` has no unresolved launch line. `tests/v.test.mjs` has one, naming the `process.argv[2]` call line. `bin/u.mjs` has no callers.

3. **R-3152 — unresolved launches are listed, never guessed.** WHEN a node launch is unresolved under the rules above, the map shall create no edge for it and shall list it under that module's entry with its line number; `map:check` shall fail while the list is stale. Fixture: a test spawns `[join(root, "bin", "x.mjs")]` where `root` is a parameter, `["x.mjs"]` (a bare basename with no such file beside it or at the root), `["-e", "import('./lib/a.mjs')"]`, and `["-e", "setInterval(() => {}, 1000)"]`. Pins: no edges; three unresolved lines with their line numbers; the timer-only inline launch is not listed. After adding a fourth unresolved launch without regenerating, `map:check` exits 1 naming the stale map. This retires the unique-basename fallback in `scripts/code-map-launch.mjs`.

4. **R-3153 — `--impact` names every test that can reach a blind launch.** WHEN `map:impact` runs on a file, nana-pi shall list as transitive callers every test that reaches it through imports, launch or path edges, marking those reached only through a launch or path edge. It shall also print the count and names of every test that holds an unresolved or repo-code launch, or reaches a module holding one through enriched callees. Fixture: R-3149's repo, plus `lib/y.mjs` holding an unresolved launch and `tests/y.test.mjs` importing `lib/y.mjs`. Run through the shim with `--impact lib/x-child.mjs`. Pins: the test that reaches `lib/x-child.mjs` through `lib/x.mjs` is listed with the launch mark. The blind-reach line names `tests/y.test.mjs` and `tests/e.test.mjs`. Wording per O2, then sealed.

5. **R-3154 — the untraced count counts launch links.** WHEN `map:impact` prints the untraced-test line in nana-pi, a test that links to a mapped module only through a launch or path edge shall count as traced, and the line shall not say that a test which only starts a process is unlinked. Fixture: three tests — one imports a module, one only launches `bin/t.mjs` by a traced path, one does neither. Pins: the line reports 1 untraced of 3, a number written in the test. `templates-render.test.mjs` keeps the template's own wording for scaffolds.

6. **R-3155 — repo code under other programs is declared, never dropped.** WHEN a launch runs under a sealed repo-code program, or its program does not trace, the map shall list it under the module's entry. `map:check` shall fail while such a module is missing from the config's `launchAlwaysRun` list, each entry a path with a reason, and `--impact`'s blind-reach line shall name every test that holds or reaches a declared module. Fixture: `tests/p.test.mjs` spawns `pi` with `["-e", join(here, "..", "extensions", "e.ts")]`; `tests/q.test.mjs` spawns `bash` with `["-c", "node bin/t.mjs"]`. Pins: with an empty list, `map:check` exits 1 naming both modules. With both declared, `--check` passes, and the blind-reach line names both tests. The extension edge from `tests/p.test.mjs` still exists, because the path rule applies inside the arguments.

7. **R-3156 — no edge vanishes unnamed.** WHEN the map is regenerated, every callee each module had in `docs/code-map.md` at 57167e92 shall still be its callee, or shall appear in the test's named loss list with a reason. The comparison reads the old map with `git show`, as R-3007's test does. The list holds the seven losses measured above:
   - `objective-golden.test.mjs` → `bin/nana-objective.mjs`, a basename guess;
   - `stale-copies.test.mjs` → `bin/nana-adoption.mjs`, a basename guess;
   - `hooks-win32-exec.test.mjs` → `nana-knowledge.ts`, command text for a deleted checkout;
   - `hooks-win32-exec.test.mjs` → `bin/nana-setup.mjs`, a worktree copy;
   - `copy-record.test.mjs` → `bin/nana-setup.mjs`, a repo copy;
   - `review-standard.test.mjs` → `bin/pi-review.mjs`, a pack copy;
   - `pi-registration.test.mjs` → `bin/nana-setup.mjs`, a twice-bound `pkg`.

   The builder may shorten the list and must not lengthen it without naming each addition in the build report. Pins: the comparison passes with the list. Removing one entry fails, naming that edge.

8. **Seals (one test each, each naming its row).**
   - R-3157: the launch names are the nine in A3.
   - R-3158: the path-preserving calls are those in rule 2.
   - R-3159: the repo-code programs are those in A4.
   - R-3160: the inline-code flags are those in rule 5.

   Every other assertion imports these names rather than restating the literals.

### Recorded measurements (seat checks after build 1, not suite tests)

- `node docs/reviews/map-spawn-edges-2026-10-29/scan.mjs` with `MAP_EDGES=built`, after `npm run map:measure` on the built tip:
  - the runtime gap against the prototype's 12 files and 22 modules;
  - the lost-edge list against R-3156's seven;
  - the blind-reach share against the prototype's 170 of 239.
- `node docs/reviews/map-spawn-edges-2026-10-29/replay.mjs --rows` with `MAP_EDGES=built`, for both the whole window and `--since 2026-10-24`: the class table split by leg, against the tables above. Record the outputs in this folder after the identity scan and a hand check.
- The R-3007 search share on a map regenerated at the built tip (A2).

### Known bugs to record at land (FEAT-029 file)

- The template generator gains none of this; other projects' maps stay import-only (A1).
- Lane class, requirement rows, the blast-radius page and the component audit still read the import-only graph, and the impact artifact block keeps its import-only radius (A2).
- A path a launching module only reads as text becomes an edge (A7).
- Nothing resolves `npm run <name>` or a package bin by command name; no launch of either kind exists today (A8).
- Files outside the map — workflows, `package.json`, `templates/`, fixtures, HTML — reach no test, and impact prints only the not-mapped marker for them; 339 of the replay's 2885 pairs were of this kind. Impact has no machine-readable form yet (A9).
- A self-relaunch through `process.argv[1]`, extensions pi loads from a manifest folder, hooks reached through `settings.json`, and browser-loaded `apps/hive` modules stay unresolved or declared, never linked.
