**Verdict: SEND-BACK.** One MUST stands. The reader misjudges inline-code launches and drops one real repo launch silently: a test that is neither linked nor on the always-run list. That is the exact harm this brief names. Everything else holds up.

## MUST

**1. The inline-code rule silently drops real launches** (`scripts/code-map-launch.mjs`, in `launchSites`, where `inline` and `inline-no-repo` are worked out).

The reader calls a node launch "inline" when an inline flag (`-e`, `-p`, `--eval`, `--print`, `--input-type`) appears anywhere in its arguments. That includes arguments after the script path, which belong to the child script, not to node. It then decides there is "no repo code" by searching only string literals for `import` or `require`. So two honest spellings get dropped without a report:

- **A child's own `-p` flag.** `packages/nana-pack/tests/review-standard.test.mjs:101` runs `spawnSync(process.execPath, [copyBin, ..., "--", "-p", "review"])`. `copyBin` is a temp copy of `bin/pi-review.mjs`, and the trailing `-p` is pi-review's own argument.
  - The reader classes it `inline-no-repo`, so the map lists no unresolved line.
  - The test is not among the 165 always-run tests, and `--impact packages/nana-pack/bin/pi-review.mjs` does not name it.
  - Main's written map had this edge. The build report lists it as a lost "temporary pack copy". The plan's default for temp copies says they become named unresolved launches and their tests land on the always-run list. For this test, that promise fails.
  - Consequence: a CI selector built on `--impact` would skip this test when `pi-review.mjs`, or any of the roughly ten pack modules the test copies, changes.
- **Inline code in a variable or template string.** Ten or more sites pass `-e` code the reader never inspects. The rule treats them all as "no repo code", which is a guess, not "never guesses".
  - Template strings: `bin/pi-worker.mjs:86` (`import { trustRecord } from ${…}`), `worker-lane.test.mjs:380`, `hook-producers.test.mjs:119` (imports `verifier-hook.mjs`).
  - Variables: `nana-roster.test.mjs:364`, `shared-memory-hook.test.mjs:149`, `shared-memory-input.test.mjs:32`, `review-ledger.test.mjs:1399`, `agent-dir-consumers.test.mjs:47`, `entry-guidance.test.mjs:162`.
  - The runtime map shows other edges cover these today, but only by luck. A path written inside a template string is also invisible to the module-wide path scan. That is why `hook-producers.test.mjs` misses `verifier-hook.mjs` in the runtime gap.

Suggested fix, within the plan's rule 5:
- Count an inline flag only in node's option position, before the first argument that is not a flag.
- Treat an inline-code argument that is not a plain string literal as unresolved.

Add the `-- -p` spelling and a variable-code spelling to the R-3152 fixture, so the test fails if the fix is removed.

## SHOULD (record as FEAT-029 known bugs)

2. **A launch in a ternary's first branch is skipped.** `callsIn` drops any call followed by `:`, treating it as a TypeScript signature, so `cond ? spawnSync(...) : x` is not a site. Eight such sites exist, among them `win32-launch.test.mjs:189` and `:193`, `pi-registration.test.mjs:374` and `pi-install.mjs:30`. Every holding module has other launches or is declared, so nothing is lost today.
3. **A renamed or injected runner is invisible.** Examples:
   - `lane-watcher.mjs:51` runs `start(execPath, [childScript])`, starting `lane-watcher-child.mjs`.
   - `review-movement.mjs:23` runs `run(process.execPath, […requirements-moved.mjs])`.
   - `process-tree-helper.mjs:29` runs `runner("powershell", …)`, a repo-code program the reader never sees.

   The four `hook-producer.mjs` losses are this same pattern (`run = spawnSync`). Their tests are always-run today through other routes, but the pattern is common and unreported.
4. **Three tests are neither linked nor always-run** in the built runtime gap: `config-display-text.test.mjs`, `config-handlers-malformed.test.mjs` and `hive-page.test.mjs`. They load extensions and hive modules through computed `import(new URL(…).href)` and template specifiers, not child processes. This gap exists on main and is outside this lane, but the CI lane must know about it. The plan's residual line says these "stay unresolved or declared"; in fact they are neither.
5. **The plan's six residual known-bug lines are not in the FEAT-029 file.** Missing: template unchanged, other graph readers import-only, path-as-text edges, no npm-script inference, unmapped non-code files and no machine-readable output, and the extension, hook and hive cases. The build report hands them to the seat. Only three new lines landed, and the rules say they must go in before the final round.

## Checked and fine

- **The 11 lost links.** Apart from `review-standard.test.mjs`, the other ten are covered:
  - The two wrong basename guesses (`objective-golden`, `stale-copies`): both tests are always-run.
  - The deleted-checkout command text and the temp copies (`hooks-win32-exec`, `copy-record`): `hooks-win32-exec` is declared, and `copy-record` is unresolved with its binding lines, so it is always-run.
  - The twice-bound `pkg` (`pi-registration`): declared.
  - The four `hook-producer.mjs` losses: both hooks that call `runHookProducer` (`claude/hooks/nana-objective.mjs`, `nana-adoption.mjs`) are declared. `hook-producers`, `hook-deadlines` and `stale-copies` tests are declared. `frontier-hook`, `install` and `hooks-closed-output` reach the declared hooks.
- **Runtime gap.** Of the 18 gap files, 15 are always-run. The other three are the dynamic-import cases in item 4.
- **The skips the brief asked about.** Two function definitions, comments, regex literals, the `issue-watch` object-method stub and the `lane-class` source-text assertion are truly not launches.
- **Existing callers.** `--impact` keeps the generator's format, then artifacts, then runtime. The artifact radius stays import-only and now says so. `map:check` exits 0, `readme:check` exits 0, and `repoGraph()` is unchanged. The touched tests pass locally: 7 files, 108 checks, 0 fail. That covers code-map, code-search, runtime-map, blast-radius, component-audit and requirement-rows.
- **CI.** The Linux leg's SIGKILL in `worker-claude.test.mjs` is advisory and is recorded as a known bug.

My scratch scripts sit in the OS temp folder, outside the worktree; I edited no repo files.

VERDICT: SEND-BACK
