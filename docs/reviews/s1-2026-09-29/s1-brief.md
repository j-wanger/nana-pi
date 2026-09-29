# Lane S1 — one renderer for every repo-controlled string that reaches a human or a model
(2026-09-29 · repo `~/nana-pi` · worktree `~/nana-pi-wt/s1` · branch `lane/s1-sanitization`, off `main`)

astra ruled this a separate lane during T2c, and it has now been paid for twice in L5: a repository
directory name forged a heading in the seat's session-start text, and then a backtick in a
repository name closed the Markdown code span the renderer promised. Both were executed, neither
needed a forged file. The same class is still open in three other places.

## Goal

Every string nana-pack interpolates into something a model reads, a person sees, or a file we write
goes through ONE renderer, chosen by the SURFACE it lands on. No module carries its own escaping
rule, and the rule for each surface is written down where a reader will find it.

## The trace (§1b — done by the seat; verify it, do not take it on faith)

**What exists and is correct.** `lib/objective.ts:228` `displayPath()` renders a path as one line: a
clean path prints as-is; a path holding a control character, line separator or bidi control prints
as a JSON string literal with `\uXXXX` escapes; the whole is capped at `PATH_CAP` (320) keeping the
basename readable. `:256` `displayText()` folds arbitrary text to one line — lone surrogates made
well-formed, every control, line break and bidi control replaced by a space, then capped. `CONTROL`
(`:203`) and `PATH_UNSAFE` (`:217`) both cover `U+001B` (the ANSI escape introducer), so ANSI escape sequences cannot reach a
terminal through them. `lib/config.ts:322,410` and `extensions/nana-gate.ts:186,247` use them
correctly. **These semantics were audited in T2c and must not change.**

**What bypasses them.**
1. `extensions/nana-post-edit.ts:496` interpolates the edited file path raw into a UI notification,
   and `:501` interpolates the SAME raw path plus `failures.join()` into **model-visible tool
   text**. `failures` holds the output of repo-defined post-edit commands. A repository can contain
   a file whose name holds a newline or a bidi control, and a check command's output is
   repo-controlled text going straight into the model's context.
2. `extensions/nana-handoff.ts:93` defines its own `displayPath` as `resolvablePath(cwd, file,
   false)`, which SHORTENS a path and escapes nothing. Its result `shown` reaches six UI
   notifications (`:328,332,386,442,448,468`) and, at `:377`, the **prompt**. `:214` `oneLine()`
   strips only carriage return, newline and tab — it leaves every other control character, every
   bidi control and `U+001B` (the ANSI escape introducer) — and it renders `h.writer` into the prompt at `:377` and into the handoff
   FILE we write at `:464`.
3. `lib/adoption.mjs:134` carries its own `CONTROL`, narrower than objective's (no bidi controls),
   and its own printable/backtick rule, landed yesterday in L5.
4. `bin/nana-adoption.mjs:20` and `bin/nana-objective.mjs:34` each carry a small allow-list
   `oneLine` for error codes. Both are deliberate and correct for a path that runs before an import
   can succeed, but they are a fourth and fifth spelling of the same idea.

**Failure modes to hold in mind:** a repository file or directory whose name holds a newline, a
bracket, a bidi override, `U+001B` (the ANSI escape introducer), a lone surrogate, or four kilobytes of text · a check command that
prints ANSI, one very long line, or a sentence addressed to the model · a hand-edited handoff file
(its own format invites editing) · Windows paths and case · a path that is legitimately unusual and
must still be recognisable to the person reading it.

## The contract

### 1. One module, importable from both runtimes
Create `packages/nana-pack/lib/display.mjs` — plain JavaScript, so a `.ts` extension and a `.mjs`
bin can both import it, exactly as `lib/agent-dir.mjs` solved this in U2. Move `displayPath`,
`displayText`, their regexes and `PATH_CAP` into it **unchanged**. `lib/objective.ts` re-exports
them, so every current import keeps working and the T2c goldens stay byte-identical.

