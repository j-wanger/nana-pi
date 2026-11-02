Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Build session 4. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

The plan of record is `docs/reviews/knowledge-busy-2026-11-02/plan.md` (revision 2). Review round 1 ran at 92175160, and its texts are kept in this folder:
- the Opus reviewer: SEND-BACK, with one MUST;
- the astra land reviewer: LAND;
- the independent check: PASS.

This session fixes the MUST and records the reviewers' other findings. Change nothing else.

## Findings

1. **MUST, from the Opus reviewer.** `packages/nana-knowledge/tests/build-busy.test.mjs:80` calls `fs.mkdtempSync(path.join(os.tmpdir(), "nk-busy-"))` directly. The R-917 source check (`packages/nana-pack/tests/test-runner.test.mjs:666-672`) fails every suite leg on that call; CI run 41390908816 showed it. Use the folder's existing helper instead: `import { tmpDir } from "./tmp-dir.mjs"` and `tmpDir(path.join(os.tmpdir(), "nk-busy-"))`. Then run `node scripts/test.mjs packages/nana-pack/tests/test-runner.test.mjs packages/nana-knowledge/tests/build-busy.test.mjs`, and record the result in `build-4-tests.txt`.
2. **Known-bug lines.** This brief authorizes editing `docs/known-bugs/FEAT-013.md`. Add four lines, each naming "(knowledge-busy, review round 1)":
   - (a) R-3591's "every one of 10 runs" under churn failed once on the Linux CI leg (noPull=1) at 10398568.
   - (b) The M5 Windows load run did not reach ten consecutive loaded passes. Most of the failures were other SessionStart hooks timing out.
   - (c) Dropping recovery's explicit `busy_timeout=0` would go unnoticed, since recovery would then wait only 100 ms.
   - (d) The build's final `wal_checkpoint(TRUNCATE)` can now wait up to 5 s for readers.

   PR #317 has not landed on origin/main (checked by the seat when this brief was written), so leave the existing FEAT-013 busy-timeout line in place. Check `git log origin/main` once more: if PR #317 has landed by the time you run, remove that line instead, and say so.
3. **README.** In `packages/nana-knowledge/README.md`'s hook budget section (the "Budget: normally well under 1500 ms" bullet, around line 180), add one sentence. It says that a query may now wait up to 100 ms on a database lock, and a build up to 5 s.

## Constraints

- Edit only:
  - `packages/nana-knowledge/tests/build-busy.test.mjs`;
  - `docs/known-bugs/FEAT-013.md`;
  - `packages/nana-knowledge/README.md`;
  - the lane folder.
- Keep every check title and assertion.
- No committed text names a person or a machine path.
- Never read, print or use a stored credential: no `git credential fill`, and no GitHub API calls.

## Done when

- Both test files pass.
- These are green:
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `nana-writing` on the four new known-bug lines and the README sentence;
  - `node scripts/identity-scan.mjs --root .`.
- Commit explicit paths on `feat/knowledge-busy`.
- Push the branch with plain `git push origin feat/knowledge-busy`, then stop. If the push fails, report it and stop.

Report the test result, the four lines, the README sentence, the push result, and each departure from the Precedent.

## Precedent

- `packages/nana-knowledge/tests/tmp-dir.mjs`: the folder's temp-folder helper that R-917 requires.
- `packages/nana-pack/tests/test-runner.test.mjs`: the R-917 source check, at lines 666-672.
- `docs/known-bugs/FEAT-013.md`: the existing line format.
- `packages/nana-knowledge/README.md`: the hook budget section.
