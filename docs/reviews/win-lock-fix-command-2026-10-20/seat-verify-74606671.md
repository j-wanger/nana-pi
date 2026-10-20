# Seat checks — win-lock-fix-command builds 1 to 3, CI tip 74606671 (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker:
  - Build 1 (`build-brief-1.md`) made the whole change, left it uncommitted and reported BLOCKED:
    `node scripts/requirements-trace.mjs` exited 1, because brief 1 asked for `// req:` markers on R-2082 and R-2083
    while it also asked to keep both rows `untested`. The trace rejects that pair. The error was the seat's brief.
  - Build 2 (`build-brief-2.md`) committed build 1's work unchanged at 74606671, with the two Windows-only markers
    switched to `// req-candidate:`, the precedent from win-watchdog-cpu-read. 74606671 holds the new
    `packages/nana-setup/lib/settings-lock.mjs` (`SETTINGS_LOCK_NAME`, `settingsLockPath`, `lockHolder` moved from
    steps, `removalCommands`); `withSettingsLock` in `lib/steps.mjs`, which prints one `  rm '<lock>'` line off win32
    and, on win32, `  in Command Prompt:` / `    del "<lock>"` / `  in PowerShell:` /
    `    Remove-Item -LiteralPath '<lock>'` with each of U+0027, U+2018, U+2019, U+201A and U+201B doubled, picked by
    `platform()`; doctor's new `settings lock` row in `lib/doctor.mjs` (✓ `no leftover lock`; ✗ with the holder, the
    live-install caveat and the commands, labels first; no install label); R-322 retired, R-2080 to R-2085 added;
    R-2080 in `settings-merge.test.mjs`; the new `settings-lock.test.mjs`; the setup README; the regenerated code map
    and tree.
  - e6cb4751 adds the seat's pair table and its output. Build 3 (`build-brief-3.md`, cdccc250) changed only
    `settings-lock.test.mjs` and REQUIREMENTS.md: the two markers became `// req:`, R-2082 and R-2083 read
    `implemented` citing CI run 39388721628, two new R-2084 checks pin the live-install caveat (M23) and the win32
    label order (M22), and R-2084's first check reads one platform name for its command count. bcfb78ff adds the
    seat's M22 and M23 re-run. The seat's notes commit adds only this record, the independent check, the Windows log,
    the two review briefs, HANDOFF and the session entry. No product code changed after 74606671.
