# Seat checks — adopt-structure-markers build 1, tip 06a4493 (2026-10-19)

- CI run 39330166428 on draft pull request #76 (06a4493f; its base is main 22ccd849, so the merge tests the tip's tree):
  macOS `166 files: 164 PASS, 0 FAIL, 2 SKIP` (7,653 checks pass); Ubuntu 164 PASS, 0 FAIL, 2 SKIP (7,598 pass);
  Windows 149 PASS, 0 FAIL, 17 SKIP (6,592 pass; `ci-windows-run-1.log`), its skips main's declared ones.
  entry-guidance passes 17 of 17 on every leg. install-check passes on macOS and Windows. The seat read each leg's
  summary line from the job logs.
- The builder (a Claude Sonnet 5 subagent, verdict DONE) reports single files on 06a4493: entry-guidance 17 PASS, 0 FAIL
  (three new checks); project.test.mjs 123 PASS; skill-claims all passed (114 claims); trace exit 0, ears 0; map:check
  and readme:check 0 problems. It ran single files only. Its commit touches exactly the five files the brief named.
- The builder's seven wrong-code tries, per its report, each turned its named check red and were reverted: a blank line
  under the begin marker (R-1780); a misspelt end marker (R-1780); a `'<!--'` search string, the begin marker without
  its closing (R-1782); a slice from the begin line to the end of the string (R-1782); an escaped newline in place of a
  newline (R-1782); "never add a second copy" deleted (R-1781); R-591's sentence deleted (R-591, in project.test.mjs).
- No wrong-code pairs and no independent check: an ordinary lane (skill text and one test file). No findings to settle.
- Seat, on the worktree at 06a4493 plus these notes: the requirements trace exits 0 (`1399 total`, `ears: 0 rows off
  form`); `map:check` exits 0 with 0 problems; R-1780 to R-1782 read implemented; R-741 and R-849 are unchanged. The
  tree movement report against main: FEAT-014 gains R-1780, R-1781 and R-1782, all new and implemented.
