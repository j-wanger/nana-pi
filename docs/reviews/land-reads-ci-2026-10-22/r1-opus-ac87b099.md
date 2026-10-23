**Final review: land-reads-ci at 150eefd6 (diff b5b5f8c2..HEAD)**

I found no MUST. The CI read works on real GitHub data, its placement is right, and every refusal fails closed before the suite.

**What I checked**
- **Code path:** `nana-land.mjs` reads CI once. The read comes after the uncovered-commits check and before the suite (D7). It asks for the full tip SHA, set at `nana-land.mjs:91`. gh runs from main with `--hostname github.com` and the owner and repo from origin. `GH_REPO` is never consulted.
- **gh failures:** a missing gh, a non-zero exit, a time-out, or output that is not a run list each throw into the one `refused:` catch. That matches D5. The colour fix (A1) gives gh `CLICOLOR_FORCE=0` and removes every casing of `GH_FORCE_TTY`. The rerun remedies name `--repo` (A2).
- **Judge:** `judgeRuns` groups runs by `workflow_id`. Within a workflow, the highest run number wins, then the highest attempt. A workflow passes only if its newest run has status `completed` and conclusion `success`. The run check rejects malformed entries, and an empty list refuses. This matches D2 and R-2586 to R-2588.
- **Scope:** the land reads origin from main's remote list, so "no origin" is not inferred from an exit code. The workflow listing uses a non-recursive `ls-tree` of the tip, so a tip that deletes its workflows skips CI with the note. That matches D4 and R-2590.
- **Real gh run:** I fed real gh responses for this repo through the shipped `ghDefault` and `judgeRuns`:
  - b5b5f8c2 (main): passes, `ci: ci run 39875131910 attempt 2 (push) success`. Push run, re-run attempt 2.
  - 150eefd6 (this tip): refused, `ci run 39879283604 attempt 1 is in_progress; wait for the run to finish`.
  - 7019e48b (a tip that never ran CI): refused, `no CI run for 7019e48b on origin; push the tip to its open pull request, then wait for CI`.
- **Tests:** `land.test.mjs` passes 66 of 66 here, and the working tree is clean. The other files that call `runLand` (`path-spelling`, `runtime-land`, `suite-records`) use temporary fixtures with no GitHub origin, so they skip CI without calling gh. CI on GitHub doesn't hit the network through them either. `ci.yml` runs on pull requests and on pushes to main. The release job is gated to pushes on main, so on a pull request it is skipped and the run still concludes success.
- **Existing behaviour:** with no origin, a local origin or a non-GitHub origin, a land only gains one note line. Nothing main does today stops working.

**SHOULD (record as known bugs)**
1. An https origin with a trailing slash (`https://github.com/o/r/`) fails the strict pattern, so the land skips CI with the "not a github.com repository URL" note (`land-ci.mjs:21`). The brief's threat model names this spelling. The known-limits line covers ssh aliases, upper-case hosts and credentials, but not this one. The result is a land with no CI read, which is today's behaviour, so it is not a MUST. This repo's origin has no trailing slash.
2. The new branch for a `.yaml` workflow extension has no test (the pairs only cover the nested-folder and README cases). It's a gap in the tests, not a defect.

**NOTE**
- The draft PR's CI run for 150eefd6 (39879283604) was still in progress when I checked. macOS install-check had passed; the Windows install-check and the macOS, Ubuntu and Windows suite legs were still running. Under D11 the lane's own `nana-land.mjs` will refuse until that run is green, and that will be the first real read.

VERDICT: LAND
