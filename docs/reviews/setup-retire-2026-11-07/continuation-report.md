# setup-retire continuation: parts 2 and 3

VERDICT: PARTIAL

Feature: FEAT-013 · Install and connect harness runtimes
Branch: `feat/setup-retire`.

This continuation finishes the two mandatory parts: handoff retirement with adoption preserved, then Claude verifier retirement with the pi gate preserved. The optional seed cut and final lane-wide documentation/status cut are not done. The seat must still obtain native Windows evidence and CI; nothing was pushed or read from CI.

## Commits and files

1. `9f1bde13` — `setup-retire: keep adoption without compaction handoff`.
   Adds `packages/nana-pack/extensions/nana-adoption.ts`, removes the handoff extension and five handoff-only suites, drops handoff runtime config, and preserves adoption, launcher, renderer, gate and writing cases.
   `handoff-retirement.md`, `handoff-deleted-cases.log`, `handoff-mixed-diff.log` and `handoff-row-diff.log` record files, original declarations, adjacent markers and requirement edits.
2. The second commit retires `packages/nana-setup/claude/hooks/verifier-pipe.mjs` and `packages/nana-setup/lib/verifier-hook.mjs`.
   `verifier-files.log` lists each changed path; `verifier-retired-case-index.log` and `verifier-removed-cases.log` list every changed/retired declaration with its original rows. No whole test file is deleted in this part: `verifier-pipe.test.mjs` retains the surviving R-909 doctor cases and R-2354/R-2356 pi-predicate documentation checks.

The first staging command included already-staged deleted paths and failed with 128. The initial partial commit was immediately amended into the complete first part; the incomplete revision is not the lane tip or its parent.

## Rows and must-meets

| Must-meet | Row | Evidence and status |
|---|---|---|
| M1 | R-3799 | Implemented in `retired-artifacts.test.mjs`: doctor names retired wiring and the fix; install removes released shell/exec entries and owned links, preserving foreign siblings, on both forced platform branches. |
| M2 | R-3800 | All three removed extensions are absent; the macOS install turn passes. The complete tagged M2 test and native Windows proof remain pending. |
| M3 | R-3801 | Implemented through real pi package discovery, discovered adoption handlers and the real SessionStart hook; canonical root/subdirectory deduplication, user-only journal, a second event after 25 hours, adopted-root silence. No seeded adoption events. |
| M4 | R-3802 | Implemented by running the existing gate and pipe-guard suites unchanged. `verifier-gate-unchanged.log` records the baseline comparison. |
| M5 | R-3803 | Pending: pi-subagents seeds, doctor rows and retry remain. |
| M6 | R-3804 | Implemented: valid/malformed legacy blocks in both scopes are ignored without warnings, errors or fallback; gate policy survives. |
| M7 | R-3805 | Pending: runtime table is updated and current checks pass, but final README prose/artifact/status cleanup remains. |
| M8 | R-3806 | Pending with seed retirement. |
| M9 | R-3807 | Implemented on POSIX: uninstall directly on an old home removes owned verifier shell/exec wiring and unchanged seeds, before any install; then install preserves only foreign siblings. Native Windows reports the POSIX-only uninstall case as skipped. |

Verifier-only rows retired: R-688, R-984, R-985, R-1053, R-1054, R-1064, R-1077, R-1881, R-1882, R-1886, R-1887, R-1944, R-2014 and R-2355. Surviving foreign-owner halves of R-1888/R-1889 remain implemented, with the original mixed case narrowed to byte-identical preservation instead of verifier movement.

Correction to the first-part record: R-108 is narrowed to historical adoption-store lookup, while R-113 and R-797 retain their store-key contracts. Their surviving cases carry their original markers in `adoption-producer.test.mjs`; the worktree key case uses a real temporary git worktree. These rows are not retired in the final tree. Compaction writing/pickup and its other private contracts stay retired. No row was deleted or renumbered; no new ID was allocated.

Setup remains partial, anchored only to R-3800/R-3803/R-3805/R-3806. Returning it to sound before these are implemented would be false.

## Wrong-code pairs

Every new case failed on code, never an inverted assertion:

| Pair | Wrong implementation | Red | Correct implementation | Green |
|---|---|---|---|---|
| M3 | Original handoff producer, disabled by legacy handoff.enabled | `handoff-wrong.log`, exit 1 | Adoption-only discovery ignores retired handoff config | final touched run, exit 0 |
| M6 | Original handoff config schema/returned block | `handoff-wrong.log`, exit 1 | Remove schema/default/merge for handoff | final touched run, exit 0 |
| M1 | Original active verifier installation and healthy-doctor row | `verifier-M1-wrong.log`, exit 1 | Retire wiring, link and active row; report retired wiring | final touched run, exit 0 |
| M4 | Temporarily return null from verifierPipeReason | `verifier-M4-wrong.log`, exit 1 | Restore predicate bytes unchanged | final touched run, exit 0 |
| M9 | Temporarily skip removeRetiredVerifierHook | `verifier-M9-wrong.log`, exit 1 | Restore retirement helper | final touched run, exit 0 |

No new sealed tunable was introduced. The existing adoption DAY_MS window is retained by name.

## Existing test edits

The first-part mixed-suite edits are inventoried in `handoff-retirement.md`. The store marker correction above supersedes its overly broad retirement statement.

