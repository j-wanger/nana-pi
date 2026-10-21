# cap-kinds — plan attack and placement test (2026-10-21)

## Placement test (seat's pre-agreed rule: stage agreement must beat intent agreement by 15 points, or no regroup)

Two independent agents (two model sizes) placed the 20 most recent live rows of one product into its intent tree and its stage tree, with every row's home hidden and no row ID in either tree. Result:

- Capability level: intent 100% (kappa 1), stage 100% (kappa 1); each tree used 3 capabilities.
- Feature level: intent 95%, stage 95%.
- Confidence: intent clear: 29, close call: 11, no good home: 0; stage clear: 27, close call: 13, no good home: 0.
- Reading: stage placement did not beat intent placement, so no project is regrouped; existing trees gain the fields in place. Limit: the 20 recent rows fell into only three capabilities in each tree.

## Adversary (lane A), verbatim

AMEND. The checker grammar is sound and additive for every tree on this machine. Five things need fixing before a builder starts:

1. The CAP `Status:` line, as specified, breaks the lift and the regroup.
2. The outline placement would break fixed line offsets.
3. Deliverable statuses in the outline add churn to every lane.
4. R-2440 is vacuous as written, and R-2448 belongs to another feature.
5. The field grammar leaves about ten builder-decided cases open.

Paths: S = <repo>/scripts, T = <repo>/packages/nana-pack/tests. My probe fixtures are in <scratch> (f1, f2, f4, scan.mjs, hist.mjs).

(1) Verdict: AMEND

What I ran confirms:
- A ledger with `Kind:`, `Deliverables:` and `Binds:` lines passes today's checker. The identity lift dry run passes it with a clean proof (f1).
- The same ledger with a CAP `Status: active` line passes the checker, but the lift refuses it with "line 20: carried prose starts with a field label ("Status:")" (f2).
- None of the tree ledgers I scanned has a line under a capability starting with Kind, Needs, Binds, Deliverables, Retired or Status. I scanned nana-pi, another local project's ledger and its worktrees, and the general seed.
- Today's renderer reproduces the committed outline exactly at c4332ecb, 4b3846ec and 5548d4c2 (current main).

(2) Each must-meet test

R-2440 (additive)
- Vacuous as written: it passes on today's code, so it does not fail when the feature is removed.
- It mostly repeats existing pins:
  - R-288 (real ledger has no problems).
  - R-291 (committed outline equals render).
  - R-1027 (`validateStore` accepts the real repository, which already re-checks the ledgers at c4332ecb and 4b3846ec).
  - R-1150 (rendered templates pass the checker).
- The outline byte-identity clause is the only new guard.
- Proposal: cut R-2440 and fold that clause into R-2446. Test it against `git show <c>:docs/requirements-tree.md` for c4332ecb, 4b3846ec and 5548d4c2. Do not use the ref "main", which moves. CI already fetches with depth 0.
- Wrong-code pairs this must catch: a required `Kind`, and a placeholder `Kind: —` line on every capability.

R-2441 (kind)
- Not vacuous. The row is the right width if the test also asserts that both legal values pass.
- Rewording: "WHEN a capability's own span (its heading to the next heading of any kind, outside code fences) holds a `Kind:` line whose trimmed value is not exactly `product` or `constraint`, or more than one `Kind:` line, the tree checker shall report a problem naming the line, the capability and the value."
- Add a negative clause to the same test: a `Kind:` or `Needs:` line in a feature or subgroup span, and `Needs:`/`Binds:`/`Deliverables:` on a capability with no `Kind:`, raise nothing (see 5b).

R-2442 (deliverables)
- Not vacuous. The row is wider than a likely test unless every clause gets a case:
  - missing ID
  - malformed token
  - retired row
  - row homed under another capability
  - listed twice
  - on a constraint capability
  - homed in a feature (passes)
  - homed in a subgroup (passes)
  - untested or planned (passes)
- Rewording: "WHEN a capability with `Kind: product` carries a `Deliverables:` line, the tree checker shall report a problem naming each token that is not the ID of a non-retired row homed in a feature, or a feature's subgroup, under that capability, or that the line lists twice, and none for an `untested` or `planned` row; a `Deliverables:` line on a `Kind: constraint` capability is a problem."

