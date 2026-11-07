# seat-pull-off builder record

VERDICT: PARTIAL

Implementation and touched tests pass. The local install check remains for the seat: it starts pi fixture model sessions and reviewer/worker launchers, which this builder's instructions prohibit. Independent review and native Windows execution also remain for the seat/CI. No push or CI read occurred.

## Feature and scope

Feature: FEAT-013 · Install and connect harness runtimes.

This serves the current priority to revisit knowledge delivery using measured results. Claude Code's prompt hook is retired; explicit search and pi's extension remain. Install removes historical installer-shaped entries. Doctor diagnoses remaining invocations, including shell and exec forms, without expecting their presence. Uninstall retains its historical exact-entry and same-file ownership rules.

## Files and rows

Production files:
- `packages/nana-setup/lib/settings.mjs`: remove knowledge from desired hooks; preserve a historical descriptor for uninstall and ownership parsing; remove complete installer-shaped entries without removing foreign commands or preexisting empty groups.
- `packages/nana-setup/lib/steps.mjs`: install/dry-run retirement under the existing settings transaction and lock.
- `packages/nana-setup/lib/doctor.mjs`: retired invocation FAIL and install remedy; existing retired bash diagnostics unchanged.
- `packages/nana-setup/lib/hook-health.mjs`: active health rows only, with no missing-knowledge expectation.
- `packages/nana-setup/lib/install-check-config.mjs`, `packages/nana-setup/lib/install-check.mjs`: remove only the Claude Code knowledge expectation and dispatch branch. Pi-turn knowledge checks are unchanged.
- `packages/nana-setup/lib/uninstall.mjs`: retain reporting of preserved historical knowledge variants.

Contract/docs files:
- `REQUIREMENTS.md`: implement R-3739 through R-3746 under FEAT-013; no new feature or subgroup and no new cross-feature shares.
- Retire R-393, R-394, R-1059, R-1083, R-1330, R-1713, R-1885 and R-2202, naming this lane.
- Narrow R-1050 and R-1056 to active hooks, and R-1061 to active-hook detection; update R-285's obsolete re-measure note and R-3540's Windows CLI evidence title.
- `templates/_shared/working-under-nana-pi.md`: Claude Code search-only cell and explanatory paragraph.
- `AGENTS.md`: generated marker region refreshed with `refreshWorkingRegion()` from `packages/nana-setup/lib/project.mjs`; layout description corrected separately. Language templates include the shared source directly and need no checked-in copy.
- `packages/nana-knowledge/README.md`: remove manual wiring, state retirement, 17/871 (approximately 2%), #342, explicit query and the unmatched pi sample.
- `packages/nana-setup/README.md`, `README.md`: remove stale install/migration claims.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated with their generators.
- This folder: commands, wrong-code output and green verification output. Captured logs replace the actual home/temp prefixes with placeholders.

New tests: exactly eight must-meet cases in `packages/nana-setup/tests/seat-pull-off.test.mjs`, tagged R-3739 through R-3746. Each case is awaited under its own limit; process fixtures have bounded child invocations and use OS temp directories. No new sealed tunables.

### Existing test edits (no deletions)

- `packages/nana-setup/tests/settings-merge.test.mjs`: active six-entry fixtures and no prompt-hook insertion; use the exported historical descriptor for existing pure legacy parser/repair checks; integration stale-entry removal and shifted foreign indexes.
- `packages/nana-setup/tests/retired-artifacts.test.mjs`: no replacement knowledge entry after context-hook retirement.
- `packages/nana-setup/tests/checkout-converge.test.mjs`: explicitly seed historical wiring, assert retirement instead of convergence, retain customized-entry and uninstall checks.
- `packages/nana-setup/tests/checkout-spelling.test.mjs`: only Windows active exec commands contain checkout spellings now; POSIX commands use home symlinks.
- `packages/nana-setup/tests/doctor-detail.test.mjs`: retired-hook diagnosis replaces target-health diagnosis.
- `packages/nana-setup/tests/install.test.mjs`: assert no installed knowledge hook.
- `packages/nana-setup/tests/install-check.test.mjs`: six active hooks, no knowledge hook launch/result, retained cases now assert no Claude knowledge result line. Pi-turn tests unchanged.
- `packages/nana-setup/tests/win32-hook-repair.test.mjs`: explicitly seed historical knowledge entries, expect removal, and align active-health indexes after retirement.
- `packages/nana-setup/tests/win32-degrade.test.mjs`: absent prompt-hook group and removal of earlier shell form.
- `packages/nana-setup/tests/hooks-win32-exec.test.mjs`: stale-entry removal; existing pull/rebuild probes use the retained shared CLI descriptor rather than an installed Claude entry; active doctor labels only. Not executed natively here.
- `packages/nana-setup/tests/stale-copies.test.mjs`: the linked-skills filter fixture removes an active verifier entry instead of already-absent retired knowledge wiring.
- `packages/nana-setup/tests/verifier-pipe.test.mjs`: documentation assertion follows retirement rather than migration.
- `packages/nana-pack/tests/templates-render.test.mjs`: expected Claude Code table cell becomes explicit search.

