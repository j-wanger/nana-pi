The four new known-bug lines match round 1, and the change touches nothing outside the notes and review records. No MUST finding.

**What changed:** the diff adds four lines to the end of `docs/known-bugs/FEAT-006.md` and six new files under `docs/reviews/machine-lane-limits-2026-11-02/`. No code, test, rule, hook or requirement row changed, so the tree movement shown is the same as round 1's.

**How each line compares to round 1:**
1. **"A rule line cannot prove a seat obeys its build-lane limit":** the first item in the round 1 reviewer's three-residual NOTE.
2. **"A pi seat's model sees the limit only by running the roster command":** the second item in the same NOTE; the independent check observed the same.
3. **The default of 4 and the stale Windows copy:** this joins two NOTEs.
   - It generalises "the laptop prints 4 until its Carry issue is done" to any machine, which keeps the line accurate and drops the machine reference.
   - The Windows half matches the code: the header of `packages/nana-setup/lib/steps.mjs` (lines 11–13) says rules are copies on win32, so a checkout that pulls without re-installing keeps the old ruling and seat guide.
4. **Where the bad-value warning prints:** it matches `packages/nana-pack/bin/nana-roster.mjs`.
   - In the plain command, line 204 writes the stderr warning before the stdout loop at 205.
   - In `set`, line 189 writes it after the stdout loop at 188 and before the `was:` stderr line at 191.

Round 1 notes not carried over are intended behaviour, not bugs:
- `--json` shows no ignored-value sign, as R-1192 intends.
- There is no upper limit, as the pack README states.
- The `nana-writing` passive-voice flag only reports, and the text it flags is not in HANDOFF.
- The land reviewer's Windows rollout steps are the plan's Carry steps.

The four lines match `build-brief-2.md` word for word, after the line prefix and lowercase start the file's style uses.

**Checks I ran (none write files):**
- `node scripts/known-bugs.mjs --root .`: no findings, exit 0.
- `node scripts/identity-scan.mjs --root .` over the whole repo: 0 findings, exit 0.
- The four new lines piped through `identity-scan.mjs --stdin`: exit 0.
- `tree-movement.md` has no final newline, but other lanes' `tree-movement.md` files have none either, so that is how the tool writes it.

**For the land:** CI on the newest pushes is still queued or running (runs 41382302040, 41382276142, 41382149626 and 41381861189). The last finished run on this branch passed. `nana-land` will wait for the tip's run to pass; this is not a review finding.

VERDICT: LAND
