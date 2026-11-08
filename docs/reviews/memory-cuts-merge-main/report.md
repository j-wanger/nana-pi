# memory-cuts: current-main merge and review fix

Feature: FEAT-043 · Measure memory outcomes

## Scope and parents

- Branch: `feat/memory-cuts`.
- Lane parent: `a8ef7308`.
- Merged main: `84d9c13376fea5c0b7b28678167564a3d7963fc8`.
- One merge commit, no rebase. No push, CI access, real model session or subagent.
- No HANDOFF, session archive or known-bug file edits.
- This work serves the current priority's memory-delivery cleanup.

## Review closure

SHOULD 2 is closed: `packages/nana-setup/claude/hooks/nana-memory-end.mjs` is a retired placeholder. It drains and ignores stdin, emits nothing and exits 0 on EOF or stdin error. Its contract header says it stays only until machines reinstall. `HOOKS`, desired settings, install-check hooks and the restoration inventory exclude it. Install still removes the owned installed link and managed SessionEnd entries.

- Requirement diff first: amended R-3862, no new ID or tunable.
- Extended M3 inside its existing R-3862 case, not a new test declaration.
- Inputs include empty stdin, CRLF plus trailing space/tab, and malformed text without a final newline.
- Wrong code: missing placeholder, the pre-fix implementation. `node scripts/test.mjs memory-pause` exited 1 on ENOENT (`M3-wrong.log`).
- Correct code: placeholder present. The same command exited 0 (`M3-green.log`). Later touched and snapshot runs also pass it.
- No assertions were inverted. No unrelated known bug was fixed.

## Conflict resolution

`conflicts.diff` captures the original combined hunks; `conflict-paths.txt` lists all 22 conflicted paths. Git's main-side conflict preference supplied a starting point, preserving non-conflicting lane changes. Each overlap was then reconciled as follows:

| Path | Hunk resolution |
|---|---|
| `AGENTS.md` | Runtime-table overlap: main's verifier, post-edit, handoff and notify retirements plus lane's explicit search. Regenerated the entire marker region from the shared source. Main's other guidance changes stand. |
| `README.md` | Instrument paragraph: removed both sides' retired commands, retained main's shared Git-runner description. Git-install example: eight surviving extensions, no knowledge pull. |
| `REQUIREMENTS.md` | R-1881–R-1889 overlap: main's verifier retirements and owner-entry preservation, adjusted surviving hook counts to four. R-1072–R-1074 overlap: no subagent install, pack-only registration, no verifier matcher tests. R-1055 overlap: active hook health with no retired matcher claim. R-658 overlap: explicit search and surviving extension functions. Both complete ID sets remain. |
| `docs/code-map.md` | All generated overlaps discarded and rebuilt with `npm run map`. |
| `package.json` | Eight surviving extension names from main; explicit knowledge search from the lane. Both sides' removed scripts stay removed. |
| `packages/nana-pack/tests/blast-radius.test.mjs` | Main modified, lane deleted: retained lane deletion as the brief explicitly names this instrument for removal. |
| `packages/nana-pack/tests/code-map-launch.test.mjs` | Kept both retirement-loss inventories and main's surviving sources/targets. Restored the lane's instrument-loss set. The placeholder itself is not treated as a deleted target. |
| `packages/nana-pack/tests/linked-launch.test.mjs` | Header drops both removed report commands; surviving tree/product/roster launches remain. |
| `packages/nana-pack/tests/readme-check.test.mjs` | Main's surviving extension list and title; lane's explicit-search assertion. |
| `packages/nana-pack/tests/templates-render.test.mjs` | Main's runtime retirements and adoption journaling; lane's explicit-search cells. |
| `packages/nana-setup/README.md` | Hook list excludes both retired hooks. Settings paragraph retains verifier cleanup and memory cleanup. Adoption table retains ignored legacy config and explicit search. Install promises include both retired dispatches. Turn description retains seat-guide/writing/rulings checks without knowledge or post-edit. Documents the new placeholder, not an installed hook. |
| `packages/nana-setup/lib/doctor.mjs` | Imports retain lane memory descriptor, drop retired seed exports. Detection and repair diagnostics cover knowledge, memory and verifier retirements together. |
| `packages/nana-setup/lib/settings.mjs` | Header lists surviving exports. Desired-hooks hunks remove both memory and verifier. Retains both ownership recognizers and routes both through one public `removeRetiredHook`. Uninstall removes both retired dispatches. Active-entry comment avoids the obsolete count. |
| `packages/nana-setup/lib/state-manifest.mjs` | Main's retired-seed inventory remains; hook rows import the actual active `HOOKS`, excluding both retired hooks. |
| `packages/nana-setup/lib/steps.mjs` | Imports, hook constants, settings result rows, removals and labels retain both retirements. Main's retired-seed operations remain. |
| `packages/nana-setup/lib/uninstall.mjs` | Combined imports retain retired seeds and lane-owned memory link recognition. Both removals remain. |
| `packages/nana-setup/tests/install-check.test.mjs` | Four active hook expectations, neither memory-making nor verifier dispatch. Other judges and tests remain. |
| `packages/nana-setup/tests/seat-pull-off.test.mjs` | Fresh install expects four surviving hooks, neither memory nor verifier. |
| `packages/nana-setup/tests/settings-merge.test.mjs` | Desired fixture omits both retired entries; four-entry counts reflect the combined removals. |
| `packages/nana-setup/tests/uninstall.test.mjs` | Main's retired-seed labels and lane's retired-memory-link label. |
| `scripts/blast-radius.mjs` | Main modified, lane deleted: retained lane deletion, matching the brief. |
| `templates/_shared/working-under-nana-pi.md` | Main's runtime retirements and guidance; explicit search in all three supported runtime rows. |

