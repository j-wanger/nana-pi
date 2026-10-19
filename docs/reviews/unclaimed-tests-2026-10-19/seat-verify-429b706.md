# Seat checks — unclaimed-tests build 1b, tip 429b706 (2026-10-19)

- CI run 39300678028 on draft pull request #58 (429b706; GitHub's merge into 713d6aa, merge commit 8bf96ccd):
  - Windows `158 files: 141 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6486 pass, 0 fail, 83 skip` (`ci-windows-run-1.log`).
    The 17 skips are the 16 declared desk files and study-tasks (`needs apps/bench/.ext/pi-web-access`).
    `PASS  packages/nana-pack/tests/requirements-unclaimed.test.mjs  6 pass`, so its Python legs ran there; each of the
    six titles prints PASS. requirements-trace 61, requirements-tree 89, templates-render 167 with 2 skips,
    templates-update 34, skill-claims 30 and code-map 48 pass there too.
  - macOS `158 files: 156 PASS, 0 FAIL, 2 SKIP` (7,559 checks); requirements-unclaimed 6 pass, templates-render 168
    (log not copied).
  - Ubuntu `158 files: 156 PASS, 0 FAIL, 2 SKIP` (7,504 checks); requirements-unclaimed 6 pass (log not copied). Main's
    known failures do not appear: 713d6aa already carries linux-path-spelling's fix (ca27d86), and GitHub merged onto
    the lane's own base, so the R-291 leaf total holds.
  - install-check: macOS and Windows success.
- Builder's report (a pi gpt-5.6-sol builder through pi-worker; build 1 stalled under the launcher's 75-second watchdog
  before it committed, and build 1b finished it as 31abb51), not re-run by the seat: R-1660 to R-1665 implemented, six
  new rows in FEAT-028; the new file 6 PASS, 0 FAIL, all six red on the old code. Wrong code, each red, then reverted:
  marker distance (R-1660, R-1662), ordering (R-1660, R-1662), zero count (R-1660), decorators (R-1661), output placement
  and completeness (R-1663), switch typos (R-1663 to R-1665); a path joined with the platform separator turns red only on
  the Windows leg, which passes above. Eight single files exited 0, 480 checks pass. Existing tests edited: the R-291 leaf
  total (1,294 to 1,300) and one `printUnclaimed` call in the rendered TypeScript status test. The report as the seat
  holds it does not state `npm run template:accept`'s exit, which build brief 1 lists under Done.
- The seat on 429b706, macOS: `NANA_REQ_UNCLAIMED=1 node scripts/requirements-trace.mjs` exits 0 and prints its two
  usual lines, then `unclaimed: 2103 test declarations carry no req: marker` and 2,103 listed lines (2,106 in all).
  `node scripts/requirements-moved.mjs --root . --base main`: 6 rows in 1 feature, FEAT-028, R-1660 to R-1665 new
  (implemented).
- Seen, not a finding: both rails were already over their template's per-file line cap at the base (TypeScript rail 626
  lines against 300, Python `conftest.py` 546 against 500). The lane grows them to 710 and 622. Only the rendered
  project's post-edit gate checks the cap.
- No wrong-code pairs and no independent check: an ordinary lane.

## Template acceptance (the seat, on the merged tip)

The builder's report gave no result for `npm run template:accept`, which build brief 1 lists under Done. The seat ran
it on `29f08c1`, after the merge of report-not-passed's reviewed tip: exit 0 in 68 seconds. The script prints one report
per failed command and nothing on success (its header), so both templates and both adoption modes passed every native
check job at that commit.
