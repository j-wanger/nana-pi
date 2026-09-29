# Review brief — lane S2, round 2 (confirm)

You blocked S2 at 5/10 with two HIGH findings. Read your own `s2-sol-r1.md`, then
`s2-fix-brief.md` (the seat's rulings), then `s2-worker-r2.md`, then `git log -p 0eae18e..HEAD`.
Worktree `~/nana-pi-wt/s2`, branch `lane/s2-knowledge-renderer`, HEAD `3438a3d`.

## How the two were ruled
1. **Field identity.** The delimiter now appears only where `renderBlock` puts it: inside a rendered
   field, an em dash or look-alike with any surrounding spacing becomes ` - `. One field renderer,
   `renderFields()` in `query.ts`, is used by both `search()` and `renderBlock()`.
2. **The N+1 guarantee.** `renderBlock` now renders and caps its own fields rather than trusting the
   hit, so a raw caller gets the same bounded line. The block budget stays, and the claim is
   restated: N hits give exactly N+1 lines, except that `BLOCK_MAX_CHARS` may end the list early,
   and no single hostile field can trigger that cut because every field is capped first.

## Confirm, executed
Re-run your delimiter probe and your long-field probe. The worker reports four lines for three hits
at 700 and at 4096 characters, and three fields for the delimiter title. Then attack what the FIX
introduced:
- **The look-alike set.** The worker's own most-likely-wrong claim: em dash, horizontal bar, two-em
  and three-em dash are collapsed, but an en dash is not. Find a separator a reader or a model would
  plausibly take for a field boundary that survives. Judge whether chasing look-alikes is the right
  shape of defence at all, or whether the structural test should define the delimiter set.
- **Budget ordering.** With five hits at their caps the list is cut to three, and the worker asserts
  the kept ones are hits 0, 1, 2 in order. Verify a hostile FIRST hit cannot displace later ones,
  and that the cut never reorders.
- **The cap arithmetic.** Title 90, display 337 (320 plus a `:line` suffix), snippet 160, three hits
  filling 1932 of 2000. Check the arithmetic holds at the boundary and that a fourth hit cannot make
  a third disappear.
- **Exactness.** A path containing the delimiter now DISPLAYS with ` - `, so the pointer no longer
  names the file exactly. The worker lists it as a residual. Rule on it: is a lossy path acceptable
  on a surface whose header says "open a file only if it looks relevant", or does a pointer that
  cannot be opened defeat the feature? Say which you would land.
- The worker's "38 FAIL / 19 PASS on main" claim: some failures come from constants that do not
  exist at that commit. Say what the real old-code number is.

## Scope
`git diff --stat 0eae18e..HEAD` should be four files: `lib/query.ts`, `lib/hook.ts`, the package
README (its "Dependencies: none" line was false and now names the sibling import), and the test.
Confirm nothing else moved, and that the NOT-list held: no `nana-pack` change, no ranking, schema,
build, tokenizer, `sources.json`, budget constant, dedup, log or header change, and `display.mjs`
not moved.

## Output
State each of your two MUSTs as FIXED / PARTIAL / OPEN with the probe output that shows it. Findings
at `file:line`, marked **executed** or **source-read**. End with `SCORE: n/10`, `MUST:`, `CARRY:`
and `VERDICT: LAND|BLOCK`.
