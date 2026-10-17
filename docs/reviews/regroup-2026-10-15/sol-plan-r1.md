## Findings

1. **MUST — Nested mapping-field typos can silently produce an approved wrong tree.** `CHANGE.md:50` rejects unknown top-level and `regroup` keys, but not unknown capability, feature, or subgroup keys. For example, an agent editing an emitted feature can add `statsu: "frozen (...)"` while leaving its existing `status: "active"`. The lift ignores `statsu`, the checker passes, and the owner receives and applies the wrong lifecycle status. This is realistic under the stated field-typo threat model. Require exact recursive mapping schemas and add a named mutation for each node level.

2. **MUST — Multi-target share review cannot record mixed outcomes honestly.** R-1175 requires exactly one verdict per row and permits a share target list, while `refuted` and questions identify only the row. If a reviewer proposes sharing one row with FEAT-007 and FEAT-008, and the proposal carries one but refutes the other, the checker cannot bind the reason or outcome to either target. R-1179 therefore cannot reliably report whether each share is carried, refuted, or asked. This is a realistic consequence of Jake’s multiple-feature ruling and can lead him to approve the wrong share. Key review outcomes by `(row, target)`.

3. **MUST — The plan explicitly excludes two failures that the brief places in scope.** `CHANGE.md:30` declares grouping quality “out by nature,” while the threat model includes invented reasons and purposes drifting from their rows. The structured review covers row placement, moves, and shares, but does not require review verdicts for heading purposes, outcomes, or each old-section reason. A plausible but false purpose or reason can therefore pass every check and become the product tree later work follows. Add structured, counted review coverage for these claims; semantic judgment need not become deterministic.

4. **MUST — An honest `--out` collision can destroy an input.** R-1171 permits any output path. A run with `--proposal regroup.json --out regroup.json`, or `--out REQUIREMENTS.md`, passes all checks before overwriting the proposal or ledger with Markdown. That is realistic operator variation and causes data loss. Refuse output paths resolving to the ledger, proposal, or another input, and test both direct and symlink aliases.

5. **SHOULD — The packet does not yet substantiate Jake’s “Short package” ruling.** The plan calls the precedent a 15–20-minute packet but estimates aml-desk’s pre-appendix material at 10,000 words and 42–60 minutes. Its appendix alone contains roughly 17,700 requirement words according to the supplied fact-check. Set a bounded owner-reading budget and make the rehearsal enforce it, rather than merely recording it.

6. **SHOULD — A failed regeneration leaves an actionable stale packet.** `CHANGE.md:226` accepts that an earlier page survives failure. An automation or owner opening the named output afterward can review the prior proposal. Remove or clearly invalidate the derived page before a failed run returns; add a test starting with an existing output.

7. **SHOULD — The token estimates are not reproducible from the stated method.** Section 6 says approximately four characters per token, but 450 KB becomes 0.45M tokens without showing the repeated-read multiplier. Report raw input tokens and estimated billed tokens separately, including drafter, reviewer, skeptic, and critic rereads.

The line-keyed lift report, existing-proof preservation, identity coverage, named requirement tests, and same-family disclosure are otherwise well planned.

VERDICT: SEND-BACK
