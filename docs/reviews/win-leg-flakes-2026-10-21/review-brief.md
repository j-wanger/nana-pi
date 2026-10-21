# Review — win-leg-flakes (the four first-try Windows CI failures: a pi-subagents retry with a NOTE per attempt in the install check, and three test limits from measured runs), 2026-10-21 (the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Class: ordinary (the install-check rehearsal and four test files plus one new test file; no change to nana-setup install, uninstall or doctor, no hook, extension, gate, land or review tool). Threat model: honest variation in scope — hosted Windows runner load, cold PowerShell starts, an npm or registry hiccup or a file lock that makes one install exit 1 fast, npm 10's and npm 8's error leads, a real user's slow Windows machine; deliberate forgery out (a fixture faking PASS lines, a malicious npm printing a forged code line, editing the sealed limits to hide a regression).

Review `git diff bc529014..HEAD` on `feat/win-leg-flakes` (main is bc529014; the lane branched from 363df471 and merged main at 6ef4f91e). The plan of record is `docs/reviews/win-leg-flakes-2026-10-21/must-meet.md`: the cause verdict per flake, seven must-meet rows (R-2480 to R-2486), what each test does, the tunables with provenance, the design, the known limits and the out-of-scope options. `build-brief-1.md` to `build-brief-4.md` are the four builder sessions (6c99f999, 76529d12, bc3e492d, 72df3508); build 4 answered the Windows leg, which failed `stale-copies-slow.test.mjs` for passing nothing there (run 39626329305). The seat's record is `seat-verify-72df3508.md`, with the wrong-code pairs in `seat-mutate.mjs` and `seat-mutate-output-72df3508.txt` (12 of 12 red). The macOS install check passes locally. CI: see the figures section added at the tip. The land runs the locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, at 6ef4f91e plus notes):

```
tree movement bc52901..6ef4f91: 7 rows in 1 features
FEAT-031 · Run checks reliably and without contaminating work
  R-2480 new (implemented)
  R-2481 new (implemented)
  R-2482 new (implemented)
  R-2483 new (implemented)
  R-2484 new (implemented)
  R-2485 new (implemented)
  R-2486 new (implemented)
```

Judge whether the feature works for the owner, whose release waits on the Windows leg, and report:
- each must-meet check is red with its feature removed or with the obvious wrong code (the seat's twelve pairs are the record), and green with it; R-2486 is a guard, green on main by design;
- no change masks a real defect: a broken pi-subagents package still fails every attempt, every failed attempt stays visible as a NOTE line, a timeout or launch error is never retried, and the launch-limit bound stays below the relay's own backstop (pair W12: a relay with no deadline still fails R-2020 to R-2022);
- each limit's provenance matches the measured data the must-meet cites, and the limits are used at their call sites (R-2485 checks the PowerShell call itself; the stale-copies install-child limit is used at both install spawns);
- the meta-runs in `stale-copies-slow.test.mjs` write only under the OS temp folder (their own `tmpDir`, with `TMPDIR`, `TMP` and `TEMP` pointed there); R-2482 skips on Windows with a reason, and R-2483 runs on every system;
- the HANDOFF lines, the session entry and the folded frontier-first late notes are accurate.

Known limits already carried (do not send back for them): the retry can hide an intermittent fault that passes within three attempts; a refused pi launch on Windows is retried for nothing; npm's lead could be reworded or cut; the larger limits catch less slowness; the slowed-install meta-run skips on Windows; CI re-runs cannot prove the rate fell; the linked Claude folder failure is diagnosed, not fixed; the runner's unguarded cleanup, pack-config-utf16's uncaught ENOENT, the stale-copies grandchild and the five copies of the install-child limit are recorded residuals.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.

## CI figures (seat, before the final round)

- Run 39635853134 at f33f5902 (PR #155): suite (ubuntu-latest) 201 files, 198 PASS, 0 FAIL, 3 SKIP; checks 8171 pass, 0 fail, 56 skip. suite (windows-latest) 201 files, 183 PASS, 0 FAIL, 18 SKIP; checks 7159 pass, 0 fail, 116 skip. install-check (windows-latest) success. On Windows, `stale-copies-slow.test.mjs` is 1 pass, 1 skip: R-2483 passes and R-2482 skips with its reason; every lane row line is in `ci-windows-f33f5902.txt`.
- macOS at f33f5902: both macOS jobs were cancelled before any step ran ("The job was not acquired by Runner of type hosted even after multiple attempts"; GitHub's macOS capacity notice). The seat re-ran them; the result is not in this brief. The previous run, 39633400425 at 72df3508, gave install-check (macos-latest) success and a macOS suite whose only failure was `code-map.test.mjs` (2 checks, the stale map that f33f5902 regenerates); its Linux and Windows legs failed the same file and nothing else. The macOS install check passes locally (17 PASS), and the land runs the locked suite on macOS.
