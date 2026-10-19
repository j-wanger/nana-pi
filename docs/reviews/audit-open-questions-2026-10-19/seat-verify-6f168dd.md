# Seat checks — audit-open-questions build 1, tip 6f168dd (2026-10-19)

- CI run 39286929276 on draft pull request #47 (6f168dd; GitHub's merge into b8616fb, merge commit 053408a):
  - Windows `156 files: 139 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6458 pass, 0 fail, 84 skip` (`ci-windows-run-1.log`).
    The 17 skips are the 16 declared desk files and study-tasks (`needs apps/bench/.ext/pi-web-access`).
    `PASS  packages/nana-pack/tests/product-report.test.mjs  65 pass  46.6s`; requirements-trace 61, requirements-tree
    89, code-map 48 and readme-check 11 pass there too.
  - macOS `156 files: 154 PASS, 0 FAIL, 2 SKIP` (7,532 checks); product-report 65 pass (log not copied).
  - Ubuntu 154 PASS, 0 FAIL; product-report 65 pass (log not copied). Main's known Ubuntu failures (path-spelling GP1/GP2)
    do not appear: GitHub merged onto b8616fb, which already carries linux-path-spelling's fix.
  - install-check: macOS and Windows success.
- Builder's report (Claude Sonnet 5), not re-run by the seat: R-1570 red before the code (no open-questions list on the
  page), green after with the exact five-entry CRLF fixture list in file order; R-1571 red before in both cases (no
  heading; preamble only: no "none recorded" line), green after. Wrong code W1 to W9 each turned its named check red, then
  reverted: W1 drop continuation lines, W2 sort by number, W3 skip bullets (R-1570); W4 list the preamble and W5 read past
  the next heading (R-1570 and R-1571); W6 throw on a missing heading (R-1571, a crash at its fixture); W7 render entries
  as `article` (R-1570 and the existing R-1018 check); W8 the none message at module scope (R-1571, a ReferenceError
  inside the page's own `vm` context); W9 parse a fresh raw read (R-1570, on the CRLF fixture). Single files on the tip:
  product-report 65, requirements-trace 61, requirements-tree 89, code-map 48, readme-check 11. The page it generated to
  a temp folder held one phrase from each of questions 13 to 23.
- Seat checks on the tip (macOS): questions 13 to 23 match `must-meet.md` word for word (11 of 11, each with its audit
  prefix), and question 3 carries the closing prefix; no row text changed. R-1570 and R-1571 read `implemented`, each
  check with its `// req:` marker directly above it. `requirements-trace`: 1,275 rows (988 implemented, 1 planned, 18
  retired, 262 untested, 6 violated), 0 off EARS form; the one planned row is R-539, as on the base. `map:check`: 297
  modules, 0 problems.
- Tree movement (`requirements-moved --root . --base main`, merge-base b8616fb): 2 rows in FEAT-039 — R-1570 and R-1571
  new (implemented).
- No wrong-code pairs and no independent check: an ordinary lane (the report script, its test, ledger prose). No findings
  to settle.
- Main moved after the cut: study-stop landed, and main is f29827a. A merge of main before the land meets HANDOFF's
  Landed tail, the Next 7 small-fixes line and the REQUIREMENTS-decisions ask, which both branches edit, plus the session
  file's top and the tree test's leaf total: main reads 1,278, so the merge should read 1,280 (inferred: 1,278 + 2).
- Known limits in `must-meet.md` stay open: closed questions still list; a `*` bullet continues the entry above; a
  scaffold placeholder lists as entry 1; the verification's extra findings are out of scope. HANDOFF carries each as an
  "Open questions in the report" residual. The page is git-ignored; the seat regenerates and republishes it after the land.
