# Merge bench-retire main into hive-retire

## Revision

- Branch: `feat/hive-retire`.
- Lane parent: `3629c786eb7190c64410de785ef82933be8e2f1d`.
- Main parent: `b0ca3b98047b24a66468f32d0a8ae3bcc4bad0af`.
- Base: `ae1f14f9216516e64165264e142831d567eb7222`.
- `git merge --no-commit --no-ff main`: exit 1, three conflicting files; resolved below.
- Main's 28 deletions all stand. No additional file was deleted.

## Conflict hunks

| File | Initial hunk | Resolution |
| --- | --- | --- |
| `code-map.config.json` | 2–6, map comment | Kept removal of the retired preview/vendor description and main's removal of retired study exemptions. Existing automatic merge kept both sides' roots, ignore and exemption changes. |
| `packages/nana-pack/tests/code-map-launch.test.mjs` | R-3156 edge-loss assertion | Kept main's `retiredStudyModules` loss registration and this lane's `retiredPreview` allowance, alongside the existing named retired sources. No assertion was weakened beyond the combined parent allowances. |
| `docs/code-map.md` | 13–17, covered roots | Regenerated; no retired preview root. |
| `docs/code-map.md` | 599–603, component audit callers | Regenerated; includes both retirement tests, excludes deleted preview tests. |
| `docs/code-map.md` | 633–639, first-look config edges | Regenerated; keeps both retirement callers, removes retired preview callee. |
| `docs/code-map.md` | 648–696, first-look edges and retired preview modules | Regenerated; keeps surviving callers and removes deleted preview entries. |
| `docs/code-map.md` | 846–852, product report edges | Regenerated; combines surviving callers and main's shared glob helper. |

`REQUIREMENTS.md` merged automatically without conflict. `rows.log` verifies every changed row against both parents and the base: 2,589 rows, zero lost, divergent or altered rows. The lane's R-3775–R-3782 and main's R-3783–R-3790 survive unchanged, as do both sides' retirements. No row was authored or renumbered. `docs/requirements-tree.md` also merged automatically, then was regenerated with its generator.

## Checks before the merge commit

Each exit code was read independently. Evidence is in this folder.

| Command | Exit | Evidence |
| --- | --- | --- |
| `npm run map` | 0 | `map.log` |
| `npm run req:tree` | 0 | `tree.log` |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/component-audit.mjs --check` | 0 | `audit.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log` |
| `npm test -- <paths in touched-tests.txt>` | 0 | `tests.log` |
| `git diff --check` | 0 | No output |
| `git diff --cached --check` | 0 | No output |

`14 files: 14 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 416 pass, 0 fail, 0 skip · 151.2s`

The test list is the union of added/modified surviving test files from both base-to-parent diffs. Deleted tests were neither restored nor run. Audit notes remain report-only, including 21 unclaimed mapped modules. Existing Node module-type warnings were preserved, with checkout paths normalized before committing logs.

## Scope and omissions

- Existing test edited manually: only R-3156 in `code-map-launch.test.mjs`, because each parent alone rejects the other parent's intentional retired edges.
- No new test, function, sealed tunable or requirement. Mutation pairs and wrong-code runs are not applicable to this merge-only brief.
- Card: fix names no Precedent; no departure or helper duplication.
- Read the complete FEAT-039 known-bug file. No known bug was fixed; first-look and component-audit limitations remain unchanged.
- No HANDOFF, known-bug file or session archive was edited.
- Full suite and native Windows testing remain for CI under AGENTS.md. No push, CI read, issue operation, model launch, credential use or install occurred.
- Requested checks will also run on the final merge commit; the final response records that tip and their exits.
