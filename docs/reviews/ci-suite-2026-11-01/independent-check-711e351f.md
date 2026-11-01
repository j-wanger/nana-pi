FAIL: one MUST. A lane that renames `scripts/test.mjs` lands on CI's record and skips the local suite, which breaks R-3432. Every other probe behaved as the plan says.

I tested worktree tip 711e351f. All runs used HOME and TMPDIR set to a scratch folder, made-up git repos built with the lane's fixtures, and fake `gh` answers: injected into `runLand`, plus one real `gh` script first on PATH. The lane's own test file passes 6 of 6 here.

**(a) Filtered record** (`exercise`-style `runLand`, injected platform darwin):
- `filters: ["land"]`, `[""]` and a string value: the local suite ran once, reason "does not prove an unfiltered run".
- One darwin leg unfiltered plus a second darwin leg filtered: the local suite ran.

**(b) Another platform:**
- Only win32 and linux records, or a record with no platform: the local suite ran, reason "no CI suite record for platform darwin".
- A red linux record next to a good darwin one: CI accepted, which is correct because linux is non-blocking.

**(c) Attempts and superseded runs:**
- Attempt 1 passed and attempt 2 failed or was filtered: the local suite ran.
- Attempt 2 re-ran darwin but uploaded no record: the local suite ran ("records could not be read").
- A passing record only from a superseded run: the local suite ran.
- A failing superseded run with a passing newest run: CI accepted, which is correct.
- Newest run cancelled, failed or in progress: refused before any suite. This held even when an older run had a passing record.

**(d) gh failures:**
- The run list failed once, then succeeded: the retry worked and CI was accepted.
- It failed twice: refused, "gh CI read failed (exit 1)".
- It timed out: refused, with no retry.
- Each of these failures inside the record read made the local suite run: a second run-list failure, artifact list failure, jobs list failure, one leg's download failing, a download killed by a timeout signal, truncated JSON, an empty folder, a gh call that throws, a garbage artifact list, an expired artifact, and the records budget running out.
- A record file with CRLF line endings: CI accepted, which is correct.

**(e) Fallback paths** (real `git diff` between captured main and the tip, no injected diff):
- These made the local suite run: editing, deleting or chmod-ing `scripts/test.mjs`; adding a workflow file; moving `ci.yml` out of the workflows folder.
- Editing `scripts/other.mjs`: CI accepted, as designed.
- Renaming `scripts/test.mjs` to `scripts/runner.mjs`, with or without an edit: **CI accepted and the local suite was skipped.**
- Editing the `package.json` test script: CI accepted.

**(f) Old records:**
- No `filters` field, or `filters: null`: the local suite ran.
- `exitCode: "0"` as a string: the local suite ran.

**Local fallback still protects:**
- A red suite after a filtered record: exit 1, "suite failed", main not moved.
- A red suite with no CI scope: exit 1.
- From the real command line with `gh` first on PATH: a CI land ran no suite. A fallback land ran the suite command. A red suite returned exit 1 and main stayed put.
- End records: a CI land writes `suite: ci`, no reason and no suite time. A local land writes `suite: local`, its reason and the suite time.

**Leaks:** the command-line output showed no home or temp paths. The only new line is the `suite:` line, built from fixed text. The `suite: local` reason is also stored in the land record. Its text is either fixed or comes from the "CI not read" note, which the output already printed before this lane.

**MUST**
- Renaming the runner gets past the fallback-path check. `git diff --name-only` detects renames by default, so it prints only the new name and never names `scripts/test.mjs`. The branch then lands on CI's record, though the change touches the test runner. The rename is an ordinary change, so it is inside the threat model. The fix is one flag: add `--no-renames` to the `diff` call in `packages/nana-pack/bin/nana-land.mjs`, around line 177. A matching test needs a real repo with a real rename, not an injected diff. The plan already accepts the runner config files staying off the list, so you could treat this as a residual too. I counted it as a MUST because the changed-path requirement's own text says that a diff naming `scripts/test.mjs` must fall back.

**NOTEs (possible known bugs)**
- A `package.json` change that points `npm test` at another file is not on the fallback list. This is like the plan's A9 residual but is not named there.
- A record whose files are all SKIP, with exit 0, is accepted. The check requires at least one final file, not at least one PASS.
- An attempt-1 darwin record is accepted when attempt 2 re-ran darwin, left no record, and the jobs list has no `started_at`. This is the existing "latest attempt wins" behaviour in the record reader. GitHub always sends `started_at` for finished jobs, so it is minor.
- Any reader problem on any leg, linux included, sends the land to the local suite. That is safe, but a missing linux upload costs the full local run.
- The records are read twice, once for the proof and once to keep them after the merge (plan choice O1). That only costs time.

I deleted the scratch folder and confirmed it is gone. The worktree is clean at 711e351f, and I edited, committed and pushed nothing.

The writing check was not run on this report. It is an independent check for the seat, not a report to the owner.
