# Memory curation — refreshed main merge

## Commits and files

The shared origin/main ref advanced during the first merge's checks. The first merge commit is `4ef1a77b677532c8c5e7695708effac469df1b90`, with parent main `5e7b779ba85eed00892c1c0963ee8af1d6d85350`.

This second merge includes current main `68a616bc35605e23d93955e8b40262e27115b843`. Its only conflict was docs/code-map.md, regenerated with its generator. The requirements tree was regenerated too. Other files auto-merged, preserving main's transcript-reader changes alongside curation's existing skip logic. There is no new lane behavior.

Files resolved or generated: docs/code-map.md and docs/requirements-tree.md. Files merged automatically include REQUIREMENTS.md, docs/sessions/2026-10.md and packages/nana-pack/lib/memory-making.mjs. The review folder holds verification output and this record. Two first-merge logs replace local checkout paths in Node warning text with <checkout>, so the identity scan passes.

Rows R-3560–R-3577, SUB-027 and A-100 are unchanged. No requirement, test or tunable was added. No new mutation pair applies; earlier build pairs remain recorded in build-record.md. The first merge's sole existing-test resolution took main's requirements-tree.test.mjs whole. The second merge edits no test. No precedent departure.

## Preservation

merge-2-preservation.txt verifies:

- No unrelated tracked file differs from current main.
- Every lane-only source, test, README, command and requirement addition/deletion matches the first merge's lane-only diff.
- The heading test equals current main byte-for-byte.
- Every session entry from both parents stays whole; dates remain newest first.
- Known-bug files equal current main. No known bug is fixed, added, removed or widened by this merge.

The preservation script initially exited 1 because its allow-list omitted new verification files, then because its comparison included unrelated main changes. The corrected comparison uses the first merge's lane-only diff and passes. The identity scan initially exited 1 on two first-merge logs' local paths; the path-neutralized logs pass. No product or assertion was changed for these checks.

## Green verification

Every command below exited 0 before committing. Full output uses the merge-2- prefix in this folder.

- npm run map
- npm run req:tree
- node packages/nana-pack/tests/memory-curation.test.mjs
- node packages/nana-pack/tests/memory-making.test.mjs
- node packages/nana-pack/tests/requirements-tree.test.mjs
- node packages/nana-pack/tests/test-runner.test.mjs
- npm run map:check
- npm run readme:check
- node scripts/requirements-trace.mjs
- node scripts/requirements-tree.mjs --check
- node scripts/known-bugs.mjs --root .
- node scripts/identity-scan.mjs --root .
- Preservation comparisons
- git diff --check

All brief-named checks will run on the last merge commit before plain git push. Their final-tip output stays in OS temporary storage, leaving the verified commit unchanged. The final report gives their exit codes.

## Final-tip log cleanup

The second merge committed as `55b4c3ed4af3fab07c49e1bf179583d86c055ed2`. Every requested final-tip check passed except identity (exit 1): the scanner now included the newly tracked second-merge trace and known-bug logs, whose Node warnings contained local checkout paths. The follow-up replaces those paths with <checkout>, as for the first logs. No code, rows, tests or generator output changes. The full requested checks run again on the cleanup commit before push.

## Not done

CI is the suite. No locked full suite, CI inspection, model session, subagent, real store, paid call, Windows machine run, issue operation, install check or land. No writes to the prohibited reference folders. Main's known-bug deletions remain deleted. Review remains seat work.
