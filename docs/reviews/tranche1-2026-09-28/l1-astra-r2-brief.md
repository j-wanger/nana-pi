# Astra land ruling — lane L1, round 2 (confirm the MUSTs)

Your r1 (`l1-astra-land.md`, 7/10 BLOCK) issued two MUSTs. The fix round is commit `06b773c` on `~/nana-pi-wt/l1` (brief: `l1-fix2-brief.md`; worker report: `l1-worker-r3.md`). Clean diff vs main: `l1-r5.patch`.

**MUST 1 — invariant 6 for trusted-project scope.** New test `packages/nana-pack/tests/config-project-gate-fallback.test.mjs` records trust through the real installed pi store and runs each check in a fresh child process. Evidence files: `l1-project-gate-before.txt` (on `47a1f42`, test only: exit 13, your three shapes all FAIL — the project deny vanishes, the user exception resurrects, the project protected path disappears) and `l1-project-gate-after.txt` (26/26 PASS). Implemented contract: a malformed gate block in a nana-trusted project with no last-good project gate in this process is a conservative STOP naming the project file; mid-run corruption keeps the last valid project gate; missing project file is not a stop; untrusted or auto-trusted project is ignored and not a stop; valid project gate still replaces user values; both malformed → the user stop wins.

**MUST 2 — owner-facing guidance.** `packages/nana-setup/bin/nana-setup.mjs:153-158` (printed after `nana-setup project`), `packages/nana-setup/README.md:71`, `apps/desk/README.md:113` (docs only, no behavior change), `~/nana-pi/AGENTS.md:140`, `packages/nana-pack/README.md:121,133`. Each distinguishes a recorded `/trust` decision from a one-run `-a`/`--approve`.

**Declared assertion change (judge it):** `config-normalize.test.mjs` asserted "project never stops the gate" in 18 matrix cases plus the trailing-comma case — the behavior you ruled defective. The worker replaced them with: a malformed project GATE leaf must produce the project stop; every other block's malformed leaf must not stop the gate; the trailing-comma project file stops while the user's notify settings stay intact.

**Cheap fixes from your ruling:** the `check(..., true)` bookkeeping line is deleted; `config.ts` wording says "process" not "session"; README Config documents that malformed project leaves in non-gate blocks inherit the user value.

Seat-verified: `npm test` → 61 files, 2651 checks, exit 0. Seat did not re-execute the child-process trust cases (they need the real pi store); the before/after files are the worker's, and the before file was produced with the test applied to the pre-fix commit.

Judge only, ≤40 lines: (1) MUST 1 FIXED / PARTIAL / NOT FIXED — is the stop contract complete, and does the new test actually exercise a recorded-trust project in a fresh process? (2) MUST 2 FIXED? (3) is the declared assertion change legitimate or a weakening? (4) any NEW defect in this round; (5) your CARRY list for the merge, unchanged items included. End with `SCORE: n/10`, MUST (empty if none), CARRY, and `VERDICT: LAND` or `VERDICT: BLOCK`.
