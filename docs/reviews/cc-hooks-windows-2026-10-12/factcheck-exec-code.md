The plan's code claims mostly check out. Below are the corrections, the readers that mishandle exec form, and the missing scope.

**What checks out.** I verified these at `c22bab5`:
- `settings.mjs`: `:26`, `:91-97`/`:93`/`:96`, `:106-107`, `:118`, `:122-178`, `:131`, `:159`, `:203`, `:248`, `:268-296` (`:269-273`, `:276`, `:291`), `:298-319`, `:340`.
- `steps.mjs`: `:102`, `:505-509`, `:516`, `:524`, `:687`, `:984`.
- `doctor.mjs`: `:296`, `:335`, `:379-392`, `:514`.
- `verifier-hook.mjs:14`; `uninstall.mjs:24`, `:32`, `:41`; `hook-producer.mjs:32-33`; `pipe-guard.mjs:85`, `:93`; `paths.mjs:39-40`; `config.ts:369`/`:378`; `nana-pack/bin/nana-objective.mjs:36`.
- `scripts/test.mjs` `SKIPS` at `:155` and the no-PASS rule at `:372-374`; `test-runner.test.mjs:222`.
- `ci.yml:2-5`, `:21`; `templates-render.test.mjs:277-278`, `:316`; `requirements-tree.test.mjs:38`, `:52` (1,033); `win32-degrade.test.mjs:37-41`, `:68`, `:85`.
- `HANDOFF.md:18/56/57/78`; triage `:24-28`; the memory note lines `:3/:9/:16` and `:8/:10`; `CLAUDE.md` is a symlink.
- All row IDs and their features are right. The highest row is R-1039 on main and R-1043 on product-report, so R-1050 onward is free.
- The import closure is exactly 28 files with one npm import (`config.ts` → `@earendil-works/pi-coding-agent`).
- The docs confirm exec form, `shell` "Ignored when `args` is set", the `.exe` requirement, `CLAUDE_PROJECT_DIR` exported in both forms, `Bash|PowerShell` read as a list of exact names, and the PowerShell `tool_input.command` field.

**Corrections**
1. **Mutation 7 cannot turn the second-install case red.** In the design, `mergeRepoHooks` matches all five installer-shaped exec entries first. `stepSettings` then passes only unmatched entries to `mergeHooks`. So `hasHook` is never asked about them on the second install. With `hasHook` reading `command` only, "second install reports nothing to do" still passes.
   - What actually goes red: the pure exec-form `hasHook` case, plus win32 doctor ✓ (`hasHook` feeds R-1055) and `win32-degrade` "no ✗".
   - The sentence in section 3 has the same flaw: "mergeHooks reads presence through hasHook, so the same rule stops a second win32 install from appending duplicates". `hasHook` matters only for variants that are not installer-shaped (R-923).
2. `win32-degrade.test.mjs:64-66` should be `:65-67`. Line 64 is the R-589 PATH check. The rewrite also needs `:81-82`: `cmds` maps `h.command`, which becomes `"node"`.
3. **R-387 has two tagged checks, not one.** The plan moves only `:86-87`. `:83-84` ("only the knowledge hook is wired") is R-387's cited evidence and becomes false with five entries. Its tag must be retagged or dropped when R-387 retires. INFERRED: the trace rail flags live tags on a retired row.
4. **`win32-degrade.test.mjs:89` would pass silently.** `entry.command.includes("verifier-pipe.mjs")` is false for `command:"node"`, so "no verifier installed" passes while the verifier is installed. `:85` (`startsWith("NODE_NO_WARNINGS=")`) and `:87` (`includes("bash ")`) also pass vacuously in exec form. They are weak proof for R-1050; assert `command === "node"` and the shape of `args`.
5. `settings-merge.test.mjs:244`, `:315` and `retired-artifacts.test.mjs:172` already fail on the Windows leg today (triage `:76`, `:144`). Exec form does not newly break them. `settings-merge` also stays red on Windows after this lane because of the mode bits (`:252/:355/:508`), `:526` (hooks symlink) and the POSIX-only legacy migration (`:549-559`).
6. Case (d) says the hooks folder is embedded at `settings.mjs:131, :172`. `:172` embeds the checkout path a second time; the hooks folder is embedded at `:125` and `:132`.
7. The product-report tip is `7e6ce39`, not `4b3846e`: it is 3 commits past and has merged `c22bab5`. It also edits root `README.md` (a new section near `:241`, which does not touch `:5`). After it lands, the HANDOFF line to correct moves from `:57` to `:58`.
8. **R-937 conflicts with R-1057 and R-1055.** On win32, the Node row and the five settings rows can now be ✗, so doctor exits 1. R-937 says "exit 0 without a ✗"; qualify it rather than leave it "unchanged".
9. **R-985 is overclaimed.** Its rewording to "on every platform" leaves two tagged tests pinning the "Bash PreToolUse Node hook" matrix text that the plan admits is incomplete for win32: `templates-render.test.mjs:288-298` (`req: R-680 R-985`) and `verifier-pipe.test.mjs:122-123`. The plan names only `:123`. Carry the matrix gap as a residual on R-985.

