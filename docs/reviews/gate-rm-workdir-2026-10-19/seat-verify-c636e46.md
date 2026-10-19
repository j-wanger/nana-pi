# Seat checks — gate-rm-workdir, builds 1 and 2, tip c636e46 (2026-10-19)

- Builds: Claude Sonnet 5 built both. Build 1 is `bdc852f` (rows, tests and retargets) and `d6f0613` (the code). Build 2,
  `0862220`, closed the two pairs survivors with cases in existing checks and added the independent check's two targets
  to the pack README's known limits; it changed no product code. `61ca5be` is the seat's pairs record on build 2, and
  `c636e46` merges main `ca27d86`. Since `0862220` no lane code or test changed.
- The seat's wrong-code pairs (`seat-mutate.mjs`, unsplit on macOS): 32 of 34 red on `d6f0613`
  (`seat-mutate-output-d6f0613.txt`). Two survived: P4 (the loop checks only the last target) and P24 (the cwd and home
  compared by their typed spelling). On `0862220`, 34 of 34 red, 0 survived (`seat-mutate-output-0862220.txt`). Every red
  pair failed exactly its named checks. The table declares four gaps it does not pair, (a) to (d), each with its reason.
- CI on draft pull request #43, run 39273742604 on `c636e46` (GitHub's merge `cf24ca37` of `c636e46` into `ca27d86`, the
  same tree):
  - Windows (`ci-windows-run-3.log`): `155 files: 134 PASS, 0 FAIL, 21 SKIP`, checks 6,217 pass, 0 fail, 79 skip. The new
    file: `PASS  packages/nana-pack/tests/gate-rm-inside.test.mjs                7 pass  3.7s`. Its junction cases
    (R-1493) pass there, so Node reports a junction as a link: the plan's most-likely-wrong claim holds.
  - Ubuntu: `155 files: 153 PASS, 0 FAIL, 2 SKIP`, checks 7,457 pass, 31 skip. The new file:
    `PASS  packages/nana-pack/tests/gate-rm-inside.test.mjs                7 pass, 1 skip  0.9s`. The test prints one
    SKIP line only, for R-1495's case-changed HOME spelling, which a case-sensitive volume cannot hold. R-1492's
    case-folded agent-folder spellings do not run there either, by design and with no SKIP line.
  - macOS (`ci-macos-run-3.log`): `155 files: 152 PASS, 1 FAIL, 2 SKIP`, checks 7,509 pass, 1 fail, 14 skip. The new file:
    `PASS  packages/nana-pack/tests/gate-rm-inside.test.mjs                7 pass  2.0s`. The one failure is
    `packages/nana-setup/tests/desk-service.test.mjs`, "hung launchctl print is killed at the unload deadline without
    bootstrap" at 2553 ms ("launchd job remained loaded after 2000ms"). The lane touches nothing under nana-setup or the
    desk. The seat re-ran that file alone on macOS three times on `c636e46`: 46 pass, 0 fail each. A CI timing flake,
    not the lane's.
  - install-check: macOS and Windows success. release: skipped.
- Tree movement (`requirements-moved.mjs --base main`, merge-base `ca27d86`): 7 rows in 1 feature, FEAT-010, R-1490 to
  R-1496, each new and `implemented`.
- Independent check (`independent-check-d6f0613.md`, on build 1): HOLDS, 13 probes recorded, no MUST. Its three known
  bugs, settled:
  1. Two targets main asked for now run unasked, both inside the working directory: a folder holding a git repository
     deeper than one level, and a bare repository. Build 2 (`0862220`) added both to the pack README's known limits;
     HANDOFF carries both as residuals.
  2. No Windows CI on the fix commit. Run 39273742604 settles it: the Windows leg passes all 7 checks, junctions
     included. Git Bash's own `rm -r` over an inner junction stays inferred; HANDOFF carries it in a residual.
  3. HANDOFF lacked the plan's open question on plain `rm` and `rm -f` outside the working directory. The seat-notes
     commit adds it to HANDOFF as an optional question for the owner, and the plan's other known limits as residuals.
- Since `c636e46` the tip adds only the seat's notes: this file, the independent check, two CI logs, HANDOFF, the
  session entry and the two review briefs.
