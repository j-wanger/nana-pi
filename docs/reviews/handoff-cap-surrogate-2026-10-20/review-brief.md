# Review — handoff-cap-surrogate (the pi seat's injected compaction summary no longer ends on half a surrogate pair), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-002 · Resume decisions and next actions (SUB-003 · Frame recent and stale context)

Review `git diff aa5f25cd..HEAD` on `feat/handoff-cap-surrogate` (`git merge-base HEAD main` is `aa5f25cd`, the
mutation-runner-lock-overlap land tip, which the lane merged at `e58bd585`; main was `aa5f25cd` then and has since
moved to `c7f582ad` through the post-edit-timeout-name and pi-launch-followups lands, which touch no lane module or
test file and which this lane has not merged). The lane branched from main `54433844`, the handoff-pins land tip. The
plan of record is `docs/reviews/handoff-cap-surrogate-2026-10-20/must-meet.md`: one must-meet check, row R-2160, with
R-189's existing check from handoff-pins as its partner and the cap's one seal. `plan-attack.md` holds the
adversary's AMEND; `build-brief-1.md` is build 1 (4f686738), and `build-brief-2.md` is build 2 (4011c0a3, test only),
which came from the seat's wrong-code pairs, not from a review. The seat's record is `seat-verify-e58bd585.md`: CI run
39406330980 on draft pull request #121 at e58bd585, 0 failing files on all three legs (the Windows suite log
`ci-windows-e58bd585.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 9 of 10 red on 4f686738 with M4
surviving, then 10 of 10 on 4011c0a3) and the independent check (`independent-check-e58bd585.md`: HOLDS, no MUST, 11
probes, run on 4f686738). The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement aa5f25c..e58bd58: 1 rows in 1 features
FEAT-002 · Resume decisions and next actions
  R-2160 new (implemented)
```

CAP-01 moves from 192 to 193 rows, FEAT-002 from 62 to 63 (SUB-003 from 10 to 11). No existing row changed; R-189's
text is unchanged.

The code under review: in `packages/nana-pack/extensions/nana-handoff.ts`, the injected body is now
`head(h.body, INJECT_CAP)` in place of `h.body.slice(0, INJECT_CAP)`. `head` is the pack's existing pair-safe cut in
`packages/nana-pack/lib/display.mjs`, unchanged: the first n units, minus one when unit n−1 is a high surrogate.
`INJECT_CAP` is now exported under a `// contract (R-189)` note. Tests: `packages/nana-pack/tests/handoff-artifact.test.mjs`
gains the R-2160 check, which reads the cap by name, and folds an 8500-unit ASCII body into R-189's sealing check so
a retune of the cap by one unit either way fails it.

Judge whether a summary whose cap falls between the two halves of a surrogate pair is now injected ending immediately
before that pair, on macOS, Linux and Windows; whether every other summary is still injected as its raw first 8000
units, behind the same Source and Provenance lines; whether the R-189 seal now fails on every retune of the cap; and
whether pi still loads the extension with its new export and import.

Threat model: honest variation in our tools' output and the OS is in scope (a model-written summary with emoji, rare
CJK or any other astral character at any position, a joined emoji sequence, CRLF line ends; macOS, Linux and native
win32 on Node 22); deliberate forgery is out, such as a hand-planted store file. Store reads reject invalid UTF-8 and
a written lone surrogate becomes U+FFFD, so only the cut can create a lone half.
Lane class: install, hook or gate — the pi extension `nana-handoff.ts` (the injected compaction summary cut).

Check: (1) the must-meet check is not vacuous: R-2160 fails on main's raw cut with the export kept (M1) and on the wrong
cuts its pairs name (M2, M6, M8, M9, M10); (2) R-189 stays the cap's one seal, written with the literal 8000, and
fails on a retune to 7999 or 8001 (M3, M4), with its title and marker unchanged; R-2160 never writes the literal; (3)
the injected body is always a prefix of the stored body, well-formed, and 7999 units only when the cap splits a pair;
(4) nothing main does today stopped working: the injected section's framing and closing line, the stale pointer, the
other handoff checks, pi 1.0.2's loader accepting the extension, and both CI install checks; (5) the tests write only
inside the temp folders they own and remove them; (6) the contract note is true and R-189's text and the pack README's
"capped at 8000 UTF-16 code units" stay true; (7) the known bugs are recorded honestly: the cut is pair-safe but not
grapheme-safe, the plan's other raw cuts, the missing notes on the pointer cap and the day constant, and the
independent check run on build 1 only; (8) HANDOFF and the session entry are true, including the two removed
handoff-pins residuals and the new ones; (9) any MUST.

## Chain note (the seat, after this brief was written)

Since `38c77a19`, the seat merged `a112fd30`, the mutation-runner-takeover-race lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `a112fd30` becomes main before this lane lands. Review this lane's own change as `git diff a112fd30...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 7cfb5b3e` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base a112fd30`):

```
tree movement a112fd3..7cfb5b3: 1 rows in 1 features
FEAT-002 · Resume decisions and next actions
  R-2160 new (implemented)
```
