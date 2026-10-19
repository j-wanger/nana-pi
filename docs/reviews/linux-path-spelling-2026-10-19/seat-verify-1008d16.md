# Seat checks — linux-path-spelling build 1, tip 1008d16 (2026-10-19)

- CI on draft pull request #38, run 39256629338 (1008d16 merged onto main b8ace0b by GitHub):
  - Ubuntu `152 files: 149 PASS, 1 FAIL, 2 SKIP` (`ci-linux-run-1.log`). path-spelling now passes with `9 pass, 13 skip`;
    main's run 39251730146 on 73f39d5 read `9 pass, 2 fail, 11 skip`, GP1 and GP2 failing (`expected exit 1, got 0`;
    `expected the bare HEAD sha`). The one failing file is lane-write-guard's symlink check, main's at b8ace0b, fixed on
    main since by linux-lane-guard (a0e0a69).
  - macOS `152 files: 150 PASS, 0 FAIL, 2 SKIP`; path-spelling `11 pass`.
  - Windows `152 files: 131 PASS, 20 FAIL, 1 SKIP`; the 20 are main's 16 desk and 4 bench files. path-spelling `11 pass`,
    and both case-divergence checks still run there: `PASS GP1: a tracked --out reached through a folder whose disk case
    diverges from git's index/HEAD is refused before the review runs` and `PASS GP2: an untracked in-tree --out under a
    folder whose disk case diverges from git's index/HEAD stays out of the snapshot and the review checkout`.
  - install-check passes on macOS and Windows.
- The Ubuntu log does not print the two new SKIP lines. The suite runner prints a file's SKIP lines only when no check in
  it passed (`scripts/test.mjs`). On CI the skip shows by count only: 2 fail and 11 skip became 0 fail and 13 skip, with
  9 pass unchanged. The line text (`SKIP GP1 (case-divergence): this volume is case-sensitive, so the rename left two
  different folders`, and the GP2 twin) is in the diff; the builder reports both SKIP on its case-sensitive volume.
- Must-meet 3: the seat read the diff. Each guard tests `fs.existsSync(path.join(<repo>, "Docs", <file>))` after the
  reset (`review.md` for GP1, `seed.md` for GP2); no new line reads `process.platform`. Each `// req:` marker still sits
  directly above its `check(` call. Nothing else under `packages/` changed.
- Wrong-code evidence is the builder's, not re-run by the seat: on a case-sensitive APFS volume on macOS, without the new
  guard GP1 and GP2 FAIL with the Ubuntu messages; with it both SKIP.
- No wrong-code pairs and no independent check: an ordinary lane (tests only). No finding to settle.
- Rows: the plan adds none. R-1350 and R-1351 stay `implemented`. Tree movement: none. The review folder holds no
  `plan-attack.md`; `must-meet.md` is the whole plan of record.
