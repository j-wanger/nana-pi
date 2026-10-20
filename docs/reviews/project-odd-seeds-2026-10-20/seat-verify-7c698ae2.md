# Seat checks — project-odd-seeds build 1, tip 7c698ae2 (2026-10-20)

- CI: draft pull request #147 runs at 7c698ae2 on macOS, Ubuntu and Windows. CI-PENDING.
  Reading the run: a pull request run's R-291 leaf-total failure is a merge artifact of GitHub's merge commit, and
  Windows main reads 0 failing since 4be0b79 (desk files are declared skips); a failure in that set is main's, not the
  lane's. The Windows leg settles the plan's one macOS-only limit: the dangling `.pi` link where a folder belongs is a
  new fixture there.
- Wrong-code pairs: none from the seat (an ordinary lane). The builder's report (`<tmp>/nana-seat-scratch/
  project-odd-seeds/build1-out.md`) names 13 wrong versions of the code, each turning its named check red on macOS:
  W1 and W2 → M6, W3 → M1, W4 → M2 and M4, W5 → M7, W8 → M4, W9 → M8, W10 → M3, Wa to We → M5. The seat did not re-run
  them. The plan's adversary had run 12 of the 13 red on its prototype; W10 was untried. The commit message names none.
- Independent check: none (an ordinary lane), so no findings to settle.
- The builder's test counts on 7c698ae2: 229 PASS, 0 FAIL over the eight files the brief names (project-odd-seeds 8,
  project 124, project-working-region 27, entry-guidance 17, project-dismiss 14, doctor-quiet 6, trust 13,
  project-key 20); map, map:check, readme:check, req:tree and the trace exit 0; no existing check edited.
- The seat's re-run on 7c698ae2 (macOS, Node 22.22.2, single files): project-odd-seeds 8 PASS, 0 FAIL, 0 SKIP;
  project-working-region 27 PASS and doctor-quiet 6 PASS, each plus its summary line (the plan's 28 and 7 counted the
  summary line).
- Rows and tree: `requirements-moved --base main` lists 8 rows in FEAT-014, R-2420 to R-2423 new and implemented and
  R-335, R-338, R-385 and R-931 from untested to implemented; every one reads `implemented` in REQUIREMENTS.md. The trace
  reads 1,671 rows, 0 off form; map:check reads 365 modules, 0 problems; readme:check reads 733 claims, 0 problems.
- Scope: the diff touches runProject's check path and the setup closing line in `bin/nana-setup.mjs`, its @outputs and
  @effects lines only, `lib/project.mjs`, one new test file, the setup README, REQUIREMENTS.md and the regenerated tree
  and map. runDoctor, `fsops.mjs` and `stepKnowledgeRefresh` are unchanged.
- Still the seat's before the land: `install-check` on macOS (the lane touches `packages/nana-setup/`) and the locked
  full suite on the reviewed tip.
