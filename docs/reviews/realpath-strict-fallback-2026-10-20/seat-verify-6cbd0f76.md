# Seat checks — realpath-strict-fallback builds 1 and 2, tip 6cbd0f76 (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker; the lane branched from main 54433844 (plan 85fab359):
  - Build 1 (`build-brief-1.md`): dd684f3f. `realPath`'s catch in `packages/nana-pack/lib/real-path.mjs` now tries
    `fs.realpathSync(abs)` on a native error other than ENOENT/ENOTDIR, with or without `mustExist`; only when that
    also throws does it rethrow the native error under `mustExist` (and return `abs` without it). New checks:
    `packages/nana-pack/tests/real-path.test.mjs` (R-2180, R-2181) and `packages/nana-setup/tests/realpath-fallback.test.mjs`
    (R-2182 to R-2184, a preload written into the test's temp root at run time). The pack README gains one sentence,
    the setup README one Known-limits bullet and a tests-table row. No nana-setup code changed.
  - The seat merged main aa5f25cd at 9c16aca1.
  - Build 2 (`build-brief-2.md`, from the seat's pairs on 9c16aca1): f38af41b, tests and row text only. R-2180 now
    samples a path through a link, so the JavaScript lookup's result differs from the path as given. R-2180 to R-2184
    take the must-meet's row text word for word; build 1 had rewritten all five and coined "typed realpath".
  - 6cbd0f76 merges main c7f582ad (pi-launch-followups' chain note) into 4d00dbb6. After it, the seat's notes commit
    adds only this record, the independent check, the Windows log, the two review briefs, HANDOFF and the session entry.
- CI run 39408045115 on draft pull request #123 at 6cbd0f76 (build 2 plus the seat's merge of main c7f582ad):
  - macOS `182 files: 180 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7919 pass, 0 fail, 29 skip`; real-path `2 pass`,
    realpath-fallback `3 pass`.
  - Ubuntu `182 files: 179 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7858 pass, 0 fail, 47 skip`; real-path `2 pass`,
    realpath-fallback `3 pass`.
  - Windows `182 files: 165 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6849 pass, 0 fail, 111 skip`
    (`ci-windows-6cbd0f76.log`). The 17 skipped files are the 16 declared desk files and bench's study-tasks,
    main's declared set. real-path `2 pass` (R-2180, and R-2181 on a junction and a file-link loop, which settles the
    adversary's second most-likely-wrong claim); realpath-fallback `2 pass, 1 skip`, the native win32 form:
    ```
    PASS R-2182: doctor row labels and statuses match control when native realpath fails inside the checkout
    PASS R-2183: the stale-copy producer stays silent in control and native-realpath-failure runs
    SKIP R-2184 — uninstall is POSIX-only
    ```
  - install-check passes on macOS and Windows.
  - Build 1's run 39406793312 (9c16aca1) was cancelled as superseded by build 2.
- The seat's wrong-code pairs (`seat-mutate.mjs`, macOS, Node 22.22.2; R-2182 and R-2183 in POSIX and forced-win32
  form, R-2184 in POSIX form):
  - On 9c16aca1: 5 of 5 red, 0 survived (`seat-mutate-output-9c16aca1.txt`, commit 285976e7). Finding: M5 (the
    fallback returns the unresolved path instead of the JavaScript lookup's result) left R-2180 green, because its
    sample path was already canonical; R-2182 to R-2184 caught M5, so the product was pinned but R-2180 did not prove
    its row. Settled by build 2 (f38af41b).
  - On f38af41b: 5 of 5 red, 0 survived (`seat-mutate-output-f38af41b.txt`, commit 4d00dbb6); M5 now turns R-2180 red.
    M1 (main's catch) turns R-2180, R-2182, R-2183 and R-2184 red; M2 (EISDIR only) R-2180; M3 and M4 R-2181. Each red
    pair turns its named checks red; M5 also turns R-2181 red, unnamed.
  - Declared without a pair: W4 (a fallback inside `linkOk` only) leaves real-path as M1 does; W6 (a no-op preload)
    edits the test, not product code. No pair ran on Windows; CI's native run of the checks is the Windows evidence.
- The builder's own runs, not the seat's evidence: both builds also ran the locked full suite (181 files, 0 failing,
  as the builder reports). Brief 1 said "Run single test files only" and brief 2 "no full suite".
- Independent check (`independent-check-6cbd0f76.md`): it ran on build 1, 9c16aca1, against a base clone at aa5f25cd
  (main at that merge), with temp homes on macOS: HOLDS, no MUST, seven probes plus the must-meet files.
  - Must-meet: R-2180 and R-2181 pass, R-2182 to R-2184 pass (`SUMMARY PASS=3 FAIL=0`). On base, R-2180, R-2182, R-2183
    and R-2184 fail and R-2181 passes (a guard pin), as the plan says. gate-rm-inside, land, checkout-spelling and
    review-standard pass; map, readme and tree-movement checks are clean.
  - P1: on 13 ordinary macOS paths, loose and strict, with the native lookup working, base and lane give the same
    result (`diffs=0`); strict calls still throw ENOENT, ELOOP, ENOTDIR and EACCES where base throws. P2: the gate's
    loose lookup under five injected codes, `25 cases, 0 differences`.
  - P3 and P4: under the injected failure, review-round's key and nana-land's worktree compare work where base threw
    EISDIR; nana-land still refuses a worktree spelled another way and a non-LAND verdict record (`code=1 refused:
    non-LAND verdict record(s) …`). No fail-open.
  - P5: install under the failure with a legacy `context-size-check.sh` link exited 1 on base and exits 0 on the lane,
    unlinking the repository-managed link and keeping one outside the repository. This fixes the install throw the
    plan's Known limits named. P6: a real `uninstall --yes` under the failure matched its control (`unlinked=20
    symlinks-left=1 foreign=kept`).
  - Its findings and how each was settled:
    1. Known bug, documented in the plan, no worse than main: with the native lookup failing, a second spelling of the
       checkout reads as another checkout (P7: doctor 22 ✗ rows through the second spelling on base and lane; the
       stale-copy producer prints `INSTALL STALE` on both). Not fixed; recorded as a HANDOFF residual.
    2. Known bug, inferred from `packages/nana-pack/bin/pi-review.mjs` lines 74 and 171 to 175, not run: on such a
       volume pi-review compares git's `--show-toplevel` spelling with the typed `--out` spelling, so a case-variant
       `--out` inside the tree could read as outside it and skip the redirect into the temp checkout; main refuses
       there. Not fixed; recorded as a HANDOFF residual and named in the land brief.
  - Nobody re-ran it on build 2, which changed only R-2180's test and the five rows' text, so its probes still
    describe the product.
- The plan's Known limits, each a HANDOFF residual unless said: typed-spelling compares on a failing volume (setup
  tools and the land and review tools); no RAM disk or cloud-drive folder run (the injected EISDIR stands in);
  pi-worker's win32 lane paths, the mutation runner and install-check still on the native lookup only; no check of
  install's own compares under the failure; setup checks inject EISDIR only and only a link loop is checked as a path
  both lookups refuse. The substituted or mapped drive residual is already in HANDOFF, unchanged.
- HANDOFF: one Landed line. The setup-checkout-spelling final-review residual (strict lookup failing on Windows
  virtual drives) is removed: under the injected failure, doctor, the stale-copy producer and uninstall's preview now
  read as with a working lookup (R-2182 to R-2184). The win-review-paths review-tools residual now says a looping
  path's refusal is tested (R-2181). The setup-checkout-spelling plan residual on the loose lookup's non-missing-error
  fallback stays: this lane does not change the loose lookup (P1, P2: 0 differences). Seven new residuals, each
  naming this lane.
- Words: build 2 put the must-meet text into the rows, but "typed realpath" stays in both test files' check titles,
  real-path.mjs's header and doc comment, and the setup README's new sentences. Brief 2 asked only for the rows.
- Rows: R-2180 to R-2184 read `implemented` in REQUIREMENTS.md. The seat helper's run at 6cbd0f76:
  `node scripts/requirements-trace.mjs` reads `requirements: 1585 total (1345 implemented · 1 planned · 37 retired ·
  197 untested · 5 violated); 1345 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check`
  reads 346 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base c7f582ad): `c7f582a..6cbd0f7:
  5 rows in 2 features`. FEAT-015: R-2180 to R-2183; FEAT-018: R-2184; all new (implemented). CAP-04 moves from 474
  to 479 rows, FEAT-015 from 124 to 128, FEAT-018 from 22 to 23.
- Not in this record: a seat locked full-suite run (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was c7f582ad at the merge in 6cbd0f76, the merge base. Main has since moved to a112fd30 (notify-lifecycle-pins
  and mutation-runner-takeover-race landed). They changed `mutation-runner.mjs`, its config, four pack test files,
  the pack README, HANDOFF, the session archive, REQUIREMENTS.md, the tree and the code map; none touches real-path.mjs,
  the lane's tests or the setup README. A trial merge (`git merge-tree`, nothing written) conflicts only in the
  generated code map; this notes commit edits HANDOFF and the session file where those lands did too. So the land
  needs a merge of main, regenerated map and tree, and a confirmation round on that tip.
