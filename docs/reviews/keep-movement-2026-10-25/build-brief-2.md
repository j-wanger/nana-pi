Feature: FEAT-007 · Review a specific revision independently. Lane keep-movement. Class: hook. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/keep-movement, on top of the commit that adds this brief. Session 1 built the lane (b7fe4740), and it works: its full suite passed, the independent check found nothing material, and every written movement file matched the helper's section. The seat's pairs (`seat-mutate.mjs`) found two test gaps, which session 1 also reported: pair 13a (keep's movement-write `catch` calls `die`) and pair 16a (keep's final no-text refusal removed) both survive. No fixture makes the movement write itself fail. R-2912's directory case is caught by the regular-file guard before any write, and R-2913's failing case refuses at the early check before the movement step. Both rows already promise the behaviour; only their tests miss a case. This session changes `packages/nana-pack/tests/keep-movement.test.mjs` only. Do not edit REQUIREMENTS.md, product code, HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, or any review-folder file.

Precedent:
- packages/nana-pack/tests/keep-movement.test.mjs:100-120 — R-2912's two cases, the not-computed case and the planted-directory case; the new case follows the planted-directory case's form.
- packages/nana-pack/tests/keep-movement.test.mjs:122-135 — R-2913's success and trunk cases; the new case sits after them.
- packages/nana-pack/bin/review-ledger.mjs — keep's movement block, the regular-file guard, the write's `catch` and the final no-text refusal (session 1's change).

No private helper moves to a shared module.

The task:
1. R-2912: add a third case. In a lane folder for an item with one kept review text, pre-create `tree-movement.md` as a regular file holding known bytes, then make it read-only with `chmodSync(target, 0o444)`. Run keep. Assert exit 0; the review text is kept; stderr holds exactly one line, naming the movement file and the write's error code; the read-only file still holds its known bytes. The write fails with EACCES on POSIX and EPERM on Windows; assert the warning names one of them, not a fixed code. Restore the mode with `chmodSync(target, 0o644)` in a `finally`, so cleanup can delete it on Windows.
2. R-2913: add a third case. For an item with no kept review text in a repository whose HEAD holds a ledger, pre-create a read-only `tree-movement.md` the same way. Run keep. Assert exit 1, `no kept text` on stderr, one warning line naming the movement file, and the file's known bytes unchanged. Restore the mode in a `finally`.
3. If the process runs as root, a read-only file can still be written. Detect that once (`process.getuid?.() === 0`), print a SKIP line naming the reason for both new cases, and skip them, as the suite's other permission checks do; say so in your report if you hit it.

After your commit, run `SEAT_MUTATE_TIP=HEAD node docs/reviews/keep-movement-2026-10-25/seat-mutate.mjs 13a 16a` with SEAT_MUTATE_OUT unset (console only); each must turn its named rows red. Then run it with no pair numbers; every pair must be red. Amend your commit only if a pair still survives, then run both again. Do not commit any file the runs leave.

Checks before your commit: `npm test -- packages/nana-pack/tests/keep-movement.test.mjs packages/nana-pack/tests/review-ledger.test.mjs`; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked` whole, with its output kept out of the worktree; then `git status --short` must print nothing after the commit. Keep every escape sequence in test literals intact. Do not run the install check. Do not push.

Seat check: `node docs/reviews/keep-movement-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Commit once, with explicit paths.

Done: pairs 13a and 16a turn their rows red; every pair is red; only the test file changed; the full suite is green; `git status --short` is empty; and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; both pair runs' RESULT lines; the full suite's summary line; map, readme, trace, tree and seat-check status.
