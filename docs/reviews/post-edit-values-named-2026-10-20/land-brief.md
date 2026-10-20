# Review — post-edit-values-named (five more post-edit values are named settings, read by name and sealed), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-030 · Get trustworthy feedback after edits

Review `git diff c7f582ad..HEAD` on `feat/post-edit-values-named` (`git merge-base HEAD main` is `c7f582ad`, the
pi-launch-followups land tip, which the lane merged at `493717df`; main was `c7f582ad` then and has since moved to
`c203f485` through the notify-lifecycle-pins, mutation-runner-takeover-race and handoff-cap-surrogate lands, which
touch no lane module or test file and which this lane has not merged). The plan of record is
`docs/reviews/post-edit-values-named-2026-10-20/must-meet.md`: six must-meet checks, rows R-2210 to R-2215, with
R-087's existing display check as the failure cap's seal. `plan-attack.md` holds the adversary's AMEND;
`build-brief-1.md` is the one build (ce4ca2c7). The seat's record is `seat-verify-493717df.md`: CI run 39409212100 at
493717df, 0 failing files on macOS, Ubuntu and Windows (`ci-windows-493717df.log` beside it), the wrong-code pairs
(`seat-mutate.mjs`; 18 of 20 red, G2 and F5 surviving as declared) and the independent check
(`independent-check-493717df.md`: HOLDS, no MUST, 9 probes, run on 493717df). The final reviewer's brief is
`review-brief.md`. The local macOS install check runs before the land.

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

The code under review: after a pi edit, `nana-post-edit.ts` runs each matching configured check. A check that outlives
its deadline gets SIGTERM (win32: `taskkill /T /F`), then a forced kill and settlement `POST_EDIT_KILL_GRACE_MS`
(2000) later. Output past `POST_EDIT_OUTPUT_CAP` (1 MiB of UTF-16 units) ends the check as could-not-run. A failure
shows the model the last `POST_EDIT_FAILURE_CAP` (2000) units and the first `POST_EDIT_COMMAND_CAP` (400) units of the
command, each cut stated. A refused file lock shows at most `POST_EDIT_LOCK_MESSAGE_CAP` (300) units of the refusal.
These five values moved from literals in the extension to named exports of `packages/nana-pack/lib/post-edit-config.mjs`;
the logic around them is unchanged. `packages/nana-pack/tests/post-edit-hardening.test.mjs` now reads the grace for its
settle bounds, and `packages/nana-pack/tests/post-edit-values-named.test.mjs` is new.

Judge whether the lane fails open: a timed-out or hung check that no longer settles, so the turn hangs; output past
the cap that no longer ends the check; a failure, could-not-run or lock refusal that no longer reaches the model, or
reaches it uncut; an extension that pi no longer loads, or whose handler now throws on import, so post-edit silently
stops; or a seal that a retuned value passes. Judge whether it leaves a harm the review standard lists: data lost or
corrupted in an owner's home or project, a broken hook, malformed text reaching a provider's prompt, or a test writing
outside the temp folders it owns or leaving them behind. Judge whether anything main does today stopped working: the
model-visible text at the sealed values, the kill and settle timing on macOS, Linux and Windows, the post-edit status
line, the other post-edit test files, and both CI install-check legs, whose live pi turn runs post-edit in a real pi.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: the head cut
on overflow and the failure tail cut can each split a surrogate pair, on main and on the lane alike, and `promptText`
turns the lone half into one U+FFFD, so no lone surrogate reaches the model; the forced-settle message reads the grace
by name, but no check reads it at a retuned grace (G2); R-2210 records every timer the test process arms, so a future
Node or pi timer there would turn it red with nothing broken (K2); hardening's 15 s watchdog and display-surfaces'
5000-char fixture assume today's scale; the pack README states 30 s, 2 s and 2000 chars as prose that no check ties to
the settings; the pairs and the independent check ran on macOS only, so CI is the only Linux and native Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (checker output with emoji and other astral
characters, a long command, output past 1 MiB, a refused file lock, a checker that ignores SIGTERM; macOS, Linux and
native win32 on Node 22); deliberate forgery is out, such as a hand-edited pack copy or a forged config module.
Lane class: install, hook or gate — the pi extension `nana-post-edit.ts` (its post-edit tunables).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

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
