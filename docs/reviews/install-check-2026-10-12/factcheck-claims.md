**Verdict: SEND BACK.** The CI wiring itself holds: a non-blocking Windows leg plus `needs: [suite, install-check]` behaves as claimed. Five problems remain. Nothing enforces the flip. Green is overclaimed as "every hook works" and as the 10-24 "done". The adoption check cannot fail. The settings check would pass entries that Claude Code would not run. Doctor's exit status passes rows it skipped.

**HIGH**

1. **The flip depends on memory, and a green run hides the red Windows leg.**
   - Run 38262900510 (`gh run view`): the run concluded `success` while `suite (windows-latest)` concluded `failure`. The install-check Windows leg will report the same way.
   - So "green on both", the 10-24 done in `HANDOFF.md:59`, passes today if anyone reads the run conclusion.
   - Nothing records the count of passes, and nothing fails when R-1079 outlives its condition.
   - Fix, preferred: drop `continue-on-error`. Keep a sealed known-red list in `install-check-config.mjs`: objective, adoption, shared memory, verifier on win32. Listed items print XFAIL. A listed item that passes prints FAIL, saying "remove it from the list". The leg blocks new regressions from day one, and cc-hooks-windows' own Windows run forces the list to shrink. R-1079 and the separate flip change are no longer needed.
   - Fix, minimum: give R-1079's test a date tripwire (fails after 2026-10-24 unless the row is retired), plus a HANDOFF Next line. Name the counting query as the job conclusion from `gh api .../runs/<id>/jobs`, never the run conclusion.

2. **The plan claims "every hook works" and "done", but neither seat actually runs.**
   - Outcome 3 says each entry "runs the way Claude Code documents running it". That is the check's own model of the docs, and the model already differs from them (items 4 and 8).
   - On the pi seat, no hook runs: not the gate, objective, knowledge pull, post-edit, handoff or lifecycle hooks. `pi list` "shows configured packages" (pi `docs/packages.md:17`), not loaded ones.
   - The 10-24 goal says both seats and every hook. The plan inherits "green on both is done" without challenging it.
   - Fix: reword outcome 3 as "passes a simulation of the documented dispatch". State in section 1 that CI green is necessary, not sufficient. Done also needs:
     - Jake's machine check from cc CHANGE:541-557;
     - Jake's run of install-check on Windows, made required rather than optional, because it is the only test of the plan's own most-likely-wrong claim;
     - the pi load row from item 6.

3. **The adoption check is silent by design, so its PASS proves only that the hook exits 0.**
   - The temporary home sits under `os.tmpdir()`, and CI makes sure of that with `TEMP=runner.temp`.
   - The adoption reader treats any root under the temp folder as adopted (`lib/adoption.mjs:42`, `:124`, `:136`).
   - `nana-handoff` also skips temp folders when it writes the `directory_unadopted` journal line (`nana-handoff.ts:55`).
   - So no setup with this layout can make the hook print. "Prints its expected output" is false for one of the five hooks.
   - Fix: promote probe (f) to a row. Start one real `pi --mode rpc --no-session` session in `<home>/project`, with the declared `NANA_TEST_TEMP_ROOTS=""` seam on every spawn, or with the home outside `os.tmpdir()`.
   - Then expect two things: the lifecycle `session_start` journal line, which proves nana-pack loaded, and an adoption block naming the project.
   - If pi cannot start without a model (INFERRED either way), relabel the adoption line "starts" and do not count it as output.

