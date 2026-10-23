Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane win-flake-hardening. Class: ordinary. Builder: pi-worker (small lane). Build session 2: R-2670's sampler path check on Windows.

Work in the lane worktree on feat/win-flake-hardening (main is merged in at ffb59046). The spec is still `docs/reviews/win-flake-hardening-2026-10-23/must-meet.md`. Change only `packages/nana-pack/tests/brief-check.test.mjs`. Do not edit product code, HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Finding F1 (Windows, measured): the draft pull request's CI at build 1's tip, 6406ea8e, failed one check on the windows-latest suite leg (run 39911587422): R-2670. Its detail shows every brief observation true, `sharedByBoth` true, `hold` `{"heldMs":1003}` and `samplerStarted` false, so the lane's behaviour held. Only `samplerResolvedFirst` was false: `where powershell` printed `C:\Users\runneradmin\AppData\Local\Temp\…\stub\powershell.cmd`, while `samplerShim` was `C:\Users\RUNNER~1\AppData\Local\Temp\…\stub\powershell.cmd`, the 8.3 short form of the same file. `path.resolve` and lower-casing do not fold 8.3 names. Compare the two paths by their real on-disk spelling (`fs.realpathSync.native` on win32, `fs.realpathSync` elsewhere) so the same file matches; a missing or unresolvable `resolvedSampler` must make the comparison false, not throw. Every other test on that leg passed, R-2666 to R-2669 included.

Precedent:
- packages/nana-pack/tests/brief-check.test.mjs — `resolvedSampler`, `samplerShim` and `samplerResolvedFirst` (build 1).
- packages/nana-pack/tests/adoption-producer.test.mjs — a temp path folded through `fs.realpathSync.native` before it is compared.

1. Fix F1 in the test only. Keep every title and `// req:` marker.
2. Check by hand, without committing it, that p14 (the shim written to the temp folder instead of the stub folder) still turns R-2670 red on macOS; then restore the file.
3. Checks before your one commit: `node packages/nana-pack/tests/brief-check.test.mjs`; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows here; reason about the win32 path from the code and say what you could not run.

Seat check: `node docs/reviews/win-flake-hardening-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: R-2670's resolution check compares real paths and cannot throw; the p14 hand check is still red; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; what changed; the p14 hand check's result; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
