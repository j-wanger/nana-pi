# Lane S2 — the knowledge pointers use the one renderer too
(2026-09-29 · repo `~/nana-pi` · worktree `~/nana-pi-wt/s2` · branch `lane/s2-knowledge-renderer`, off `main`)

S1 landed one renderer per surface in `packages/nana-pack/lib/display.mjs` and closed four bypasses.
astra's land ruling named the one it deliberately left out, as **high consequence**:
*"knowledge-pointer rendering remains an independent model-visible bypass; assign a follow-up rather
than treating S1 as closure."* This is that follow-up.

It matters more than the four S1 closed. Those carried the owner's own paths and their own tools'
output. These pointers carry **titles and snippets from fetched third-party wikis and other people's
repositories**, and they go straight into the prompt of every session, in both runtimes.

## The trace (§1b — done by the seat; verify it, do not take it on faith)

- `lib/query.ts:45-48` `clean()` replaces only carriage return, newline and tab, collapses runs of
  whitespace, trims, and truncates on a word boundary. It does **not** touch any other control
  character (the ANSI escape introducer U+001B included), the C1 range, the bidi controls, U+2028 or
  U+2029, and it does not make lone surrogates well-formed. It renders `title` (cap 90) and
  `snippet` (cap `SNIPPET_MAX`).
- `lib/query.ts:36` `display` is `tildeify(r.path)` plus `:<loc>`, with **no escaping at all**. That
  path comes from an indexed knowledge root, so a repository that contains a file whose name holds a
  newline puts that newline in the prompt.
- `lib/hook.ts:85-99` `renderBlock` emits one line per hit as
  `- <title> — <display> — <snippet>`, bounded in total by `BLOCK_MAX_CHARS`. Its header already
  frames the block honestly as untrusted search output that is DATA, never instructions. The framing
  is right; the fields under it are not rendered.
- The block reaches the model through the Claude Code `UserPromptSubmit` hook and pi's
  `before_agent_start`, so this is model-visible context in both runtimes.
- `lib/paths.ts:21` `tildeify` shortens a path. Shortening is a different job from rendering, exactly
  as `resolvablePath` is in the handoff extension — keep it, and render its result.

**Failure modes to hold in mind:** a wiki article title holding U+2028, a bidi override, or an ANSI
sequence · a snippet that contains `\n- ` and so fakes a second pointer · a snippet that says
something addressed to the model · an indexed file whose NAME holds a newline or a control character
· a lone surrogate from a truncated multi-byte read · a title that is 4 KB of one word, so the
word-boundary truncation keeps all of it · non-string input from a malformed index row.

## The contract

1. **Import the one module.** `packages/nana-knowledge/lib/query.ts` imports
   `../../nana-pack/lib/display.mjs` — a cross-package relative import, the same shape
   `apps/desk/apps.mjs` already uses for `packages/nana-stage/lib/sign.mjs`, and the reason
   `display.mjs` is plain JavaScript. Say in one comment why the coupling is acceptable.
2. **`title` and `snippet` go through the prompt-text renderer**, then keep today's whitespace
   collapse and word-boundary truncation as a display nicety ON TOP of it, never instead of it.
   Delete `clean()`'s control handling; it must not be a second rule.
3. **`display` goes through the path renderer**, after `tildeify`, with the `:<loc>` suffix appended
   from the numeric location, not from the string.
4. **`renderBlock` proves its own shape.** A block rendered from N hits has exactly N+1 lines, no
   matter what the hits contain. Assert that, not the absence of one character class.
5. **Nothing else changes.** Not the ranking, the index, the budget, the dedup, the log, the header
   wording, or `BLOCK_MAX_CHARS`.

## NOT
- Do not change `displayPath` / `displayText` semantics, or anything in `packages/nana-pack`.
- Do not change the query, the tokenizer, the index schema, the build, or `sources.json` handling.
- Do not change the header framing sentence: it is right, and it was reviewed.
- Do not add a dependency or a config key. Do not touch `apps/**` or the desk.
- Do not move `display.mjs` to a new home in this lane, however tempting the coupling makes it —
  flag it in your report instead.

## Allowlist
`packages/nana-knowledge/lib/query.ts`, `packages/nana-knowledge/lib/hook.ts`,
`packages/nana-knowledge/README.md` if it declares the old behaviour, and tests under
`packages/nana-knowledge/tests/**` (or wherever that package's tests live — find them first).
Must not touch: everything else.
(The seat checked the NOT-list against the allowlist: no overlap.)

## Constraints
The hook runs under a hard time budget and must never throw: a renderer failure must cost a pointer,
never the prompt. `query.ts` is TypeScript loaded by Node's built-in type stripping, so it may import
a `.mjs`.

## Appetite
`--max-budget-usd 10` · 5 files / 120 LOC changed excluding tests. On crossing it: a CHECKPOINT
paragraph, then continue only if the remainder is mechanical.

## Roles
builder: Opus 5.5 headless · reviewers: scope + adversarial (executed probes) · land: seat, unless
the reviewer finds a reason to escalate.

## doneWhen
From `~/nana-pi-wt/s2`: `env -u NANA_HANDOFF npm test` exits 0, no test removed or weakened, and new
tests cover the failure-mode list above plus the N+1 line invariant, each asserting the rendered
output rather than the implementation.

## Report (30 lines or fewer)
Commit · the hostile title, snippet and indexed filename, with the block before and after · the N+1
proof · `env -u NANA_HANDOFF npm test` · `git diff --stat` and the scope statement · whether
`display.mjs` should move to a neutral home · residuals · the one claim most likely wrong ·
`VERDICT: DONE`.
