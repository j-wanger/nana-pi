I fixed all five items, but `npm test` now exits **1** in this worktree. Two of the newly included bench files fail because the optional `pi-web-access` package isn't installed here. They fail the same way when run directly without the runner, so the runner isn't the cause.

**Commits** on `lane/l4-test-path`, not pushed: `4bec951`, `83dd7bc`, and the new `ca8fb03`, which changes only `scripts/test.mjs` and one line of `README.md`. `git diff b8a926e --stat` shows the same 5 files as before.

**`npm test` summary:**
- 55 files: 53 PASS, 2 FAIL, 0 SKIP, 0 WARN.
- Checks: 2469 pass, 1 fail, 4 skip.
- Exit 1, 133.4s (about 112s before bench was added).
- The failures are `apps/bench/test/argv.test.mjs` (1 of 33 checks) and `study-tasks.test.mjs` (ENOENT reading `apps/bench/.ext/pi-web-access/.../index.ts`).
- That folder is gitignored (`apps/bench/.gitignore:2`) and deliberately not vendored (`apps/bench/README.md:14`). The main checkout has it installed, so any fresh clone fails these two files.
- The brief doesn't cover this case, so I left them as FAIL rather than hide them behind a SKIP.

**Bench:**
- Discovery reads only the direct children of `apps/bench/test`, so the `fixtures/` folder there is not collected. `studies/**` and any `fixture/` or `fixtures/` folder are excluded outright.
- Running the bench tests alone took 20.9s.
- **Ports and model calls:** I checked the network sockets of every process in the active test's process group 62 times during that run and found none, listening or outbound.
  - `study-tasks.test.mjs:1` says "no model calls". It imports only the checker/fixture code and `loadStudy`/`shapedPaths`, and never the run path.
  - The integration tests launch stub scripts under node instead of real pi.

**Hang reproduction:**
- **Before:** I used a temporary test that starts a detached grandchild holding stdout (the `post-edit-hardening.test.mjs:171-176` shape), with a 2s timeout. The old runner was still stuck at 20s until my alarm killed it (exit 142), and it leaked a scratch folder.
- **After, same test:** FAIL "timed out after 2s (stdio still open…)" at 4.0s, exit 1, scratch removed.
- **Self-test** (`--self-test doctor-detail`), with three fixtures written only at self-test time:
  - The red fixture fails with exit 1.
  - The fixture that prints a `FAIL` line and exits 0 passes, with `WARN … FAIL line with exit 0`.
  - The hang fixture fails with "timed out after 3s" at 5.0s.
  - The run prints "every fixture got its expected verdict" and exits 1, with no grandchild or scratch folder left behind.

**Interrupt test:** I started the runner on `post-edit-hardening`, sent the signal after 3s, then checked the child's process group, the child, and the scratch folder.
- SIGINT exits 130 and SIGTERM exits 143; in both cases the group has 0 processes left, the child is gone and the scratch folder is removed.
- A temporary test with a grandchild in the same group also ends with the grandchild gone after SIGINT.
- The no-match path exits 1 and leaves no scratch folder.

**win32 skip:** `post-edit-hardening` is now skipped only on non-Windows systems without `pgrep`, so on Windows it always runs. I confirmed the Mac/Linux case with `PATH=/nonexistent`: it prints SKIP and exits 0. I did not run the Windows branch.

**Residuals:**
- A descendant that escapes the process group isn't killed; the runner just stops waiting for it (my repro's grandchild survived and I killed it by hand). The same limit is documented in `post-edit-hardening`. The self-test reaps its own via a recorded process ID.
- The Windows `taskkill` path and the Windows run of `post-edit-hardening` are untested.
- If a file exits but a descendant keeps its output open, the result line notes it but the verdict doesn't change.
- The two bench files need a decision: a declared SKIP when the package is absent, or an install step for clones.
- Three files still drop their real-machine checks under the temp home (unchanged from last round).

**The claim I'd most expect to be wrong:** "no model calls or ports". That comes from sampling every 0.2s plus reading the code, so a socket that opens and closes between samples could be missed.

VERDICT: DONE
