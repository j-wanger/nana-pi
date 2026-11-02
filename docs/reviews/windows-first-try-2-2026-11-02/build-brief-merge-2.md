Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-first-try-2. Class: ordinary. Builder: pi-worker (small lane). Merge build, on branch tip 2a1479f6. Every reviewer said LAND at the previous round (kept in this folder), but main moved to 6ad0b67c before the land. This build merges main and records the last review's notes.

## Precedent

- `docs/sessions/2026-10.md`

Report each departure.

## Build

Merge `origin/main` into `feat/windows-first-try-2`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug lines, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.

Then record the round 1 review notes, each line naming "(windows-first-try-2, review round 1)", in each file's existing line style. In `docs/known-bugs/FEAT-031.md`: (1) the `CLAUDE_PROJECT_DIR` control in objective-golden now requires "file not found" but runs the hook once with no retry, so it can fail under load; (2) R-3540 and R-3541 cite checks that still pass with the new helpers removed, and `m2-retry.mjs` tests its own predicate rather than `isLoadMarker`; (3) the T17 retry exclusion is keyed on the label text "T17 " and also drops the retry from two T17 cases that refresh no lock; (4) the golden retry treats an occasional producer crash as load, so a crash is hidden from the corpus. In `docs/known-bugs/FEAT-013.md`: (5) the older record that R-1713 failed once at 7d03134b was replaced rather than kept. Add one session entry for this lane to `docs/sessions/2026-10.md`, newest first, and run `nana-writing` on it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
