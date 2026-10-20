# Seat checks — gate-rm-bare-repo build 1, tip cc81b85a (2026-10-20)

- Build, by a Claude Sonnet 5 subagent (one build, `build-brief-1.md`): 35dfff59. The lane branched from main a112fd30
  (plan b55cc53f).
  - `packages/nana-pack/lib/gate-rm-inside.ts` gains the contract names `BARE_HEAD`, `BARE_OBJECTS`, `BARE_REFS` and
    `GIT_ENTRY` (`// contract: R-2240, R-2241`), `lstatOrNull` (null on ENOENT/ENOTDIR; any other error rethrows to
    the outer catch, which returns false) and `isBareShape` (a `HEAD` file and `objects` and `refs` folders, lstat
    only). New step 3b walks up from the cwd's real path to the filesystem root: a `.git` entry of any type ends the
    walk, and only then does a bare shape at that level return false. Step 5, after its link check, returns false
    for an existing folder part with the bare shape. The module header and the `rmInsideCwd` doc comment say so.
    `nana-gate.ts` and `real-path.mjs` are unchanged.
  - `packages/nana-pack/tests/gate-rm-inside.test.mjs` gains four checks (R-2240 to R-2243) through the real
    registered handler, headless and interactive, on one new `tmpDir` root built with git (every `GIT_*` variable
    removed, `commit.gpgsign=false`; a missing git fails the file). The pack README's exemption paragraph adds the
    guard to what still asks and replaces the two bare-repository known limits with the plan's. REQUIREMENTS.md gains
    R-2240 to R-2243 after R-1496, word for word from the must-meet table.
  - cc81b85a merges main c203f485 (the handoff-cap-surrogate land) into 35dfff59. ecc7e9b5 adds only the seat's
    pairs (`seat-mutate.mjs`, `seat-mutate-output-cc81b85a.txt`). After it, the seat's notes commit adds only this
    record, the independent check, the Windows log, the two review briefs, HANDOFF and the session entry.
- CI run 39414069623 on draft pull request #127 at cc81b85a (build 1 plus the seat's merge of main c203f485); all
  five jobs succeeded:
  - macOS `183 files: 181 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7929 pass, 0 fail, 29 skip`; gate-rm-inside
    `11 pass`.
  - Ubuntu `183 files: 180 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7868 pass, 0 fail, 47 skip`; gate-rm-inside
    `11 pass, 1 skip`, the file's existing skip for a case-changed home spelling a case-sensitive disk cannot hold.
  - Windows `183 files: 166 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6860 pass, 0 fail, 110 skip`
    (`ci-windows-cc81b85a.log`). The 17 skipped files are the 16 declared desk files and bench's study-tasks, main's
    declared set. gate-rm-inside `11 pass` with no skip: Git for Windows makes the bare-repository and worktree
    shapes the checks build, which settles the plan's claim most likely wrong.
  - install-check passes on macOS and Windows. None of main's known failures showed (Ubuntu's path spelling, fixed on
    main by linux-path-spelling; a pull request run's R-291 leaf-total merge artifact).
