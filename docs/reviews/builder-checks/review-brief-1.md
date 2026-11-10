Feature: FEAT-006 · Launch builders with execution limits

# Review brief 1: builder-checks

Review `git diff main...HEAD` on feat/builder-checks (four commits, 78986ff1 to 9cce2a45).

Card (owner 2026-11-09: "go with your recommendations on the prior choices"; no full Windows suite on lane tips, replay the lost rounds and add fast checks when a builder stops first):
1. A root `check:lane` script runs, in order and stopping at the first failure, the requirements trace, the tree check, the map check, the README check, and seven test files that read the repository as data. Each entry names the lost round it answers.
2. After a lane build exits 0, pi-worker runs `check:lane` in the worktree with a bounded timeout. A pass prints one line. A failure is compared with the build's base commit in a temporary detached checkout; a failure already present there is reported as `red-on-base`. The result goes to stderr, the build record and the report, and a failure makes the build exit non-zero. A worktree without the script is unchanged. Rows R-3996 to R-3998.
3. Not built: resuming the builder once on a failure. The card allowed shipping the run-and-report half when resume needs more than pi already supports; the builder did not probe it.

Builder's validation: the new script run on six recorded lost-round tips fails on the expected check each time (test-packs, requirements-tree --check, requirements-cap-kinds, code-map-launch, readme-check, test-runner); two first-try lanes (97b6dd02, 2daaed41) and main pass. 41 related test files pass alone. Seat re-ran on 9cce2a45: the trace, `check:lane` (pass, about 54 s), lane-checks, worker-lane, build-records and one-reviewer tests all pass; the seat replayed 9b04f14a and saw `check:lane: fail: test-runner`.

Questions:
- Can the post-build check fail a good build or pass a bad one: timeout, a crashed check, a missing npm, a check that is red on the base, an unreadable `package.json`? Is the exit code and build record right in each case?
- Can the temporary base checkout leak a worktree, run at the wrong commit, or touch the lane's own tree?
- Is behaviour unchanged for worktrees without `check:lane`, for `--slot` runs and for plain worker runs?
- Does any README or row claim the resume that was not built?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
