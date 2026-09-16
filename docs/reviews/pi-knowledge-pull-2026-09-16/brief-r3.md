# Review brief — pi-side knowledge pull (round 3 of max 3 — final)

You are an independent code reviewer. Read-only. This round verifies the fold of your round-2 findings (`sol-r2.md` in this directory — read it, and `sol-r1.md` for lineage). Same change, still uncommitted in `/Users/jwang/nana-pi`. This is the LAST round under the cap: after it the change lands with whatever residuals you name.

## What was folded, and a fact your r2 fix assumed that turned out false

Your r2 MEDIUM said: the SIGTERM-deaf test no longer proves the parent timer (SIGKILL cannot be trapped), so use a child that leaves a descendant holding stdout. The seat built exactly that child and ran it as a negative control against a copy of the extension with the parent timer deleted: **it settled in 207 ms anyway.** Node's `execFile` destroys the child's stdout/stderr streams before sending the kill signal on timeout, so a descendant on the pipe does not delay the `close` callback. The only child execFile's own timeout cannot bound is one a SIGKILL cannot end — wedged in an uninterruptible syscall — and no real process can stand in for it in a test.

So the fold is:

- `makePull` gained a third test seam, `execFileFn` (default: `node:child_process.execFile`), mirroring the `spawnFn` seam `lib/hook.ts` already uses.
- Test 5b now fakes execFile with a stub whose callback never fires and whose `kill` records the signal. Asserts: resolves `null` near the 200 ms deadline; `kill("SIGKILL")` attempted once, after resolving. Negative control run by the seat: with the parent timer deleted this test reports STILL-HANGING at the 2 s race guard; with it, 203 ms.
- Header comment, the in-function comment, and the README bound bullet now say precisely that: execFile's SIGKILL deadline ends any child a kill can end (descendants on the pipe included); the parent timer bounds the turn in the one case it cannot.

## Dimensions

1. **The seam.** Is `execFileFn` typed and used so the production path is unchanged (`execFile` with identical arguments/options)? Any way the seam widens the surface (it is exported only through `makePull`'s options)?
2. **Test 5b proves the timer.** Confirm from the test text that nothing but the parent timer can resolve it (stub never calls back; stdin stub is inert), and that the SIGKILL assertion cannot be satisfied by execFile's own kill (the stub owns `kill`).
3. **Wording.** Header comment, in-function comment, README: do they now state only what was measured? Flag any remaining sentence that overclaims or underclaims.
4. **Regression scan.** Nothing else changed since r2 (`git diff` on `lib/`, `package.json`s; the extension's handler body).
5. **Residuals to carry.** One line each, CLOSED / RESIDUAL: overlap-dedup race, compaction, double registration (root + package manifests), bun untested.

## Files to read

- `/Users/jwang/nana-pi/packages/nana-knowledge/extensions/nana-knowledge.ts`
- `/Users/jwang/nana-pi/packages/nana-knowledge/tests/extension.test.mjs` (test 5b and the makePull-using tests around it)
- `/Users/jwang/nana-pi/packages/nana-knowledge/README.md` — "## The pi extension"

## Output

Per dimension: PASS or FINDING (severity, file:line, scenario, smallest fix). Then the residual list. End with `VERDICT: LAND` or `VERDICT: BLOCK` and a one-line reason. Only a defect that breaks a prompt, leaks outside the knowledge home, or hangs pi's turn is a BLOCK at this round.
