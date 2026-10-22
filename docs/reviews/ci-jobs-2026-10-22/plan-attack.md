# ci-jobs · plan attack (adversary, 2026-10-22; the seat took M1, M2, S1 to S5 and S7, and recorded S6 as D5)

Evidence: probe run 39761155058 and baseline 39749520397, plus per-file times parsed from the suite logs of eight more CI runs on 10-22 (39698024336 to 39755437952). The parsed tables stayed in the adversary's scratch folder.

## M — must change the plan

- **M1 · 600 s was set from the file's time alone, not its time under load.** Windows review-ledger takes 221 to 299 s alone across nine runs. The max, 298.9 s in run 39731735341, is 99.6% of 300, so main is already at the edge; the plan's 283 s is one sample. In the probe at four jobs, 104 of 165 checks had finished at 300 s. The baseline reached check 104 at 218 s (frac.mjs), so load slowed it by about 1.38×. That projects about 390 s at four (412 s from the slowest run alone). The heavier slowdowns in the same probe (requirements-lift ×1.90, macOS review-ledger ×1.84, templates-update ×1.63) push it to about 570 s, 95% of 600. Seal a value set from loaded time instead, e.g. 900 s (about 2× 412). A hung file then still ends by about minute 31 of the 90-minute job: about 4 min setup, about 12 min suite, then 15 min. Or run the lane's first CI with a high limit and seal at least 2× the loaded time it measures. Rewrite the `chosen` comment either way.
- **M2 · R-2556's test must read only the arguments after npm's `--`.** `npm test --jobs=4`, with no `--`, makes npm take the flag as its own config. `scripts/test.mjs` never sees it (package.json:9, scripts/test.mjs:74) and runs one file at a time. A check that only finds `--jobs=4` on the run line still passes. Make the row say "passes `--jobs=4` to the runner after npm's `--`", and add this as a wrong-code pair.

## S — should change

- **S1 · Give macOS the per-file limit too; simplest is the job's `env`.** macOS blocks release (R-1530, ci-workflow.test.mjs:140-152). In the probe, review-ledger took 184.4 s on macOS at four, 61% of 300, against 91 to 113 s alone over nine runs. FEAT-031.md:49 already records review-ledger, templates-render and templates-update timing out first at 300 s under load. One job-level key placed after `NANA_TEST_REQUIRE_COPIER`, so R-996's regex at ci-workflow.test.mjs:90 still holds, replaces the step `env` and the "Windows only" clause. The only cost is 5 more minutes when a file hangs on macOS or Linux.
- **S2 · The plan writes the value 4 as a literal twice.** The standards say a tunable is defined once and read by name, but both step lines carry `--jobs=4`. Define one job-level env key and use `--jobs=${KEY}` in both steps, so R-2556 seals one line the way R-2061 does. The key must not start with `NANA_TEST_`, because R-618 passes those into every test file (scripts/test.mjs:327). Not reusing `SUITE_JOBS` is right: its provenance is the 10-core seat Mac (test-runner-config.mjs:32-35).
- **S3 · R-2557's "only Windows" check must scan the whole file.** It needs to cover the workflow-level `env` (ci.yml:10, which reaches every job and leg), the job `env`, each step's `env`, and any inline `NANA_TEST_TIMEOUT_MS=` in a run line. The plan names only "no other step and not the job's env". This is moot if S1 is taken.
- **S4 · Sentences that become false.** docs/known-bugs/FEAT-031.md:11 says "CI runs one file at a time, so Linux and Windows have run only the pool's own checks". docs/known-bugs/FEAT-019.md:10 says "CI runs its tests one file at a time", and its 60-minute watch rests on the serial leg. ci.yml:53 says "About 2.6 times the slowest leg"; that becomes about 5.6× a 16-minute leg. It is a dated measurement, so keep it but note the change. HANDOFF.md:19, the queue line, comes out in the reviewed change. README:279 and 284 ("one file at a time", "`--verbose` streams output") describe `npm test`'s default, so they stay true, and so do the AGENTS and README Support lines.
- **S5 · Say what counts as evidence.** HANDOFF.md:26 counts first-try Windows failures over 20 runs, about 4 of 20 before the fix. Changing the leg's job count partway through confuses that count, so restart it at this land or record the job count beside each run. Also define "three green": three of three on the first try, or how a re-run after a known flaky failure counts.
- **S6 · Require a green macOS leg at the final tip, and handle the copier first-download failure.** Main's macOS leg at 09e38e7d failed today (run 39755298929). template-acceptance's 15-second `uvx copier --version` probe (template-acceptance.test.mjs:105-107) ran out while copier was still downloading. At four jobs, template-acceptance, template-release, templates-render and templates-update sit next to each other in collection order. So they start together while the uv cache is still empty. Add a step that warms the cache before `npm test`, or record it as a known bug and count it. No known-bug file holds it today.
- **S7 · Wrong-code pairs to add to the plan's four:**
  - `npm test --jobs=4` with no `--` (M2).
  - `measured` only above the Windows step, or missing.
  - The limit in the workflow-level `env`.
  - The limit inline in the non-Windows run line.
  - The limit on the non-Windows step instead of the Windows one.
  - `chosen` missing.
  - The Windows step dropping `--verbose`; R-1313's new regex must still pin it.
  - A third `npm test` step without `--jobs`.

