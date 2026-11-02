# Plan — land-regenerate-generated

## Purpose

New capability within an agreed reading. The owner ruled on 2026-11-02 that "no conflict lane merge needs no CI". Lane land-clean-merge (branch `feat/land-clean-merge`, tip 1af2d93a, in review) makes `nana-land` build a clean merge of main into an accepted tip and land it without new CI or review; any textual conflict refuses (`cleanMergeTree`, `nana-land.mjs`). Its measurement (`docs/reviews/land-clean-merge-2026-11-02/merge-measure.txt`, `merge-recent.txt`) found 14 of 44 past merge builds textually clean, and 12 more that conflicted only in the generated `docs/code-map.md` and `docs/requirements-tree.md`. Its adversary (round 1, finding 4) asked that regeneration get "a separate, bounded generator contract". The seat's request: when the only conflicting paths are those generated files, `nana-land` resolves them by running their own generators on the merged tree, never by hand-merging. It checks that each generator's own check passes, and lands. Any other conflict, a generator failure, or a generator that changes any non-generated file still refuses, with refs and worktrees unchanged.

The 12 is an upper bound. Regeneration succeeding on those merges was not replayed, and qualifying CI was not checked (land-clean-merge attack 4).

## Design

1. **Sealed generator contract** in `packages/nana-pack/lib/land-config.mjs`, frozen, with provenance:
   - `docs/code-map.md`: write `node scripts/code-map.mjs --write`, check `node scripts/code-map.mjs --check`;
   - `docs/requirements-tree.md`: write `node scripts/requirements-tree.mjs --write`, check `node scripts/requirements-tree.mjs --check`;
   - one sealed per-command time limit;
   - argv arrays run with `process.execPath`, never a shell and never npm. Those are the generators `package.json` names (`map`, `map:check`, `req:tree`); the contract restates their script argv, so a `package.json` change cannot widen it.
2. **Eligibility.** `cleanMergeTree` runs `git merge-tree --write-tree` as now. On exit 1, the regeneration path runs only when every conflicting path is a contract path. Any other path still refuses as today, naming the paths. The attribute and `.gitattributes` refusals stay ahead of it.
3. **Regeneration in a temporary checkout.**
   - Create a detached temporary worktree outside the repository, under the OS temp folder, at the accepted tip. No branch and no ref.
   - Read the conflicted merge tree into its index and working files.
   - Run each contract write command for the conflicting generated paths, then every contract check command.
   - Stage only contract paths and write a tree.
   - Compare that tree with the merge-tree result: every non-contract path must be byte-identical, and status, untracked and ignored files must be clean. If anything else changed, refuse with "generator changed non-generated file", naming the files.
   - Remove the worktree and prune it in a `finally`, on every path, success or refusal.
4. **Landing.** The regenerated tree replaces `merge.tree`. The proof checks on the main contribution use the final tree. `commit-tree`, the CI re-read under the lock, the fast-forward and the containment checks are unchanged. The success line says that generated files were regenerated, naming them.
5. **Refusal vocabulary.** New sealed reasons: `generatorFailed`, `generatorCheck` and `generatorScope`, each pointing at `CLEAN_MERGE_REMEDY`.

## Assumptions

- A1: Both generators are deterministic for a given tree on every supported OS. CI already runs both checks on every leg, so a non-deterministic generator would already fail CI.
- A2: The generators read only the tree they run in, need no network, and write only their own output path. Design 3 enforces the last point.
- A3: A conflict marker in a generated file never affects its own generator, because each generator rewrites its output from sources. The contract paths are outputs only.

## Open choices

- O1: How the temporary checkout gets the conflicted tree: `git worktree add --detach` then `read-tree -u --reset`, or a plain temp directory with `GIT_INDEX_FILE` and `--work-tree`. Default: the worktree, with `git worktree remove --force` and `prune` in a `finally`. The builder may choose the alternative if it leaves no `.git/worktrees` entry even on a crash, and reports why.

## Questions for the owner

None. The owner's 2026-11-02 ruling covers landing a merge that needs no CI. This lane widens "no conflict" to "no conflict outside generated files, resolved only by their own generators", as the seat requested.

## Feature

Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane class: gate (land tool). The builder pastes `node scripts/lane-class.mjs --root . --files packages/nana-pack/bin/nana-land.mjs,packages/nana-pack/lib/land-config.mjs,packages/nana-pack/tests/land-regenerate.test.mjs,REQUIREMENTS.md`.

