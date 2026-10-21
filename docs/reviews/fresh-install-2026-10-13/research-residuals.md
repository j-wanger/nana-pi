# Research — install-check residuals for lane fresh-install (main @ 9974218, 2026-10-13)

Source list: `~/.claude/projects/-Users-jwang-nana-pi/memory/project_pending_residuals_2026_10_13.md`.
Final reviews read verbatim: scratchpad `ic-sol-r1.md` (sol 9/10 LAND) and `ic-astra-r1.md` (astra 95/100 LAND);
ledger rounds `~/.pi/agent/review-ledger.rounds.jsonl:649-650` (both LAND at 9974218).
Already recorded in HANDOFF today: only the doctor-note-list item (`HANDOFF.md:44`). Every other item is unrecorded.

Recommendation in one line: fix everything in code/docs; pin the three rows with four named tests (cheaper and
more honest than a downgrade); implement the failure diagnostics (one new row, four tests); fix the Git Bash
`Path` lookup because Jake's PowerShell run would otherwise print `Git Bash: not found`.

---

## 1. `packages/nana-setup/README.md` — the Git Bash claim (sol NOTE, astra SHOULD)

**Wrong today.**
- `:401` ends "The check depends on Node, Git, pi, npm registry access, and Git Bash on Windows."
- `:403` says Windows "... starts pi from the fixture project, dispatches installed hooks through Git Bash, and runs doctor."

**Why it is false (code, not inference).**
- Every win32 row of the sealed hook table is exec form (`lib/install-check-config.mjs:11-15`, `form.win32: "exec"`).
- `hookInvocation` uses Git Bash only for an entry without `args` (`lib/install-check.mjs:88-92`).
- A shell-form entry on win32 fails `wrong-form` in `mapHookEntries` (`:59-60`), and the hook loop reports that
  structural failure and returns before `hookInvocation` runs (`:262-264`). So on win32, with today's seal,
  Git Bash never runs any hook. It only feeds the diagnostic first line (`:204-207`).
- pi needs a Bash only for its `bash` tool and `!` commands (pi 1.0.2 `docs/windows.md`, read 2026-10-13); the
  check sends no prompt. INFERRED: an RPC session starts without Bash. Git (`git init`, `:189`) is required.

**Smallest honest fix (prose only, no test pins this text; `grep "Git Bash"` in tests hits only install-check.test.mjs titles).**
- `:401`: "... depends on Node, Git, pi and npm registry access."
- `:403`: replace "dispatches installed hooks through Git Bash" with "runs each installed hook directly in exec
  form (`node` with arguments, no shell)". Optional clause: "On Windows it also prints the Git Bash it finds;
  no hook uses it."

**Cost.** Two sentences. `npm run readme:check` stays green (no command or path changes).

---

## 2. `docs/reviews/cc-hooks-windows-2026-10-12/owner-windows-check.md` step 2 (astra SHOULD, sol NOTE)

**Wrong today.**
- `:19` "In Git Bash or PowerShell, from the checkout:" followed by a `powershell` block
  `cd $NANA; node packages\nana-setup\bin\install-check.mjs` (`:20-22`). In Git Bash `$NANA` is unset (it is a
  PowerShell variable from step 1, `:9`) and Bash strips the unquoted backslashes, so node gets
  `packagesnana-setupbininstall-check.mjs` and fails with module-not-found.
- `:23` "runs every hook as Claude Code would" overstates: the check simulates the documented dispatch
  (sol NOTE; CHANGE §3 "Declared limits": "Claude Code itself never runs").
- `:24-25` asks Jake to paste "the first lines naming the resolved Git Bash, pi and node". From PowerShell,
  item 6 below makes that line read `Git Bash: not found` (INFERRED, not run on Windows).

**Smallest honest fix.**
- `:19` → "In PowerShell, from the checkout:" (HANDOFF:74 already calls it "the page of PowerShell steps").
- `:23` → "It installs nana into a temporary home and simulates Claude Code's documented dispatch for every hook."
- `:24-25`: keep only if item 6 is fixed; otherwise add "A `Git Bash: not found` line is expected from PowerShell and harmless."

**Cost.** Three line edits. The expected count "13 lines starting PASS" is correct for win32 today
(install, pi-subagents, two pi list lines, pi session, hook set, objective, adoption, shared memory, verifier Bash,
verifier PowerShell, knowledge pull, doctor).

---

## 3. Three rows marked `implemented` without every clause pinned (sol SHOULD, astra SHOULD)

