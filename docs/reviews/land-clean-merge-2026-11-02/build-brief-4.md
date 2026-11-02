Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-clean-merge. Class: gate. Builder: pi-worker (small lane). Build session 4, on tip ba9fcba4. Round 1 (kept in this folder): Opus LAND, independent check PASS, land reviewer SEND-BACK. Read `r1-land-ba9fcba4.md` and `r1-reviewer-ba9fcba4.md` whole.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs` (the clean-merge eligibility checks around lines 64-77, `needsMerge`)
- `packages/nana-pack/lib/land-config.mjs`
- `packages/nana-pack/tests/land-clean-merge.test.mjs`

Report each departure.

## Build

1. MUST (land reviewer): merge-driver and attribute checks are not rename-aware. Reproduced: attributes select `new.txt merge=keep`; the lane renames `old.txt` to `new.txt` and edits it; main edits `old.txt`; with a configured keep driver the land succeeds and drops main's edit. Check rename destinations (and sources) on both sides before calling merge-tree, refuse when a path either side changed, under any name, has a `merge` attribute, with refs and worktrees unchanged; add this exact case as a refusal regression test.
2. SHOULD (land reviewer), taken because it contradicts plan Q3: when both sides changed a generated path (`docs/code-map.md`, `docs/requirements-tree.md`), refuse even if git merges them cleanly; regression test with separate-hunk edits on both sides. Name the generated paths once in config.
3. SHOULD (Opus): a tip main already contains (main is a descendant of the tip) must not produce an empty merge; refuse as before this lane, with a test.

Change nothing else. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every land test file, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Record one wrong-code pair per item (the current tip's code fails each new test). Do not run the locked full suite; CI is the suite. Commit and stop; do not push (the seat pushes).
