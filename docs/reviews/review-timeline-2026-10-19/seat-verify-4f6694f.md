# Seat checks — review-timeline build 1, tip 4f6694f (2026-10-19)

- CI on the draft pull request, run 39288522267, GitHub's merge of 4f6694f into main b8616fb (merge commit c866bbf):
  Windows `157 files: 140 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6467 pass, 0 fail, 84 skip` (`ci-windows-run-1.log`);
  macOS 157 files, 155 PASS, 0 FAIL, 2 SKIP (7,541 checks); Ubuntu 155 PASS, 0 FAIL; install-check macOS and Windows
  success. None of main's known failures showed.
- review-timeline.test passes 11 of 11 on all three legs (the six must-meet checks and five setup checks); Windows
  `PASS  packages/nana-pack/tests/review-timeline.test.mjs  11 pass  11.7s`.
- Per the builder's report (Claude Sonnet 5, build 1 964dee6), each must-meet check turned red under its named wrong
  code, 18 tries in all. RT1 (R-1560): group rounds by role, number a round per review, drop the repo filter, skip
  canonicalItem. RT2 (R-1561): take every list item, take bold labels, end a section at its first sub-heading, split on
  `\n` only (the CRLF fixture), read the verdict from the last nonblank line, match MUST only at line start. RT3
  (R-1562): skip the verdict cross-check, print nothing for a missing file. RT4 (R-1563): print `undefined`, drop the
  unverified mark, print the over-cap reason raw; the builder caught and fixed a vacuous pass in its own first draft.
  RT5 (R-1564): print the recorded absolute path. RT6 (R-1565): write the timeline beside the review files, write a
  cache beside the tally.
- Among existing tests only the R-291 leaf total changed: 1,273 on main b8616fb, 1,279 at the tip.
- 6502aa8 is the seat's merge of main b8616fb. After it the seat found that requirements-trace refused the tree: each of
  the six `// req:` markers sat above a `check(` line whose title came on the next line. 4f6694f put each title on its
  `check(` line and carried the post-merge leaf total to 1,279 (the merge had kept main's 1,273). The builder then ran
  trace (exit 0, R-1560 to R-1565 implemented), review-timeline 11 pass, requirements-tree 89, requirements-trace 61,
  and map and README checks clean.
- The seat's re-run at 4f6694f: `node scripts/requirements-trace.mjs` reads `1279 total (992 implemented · 1 planned ·
  18 retired · 262 untested · 6 violated)` and `ears: 0 rows off form`, exit 0; `npm run map:check` reads 301 modules,
  0 problems; R-1560 to R-1565 read `implemented` in REQUIREMENTS.md.
- The builder never wrote the live ledger; every test spawn gets a temp HOME and USERPROFILE and temp ledgers.
- No wrong-code pairs and no independent check: an ordinary lane.
- Main moved after the CI run: it is at 6b3e432, two lands (study-stop, gate-rm-workdir) past the lane's merge-base
  b8616fb. The lane has not merged it; that merge needs its own confirmation round.
- Known limits of `must-meet.md` stay open; the pack README states them, and HANDOFF carries each as a residual.
