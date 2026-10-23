# Review — install-check-builder (the install check starts a real lane build), 2026-10-23 (the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Class: ordinary (the install check alone: its library, its config, its tests and the setup README; no install, uninstall, doctor, hook, extension, gate or land-tool change; precedent: install-check-review-launch, the same shape, classed ordinary). Threat model: honest variation in the installed launchers and the machine (the path launcher off Windows, `pi-worker.cmd` under cmd and a bare `pi-worker` under Git Bash on Windows, real paths that differ from joined paths, caller environment variables pi or nana read, a slow or failing pi, a missing or non-object config file in the temporary home); deliberate forgery out (a fixture that lies about its record, a ledger written by hand to pass).

Review `git diff 09181956..HEAD` on `feat/install-check-builder`. Main is 09181956 (shared-helpers, just landed). The lane branched from dbb98cbb and merged main once: 72157ec1 (shared-helpers; no conflicts). The rest of that merge diff is the landed lane, already reviewed there. The lane's own commits: cf9a0627 (plan of record), 96214696 (build 1, the lane), 49f99527 (pairs), 57fd0e3a (notes), and the final commit with this brief.

The plan of record is `docs/reviews/install-check-builder-2026-10-23/must-meet.md`: the seat's decisions on the attack (M-1: the session-folder variable overridden; M-2: the offline value as the build's one environment addition; S-1: the build after doctor; S-2: stub readers; S-3: a config that cannot be edited fails as a launch), rows R-2681 to R-2687, one pin, the tunables and the known limits. `plan-draft.md` (the measured facts and the judge's table) and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 34 of 35 red at 96214696 (`seat-mutate-output-96214696.txt`). Pair 34 (the build block moved before the hook rows) survives: the test stub's roster notice is fixed whatever the roster, and no row pins the block's place; it is a FEAT-015 known bug. Pair 32 turns the file red by a throw in an earlier check, before its named case. Pair 30 names R-2683, whose PASS lines catch it; R-2685's check judges ledger text directly.
- The macOS install check on the merged tip 72157ec1 passes all 18 items, `PASS pi-worker` included, in 23 s (`install-check-72157ec1.txt`).
- CI's install-check legs at 72157ec1 pass every item on macOS and Windows, `PASS pi-worker (cmd)` and `PASS pi-worker (sh)` included (`ci-install-check-macos-72157ec1.log`, `ci-install-check-windows-72157ec1.log`).
- The seat's per-build diff check finds no removed escaped `\n`, `\r` or `\t`. Session titles: 0 missing. Build 1's locked full suite: `216 files: 214 PASS, 0 FAIL, 2 SKIP`. After the merge, map:check, readme:check, the trace and the tree check are green, and the HANDOFF writing check finds no long sentence.
- The notes fold shared-helpers' final-review note into FEAT-033 as a known-bug line; it came after that lane's LAND, so this reviewed change carries it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 0918195..72157ec: 7 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2681 new (implemented)
  R-2682 new (implemented)
  R-2683 new (implemented)
  R-2684 new (implemented)
  R-2685 new (implemented)
  R-2686 new (implemented)
  R-2687 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all: does a PASS build line prove that an installed pi-worker launcher started a real lane build that pi-worker accepted, recorded and released, and does a broken launcher, roster or settings edit turn the line FAIL with a cause a reader can act on? In particular, can the check's edits to the temporary home's roster and pi settings change what any other row proves?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
