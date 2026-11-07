## Review: load-log (`2c0a3e4a..0089c56d`)

The seat gets what it asked for: pi builder and pi reviewer launches now log pi's own context files in order, plus `piVersion` and `slot`, and delivery to the child is unchanged. One existing feature breaks, though. Every real pi-review load would now drop out of the outcome meter's context report, so this goes back.

### MUST

**1. The outcome meter now treats every real pi-review load as a test load.**
- **Where:** `packages/nana-pack/bin/pi-review.mjs:245` now logs `cwd: tempRootReal`. That is the checkout `mkdtempSync(join(tmpdir(), 'nana-review-…'))` creates, so it is always inside the OS temp folder.
- **Why it breaks:** the meter (`npm run memory:meter`, R-3315, `packages/nana-pack/lib/outcome-meter.mjs:127-133`) puts any load line whose `cwd` is under the real OS temp folder into "test loads" and leaves it out of the context statistics. The pack README says the same: "OS-temp loads are test loads".
- **Evidence:** I applied the meter's exact temp rule to pi-review lines written by this branch. Every one came back as a test load (for example `/private/var/folders/…/T/nana-review-44640-EN4XFm`). A main-shaped line, whose `cwd` is the reviewed tree, is counted.
- **Input and consequence:** any real `pi-review` run. On main, the meter reports a "reviewer pi-review" group. After this land that group goes silent and the "test loads" count grows, with no warning. R-3315's test still passes because it uses synthetic lines, so nothing catches this.
- **Scope:** the plan (A2b) meant to change the logged cwd, not to remove pi-review from the meter.
- **Fix options:**
  - Keep `cwd` as the reviewed source root and record the checkout in a new field, rewording R-3729 to match.
  - Or change the meter's test-load rule, which changes R-3315's contract.
  - Either way, add a test that a real-shaped pi-review line is counted by the meter.

### SHOULD (known-bug lines)
- The meter's part list (`outcome-meter-config.mjs` `WORDS.parts`) doesn't include `context file` or the two status names. They show as `other-N`, and each different unavailable reason gets its own alias.
- From this land on, each pi-worker and pi-review load total includes the context files, about 20k characters for nana-pi's AGENTS.md. A meter window that spans the land compares totals measured two different ways, and the README doesn't say so.

### NOTE
- Importing pi's entry costs about 0.4 s per launch and holds about 100 MB of extra memory for the whole run (pi 1.4.0, macOS). I found no writes, no environment changes, no output and no open handles.
- The import loads signal-exit v3 (through proper-lockfile), which adds signal listeners and patches `process.emit`/`reallyExit`. I checked it does nothing visible:
  - SIGINT or SIGTERM during the child: pi-worker and pi-review still exit 130 or 143, release the reservation and clean up.
  - SIGTERM during the import window: exit 143 and no child starts, the same as main's launchers run side by side.
- For an unreadable context file, pi's own loader prints `Warning: Could not read …` on the launcher's stderr.
- A future pi entry that starts unawaited async work at import could crash the launcher with an unhandled rejection. 1.4.0 leaves nothing pending.

### Checked and fine
- **Child args and env match main exactly.** I diffed the recorded child argv, env and cwd for a pi-worker lane launch and a pi-review launch, with the real pi entry imported, against main's launchers. They match apart from the fixture commit hash. A parent `NANA_HANDOFF=on` still reaches the reviewer child as `off`.
- **Measured agent dir and cwd are the child's.** pi-worker measures with the same `{...process.env, NANA_HANDOFF, ...childEnv}` it spawns with. pi-review measures the real path of its checkout. `piAgentDir` matches pi's `getAgentDir` (HOME/USERPROFILE, relative dir against the child cwd).
- **No meaningful launch delay or block.** Missing pi, a missing export, a failed import and a throwing loader all become one unavailable part; `piContextLoad` cannot throw.
- **The locator move keeps piLaunch's behaviour.** The win32 shim-layout logic and refusal texts are unchanged; the injected win32 tests pass.
- **R-3726 to R-3732 match their tests.** Mutation logs are present. R-3727 ran against real pi 1.4.0 without a skip.
- **Tests:** context-anatomy, worker-claude, win32-launch, the agent-dir tests, seat-rule and watchdog-exit all pass (10 files, 331 checks, 0 failures). The code-map, readme, requirements-trace and requirements-tree checks are clean.
- **CI on `0089c56d`:** still running. All four install-check legs passed; the suite legs had not finished.

I worked read-only in the repo. My scratch scripts are in `/tmp/lr-probe` and the fixtures are in the OS temp folder.

VERDICT: SEND-BACK
