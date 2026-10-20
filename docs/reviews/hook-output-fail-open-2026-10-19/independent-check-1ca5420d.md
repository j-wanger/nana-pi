# Independent check — hook-output-fail-open at 1ca5420d (2026-10-19)

VERDICT: HOLDS

Probes ran in a private clone at 1ca5420d (main at d4423eff for comparison), under $TMPDIR/hook-output-fail-open-check.hIzjZZ with a temp HOME, on macOS.

P1 Must-meet file, three runs on the lane, then the same file against main's hooks.
  `node packages/nana-setup/tests/hooks-closed-output.test.mjs` (lane x3)
  -> 5 PASS, exit=0 on every run
  On main: objective, adoption, shared-memory and verifier FAIL `open=0 closed=1 stderr="node:events:497"`; roster PASS; exit=1
  Verdict: the five checks are red on main and green on the lane, as the plan says.

P2 Hook output with the reader open, main vs lane, for all five hooks. Inputs: objective, adoption, shared-memory, roster startup, verifier Bash ask, verifier PowerShell ask, verifier `not json`.
  -> `SAME` for all 7 (for example `SAME nana-shared-memory.mjs bytes=352`, `SAME verifier-pipe.mjs bytes=245 ... enable pipefail first."}} [exit=0]`)
  Verdict: no change in what the hooks print when the output is read.

P3 A user pipes a hook into a reader that exits at once (`node hook 2>err | true`, PIPESTATUS[1], 5 runs each).
  main: objective `11111`, shared-memory `11111`, verifier ask `11111`, adoption with an unreadable journal `111`; stderr `throw er; // Unhan...`
  lane: `00000` / `00000` / `00000` / `000`; stderr empty
  roster: `00000` on both
  Verdict: fixed.

P4 The reader closes partway through. Shared memory index of 1.28 MB piped into `head -c 10`.
  main `exits=11111 lastErr=node:events:497`; lane `exits=00000 lastErr=` (empty)
  A slow full reader (`sleep 1; wc -c`) gets `bytes=1278090` on both main and lane.
  Verdict: the partial-close gap the plan lists is covered in practice. The listener does not cut output.

P5 A closed reader as Windows reports it: a preload makes every stdout write raise `write EOF` (code EOF) instead of EPIPE.
  `node --import eof.mjs <hook>`
  main: objective/shared-memory/verifier(PowerShell) `exit=1 stderr=Error: write EOF`; roster `exit=0`
  lane: all four `exit=0 stderr=empty`
  Verdict: the catch-all listener handles the Windows error code. Real Windows is still unprobed.

P6 Verifier with fd 1 closed (`>&-`): malformed input, and an ask command.
  main and lane both `exit=0`. The malformed case still prints `nana verifier-pipe: SyntaxError: Unexpected token 'o'...` on stderr.
  Verdict: diagnostics are not swallowed. Behaviour is unchanged.

P7 Adoption hook with the reader open and an unreadable journal, timed (`/usr/bin/time -p`).
  main and lane both print `ADOPTION UNAVAILABLE: journal unreadable (ENOTFILE). real 0.11`
  Verdict: unchanged; no added latency.

P8 Existing hook test files on the lane, run one file at a time.
  hook-producers `PASS=10 FAIL=0`, shared-memory-hook `PASS=43 FAIL=0`, roster-notice-hook `PASS=4 FAIL=0`, verifier-pipe `PASS=29 FAIL=0`
  Verdict: no regression.

P9 Repo checks on the lane.
  `code-map.mjs --check`: `0 problem(s)`. `readme-check.mjs`: `710 claims checked; 0 problem(s)`.
  `requirements-trace.mjs`: `ears: 0 rows off form`. `requirements-moved.mjs --base d4423eff`: `R-1940..R-1944 new (implemented)`.
  Verdict: green.

P10 Test hygiene.
  The test's temp roots are `before=0 after=0`. Nothing was written under the given HOME. The clone stays clean.
  The worktree is untouched at 1ca5420d. Its only untracked files are the seat's `seat-mutate*.{mjs,txt}`.
  Verdict: the test writes nothing outside the temp folder.

P11 Wrong-code checks in a scratch clone.
  Remove `process.exit(0)` from the roster hook: `FAIL roster-notice hook ... closed=1`.
  Switch the objective hook to an EPIPE-only listener: the test still says `PASS objective hook ...`, but P5's EOF preload gives `exit=1`.
  Verdict: the roster pin catches its wrong code. The EPIPE-only gap is real (see K1).

Findings (no MUST)
K1 (known bug; the plan already lists it): nothing pins the choice to ignore every stdout error. An EPIPE-only listener passes the must-meet file on macOS. On a Windows-style EOF error it exits 1 (P11). Only Windows CI or a test that raises a non-EPIPE error would catch it.
K2 (known bug, records only): REQUIREMENTS.md R-1940..R-1944 say "shall ignore the error and exit 0". The plan's rows also said "and write nothing to stderr". The test titles differ from the plan's must-meet table, though the test does assert empty stderr. The rows are narrower than the test, so the record differs from the plan, but behaviour is not affected.
K3 (residual, as planned): the knowledge hook was not changed. A closed stderr is still unguarded. The hooks still do their disk work after the reader closes. The second adoption step still has no time limit of its own.

Files: <worktrees>/hook-output-fail-open/packages/nana-setup/tests/hooks-closed-output.test.mjs, <worktrees>/hook-output-fail-open/packages/nana-setup/claude/hooks/{nana-objective,nana-adoption,nana-shared-memory,verifier-pipe}.mjs
