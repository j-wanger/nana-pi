# Review — lane pi-version-support (pi 1.0.3 through 1.4.0), 2026-10-23 (the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (rows also in FEAT-015 · Diagnose the active environment and FEAT-019 · Release usable templates and report support)

Class: install lane (doctor in nana-setup, and the CI install-check job). Threat model: honest variation in scope: any pi from 1.0.3 to 1.4.0, installed fresh or with a cutoff; npm's resolution on the install date (caret ranges float, exact pins do not); npm's nested or hoisted global layout; Windows npm shims and 8.3 temp paths; a stub `pi` outside any package; pnpm, Volta, bun or pi's own installer; a `pi` on PATH that differs from `npm root -g`. Deliberate forgery out: a hand-edited version in pi's tree, a fake `pi` first on PATH, a registry serving different bytes under one version.

Review `git diff b2e594c3..HEAD` on `feat/pi-version-support`. Main is b2e594c3. The lane's commits: a27cb372 (plan of record), 291f8a14 (build 1, the lane), 8e69298c (seat finding: the new doctor row reused the `pi packages` label; build brief 2), c3968694 (build 2, the row renamed `pi dependencies`), 42855f81 (pairs, real-run checks, local install check), 57cf025e (notes), and the final commit with this brief and the land brief.

The plan of record is `docs/reviews/pi-version-support-2026-10-23/must-meet.md`: the CI probe results (Windows install check 22 of 22 on pi 1.4.0 and 1.0.3; every suite leg red only on the three pin checks), the seat's decisions on the attack (M-1: a floor leg that skips the check passed the planned test; S-1 to S-6, including one working floor command), rows R-2711 to R-2717, the amended R-1090, R-1091 and R-1093, and the section "Build 1 finding, adopted". `plan-draft.md` (the measurements) and `plan-attack.md` are its inputs; `probe-ci-2026-10-23.md` is the probe record.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 32 of 32 red at c3968694, every named title red (`seat-mutate-output-c3968694.txt`).
- Real installs (`seat-real-runs-c3968694.txt`): the incident's fresh pi 1.0.3 gives ✗ naming six packages at 1.4.0; pinned 1.0.3, pinned and fresh 1.4.0 and this Mac's pi 1.0.2 give ✓.
- The local macOS install check passed 18 of 18 (`install-check-c3968694.txt`).
- The independent check at 42855f81 found nothing material (`independent-check-42855f81.md`): the ✗ goes to doctor's fix-by-hand list, never to install; every other doctor row and all install output match main; `pi packages` appears once. Its one note, a `·` row failing the install check for a non-npm pi, is a FEAT-015 line.
- CI at 42855f81 passed every leg: the four install-check legs (macOS and Windows at the ceiling and the floor) and the three suite legs. At 291f8a14 one macOS suite leg failed a locked-suite timing check the lane does not touch (a FEAT-031 line); it passed at 42855f81.
- The seat's diff check finds one removed escaped `\n`, kept in the rewritten R-1090 check. Session titles: 0 missing. Build 2's locked full suite: `219 files: 217 PASS, 0 FAIL, 2 SKIP`. map:check, readme:check, the trace and the tree check are green; the HANDOFF writing check finds no long sentence.
- Named departures: the row's module copies the desk's package walk (a package may not import from `apps/`, and the desk is frozen); build 2 reworded one unrelated README phrase, "the same labels", to "matching labels", because the seat's brief asked for a grep that phrase matched; the seat accepted it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement b2e594c..57cf025: 10 rows in 3 features
FEAT-013 · Install and connect harness runtimes
  R-1093 text changed
  R-2716 new (implemented)
  R-2717 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2713 new (implemented)
  R-2714 new (implemented)
  R-2715 new (implemented)
FEAT-019 · Release usable templates and report support
  R-1090 text changed
  R-1091 text changed
  R-2711 new (implemented)
  R-2712 new (implemented)
```

CI runs on the draft pull request at the reviewed tip. The seat lands only on green.

Ask above all: does nana work for a user on pi 1.0.3 and on pi 1.4.0 installed as the READMEs say, does the new doctor row give ✗ only for a pi whose own packages are newer than pi, and does anything main does today (another doctor row, install, the install check on an npm pi, CI's suite or release) stop working?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