Verifier part:
- `settings-merge`: remove verifier-only matcher seals, active-entry fixture and hook-append assertion; change active count six to five, retaining tokenization, config loading, foreign preservation, atomic-write and knowledge cases.
- `hooks-win32-exec`: remove only verifier matcher/dispatch cases and verifier health label; other installed-hook and knowledge cases remain.
- `win32-hook-repair`: retire verifier movement cases; preserve SessionStart, knowledge, owner-lookalike, advice and shape cases. Restore the surviving foreign/extra-key half of its mixed move case. Active-row titles/counts now say five.
- `win32-degrade`: remove verifier-only matcher and wrong-matcher cases; update active hook count to five. Other cases remain.
- `hooks-closed-output`: remove verifier stdout/stderr cases only.
- `hook-producers`: remove only verifier-library import-safety case.
- `verifier-pipe`: remove installed Claude protocol and wrapper-dialect cases, retain retired-bash doctor and pi-predicate README cases unchanged. Retag the surviving context/knowledge README check to its live rows.
- `install-check`: remove hook-specific verifier mapper/judge cases, sample dispatch and dead fake response; adjust hook set and hook invocation counts. Preserve pi gate turn and PowerShell tests. Keep the shared pi turn's bash/PowerShell verifier samples in config; deleting those initially broke the real install turn and was corrected.
- `install` and `seat-pull-off`: remove verifier from installed hook lists/counts.
- `state-manifest` and `restore`: remove the retired active inventory path/count/label.
- `uninstall`: preserve wrong-event/matcher coverage using an active objective fixture; use active roster-notice for the occupied-directory fixture; remove the retired expected label.
- `stale-copies`: remove verifier-only fixture portions; keep the linked-skills preservation case by breaking objective wiring while retaining adoption's install record. Its slow wrapper is unchanged.
- `templates-render`: update only runtime-table expectations/source inventory mapping, remove the retired R-985 share.
- `code-map-launch`: add explicit historical edge-loss reasons for retired Claude wrapper consumers.

`retired-artifacts` adds only the brief's M1 and M9 cases; the pack's `setup-retire` adds only M3/M6/M4. Async cases are awaited and bounded; new children have timeouts. Fixtures live under OS temp. No test imports, copies or launches a seat script.

## Precedent and callers

Read all named precedent files before design. Followed seat-pull-off's complete-object ownership checks, group-emptying policy and doctor repair line. Verifier matching uses the existing installerTarget/tokenize helpers; knowledge and verifier removal share one in-module group-pruning function. No helper was copied to another module or moved to a shared module. Steps' existing retirement-link path handles the owned verifier link. Seed install/uninstall behavior stays unchanged.

O1 permits the new small adoption-only extension. It imports the adoption library's existing public functions, never a private helper. No precedent departure remains.

Changed callers of the removed hook/library: steps HOOKS and retirement list, settings desiredHooks and uninstall ownership path, doctor, state inventory, install-check table/dispatcher, and the mixed tests above. The pi gate still imports the original pipe-guard; neither its code nor its existing tests changed. The remaining references to removed paths are historical ownership fixtures, explicit edge-loss reasons or inert runtime-inventory keys, not readers of a deleted source.

`handoff-removed-text-scan.log` and `verifier-removed-text-scan.log` search every test for removed sentences and paths. Evidence logs normalize machine roots to repo-relative paths, ~ or $TMPDIR; the full original code diff is available from git.

## Known bugs touched

Read all 216 lines of FEAT-013's known-bug file. No known-bug file changed. Retiring the verifier removes its old Windows matcher-move/duplicate-invocation paths and the associated emptied-group metadata-loss paths; it does not fix the surviving SessionStart/knowledge repair limits. Removing the verifier's closed-output code and cases does not improve the remaining hooks' known output limits. The new retired-link name reuses the existing checkout-spelling comparison; its unpinned second-spelling limit remains. Local tests use npm_config_prefix=~/.local for the existing npm-prefix discovery limitation; no production fix is claimed.

## Checks

All final precommit commands exit 0:
- `npm run map`, then `npm run map:check`.
- `npm run req:tree`.
- `npm run readme:check`.
- `node scripts/component-audit.mjs --check`.
- `node scripts/requirements-trace.mjs`; explicit title check: **0 missing**, zero rail problems.
- Touched/dependency run in `final-touched-tests.log`: **33 files: 32 PASS, 0 FAIL, 1 SKIP; 1616 checks pass**.
- Extra surviving doctor/README/rulings run in `final-extra-tests.log`: **4 files PASS; 60 checks pass**.
- `node scripts/test.mjs test-runner`: both runner files pass.
- `node packages/nana-setup/bin/install-check.mjs`: the local Mac rehearsal passes, including pi session, pi turn, pi-review, pi-worker, hook set, all remaining hooks, doctor and README checklist.
- `git diff --check`.

Earlier failed runs remain separate from the final green logs. The final chat report supplies the full tip and checks repeated on that commit.

Not done: optional part 4 (seeds/doctor/retry, M5/M8); final part 5 (remaining docs, artifact/status cleanup and M2/M5/M7/M8 test/wrong-code pairs); native Windows runtime; CI/full suite. AGENTS.md delegates the full suite to CI, so no local full run or machine lock was needed. No GitHub change, push, CI read, live-model session or subagent occurred.
