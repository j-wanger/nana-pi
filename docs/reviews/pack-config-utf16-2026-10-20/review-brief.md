# Review — pack-config-utf16 (nana's readers of nana-pack.json read a file saved as UTF-16 with its byte-order mark), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 1207b69e..HEAD` on `feat/pack-config-utf16` (main was `1207b69e` when this brief was written; `git
merge-base HEAD main` is `1207b69e`, the checkout-spelling-converge land tip, which the lane merged at `69f0a82e`). The
lane branched from main `a112fd30`. The plan of record is `docs/reviews/pack-config-utf16-2026-10-20/must-meet.md`:
eight must-meet checks, rows R-2230 to R-2237. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and
`build-brief-2.md` are the two builds (db2e4c1b; 58e2da48, tests and row only). The seat's record is
`seat-verify-6cc66daf.md`: CI run 39418143889 on draft pull request #128 at 2d2ba429 (build 2 plus the seat's merge of
main 0305bc8d), 0 failing files on macOS, Ubuntu and Windows (`ci-windows-2d2ba429.log` beside it; R-2237 passes on
Windows), the wrong-code pairs (`seat-mutate.mjs`; 19 of 19 red, 0 survived, on 961f76d1, on 58e2da48 and on the
merged tip 69f0a82e, records `seat-mutate-output-*.txt`) and the independent check (`independent-check-6cc66daf.md`:
HOLDS, no MUST, nine probes, run on 961f76d1). CI has not run on 69f0a82e or 6cc66daf; the land runs the locked suite on
the reviewed tip, and the local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement 1207b69..6cc66da: 8 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2230 new (implemented)
  R-2231 new (implemented)
  R-2232 new (implemented)
  R-2233 new (implemented)
  R-2234 new (implemented)
  R-2235 new (implemented)
  R-2236 new (implemented)
  R-2237 new (implemented)
```

CAP-04 moves from 489 to 497 rows and FEAT-015 from 128 to 136. No existing row changed.

The code under review: `packages/nana-pack/lib/json-text.mjs` gains `parseJsonBytes` (FF FE: the whole buffer, mark
included, decodes as UTF-16LE; FE FF: a copy is `swap16`'d, then decodes as UTF-16LE; an odd byte count after either
mark throws a SyntaxError first; anything else decodes as UTF-8; then `parseJsonText` removes exactly one U+FEFF). Seven
readers switch to it: `lib/config.ts` `readConfigFile`, `lib/adoption.mjs` `adoptionSettings`, `bin/nana-roster.mjs`
`readRosterFile` and `resolveRoster`, `lib/roster-set.mjs`, and nana-setup's `lib/doctor.mjs` `piPackConfigState`,
`lib/steps.mjs` `readPiPackConfig` and `lib/project.mjs`'s `.pi/nana-pack.json` parse. The pi settings.json readers are
unchanged. Tests: the new `packages/nana-pack/tests/pack-config-utf16.test.mjs` (R-2230, R-2231, R-2232, R-2236,
R-2237) and one new check each in `adoption-reader.test.mjs` (R-2235), `doctor-detail.test.mjs` (R-2233) and
`project.test.mjs` (R-2234). The pack README's Config list, roster paragraph and `set` known limits change with it.
The rest of the diff is the plan, the seat's records, the generated code map and tree, HANDOFF and the session entry.

Judge whether each of the seven readers now reads a marked UTF-16LE or UTF-16BE file exactly as the same JSON saved as
UTF-8; whether UTF-16 with no mark, two marks or an odd byte count still lands in each reader's existing catch with its
existing message (the gate still stops, the objective producer prints the config-failure line, `resolveRoster` never
throws); whether any file that parses on main now reads differently; whether `nana-roster set` still keeps the original
bytes in `.bak` and writes UTF-8; and whether the tests' child processes stay inside the temp homes they own.

Threat model: honest variation in our tools' output and the OS is in scope (UTF-8 with or without a mark, UTF-16LE or
UTF-16BE with a mark as Windows editors and shells write them, LF or CRLF line endings, Windows PowerShell 5.1's `>` and
`Out-File`, on macOS, Linux and Windows); deliberate forgery is out, such as a forged or mixed encoding.
Lane class: install, hook or gate — the pi extensions' config read (the nana-gate policy load and nana-objective), the
Claude Code objective, adoption and roster-notice hooks through the same readers, the nana-setup doctor, install's
objective seed and project setup.

Check: (1) the must-meet checks are not vacuous: each reader reverted to main's decode turns its row red (C1, A1, N1,
S1, D1, T1, P1), each decoder pair turns its named check red (J1 to J11, K1), R-2236 passes on main by design (it
guards the unparseable shapes, and the decoder pairs turn it red), and off Windows R-2237 is a skip, not a pass;
(2) no fail-open: a UTF-16 file that still cannot parse stops the gate exactly as on main, and no reader throws past
its catch; (3) every UTF-8 input reads exactly as on main; (4) the odd-count check runs before any swap, and each
encoding removes exactly one mark; (5) the tests write only inside the temp homes they own, and the `set` child cannot
reach a real agent dir; (6) nothing main does today stopped working, on any of the three CI legs, including after the
merge of main 1207b69e, which also changed `steps.mjs`; (7) HANDOFF and the session entry are true, including the
reworded bom-pack-config line, the four new residuals and the seat items from other lanes; (8) any MUST.
