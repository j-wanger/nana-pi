## Findings

1. **LOW — command truncation is silent** — `packages/nana-pack/extensions/nana-post-edit.ts:55` **source-read**  
   `promptText(cmd, 400)` truncates a repo-configured command without saying so. The contract says capped failures must state when truncated; only checker output gets a truncation marker. This does not permit structural injection, but can leave the model seeing an incomplete command.

2. **LOW — `\uXXXX` escaping has two implementations that can drift** — `packages/nana-pack/lib/display.mjs:58-60,133-136` **source-read**  
   `displayPath` and `locator` independently implement unsafe-character detection, quote/backslash escaping, and `\uXXXX` emission. Their treatment intentionally differs for lone surrogates and truncation, but the token-escaping primitive can still be shared. The “one implementation” claim is therefore slightly overstated.

3. **LOW — Markdown renderer is unbounded** — `packages/nana-pack/lib/display.mjs:120`, `packages/nana-pack/bin/nana-adoption.mjs:49` **executed**  
   A 4 KB safe value produces a 4,098-character code span. Adoption roots remain bounded by `MAX_ROOT`, but a configured objective filename reaches `codeSpan` directly and has no equivalent cap.
   ```text
   {"name":"4KB","promptPath":"xxxxxxxx...","fileFieldLen":400,
    "codeSpan":"len=4098","locatorLen":4096,"rawLeak":false}
   ```
   This is a resource/readability residual, not a structural escape.

4. **LOW — escaped-locator explanation is inaccurate for controls and bidi** — `packages/nana-pack/extensions/nana-handoff.ts:226-228` **source-read**  
   The marker says every escaped character is one “the read tool rewrites.” That is true for the Unicode-space class, but not ESC, bidi controls, line separators, or lone surrogates. The safety instruction remains conservative, but the stated cause is wrong.

## Executed adversarial probes

Renderer matrix:

```text
{"name":"newline","promptPath":"\"x\\u000A## FORGED\"","promptText":"x ## FORGED","codeSpan":"REFUSED","rawLeak":false}
{"name":"all-bidi","promptPath":"\"x\\u061C\\u200E...\\u2069y\"","promptText":"x            y","codeSpan":"REFUSED","rawLeak":false}
{"name":"ansi","promptPath":"\"x\\u001B[2Jred\"","promptText":"x [2Jred","codeSpan":"REFUSED","rawLeak":false}
{"name":"LS/PS","promptPath":"\"x\\u2028Y\\u2029Z\"","promptText":"x Y Z","codeSpan":"REFUSED","rawLeak":false}
{"name":"lone-surrogate","promptPath":"x�y","codeSpan":"len=5","locatorRoundTrip":true,"rawLeak":false}
{"name":"ticks-2","codeSpan":"REFUSED","rawLeak":false}
{"name":"ticks-3","codeSpan":"REFUSED","rawLeak":false}
{"name":"dots","promptPath":"...","codeSpan":"len=5","rawLeak":false}
{"name":"windows","promptPath":"C:\\Repo\\A.TS","codeSpan":"len=14","rawLeak":false}
TOTAL {"promptPath":"undefined","promptText":"undefined","codeSpan":null,"locator":"undefined"}
TOTAL {"promptPath":"Symbol(s)","promptText":"Symbol(s)","codeSpan":null,"locator":"Symbol(s)"}
TOTAL {"promptPath":"[unprintable]","promptText":"[unprintable]","codeSpan":null,"locator":"[unprintable]"}
```

The committed call-site probes directly exercised hostile file names, command output, hand-edited headers, hostile CWDs, custom paths, and configured objective filenames:

```text
PASS post-edit: the model-visible block keeps its exact shape
PASS post-edit: no fence, heading or raw control reaches the model
PASS post-edit: the notification is one line, no control, path escaped
PASS handoff file: hostile writer + reason → still exactly seven header lines
PASS handoff file: a newline in the cwd cannot forge Written:
PASS handoff prompt: a hand-edited Writer reaches the Source line folded
PASS handoff custom notify: every notification is one line, no control
PASS handoff ancestor: named on one escaped line, no forged heading
PASS adoption: a bidi-override repo name is refused and counted
PASS adoption: an objective file name holding a backtick never closes a code span
all passed
```

