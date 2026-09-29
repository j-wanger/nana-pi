# Review brief — lane S2, round 3 (FINAL)

Third and last round on the item. After your verdict the seat lands with named residuals or
subtracts. Worktree `~/nana-pi-wt/s2`, branch `lane/s2-knowledge-renderer`, HEAD `395e063`.
Read your `s2-sol-r2.md`, then `s2-fix2-brief.md`, then `s2-worker-r3.md`, then
`git log -p 3438a3d..HEAD`. The last commit is the SEAT's, not a worker's.

## How your round-2 finding was ruled
You wrote: *"Preserve an exact or reversibly escaped locator while preventing the delimiter from
occurring structurally — for example, encode delimiter characters inside fields rather than
substituting another valid filename character."* And: *"Chasing Unicode look-alikes is the wrong
primary defense."* Both were taken.

- **Path field:** exact, or the JSON-literal form with the separator's dash escaped as `\u2014`.
  `JSON.parse` returns the path, unless it was elided, which the ellipsis marks.
- **Title and snippet:** prose, so an exact separator still becomes ` - `, declared as readability
  and not as the guarantee.
- **The look-alike list is deleted.** An en dash and a minus sign are left alone, asserted as the
  honest behaviour, and the claim now says a reader can still be visually misled while the block
  header frames every field as data.
- The stated invariant is one sentence: **the exact `FIELD_SEP` never appears inside a rendered
  field.**

## What the SEAT changed after the worker, and why you should attack it
The worker's first version got the exact path by swapping the em dash for an unused C1 control
character, running `displayPath`, then mapping that character's escape back to `\u2014`. It worked
and it had a shape it could not render: a path containing all 32 C1 characters left no free stand-in,
so it threw and dropped the pointer.

The seat replaced it with an **additive optional parameter on `displayPath`**: extra characters to
treat as unsafe. `pointerPath` is now two lines. **This edits `packages/nana-pack`, which the S2
brief put out of scope** — the seat lifted its own restriction, on the grounds that the restriction
was what forced the trick.

Rule on all of it:
- Is `displayPath(p, extra)` genuinely additive? Passing nothing must be byte-identical to before
  for every input, and passing a character must only ever escape MORE. The objective goldens are the
  pin — verify them, and verify the interaction with `PATH_CAP`, the basename-keeping elision, and
  the quoting decision (a path that is unsafe ONLY because of the extra character must still be
  quoted and still cap correctly).
- Was lifting the scope restriction right, or should the seat have carried the defect and left
  `nana-pack` alone?
- The all-C1 path is now a regression test. Find another shape that breaks the new one.
- Round-trip exactness: fuzz it if you can. The worker flagged the token-by-token reading as its
  most-likely-wrong claim; that code is now deleted, so say whether anything of that risk remains.

## Also confirm
- MUST 2 (bounded N+1) is still FIXED and its numbers unchanged: three at-cap lines at 1932 of 2000,
  five hits cut to three in order, a hostile first hit displacing nothing extra.
- Scope: `git diff --stat main..HEAD`. Expect `nana-knowledge` `lib/query.ts`, `lib/hook.ts`, the
  README and the test, plus `nana-pack/lib/display.mjs` from the seat's commit. Nothing else.
- `env -u NANA_HANDOFF npm test`.

## The ruling this round must produce
One paragraph: **does this land?** If not, the smallest thing that would make it. Then the residuals
you would have the seat carry, priced by cost-of-error, and which of your findings across the three
rounds you verified yourself versus read.

## Output
Findings at `file:line`, marked **executed** or **source-read**. End with `SCORE: n/10`, `MUST:`,
`CARRY:` and `VERDICT: LAND|BLOCK`.