Rail rule that sets the cost of a downgrade: an `untested` row that any `// req:` marker traces fails the rail
(`templates/typescript/template/tests/requirements-trace.ts:17`, `:84` STALE set). So a downgrade means removing
every marker for that row, including from tests that DO pin its other clauses. Splitting costs a new ID per row.
Pinning reuses existing fixtures (`recordingRun`, `scriptedFixture`, `assertOnlyHookFails`,
`install-check.test.mjs:170-223`, `:529-542`). **Pinning is the cheapest honest option for all three.**

### 3a. R-1071 (`REQUIREMENTS.md:899`)

> WHEN the install check runs, it shall start every process with one base environment (HOME and USERPROFILE set
> to a new temporary home; TMPDIR, TEMP and TMP set to that home's `tmp` folder; `npm_config_cache` set to its
> `.npm` folder; every variable in its sealed override list and every caller `npm_config_*` variable removed),
> run `nana-setup install` from the checkout with no `--home`, `--claude-home` or `--pi-home` flag, and report
> install as FAIL unless it exits 0.

Cited tests (all in `packages/nana-setup/tests/install-check.test.mjs`):
- `environment removes overrides and redirects home, temp and npm cache` (:61) — env construction.
- `environment: every override variable and every caller npm_config_* variable is removed, without case on win32` (:226) — removal.
- `environment: every child gets the base environment plus only its own step's additions (...)` (:242) — every child.
- `install invokes real-home mode without sandbox flags` (:82) — source grep for the install argv.
- `install: the command line carries no override flag` (:286) — argv `["install"]`.
- `platform: NANA_SETUP_PLATFORM in the caller changes nothing` (:293).

**Unpinned clause:** "report install as FAIL unless it exits 0". No cited test runs a failing install through
`runInstallCheck` and asserts the `FAIL install` line. `reporting: a run with any FAIL line exits non-zero ...`
(:330) uses `failInstall: true` but asserts only "some line starts FAIL" and carries R-1070, not R-1071.
`FAIL exit report includes status and the last stderr line` (:108) tests the pure formatter only.

**Pinning test (proposed exact title):** `install: an install that exits non-zero prints FAIL install with its exit status`
- `// req: R-1071`; `recordingRun({ failInstall: true })`; assert `result.lines` includes exactly
  `FAIL install — exit: exit status 1; last stderr: failed` and `result.exitCode === 1`.
  (Traced: fake install returns `{status:1, stderr:"failed"}` at :179; `reason()` at `lib/install-check.mjs:219`;
  `report("install","exit",...)` at :221.)
- Add the title to R-1071's evidence cell. About 6 lines.

**Downgrade alternative:** status `untested`, note "nothing pins: report install as FAIL unless it exits 0", and
remove `R-1071` from 9 markers (:60, :71, :81, :225, :233, :241 shared, :285, :292, :374) — which also discards
real evidence for the pinned environment clauses. Split alternative: new ID for the FAIL clause as `untested`.
Both cost more than the test.

### 3b. R-1079 (`REQUIREMENTS.md:906`)

> WHEN install has exited 0, the install check shall report the pi session as FAIL unless its RPC response lists
> `reload-runtime`, the pi session receives the base environment plus `NANA_TEST_TEMP_ROOTS` set empty, and the
> user-scope journal gains a `directory_unadopted` line naming the fixture project.

Cited tests:
- `pi session: runs with NANA_TEST_TEMP_ROOTS set empty` (:261) — environment clause.
- `environment: every child gets the base environment plus ...` (:242) — environment clause.
- `Windows JSON journal path matches parsed cwd and rejects other events or folders` (:142) — the pure parser `journalHasUnadopted` only.
- `win32 pi command preserves ComSpec verbatim argv launch options` (:136) — a source grep for `windowsVerbatimArguments`; pins no row clause.

**Unpinned clauses:** the FAIL direction for (i) a response without `reload-runtime` and (ii) a journal without
a `directory_unadopted` line naming the fixture project. No test drives `runInstallCheck` to `FAIL pi session`
(`grep "FAIL pi session"` hits only the formatter test at :104).

**Pinning tests (proposed exact titles), both `// req: R-1079`:**
1. `pi session: a get_commands response without reload-runtime prints FAIL pi session`
   — `assertOnlyHookFails(scriptedFixture((cmd) => cmd.includes("--mode rpc"), () => ({ stdout: "" })), "pi session")`.
   The fake still writes the journal (:199-202), so only the response clause fails.
