# Review brief — L4 canonical test path (gpt-5.6-sol, round 2 of 3)

Round 1 (`l4-sol-r1.md`) BLOCKed on 2 MED + 3 LOW. The worker's fix round is reported in `l4-worker-r2.md` (commit `ca8fb03`); the seat then added declared SKIPs to two bench tests that need an optional gitignored package (`apps/bench/.ext/pi-web-access`) so `npm test` is honest on a fresh clone (seat commit on top). Full diff vs `b8a926e`: `l4-r2.patch`. Worktree `~/nana-pi-wt/l4`.

Seat-verified (don't re-run): `npm test` → 55 files PASS, 2379 checks, 6 skip, exit 0, 130 s; the two bench files run directly → argv 29 pass / 1 skip, study-tasks 1 skip, both exit 0. On the main checkout (which HAS `.ext`) they run in full.

Judge, with `file:line` evidence:
1. Each r1 finding: FIXED / PARTIAL / NOT FIXED — interrupt cleanup (SIGINT/SIGTERM, scratch dir on every exit path, win32 `taskkill`); bounded timeout (exit-then-bounded-drain; the hang fixture); win32 skip predicate; exit-code verdict + WARN for FAIL-line-with-exit-0; bench discovery (direct children only, fixtures excluded).
2. The seat's bench SKIP guards: are they preconditions (acceptable) or do they weaken an assertion that matters when the package IS installed? Is the argv guard's scope (three C checks) right?
3. Runner reporting: a file that prints only a SKIP line and exits 0 shows as `PASS … 0 pass`; should the runner show it as SKIP at file level? LOW unless it hides something.
4. Any NEW defect introduced by the fix round (read `scripts/test.mjs` whole).
5. Residuals to carry to the land (name them; don't re-litigate r1 LOWs that were accepted: the README allowlist widening was a seat contract amendment).

End with findings (severity-sorted), residuals, `VERDICT: LAND` or `VERDICT: BLOCK`. This is round 2 of 3.
