# Builder record — land-regenerate-generated

VERDICT: DONE (builder scope; seat-owned mutation pairs and reviews remain).

## Revision and interrupted draft

- Branch: `feat/land-regenerate-generated`; base: `1af2d93a`.
- Kept the requirement changes, six new tagged checks, extended M9, real-generator fixtures, sealed configuration and private-checkout implementation.
- Kept the Windows fixture clone override (`core.autocrlf=false`). It makes independent clones use the same byte policy as the fixture repository, rather than the host default.
- Changed R-3712, M9, shared guidance, rendered AGENTS, README and the ruling to the seat's exact clause: “a conflict only in the generated files the land contract names, rebuilt by their own generators, counts as no conflict”.
- Changed the fixture generator runner to import `GENERATOR_TIMEOUT_MS`, rather than duplicate the sealed value.
- Redid all wrong-base, green-test and determinism evidence. The interrupted evidence was not treated as acceptance.
- Rendered AGENTS with the existing exported `refreshWorkingRegion` helper from `packages/nana-setup/lib/project.mjs`. Generated both documentation outputs through their own generators.

## Files and rows

- `REQUIREMENTS.md`: amended R-3691 and R-3696; implemented R-3706–R-3712 with backticked `file::title` evidence.
- `packages/nana-pack/bin/nana-land.mjs`: generated-only eligibility, pre-execution guard, private regeneration, final-tree comparison, refusals and named success output.
- `packages/nana-pack/lib/land-config.mjs`: frozen output/argv contract, per-command limit and refusal vocabulary, with provenance.
- `packages/nana-pack/tests/land-regenerate.test.mjs`: M1–M6. M7 is the extended existing M9 in `land-clean-merge.test.mjs`.
- `packages/nana-pack/tests/land-fixtures.mjs`: real generators and their import closure, temporary repositories, independent merge/output oracles, and generator runner.
- Shared guidance, rendered `AGENTS.md`, pack README and dated ruling: matching consumer contract.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerated outputs.
- This lane folder: plan/brief context, evidence runner, full outputs and this record.

## Contract and execution

| Output | Write argv under `process.execPath` | Check argv under `process.execPath` |
|---|---|---|
| `docs/code-map.md` | `scripts/code-map.mjs --write` | `scripts/code-map.mjs --check` |
| `docs/requirements-tree.md` | `scripts/requirements-tree.mjs --write` | `scripts/requirements-tree.mjs --check` |

Each command has a 30000 ms limit and bounded captured output. No shell or npm runs during regeneration. The reasons are `generatorFailed`, `generatorCheck` and `generatorScope`, each retaining the existing lane merge-review-CI remedy.

The merge-tree result enters an unregistered OS-temp directory through `read-tree` and `checkout-index`. A private index lives beside that checkout. `GIT_DIR` supplies the existing object store; `GIT_WORK_TREE` and `GIT_INDEX_FILE` select private state. The checkout uses `core.autocrlf=false`.

Only conflicting outputs get write commands; every contract output gets its check command. Only contract outputs are staged. Both unstaged/untracked/ignored paths and the final index tree are checked against the contract. The final-tree baseline is the merge-tree result, never HEAD. Main-only additions therefore remain intact. Existing proof, CI re-read, review lock, final rechecks and fast-forward ordering remain unchanged.

The `finally` removes only the owned directory, including its private index. It creates no ref or registered worktree and never prunes. An unrelated stale registration survives refusal. A process kill can leave only the owned temporary directory/index. No filesystem confinement is claimed.

## Generator needs and configuration guard

- Code-map needed its real wrapper, template implementation and transitive imports, configuration, valid module headers and launch declarations, and existing output directories. It computes from merged source files; its write/check modes need no network or npm.
- Requirements-tree needed its real imports, valid merged ledger and existing output directory. Git context supports its HEAD-based deliverable diagnostics. Those diagnostics are not merged-tree validation and do not determine acceptance.
- Both actual write/check pairs exited 0 in successful temporary fixtures. Output bytes matched separately generated merged-source oracles.
- Before execution, the guard parses merged `code-map.config.json`. `mapPath` must equal the sealed map output. Each configured root must resolve inside the checkout, including existing symlink ancestors.
- The guard reads, without executing, the requirements-tree script's declared target. It must match its sealed output. Output paths also receive the realpath boundary check. Unrecognized declarations fail closed.
- Outside-directory writes by generator code and deliberately forged generators remain threat-model residuals.

## Tests and wrong-code pairs

The new tests retain the precedent's awaited, per-case bounded harness. Fixtures live only in OS temp directories. No suite test runs, imports or copies a seat script.

