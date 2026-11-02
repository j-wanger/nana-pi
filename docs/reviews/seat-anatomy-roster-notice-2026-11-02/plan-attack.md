## Attack

1. **MUST — O2 contradicts M2 and preserves an unsupported guess.**

   **Evidence:** `plan.md:24,55,58` retains preceding-hook attribution but requires `hook-other` when no JSON-output success exists. `apps/bench/lib/anatomy-seat.mjs:154–156` accepts a missing invocation ID as correlation.

   **Probe:** An objective success followed by commandless context with no invocation ID attributes both parts to objective. The additional six characters should remain unresolved under M2.

   **Fix:** Remove adjacency-only attribution for commandless SessionStart context. Amend R-3640 and its existing tests accordingly. Test missing, equal and differing invocation IDs; differing IDs alone let the unsafe fallback survive.

2. **MUST — Empty content plus non-empty stdout does not establish a JSON-output producer.**

   **Evidence:** `plan.md:16` makes this inference without validating it. The actual producer’s structured-output contract is established by `packages/nana-setup/claude/hooks/nana-roster-notice.mjs:59–63`; its public label comes from `packages/nana-setup/lib/settings.mjs:210`.

   An empty or newline-only plain-text hook can satisfy the proposed shape. A sole such objective success would wrongly claim unrelated additional context. Conversely, harmless recording differences must not turn ordinary hooks into competing JSON producers. Failed hooks are explicitly in scope but absent from M1–M3.

   **Fix:** Ground producer eligibility in the imported public label and known output contract, not merely output lengths. Keep unknown producers conservative. Add cases for empty/plain stdout, trailing-newline differences, failed `hook_non_blocking_error`, and foreign competitors. Describe the requirement as attribution behavior, not a supposedly reliable “JSON-output” detector.

3. **MUST — Attribution can succeed and then lose its payload during deduplication.**

   **Evidence:** `apps/bench/lib/anatomy-seat.mjs:190–196` independently removes additional context when any eligible success contains its text. Missing invocation IDs broaden those candidates. Nothing checks the newly attributed producer.

   **Probe:** Empty roster success, objective content `notice objective`, then commandless `notice` without an invocation ID: the six-character additional part disappears. A new roster attribution alone would not prevent this.

   A1’s future-envelope claim also overstates existing support: the configured envelope is top-level `additionalContext`, while the actual producer nests it under `hookSpecificOutput`.

   **Fix:** Make attribution and dedupe share a resolved producer relationship. Do not dedupe against another hook merely because its content overlaps. Add a tagged R-3643 regression asserting retained roster characters, unchanged objective characters and conserved totals. Pin ambiguity once, including missing-ID cases that could otherwise trigger both passes.

4. **MUST — O1 leaves ordering behavior unresolved, and M1 does not prove window ownership.**

   **Evidence:** `plan.md:23` permits push-time attribution despite position variation being in scope. A second candidate appearing after the additional entry would make a push-time “unique” decision wrong.

   The suffix-less entry does reach the current window when uninterrupted: `sessionHook` recognizes it, and `boundaryOf` treats it as a start signal (`anatomy-seat.mjs:33–34`). But after a closing event, `:133` opens a new segment with start `unknown`.

   **Probe:** The real-shaped uninterrupted sequence produces one compact segment. Inserting an assistant before the additional entry produces two segments: compact and unknown, with the additional context in the latter.

   **Fix:** Resolve attribution after collecting the complete eligible group, or require equivalent deferred validation. Add reordered-candidate tests and closure tests. Pin segment count, start type, phase and attribution; explicitly require conservative non-attribution across a closed window rather than silently broadening correlation.

5. **SHOULD — A4 needs reproducible provenance, not merely a transferred Markdown file.**

   **Evidence:** `plan.md:19` cites `r1-counts-run.txt` as the method, but that file contains only “counts regenerated: 14 sessions, 72 segments.” Live transcripts may change between runs, invalidating the requested exact decrease against old counts.

   The report pipeline needs no new roster vocabulary: `REPORT_PARTS` already includes it, and `anatomy-slots.mjs:24–29` dynamically emits kinds in alphabetical order.

   **Fix:** Run baseline and candidate against the same frozen input set on the Mac. Record code revisions, invocation, counts-only denominators and artifact checksum. Transfer only sanitized output, then include its commit in final review coverage. Generate tables by kind names, not positional indexes.

### Test discrimination

- **M1** catches current main and nearest-preceding-hook attribution.
- **M2** catches unconditional roster assignment, but must include missing/equal IDs to catch O2.
- **M3** catches payload-keyword attribution only if mutations have distinct asserted outcomes. It currently misses dedupe deletion and label-independent attribution; add overlap and label-swap cases.

The planned file list reports **ordinary**. All probes used synthetic system-temp files and removed them; no repository files changed.

**Counts: 4 MUST, 1 SHOULD.**