## Wrong-code pairs

Assertions were never inverted. Every new test ran red before its implementation:

| Rows | Wrong code | Red output | Green output |
|---|---|---|---|
| R-3739, R-3740, R-3741, R-3743, R-3745, R-3746 | Original active-hook implementation/docs | `wrong-first.tap`: six failures, exit 1 | `retirement-final.log`, `verification.log`: exit 0 |
| R-3742 | Filter knowledge out of uninstall's wanted entries | `wrong-uninstall-search.tap`: uninstall test fails, exit 1 | Restored code plus historical uninstall descriptor: exit 0 |
| R-3744 | Query switch returns `[]` with exit 0 | `wrong-uninstall-search.tap`: search test fails, exit 1 | Query source restored byte-for-byte: exit 0 |
| R-3740 | Retirement reinterprets a customized shell-with-args entry using the POSIX parser | `wrong-foreign-args.log`: failure, exit 1 | Args-key entries require the released exec form: exit 0 |
| R-3741 | Doctor checks only exec interpretation when args exists | `wrong-doctor-shell-args.log`: failure, exit 1 | Doctor checks both invocation forms independently: exit 0 |

The temporary query mutation left no nana-knowledge runtime diff. Index, sources, build, query and pi extension code remain unchanged.

## Verification commands and exit codes

- `node scripts/code-map.mjs --impact packages/nana-setup/lib/settings.mjs packages/nana-setup/lib/doctor.mjs packages/nana-setup/lib/hook-health.mjs packages/nana-setup/lib/install-check.mjs`: 0; settings impact includes steps/uninstall callers.
- `node --test packages/nana-setup/tests/seat-pull-off.test.mjs`: initial wrong-code run 1; initial implemented run 0. The final harness emits the repository runner's PASS/FAIL lines and awaits each case.
- `node --test --test-name-pattern='R-3742|R-3744' packages/nana-setup/tests/seat-pull-off.test.mjs`: wrong uninstall/search code 1 (both tests failed).
- `node packages/nana-setup/tests/seat-pull-off.test.mjs`: additional wrong-shape runs 1; corrected run 0.
- Initial setup-only runs: 1 while adapting false historical expectations; a broad early run also hit its outer command timeout. Logs retained.
- Unqualified isolated runner initially failed project/restore/trust imports because npm under temporary HOME defaulted to another global prefix. Direct runs of those tests passed. No code or toolchain file changed for this environment issue.
- `npm_config_prefix="$HOME/.local" node scripts/test.mjs project.test restore.test trust.test`: 0, all six matching files passed (235 checks).
- `npm_config_prefix="$HOME/.local" node scripts/test.mjs nana-setup nana-knowledge templates-render.test`: 0. Final precommit summary: **80 files: 79 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 2168 pass, 0 fail, 16 skip**. The skipped file is the native Windows exec test; forced win32 tests passed.
- `node scripts/requirements-trace.mjs`: 0.
- `node scripts/requirements-tree.mjs --write`: 0.
- `node scripts/code-map.mjs --write`: 0.
- `node scripts/readme-check.mjs`: 0.
- `node scripts/lane-class.mjs --root . --files packages/nana-setup/lib/settings.mjs,packages/nana-setup/lib/doctor.mjs,packages/nana-setup/lib/install-check.mjs`: 0, `install: packages/nana-setup/lib/doctor.mjs — nana-setup library`.
- `git diff --check`: 0.

The full suite is deferred to CI under AGENTS.md's explicit builder exemption. No CI was read. Final-tip reruns and commit identity are reported by the final response.

## Precedent and departures

All six precedent files were read completely before design. O1 chose a dedicated removal function beside `removeRetiredContextHook`, reusing `installerTarget` and its private knowledge recognizer in the same module. No private helper moved and no helper was copied into another module. The historical entry descriptor is exported and shared with uninstall/tests rather than copied.

Only knowledge removal drops newly empty groups, as R-3745 requests; context-hook removal itself is unchanged. The new test harness uses awaited bounded cases instead of the precedent's synchronous check counters, to meet the builder's async-test rule. Native Windows shared-CLI probes remain instead of deleting tests for the retired installed hook.

## Remaining seat work

- Run `node packages/nana-setup/bin/install-check.mjs` locally on macOS on the final tip. This builder did not run it because its fixture model sessions and reviewer/worker launches conflict with the no-model-sessions instruction.
- Arrange the required independent check and final/land reviews; this builder launched no subagents.
- Run native Windows verification through the seat/CI; no native Windows result is claimed.
- After land, run doctor against the laptop's real settings and confirm no knowledge-hook row or FAIL, as the brief requests. This builder never inspected or edited the real home.
- Add the brief's known-bug line: pi seat sessions still pull because 686 entries were unmatched, not measured useful. The README records that caveat, but this builder may not edit `docs/known-bugs/`.
- Push only after seat verification. Branch: `feat/seat-pull-off`.

No supplied known-bug entry was changed or fixed outside the requested hook retirement. No owner questions remain. HANDOFF, known-bug files and session archives are untouched.
