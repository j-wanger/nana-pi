# Seat checks — trust-finds-pi build 1, tip 0c08bcd (2026-10-19)

- CI run 39334379474 on draft pull request #79 (0c08bcd): macOS `166 files: 164 PASS, 0 FAIL, 2 SKIP` (7,652 checks
  pass); Ubuntu `166 files: 164 PASS, 0 FAIL, 2 SKIP` (7,597 pass); Windows `166 files: 149 PASS, 0 FAIL, 17 SKIP`
  (6,591 pass, 79 skip; the 17 are main's 16 declared desk files and the bench file that needs an optional install)
  (`ci-windows-run-1.log`). install-check passes
  on macOS and Windows. trust.test.mjs passes 13 of 13 on all three legs, both new checks included.
- The plan attack's claim most likely wrong, that `npm_config_prefix` set after deleting its case variants does not
  move `npm.cmd root -g` on Windows, did not hold: both new checks pass on the Windows leg. Had npm ignored the
  override there, R-1800's run would have found CI's real pi and exited 0.
- The builder's five wrong-code tries (its report, macOS): guard the import only (R-1801 red); throw a plain Error at
  both sites (both red); put the stack in R-1800's message (R-1800 red); drop the install hint (both red). The fifth,
  catch the failed import and go on with an empty module, kept both checks green: the export guard then refuses with
  the same kind of line. 4 of 5 red; the survivor is a HANDOFF residual (no check tells the two guards apart).
- No wrong-code pairs and no independent check: an ordinary lane (the trust command is not install, uninstall or
  doctor). No findings to settle.
- Seat re-runs on 0c08bcd: `node scripts/requirements-trace.mjs` exit 0 (1,398 rows, 0 off EARS form);
  `npm run map:check` exit 0 (0 problems). R-1800 and R-1801 read `implemented`.
- Tree movement (`requirements-moved.mjs --base main`, merge-base 22ccd84): FEAT-009, R-1800 new (implemented),
  R-1801 new (implemented).
- For the reviewer (inferred, not probed): R-1801's check writes `module.exports = {};` at the module path npm reports
  for the test's temp prefix, with no check that the path lies under the test root. Where npm ignores the prefix
  variable, that write would land in the machine's real pi.
- Plan's known limits, all HANDOFF residuals: a pi from pnpm, bun, volta or yarn is not found; a mixed Node setup is told
  to install a second pi; a trust module's own missing dependency reports against the trust module's path; npm itself
  missing keeps the old line with no install command. The readme-install residual this lane fixes is gone from HANDOFF.
- Before nana-land: the local macOS install check (the lane touches packages/nana-setup); not yet run.
