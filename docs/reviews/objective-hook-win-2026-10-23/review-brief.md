# Review — objective-hook-win (session-start hooks share one deadline), 2026-10-23 (the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Class: hook (the producer launcher both Claude Code session-start hooks call, and the two hooks; no settings entry, install step, doctor row or stored format changes). Threat model: honest variation in machines and producers (a slow or stalled machine, a late hook start before and after Node's clock, a busy CPU, producers that are slow, hang, crash, print nothing or print a lot, macOS and Windows, a coarse Windows timer); deliberate forgery out (a producer that lies about its own timing, a clock replaced to cheat the deadline).

Review `git diff 00617983..HEAD` on `feat/objective-hook-win`. Main is 00617983 (install-check-builder, just landed). The lane branched from 09181956 and merged main once: c032b86d (install-check-builder; the tree outline conflicted and was regenerated, the code map regenerated). The rest of that merge diff is the landed lane, already reviewed there. The lane's own commits: be777937 (plan of record), 171778fb (build 1, the lane), 49196066 (pairs), 6b529ff8 (notes), and the final commit with this brief and the land brief.

The plan of record is `docs/reviews/objective-hook-win-2026-10-23/must-meet.md`: the measured cause, the seat's decisions on the attack (M-1: a late-start live case against a hook that counts its start twice; S-1: a 1,700 ms slow producer timed from its own clock; S-2: R-2010 narrowed; S-3: no floor for the second producer, with the trade stated; S-4: the Windows readings and the 300 ms trigger), rows R-2671 to R-2674, one seal, R-2013 retired, the tunables and the known limits. `plan-draft.md` (the measured cause, the design and the prototype) and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 12 of 12 red at 171778fb, 9 by exactly their named titles (`seat-mutate-output-171778fb.txt`). They include the start counted twice (p10), the zero-only skip (p11), no cap, no floor of whole milliseconds, the module-load clock and the deadline on the first producer only.
- Windows readings (seat step 7), a scratch CI run of the two hook test files at 49196066: over five runs, 16 to 18 ms before Node's clock and 12 to 26 ms after the deadline; both-hung hooks ended at 4,029 to 4,043 ms (`seat-win-notes-49196066.txt`). Both are far under the 300 ms trigger, so the deadline stays at 4,000 ms.
- The macOS install check passes all 17 items at 49196066 and all 18 on the merged tip c032b86d (`install-check-c032b86d.txt`). CI at 49196066 passed on every leg: both install-check legs and the macOS, Linux and Windows suite legs.
- The independent check at 49196066 found nothing material (`independent-check-49196066.md`): the lane keeps output main lost, every hung case ends near 4.02 s (at most 4,038 ms under CPU load), failing producers print byte for byte as on main, and the real producers run cleanly. Its three notes (a large share of a start before Node's clock above about 8.5 times, the 300 ms trigger looser than the reserve's bound, and a start near 4 s on Node's clock) are FEAT-013 lines.
- The seat's per-build diff check finds one removed escaped `\n`, kept in the re-indented line. Session titles: 0 missing. Build 1's locked full suite: `218 files: 216 PASS, 0 FAIL, 2 SKIP`. After the merge, map:check, readme:check, the trace and the tree check are green, and the HANDOFF writing check finds no long sentence.
- The notes fold the install-check build lane's two final-review notes into FEAT-015 as known-bug lines; they came after that lane's LAND, so this reviewed change carries them.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 0061798..c032b86: 6 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-2010 text changed
  R-2013 implemented -> retired
  R-2671 new (implemented)
  R-2672 new (implemented)
  R-2673 new (implemented)
  R-2674 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all: does every Claude Code session start still get the objective block, or its unavailable line, inside Claude Code's 5 s limit on a slow Windows machine, and does a slow but healthy objective producer now print where main cut it? In particular, can any realistic start delay or producer behaviour make a hook lose output main kept, other than the second-producer trade the known limits state?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
