You are a careful senior engineer and data analyst working headless for Jake Wang's nana program. Terse reporting; every number reproducible by a command you name. A null or unresolved result is a real result. Never end your turn while a command you started is still running.

# Worker brief — lane S1, land-ruling round (astra BLOCK 6/10 → three MUSTs)

Worktree `~/nana-pi-wt/s1`, branch `lane/s1-sanitization` (HEAD `d52fd37`). Read
`docs/reviews/s1-2026-09-29/s1-astra-land.md`. sol landed your work at 8/10 with no MUSTs; the land
ruler approved the centralization and then found two things neither of us did: an availability
regression you introduced and declared honestly, and a surface the seat's trace missed.

This is the last round. After it the seat lands or subtracts.

## MUST 1 (HIGH) — the Cwd continuity loss must be observable, and declared
`extensions/nana-handoff.ts:466` serializes a RENDERED `Cwd:` while `:358` compares it against the
raw canonical directory. astra approves refusing the forgery and refuses to approve the silence: the
extension reports a successful write, and then later sessions in that directory silently get no
handoff. The artifact stays on disk; what is lost is automatic pickup. A custom `handoff.path` skips
the comparison, so this is not universal.

- At WRITE time, when the rendered `Cwd` will not equal the canonical one AND the default store is in
  use, say so: a UI notification and a journal event, both through the shared renderers. The person
  must learn it at the moment it happens, not by noticing an absence days later.
- Say what is true: the summary was written to `<path>`, and this session's directory name contains
  characters that cannot be recorded losslessly, so a future session here will not pick it up
  automatically.
- Document it in `packages/nana-pack/README.md`: which directories are affected, that the artifact is
  retained, and that a custom `handoff.path` is not affected.
- **Test the warning**, not only the non-pickup. astra's words: "Add a test asserting the warning,
  not merely asserting non-pickup."
- Do NOT restore raw header interpolation, and do NOT compare two lossy rendered names. A versioned
  lossless encoding is explicitly deferred.

## MUST 2 (HIGH) — close the gate's approval-dialog bypass
`extensions/nana-gate.ts:283` builds the approval prompt with `truncate(subject, 400)`. For an edit
or write, `subject` is the path. So a repository file whose name holds a newline, the ANSI escape
introducer or a bidi control reaches **the dialog a person uses to authorize the call**, unrendered.
Truncation is not sanitization. The gate's diagnostics already use `displayText`; its approval
subject does not. My trace established the first and missed the second.

**Display only.** The raw `subject` must keep flowing to `commandHit` / `pathHit` and to everything
that decides or executes; only the string shown to the person changes. A command subject is text
(the text renderer), a path subject is a path (the path renderer) — the call already knows which it
is via `isCommand`. No gate decision, pattern, precedence or fail-closed path may change.
Test hostile input at the dialog boundary AND assert the decision is identical to today's.

## MUST 3 (MEDIUM) — the declaration must match what the lane actually guarantees
`packages/nana-pack/README.md` claims more than the code does. Scope it precisely:
- The guarantee is **structural protection for interpolated display fields**: a repo-controlled value
  cannot add a line, a heading, a fence, a field or a closed code span to what a consumer receives.
- It is **not** "sanitized model context". Name the intentional exceptions: the handoff summary BODY
  is payload, injected raw behind its provenance and authority framing, capped at 8000 UTF-16 code
  units — say code units, not "8 KB".
- Name what is out of scope: `apps/**`, `packages/nana-knowledge` (its own `clean()` in
  `lib/query.ts` and the direct interpolation in `lib/hook.ts:93` are a separate follow-up), the
  shell fallback path in `nana-objective.sh`, and any external consumer that copied a renderer or
  runs an older installed checkout.
- Fix the locator wording the README still quotes from before the seat's correction.
- **One more honesty fix astra found:** `nana-handoff.ts` checks `printable(root)` before journalling
  an adoption candidate, so some refused roots never reach the reader's counter. "Refused and
  counted" is not end-to-end. Say so wherever that phrase appears.

## NOT
- Do not change `displayPath` / `displayText` semantics — audited, unchanged, and the objective
  goldens depend on them.
- Do not change any gate DECISION: no pattern, precedence, fail-closed or headless behaviour.
- Do not touch `packages/nana-knowledge`, `apps/**`, or the desk.
- Do not build the versioned lossless `Cwd:` encoding. Do not consolidate the duplicated escape-token
  logic (both are carried).

## Allowlist
`packages/nana-pack/extensions/{nana-handoff.ts,nana-gate.ts}` (the dialog string only),
`packages/nana-pack/README.md`, and tests under `packages/nana-pack/tests/**`.

## Appetite
`--max-budget-usd 12` · 4 files / 150 LOC excluding tests.

## doneWhen
`env -u NANA_HANDOFF npm test` exits 0, with tests for: the write-time warning when the cwd cannot be
recorded losslessly (the warning itself, and that a custom `handoff.path` does not warn); a hostile
path and a hostile command at the gate's approval dialog, rendered, with the resulting DECISION
byte-identical to today's; and the objective goldens still unchanged.

## Report (30 lines or fewer)
Commit · the warning as the person sees it · the dialog before and after for a hostile path, with
the decision proof · `env -u NANA_HANDOFF npm test` · `git diff --stat` and the scope statement ·
residuals · the one claim most likely wrong · `VERDICT: DONE`.
