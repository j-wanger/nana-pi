# Review brief — lane S1 (sanitization audit), roles: SCOPE + ADVERSARIAL

Worktree `~/nana-pi-wt/s1`, branch `lane/s1-sanitization`, HEAD `784267d`, base `main` `c7b60c4`.
Read `docs/reviews/s1-2026-09-29/s1-brief.md` (the contract), then `s1-worker-r1.md`, then
`git diff c7b60c4..HEAD` in full.

## What this lane is
astra ruled a cross-cutting sanitization audit a separate lane during T2c, and L5 then paid for the
same defect class twice with executed exploits: a newline in a repository name forged a heading in
the seat's session-start text, and a backtick closed the Markdown code span a renderer promised.
S1 moves the two audited renderers into `lib/display.mjs`, adds one renderer per SURFACE, and routes
three bypasses through them: `nana-post-edit.ts` (a raw path and raw command output in
model-visible tool text), `nana-handoff.ts` (its own escape-free `displayPath` and a weak
`oneLine`, reaching six notifications, the prompt, and the file we write), and `lib/adoption.mjs`
(its own narrower control class).

## The invariant to attack first
**No repo-controlled string may change the STRUCTURE of what a consumer receives.** Not a second
line in a one-line notification, not a new line or a fence or a heading in model-visible tool text,
not a closed code span in the seat's Markdown, not an extra field in the handoff file we write.
Attack each of the four surfaces directly, with values an attacker actually controls: a file name, a
directory name, a check command's output, a hand-edited handoff header, a configured objective
filename. Executed probes, not reasoning.

Specifically try: a newline; a bidi override (U+202E) and the other bidi controls; the ANSI escape
introducer U+001B followed by a real terminal sequence; U+2028 and U+2029; a lone surrogate; a
backtick run of length two or three (a code span can be opened with more than one backtick); a
4 KB name; a name that is only dots; a Windows-style path; and a value that is not a string at all
(`undefined`, a symbol, an object whose `toString` throws).

## Behaviour that must NOT have changed
- `displayPath` and `displayText` output. They were audited in T2c and the objective goldens depend
  on them. The worker reports a 15-input hostile corpus hashing identically before and after the
  move, and through `objective.ts`. Verify that independently — it is the whole basis for calling
  this a move rather than a rewrite.
- The gate, the trust predicate, objective parsing and precedence, the handoff store LOCATION, the
  adoption predicate's non-display rules.

## The one ruling this round must produce
The worker's own most-likely-wrong claim: **it now renders the handoff file's `Cwd:` field**, which
the brief did not name. The effect is that a handoff written in a directory whose name holds a
control, separator or bidi character is **never picked up again**, because the recorded `Cwd` no
longer matches the canonical one. It fails closed, and it stops a forged `Written:` field. But the
brief's NOT-list said the handoff store format is not this lane's to change.

Rule on it: is rendering `Cwd:` sanitization or a store-format change? If it is a change, is it the
right one anyway, and what would be lost by reverting to writing the raw `Cwd` and rendering only
on display? Say which you would land.

## SCOPE
- Allowlist respected? Permitted: `lib/{display.mjs,objective.ts,adoption.mjs}`,
  `extensions/{nana-post-edit.ts,nana-handoff.ts}`, `bin/nana-adoption.mjs`, the pack README, and
  tests. Check `git diff --stat` yourself.
- NOT-list untouched? No dependency, no config key, no change to the two pre-import allow-lists in
  the bins, nothing under `apps/**` or `lib/config.ts` / `lib/gate-paths.ts` / `lib/agent-dir.mjs` /
  `nana-gate.ts`.
- **Smallest change.** The worker added a fifth renderer (`locator`, an exact non-shortening path
  for the prompt) and made every renderer total. Were both earned, or is one a mechanism that could
  be deleted without a test noticing? Apply the subtraction test to each.
- **Appetite.** The declared CHECKPOINT is 7 non-test files and about 337 lines against a 250-line
  advisory ceiling, of which roughly 55 are moved code. Was the overrun earned?
- **One implementation.** Verify that each renderer is defined exactly once, and that the
  `\uXXXX` escaping logic appearing twice inside `display.mjs` (in `displayPath` and in the new
  `locator`) is not a second spelling that can drift.

## Also judge
- `tests/display-surfaces.test.mjs` adds 149 checks and the worker says 19 of them fail on the old
  code. Confirm that claim on a checkout of `c7b60c4`, and say whether the tests assert invariants
  or merely re-run the implementation.
- The residuals: the handoff summary body is still injected raw (content, not an interpolated
  field) — is that the right line to draw? · `codeSpan` has no length cap of its own · the
  escaped-locator marker wording.
- `env -u NANA_HANDOFF npm test` (the review launcher sets `NANA_HANDOFF=off`, which fails two
  handoff tests for unrelated reasons).

## Output
Findings with severity at `file:line`, each marked **executed** (command and output) or
**source-read**. End with `SCORE: n/10`, `MUST:`, `CARRY:` and `VERDICT: LAND|BLOCK`.
