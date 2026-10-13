# Fact-check (repo claims) — fresh-install CHANGE.md, 2026-10-13

Repo `/Users/jwang/nana-pi` main `9974218`, read only. Probes ran in `plan-fresh-install/fc-probe/` (a scratch
`git archive` copy, scratch npm prefixes with the plan's isolated cache, and a probe script importing the repo's lib).
Legend: VERIFIED = read or run here; INFERRED = reasoning only.

## WRONG

1. **Mutation (11) does not turn red as designed.** §3.2 specifies the unanchored regexes `PI_VERSION: (\S+)` and
   `PI_BEFORE: "([^"]*)"`. I converted ci.yml to CRLF and split it on `\n` only. Both regexes still return `1.0.2` and
   `2026-10-04T06:57:57Z`, because `\S+` stops before `\r` and the quote pattern ignores the trailing `\r` (VERIFIED in node).
   Only `$`-anchored forms (`^  PI_VERSION: (\S+)$`, `^  PI_BEFORE: "([^"]*)"$`) fail without `/\r?\n/`. Fix: anchor both
   in §3.2. Otherwise the CRLF case pins nothing.
2. **Jake's step 2b fails as written.** With npm 10.9.7, `npm i -g … --dry-run --prefix <dir>` exits 254 with
   `ENOENT lstat` when the prefix is missing (VERIFIED). It also fails when the prefix exists but `<prefix>/lib` does not
   (VERIFIED, macOS). It works once the global dir's parent exists, and it prints `add @earendil-works/pi-codemode 1.0.2`
   (VERIFIED; `added 146 packages`). On Windows the global dir's parent is the prefix itself (INFERRED). So step 2b needs
   `New-Item -ItemType Directory -Force "$env:TEMP\pi-pin-probe" | Out-Null` first. The expect line should be
   `add @earendil-works/pi-codemode 1.0.2`.
3. **HANDOFF ":44's second sentence" is the wrong sentence.** :44 reads (1) "Install check: it proves … not a live Claude
   Code session." (2) "Linux runs no install check." (3) "Its Windows doctor note list carries two labels …". The plan
   should drop the third sentence. The second is still true.
4. **§3.1 "declared there once with provenance (R-597, R-1091)".** R-597 (REQUIREMENTS.md:1037) covers suite triggers and
   release gating. No row declares `PI_VERSION`. Its provenance is the ci.yml comment at :11 ("installed and verified
   version, pi 1.0 adoption 2026-10-04"). R-1091 seals only `PI_BEFORE`.

## UNVERIFIED in the plan, now settled (upgrade the labels)

- "pi answers RPC on stdout (INFERRED)" is DOC-VERIFIED. pi's `docs/rpc.md:29,56,89` say the response goes to stdout,
  "diagnostics and application logging go to stderr", and "Do not parse stderr as protocol data".
- "Today a stderr-only `reload-runtime` passes": VERIFIED. A probe `runInstallCheck` with the session on stderr only
  printed `PASS pi session`.
- Git Bash lookup with env key `Path` on win32 prints `Git Bash: not found` today: VERIFIED. The probe also showed a
  second needed fix. With a `PATH` key and an injected `exists`, it is still not found, because :205 calls
  `findGitBash` without `exists`. The plan names both fixes, which is correct. Production passes no `exists`, so the
  default `fs.existsSync` still applies.
- Placeholder hint as a parse error: VERIFIED for bash (`syntax error near unexpected token 'newline'`) and zsh
  (`parse error near '>'`). PowerShell and cmd stay INFERRED (no pwsh here).
- Still unverified: the Windows `npm.cmd` / `npm.ps1` forwarding claims (§3.3). "sol 9/10, astra 95/100" is in no repo
  file; it comes from the memory only.

## GAP (design or test does not pin what the row or plan says)

- **R-1094 location clauses.** The row names root README step 2 and the setup README's "Update nana-pi" section. The §5
  title checks the four READMEs file by file. If the command moved to another section of the setup README, every
  named test would stay green. Say that the test slices step 2 and the `### Update nana-pi` section.
- **R-1095 "built at run time from … the root CI workflow".** It is pinned only through mutation (9). A literal in
  `steps.mjs` equal to today's values passes every named test. Either add a source-shape assertion (precedent:
  `install-check.test.mjs:311` matches `findPi({ env: childEnv, cwd: root, exists })` in source) or record it as a residual.
- **R-1096 says "missing or empty" for both keys.** The §5 cases have no `PI_VERSION:` with an empty value.
- **R-1098 vs §3.4.** "An empty log prints `none`" is neither a row clause nor a test. `could not be read (SyntaxError)` is
  `error.name`, not the `<code>` the row text promises. Put both in the row and the tests, or drop them.
