# Review — post-edit-values-named (five more post-edit values are named settings, read by name and sealed), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-030 · Get trustworthy feedback after edits

Review `git diff c7f582ad..HEAD` on `feat/post-edit-values-named` (`git merge-base HEAD main` is `c7f582ad`, the
pi-launch-followups land tip, which the lane merged at `493717df`; main was `c7f582ad` then and has since moved to
`c203f485` through the notify-lifecycle-pins, mutation-runner-takeover-race and handoff-cap-surrogate lands, which
touch no lane module or test file and which this lane has not merged). The lane branched from main `07f8f6f9`, the
post-edit-timeout-name land tip. The plan of record is `docs/reviews/post-edit-values-named-2026-10-20/must-meet.md`:
six must-meet checks, rows R-2210 to R-2215, with R-087's existing display check as the failure cap's seal.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (ce4ca2c7). The seat's record is
`seat-verify-493717df.md`: CI run 39409212100 on draft pull request #124 at 493717df, 0 failing files on all three
legs (the Windows suite log `ci-windows-493717df.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 18 of 20
red, G2 and F5 surviving as declared, record `seat-mutate-output-493717df.txt`) and the independent check
(`independent-check-493717df.md`: HOLDS, no MUST, 9 probes, run on 493717df). The local macOS install check runs
before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement c7f582a..10982c0: 6 rows in 1 features
FEAT-030 · Get trustworthy feedback after edits
  R-2210 new (implemented)
  R-2211 new (implemented)
  R-2212 new (implemented)
  R-2213 new (implemented)
  R-2214 new (implemented)
  R-2215 new (implemented)
```

CAP-07 moves from 309 to 315 rows and FEAT-030 from 56 to 62. No existing row changed; R-087's text is unchanged.

The code under review: `packages/nana-pack/lib/post-edit-config.mjs` gains `POST_EDIT_KILL_GRACE_MS`,
`POST_EDIT_OUTPUT_CAP`, `POST_EDIT_FAILURE_CAP`, `POST_EDIT_COMMAND_CAP` and `POST_EDIT_LOCK_MESSAGE_CAP`, each with
its provenance. `packages/nana-pack/extensions/nana-post-edit.ts` imports them, drops its local `MAX_OUTPUT`,
`KILL_GRACE_MS`, `FAILURE_CAP` and `CMD_CAP`, and reads a name at every former use, including the lock message cap
and the forced-settle message. Tests: the new `packages/nana-pack/tests/post-edit-values-named.test.mjs` (six checks
on a retuned copy of the extension and `lib/`, with a stand-in pi package), and
`packages/nana-pack/tests/post-edit-hardening.test.mjs`, whose four settle bounds now read the named grace. The pack
README gains one sentence on the 30-second default.

Judge whether each of the five values is read by name everywhere the extension used its literal, so that retuning one
in the config module changes the check's behaviour with no other code change, the suite included; whether the
model-visible text and the kill and settle timing are unchanged at the sealed values, on macOS, Linux and Windows;
whether a retune of any of the five fails a seal that names its row; and whether pi still loads the extension with its
new imports.

Threat model: honest variation in our tools' output and the OS is in scope (checker output with emoji and other
astral characters, newlines and CRLF, a long command, output past 1 MiB, a refused file lock, a checker that ignores
SIGTERM; macOS, Linux and native win32 on Node 22, where taskkill does the kill); deliberate forgery is out, such as a
hand-edited pack copy or a forged config module.
Lane class: install, hook or gate — the pi extension `nana-post-edit.ts` (its post-edit tunables).

Check: (1) the must-meet checks are not vacuous: each fails on main and turns red under its pairs (G1; O1 to O3, O3
being a cut counted in code points; F1 to F4; C1 to C3; L1 and L2; S1 to S4); (2) the seals: R-2215 pins the four
chosen values with literals, R-087's display check pins the failure cap (S5), and no other assertion writes a sealed
literal; (3) no literal of the five is left in the extension, and the two declared survivors are what the seat says:
G2 a gap in the forced-settle message that reads the name today, F5 an equivalent body ceiling; (4) the hardening
settle bound reads the named grace, stays 6000 at today's value, and leaves titles and markers unchanged; (5) nothing
main does today stopped working: the model-visible text at the sealed values, the kill and settle timing, the other
post-edit test files, pi 1.0.2's loader accepting the extension, and both CI install checks; (6) the tests write only
inside the temp folders they own and remove them, and the stand-in pi package lives only in the copy; (7) the
provenance notes and the README sentence are true; (8) the known bugs are recorded honestly: the surrogate carry (no
lone half reaches the model, one replacement mark per cut pair), the fixtures that assume today's scale, the README's
post-edit numbers with no tie to the settings, G2 and K2; (9) HANDOFF and the session entry are true, including the
two removed post-edit-timeout-name residuals and the five new ones; (10) any MUST.

## Chain note (the seat, after this brief was written)

Since `e3089844`, the seat merged `215cd600`, the realpath-strict-fallback lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `215cd600` becomes main before this lane lands. Review this lane's own change as `git diff 215cd600...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff afa85106` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 215cd600`):

```
tree movement 215cd60..afa8510: 6 rows in 1 features
FEAT-030 · Get trustworthy feedback after edits
  R-2210 new (implemented)
  R-2211 new (implemented)
  R-2212 new (implemented)
  R-2213 new (implemented)
  R-2214 new (implemented)
  R-2215 new (implemented)
```