Non-conflicting integration: `code-map.config.json` retains both surviving inventories and drops deleted targets. Both runtime package manifests remain pack-only. Both install-check removals remain. `retired.mjs` retains the lane's owned memory-link handling. `docs/requirements-tree.md` was regenerated with `npm run req:tree`.

## Existing test edits in this revision

No test was newly declared. No test was deleted beyond the removals already present on a parent.

- `packages/nana-setup/tests/memory-pause.test.mjs`: M3 now executes and checks the placeholder and its retirement header.
- `packages/nana-pack/tests/code-map-launch.test.mjs`: combined both parent retirement inventories; excludes the restored placeholder from deleted targets.
- `packages/nana-pack/tests/linked-launch.test.mjs`: removed-command header reconciliation; main's removed movement case stays removed.
- `packages/nana-pack/tests/readme-check.test.mjs`: surviving extension functions plus explicit search.
- `packages/nana-pack/tests/templates-render.test.mjs`: combined runtime-table expectations.
- `packages/nana-pack/tests/memory-cut-guidance.test.mjs`: replaced its unrelated-cell digest with the digest independently computed from main's canonical table, excluding the knowledge column. Main intentionally changed those other cells.
- `packages/nana-pack/tests/review-paperwork.test.mjs`: M6 checks surviving Git-runner clients, not the lane-deleted instrument.
- `packages/nana-setup/tests/install-check.test.mjs`: four surviving hooks, no retired memory or verifier leg.
- `packages/nana-setup/tests/seat-pull-off.test.mjs`: four surviving hooks.
- `packages/nana-setup/tests/settings-merge.test.mjs`: four surviving hooks and no memory fixture entry.
- `packages/nana-setup/tests/uninstall.test.mjs`: expected retired-memory link label.
- `packages/nana-setup/tests/win32-degrade.test.mjs`: four active hook scripts.
- `packages/nana-setup/tests/win32-hook-repair.test.mjs`: titles now say four, matching their existing active-hook assertions. R-1883/R-1884 citations updated with them.

Other test changes are main's already-reviewed changes imported by the merge. `test-files.txt` records the union of surviving test paths changed on either side since the merge base: 72 files.

## Requirement and helper integration

`preservation.log`: lane 2645 row IDs, main 2658, merged 2666; 0 missing and 0 duplicates. Marker equality and surviving map-inventory checks pass.

Besides R-3862, the conflict integration adjusts R-658, R-1073, R-1883, R-1884 and R-2412 for the combined removals. Main's verifier retirement changes stand. R-3860–R-3867 stay implemented.

No new helper was copied. Main's private `removeRetiredHookEntries` and the lane's public `removeRetiredHook` performed the same operation. The merged module keeps the public name. Existing knowledge and verifier callers and the memory caller use it. No function moved across modules; no private cross-module import was added.

This fix card names no Precedent section. The implementation follows the existing module-header and hook-retirement patterns. The one intentional departure from the original lane is keeping the inert source file, as SHOULD 2 requires.

## Validation and commands

Every command's exit code was read independently. Full output stays in this folder. Initial red runs remain as diagnostic records, not acceptance evidence.

| Command | Final precommit result | Evidence |
|---|---|---|
| `npm run map` | 0 | `map.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `node scripts/component-audit.mjs` | 0 in staged-tree snapshot | `component-audit-green.log` |
| `node scripts/test.mjs test-runner` | 0 | `test-runner.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 0 in staged-tree snapshot | `snapshot-install-check.log` |
| `npm run template:accept` | 0 | `template-accept.log` |
| `node scripts/test.mjs --jobs=4 <all 72 explicit paths in test-files.txt>` | 0 in staged-tree snapshot | `snapshot-touched-green.log` |

Touched result: **72 files: 71 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 2146 pass, 0 fail, 17 skip**. The platform-only hook execution file skips on macOS; Windows execution belongs to CI.

The first worktree structural audit failed because new main paths were not yet at lane HEAD. The first checklist rehearsal also cloned old HEAD and failed step 7. A temporary local clone checked out a synthetic merge of the staged tree, then passed structural checks, all 72 touched files and the real install check before the branch commit. This avoids committing a red revision merely to satisfy HEAD-based checks. Snapshot identifier is recorded in `$TMPDIR/memory-cuts-snapshot-tip`, not as the lane tip.

Tests use `npm_config_prefix=~/.local`: otherwise the fresh HOME makes this machine's npm resolve the underlying Node installation rather than the installed pi package. The first restore run exposed that environment mismatch. No install into the worktree was run.

AGENTS delegates the full suite to CI. No full local suite, push, CI read, native Windows execution, or review session was run. The final report supplies the actual merge tip and results from rerunning every named seat check on that tip. Review and CI remain for the seat.