- **Luna brief details missing from §5.** (a) The R-1097 "will not import" case needs a fake package root, as
  `usage.test.mjs:254-259` builds: `BENCH_PI_ROOT` set to a directory holding `package.json` and
  `node_modules/@earendil-works/pi-ai/package.json`. Without it, the case hits the no-root error, not `load`.
  (b) The R-1079 journal-negative case must overwrite `.pi/agent/nana-journal.jsonl` inside the `scriptedFixture`
  change, because `recordingRun`'s spawn writes the good line first (`install-check.test.mjs:199-201`).
  (c) The R-1098 FAIL-with-hooks case needs a FAIL after a successful install (for example a doctor `spawnOverride`),
  because `failInstall` writes no settings.json.
- **Headers.** `apps/bench/lib/pi-exports.mjs` `@inputs` should gain the CI workflow. `install-check-config.mjs`
  `@outputs` ("Hook, environment, known-red and doctor-note contracts") should gain the pull.log path. §3 updates only
  the `steps.mjs` and `install-check.mjs` headers.
- **Memory deletion drops one item.** `project_pending_residuals_2026_10_13.md` also carries a "HANDOFF fact": the CI half
  of the 2026-10-24 "done" is met (main run 38414636460 at 9974218). That fact appears in neither HANDOFF nor
  `docs/sessions/2026-10.md`, and §3.4 does not carry it before deleting the memory.
- NOTE: `PI_INSTALL_BASE` is a second copy of the CI line's base. The test oracle already parses it from ci.yml, so a
  CI flag change becomes a code change. Subtraction option: `pi-pin` reads the whole install-check line.
- NOTE: the R-1078 title "install check is a blocking macOS and Windows job before suite" keeps the "before the suite"
  wording the session-sentence fix removes. It asserts only textual order.
- NOTE: the step 2b literal is a fifth copy outside R-1093. The plan acknowledges it, and no check guards it against drift.

## VERIFIED (no action)

- Row IDs: R-1093 to R-1099 appear nowhere outside `docs/reviews`. The rows cited (R-951, R-1037, R-508, R-1084,
  R-1071, R-1075, R-1078, R-1079, R-1081, R-1070, R-1090 to R-1092) sit under the features §0 names: SUB-011 at
  REQUIREMENTS.md:663, FEAT-015 at :889, FEAT-019 at :1021 and FEAT-034 at :1569.
- File and line cites match: README.md:121 (the "Upgrading pi itself" cross-reference is stale; no such heading
  exists); apps/desk/README.md:25; apps/bench/README.md:11 and :26; setup README :66, :70, :401, :403; steps.mjs:810,
  :982, :991 (`repoRoot` imported at :36); doctor.mjs:330, :340-342, :360-366; pi-session.mjs:347, :353, :358-360
  (server.mjs:125 loads it at start); pi-exports.mjs:148 and :162; install-check.mjs:205, :244, :262-264, :291;
  paths.ts:17 and :25; the trace rail's untested check at requirements-trace.ts:84 (STALE set, enforced at :429);
  requirements-tree.test.mjs:38, :52, :53 (1,088); fresh-machine.test.mjs:31; usage.test.mjs:300 (untraced; its regex
  turns red once `--ignore-scripts` is in the message); HANDOFF :22, :23, :44, :45, :55, :65, :74; sessions
  2026-10.md:9 ("before the suite"); jake-windows-check.md:19 and :23; install-check CHANGE:271.
- Marker counts: R-1071 has 9, R-1078 has 1, R-1079 has 5. DOCTOR_NOTES.win32 has 19 labels, so removing two leaves 17,
  and "skill spec" is among them. "skill requirements" is never a NOTE row (not in NEW_CLAUDE_SKILLS), and
  "skill nana-standards" never appears.
- R-1093 inventory: over the 7 READMEs the readme check covers, the detection regex finds exactly 5 spans: README :121,
  setup :70, desk :25, bench :11 and :26. After the planned edits in a scratch copy, 4 spans remain and all 4 equal the
  ci.yml oracle (0 mismatches).
  `readme-check` passes (651 claims; the only problem is `.git` missing from the archive copy). The current R-951 test
  still passes.
- Mutations (1)-(10) and (12)-(32) turn their checks red as claimed, checked by reading the code. Two of these I traced
  line by line. (30) is red because `install-check.test.mjs:334` requires every passed-run line to start with
  `PASS `, `pi:` or `node:`. (31) is red because `assertOnlyHookFails` (:539) requires exactly one FAIL line. (16) is red
  because the full pinned hint is not inside the old literal.
- Exact R-1071 line: `FAIL install — exit: exit status 1; last stderr: failed` matches `reason()` with `recordingRun({ failInstall: true })`.
- Layers: `code-map.config.json` lets apps import packages, and `pi-exports.mjs` is not content-pinned by the study.
- Probe tree: the pinned tree has 8 `@earendil-works` packages, all at 1.0.2. Baseline test files are green:
  fresh-machine, ci-workflow, usage, requirements-tree and install-check.
