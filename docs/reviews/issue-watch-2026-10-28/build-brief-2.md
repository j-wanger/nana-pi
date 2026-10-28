Feature: FEAT-002 · Resume decisions and next actions

Lane issue-watch. Class: hook. Builder: pi-worker (larger lane). Build session 2.

Work in the lane worktree on feat/issue-watch at fefea3b9 (main merged). The plan of record is `plan.md` beside this brief. Read `independent-check-fefea3b9.md` and `seat-pairs-fefea3b9.md` beside it. Fix the points below. Do not edit `docs/known-bugs/` or `HANDOFF.md`.

From the independent check:

1. **No comment lost to clock drift.** The resume cursor comes from GitHub's time, never the local clock: the newest `created_at` seen, or the response's `Date` header when no comment arrived, minus a sealed overlap window. Dedupe by comment id covers the overlap. Pin it with a seam test where the local clock runs 3 s ahead and a comment shows up 800 ms late.
2. **Org-owned repos.** For an org-owned repo, a comment counts as the owner side when its `author_association` is `OWNER` or `MEMBER`. The line names the author's login. Pin both owner kinds.
3. **The seat's own comments.** Add one sentence to the carry rule in all three copies, after "Only the seat posts, from the owner's gh account.": "The seat starts each issue comment it writes with `Seat:`." Update R-682's sentence pin. The watch prints such a comment as `issue #<n>: a seat comment` with no text. In pi it is never delivered to the model and starts no turn. Seal the marker.

From the seat's wrong-code pairs (each was a wrong version the tests missed):

4. **Pair V:** run the real command, not only the library, on an opted-in project with a fake gh, and pin that it keeps polling, prints the owner comment and ends with the restart line.
5. **Pair P:** a HANDOFF whose pointer is unreadable gets no watch line in the session-start block.
6. **Pair I:** each failure kind prints its own cause; pin each one.
7. **Pair L:** the watch's default gh runner is the asynchronous one; pin it without injecting a runner.
8. **Pair O:** the command exits 0 at once with no gh call under `NANA_ROLE=worker` and `NANA_ROLE=reviewer`.

Then run the seat's harness once against your result (`seat-pairs-fefea3b9.md` lists the pairs) and report which turn red.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Rows R-2990 to R-2999 stay `implemented`, R-682 stays `implemented`, and the locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each fix and its test; the pairs result; the rule bullet as it now reads; each departure from the Precedent below; every existing test you changed.

## Precedent

- `packages/nana-pack/lib/issue-watch.mjs` and `packages/nana-pack/bin/nana-issue-watch.mjs`: build 1's watch.
- `packages/nana-pack/lib/gh-runner-async.mjs`: the asynchronous runner.
- `packages/nana-pack/lib/handoff-issues.mjs`: the org-owner probe.
- `packages/nana-pack/tests/templates-render.test.mjs`: R-682's sentence pin.
- `packages/nana-pack/tests/issue-watch.test.mjs`: build 1's tests.
