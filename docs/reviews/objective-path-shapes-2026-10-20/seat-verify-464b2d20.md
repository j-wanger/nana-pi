# Seat checks — objective-path-shapes builds 1 and 2, tip 464b2d20 (2026-10-20)

- Builds, by a Claude Sonnet 5 builder (a Claude Code subagent in the lane worktree; two builds); the lane branched
  from main 72abe19a, with the plan at b3aa34e4 (`must-meet.md`, `plan-attack.md`: one adversary, AMEND;
  `build-brief-1.md`):
  - Build 1 is one commit, 07dc79b3. New `packages/nana-pack/lib/objective-path.mjs` (six-tag header, `@effects
    none`) exports `DEFAULT_OBJECTIVE_FILE` (contract value, R-004) and `resolveObjectivePath(value, { home,
    agentDir, platform })`: a non-string or `""` value gives `<agentDir>/nana-objective.md`; `"~"` gives home; a
    leading `~/` goes under home, and a leading `~\` too where the platform is win32; an absolute value stays as
    given; anything else goes under agentDir; the platform picks `path.win32` or `path.posix`. `lib/objective.ts`
    `objectivePath` becomes one call to it (with `os.homedir()`, `piAgentDir()` and `process.platform`; it keeps
    `o.path`, so R-2093's internal-error marker holds). nana-setup's `lib/steps.mjs` `objectiveTarget` drops its hand
    copy and becomes one call too, with `layout.base`, `layout.piHome` and the real `process.platform`, not the
    `NANA_SETUP_PLATFORM` seam; the export stays. `lib/paths.mjs`'s `piObjective` reads the shared file name.
    `lib/doctor.mjs` adds a FAIL `pi objective.path` row, with no install label, only when the value is present and
    neither a string nor null; its detail names the value's JSON (capped at 120 characters), says the producer ignores
    it and uses `layout.piObjective`, and gives the fix (a path string, or null for the default). The pack README's
    objective paragraph and the setup README's `nana-objective.md` row say a `~\` expands on Windows and an empty or
    non-string value means the default file. REQUIREMENTS.md gains R-2280 and R-2281 (FEAT-015, after R-343), R-2282
    (FEAT-013 SUB-012, after R-309) and R-2283 to R-2285 (FEAT-001, after R-005). The new
    `packages/nana-setup/tests/objective-path-shapes.test.mjs` holds all six. Build 1 left R-2285 `untested` behind
    a `req-candidate` marker; off Windows it prints a SKIP line and counts no PASS.
  - 39d84016 adds the seat's pairs on 07dc79b3.
  - Build 2 is 464b2d20. After the Windows CI leg passed R-2285, its marker reads `// req: R-2285` and its row
    `implemented`, evidence Windows-leg-only, in R-2254's form. It changes one line in REQUIREMENTS.md and moves one
    marker line in the test file. No brief file for build 2 sits in the review folder.
  - The seat stopped build 1's full-suite run: the brief asked for single test files, and another lane held the
    machine's suite lock. After 464b2d20, the seat's notes commit adds only this record, the independent check, the
    Windows log, the two review briefs, HANDOFF and the session entry.
- CI run 39440971339 on draft pull request #134 at 07dc79b3 (build 1; GitHub's merge commit 8af296b8 merges 07dc79b3
  into its own ancestor 72abe19a, so the tree tested is 07dc79b3's); all five jobs succeeded and release was skipped:
  - macOS `191 files: 189 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7967 pass, 0 fail, 32 skip`; objective-path-shapes
    `5 pass, 1 skip`. That log prints no check lines for a passing file; by the file's platform guard the skip is
    R-2285.
  - Ubuntu `191 files: 188 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7906 pass, 0 fail, 51 skip`; objective-path-shapes
    `5 pass, 1 skip`, the same split.
  - Windows `191 files: 173 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6893 pass, 0 fail, 112 skip`
    (`ci-windows-07dc79b3.log`). The 18 skipped files are main's declared set: 16 desk files, bench's study-tasks and
    checkout-converge (POSIX only). objective-path-shapes `6 pass`, with its check lines:
    ```
    PASS R-2280: doctor prints every row and no stack trace when objective.path is 5, true or an object
    PASS R-2281: doctor marks objective.path ✗ naming the value and the default file only when it is neither a string nor null
    PASS R-2282: install runs every step and seeds the default objective file when objective.path is 5, true or an object
    PASS R-2283: an empty objective.path names the default objective file in the producer, doctor and install
    PASS R-2284: the objective path resolver expands a tilde-backslash prefix to the home folder only on win32
    PASS R-2285: on Windows, the producer and doctor both read a tilde-backslash objective.path from the home folder
    ```
    Neighbours there: objective-golden `1026 pass, 6 skip`, objective-injection `69 pass`, install `93 pass, 5 skip`,
    doctor-detail `68 pass, 1 skip`, fresh-machine `9 pass`, doctor-fix-line `9 pass`, stale-copies `13 pass, 1
    skip`, install-check.test `129 pass`. R-2285 was the plan's one claim inferred from code and not run before (on
    win32 both copies on main joined `~\…` under the agent dir). It held: the producer's `governing:` line and
    doctor's objective file row both name the file under the home folder.
  - install-check: macOS and Windows success.
  - None of main's known failures showed (Ubuntu's path spelling, fixed on main at ca27d86; a pull request run's R-291
    leaf-total merge artifact, which cannot arise here because GitHub's merge commit holds 07dc79b3's tree).
  - CI has not run on 464b2d20. Build 2 changes only R-2285's marker and row; the land runs the locked suite on the
    reviewed tip, and the local macOS install check runs before the land.
