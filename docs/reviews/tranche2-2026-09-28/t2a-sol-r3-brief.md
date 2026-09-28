# Review brief — lane T2a round 3 of 3 (gpt-5.6-sol), FINAL. After this the seat lands with residuals or implements; no further sol round.

Your r2 (`t2a-sol-r2.md`) BLOCKed on an incomplete narrowing. Fix commit `63ae670` (`t2a-worker-r4.md`). Worktree `~/nana-pi-wt/t2a`; clean diff vs main `t2a-r4.patch`.

**Seat correction to the doneWhen you will be checking against.** My brief said the probes must put "ZERO attacker bytes" into the output. Taken literally that is unachievable for any displayed path: showing which file governs necessarily shows that file's directory name, and the owner needs that to act. The invariant I actually want, and the one to judge against, is: **attacker-controlled STRUCTURE never survives — no line breaks, no control or bidi characters, nothing that can start its own line or terminate the quoting — while attacker-controlled LETTERS may appear inline within a quoted or single-line path.** The worker flagged exactly this ambiguity itself; judge whether the achieved property meets the corrected invariant.

Fixes to judge:
- `markerLine()` replaces `paragraph()`: exactly one physical line per marker, split on LF/CR/CRLF/U+0085/U+2028/U+2029, C0/C1 and bidi stripped, then the 1500 cap.
- `displayPath()` (exported): lone surrogates normalized, unsafe characters JSON-escaped in a quoted string, 320-char cap cutting the middle and keeping the basename. Applied at the governing line, the new `objective file:` line, the `(ignored …)` refusal, both UNAVAILABLE markers, `noLines()`, the program-unavailable line, both precedence sentences, and all pi notices.
- No-lines wording: no longer claims a file with no lines is "governing"; the precedence sentence names the program lines as governing, and the golden case asserts the word "governing" is absent.
- Decoding: streaming decode with a final flush unless the read hit the cap; a 262,144-byte file ending mid-sequence is refused; lone surrogates normalized in two layers.
- (p) assertion strengthened so it fails alone under your guard-bypass mutant.

Seat-verified: `npm test` → 69 files, 3428 checks, exit 0. Seat probe with BOTH vectors at once (a directory name containing a raw newline plus a payload on a continuation line): 0 lines begin with a payload, 0 control bytes in the output, and the continuation-line payload is absent entirely.

Judge, ≤35 lines:
1. Each r2 finding FIXED / PARTIAL / NOT FIXED with the line, against the corrected invariant above.
2. Any REMAINING route for attacker-controlled structure into either runtime's output. The worker names one residual: `bin/nana-objective.mjs` still prints a raw `String(err)` on its producer-failure path — reachable with attacker bytes? Probe the error paths, the `objective.path` and `projectFile` config values (owner-controlled but worth checking), a path at exactly the 320 cap, a basename longer than the cap, and a repo directory named to imitate the output's own labels (e.g. a directory called `program current priority:`).
3. The worker reports one mutation gap: removing only ONE of the two lone-surrogate normalization layers is caught by neither test. Confirm, and say whether the second layer earns its place or is redundancy worth subtracting.
4. NEW defects from `markerLine`, `displayPath` or the decode flush.
5. Your CARRY list for the astra land ruling, each priced by cost of error, plus anything astra must know about the still-open trust-vs-label question.
End with `VERDICT: LAND` or `VERDICT: BLOCK`.
