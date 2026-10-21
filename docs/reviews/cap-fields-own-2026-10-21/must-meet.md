Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary. This lane edits REQUIREMENTS.md's capability spans, regenerates the outline and adds one check. No runtime code changes. Ladder: the seat's wrong-code pairs (on the check), then one final reviewer of a different model lineage from the builder.

Based on main c51bfcd8, where lane cap-kinds landed (it needs that lane's checker). Independent of lane ledger-stages: the product report reads these fields only once that lane lands, and that lane's tests use a fixed historical ledger.

Owner ruling (2026-10-21): existing trees gain the fields in place; no feature or row moves. The placement test found no regroup worth doing.

Threat model: honest variation in scope: a later lane adding a capability without a kind, or a product capability without deliverables, is caught by the check. Deliberate forgery out.

## The fields (from the seat's proposal workflow, with the critic's fixes)

Eight proposers (one per capability) and one adversarial critic read the ledger. The critic confirmed every deliverable row exists, sits under its capability, is not retired, and carries the stated status. The lines go directly after each capability's `Outcome:` line:

| Capability | Lines |
|---|---|
| CAP-01 · Maintain direction and useful context | `Kind: product` · `Deliverables: R-001, R-108, R-873, R-201, R-217, R-749` |
| CAP-02 · Deliver controlled changes | `Kind: product` · `Deliverables: R-1400, R-1008, R-1560, R-977` |
| CAP-03 · Control trust and tool actions | `Kind: constraint` · `Binds: CAP-01, CAP-02, CAP-04, CAP-05, CAP-07` |
| CAP-04 · Bring nana to each project and maintain it | `Kind: product` · `Deliverables: R-301, R-327, R-1150, R-341, R-1070, R-596` |
| CAP-05 · Follow and steer development | `Kind: product` · `Deliverables: R-406, R-422, R-159, R-1194, R-457` |
| CAP-06 · Use attributable tool outputs and focused apps | `Kind: product` · `Deliverables: R-260, R-256, R-257, R-437, R-264` |
| CAP-07 · Keep code and promises checkable | `Kind: product` · `Deliverables: R-291, R-1460, R-1014, R-1272, R-616, R-1239` |
| CAP-08 · Evaluate agent choices with credible evidence | `Kind: product` · `Deliverables: R-509, R-532, R-507, R-535, R-536, R-694` |

The seat checked the set with cap-kinds's checker on a copy of the ledger: 0 problems, 1,725 rows, 39 features.

Seat decisions, reversible:
- CAP-07 is a product tool family, not a constraint. The fit record leaned constraint. The share data says otherwise: CAP-07 shares rows into one capability only (six rows into the adoption feature), and its features ship artifacts others read (the outline, the movement listing, the report page, the impact output, the suite verdict, the mutation record). FEAT-032's README rows and FEAT-033's general engineering rows read like a constraint; a later owner call could carve them out.
- CAP-03 binds CAP-02 although no tested CAP-03 row is shared into CAP-02 yet. The gate does bind builders' and reviewers' commits (R-983, R-2337). The report's stage view shows it as a gap. Closing it means sharing R-983 onto the build and review features, a share change for the owner.
- No `Needs:` lines: no stage in this repo needs an earlier capability's checked artifact in document order (the lane loop's inputs come from CAP-04, which sits later).
- Known gaps the report will show: R-257 and R-264 (CAP-06) are untested; no row names the builder's lane commits (CAP-02).

## Must-meet test

| Row | Requirement (EARS) | Test | Red today |
|---|---|---|---|
| R-2460 | Every capability in this repository's REQUIREMENTS.md that has no `Retired:` line shall carry a `Kind:` line, and each such `Kind: product` capability a `Deliverables:` line. | `packages/nana-pack/tests/requirements-cap-kinds.test.mjs::R-2460: every live capability in this repository's ledger has a kind, and every product capability lists deliverables` | RED: no capability carries a `Kind:` line. |

## Known limits (carried to HANDOFF)

- The fields are the seat's proposal under the owner's in-place ruling. The CAP-07 kind and the CAP-02 bind are reversible seat calls, named above.