- The seat's wrong-code pairs (`seat-mutate.mjs`, macOS, Node 22.22.2) on cc81b85a: 22 of 22 red, 0 survived, each
  exactly on its named titles (`seat-mutate-output-cc81b85a.txt`, commit ecc7e9b5); baseline 11 PASS, 0 FAIL.
  - M1 (main's behaviour: no cwd walk and no shape test on target parts) turns R-2240 and R-2241 red.
  - M2 to M4 (step 5's shape test dropped, on the full target only, on the first part only) turn R-2240 red.
  - M5 to M7 (the cwd walk drops the shape test, tests the cwd only, stops after two levels) turn R-2241 red.
  - M8 to M11 (the walk ignores `.git`, stops at `.git` only when it is a folder, looks for `.git` at the cwd only,
    tests the shape before `.git`) turn R-2242 red.
  - M12 to M17 (the walk tests `HEAD` alone; `isBareShape` accepts a `HEAD` of any type, needs `objects` or `refs`
    but not both, or drops one of its three tests) turn R-2243 red.
  - M18 (`lstatOrNull` rethrows a missing entry, as a bare `lstatSync` does) turns R-1490, R-2242 and R-2243 red.
  - M19 to M22 (a contract name misspelled) turn their rows red: M19 to M21 R-2240 and R-2241, M22 R-2242.
  - Declared without a pair: win32 shapes (the module uses the host path module, so the Windows CI leg is the
    evidence); `lstatOrNull` returning null on EACCES (no must-meet check covers it); two equivalent forms
    (rethrowing ENOTDIR, which no call site can meet, and step 5 without its `isDirectory()` guard); W12, links
    accepted for `objects` and `refs`, the plan's declared survivor, which only asks more.
- The seat's probe through the real `tool_call` handler on macOS: 68 cases matched the plan, and none threw. Across
  176 folder and command pairs, the only verdicts that differ from main's are for bare-repository targets. On macOS's
  case-folding disk, a folder with a lowercase `head` file and `objects` and `refs` folders also asks: it asks more,
  never less. No record of this probe sits in the review folder; this line is the seat's report.
- Independent check (`independent-check-cc81b85a.md`): it ran on cc81b85a against a main checkout at c203f485, both in
  a temp folder with a temp home: HOLDS, no MUST, 11 probes beyond the must-meet files.
  - Must-meet: gate-rm-inside 11 PASS on the lane. On main's module, R-2240 and R-2241 FAIL and R-2242 and R-2243
    PASS (guard pins), as the plan says. gate-corpus, gate-survives-mutation (38), gate-status (23) and
    config-gate-fallback (38) pass; the code-map and readme checks are clean; no temp roots were left behind.
  - Probe 8, a sweep of 202 cwd and target cases: `lane-allows-main-asked=0 lane-asks-main-allowed=140
    of-which-not-under-a-bare-repo=0`. No fail-open: every new ask sits under a bare repository.
  - Probe 2, this machine's real repositories, read-only: nothing over-asks.
  - Probe 10, cost: 2000 calls from a cwd 30 folders deep took 454 ms on main and 3422 ms on the lane, about 1.5 ms
    more per rm.
  - Probe 11: the Windows CI log shows gate-rm-inside `11 pass` with no skip.
  - Its findings and how each was settled: no MUST and no new known bug. The four residuals it hit are the README's
    and the plan's declared ones: a bare repository below a target runs unasked; a symlinked `HEAD` is not
    recognised; a plain folder inside a bare repository over-asks; every rm walks to the filesystem root. None is
    fixed; each is a HANDOFF residual in this notes commit. Its setup note, the worktree's two untracked seat files:
    ecc7e9b5 committed both, so the source is clean for the land. It ran no local win32 probe; CI is the Windows
    evidence.
- The plan's other known limits: any `.git` entry ends the walk, valid or not, and the walk ignores ceiling folders,
  filesystem boundaries and the `GIT_DIR`/`GIT_OBJECT_DIRECTORY` settings, which can only over-ask (folded into the
  walk residual); a path from outside through a bare repository into its worktree over-asks (folded into the
  over-ask residual, with the seat's lowercase `head` case); mount points and inner links keep their existing HANDOFF
  residuals, unchanged.
- HANDOFF: one Landed line. The gate-rm-workdir residual "the gate does not recognise a bare repository" is removed:
  both its halves, a bare repository as the target and its object and ref folders removed from inside it, now ask
  (R-2240, R-2241). The gate-rm-workdir residual before it (the git check looks only one level under a target) stays
  unchanged: it names no bare-repository case, and the lane leaves a bare repository below a target unasked, which
  gets its own line. Four new residuals, each naming this lane.
- Rows: R-2240 to R-2243 read `implemented` in REQUIREMENTS.md. The seat helper's run on this notes change (no code
  or row changed since ecc7e9b5): `node scripts/requirements-trace.mjs` reads `requirements: 1590 total (1353
  implemented · 1 planned · 37 retired · 193 untested · 6 violated); 1353 traced by tests` and `ears: 0 rows off form
  (allowance 0)`; `npm run map:check` reads 347 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, from the merge base c203f485):
  `c203f48..ecc7e9b: 4 rows in 1 features`; FEAT-010: R-2240 to R-2243, all new (implemented). CAP-03 moves from 153
  to 157 rows and FEAT-010 from 63 to 67.
- Not in this record: a seat locked full-suite run (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was c203f485 at the merge in cc81b85a, the merge base. Main has since moved to 0305bc8d (realpath-strict-fallback
  and post-edit-values-named landed). They changed `real-path.mjs`, whose loose `realPath` this module calls, plus the
  pack README, REQUIREMENTS.md, the tree, the code map, HANDOFF and the session archive. Their README and REQUIREMENTS
  hunks sit away from this lane's; the generated files, HANDOFF and the session archive may conflict (inferred; no
  trial merge ran). So the land needs a merge of main, a regenerated map and tree, and a confirmation round on that
  tip.
