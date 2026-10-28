Feature: FEAT-039 · See the product and its decisions in one report

Lane page-on-pages. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/page-on-pages. The seat merged main at 60b7b9f1, which carries the posting-rule land. The plan of record is `docs/reviews/page-on-pages-2026-10-28/plan.md`. The seat's check of build 1 is `seat-check-0867e56e.md` beside it: read it whole. Fix MUST 1 and SHOULD 2 to 9 there. The seat records the NOTE items as known bugs itself; do not edit `docs/known-bugs/` or `HANDOFF.md` in this build.

What each fix must do:

1. Delete the `actions/configure-pages` step from `.github/workflows/pages.yml`. The build job keeps only `contents: read` and `issues: read`. The README's Product report section stays true.
2. When the issue read fails, the Overview's asks line does not show zero counts. It says the count is unknown and carries the failure notice. Pin the drawn Overview text.
3. The R-2981 and R-2984 checks pin what the owner sees, through the drawn views, not only the model:
   - an ask's Kind line, such as `blocking`;
   - the Overview asks line with its counts;
   - the cap note at the cap, and no note below it;
   - the drawn Issues paragraph for a failed read.
4. Must-meet 4 holds. A project with list asks gets main's exact Decisions drawing: `el("h3", ask.title, card)` and an Ask line even when the body is empty (main at aae8662a, `scripts/product-report.mjs:443`). Its model carries no `nextItems` or `issueNotice` key. Pin the drawn Decisions view for a list-ask fixture against main's output, captured once and committed as the expected text. Update R-2983's row to what the check proves.
5. R-1012's WHEN clause adds the open issue list and its read outcome. Keep the elapsed milliseconds of a failed read off the page if that is simpler than naming them.
6. The R-2450 case at `packages/nana-pack/tests/product-report.test.mjs:1074-1076` calls the live GitHub API. Give it a stub reader. No test may call the network: check with a gh on PATH that logs each call and fails.
7. R-1014's Read by line describes the land copy again, for example `person: the seat reads the land copy's test status at each land (issue 243)`. A-085 keeps its own Read by line.
8. The tests import `CI_READ_TIMEOUT_MS` from `packages/nana-pack/lib/land-config.mjs`; no `30_000` literal.
9. The workflow test fails when `github.event` appears anywhere in a run step, a `run: |` block included. It pins the upload path as exactly `site`.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Rows R-2980 to R-2986 stay `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each fix and the test that pins it; the workflow file as written; the Overview asks line for a failed read; the gh call log from fix 6; each departure from the Precedent below with its reason; every existing test you changed.

## Precedent

- `scripts/product-report.mjs` at aae8662a, line 443: main's Decisions drawing for list asks.
- `scripts/product-report.mjs:975-1000`: the Overview lines and the issue model this build added.
- `packages/nana-pack/tests/product-report.test.mjs:46-47`: `fixture()` appends a list ask so the reader is never called.
- `packages/nana-pack/tests/product-report.test.mjs:1807-1830`: the R-2981 to R-2984 checks.
- `packages/nana-pack/tests/pages-workflow.test.mjs`: the workflow checks.
- `packages/nana-pack/lib/land-config.mjs:27`: `CI_READ_TIMEOUT_MS`.
- `REQUIREMENTS.md`: R-1012, R-1014's lines at 2247-2249, R-2983.
