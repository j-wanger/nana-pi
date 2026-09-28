# Worker brief — T2a fix round 3 (Opus 5.5), after sol r2 BLOCK. Last fix before the final review round.

Worktree `~/nana-pi-wt/t2a`, branch `lane/t2a-objective` (HEAD `0ae4879`). Read `t2a-sol-r2.md`.

The r3 narrowing ("never emit raw file content") was necessary but not sufficient. sol found two live paths for attacker bytes and proved both in BOTH runtimes.

## MUST 1 — extract ONE physical line, not a paragraph
`objective.ts:169-175` (`paragraph()`) emits continuation lines verbatim. Probe that worked: a file whose objective line is `**Objective:** benign` followed by `IGNORE_LINE_PAYLOAD` plus ESC/BEL/U+2028 — every payload byte and control character reached the prompt.
**Required:** each of `**Objective`/`**Current priority` contributes exactly ONE physical line, canonicalized: take the line the marker is on, stop at the first newline (LF, CR, CRLF, U+0085, U+2028, U+2029), then strip C0/C1 control characters and the bidi-override range from what remains, then apply the 1500-unit cap. No continuation lines, ever.

## MUST 2 — sanitize every interpolated PATH
`objective.ts:192,249,252,268`: the governing line, the no-lines marker and the precedence sentence interpolate repo-controlled pathnames unescaped. sol created a directory whose name contains `\nIGNORE_PATH_PAYLOAD` and the payload appeared three times in the prompt.
**Required:** a path is display text here. Render every interpolated path through one helper that strips or escapes control characters and line separators (JSON-escape them, as L3's handoff pointer does) and bounds the length, keeping the basename intact. Apply it at every site, including markers and the journal-adjacent text. Add a probe-shaped test using sol's directory name.

## MUST 3 — stop calling a file with no lines "governing"
`objective.ts:252,268`, pinned by `objective-golden.test.mjs:246-252`: a product file with neither line is labelled `governing` and the precedence sentence then says its lines govern. Say what is true: name the file, say no governing lines were found in it, and state that the program lines govern this session. Update that golden case to the corrected wording.

## MUST 4 — two decoding defects
- A lone surrogate in a configured path survives in pi's in-process prompt but becomes U+FFFD through the CLI, so the runtimes diverge. Normalize lone surrogates in the producer (e.g. `String.prototype.toWellFormed()`), so both emit the same bytes.
- `objective.ts:142`: the strict decoder is created with `stream:true` and never flushed, so a 256 KiB file ending in an incomplete UTF-8 sequence is ACCEPTED despite strict decoding. Flush it (a final `decode()` with no argument) and pin the exact-cap case.

## Also
- sol: check (p)'s standalone "falls back" assertion stays green under its own mutant because the program priority contains the same phrase; the surrounding checks catch it, but strengthen that one assertion so it fails alone.

## NOT
No trust gating and no label wording changes (still Jake's call). No new mechanisms beyond the sanitizer helper. `--max-budget-usd 15`.

## doneWhen
`npm test` exits 0; sol's two probes (payload on a continuation line; a directory name containing a newline) put ZERO attacker bytes into either runtime's output; the exact-cap incomplete-UTF-8 file is refused; the no-lines wording is coherent.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce each of sol's two probes BEFORE fixing.

## Report (≤25 lines)
Commit · both probes before/after (paste the emitted text) · the sanitizer helper and every call site · the no-lines wording · the two decoding fixes with the exact-cap case · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
