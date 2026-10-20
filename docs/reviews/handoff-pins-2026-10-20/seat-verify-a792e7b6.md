# Seat checks — handoff-pins build 1, tip a792e7b6 (2026-10-20)

- CI run 39390038673 on draft pull request #116 at a792e7b6 (GitHub's merge commit 12c59704 merges a792e7b6 into its
  own base 385c633f, so the tree tested is a792e7b6's): macOS `177 files: 175 PASS, 0 FAIL, 2 SKIP` (7,847 checks
  pass); Ubuntu `174 PASS, 0 FAIL, 3 SKIP` (7,786); Windows `160 PASS, 0 FAIL, 17 SKIP` (6,782 pass, 104 skip), its
  skips main's declared ones; install-check passes on macOS and Windows. No failure falls in main's known set.
- The six lane files on Windows (`ci-windows-a792e7b6.log` beside this file): handoff-artifact 8 pass, handoff-store
  48 pass and 2 skip, handoff-symlink 15 pass, handoff-trust 53 pass, handoff-writer-role 9 pass, product-report 71
  pass. Against two other lanes' Windows runs on the same base 385c633f (7, 46 + 2 skip, 14, 51, 7, 71), the five
  handoff files gain exactly eight passes. All eight new checks print PASS by title there; both handoff-store skips
  are older checks (the darwin /tmp key case, POSIX read-only folders). macOS reads 8, 54, 15, 53, 9 and 71; Ubuntu
  8, 52 + 1 skip, 15, 53, 9 and 71. Against the pack-config-agent-dir-pins run on the same base, both legs also gain
  exactly eight passes and no skip (those legs print file totals, not titles).
- The plan adversary's likeliest wrong claim, that the R-880 junction case passes on native Windows, held: `real path:
  a handoff.path whose parent is a link to a .pi folder ...` passes there.
- Both R-1024 checks pass on all three legs with the eight rows flipped, after the fixture fix the plan called for.
- Wrong-code tries, from the builder's record `builder-mutations.md` (the seat re-ran none): 21 of 21 turn their named
  check red and leave every other check in the row's file green. R-244 W5; R-830 W6; R-138 and R-807 W1 to W4 with
  W2b, both checks red each time; R-189 W7 to W12; R-248 W13 to W15; R-880 W16; R-245 W17 to W20. Removing
  product-report's solid rule turns both R-1024 checks red.
- No seat wrong-code pairs and no independent check: an ordinary lane (tests, rows and the map; no extension code).
  So no independent-check findings to settle.
- Builder self-fixes before mutation testing: the R-244 check crashed the run (uncaught ENOENT) under W5 instead of
  failing cleanly, now guarded by an existence check; three check calls had their title on the next line, which the
  trace rejects, now reformatted.
- In the worktree after the seat's notes: the trace reads 1,543 rows (1,285 implemented, 218 untested), 0 off form;
  map:check reads 336 modules, 0 problems. `requirements-moved --base main` lists eight rows in FEAT-002, each
  untested -> implemented. Every one of the eight rows reads implemented.
- Main moved to 445f4d5b after this lane branched (ci-suite-timeout and knowledge-index-pins landed); the merge-base
  stays 385c633f, and the lane has not merged main.
- Carried to HANDOFF from the plan's known limits: the cap can split a surrogate pair; the cap value has no provenance
  comment.