2. `pi session: a journal with no directory_unadopted line for the fixture project prints FAIL pi session`
   — same harness; the change function rewrites `path.join(options.cwd, "..", ".pi/agent/nana-journal.jsonl")`
   with a `directory_unadopted` record whose `cwd` is a sibling folder, returns `{}` (stdout keeps `reload-runtime`).
   The check reads the journal after the session spawn resolves (`lib/install-check.mjs:241-245`), so the rewrite lands in time.
- Add both titles to R-1079's evidence cell. About 4 lines each.

**NOTE (not required to pin; say so in the CHANGE):** the code checks `reload-runtime` as a substring of
stdout PLUS stderr (`lib/install-check.mjs:244-245`), not the RPC response. A stderr-only mention would pass.
Realistic only if pi prints an error naming the command; low. Strict fix = check `session.stdout` only plus a
test `pi session: reload-runtime only on stderr prints FAIL pi session` — ~1 code line + 4 test lines. Leave as a
residual unless the builder has room.

**Downgrade alternative:** `untested` plus removing R-1079 from 5 markers (:135, :141, :241 shared, :260, :306).

### 3c. R-1078 (`REQUIREMENTS.md:1038`)

> The root CI workflow shall run the install check in an `install-check` job on `macos-latest` and
> `windows-latest`, in bash, with its pinned pi installation and version check, timeout and no continue-on-error.

Cited test: `packages/nana-pack/tests/ci-workflow.test.mjs::install check is a blocking macOS and Windows job before suite`
(:121-130) — asserts the slice exists before `suite:`, the `os` list, `timeout-minutes: 20`, no
`continue-on-error`, the run line, and the `--ignore-scripts` pi install line.

**Unpinned clauses:** "in bash" (`.github/workflows/ci.yml:27-29` `defaults: run: shell: bash`) and "version check"
(`ci.yml:34-35` `test "$(pi --version)" = "${PI_VERSION}"`). Deleting either passes the cited test.
(R-1090's test at :50-60 already pins `--before` on every install line, including this job's.)

**Pinning test (proposed exact title):** `install check job runs in bash and checks pi's version between the pinned install and the check`
- `// req: R-1078`; slice the job as :122 does; `assert.match(job, /^    defaults:\n      run:\n        shell: bash$/m)`;
  then indexOf for `run: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION}`,
  `run: test "$(pi --version)" = "${PI_VERSION}"`, `run: node packages/nana-setup/bin/install-check.mjs` — all ≥ 0
  and ascending (the same pattern as the R-1031 test at :101-117). About 8 lines.
- Add the title to R-1078's evidence cell.

**Downgrade alternative:** `untested` plus removing the one marker (:120). Cheapest by edits, but it drops the
pinned os/timeout/continue-on-error evidence; the test is still the honest choice.

---

## 4. Failure diagnostics promised by install-check CHANGE §3 (sol SHOULD, astra NOTE)

**The promise, exact.** `docs/reviews/install-check-2026-10-12/CHANGE.md:271`: "On any FAIL it keeps the home and
prints its path, the `hooks` block of its `settings.json`, and the last `pull.log` record
(`nana-knowledge/lib/paths.ts:25`)." `:272`: "CI wipes `runner.temp` at job end, so the printed lines are the
evidence." Restated in the seat fact-check at `:630`. No row in R-1070–R-1084 carries it, so nothing failed.

**What the code does.** `packages/nana-setup/bin/install-check.mjs:21-22`: on failure it prints only
`install-check home retained: <home>` to stderr. In CI the home sits under `runner.temp` (`ci.yml:39-41`) and is wiped.

**Why it matters (beyond the promise).** The knowledge-pull FAIL reason is the generic "required hook output or
fixture condition was not observed" (`lib/install-check.mjs:291`). The last pull.log record carries the hook's
own `reason` (budget, no hits, missing index), `tokens`, `hits` and `ms` (`packages/nana-knowledge/lib/hook.ts:145-154`);
its absence also tells you the hook exited before logging (excluded reasons at :142). The hooks block explains a
`hook set` FAIL whose reason names only the first failure (`:251-252`).

**Smallest honest implementation (recommended).**
- Row (one ID from R-1093–R-1099), draft: "WHEN any result line is FAIL, the install check shall print, after its
  result lines, the `hooks` block of the temporary home's Claude Code `settings.json` as one JSON line and the
  last line of the home's knowledge `pull.log`, or for either file a line saying it could not be read."
