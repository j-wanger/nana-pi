# Seat checks — report-test-details build 1, tip 4c975f7 (2026-10-19)

- CI on draft pull request #44, run 39270074838, GitHub's merge of 4c975f7 into main 06a874a (merge commit 38b8ddb):
  macOS `154 files: 151 PASS, 1 FAIL, 2 SKIP` (`ci-macos-run-1.log`); Ubuntu `154 files: 150 PASS, 2 FAIL, 2 SKIP`;
  Windows `154 files: 132 PASS, 1 FAIL, 21 SKIP`; install-check macOS and Windows success.
- product-report.test passes on all three legs: macOS `PASS  packages/nana-pack/tests/product-report.test.mjs  63 pass
  34.3s`, Ubuntu `63 pass  16.7s`, Windows `63 pass  36.9s`.
- The one failure on every leg is requirements-tree.test's R-291 leaf total (`leaf total is not 1,248`), a merge artifact:
  the lane and main 06a874a each raised the literal from 1,242 to 1,248 for their own six rows, so the merge keeps one
  1,248 while its tree holds 1,254 (inferred: 1,242 + 6 + 6). The seat's merge of main before the land recomputes it;
  main at ca27d86 reads 1,255, so that merge should read 1,261 (inferred).
- Ubuntu's other failure is path-spelling GP1 and GP2, main's Linux regression, fixed on main by linux-path-spelling.
- No wrong-code pairs and no independent check: an ordinary lane. Per the builder's report, every listed mutation turned
  its named row red.
- Seat probe of red-first: the tip's test file run against the base's `scripts/product-report.mjs` and template, in a temp
  copy, failed the six new checks (R-1510 to R-1515) and passed the widened byte-identical check (R-1012), as the plan
  predicted. The builder's report says all seven were red; for the widened check that is not so, and the plan never
  asked it to be. The same file passes 63 of 63 at the tip.
- The real page (`node scripts/product-report.mjs --out <seat-scratch>/rtd-page.html` at 4c975f7): R-1058, R-1063,
  R-1064, R-1330 and R-1340 list 5, 5, 3, 1 and 1 cited tests, every one `SKIP · changed since`; a FEAT-039 test links
  to `https://github.com/<owner>/nana-pi/blob/4c975f761d75e5d11990768b2cda083b3056eea6/packages/nana-pack/tests/product-report.test.mjs`.
  1,248 rows carry 2,697 cited tests over 151 files; 286 rows cite none, 0 of them implemented.
- Observation for the reviewer, not a finding: the page legend's second sentence starts lower case ("… hide a skipped
  check inside it. copies run from a temporary folder …"), because the legend joins `NOT_COUNTED` as written.
- Known limits 1 to 8 of `must-meet.md` stay open; the page legend states 2 and 3, the README none. HANDOFF carries
  each as a residual.
