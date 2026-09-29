## Findings

1. **HIGH — `/trust` does not reliably perform the action the label says will clear it**  
   **[compatibility][adversarial]** `packages/nana-pack/lib/objective.ts:313`  
   The common nested-cwd case fails: with `OBJECTIVE.md` at `/repo` and the session cwd at `/repo/src/deep`, pi’s `/trust` records `/repo/src/deep`. `ownerVouched("/repo")` only searches `/repo` and its ancestors, so the label remains after restart. Executed against pi’s real `ProjectTrustStore`: the saved descendant key was present and the candidate producer still labelled the governing file.  
   The remediation should explicitly say to start pi in the displayed objective folder before running `/trust`, or provide another action that records that folder.

2. **MEDIUM — The categorical label wording is false for some intentional fail-closed cases**  
   **[scope][adversarial]** `packages/nana-pack/lib/objective.ts:312`  
   A valid, canonical affirmative store larger than 1 MiB is rejected by `ownerVouched()`, while pi’s real `ProjectTrustStore.get()` returns `true`. The output nevertheless says the owner “has not recorded trust”. Foreign-owned or temporarily unreadable stores have the same epistemic problem. Fail-closed labeling is correct; the wording should say something like “no usable affirmative trust record could be confirmed.” That matches the README’s own explanation: “I could not confirm you vouched.”

3. **MEDIUM — Governing contract documentation remains contradictory and stale**  
   **[compatibility][scope]**
   - `HANDOFF.md:40` says the label is **not implemented** and the decision remains open.
   - `AGENTS.md:15-24` omits the provenance paragraph from the objective contract.
   - `templates/_shared/working-under-nana-pi.md:28-33` omits it from every generated project’s guidance.
   - `templates/_shared/OBJECTIVE.md:8-12` claims the two objective lines are followed directly by program lines, which is no longer always true.
   - `packages/nana-setup/lib/project.mjs:309` calls `OBJECTIVE.md` “the two lines the session-start hook prints.”
   
   These were the same consumer-declaration surfaces T2a deliberately synchronized. Updating them remains within the ≤8-file appetite.

## Verification

- **Scope:** final diff is 3 files, +249/−9; within appetite. No trust gating, precedence change, governing-file change, or parsed-line change found. Every probe confirmed the product file still governs.
- **Trust shapes executed:** folder/ancestor affirmative, `null` fall-through, nearer `false`, BOM, symlinked store, directory, mode 000, FIFO, >1 MiB, trailing-slash/case-different/relative/`~` keys, canonical and non-canonical cwd. No unusable store suppressed the label.
- **Runtime parity:** CLI and pi output were byte-identical across all custom trust-shape cases, including labelled and unlabelled cases.
- **Spoofing:** objective text, filename, directory name, and crafted `projectFile` could not create or suppress a real label; control-bearing paths were escaped. Both label paths pass through `displayPath()`.
- **Canonical keys:** rejecting hand-written non-canonical keys is correct pi parity. Pi canonicalizes keys when `/trust` writes them and performs exact lookup afterward.
- **Real repos:** with no real `~/.pi/agent/trust.json`, the candidate labels both `~/aml-desk` and `~/the-hive` while continuing to make their objectives govern. That is correct under the affirmative-record-only rule; `the-hive` also still explicitly marks its objective DRAFT.
- **Risk acceptance:** `packages/nana-pack/README.md:556-562` plainly says the label is “defence in depth, NOT a security boundary,” that a model may follow attacker text, that sol recommended trust-gating, and Jake deliberately accepted the residual. It does not materially overclaim.
- **Tests:** objective golden corpus: 524 pass, 0 fail. A full run under the mandated synthetic HOME hit two unrelated handoff tests; both failures reproduce on main under that HOME. The seat’s normal-environment run remains 71 files / 3908 checks / exit 0.

## Residuals

- Foreign ownership was exercised through the actual `fstat().uid` branch with a mismatched process UID; creating a genuinely foreign-owned temp file was unavailable without privilege.
- The unlocked trust-store read can transiently label during a concurrent pi write, but only in the fail-closed direction.
- The size cap is checked before `readFileSync`; concurrent file growth is not strictly byte-bounded.

**VERDICT: BLOCK**