## N — notes

- **N1 · The higher limit changes no test's verdict.** R-618 passes it into every test file. But the runner tests that start a nested runner stop it themselves after 120 s (test-runner.test.mjs:71-86, test-runner-parallel.test.mjs:70-73). The checks that test the time limit set their own values (test-runner.test.mjs:204, 327; test-runner-parallel.test.mjs:466). The hang self-test uses its own 3 s limit (scripts/test.mjs:230, 459).
- **N2 · Nothing else reads the suite step text.** The release job runs only template-release, and install-check runs only the install check. pi-pin.mjs:16-20 and usage.test.mjs:302-303 read only the top-level `PI_VERSION` and `PI_BEFORE` lines. line-endings.test.mjs:35 requires ci.yml to keep LF line endings.
- **N3 · Files not on the run-alone list that slow down under load.** Watch them in the three runs; all passed the single probe.
  - recover.test.mjs: 5.1 to 25.4 s on Windows (×5.0), 20.7 s max alone, 20-second rebuild deadline at recover.test.mjs:34.
  - post-edit kill checks: 2.5-second start; FEAT-030.md:8 already says the pool does not run that file alone.
  - mutation-runner: its contention check (FEAT-031.md:35) and the 15-second bound at mutation-runner.test.mjs:872.
  - agent-dir-hostile: 10-second handler bound at line 147; ×2.5 on Linux.
- **N4 · hook.test.mjs is already close and stays unchanged.** Its 1800 ms deadline reads 1610 to 1648 ms on Windows (89-92%). It is on the run-alone list, so it runs alone at both job counts.
- **N5 · A runner crash loses more output at four jobs.** The `rmSync` at scripts/test.mjs:532-533 has no guard (FEAT-031.md:58: an EBUSY killed a run after 154 of 200 files). A crash at four also drops the held verbose output of up to three running files. Serial verbose had already printed that output as it ran.
- **N6 · "Measured" covers only 4 against 1.** The probe never tried 3, which matches macOS arm64's 3 vCPU (Linux and Windows public runners have 4), or 6. "Chosen; measured clean at 4" would be more accurate.
- **N7 · Row bookkeeping.** FEAT-019 grows from 25 to 27 rows, so docs/requirements-tree.md must be regenerated (R-291). suite-records (R-2546 to R-2555) and report-deliverables (R-2542 to R-2545) are building, and neither clashes with R-2556 or R-2557. R-2557 should say where its comment sits: directly above the `NANA_TEST_TIMEOUT_MS` line, as R-2061 does.
