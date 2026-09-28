**L1 fix round 2 report**

**Commit:** `06b773c` on `lane/l1-config-safety`, on top of `47a1f42`. Not pushed.

**The three widening shapes are now blocked.** They are pinned in the new test `packages/nana-pack/tests/config-project-gate-fallback.test.mjs`. It uses the real installed pi to record trust (the same store write `/trust` makes), and runs each gate check in a fresh child process.
- **Before** (`47a1f42`, only the test file added): exit 13. Full output is in `/tmp/l1-pgfb-before.txt`.
  - Shape 1, project deny: `FAIL 1: corrupted + fresh process — terraform destroy still BLOCKED null`. The project had been blocking it (PASS before corruption).
  - Shape 2, exception resurrection: `FAIL 2: ... user exception does NOT resurrect (BLOCKED) null`, so `rm -rf /tmp/x` was allowed.
  - Shape 3, protected path: `FAIL 3: ... write secrets/key.txt still BLOCKED null`, and the same for edit.
  - The "every gated class" checks for bash, powershell, edit and write, the journal line, and the malformed-leaf case also failed.
- **After:** 26/26 PASS, exit 0 (`/tmp/l1-pgfb-after.txt`). These cases also pass:
  - corruption in the middle of a run keeps the last valid project gate, and harmless commands are still allowed;
  - repairing the file clears the stop;
  - a missing project file is not a stop;
  - an untrusted project, or one pi auto-trusts without an owner decision, is ignored and is not a stop;
  - a valid project gate still replaces the user's values;
  - if both files are broken, the user stop wins.

**Stop reason text:** `nana-gate: project nana-pack.json gate block is malformed — repair it (<cwd>/.pi/nana-pack.json:<problem>)`. The journal gets a `config_gate_fallback` line on the project file, ending "every gated tool is BLOCKED until the file is repaired".

**Guidance edits:**
- `packages/nana-setup/bin/nana-setup.mjs:153-158`: after `project` runs, it prints a "trust:" line saying the file is ignored until trust is decided, `/trust` then restart, and that `-a`/`--approve` is one run only. The brief pointed at `lib/`, but that output is printed from `bin/`, so I changed it there.
- `packages/nana-setup/README.md:71`
- `apps/desk/README.md:113`: documentation only; no desk behavior or `server.mjs` change.
- `AGENTS.md:140`: the repo-tracked copy in the worktree; the main checkout's file was identical.
- `packages/nana-pack/README.md:121` (malformed project leaves fall back to the user value) and `:133` (project gate stop, owner repair, state is process-wide).

**Cheap fixes:**
- Deleted the `check(..., true)` line in `gate-policy-paths` and turned it into a comment.
- The `config.ts` "session" wording now says "process", in both the message string and the header comment.

**Changed assertions (please check):** `config-normalize.test.mjs` asserted "project never stops the gate" in 18 matrix cases and one named trailing-comma case. That is exactly the behavior astra ruled defective. I replaced those checks with stricter ones:
- a malformed project gate leaf must produce the project stop;
- every other block must not stop the gate;
- the trailing-comma project file must produce the project stop, with the user's notify settings intact.

**`npm test`** from the worktree root: `61 files: 60 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 2651 pass, 0 fail, 6 skip`. A 5-file subset run returned exit 0.

**`git diff --stat main...HEAD`:** 26 files, +1547/−69. This round alone is 10 files, +263/−17.

**Residuals:**
- The L2 items (compounds, shell write forms, loosening while running, session snapshot) are untouched.
- A whole-file non-object project JSON (e.g. `null`) now stops the gate too; that is covered by the same `gateValid` check.
- The new test skips cleanly when pi is not installed globally.
- There is no automated check on the new setup "trust:" line; I only confirmed it by running the command.

**Claim most likely wrong:** the docs say `-a` "does not" honor a nana-only `.pi/`. That comes from astra's source reading and our trust logic; I did not run it against a live desk spawn.

VERDICT: DONE