Base: `origin/feat/land-clean-merge` at 1af2d93a, as the seat directed. The seat merges main after that lane lands.

## Threat model

In scope: honest variation.
- Which generated paths conflict: one or both.
- Conflicts mixed with other paths.
- Generator failure, check failure, or a slow generator.
- A generator that writes outside its own path.
- Windows line endings and paths with spaces in the temporary folder.
- Crashes or refusals mid-regeneration.

Out of scope: a lane that deliberately ships a generator script built to forge its output while passing its own check. Reviewers see generator changes in the lane diff; this is a residual.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs`: `cleanMergeTree`, `mergeRefusal`, and the merge, proof, CI re-read and lock sequence (the land-clean-merge additions).
- `packages/nana-pack/lib/land-config.mjs`: the `CLEAN_MERGE_*` sealed values and their provenance comments.
- `packages/nana-pack/tests/land-clean-merge.test.mjs` and `packages/nana-pack/tests/land-fixtures.mjs`: the real-git clean-merge fixtures this lane extends.
- `packages/nana-pack/tests/land-clean-merge-race.test.mjs`: the CI re-read and lock race checks.
- `docs/reviews/land-clean-merge-2026-11-02/seat-mutate.mjs`: the seat pairs on the shared runner.
- `scripts/code-map.mjs` and `scripts/requirements-tree.mjs`: the generators' `--write` and `--check` modes. Read only.

## Outside precedent

git's own `merge-tree` (GPL-2.0), borrowed: `--write-tree` writes a tree with conflict markers on exit 1, and this lane rebuilds only the contract paths of that tree. No other public tool resolves generated-file conflicts by regeneration in this way that I know of.

## Must-meet

Rows R-3706 to R-3711 (FEAT-008).

- M1 (R-3706): a lane whose merge with main conflicts only in `docs/code-map.md`, or only in `docs/requirements-tree.md`, or in both, lands. Use a real-git fixture whose main and lane each add a module and a requirement row.
  - The landed tree's generated files equal what each generator writes on the merged sources.
  - Each generator's check passes on the landed tree.
  - Every other path equals the clean-merge result.
  - Parents are the tip, then captured main.
  - The success line names the regenerated paths.
- M2 (R-3707): a conflict in any non-contract path, alone or together with generated paths, refuses as today and names that path. Refs, the main checkout, the source tree and `git worktree list` are unchanged.
- M3 (R-3708): a generator that exits non-zero, or exceeds the sealed time limit, refuses with `generatorFailed`. A check that fails after the write refuses with `generatorCheck`. No temporary worktree or `.git/worktrees` entry remains.
- M4 (R-3709): a generator that also writes or deletes a non-contract file, tracked or untracked, refuses with `generatorScope`, naming the file. Nothing lands.
- M5 (R-3710): regeneration never runs a shell or npm. Use a fixture whose `package.json` `map` script is altered to write elsewhere: the land still uses the contract argv. A fixture whose working copy holds a stray hand-merged generated file shows the result equals the generator output, not the hand merge.
- M6 (R-3711): the contract is sealed. One seal check pins the two paths, their write and check argv, the time limit and the three new refusal reasons.

Seat wrong-code pairs (gate lane, `seat-mutate.mjs` on the shared runner):
- treat any conflict as regenerable (M2);
- skip the check after the write (M3);
- skip the non-contract diff (M4);
- run the generator through npm (M5);
- leave the temporary worktree on refusal (M3);
- land the conflicted tree without regenerating (M1).

Seat checks:
- `land-regenerate.test.mjs`, `land-clean-merge.test.mjs`, `land-clean-merge-race.test.mjs`, `land.test.mjs`, `land-merge.test.mjs`, `land-records.test.mjs` and `test-runner.test.mjs`;
- the map, readme, trace, tree and known-bugs checks, and the identity scan;
- the seat pairs, all red.

## Revision 2 (after `plan-attack.md`: 4 MUST, 3 SHOULD, all taken)

These changes override the sections above wherever they differ.

**Design 3, replaced (attack 1, 2, 3, 5).**
- *No registered worktree.* Regeneration uses an unregistered temporary directory under the OS temp folder, and a private temporary index file (`GIT_INDEX_FILE`). The merged tree reaches that directory through `git --work-tree=<temp> read-tree` and `checkout-index` against the repository's object store. It creates no `.git/worktrees` entry, no ref, and no change to the main checkout's or source tree's index. The `finally` removes only the directory and index file this land created and never prunes. A process kill leaves at most that temp directory and index file under the OS temp folder, and no repository state. That is the recorded crash residual.
- *Baseline.* The final tree is built from the private index after the generators run. It is compared with the merge-tree result tree: only contract paths may differ. Separately, the temp directory must have no unstaged change to a tracked non-contract file and no new untracked or ignored file outside the contract paths. The comparison is never HEAD-relative.
- *Configuration guard before execution.* Before running anything, the land reads the merged tree's generator configuration: the code-map configuration's `mapPath`, and the requirements-tree output path. It refuses with `generatorScope` unless each output path equals its contract path and each configured source root resolves inside the temp directory.
- *Outside-tree writes are a residual.* A generator script that writes outside the temp directory, despite the guard, is not detected; there is no filesystem confinement. The plan claims only the repository-diff boundary plus the configuration guard.
- *What counts from a generator.* Only exit codes and output bytes count. Report text is ignored. `requirements-tree.mjs`'s deliverable report reads HEAD (`scripts/deliverables.mjs:722-729`), not the merged index, so its diagnostics are not validation (attack 5). The generators run with their stdout and stderr captured and discarded beyond a bounded excerpt kept for a refusal message.
- *O1 is decided:* the unregistered directory. If a generator needs a git repository to exit 0, for example the HEAD query, the builder sets `GIT_DIR` to the repository and `GIT_INDEX_FILE` to the private index for the child. The builder reports what each generator needed.

**Consumer contracts (attack 4).** Update together, with the same wording everywhere:
- R-3691: a conflict refuses, except a conflict only in contract paths, which this lane resolves by regeneration.
- R-3696: agreement now covers the generated-file exception.
- `templates/_shared/working-under-nana-pi.md` and the rendered region of `AGENTS.md`, regenerated the repository's usual way.
- `packages/nana-pack/README.md`.
- The M9 guidance-agreement check in `land-clean-merge.test.mjs`, extended.
- The ruling line in `packages/nana-pack/rules/nana-rulings.md` (33) keeps the owner's words. It gains one clause: "a conflict only in generated files that their own generators rebuild counts as no conflict". **Question for the seat (default: go):** the clause widens the owner's 2026-11-02 ruling text. If the seat or owner says no, the builder leaves the ruling line untouched, the guidance says "generated-file conflicts resolved by their own generators" under the same exemption, and M9 checks guidance and README only.

**Fixtures (attack 6).**
- Write success then check failure: a fixture generator pair whose write exits 0 and whose check exits non-zero, injected through the contract argument in the test, not the sealed config.
- Hand-merged decoy: main and lane each edit `docs/code-map.md` differently, so the conflicted blob carries markers. The result must equal the generator output, not either side and not the markers.
- Tree comparison independently of status: a fixture generator that stages, in the private index only, a non-contract change; it must be caught by the tree comparison.
- An ignored-file write, a modify/delete conflict on a contract path, and a rename conflict whose destination is a non-contract path.

**Determinism (attack 7).** The builder records, in `determinism.txt`, both generators run twice on this tree in a temp copy whose path contains a space, under `core.autocrlf` false and true. It gives the output SHA-256 for each run, and the hashes must match.

**Must-meet, revised.**
- M1 adds main-only tracked additions to the fixture, and the decoy markers.
- M2 adds the modify/delete conflict and the non-contract rename destination.
- M3 adds the write-ok/check-fail case.
- M4 adds the index-only and ignored-file cases and the configuration guard.
- M5 is unchanged.
- M6 pins the contract, the time limit and the three reasons.
- M7 (R-3712): the guidance, rendered AGENTS region, README and ruling (or not, per the seat question) state the generated-file exception in matching words, via the extended M9.

Rows R-3706 to R-3712 (FEAT-008), plus R-3691 and R-3696 amended.

**Seat pairs**, unchanged in list, plus:
- skip the configuration guard (M4);
- compare against HEAD instead of the merge-tree result (M1);
- prune all worktrees (a check that an unrelated stale registration survives).
