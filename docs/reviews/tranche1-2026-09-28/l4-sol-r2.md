## Findings

### LOW — Whole-file SKIP is reported as PASS
`scripts/test.mjs:273-284`; `apps/bench/test/study-tasks.test.mjs:20-22`

The runner counts child `SKIP` lines but derives file status solely from exit code. Consequently, `study-tasks.test.mjs` prints one SKIP, exits 0, and is reported as `PASS … 0 pass, 1 skip`; the file-level summary understates skipped files. This is reporting-only and does not affect the exit verdict.

### LOW — The argv dependency guard suppresses three hermetic assertions
`apps/bench/test/argv.test.mjs:69-80`; `apps/bench/lib/profiles.mjs:79-88`

Only `c.blocked === null` requires the extension to exist. The three checks at `argv.test.mjs:77-79`—extension count, sidecar ordering, and tool allowlist—inspect argv that `renderRun` constructs regardless of filesystem presence. They should remain outside the guard. All assertions still run when the package is installed, so this is lost fresh-clone coverage, not an installed-package hole.

## Round-1 findings

1. **Interrupt/process-tree/scratch cleanup — FIXED.** POSIX group kill and Windows `taskkill /T /F` are at `scripts/test.mjs:57-62`; synchronous cleanup and the exit guard are at `scripts/test.mjs:73-89`; normal/error execution is protected by `finally` at `scripts/test.mjs:255-299`.
2. **Bounded timeout/drain — FIXED.** Timeout kill, bounded no-exit grace, exit-based verdict, and two-second pipe drain are at `scripts/test.mjs:200-223`. The detached pipe-holder fixture is at `scripts/test.mjs:147-160`.
3. **Windows skip predicate — FIXED.** `pgrep` absence skips only on POSIX at `scripts/test.mjs:126-131`.
4. **Exit-code verdict plus WARN — FIXED.** File success comes from exit code/timeout at `scripts/test.mjs:279-284`; an exit-0 `FAIL` line produces a warning at `scripts/test.mjs:285,303-305`.
5. **Bench discovery — FIXED.** Discovery reads direct files only and includes `apps/bench/test` at `scripts/test.mjs:94-117`; fixture/study paths cannot be recursively collected.

## Bench guards

- `study-tasks.test.mjs:20-22` is an acceptable declared prerequisite for the complete study pre-flight: the test validates the external extension and lockfile pins at `study-tasks.test.mjs:248-255`. It is coarse because independent sections are skipped too, but it weakens nothing when the package is installed.
- The argv guard is valid for the on-disk `blocked` assertion, but its three structural checks are scoped too broadly, as noted above.

No new blocking runner defect was found.

## Residuals

- Generic descendants that escape the child process group can survive; execution is bounded, but only the self-test’s known holder is explicitly reaped (`scripts/test.mjs:65-81`).
- Windows `taskkill` and the Windows `post-edit-hardening` path remain untested on an actual Windows host.
- Fresh isolated homes still omit the previously identified live-machine coverage in `ledger-parse`, `project-key`, and `pi-registration`.
- Narrow the argv guard and report an all-SKIP child as file-level SKIP.
- Consider later splitting the external-pin portion of `study-tasks` so its independent checks still run without `.ext`.

VERDICT: LAND
