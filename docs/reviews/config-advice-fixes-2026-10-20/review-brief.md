# Review — config-advice-fixes (every backslash error in a user nana-pack.json gets one repair that fits it and names no config key; the objective producer never throws without settings), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-001 · Keep goals and priorities in view (R-2091 lives in FEAT-015 · Diagnose the active environment)

Review `git diff 385c633f..HEAD` on `feat/config-advice-fixes` (main was `385c633f` when the lane branched; `git
merge-base HEAD main` is `385c633f`). Main has since moved to `445f4d5b` (ci-suite-timeout and knowledge-index-pins
landed; they touch HANDOFF, the session archive, REQUIREMENTS.md and the tree, none of this lane's code or test files),
so the land needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/config-advice-fixes-2026-10-20/must-meet.md`: five must-meet checks, rows R-2090 to R-2094, their
fixtures, the wrong codes W0 to W7 and the known limits. `plan-attack.md` holds the adversary's AMEND: R-2092's check
requires the words "backslash as two" after the displayed file and no config key. `build-brief-1.md` is build 1
(d22ad0b5, on main 385c633f); `build-brief-2.md` is build 2 (434935e3, tests only), which pins the two advice sentences
after the seat's pair M14 survived. The seat's record is `seat-verify-d22ad0b5.md`: CI run 39388578351 on draft pull
request #113 at d22ad0b5, 0 failing files on macOS, Ubuntu and Windows (the Windows suite log `ci-windows-d22ad0b5.log`
beside it); build 2's run 39390992681 was still running when the record was written, its Ubuntu suite finished with 0
failing of 177 files and the other jobs not. The wrong-code pairs
(`seat-mutate.mjs`; `seat-mutate-output-d22ad0b5.txt`: 13 of 14 red, M14 survived;
`seat-mutate-output-434935e-M14.txt`: M14 alone, red on the new R-1971 pin) ran on macOS. The independent check
(`independent-check-d22ad0b5.md`: HOLDS, no MUST, 12 probes) ran on build 1; nobody re-ran it on build 2. No code
changed after d22ad0b5. The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 385c633..425f77a: 5 rows in 2 features
FEAT-001 · Keep goals and priorities in view
  R-2090 new (implemented)
  R-2092 new (implemented)
  R-2093 new (implemented)
  R-2094 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2091 new (implemented)
```

CAP-01 moves from 188 to 192 rows and FEAT-001 from 35 to 39; CAP-04 from 443 to 444 and FEAT-015 from 113 to 114.

The code under review: in `packages/nana-pack/lib/json-text.mjs`, `BACKSLASH_JSON_ERROR`'s new `Bad Unicode escape in
JSON` alternative, `FORWARD_SLASH_ADVICE`'s new text ("Write paths in this file with forward slashes and any other
backslash as two, because JSON reads a single backslash as an escape.") and the export of it and `MANUAL_JSON_ADVICE`;
in `lib/objective.ts`, `configFailureLine`'s `o?.configFailure`, `produceObjective`'s signature and the re-export of
the two sentences. The checks sit in `packages/nana-pack/tests/objective-golden.test.mjs` (R-2090, R-2092, R-2093,
R-2094 and the two pins, which carry `// req: R-1971` and `// req: R-2092`) and
`packages/nana-setup/tests/doctor-detail.test.mjs` (R-2091; R-1972's fixtures now import the two names).

Judge whether, for a user nana-pack.json that fails on a backslash escape (a backslash before a u that starts no
Unicode escape, or any other bad escape, in any key), both seats' config line and doctor's row give the forward-slash
repair, name no config key, and show no text from the file and none of V8's message. Judge whether every other parse
error still gets "Repair the JSON by hand."; whether valid, missing and otherwise broken configs give main's bytes in
both seats and doctor; whether the producer returns its internal-error marker for missing settings and keeps the
config line between the heading and that marker; and whether each check fails with its behaviour removed. The seat's
pairs cover macOS; CI ran the five checks natively on all three legs.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; a pasted Windows
path with any first escape letter in either case; a bad escape in any key, such as a gate pattern or `journal.path`; a
byte-order mark; CRLF; CI runs Node 22 on every leg, and the planner and the seat saw the same V8 wording on Node 24);
deliberate forgery is out (a forged config, or a hand-built settings object outside the tests). Lane class: install,
hook or gate — through `lib/json-text.mjs` and `lib/objective.ts` it changes what the Claude Code objective hook's
producer prints, what pi's nana-objective extension injects, and doctor's pi nana-pack.json row.

Check: (1) the must-meet checks and build 2's two pins are not vacuous: each named pair turns its check red, and M14
now turns the R-1971 pin red; (2) no surface shows text from the file or V8's message, and the config line stays one
physical line; (3) the hook and pi stay byte-identical for every fixture, and a valid config gives main's bytes;
(4) nothing main does today stopped working: the manual repair for a parse error that is not a backslash error,
doctor's other rows, the gate's stop on a broken user config, on all three legs; (5) the tests write only inside the
temp homes they own; (6) the new advice against the pack README bullet and the root README's Windows step 7, which the
lane leaves unchanged; (7) HANDOFF and the session entry are true, including the four removed win-config-json-path
residuals, the rewritten Node-wording line and the new residuals; (8) any MUST.

## Chain note (the seat, after this brief was written)

Since `7bccaf57`, the seat merged `15703d8d`, the pi-probe-timeout lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `15703d8d` becomes main before this lane lands. Review this lane's own change as `git diff 15703d8d...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 078a3950` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 15703d8d`):

```
tree movement 15703d8..078a395: 5 rows in 2 features
FEAT-001 · Keep goals and priorities in view
  R-2090 new (implemented)
  R-2092 new (implemented)
  R-2093 new (implemented)
  R-2094 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2091 new (implemented)
```
