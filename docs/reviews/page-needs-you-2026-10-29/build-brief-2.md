Feature: FEAT-039 · See the product and its decisions in one report

Lane page-needs-you. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on the tip of build 1.

The plan of record is still `docs/reviews/page-needs-you-2026-10-29/plan.md`. Build 1 met every must-meet. The seat ran first-look on build 1 and read the phone screenshot.

## What the seat saw

The Overview order is right: What it does, Needs you, then the closed Records section. Issue 255's ask shows its first question, `Seat recommends: yes`, its cost line and "2 more questions in the issue". Issue 256's ask does not. Its body writes each question as a numbered list item with indented labels:

```
1. Question: When should the reader run?
   Default: After build 1, ...
   Cost of a wrong guess: easy to undo — ...
```

The parser missed the numbered `Question:` line. The Overview showed the body's intro paragraph as the question and no cost line, though it did find the `Default:` line.

## The fix

1. **Numbered and indented labels (R-3052).** A label line may start with a list marker (`1.`, `2)`, `-` or `*`) and leading spaces. Its continuation lines may be indented. Parse issue 256's shape into three question groups with all four labels each.
2. **Pin it.** Add a fixture copied from issue 256's body (`gh issue view 256 -R j-wanger/nana-pi --json body`) to the R-3052 test, asserting three groups and the first group's four values. Keep every existing R-3052 case passing.

Numbers that must not move: the Overview order; the cap of three listed asks; the label set.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: the new test title; what the Overview shows for issue 256 after the fix; each departure from the Precedent; every existing test you changed.

## Precedent

- `packages/nana-pack/lib/ask-shape.mjs`: build 1's parser, which this build extends.
- `packages/nana-pack/tests/ask-shape.test.mjs`: build 1's R-3052 fixtures.