- Config: `PULL_LOG_PATH = [".pi", "agent", "nana-knowledge", "pull.log"]` in `lib/install-check-config.mjs`,
  provenance "contract value: nana-knowledge/lib/paths.ts:17 and :25, read 2026-10-13; NANA_KNOWLEDGE_HOME is
  on the override list, so the default path holds". No size cap: both files are written by our own installer and
  hook inside a fresh temporary home (no new tunable).
- Code: at the end of `runInstallCheck` (`lib/install-check.mjs:309-310`), `if (failed)` emit
  `settings hooks: <JSON.stringify(settings.hooks ?? null)>` (the `settings` object is already parsed at :248) and
  `last pull.log record: <last non-empty line>` or `... could not be read (<code>)`. About 8 lines. Lines go
  through `emitLine`, so they reach stdout and `result.lines`. `bin/install-check.mjs:22` stays as is.
- Tests (proposed exact titles):
  1. `diagnostics: a run with a FAIL line prints the settings hooks block and the last pull.log record` — scriptedFixture failing the knowledge hook; the change function writes two records to the fixture home's pull.log; assert both diagnostic lines and that the second record is the one printed.
  2. `diagnostics: a run of only PASS lines prints neither diagnostic` — plain `recordingRun()`; no line starts `settings hooks:` or `last pull.log record:`.
  3. `diagnostics: a missing pull.log prints a could-not-be-read line, not a crash` — `recordingRun({ failInstall: true })`.
  4. `pin R-109x: the pull.log path under the temporary home` — deepEqual on `PULL_LOG_PATH`.
- Docs: one sentence in `packages/nana-setup/README.md` "Install check" (after :401): "On any FAIL it keeps the
  temporary home, prints its path, the installed hooks block and the last knowledge-pull record."
  Lib header `@outputs` gains "failure diagnostics" → regenerate the code map. Requirements-tree leaf total
  (`packages/nana-pack/tests/requirements-tree.test.mjs:38`, `:52`, 1,088) rises with the new row(s).
- Cost: ~8 code lines, 1 constant, 4 tests (~35 lines), 1 row, 1 README sentence, map and tree regen.

**Residual alternative.** One HANDOFF line: "Install check: on FAIL it prints only the retained home's path, not the
hooks block and last knowledge-pull record its plan promised; CI deletes the home." Cost: one line. It leaves a
CI knowledge-pull failure untriageable from the log.

---

## 5. Session entry says the job runs "before the suite" (astra SHOULD)

**Wrong today.** `docs/sessions/2026-10.md:9`: "CI runs it as a blocking job on macOS and Windows before the suite."
In `ci.yml` the `install-check` job (:20) has no `needs`, and neither does `suite` (:43); only `release` has
`needs: [suite, install-check]` (:69). The two jobs start together. "Before" is only the file order, which the
R-1078 test asserts (`ci-workflow.test.mjs:124`) to keep the slices for R-996 byte-stable.

**Smallest fix.** "CI runs it as its own blocking job on macOS and Windows, alongside the suite; the release waits for both."
**Cost.** One sentence.

---

## 6. Git Bash discovery reads `PATH` only (astra NOTE)

