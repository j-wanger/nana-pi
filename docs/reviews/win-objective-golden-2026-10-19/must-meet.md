# win-objective-golden — the objective's path-payload checks pin the escaping again (2026-10-19)

**The feature.** The objective block shows a directory name holding a newline, ESC and U+2028 as one escaped, quoted
line. Four checks in `packages/nana-pack/tests/objective-golden.test.mjs` (case 13d, around lines 371-400) pin that
form. The win-session-start lane made them pass on Windows by building the expected text with the product's own
`displayPath()`, so a change to `displayPath`'s escaping now changes the expectation with it: the checks no longer pin
the escaping (sol's SHOULD on that lane). This lane builds the expectation by hand again, on every platform.

**Lane class: ordinary** — one test file; no product code. Threat model: honest variation in Windows paths in scope;
deliberate forgery out. The W7 cut's adversary pass covered this lane (the seat's scratch, `w7-cut.md` LANE 5).

**The change.** Restore `dir13dHeadEsc` (`"\\u0085"` on win32, `"\\u000A"` elsewhere) and `dir13dMidEsc` (`"\\u0085"`
on win32, `"\\u001B"` elsewhere). Build each expectation by hand:

```js
const hand = (p) => `"${p.replaceAll("\\", "\\\\").replaceAll(dir13dHead, dir13dHeadEsc).replaceAll(dir13dMid, dir13dMidEsc).replaceAll(LS, "\\u2028")}"`;
```

then `shown = hand(file)` and `shownDir = hand(dir)`; keep `mentionDetail`. On POSIX this equals the form used before
commit 0b8a045.

## Must-meet (no new row; the checks keep their rows)

- **OG1.** On macOS the four path-payload checks never call `displayPath`, and a change to `displayPath`'s escaping
  fails them: switching its `\u000A` escape to `\n` turns them red (wrong code, run by the builder and recorded).
- **OG2.** objective-golden passes with its current counts on macOS (1,236 checks) and on Windows (CI's Windows leg).

## Known limits
The expectation assumes the path stays under `PATH_CAP`, as before 0b8a045. Dropping `displayPath`'s backslash doubling
fails these checks only on Windows, where the separators are backslashes.
