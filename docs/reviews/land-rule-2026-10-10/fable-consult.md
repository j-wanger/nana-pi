# Fable consult — the land-rule plan, 2026-10-10 (seat adversarial consult; Fable 5.1)

*Fable challenged the first draft of `CHANGE.md`. The seat adopted every point: records go in before the final round, the HANDOFF stub goes, R-1002 became an allowlist, the README states the honest limits, the blast radius is named. The plan now reflects the revised draft.*

**Verdict: CHANGE.** The coverage rule is sound; the records workflow and two scope gaps are not.

**1. Does the coverage rule enforce Jake's rule?** Mostly yes. Different-branch, `+snap:`, stale-LAND-for-later-tip and wrong-item are already refused by the existing checks (ancestor test, SHA regex, strict `verdict === "LAND"`). Merge commits are correctly uncovered, which means every "merge main into lane" commit needs a round on the post-merge tip. Three real holes remain:
- **Narrow reviews.** A LAND from an over-cap "narrow land round" (five such overrides in the ledger this week) is recorded against the full revision. nana-land will treat a diff-scoped confirmation as acceptance of everything since main. Residual to declare, not fix here.
- **Independence is unchecked.** The ledger records `launcher`, `role`, `model`; nana-land reads none. All 268 rounds are `pi-review` with sol/astra, so practice is fine, but the rule as built is "a LAND exists", not "an independent reviewer accepted". Cheapest honest fix: README states independence is roster convention, not a helper check. Optional: pin `round.model` to the reviewer roster.
- **nana-land is not the only path to main.** The main checkout has no hooks; origin has no branch protection. `git commit` on main plus push bypasses everything. Reflog shows every recent landing was an ff merge, so this is a convention hole, not an active one. Say so in the README.

**2. Records workflow.** Not workable as written, and it regresses current practice. The ledger shows the seat already gets a LAND round on record-only commits (`hardening-worker-pull` LAND at 1b85302 and 5b68a91, both docs-only). "Record rides the next change" leaves HANDOFF on main one change stale and, at project end or a long pause, never lands. Cleaner: the ledger is already the authoritative record outside git; drop the `HANDOFF Landed:` stub from nana-land output (HANDOFF.md has zero such lines today); write session notes into the lane before the final round; the final round's `--out` lives outside the tree. What remains post-land is nothing. If Jake wants the narrative on main, a sol docs round is the existing cheap path. Also unstated: the confirmation round on the final tip is routinely round 4+, so the plan must name the standard over-cap reason text or the cap fights the rule.

**3. Rows.** R-976 rewording is good. R-1002 as written ("every other option that would replace") is open-ended and untestable. Narrow it to an allowlist: "shall accept only --tree, --main, --suite and --reviewed and refuse any other option by name before running git." The parser already does this; the row gives the `--exempt` mutation test a home. Note the LAND-WITH-FIXES test pins existing behaviour, not a change.

**4. Blast radius the plan misses.** `~/.local/bin/nana-land` links to the main checkout, so the rule governs nana-agent-loop (and every repo) the moment this lands, before their AGENTS.md refresh. State it. CI release only tags, no commits: unaffected. R-981's README test patterns must survive the rewrite; the "reported exactly, not blocked" sentence flips and has no pin today.

**5. Factual.** "The seat has been landing post-review fixes and docs this way" is at best half true: the ledger shows confirmation LAND rounds on e9ecc90, 1b85302, 5b68a91. I cannot see nana-land invocations, so `--exempt` use is inferred, not shown.

**Single change I'd insist on:** replace "record rides the next change" with "nothing is written after the land": subtract the HANDOFF stub, keep the ledger as the record, session notes go in before the final round.

**Claim most likely wrong:** that the seat never used `--exempt` recently. Only the shell history would show it.