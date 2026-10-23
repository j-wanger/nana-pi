# pi-version-support · plan attack (adversary, 2026-10-23, main f2b27357)

Read-only pass over `pi-version-support-plan-draft.md`. Scratch work: `scratchpad/pva-attack/`.
- `inst.sh` and `p/<name>/`: my own npm `--prefix` installs, made with an empty npm cache.
- `rule.mjs`: the plan's row rule, with doctor's `versionAtLeast` copied verbatim.
- `fixture-pairs.mjs`: the plan's R-2713 and R-2714 fixtures, run against wrong variants.
- `ci/*.yml`: plan-shaped and wrong workflows, used with the real `ci-workflow.test.mjs` through `CI_WORKFLOW_PATH`.
- `r2711-sketch.mjs`: the plan's R-2711 bullets written out as a check.
- `pnpm-home/`, `bun/`: pnpm 12.15.0 and bun 1.3.13 global installs of pi 1.4.0.
- `fx/`: fixtures with odd versions.
- `repo/`: a local clone of main with probe-shaped pins. Its push URL is disabled.
- `jobs.tsv`: timings for the 25 most recent `ci` runs, read with `gh api`.

Every command ran under `env -i`, with HOME, USERPROFILE, TMPDIR and npm_config_cache inside `scratchpad/pva-attack/`. The real global prefix, `~/.pi` and `~/.claude` were never written. I read this Mac's real pi only through `rule.mjs`. No model was called and no full suite ran. I wrote nothing inside the checkout or any worktree. Each claim is marked measured or inferred.

## Summary

