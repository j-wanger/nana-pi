Feature: FEAT-006 · Launch builders with execution limits

# Review brief 1: builder-resume

Review `git diff main...HEAD` on feat/builder-resume (two commits, 163bcbee and 22338f17).

Card (owner 2026-11-09: "go with your recommendations on the prior choices"; finishing the builder-stop checks), closing the builder-checks review's three SHOULDs:
1. Before `check:lane`, pi-worker treats a non-empty `git status --porcelain` as a failure named `uncommitted`, listing the paths.
2. On `fail` or `uncommitted` (never `red-on-base` or `error`), pi-worker resumes the same pi session once through the attempt's session file with standard input closed, then re-runs the checks. A second failure ends the build. The record keeps both results. Build 2 added: the resume prompt forbids editing a check, test, checker script or their configuration to pass; pi-worker prints and records the files the resume commits changed.
3. A stop signal during the check phase stops the check tree, removes the base checkout and ends the build as stopped.
4. The fake builder commits, so a check run at the wrong commit fails a test.
Rows R-3997 (updated), R-4003 to R-4006.

Seat's evidence:
- Probe, pi 1.4.0: `pi -p --session <file>` continues a finished print-mode session; `pi -p` waits on an open standard input.
- Live run 1 (build 1 code, throwaway lane): a real builder was told to change one `tmpDir` import to single quotes. pi-worker printed `fail: test-runner`, `resume: test-runner`, then `pass`; the resumed builder had loosened the check instead of its import. That finding became build 2.
- Live run 2 (build 2 code, same brief): `fail: test-runner`, `resume: test-runner`, `resume changed files: []`, `fail: test-runner`, build failed. The resumed builder answered BLOCKED: the check rejects the import and fixing it would need a test edit, which the prompt forbids.
- Seat re-ran on 22338f17: lane-checks, worker-lane, build-records and watchdog-exit tests pass alone; `check:lane` passed at both builders' stops.

Questions:
- Can the resume run when it should not (red-on-base, error, a Claude Code builder, a stop signal) or twice?
- Can a stop signal during the check or the resume leave a running process, a base worktree entry or an unrecorded build?
- Does the `uncommitted` check misfire on files the lane is meant to leave untracked (ignored files, the generated map and outline)?
- Is the changed-files list right when the resume makes no commit, several commits, or an amend?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
