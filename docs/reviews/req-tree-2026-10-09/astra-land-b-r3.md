## Land review — both increments

**Score: 9/10. No blocking MUST findings.** The lane preserves the original ledger, improves placement, and adds useful owner-controlled governance.

### SHOULD

1. **Refresh the frontier’s reserve count and missing follow-up.**  
   **Locations:** `HANDOFF.md:51`; `docs/reviews/req-tree-2026-10-09/CHANGE-B.md:167–175`.

   The frontier still says 13 IDs remain; this lane leaves five. CHANGE-B also says the watchdog’s missing requirement is carried in HANDOFF, but it is absent.

   **Smallest fix:** Change the count to five and add one carried line for the missing worker-child marker contract. No new requirement is necessary in this increment.

2. **Reconcile one inconsistent sharing decision.**  
   **Locations:** `docs/reviews/req-tree-2026-10-09/placement-review.md:57,152,198`; `REQUIREMENTS.md:268,1368`.

   R-224 shares with the display feature because knowledge imports its renderer. R-644’s analogous resolver share was rejected because the dependency runs backward.

   Changing knowledge’s renderer-binding requirement need not change the display feature’s behavior. The current justification establishes coupling, not clearly the stated directional dependency.

   **Smallest fix:** Supply a concrete display-feature obligation that R-224 constrains, or propose removing that share for the owner's approval. This is one conservative overflag, not a systemic defect.

3. **Expose partial freezes where readers select work.**  
   **Locations:** `REQUIREMENTS.md:122–125`; `docs/requirements-tree.md:195–199`; `docs/hardening-plan-2026-10-06.md:59`.

   FEAT-002 and FEAT-023 read active despite containing frozen work. The change declaration explains this, but routine readers may never open it.

   **Smallest fix:** Add a short ledger note pointing to the controlling partial freeze. Subgroup statuses can remain deferred.

### NOTE — revised placements

**Location:** `docs/reviews/req-tree-2026-10-09/placement-review.md:9–30`.

I would reverse **none of the 17 moves**.

- Doctor checks now sit with diagnostic verdicts.
- Cost accounting and grading isolation move to their actual behavioral owners.
- Test-only port isolation moves away from production provenance and app behavior.
- TypeScript syntax checks move to post-edit feedback.
- Documentation accuracy separates appropriately from delivered working-pattern content.
- R-484’s move and reciprocal sharing preserve the two Esc behaviors.
- R-689 belongs with live-session steering despite its compatibility-test implementation.
- R-699 is reasonably homed with experiment evidence rather than developer notifications.

R-699 remains the least obvious navigation choice. Its purpose is the usage ruling, so the new home is defensible.

I independently checked the placement record:

| Property | Result |
|---|---:|
| Reviewed entries / unique IDs | 1,009 / 1,009 |
| Missing or extra reviewed IDs | 0 |
| Actual moves matching declarations | 17 |
| Sharing links / shared requirements | 113 / 95 |
| Features listing shares | 30 |

The index sample is well calibrated overall. Host/Origin protections, configuration failures, trust, shared paths, and land-helper dependencies justify cross-feature review. The rejected transitive and redundant links show meaningful restraint.

The sharing count measures **additional listing features**, not total affected features including the home. It is a review-routing aid, not a numerical risk score.

### NOTE — governance

**Locations:** `REQUIREMENTS.md:32–61`; `packages/nana-pack/skills/requirements/SKILL.md:132`.

The governance gives the owner substantive decision authority:

- It covers structural changes, row moves, and adding or removing shares.
- Shared-row changes must name and review every listed feature.
- Lifecycle and purpose changes trigger reconsideration of affected shares.
- Frozen features require the named ruling’s exceptions.
- Retired identities remain reserved.

The split rule agrees with the introduction and requirements skill. Requirements-first ordering and the working pattern remain intact.

“What checks it” is honest: structural validation does not establish approval, complete impact analysis, or compliance with a freeze.

My unauthorized-unfreeze attack confirmed that distinction: a grammatical unfreeze passed `checkTree`, while this lane’s immutable-input proof rejected it.

**Smallest fix:** None beyond the reader-facing partial-freeze note above.

### NOTE — D4 interpretation

**Locations:** `docs/hardening-plan-2026-10-06.md:94`; `HANDOFF.md:34,40`; `docs/reviews/req-tree-2026-10-09/CHANGE-B.md:100–107`.

The seven frozen features faithfully encode the core discretionary desk-hardening freeze. The usage measurement and flaky-test exceptions remain available through the named ruling.

FEAT-025 active and FEAT-026 frozen are **reasonable seat inferences, not explicit feature-level decisions already present in D4**. The owner should confirm them together at checkpoint 2, as declared.

An active feature containing desk rows does not override D4. Likewise, moving a desk-related row into an active feature does not authorize discretionary desk hardening.

### NOTE — integrity and consumers

The requested proof passed against the supplied BASE and INPUTS:

- **1,004 original rows preserved once**
- **Eight added rows**
- **125 ledger blocks**
- **1,652 physical lines accounted**
- **64 old headings mapped**

The 1,009 placement-review population includes increment 1’s five new rows; increment B produces 1,012 total rows.

| Check | Result |
|---|---|
| Requirement-tree test | 67 checks passed |
| Trace rail | 1,012 rows; 726 implemented and traced; zero EARS failures |
| `map:check` | 244 modules; zero problems |
| `readme:check` | 639 claims; zero problems |
| Seat verification script | Every printed result matched its expectation |

I ran the unchanged seat script in a disposable clone of the reviewed revision because it temporarily mutates the outline. The immutable review checkout remained clean.

Additional scratch attacks:

1. Retiring FEAT-002 while retaining its subgroup rows produced the required “holds rows” rejection.
2. Replacing a frozen status with `active` passed shape validation but failed the approved-input proof at the changed line.

The seat’s swapped-new-row attack also failed as required, closing Sol’s round-two blocker.

The supplied checkout contains Sol’s build rounds one and two, but **no round-three review record**. I independently verified the round-two correction; I do not claim an unseen review approved it.

I did not rerun the full suite. The seat still owns the locked pre-land run on the accepted tip.

### Accepted residuals and their price

| Residual | Accepted price |
|---|---|
| Approval, declarations, shared-row impact, and freeze compliance remain review-only | A regenerated green outline can contain unauthorized but structurally valid changes. Human comparison remains mandatory. |
| Brief fields and land-time structure comparison are deferred | Reviewers must assemble the change inventory manually until that increment lands. |
| Worker-child marker behavior lacks its own complete requirement coverage | Sharing identifies the dependency but does not prove the launcher supplies the marker. Carry the follow-up explicitly. |
| Partial freezes lack structural representation | Active cannot mean unrestricted. Readers must consult the controlling ruling. |
| Five reserve IDs remain | Decide the ID format before another row-adding increment; do not consume the remainder opportunistically. |
| Earlier Markdown-parser limitations remain | Avoid unsupported HTML/comment, reference-definition, and indented-code constructions until targeted fixtures exist. |
| Placement and sharing remain semantic judgments | This review improves confidence, not completeness. Future purpose and lifecycle changes require renewed judgment. |

The nonblocking SHOULD items do not justify another implementation round. This ruling covers both increments together and does not replace the owner's checkpoint-2 acceptance.

VERDICT: LAND
