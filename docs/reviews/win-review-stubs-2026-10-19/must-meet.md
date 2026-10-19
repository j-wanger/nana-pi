# win-review-stubs — pi-review's standard refusal and handoff-off child, proven on Windows (2026-10-19)

Feature: FEAT-007 · Review a specific revision independently

**The feature.** On Windows, the suite runs pi-review against a fake npm-installed pi. It proves that pi-review refuses a
missing, directory or blank review standard before admission, and that it starts its reviewer child with
`NANA_HANDOFF=off`. Today those four checks print SKIP on Windows ("POSIX shell stub").

**Why.** A Windows seat reviews through pi-review. A reviewer child without `NANA_HANDOFF=off` could write the seat's
handoff when it compacts. A review run past a broken standard has no bar. R-1106 and R-139 read as implemented, but
their evidence has never run on Windows.

**Lane class: ordinary.** Two test files plus the ledger, map and tree files. No product code changes.
**Threat model.** In scope: honest variation in Windows paths (short and long temp spellings), env-key case and the npm
install layout. Out of scope: deliberate forgery.

## Design
- `review-standard.test.mjs`: remove the win32 skip branch around the control and the three refusal checks. Lay the
  stub out per platform: POSIX keeps today's sh script; win32 calls `writeFakePi(stubBin, body)` from `tests/fake-pi.mjs`
  with a Node body that writes `STUB_MARKER` when set and prints `VERDICT: LAND`. Remove the unused `skip` helper.
  Update the header (`@inputs`; drop "POSIX only" from `@effects`) and the block comment.
- Control, strengthened: it also asserts that its run created `.pi/agent/review-ledger.reservations` under its scratch
  HOME. Without that, "creating no reservation" passes against a ledger kept anywhere else. Probe: a misspelled folder
  left all three refusals PASS. On Windows the ledger home comes from USERPROFILE, not HOME. New title: "control: a pack
  copy with the review standard present exits 0, starts the stub and creates the reservation folder". It stays unmarked
  and no row cites it.
- `handoff-writer-role.test.mjs`: remove the win32 SKIP and lay the stub out the same way. Both bodies print
  `stub NANA_HANDOFF=<value or unset>`, then `VERDICT: LAND`, the shape unread-verdict-loud sets. Run pi-review with cwd
  set to a one-commit scratch git repo under a realpath'd temp root, as review-standard does. Measured today: the check
  runs `git worktree add`/`remove` against the checkout the suite runs from and copies its ~2,500 tracked files into
  temp. In a lane worktree, that registers a worktree in the main checkout's shared git folder. The scratch repo keeps
  the run inside temp on every platform. Update the header.
- `tests/fake-pi.mjs` and all product code are unchanged. piLaunch already resolves npm's global layout on win32 (R-1125).
- Each of the four checks keeps its title and old row and adds its new row on the marker line, for example
  `// req: R-1106 R-1680`. The `check("title", …` call stays on the next line.

## Must-meet
| # | Row | Requirement (EARS) | Test (file::title) |
|---|---|---|---|
| WS1 | R-1680 | WHERE the platform is win32, IF the review standard file is missing THEN pi-review shall exit 1 before admission, naming that file, creating no reservation and starting no pi child. | `packages/nana-pack/tests/review-standard.test.mjs::missing review standard is refused before admission` |
| WS2 | R-1681 | WHERE the platform is win32, IF a directory stands at the review standard path THEN pi-review shall exit 1 before admission, naming that path, creating no reservation and starting no pi child. | `packages/nana-pack/tests/review-standard.test.mjs::directory at the review standard path is refused before admission` |
| WS3 | R-1682 | WHERE the platform is win32, IF the review standard file holds only whitespace THEN pi-review shall exit 1 before admission, naming that file, creating no reservation and starting no pi child. | `packages/nana-pack/tests/review-standard.test.mjs::blank review standard is refused before admission` |
| WS4 | R-1683 | WHERE the platform is win32 and pi is an npm global install, pi-review shall start its pi child with NANA_HANDOFF=off in that child's environment. | `packages/nana-pack/tests/handoff-writer-role.test.mjs::pi-review: child spawn env contains NANA_HANDOFF=off` |

The strengthened control must also pass on Windows. It keeps WS1 to WS3 from passing against a launcher that always
exits 1 or a ledger kept elsewhere.

## Red today (probes)
- Windows CI run 39278411820, job 118148235192, head ed38cb4: review-standard printed 3 pass, 3 skip ("SKIP missing … /
  directory … / blank review standard is refused before admission — POSIX shell stub"). handoff-writer-role printed
  6 pass, 1 skip ("SKIP pi-review spawn env: POSIX shell stub"). The control does not run on Windows.
- No marker carries R-1680 to R-1683 today.
- The adversary ran the amended design in a scratch clone of the unread-verdict-loud tip, on macOS. Results:
  - review-standard and handoff-writer-role each gave 7 PASS.
  - The trace printed 1,306 total, 0 off form. Tree, map and README checks were green; the leaf total was moved.
  - Wrong code: no NANA_HANDOFF off fails WS4. A catch that falls through fails WS1 and WS2. No blank check fails WS3.
    A stub with no marker fails the control. A misspelled reservation folder fails the control while WS1 to WS3 still
    pass.
  - Both win32 bodies, run directly under node, wrote the marker and printed the expected lines.
- The Windows proof is the CI Windows leg on the lane's pull request. Nothing here ran on Windows.

## Known limits
- The trace is static: it cannot tell which platform ran a check. The Windows claim rests on the CI Windows leg,
  which stays non-blocking until win-leg-flip lands.
- R-1106's "unreadable" case stays untested on every platform; Windows has no portable way to make a file unreadable.
- Only npm's global layout is exercised on Windows. The `.exe` and `.bin` layouts stay with R-1125's tests.
- The handoff check now reviews a scratch repo, not its own checkout. The child env under test does not depend on
  which tree is reviewed.