**Wrong today.** `packages/nana-setup/lib/install-check.mjs:205`:
`bash = findGitBash(String(childEnv.PATH ?? "").split(/[;]/));`
`childEnv` is a plain object copied from `process.env` by `buildEnvironment` (:17-31), so it keeps the caller's
key spelling. Windows stores the variable as `Path`; a node started from PowerShell or cmd keeps `Path`
(INFERRED from Node's case-preserving env enumeration; not run). `childEnv.PATH` is then `undefined`, and the
first line reads `Git Bash: not found`. CI is unaffected: it launches node from Git Bash (`ci.yml:27-29`),
which exports `PATH`, and run 2026-10-12T17:11 printed `Git Bash: C:\Program Files\Git\bin\bash.exe`
(scratchpad `ic-ci1-win-ic.log`). `findPi` already reads the key case-insensitively (`packages/nana-pack/lib/win-command.mjs:14-17`, `:30`).

**Consequence.** No hook result changes (item 1: Git Bash runs nothing on win32). But Jake's blocking Windows
check runs from PowerShell and asks him to paste that line (`owner-windows-check.md:24-25`), so the one person
proving Windows would see a false `not found`.

**Smallest honest fix.** Line 205 → read the value under any letter case and pass the injected `exists`:
`findGitBash(String(Object.entries(childEnv).find(([key]) => key.toUpperCase() === "PATH")?.[1] ?? "").split(";"), exists)`.
(`findGitBash`'s default `exists = fs.existsSync` still applies when `exists` is undefined.)
**Test (proposed exact title):** `dispatch: on win32 Git Bash discovery reads the path variable under any letter case`
— `// req: R-1075`; call `runInstallCheck` directly with `platformName: "win32"`,
`env: { Path: "C:\\Git\\cmd", ComSpec: "C:\\Windows\\System32\\cmd.exe" }`, `spawn: async () => ({ status: 1 })`,
`exists` true only for `c:\git\cmd\git.exe` and `c:\git\bin\bash.exe` (lower-cased compare); assert
`result.lines[0] === "Git Bash: C:\\Git\\bin\\bash.exe"`. (Must not use `recordingRun`: it always injects a `PATH` key, :221.)
**Cost.** 1 code line, ~10 test lines. Row text unchanged (R-1075 already says "as Claude Code's documented dispatch does").

---

## 7. Windows doctor note list carries two labels that never print as notes (astra-era NOTE)

**Already recorded:** `HANDOFF.md:44` ("one skill row passes and the other does not exist").

**Wrong today.** `packages/nana-setup/lib/install-check-config.mjs:31` win32 list includes `"skill requirements"`
and `"skill nana-standards"`.
- `skill requirements`: doctor marks NOTE only for `NEW_CLAUDE_SKILLS` (`lib/doctor.mjs:360-363`;
  `lib/steps.mjs:58` = spec, py-lint, py-review, py-test). `requirements` gets ✓ or ✗ (`doctor.mjs:365-366`).
- `skill nana-standards`: no such skill (`steps.mjs:57`); `nana-standards.md` is a rule row (`doctor.mjs:340-342`, ✓ or ✗).
- Effect today: none. Matching is `line.includes(note)` on `·` lines (`lib/install-check.mjs:296`); neither label
  can appear on a `·` line, and a ✗ already fails doctor's exit.

**Smallest fix.** Delete the two labels from `DOCTOR_NOTES.win32` and from the pin
`pin R-1081: the doctor note list` (`install-check.test.mjs:675-681`); provenance comment (:26-27) stays true.
It is a sealed-value retune under R-1081, whose text does not enumerate labels, so declare it in the CHANGE.
Then drop the second sentence of `HANDOFF.md:44`.
**Cost.** Two tokens in config, two in the pin, one HANDOFF clause. Windows CI confirms nothing turns red.
**Alternative.** Leave it; it is already recorded. Recommend fixing: it makes the sealed list equal what doctor prints.

---

## 8. HANDOFF ruling line for Jake's 2026-10-13 builder split

**Missing today.** `HANDOFF.md:18` still reads "Builders: time one lane with Sonnet 5.5 and one with luna before
any roster change." `:22` records the 10-13 review ruling but not the builder split. The shared roster memory has
it (`~/.claude/nana-memory/shared/reference_roster.md:21-23`).
**Proposed Landed line (after :22):** "- 2026-10-13: Jake's builder split. Sonnet 5.5 builds larger or riskier
lanes. luna builds small lanes, and every brief names each required test by exact title."
**Cost.** One line; run `nana-writing.mjs --report` on HANDOFF after the edit.

---

## Adjacent findings (not in the memory list; the plan should decide)

- `HANDOFF.md:23` says the command "runs every hook the way Claude Code and pi do". For pi it registers and opens
  one session with no prompt; no pi prompt-time hook runs (CHANGE §3 limits). Reword to "simulates every Claude
  Code hook and opens one pi session". One clause; the lane edits HANDOFF anyway.
- `docs/sessions/2026-10.md:9` "otherwise `/bin/sh -c` or Git Bash" is true as a rule but the Git Bash branch is
  unreachable on win32 at today's seal (item 1). No change needed.
- `lib/install-check.mjs:6` header says `@effects process`, but the module also writes files (:182-185, :200, :223-225, :255).
  Only touch it if item 4 edits the header anyway.

## Most likely wrong claim here

That a node launched from PowerShell enumerates the variable as `Path` (item 6). It is INFERRED from Windows'
stored spelling and Node's case-preserving `process.env` keys; no Windows run checked it. The fix and its test
are correct either way, so the cost of being wrong is one unneeded line.
