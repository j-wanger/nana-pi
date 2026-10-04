# Review brief — three nana-setup bug fixes (reviewer: gpt-6-astra)

Roles: Sonnet built it; you review; Fable rules on landing. Worktree `~/nana-pi-wt/setup-bugs`, branch `feat/setup-bugs`, base `main` `ae15067`, commit `8fd0dca`. The worker's report is `worker-report.md` in this folder. Review `git diff main..HEAD` in full.

The three claims came from one model's review each, during the pi 1.0 acceptance run:
1. `project-key.mjs`: `readlinkSync` throws past the no-error contract.
2. `paths.mjs:84`: `--home "$HOME"` sets isRealHome.
3. `fsops.mjs`: `writeIfChanged` writes through a symlink.
The worker reports all three as real bugs, each reproduced, fixed and mutation-proven (rows R-377 to R-379).

Attack:
- Re-run each reproduction against the base commit, and each fix against the branch. Do the tests prove the defect, or only the fix?
- Claim 2: is a `--home` equal to the real home meant to be a test run, by the CLI's documented contract (README, `--help`, the isRealHome comment, git history)? What else reads isRealHome, and does the change alter any real install path (for example `nana-setup install --home ~` used on purpose)?
- Claim 3: does the new lstat guard change behaviour for a caller that relied on writing through a symlink on purpose (grep every `writeIfChanged` caller)? Does doctor or install now report a skip where it used to write?
- Claim 1: the injected `readlinkSync` parameter. Is it the least machinery for a test seam here, and is it consistent with how the package injects resources (nana-standards.md "inject resources")?
- Rows: EARS, one `shall`, and each cited test pins its clause.

Verdict format: ranked findings (MUST / SHOULD / NOTE) with file:line, evidence and the smallest fix; then `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