## Objective compatibility

Independent 15-input corpus over the old producer, the re-export, and the new module:

```text
base objective.ts  5b85a91d2b5a34f7210174fc923a30d4f25e28e0bfd9e06446b667e42596bc04
HEAD objective.ts  5b85a91d2b5a34f7210174fc923a30d4f25e28e0bfd9e06446b667e42596bc04
HEAD display.mjs   5b85a91d2b5a34f7210174fc923a30d4f25e28e0bfd9e06446b667e42596bc04
IDENTICAL=YES
```

`displayPath` and `displayText` are unchanged for string inputs. Objective parsing/precedence, trust logic, gate policy, store location, and adoption’s non-display predicates are untouched; their suites pass.

## Test quality and old-code control

I ran `display-surfaces.test.mjs` against `c7b60c4` with only the new renderer module overlaid so the test could load:

```text
EXIT=1
FAIL_COUNT=19
19 FAILED
```

Representative old-code failures:

```text
FAIL post-edit: the model-visible block keeps its exact shape
FAIL post-edit: the notification is one line, no control, path escaped
FAIL handoff file: a newline in the cwd cannot forge Written:
FAIL handoff prompt: a hand-edited Writer reaches the Source line folded
FAIL handoff custom notify: every notification is one line, no control
FAIL adoption: a bidi-override repo name is refused and counted
FAIL adoption: an objective file name holding a backtick never closes a code span
```

The worker’s “19 fail” claim is confirmed. The tests largely assert hard-coded output and consumer structure rather than recomputing expected output with the implementation. The committed table omitted explicit double/triple-backtick and full-bidi cases, which my separate matrix covered.

## `Cwd:` ruling

**Rendering `Cwd:` is both sanitization and a store-format behavior change** — `packages/nana-pack/extensions/nana-handoff.ts:357,463` **executed + source-read**.

It changes serialized bytes while the reader still compares the field directly with canonical CWD. Therefore a CWD changed by `fileField` is deliberately unpickable:

```text
PASS handoff file: a newline in the cwd cannot forge Written:
PASS handoff file: …and a cwd that renders differently is never picked up (fail closed: Cwd mismatch)
```

I would **land the current behavior**. Reverting restores continuity in directories containing controls/bidi/line separators, but also restores the executed ability to inject a second `Written:`, manipulate parsed freshness, or forge another header field. That directly violates this lane’s primary invariant. A future versioned, lossless encoding could preserve both structure and pickup, but it is not the smallest safe S1 change.

## Scope, subtraction, and appetite

```text
8 files changed, 449 insertions(+), 110 deletions(-)
non-test: 7 files, 227 insertions, 110 deletions
```

All changed files are allowlisted. No dependency/config-key changes; no `apps/**`, gate, config, gate-paths, or agent-dir edits. Both pre-import allow-lists remain.

- **`locator` is earned:** substituting capped `displayPath` would break exact long paths and lone-surrogate round trips; tests detect removal.
- **Totality is earned:** hostile non-string probes detect its removal, and it satisfies the extension-handler no-throw constraint.
- The ~87-line advisory overrun is mostly the exact-locator/totality machinery and documentation. It is defensible, though the duplicated escaping primitive should be consolidated later.
- Raw handoff summary body is the correct boundary: it is intentionally multiline payload, capped at 8 KB and preceded by provenance/authority framing, not an interpolated header field.

## Full suite

```text
$ env -u NANA_HANDOFF npm test
82 files: 81 PASS, 0 FAIL, 1 SKIP, 0 WARN
checks: 5075 pass, 0 fail, 6 skip
```

SCORE: 8/10  
MUST: None.  
CARRY: Mark command truncation; share the escaping primitive; cap configured objective filenames/code spans; correct escaped-locator wording; consider a future lossless/versioned `Cwd:` encoding.  
VERDICT: LAND