4. **The hook-set check would pass entries that Claude Code would not run.** The current hooks docs (https://code.claude.com/docs/en/hooks, read 2026-10-12) show five holes:
   - `type: "command"` is required, and the plan does not check it.
   - `async`, `asyncRewake`, `shell` and `onFailure` change behaviour, and the plan does not reject them.
   - `args` must be an array of strings.
   - SessionStart rows list no tools, so the matcher rule passes any matcher. A `resume` or `compact` matcher passes R-1074 but never fires on startup.
   - The plan's matcher rule ("`|`-separated exact names") is not the documented rule. The documented rule has three paths:
     - `*`, an empty string or no matcher matches everything;
     - a matcher of letters, digits, `_`, `-`, spaces, `,` and `|` is a list of exact names split on `|` or `,`, with whitespace trimmed;
     - anything else is an unanchored JavaScript regex.

     The plan's rule gives a false FAIL on valid matchers.

   Fix:
   - Validate the documented nesting: `hooks.<Event>[]` holds `{matcher?, hooks:[...]}`.
   - Validate each entry against a sealed set of allowed keys.
   - Implement the three-path matcher rule.
   - Give SessionStart rows the source `startup`, matched against the sample's `source`. Mark UserPromptSubmit as having no matcher.
   - Add pure cases for `*`, `""`, an omitted matcher, `Bash, PowerShell`, `^Bash$`, a `resume` matcher, a missing `type` and `async: true`.

5. **Doctor's exit status passes rows it skipped.**
   - Doctor exits 0 with `·` rows (`bin/nana-setup.mjs:335`).
   - On win32 it emits about 15 rows that say "skipped": `doctor.mjs:296`, `:335`, `:360`, `:382`, `:585-588`, `:619`.
   - The rows that depend on a real home turn into `·` when `isRealHome` is false (`:329`, `:602`, `:610`).
   - So the Windows "doctor PASS" in the red-first run measures almost nothing. If cc-hooks-windows leaves one row skipped, nothing turns red.
   - Fix: keep the exit status and also parse the marks. Use a sealed list, per platform, of the rows that may show `·`:
     - macOS: desk service, release status, and any other row confirmed on the first green run;
     - win32: today's skipped set, using the same known-red mechanism as item 1.

     Any other `·` row is a FAIL. Mutation 11 becomes "the exit status alone passes a doctor whose pi rows are notes".

**MEDIUM**

6. **A `pi list` match does not prove the packages load.** pi lists an object entry as `(filtered)` (`dist/core/package-manager.js:768`), and such an entry may load no extensions. Fix: FAIL on `(filtered)`. Use the row from item 3 to assert that `get_commands` lists `reload-runtime` and nana-pack's skills.

7. **The verifier check skips a required field.** The docs say `hookSpecificOutput` "requires a `hookEventName` field". The check reads only `permissionDecision`. Fix: assert `hookEventName === "PreToolUse"`, and add a matching mutation pair.

8. **Three more points where the simulation differs from the documented dispatch.**
   - "All matching hooks run in parallel." The plan's sequence runs them one at a time, so contention and races go unseen. Fix: spawn the three SessionStart entries at the same time.
   - Plain stdout is capped at 10,000 characters. Above that, Claude Code shows a file path and a 2,000-character preview. Fix: assert stdout is at most 10,000 characters for SessionStart and UserPromptSubmit.
   - A missing `timeout` gives `entry.timeout × 1000 = NaN`. Fix: use the documented default (600 s, or 30 s on UserPromptSubmit), or FAIL when the field is absent. Add a pure case.

9. **The shared-memory sample avoids the code path Claude Code actually takes.**
   - A real `transcript_path` sits under `~/.claude/projects/<key>/`.
   - The plan moves it outside on purpose, which forces the `CLAUDE_PROJECT_DIR` fallback (`nana-shared-memory.mjs:45-55`).
   - The hook uses the transcript folder as given, so no project key needs computing.
   - Fix: set `transcript_path` to `<home>/.claude/projects/install-check/<uuid>.jsonl`. Assert that the link exists at exactly that key and resolves to `<home>/.claude/nana-memory/shared`.

10. **The CI pins have holes.**
    - The mutation list never makes macOS non-blocking with `continue-on-error: true`.
    - It never adds a `continue-on-error` at step level.
    - It never adds `|| true` to the run line.
    - The job has no `timeout-minutes`. A hung `pi install npm:` would hold the release for up to the 6-hour GitHub default.
    - Fix: pin the exact job-level expression. Assert that the slice holds exactly one `continue-on-error:` line and the exact `run: node packages/nana-setup/bin/install-check.mjs` line. Add `timeout-minutes: 20`.

11. **"Blocking" acts only on the release, and only after land.**
    - Main has no protection (`gh api`: `protected: false`), and `nana-land` reads no CI result.
    - So a macOS regression from another lane lands first. Only the release is held afterwards.
    - Fix: state this in outcome 5. Add a local macOS install-check run to the land checklist for lanes that touch nana-setup or the hooks, or record it as a carried item.

**LOW**

12. **The home override may not reach every process.**
    - R-1071 sets HOME and USERPROFILE for install only. R-1075 says nothing about the environment of hook, pi and doctor spawns.
    - Acceptance (b) leaves out `~/.claude/projects`, `~/.claude/nana-memory`, `~/.pi/agent/nana-objective.md`, `~/.pi/agent/nana-pack.json` and the journal. A hook that leaked the real HOME would write `~/.claude/projects/<key>/memory/shared` without being caught.
    - Fix: build one environment for every spawn and pin it with one test. Extend (b) with those paths, and with "no `~/.claude/projects` entry names the temporary home".

13. **"Writes nothing outside that home" is unproven on Windows.**
    - APPDATA and LOCALAPPDATA are not redirected, and npm's cache lives under LOCALAPPDATA.
    - (b) runs on macOS only, yet the plan cites it to reassure Jake before his Windows run.
    - Fix: narrow the claim, or redirect `npm_config_cache` and LOCALAPPDATA on win32.

14. **No documented procedure for the Windows leg.** The checklist the plan follows is "Fresh machine (macOS), in order" in the root `README.md:118` (step 1 is `xcode-select`, step 5 is `.zprofile`). The Windows leg follows a procedure no README states, and it runs in Git Bash rather than Jake's terminal. Fix: write the Windows steps the check follows into the README, or declare the gap.

15. **Three README lines go stale.** Root `README.md:25`, `:177` and `:210` say the release runs after the blocking macOS suite leg. The new `needs` line makes that incomplete, and the README is a contract. Fix: add those three lines to the scope.

16. **Stale details in the plan.**
    - The red-first Windows expectation leaves out the hook-set FAIL line, which will also be red.
    - cc-hooks-windows' tip is now 2818e03, past plan stage with build brief 1 written. The plan still says 71757f4, plan stage.

**What holds**
- A failed `continue-on-error` matrix leg does not block `needs`. Runs 38262900510 and 38203236675 show release `success` after a failed suite leg.
- The `pi list` output format matches `dist/package-manager-cli.js:842-871`.
- `isRealHome` follows `os.homedir()` (`lib/paths.mjs:84`).
- The exec form and shell form rule matches the current docs.
- `desiredHooks` sets `timeout: 5` on all five entries today (`lib/settings.mjs:123-178`).

**Claim most likely wrong in this review:** that `pi --mode rpc --no-session` fires `session_start` without a model. Items 3 and 6 depend on it, and probe (f) settles it.