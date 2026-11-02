# Round 2 build report

## Closures

- M10 closes the rename-driver refusal finding. `--no-renames` already lists both source and destination names; attribute checks now cover their union on both parents before merge-tree. The exact keep-driver rename/edit versus main-edit fixture refuses with refs and both worktrees unchanged.
- M11 closes Q3's generated-overlap finding. Both configured generated paths refuse separate-hunk changes on both sides. The same test pins the new sealed generated-path list.
- M12 closes the descendant-main empty-merge finding. A tip contained by descendant main refuses before CI, suite or merge work.

## Files and rows

- `REQUIREMENTS.md`: strengthened existing R-3688, R-3690 and R-3697; no new IDs or tree placement changes.
- `packages/nana-pack/bin/nana-land.mjs`: union attribute checks, generated-overlap guard, descendant-main guard.
- `packages/nana-pack/lib/land-config.mjs`: generated paths with provenance.
- `packages/nana-pack/tests/land-clean-merge.test.mjs`: exactly three new awaited cases using the existing bounded harness and OS-temp fixtures. No existing test edited or deleted.
- `packages/nana-pack/README.md`: corrected the affected consumer contract.
- `docs/code-map.md`: regenerated the map after its stale-entry check failed.
- This folder's `r2-*` evidence files retain command output; absolute checkout paths are redacted as `<lane-worktree>`, and runner output trailing spaces are stripped for the staged whitespace check.

## Precedent

Read both round-one reviews and all three named precedent files before design. Reused existing `changed`, refusal helpers, fixture imports, snapshots and bounded `check` harness. No helper copied or moved; no departure from the precedent pattern. README and generated map changes maintain the required consumer contract and generated index.

## Wrong-code pairs

All three new cases ran before implementation against ba9fcba4's unchanged code. `node packages/nana-pack/tests/land-clean-merge.test.mjs` exited 1: nine old cases passed; M10, M11 and M12 each failed because the land returned 0 instead of refusing. No assertion was inverted. With corrected code, the same command exited 0 with all 12 cases passing. See `r2-wrong-code.txt` and `r2-green.txt`.

## Commands and exit codes

- `npm run map:impact -- packages/nana-pack/bin/nana-land.mjs packages/nana-pack/lib/land-config.mjs`: 0, before implementation.
- Every `packages/nana-pack/tests/*land*.test.mjs`, each invoked with node: 0 for all ten files, 110 checks total.
- `node packages/nana-pack/tests/test-runner.test.mjs`: 0, 53 checks.
- `npm run map:check`: initially 1 (stale generated entry); `npm run map`: 0; repeated map check: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs --root .`: 0; 2239 implemented rows traced, zero EARS problems.
- `node scripts/requirements-tree.mjs --root .`: 0.
- `node scripts/known-bugs.mjs --root .`: 0; names=0, sizes=1 (existing FEAT-013 size advisory).
- `git diff --check`: 0.
- `node scripts/identity-scan.mjs --root .` after staging: initially 1 due to absolute checkout paths in command output; after redacting those paths and staging again: 0.
- `node scripts/lane-class.mjs --root . --files REQUIREMENTS.md,packages/nana-pack/README.md,packages/nana-pack/bin/nana-land.mjs,packages/nana-pack/lib/land-config.mjs,packages/nana-pack/tests/land-clean-merge.test.mjs`: 0, gate.

## Known bugs and limits

Read `docs/known-bugs/FEAT-008.md` in full. None of its recorded bugs is fixed or rewritten by this revision. M8's accepted semantic-breakage limit remains: the generated-file guard narrows supported inputs but does not validate other clean merges semantically. A7's CI snapshot window, A8's cross-ledger race and A9's post-push exposure remain unchanged. Other known bugs were not changed.

CI covers the full suite under AGENTS.md; the locked full suite was not run. No model session, subagent, credential read, live GitHub call, push, issue operation, HANDOFF edit, known-bug edit or session-archive edit was performed. Native Windows testing remains for CI. The final chat report records the committed tip and checks repeated on it.
