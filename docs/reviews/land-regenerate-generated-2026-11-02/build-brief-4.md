Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-regenerate-generated. Class: gate. Builder: pi-worker (larger lane). Build session 4, on the Mac, on `feat/land-regenerate-generated` at a60abaa8.

Task: merge `origin/main` into this branch. Builds 1 to 3 were based on land-clean-merge at 1af2d93a. That lane then took one more build (rename-aware merge-driver checks, separate-hunk edits to a generated file refused, re-landing a contained tip makes no empty merge) and landed on main at 69727fbf. The merge conflicts in `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/README.md`, `packages/nana-pack/rules/nana-rulings.md`, `REQUIREMENTS.md` and the two generated files.

Resolve so both changes hold:
- main's land-clean-merge behaviour, rows and tests stay exactly as landed;
- this lane's regeneration of the code map and requirements tree (plan Revision 2, rows R-3706 to R-3712, amended R-3691 and R-3696) applies on top of it. Where main now refuses a merge that this lane regenerates, this lane's rule wins only for the two generated paths; every other refusal main added stays.
- the ruling line keeps main's text plus this lane's one clause.
- generated files: take main's side, then regenerate with `npm run map` and `node scripts/requirements-tree.mjs --write`.

Then run `node packages/nana-pack/tests/land-clean-merge.test.mjs`, `node packages/nana-pack/tests/land-regenerate.test.mjs`, the rulings test, `npm run -s map:check`, the trace, tree and README checks. Commit the merge. Report every conflict hunk you resolved and the side you took, in `build-4-report.md` in this folder.

Edit only the conflicted files, this lane's own tests where main's new tests or fixtures require it, and `build-4-report.md`. No other change.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs`: main's `cleanMergeTree` and this lane's `regenerateTree`; keep both.
- `packages/nana-pack/tests/land-clean-merge.test.mjs`: main's version is the contract for clean-merge behaviour.
- `packages/nana-pack/tests/land-regenerate.test.mjs`: this lane's must-meet tests M1 to M7.
