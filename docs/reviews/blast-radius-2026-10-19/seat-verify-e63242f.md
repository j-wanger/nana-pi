# Seat checks — blast-radius build 1 and its fix, tip e63242f (2026-10-19)

- CI run 39298496051 on draft pull request #49 (GitHub's merge of e63242f into 713d6aa): macOS `158 files: 156 PASS,
  0 FAIL, 2 SKIP`; Ubuntu `158 files: 156 PASS, 0 FAIL, 2 SKIP`; Windows `158 files: 141 PASS, 0 FAIL, 17 SKIP`
  (6,488 checks pass, 0 fail, 83 skip; `ci-windows-run-2.log`). blast-radius.test passes 8 of 8 on Windows, its fixture
  line reading `tests 2, upstream 5, changed 6, downstream 2, unmapped 3`, the plan's expected sets. install-check
  passes on macOS and Windows.
- The run before it failed test-runner's source check on all three legs: blast-radius.test made its R-1556 copies with a
  direct `mkdtempSync`. cf91147 moved both copies to the shared `tmpDir` helper; the run above is its result.
- Local, macOS, e63242f: `node packages/nana-pack/tests/blast-radius.test.mjs` passes 8 of 8; `node
  scripts/requirements-trace.mjs` and `npm run map:check` stay clean (lines in the commit report).
- Tree movement (`requirements-moved --root . --base main`): `713d6aa..e63242f: 8 rows in 1 features`, FEAT-029,
  R-1550 to R-1557 new, each `implemented`.
- The lane's own page, rerun as build brief 1 step 7 asks (`node scripts/blast-radius.mjs --root . --base main --out
  <seat-scratch>/page.html`, then compared with the committed page): NOT equal. The committed page names merge base
  `b8616fb` (cf91147's regeneration, before e63242f merged 713d6aa); a rerun names `713d6aa`. Its untraced sentence
  says 167 test modules; a rerun says 168. The drawn set is the same: 14 nodes (tests 2, upstream 1, changed 5,
  downstream 6, unmapped 0) and 22 edges. Open: regenerate the page on the final tip before the final round.
- Not in this record: a browser look at the page. The plan asks the seat for one, since the builder has no browser.
- No seat wrong-code pairs and no independent check: an ordinary lane. Build brief 1 asked the builder to see each of the
  eight checks red against its named wrong code; the build commit messages carry no record of those runs. The plan's
  probe saw all eight red at main, where the command did not exist.
- The plan's probe found requirements-moved's resolve-only CLI guard silent through a symlinked path; this lane uses
  the code-map shim's realpath guard instead. The silent-main-guard lane's diff (51128a7, in flight) gives
  requirements-moved the `existsSync` plus `realpathSync` guard, so that bug is fixed there, not carried here.
- The plan's known limits stay open and go to HANDOFF's carried residuals: import-only test links, no runtime data,
  not in the templates, a stale committed page caught only by a rerun, no layout library for large radii, unpinned
  refusal paths, and the map's string and comment edges.
- Main moved to a1d07f6 (audit-open-questions) after e63242f's merge of 713d6aa. This tip does not hold it.
