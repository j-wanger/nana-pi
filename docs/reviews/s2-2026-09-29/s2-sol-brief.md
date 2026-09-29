# Review brief — lane S2 (knowledge pointers through the one renderer), roles: SCOPE + ADVERSARIAL

Worktree `~/nana-pi-wt/s2`, branch `lane/s2-knowledge-renderer`, HEAD `0eae18e`, base `main`.
Read `docs/reviews/s2-2026-09-29/s2-brief.md` (the contract), then `s2-worker-r1.md`, then
`git diff main..HEAD` in full. Context: `docs/reviews/s1-2026-09-29/s1-astra-land.md` named this
surface **high consequence** and told the seat not to treat S1 as closure without it.

## Why this surface is the sharp one
The four bypasses S1 closed carried the owner's own paths and their own tools' output. These
pointers carry **titles and snippets from fetched third-party wikis and other people's
repositories**, and the block goes into the prompt of every session in both runtimes. The header
already frames it as untrusted search output that is DATA; the fields under it were not rendered.

## The invariant to attack
**A block rendered from N hits has exactly N+1 lines, whatever the hits contain, and no field can
become a different field.** The worker splits on `\r\n`, `\n`, `\r`, `\v`, `\f`, U+0085, U+2028 and
U+2029 and asserts the count in three places, including `renderBlock` called directly with raw
hostile hits that never passed through `search()`. Verify that independently and then look for what
it does not cover:

- a title or snippet that fakes the block HEADER rather than a pointer line;
- a snippet that ends mid-escape so the next field reads as part of it;
- an indexed file name holding a backtick, a quote, a bidi override, or the ANSI escape introducer;
- a `loc` that is negative, fractional, enormous, or a string (the worker says a string `loc` such
  as `"12"` is now DROPPED where it used to be appended — a behaviour change: rule on it);
- a malformed index row whose `title` is `null` (renders as the word `null`, as before) or whose
  fields are not strings at all;
- a lone surrogate at the truncation boundary;
- a title of 4 KB, and a field with more than sixteen times the display cap in padding (the worker
  pre-bounds at 16x before collapsing whitespace, and says words could be lost there).

## The claim to test hardest
The worker now passes each WHOLE rendered line through `promptText` a second time, and argues it is
a no-op on fields `search()` already rendered. That is also their own most-likely-wrong claim: if a
path rendering ever emits a character `promptText` replaces, a pointer's path would be silently
altered and the model would be told to open a file that does not exist. Prove or disprove the
no-op, for clean paths and for escaped ones.

## SCOPE
- Allowlist: `lib/query.ts`, `lib/hook.ts`, the package README if it declared the old behaviour, and
  that package's tests. Check `git diff --stat` yourself.
- NOT-list: no change to `packages/nana-pack`, the ranking, the index schema, the build, the
  tokenizer, `sources.json` handling, the budget, the dedup, the log, the header wording, or
  `BLOCK_MAX_CHARS`. No dependency, no config key, nothing under `apps/**`. `display.mjs` was NOT
  moved, by instruction.
- **Smallest change.** Is the second `promptText` pass defence in depth that earns its line, or a
  second rule that can disagree with the first? Apply the subtraction test.
- The cross-package import `../../nana-pack/lib/display.mjs` couples `nana-knowledge` to
  `nana-pack`'s internal layout. The worker recommends a neutral `packages/nana-display` in a later
  lane. Rule on whether the coupling is acceptable meanwhile.

## Also judge
- `tests/render.test.mjs` adds 33 checks and the worker says 6 fail on `main`. Confirm on a
  checkout, and say whether they assert the rendered output or re-run the implementation.
- The hook has a hard time budget and must never throw: a renderer failure must cost a pointer, not
  the prompt. Probe that.
- The package's CLI prints the same fields and is outside the allowlist, so it is protected but
  untested. Does that matter?
- `env -u NANA_HANDOFF npm test` (the review launcher sets `NANA_HANDOFF=off`, which fails two
  handoff tests for unrelated reasons).

## Output
Findings with severity at `file:line`, each marked **executed** (command and output) or
**source-read**. End with `SCORE: n/10`, `MUST:`, `CARRY:` and `VERDICT: LAND|BLOCK`.
