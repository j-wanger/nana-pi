SCORE: 7/10

The centralization is sound, and the three repaired paths have credible adversarial evidence. I do not approve landing this HEAD unchanged: the handoff continuity regression is silent and undeclared, and the claimed pack-wide invariant overlooks the gate’s approval display.

I reviewed `c7b60c4..d52fd37`, including the seat’s follow-up. The review documents were absent from this worktree; I read them under `/Users/jwang/nana-pi/docs/reviews/s1-2026-09-29/`. I accept the supplied executed evidence and 5078-check suite result without rerunning them. No files changed.

## 1. Boundary: fields versus payload

**The distinction is correct; the framing is not a security boundary.**

A `Writer:` value must not manufacture a `Written:` field. A displayed filename must not manufacture another notification or heading. Those are structural promises the renderer can enforce.

The handoff summary is intentionally multiline, agent-written background content. Flattening it through `fileField` would destroy its purpose without preventing semantic prompt injection. Keeping it raw behind provenance and authority framing is an acceptable continuation of the existing handoff contract.

However:

- Agent-written does not mean uncontaminated by repository instructions.
- The framing cannot prevent the body from contradicting or imitating authority.
- The actual cap is **8000 UTF-16 code units**, not an 8 KB byte bound.
- The README’s “every repo-controlled string” assertion must explicitly exclude payload bodies and structured serialization. Otherwise it promises something the implementation deliberately does not provide.

This lane earns **structural protection for interpolated fields**, not “sanitized model context.”

## 2. `Cwd:`: safe refusal, unacceptable silence

`extensions/nana-handoff.ts:466` now serializes a rendered value, while `:358` compares it with the original canonical directory. This is a persistence-contract change, not merely presentation.

**I approve preventing header forgery. I do not approve silently promising continuity that cannot work.**

“Fail closed” is narrowly honest: the default-store identity check rejects a mismatch rather than injecting an ambiguously identified summary. It is misleading if used to imply satisfactory degradation. The extension reports a successful write, then subsequent fresh sessions silently omit that summary. The journal records the mismatch, but ordinary users receive no explanation.

Two qualifications matter:

- The artifact remains on disk; this is loss of automatic pickup, not destruction of the summary.
- Custom `handoff.path` skips the `Cwd:` comparison, so the regression is not universal.

A versioned lossless encoding can wait. An explicit, safely rendered warning and an accurate consumer-facing limitation cannot. Do not restore raw header interpolation, and do not compare two lossy rendered directory names.

## 3. What still speaks the old contract

### Missed within nana-pack

**`extensions/nana-gate.ts:282–285` interpolates `truncate(subject, 400)` directly into the approval dialog.** For edit/write, `subject` is the path. A repository filename containing newline, ESC or bidi controls therefore still reaches a person’s authorization surface without the shared renderer. Truncation is not sanitization.

The gate’s diagnostics use `displayText`; its approval subject does not. The brief’s trace established the former and missed the latter. This is source-established, not a newly executed exploit.

The worker correctly respected the prohibition on editing this file. The seat must now authorize a narrowly scoped presentation change; no gate-policy change is necessary.

### Elsewhere in this repository

- `packages/nana-knowledge/lib/query.ts:45–47` retains its narrower `clean()` rule. `lib/hook.ts:93` directly interpolates titles, display paths and snippets. This is another model-visible field surface, not covered by S1.
- `packages/nana-setup/claude/hooks/nana-objective.sh` interpolates `$cli` into its failure marker. Successful objective production benefits from the shared implementation; that shell failure path does not.
- `apps/desk/public/app.js` shortens paths independently and places workspace labels into DOM text. `textContent` prevents HTML interpretation, but does not establish the bidi/control-character display contract. **Apps were explicitly excluded; their migration is not a prerequisite for this lane.**

### Outside this repository

Existing consumers importing `objective.ts` receive the moved implementations through the re-export. Consumers that copied renderers, build strings themselves, or run an older installed checkout receive no such guarantee. No external census was supplied or performed; I cannot certify those consumers as migrated.

## 4. Seat decisions

- **Plain `.mjs`: approve.** This is a shared runtime leaf used by JavaScript bins and TypeScript extensions, not an arbitrary language island. It avoids imposing a TypeScript-loading requirement on those bins.
- **Two pre-import allow-lists: approve.** Their independence is required by the import-failure path. Keep them tiny and restricted to diagnostic labels.
- **Markdown refusal: approve for this advisory surface.** Losing an adoption hint costs less than rendering a forged claim. Refusal is a policy choice, not proof that safe alternative Markdown representations are impossible.
- **Refusal observability needs qualification.** `nana-handoff.ts` checks `printable(root)` before journaling adoption candidates. Consequently, some refused roots never reach the reader’s refusal counter. “Refused and counted” is not an end-to-end guarantee.
- **Three LOW fixes before ruling: approve.** Command truncation disclosure, the code-span cap, and corrected locator wording are bounded improvements with tests. They do not compensate for the continuity regression or missing approval surface. The README still quotes the old locator wording.

## MUST:

1. **Make unsupported default-store CWDs observable and declare the compatibility change.** Warn safely when a write cannot subsequently pass identity validation; document affected directories and retained-artifact behavior in `packages/nana-pack/README.md`. Add a test asserting the warning, not merely asserting non-pickup. Lossless versioning may remain deferred.

2. **Close the gate approval-path bypass.** Authorize the minimal display-only change in `extensions/nana-gate.ts`, preserving raw inputs for policy evaluation and execution. Test hostile path/control input at the dialog boundary without changing gate decisions.

3. **Correct the upstream-contract declaration.** Scope the README guarantee to interpolated display fields, name intentional payload/serialization exceptions and external exclusions, and update the locator explanation. Do not declare a repository-wide or ecosystem-wide migration.

## CARRY:

- **High consequence:** knowledge-pointer rendering remains an independent model-visible bypass; assign a follow-up rather than treating S1 as closure.
- **Medium:** versioned, lossless `Cwd:` serialization restores automatic continuity without sacrificing identity.
- **Medium:** adoption refusals need recoverable identity or operator discovery; counting alone is insufficient, and producer-side omissions currently escape counting.
- **Medium:** desk path-display parity and copied/external consumers require their own surface audit.
- **Low:** consolidate duplicated escape-token logic only without changing audited `displayPath` semantics; add the missing bootstrap comment and repair the shell fallback separately.

The patch materially improves consistency and removes demonstrated forgery paths. The blockers are not speculative renderer refinements: they are an undeclared availability regression and a missed authorization display carrying the same hostile strings.

VERDICT: BLOCK