Then name the surface renderers — one per surface, each with a one-line contract in its doc comment:
- **prompt / model-visible text** — today's `displayText` and `displayPath`.
- **UI notification and status** — the same rule (the control class already covers `U+001B` (the ANSI escape introducer)); say so
  explicitly, so nobody re-derives it.
- **Markdown read by the seat** — the L5 rule: a path prints inside a code span only when it cannot
  close it, otherwise it is refused and counted. Move `printable()` and the code-span rendering out
  of `lib/adoption.mjs` into here with no behaviour change, and widen its control class to
  objective's, bidi controls included. A widening, never a narrowing.
- **file content we write** — one line per interpolated field, bounded, no control characters.

### 2. Every bypass goes through it
- `nana-post-edit.ts`: the edited path through the path renderer and the failure text through the
  text renderer, in BOTH the notification and the model-visible block. Cap each failure, and say in
  the text when one was truncated. The model must never receive an unbounded, unescaped blob of
  repo-controlled output.
- `nana-handoff.ts`: keep `resolvablePath` — shortening is a different job — but pass its result
  through the path renderer before every interpolation, prompt and notification alike. Replace
  `oneLine` with the text renderer for `writer` and `reason`, in the prompt and in the file we write.
- `lib/adoption.mjs` and `bin/nana-adoption.mjs`: import from the shared module and delete the local
  copies. The two pre-import allow-lists in the bins stay — they must run before any import can fail
  — with one comment each saying why they are deliberately separate.

### 3. Prove it, do not assert it
One table-driven test over EVERY renderer and EVERY hostile input in the failure-mode list, asserting
the rendered result for each. Plus, for each call site changed, one test that a hostile value cannot
alter the STRUCTURE of what the consumer receives: no new line in a notification, no new line or
fenced block in model-visible text, no closed code span in the seat's Markdown, no extra field in the
file we write.

## NOT
- Do not change what `displayPath` / `displayText` DO. Moving them is the point; altering their
  output breaks T2c's audited goldens. If you believe one is wrong, say so in the report and leave it.
- Do not touch the gate's policy decisions, the trust predicate, the objective's parsing or
  precedence, the handoff store location or format, or the adoption predicate's non-display rules.
- Do not add a dependency. Do not add a config key.
- Do not "fix" the two pre-import allow-lists by importing the shared module: they exist precisely
  for the path where that import may fail.
- Do not touch `apps/**`.

## Allowlist
`packages/nana-pack/lib/display.mjs` (new), `packages/nana-pack/lib/objective.ts`,
`packages/nana-pack/lib/adoption.mjs`, `packages/nana-pack/extensions/nana-post-edit.ts`,
`packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/bin/nana-adoption.mjs`,
`packages/nana-pack/README.md`, and tests under `packages/nana-pack/tests/**`.
Must not touch: everything else, in particular `lib/config.ts`, `lib/gate-paths.ts`,
`lib/agent-dir.mjs`, `extensions/nana-gate.ts`, `apps/**`, `docs/reviews/**`.
(The seat checked the NOT-list against the allowlist: no overlap.)

## Constraints
An extension handler must never throw, so every renderer is total: it returns a string for any input,
including `undefined`, a symbol, and an object with a hostile `toString`. Node's built-in type
stripping lets a `.ts` file import a `.mjs`, not the reverse.

## Appetite
`--max-budget-usd 12` · advisory ceiling 8 files / 250 LOC changed excluding tests. On crossing it:
a CHECKPOINT paragraph naming what remains and what it would cost, then continue only if the
remainder is mechanical. A checkpoint is a success, not a failure.

## doneWhen
From `~/nana-pi-wt/s1`: `env -u NANA_HANDOFF npm test` exits 0 with no test removed or weakened, the
objective goldens byte-identical, and new tests covering the table plus one hostile probe per changed
call site.

## Report (40 lines or fewer)
Commits · `env -u NANA_HANDOFF npm test` · for each of the three bypasses the hostile input and the
before/after rendering · the grep proving one implementation of each renderer · the objective goldens
unchanged · residuals · scope check with `git diff --stat` · the one claim most likely wrong ·
`VERDICT: DONE`.