R-2443 (binds)
- Not vacuous. "Never itself or a constraint CAP" is redundant, because a constraint capability that binds itself already fails "names a product CAP".
- Rewording: "WHEN a capability carries `Kind: constraint`, the tree checker shall report a problem unless it carries exactly one `Binds:` line whose every comma-separated token is the ID of a non-retired `Kind: product` capability; a `Binds:` line on a `Kind: product` capability is a problem."
- The test must include: `all`, a constraint target, a capability with no `Kind:` as target, a retired target, a missing `Binds:` line, and an empty `Binds:` line.

R-2444 (needs)
- Not vacuous. The row omits `Needs:` on a constraint capability. The test must use a three-capability cycle, because a two-cycle-only detector would pass a two-cycle test.
- Rewording: "WHEN a capability with `Kind: product` carries a `Needs:` line, the tree checker shall report a problem naming each token that is not the ID of another non-retired `Kind: product` capability, and one problem naming every capability on each cycle the Needs links form; a `Needs:` line on a `Kind: constraint` capability is a problem."

R-2445 (retire)
- Not vacuous. As specified it is harmful (see 4a). It needs one of these changes:
  - (a) Rename the field, for example `Retired: CAP-09[, CAP-10]`, where presence means retired. This also fixes the single-successor grammar, since amendment 5 says "successors". Rewording: "WHEN a capability carries a `Retired:` line, the tree checker shall report a problem unless every token names another existing capability with no `Retired:` line, and shall report each feature under it whose Status is not `retired (...)`."
  - (b) Keep `Status:` and teach the lift writer, both mapping builders, the independent proof and the regroup's closed key list. That is a medium-to-large second lane.
  - (c) Defer R-2445 to the regroup lane, which is the first lane that retires a capability.
- My recommendation: (a), or (c) if the owner accepts a deferral.

R-2446 (outline)
- Not vacuous. Two changes:
  - Place the new lines after the Parent/Rows/IDs line (see 4b).
  - List deliverable IDs only, without statuses or gap labels. Statuses in the outline mean every status flip of a deliverable row makes the committed outline stale, which is new churn in nearly every lane. The gap display already belongs to Lane B's R-2450.
- Rewording: "WHEN a capability carries a `Kind:`, `Needs:`, `Binds:`, `Deliverables:` or `Retired:` line, `docs/requirements-tree.md` shall list each value on its own line after that capability's Parent line, and a capability with none of them shall render exactly the lines it rendered before."
- The test must include the independent field check catching a dropped new line.

R-2447 (moves)
- Not vacuous if the fixture has a capability change and no row change.
- Rewording: "WHEN a feature present at both revisions sits under a different capability at HEAD, or a capability present at both carries a different Kind, Needs, Binds, Deliverables or Retired value (compared as parsed lists), the tree movement command shall print a capability section naming each, even when no row changed; with neither, its output shall equal its earlier output byte for byte."
- The plan must also say whether new or removed capabilities count, and what the first line says when only capability changes exist.

R-2448 (docs)
- Unfalsifiable as written. "Describes the five amendments" can only be checked by phrase.
- It also crosses features:
  - The skill-text rows R-1154 and R-1180 live in FEAT-032.
  - The organization-text row R-1153 lives in FEAT-014.
  - A lane is one feature.
- Either cut it and report the text as written but not pinned, or ask the owner for a FEAT-032 row. Narrow rewording: "The requirements skill and the shared organization seed shall each name the `Kind:`, `Deliverables:`, `Needs:`, `Binds:` and `Retired:` lines and say every one is optional." Test it by reading the seed file directly, so it does not depend on copier.

Count: the plan has 9 rows. Cutting R-2440 and R-2448 and adding the lift test gives 8.

(3) Missing tests and cuts

Missing, the lift test: "WHEN a REQUIREMENTS.md that passes the tree checker carries every new capability field line, the lift's dry run with no mapping shall exit 0 with a clean proof and keep each line byte-identical under the same capability."
- With the `Status:` label it fails today (f2), so it is a real must-meet test.
- With a renamed label it is a guard. Its wrong-code pair is adding the new labels to the lift's field-label refusal or to its field-block reader.

No second test is needed if R-2441 carries its negative clause.

Cut: R-2440 (folded into R-2446) and R-2448 (moved to FEAT-032 or cut).

(4) Hidden breakages

