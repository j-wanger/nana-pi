# Lane cc-hooks-windows — build brief 4 (2026-10-12 · feat/cc-hooks-windows · worktree ~/nana-pi-wt/cc-hooks-windows)

**Builder: Claude Sonnet 5.5**, fresh session. THREE items from the final reviews. Read `sol-r1.md` and
`astra-r1.md` in this folder (the seat copies them in with this brief); fix every MUST, and the SHOULDs named
below. Work ONLY inside `/Users/jwang/nana-pi-wt/cc-hooks-windows`.

## Item 1 — the PowerShell lexer can hide a live commit (R-1062; sol MUST 1, astra MUST 1)
- **Embedded `#`.** `liveText`'s PowerShell branch starts a comment at every unquoted `#`
  (`pipe-guard.mjs:212` area). In PowerShell a `#` starts a comment only at a token boundary: at the start of
  the text or a line, or after whitespace or one of `;`, `|`, `&`, `(`, `{`, `}`, `)`. Inside a word
  (`issue#123`, `https://host/a#summary`) it is literal. astra's repro must return a reason:
  `npm test | Select-Object -Last 5; Write-Output issue#123; git commit -m x` — and the same with a URL
  fragment. Genuine comments (`git status # | x`) stay inactive. Look up the PowerShell language spec for the
  exact boundary set and cite it in a comment; do not guess.
- **`$( … )` matching.** `matchPowerShellParen` skips quoted strings but not line comments, block comments
  (`<# … #>`), here-strings or backtick-escaped parens, so a `)` inside a comment closes the subexpression
  early. sol's repro must return a reason:
  ```
  "$(Write-Output hi # )
  npm test | Select-Object -Last 1
  )"; git commit -m x
  ```
  Fix the class: the subexpression scan honours the same lexical rules as the top-level PowerShell lexer
  (share the code rather than writing a second lexer).
- Cases in `pipe-guard.test.mjs`, each with `// req: R-1062` and a live `git commit`: both repros, the URL
  fragment, a block comment containing `)` inside `$( … )`, a backtick-escaped `)` inside `$( … )`; negative
  cases for genuine comments. Pin one through `decideHook` (R-1054) too.

## Item 2 — two merge regressions in `settings.mjs` (R-1061, R-1056, R-923; sol MUST 2, astra MUST 2 and 3)
- **Matcher scan.** `mergeRepoHooks` (`:427`) scans only groups without a matcher when the row has none.
  Main scanned every group; CHANGE §3 says "otherwise every group". Use exactly:
  `const matcherOk = w.matcher === undefined || group?.matcher === w.matcher;`
  Differential POSIX cases against main's behaviour: an installer-shaped stale knowledge entry under
  `matcher: "*"` is replaced in place (no twin), and a healthy one there is left alone.
- **Ownership by repository suffix.** The exec-form branch of `installerTarget` (`:399-400`) accepts any
  absolute path ending in the script's file name, so `C:/custom/nana-objective.mjs` is repaired to nana's
  checkout. CHANGE §3 requires the repository suffix: `/packages/nana-setup/claude/hooks/<name>` or
  `/packages/nana-knowledge/bin/nana-knowledge.ts`, compared across `/` and `\`. A custom-path entry is kept
  byte for byte; `hasHook` may still recognise it so install adds no twin (R-923).
- Scope R-923 honestly (astra MUST 5): the row says what the cited tests prove — recognised invocation
  spellings — and records the declared limit (`node.exe`, backslash-only script paths, some full interpreter
  paths read as absent) beside its evidence.

## Item 3 — evidence that proves the rows (sol MUST 3-4, astra MUST 4, SHOULD 7)
- `hooks-win32-exec.test.mjs`: spawn each entry with its OWN declared `timeout` × 1000 (no added slack) and
  record each duration in the check's detail; assert exit 0 and no module-resolution error
  (`ERR_MODULE_NOT_FOUND`, `Cannot find module`) for ALL five; the verifier output must be exactly one
  non-empty line that parses as JSON with `hookEventName` `PreToolUse` and `permissionDecision` `ask`, for
  Bash and PowerShell, and the miss prints nothing; the shared-memory output must carry the seeded `- [` line.
  Cite every resulting test under R-1058, R-1063, R-1064.
- R-1055 doctor cases (forced win32): an entry under the wrong event or matcher, a target that exists outside
  the checkout, and a good entry beside a stale duplicate. R-1060: assert the note's meaning (the floor and
  that `claude --version` is never run), not only the version string.
- After your push, cite the NEW CI run and its Windows job in R-1058, R-1063, R-1064 (sol SHOULD 2).
- README `packages/nana-setup/README.md:44`: replacement applies to installer-shaped entries only (sol SHOULD 1,
  astra SHOULD 7). Rename `win32-degrade.test.mjs`'s "only the knowledge hook is wired" title to what it now
  checks, map it in `test-title-map.json`, and drop its vacuous prefix assertion.

## Done — do not report DONE until all of these pass on your last commit
`npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (0 failed); both seat
scripts (outputs re-committed); `SEAT_MUTATE_OUT=docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate-build4-output.txt node docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate.mjs`
with `0 survived` (the seat added pair 27 for the matcher scan; it adds the lexer and ownership pairs after
your build, against your code); push; the Windows job's `hooks-win32-exec`,
`pipe-guard`, `settings-merge` and `win32-degrade` lines verbatim with the run ID.

## Rules
Briefs 1–3 hold. Wrong code first for every new case. Do not edit `CHANGE.md`, the seat scripts, `HANDOFF.md`
or `docs/sessions/`. When the CI run completes, read it and REPORT; do not wait for another notification.

## Report
≤ 35 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each reviewer finding → the fix and the
case that pins it; rows changed and the clause each cited test pins; the `test:locked` summary line; the last
line of each seat output; the Windows lines with the run ID; the one claim most likely wrong.
