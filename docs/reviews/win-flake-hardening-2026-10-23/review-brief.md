# Review — win-flake-hardening (five Windows test failures stop depending on timing), 2026-10-23 (the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Class: ordinary (the runner's two finished-file removal sites, and four test files; with the busy folder failing, the runner never accepts a run it rejects today; precedent: suite-records, a runner edit classed ordinary). Threat model: honest variation in Windows CI timing and file holds (a finished file's temp folder busy with EBUSY, EPERM or another code for any length of time, start skews of several seconds between parallel files, a CPU sampler that takes longer than a child's limit, taskkill exiting 0, 128 or 255 or failing to start, 8.3 and long temp paths) and on macOS and Linux; deliberate forgery out (a test that fakes its own timing records, a preload that lies about the folder it holds).

Review `git diff e9a4280c..HEAD` on `feat/win-flake-hardening`. Main is e9a4280c (claude-code-builder-parity, just landed). The lane branched from 8ebcc308 and merged main twice: ffb59046 (ci-timing-records) and b3663677 (claude-code-builder-parity; no conflicts; the code map and tree outline regenerated). The rest of each merge diff is the landed lanes, already reviewed there. The lane's own commits: b5f5c132 (plan of record), 6406ea8e (build 1, the lane), fc068760 (pairs), 3e15ab72 (Windows CI finding F1, build brief 2), 409ce615 (build 2, R-2670's real-path comparison), the pairs and known bugs at 409ce615, 03bb5ae7 (notes), and the final commit with this brief.

The plan of record is `docs/reviews/win-flake-hardening-2026-10-23/must-meet.md`: the seat's decisions on the attack (M-1: a busy folder fails, it does not warn; S-1: the temp folder only), rows R-2666 to R-2670, two seals, the tunables and the known limits. `plan-draft.md` (the measured causes and fixture designs) and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): all 18 red at 6406ea8e and again at 409ce615, 15 by exactly their named titles and 3 with an unnamed red as well (`seat-mutate-output-409ce615.txt`). Pair 6 is dropped, because the build's off-Windows kill is the child's own SIGKILL, not a group kill. Every pair runs on macOS; main's taskkill call (p5) is red through the injected runner.
- Windows finding F1, measured on the draft pull request's CI at 6406ea8e: R-2670 failed only its path comparison, an 8.3 short path against the long path `where` prints; every brief observation held, the fake held 1,003 ms and the sampler never started. R-2666 to R-2669 passed on that leg.
- The seat's per-build diff check finds no removed escaped `\n`, `\r` or `\t` that the build did not keep. Session titles: 0 missing. Build 2's locked full suite: `215 files: 213 PASS, 0 FAIL, 2 SKIP`. After the merge, map:check, readme:check, the trace and the tree check are green, and the HANDOFF writing check finds no long sentence.
- The notes fold Claude Code builder parity's two final-review notes into FEAT-006 as known-bug lines; they came after that lane's LAND, so this reviewed change carries them.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement e9a4280..03bb5ae: 5 rows in 1 features
FEAT-031 · Run checks reliably and without contaminating work
  R-2666 new (implemented)
  R-2667 new (implemented)
  R-2668 new (implemented)
  R-2669 new (implemented)
  R-2670 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all: does each of the five checks now hold under the slow schedule its row names, without hiding a real failure? In particular, can the runner's new FAIL line turn a passing suite red only when a folder truly stays busy, and does every remaining file still run and count?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
