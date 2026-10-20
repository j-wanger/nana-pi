# Review — config-advice-fixes (every backslash error in a user nana-pack.json gets one repair that fits it and names no config key; the objective producer never throws without settings), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-001 · Keep goals and priorities in view (R-2091 lives in FEAT-015 · Diagnose the active environment)

Review `git diff 385c633f..HEAD` on `feat/config-advice-fixes` (main was `385c633f` when the lane branched; `git
merge-base HEAD main` is `385c633f`). Main has since moved to `445f4d5b` (ci-suite-timeout and knowledge-index-pins
landed; they touch HANDOFF, the session archive, REQUIREMENTS.md and the tree, none of this lane's code or test files),
so the land needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/config-advice-fixes-2026-10-20/must-meet.md`: five must-meet checks, rows R-2090 to R-2094.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds (d22ad0b5
on main 385c633f; 434935e3, tests only, which pins the two advice sentences). The seat's record is
`seat-verify-d22ad0b5.md`: CI run 39388578351 on macOS, Ubuntu and Windows at d22ad0b5, 0 failing files on each
(`ci-windows-d22ad0b5.log` beside it), with build 2's run still running when the record was written (its Ubuntu suite
finished with 0 failing of 177 files; the other jobs had not finished); the macOS
wrong-code pairs (`seat-mutate.mjs`; 13 of 14 red on d22ad0b5, M14 survived; M14 alone red on 434935e); and the
independent check (`independent-check-d22ad0b5.md`: HOLDS, no MUST, 12 probes, run on build 1 and not re-run on build
2). The final reviewer's brief is `review-brief.md`. The local macOS install check runs before the land.

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

The code under review: in `packages/nana-pack/lib/json-text.mjs`, the classifier `BACKSLASH_JSON_ERROR` (now also
`Bad Unicode escape in JSON`), the new `FORWARD_SLASH_ADVICE` text and the export of it and `MANUAL_JSON_ADVICE`; in
`lib/objective.ts`, `configFailureLine`'s `o?.configFailure` and the re-export of the two sentences. The Claude Code
objective hook (through its producer), every pi session (through nana-objective) and doctor's pi nana-pack.json row
read these. The hook launcher, the producer CLI, the extension, `config.ts`, `doctor.mjs` and both READMEs are
unchanged.

Judge whether the lane fails open: a broken user config that now turns the objective off or drops its lines, a hook
that exits non-zero or prints nothing, a pi session whose gate no longer stops gated tools on a broken user config,
doctor reading ✓ for a broken file, or a producer that now throws where it printed a marker. Judge whether it leaves a
harm the review standard lists: text from the owner's config or V8's message shown in a surface that did not show it
before; a broken install or hook (a session-start block split across lines or over the output cap, the hook and pi no
longer byte-identical); data lost or corrupted; or a test writing outside the temp homes it owns. Judge whether anything
main does today stopped working: the objective block for a valid, missing or otherwise broken config, "Repair the JSON
by hand." for a parse error that is not a backslash error, the gate's stop and pi's config warning, doctor's other
rows, on any of the three CI legs. The plan's known limits that HANDOFF records (a raw control character and a file
cut off inside a `\u` escape still get the forward-slash advice; the gate-pattern check's exact phrase and hand-typed
key list; doctor's row read only through the shared sentence; Node's wording, with Node 24 outside the checks; the
independent check on build 1 only, with the pairs on macOS only) are known limits unless the review standard lists
them as harms.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; a pasted Windows
path with any first escape letter in either case; a bad escape in any key; a byte-order mark; CRLF; CI runs Node 22 on
every leg); deliberate forgery is out (a forged config, or a hand-built settings object outside the tests). Lane class:
install, hook or gate — it changes what the Claude Code objective hook's producer prints, what pi's nana-objective
extension injects, and doctor's pi nana-pack.json row.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

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