a) CAP `Status:` and the lift and regroup
- S/requirements-lift.mjs:161-173 counts only `Purpose:` and `Outcome:` as a capability's field lines.
- S/requirements-lift.mjs:228-229 refuses any other line starting `Purpose:`, `Outcome:` or `Status:`.
- That refusal runs before mapping handling (:1049). The regroup spawns the lift with `--mapping` (S/requirements-regroup.mjs:850).
- Result: any ledger with a capability `Status:` line can never be lifted, verified or regrouped. Retiring happens inside a regroup, so the field defeats itself.

b) Outline offsets
- S/requirements-tree.mjs:354-364 (`checkOutlineFields`) reads a capability's detail line at title+2.
- T/requirements-tree.test.mjs:47 (`treeAccounting`) and :112 (the parent-count check) hard-code +2 for capabilities.
- Inserting lines between Purpose and Parent breaks all three as soon as nana-pi's own ledger gains a `Kind:` line, even though fixtures pass.
- Fix: render the new lines after the detail line and extend the field check. Also keep the outline header text unchanged (S/requirements-tree.mjs:268), or byte-identity fails.

c) Regroup and lift after kinds exist (verified with f1 mappings)
- Moving a deliverable's feature to another capability leaves the old `Deliverables:` line behind as prose.
- Merging two kinded capabilities produces two `Kind:` lines and a self-binding `Binds:` line.
- Today both lift with "tree check 0 problems". After Lane A, the lift's own output tree check refuses them, and the regroup's closed key list (S/requirements-regroup.mjs:43) cannot edit those lines.
- The regroup page shows only Purpose and Outcome (:659-660), so the owner never sees kinds while reviewing.
- The skill must say: strip these lines before a regroup that moves features, then re-add them. Record this as a residual.

d) Flat-ledger lift (verified, f4)
- A flat ledger's top-level section prose line `Needs: a database...` becomes capability prose after the default lift, which passes today.
- If `Needs:` is checked on a capability with no `Kind:`, a ledger that lifts today is refused after the lane.
- Fix: `Kind:` switches the checks on (see 5b).

e) Pinned skill text
- T/templates-render.test.mjs:644-645 needs "The project owner decides every change to the tree", "the table of the feature it serves" and the carve sentence. It forbids naming the owner in that sentence.
- :685 requires exactly one paragraph holding the regroup command.
- :722 takes every paragraph matching /\blift\b/i and requires each flag in it to exist in the lift source. `--base` and `--check` are absent there, so a new paragraph mentioning "lift" next to a bare `--base main` fails R-1169.
- Path claims in the skill are judged against rendered scaffolds (:780, through T/skill-claims.mjs). A backticked `docs/requirements-tree.md` is a path claim (I ran it), and scaffolds have no such file, so it fails.
- R-1153 (:387) needs "capability → feature → subgroup" kept verbatim in the organization seed.

f) Counts and CLI output
- T/requirements-tree.test.mjs:28 and :331 pin exactly 68 headings. Put the new rows in FEAT-028's existing table, not in a new subgroup.
- R-1157 pins the `--root` stdout exactly (S/requirements-tree.mjs:463). Add no capability count.

g) Moved report
- The early return at S/requirements-moved.mjs:140 hides any capability-only change.
- The `@outputs` header at :6 and requirements-tree's `@errors` header must change, then the code map must be regenerated.

h) Seeds
- If CAP-90 in templates/_shared/requirements-general.md gets `Kind: constraint`, it needs `Binds:` naming the draft CAP-01, which is fragile.
- The lift reads only label, purpose and outcome from the seed (S/requirements-lift.mjs:122-124).
- The plan should say: no `Kind:` lines in any seed in this lane.

i) Rulings file
- T/rulings.test.mjs:212-245 requires one dated bullet, with none of the owner-identity words the test bans and no model name.

j) Not covered by the plan
- nana-pi's own REQUIREMENTS.md sections "How this file is organized" and "What checks it" (which lists R-287 to R-294) describe the format. The plan does not update them.

(5) Grammar ambiguities, with the default I'd pin

a) Span and placement
- Read the fields anywhere in the capability's own span: heading to next heading of any kind, outside fences, same as `Outcome:`. No placement rule.
- A field below a non-tree subheading is not read.
- The plan's "after Purpose/Outcome" wording invites a placement check nobody tests.

b) Which capabilities are checked
- `Deliverables:`, `Needs:` and `Binds:` are read and checked only on a capability carrying `Kind:`. On other capabilities they are prose.
- Needs and Binds targets must be `Kind: product`. A capability with no `Kind:` is not a product.
- Labels are never read in feature or subgroup spans. That covers a CAP with no Kind, Needs on a CAP with no kind, and the f4 case.