- CI on builds 1 and 2, run 39388721628 on draft pull request #114 at 74606671 (GitHub's merge commit 0b7eecf3
  merges 74606671 into its own ancestor 385c633f, so the tree tested is 74606671's); all five jobs succeeded:
  - macOS `178 files: 176 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7843 pass, 0 fail, 29 skip`. settings-lock
    `4 pass, 2 skip` (R-2081, R-2084, R-2085 and the file's closing tally line; R-2082 and R-2083 skip off win32);
    settings-merge `219`; install `107`; win32-degrade `87`; uninstall `31`; doctor-fix-line `9`; stale-copies `13`.
  - Ubuntu `178 files: 175 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7782 pass, 0 fail, 47 skip`. The same files pass
    with the same counts; the third skipped file is checkout-spelling, declared on a case-sensitive volume.
  - Windows `178 files: 161 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6779 pass, 0 fail, 105 skip`
    (`ci-windows-74606671.log`). The 17 skipped files are main's declared set. settings-lock `5 pass, 1 skip`, every
    check native and by title:
    ```
    SKIP R-2081: on macOS and Linux, the rm line install prints for a held lock, run by /bin/sh, removes the lock under an awkward home path and changes no other file — install prints Windows removal commands on win32
    PASS R-2082: on Windows, the Command Prompt line install prints for a held lock, run by cmd.exe, removes the lock under an awkward home path and changes no other file
    PASS R-2083: on Windows, the PowerShell line install prints for a held lock, run by Windows PowerShell, removes the lock under an awkward home path and changes no other file
    PASS R-2084: while the settings lock exists, doctor marks a settings lock row ✗ naming the lock, its pid and age, and every removal command install prints
    PASS R-2085: while the settings lock exists, doctor's last line lists settings lock among the rows to fix by hand, on a fresh home and on an installed one
    PASS summary: 0 failures
    ```
    settings-merge `212 pass, 7 skip`, with `PASS R-2080: a held settings lock stops install printing the lock path,
    the recorded pid, its age and each removal command alone on its line under its shell`; install `91 pass, 5 skip`;
    win32-degrade `86 pass, 1 skip`; uninstall `2 pass, 2 skip`; doctor-fix-line `9`; stale-copies `13 pass, 1 skip`.
  - install-check: macOS and Windows success.
  - So the plan adversary's claim most likely wrong, that cmd.exe and Windows PowerShell 5.1 behave as planned on the
    Windows leg, held: each ran the whole printed line from a sentinel folder under the awkward home
    ``nana lock 'q' ’ é $x `b` [1]`` and removed only the lock.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arose, since GitHub's merge commit holds 74606671's
    tree.
- CI on build 3: none yet. The seat pushed bcfb78ff (build 3 plus the pair re-run) and started a CI wait (tag
  `wlfc-2`), but when this record was written no run existed for bcfb78ff, and that wait had found none. GitHub
  reports draft pull request #114 as conflicting with main (`mergeable: CONFLICTING`), and it starts no pull request
  run for a conflicting pull request. Main has moved to 445f4d5b (the ci-suite-timeout and knowledge-index-pins
  lands). A trial merge (`git merge-tree`) conflicts only in the generated `docs/requirements-tree.md`. So build 3's
  two new R-2084 checks have passed on macOS only, in the builder's run and the seat's pair re-run. Their win32
  half is the forced-win32 run on macOS. The land needs a merge of main, a CI run on the merged tip and a
  confirmation round.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, one shard, Node
  22.22.2:
  - On 74606671 (`seat-mutate-output-74606671.txt`, committed in e6cb4751): 21 of 23 red, 2 survived. Baselines:
    settings-merge 219, settings-lock 4, install 107, win32-degrade 87 PASS. M1 to M8 and M11 to M20 each turned
    their named titles red; M21 (doctor lstats the Claude folder) turned the healthy-doctor checks in install and
    win32-degrade red. M9 (the lock name loses its leading dot) went red on the held-lock check, `lock: a held lock
    stops install before its first write`, with R-2080 not reached. M10 (the lock path names the home folder) turned
    R-2081, R-2084, R-2085 and that held-lock check red, with R-2080 not reached.
    M22 (doctor's win32 row puts each label after its command, the plan-attack's amendment 2) and M23 (doctor's row
    drops the live-install caveat and calls the lock safe to delete) survived, as the table's declared (c) expected:
    no must-meet check read that wording.
  - Build 3 added two R-2084 checks. On cdccc250 the seat re-ran M22 and M23 alone, with the table naming the new
    checks (`seat-mutate-output-cdccc250-M22-M23.txt`, committed in bcfb78ff): 2 of 2 red. M22 turns `R-2084: on
    win32 doctor's settings lock row puts each shell label before its command and ends on a command` red, and M23
    turns `R-2084: doctor's settings lock row, on a fresh and an installed home, says to remove the lock only if no
    nana-setup is running` red. Baseline: settings-lock 6 PASS.
  - Most unnamed red lines name settings-lock's closing `FAIL summary: <n> failures` line, which the runner counts as
    a title. That is a table artifact, not a product red; HANDOFF already carries it as the doctor-fix-line residual
    on tally lines. The other unnamed reds are real older checks the same pair also turned red: settings-merge's
    older lock checks under M8, M9, M10 and M14, and install's and win32-degrade's doctor checks under M21.
  - Declared, no pair: (a) every pair ran on macOS; the forced-win32 halves of R-2080 and R-2084 stand in for the
    Windows output shape, and R-2082 and R-2083 print SKIP there. (b) The PowerShell line's typographic-quote
    doubling (build brief 1's wrong code 16: double only U+0027) has no pair: only R-2083 reads it, and only on the
    Windows leg, which passed it. Nobody ran that wrong code on Windows. Recorded as a HANDOFF residual.
- Independent check (`independent-check-74606671.md`): it ran on 74606671 in a private clone, with a temp HOME and a
  pi stub for every doctor run, single test files only, and a clean `git status` afterwards. HOLDS over 8 probes, no
  MUST. settings-lock passed R-2081, R-2084 and R-2085 with R-2082 and R-2083 skipped; settings-merge 219, install
  107, uninstall 31, win32-degrade 87, doctor-quiet 4, doctor-fix-line 9 and product-report 71 passed; code-map 0
  problems, readme-check 719 claims and 0 problems, the trace exit 0. Its probes covered a second awkward home under
  zsh and bash, forced-win32 output and direct `removalCommands` calls on Windows paths (an 8.3 name, `a&b^c!d`,
  typographic quotes, `$env:x` and a backtick), doctor healthy and with an empty lock, recovery by running the text
  after doctor's `remove it: `, `uninstall --yes` under a lock, locks outside the threat model (mode 000, a folder, a
  dangling link: no crash and no fail-open), relative homes, and test hygiene. The probe 2 Windows forms were judged
  by reading the rendered text only: no PowerShell was installed on that machine. Its findings and how each was
  settled:
  1. Open risk: R-2082 and R-2083 had never run, since cmd.exe and Windows PowerShell exist only on Windows. Closed:
     both passed by title on the Windows leg of run 39388721628, and build 3 (cdccc250) flipped them to
     `implemented`.
  2. Known bug, wording: doctor's ✗ text says "install will not run until it is removed", but `install --dry-run`
     still runs under a lock (R-926). It does not mislead the repair. Recorded as a HANDOFF residual, beside the
     owner's open ask on a dry run under a held lock.
  3. Known bug, found before the lane: `docs/product-report/assessments.json` still lists R-322, now retired, as
     `untested`. The report's staleness display already shows it, and product-report.test passes. Recorded as a
     HANDOFF residual.
  - Nobody re-ran the independent check on build 3, which changed tests and REQUIREMENTS.md only. Recorded as a
    HANDOFF residual with the macOS-only pairs.
  - The check's own probe home used a name shaped like the owner's. The seat's saved copy replaced it with a
    made-up name before commit, and the committed copy keeps the replacement.
- The plan's known limits, each a HANDOFF residual: Command Prompt expands a defined `%NAME%` inside double quotes,
  which breaks that line (the PowerShell line still works); Git Bash on Windows, and Claude Code's Bash tool there,
  get no form of their own; doctor cannot tell a running install's lock from a leftover one and marks it ✗ during an
  install; a hidden or read-only lock defeats both Windows lines; a lock left as a folder makes the printed `rm` and
  `del` lines fail (our tools make neither). The plan's limit that the session-start stale line still names install
  when a lock blocks it stays in the stale-copies-hooks residual. Its limit that nothing ran on Windows is settled by
  the Windows leg above.
- HANDOFF edits: install-honest-report's leftover-lock residual now says doctor reports the lock with the same
  commands; the stale-copies-hooks residual keeps its leftover-lock example, which is still true (the session-start
  line names install, not the lock), and adds that install's refusal and doctor now give the commands; the
  doctor-fix-line residual's leftover-lock example goes, since doctor's last line now lists the lock as a fix by hand
  before the rows it gives install.
- Rows: R-2080 to R-2085 read `implemented` in REQUIREMENTS.md; R-322 reads `retired`, "superseded by R-2080,
  2026-10-20". The seat helper's re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1549 total
  (1282 implemented · 1 planned · 35 retired · 226 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`;
  `npm run map:check` reads 338 modules, 0 problems; `npm run readme:check` reads 719 claims, 0 problems;
  `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 385c633f`, the merge base):
  ```
  tree movement 385c633..bcfb78f: 7 rows in 2 features
  FEAT-013 · Install and connect harness runtimes
    R-322 implemented -> retired
    R-2080 new (implemented)
    R-2081 new (implemented)
    R-2082 new (implemented)
    R-2083 new (implemented)
  FEAT-015 · Diagnose the active environment
    R-2084 new (implemented)
    R-2085 new (implemented)
  ```
  CAP-04 moves from 443 to 449 rows, FEAT-013 from 165 to 169 (SUB-014 from 33 to 37) and FEAT-015 from 113 to 115.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite on 74606671) and the local
  macOS install check, which runs before the land.
