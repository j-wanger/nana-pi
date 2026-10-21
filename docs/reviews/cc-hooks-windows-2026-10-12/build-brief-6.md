# Lane cc-hooks-windows — build brief 6 (2026-10-13 · feat/cc-hooks-windows · worktree ~/nana-pi-wt/cc-hooks-windows)

**Builder: Claude Sonnet 5.5**, fresh session. TWO items from final review round 3 (`sol-r3.md` SEND-BACK 8/10,
`astra-r3.md` LAND-WITH-FIXES 94/100; copied into this folder). The next review is an over-cap confirmation
round on the final tip, so close both items completely and change nothing else.

## Item 1 — the comment-boundary set is the spec's, not a subset (R-1062, R-1054; sol r3 MUST 1)
`startsPowerShellComment` (`pipe-guard.mjs:105-116`) accepts a boundary only after whitespace or `; | & ( ) { }`,
but its own comment cites the spec: a comment start "can also be preceded by any expression-terminating or
statement-terminating character (such as `)`, `}`, `]`, `'`, `"`, or `;`)" (§2.2.3), and §2.3.3's
generic-token-char exclusions (`{ } ( ) ; , | & $`, quotes, backtick, whitespace). Both directions fail open
inside `$( … )`: recognising a comment PowerShell does not, or missing one it does, moves the `)` that closes the
subexpression. sol's repro must return a reason:
```
"$(Write-Output 'hi'# )
npm test | Select-Object -Last 1
)"; git commit -m x
```
- Make the boundary set exactly the union the two cited sections name; list each character in the code comment
  with the section it comes from. Where the spec is silent for a character, say so and choose the side that
  keeps the text LIVE at the top level, and state that choice.
- Cases in `pipe-guard.test.mjs` with `// req: R-1062` and a live `git commit`: sol's repro; one case per
  boundary character proving `X#` starts a comment (inside `$( … )` so a wrong answer moves the close); one case
  per word character proving `a#` does not. Pin sol's repro through `decideHook` (R-1054).

## Item 2 — evidence references (astra r3 MUST 1, sol r3 SHOULD 1, astra r3 SHOULD 1)
- R-937: add `R-937` to the `// req:` marker of the existing skill-row test at
  `packages/nana-setup/tests/retired-artifacts.test.mjs:321` and cite its title in R-937's Evidence cell.
- R-1058, R-1063, R-1064: after your code commit's CI run completes, cite THAT run and its Windows job (keep the
  "Windows-leg only" wording) in a commit that changes only `REQUIREMENTS.md` and `docs/requirements-tree.md` if
  regenerated. Say in the evidence that the run is on the last code commit.

## Done — do not report DONE until all of these pass on your last commit
`npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (0 failed); both seat
scripts; `SEAT_MUTATE_OUT=docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate-build6-output.txt node docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate.mjs`
→ `0 survived`, no ANCHOR-MISS (the seat will re-anchor pairs 28 and 32 for your predicate if needed — if you see
ANCHOR-MISS on them, report it rather than editing the runner); push; the Windows job's `pipe-guard`,
`retired-artifacts` and `hooks-win32-exec` lines verbatim with the run ID. The macOS and Linux legs are red for
the upstream pi-codemode reason; ignore that, but report any lane-file failure that is something else.

## Rules
Briefs 1–5 hold. Wrong code first. Do not edit `CHANGE.md`, the seat scripts, `owner-windows-check.md`,
`HANDOFF.md` or `docs/sessions/`. When the CI run completes, read it and REPORT.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the boundary set with each character's
source; the cases added; the `test:locked` summary line; the last line of each seat output; the Windows lines
with the run ID; the one claim most likely wrong.
