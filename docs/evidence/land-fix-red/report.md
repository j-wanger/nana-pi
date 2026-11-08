# land-fix-red technical report

## Scope and rows

Branch: `feat/land-fix-red`. One implementation commit; its SHA is in the builder's final report.

- `REQUIREMENTS.md`: new FEAT-008 rows R-3872–R-3879, in M1–M8 order; R-3826 now names the authorized exception. No shares added.
- `packages/nana-pack/bin/nana-land.mjs`: parses `--fixes-red`, validates current-main evidence, checks authorization again inside the final review lock on both paths, and writes `fixesRed` only in successful end records.
- `packages/nana-pack/lib/main-ci.mjs`: adds `evidenceReadable` for completed-run reports, keeping all previous verdicts and output unchanged.
- `packages/nana-pack/tests/win-main-only.test.mjs`: eight awaited, bounded must-meet cases, using its existing toolkit/main-CI fixture and the shared land/review helpers. M8 reuses this fixture with the option, rather than a separate harness.
- `packages/nana-pack/tests/land-clean-merge.test.mjs`: updates only M9's now-false exact ruling string and adds R-3876 to its marker.
- `packages/nana-pack/rules/nana-rulings.md`, `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`: the requested fix-landing clause, with identical shared/rendered working regions.
- `packages/nana-pack/README.md`: option, evidence, race check, record field and remaining gates.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated outputs.
- `docs/evidence/land-fix-red/`: normalized logs and this report.

No existing behavioral assertion was weakened or deleted. The existing fixture gained optional injection points; its original defaults remain unchanged.

## Precedent and callers

Read every brief precedent before implementation. Used the existing option loop, imported `mainCi`, reused injected `runGh`, and followed run-ID/attempt comparison from the clean-merge race precedent.

Departures:

- Added cases to `win-main-only.test.mjs`, not `land-ci-read.test.mjs`: its existing fixture already models all toolkit main and lane legs. This avoids copying a second CI harness.
- Rechecks main authorization inside the final review lock, not before it: both landing paths need the freshest authorization immediately before their fast-forward. Normal lands retain their existing reads.
- M2 already passed on baseline. Its failing wrong-code proof ran after implementation, not before it. That timing departs from the requested wrong-code-first order; the mutation itself changes code, never assertions.

Caller search included `scripts/`. `nana-land` is the only consumer changed for the additive `mainCi` result field. The CLI consumes `code`; existing main-CI and shard tests consume existing fields. No existing caller needs a signature migration. Frontier consumers use `mainCiCommand`, which is unchanged. No private helper was imported or copied.

## Mutation pairs

All cases pass with restored code (`green.log`, then `tests.log`).

- `wrong.log`: baseline rejects the new option; M1, M3–M8 fail, exit 1. M2 passes as the preserved behavior.
- `mutant-gates.log`: disable named-run validation, the ordinary main gate and the final authorization recheck; M2, M3, M4, M6 and M7 fail, exit 1.
- `mutant-suite.log`: ignore failed local-suite exit status; M8 fails at its suite-refusal case, exit 1.
- M5's baseline failure pins the absent rule clause; M1's baseline failure pins the absent recovery option.

No mutant remains. No new sealed tunable or line-by-line text reader was added.

## Commands and exit codes

Logs are adjacent to this file. Every exit was inspected separately.

| Command | Exit | Evidence |
| --- | --- | --- |
| `npm run map:impact -- packages/nana-pack/bin/nana-land.mjs packages/nana-pack/lib/main-ci.mjs` | 0 | inspected before edits |
| `node packages/nana-pack/tests/win-main-only.test.mjs` against baseline | 1 | `wrong.log` |
| same command against gate mutant | 1 | `mutant-gates.log` |
| same command against suite mutant | 1 | `mutant-suite.log` |
| same command with restored implementation | 0 | `green.log`: 13 checks |
| `npm run map` | 0 | `map.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run readme:check` | 0 | `readme.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log`; advisory stale/unclaimed notes remain |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log`; 0 off-form rows |
| scoped new-row citation/title check | 0 | `titles.log`: 0 missing |
| grep both affected rule tests for the added sentence | 0 | `rule-grep.log` |
| `node scripts/test.mjs packages/nana-pack/tests/win-main-only.test.mjs packages/nana-pack/tests/land-clean-merge.test.mjs packages/nana-pack/tests/main-ci.test.mjs packages/nana-pack/tests/land-clean-merge-race.test.mjs packages/nana-pack/tests/land-ci-read.test.mjs packages/nana-pack/tests/rulings.test.mjs` | 0 | `tests.log`: 6 files, 57 passing checks |
| `node scripts/test.mjs packages/nana-pack/tests/land.test.mjs packages/nana-pack/tests/land-ci-edge.test.mjs packages/nana-pack/tests/land-ci-suite.test.mjs packages/nana-pack/tests/land-records.test.mjs packages/nana-pack/tests/win-shards.test.mjs packages/nana-pack/tests/requirements-trace.test.mjs` | 0 | `regression.log`: 6 files, 116 passing checks |
| `node packages/nana-setup/bin/install-check.mjs` on macOS | 0 | `install.log`: 18 PASS lines |
| `git diff --check` | 0 | no whitespace findings |

The final report records repeated seat checks on the committed tip. No new test file was added, so the conditional test-runner check does not apply.

## Limits and not done

CI covers the full suite under AGENTS; no local full-suite run was required. No push, CI read, GitHub operation, real model launch or stored-credential access was performed. The install check uses its isolated fixture runtime.

Read all of `docs/known-bugs/FEAT-008.md`. No listed bug is closed by this change. Related residuals remain: ordinary lane CI can change after its snapshot; separate review homes do not serialize; red-main exposure exists until the post-land push reports; ledger retention and interrupted-end limitations remain. The new main authorization check narrows only the named recovery path. No forbidden file was changed.

No owner question remains. Independent review and hosted CI belong to the seat.
