# Review brief — L4 canonical test path (gpt-5.6-sol, round 1)

Independent code review of an Opus 5.5 worker's lane. Read-only. Be adversarial: re-derive every claim in the worker report from the code and the diff.

Worktree: `~/nana-pi-wt/l4` (branch `lane/l4-test-path`, two commits on top of `b8a926e`). Diff: `~/nana-pi/docs/reviews/tranche1-2026-09-28/l4-r1.patch`. Worker report: `l4-worker-r1.md`. Brief the worker had: `l4-brief.md`. Lane contract: `~/nana-pi/research/raw/2026-09-27-advances/opus-arch-tranche1.md` §L4.

Seat-verified already (don't re-run): `npm test` from the worktree root → 42 PASS, 1709 checks, 4 skip, exit 0, 112 s; `npm test -- --self-test review-round` → exit 1.

Dimensions (PASS or FINDING with severity HIGH/MED/LOW, evidence `file:line`):
A. Contract fidelity: every §L4 invariant present (no shell globs; serial spawn via `process.execPath --experimental-strip-types`; fresh temp HOME AND USERPROFILE per file; e2e + bench fixture exclusion; unrunnable-on-platform reported as SKIP never hidden; self-test not in default set; doctor detail strings only; allowlist respected; no prepare/postinstall; `pi` field untouched).
B. Correctness of the runner: process-group/kill semantics (the worker admits Ctrl-C can orphan a child), timeout path, how PASS/FAIL/SKIP is decided (exit code + `FAIL` line — can a test that prints "FAIL" in a passing message go red? can a crashing file print nothing and go green?), temp-dir cleanup, Windows path handling (no `pgrep`, no `/tmp`, spawn without shell), ordering determinism.
C. Doctor fix: does the regular-file detail now say something true and useful? Does the absent-file message match what `nana-setup install` actually does? Any other doctor row with the same inverted pattern the worker did not touch?
D. Known gap the seat will fix in the next round regardless: `apps/bench/test/*.test.mjs` are not run. Say whether including them changes anything else (fixtures, ports, spend).
E. Test quality: does `doctor-detail.test.mjs` assert invariants or the implementation's exact strings? Is the SKIP-under-temp-HOME behavior of `ledger-parse`, `project-key`, `pi-registration` acceptable, or does it hide a real regression class that the canonical path should still catch?

End with: findings list (severity-sorted), residuals you would carry, and `VERDICT: LAND` or `VERDICT: BLOCK`.
