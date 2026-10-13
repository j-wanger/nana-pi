# Lane cc-hooks-windows — build brief 5 (2026-10-13 · feat/cc-hooks-windows · worktree ~/nana-pi-wt/cc-hooks-windows)

**Builder: Claude Sonnet 5.5**, fresh session. THREE items from final review round 2 (`sol-r2.md` 7/10,
`astra-r2.md` 90/100, both SEND-BACK; copied into this folder with this brief). The next review is round 3, the
last one allowed: close every MUST and the SHOULDs below completely. Work ONLY inside
`/Users/jwang/nana-pi-wt/cc-hooks-windows`.

## Item 1 — `<#` at a token boundary only (R-1062, R-1054; sol r2 MUST 1)
Both scanners start a block comment at every unquoted `<#` (`pipe-guard.mjs:179`, `:282`). Like `#`, `<#`
starts a comment only at a token boundary; `issue<#123` is one bare token. sol's repro must return a reason:
`npm test | Select-Object -Last 1; Write-Output issue<#123; git commit -m x`.
- Use ONE boundary predicate for both `#` and `<#`, in both scanners (extend `startsPowerShellComment`).
- Cases in `pipe-guard.test.mjs` with `// req: R-1062` and a live `git commit`: sol's repro, and the same inside
  `$( … )`; negative: a genuine `<# … #>` at a boundary still hides its body. Pin sol's repro through
  `decideHook` (R-1054).
- Do NOT add nesting to block comments: PowerShell block comments do not nest (language spec §2.2.3,
  `delimited-comment`), so the first `#>` ends one. Add a comment saying so beside the boolean.

## Item 2 — evidence that proves every promoted clause (sol r2 MUST 2–3, astra r2 MUST 1, SHOULD 2)
- **R-1055:** add to its Evidence cell the four doctor cases build 4 added (wrong matcher, wrong event, an
  existing target outside the checkout, a good entry beside a stale duplicate).
- **R-1056:** a case with an EXISTING target outside the checkout that carries the repository suffix (create it
  under the OS temp folder): the entry is replaced in place, no twin. Mark it R-1056 and cite it. The existing
  "outside repository" case uses a path that does not exist; keep it, but do not cite it for this clause.
- **R-1060:** prove doctor never runs `claude`: put a recording `claude` stub first on doctor's PATH (a
  `claude`/`claude.cmd` script that appends to a file) and assert the file stays absent after doctor runs, on
  forced win32 and on the host platform. Keep the note-meaning assertion.
- **R-937:** assert each expected `skipped (win32)` doctor row by its label, individually (the four hook-file
  rows and the four PATH rows), not "at least four".
- **R-1058, R-1063, R-1064:** cite run `38333416292` and its Windows job `115088051917` (the final code tip).

## Item 3 — README (sol r2 SHOULD 2, astra r2 SHOULD 3)
`packages/nana-setup/README.md:44`: begin the first migration sentence with "On POSIX", and escape the matcher
in the table cell as `Bash\|PowerShell`. `npm run readme:check` stays green.

## Done — do not report DONE until all of these pass on your last commit
`npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (0 failed); both seat
scripts (outputs re-committed); `SEAT_MUTATE_OUT=docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate-build5-output.txt node docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate.mjs`
→ `0 survived` (the seat adds a pair for item 1 after your build); push; the Windows job's `pipe-guard`,
`win32-degrade`, `settings-merge` and `hooks-win32-exec` lines verbatim with the run ID. If that run shows a
new failure in a lane file, fix it and push again before reporting.

## Rules
Briefs 1–4 hold. Wrong code first. Do not edit `CHANGE.md`, the seat scripts, `jake-windows-check.md`,
`HANDOFF.md` or `docs/sessions/`. When the CI run completes, read it and REPORT.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each round-2 finding → the fix and the
case that pins it; the `test:locked` summary line; the last line of each seat output; the Windows lines with
the run ID; the one claim most likely wrong.
