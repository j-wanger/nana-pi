# Land ruling — lane S1 (the sanitization audit), role: LAND RULER

You ruled this a separate lane in the T2c land ruling: *"the same failure shape as the sanitization
audit — one property, many components, no single resolution, invisible to any review that reads one
file at a time."* L5 then paid for it twice with executed exploits. This is that lane.

Worktree `~/nana-pi-wt/s1`, branch `lane/s1-sanitization`, HEAD `d52fd37`, base `main` `c7b60c4`.
`git diff c7b60c4..HEAD`. Read: `docs/reviews/s1-2026-09-29/s1-brief.md` (the contract) ·
`s1-worker-r1.md` · `s1-sol-r1.md` (LAND, 8/10, no MUSTs). Commit `d52fd37` is the SEAT's: three of
sol's LOW carries taken before this ruling.

## What landed
`lib/display.mjs` is now the one renderer module, plain JavaScript so a `.ts` extension and a `.mjs`
bin both import it. `displayPath` and `displayText` MOVED there unchanged and `lib/objective.ts`
re-exports them. Five surfaces are named: prompt text, prompt path, an exact non-elided `locator`,
UI notification, Markdown code span, and the fields of a file we write. Three bypasses now route
through it: `nana-post-edit.ts` (a raw path and raw command output in model-visible tool text),
`nana-handoff.ts` (its own escape-free `displayPath`, and an `oneLine` that stripped only CR, LF and
tab, reaching six notifications, the prompt and the file we write), and `lib/adoption.mjs` (its own
narrower control class).

## Evidence established (do not re-run unless you doubt it)
- sol executed a renderer matrix over newline, all bidi controls, the ANSI escape introducer,
  U+2028/9, a lone surrogate, two- and three-backtick runs, 4 KB, dots-only, Windows paths and
  non-string inputs. Nothing leaked raw.
- `displayPath` / `displayText` hash IDENTICALLY over a 15-input hostile corpus on the base commit,
  through the re-export, and from the new module. That is the basis for calling this a move.
- 19 of the new checks fail on the base commit, confirmed by sol on a checkout.
- `env -u NANA_HANDOFF npm test`: 82 files, 81 PASS, 0 FAIL, 5078 checks (seat-run).

## What a land ruling must produce
1. **Is the boundary the right one?** The handoff SUMMARY BODY is still injected raw, up to 8 KB,
   behind a provenance and authority framing. sol ruled that the correct line: it is payload, not an
   interpolated field. You wrote the authority framing in T2c. Do you agree that an 8 KB
   agent-written body behind a framing line is a different thing from an interpolated header field,
   or is this lane declaring a boundary it has not earned?
2. **The `Cwd:` decision.** The worker rendered the handoff file's `Cwd:` field, which the brief did
   not authorise. Consequence: a handoff written in a directory whose name holds a control, bidi or
   separator character is never picked up again, because the recorded value no longer matches the
   canonical one. It fails closed and it stops a forged second `Written:` field. sol ruled: land it,
   and carry a future versioned lossless encoding. Rule on whether a silent, permanent loss of
   pickup in those directories is acceptable, and whether "fail closed" is the honest description.
3. **What still speaks the old contract.** Every consumer that built display text itself, in this
   repo and outside it. Name anything the lane missed — `apps/**` was explicitly out of scope, and
   the desk renders paths of its own.
4. **The upstream-contract declaration** and residuals priced by cost-of-error.

## Seat rulings to test rather than accept
- **`lib/display.mjs` as plain JavaScript**, following `agent-dir.mjs` from U2, so a bin can import
  it without a Node type-stripping floor. Right, or is the pack now accumulating `.mjs` islands
  inside a `.ts` codebase?
- **The two pre-import allow-lists in the bins stay separate** — they run before an import can
  succeed. Defensible, or two more spellings of the same idea?
- **Refuse rather than escape, for Markdown.** A backtick or an over-long value is refused and
  counted, never escaped, because a backslash does not escape a backtick in a code span. Is
  refusal the right default for a surface a person reads, given a refused path tells them nothing
  about which repository it was?
- **The seat took three LOW carries before the ruling** rather than landing with them open.

## NOT
Read-only: report, never edit. Do not reopen `displayPath` / `displayText` semantics — they are
audited and unchanged; if you think one is wrong, carry it.

## Output
`SCORE: n/10`, `MUST:`, `CARRY:`, `VERDICT: LAND|BLOCK`.