c) Duplicates
- A second line of any new field is a problem naming its line, like duplicate Status and Also applies lines (S/requirements-tree.mjs:186-187). The plan names Kind only, and a builder copying `Outcome` gets first-wins.

d) Separators
- Use the `Also applies:` grammar: split on comma plus spaces, single IDs only.
- An en-dash range is plausible honest input, because the outline prints ranges. Report it as a problem, not a parse.
- Never parse with `expandRowIds`, which throws (S/requirements-tree.mjs:307, :311) and would crash the checker on a typo.
- An empty `Deliverables:` or `Needs:` value counts as absent. An empty `Binds:` value counts as missing.
- Case-exact lowercase values, trimmed.

e) Row IDs
- Deliverable tokens are row IDs the trace rail accepts (R or G). A FEAT ID is a problem.

f) Subgroups
- A row homed in a subgroup rolls up to its feature, then that feature's capability. Comparing the row's direct parent heading to the capability is wrong.

g) Empty capabilities
- A capability with `Kind:` and no features is legal; any deliverable on it fails as homed elsewhere.
- A constraint capability's "one tested row per bound stage" (amendment 1) is not checked. The skill must say so.

h) Retired targets
- `Needs:` or `Binds:` naming a retired capability is a problem.
- A retired capability may keep `Kind:`. Its own Deliverables, Needs and Binds are problems, mirroring R-294.
- A retired capability may still hold features whose Status is retired.
- A successor must be live and must not be itself.

i) Consumers
- Amendment 2 says a deliverable "names its consumer". The grammar has no consumer slot.
- Pin it as derived: the features that list the row on `Also applies:` (amendment 4). Otherwise the plan quietly drops part of the ruling.

j) Moved-report comparison
- Compare parsed lists as sets for Deliverables, Needs and Binds. A reorder or whitespace-only edit is not a change.
- New and removed capabilities: pin either way.

(6) Wrong-code pairs for the seat (site, then wrong form)

1. `parseLedger` field scan (S/requirements-tree.mjs:87-98): read the new labels on every heading, not only capabilities. A feature prose line `Needs: x` must then raise a problem, and R-2441's negative clause must fail.
2. Kind check: a prefix or case-insensitive test (`/^product/i`). `Kind: Products` passes.
3. Kind duplicate: first-wins (`!heading.kind && ...`). A second `Kind:` line goes unreported.
4. Deliverable home: `row.heading.parent?.id === cap.id`. A feature-homed deliverable is flagged, or a subgroup-homed one under the inverse form.
5. Deliverable checks: drop the retired-row check.
6. Deliverable checks: treat `untested` or `planned` as a problem.
7. Deliverable parse: use `expandRowIds`. A token `R-01` throws instead of giving a problem.
8. Deliverables on a constraint capability: skip the kind check, so they are accepted.
9. Binds: `if (t === "all") continue`, or check existence only and not kind. A constraint or self target is accepted.
10. Binds: validate only when the line is present, so a constraint capability with no `Binds:` passes.
11. Needs cycle: test only the two-cycle (`needs(b).includes(a)`). A three-cycle passes.
12. Needs targets: skip the target kind check.
13. Retire: reuse the feature STATUS regex (S/requirements-tree.mjs:19). `frozen (x)` or any `retired (...)` is accepted. Or skip the successor-exists check, or the holds-a-live-feature check.
14. Lift: leave the new capability lifecycle label in the refusal regex (S/requirements-lift.mjs:228) or in `fieldBlockAt`. The lift test must fail.
15. `renderOutline`: emit `Kind: —` for every capability, or insert lines before Parent. Historical outline byte-identity must fail, or the real-ledger offset tests must fail once a kinded capability exists.
16. `checkOutlineFields`: leave it unchanged while the renderer drops the Needs line. R-2446's independent check must catch the drop.
17. Moved report: keep the early return at S/requirements-moved.mjs:140 ahead of the capability section. A capability-only fixture must fail.
18. Moved report: compare raw field text. A reorder-only fixture must break byte-identity.

Claim I'd most expect to be wrong: the regroup refusing a capability `Status:` line is inferred from code. The lift refusal itself was run (f2). The regroup spawns the same lift with `--mapping`, and the base refusal runs first on that path, but I did not run the regroup end to end.