**Readers of `entry.command` that mishandle exec form**
- Fixed by the plan:
  - `settings.mjs:203` `hasHook`: `tokenize("node")` gives `["node"]`, so no target and false, and install appends duplicates.
  - `:277` `installerKnowledgeTarget(hook.command)`.
  - `:305-310` `knowledgeHookHealthy`.
- Declared and left alone:
  - `steps.mjs:483-501` and `doctor.mjs:39-53` retired scans miss an exec-form `bash` + `.sh`.
  - `uninstall.mjs:31-33` never reports an exec variant.
- Safe by key checks:
  - `migrateLegacyHooks` `:334` requires exactly four keys; it is POSIX-only and gets no platform.
  - `removeRetiredContextHook` `:214` requires exactly two keys.
- Tests not in scope:
  - `install.test.mjs:128` (collects `h.command`), `:136` (`c.includes(path.join(repo,…))`), and `:316-330` (`cmds.every(c => c.includes("'"))`, then `bash -c` per command). On win32, `:324` gets `find()` → `undefined` → `spawnSync` throws. This block carries R-319's cited evidence (`:329`); gate it to POSIX. Today the Windows leg never reaches it because it crashes earlier at check 39.
  - `settings-merge.test.mjs:23` and `:155-174` import and call `mergeKnowledgeHook` with `{repoRoot, desiredCommand}` and expect `{replaced, added, staleValid}`. The rename to `mergeRepoHooks` with a new return breaks these checks (tagged R-394 and R-653). The plan lists only `:244` and `:315`.
- Lower priority, in the design itself:
  - `installerTarget`'s POSIX form and the earlier win32 form check `command` only. Require that `args` is absent. Otherwise an entry carrying `args` is treated as shell form by the repair but as exec form by `entryInvokes` and by Claude Code.

**macOS/Linux.** The write side is unchanged as long as non-win32 `desiredHooks` and the POSIX `installerTarget` branch stay byte-identical. The read side changes in three ways, and only the first is declared (outcome 6).
1. Exec entries count as present. Failure case: a settings fragment copied from Windows (`command:"node"`, `args:["C:\\…/nana-objective.mjs"]`). `entryInvokes` matches it because the arg ends with `/nana-objective.mjs`. POSIX install then adds no working entry, and POSIX doctor shows ✓ for the four hook rows (`hasHook` only) while the hooks cannot run.
2. For the knowledge pull, doctor turns ✗ (the target is not absolute on POSIX) while install says "already wired". That is the bug-4 pattern again on POSIX.
3. An entry with `args` whose `command` holds a shell-form invocation now reads as not installed. Install adds a twin and doctor flips from ✓ to ✗.

"It must not change" therefore fails. The simplest fix is to read exec form only when the platform is win32, which makes POSIX behaviour identical to main.

**Missing scope**
- No named suite test covers R-1055 (a stale or out-of-checkout target gives ✗ on win32) or R-1057 (win32 Node row). Mutations 11 and 12 cite cases that exist only in the acceptance script. Add forced-win32 cases to `doctor-detail` or `win32-degrade`.
- R-1058 can be pinned only by the non-blocking Windows leg. Say so in its status.
- Product-report's assessments (`docs/product-report/assessments.json`) carry stamps for the affected features and rows, including SUB-015's purpose line. They will show as out of date after this lane. They do not fail any check, but declare it.
- `verifier-pipe.test.mjs` still crashes at `:37` on the Windows leg, because no hooks folder exists on win32. Its rewritten `:128-133` checks run only on macOS.
- Optional: the setup README test table (`:431`) still describes `win32-degrade` as "every posix-only step reporting skipped".
- Low-priority residuals:
  - Exec form substitutes `${CLAUDE_PROJECT_DIR}`-style placeholders inside `args` (docs: "substituted into `command` and into each `args` element"). So "every character reaches node exactly as written" holds except for a literal `${NAME}` in the checkout path.
  - `node --no-warnings` in `args` would restore the warning suppression that exec form drops. The plan says exec form has "nowhere to put" `NODE_NO_WARNINGS`, which is true only for the environment variable.
  - The docs page's debug-hooks section ties the `failed to start` lines to v2.1.200, not 2.1.296. That reading came through a summarizing fetch and should be confirmed by reading the page directly.

The main file I checked against is `/Users/example/nana-pi-wt/cc-hooks-windows/packages/nana-setup/lib/settings.mjs`.