`wrong-code.txt` records final tests against branch-base code and builder code:

| Check | Obvious wrong implementation | Wrong result | Builder result |
|---|---|---|---|
| M1 / R-3706 | Base refuses generated conflicts | FAIL | PASS |
| M2 / R-3707 | Base refuses eligible modify/delete regeneration | FAIL | PASS |
| M3 / R-3708 | Base has no generator failure/check handling | FAIL | PASS |
| M4 / R-3709 | Base has no generator scope/configuration guard | FAIL | PASS |
| M5 / R-3710 | Base never replaces generated decoys | FAIL | PASS |
| M6 / R-3711 | Base has no sealed generator contract | FAIL | PASS |
| M7 / R-3712 (M9) | Base guidance/ruling omits the exact exception | FAIL | PASS |

Wrong-base commands exit 1 for each of the two files; builder commands exit 0. The evidence runner exits 0 when that red/green pair holds. Assertions were never inverted. These are builder wrong-base pairs, not the seat's independently selected mutations.

Only one existing test was edited: `land-clean-merge.test.mjs` M9. Its previous agreement check omitted the now-required generated-file exception. No other existing test assertion or title changed; none was deleted.

`determinism.txt` records eight exit-0 generator writes in a disposable copy with a space in its path: twice per generator under each of `core.autocrlf=false` and `true`. Each output's four SHA-256 values match.

## Commands and exit codes

All test files ran one at a time, without another heavy process alongside them. `build-1-green.txt` holds their complete output:

- `node packages/nana-pack/tests/land-regenerate.test.mjs`: 0.
- `node packages/nana-pack/tests/land-clean-merge.test.mjs`: 0.
- `node packages/nana-pack/tests/land-clean-merge-race.test.mjs`: 0.
- `node packages/nana-pack/tests/land.test.mjs`: 0.
- `node packages/nana-pack/tests/land-merge.test.mjs`: 0.
- `node packages/nana-pack/tests/land-records.test.mjs`: 0.
- `node packages/nana-pack/tests/test-runner.test.mjs`: 0.
- Summary: **7 files, 133 passing checks, 0 failed files**. One existing Windows-only runtime-measurement skip remains in `land-merge.test.mjs`.
- `npm run map`: 0.
- `node scripts/requirements-tree.mjs --write`: 0.
- `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0.
- `node scripts/requirements-tree.mjs --check`: 0.
- `node scripts/known-bugs.mjs --root .`: 0.
- `node scripts/identity-scan.mjs --root .`, after staging: 0.
- `git diff --check` on tracked source edits: 0. Staged corpus check with `git -c core.whitespace=-blank-at-eol diff --cached --check`: 0; supplied Markdown hard-break spaces remain.
- `node scripts/lane-class.mjs --root . --files packages/nana-pack/bin/nana-land.mjs,packages/nana-pack/lib/land-config.mjs,packages/nana-pack/tests/land-regenerate.test.mjs,REQUIREMENTS.md`: 0; `gate: packages/nana-pack/bin/nana-land.mjs — land tool`.

The final response identifies the committed tip and its repeated checks. Evidence output replaces local checkout/temp prefixes and transient warning process IDs, and trims log-line trailing whitespace; exit statuses and assertions remain intact.

`nana-writing --report` ran on this record. Its verdict-format, identifier, length and passive-voice notes remain because this is the brief-mandated technical builder record, explicitly outside the owner-prose rule. The required `VERDICT:` prefix and technical evidence are retained.

## Precedent and known-bug contact

No private helper exports, copied private helpers or moved helpers were needed. Existing same-module land helpers and public fixture helpers remain the shared implementation. The unregistered checkout follows Revision 2 rather than the superseded registered-worktree design. The clone policy and imported fixture timeout are the only fixture-pattern adjustments, for Windows byte stability and a single tunable source.

The complete `docs/known-bugs/FEAT-008.md` was read. The change extends the inherited conflict-cost policy in the land-reads-CI timing note: generated-only conflicts no longer require another lane merge/review/CI cycle. It does not close that whole note. Clean-merge A7 (CI snapshot race), A8 (shared-home serialization), A9 (post-land exposure), and M8 (semantic breakage) remain unchanged limitations of the merge flow this change extends. No unrelated known bug was fixed, and the known-bug file was not edited.

## Not done

No full suite, per build-session-2 instructions and the repository's CI coverage policy. No push, CI read/wait, GitHub call, model session or subagent launch. No land against this repository. The seat still owns its wrong-code mutations, independent check and reviews. Installed rulings remain stale; installation refresh belongs to the seat. There are no new open design questions.
