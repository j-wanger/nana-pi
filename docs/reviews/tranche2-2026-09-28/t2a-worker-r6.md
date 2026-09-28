**Commit:** `47d2027` on `lane/t2a-objective`. Not pushed; the tree is clean.

**Declaration surfaces:**
- **Worktree `AGENTS.md`** (the brief named `~/nana-pi/AGENTS.md`; I edited the branch's copy): a new "Objective contract" section. The nearest `OBJECTIVE.md` walking up governs, with no opt-in; otherwise the umbrella does. `projectFile` only renames the file and must be a bare filename; anything else is refused and doctor shows ✗. Both program lines are shown, followed by a precedence sentence. Only the `**Objective` / `**Current priority` lines are emitted, one line each and capped, never raw file content.
- **`templates/_shared/working-under-nana-pi.md`**: one new "Objective" bullet stating the same contract.
- **`templates/_shared/OBJECTIVE.md`**: a paragraph saying what a session actually sees: the two lines, then `program objective:` / `program current priority:`, then the precedence sentence quoted. I ran the seed through the CLI and the output matches the description. The new prose does not get picked up as a marker line.

**Doctor, before → after:** before, `add(OK, …)` was hardcoded, so `../OBJECTIVE.md` was reported ✓ as a rename. After, `projectFileState()` gives:
- absent, `null`, `false`, `""` or `OBJECTIVE.md` → ✓ default.
- `PLAN.md` → ✓ `"PLAN.md" (per-repo file renamed from OBJECTIVE.md)`.
- a path with a separator, `.`, `..`, or a non-string → ✗ with the reason and "the producer ignores it and uses OBJECTIVE.md".
- The new tests in `doctor-detail.test.mjs` all pass. They cover every case through `diagnose()`, plus a check that doctor's rule matches the producer's `isBareFileName`.

**Node floor:** now published as ≥ 22.18 in the setup README, the root README row and the CLI header. What happens on an older or missing Node:
- **Older Node:** the CLI checks the version before loading its TypeScript files and prints `OBJECTIVE UNAVAILABLE: Node <v> is older than 22.18 … — upgrade Node`, then exits 0. I tested this with the floor raised to 99.
- **No node on PATH:** the hook prints `OBJECTIVE UNAVAILABLE: node not found on PATH (… needs Node >= 22.18)`.
- **Doctor:** there was no Node check before; I added a `node for the objective hook` line that shows ✗ below 22.18.

**Size against ceiling:** the advisory ceiling is ≤12 files / ≤600 LOC. The lane now stands at 19 files, +1394/−278 against main (13 files, +1251/−275 before this round). It crossed the ceiling in r1 with no checkpoint written, which is the missed process step. This round's 9 files (+152/−12) were mechanical: documentation and one diagnostic.

**`npm test`:** exit 0. 70 files: 69 pass, 1 skip. 3514 checks pass, 0 fail.

**Residuals:**
- Doctor checks the `node` on its own PATH, which may not be the one Claude Code uses when it runs the hook.
- The below-22.18 path has only been tested by raising the floor, not on a real Node 22.17.
- As instructed, I left the post-edit/handoff sanitization and the provenance label alone.

**Claim most likely wrong:** that the whole floor is 22.18. It comes from Node turning on TypeScript type stripping by default in 22.18, and I did not verify that on an actual 22.17 runtime.

VERDICT: DONE