The plan's measurements hold.
- **Cutoffs.** I re-installed both cutoffs into fresh prefixes with an empty cache. The floor `1.0.3 --before=2026-10-05T08:40:00Z` gave a tree byte-identical to the planner's `pinned103` (287 `npm ls -g --all` lines, every `@earendil-works` package at 1.0.3). The ceiling `1.4.0 --before=2026-10-23T18:35:54Z` matched the planner's `fresh140` and `pinned140`, and today's no-cutoff install (261 lines). Measured.
- **The row's rule.** Over 16 real layouts it gave ✓ on every lockstep npm install, this Mac's included. It gave ✗ on every fresh install from 1.0.2 to 1.2.0, and `·` on a pnpm global. Measured.
- **R-1078.** Its two landed checks pass unedited on a plan-shaped workflow. Measured.
- **pi 1.0.2 to 1.4.0.** Nothing nana mirrors changed: `path-utils.js` (the gate's mirror), `trust-manager.js`, `bash.js`, `truncate.js`, `edit.js` and `write.js` are byte-identical. `CURRENT_SESSION_VERSION` is 3 in both, the thinking levels match, and `rpc.md`, `rpc-commands.md`, `session-format.md` and `packages.md` are unchanged. Install scripts went down, because esbuild's postinstall is gone in 1.4.0. Measured.
- **Matrix job names.** main has no branch protection and no rulesets (`gh api`). `ci-records` parses only `suite (<os>)` job names. So the new names break nothing. Measured.

One part must change before the brief. As planned, R-2711's test and R-1078's checks both pass a workflow whose floor legs install pi and then skip the install check (M-1). Six smaller gaps follow: two plausible wrong doctor builds pass the planned fixtures, one wrong-code pair turns red for a reason that depends on the machine, pi's own version is never judged, the probe branches never start CI, and the precedent misses the production pi resolver.

## Findings

### M-1 · A workflow whose floor legs skip the install check passes R-2711 and R-1078

- Measured. `scratchpad/pva-attack/ci/w1-check-gated.yml` is the plan-shaped workflow plus one line, `if: matrix.pi == 'ceiling'`, on the `Install check` step.
  - The real `ci-workflow.test.mjs`, run with `CI_WORKFLOW_PATH` on that file, PASSes both R-1078 checks ("install check is a blocking macOS and Windows job" and "…checks pi's version after the pinned install and before the check").
  - `r2711-sketch.mjs` asserts every bullet the plan lists for R-2711: the matrix lists, `fail-fast`, one gated install per version, a version check under the same gate before the check step, no step installing both, and no ungated install. It PASSes `w1` too.
  - The R-1090, R-597 and R-1091-seal failures in those runs are the three amendments the plan already lists.
- Consequence (inferred from GitHub Actions semantics). Each floor leg installs and verifies 1.0.3, skips the check, and ends green. The release gate counts it as passed. R-2711 reads `implemented` while the floor runs no install check, so "nana supports pi 1.0.3" is untested.
- A second variant passes the same bullets (inferred from the sketch, which asserts only the two lists): `exclude: [{ os: windows-latest, pi: floor }]` under the matrix. That pair is exactly the owner's second machine.
- Both are plausible. A builder adding `if:` lines to the steps after the ceiling install can carry one onto the next step. A builder trimming the ~3.3-minute Windows floor leg might exclude it.
- Change:
  - R-2711's text adds "and runs the install-check step, with no `if:`, on every leg; the matrix has no `include` or `exclude`".
  - Its test asserts: exactly one step runs `install-check.mjs`; that step has no `if:` line; the job's `matrix:` block has no `include:` or `exclude:` key.
  - Add pair 24 (the check step gated to the ceiling) and pair 25 (`exclude` of the Windows floor pair). Both turn R-2711 red.

### S-1 · Two plausible wrong doctor builds pass the planned R-2713 and R-2714 fixtures

Measured with `scratchpad/pva-attack/fixture-pairs.mjs`, which builds both fixtures as "What each test does" describes them.

- **(a) Names only the first newer dependency.** R-2713's text says "naming each such dependency". The fixture has one newer dependency (codemode 1.4.0; pi-ai is 1.0.3). A build that keeps `bad[0]` passes R-2713 as planned. With pi-ai also at 1.4.0, its detail names only codemode. The six-package real run R1 would catch it, but R1 is a manual seat check, not a pair.
- **(b) Reads `devDependencies` as well as `dependencies`.**
  - pi 1.0.3's published `package.json` lists `@earendil-works/pi-client`, `pi-protocol` and `pi-server` (`^1.0.3`) as devDependencies. npm never installs them. 1.4.0 lists no scoped devDependencies. Measured, `scratchpad/pva-attack/p/floor103` and `p/ceil140`.
  - On the real floor install, this build finds three packages missing and prints `·`. On the ceiling it prints ✓. Measured.
  - The planned fixtures carry no devDependencies, so R-2714 stays green. Only the CI floor legs would catch it, through the install check's `·` rule, after a full CI round-trip.
- Change:
  - The R-2713 fixture gets a second newer dependency (pi-ai 1.4.0), and the test asserts that both are named.
  - The R-2714 fixture gets `"devDependencies": { "@earendil-works/pi-client": "^1.0.3" }` with no folder, and still expects ✓ naming `3`.
  - R-2714's text says "listed in its `dependencies`".
  - Add pair 26 (names the first newer only → R-2713) and pair 27 (reads devDependencies → R-2714, `·` instead of ✓).

### S-2 · Pair 17 turns red for a reason that depends on the machine

- The R-2713 decoy variant runs with PATH `<prefix>/bin:/usr/bin:/bin`. On macOS neither `/usr/bin/npm` nor `/bin/npm` exists (measured). So the wrong build, "found through `npm root -g`", fails to spawn npm and prints `·`. The test is red because nothing was found, not because the decoy was read.
- A sibling wrong build uses node's own prefix, the desk's `node prefix (nvm/fnm)` candidate (`apps/desk/pi-session.mjs`, `piRootCandidates`). It reads the real machine's prefix.
  - On a CI macOS runner, that prefix holds CI's lockstep ceiling, so the build prints ✓.
  - On this Mac, the node prefix holds no pi (the planner measured this), so it prints `·`.
  - Both are red, for two different reasons. Inferred from the code.
- The plan's own standard says each pair turns its test red for a fixed reason. Pair 17 does not.
- Change: follow `packages/nana-pack/tests/pi-install.test.mjs:58-66`. Put a stub `npm` in the fixture's `bin` that prints the decoy's `lib/node_modules` for `root -g`, and keep `npm_config_prefix` on the decoy. The npm-root wrong build then reads the lockstep decoy and turns R-2713 red with ✓ on every machine.

### S-3 · pi's own version is never judged, and one natural reading false-alarms ✗

- The plan's judge reads "newer than pi's own version, by `versionAtLeast`". R-2715 covers a dependency's unreadable version, but not pi's own.
- `versionAtLeast` returns false for any input without three numeric parts (`doctor.mjs:240-252`).
- Measured with `scratchpad/pva-attack/rule.mjs` on fixtures in `scratchpad/pva-attack/fx/`:

| fixture | reading A: newer = not `versionAtLeast(pi, dep)` | reading B: `versionAtLeast(dep, pi)` and not the reverse |
|---|---|---|
| pi `1.5.0-beta.1`, dep `1.5.0-beta.1` | ✗ (false alarm) | ✓ |
| pi `1.5.0`, dep `1.5.0-beta.1` | ✗ (false alarm) | ✓ |
| pi `1.5.0-beta.1`, dep `1.5.0` | ✗ | ✓ (misses a newer dependency) |
| pi `1.4.0+local.3`, dep `1.4.0` | ✗ (false alarm) | ✓ |
| pi with no `version` | ✗ "pi null" | ✓ "pi null" |
| pi `v1.4.0`, dep `1.4.0` | ✓ | ✓ |

- No planned test separates the two readings.
- How likely this is: npm has no pre-release pi today. Its dist-tags are `latest` 1.4.0 and `legacy-node20` 0.74.2, and no published version has a hyphen (measured, `npm view`). The exposure is a pi built from a checkout, or a future pre-release channel. A false ✗ blocks "all good" and fails the install check's `doctor` item.
- Change:
  - R-2715 adds "or the pi package's own version, or a read dependency's version, is not exactly three dot-separated numbers" → `·`.
  - Add fixtures: pi `1.5.0-beta.1` with a matching dependency, and pi with no `version`. Both expect `·`, never ✗.
  - Add pair 28: reading A on the pre-release fixture → R-2715 red.

### S-4 · The probe branches in Seat steps 1 never start CI

- `ci.yml` runs on `push` only for `main`, and otherwise on `pull_request` (`ci.yml:2-5`; measured by reading). `.github/workflows/` holds only `ci.yml`. A pushed `probe/pi-140` with no pull request starts no run. Recent lanes run CI through draft PRs (#180 to #184; `gh pr list`).
- The probe's expected red files hold. I ran the CI-reading test files on 1.0.3 pins in `scratchpad/pva-attack/repo`, with the floor prefix first on PATH (measured):
  - `ci-workflow` failed two checks: R-597's literal and R-1091's seal.
  - `fresh-machine` failed two checks.
  - `pi-install-pin` failed one check, the README scan.
  - `usage` (R-1095), `line-endings`, `doctor-runtime` and `pi-registration` passed.
- Change: step 1 opens a draft PR for each probe branch, which the 2026-10-11 ruling allows. After reading the runs, the seat closes both PRs and deletes the branches.

### S-5 · The precedent misses the production pi resolver

- `apps/desk/pi-session.mjs` `walkUpToPackage` is production code with the row's exact invariant, "the package must be tied to the executable". It takes the realpath of the spawned `pi`, walks up at most six levels, and checks the package `name`. `resolvePiPackage` then ties a shim (Volta, pnpm) to a package by `pi --version`. `apps/bench/lib/pi-exports.mjs:97` walks the same way. Measured by reading.
- The plan names only `findPiRoot`. That is a test helper, and it tries `npm root -g` before PATH, the opposite of the row's order (`packages/nana-pack/tests/pi-install.mjs:29-47`).
- A package may not import from `apps/`, and the desk is frozen, so copying is right. But the brief must name the nearest code (ruling 2026-10-22) and say how the row departs from it:
  - Keep or drop the six-level cap.
  - Say that the desk ties pnpm and Volta shims to a package, so on a pnpm install the desk imports a package that the row reports as `·`. That is a mixed install the row cannot see (inferred from the code; pnpm's `pi` is a 4,325-byte shell shim, measured).
- Change: add `apps/desk/pi-session.mjs` (`walkUpToPackage`, `resolvePiPackage`) and `apps/bench/lib/pi-exports.mjs` to the Precedent, and the pnpm gap to Known limits.

### S-6 · The supported floor has no working install path in any doc nana ships

- The README will say "nana supports pi 1.0.3 through 1.4.0".
- A plain `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.3` gives the mixed install, all six scoped dependencies at 1.4.0 (measured, the planner's `fresh103`).
- The row's ✗ remedy is `PI_INSTALL_HINT`, which is the ceiling command.
- The planned prose, "needs npm's `--before` set before its next release", gives no value. A reader reaches a working 1.0.3 only by reading `ci.yml`.
- An honest support sentence needs one working floor command. R-1093 can be amended the way R-1090 is.
- Change, either of:
  - Amend R-1093 to accept exactly one other pair, `@<PI_FLOOR_VERSION> --before=<PI_FLOOR_BEFORE>`. Put one floor command in the setup README's "Upgrade pi itself" paragraph. R-1093's README scan then pins it to CI.
  - Keep R-1093 as is, but have the prose name `PI_FLOOR_BEFORE`'s value, and extend R-2716's test to pin that value to CI.

  Either way, Open question 3 should say which one landed.

### N-1 · Feature placement (the plan asked)

- R-1078, R-1090, R-1091 and R-1092 live in FEAT-019, "publish accurate release and support information" (REQUIREMENTS.md lines 1668 to 1679). R-2711 and R-2712 belong beside them.
- R-2713 to R-2715 belong in FEAT-015, beside R-952 (the `pi executable` row) and R-1037 (the missing-pi hint). FEAT-015's purpose is "report what is installed, configured or unhealthy with concrete repair guidance".
- R-2716 fits SUB-011, beside R-1093 and R-950.
- The brief names all three features. The seat picks the one on the Feature line. Measured by reading.

### N-2 · Known-limit and threat-model wording

- Bun gives ✓, not `·`. Measured, `scratchpad/pva-attack/bun/`: bun 1.3.13 links `bin/pi` to `install/global/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js`, and the hoisted lookup reads all five packages at 1.4.0. pnpm gives `·` (measured). pi's own installer and Volta give `·` (inferred: a launcher script and a native shim). Correct the threat model and the known limit.
- The ✗ also fires on a patch-level mix that imports cleanly. Measured: 1.0.3 at `--before=2026-10-06T00:00:00Z` resolves its siblings at 1.0.4. `dist/index.js` imports `ok`, and the rule prints ✗ for six packages. The known limit should say "flags a mixed install even when pi's entry imports".

### N-3 · R-2716's pattern captures a trailing full stop

`supports pi (\S+) through (\S+)` on "nana supports pi 1.0.3 through 1.4.0." captures `1.4.0.`, which differs from `1.4.0`. A builder who writes the sentence naturally gets a red test and rewrites the prose to suit the regex. Use `(\d+\.\d+\.\d+)` for both captures.

### N-4 · The seal names values in its title, and no row names them

R-1091's seal title, "…sealed at the seat's install moment", holds no value, and its row text states the value. The planned seal title holds `1.4.0`, `1.0.3` and `2026-10-05T08:40:00Z`, so every retune also rewrites requirement evidence. Neither R-2711 nor R-2712 states the values it seals. Change: drop the values from the title, and state them in the row texts the way R-1091 does.

### N-5 · CI cost: the install-check addition holds, but the dropped floor suite is overstated

- Measured from `jobs.tsv`, the 25 most recent `ci` runs (`gh api`). Medians:
  - install-check job: macOS 61 s, Windows 198 s. On Windows, the pi install step alone takes 122 s.
  - suite job: Windows 1,275 s (21 min), macOS 643 s (11 min).
  - Failures in 22 runs: 0 install-check, 1 Windows suite.
- So the two floor legs add about 4.3 minutes of runner time per run, as the plan says.
- The dropped floor suite would cost about 32 minutes per run, not the roughly 54 the plan cites from R-2061's 10-16 to 10-20 maxima (taken before `NANA_CI_JOBS: "4"`).
- Correct the subtraction line in Design part 3. Wall time is unchanged, because the Windows suite dominates (inferred).

### N-6 · A "·" anywhere in the new row's detail fails all four legs

`install-check.mjs:530` flags any doctor line that contains `·` and names no `DOCTOR_NOTES` label. That includes ✓ and ✗ lines. A detail written in the repo's house style, such as `1.4.0 · 5 packages`, would fail the `doctor` item on every leg. The brief should say: no `·` in any detail of the row.

### N-7 · The floor install line's form is not pinned

`ci/w2-floor-scripts.yml` drops `--ignore-scripts` from the floor install only. It passes `r2711-sketch.mjs` and R-1078 (measured). The README command and the ceiling leg both carry `--ignore-scripts`. Change: R-2711's test asserts the floor line equals the ceiling line, with `PI_VERSION` and `PI_BEFORE` replaced by `PI_FLOOR_VERSION` and `PI_FLOOR_BEFORE`.

### N-8 · The new module's import direction

- If `pi-packages.mjs` imports `versionAtLeast` and `firstOnPath` from `doctor.mjs` while `doctor.mjs` imports it, that is an ESM cycle. It runs, because function declarations hoist, but `scripts/code-map.mjs` has no cycle rule to flag it (measured by grep).
- The stated precedent, "the way it calls `packageSourceState`", is a function inside `doctor.mjs`, not a module.
- Change: inject both helpers, or move them to a small module both files import. Name the departure.

### N-9 · The Windows shell risk is lower than the plan states (inferred from the docs diff)

- 1.0.2's `windows.md` already resolved Git Bash under Program Files before `bash.exe` on PATH. It already ran PowerShell as `pwsh.exe` first, then Windows PowerShell.
- 1.4.0 makes the paths explicit (`%ProgramFiles%\Git\bin\bash.exe`), and adds fixed locations only for a PowerShell that is outside PATH.
- On windows-latest, Git sits under Program Files and pwsh 7 is on PATH, so both versions should pick the same shells. The probe still earns its cost for the Windows suite at 1.4.0, which nobody has run yet.

### N-10 · The desk README edit falls under the standing freeze

The edit is one install line and one tested-on note, and R-1093 forces it. The freeze ruling is the owner's, though. The plan's rules say a blocking question carries a one-word default, so put it to the owner as a YOUR CALL with the default "yes", rather than leaving it as a planner judgement in Class.
