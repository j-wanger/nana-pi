# Review — shared-helpers (one shared process-tree kill and one shared rename retry), 2026-10-23 (the final reviewer)

Feature: FEAT-033 · Adopt explicit engineering standards

Class: gate (a pi extension, post-edit; a review tool, review-round; the launcher core behind pi-review and pi-worker, pi-watchdog; and install's pi launch relay). Threat model: honest variation in platforms (macOS, Linux, native Windows with cmd, Git Bash and PowerShell), in pids (0, 1, negative, fractional, missing, reused), in signals, in taskkill's outcome (exit 0, non-zero, cannot start), in filesystem holds (EPERM, EBUSY, EACCES for a moment or for good; ENOENT), in how a checker or child tree ignores SIGTERM, and in the source spellings a builder honestly writes; deliberate forgery out (a builder that hides a kill copy from the scan on purpose, a pid file forged to point at another user's process).

Review `git diff dbb98cbb..HEAD` on `feat/shared-helpers`. Main is dbb98cbb (win-flake-hardening, just landed). The lane branched from e9a4280c (claude-code-builder-parity) and merged main once, at bb5c1d09 (win-flake-hardening; scripts/test.mjs and test-runner.test.mjs merged without conflict; the tree outline and code map regenerated). The rest of that merge diff is the landed lane, already reviewed there. The lane's own commits: a05c76fe (plan of record), e2225246 (build 1, the lane), 6ae9cdf6 (the seat's finding F1, build brief 2), 77cba752 (build 2, the scan moved to its own module), 8edcd8e8 (pairs, the Windows pair, the install check), 94b2d988 (the independent check, known bugs, notes), and the final commit with this review's two briefs.

The plan of record is `docs/reviews/shared-helpers-2026-10-23/must-meet.md`: the seat's decisions (one gate lane; D1, the rename codes unified on every platform; the pid-alive checks left out; S1 to S12; N9), rows R-2656 to R-2663, two seals, the tunables, the wrong-code pairs and the known limits. `plan-draft.md` (tables A, B and C of the copies, design parts 1 to 8) and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): all 26 red at 77cba752, judged by main's runner at dbb98cbb because the lane changes the runner's own kill (`seat-mutate-output-77cba752.txt`). Two of them, the no-wait form's error listener removed (p8) and a win32-only rename gate (p12), make their test file throw before the named check; the suite still fails, and FEAT-033 records it. The Windows-only pair 23 (post-edit passes no fallback) is red on the windows-latest runner (`seat-win-pairs-77cba752.txt`).
- The seat's finding F1: build 1 put the scan and its exception list in the runtime kill module, against the must-meet's N9; build 2 moved them to `lib/tree-kill-scan.mjs`.
- The macOS install check passes every item (`install-check-77cba752.txt`).
- The independent check (`independent-check-77cba752.md`): no material problem across the hung post-edit checker, Ctrl-C and SIGTERM in the runner, the install relay's deadline, termination and parent death, pi-watchdog's stall and ceiling kills, the review store's forced rename failures and the scan. Its notes are FEAT-033 known bugs, among them the scan spellings it misses and the README's "retries three times" for three attempts.
- The seat's per-build diff check finds no removed escaped `\n`, `\r` or `\t` that the build did not keep. Session titles: 0 missing. Build 2's locked full suite: `218 files: 216 PASS, 0 FAIL, 2 SKIP`. CI at 77cba752 passed all three suite legs and both install-check legs. After the merge, map:check, readme:check, the trace, the tree check and the identity scan are green, and the HANDOFF writing check finds no long sentence.
- The notes fold the flaky-test lane's two final-review notes into FEAT-031 as known-bug lines; they came after that lane's LAND, so this reviewed change carries them.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement dbb98cb..94b2d98: 8 rows in 3 features
FEAT-006 · Launch builders with execution limits
  R-2662 new (implemented); also applies: FEAT-033
FEAT-007 · Review a specific revision independently
  R-2660 new (implemented); also applies: FEAT-033
FEAT-033 · Adopt explicit engineering standards
  R-2656 new (implemented)
  R-2657 new (implemented)
  R-2658 new (implemented)
  R-2659 new (implemented)
  R-2661 new (implemented)
  R-2663 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all: does every one of the six consumers still end its whole child tree on every platform and every exit path it ended before, with the same fallback, and never signal a process it did not start? Does the rename retry keep a review text and a project refresh through a brief Windows hold without retrying a lasting or unrelated error?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
