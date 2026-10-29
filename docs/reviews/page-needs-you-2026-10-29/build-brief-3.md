Feature: FEAT-039 · See the product and its decisions in one report

Lane page-needs-you. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on the tip of build 2.

The plan of record is still `docs/reviews/page-needs-you-2026-10-29/plan.md`. The seat ran first-look and the new outside reader on build 2; the reader's answer is `outside-reader-build2.md` beside this brief. It found one defect and one layout point the seat takes.

## 1. Each question shows its own recommendation (R-3055)

In the Decisions view, every question group of an issue ask shows `ask.recommendation`, the first group's default, instead of its own. On today's page, issue 256's "Which model reads?" shows the timing answer, and issue 255's "Which asks should the Overview list under Needs you?" shows "yes". The parser is right: each group already carries its own `default`. Render `Seat recommends:` per group from that group's `default`, falling back to `ask.recommendation` only when the group has none, then to `Seat recommends: none recorded`. Pin it in the R-3055 test with a two-group fixture whose defaults differ, asserting each group shows its own.

## 2. The Records summary shows counts (R-3050)

The closed section's summary reads `Records: Broken, Gaps and Stale`, so the owner cannot see whether it holds problems. Change it to `Records: Broken <b> · Gaps <g> · Stale <s>`, where each number is the number on the first line of that block: Broken from `Violated: <n>`, Gaps from `Deliverables code does not make and read: <n>`, Stale from `Feature assessments out of date: <n>`. On today's page that reads `Records: Broken 5 · Gaps 0 · Stale 34`. The section stays closed. Pin the exact words with a fixture in the R-3050 test, and update R-3050's row to the new summary words.

Numbers that must not move: the Overview order; the cap of three listed asks; the label set; the Overview's per-ask lines, which already use the first group.

Also add these known-bug lines, carried from the reader-at-land review, to `docs/known-bugs/FEAT-039.md`, exactly as written:

- Outside reader (reader-at-land, final review): the finding split sees only numbered items, so a bulleted or headed answer prints "0 findings" although `reader.md` holds findings.
- Outside reader (reader-at-land, final review): a `--from` folder with no `accessibility-diff.txt` fails the run with "purpose or page capture failed", though the plan expected the diff to be left out quietly.
- Outside reader (reader-at-land, final review): an answer of "1. None" counts as one finding with its quote not found.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each new or changed test title; the Records summary and issue 256's three Decisions recommendations as the built page shows them; each departure from the Precedent; every existing test you changed.

## Precedent

- `scripts/product-report.mjs`: the Decisions card renderer and the Records summary from builds 1 and 2.
- `packages/nana-pack/tests/product-report.test.mjs`: the R-3055 test.
- `packages/nana-pack/tests/product-overview.test.mjs`: the R-3050 test.
