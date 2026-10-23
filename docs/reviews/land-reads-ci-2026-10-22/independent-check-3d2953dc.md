# Independent check — land-reads-ci at 3d2953dc (2026-10-22)

One independent check for this gate lane: a fresh Claude Code agent, read-only on both checkouts, probe repositories in fresh temp folders with a temp HOME, GitHub calls read-only GETs only. Its question: does the feature work for a seat landing a reviewed lane, and does the change cause a material harm.

1. **Real GitHub, read-only**, with the lane's `ghDefault`, `githubRepoOf` and `judgeRuns` and nana-land's exact arguments:
   - 61ac64f3: ok, `ci: ci run 39840123612 attempt 2 (push) success`; two runs listed; 0.63 s.
   - The same SHA with GH_HOST=example.invalid and GH_REPO=other/repo set: the same result.
   - A made-up full SHA and 3d2953dc: 0 runs each, refused with "no CI run for <tip8> on origin; push the tip to its open pull request, then wait for CI".
   - The full CLI in a temp clone with a github.com origin, a temp HOME and real gh: tip 61ac64f3 landed (exit 0, one `ci:` line); tip 5fe4dc05 was refused with "no CI run" and main was unchanged.
2. **Fixture lands with an injected gh: 16 of 16 behaved as designed** — two green workflows; a red second workflow with the lower run number; two workflows sharing a name; attempt 2 success; attempt 2 in progress with attempt 1's stale success; out-of-order lists; a workflow deleted on the tip (note, lands) and one of two deleted (CI read); GH_HOST and GH_REPO preset with scp and ssh origins (arguments still `--hostname github.com repos/example/fixture/...` with the full SHA, run from main); an empty list (refused); a bare local origin, no origin, an origin with a trailing slash (note, lands).
3. **`land.test.mjs`:** 66 pass, 0 fail (124 s); with TMPDIR, TEMP and TMP 132 characters longer, 66 pass, 0 fail (96 s).
4. **Real gh failures and refusal texts:** signed out (exit 4, names `gh auth login`); proxy refused (exit 1, names the proxyconnect error); bad token ("gh: Bad credentials (HTTP 401)"); gh not on PATH ("cannot start gh from PATH"); a fake gh with a 200 ms limit (ETIMEDOUT after 204 ms). Remedies a seat can act on: wait, `gh run rerun <id>`, `--failed` or a fix, push to the PR, `gh auth login`, the network error, the PATH error. Weak remedies: the catch-all "fix the workflow result, then run it again", and "CI response is not a workflow-run list", which names none.

MATERIAL: if the seat's shell sets `CLICOLOR_FORCE=1` or `GH_FORCE_TTY=1`, gh prints ANSI-coloured JSON, and every land is refused with "CI response is not a workflow-run list". Reproduced through the CLI with real gh; `NO_COLOR=1` does not cancel it. Fix: pass `CLICOLOR_FORCE=0` and drop `GH_FORCE_TTY` in gh's environment, or strip ANSI before parsing. This machine's shell sets neither, so today's lands are not hit.

NOTE: a workflow whose jobs are all skipped by `if:` ends `completed/skipped`; such a repository would refuse every land, and a re-run does not help. None on this machine has one; the known limits do not name it.
NOTE: "fix the workflow result" fits `action_required` badly; that case needs the run approved.
NOTE: the branch was not yet on GitHub, so the Windows leg had not run the real-spawn case.
NOTE: the `gh run rerun <id>` remedy relies on gh guessing the repository; with GH_REPO set elsewhere it targets the wrong one. Adding `--repo <owner>/<repo>` fixes that.
NOTE: the time-out check (`signal && status === null`) also calls an output-limit kill "timed out". A run whose `name` is null fails the whole list.

The seat sent the MATERIAL finding and the `--repo` note to build 2; the other notes are FEAT-008 known-bug lines.