- The seat's wrong-code pairs (`seat-mutate.mjs`, the shared mutation runner, macOS, Node 22.22.2, one shard, merge
  base 72abe19a), on 07dc79b3 (`seat-mutate-output-07dc79b3.txt`, commit 39d84016): 21 of 21 red, 0 survived.
  Baselines: objective-path-shapes 5 PASS, install 109 PASS, objective-golden 1280 PASS.
  - The resolver: R1 (`!value` in place of a type test) and S1 (`objectiveTarget` restores main's hand copy) bring
    back main's TypeError. The test file then throws at R-2280's in-process doctor call, so their named titles read
    NOT REACHED and the CRASH line is their red (declared before the run). R2 (`String()` coercion) turns R-2282 red;
    R3 (an empty value as the agent dir, main's producer form) R-2283; R4 and R5 (`~\` expanded everywhere, or
    never), R6 (the host's path flavour) and R7 (`~/` never expanded) R-2284; R8 (an absolute value under the agent
    dir) install's existing "objective seed: doctor is still green"; R9 (a relative value against the cwd)
    objective-golden's T15 relative check; R10 (another default file name) objective-golden's three R-004 checks, with
    seven golden worlds that write the default file by its literal name as unnamed reds (declared).
  - P1 (`paths.mjs` spells its own default) turns R-2281, R-2282 and R-2283 red; O1 (`objectivePath` keeps main's
    body) R-2283; S2 (the tilde under the real home, not the layout's) install's R-309 check "objective seed: created
    when objective.path resolves to it".
  - Doctor's row: D1 (dropped) turns R-2280 and R-2281 red; D2 (also for null), D3 (also for a string, `""`
    included), D4 (warns instead of failing), D5 (omits the default file), D6 (only for a truthy value) and D7
    (`String()` in place of JSON) each turn R-2281 red.
  - Declared without a pair, before the run: the platform argument changes a result only on win32, and R-2285
    prints SKIP on macOS, so no pair names R-2285 or swaps that argument; a pair that moves `objectiveTarget` to the
    `NANA_SETUP_PLATFORM` seam would survive on macOS (a plan known limit). `o.path` against `o?.path` is an
    equivalent edit, and so is main's literal back in `paths.mjs`. No check gives `"~"` alone or a value over 120
    characters, and doctor's `String()` fallback is unreachable. No lane check reads the fix line for this row. No
    Windows-only pair ran; the Windows CI leg is the only run of the win32 wiring.
  - Runner tally: the RESULT line reads "18 exactly their named titles, 4 with a named title green, 1 with an unnamed
    red", which sums to 23 for 21 pairs. `packages/nana-pack/lib/mutation-runner.mjs` adds one to `namedGreen` for a
    pair with NOT REACHED titles and again for a pair with no matched named title, so R1 and S1 count twice (read in
    the code, not run). The red and survived counts are right. A HANDOFF residual.
- Independent check (`independent-check-464b2d20.md`, filed under this tip's name): it ran on 07dc79b3 in a private
  clone beside a clone of 72abe19a, with a temp home for every probe (Node 22.22.2 on macOS, pi 1.0.2). HOLDS, no MUST
  and no known bug, over ten probes plus the must-meet and neighbouring files.
  - Must-meet files on the lane: objective-path-shapes 5 PASS, 0 FAIL, 1 SKIP (R-2285); objective-golden 1280/0,
    objective-injection 69/0, fresh-machine 9/0, install 109/0, doctor-detail 72/0; the code-map check 0 problems; the
    readme check 725 claims, 0 problems.
  - Doctor with path 5: main stopped after 9 lines with `TypeError: p.startsWith`; the lane printed 53 lines with the
    ✗ row, and its last line lists `pi objective.path` as a fix by hand (P1). The dry run with an object: main threw;
    the lane exited 0 and wrote nothing (P2). A real install with `false` seeds the default and leaves nana-pack.json
    byte-identical; doctor marks `false` ✗ and shows no row for null (P3).
  - The producer against doctor's and install's target on 23 values agree on every one on the lane (one "~" mismatch
    was a doubled slash in the temp home string); every string value except `""` resolves as on main (P4). Forced
    win32 over 15 Windows values, only `""`, `~\notes\goal.md` and `~\` change, matching `piNormalizePath`'s `~\`
    rule (P5). The Claude Code hook end to end: `""` now governs the default file where main printed unreadable (P6).
    pi's own jiti loads the extension with the new `.mjs` import (P7). With `PI_CODING_AGENT_DIR` elsewhere, doctor
    names the file the producer reads (P8). A 300-character object is capped at 120; an escape prints as text, with 0
    raw ESC bytes; no shape crashes (P9). A hand-written default objective file is kept byte-identical (P10).
  - Its writes: only npm logs under the temp HOME; install under `--home` skips pi packages and launchctl. The R-2282
    test runs install the way install.test.mjs does on main.
  - Its two observations and how each was settled: (1) R-2285 was unrun on macOS. Settled: the Windows CI leg passed
    it at 07dc79b3, and build 2 flipped the row to implemented. (2) When the objective block itself is not an object,
    such as `{"objective":5}`, doctor shows no objective.path row. It is unchanged from main and outside this lane's
    sentence: a HANDOFF residual.
  - One line of its text is short of the record: it says requirements-moved lists R-2280 to R-2282 as new and
    implemented. At 07dc79b3 the lane also added R-2283 and R-2284 (implemented) and R-2285 (untested); the seat's
    run at 464b2d20, below, lists all six.
- The plan's known limits: a pasted Windows path whose backslashes all form valid escapes still names a wrong file
  (the existing win-config-json-path line, unchanged); while nana-pack.json does not parse, doctor's objective file row
  still judges the default file (existing line, unchanged); the macOS checklist's objective step has no example (the
  existing tilde line keeps that half). New HANDOFF residuals naming this lane: `"~"` alone, or `~\` alone on win32,
  names the home folder, which doctor's existsSync row reads ✓ while the producer prints unreadable; doctor prints
  control characters in a string objective.path raw in its objective file row; only pi's `~\` rule is copied, so a
  `file://` value or a `/c/` shell path is not expanded; install does not flag a non-string value, only doctor does;
  `objectiveTarget` reads the real platform, so a pair switching to the `NANA_SETUP_PLATFORM` seam would survive on
  macOS.
- Declared behaviour change: doctor now marks objective.path `false` and `0` ✗ and exits 1, where main read them
  silently as the default; the producer still ignores them as before.
- HANDOFF: one Landed line. The doctor-crash line from doctor-fix-line's independent check goes, since the lane fixes
  it. The win-config-json-path tilde line drops its fixed half (`~\` before a backslash) and keeps the macOS checklist
  half. Six new residuals name this lane: the five plan limits above and the independent check's non-object objective
  block. One mutation runner line carries the tally count. Seat items from other lanes: none here. lane-guard-temp-root
  carries the owner's 2026-10-20 rulings and the builder full-suite line, which reach this branch at the next merge of
  main.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2280 to R-2285 read `implemented` in REQUIREMENTS.md; R-2285's evidence says Windows-leg-only. At the notes
  commit (no code or row changed since 464b2d20): `node scripts/requirements-trace.mjs` reads `requirements: 1631
  total (1394 implemented · 1 planned · 37 retired · 193 untested · 6 violated); 1394 traced by tests` and `ears: 0
  rows off form (allowance 0)`; `npm run map:check` reads 357 modules, 0 problems; `npm run readme:check` reads 725
  claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 72abe19a, run at 464b2d20):
  ```
  tree movement 72abe19..464b2d2: 6 rows in 3 features
  FEAT-001 · Keep goals and priorities in view
    R-2283 new (implemented)
    R-2284 new (implemented)
    R-2285 new (implemented)
  FEAT-013 · Install and connect harness runtimes
    R-2282 new (implemented)
  FEAT-015 · Diagnose the active environment
    R-2280 new (implemented)
    R-2281 new (implemented)
  ```
  CAP-01 moves from 193 to 196 rows and FEAT-001 from 39 to 42; CAP-04 from 497 to 500, FEAT-013 from 188 to 189
  (SUB-012 from 41 to 42) and FEAT-015 from 136 to 138. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite at 07dc79b3), Windows-only
  wrong-code pairs, and the local macOS install check, which runs before the land.
- Main has not moved under this lane: it is still 72abe19a, the merge base and the review base. lane-guard-temp-root,
  in review now, lands before this lane, so main will move before this lane's land.
