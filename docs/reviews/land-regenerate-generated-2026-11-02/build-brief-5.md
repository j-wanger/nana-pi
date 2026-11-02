Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-regenerate-generated. Class: gate. Builder: pi-worker (small lane). Build session 5, on the Mac, on `feat/land-regenerate-generated`.

Round 1 reviews are in this folder: `r1-opus.md` (SEND-BACK, one MUST), `r1-land.md` (LAND, one SHOULD on the same defect), `r1-independent-check.md` (PASS).

Fix, and nothing else:
1. MUST M-1 from `r1-opus.md`: build 4's merge of main deleted two sections of `packages/nana-pack/README.md` that merged without conflict: `## Memory curation` (about 70 lines) and `#### Builder and reviewer credentials` (about 22 lines). Restore both blocks verbatim from `origin/main`, in the same place relative to their neighbours as on main. Then check that `git diff origin/main...HEAD -- packages/nana-pack/README.md` shows only this lane's regeneration text and no other deletion.
2. Correct item 6 of `build-4-report.md`, which wrongly says the README resolution removed only main's now-false blanket statement. Add one line saying what was restored and why.
3. Append exactly one line to `docs/known-bugs/FEAT-008.md` for the SHOULD: "- Generated-file regeneration (land-regenerate-generated, review round 1): the shared guidance says code-map and tree conflicts count as no conflict, but scaffolded projects lack one of the two generators, so such a conflict there refuses with generatorScope ENOENT."
4. Merge current `origin/main`. Take main's side for `docs/code-map.md` and `docs/requirements-tree.md`, then regenerate with `npm run map` and `node scripts/requirements-tree.mjs --write`. For `docs/known-bugs/*.md`, keep both sides' lines.

Then run `node packages/nana-pack/tests/land-regenerate.test.mjs`, `node packages/nana-pack/tests/land-clean-merge.test.mjs`, `npm run -s readme:check`, `npm run -s map:check`, `node scripts/known-bugs.mjs --root .`, and `node scripts/identity-scan.mjs --root .`. Commit. Write your report to `build-5-report.md` in this folder, with every changed file and every command's exit code.

Edit only `packages/nana-pack/README.md`, `build-4-report.md`, `build-5-report.md`, `docs/known-bugs/FEAT-008.md`, and the files the merge touches.

## Precedent

- `packages/nana-pack/README.md`: `origin/main`'s version is the source for both restored blocks; copy them, don't rewrite them.
- `docs/known-bugs/FEAT-008.md`: the existing one-line entry format.
