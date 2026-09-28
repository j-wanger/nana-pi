## Findings

1. **HIGH — stale pointers can lose the required readable path.** `[adversarial]`  
   `packages/nana-pack/extensions/nana-handoff.ts:138-143` truncates the completed pointer at 300 characters. With a 293-character temp `HOME`, the actual store path was 380 characters; the pointer was capped at 300 but contained only a path prefix, so it was not “one read away.” The current test only covers a normal-length home (`packages/nana-pack/tests/handoff-staleness.test.mjs:83`). Use a compact representation such as `~/.pi/agent/handoffs/<hash>.md` and add long-home/custom-path coverage.

2. **HIGH — active repository guidance still directs agents to the obsolete, ignored artifact.** `[compatibility]`  
   `AGENTS.md:102-105` says compaction writes `.pi/handoff.md`, tells agents to update it, and preserves the old human-only deletion rule. Under L3, following those instructions creates or edits a file that is never injected. The generated template is correct, but nana-pi’s own active instructions are not. Fixing this requires an explicit allowlist expansion.

3. **MEDIUM — invariant (g) is implemented contrary to its plain wording.** `[adversarial]`  
   `packages/nana-pack/extensions/nana-handoff.ts:227-236` emits “No handoff for this directory” only when an ancestor store entry exists. With neither an own nor ancestor handoff, the executed probe returned exactly `BASE`. The new test explicitly codifies that silence at `packages/nana-pack/tests/handoff-store.test.mjs:97`.  
   **Ruling:** silence is wrong. Invariant (g) says a nested cwd/worktree with no own handoff *gets* the explicit marker, with the ancestor path added conditionally.

4. **MEDIUM — provenance failure is silently recorded as a successful write.** `[adversarial]`  
   When `getSessionFile()` throws, `packages/nana-pack/extensions/nana-handoff.ts:283-287` writes `Writer: unknown`; `:294` journals only `handoff_written`. The probe did not throw, but the resulting summary lacks invariant (c)’s writing-session provenance and no failure journal explains why. Either decline the write or journal an explicit provenance degradation.

5. **LOW — corrupt UTF-8 is injected as replacement characters and journaled as a normal pickup.** `[adversarial]`  
   `packages/nana-pack/extensions/nana-handoff.ts:193-195` uses Node’s non-fatal UTF-8 decoding. A store containing invalid bytes was injected with `U+FFFD`, did not throw, and produced a successful pickup rather than `handoff_pickup_failed`. A fatal decoder would make corruption degrade explicitly to no handoff.

6. **LOW — the default-store symlink refusal does not pass the subtraction test.** `[scope]`  
   `packages/nana-pack/extensions/nana-handoff.ts:188,278` and `packages/nana-pack/tests/handoff-store.test.mjs:127-134` add policy beyond the brief, which required symlink refusal to remain for **custom paths**. Removing this default-store policy preserves invariants (a)–(g) and avoids rejecting an owner’s intentionally symlinked user-scope store. The `Cwd:` mismatch check at `nana-handoff.ts:199-201` does earn its small cost: it detects copied/corrupt entries and makes the recorded cwd meaningful, even though SHA-256 key collision is infeasible.

7. **LOW — the non-writer role marker leaks to descendants.** `[compatibility]`  
   `packages/nana-pack/bin/pi-review.mjs:102` places `NANA_HANDOFF=off` in the review child’s environment, so any pi or desk process it launches inherits the marker unless it explicitly clears it. Such a descendant silently loses handoff pickup/write apart from journal entries. Only exact lowercase `off` is honored; `0`, empty, `OFF`, and `false` all behaved normally. README documentation of the exact value is adequate, but inheritance should be documented or contained.

## Other review results

- **Scope:** 12 files and +735/−191 exceed the advisory appetite, but 11 files are directly listed by the brief and `config-normalize.test.mjs` is required by the binding L1 ruling. No materially smaller structure avoids the four required new test files.
- **Assertion adaptations:** `handoff-artifact.test.mjs` removes exactly the three `.gitignore` assertions and the deletion assertion with the specified rationale; custom-path behavior remains. `handoff-symlink.test.mjs` retains the custom-path cases.
- **Restricted edits:** `config.ts` changes only `staleAfterDays` field/default/validator/schema. `pi-review.mjs` changes only child spawn environment plus its comment.
- **Attack probes:** repo `Cwd:` spoof text was not injected. A repo symlink to the current keyed store was not dereferenced through the repo path; legitimate store content was independently loaded exactly as it was without the link. Distinct canonical cwds use full 256-bit SHA-256 keys; practical collision work is approximately \(2^{128}\).
- **Store probes:** ten concurrent OS processes produced one complete 50 KB summary with no temp litter. A directory at the store-file path caused no throws and journaled pickup/write failures. Missing and future `Written:` headers fell back to mtime. Unreadable files and malformed config produced journal lines without throwing.
- **Compatibility grep:** desk only reads/writes handoff config fields and preserves unknown leaves through object spread; nana-setup and pack skills do not consume repo `.pi/handoff.md`; the shared template is updated. Historical benchmark fixtures remain stale snapshots, not runtime consumers.
- **Existing artifacts:** active files exist in `~/the-hive/.pi/handoff.md` and `~/basketball-geek/.pi/handoff.md`, plus archived/probe copies. A temp-HOME startup in the-hive injected only the legacy warning and left the file byte- and mtime-identical. Its wording adequately says the repo file was not injected; README supplies the explicit “not migrated” explanation.
- **Win32:** case folding is present; temp-plus-rename is present; the README honestly labels NTFS replacement atomicity unverified. Relevant POSIX-only probes are skipped.
- **Config:** default 7 is present; `0`, `-1`, and `Infinity` reject and fall back correctly, with user/project matrix coverage.

## Residuals

- Win32 rename-over-existing remains unexecuted.
- Arbitrarily long custom paths cannot simultaneously be reproduced in full with age and writer inside a strict 300-character cap; the contract needs a defined compact path representation.
- Corrupt UTF-8 and inherited role-marker behavior are robustness concerns rather than repo-origin injection vectors.

**VERDICT: BLOCK**
