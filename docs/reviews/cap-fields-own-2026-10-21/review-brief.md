# Review — cap-fields-own (this repo's eight capabilities carry kinds, deliverables and binds, added in place, and a check keeps every live capability kinded), 2026-10-21 (the final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary (a ledger edit, its generated outline and one check; no runtime code). Threat model: honest variation
in scope (a later lane adding a capability without a kind, or a product capability without deliverables); deliberate
forgery out.

Review `git diff 9e8091e2..HEAD` on `feat/cap-fields-own` (main is 9e8091e2; the lane branched from c51bfcd8 and merged
main at da4d2375). The plan of record is `docs/reviews/cap-fields-own-2026-10-21/must-meet.md`: the field lines per
capability with the seat's reversible calls, one must-meet check (R-2460) and a known limit. `build-brief-1.md` is
build 1 (a34fb8aa); the seat's record is `seat-verify-da4d2375.md`, with the wrong-code pairs in `seat-mutate.mjs` and
`seat-mutate-output-a34fb8aa.txt` (3 of 3 red). CI run 39562292324 at 6a18aa36 reads 0 failing on all three legs: macOS 198 PASS, 0 FAIL, 2 SKIP of 200 files (8,217 checks pass, 36 skip); Ubuntu 197 PASS, 0 FAIL, 3 SKIP of 200 files (8,156 checks pass, 56 skip); Windows 182 PASS, 0 FAIL, 18 SKIP of 200 files (7,145 checks pass, 115 skip). The install check passes on macOS and Windows. The Windows leg's log is ci-windows-6a18aa36.log in this folder. The land runs the locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at da4d2375, before the seat's notes
commit):

```
tree movement 9e8091e..da4d237: 1 rows in 1 features, 16 capability change(s)
FEAT-028 · Maintain requirement identity and trace links
  R-2460 new (implemented)
capabilities:
  CAP-01 · Maintain direction and useful context: Kind none → product
  CAP-01 · Maintain direction and useful context: Deliverables none → R-001, R-108, R-873, R-201, R-217, R-749
  CAP-02 · Deliver controlled changes: Kind none → product
  CAP-02 · Deliver controlled changes: Deliverables none → R-1400, R-1008, R-1560, R-977
  CAP-03 · Control trust and tool actions: Kind none → constraint
  CAP-03 · Control trust and tool actions: Binds none → CAP-01, CAP-02, CAP-04, CAP-05, CAP-07
  CAP-04 · Bring nana to each project and maintain it: Kind none → product
  CAP-04 · Bring nana to each project and maintain it: Deliverables none → R-301, R-327, R-1150, R-341, R-1070, R-596
  CAP-05 · Follow and steer development: Kind none → product
  CAP-05 · Follow and steer development: Deliverables none → R-406, R-422, R-159, R-1194, R-457
  CAP-06 · Use attributable tool outputs and focused apps: Kind none → product
  CAP-06 · Use attributable tool outputs and focused apps: Deliverables none → R-260, R-256, R-257, R-437, R-264
  CAP-07 · Keep code and promises checkable: Kind none → product
  CAP-07 · Keep code and promises checkable: Deliverables none → R-291, R-1460, R-1014, R-1272, R-616, R-1239
  CAP-08 · Evaluate agent choices with credible evidence: Kind none → product
  CAP-08 · Evaluate agent choices with credible evidence: Deliverables none → R-509, R-532, R-507, R-535, R-536, R-694
```

Judge whether the feature works for the owner reading this repo's tree and report:
- each deliverable row names a tangible artifact its capability produces (a file, page, record, installed
  configuration or output another stage or the owner reads), not a behaviour, and is homed under that capability;
- CAP-03's bound stages are ones the trust and gate rules really govern, and the kinds are defensible (the CAP-07
  product call and the CAP-02 bind without a shared row are declared seat calls, not defects);
- no other ledger line, row, share or heading changed, and every tool that reads this ledger (tree check, lift and
  proof, regroup, movement report, product report, code map) still works on it;
- R-2460's check is red without the lines and green with them, and the HANDOFF lines, the two optional asks, the
  three late notes folded from ledger-stages's review and the session entry are accurate.

Known limits already carried (do not send back for them): the CAP-07 kind and the CAP-02 bind are reversible seat
calls; no capability names a need; no row names the builder's lane commits; only 2 of 43 deliverables show a derived
consumer (an optional ask to the owner).

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
